---
id: sync
category: meta
title: "Sync main with lint removal and testing gates"
type: task
priority: 2
status: closed
depends_on: []
created: 2026-06-06
closed: 2026-09-06
---

`feature/desktop-bridge-dev` has unmerged work beyond date tagger:

- Validate/Design Lint subsystem removed (navigate-only UI)
- Playwright prototype tests + `validate:full`
- `settings-ui.test.ts`, prototype sync fix, bridge status-dots toggle fix
- Project MCP wrapper for figma-studio

Cherry-pick or merge to `main` so both product lines match. Run `npm run validate:full` and Figma spot-check (`docs/testing/spot-check.md`) on `main` after sync.

⚠️ **Manifest caveat (from `crd`):** this branch's `manifest.json` is the **dev** manifest
(relay domains whitelisted, `enablePrivatePluginApi`, inspect). Do **NOT** carry it to `main`
— `main` must keep the locked-down prod manifest (`networkAccess: { allowedDomains: ["none"] }`).
When merging, exclude `manifest.json` (the bridge cloud-relay work in `b492a0d`/`f6d230d`/`3ad4115`
is dev-only and dormant without network permission).

## Resolution (2026-09-06)

Merged `feature/desktop-bridge-dev` → `main` with `--no-ff` (commit `8a4cad0`), 42 commits.
`manifest.json` was restored from `main` inside the merge, so the locked-down prod manifest
(`networkAccess: { allowedDomains: ["none"] }`, no `inspect`, no `enablePrivatePluginApi`)
survives the sync. `git diff main feature/desktop-bridge-dev` is now `manifest.json` only.

Gates on the merged tree: `type-check` clean, `eslint` 0 errors (1 pre-existing
dynamic-page warning), `build` OK, `vitest` 343/343 passing.

Remaining: Figma spot-check on `main` (`docs/testing/spot-check.md`) and the Playwright
`validate:full` pass — not run in this session.
