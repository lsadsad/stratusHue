---
id: ldr
category: scaffold
title: TSK — Recipe loader and parser
type: task
priority: 2
status: open
depends_on: [sch]
created: 2026-03-21
---

Sandbox-side module that loads a recipe JSON (from clientStorage or file import), validates its structure, and exposes typed recipe data to the Scaffold feature module. Handles versioning/schema migration if recipe format evolves.
