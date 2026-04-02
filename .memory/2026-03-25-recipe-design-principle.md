---
type: decision
tags: [recipe, scaffold, validate]
created: 2026-03-25
---

Recipe = rulebook (intent), Figma file = state. Never duplicate Figma-queryable data in recipe JSON. Recipe defines what SHOULD exist and what counts as done. Plugin queries Figma at runtime for what IS. Diff between the two produces the readiness report.
