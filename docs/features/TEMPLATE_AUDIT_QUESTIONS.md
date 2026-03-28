# Template Methodology Audit — Team Questions

Generated 2026-03-28 from issue `aud` (P1-meta-aud-template-methodology-audit).

Reference: `docs/features/DISCOVERY_AUDIT.md`

---

## Section 1: What's Actually Used?

These elements exist in the template today. We need to know if they're load-bearing or ceremony.

**Components in Use panel**
1. Does your team reference the Components in Use panel during handoff, or does engineering go straight to Dev Mode?
2. If Dev Mode replaced this panel tomorrow, would anything break in your workflow?

**About This Project form**
3. On your last 3 projects, was this form filled out? If so, who filled it and who read it?
4. Does the same information already live in Jira/Confluence? If yes, which source does the team actually reference?

**iTrack / Jira links**
5. Do team members click iTrack links from within Figma, or do they go to Jira directly?

**Teaching tools**
6. When a new designer joins the team, do they read the teaching tools in the template, or do they learn from a teammate?
7. After initial onboarding, do the teaching tools get deleted or do they stay in the file forever?

**Collaborator strip (6 role slots)**
8. Does the collaborator strip stay accurate through the project, or is it only correct at kickoff?
9. Is there information in the collaborator strip that you can't get from Figma's native collaborator list (e.g., discipline/role)?

**Discipline chips (9 per section header)**
10. Are the 9 discipline chips updated as each discipline completes their review, or do they stay at defaults?
11. Who is responsible for updating them?

**VQA side-by-side**
12. Does the team actually compare designs side-by-side in Figma, or does real VQA happen in a browser against the dev build?
13. If VQA happens outside Figma, is the VQA section just a record of results or actively used during review?

---

## Section 2: Status & Review Workflow

These elements appear load-bearing but we need to confirm how they actually work.

**Status dots**
14. Who updates the status dot on a page — the designer, the lead, or someone else?
15. How is it updated — page rename, component property swap, or manual edit?
16. Are all 5 statuses used (white/yellow/orange/red/green), or do projects typically only use 2-3?

**Review rounds**
17. Is R1 pre-seeded when the file is created from the template, or added when the first review actually happens?
18. Do all projects go through multiple review rounds, or do some skip straight to final?

**Section ordering & usage**
19. Are all 9 sections used on every project, or are some skipped for certain project types?
20. Is the bottom-to-top lifecycle order followed, or do teams jump between sections?

---

## Section 3: Annotations (Layer ③ — currently undefined)

We have no rules for what annotations are expected. We need to define "annotated" before the plugin can check for it.

21. Does your team have a standard set of annotation categories (e.g., interaction behavior, responsive rules, accessibility notes, error states)?
22. Are there pages or sections where annotations are mandatory vs. nice-to-have?
23. Is there a format convention — structured labels, free-form sticky notes, a specific annotation component from the library?
24. How does engineering know when annotations are complete? Is there a signal, or do they just ask?

---

## Section 4: Design Tokens & Styles (Layer ④ — no thresholds defined)

The plugin can detect hardcoded values vs. style references, but doesn't know what "good enough" means.

25. What percentage of fills and strokes in a handoff-ready file should reference shared styles? (e.g., 80%? 95%? 100%?)
26. Are there specific colors or text styles that should *never* be hardcoded (e.g., brand colors, body text)?
27. Do Figma variables (spacing, radius, etc.) matter for compliance, or only color and text styles?
28. Is there a canonical style/variable library that all projects must reference?

---

## Section 5: Component Compliance (Layer ⑤ — no inventory defined)

The plugin can detect detached instances and list components, but has no reference to diff against.

29. Is there a single canonical component library, or do different project types use different libraries?
30. Are detached instances ever acceptable? If so, under what circumstances?
31. Should the plugin flag outdated component versions, or is that managed through Figma's library update flow?
32. Is there a minimum threshold for library component usage vs. custom-built elements?

---

## Section 6: The Big Picture

33. If you could only keep 3 elements from the template, which would they be?
34. Is this template **the** standard (every project uses it as-is), **a** variant (different project types need different templates), or **a snapshot** (each file drifts from the template over time)?
35. What's the single biggest friction point in the current template workflow?

---

## Answers

**1.** The intent is for it to be referenced during or before delivery, but in practice engineering uses Dev Mode.
**2.** Nothing would break — it would just mean fewer manual steps for the designer.
**3.** The delivering designer fills it out, engineering is supposed to read it, but it's redundant with Jira/Confluence.
