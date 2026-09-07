---
id: cmp
category: validate
title: "Validate Phase 3: Component check (library compliance)"
type: feature
priority: 3
status: open
depends_on: [sch]
created: 2026-03-21
---

Add component check to Validate mode. Per-page audit of component instances: flag detached components, components from unapproved libraries, and outdated component versions. Compliance rules sourced from recipe layer ⑤.

## Status note (2026-09-06)

There is no Validate mode to extend. The Design Lint subsystem shipped under the Validate
tab was removed in `704ea67` (navigate-only product) — `src/ui/lint/`, `src/features/lint-*.ts`
and `src/core/lint-*.ts` are gone, and `src/ui.html` has no mode strip.

This issue is unaffected in substance: it always described a **recipe-driven** check, not an
extension of the removed lint engine. It stays open as roadmap, blocked on the recipe schema
(`sch`). Building it means standing up a validate surface from scratch, not re-enabling a tab.
