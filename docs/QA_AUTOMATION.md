# QA Automation

stratusHue uses **Vitest** with a `jsdom` environment. Tests run against real source files — no compiled output required. The Figma API is mocked entirely in `src/test/setup.ts`, so sandbox code can be tested without a running Figma instance.

## When to run tests

| Situation | Command |
|---|---|
| Actively changing code | `npm run test:watch` |
| Quick sanity check | `npm run test` |
| Before committing | `npm run test:critical` |
| Before opening a PR | `npm run validate` |
| UI/settings spot-check (automated) | `npm run test:prototype:sync` |
| Full gate incl. prototype | `npm run validate:full` |
| Manual Figma spot-check | `docs/testing/spot-check.md` (~3 min) |
| After touching navigation code | `npm run test:navigation` |
| After touching scanning/traversal code | `npm run test:performance` |

**`npm run validate`** (lint + test:critical + build) is the standard pre-PR gate. Run it before pushing to `develop`.

**`npm run validate:full`** adds prototype browser tests (`test:prototype:sync`) for settings UI, date controls, lint removal, and bridge chrome. Use before releases or when changing `ui.html`, settings, or prototype shim.

## Test suites

All unit/integration test files live in `src/test/`. Prototype browser tests live in `tests/prototype/`.

| File | Covers |
|---|---|
| `navigation.test.ts` | Core nav logic, edge cases, state |
| `navigation-history.test.ts` | Back/forward stack, page changes |
| `navigation-context.test.ts` | Button state calculation, context shape |
| `navigation-integration.test.ts` | End-to-end nav workflows |
| `navigation-ui-integration.test.ts` | UI components, message handling |
| `navigation-settings.test.ts` | Settings persistence |
| `navigation-basic.test.ts` | Basic smoke scenarios |
| `bookmarks.test.ts` | Add/remove/reorder, sync, anchor state |
| `emoji-manager.test.ts` | Emoji nav, adding/clearing to layers |
| `message-contracts.test.ts` | UI ↔ Sandbox message shape validation |
| `smoke-dispatch.test.ts` | Sandbox message handler smoke tests (no crash) |
| `date-tagger.test.ts` | Date token strip/format/compose logic |
| `settings-ui.test.ts` | Date format/position segmented controls + postMessage |
| `ui-state-persistence.test.ts` | Doc/user-scoped state caching |
| `ui-state-persistence-integration.test.ts` | End-to-end persistence scenarios |
| `performance.test.ts` | Benchmarks at 25 / 250 / 1000 layers |

### Prototype browser tests (`tests/prototype/`)

Served from `prototype/plugin.html` (generated — run `npm run sync:prototype` first). Playwright config starts `npx serve prototype` on port 3456.

| File | Covers |
|---|---|
| `settings.spec.ts` | No Validate tab, settings overlay, date segmented controls, bridge settings, status dots |

Commands:
- `npm run test:prototype` — run against existing `prototype/plugin.html`
- `npm run test:prototype:sync` — rebuild prototype then run tests

### Critical subset

`npm run test:critical` runs the highest-priority suites for speed:
- `bookmarks.test.ts`
- `emoji-manager.test.ts`
- `navigation.test.ts`
- `navigation-history.test.ts`
- `navigation-integration.test.ts`
- `message-contracts.test.ts`
- `smoke-dispatch.test.ts`
- `date-tagger.test.ts`
- `settings-ui.test.ts`

## Infrastructure

### `src/test/setup.ts`
Runs before every test file. Mocks the full Figma API surface:
- `figma.currentPage` — page with selection and children
- `figma.clientStorage` — async key-value storage
- `figma.getNodeByIdAsync()` — node lookup by ID
- `figma.ui.postMessage()` — sandbox → UI messaging
- `figma.viewport` — scroll/zoom controls

Provides factory helpers: `createMockSceneNode()`, `createMockPageNode()`, `createMockContainer()`.

A `beforeEach` hook resets all mocks and module state between tests.

### `src/test/run-tests.ts`
Custom runner for the navigation suite (`npm run test:navigation`). Runs 5 suites in sequence, parses vitest JSON output, and writes a report to `test-results/`:
- `test-results/navigation-test-report.json`
- `test-results/navigation-test-report.html`

## Key conventions for writing new tests

- **Add `/// <reference types="@figma/plugin-typings" />`** at the top of any test file that references Figma types — required for the sandbox tsconfig.
- **Return `{ success, message }` tuples** from feature modules; tests should assert both fields.
- **Expose `__resetState()`** from stateful modules so `beforeEach` can clear them. Import and call it in setup.
- **Use `vi.mock()`** at the top of the file to isolate the unit under test from Figma I/O.
- **Do not test `dist/`** — import source files directly.
- ESLint is configured to ignore test files, but keep code readable.

## No CI/CD yet

There are no GitHub Actions workflows. Tests run locally only. `npm run validate` is the manual substitute for a CI gate — run it before pushing to `main` or opening a PR.
