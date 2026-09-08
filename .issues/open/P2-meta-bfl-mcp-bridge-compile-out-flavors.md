---
id: bfl
category: meta
title: "MCP bridge compile-out with two build flavors"
type: epic
priority: 2
status: open
depends_on: []
created: 2026-07-13
surface: laptop
---

Ship the MCP bridge to teammates without changing the AT&T-approved / Community stratusHue build — by producing two flavors from one source: a community flavor with **zero** bridge code, and a team flavor with the bridge enabled.

## Motivation

stratusHue is on AT&T's allowed-plugins list as a locked-down plugin (`networkAccess: none`). The MCP bridge (WebSocket relay to local/cloud MCP servers, including an `EXECUTE_CODE` escape hatch) is currently compiled into the same bundle and gated only by manifest network permissions plus a settings toggle. Teammates need a prebuilt, minified package they can import directly (no repo, no npm). The strongest AT&T review story is a published artifact that provably contains no bridge code at all, not merely one where it's inert.

Full design: [`docs/superpowers/specs/2026-07-10-mcp-bridge-compile-out-design.md`](../../docs/superpowers/specs/2026-07-10-mcp-bridge-compile-out-design.md)

## ⚠️ `__BRIDGE_UI__` blocks the team flavor — delete it, don't layer on it

`btg` (closed 2026-09-07) shipped an interim gate: `__BRIDGE_UI__`, an esbuild define set to `NODE_ENV !== 'production'`, which hides `#bridge-settings-section` and `#bridge-status-dots` and makes `initBridgeUI()` return early.

It fixed the real bug — the Community build shipped a bridge toggle that looked functional and did nothing — but it uses the exact discriminator this epic's spec rejects by name:

> "The naive 'hide the UI' or `NODE_ENV` approach fails: the teammate package is itself a minified/production build, so a `NODE_ENV`-based flag would hide the bridge in exactly the build that needs it."

`__BRIDGE_UI__` is correct for today's two cases (community prod vs. the maintainer's `npm run dev` loop) but it **actively blocks the team-distribution half of this epic**: `build:team` is a minified production build, so `NODE_ENV=production` would hide the bridge UI in the one build that needs it.

`__BRIDGE__` (this epic) must **replace** `__BRIDGE_UI__`, not coexist with it. Two flags with overlapping meaning and different discriminators is how this gets confusing. Phase 1 removes it.

---

## 1. Discovery

- [x] Re-read the spec end to end; confirm the approved design still matches the current source (bridge surface has grown since 2026-07-10 — ~35 `bridge-cmd-*` cases now)
- [x] Inventory bridge import shape — 42 dynamic `import('…bridge…')` call sites; exactly **one** static chain (see findings)
- [x] Confirm esbuild DCE actually drops an unreferenced dynamically-imported module — **spiked 2026-09-08, holds in every case tested**

### Discovery findings (2026-09-08) — DCE spike

The "zero bridge bytes" guarantee holds. Spiked against `esbuild --bundle --format=cjs --platform=neutral --target=es2017` (matching the real `code.ts` build) with `--define:__BRIDGE__=false|true`.

| Case tested | `__BRIDGE__=false` | `__BRIDGE__=true` |
|---|---|---|
| Module reached only via `await import()` inside a dead guard | dropped | present |
| Transitive: dead dispatch module → its own lazy import | both dropped | both present |
| Module with **top-level side effects** (`console.log`, module-scope consts) | dropped | present |
| Non-minified build (`npm run build`, no `NODE_ENV`) | dropped | present |
| Mixed module — bridge export dead, normal export live | bridge export dropped, normal kept | both present |
| Static chain `entry → comms → file-info`, bridge export dead | whole chain dropped incl. `PLUGIN_VERSION` | present |

Two results worth noting because they were the actual risks:

1. **Top-level side effects do not pin a module.** esbuild drops a dynamically-imported module wholesale when its only import site is dead code, side effects included. This was the most likely way the guarantee could have failed.
2. **DCE does not depend on minification.** It works in the plain `npm run build` too, so the post-build assertion can run on both flavors rather than only `build:prod`.

**The one static chain to watch:** `code.ts` statically imports `sendBridgeSelectionEvent` / `sendBridgeDocumentEvent` / `sendBridgePageEvent` / `sendBridgeFileInfo` from `ui-communication.ts`, which in turn statically imports `buildFileInfo` from `features/bridge/file-info.ts`. Spiked that exact shape — it drops cleanly once all four call sites are behind `if (__BRIDGE__)`. Everything else is already lazy.

Caveat: `PLUGIN_VERSION` lives in `file-info.ts` and gets dropped with it. Harmless today (nothing outside the bridge reads it) but if anything non-bridge ever needs the version, move the constant out rather than reaching back into a bridge module.

## 2. Build flag foundations

- [x] `src/types/build-flags.d.ts` — replace `__BRIDGE_UI__` with `declare const __BRIDGE__: boolean;`
- [x] `tsconfig.json` + `tsconfig.ui.json` — confirm the ambient file is in both `include` globs
- [x] `esbuild.config.js` — read `STRATUSHUE_BRIDGE`, inject `__BRIDGE__` into both builds, drop the `__BRIDGE_UI__` define
- [x] `vitest.config.ts` — swap the `__BRIDGE_UI__` define for `__BRIDGE__: 'true'`
- [x] Remove `applyBridgeUIVisibility()` and its early return from `bridge-ui.ts`; retire the three `btg` tests that cover it (the HTML strip in Phase 4 makes them meaningless — the markup won't exist)

## 3. Dispatch centralization (the core move)

- [x] `src/features/bridge/bridge-dispatch.ts` — new; `handleBridgeMessage(msg): Promise<boolean>`, owns the lazy `import('./bridge-handlers')` calls
- [x] `src/code.ts` — route `bridge-*` through a single `if (__BRIDGE__ && …)` guard before the main switch; remove all inline bridge cases
- [x] `src/code.ts` — guard `installConsoleBridge()`, its invocation, and the `sendBridge*` event sends behind `__BRIDGE__`
- [x] `src/ui/bridge/bridge-dispatch-ui.ts` — new; `handleBridgeUIMessage(message): boolean`, preserving the existing lazy imports
- [x] `src/ui.ts` — guard bridge routing behind one `if (__BRIDGE__ && handleBridgeUIMessage(message)) return;`

## 4. HTML and manifest flavoring

- [x] `src/ui.html` — wrap `#bridge-settings-section` and `#bridge-status-dots` in `<!-- BRIDGE:START -->` / `<!-- BRIDGE:END -->` sentinels
- [x] `esbuild.config.js` — strip the sentinel blocks when `__BRIDGE__` is off, before CSS/JS/asset inlining
- [x] `manifest.team.json` — new; name `stratusHue (MCP)`, bridge `networkAccess`, `capabilities: ["inspect"]`
- [x] Confirm `manifest.prod.json` is untouched and `manifest.dev.json` is retained for the maintainer's `npm run dev` loop

## 5. Packaging

- [x] `scripts/build-plugin-ready.js` — branch manifest on `STRATUSHUE_BRIDGE`; write the teammate README (import via Plugins → Development → Import plugin from manifest; enable the Bridge toggle in Settings)
- [x] `package.json` — add `build:team` and `pkg:team`; confirm `build` / `build:prod` / `pkg` / `ship` stay community-default

## 6. Verification gate

- [x] Post-build assertion — scan `dist/code.js` and `dist/ui.html` for `bridge-cmd-`, `BRIDGE_RESPONSE`, `figma-console-mcp`, `new WebSocket`; **fail the build** if any survive. Wire into `build:prod` / `pkg` / `ship`
- [x] Dispatch-contract tests — 5 new in `src/test/bridge-dispatch.test.ts` covering handled/unhandled, the unsupported-command error reply, and the no-requestId case. **Deviation:** a `__BRIDGE__ = false` *unit* test would need a second vitest project, since `define` substitutes at transform time. The build assertion covers that guarantee more strongly and is proven to fail — see below.
- [x] `npm run validate:full` green on both flavors

## 7. Docs and handoff

- [x] `CLAUDE.md` — rewrite the existing *Bridge & Build Flavors* subsection: it currently documents three gates including `__BRIDGE_UI__`, which this epic deletes. Add `build:team` / `pkg:team` to the Commands table
- [x] Update `btg` (in `.issues/closed/`) with a line noting `__BRIDGE_UI__` was superseded and removed here

## Human touchpoints

Only these need Levin; everything else is delegable.

- [ ] **TOUCHPOINT — Community flavor spot-check in Figma:** no Bridge section in Settings, no footer dots, `networkAccess: none`, navigate features intact
- [ ] **TOUCHPOINT — Team flavor spot-check in Figma:** Bridge toggle present, enabling it connects to a local MCP server and (optionally) the cloud relay
- [ ] **TOUCHPOINT — Distribute the team zip** to one teammate and confirm a clean import with no repo and no npm

## Done when

- A community build contains **zero** bridge bytes — the post-build assertion passes, and grepping `dist/` for the four markers returns nothing
- A team build is fully minified (`NODE_ENV=production`) **and** has a working bridge — proving the flag is independent of `NODE_ENV`
- `__BRIDGE_UI__` appears nowhere in the source
- A teammate imports the zip and connects to an MCP server without cloning the repo

## Out of scope

- Developer dev-import convenience for teammates (option A / future follow-up)
- Publishing the team build as an AT&T org-private plugin
- Runtime prod/team detection (rejected — can't deliver compile-out)
- Changing the bridge's own feature set (command coverage, cloud relay behavior)
- Removing `manifest.dev.json`

---

## Execution log (2026-09-08)

Phases 1-7 implemented and verified. **Community build: 95,436 bytes. Team build: 124,711.** ~29KB of bridge code compiled out, all five markers absent.

| Marker | Community | Team |
|---|---|---|
| `bridge-cmd-` | 0 | 2 |
| `BRIDGE_RESPONSE` | 0 | 2 |
| `figma-console-mcp` | 0 | 1 |
| `new WebSocket` | 0 | 1 |
| `bridge-settings-section` (HTML) | 0 | 1 |

**The assertion is proven to fail.** Removed the `__BRIDGE__` guard from the dispatch entry, rebuilt, and the build exited 1 naming `bridge-cmd-` and `BRIDGE_RESPONSE` in `dist/code.js`. Restored, and it passes again. An assertion that has never failed is not evidence.

`npm run validate:full` exits 0. `npm run pkg` and `npm run pkg:team` both produce correct artifacts — community `stratusHue` / zero markers, team `stratusHue (MCP)` / bridge present / teammate README.

### Deviations from the plan

1. **`bridge-state.ts` was not in the plan.** `bridgeEnabled` was module state in `code.ts`, which `handleBridgeMessage` has to write. Rather than thread a setter through the dispatch signature, the flag moved into its own bridge module — so every reference to it also sits behind a guard and drops with the tree.
2. **`manifest.team.json` was pulled forward** from Phase 4 into Phase 2, because `build:team` referencing a non-existent file would have been a broken script in an intermediate commit.
3. **`sync:prototype` now builds the team flavor** (`STRATUSHUE_BRIDGE=1`). The prototype Playwright specs assert the bridge settings section is visible; against a community build they would have failed. The prototype is a dev harness, so the team flavor is the representative one.
4. **`applyBridgeUIVisibility()` was kept through Phase 2 and removed in Phase 4**, not removed in Phase 2 as written. Deleting it before the HTML strip existed would have re-opened `btg` — the markup would have been visible again in a community build. Every intermediate commit stays shippable.

### Still open

The three human touchpoints below. Everything else is done.
