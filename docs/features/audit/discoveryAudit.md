# Discovery Audit — What's There vs What's Missing

Generated from brainstorming session on 2026-03-24. Based on review of `docs/features/specs/figmaFigjamMatrix.md` and `recipes/product-design-full.recipe.json`.

```
📋 DISCOVERY AUDIT — What's There vs What's Missing
═══════════════════════════════════════════════════════

✅ CAPTURED                          ❌ MISSING
─────────────────────────────────    ─────────────────────────────────
 Page hierarchy (9 sections)          Component inventory
 Section order + emoji prefixes       Design tokens / color styles
 Cover fields + 2 variants            Text styles / typography tokens
 Status dot legend (5-color)          Annotation schema per page
 VQA template structure               Frame sizing conventions
 Dev Hand Off header fields           Variables (Figma native)
 Project Resources intake form
 Review round format (R1+date)

⚠️ CAPTURED BUT QUESTIONABLE
─────────────────────────────────────────────────────
 Teaching tools    → template meta, not recipe content?
 Library cover     → off-canvas reference, not scaffoldable?
 About This Proj   → actually filled out or aspirational?
 3 sandbox slots   → hardcoded team size assumption?
 LEGAL placement   → truly resolved or file-dependent?
 Date formats      → MM.DD.YYYY vs MM/DD/YYYY — intentional?


🔬 BEHAVIORAL GAPS — Structure ≠ Usage
══════════════════════════════════════════

  📄 Template          ❓ Reality
  (what exists)        (how it's used)
       │                    │
       ▼                    ▼
  ┌──────────┐       ┌──────────────────┐
  │ R1 seeded│  but  │ Is R1 pre-seeded │
  │ at start │──❓──▶│ or added on first│
  │          │       │ actual review?   │
  └──────────┘       └──────────────────┘
  ┌──────────┐       ┌──────────────────┐
  │ 5 status │  but  │ Who updates them?│
  │ dots     │──❓──▶│ Manual rename?   │
  │ defined  │       │ Component prop?  │
  └──────────┘       └──────────────────┘
  ┌──────────┐       ┌──────────────────┐
  │ 9 sections│ but  │ Are all 9 used   │
  │ locked   │──❓──▶│ every project?   │
  └──────────┘       └──────────────────┘
  ┌──────────┐       ┌──────────────────┐
  │ Lifecycle│  but  │ Linear flow or   │
  │ order    │──❓──▶│ sections skipped/│
  │ bottom→up│       │ reordered?       │
  └──────────┘       └──────────────────┘


🎯 READINESS CHECK vs SCAN COVERAGE
═════════════════════════════════════

  Readiness Layer          Scan Evidence
  ─────────────────        ─────────────
  ① Structure              ✅ pages + order
  ② Content                🟡 fields listed, fill behavior unknown
  ③ Annotations            ❌ no annotation schema captured
  ④ Token thresholds       ❌ no styles/variables captured
  ⑤ Component compliance   ❌ no component inventory captured

          ┌─────────────────────────────┐
          │  Readiness Check can only   │
          │  validate layers ① and ②    │
          │  with current scan data.    │
          │                             │
          │  Layers ③④⑤ have NOTHING    │
          │  to diff against.           │
          └─────────────────────────────┘


🍴 THE RECIPE IDENTITY CRISIS
══════════════════════════════

        ❓ Is this recipe...

      ╱              │              ╲
  "THE recipe"    "A recipe"    "A snapshot"
  (universal)     (one variant)   (one file)
      │              │              │
  All projects    Needs siblings  Needs scanner
  use this        (lite, library, to generalize
  structure       internal...)    from N files
      │              │              │
  Schema is       Schema needs    Schema needs
  simple          inheritance     extraction
                  + overrides     rules
```

## Key Findings

### What the scan captured well
- Full page hierarchy with emoji prefixes and ordering
- Cover component fields (both delivery and library variants)
- Status token system (5-color dots)
- VQA section template structure
- Dev Hand Off header with discipline status chips
- Project Resources structured intake form

### What's missing for the Readiness Check
- **Layer ③ Annotations:** No annotation schema was captured — we don't know what annotations are required on which pages
- **Layer ④ Token thresholds:** No Figma-native styles, variables, or design tokens were extracted
- **Layer ⑤ Component compliance:** No component inventory — we don't know which components the template expects

### Behavioral unknowns
- Review rounds (R1, R2...): pre-seeded or added on demand?
- Status dots: updated via page rename, component prop, or something else?
- Section usage: are all 9 sections used on every project?
- Lifecycle: linear bottom-to-top flow, or do teams skip/reorder?

### Questionable captures
- Teaching tools may be template meta-content, not recipe content
- Library cover is off-canvas — may not belong in the recipe at all
- "About this project" intake form may be aspirational (rarely filled)
- 3 sandbox slots assumes a specific team size
- LEGAL placement (standalone vs nested in FINAL) may vary by team
- Date format inconsistency (MM.DD.YYYY vs MM/DD/YYYY) — intentional or drift?

### The recipe identity question
Before building the scanner or schema, we need to resolve: is this **the** recipe (universal), **a** recipe (one variant among many), or **a snapshot** (one file's state)? This determines whether the schema needs variants/inheritance.

---

## Methodology Reframe: Who Owns What?

The recipe JSON as currently drafted duplicates data Figma already stores — component fields, text placeholders, dimension hints, truncation rules. The plugin can query all of this at runtime via `figma.getNodeByIdAsync()` and component property inspection. The recipe shouldn't be a static copy of the file.

```
🔍 WHO OWNS WHAT?
══════════════════

  FIGMA KNOWS                         RECIPE SHOULD OWN
  (queryable at runtime)              (not in Figma's data model)
  ─────────────────────               ─────────────────────────
  🔵 All components used              🟣 Which sections MUST exist
  🔵 All styles applied               🟣 What ORDER they go in
  🔵 All variables bound              🟣 Emoji prefix convention
  🔵 Node tree structure              🟣 Naming patterns ([Job...])
  🔵 Page list + names                🟣 Status dot MEANING
  🔵 Text content                     🟣 Role slot definitions
  🔵 Frame dimensions                 🟣 Field placeholder text
  🔵 Component properties             🟣 What "done" looks like
  🔵 Published library refs           🟣 Team workflow rules
                                      🟣 Which fields are required

         ⚠️ GRAY ZONE
         ─────────────────────────────────────
         Token thresholds  → Figma has the styles,
                             but not the RULE that
                             says "80% coverage needed"

         Component compliance → Figma has the inventory,
                                but not the RULE that
                                says "no detached instances"

         Annotations → Figma has them as nodes,
                       but not the RULE that says
                       "every page needs category X"
```

### The key insight: Recipe = Intent, not State

```
  📄 Template File           📋 Recipe
  (the actual Figma file)    (the rulebook)
       │                          │
       │  "Here are the           │  "Here's what SHOULD
       │   pages, nodes,          │   be there, in what
       │   styles, and            │   order, with what
       │   components"            │   naming, and what
       │                          │   counts as complete"
       ▼                          ▼
  ┌──────────┐            ┌──────────────┐
  │  STATE   │            │  INTENT      │
  │  (is)    │◄── diff ──▶│  (should be) │
  └──────────┘            └──────────────┘
                │
                ▼
        ✅ / ❌ Readiness
```

Half of what the manual scan captured — cover field types, component schemas, text truncation rules — is Figma component metadata the plugin can read natively. The recipe doesn't need to list it.

### What a slim recipe actually looks like

```
  RECIPE (slim version)
  ═════════════════════

  sections:
    - "📔 COVER"        must exist, position 1
    - "VQA"             must exist, position 2
    - "🏁 FINAL"        must exist, position 3
    ...

  rules:
    - cover.fileStatus  must not be "hold" at handoff
    - every section     must have ≥1 status dot = 🟢
    - R[n] lines        must follow "↳ [dot] R[n] - MM.DD.YYYY"
    - no detached       component instances
    - teaching tools    must be deleted before handoff
    - sandbox count     must match collaborator count

  thresholds:
    - style coverage    ≥ 80%
    - unnamed frames    = 0
```

### Implication for the current recipe JSON

The `product-design-full.recipe.json` over-specifies by encoding Figma-queryable state as recipe fields. A revised recipe should contain only:
1. **Structural rules** — what sections exist, their order, naming conventions
2. **Completion rules** — what "done" means per section
3. **Thresholds** — numeric gates (style coverage %, zero unnamed frames, etc.)
4. **Workflow rules** — team-specific conventions Figma doesn't encode (status dot meanings, role slots, date formats)

---

## Template Utility Audit: What's Load-Bearing vs Redundant?

Zooming out past the plugin — the template itself was built by the UX Lead to solve a **cross-discipline communication problem** (aligning Design with Product, Content, and Engineering). But Figma has evolved since. Some template elements now duplicate native Figma capabilities, especially Dev Mode.

The trigger example: the "Components in Use" panel requires designers to manually catalogue components, assign dev owners, and mark design readiness — but Dev Mode already surfaces every component on the page with properties, variants, and code snippets automatically. If engineering uses Dev Mode for handoff, this panel is redundant manual work.

```
🔎 TEMPLATE UTILITY AUDIT
══════════════════════════

  Template Element          Manual Work    Figma Already Does This?
  ─────────────────         ───────────    ────────────────────────
  Components in Use panel   High           ✅ Dev Mode component
                                              inventory + properties

  Status dots on pages      Medium         ❌ No native equivalent
  (⚪🟡🟠🔴🟢)                              (genuine process signal)

  Cover fileStatus badge    Low            ❌ No native file status
                                              (genuine handoff signal)

  Section Headers w/        Medium         🟡 Partially — Dev Mode
  9 discipline chips                          shows ready/not-ready
                                              but not per-discipline

  VQA side-by-side          High           🟡 Dev Mode has overlay
  (design vs dev build)                       compare, but VQA is a
                                              structured review ritual

  "About this project"      High           ✅ Lives in Jira/Confluence
  intake form                                 already? Duplicated here?

  Teaching tools            One-time       ✅ Could be a Figma
  (how to use covers,                         Community template with
  cleanup reminders)                          built-in docs

  Review rounds             Medium         ❌ No native review
  (↳ R1 - date)                              tracking per section

  Collaborator strip        Low            🟡 Figma shows file
  (6 role slots)                              collaborators natively,
                                              but not by discipline

  iTrack links              Low            ✅ Jira integration
                                              exists in Dev Mode
```

### Three buckets

```
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │  🟢 KEEP        │  │  🟡 RETHINK     │  │  🔴 REDUNDANT   │
  │                 │  │                 │  │                 │
  │ Things Figma    │  │ Serves a real   │  │ Figma or other  │
  │ genuinely can't │  │ need but the    │  │ tools already   │
  │ express natively│  │ execution is    │  │ do this — manual│
  │                 │  │ wrong medium    │  │ effort wasted   │
  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
  │ Status dots     │  │ VQA ceremony    │  │ Components in   │
  │ Cover status    │  │ (need exists,   │  │ Use panel       │
  │ Section order   │  │  but Dev Mode   │  │                 │
  │ Review rounds   │  │  overlay may    │  │ iTrack links    │
  │ Emoji prefixes  │  │  replace it)    │  │ (Jira plugin)   │
  │ Naming patterns │  │                 │  │                 │
  │                 │  │ About this      │  │ Teaching tools  │
  │                 │  │ project (need   │  │ (one-time, use  │
  │                 │  │ exists, wrong   │  │ Community tmpl) │
  │                 │  │ system — this   │  │                 │
  │                 │  │ is Confluence)  │  │ Collaborator    │
  │                 │  │                 │  │ strip (Figma    │
  │                 │  │ Discipline      │  │ shows this)     │
  │                 │  │ chips (need     │  │                 │
  │                 │  │ exists, but 9   │  │                 │
  │                 │  │ manual chips?)  │  │                 │
  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### The deeper question: Process theater vs load-bearing process

The template was built to bridge communication gaps. Some of those gaps may have closed as Figma added Dev Mode, Jira integration, overlay compare, and component inspection. Before building a plugin that validates and scaffolds this process, we need the team to answer:

- Does the team actually fill out the "About this project" form, or does it sit empty because the real info is in Jira/Confluence?
- Do the 9 discipline chips get updated throughout the project, or do they stay at defaults?
- Is VQA side-by-side actually reviewed in Figma, or does real VQA happen in a browser with the dev build?
- Are teaching tools read by new team members, or skipped entirely?
- Does the collaborator strip stay current, or is it stale by mid-project?

These are team questions, not plugin questions — but the answers determine what the plugin should validate and scaffold vs. what should be trimmed from the template entirely.

### Implication for stratusHue

If the template needs trimming before we encode it as a recipe, the build order shifts:
1. **Audit the template with the team** — which elements are genuinely used?
2. **Trim the template** — remove redundant elements, move misplaced data to proper systems
3. **Then** design the recipe schema around what survives
4. **Then** build the scanner/validator

Building the plugin against an un-audited template risks automating waste.
