# Template Audit Analysis

Phase 2 of `aud` epic. Synthesized from all 35 audit answers + discovery audit.
Generated 2026-03-30.

---

## 1. Element Disposition Table

Every template element, its audit verdict, and what stratusHue should do with it.

| Element | Verdict | Action | Answers | Notes |
|---|---|---|---|---|
| **Cover page** | ✅ Keep | Scaffold + Validate | Q33 | Top 3 element. Recipe must define cover structure. |
| **Page & section labels** | ✅ Keep | Scaffold + Validate | Q19, Q33 | Top 3 element. Emoji prefixes confirmed as structural backbone. |
| **Section order (9 sections)** | ✅ Keep (flexible) | Scaffold + Validate | Q19 | Not all 9 used every time — recipe needs optional sections per variant. |
| **Status dots (5-color)** | ✅ Keep | Validate + Automate | Q14–16 | Load-bearing. 3+ statuses active. Plugin should standardize update method. |
| **Review rounds (R1, R2…)** | ✅ Keep | Validate | Q17–18 | Not pre-seeded — added on first review. Multiple rounds are the norm. |
| **Creation & delivery assets** | ✅ Keep | Scaffold | Q33 | Top 3 element. |
| **Collaborator strip** | ✅ Keep | Scaffold | Q8–9 | Adds role/discipline context Figma lacks. History preservation wanted. |
| **Discipline chips** | ⚠️ Simplify | Rethink before build | Q10–11 | Only 2 of 9 filled in practice. Keep concept, reduce to 2–3 chips or automate. |
| **VQA section** | ⚠️ Repurpose | Keep as failure log only | Q12–13 | Real VQA happens outside Figma. Section is a record, not an active workspace. |
| **About This Project form** | ⚠️ Migrate | Keep short-term, plan Jira migration | Q3–4 | Redundant with Jira/Confluence long-term. Not there yet — keep for now. |
| **iTrack / Jira links** | ⚠️ Separate | Possible standalone plugin | Q5 | Actively used but poor UX. Not a recipe concern — separate effort. |
| **Teaching tools** | 🔴 Remove at handoff | Readiness check rule | Q6–7 | Read during onboarding, then abandoned. Must be deleted before delivery. |
| **Components in Use panel** | 🔴 Drop | Do not scaffold | Q1–2 | Dev Mode replaces this entirely. No workflow impact if removed. |

---

## 2. Gaps & Contradictions

Answers that were too brief, ambiguous, or need follow-up before the spec can be written.

### Vague "Yes" answers — need specifics

| Question | Answer | What we still need |
|---|---|---|
| Q21 — Standard annotation categories? | "Yes" | **List the categories.** Without this, the plugin can't validate annotations. |
| Q22 — Mandatory annotation pages? | "Yes" | **Which pages/sections?** Need a page-to-annotation mapping. |
| Q23 — Annotation format convention? | "Yes" | **What format?** Structured label, sticky note, library component? Need the component key or naming convention. |
| Q26 — Colors that must never be hardcoded? | "Yes" | **Which ones?** Need the specific style names or hex values, or a rule like "anything in Foundations library." |
| Q32 — Minimum component usage threshold? | "Yes, depends on delivery" | **What are the thresholds per delivery type?** Need concrete numbers. |

### Ambiguous answers — need clarification

| Question | Answer | Ambiguity |
|---|---|---|
| Q20 — Bottom-to-top lifecycle order | "Needs explaining — who's the receiver?" | Does this mean: (a) the convention isn't documented well enough, (b) it's not actually followed, or (c) it only applies to certain audiences? This affects whether section order is enforced or advisory. |
| Q30 — Detached instances acceptable? | "Under new components created" | Does this mean: (a) detaching is OK when building a *new* component that doesn't exist in the library yet, or (b) detaching is OK within a file that's specifically for creating new library components? Affects the detach policy rule. |
| Q34 — Template variants | "The standard, but variants needed per deliverable" | What are the deliverable types? (e.g., app feature, marketing page, design system contribution, prototype-only). Each variant needs a defined delta from the base template. |

### Contradictions to resolve

| Topic | Tension | Resolution needed |
|---|---|---|
| **Collaborator strip** | Q8 says it stays accurate, but history is wiped on changes. Q9 confirms it adds value Figma lacks. | Is the strip's primary value *current state* or *history*? If history, the plugin could persist snapshots. If current state, just validate it's filled. |
| **About This Project** | Q3 says it's filled out. Q4 says it's not in Jira yet but should be. | Keep in recipe for now? Or drop immediately and accept the gap until Jira migration? |
| **Section usage** | Q19 says some sections are skipped. Q33 says sections are a top-3 element. | Sections matter but not all 9 are universal — recipe needs `required: true/false` per section, possibly per variant. |

---

## 3. Threshold Registry

Concrete numbers the plugin needs for validation. Confirmed values vs. gaps.

| Rule | Value | Source | Status |
|---|---|---|---|
| Style reference coverage (fills + strokes) | **100%** unless new entry | Q25 | ✅ Confirmed |
| Figma variables (spacing, radius) | **Must use variables** | Q27 | ✅ Confirmed (no threshold specified — assume 100%) |
| Canonical libraries | **Components** + **Foundations** | Q28–29 | ✅ Confirmed |
| Detached instances | **0** (except new component creation) | Q30 | ⚠️ Needs detach policy clarification |
| Outdated component versions | **Flag all** | Q31 | ✅ Confirmed |
| Component usage vs custom-built | **Threshold varies by delivery** | Q32 | ❌ No numbers — need per-variant thresholds |
| Status dots in use | **≥3 of 5** | Q16 | ✅ Confirmed |
| Teaching tools at handoff | **0** (must be deleted) | Q7 | ✅ Confirmed |
| Annotation coverage | **Mandatory on some pages** | Q22 | ❌ No page list — need mapping |
| Annotation completeness signal | **"Dev Ready" flag** | Q24 | ✅ Confirmed — need flag definition (component prop? page name suffix?) |
| Never-hardcode styles | **Specific list exists** | Q26 | ❌ List not provided |
| Review rounds | **≥1 required** | Q17–18 | ✅ Inferred — R1 added when review happens |

---

## 4. Variant Matrix

The template is "the standard" but variants are needed per deliverable (Q34). First pass at what varies.

| Dimension | Base template | Possible variant deltas |
|---|---|---|
| **Sections included** | All 9 | Some project types skip sections (Q19) — need to identify which |
| **Component library** | Components + Foundations | Different deliverables may use different subsets |
| **Component usage threshold** | TBD | Varies by delivery type (Q32) |
| **Annotation requirements** | Full set mandatory | Lighter requirements for prototypes or internal work? |
| **VQA section** | Included (as failure log) | May not apply to all deliverable types |
| **Cover variant** | Delivery cover | Library cover exists as a second variant (from discovery audit) |

### What we don't know yet

- **What are the deliverable types?** Need the UX lead to enumerate them (e.g., app feature, marketing, design system, prototype).
- **Per-variant section lists.** Which of the 9 sections are required vs. optional for each type?
- **Per-variant thresholds.** Does a prototype need 100% style coverage? Probably not.

---

## 5. Delivery Pain Map

Delivery is the #1 friction point (Q35). Breaking down what hurts and where the plugin can help.

### Pain signals from the audit

| Pain point | Evidence | Root cause |
|---|---|---|
| **Inconsistent status updates** | Q15 — page rename, prop swap, and manual edit all used | No single standardized method. Plugin opportunity: single "update status" action. |
| **Discipline chips abandoned** | Q10 — only 2 of 9 filled | Too many manual steps for low-value signal. Plugin opportunity: automate or reduce. |
| **Teaching tools left in file** | Q7 — sometimes never deleted | No enforcement. Plugin opportunity: readiness check flags them. |
| **Components in Use is manual busywork** | Q1–2 — Dev Mode already does this | Wasted designer effort. Recipe should not include this. |
| **Style compliance unknown until late** | Q25 — 100% expected but no tooling to check | No early warning. Plugin opportunity: lint/validate catches hardcoded values. |
| **No annotation completeness signal** | Q24 — "Dev Ready" flag exists but usage unclear | Engineering doesn't know when to start. Plugin opportunity: validate flag presence. |
| **Outdated components undetected** | Q31 — should be flagged | Manual library update review. Plugin opportunity: version check in validate mode. |

### Where stratusHue directly reduces delivery friction

| Plugin capability | Delivery pain it solves |
|---|---|
| **Scaffold mode** — generate structure from recipe | Eliminates setup time, ensures correct sections/order from day 1 |
| **Validate mode — style coverage** | Catches hardcoded values before handoff, not during |
| **Validate mode — component check** | Flags detached instances and outdated versions early |
| **Validate mode — readiness check** | Single "is this file ready?" scan: teaching tools gone, status dots set, annotations flagged, Dev Ready present |
| **Navigate mode — status dots** | Could standardize the update method (one action instead of three) |

### What stratusHue can't solve

| Friction | Why it's out of scope |
|---|---|
| iTrack/Jira link UX | Separate plugin opportunity — not a template structure problem |
| About This Project → Jira migration | Process change, not a Figma plugin problem |
| VQA happening outside Figma | Correct behavior — plugin shouldn't try to pull it back in |
| Bottom-to-top lifecycle documentation | Convention documentation, not enforcement |

---

## Summary: What's Ready to Build vs. What's Blocked

### Ready now

- Element disposition is clear for ~10 of 13 elements
- Style coverage threshold: 100%
- Teaching tools readiness rule: must be 0
- Outdated component flagging: confirmed
- Two canonical libraries identified
- Dev Ready flag as annotation completeness signal

### Blocked on UX lead input

- Annotation categories, mandatory pages, and format (Q21–23)
- Never-hardcode style list (Q26)
- Component usage thresholds per delivery type (Q32)
- Deliverable type enumeration for variants (Q34)
- Bottom-to-top convention clarification (Q20)
- Detach policy specifics (Q30)
- Discipline chip simplification proposal (Q10)

---

*Next: Phase 3 — package blocked items into async review document for UX lead.*
