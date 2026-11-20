---
id: pgs
category: scaffold
title: "Sandbox: create pages and structure from recipe (layer ①)"
type: task
priority: 2
status: closed
depends_on: [ldr]
created: 2026-03-21
---

Feature module (src/features/scaffold-engine.ts) that creates Figma pages from recipe layer ①: correct page order, emoji prefixes, page dividers (separator pages). Idempotent — detect if pages already exist and skip or update rather than duplicate.

## Folded — 2026-11-20

Folded into `scf` in the 2026-11-20 backlog review (ruled by Levin 2026-11-20: "Take all 123"). `scf` carries the open work; this body stays as the record.

Evidence, from the review: `src/features/scaffold-engine.ts`, the file it names, does not exist on `origin/main`. Carry as a box on `scf`.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
