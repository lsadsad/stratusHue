# stratusHue — Beads Issue Export

Exported: 2026-03-22  |  Total: 12 issues

> Re-import: `bd init` then recreate open issues with `bd create`.
> Full DB restore: `dolt sql < .beads/backup/<file>.sql` inside `.beads/dolt/stratusHue/`

## Open (12)

### `stratusHue-ar6` — Consolidate recipe discovery open questions
**Type:** task  |  **Priority:** P1 High  |  **Owner:** es5017+ATT@att.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-22

Batch-resolve remaining open questions discovered during Figma/FigJam capture for the Phase 3 recipe schema. Keep capture moving; resolve these together during schema lock.

Remaining questions:
1. Cover model split: single recipe with coverType discriminator vs separate recipe files for delivery cover vs design library cover.
2. Cover collaborators: editable text fields vs avatar/person component references.
3. Date fields: which are recipe-authored vs runtime-filled (started / last-reviewed / target-handoff).
4. VQA startDate source: Feature component property vs separate text node.
5. Dev Hand Off discipline chip vocabulary: exact per-chip status values.
6. Dev Hand Off components-in-use panel: scaffold by default, optional helper, or Validate-only artifact.

Resolved during capture:
- LEGAL modeled as standalone top-level section (lifecycle-linked to FINAL).
- FINAL Prototype page modeled as empty by default.

Evidence sources:
- docs/features/FIGMA_FIGJAM_MATRIX.md
- docs/features/recipes/product-design-full.recipe.json

Intended outcome:
- finalize recipe JSON structure
- update matrix verdicts
- tighten stratusHue-sob schema scope before implementation work proceeds

**Dependencies:**
- `stratusHue-sob` (discovered-from)

---

### `stratusHue-3gx` — UI: Scaffold tab — recipe selector and apply
**Type:** task  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Implement the Scaffold mode UI (src/ui/scaffold/scaffold-ui.ts, currently a placeholder). Shows available recipes (name, description, page count). User selects one, sees a preview summary, then applies it. Sends scaffold-apply message to sandbox. Shows progress and result notification.

**Dependencies:**
- `stratusHue-xq7` (blocks)

---

### `stratusHue-syv` — Sandbox: stamp recipe to file (recipe metadata)
**Type:** task  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

After Scaffold applies a recipe, write recipe metadata to figma.root.setPluginData: recipe ID, version, timestamp, applied-by. This stamp is what Validate reads to know which recipe to diff against. Define the stamp schema alongside the recipe schema.

**Dependencies:**
- `stratusHue-sob` (blocks)

---

### `stratusHue-07p` — Sandbox: create pages and structure from recipe (layer ①)
**Type:** task  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Feature module (src/features/scaffold-engine.ts) that creates Figma pages from recipe layer ①: correct page order, emoji prefixes, page dividers (separator pages). Idempotent — detect if pages already exist and skip or update rather than duplicate.

**Dependencies:**
- `stratusHue-xq7` (blocks)

---

### `stratusHue-edq` — Sandbox: create content templates from recipe (layer ②)
**Type:** task  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Extend scaffold engine to create layer ② content per page: starter frames, section containers, text nodes with placeholder copy, and Figma variable placeholders using the naming convention from the schema design issue. Variable names must follow the tool-agnostic convention.

**Dependencies:**
- `stratusHue-07p` (blocks)

---

### `stratusHue-xq7` — Sandbox: recipe loader and parser
**Type:** task  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Sandbox-side module that loads a recipe JSON (from clientStorage or file import), validates its structure, and exposes typed recipe data to the Scaffold feature module. Handles versioning/schema migration if recipe format evolves.

---

### `stratusHue-sob` — Design recipe JSON schema (layers ①②)
**Type:** task  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Define the recipe JSON format that Scaffold reads. Must cover: layer ① structure (pages, order, emoji prefixes, dividers) and layer ② content (starter frames, section containers, text nodes, variable placeholders with naming convention). Schema must be designed for future extension to layers ③④⑤ (annotations, tokens, components). Variable naming convention must be tool-agnostic so a future content interface can read it. Document in docs/features/SCAFFOLD_MODE.md.

---

### `stratusHue-dt6` — Phase 3: Scaffold mode — epic
**Type:** feature  |  **Priority:** P1 High  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Full implementation of the Scaffold mode tab. Scaffold reads recipe layers ①② (structure + content) to create pages, section containers, content frames, and variable placeholders in a Figma file. This epic tracks all sub-tasks: recipe schema, sandbox implementation, UI, and team sharing.

**Dependencies:**
- `stratusHue-3gx` (blocks)
- `stratusHue-edq` (blocks)
- `stratusHue-syv` (blocks)

---

### `stratusHue-le3` — Recipe JSON import/export and team sharing
**Type:** feature  |  **Priority:** P2 Medium  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Allow teams to import/export recipe JSON files from the plugin UI. Scaffold tab includes Import Recipe (reads JSON file via file input, validates, stores to clientStorage) and Export Recipe (downloads current recipe as JSON). This is how teams distribute and update their standardized templates.

**Dependencies:**
- `stratusHue-sob` (blocks)

---

### `stratusHue-cqv` — Readiness Check: full recipe audit (recipe diff)
**Type:** feature  |  **Priority:** P3 Low  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Full handoff readiness check that diffs the current Figma file state against the applied recipe. Checks all five layers: ① structure (required pages present), ② content (variables filled and approved), ③ annotations (required categories per page), ④ token thresholds met, ⑤ component compliance. Produces a pass/fail readiness report.

---

### `stratusHue-hsu` — Validate Phase 2: Token audit (variable coverage)
**Type:** feature  |  **Priority:** P3 Low  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Add token audit to Validate mode. Per-page scan of variable (token) coverage against recipe-defined thresholds (e.g. color ≥90%, spacing ≥80%, type ≥85%). Report coverage percentages and flag pages below threshold. Depends on recipe schema existing.

---

### `stratusHue-vhz` — Validate Phase 3: Component check (library compliance)
**Type:** feature  |  **Priority:** P3 Low  |  **Owner:** levin@okdomo.com
**Created:** 2026-03-21  |  **Updated:** 2026-03-21

Add component check to Validate mode. Per-page audit of component instances: flag detached components, components from unapproved libraries, and outdated component versions. Compliance rules sourced from recipe layer ⑤.

---
