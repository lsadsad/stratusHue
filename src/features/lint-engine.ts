/// <reference types="@figma/plugin-typings" />

/**
 * lint-engine.ts
 * Async tree-walker that scans the current page for design lint errors.
 * Sends lint-progress and lint-results messages to the UI.
 * Designed to be lazy-imported from code.ts only when lint mode is active.
 */

import type { LintError } from '../core/lint-types';
import { getLintSettings, getIgnoredIds, loadIgnoredErrors } from '../core/lint-state';
import { loadStyleCache, invalidateStyleCache } from './lint-styles';
import { checkNode } from './lint-checks';

// ── Cancellation ───────────────────────────────────────────────────────────────

let _cancelFlag = false;

export function cancelLintScan(): void {
  _cancelFlag = true;
}

// ── Node count gate ────────────────────────────────────────────────────────────

/** Maximum nodes before we warn — not hard-block. */
const WARN_NODE_THRESHOLD = 3000;
/** Yield to event loop every N nodes to stay responsive. */
const YIELD_EVERY = 50;

// ── Node collection ────────────────────────────────────────────────────────────

/**
 * Collect all scannable leaf and container nodes on the current page.
 * Skips hidden nodes, guide lines, and connector/stamp nodes.
 */
function collectNodes(page: PageNode): SceneNode[] {
  const result: SceneNode[] = [];

  function walk(node: SceneNode): void {
    // Skip invisible nodes
    if ('visible' in node && !node.visible) return;

    // Skip locked nodes (user explicitly excluded them from edits)
    if ('locked' in node && node.locked) return;

    // Skip connector / stamp / etc (rarely have paint styles)
    if (node.type === 'CONNECTOR' || node.type === 'STAMP' ||
        node.type === 'WASHI_TAPE') return;

    result.push(node);

    // Recurse into children
    if ('children' in node) {
      for (const child of node.children) {
        walk(child as SceneNode);
      }
    }
  }

  for (const child of page.children) {
    walk(child as SceneNode);
  }

  return result;
}

// ── Scan orchestrator ──────────────────────────────────────────────────────────

export async function runLintScan(): Promise<void> {
  _cancelFlag = false;
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

  // 2. Collect nodes
  const page = figma.currentPage;
  const nodes = collectNodes(page);
  const total = nodes.length;

  // 3. Warn if large file (non-blocking)
  if (total > WARN_NODE_THRESHOLD) {
    figma.notify(`Scanning ${total} nodes — this may take a moment`, { timeout: 2000 });
  }

  // Send initial progress
  figma.ui.postMessage({ type: 'lint-progress', scanned: 0, total, phase: 'scanning' });

  // 4. Walk and check
  const allErrors: LintError[] = [];

  for (let i = 0; i < nodes.length; i++) {
    if (_cancelFlag) {
      figma.skipInvisibleInstanceChildren = false;
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

  if (_cancelFlag) {
    figma.skipInvisibleInstanceChildren = false;
    figma.ui.postMessage({ type: 'lint-cancelled' });
    return;
  }

  // 5. Filter out ignored errors
  const visibleErrors = allErrors.filter(e => !ignoredIds.has(e.id));
  const scanMs = Date.now() - startMs;

  // 6. Send results
  figma.ui.postMessage({
    type: 'lint-results',
    errors: visibleErrors,
    ignoredIds: Array.from(ignoredIds),
    nodeCount: total,
    scanMs,
  });

  // 7. Invalidate style cache so a re-scan picks up newly added styles
  invalidateStyleCache();

  // 8. Restore default (don't leave this set globally — other Figma operations may need it)
  figma.skipInvisibleInstanceChildren = false;
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
  await runLintScan();
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
