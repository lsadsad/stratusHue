---
id: spf
category: meta
title: TSK — Spec writing framework
type: task
priority: 2
status: open
depends_on: []
created: 2026-04-02
---

Develop a lightweight framework for writing spec and leave-behind documents that prioritizes density and async readability.

**Principle:** Everything should be as simple as possible, but no simpler. We're not dumbing things down — we're communicating more efficiently.

## Guidelines (emerging)

- Two-sentence paragraphs max for explanatory sections
- Section titles carry weight — cut intros that repeat them
- Questions should be direct, not conversational
- Tables over prose when mapping inputs to outputs
- Bold inline prompts where specifics are required ("**List them.**")
- Purpose stated upfront, before any content

## Tested on

- `docs/shared/templateAuditQuestionsV2.md` — trimmed from 124 → 82 lines, same 38 questions
- `docs/shared/stratusHueOverviewForReview.md` — companion page for external reader

## Next

- Codify the framework into a reusable reference
- Apply to future audit docs (analysis v2, review v2)
- **relay-kb candidate** — this framework applies beyond stratusHue
