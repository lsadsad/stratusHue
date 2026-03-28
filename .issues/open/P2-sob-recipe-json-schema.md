---
id: sob
title: "Design recipe JSON schema (layers ①②)"
type: task
priority: 1
status: open
depends_on: []
created: 2026-03-21
---

Define the recipe JSON format that Scaffold reads. Must cover: layer ① structure (pages, order, emoji prefixes, dividers) and layer ② content (starter frames, section containers, text nodes, variable placeholders with naming convention). Schema must be designed for future extension to layers ③④⑤ (annotations, tokens, components). Variable naming convention must be tool-agnostic so a future content interface can read it. Document in docs/features/SCAFFOLD_MODE.md.
