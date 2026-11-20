---
id: stm
category: scaffold
title: "Sandbox: stamp recipe to file (recipe metadata)"
type: task
priority: 2
status: closed
depends_on: [sch]
created: 2026-03-21
---

After Scaffold applies a recipe, write recipe metadata to figma.root.setPluginData: recipe ID, version, timestamp, applied-by. This stamp is what Validate reads to know which recipe to diff against. Define the stamp schema alongside the recipe schema.

## Folded — 2026-11-20

Folded into `scf` in the 2026-11-20 backlog review (ruled by Levin 2026-11-20: "Take all 123"). `scf` carries the open work; this body stays as the record.

Evidence, from the review: No `setPluginData` recipe stamp in `src/` (`git grep -i recipe origin/main -- src`). One-paragraph task; carry as a box on `scf`.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
