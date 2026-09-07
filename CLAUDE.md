# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design methodology — Throughline (scoped companion layer)

The **Throughline** methodology (ported verbatim from the figma-studio repo) is imported below. `CLAUDE-throughline.md` itself imports `CLAUDE-visual-craft.md`, so both load from this single reference.

**Scope — read before applying.** Throughline applies **only** to Figma design-critique work — evaluating frames, design intent, and UI composition. It does **not** govern stratusHue's code, build, or repo workflow. On any conflict, **stratusHue's own conventions in this file take precedence**. Specifically:

- **Spacing/sizing:** use stratusHue's `--spacing-*` / `--button-height-*` / `--icon-size-*` token scale — not Throughline's "4pt grid is non-negotiable" rule.
- **Decisions & tracking:** use this repo's `.issues/` + `.memory/` systems — not Throughline's "DD-NNN entry in Notion."
- **figma-studio-only references** (Nibble Card, AT&T Relay Design System, `figma-kb`, rive-studio, the ASCII → HTML → Figma → Rive iteration sequence) are AT&T/figma-studio context — treat as inherited background, not directives to follow here.

figma-studio remains the canonical source; the copy here is downstream and AT&T-domain-bound by design.

@CLAUDE-throughline.md

- **Claude Code** — `@` line above imports at session load
- **Cursor** — `.cursor/rules/throughline-visual-craft.mdc` (agent-requested on Figma design-critique only; stratusHue conventions win; not always-on)
- **Copilot (VS Code)** — `.github/instructions/throughline-visual-craft.instructions.md` (path-specific; not always-on)

## Commands

```bash
npm run dev              # watch mode (sourcemaps)
npm run build            # dev build
npm run build:prod       # minified, no sourcemaps
npm run type-check       # tsc --noEmit (both tsconfigs)
npm run lint             # ESLint
npm run lint:fix
npm run validate         # type-check + lint + test:critical + build
npm run validate:full    # validate + prototype sync + Playwright
npm run test             # vitest --run
npm run test:watch
npm run test:critical    # the focused vitest subset `validate` runs
npm run test:prototype   # Playwright against prototype/plugin.html
npm run sync:prototype   # full build then patch prototype
npm run use-manifest:dev   # manifest.json <- manifest.dev.json
npm run use-manifest:prod  # manifest.json <- manifest.prod.json
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
  bridge/
    bridge-client.ts      MCP WebSocket client (lazy-loaded, off by default)
    bridge-ui.ts          bridge settings toggle + footer status dots
  scaffold/
    scaffold-ui.ts        Scaffold UI placeholder (Phase 3, not wired to any tab)
```

**Critical:** `src/ui/ui-communication.ts` and `src/ui/index.ts` are **sandbox-side** files that live in `src/ui/` for historical reasons. They begin with `/// <reference types="@figma/plugin-typings" />`. `tsconfig.ui.json` explicitly excludes them via targeted glob includes — never use a blanket `src/ui/**/*.ts` pattern there.

### Message Passing
UI → Sandbox via `parent.postMessage({ pluginMessage: { type, ...data } }, '*')`. Use `sendMessage(type, data)` from `src/ui/shared/send-message.ts` — never call `parent.postMessage` directly.
Sandbox → UI via `figma.ui.postMessage({ type, ...payload })`.
Sandbox receives in `figma.ui.onmessage`, validated with `validateMessage(msg)` before dispatch.
UI receives in a `window.addEventListener('message', ...)` handler in `ui.ts`.

All outbound sandbox messages are centralised in `src/ui/ui-communication.ts` — the only file that calls `figma.ui.postMessage`. Feature modules never call it directly.

### Plugin Modes

The shipped UI is **navigate-only**. Validate (Design Lint) was removed in `704ea67` — `src/ui/lint/`, `src/features/lint-*.ts` and `src/core/lint-*.ts` no longer exist, and `src/ui.html` has no mode strip.

Mode plumbing survives sandbox-side in `src/core/plugin-mode.ts` for the planned Scaffold work:

| Mode | Status |
|---|---|
| `navigate` | Shipping — the only mode with UI |
| `scaffold` | Phase 3 — `src/ui/scaffold/scaffold-ui.ts` placeholder, not wired to any tab |

`loadPluginMode()` reads `pluginMode` from `figma.clientStorage` and migrates a stored legacy `'lint'` value to `'navigate'`. `persistPluginMode(mode)` writes it back. `code.ts` accepts `set-plugin-mode` for `'navigate' | 'scaffold'` only.

When Scaffold gets a UI, lazy-import its module on first activation — the way `ui.ts` dynamically imports the bridge modules — so startup cost stays at zero for inactive modes.

### State Management (`src/core/state.ts`)
Two persistence layers — choose deliberately:

| Layer | API | Scope |
|---|---|---|
| In-memory | module-level `let` vars | session only |
| User-scoped | `figma.clientStorage` | per user, cross-file |
| Document-scoped | `figma.root.setPluginData` | per Figma file |

Bookmarks are document-scoped (travel with the file). History, section states, and theme preference are user-scoped (follow the user). Cache-aside pattern: always check in-memory cache first; invalidate with `clearBookmarksCache()`.

The MCP bridge's enabled flag and cloud pair code are user-scoped too — `bridgeEnabled` and `bridgePairCode` in `figma.clientStorage`, read in `code.ts` on init.

### Feature Modules (`src/features/`)
All user-facing operations return `Promise<{ success: boolean; message: string }>`. The message is forwarded directly to `figma.notify()`. Wrap with `withErrorBoundary()` from `src/core/error-handling.ts` when registering in `code.ts`:

```typescript
const handleAddEmoji = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelection(emoji);
  figma.notify(result.message);
}, ErrorType.UNKNOWN);
```

All Figma node lookups are async: use `figma.getNodeByIdAsync(id)`, not the sync version.

### MCP Bridge Subsystem

An opt-in WebSocket bridge that exposes the open Figma file to an MCP server. **Off by default and gated twice** — read *Bridge & Build Flavors* below before touching it.

| File | Role |
|---|---|
| `src/ui/bridge/bridge-client.ts` | Browser-side WS client — local ports 9223-9232 and the cloud relay `wss://figma-console-mcp.southleft.com/ws/pair`; keepalive, reconnect, `broadcastEvent()` |
| `src/ui/bridge/bridge-ui.ts` | Settings toggle, cloud pair-code row, footer status dots |
| `src/features/bridge/bridge-handlers.ts` | Sandbox-side command handlers — variables, components, nodes, text, FigJam |
| `src/features/bridge/file-info.ts` | `buildFileInfo()` + `PLUGIN_VERSION` for the FILE_INFO handshake |

Sandbox routing lives in `code.ts`: `bridge-set-enabled`, `bridge-set-pair-code`, `bridge-connected`/`-disconnected`, and ~35 `bridge-cmd-*` cases that lazy-import `bridge-handlers.ts`. UI routing is a set of `bridge-*` cases in `ui.ts` that dynamically import `bridge-client.ts` — which is why `tsconfig.ui.json` type-checks the bridge modules without listing them.

#### Bridge & Build Flavors

Two independent gates keep the bridge inert in the Community build:

1. **`manifest.json` `networkAccess`** — platform-enforced by Figma. `manifest.prod.json` declares `{ "allowedDomains": ["none"] }`; `manifest.dev.json` whitelists localhost 9223-9232 plus the relay and adds `"inspect"` + `enablePrivatePluginApi`. `npm run build:prod` copies the prod manifest over `manifest.json`; `npm run dev` copies the dev one.
2. **`bridgeEnabled` runtime toggle** — defaults `false` in `code.ts`, persisted in `figma.clientStorage`. Every broadcast path is guarded by it.

**`main` must always commit the prod manifest.** Merging a dev branch without excluding `manifest.json` reintroduces the network permissions on the AT&T-approved / Community build.

The toggle is **not** a substitute for the manifest. `#bridge-settings-section` in `ui.html` ships visible in every build, and `clientStorage` is keyed by plugin id — identical in both manifests — so a user who enabled the bridge in the dev build has it restored in the prod build. Only the manifest stops the sockets opening.

Compile-out (a `__BRIDGE__` build flag stripping the bridge from the community bundle entirely) is designed but **not implemented** — see issue `bfl` and `docs/superpowers/specs/2026-07-10-mcp-bridge-compile-out-design.md`.

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
  "src/ui/scaffold/**/*.ts",
  "src/types/**/*.d.ts"
]
```

This deliberately excludes `src/ui/ui-communication.ts` and `src/ui/index.ts` (sandbox-side). `src/ui/bridge/**` is absent by design — `ui.ts` imports it dynamically, so `tsc` pulls it in transitively.

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

- **Dynamic imports in `code.ts`**: large feature modules are `await import()`'d lazily. Keep this pattern for new features — it keeps startup cost zero for inactive modes.
- **Optional UI is lazy-loaded in `ui.ts`**: bridge modules are `await import()`'d from inside their `bridge-*` message cases, never at module top level. Follow this pattern for Scaffold (Phase 3).
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


## Smoke Tests

When adding a new message type to `figma.ui.onmessage` in `code.ts`, you **must** also add a corresponding smoke test in `src/test/smoke-dispatch.test.ts`:

```typescript
it('handles "your-new-message"', { timeout: 2000 }, async () => {
  await dispatchAndAssertNoCrash({ type: 'your-new-message', /* minimal payload matching the case guard */ });
});
```

The payload must match the validation guard in the `case` branch (e.g., if the handler checks `'nodeId' in msg`, the payload needs `nodeId`). Place the test in the appropriate category section.

After adding, run `npm run validate` to confirm the full gate passes.

## finePrint

Issue tracking (`.issues/`), project memory (`.memory/`), and shortHand phrases live in [`docs/finePrint.md`](docs/finePrint.md). shortHand vocabulary and MCP prompts are maintained in [groundControl CLAUDE.md](https://github.com/lsadsad/groundControl/blob/main/CLAUDE.md).

## Session Completion

**When ending a work session**, you MUST complete ALL steps below.

> **Distill is the standing close.** End active sessions with a `.memory/` entry (say "distill this" or "distill and wrap"). `wrap up` alone closes/commits/pushes but writes no memory.

1. **Distill** — extract decisions, context, and open questions into `.memory/YYYY-MM-DD-slug.md`; update issues with progress
2. **File issues** for remaining work (create new `.issues/open/*.md` files)
3. **Run quality gates** (if code changed) — tests, linters, builds
4. **Update issue status** — move completed issues to `closed/`
5. **PUSH TO REMOTE**:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
6. **Verify** — all changes committed AND pushed, and a `.memory/` entry exists for this session
