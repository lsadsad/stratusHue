---
id: rdy
category: validate
title: "FTR — Readiness check audit"
type: feature
priority: 3
status: open
depends_on: []
created: 2026-03-21T00:00:00.000Z
---

Full handoff readiness check that diffs the current Figma file state against the applied recipe. Checks all five layers: ① structure (required pages present), ② content (variables filled and approved), ③ annotations (required categories per page), ④ token thresholds met, ⑤ component compliance. Produces a pass/fail readiness report.
