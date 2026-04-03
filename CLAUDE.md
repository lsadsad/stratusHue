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
- Reference: `docs/fixes/figmaFunctionalDebugPlaybook.md`.

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


## finePrint — Smoke Tests

When adding a new message type to `figma.ui.onmessage` in `code.ts`, you **must** also add a corresponding smoke test in `src/test/smoke-dispatch.test.ts`:

```typescript
it('handles "your-new-message"', { timeout: 2000 }, async () => {
  await dispatchAndAssertNoCrash({ type: 'your-new-message', /* minimal payload matching the case guard */ });
});
```

The payload must match the validation guard in the `case` branch (e.g., if the handler checks `'nodeId' in msg`, the payload needs `nodeId`). Place the test in the appropriate category section.

After adding, run `npm run validate` to confirm the full gate passes.


## finePrint — Issue Tracking (`.issues/`)

For a concise agent-facing operational summary, see `fineprint/AI_AGENT_REFERENCE.md`.

Issues are plain markdown files with YAML frontmatter, tracked in git. No external tools needed.

```
.issues/
  open/       # active issues
  closed/     # completed issues
```

### Frontmatter schema

```yaml
---
id: sch              # short mnemonic ID (3 chars; 4 for epics)
category: scaffold   # feature area: scaffold | validate | navigate | meta
title: "..."
type: task|feature|bug|epic
priority: 1          # 0=critical, 1=high, 2=medium, 3=low, 4=backlog
status: open
depends_on: []       # list of IDs this issue is blocked by
created: 2026-03-21
---
```

### Categories

| Category | Description |
|---|---|
| `scaffold` | Scaffold mode — recipe schema, engine, UI, sharing |
| `validate` | Validate mode — lint, token audit, component check, readiness |
| `navigate` | Navigate mode — bookmarks, emoji nav, controls |
| `meta` | Cross-cutting — audits, process, infrastructure |

### Conventions

- File naming: `P{priority}-{category}-{id}-{slug}.md` (e.g., `P2-scaffold-sch-recipe-json-schema.md`)
- To close an issue: `git mv .issues/open/P2-scaffold-sch-*.md .issues/closed/`
- To find ready work: issues in `open/` with empty `depends_on` or all deps in `closed/`
- Dependencies reference other issue IDs (check `depends_on` arrays)
- Obsidian-compatible: open `.issues/` as a vault, use Dataview for queries
- See `.issues/README.md` for full how-to guide

### ID naming convention

IDs should be **short, pronounceable abbreviations** — not random hashes or ticket numbers.

- **3 characters** for regular issues, **4 characters** for epics
- Lowercase, alphanumeric only
- Must be globally unique within the project

### Display Layouts

Issues support two display layouts. Both use tree characters to visualize dependency chains — nested items are blocked by their parent.

**Priority view (default)** — groups by priority level, dependencies nest under blockers:

```
■ Open Issues (17)
│
│ P1
├── aud   Template methodology audit
│
│ P2
├── scf   Scaffold mode epic ⬡  ← tab, tpl, stm
├── sch   Recipe JSON schema
│   ├── exp   Recipe import/export
│   └── stm   Stamp recipe to file
├── ldr   Sandbox: recipe loader
│   ├── pgs   Create pages from recipe
│   │   └── tpl  Content templates
│   └── tab   Scaffold tab UI
├── anc   Anchors list max entries
├── pth   Pathing characters in file tree
├── rel   Cut a release
│
│ P3
├── cmp   Component check
├── rdy   Readiness check
├── tkn   Token audit
│
│ P4
├── anim-ref  Animation system reference
└── smk2  Auto-detect missing smoke tests
```

- Dependencies nest under their blocker within the same priority group
- Cross-priority deps show a `← blocker` marker instead of nesting
- `⬡` marks epics
- `[P4]` suffix when a nested item's priority differs from its group

**Location view** — groups by category (package/area), priority as suffix:

```
■ Open Issues (17)
│
│ scaffold/
├── scf   Scaffold mode epic ⬡ [P2]
│   ├── tab   Scaffold tab UI [P2]
│   ├── tpl   Content templates [P2]
│   └── stm   Stamp recipe to file [P2]
├── sch   Recipe JSON schema [P2]
│   └── exp   Recipe import/export [P2]
├── ldr   Sandbox: recipe loader [P2]
│   └── pgs   Create pages from recipe [P2]
│
│ validate/
├── cmp   Component check [P3]
├── rdy   Readiness check [P3]
├── tkn   Token audit [P3]
│
│ navigate/
├── anc   Anchors list max entries [P2]
├── pth   Pathing characters [P2]
│
│ meta/
├── aud   Template methodology audit [P1]
├── rel   Cut a release [P2]
├── anim-ref  Animation system reference [P4]
└── smk2  Auto-detect missing smoke tests [P4]
```

- Dependencies still nest under their blocker
- `[P2]` suffix shows priority per item

### shortHand — Issues

Casual phrases that drive finePrint actions. Say any of these.

| Phrase | Action |
|---|---|
| "issues plz" | List all open issues (priority view) |
| "issues by location" | List all open issues (location view) |
| "what's ready" | Show unblocked issues only |
| "show deats X" | Show full issue details (frontmatter + body) |
| "issue it" / "track this" | Create a new issue from context or description |
| "done X" | Close issue — `git mv` to `closed/` |
| "bump X" | Raise an issue's priority |
| "block X on Y" | Add Y to X's `depends_on` |

## finePrint — Project Memory (`.memory/`)

For a concise agent-facing operational summary, see `fineprint/AI_AGENT_REFERENCE.md`.

Append-only knowledge base for decisions, context, and open questions. See `.memory/README.md` for full format and conventions.

### Format

Files are named `YYYY-MM-DD-slug.md` with optional YAML frontmatter. Types: `decision`, `question`, `context`, `workaround`.

### shortHand — Memory

| Phrase | Action |
|---|---|
| "save context" | Write new `.memory/YYYY-MM-DD-slug.md` (include "Supersedes: slug" in context to replace an old entry) |
| "check memory" | List all memory entries |
| "recall X" | Search `.memory/` for topic |
| "doc this" | Write a usage guide to `docs/guides/` and update `docs/guides/INDEX.md` |

### shortHand — Session

| Phrase | Action |
|---|---|
| "run down" | Full status report on a topic — pull together issues, memories, related context, and current state |
| "distill this" | Synthesize the session — extract decisions, milestones, and context into `.memory/` entries; update issues with progress; surface untracked work as new issues; prime next session with the next concrete action on each in-progress issue |
| "distill and wrap" | Full end-of-session ritual — distill + prime + close completed issues + quality gates + commit and push |
| "wrap up" | Quality gates, close completed issues, commit and push (no synthesis) |
| "ship it" | Commit all changes and push to remote |
| "what changed" | Git summary — branch, recent commits, dirty state |

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
