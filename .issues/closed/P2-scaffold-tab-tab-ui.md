---
id: tab
category: scaffold
title: "UI: Scaffold tab — recipe selector and apply"
type: task
priority: 2
status: closed
depends_on: [ldr]
created: 2026-03-21
---

Implement the Scaffold mode UI (src/ui/scaffold/scaffold-ui.ts, currently a placeholder). Shows available recipes (name, description, page count). User selects one, sees a preview summary, then applies it. Sends scaffold-apply message to sandbox. Shows progress and result notification.

## Folded — 2026-11-20

Folded into `scf` in the 2026-11-20 backlog review (ruled by Levin 2026-11-20: "Take all 123"). `scf` carries the open work; this body stays as the record.

Evidence, from the review: The UI it would implement is the placeholder at `src/ui/scaffold/scaffold-ui.ts:1-5`. Carry as a box on `scf`.

Review: groundControl `docs/reviews/2026-11-20-backlog-review-other-repos.md`.
