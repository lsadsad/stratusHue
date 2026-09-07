---
id: btg
category: meta
title: "Bridge toggle ships visible but non-functional in the Community build"
type: bug
priority: 1
status: closed
depends_on: []
created: 2026-09-07
closed: 2026-09-07
---

## Problem

`#bridge-settings-section` in `src/ui.html` has no `hidden` attribute and nothing in TypeScript
hides it. `updateToggleUI()` only hides the cloud sub-section and the footer status dots. So the
prod build — the AT&T-approved / Figma Community one — renders a **🔌 Bridge / Enable MCP bridge**
row in Settings.

The sandbox sends `bridge-init` on every load, so `initBridgeUI()` runs and the toggle is fully
wired. A user flips it, `setBridgeEnabled(true)` calls `initBridgeClient()`, which opens WebSockets
to `ws://localhost:9223-9232`. `manifest.prod.json` declares `networkAccess: { allowedDomains:
["none"] }`, so Figma blocks every one. The dots appear and sit at "disconnected" forever.

Net effect for a Community user: a settings control that looks functional, does nothing, and
offers no explanation.

## Why it matters now

This blocks the v1.6.0 release. It is the first Community release cut from `main` since the bridge
landed, so it is the first build in which a public user would see this row.

## Options

1. **Hide it at runtime** — gate `#bridge-settings-section` and `#bridge-status-dots` on a build or
   capability signal. Smallest change, ships now, but the bridge code is still in the bundle.
2. **Compile it out** — the `__BRIDGE__` build flag from `bfl`. Correct long-term answer and gives
   the strongest AT&T review story ("provably absent", not "inert"), but it is a larger change than
   a release should carry.

Recommend option 1 for v1.6.0 and keep `bfl` as the real fix.

## Related

- `bfl` — MCP bridge compile-out with two build flavors
- `CLAUDE.md` § MCP Bridge Subsystem → Bridge & Build Flavors documents why the runtime toggle alone
  is not a sufficient gate

## Resolution (2026-09-07) — option 1, runtime hide behind a build flag

- `esbuild.config.js` defines `__BRIDGE_UI__` as `process.env.NODE_ENV !== 'production'` for both
  the sandbox and UI bundles.
- `src/types/build-flags.d.ts` declares it; `vitest.config.ts` mirrors it as `true`.
- `applyBridgeUIVisibility(enabled)` in `bridge-ui.ts` hides `#bridge-settings-section` and
  `#bridge-status-dots`. `initBridgeUI()` calls it with the flag and returns early when false, so
  no handlers are wired in a prod build.

Verified by building both flavors and driving each `dist/ui.html` with a real `bridge-init`
message in the Figma envelope:

| build | `#bridge-settings-section` | `#bridge-status-dots` |
|---|---|---|
| prod (`NODE_ENV=production`) | hidden | hidden |
| dev (`npm run build`) | visible | hidden (bridge off — correct) |

Three unit tests in `src/test/bridge-ui.test.ts` cover the gate, including the no-markup case.

Note the bridge code is still in the bundle — this hides the controls, it does not compile the
bridge out. `bfl` remains the real fix and supersedes `__BRIDGE_UI__`.
