---
id: pth
category: scaffold
title: Add pathing characters to file tree anchors
type: feature
priority: 3
status: open
depends_on: []
created: '2026-03-29'
branch: claude/backlog-lower-1120
---

Add tree-drawing characters (box-drawing Unicode) to the file tree anchors so they visually represent hierarchy:

```
├── 📄 index.js
│   ├── 📄 app.js
│   └── 📄 utils.js
```

Instead of flat lists, the anchors should render with `├──`, `│`, and `└──` connectors to show parent-child relationships at a glance.

## Lowered to P3 — 2026-11-20

Lowered from P2 to P3 in the 2026-11-20 backlog review. Ruled by Levin 2026-11-20: "Yes", to the question "Lower the 14 medium-priority tickets the review proposed to low?" The ticket stays open; nobody is waiting on it.

Evidence, from the review: Not built: no box-drawing characters in `src/` outside `src/test/manual-testing-scenarios.md`. It is filed under scaffold but is an Anchors change; nobody has asked since 03-29.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
