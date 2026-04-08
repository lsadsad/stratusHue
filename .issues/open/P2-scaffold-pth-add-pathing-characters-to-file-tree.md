---
id: pth
category: scaffold
title: "FTR — File tree pathing characters"
type: feature
priority: 2
status: open
depends_on: []
created: '2026-03-29'
---

Add tree-drawing characters (box-drawing Unicode) to the file tree anchors so they visually represent hierarchy:

```
├── 📄 index.js
│   ├── 📄 app.js
│   └── 📄 utils.js
```

Instead of flat lists, the anchors should render with `├──`, `│`, and `└──` connectors to show parent-child relationships at a glance.
