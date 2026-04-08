---
id: pgs
category: scaffold
title: "TSK — Create pages from recipe"
type: task
priority: 2
status: open
depends_on:
  - ldr
created: 2026-03-21T00:00:00.000Z
---

Feature module (src/features/scaffold-engine.ts) that creates Figma pages from recipe layer ①: correct page order, emoji prefixes, page dividers (separator pages). Idempotent — detect if pages already exist and skip or update rather than duplicate.
