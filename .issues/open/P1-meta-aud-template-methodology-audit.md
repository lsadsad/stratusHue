---
id: aud
category: meta
title: "EPC — Template methodology audit"
type: epic
priority: 1
status: open
depends_on: []
created: 2026-03-27T00:00:00.000Z
---

Audit the UX template with the team to confirm which elements are genuinely load-bearing, then analyze findings, review with UX lead, revise the template spec, and finalize for the stratusHue build.

---

## Phase 1: Questionnaire ✅

Questionnaire drafted (35 questions, 6 sections). **All 35 answers recorded.**
See `docs/shared/templateAuditQuestions.md` for full Q&A.

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

Output: `docs/shared/templateAuditAnalysis.md`

---

## Phase 3: Questions & Notes for UX Lead ✅

Package findings into an async-friendly review document for the UX lead.

- [x] **Decisions needed** — 7 items requiring sign-off (A1–A7): drop Components in Use, simplify chips, VQA as log, About This Project migration, iTrack out of scope, teaching tools rule, status dot standardization
- [x] **Open questions** — 7 items needing specifics (B1–B7): annotation categories, mandatory pages, annotation components, Dev Ready flag mechanics, never-hardcode list, per-variant thresholds, deliverable types
- [x] **Clarifications** — 3 ambiguous answers (C1–C3): bottom-to-top order, detach policy, collaborator strip purpose
- [x] **Recommendations with rationale** — 3 proposals (D1–D3): slim recipe format, start with one variant, delivery as the metric
- [x] **Impact on existing files** — 5 changes assessed, no destructive migration needed

**Action required from UX lead:** Provide annotation components from library to answer B1–B3.

Output: `docs/shared/templateAuditReview.md` — structured for async comment/approve/reject per item

---

## Phase 4: Async Review & Discussion ← ACTIVE

- [x] Deliver review doc to UX lead
- [x] Restructure questionnaire → v2 (38 questions, baseline answers pre-filled, Jen column)
- [x] Create stratusHue overview companion doc for UX lead
- [ ] Deliver next steps overview to UX lead — signal what's coming
- [ ] Collect Jen's v2 questionnaire responses — confirms, corrections, additions
- [ ] Resolve open questions from Phase 3 (B1–B7, C1–C3)
- [ ] Resolve decisions A1–A7 — sign-offs on element dispositions
- [ ] Document final decisions with rationale

Output: Completed `templateAuditQuestionsV2.md` with Jen's responses

---

## Phase 4b: Re-Analyze with UX Lead Input

Re-run the analysis from Phase 2, now incorporating Jen's responses. The original Phase 2 analysis was based solely on template-user experience. Jen's input may shift element dispositions, resolve ambiguities, introduce new constraints, or surface conflicts with v1 findings.

- [ ] **Reconcile v1 vs v2 answers** — flag where Jen's responses confirm, correct, or contradict baseline
- [ ] **Update element disposition table** — re-evaluate keep/rethink/drop classifications
- [ ] **Resolve threshold registry** — fill in the 4 items previously blocked on UX lead input
- [ ] **Update variant matrix** — incorporate deliverable types and variant definitions from Jen
- [ ] **Revised gap list** — close resolved ambiguities, surface any new ones
- [ ] **Section 3 team poll decision** — determine if Element Check questions go to broader team

Output: Updated `docs/shared/templateAuditAnalysis.md` (v2) or new `templateAuditAnalysisV2.md`

---

## Phase 5: Revised Template Spec

Incorporate all decisions into a revised template specification. Blocked on Phase 4b.

- [ ] **Revised element inventory** — final list of what the template contains, per variant if applicable
- [ ] **Section map** — pages, sections, ordering, emoji prefixes, optional vs required
- [ ] **Annotation spec** — categories, format, mandatory placement, "Dev Ready" flag definition
- [ ] **Compliance rules** — style coverage, component library references, detach policy, version currency
- [ ] **Variant definitions** — if variants are needed, define each variant's delta from the base template

Output: `docs/shared/templateSpecRevised.md`

---

## Phase 6: Finalize for Build

Lock the spec and translate it into stratusHue recipe schema requirements.

- [ ] **Recipe schema mapping** — map each spec element to recipe JSON fields (feeds `sch` issue)
- [ ] **Readiness check rules** — map compliance rules to lint/check logic (feeds `rdy`, `tkn`, `cmp` issues)
- [ ] **Scaffold requirements** — what Scaffold mode needs to create from a recipe (feeds `scf` epic)
- [ ] **Sign-off** — UX lead confirms the finalized spec is build-ready

Output: `docs/shared/templateSpecFinal.md` — the canonical reference for all downstream build work

---

## References

- `docs/shared/discoveryAudit.md`
- `docs/shared/templateAuditQuestions.md`
- `docs/shared/templateAuditQuestionsV2.md`
- `docs/shared/stratusHueOverviewForReview.md`
- `docs/shared/templateAuditAnalysis.md`
- `docs/shared/contentAuditWorkflows.md`
- `.memory/2026-03-29-audit-findings-partial.md`
- `.memory/2026-04-02-audit-v2-restructure.md`
- Template Methodology PDF: `/Users/levinsadsad/Library/CloudStorage/GoogleDrive-lsadsad@gmail.com/My Drive/NOT3BOOK-gDrive/Personal/stratusHue/TemplateMethodology.pdf`
