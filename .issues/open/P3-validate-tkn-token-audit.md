---
id: tkn
category: validate
title: "Validate Phase 2: Token audit (variable coverage)"
type: feature
priority: 3
status: open
depends_on: [sch]
created: 2026-03-21
---

Add token audit to Validate mode. Per-page scan of variable (token) coverage against recipe-defined thresholds (e.g. color ≥90%, spacing ≥80%, type ≥85%). Report coverage percentages and flag pages below threshold. Depends on recipe schema existing.

## Status note (2026-09-06)

There is no Validate mode to extend. The Design Lint subsystem shipped under the Validate
tab was removed in `704ea67` (navigate-only product) — `src/ui/lint/`, `src/features/lint-*.ts`
and `src/core/lint-*.ts` are gone, and `src/ui.html` has no mode strip.

This issue is unaffected in substance: it always described a **recipe-driven** check, not an
extension of the removed lint engine. It stays open as roadmap, blocked on the recipe schema
(`sch`). Building it means standing up a validate surface from scratch, not re-enabling a tab.
