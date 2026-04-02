# Template Methodology Audit — Team Questions

v2 | `aud` epic | 2026-04-02

---

## Purpose

Async record of the pipeline shakedown. What's load-bearing, what's ceremony, what needs rework — captured here so stratusHue knows what to automate, validate, and scaffold.

- Big-picture → specific. Partial answers fine.
- If it's not here, it doesn't get built.

---

## 1. Big Picture

1. Keep only 3 template elements — which and why?
2. Biggest friction point in the current workflow?
3. Is the template **the** standard, **a** starting point, or **a** snapshot that drifts?
4. What deliverable types would drive variants?
5. How does everyone know a file is ready for handoff?
6. Primary audience for a delivered file?

---

## 2. Status & Review

**Status dots**
7. Who updates them?
8. How — page rename, prop swap, manual edit, all three?
9. All 5 statuses used, or typically 2–3?

**Review rounds**
10. R1 pre-seeded or added at first review?
11. Multiple rounds always, or sometimes straight to final?

**Section order**
12. All 9 sections used every time, or some skipped by project type?
13. Bottom-to-top order — designer convention, reviewer convention, or just layout?

---

## 3. Element Check

**Components in Use panel**
14. Referenced at handoff, or does engineering use Dev Mode?
15. Would anything break if this panel disappeared?

**About This Project**
16. Filled out on last 3 projects? By whom, read by whom?
17. Same info in Jira/Confluence? Which source wins?

**iTrack / Jira links**
18. Clicked from Figma or go to Jira directly?

**Teaching tools**
19. New designers read these, learn from teammates, or both?
20. Deleted after onboarding or left in file?

**Collaborator strip**
21. Accurate through the project or only at kickoff?
22. What does it add over Figma's native collaborator list?
23. Is the history worth preserving, or is current state enough?

**Discipline chips**
24. Updated per discipline, or stay at defaults?
25. How many of the 9 actually get filled?

**VQA section**
26. Side-by-side in Figma, or real VQA in browser?
27. Record of results, or active workspace?

---

## 4. Annotations

> Need specifics — "yes" isn't buildable. Component keys, names, or screenshots unblock this.

28. Standard annotation categories? **List them.**
29. Mandatory annotation pages/sections? **Which ones?**
30. Format convention? **Component name or key.**
31. "Dev Ready" signal — what is it mechanically?

---

## 5. Tokens & Components

**Style coverage**
32. Target % for shared style references at handoff?
33. Styles that must **never** be hardcoded? **Which ones**, or "everything in Foundations"?
34. Figma variables (spacing, radius) — matter for compliance?

**Component libraries**
35. One canonical library or multiple per project type?
36. Detached instances ever OK? Under what circumstances?
37. Plugin flags outdated versions, or leave to Figma's update flow?
38. Minimum library usage threshold? **Numbers per delivery type.**

---
