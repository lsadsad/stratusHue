/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Module-scope variable — set in beforeAll after code.ts import
let onmessage: ((msg: unknown) => Promise<void>) | null = null;

// ===== SETUP =====
beforeAll(async () => {
  // Add missing stubs that code.ts top-level side effects require
  (globalThis as any).figma.showUI = vi.fn();
  (globalThis as any).figma.on = vi.fn();
  (globalThis as any).figma.loadAllPagesAsync = vi.fn().mockResolvedValue(undefined);
  (globalThis as any).figma.openExternal = vi.fn();
  (globalThis as any).figma.currentPage.findAll = vi.fn().mockReturnValue([]);
  (globalThis as any).figma.currentPage.loadAsync = vi.fn().mockResolvedValue(undefined);

  // figma.root needs getPluginData / setPluginData for bookmarks (used in state.ts)
  if (!(globalThis as any).figma.root.getPluginData) {
    (globalThis as any).figma.root.getPluginData = vi.fn().mockReturnValue('');
    (globalThis as any).figma.root.setPluginData = vi.fn();
  }

  // figma.root shared plugin data — used by export/import-plugin-data (migration.ts)
  (globalThis as any).figma.root.setSharedPluginData = vi.fn();
  (globalThis as any).figma.root.getSharedPluginData = vi.fn().mockReturnValue('');

  // figma.ui.resize — used by resize-ui and toggle-width handlers
  (globalThis as any).figma.ui.resize = vi.fn();

  // figma.getLocal*StylesAsync — used by lint-engine when running scans
  (globalThis as any).figma.getLocalPaintStylesAsync = vi.fn().mockResolvedValue([]);
  (globalThis as any).figma.getLocalTextStylesAsync = vi.fn().mockResolvedValue([]);
  (globalThis as any).figma.getLocalEffectStylesAsync = vi.fn().mockResolvedValue([]);

  // figma.createPage — used by create-new-page handler
  (globalThis as any).figma.createPage = vi.fn().mockReturnValue({ id: 'new-page', name: 'Page', type: 'PAGE' });

  // __html__ is referenced at the top level of code.ts (figma.showUI(__html__, ...))
  (globalThis as any).__html__ = '';

  // Import code.ts — this triggers all top-level side effects including setting figma.ui.onmessage
  await import('../code');

  // Capture the handler that code.ts registered
  onmessage = (globalThis as any).figma.ui.onmessage as ((msg: unknown) => Promise<void>);
});

// ===== CRASH-DETECTION HELPER =====
/**
 * Calls the onmessage handler with the given message, then asserts:
 *  1. console.error was not called (excluding benign "dynamic import" messages)
 *  2. figma.notify was not called with an error-class string
 */
async function dispatchAndAssertNoCrash(msg: Record<string, unknown>): Promise<void> {
  expect(onmessage).toBeTypeOf('function');

  await (onmessage as (m: unknown) => Promise<void>)(msg);

  // Collect any console.error calls, filtering benign dynamic-import noise
  const errorCalls: unknown[][] = (console.error as ReturnType<typeof vi.fn>).mock.calls.filter(
    (args: unknown[]) => {
      const text = args.map(a => String(a)).join(' ').toLowerCase();
      return !text.includes('dynamic import');
    }
  );

  expect(errorCalls, `console.error was called unexpectedly: ${JSON.stringify(errorCalls)}`).toHaveLength(0);

  // Collect figma.notify calls that look like errors
  const notifyCalls: unknown[][] = ((globalThis as any).figma.notify as ReturnType<typeof vi.fn>).mock.calls;
  const errorNotifies = notifyCalls.filter((args: unknown[]) => {
    const text = args.map(a => String(a)).join(' ').toLowerCase();
    return text.includes('error') || text.includes('failed');
  });

  expect(errorNotifies, `figma.notify was called with an error-class message: ${JSON.stringify(errorNotifies)}`).toHaveLength(0);
}

// ===== TESTS =====
describe('sandbox message dispatch', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('onmessage handler was registered', () => {
    expect(typeof onmessage).toBe('function');
  });

  // ===== UI STATE =====
  it('handles "ui-ready"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'ui-ready' });
  });

  it('handles "get-ui-section-states"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'get-ui-section-states' });
  });

  it('handles "save-ui-section-state"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'save-ui-section-state', sectionId: 'test', expanded: true });
  });

  it('handles "resize-ui"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'resize-ui', height: 400 });
  });

  it('handles "toggle-width"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'toggle-width' });
  });

  it('handles "notify"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'notify', message: 'test' });
  });

  // ===== EMOJI =====
  it('handles "add-emoji"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'add-emoji', emoji: '🔴' });
  });

  it('handles "clear-emoji"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'clear-emoji' });
  });

  it('handles "add-emoji-recursive"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'add-emoji-recursive', emoji: '🔴' });
  });

  it('handles "clear-emoji-recursive"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'clear-emoji-recursive' });
  });

  it('handles "navigate-emoji-set"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'navigate-emoji-set', direction: 'next' });
  });

  // ===== BOOKMARKS =====
  it('handles "save-bookmark"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'save-bookmark' });
  });

  it('handles "refresh-anchors"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'refresh-anchors' });
  });

  it('handles "jump-to-bookmark"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'jump-to-bookmark', id: 'test-id' });
  });

  it('handles "remove-bookmark"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'remove-bookmark', id: 'test-id' });
  });

  it('handles "reorder-bookmarks"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'reorder-bookmarks', order: [] });
  });

  // ===== DATA =====
  it('handles "export-plugin-data"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'export-plugin-data' });
  });

  it('handles "import-plugin-data"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'import-plugin-data' });
  });

  // ===== SELECTION / NAVIGATION =====
  it('handles "deselect"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'deselect' });
  });

  it('handles "go-back"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'go-back' });
  });

  it('handles "go-forward"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'go-forward' });
  });

  it('handles "navigation-action"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'navigation-action', action: 'enter' });
  });

  // ===== NODE OPERATIONS =====
  it('handles "nudge-elements"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'nudge-elements', direction: 'up', amount: 1 });
  });

  it('handles "resize-elements"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'resize-elements', direction: 'up', amount: 1 });
  });

  it('handles "duplicate-elements"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'duplicate-elements', direction: 'right', amount: 1 });
  });

  it('handles "reorder-layer"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'reorder-layer', direction: 'up' });
  });

  it('handles "zoom"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'zoom', direction: 'selection' });
  });

  it('handles "delete-nodes"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'delete-nodes' });
  });

  it('handles "toggle-visibility"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'toggle-visibility' });
  });

  it('handles "toggle-lock"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'toggle-lock' });
  });

  it('handles "toggle-mode"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'toggle-mode', mode: 'onLayer' });
  });

  // ===== THEME =====
  it('handles "get-theme-preference"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'get-theme-preference' });
  });

  it('handles "set-theme-preference"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'set-theme-preference', theme: 'dark' });
  });

  it('handles "clear-theme-storage"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'clear-theme-storage' });
  });

  // ===== PAGE OPERATIONS =====
  it('handles "add-date"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'add-date' });
  });

  it('handles "create-new-page"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'create-new-page' });
  });

  it('handles "indent-title"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'indent-title' });
  });

  it('handles "outdent-title"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'outdent-title' });
  });

  // ===== CONTROLS =====
  it('handles "toggle-controls"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'toggle-controls', enabled: true });
  });

  it('handles "get-controls-setting"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'get-controls-setting' });
  });

  it('handles "set-controls-group-visibility"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'set-controls-group-visibility', groups: { test: true } });
  });

  it('handles "get-controls-group-settings"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'get-controls-group-settings' });
  });

  it('handles "set-nudge-settings"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'set-nudge-settings', smallNudge: 1, bigNudge: 10 });
  });

  it('handles "get-nudge-settings"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'get-nudge-settings' });
  });

  // ===== LAYOUT =====
  it('handles "cycle-layout-sizing"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'cycle-layout-sizing', axis: 'horizontal' });
  });

  // ===== STYLED TEXT =====
  it('handles "paste-styled-text"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'paste-styled-text', segments: [] });
  });

  it('handles "copy-styled-text"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'copy-styled-text' });
  });

  // ===== MODE =====
  it('handles "set-plugin-mode"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'set-plugin-mode', mode: 'navigate' });
  });

  // ===== EXTERNAL =====
  it('handles "open-kofi"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'open-kofi' });
  });

  // ===== LINT =====
  it('handles "lint-run-scan"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-run-scan' });
  });

  it('handles "lint-cancel-scan"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-cancel-scan' });
  });

  it('handles "lint-set-scope"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-set-scope', scope: 'page' });
  });

  it('handles "lint-apply-fix"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-apply-fix', nodeId: 'test', category: 'fill', styleId: 'test' });
  });

  it('handles "lint-fix-all"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-fix-all', fixes: [] });
  });

  it('handles "lint-ignore-error"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-ignore-error', errorId: 'test' });
  });

  it('handles "lint-ignore-all"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-ignore-all', errorIds: [] });
  });

  it('handles "lint-select-all"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-select-all', nodeIds: [] });
  });

  it('handles "lint-clear-ignored"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-clear-ignored' });
  });

  it('handles "lint-select-node"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-select-node', nodeId: 'test-id' });
  });

  it('handles "lint-update-settings"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-update-settings', settings: {} });
  });

  it('handles "lint-get-settings"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'lint-get-settings' });
  });

  // ===== BRIDGE =====
  it('handles "bridge-set-enabled"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-set-enabled', enabled: false });
  });

  it('handles "bridge-set-pair-code"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-set-pair-code', pairCode: '' });
  });

  it('handles "bridge-connected"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-connected', transport: 'local', port: 9223 });
  });

  it('handles "bridge-disconnected"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-disconnected', transport: 'local' });
  });

  it('handles "bridge-cmd-execute-code"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-execute-code', requestId: 'test_1', code: 'return {}' });
  });

  it('handles "bridge-cmd-get-variables"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-get-variables', requestId: 'test_2' });
  });

  it('handles "bridge-cmd-refresh-variables"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-refresh-variables', requestId: 'test_3' });
  });

  it('handles "bridge-cmd-update-variable"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-update-variable', requestId: 'test_4', variableId: 'v1', modeId: 'm1', value: '#ff0000' });
  });

  it('handles "bridge-cmd-create-variable"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-create-variable', requestId: 'test_5', name: 'test', collectionId: 'c1', resolvedType: 'COLOR' });
  });

  it('handles "bridge-cmd-delete-variable"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-delete-variable', requestId: 'test_6', variableId: 'v1' });
  });

  it('handles "bridge-cmd-rename-variable"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-rename-variable', requestId: 'test_7', variableId: 'v1', newName: 'new-name' });
  });

  it('handles "bridge-cmd-create-variable-collection"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-create-variable-collection', requestId: 'test_8', name: 'Test Collection' });
  });

  it('handles "bridge-cmd-delete-variable-collection"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-delete-variable-collection', requestId: 'test_9', collectionId: 'c1' });
  });

  it('handles "bridge-cmd-add-mode"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-add-mode', requestId: 'test_10', collectionId: 'c1', modeName: 'Dark' });
  });

  it('handles "bridge-cmd-rename-mode"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-rename-mode', requestId: 'test_11', collectionId: 'c1', modeId: 'm1', newName: 'Light' });
  });

  it('handles "bridge-cmd-get-component"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-get-component', requestId: 'test_12', nodeId: 'node_1' });
  });

  it('handles "bridge-cmd-get-local-components"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-get-local-components', requestId: 'test_13' });
  });

  it('handles "bridge-cmd-instantiate-component"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-instantiate-component', requestId: 'test_14', componentKey: 'abc123' });
  });

  it('handles "bridge-cmd-get-metadata"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-get-metadata', requestId: 'test_15', nodeId: 'node_1' });
  });

  it('handles "bridge-cmd-resize-node"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-resize-node', requestId: 'test_16', nodeId: 'node_1', width: 100, height: 100 });
  });

  it('handles "bridge-cmd-move-node"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-move-node', requestId: 'test_17', nodeId: 'node_1', x: 0, y: 0 });
  });

  it('handles "bridge-cmd-set-node-fills"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-set-node-fills', requestId: 'test_18', nodeId: 'node_1', fills: [{ type: 'SOLID', color: '#ff0000' }] });
  });

  it('handles "bridge-cmd-set-node-strokes"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-set-node-strokes', requestId: 'test_19', nodeId: 'node_1', strokes: [{ type: 'SOLID', color: '#000000' }] });
  });

  it('handles "bridge-cmd-clone-node"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-clone-node', requestId: 'test_20', nodeId: 'node_1' });
  });

  it('handles "bridge-cmd-delete-node"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-delete-node', requestId: 'test_21', nodeId: 'node_1' });
  });

  it('handles "bridge-cmd-rename-node"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-rename-node', requestId: 'test_22', nodeId: 'node_1', newName: 'Renamed Node' });
  });

  it('handles "bridge-cmd-set-text"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-set-text', requestId: 'test_23', nodeId: 'node_1', text: 'Hello' });
  });

  it('handles "bridge-cmd-create-child"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-create-child', requestId: 'test_24', parentId: 'node_1', nodeType: 'RECTANGLE' });
  });

  it('handles "bridge-cmd-set-node-description"', { timeout: 2000 }, async () => {
    await dispatchAndAssertNoCrash({ type: 'bridge-cmd-set-node-description', requestId: 'test_25', nodeId: 'node_1', description: 'A component' });
  });
});
