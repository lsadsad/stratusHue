---
id: bfl
category: meta
title: "MCP bridge compile-out with two build flavors"
type: feature
priority: 2
status: open
depends_on: []
created: 2026-07-13
---

Ship the MCP bridge to teammates without changing the AT&T-approved / Community stratusHue build — by producing two flavors from one source: a community flavor with **zero** bridge code, and a team flavor with the bridge enabled.

## Motivation

stratusHue is on AT&T's allowed-plugins list as a locked-down plugin (`networkAccess: none`). The MCP bridge (WebSocket relay to local/cloud MCP servers, including an `EXECUTE_CODE` escape hatch) is currently compiled into the same bundle and gated only by `manifest.dev.json`'s network permissions plus a settings toggle — not usable by teammates without the full dev/npm setup.

Teammates need a prebuilt, minified package they can import directly (no repo, no npm). The strongest AT&T review story is a published artifact that provably contains no bridge code at all, not merely one where it's inert.

Full design: [`docs/superpowers/specs/2026-07-10-mcp-bridge-compile-out-design.md`](../../docs/superpowers/specs/2026-07-10-mcp-bridge-compile-out-design.md)

## Scope

- [ ] `esbuild.config.js` — read `STRATUSHUE_BRIDGE` env var, inject `__BRIDGE__` define into both `code.ts`/`ui.ts` builds, strip `<!-- BRIDGE:START/END -->` HTML block when off, add community build assertion (grep `dist/code.js`/`dist/ui.html` for bridge markers, fail build if found)
- [ ] `src/types/build-flags.d.ts` — new ambient `declare const __BRIDGE__: boolean;`, included in both tsconfigs
- [ ] `src/features/bridge/bridge-dispatch.ts` — new; centralizes sandbox-side `handleBridgeMessage(msg)`, owns lazy handler imports
- [ ] `src/code.ts` — guard `installConsoleBridge()` + bridge event sends + `bridge-*` message routing behind `__BRIDGE__`; remove scattered inline bridge cases
- [ ] `src/ui/bridge/bridge-dispatch-ui.ts` — new; centralizes UI-side `handleBridgeUIMessage(message)`
- [ ] `src/ui.ts` — guard bridge message routing behind `__BRIDGE__` via `handleBridgeUIMessage`
- [ ] `src/ui.html` — wrap `#bridge-settings-section` and `#bridge-status-dots` in `BRIDGE:START`/`BRIDGE:END` sentinel comments
- [ ] `manifest.team.json` — new team manifest (`stratusHue (MCP)` name, bridge `networkAccess`, `capabilities: ["inspect"]`)
- [ ] `scripts/build-plugin-ready.js` — branch manifest + write teammate README based on `STRATUSHUE_BRIDGE`
- [ ] `package.json` — add `build:team`, `pkg:team` scripts
- [ ] `src/test/smoke-dispatch.test.ts` + vitest config — define `__BRIDGE__` for tests; add community-flavor "unknown bridge message doesn't crash" assertion
- [ ] `CLAUDE.md` — add a "Bridge & Build Flavors" subsection (+ `Commands` table entries for `build:team`/`pkg:team`) so future AI sessions can discover the two-flavor mechanism without grepping source or `.issues/closed/`
- [ ] Manual Figma spot-check both flavors (community: no Bridge UI, `networkAccess: none`; team: toggle works, MCP connects)

## Out of scope

- Developer dev-import convenience for teammates (option A / future follow-up)
- Publishing the team build as an AT&T org-private plugin
- Runtime prod/team detection (rejected — can't deliver compile-out)
- Changing the bridge's own feature set (command coverage, cloud relay behavior)
- Removing `manifest.dev.json`
