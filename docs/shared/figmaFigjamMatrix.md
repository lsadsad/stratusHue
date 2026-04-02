# Figma / FigJam Discovery Matrix

**Status:** Cover complete ✅ | VQA complete ✅ | FINAL/Dev Hand Off partial ✅ | PROJECT RESOURCES partial ✅ | LEGAL partial ✅ | UI/VISUAL DESIGN partial ✅ | UX/IA partial ✅ | ARCHIVE partial ✅ | SANDBOXES pending  
**Source files:**
- Figma: Delivery Template Draft File — `CAL87CQlzeFN0T3dtrkm24`
- FigJam: AT&T App Design Workflow Board (6 frames collected)
- Repo docs: `SCAFFOLD_MODE.md`, `ROADMAP.md`, `stratushue-synthesis.html`

**Collection method:** Multi-select section first → spatial map → drill into on-canvas targets individually.

---

## 1. Figma File — Page Hierarchy

Extracted from user-provided screenshots (screenshot-level confidence unless MCP-confirmed).

| # | Section name | Emoji prefix | Child items observed |
|---|---|---|---|
| 1 | COVER | 📔 | See cover items detail below |
| 2 | VQA | — | [Experience being VQA'd] – Started MM.DD.YYYY |
| 3 | FINAL | 🏁 | Prototype – MM.DD.YYYY · Dev Hand Off – MM.DD.YYYY |
| 4 | LEGAL | ⚖️ | Legal Review ONLY: MM.DD.YYYY |
| 5 | PROJECT RESOURCES | 📝 | Project brief · Research · References · User Flows · Post Standards Review Alignment |
| 6 | UI/VISUAL DESIGN | 🎨 | [Job to be done] Designs · R1 – MM.DD.YYYY (status dot) · Motion · Design System · File Components |
| 7 | UX/IA | 🗺️ | [Job to be done] Wireframes · R1 – MM.DD.YYYY (status dot) |
| 8 | ARCHIVE | 🗂️ | — |
| 9 | SANDBOXES | 🚨 | [Collaborator 1] sandbox · [Collaborator 2] sandbox · [Collaborator 3] sandbox |

Status dots in sidebar use a 5-color legend: ⚪ not started · 🟡 in progress · 🟠 in review · 🔴 do not use · 🟢 done/approved

Canonical status shorthand for lifecycle lines: `⚪️ 🟡 🟠 🔴 🟢  <- Use for Review Statuses`

---

## 2. Cover Items — MCP Collection Log

**Spatial layout (multi-select revealed):**
- `1:185` `📔 File thumbnail` at (0, 0) → **on-canvas** = the deliverable cover
- `2163:39095` at (-1985, 0) → off-canvas teaching tool ("How to use covers")
- `2163:39340` at (-2026, -1724) → off-canvas teaching tool (cleanup reminder)
- `2245:9324` at (-1985, -2958) → off-canvas, child instance: **`Design Library Cover`** (separate variant)

**Two cover types exist:**
1. **Delivery file cover** — `📔 File thumbnail` (`1:185`), on-canvas
2. **Design library cover** — `Design Library Cover` (`2245:9324`), off-canvas reference variant

| Item # | Node ID | Description | Confirmed |
|---|---|---|---|
| 1 | `2245:9324` | Design Library Cover variant — 6-value status enum (Draft/Explorations/Testing/Released/Backlog/Archived) | ✅ Library variant — ⚠️ separate from delivery cover status |
| 2 | `2163:39095` | "How to use covers" doc frame — documents all cover component properties, toggles, text fields, fileStatus enum | ✅ Teaching tool |
| 3 | `1:185` | `📔 File thumbnail` — actual deliverable cover (1920×1080) | ✅ On-canvas deliverable |
| 4 | `2163:39340` | "Delete all teaching tools as part of your file clean up for delivery" | ✅ Teaching tool cleanup reminder |

**Cover item 2 detail (node `2163:39095`) — "How to use covers":**

_Toggles:_
- `cover.isMasterFile` — boolean, default false; Master files maintain broader journey, not used for delivery
- `cover.showStatus` — boolean, toggle to show/hide fileStatus on cover

_Text fields (surfaced in Figma properties panel):_
- `cover.fileName` — string, required; truncates at 2 lines; plain-language
- `cover.description` — string, optional; truncates at **3 lines** (how-to doc says 2, actual component says 3 — use 3)

_File Status enum (workflow/handoff stage):_
- `cover.fileStatus` — 8-value enum:
  - `in-progress` — Design working, not ready for dev
  - `ready-for-dev` — Design approved, marked for dev
  - `under-review` — External reviews triggered (Legal, Brand, etc.)
  - `launched` — Designs in production
  - `outdated-archive` — Deprecated; look to Master or updated designs
  - `hold` — Project on hold; follow iTrack link for details
  - `discovery` — Early discovery, not yet in production pipeline
  - `dev-in-progress` — Actively in development; demos, reviews, VQA active

_iTrack:_ Lives on the "READ ME" page of the file, NOT on the cover. Not a cover recipe field.

**Cover item 3 detail (node `1:185`) — File Cover Thumbnail:**

- Status badge (top-left): `.File-status` component renders `emoji + text label` pill → shows `cover.fileStatus`
- Title: `cover.fileName` — 120px bold, placeholder "Feature in Plain English and no longer than 2 lines"
- Description: `cover.description` — 64px medium, placeholder "Max 3 lines"
- Logo slot (top-right): 88×64px empty area — not a recipe field
- Collaborator strip (bottom): **6 fixed discipline slots**, each with discipline label + "Primary Collaborator" name
  - Confirmed discipline keys: `ia-ux` · `ui-visual` · `content` · `motion` · `product` · `development`

---

## 3. VQA — MCP Collection Log

**Spatial layout (multi-select):**
- `2550:15959` "More on VQA" — teaching tool section (off-canvas)
- `2550:2071` "VQA - [Experience being VQA'd]" — **blank template section**
- `2545:9111` "EXAMPLE VQA - Dashboard FAQ accordion section" — **filled example** (designer: Bryan B, developer: Noa, real simulator screenshots)

**Template structure (`2550:2071`):**
- Each experience = one Figma section named `VQA - [Experience name]`
- `Feature` instance — experience name header
- `Designer: [Name]` + `Developer: [Name]` text placeholders
- Review context columns (viewport/theme labels): `Light Mode`, `Dark Mode/200%`
- Left side: design frames ("Your representative designs here for 1:1 comparison")
- Right side: dev build frames ("Dev provided screen or Design captured from test build"), named "(same as delivered)"
- Middle: `Callout/VQA` annotation instances + measurement instances (M 24, M 25, etc.)
- `Redlines :: Section Title` frame in middle zone

**Example confirmed additional review contexts (`2545:9111`):**
`closed` · `open` · `Light Mode` · `Dark Mode` · `200%` · `Dark Mode/200%`
Review contexts are **not a fixed enum** — designer adds relevant contexts per experience.

---

## 4. FigJam Frames — Evidence Log

## 4. Delivery Hand Off — MCP Collection Log

**Section selected:** `2164:51795` `Delivery Hand Off - MM.DD.YYYY`

**Metadata structure:**
- `2164:51796` `Section Header`
- `2164:51797` `Components in use`

**Section Header screenshot-confirmed fields:**
- `sectionName` — placeholder `Section Name`
- `subtitle` — placeholder `Subtitle or secondary section name`
- `description` — placeholder `Descriptive text`
- `itrackReference` — pill/button labeled `iTrack Epic or feature`
- `updatedDate` — `Updated: MM/DD/YYYY`
- `disciplineStatuses` — 9 status chips shown inline:
  - `IA/UX`
  - `UI/Visual`
  - `Content`
  - `Motion`
  - `Testing`
  - `Design Review`
  - `Brand Review`
  - `Legal Review`
  - `Standards`

**Interpretation:** This confirms the Dev Hand Off page is built around a reusable section-header scaffold plus a helper inventory panel. The status chips line up with FigJam Frame 3 guidance: section headers communicate approval state and which teams are engaged.

**Components in use panel (`2164:51797`):**
- Title: `Components in use`
- Subtitle: `Developer estimation helper`
- Three instruction groups:
  - `Feature Designer`
  - `Development Team`
  - `Reference`
- Large component inventory grid where each row item shows:
  - short code badge
  - component name
  - `Dev owner:`
  - `Design:` readiness/status

**Interpretation:** The inventory block is helper content for handoff estimation and component auditing, not core page identity metadata. Keep it in the recipe as an optional helper scaffold.

## 4. Project Resources — MCP Collection Log

**Section selected:** `8:296` `About this project` (single-node instance under Project Resources)

**Structure confirmed from screenshot:**
- `About`
  - `Start Date` (`MM/DD/YYYY`)
  - `Deadline` (`MM/DD/YYYY`)
  - `Product Brief` (link field)
  - `OUT OF SCOPE` free text
- `iTrack Link(s)`
  - repeated pair: `[SPTMYATTAP-#####: iTrack Feature or Epic name]` + `https://`
- `Team`
  - UX Design, UI Design, Motion, Content, Tech Product Mgr, Dev Lead, Scrum team
- `Stakeholders`
  - repeated `Department` + `Name`
- `Other Supporting Links`
  - repeated description + `https://`
- `Notes`
  - optional freeform notes field

**Interpretation:** Project Resources is a structured intake/reference page scaffold, not just a loose links list.

**Additional Project Resources node (Research):**
- `2164:43630` `Example Insights + Takeaways from Message Center 2025`
  - Contains long-form research insights, actionable takeaways, and UX recommendations
  - Includes a textual note card instance (`2164:43632`)
- Companion cleanup reminder text: `2164:43640` (`Delete all teaching tools and examples as part of your file clean up for delivery`)

**Interpretation:** Research examples are reference/teaching artifacts. Keep as optional content in recipe; do not scaffold by default.

**Additional Project Resources node (User Flows):**
- `2163:36979` `Example User Flow from Onboarding 2025`
  - Large flowchart-style example board with a start node (`Launch AT&T app`), multiple lane headers (`Content A-D`), and many scenario/decision steps
  - Contains branch variants like onboarding intro, notification settings with/without OS trigger, location benefits, and tour branches

**Interpretation:** User flow examples are reference/teaching artifacts. Keep as optional content in recipe; do not scaffold by default.

## 4. Legal Review — MCP Collection Log

**Section selected:** `2225:18586` `EXAMPLE Try AT&T Legal Review: 10.20.2025`

**What this changes:**
- Legal in the current template behaves as a standalone top-level section in file structure.
- The selected content is a large review board/flow package (examples and connected scenarios), not just a single dated status line.
- Legal remains lifecycle-related to FINAL, but structurally separate in template scaffolding.

## 4. Prototype (FINAL) — Capture Decision

- User-confirmed: Prototype page is empty in current template use.
- Scaffold decision: create the page/group, but do not seed default node content.

## 4. UI/VISUAL DESIGN — Capture Log

**Current capture level:** Sidebar-level structure confirmed from file hierarchy screenshots.

**This pass scope:** line item pattern `↳ ⚪️ R1 - MM.DD.YYYY` under UI/VISUAL DESIGN.

**Observed child items under UI/VISUAL DESIGN:**
- `[Job to be done] Designs`
- `R1 - MM.DD.YYYY` (with status dot)
- `Motion`
- `Design System`
- `File Components`

**Interpretation:**
- Treat `[Job to be done] Designs` as the primary container for one or more feature/design tracks.
- Keep review rounds (`R1`, etc.) as dated lifecycle entries using shared status tokens.
- For initial scaffold seed, map `R1` status to `not-started` (⚪️), producing `↳ ⚪️ R1 - MM.DD.YYYY`.
- Keep `Motion`, `Design System`, and `File Components` as optional resource/support groups in the section scaffold.
- Defer deep node-level schema (frame internals, naming constraints, required fields inside each design track) to a focused node pull.

## 4. UX/IA — Capture Log

**Current capture level:** Sidebar-level structure confirmed from file hierarchy screenshots.

**This pass scope:** line item pattern `↳⚪️ R1 - MM.DD.YYYY` under UX/IA.

**Observed child items under UX/IA:**
- `[Job to be done] Wireframes`
- `R1 - MM.DD.YYYY` (with status dot)

**Interpretation:**
- Treat `[Job to be done] Wireframes` as the primary container for one or more wireframe/IA tracks.
- Keep review rounds (`R1`, etc.) as dated lifecycle entries using shared status tokens.
- For initial scaffold seed, map `R1` status to `not-started` (⚪️), producing `↳⚪️ R1 - MM.DD.YYYY`.
- Defer deep node-level schema (frame internals, IA annotation expectations, required artifacts inside each wireframe track) to a focused node pull.

## 4. ARCHIVE — Capture Log

**Current capture level:** Sidebar-level structure confirmed from file hierarchy screenshots.

**Observed child items under ARCHIVE:**
- none shown in current template sidebar

**Interpretation:**
- Treat `ARCHIVE` as an empty-by-default container in scaffold output.
- Keep archive contents optional and team-driven (moved/deprecated rounds, superseded explorations, historical references).
- Defer archival taxonomy/details (required metadata, auto-naming, move rules) to a focused node/process pull.

### Frame 1 — Start Here (node `1:53`)
- **Recipe relevance:** Orientation only. No layer-1 structure.

### Frame 2 — How to read the Delivery File (node `1:59`)
- Sidebar groups: Cover · VQA · Final (Handoff + Legal) · Project Resources · Design · UX · Archive · Sandboxes
- Emoji prefixes: 📔 🏁 🚀 ⚖️ 📝 🎨 🗺️ 🗂️ 🚨
- "The sidebar reflects the lifecycle of the work… building from bottom to top towards launch"
- **Recipe relevance:** PRIMARY — layer-1 page ordering + group naming.

### Frame 3 — File signals: Cover + Statuses (node `1:54`)
- Status legend: ⚪ not started · 🟡 in progress · 🟠 in review · 🔴 do not use · 🟢 done/approved
- Section Header guidance: approval tracking + engaged team signals
- Item-level pattern: `↳ [item]` + review rounds with status tokens and dates
- **Recipe relevance:** PRIMARY — status-dot token set + layer-2 lifecycle conventions.

### Frame 4 — Alignment phases (node `1:91`)
- Role engagement tracks: UX/IA · UI · Content · Motion · Dev · Product
- States: Peak, Engaged
- **Recipe relevance:** Future metadata only. Not in Phase-3 scope.

### Frame 5 — What to review (node `34:894`)
- UX/IA scope: jobs-to-be-done, IA flows, annotations, research, live activities, push notifications
- UI scope: option refinement, flow alignment, edge/error cases, design refs, design system, visual contexts, motion, platform specifics, content maturation
- Items marked `*` move to Project Resources when finalized
- **Recipe relevance:** PRIMARY — layer-2 checklist/content schema fields.

### Frame 6 — After Handoff (node `41:679`)
- Post-handoff loop: Designer Handoff → Dev Build → VQA → Launch
- Change governance: no delivery changes without product + dev alignment; otherwise backlog
- **Recipe relevance:** Future governance/policy. Not in Phase-3 scope.

---

## 5. Comparison Matrix

| Concept | FigJam evidence | Figma evidence | Docs assumption | Verdict |
|---|---|---|---|---|
| Page group order | Frame 2: Cover→VQA→Final→Legal→PR→Design→UX→Archive→Sandboxes | Screenshot: same order | `SCAFFOLD_MODE.md` similar but lighter | ✅ Confirmed |
| Emoji prefixes on groups | Frame 2: emoji per group | Screenshot: visible | Not in docs | ✅ Confirmed |
| Cover status enum (library) | Frame 3: references status | Node `2245:9324`: 6-value enum | Not in docs | ✅ Confirmed — library cover only |
| Cover fileStatus enum (delivery) | Not explicit | Node `2163:39095`: 8-value workflow enum | Not in docs | ✅ Confirmed — delivery cover |
| Two cover types (delivery vs library) | Not referenced | Multi-select spatial map | Not in docs | ✅ **New finding** |
| Cover.fileName | Not explicit | Node `1:185`: 2-line truncation, plain-language | Not in docs | ✅ Confirmed |
| Cover.description | Not explicit | Node `2163:39095`: 2 lines; node `1:185`: 3 lines | Not in docs | ✅ Confirmed — 3 lines (component wins) |
| Cover.isMasterFile toggle | Not explicit | Node `2163:39095` | Not in docs | ✅ Confirmed |
| Cover collaborator slots (6 fixed) | Not explicit | Node `1:185`: ia-ux/ui-visual/content/motion/product/development | Not in docs | ✅ Confirmed |
| Teaching tools on Cover page | Not referenced | Nodes `2163:39095` + `2163:39340` off-canvas | Not in docs | ✅ **New finding** — Validate should flag un-deleted teaching tools |
| iTrack link on cover | Frame 3: mentioned | Node `2163:39095`: lives on README page, NOT cover | Assumed on cover | ✅ Resolved — not a cover field |
| Status dots (5-color) | Frame 3: ⚪🟡🟠🔴🟢 | Screenshot: visible in sidebar | Not in docs | ✅ Confirmed |
| Review status shorthand usage | Frame 3 status legend + item lifecycle pattern | Applied to `R1 - MM.DD.YYYY` lifecycle lines | Not in docs | ✅ Confirmed (`⚪️ 🟡 🟠 🔴 🟢 <- Use for Review Statuses`) |
| VQA section structure | Not detailed | Node `2550:2071`: Feature + Designer/Developer + review columns + callouts | Partially referenced | ✅ Confirmed |
| VQA review contexts | Not specified | Template: Light/Dark+200%; Example: closed/open/Dark/200% | Not in docs | ✅ Confirmed — dynamic, not fixed enum |
| Dev Hand Off header fields | Frame 3: section headers track approvals + engaged teams | Node `2164:51795`: sectionName, subtitle, description, iTrack reference, updated date, 9 discipline chips | Not in docs | ✅ Confirmed |
| Dev Hand Off component inventory | Not explicit | Node `2164:51797`: developer estimation helper + component inventory grid | Not in docs | ✅ Confirmed — helper scaffold |
| Project Resources intake page | Frame 5: finalized artifacts move into Project Resources | Node `8:296`: About, iTrack links, Team, Stakeholders, Supporting Links, Notes | Not in docs | ✅ Confirmed — structured page scaffold |
| Project Resources research examples | Frame 5 implies research artifacts feed Project Resources | Node `2164:43630`: insights/takeaways/UX recommendations example block + cleanup text `2164:43640` | Not in docs | ✅ Confirmed — optional reference content |
| Project Resources user flow examples | Frame 5 implies artifact curation in Project Resources | Node `2163:36979`: flowchart example board with branching onboarding scenarios | Not in docs | ✅ Confirmed — optional reference content |
| LEGAL placement | Frame 2: "Final (Handoff + Legal)" implies lifecycle coupling | Node `2225:18586`: standalone legal review board section | Unclear | ✅ Resolved — standalone structure, lifecycle-related to FINAL |
| Prototype page content | Not explicit | User-confirmed empty in template use | Unclear | ✅ Resolved — empty-by-default scaffold |
| Item-level lifecycle lines (↳ pattern) | Frame 3: confirmed | Screenshot: R1 – MM.DD.YYYY | Partially referenced | ✅ Confirmed |
| MM.DD.YYYY date format | Frame 2/3: repeated | Screenshot: all dated items | Not in docs | ✅ Confirmed |
| PROJECT RESOURCES sub-items | Frame 5: items marked * move here | Screenshot: Project brief/Research/References/User Flows/Post Standards | Not specced | ✅ Confirmed |
| UI/VISUAL DESIGN starter items | Frame 2/5 imply design-phase artifacts and review cadence | Screenshot: [Job to be done] Designs, R1, Motion, Design System, File Components | Not specced | ✅ Confirmed (sidebar-level) |
| UI/VISUAL R1 lifecycle line | Frame 3 item lifecycle pattern + status legend | Screenshot: R1 - MM.DD.YYYY with status dot | Not specced | ✅ Confirmed (seed as `not-started` / ⚪️) |
| UX/IA starter items | Frame 2/5 imply IA artifacts and review cadence | Screenshot: [Job to be done] Wireframes, R1 | Not specced | ✅ Confirmed (sidebar-level) |
| UX/IA R1 lifecycle line | Frame 3 item lifecycle pattern + status legend | Screenshot: R1 - MM.DD.YYYY with status dot | Not specced | ✅ Confirmed (seed as `not-started` / ⚪️) |
| ARCHIVE section baseline | Frame 2 includes Archive in lifecycle grouping | Screenshot: ARCHIVE has no visible child items | Not specced | ✅ Confirmed (empty-by-default at sidebar level) |
| SANDBOXES collaborator slots | Not detailed | Screenshot: [Collaborator N] sandbox | Not in docs | ✅ Confirmed |

---

## 6. Open Questions

1. **Two cover types:** Delivery cover (`cover.fileStatus` 8-value) vs library cover (`cover.status` 6-value). Decision: single recipe with `coverType` switch, or separate recipe files?
3. **Cover.collaborators:** Editable text name fields or avatar/person component references?
4. **Date fields:** `started` / `last-reviewed` / `target-handoff` — which are recipe fields vs runtime-filled?
5. **VQA startDate source:** In the Feature component properties or a separate text node?
6. **Dev Hand Off status chips:** Exact per-chip status vocabulary still needs a deeper node pull.
7. **Components in use panel:** Default scaffold content vs optional helper vs Validate-only artifact?
8. **Project Resources page default:** Always scaffold `About this project` vs optional by recipe variant?
9. **Project Resources research examples:** preserve as optional reference content only, or allow recipe variants to pre-seed one example block?
10. **Project Resources user flow examples:** preserve as optional reference content only, or allow recipe variants to pre-seed one example flow board?
11. **UI/VISUAL [Job to be done] internals:** what is the minimum required inner scaffold (required frames/annotations/checklist) per job-to-be-done design track?
12. **UX/IA [Job to be done] internals:** what is the minimum required inner scaffold (required wireframe/IA annotation set) per job-to-be-done track?
13. **ARCHIVE internals:** is there a required archival item schema (date/status/reason/owner) or does ARCHIVE remain a freeform holding area?

---

## 7. Recipe Schema — Confirmed Fields (Phase 3)

### Cover (delivery file)
```
cover.fileName          string   required  2-line truncation
cover.description       string   optional  3-line truncation
cover.fileStatus        enum(8)  optional  in-progress|ready-for-dev|under-review|launched|outdated-archive|hold|discovery|dev-in-progress
cover.isMasterFile      boolean  optional  default false
cover.showStatus        boolean  optional  default true
cover.collaborators     object   optional  6 fixed slots: ia-ux|ui-visual|content|motion|product|development
```

### Cover (library file — separate variant)
```
cover.status  enum(6)  required  draft|explorations|testing|released|backlog|archived
```

### VQA
```
vqa.experiences[].name            string   required  section title: "VQA - [name]"
vqa.experiences[].startDate       string   optional  MM.DD.YYYY
vqa.experiences[].designer        string   optional  [Name]
vqa.experiences[].developer       string   optional  [Name]
vqa.experiences[].reviewContexts  array    optional  dynamic labels per experience
```

### Final / Dev Hand Off
```
final.devHandOff.sectionName                 string   required
final.devHandOff.subtitle                    string   optional
final.devHandOff.description                 string   optional
final.devHandOff.itrackReference             string   optional
final.devHandOff.updatedDate                 string   optional  MM/DD/YYYY
final.devHandOff.disciplineStatuses          object   optional  ia-ux|ui-visual|content|motion|testing|design-review|brand-review|legal-review|standards
final.devHandOff.componentsInUse.components  array    optional  helper inventory for developer estimation
```

### Project Resources
```
projectResources.about.startDate           string   optional  MM/DD/YYYY
projectResources.about.deadline            string   optional  MM/DD/YYYY
projectResources.about.productBrief        string   optional  link field
projectResources.about.outOfScope          string   optional
projectResources.itrackLinks[]             array    optional  ref + url pair
projectResources.team                      object   optional  ux-design|ui-design|motion|content|tech-product-manager|dev-lead|scrum-team
projectResources.stakeholders[]            array    optional  department + name
projectResources.otherSupportingLinks[]    array    optional  description + url
projectResources.notes                     string   optional
projectResources.researchExamples[]        array    optional  reference content only (default off)
projectResources.userFlowExamples[]        array    optional  reference content only (default off)
```

### Section structure (all sections)
```
sections[].name      string with emoji prefix   required
sections[].order     integer (FigJam Frame 2)   required
sections[].items[]   array of child items        optional
items[].label        string (supports [placeholder] bracket notation)
items[].date         string MM.DD.YYYY           optional
items[].status       ref: status-dot enum        optional
```

### Status tokens
```
not-started  ⚪  not started
in-progress  🟡  in progress
in-review    🟠  in review
do-not-use   🔴  do not use
done         🟢  done / approved
```

---

## 8. Deferred (Future Layers)

| Item | Future layer | Source |
|---|---|---|
| Role engagement metadata (Peak/Engaged) | Layer 4+ | FigJam Frame 4 |
| Review checklist items by discipline | Layer 2 (content) | FigJam Frame 5 |
| Post-handoff governance rules | Layer 5+ | FigJam Frame 6 |
| Validate status-dot readiness checks | Validate mode | FigJam Frame 3 |
| Teaching-tool frame detection | Validate mode | Cover item 4 |
| iTrack link on README page | Future validate | FigJam Frame 3 |

---

## 9. Visual Summary

### 9a — Template Structure

```
┌──────────────────────────────────────────────────────────────┐
│        Product Design Delivery File — Template               │
└──────────────────────────────────────────────────────────────┘
  │
  ├── 📔 COVER
  │     ├── fileName · description · fileStatus (enum 8)
  │     ├── isMasterFile · showStatus
  │     └── collaborators ── 6 slots: IA/UX · UI · Content
  │                                   Motion · Product · Dev
  ├── VQA
  │     └── [Experience] – MM.DD.YYYY
  │           ├── designer / developer
  │           ├── reviewContexts  (dynamic, not fixed enum)
  │           ├── designFrames  ◀──  left  │  right  ──▶ devFrames
  │           └── callouts (middle zone)
  │
  ├── 🏁 FINAL
  │     ├── Prototype         ░░ empty by default ░░
  │     └── Dev Hand Off – MM.DD.YYYY
  │           ├── sectionName · subtitle · description
  │           ├── itrackReference · updatedDate
  │           ├── disciplineStatuses ── 9 chips
  │           └── componentsInUse    ── helper scaffold ⚙️
  │
  ├── ⚖️ LEGAL  ─ ─ ─ ─ ─ ─ ─ ─ (lifecycle → FINAL)
  │     └── Legal Review ONLY – MM.DD.YYYY
  │
  ├── 📝 PROJECT RESOURCES
  │     ├── About this project
  │     │     ├── startDate · deadline · productBrief
  │     │     ├── iTrackLinks[] · team · stakeholders
  │     │     └── otherSupportingLinks · notes
  │     ├── Research       (example — scaffoldDefault: false)
  │     ├── References
  │     ├── User Flows     (example — scaffoldDefault: false)
  │     └── Post Standards Review Alignment
  │
  ├── 🎨 UI/VISUAL DESIGN
  │     ├── [Job to be done] Designs
  │     ├── ↳⚪️ R1 – MM.DD.YYYY
  │     └── Motion · Design System · File Components
  │
  ├── 🗺️ UX/IA
  │     ├── [Job to be done] Wireframes
  │     └── ↳⚪️ R1 – MM.DD.YYYY
  │
  ├── 🗂️ ARCHIVE     ░░ empty by default ░░
  │
  └── 🚨 SANDBOXES
        ├── [Collaborator 1] sandbox
        ├── [Collaborator 2] sandbox
        └── [Collaborator 3] sandbox

  ⚪️ 🟡 🟠 🔴 🟢  ← Use for Review Statuses on all ↳ lines
```

---

### 9b — Figma vs FigJam Evidence Alignment

```
╔════════════════════════╗           ╔════════════════════════╗
║   FigJam  (6 frames)   ║           ║  Figma File (9 pages)  ║
╠════════════════════════╣           ╠════════════════════════╣
║ Lifecycle intent       ║           ║ Field-level impl       ║
║ Section order + emojis ║◀── ✅ ──▶║ Section order + emojis ║
║ 5-color status tokens  ║◀── ✅ ──▶║ Status dots in sidebar ║
║ R1 review cadence      ║◀── ✅ ──▶║ ↳ R1 – MM.DD.YYYY rows ║
║ PR = finalized artefact║◀── ✅ ──▶║ PR intake page (8:296) ║
║ Section header signals ║◀── ✅ ──▶║ 9 discipline chips     ║
╠════════════════════════╣           ╠════════════════════════╣
║ LEGAL inside FINAL     ║ ⚠️  ≠    ║ LEGAL standalone page  ║
║ (lifecycle coupling)   ║  RESOLVED ║ (structural)           ║
╠════════════════════════╣           ╠════════════════════════╣
║ (cover not detailed)   ║ ── NEW ──▶║ 2 cover variants found ║
║                        ║  FINDING  ║ delivery vs library    ║
╠════════════════════════╣           ╠════════════════════════╣
║ (chip vocab not listed)║ ❓  OPEN  ║ 9 chips visible, vocab ║
║                        ║           ║ not yet node-pulled    ║
╚════════════════════════╝           ╚════════════════════════╝
```

---

### 9c — Schema Lock State

```
┌─────────────────────────────────┬──────────┬───────────────┐
│ Decision                        │  State   │  Next action  │
├─────────────────────────────────┼──────────┼───────────────┤
│ Section order (9 groups)        │  LOCKED  │      —        │
│ Section emoji set               │  LOCKED  │      —        │
│ 5-color status token set        │  LOCKED  │      —        │
│ ↳⚪️ R1 review line format       │  LOCKED  │      —        │
│ LEGAL → standalone placement    │  LOCKED  │      —        │
│ Prototype empty-by-default      │  LOCKED  │      —        │
│ Archive empty-by-default        │  LOCKED  │      —        │
│ Sandboxes empty-by-default      │  LOCKED  │      —        │
│ Research/UserFlow default=off   │  LOCKED  │      —        │
├─────────────────────────────────┼──────────┼───────────────┤
│ Cover model (1 vs 2 recipes)    │  OPEN    │  Beads ar6    │
│ Discipline chip status vocab    │  OPEN    │  Beads ar6    │
│ Helper blocks scaffold default  │  OPEN    │  Beads ar6    │
│ Job-to-be-done inner scaffold   │  OPEN    │  Beads ar6    │
│ Cover.collaborators field type  │  OPEN    │  Beads ar6    │
└─────────────────────────────────┴──────────┴───────────────┘

  LOCKED = safe to implement │ OPEN = block on decision before build
```
