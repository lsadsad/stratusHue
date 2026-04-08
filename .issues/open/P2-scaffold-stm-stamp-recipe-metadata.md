---
id: stm
category: scaffold
title: "TSK — Stamp recipe metadata"
type: task
priority: 2
status: open
depends_on:
  - sch
created: 2026-03-21T00:00:00.000Z
---

After Scaffold applies a recipe, write recipe metadata to figma.root.setPluginData: recipe ID, version, timestamp, applied-by. This stamp is what Validate reads to know which recipe to diff against. Define the stamp schema alongside the recipe schema.
