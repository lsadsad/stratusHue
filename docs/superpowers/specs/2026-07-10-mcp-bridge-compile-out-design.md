# MCP Bridge Compile-Out with Two Build Flavors

**Date:** 2026-07-10
**Status:** Approved
**Goal:** Ship the MCP bridge to teammates without changing the AT&T-approved / Community plugin, by producing two build flavors from one source — a community flavor containing **zero** bridge code, and a team flavor with the bridge enabled.

## Problem

stratusHue is on AT&T's allowed-plugins list, approved as a locked-down plugin (`networkAccess: none`). The MCP bridge (WebSocket relay to local/cloud MCP servers, including an `EXECUTE_CODE` escape hatch) is currently compiled into the same `dist/code.js` + `dist/ui.html` and gated only by `manifest.dev.json`'s network permissions plus a settings toggle.

Two problems:

1. **Distribution.** Teammates want the bridge, but the only way to get it today is the developer loop (`npm run dev` + import `manifest.dev.json`). We want to hand teammates a prebuilt, minified package they import directly (no repo, no npm).
2. **Review sensitivity.** Folding a remote-control bridge into an already-approved plugin risks re-review. The strongest mitigation is a published artifact that provably contains no bridge code at all.

The naive "hide the UI" or `NODE_ENV` approach fails: the teammate package is itself a minified/production build, so a `NODE_ENV`-based flag would hide the bridge in exactly the build that needs it. We need a discriminator independent of minification, and we need the bridge genuinely absent from the community artifact — not merely inert.

## Solution

One env var (`STRATUSHUE_BRIDGE`) drives an esbuild `define` (`__BRIDGE__`) that flavors three things:

1. **JS** — bridge modules tree-shaken out of the community bundle via dead-code elimination.
2. **HTML** — bridge markup stripped from the community `ui.html`.
3. **Manifest** — community stays `networkAccess: none`; team gets localhost + cloud-relay access.

Both flavors build from one source; the community flavor remains the default everywhere it already is. A post-build assertion guarantees no bridge bytes survive in the community artifact.

## Design

### Build flag & flavors

`esbuild.config.js` reads the env var and injects a `define` into **both** the `code.ts` and `ui.ts` builds:

```js
const bridgeEnabled = process.env.STRATUSHUE_BRIDGE === '1';
// in each esbuild.build()/esbuild.context() call:
define: { __BRIDGE__: JSON.stringify(bridgeEnabled) }
```

`__BRIDGE__` is declared as an ambient global in `src/types/build-flags.d.ts`:

```typescript
declare const __BRIDGE__: boolean;
```

This file is added to the `include` globs of both `tsconfig.json` and `tsconfig.ui.json` so the constant type-checks on both sides.

**Key property:** `__BRIDGE__` is independent of `NODE_ENV`, so the team flavor is still fully minified via `build:prod`'s existing `NODE_ENV=production`.

New/changed npm scripts (community remains the default target):

| Script | `STRATUSHUE_BRIDGE` | Manifest | Output |
|---|---|---|---|
| `build` / `build:prod` | off | community | published, no bridge |
| `build:team` | `1` | team | team build (minified) |
| `pkg` / `ship` | off | community | Community zip (unchanged) |
| `pkg:team` | `1` | team | teammate zip |

`build:team` = set `STRATUSHUE_BRIDGE=1` + swap in the team manifest, then run the prod build. `cross-env` is already a dependency and is used for cross-platform env vars.

### JS compile-out (core move)

Today bridge logic is scattered: `code.ts` has `installConsoleBridge()` (runs unconditionally at module load), three bridge event sends in the selection/document/page handlers, and ~30 `bridge-set-*` / `bridge-cmd-*` / `bridge-connected|disconnected` `case` branches plus a `bridge-cmd-*` fallback in `default`. `ui.ts` has 7 `bridge-*` message cases. Scattering `if (__BRIDGE__)` guards across all of these is fragile — one missed guard leaks bridge code into the community bundle.

Instead, **centralize dispatch behind a single guarded entry on each side.** This is both what makes DCE robust and a net isolation improvement.

**Sandbox (`code.ts` → new `src/features/bridge/bridge-dispatch.ts`):**

- Move all `bridge-*` `case` bodies into `handleBridgeMessage(msg): Promise<boolean>` in the new module (returns whether it handled the message). This module owns the lazy `import('./bridge-handlers')` calls that already exist per-command.
- In `figma.ui.onmessage`, before the main switch:

```typescript
if (__BRIDGE__ && typeof msg.type === 'string' && msg.type.startsWith('bridge')) {
  if (await handleBridgeMessage(msg)) return;
}
```

- Guard `installConsoleBridge()` and its invocation, and each of the three bridge event sends (`sendBridgeSelectionEvent`, `sendBridgeDocumentEvent`, `sendBridgePageEvent`, `sendBridgeFileInfo`) plus the `bridge-init`/file-info sends, each behind `if (__BRIDGE__)`.
- The bridge event-sender functions are static imports from `ui-communication.ts`. Once all their call sites are behind `if (__BRIDGE__)` (false), esbuild drops the now-unreferenced exports; the rest of `ui-communication.ts` (non-bridge exports) stays.

**UI (`ui.ts` → new `src/ui/bridge/bridge-dispatch-ui.ts`):**

- Move the 7 `bridge-*` cases (`bridge-init`, `bridge-file-info`, `BRIDGE_RESPONSE`, `bridge-console-log`, `bridge-selection-change`, `bridge-document-change`, `bridge-page-change`) into `handleBridgeUIMessage(message): boolean` in the new module, preserving the existing lazy `import()` of `bridge-ui` / `bridge-client`.
- In the `window` message handler, guard with:

```typescript
if (__BRIDGE__ && handleBridgeUIMessage(message)) return;
```

**DCE outcome:** with `__BRIDGE__ = false`, esbuild evaluates the guards as `if (false)`, removes the branches, and — because `bridge-dispatch.ts`, `bridge-dispatch-ui.ts`, `bridge-handlers.ts`, `bridge-client.ts`, and `bridge-ui.ts` are then referenced by nothing — omits them from the bundle entirely. Community artifact = zero bridge bytes.

### HTML strip

The bridge markup is static in `src/ui.html`: the settings block (`#bridge-settings-section`) and the footer status dots (`#bridge-status-dots`). JS DCE does not touch HTML, so `esbuild.config.js` strips these when `__BRIDGE__` is off.

To keep the strip simple and unambiguous, wrap each block in sentinel comments in `src/ui.html`:

```html
<!-- BRIDGE:START -->
... bridge markup ...
<!-- BRIDGE:END -->
```

In `esbuild.config.js`, after reading `src/ui.html` and before inlining CSS/JS/assets, if `!bridgeEnabled`:

```js
htmlContent = htmlContent.replace(/<!-- BRIDGE:START -->[\s\S]*?<!-- BRIDGE:END -->/g, '');
```

When `__BRIDGE__` is on, the sentinels are harmless HTML comments (the build may optionally strip the comment markers themselves, but it is not required).

### Manifests & packaging

- **`manifest.prod.json`** (community) — unchanged: `networkAccess: { allowedDomains: ["none"] }`, name `stratusHue`, `capabilities: []`.
- **`manifest.team.json`** (new) — name `stratusHue (MCP)`; the localhost `9223–9232` (ws/http) + `wss://figma-console-mcp.southleft.com` / `https://figma-console-mcp.southleft.com` `networkAccess` block currently in `manifest.dev.json`; `capabilities: ["inspect"]`. Same plugin `id` as prod is acceptable — dev/team imports live under Figma's Development section, separate from the Community install.
- **`manifest.dev.json`** — retained unchanged for the maintainer's own `npm run dev` loop.
- **`scripts/build-plugin-ready.js`** — currently writes a hardcoded inline community manifest. It will branch on `process.env.STRATUSHUE_BRIDGE`: emit the team manifest (network access + `stratusHue (MCP)` name) for `pkg:team`, and the existing community manifest otherwise. For the team package it also writes a short teammate README: how to import via **Plugins → Development → Import plugin from manifest**, and how to enable the Bridge toggle in Settings.

### Verification

**Build assertion (community path).** After the community build, a post-build step scans `dist/code.js` and `dist/ui.html` for bridge markers (e.g. `/bridge-cmd-/`, `BRIDGE_RESPONSE`, `figma-console-mcp`, `new WebSocket`) and fails the build if any survive. This is the hard guarantee that a missed guard cannot silently ship bridge code to Community. Runs automatically in `build:prod` / `pkg` / `ship`.

**Tests.**
- Existing `src/test/smoke-dispatch.test.ts` bridge coverage runs under the team flavor. Vitest config sets `define: { __BRIDGE__: true }` (or a global) so bridge dispatch is present during tests.
- Add one community-flavor assertion (separate describe or a toggled global) verifying that when `__BRIDGE__` is false, a `bridge-*` message is treated as unknown and does not crash.

**Manual (per repo functional-testing rule).** Spot-check both flavors in real Figma:
- Community: no Bridge section in Settings, no footer dots, `networkAccess: none`, all navigate/validate/scaffold features intact.
- Team: Bridge toggle present, enabling it connects to a local MCP server and (optionally) the cloud relay.

### File Changes

| File | Change |
|---|---|
| `esbuild.config.js` | Read `STRATUSHUE_BRIDGE`; inject `__BRIDGE__` define into both builds; strip `BRIDGE:START/END` HTML block when off; community build assertion |
| `src/types/build-flags.d.ts` | New — `declare const __BRIDGE__: boolean;` |
| `tsconfig.json`, `tsconfig.ui.json` | Include the new ambient type file |
| `src/code.ts` | Guard `installConsoleBridge()` + event sends behind `__BRIDGE__`; route `bridge-*` messages through `handleBridgeMessage`; remove inline bridge cases |
| `src/features/bridge/bridge-dispatch.ts` | New — `handleBridgeMessage(msg)`, owns lazy handler imports |
| `src/ui.ts` | Guard bridge message routing behind `__BRIDGE__` via `handleBridgeUIMessage` |
| `src/ui/bridge/bridge-dispatch-ui.ts` | New — `handleBridgeUIMessage(message)`, owns lazy bridge-ui/client imports |
| `src/ui.html` | Wrap `#bridge-settings-section` and `#bridge-status-dots` in `BRIDGE:START/END` sentinels |
| `manifest.team.json` | New — team manifest (`stratusHue (MCP)`, bridge network access, inspect) |
| `scripts/build-plugin-ready.js` | Branch manifest + README on `STRATUSHUE_BRIDGE` |
| `package.json` | Add `build:team`, `pkg:team`; wire community build assertion |
| `src/test/smoke-dispatch.test.ts` + vitest config | Define `__BRIDGE__` for tests; add community-flavor unknown-message assertion |

## Out of Scope

- **Developer dev-import convenience (option A).** A later follow-up may add a first-class way for teammates to run from source; this spec covers the prebuilt-package path (option B).
- **Publishing the team build as an AT&T org-private plugin.** Not pursued here; distribution is a hand-delivered zip.
- **Runtime prod/team detection.** Explicitly rejected — cannot deliver compile-out.
- **Changing the bridge's own feature set** (command coverage, cloud relay behavior). Unchanged; this is purely a build/packaging/isolation change.
- **Removing `manifest.dev.json`.** Retained for the maintainer's local loop.
