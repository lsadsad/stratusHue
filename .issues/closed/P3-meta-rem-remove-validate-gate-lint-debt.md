---
id: rem
category: meta
title: "Remove `validate` gate and clear pre-existing lint debt"
type: task
priority: 3
status: closed
depends_on: []
created: 2026-06-06
---

## Problem (as filed)

`npm run validate` was failing on pre-existing lint errors unrelated to the bridge work: `no-inner-declarations` on `extractComponentData` / `serializeNode` in `src/features/bridge/bridge-handlers.ts`, and unused `headerActionButtons` in `src/ui/navigate/navigate-ui.ts`.

## Resolution — superseded by the navigate-only merge

Closed immediately on filing: the `origin/main` "Remove Validate mode → navigate-only" merge already handled this.

- **Lint debt fixed** — eslint now reports 0 of those errors.
- **Validate *mode* removed** product-wide (navigate-only); `plugin-mode.ts` migrates stored `'lint'` → `'navigate'`.
- The `npm run validate` / `validate:full` **gates are kept and expanded** (not removed) — see `.memory/2026-06-06-lint-removal-testing-bridge-qa.md`.

Filed without knowledge of that merge during session wrap-up, then reconciled and closed.
