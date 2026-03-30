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

Questionnaire drafted (35 questions, 6 sections). **All 35 answers recorded.**
See `docs/features/TEMPLATE_AUDIT_QUESTIONS.md` for full Q&A.

### Findings

**Keep (load-bearing):**
- Status dots — multiple people interact, 3+ statuses active, genuine process signal
- Collaborator strip — adds role/discipline context and history that Figma doesn't provide
- Section order & emoji prefixes — confirmed structural backbone
- Cover page, page/section labels, creation and delivery assets — top 3 elements (Q33)

**Rethink (real need, wrong execution):**
- About This Project form — not in Jira yet, but should move there long-term
- VQA section — real VQA happens outside Figma (TestFlight/screenshots); section serves as failure log only
- Discipline chips — only 2 of 9 get filled; over-engineered, needs simplification
- iTrack links — actively used but UX is poor; possible separate plugin opportunity
- Template variants may be needed depending on project deliverable (Q34)

**Redundant (safe to drop from recipe):**
- Components in Use panel — Dev Mode does this natively; no workflow impact if removed

**Readiness check candidates:**
- Teaching tools must be deleted before handoff (read during onboarding, then abandoned)
- Status dot update method is inconsistent (rename / prop swap / manual) — plugin could standardize
- "Dev Ready" flag signals annotation completeness (Q24)
- 100% style reference coverage expected unless new entry (Q25)
- Outdated component versions should be flagged (Q31)

**Key thresholds & constraints (from Q17–35):**
- R1 added when review happens, not pre-seeded (Q17)
- Multiple review rounds are the norm (Q18)
- Not all 9 sections used every time — some skipped by project type (Q19)
- Bottom-to-top lifecycle order needs better documentation for receivers (Q20)
- Standard annotation categories, mandatory pages, and format convention exist (Q21–23)
- Two canonical libraries: Components and Foundations (Q29)
- Detached instances OK only for new components not yet in library (Q30)
- Component usage threshold depends on delivery type (Q32)
- **Biggest friction point: Delivery** (Q35)

### Remaining

All questions answered. Next step: synthesize findings into actionable recipe schema requirements.

## References

- `docs/features/DISCOVERY_AUDIT.md`
- `docs/features/TEMPLATE_AUDIT_QUESTIONS.md`
- `.memory/2026-03-29-audit-findings-partial.md`
