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
```

## Architecture

stratusHue is a Figma plugin with two completely isolated processes that share no memory:

### Sandbox (`src/code.ts`)
Runs in Figma's JS sandbox. Has `figma.*` API access, no DOM. Every file in this context must begin with `/// <reference types="@figma/plugin-typings" />`. Built by esbuild to `dist/code.js` (`platform: neutral`, `format: cjs`).

### UI iframe (`src/ui.ts`)
Runs in a browser iframe. Has DOM access, no `figma.*`. Built by esbuild to `dist/ui.js`, then inlined into `dist/ui.html` along with `styles.css` and all SVG assets (base64). Never reference external resources — Figma's sandbox has `networkAccess: { allowedDomains: ["none"] }`.

### Message Passing
UI → Sandbox via `parent.postMessage({ pluginMessage: { type, ...data } }, '*')`.
Sandbox → UI via `figma.ui.postMessage({ type, ...payload })`.
Sandbox receives in `figma.ui.onmessage`, validated with `validateMessage(msg)` before dispatch.
UI receives in a `window.addEventListener('message', ...)` handler in `ui.ts`.

All outbound sandbox messages are centralised in `src/ui/ui-communication.ts` — the only file that calls `figma.ui.postMessage`. Feature modules never call it directly.

### State Management (`src/core/state.ts`)
Two persistence layers — choose deliberately:

| Layer | API | Scope |
|---|---|---|
| In-memory | module-level `let` vars | session only |
| User-scoped | `figma.clientStorage` | per user, cross-file |
| Document-scoped | `figma.root.setPluginData` | per Figma file |

Bookmarks are document-scoped (travel with the file). History, section states, and theme preference are user-scoped (follow the user). Cache-aside pattern: always check in-memory cache first; invalidate with `clearBookmarksCache()`.

### Feature Modules (`src/features/`)
All user-facing operations return `Promise<{ success: boolean; message: string }>`. The message is forwarded directly to `figma.notify()`. Wrap with `withErrorBoundary()` from `src/core/error-handling.ts` when registering in `code.ts`:

```typescript
const handleAddEmoji = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelection(emoji);
  figma.notify(result.message);
}, ErrorType.UNKNOWN);
```

All Figma node lookups are async: use `figma.getNodeByIdAsync(id)`, not the sync version.

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

### TypeScript Setup
Two tsconfigs because the two processes have different module requirements:
- `tsconfig.json` — sandbox, `module: commonjs`, includes all `src/**`
- `tsconfig.ui.json` — UI iframe, `module: esnext`, only `src/ui.ts`

Both set `noEmit: true` — esbuild does the actual compilation, `tsc` is type-check only.

## Key Conventions

- **`figma.loadAllPagesAsync()` must complete before registering `documentchange`** — guarded by `documentChangeRegistered` flag in `code.ts`.
- **Debouncing**: use `debounce()` from `src/utils/utils.ts`. Standard delays: selection = 100ms, page change = 200ms, nav context = 50ms, section state save = 300ms.
- **Dynamic imports in `code.ts`**: large feature modules are `await import()`'d lazily. Keep this pattern for new features.
- **`ui.ts` must not import anything that uses `figma.*`** — theme-manager and ui-communication are sandbox-only.
- **SVG assets** in `assets/` become base64 data URIs at build time via esbuild loader config. Reference them by original path in source; the build handles the rest.

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
4. Wraps `<main class="scrollable-content">` … `</footer>` in `<div id="plugin-chrome">` with a simulated Figma title bar (logo base64-encoded from `assets/12.27 _ logo.png`)
5. Writes the result to `prototype/plugin.html`

### Canonical source files

| File | Role |
|---|---|
| `prototype/shim.js` | **Edit this** — mock data, postMessage handling, control panel, CSS overrides |
| `scripts/sync-prototype.js` | Patch script |
| `prototype/plugin.html` | **Generated output — do not edit** |

### What the shim does

- **`parent.postMessage` interception**: `toggle-width` resizes `#plugin-chrome` between 240 px ↔ 188 px; `toggle-controls` echoes back a `controls-setting` message; all other outbound messages are dropped.
- **CSS overrides**: centers the plugin as a card with `#plugin-chrome` (240 px, shadow, border-radius), always-white title bar, themed backgrounds on `main` and `footer`.
- **Mock messages** (fired 300 ms after `DOMContentLoaded`): `theme-preference`, `ui-section-states`, `selection-state`, `emoji-navigation-state`, `bookmarks`, `navigation-state`, `controls-setting`, `controls-group-settings`, `navigation-context-update`, `nudge-settings`, `update-layout-state`.
- **Control panel** (`#ctrl-panel`): sidebar with Theme buttons (`figma-dark` / `figma-light` / `boilerplate` / `cybertron`) and State buttons (`Layer Selected` / `No Selection`). A `MutationObserver` on `data-theme` keeps its active-state styling in sync when the plugin's own Settings panel changes the theme.
- **Settings overlay**: a `MutationObserver` on `#settings-overlay` repositions the overlay (via inline styles) to match `#plugin-chrome`'s bounding rect when it opens, so the modal is confined to the card rather than the full browser viewport.

### Serving locally

```bash
npx serve prototype
```
Then open `http://localhost:3000/plugin.html`.
