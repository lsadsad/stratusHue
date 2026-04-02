# Pre-Push Regression Smoke Test

**Date:** 2026-03-28
**Status:** Approved
**Goal:** Catch regressions before major pushes by smoke-testing all sandbox message handlers.

## Problem

The plugin has 61 message types dispatched through `figma.ui.onmessage` in `code.ts`, but only a handful are covered by existing tests. A broken import, missing handler, or crash in a lazy-loaded module can ship undetected. There is no single command that validates plugin stability before pushing.

## Solution

Two deliverables:

1. **Smoke test file** (`src/test/smoke-dispatch.test.ts`) — fires every message type through the real `onmessage` handler with minimal valid payloads, asserts handlers execute without crashing.
2. **`pre-push` npm script** — runs the full quality gate: type-check, lint, critical tests (including the new smoke test), and build.

## Design

### Smoke Test

**File:** `src/test/smoke-dispatch.test.ts`

**Approach:**
- One `describe('sandbox message dispatch')` block
- One `it()` per message type (e.g., `it('handles "add-emoji" without throwing')`)
- Each test calls the `onmessage` handler with `{ type: '<message-type>', ...minimalPayload }`
- Each test has a 2-second timeout to catch hanging lazy imports
- Uses the existing `setup.ts` figma mock, extended with missing stubs (see below)

**Handling `code.ts` top-level side effects:**

`code.ts` cannot be imported directly — it has top-level calls (`figma.showUI`, `figma.on`, etc.) that run on import. The smoke test must add these stubs to the mock before importing:

| Missing from mock | Required stub |
|---|---|
| `figma.showUI` | `vi.fn()` |
| `figma.on` | `vi.fn()` |
| `figma.loadAllPagesAsync` | `vi.fn().mockResolvedValue(undefined)` |
| `figma.openExternal` | `vi.fn()` |
| `figma.currentPage.findAll` | `vi.fn().mockReturnValue([])` |
| `globalThis.__html__` | `''` (empty string) |

These stubs are added in a `beforeAll` block in the smoke test file, not in the shared `setup.ts` (to avoid polluting other tests).

**Detecting silent crashes (`withErrorBoundary`):**

Many handlers are wrapped with `withErrorBoundary`, which catches all exceptions and returns `null`. A simple "does not throw" assertion would pass even when handlers crash internally. To catch these:

- Spy on `console.error` in `beforeEach`, assert it was not called after each dispatch
- Spy on `figma.notify` and assert it was not called with error-class messages (messages containing "Error" or "failed")
- These secondary assertions catch crashes that `withErrorBoundary` would otherwise swallow

**Payload strategy:**

Each message type gets a specific minimal payload. Payloads must pass the input validation guards in each `case` branch, otherwise the handler silently no-ops and the test proves nothing.

| Message | Payload |
|---|---|
| `ui-ready` | `{}` |
| `get-ui-section-states` | `{}` |
| `save-ui-section-state` | `{ section: 'test', isOpen: true }` |
| `resize-ui` | `{ width: 300, height: 400 }` |
| `toggle-width` | `{}` |
| `notify` | `{ message: 'test' }` |
| `add-emoji` | `{ emoji: '🔴' }` |
| `clear-emoji` | `{}` |
| `add-emoji-recursive` | `{ emoji: '🔴' }` |
| `clear-emoji-recursive` | `{}` |
| `navigate-emoji-set` | `{ direction: 'next' }` |
| `save-bookmark` | `{}` |
| `refresh-anchors` | `{}` |
| `jump-to-bookmark` | `{ bookmarkId: 'test-id' }` |
| `remove-bookmark` | `{ bookmarkId: 'test-id' }` |
| `reorder-bookmarks` | `{ bookmarks: [] }` |
| `export-plugin-data` | `{}` |
| `import-plugin-data` | `{ data: '{}' }` |
| `deselect` | `{}` |
| `go-back` | `{}` |
| `go-forward` | `{}` |
| `navigation-action` | `{ action: 'enter' }` |
| `nudge-elements` | `{ direction: 'up', amount: 1 }` |
| `resize-elements` | `{ dimension: 'width', amount: 1 }` |
| `duplicate-elements` | `{}` |
| `reorder-layer` | `{ direction: 'up' }` |
| `zoom` | `{ level: 'selection' }` |
| `delete-nodes` | `{}` |
| `toggle-visibility` | `{}` |
| `toggle-lock` | `{}` |
| `toggle-mode` | `{}` |
| `get-theme-preference` | `{}` |
| `set-theme-preference` | `{ theme: 'dark' }` |
| `clear-theme-storage` | `{}` |
| `add-date` | `{}` |
| `create-new-page` | `{}` |
| `indent-title` | `{}` |
| `outdent-title` | `{}` |
| `toggle-controls` | `{}` |
| `get-controls-setting` | `{}` |
| `set-controls-group-visibility` | `{ group: 'test', visible: true }` |
| `get-controls-group-settings` | `{}` |
| `set-nudge-settings` | `{ small: 1, large: 10 }` |
| `get-nudge-settings` | `{}` |
| `cycle-layout-sizing` | `{ axis: 'horizontal' }` |
| `paste-styled-text` | `{ styledText: '' }` |
| `copy-styled-text` | `{}` |
| `set-plugin-mode` | `{ mode: 'navigate' }` (NOT `lint` — avoids `findAll` code path) |
| `open-kofi` | `{}` |
| `lint-run-scan` | `{}` |
| `lint-cancel-scan` | `{}` |
| `lint-set-scope` | `{ scope: 'page' }` |
| `lint-apply-fix` | `{ errorId: 'test', fixType: 'test' }` |
| `lint-fix-all` | `{ category: 'fill' }` |
| `lint-ignore-error` | `{ errorId: 'test' }` |
| `lint-ignore-all` | `{ errorIds: [] }` |
| `lint-select-all` | `{ nodeIds: [] }` |
| `lint-clear-ignored` | `{}` |
| `lint-select-node` | `{ nodeId: 'test-id' }` |
| `lint-update-settings` | `{ settings: {} }` |
| `lint-get-settings` | `{}` |

**Note on `ui-ready`:** This triggers `initializePlugin()` which calls `figma.loadAllPagesAsync()` and reads `figma.clientStorage`. The mock's `vi.fn()` stubs return `undefined` by default, which the init path handles gracefully (treats as first-run defaults). No extra setup needed.

**What the smoke test does NOT do:**
- No response validation (not contract testing)
- No DOM/UI testing (different process)
- No deep feature logic assertions (existing tests cover that)
- No performance benchmarking

### Pre-Push Script

Extend the existing `validate` script rather than creating a near-duplicate:

```json
"validate": "npm run type-check && npm run lint && npm run test:critical && npm run build"
```

This adds `type-check` to `validate` (which previously lacked it). The smoke test is added to the `test:critical` file list.

### File Changes

| File | Change |
|---|---|
| `src/test/smoke-dispatch.test.ts` | New file — smoke test |
| `package.json` | Update `validate` to include `type-check`, add smoke test to `test:critical` |

## Out of Scope

- Git pre-push hook (can be added later if manual `npm run validate` proves insufficient)
- Backfilling unit tests for existing feature functions
- Contract/response validation for message handlers
- Lint subsystem testing (WIP, will be tested when stabilized)
- UI-side testing
- Shared message type enum (good idea for later, but not needed for this deliverable)
