---
id: sch
category: scaffold
title: "Design recipe JSON schema (layers ①②)"
type: task
priority: 3
status: open
depends_on: []
created: 2026-03-21
branch: claude/backlog-lower-1120
---

Define the recipe JSON format that Scaffold reads. Must cover: layer ① structure (pages, order, emoji prefixes, dividers) and layer ② content (starter frames, section containers, text nodes, variable placeholders with naming convention). Schema must be designed for future extension to layers ③④⑤ (annotations, tokens, components). Variable naming convention must be tool-agnostic so a future content interface can read it. Document in docs/features/specs/scaffoldMode.md.

## Lowered to P3 — 2026-11-20

Lowered from P2 to P3 in the 2026-11-20 backlog review. Ruled by Levin 2026-11-20: "Yes", to the question "Lower the 14 medium-priority tickets the review proposed to low?" The ticket stays open; nobody is waiting on it.

Evidence, from the review: Partly started: `docs/features/recipes/product-design-full.recipe.json` is a `0.1.0-draft`, and the roadmap lists four open questions "must resolve before speccing". It is the blocker for `cmp`, `rdy`, `tkn`; no edit since 04-01.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
