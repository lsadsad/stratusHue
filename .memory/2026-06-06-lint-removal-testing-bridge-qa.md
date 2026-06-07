---
type: decision
tags: [validate, testing, bridge, navigate, meta]
created: 2026-06-06
---

# Validate removed; testing gates + bridge QA complete (dev branch)

## Decisions

- **Validate/Design Lint removed** from all product builds. UI is navigate-only; `plugin-mode.ts` migrates stored `'lint'` → `'navigate'`. Open `P3-validate-*` issues remain backlog — mode is gone, not deferred.
- **Quality gates expanded:** `test:critical` now includes `date-tagger`, `settings-ui`, `smoke-dispatch`. `validate:full` adds Playwright prototype tests (`npm run test:prototype:sync`).
- **Prototype sync anchor fixed:** `scripts/sync-prototype.js` must match `<main id="navigate-main" class="scrollable-content">` (not legacy mode-strip / bare main). Without `#plugin-chrome` opener, prototype layout collapses to zero width.
- **Bridge UI:** `updateToggleUI()` must show/hide `#bridge-status-dots` when toggle changes (not only on status ping).
- **Project MCP:** `.cursor/scripts/figma-console-mcp.sh` runs local `~/Documents/GitHub/figma-studio/dist/local.js`. Token stays out of git — set `FIGMA_ACCESS_TOKEN` in Cursor MCP env. stratusHue [dev] bridge replaces standalone Desktop Bridge plugin.

## Verified

- `npm run validate:full` — 218 unit + 5 Playwright tests pass
- Figma spot-check items 1–4 pass (navigate, date tagger, lint removed, bridge dots)
- WS errors on unused ports (e.g. 9231) are expected when bridge scans 9223–9232

## Remaining

- Mirror lint removal + testing infra to `main` (date tagger commits already on main; large lint/testing diff still on `feature/desktop-bridge-dev` only)
- Add `FIGMA_ACCESS_TOKEN` to stratusHue project MCP env if figma-console tools not visible after reload
