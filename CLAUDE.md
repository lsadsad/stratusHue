# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # watch mode (sourcemaps)
npm run build            # dev build
npm run build:prod       # minified, no sourcemaps
npm run type-check       # tsc --noEmit (both tsconfigs)
npm run lint             # ESLint
npm run lint:fix
npm run validate         # lint + build
npm run test             # vitest --run
npm run test:watch
npm run sync:prototype   # full build then patch prototype
```

## Architecture

stratusHue is a Figma plugin with two completely isolated processes that share no memory:

### Sandbox (`src/code.ts`)
Runs in Figma's JS sandbox. Has `figma.*` API access, no DOM. Every file in this context must begin with `/// <reference types="@figma/plugin-typings" />`. Built by esbuild to `dist/code.js` (`platform: neutral`, `format: cjs`).

### UI iframe (`src/ui.ts`)
Runs in a browser iframe. Has DOM access, no `figma.*`. Built by esbuild to `dist/ui.js`, then inlined into `dist/ui.html` along with `styles.css` and all SVG assets. Never reference external resources — Figma's sandbox has `networkAccess: { allowedDomains: ["none"] }`.

`src/ui.ts` is a **thin shell (~760 lines)**. UI logic is split into focused modules under `src/ui/`:

```
src/ui/
  ui-communication.ts     ⚠ SANDBOX-SIDE — has figma.* reference, do not import in browser modules
  index.ts                ⚠ SANDBOX-SIDE — re-exports ui-communication
  shared/
    send-message.ts       sendMessage() helper (UI → sandbox postMessage)
    cleanup.ts            timer/listener patching
    lottie.ts             Lottie animation management
    layout.ts             toggle state, auto-fit, scroll
    tooltip-manager.ts    tooltip system
    theme-manager-ui.ts   theme switching, preview, contrast
    accessibility.ts      a11y init, high contrast, reduced motion
    icons.ts              dynamic SVG icon constants
  navigate/
    anatomy.ts            emoji buttons, anatomy section
    bookmarks-ui.ts       bookmark list rendering
    controls-ui.ts        control buttons, group visibility
    settings-ui.ts        controls/nudge settings wiring
    navigate-ui.ts        setupEventListeners(), initializePlugin()
  lint/
    lint-ui.ts            Design Lint tab UI (lazy-loaded)
  scaffold/
    scaffold-ui.ts        Scaffold tab UI placeholder (Phase 3)
```

**Critical:** `src/ui/ui-communication.ts` and `src/ui/index.ts` are **sandbox-side** files that live in `src/ui/` for historical reasons. They begin with `/// <reference types="@figma/plugin-typings" />`. `tsconfig.ui.json` explicitly excludes them via targeted glob includes — never use a blanket `src/ui/**/*.ts` pattern there.

### Message Passing
UI → Sandbox via `parent.postMessage({ pluginMessage: { type, ...data } }, '*')`. Use `sendMessage(type, data)` from `src/ui/shared/send-message.ts` — never call `parent.postMessage` directly.
Sandbox → UI via `figma.ui.postMessage({ type, ...payload })`.
Sandbox receives in `figma.ui.onmessage`, validated with `validateMessage(msg)` before dispatch.
UI receives in a `window.addEventListener('message', ...)` handler in `ui.ts`.

All outbound sandbox messages are centralised in `src/ui/ui-communication.ts` — the only file that calls `figma.ui.postMessage`. Feature modules never call it directly.

### Plugin Modes

The plugin has three modes, toggled via the tab strip. Only one mode's UI is active at a time.

| Mode | Tab label | Main element | Status |
|---|---|---|---|
| `navigate` | Navigate | `#navigate-main` | Complete — default mode |
| `lint` | Validate | `#validate-main` | Phase 2 complete |
| `scaffold` | Scaffold | `#scaffold-main` | Phase 3 placeholder |

`activateMode(mode)` in `ui.ts` toggles the `hidden` attribute on `<main>` blocks and lazy-imports the mode's UI module on first activation:

```typescript
if (mode === 'lint' && !lintUIInitialized) {
  lintUIInitialized = true;
  const { initializeLintUI } = await import('./ui/lint/lint-ui');
  initializeLintUI();
}
```

The sandbox persists the active mode via `figma.clientStorage` and restores it on load by sending `plugin-mode-restored`. Switching to lint mode auto-triggers a scan (or large-file warning if node count > 5000). Switching away from lint mode cancels any in-flight scan.

### State Management (`src/core/state.ts`)
Two persistence layers — choose deliberately:

| Layer | API | Scope |
|---|---|---|
| In-memory | module-level `let` vars | session only |
| User-scoped | `figma.clientStorage` | per user, cross-file |
| Document-scoped | `figma.root.setPluginData` | per Figma file |

Bookmarks are document-scoped (travel with the file). History, section states, and theme preference are user-scoped (follow the user). Cache-aside pattern: always check in-memory cache first; invalidate with `clearBookmarksCache()`.

Lint settings and ignored errors are also persisted via `figma.clientStorage` — see `src/core/lint-state.ts`.

### Feature Modules (`src/features/`)
All user-facing operations return `Promise<{ success: boolean; message: string }>`. The message is forwarded directly to `figma.notify()`. Wrap with `withErrorBoundary()` from `src/core/error-handling.ts` when registering in `code.ts`:

```typescript
const handleAddEmoji = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelection(emoji);
  figma.notify(result.message);
}, ErrorType.UNKNOWN);
```

All Figma node lookups are async: use `figma.getNodeByIdAsync(id)`, not the sync version.

### Lint Subsystem

| File | Role |
|---|---|
| `src/core/lint-types.ts` | `LintError`, `LintSettings`, `DEFAULT_LINT_SETTINGS`, message payload types |
| `src/core/lint-state.ts` | In-memory + persisted state for settings, ignored errors, plugin mode |
| `src/features/lint-engine.ts` | Async tree-walker (`runLintScan`), fix-all (`runLintFixAll`), cancel flag |
| `src/features/lint-checks.ts` | Per-node check logic — fill, stroke, text, effects, radius |
| `src/features/lint-styles.ts` | Style cache loader + fuzzy color matcher |
| `src/ui/lint/lint-ui.ts` | All Validate tab DOM — lazy-loaded on first mode activation |

`lint-engine.ts` sets `figma.skipInvisibleInstanceChildren = true` before scanning and restores it on all exit paths. Locked nodes are skipped. A debounced re-scan (2000ms) fires on `documentchange` when lint mode is active — see `src/utils/validation.ts`.

### Error Handling (`src/core/error-handling.ts`)
- `withErrorBoundary(fn, errorType)` — async wrapper, returns `null` on failure
- `withSyncErrorBoundary(fn, errorType)` — sync variant
- `validateMessage(msg)` — confirms `{ type: string }` shape before switch dispatch
- Prefix unused vars/caught errors with `_` (ESLint `no-unused-vars` is `error`)

### CSS (`src/styles.css`)
Single flat file, no preprocessor, inlined at build time. Custom property naming:

```
--spacing-{xs|sm|md|lg|xl|xxl}
--button-height-{sm|md|lg}
--icon-size-{xs|sm|md|md-plus|lg|xl}
--border-radius-{xs|sm|md|lg|xl|pill}
--font-size-{xs|sm|base|md|lg}, --font-weight-{light|normal|medium|semibold|bold|heavy}
--transition-{fast|normal|slow}
--z-{tooltip|footer|modal}
--theme-*   (semantic aliases)
--color-*   (raw colour tokens)
```

Five themes: `system`, `light`, `dark`, `boilerplate`, `cybertron`. Applied via a `data-*` attribute on the root element. Theme transitions use `.theme-transitioning` (300ms, `will-change` on specific components only — never the universal selector).

The reset block includes `[hidden] { display: none !important; }`. This is intentional — any component that sets an explicit `display:` value (e.g. `display: flex`) must not override the HTML `hidden` attribute. Never remove this rule.

### TypeScript Setup
Two tsconfigs because the two processes have different module requirements:
- `tsconfig.json` — sandbox, `module: commonjs`, includes all `src/**`
- `tsconfig.ui.json` — UI iframe, `module: esnext`, explicitly includes only browser-side paths:

```json
"include": [
  "src/ui.ts",
  "src/ui/shared/**/*.ts",
  "src/ui/navigate/**/*.ts",
  "src/ui/lint/**/*.ts",
  "src/ui/scaffold/**/*.ts",
  "src/types/**/*.d.ts"
]
```

This deliberately excludes `src/ui/ui-communication.ts` and `src/ui/index.ts` (sandbox-side).

Both set `noEmit: true` — esbuild does the actual compilation, `tsc` is type-check only.

## Key Conventions

- **`figma.loadAllPagesAsync()` must complete before registering `documentchange`** — guarded by `documentChangeRegistered` flag in `code.ts`.
- **Debouncing**: use `debounce()` from `src/utils/utils.ts`. Standard delays:

  | Event | Delay |
  |---|---|
  | Selection change | 100ms |
  | Page change | 200ms |
  | Nav context | 50ms |
  | Section state save | 300ms |
  | Lint re-scan (documentchange) | 2000ms |

- **Dynamic imports in `code.ts`**: large feature modules are `await import()`'d lazily. Keep this pattern for new features — it keeps startup cost zero for inactive modes.
- **Mode UI is lazy-loaded in `ui.ts`**: each mode's UI module is imported only on first activation (`lintUIInitialized` guard). Follow this pattern for Scaffold (Phase 3).
- **`ui.ts` must not import anything that uses `figma.*`** — `ui-communication.ts` and `index.ts` in `src/ui/` are sandbox-only.
- **SVG assets** in `assets/` are inlined as raw `<svg>` markup at build time by `esbuild.config.js` (not base64). Use `<img src="./assets/ICO-*.svg">` in `ui.html`; the build replaces every such tag with the SVG markup, collapsed to a single line so it is safe inside JS string literals. All icons use `stroke="currentColor"`. Dynamic icons swapped at runtime are stored as single-line SVG string constants in `src/ui/shared/icons.ts` and injected via `element.innerHTML`. See `.cursor/rules/icons-and-animation.mdc` for the full convention.

## Figma Functional Debugging (Node-Dependent Bugs)

- For node/page/document behavior, validate in **real Figma runtime**, not only `prototype/plugin.html`.
- Rebuild with `npm run build` and relaunch plugin from `manifest.json` before verification.
- Instrument parser/composer style bugs at 3 points: input, parsed parts, composed output.
- Add a focused regression test for the failing input string when possible.
- Reference: `docs/fixes/FIGMA_FUNCTIONAL_DEBUG_PLAYBOOK.md`.

## Prototype System

`prototype/plugin.html` is **not hand-authored** — it is generated by patching the compiled `dist/ui.html` with a Figma mock shim. Never edit it directly; regenerate it instead.

### Sync command

```bash
npm run sync:prototype                 # full build then patch
npm run sync:prototype -- --no-build  # patch only — use when editing shim.js without rebuilding
```

### What `scripts/sync-prototype.js` does

1. Runs `npm run build` (skipped with `--no-build`)
2. Reads `dist/ui.html`
3. Injects `prototype/shim.js` as a `<script>` block before `</head>`
4. Wraps the plugin chrome in `<div id="plugin-chrome">` with a simulated Figma title bar
5. Writes the result to `prototype/plugin.html`

### Canonical source files

| File | Role |
|---|---|
| `prototype/shim.js` | **Edit this** — mock data, postMessage handling, control panel, CSS overrides |
| `scripts/sync-prototype.js` | Patch script |
| `prototype/plugin.html` | **Generated output — do not edit** |

### What the shim does

- **`parent.postMessage` interception**: `toggle-width` resizes `#plugin-chrome` between 240 px ↔ 188 px; `toggle-controls` echoes back a `controls-setting` message; all other outbound messages are dropped silently (including `set-plugin-mode` — mode tab clicks still work because `activateMode()` toggles `hidden` in the browser before sending).
- **CSS overrides**: centers the plugin as a card with `#plugin-chrome` (240 px, shadow, border-radius), always-white title bar, themed backgrounds on `main` and `footer`.
- **Mock messages** (fired 300 ms after `DOMContentLoaded`): `theme-preference`, `ui-section-states`, `selection-state`, `emoji-navigation-state`, `bookmarks`, `navigation-state`, `controls-setting`, `controls-group-settings`, `navigation-context-update`, `nudge-settings`, `update-layout-state`.
- **Control panel** (`#ctrl-panel`): sidebar with Theme buttons (`figma-dark` / `figma-light` / `boilerplate` / `cybertron`) and State buttons (`Layer Selected` / `No Selection`). A `MutationObserver` on `data-theme` keeps its active-state styling in sync when the plugin's own Settings panel changes the theme.
- **Settings overlay**: a `MutationObserver` on `#settings-overlay` repositions the overlay to match `#plugin-chrome`'s bounding rect when it opens.

> **Note:** The shim does not send `plugin-mode-restored`, so the mode strip starts in Navigate by default. The Validate tab is hidden via `hidden` attribute on `#validate-main` in the HTML. Tab clicks work natively — no shim support needed.

### Serving locally

```bash
npx serve prototype
```
Then open `http://localhost:3000/plugin.html`.


## Issue Tracking (`.issues/`)

Issues are plain markdown files with YAML frontmatter, tracked in git. No external tools needed.

```
.issues/
  open/       # active issues
  closed/     # completed issues
```

### Frontmatter schema

```yaml
---
id: abc          # short ID (carried over from legacy tracker)
title: "..."
type: task|feature|bug|epic
priority: 1      # 0=critical, 1=high, 2=medium, 3=low, 4=backlog
status: open
depends_on: []   # list of IDs this issue is blocked by
created: 2026-03-21
---
```

### Conventions

- File naming: `P{priority}-{id}-{slug}.md` (e.g., `P1-sob-recipe-json-schema.md`)
- To close an issue: `git mv .issues/open/P1-foo.md .issues/closed/`
- To find ready work: issues in `open/` with empty `depends_on` or all deps in `closed/`
- Dependencies reference other issue IDs (check `depends_on` arrays)
- Obsidian-compatible: open `.issues/` as a vault, use Dataview for queries

### Trigger phrases

- "create an issue for X" / "track this" → write new `.issues/open/P{n}-{id}-{slug}.md`
- "what's ready" / "what should I work on" → scan `open/` for unblocked issues
- "show issue X" / "what's open" → read/list `.issues/open/`
- "close X" / "mark X done" → `git mv .issues/open/... .issues/closed/`

## Project Memory (`.memory/`)

Append-only knowledge base for decisions, context, and open questions. Use `.memory/` for all persistent knowledge — do NOT use `bd remember` or `MEMORY.md` files. See `.memory/README.md` for full format and conventions.

### Trigger phrases

- "remember this" / "save to memory" → write new `.memory/YYYY-MM-DD-slug.md`
- "check memory" / "what do we know about X" → grep `.memory/`
- "this replaces the decision on X" → new entry with "Supersedes:" reference

## Session Completion

**When ending a work session**, you MUST complete ALL steps below.

1. **File issues** for remaining work (create new `.issues/open/*.md` files)
2. **Run quality gates** (if code changed) — tests, linters, builds
3. **Update issue status** — move completed issues to `closed/`
4. **PUSH TO REMOTE**:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** — all changes committed AND pushed
