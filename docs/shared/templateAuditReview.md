# Template Audit — UX Lead Review

Phase 3 of `aud` epic. Async review document — structured for comment/approve/reject per item.
Generated 2026-03-30.

---

## How to use this document

Each item below needs one of:
- **✅ Approve** — agree as stated
- **❌ Reject** — disagree, with reason
- **✏️ Modify** — agree in principle, change the details

Reply inline or in a session. No rush — async is fine.

---

## A. Decisions Needing Sign-Off

These are changes to the template based on audit findings. Each has a clear recommendation.

### A1. Drop "Components in Use" panel from recipe

**Finding:** Engineering uses Dev Mode for component inspection (Q1–2). No workflow impact if removed.
**Recommendation:** Do not scaffold or validate this panel. Remove from template.
**Impact:** Saves designer effort. No downstream effect.

> Decision: ____

### A2. Simplify discipline chips (9 → fewer)

**Finding:** Only 2 of 9 chips get filled in practice (Q10–11). The concept has value (per-discipline review status) but 9 manual chips is over-engineered.
**Recommendation:** Reduce to 2–3 key disciplines, or automate via plugin (status derived from section activity). Propose specific simplification.
**Impact:** Reduces manual busywork. May change section header component.

> Decision: ____

### A3. Keep VQA section as failure log only

**Finding:** Real VQA happens outside Figma via TestFlight/screenshots (Q12–13). The VQA section is used to record results when QA didn't pass.
**Recommendation:** Keep in recipe but reframe as "QA Results Log." Don't scaffold the side-by-side comparison layout — just a simple log structure.
**Impact:** Simplifies VQA section. Aligns template with actual usage.

### A4. Keep "About This Project" short-term, plan migration

**Finding:** Form is filled out by the delivering designer (Q3), but the same info should live in Jira/Confluence long-term (Q4).
**Recommendation:** Include in recipe for now. Flag as deprecated — migrate when Jira/Confluence process gap is closed.
**Impact:** No immediate change. Future removal planned.

> Decision: ____

### A5. iTrack links — out of scope for stratusHue

**Finding:** Actively used but poor UX (Q5). Possible standalone plugin opportunity.
**Recommendation:** Do not include in recipe or validation. Track as a separate initiative if desired.
**Impact:** Reduces recipe scope. Separate plugin is a future decision.

> Decision: ____

### A6. Teaching tools — readiness check rule, not recipe content

**Finding:** Read during onboarding, sometimes left in file forever (Q6–7). Must be deleted before handoff.
**Recommendation:** Do not scaffold teaching tools. Add a readiness check rule: "teaching tools must be 0 at handoff." Plugin flags them if present during delivery validation.
**Impact:** Cleaner handoff files. Automated enforcement.

> Decision: ____

### A7. Status dot update — standardize via plugin

**Finding:** Three different methods in use: page rename, component property swap, manual edit (Q15). Inconsistent.
**Recommendation:** Plugin provides a single "update status" action. Recipe defines the 5 statuses and their meanings. Validate mode checks that status dots are set correctly.
**Impact:** Consistent status updates across all projects. Reduces confusion.

> Decision: ____

---

## B. Open Questions — Need Your Input

These answers were too brief to act on. The plugin can't implement these features without specifics.

### B1. Annotation categories (Q21) — NEED LIST

You confirmed standard annotation categories exist. **What are they?**

Examples we're guessing at: interaction behavior, responsive rules, accessibility notes, error states, edge cases, content requirements.

**What we need:** The definitive list of categories your team uses.

> Categories: ____

### B2. Mandatory annotation pages (Q22) — NEED MAPPING

You confirmed some pages/sections have mandatory annotations. **Which ones?**

**What we need:** A mapping like:
- "🏁 FINAL" → annotations required
- "📔 COVER" → annotations not required
- etc.

> Mapping: ____

### B3. Annotation format convention (Q23) — NEED COMPONENT DETAILS

You confirmed a format convention exists. **What is it?**

**Action required:** Provide the annotation components from your library (component keys, naming convention, or screenshots). Without seeing the actual annotation components, we can't define what the plugin should look for.

> Format: ____

### B4. "Dev Ready" flag definition (Q24) — NEED MECHANICS

Engineering knows annotations are complete via a "Dev Ready" flag. **How is this flag implemented?**

Is it: a component property on the section header? A page name suffix? A status dot color? A specific component instance placed on the page?

> Flag implementation: ____

### B5. Never-hardcode style list (Q26) — NEED SPECIFICS

You confirmed specific colors/text styles should never be hardcoded. **Which ones?**

Options:
- (a) "Everything in the Foundations library" — simple rule, plugin checks against library
- (b) A specific list of style names or tokens
- (c) All brand colors + all body/heading text styles

> Rule: ____

### B6. Component usage thresholds by delivery type (Q32) — NEED NUMBERS

Minimum library component usage varies by delivery type. **What are the delivery types and their thresholds?**

Example format:
- App feature delivery → 90% library components
- Prototype → 50%
- Design system contribution → 100%

> Thresholds: ____

### B7. Deliverable types for variants (Q34) — NEED ENUMERATION

The template is the standard, but variants may be needed per deliverable. **What are the deliverable types?**

**What we need:** The list of project/deliverable types your team works on, so we can define which sections are required vs. optional for each.

> Deliverable types: ____

---

## C. Clarifications — Ambiguous Answers

### C1. Bottom-to-top lifecycle order (Q20)

You said this "needs explaining" and asked "who's the receiver?" Help us understand:

- Is the bottom-to-top order a convention that designers follow as they work through a project?
- Or is it how reviewers/engineering should read the file?
- Or is it just the physical layout order in Figma and doesn't imply workflow sequence?

This determines whether the plugin should **enforce** section order or just **scaffold** it.

> Clarification: ____

### C2. Detached instance policy (Q30)

You said detaching is OK "under new components created." Does this mean:

- (a) Detaching is acceptable when a designer is building a **new component** that doesn't exist in the library yet (prototyping a new pattern)
- (b) Detaching is acceptable only in files specifically designated for **library contribution**
- (c) Something else

This affects how strict the "no detached instances" rule is.

> Clarification: ____

### C3. Collaborator strip — current state or history? (Q8)

The strip stays accurate but history is wiped when changes happen. You want to preserve collaborator history for tribal knowledge. Which is the primary value?

- (a) **Current state** — plugin validates that role slots are filled. History is nice-to-have.
- (b) **History** — plugin should persist snapshots of collaborator changes over time. This is the main reason to keep the strip.

This determines whether the plugin just validates or actively manages collaborator data.

> Primary value: ____

---

## D. Recommendations with Rationale

### D1. Recipe should encode intent, not state

Per the discovery audit: half of what a manual scan captured is Figma component metadata the plugin can read natively. The recipe should define **what should be there** and **what "done" means** — not duplicate node trees.

**Recommendation:** Slim recipe format with three layers:
1. **Structural rules** — sections, order, naming, emoji prefixes
2. **Completion rules** — what "done" means per section (status dots, Dev Ready flag, teaching tools deleted)
3. **Thresholds** — style coverage, component compliance, annotation coverage

### D2. Start with one variant, add others later

Rather than designing a full variant system upfront, ship the base template recipe first. Add variant support after the base is validated in real usage.

### D3. Delivery friction is the metric

"Delivery" is the #1 pain point (Q35). Every feature should be evaluated against: **does this make delivery less painful?** If it doesn't, it's lower priority.

---

## E. Impact on Existing Files

| Change | Effect on existing files |
|---|---|
| Drop Components in Use panel | No impact — panel stays in old files, just not scaffolded in new ones |
| Simplify discipline chips | Existing files keep 9 chips. New files get simplified version. No migration needed. |
| VQA → QA Results Log | Rename only. Existing VQA sections still pass validation. |
| Teaching tools readiness rule | Existing files get flagged if teaching tools are still present at handoff. **This is intentional.** |
| Status dot standardization | Existing files may use mixed methods. Plugin normalizes going forward. |

---

*Awaiting responses. No rush — reply per item when ready.*
*Next: Phase 4 — incorporate feedback and resolve open questions.*
