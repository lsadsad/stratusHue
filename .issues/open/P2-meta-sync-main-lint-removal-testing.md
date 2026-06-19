---
id: sync
category: meta
title: "Sync main with lint removal and testing gates"
type: task
priority: 2
status: open
depends_on: []
created: 2026-06-06
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
