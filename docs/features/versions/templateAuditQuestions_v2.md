# Template Methodology Audit — Team Questions

v2 | `aud` epic | 2026-04-02

---

## Purpose

Async record of the pipeline shakedown. What's load-bearing, what's ceremony, what needs rework — captured here so stratusHue knows what to automate, validate, and scaffold.

- Big-picture → specific. Partial answers fine.
- If it's not here, it doesn't get built.

## How to read this

The **Baseline** column captures firsthand experience using the template day-to-day. **Jen** column is for confirmation, correction, or additional context from the lead perspective. Disagree with a baseline answer? Say so — that's the point.

Sections marked **☆ Team poll candidate** may be opened to the broader design team for more signal.

---

## 1. Big Picture

| # | Question | Baseline | Jen |
|---|---|---|---|
| 1 | Keep only 3 template elements — which and why? | Cover page, page/section labels, creation and delivery assets | |
| 2 | Biggest friction point in the current workflow? | Delivery | |
| 3 | Is the template **the** standard, **a** starting point, or **a** snapshot that drifts? | The standard, but variants may be needed per deliverable | |
| 4 | What deliverable types would drive variants? | *(needs input)* | |
| 5 | How does everyone know a file is ready for handoff? | *(new question — no v1 answer)* | |
| 6 | Primary audience for a delivered file? | *(new question — no v1 answer)* | |

---

## 2. Status & Review

| # | Question | Baseline | Jen |
|---|---|---|---|
| 7 | Who updates status dots? | Designers. Leads sign off via comments. | |
| 8 | How — rename, prop swap, manual edit? | All three — no single method | |
| 9 | All 5 statuses used, or typically 2–3? | At least 3 | |
| 10 | R1 pre-seeded or added at first review? | Added at first review | |
| 11 | Multiple rounds always, or sometimes straight to final? | Multiple rounds are the norm | |
| 12 | All 9 sections used every time? | No — some skipped by project type | |
| 13 | Bottom-to-top order — designer convention, reviewer convention, or just layout? | ⚠️ Needs clarification — unclear who the receiver is | |

---

## 3. Element Check ☆ Team poll candidate

| # | Question | Baseline | Jen |
|---|---|---|---|
| | **Components in Use panel** | | |
| 14 | Referenced at handoff, or does engineering use Dev Mode? | Intent is handoff reference, but engineering uses Dev Mode | |
| 15 | Would anything break if this panel disappeared? | No — fewer manual steps for the designer | |
| | **About This Project** | | |
| 16 | Filled out on last 3 projects? By whom, read by whom? | Delivering designer fills it out. Engineering supposed to read it, but redundant with Jira. | |
| 17 | Same info in Jira/Confluence? Which source wins? | Not in Jira yet — future goal | |
| | **iTrack / Jira links** | | |
| 18 | Clicked from Figma or go to Jira directly? | Clicked from Figma, but tracking is a hassle. Possible separate plugin. | |
| | **Teaching tools** | | |
| 19 | New designers read these, learn from teammates, or both? | Both | |
| 20 | Deleted after onboarding or left in file? | Inconsistent — sometimes deleted, sometimes left forever | |
| | **Collaborator strip** | | |
| 21 | Accurate through the project or only at kickoff? | Accurate, but history wiped on changes | |
| 22 | What does it add over Figma's native collaborator list? | Role/discipline context Figma doesn't show | |
| 23 | Is the history worth preserving, or is current state enough? | Want to preserve history for tribal knowledge | |
| | **Discipline chips** | | |
| 24 | Updated per discipline, or stay at defaults? | Should be updated, but only first 2 get filled | |
| 25 | How many of the 9 actually get filled? | 2. Designer and leads responsible. | |
| | **VQA section** | | |
| 26 | Side-by-side in Figma, or real VQA in browser? | Browser — devs screenshot builds, push via TestFlight | |
| 27 | Record of results, or active workspace? | Record of results when QA didn't pass | |

---

## 4. Annotations

> Need specifics — "yes" isn't buildable. Component keys, names, or screenshots unblock this.

| # | Question | Baseline | Jen |
|---|---|---|---|
| 28 | Standard annotation categories? **List them.** | Yes, they exist — ⚠️ list not provided | |
| 29 | Mandatory annotation pages/sections? **Which ones?** | Yes — ⚠️ mapping not provided | |
| 30 | Format convention? **Component name or key.** | Yes — ⚠️ details not provided | |
| 31 | "Dev Ready" signal — what is it mechanically? | Yes, a flag exists — ⚠️ mechanics not described | |

---

## 5. Tokens & Components

| # | Question | Baseline | Jen |
|---|---|---|---|
| | **Style coverage** | | |
| 32 | Target % for shared style references at handoff? | 100% unless new entry not yet in library | |
| 33 | Styles that must **never** be hardcoded? **Which ones?** | Yes — ⚠️ list not provided | |
| 34 | Figma variables (spacing, radius) — matter for compliance? | Yes, not just color and text | |
| | **Component libraries** | | |
| 35 | One canonical library or multiple per project type? | Two: Components and Foundations | |
| 36 | Detached instances ever OK? Under what circumstances? | Only when creating new components not yet in library | |
| 37 | Plugin flags outdated versions, or leave to Figma's update flow? | Plugin should flag them | |
| 38 | Minimum library usage threshold? **Numbers per delivery type.** | Yes, varies by delivery — ⚠️ no numbers provided | |

---
