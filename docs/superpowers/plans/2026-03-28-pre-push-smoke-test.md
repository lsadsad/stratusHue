# Pre-Push Regression Smoke Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a smoke test that fires all 61 sandbox message types through the real `onmessage` handler, catching regressions before major pushes.

**Architecture:** Single test file imports `code.ts` after stubbing missing figma globals. Each message type gets one test case with a minimal valid payload (verified against actual validation guards in `code.ts`). Silent crashes (swallowed by `withErrorBoundary`) are detected by spying on `console.error` and checking `figma.notify` for error messages.

**Tech Stack:** Vitest, existing `setup.ts` figma mock

**Spec:** `docs/superpowers/specs/2026-03-28-pre-push-smoke-test-design.md`

---

### Task 1: Extend figma mock for code.ts import

`code.ts` has top-level side effects that crash without additional stubs. Add them in the smoke test file's `beforeAll`, not in the shared `setup.ts`.

**Files:**
- Create: `src/test/smoke-dispatch.test.ts`

- [ ] **Step 1: Create smoke test file with mock extensions**

```typescript
/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Extend the global figma mock with stubs needed to import code.ts
beforeAll(() => {
  const figmaMock = (globalThis as any).figma;

  // Top-level side effects in code.ts need these:
  figmaMock.showUI = vi.fn();
  figmaMock.on = vi.fn();
  figmaMock.loadAllPagesAsync = vi.fn().mockResolvedValue(undefined);
  figmaMock.openExternal = vi.fn();
  figmaMock.currentPage.findAll = vi.fn().mockReturnValue([]);
  figmaMock.currentPage.loadAsync = vi.fn().mockResolvedValue(undefined);

  // __html__ is injected by Figma runtime, not available in tests
  (globalThis as any).__html__ = '';
});

describe('sandbox message dispatch', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest --run src/test/smoke-dispatch.test.ts`
Expected: PASS — 1 test, placeholder confirms mock setup doesn't crash.

- [ ] **Step 3: Commit**

```bash
git add src/test/smoke-dispatch.test.ts
git commit -m "test: scaffold smoke-dispatch test with extended figma mock"
```

---

### Task 2: Import code.ts and capture the onmessage handler

The onmessage handler is assigned as a top-level side effect in `code.ts` line 202: `figma.ui.onmessage = async (msg) => { ... }`. After importing `code.ts`, we can read `figma.ui.onmessage` to get the handler function.

**Files:**
- Modify: `src/test/smoke-dispatch.test.ts`

- [ ] **Step 1: Write import test**

Replace the placeholder `describe` block with:

```typescript
let onmessage: (msg: any) => Promise<void>;

beforeAll(async () => {
  const figmaMock = (globalThis as any).figma;
  figmaMock.showUI = vi.fn();
  figmaMock.on = vi.fn();
  figmaMock.loadAllPagesAsync = vi.fn().mockResolvedValue(undefined);
  figmaMock.openExternal = vi.fn();
  figmaMock.currentPage.findAll = vi.fn().mockReturnValue([]);
  figmaMock.currentPage.loadAsync = vi.fn().mockResolvedValue(undefined);
  (globalThis as any).__html__ = '';

  // Import code.ts — triggers top-level side effects, assigns figma.ui.onmessage
  await import('../code');
  onmessage = figmaMock.ui.onmessage;
});

describe('sandbox message dispatch', () => {
  it('onmessage handler was registered', () => {
    expect(typeof onmessage).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify code.ts imports cleanly**

Run: `npx vitest --run src/test/smoke-dispatch.test.ts`
Expected: PASS. If it fails, read the error — a missing mock stub needs to be added to `beforeAll`. Fix and re-run until import succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/test/smoke-dispatch.test.ts
git commit -m "test: verify code.ts imports and registers onmessage handler"
```

---

### Task 3: Add silent crash detection scaffolding

`withErrorBoundary` swallows exceptions. We spy on `console.error` and check `figma.notify` for error messages after each dispatch.

**Files:**
- Modify: `src/test/smoke-dispatch.test.ts`

- [ ] **Step 1: Add error detection spies**

Add inside the `describe` block, before any `it()` calls:

```typescript
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});
```

- [ ] **Step 2: Write a helper to dispatch and assert no silent crash**

Add above the `describe` block:

```typescript
async function dispatchAndAssertNoCrash(
  handler: (msg: any) => Promise<void>,
  msg: Record<string, any>,
  errorSpy: ReturnType<typeof vi.spyOn>
) {
  await handler(msg);

  // Check console.error wasn't called (withErrorBoundary logs here)
  const errorCalls = errorSpy.mock.calls.filter(call => {
    const arg = String(call[0] ?? '');
    // Filter out expected/benign errors (e.g., dynamic import warnings in test env)
    return !arg.includes('dynamic import');
  });
  expect(errorCalls).toHaveLength(0);

  // Check figma.notify wasn't called with error-class messages
  const notifyCalls = (globalThis as any).figma.notify.mock.calls;
  const errorNotifications = notifyCalls.filter((call: any[]) => {
    const msg = String(call[0] ?? '').toLowerCase();
    return msg.includes('error') || msg.includes('failed');
  });
  expect(errorNotifications).toHaveLength(0);
}
```

- [ ] **Step 3: Write one message test using the helper to verify it works**

```typescript
it('handles "get-theme-preference" without crashing', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'get-theme-preference' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 4: Run test**

Run: `npx vitest --run src/test/smoke-dispatch.test.ts`
Expected: PASS — handler registered + one message dispatched successfully.

- [ ] **Step 5: Commit**

```bash
git add src/test/smoke-dispatch.test.ts
git commit -m "test: add silent crash detection helper for smoke tests"
```

---

### Task 4: Add all message type smoke tests

Add one `it()` per message type with its specific minimal payload. Organized by category for readability. Every test uses the `dispatchAndAssertNoCrash` helper with a 2-second timeout.

**Files:**
- Modify: `src/test/smoke-dispatch.test.ts`

- [ ] **Step 1: Add UI state message tests**

```typescript
// ===== UI STATE =====
it('handles "ui-ready"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'ui-ready' }, consoleErrorSpy);
}, 2000);

it('handles "get-ui-section-states"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'get-ui-section-states' }, consoleErrorSpy);
}, 2000);

it('handles "save-ui-section-state"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'save-ui-section-state', sectionId: 'test', expanded: true }, consoleErrorSpy);
}, 2000);

it('handles "resize-ui"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'resize-ui', height: 400 }, consoleErrorSpy);
}, 2000);

it('handles "toggle-width"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'toggle-width' }, consoleErrorSpy);
}, 2000);

it('handles "notify"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'notify', message: 'test' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 2: Add emoji message tests**

```typescript
// ===== EMOJI =====
it('handles "add-emoji"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'add-emoji', emoji: '🔴' }, consoleErrorSpy);
}, 2000);

it('handles "clear-emoji"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'clear-emoji' }, consoleErrorSpy);
}, 2000);

it('handles "add-emoji-recursive"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'add-emoji-recursive', emoji: '🔴' }, consoleErrorSpy);
}, 2000);

it('handles "clear-emoji-recursive"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'clear-emoji-recursive' }, consoleErrorSpy);
}, 2000);

it('handles "navigate-emoji-set"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'navigate-emoji-set', direction: 'next' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 3: Add bookmark message tests**

```typescript
// ===== BOOKMARKS =====
it('handles "save-bookmark"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'save-bookmark' }, consoleErrorSpy);
}, 2000);

it('handles "refresh-anchors"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'refresh-anchors' }, consoleErrorSpy);
}, 2000);

it('handles "jump-to-bookmark"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'jump-to-bookmark', id: 'test-id' }, consoleErrorSpy);
}, 2000);

it('handles "remove-bookmark"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'remove-bookmark', id: 'test-id' }, consoleErrorSpy);
}, 2000);

it('handles "reorder-bookmarks"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'reorder-bookmarks', order: [] }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 4: Add data, selection, and navigation message tests**

```typescript
// ===== DATA =====
it('handles "export-plugin-data"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'export-plugin-data' }, consoleErrorSpy);
}, 2000);

it('handles "import-plugin-data"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'import-plugin-data' }, consoleErrorSpy);
}, 2000);

// ===== SELECTION / NAVIGATION =====
it('handles "deselect"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'deselect' }, consoleErrorSpy);
}, 2000);

it('handles "go-back"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'go-back' }, consoleErrorSpy);
}, 2000);

it('handles "go-forward"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'go-forward' }, consoleErrorSpy);
}, 2000);

it('handles "navigation-action"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'navigation-action', action: 'enter' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 5: Add node operation message tests**

```typescript
// ===== NODE OPERATIONS =====
it('handles "nudge-elements"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'nudge-elements', direction: 'up', amount: 1 }, consoleErrorSpy);
}, 2000);

it('handles "resize-elements"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'resize-elements', direction: 'up', amount: 1 }, consoleErrorSpy);
}, 2000);

it('handles "duplicate-elements"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'duplicate-elements', direction: 'right', amount: 1 }, consoleErrorSpy);
}, 2000);

it('handles "reorder-layer"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'reorder-layer', direction: 'up' }, consoleErrorSpy);
}, 2000);

it('handles "zoom"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'zoom', direction: 'selection' }, consoleErrorSpy);
}, 2000);

it('handles "delete-nodes"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'delete-nodes' }, consoleErrorSpy);
}, 2000);

it('handles "toggle-visibility"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'toggle-visibility' }, consoleErrorSpy);
}, 2000);

it('handles "toggle-lock"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'toggle-lock' }, consoleErrorSpy);
}, 2000);

it('handles "toggle-mode"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'toggle-mode', mode: 'onLayer' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 6: Add theme, page ops, controls, layout, styled text, mode, and external tests**

```typescript
// ===== THEME =====
it('handles "get-theme-preference"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'get-theme-preference' }, consoleErrorSpy);
}, 2000);

it('handles "set-theme-preference"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'set-theme-preference', theme: 'dark' }, consoleErrorSpy);
}, 2000);

it('handles "clear-theme-storage"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'clear-theme-storage' }, consoleErrorSpy);
}, 2000);

// ===== PAGE OPERATIONS =====
it('handles "add-date"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'add-date' }, consoleErrorSpy);
}, 2000);

it('handles "create-new-page"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'create-new-page' }, consoleErrorSpy);
}, 2000);

it('handles "indent-title"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'indent-title' }, consoleErrorSpy);
}, 2000);

it('handles "outdent-title"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'outdent-title' }, consoleErrorSpy);
}, 2000);

// ===== CONTROLS =====
it('handles "toggle-controls"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'toggle-controls', enabled: true }, consoleErrorSpy);
}, 2000);

it('handles "get-controls-setting"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'get-controls-setting' }, consoleErrorSpy);
}, 2000);

it('handles "set-controls-group-visibility"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'set-controls-group-visibility', groups: { test: true } }, consoleErrorSpy);
}, 2000);

it('handles "get-controls-group-settings"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'get-controls-group-settings' }, consoleErrorSpy);
}, 2000);

it('handles "set-nudge-settings"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'set-nudge-settings', smallNudge: 1, bigNudge: 10 }, consoleErrorSpy);
}, 2000);

it('handles "get-nudge-settings"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'get-nudge-settings' }, consoleErrorSpy);
}, 2000);

// ===== LAYOUT =====
it('handles "cycle-layout-sizing"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'cycle-layout-sizing', axis: 'horizontal' }, consoleErrorSpy);
}, 2000);

// ===== STYLED TEXT =====
it('handles "paste-styled-text"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'paste-styled-text', segments: [] }, consoleErrorSpy);
}, 2000);

it('handles "copy-styled-text"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'copy-styled-text' }, consoleErrorSpy);
}, 2000);

// ===== MODE =====
it('handles "set-plugin-mode"', async () => {
  // Use 'navigate' — 'lint' triggers findAll which needs extra mock setup
  await dispatchAndAssertNoCrash(onmessage, { type: 'set-plugin-mode', mode: 'navigate' }, consoleErrorSpy);
}, 2000);

// ===== EXTERNAL =====
it('handles "open-kofi"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'open-kofi' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 7: Add lint message tests**

```typescript
// ===== LINT =====
it('handles "lint-run-scan"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-run-scan' }, consoleErrorSpy);
}, 2000);

it('handles "lint-cancel-scan"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-cancel-scan' }, consoleErrorSpy);
}, 2000);

it('handles "lint-set-scope"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-set-scope', scope: 'page' }, consoleErrorSpy);
}, 2000);

it('handles "lint-apply-fix"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-apply-fix', nodeId: 'test', category: 'fill', styleId: 'test' }, consoleErrorSpy);
}, 2000);

it('handles "lint-fix-all"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-fix-all', fixes: [] }, consoleErrorSpy);
}, 2000);

it('handles "lint-ignore-error"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-ignore-error', errorId: 'test' }, consoleErrorSpy);
}, 2000);

it('handles "lint-ignore-all"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-ignore-all', errorIds: [] }, consoleErrorSpy);
}, 2000);

it('handles "lint-select-all"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-select-all', nodeIds: [] }, consoleErrorSpy);
}, 2000);

it('handles "lint-clear-ignored"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-clear-ignored' }, consoleErrorSpy);
}, 2000);

it('handles "lint-select-node"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-select-node', nodeId: 'test-id' }, consoleErrorSpy);
}, 2000);

it('handles "lint-update-settings"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-update-settings', settings: {} }, consoleErrorSpy);
}, 2000);

it('handles "lint-get-settings"', async () => {
  await dispatchAndAssertNoCrash(onmessage, { type: 'lint-get-settings' }, consoleErrorSpy);
}, 2000);
```

- [ ] **Step 8: Run full smoke test suite**

Run: `npx vitest --run src/test/smoke-dispatch.test.ts`
Expected: All tests PASS. If any fail, investigate — likely a missing mock stub or incorrect payload. Fix the specific failure and re-run.

- [ ] **Step 9: Commit**

```bash
git add src/test/smoke-dispatch.test.ts
git commit -m "test: add smoke tests for all 61 sandbox message handlers"
```

---

### Task 5: Update package.json scripts

Add smoke test to `test:critical` and add `type-check` to `validate`.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update `test:critical` to include smoke test**

Add `src/test/smoke-dispatch.test.ts` to the end of the `test:critical` file list.

- [ ] **Step 2: Update `validate` to include `type-check`**

Change:
```json
"validate": "npm run lint && npm run test:critical && npm run build && echo Build validation completed successfully"
```
To:
```json
"validate": "npm run type-check && npm run lint && npm run test:critical && npm run build && echo Build validation completed successfully"
```

- [ ] **Step 3: Run the full validate gate**

Run: `npm run validate`
Expected: All steps pass — type-check, lint, critical tests (including smoke), build.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add smoke test to test:critical, add type-check to validate"
```
