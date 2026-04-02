# Template Methodology Audit — Team Questions

Generated 2026-04-02 from issue `aud` (P1-meta-aud-template-methodology-audit).
v2 — restructured for clarity of purpose, density, and progressive depth.

Reference: `docs/features/audit/discoveryAudit.md`

---

## Purpose

This document exists to facilitate **asynchronous communication** and keep a running record of notes from the shakedown of the design-to-delivery pipeline we manage.

We are auditing the UX template methodology — not to grade it, but to understand which parts are load-bearing, which are ceremony, and which need rework. The findings here directly inform what stratusHue automates, validates, and scaffolds.

**How this works:**
- Questions are grouped by concern, ordered from big-picture → specific.
- Answer at your own pace. Partial answers are fine — flag what needs a follow-up conversation.
- Answers become the source of truth for plugin requirements. If it's not captured here, it doesn't get built.

---

## Section 1: The Big Picture

Before we get into specifics — what matters most, what hurts most, and what kind of thing are we working with?

**The essentials**
1. If you could only keep 3 elements from the template, which would they be and why?
2. What's the single biggest friction point in the current template workflow?

**Template identity**
3. Is this template **the** standard (every project uses it as-is), **a** starting point (teams adapt it per project), or **a** snapshot (files drift from it over time)?
4. If variants are needed — what are the deliverable types that would drive them? (e.g., app feature, marketing page, design system contribution, prototype-only)

**What "done" looks like**
5. When a file is ready for handoff, how does everyone know? Is there a single signal, or is it a checklist in someone's head?
6. Who is the primary audience for a delivered file — engineering, QA, both, someone else?

> *These answers frame everything that follows. If something here surprises us, it may change which questions below even matter.*

---

## Section 2: Status & Review Workflow

How work moves through the file — statuses, reviews, and lifecycle.

**Status dots**
7. Who updates the status dot on a page — the designer, the lead, or someone else?
8. How is it updated — page rename, component property swap, or manual edit? (Or all three?)
9. Are all 5 statuses actively used (white/yellow/orange/red/green), or do projects typically use 2–3?

**Review rounds**
10. Is R1 pre-seeded when the file is created, or added when the first review actually happens?
11. Do all projects go through multiple review rounds, or do some go straight to final?

**Section ordering & lifecycle**
12. Are all 9 sections used on every project, or are some skipped depending on project type?
13. The bottom-to-top lifecycle order — is that a convention for designers working through the file, for reviewers reading it, or just the physical layout? Who needs to understand it?

---

## Section 3: What's Actually Used?

For each template element: is it load-bearing, ceremony, or somewhere in between?

**Components in Use panel**
14. Does your team reference this panel during handoff, or does engineering go straight to Dev Mode?
15. If Dev Mode replaced this panel tomorrow, would anything break?

**About This Project form**
16. On your last 3 projects, was this filled out? Who filled it, who read it?
17. Does the same information live in Jira/Confluence? Which source does the team actually reference?

**iTrack / Jira links**
18. Do team members click iTrack links from within Figma, or go to Jira directly?

**Teaching tools**
19. When a new designer joins, do they read the teaching tools in the template, learn from a teammate, or both?
20. After onboarding, do teaching tools get deleted or stay in the file?

**Collaborator strip (6 role slots)**
21. Does the strip stay accurate through the project, or only at kickoff?
22. What does it provide that Figma's native collaborator list doesn't? (e.g., discipline, role, history)
23. When collaborator info changes, is the history worth preserving — or is current state enough?

**Discipline chips (9 per section header)**
24. Are the 9 chips updated as each discipline completes review, or do they stay at defaults?
25. Who is responsible for updating them? How many actually get filled in practice?

**VQA section**
26. Does the team compare designs side-by-side in Figma, or does real VQA happen in a browser against the dev build?
27. If VQA happens outside Figma, is this section a record of results, or actively used during review?

---

## Section 4: Annotations

We have no rules yet for what "annotated" means. We need to define it before the plugin can check for it.

28. Does your team have a standard set of annotation categories? If yes — **what are they?** (e.g., interaction behavior, responsive rules, accessibility notes, error states)
29. Are there pages or sections where annotations are mandatory vs. nice-to-have? **Which ones?**
30. What's the format convention — structured labels, sticky notes, a specific component from the library? **Provide the component name or key if possible.**
31. How does engineering know annotations are complete? What does the "Dev Ready" signal look like — is it a component property, a page name suffix, a status dot color, something else?

> *We need specifics here — "yes, we have a convention" isn't enough for the plugin to validate against. A component key, a screenshot, or a list is what unblocks this.*

---

## Section 5: Design Tokens & Component Compliance

The plugin can detect hardcoded values and flag detached instances — but it needs to know what "good enough" means.

**Style coverage**
32. What percentage of fills and strokes in a handoff-ready file should reference shared styles? (80%? 95%? 100%?)
33. Are there specific colors or text styles that should **never** be hardcoded? If so — **which ones**, or is the rule "everything in the Foundations library"?
34. Do Figma variables (spacing, radius) matter for compliance, or only color and text styles?

**Component libraries**
35. Is there a single canonical component library, or do different project types use different libraries?
36. Are detached instances ever acceptable? Under what specific circumstances?
37. Should the plugin flag outdated component versions, or is that managed through Figma's library update flow?
38. Is there a minimum threshold for library component usage vs. custom-built? If it varies by delivery type — **what are the numbers?**

---
