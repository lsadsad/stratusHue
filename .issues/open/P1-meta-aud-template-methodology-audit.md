---
id: aud
category: meta
title: "Template methodology audit — analyze, review with lead, revise, finalize for build"
type: epic
priority: 1
status: open
depends_on: []
created: 2026-03-27
---

Audit the UX template with the team to confirm which elements are genuinely load-bearing, then analyze findings, review with UX lead, revise the template spec, and finalize for the stratusHue build.

---

## Phase 1: Questionnaire ✅

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

---

## Phase 2: Analyze & Synthesize ✅

Distill the 35 answers into an actionable analysis document.

- [x] **Element disposition table** — 13 elements classified: 7 keep, 4 rethink, 2 drop
- [x] **Gaps & contradictions** — 5 vague answers, 3 ambiguities, 3 contradictions identified
- [x] **Threshold registry** — 12 rules catalogued; 8 confirmed, 4 blocked on UX lead input
- [x] **Variant matrix** — base template + variant dimensions mapped; deliverable types TBD
- [x] **Delivery pain map** — 7 pain points mapped to plugin capabilities; 4 out-of-scope items identified

Output: `docs/features/TEMPLATE_AUDIT_ANALYSIS.md`

---

## Phase 3: Questions & Notes for UX Lead ⬅ current

Package findings into an async-friendly review document for the UX lead.

- [ ] **Decisions needed** — list items that require lead sign-off (drops, simplifications, new thresholds)
- [ ] **Open questions** — items where answers were too brief to act on (Q20 bottom-to-top, Q21–23 annotation specifics, Q26 never-hardcode list, Q30 detach policy details)
- [ ] **Recommendations with rationale** — for each "rethink" item, propose a concrete change and why
- [ ] **Impact on existing files** — what happens to files already using the current template?

Output: `docs/features/TEMPLATE_AUDIT_REVIEW.md` — structured for async comment/approve/reject per item

---

## Phase 4: Async Review & Discussion

- [ ] Deliver review doc to UX lead
- [ ] Collect feedback — approvals, rejections, modifications, new constraints
- [ ] Resolve open questions from Phase 3
- [ ] Document final decisions with rationale

Output: Updated `TEMPLATE_AUDIT_REVIEW.md` with decision log

---

## Phase 5: Revised Template Spec

Incorporate all decisions into a revised template specification.

- [ ] **Revised element inventory** — final list of what the template contains, per variant if applicable
- [ ] **Section map** — pages, sections, ordering, emoji prefixes, optional vs required
- [ ] **Annotation spec** — categories, format, mandatory placement, "Dev Ready" flag definition
- [ ] **Compliance rules** — style coverage, component library references, detach policy, version currency
- [ ] **Variant definitions** — if variants are needed, define each variant's delta from the base template

Output: `docs/features/TEMPLATE_SPEC_REVISED.md`

---

## Phase 6: Finalize for Build

Lock the spec and translate it into stratusHue recipe schema requirements.

- [ ] **Recipe schema mapping** — map each spec element to recipe JSON fields (feeds `sch` issue)
- [ ] **Readiness check rules** — map compliance rules to lint/check logic (feeds `rdy`, `tkn`, `cmp` issues)
- [ ] **Scaffold requirements** — what Scaffold mode needs to create from a recipe (feeds `scf` epic)
- [ ] **Sign-off** — UX lead confirms the finalized spec is build-ready

Output: `docs/features/TEMPLATE_SPEC_FINAL.md` — the canonical reference for all downstream build work

---

## References

- `docs/features/DISCOVERY_AUDIT.md`
- `docs/features/TEMPLATE_AUDIT_QUESTIONS.md`
- `.memory/2026-03-29-audit-findings-partial.md`
