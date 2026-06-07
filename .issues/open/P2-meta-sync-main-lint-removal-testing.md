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
