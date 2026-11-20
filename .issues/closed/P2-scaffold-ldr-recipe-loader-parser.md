---
id: ldr
category: scaffold
title: "Sandbox: recipe loader and parser"
type: task
priority: 2
status: closed
depends_on: []
created: 2026-03-21
---

Sandbox-side module that loads a recipe JSON (from clientStorage or file import), validates its structure, and exposes typed recipe data to the Scaffold feature module. Handles versioning/schema migration if recipe format evolves.

## Folded — 2026-11-20

Folded into `scf` in the 2026-11-20 backlog review (ruled by Levin 2026-11-20: "Take all 123"). `scf` carries the open work; this body stays as the record.

Evidence, from the review: Never built (no recipe loader under `src/`; `git grep -i recipe origin/main -- src` finds only the placeholder comment). One-paragraph task; carry as a box on `scf`.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
