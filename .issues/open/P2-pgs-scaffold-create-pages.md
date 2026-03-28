---
id: pgs
title: "Sandbox: create pages and structure from recipe (layer ①)"
type: task
priority: 2
status: open
depends_on: [ldr]
created: 2026-03-21
---

Feature module (src/features/scaffold-engine.ts) that creates Figma pages from recipe layer ①: correct page order, emoji prefixes, page dividers (separator pages). Idempotent — detect if pages already exist and skip or update rather than duplicate.
