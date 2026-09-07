---
id: rdy
category: validate
title: "Readiness Check: full recipe audit (recipe diff)"
type: feature
priority: 3
status: open
depends_on: [sch]
created: 2026-03-21
---

Full handoff readiness check that diffs the current Figma file state against the applied recipe. Checks all five layers: ① structure (required pages present), ② content (variables filled and approved), ③ annotations (required categories per page), ④ token thresholds met, ⑤ component compliance. Produces a pass/fail readiness report.

## Status note (2026-09-06)

There is no Validate mode to extend. The Design Lint subsystem shipped under the Validate
tab was removed in `704ea67` (navigate-only product) — `src/ui/lint/`, `src/features/lint-*.ts`
and `src/core/lint-*.ts` are gone, and `src/ui.html` has no mode strip.

This issue is unaffected in substance: it always described a **recipe-driven** check, not an
extension of the removed lint engine. It stays open as roadmap, blocked on the recipe schema
(`sch`). Building it means standing up a validate surface from scratch, not re-enabling a tab.
