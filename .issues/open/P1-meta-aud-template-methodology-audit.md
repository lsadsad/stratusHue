---
id: aud
category: meta
title: "Template methodology audit: confirm load-bearing elements with team"
type: task
priority: 1
status: open
depends_on: []
created: 2026-03-27
---

Audit the UX template with the team to confirm which elements are genuinely load-bearing before encoding them into the recipe schema.

## Progress

Questionnaire drafted (35 questions, 6 sections). Answers 1–16 recorded.
See `docs/features/TEMPLATE_AUDIT_QUESTIONS.md` for full Q&A.

### Findings so far (Q1–16)

**Keep (load-bearing):**
- Status dots — multiple people interact, 3+ statuses active, genuine process signal
- Collaborator strip — adds role/discipline context and history that Figma doesn't provide
- Section order & emoji prefixes — confirmed structural backbone

**Rethink (real need, wrong execution):**
- About This Project form — not in Jira yet, but should move there long-term
- VQA section — real VQA happens outside Figma (TestFlight/screenshots); section serves as failure log only
- Discipline chips — only 2 of 9 get filled; over-engineered, needs simplification
- iTrack links — actively used but UX is poor; possible separate plugin opportunity

**Redundant (safe to drop from recipe):**
- Components in Use panel — Dev Mode does this natively; no workflow impact if removed

**Readiness check candidates:**
- Teaching tools must be deleted before handoff (read during onboarding, then abandoned)
- Status dot update method is inconsistent (rename / prop swap / manual) — plugin could standardize

### Remaining

Questions 17–35 unanswered (review rounds, section usage, annotations, tokens, components, big picture).

## References

- `docs/features/DISCOVERY_AUDIT.md`
- `docs/features/TEMPLATE_AUDIT_QUESTIONS.md`
- `.memory/2026-03-29-audit-findings-partial.md`
