/// <reference types="@figma/plugin-typings" />

/**
 * lint-engine.ts
 * Async tree-walker that scans the current page for design lint errors.
 * Sends lint-progress and lint-results messages to the UI.
 * Designed to be lazy-imported from code.ts only when lint mode is active.
 */

import type { LintError, LintScope } from '../core/lint-types';
import { getLintSettings, getIgnoredIds, loadIgnoredErrors } from '../core/lint-state';
import { loadStyleCache, invalidateStyleCache } from './lint-styles';
import { checkNode } from './lint-checks';

// ── Cancellation ───────────────────────────────────────────────────────────────
//
// Generation counter rather than a simple boolean flag.
// Each runLintScan() call claims the next generation. cancelLintScan() bumps
// the counter, which invalidates any in-flight scan on its next yield point.
// This prevents two concurrent scans from interfering with each other — the
// old scan detects it's been superseded and exits cleanly.

let _generation = 0;
let _scanInProgress = false;

/**
 * Snapshot of the canvas selection captured at the start of the last
 * user-initiated scan. Auto re-scans (document-change debounce) reuse this
 * so that clicking a lint-error item — which calls lint-select-node and
 * therefore changes figma.currentPage.selection to a single child node —
 * does not silently narrow the effective scan scope on the next re-scan.
 *
 * Reset to null on every user-initiated scan so scope always tracks the
 * frame(s) the designer actually selected before clicking Scan / changing scope.
 */
let _scannedSelectionNodes: SceneNode[] | null = null;

export function cancelLintScan(): void {
  _generation++;
}

export function isScanInProgress(): boolean {
  return _scanInProgress;
}

// ── Node count gate ────────────────────────────────────────────────────────────

/** Maximum nodes before we warn — not hard-block. */
const WARN_NODE_THRESHOLD = 3000;
/** Yield to event loop every N nodes to stay responsive. */
const YIELD_EVERY = 50;

// ── Node collection ────────────────────────────────────────────────────────────

/**
 * Collect all scannable nodes for the given scope.
 *
 * Scope modes:
 *   selection — walk only the currently selected nodes (and their children).
 *               Returns [] immediately if nothing is selected.
 *   tagged    — walk only top-level page frames whose name contains scopeEmoji.
 *               Returns [] if no matching frames exist.
 *   page      — original behaviour: walk the entire current page.
 *
 * In all modes, hidden nodes, locked nodes, connector/stamp/washi-tape nodes,
 * and nodes matching a skipPatterns entry (plus their subtrees) are excluded.
 */
function collectNodes(
  page: PageNode,
  skipPatterns: string[],
  scope: LintScope,
  scopeEmoji: string,
  selectionOverride?: readonly SceneNode[],
): SceneNode[] {
  const result: SceneNode[] = [];

  // Lowercase patterns once for efficient repeated comparisons
  const lowerPatterns = skipPatterns.map(p => p.toLowerCase().trim()).filter(Boolean);

  function shouldSkip(name: string): boolean {
    if (lowerPatterns.length === 0) return false;
    const lower = name.toLowerCase();
    return lowerPatterns.some(p => lower.includes(p));
  }

  function walk(node: SceneNode): void {
    if ('visible' in node && !node.visible) return;
    if ('locked' in node && node.locked) return;
    if (node.type === 'CONNECTOR' || node.type === 'STAMP' ||
        node.type === 'WASHI_TAPE') return;
    if (shouldSkip(node.name)) return;

    result.push(node);

    if ('children' in node) {
      for (const child of node.children) {
        walk(child as SceneNode);
      }
    }
  }

  if (scope === 'selection') {
    // Use the pinned snapshot when provided (auto re-scan after lint navigation)
    // so clicking an error item doesn't narrow the scope to a single child node.
    const selNodes = selectionOverride ?? figma.currentPage.selection;
    for (const node of selNodes) {
      walk(node as SceneNode);
    }
  } else if (scope === 'tagged') {
    // Opt-in: scan only top-level frames tagged with the scope emoji
    for (const child of page.children) {
      if ((child as SceneNode).name.includes(scopeEmoji)) {
        walk(child as SceneNode);
      }
    }
  } else {
    // page scope — original behaviour
    for (const child of page.children) {
      walk(child as SceneNode);
    }
  }

  return result;
}

// ── Scan orchestrator ──────────────────────────────────────────────────────────

/**
 * @param origin
 *   'user'  — a designer-initiated scan (Scan button, scope change, settings
 *             update, mode entry). Takes a fresh snapshot of the canvas
 *             selection so that the scope tracks what the designer chose.
 *   'auto'  — a background re-scan (2 s document-change debounce, or post
 *             fix-all). Reuses the last snapshot so that navigating to a lint
 *             error item — which briefly changes selection to a child node —
 *             does not narrow the effective scope on the next re-scan.
 */
export async function runLintScan(origin: 'user' | 'auto' = 'user'): Promise<void> {
  const myGen = ++_generation; // claim this scan's generation
  _scanInProgress = true;
  const startMs = Date.now();

  // Prune invisible instance children from the walk (significant perf win on component-heavy files)
  figma.skipInvisibleInstanceChildren = true;

  // 1. Load dependencies
  await Promise.all([
    loadStyleCache(),
    loadIgnoredErrors(),
  ]);

  const settings = getLintSettings();
  const ignoredIds = new Set(getIgnoredIds());

  // 2. Snapshot or reuse selection for "selection" scope.
  //    User-initiated scans always refresh the snapshot. Auto re-scans preserve
  //    the last snapshot so lint-select-node navigation doesn't silently change
  //    which frame is being audited.
  let selectionOverride: readonly SceneNode[] | undefined;
  if ((settings.lintScope ?? 'selection') === 'selection') {
    if (origin === 'user') {
      _scannedSelectionNodes = [...figma.currentPage.selection] as SceneNode[];
    }
    selectionOverride = _scannedSelectionNodes ?? undefined;
  }

  // 3. Collect nodes
  const page = figma.currentPage;
  const nodes = collectNodes(
    page,
    settings.skipLayerNames ?? [],
    settings.lintScope ?? 'selection',
    settings.lintScopeEmoji ?? '✅',
    selectionOverride,
  );
  const total = nodes.length;

  // 4. Warn if large file (non-blocking)
  if (total > WARN_NODE_THRESHOLD) {
    figma.notify(`Scanning ${total} nodes — this may take a moment`, { timeout: 2000 });
  }

  // Send initial progress
  figma.ui.postMessage({ type: 'lint-progress', scanned: 0, total, phase: 'scanning' });

  // 5. Walk and check
  const allErrors: LintError[] = [];

  for (let i = 0; i < nodes.length; i++) {
    if (myGen !== _generation) {
      figma.skipInvisibleInstanceChildren = false;
      _scanInProgress = false;
      figma.ui.postMessage({ type: 'lint-cancelled' });
      return;
    }

    const node = nodes[i];
    const nodeErrors = checkNode(node, settings);
    allErrors.push(...nodeErrors);

    // Yield to event loop periodically
    if (i % YIELD_EVERY === 0) {
      figma.ui.postMessage({ type: 'lint-progress', scanned: i + 1, total, phase: 'scanning' });
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  }

  if (myGen !== _generation) {
    figma.skipInvisibleInstanceChildren = false;
    _scanInProgress = false;
    figma.ui.postMessage({ type: 'lint-cancelled' });
    return;
  }

  // 6. Filter out ignored errors
  const visibleErrors = allErrors.filter(e => !ignoredIds.has(e.id));
  const scanMs = Date.now() - startMs;

  // 7. Send results
  figma.ui.postMessage({
    type: 'lint-results',
    errors: visibleErrors,
    ignoredIds: Array.from(ignoredIds),
    nodeCount: total,
    scanMs,
  });

  // 8. Invalidate style cache so a re-scan picks up newly added styles
  invalidateStyleCache();

  // 9. Restore default (don't leave this set globally — other Figma operations may need it)
  figma.skipInvisibleInstanceChildren = false;
  _scanInProgress = false;
}

// ── Fix All ───────────────────────────────────────────────────────────────────

/**
 * Apply a batch of style fixes in one pass, then trigger a single re-scan.
 * Far more efficient than calling applyLintFix() + runLintScan() per error.
 */
export async function runLintFixAll(
  fixes: Array<{ nodeId: string; category: string; styleId: string }>,
): Promise<void> {
  let applied = 0;
  for (const fix of fixes) {
    const result = await applyLintFix(fix.nodeId, fix.category, fix.styleId);
    if (result.success) applied++;
  }
  figma.notify(
    applied === fixes.length
      ? `Applied ${applied} style${applied === 1 ? '' : 's'}`
      : `Applied ${applied} of ${fixes.length} styles`,
  );
  // Use 'auto' to preserve the pinned selection snapshot — fix-all should
  // verify the same original scope, not the current (possibly navigated) selection.
  await runLintScan('auto');
}

// ── Fix action ────────────────────────────────────────────────────────────────

/**
 * Apply the suggested style to a node property.
 * Called from code.ts when the UI sends 'lint-apply-fix'.
 */
export async function applyLintFix(
  nodeId: string,
  category: string,
  styleId: string,
): Promise<{ success: boolean; message: string }> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type === 'DOCUMENT' || node.type === 'PAGE') {
    return { success: false, message: 'Node not found' };
  }

  const scene = node as SceneNode;

  try {
    switch (category) {
      case 'fill':
        if ('setFillStyleIdAsync' in scene) {
          await (scene as SceneNode & { setFillStyleIdAsync: (id: string) => Promise<void> }).setFillStyleIdAsync(styleId);
          return { success: true, message: `Fill style applied` };
        }
        break;
      case 'stroke':
        if ('setStrokeStyleIdAsync' in scene) {
          await (scene as SceneNode & { setStrokeStyleIdAsync: (id: string) => Promise<void> }).setStrokeStyleIdAsync(styleId);
          return { success: true, message: `Stroke style applied` };
        }
        break;
      case 'text':
        if (scene.type === 'TEXT') {
          await scene.setTextStyleIdAsync(styleId);
          return { success: true, message: `Text style applied` };
        }
        break;
      case 'effects':
        if ('setEffectStyleIdAsync' in scene) {
          await (scene as SceneNode & { setEffectStyleIdAsync: (id: string) => Promise<void> }).setEffectStyleIdAsync(styleId);
          return { success: true, message: `Effect style applied` };
        }
        break;
      default:
        return { success: false, message: `Cannot auto-fix ${category}` };
    }
    return { success: false, message: `Node doesn't support ${category} styles` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}
