---
id: stk
category: navigate
title: FTR — Bidirectional sticky section headers
type: feature
priority: 2
status: closed
depends_on: []
created: 2026-03-27
---

# Bidirectional sticky section headers

JS-driven sticky headers for Navigate mode. Headers pin to the top when scrolled past and pin to the bottom when pushed below the visible area. Stacking at both edges.

CSS `position: sticky` is unsupported in Figma's plugin iframe — implemented via scroll listener with `translateY` transforms (GPU compositor, no reflow).

Also includes: header title + action icons reveal brand color on hover.
