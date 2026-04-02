# Docs Reorganization Design

**Date:** 2026-04-02
**Status:** Approved — pending execution
**Trigger:** docs/ had grown into a dumping ground — no clear structure, top-level clutter, naming inconsistency, stale content mixed with live docs.

---

## Goals

1. Clean top-level — only anchor docs at root
2. Mode-first hierarchy matching mental model (navigate / validate / scaffold / shared)
3. camelCase filenames throughout (folders stay lowercase kebab-case)
4. Archive session micro-docs and v1 drafts; delete non-doc artifacts
5. Works well in Obsidian, VS Code, Cursor, and file explorer

---

## Naming Convention

- **Files:** `camelCase.md` (e.g. `designLintFeature.md`, `buildProcess.md`)
- **Folders:** `lowercase-kebab-case` (unchanged from current)
- No ALL_CAPS filenames

---

## Target Structure

```
docs/
  roadmap.md                    anchor doc — stays at root
  dev/                          engineering reference
  navigate/                     Navigate mode specs + features
  validate/                     Validate/lint mode specs
  scaffold/                     Scaffold mode specs
  shared/                       features spanning validate + scaffold
  fixes/                        bug fix docs (renamed to camelCase)
  context/                      penpot + visual layout (unchanged)
  standalone/                   rive preview plugin (unchanged)
  superpowers/                  auto-generated specs/plans (unchanged)
  toolkit/                      unchanged
  archive/                      historical, superseded, session one-offs
    navigation/                 archived navigation micro-docs
    versions/                   superseded v1 drafts
```

---

## File Mapping

### Root → stays
| Current | New |
|---|---|
| `ROADMAP.md` | `roadmap.md` |

### Root → `dev/`
| Current | New |
|---|---|
| `BUILD_PROCESS.md` | `dev/buildProcess.md` |
| `QA_AUTOMATION.md` | `dev/qaAutomation.md` |
| `Figma_Plugin_Troubleshooting_Guide.md` | `dev/figmaPluginTroubleshootingGuide.md` |
| `figma-api-reference-2025.md` | `dev/figmaApiReference2025.md` |
| `FIGMA_PLUGIN_BEST_PRACTICES_REVIEW.md` | `dev/figmaPluginBestPracticesReview.md` |
| `PLUGIN_COMPLIANCE_ASSESSMENT.md` | `dev/pluginComplianceAssessment.md` |
| `PENPOT_DESIGN_INDEX.md` | `archive/penpotDesignIndex.md` |

### Root → `navigate/`
| Current | New |
|---|---|
| `NAVIGATION_ENHANCEMENT.md` | `navigate/navigationEnhancement.md` |
| `RESPONSIVE_GRID_SYSTEM.md` | `navigate/responsiveGridSystem.md` |
| `LOTTIE_SUPPORT.md` | `navigate/lottieSupport.md` |

### `features/` → `navigate/`
| Current | New |
|---|---|
| `features/COLOR_CODED_BUTTONS.md` | `navigate/colorCodedButtons.md` |
| `features/ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md` | `navigate/accessibilityImplementationSummary.md` |
| `features/LAYOUT_SIZING_FEATURE.md` | `navigate/layoutSizingFeature.md` |
| `features/LAYOUT_SIZING_TESTING_GUIDE.md` | `navigate/layoutSizingTestingGuide.md` |
| `features/STYLED_TEXT_FEATURE.md` | `navigate/styledTextFeature.md` |

### `features/` → `validate/`
| Current | New |
|---|---|
| `features/DESIGN_LINT_FEATURE.md` | `validate/designLintFeature.md` |

### `features/` → `scaffold/`
| Current | New |
|---|---|
| `features/SCAFFOLD_MODE.md` | `scaffold/scaffoldMode.md` |
| `features/recipes/` | `scaffold/recipes/` (whole dir) |

### `features/` → `shared/` (spans validate + scaffold)
| Current | New |
|---|---|
| `features/DISCOVERY_AUDIT.md` | `shared/discoveryAudit.md` |
| `features/FIGMA_FIGJAM_MATRIX.md` | `shared/figmaFigjamMatrix.md` |
| `features/CONTENT_AUDIT_WORKFLOWS.md` | `shared/contentAuditWorkflows.md` |
| `features/TEMPLATE_AUDIT_ANALYSIS.md` | `shared/templateAuditAnalysis.md` |
| `features/TEMPLATE_AUDIT_QUESTIONS.md` | `shared/templateAuditQuestions.md` |
| `features/TEMPLATE_AUDIT_REVIEW.md` | `shared/templateAuditReview.md` |
| `features/versions/templateAuditQuestions_v2.md` | `shared/templateAuditQuestionsV2.md` |
| `features/versions/stratusHueOverviewForReview.md` | `shared/stratusHueOverviewForReview.md` |
| `features/STRATUSHUE_SCAFFOLD_VALIDATE_ONBOARDING_ONE_PAGER.md` | `shared/onboardingOnePager.md` |
| `features/UI_SPLIT_REFACTOR.md` | `shared/uiSplitRefactor.md` |
| `features/CURRENT_PLUGIN_STRUCTURE_ANALYSIS.md` | `shared/currentPluginStructureAnalysis.md` |

### `fixes/` → rename in place (camelCase)
| Current | New |
|---|---|
| `fixes/FIGMA_FUNCTIONAL_DEBUG_PLAYBOOK.md` | `fixes/figmaFunctionalDebugPlaybook.md` |
| `fixes/HEADER_HOVER_STATE_FIX.md` | `fixes/headerHoverStateFix.md` |
| `fixes/QUICK_FIX_GUIDE.md` | `fixes/quickFixGuide.md` |
| `fixes/STYLEQ_ERROR_FIX.md` | `fixes/styleqErrorFix.md` |
| `fixes/auto-height-calculation-fix.md` | `fixes/autoHeightCalculationFix.md` |
| `fixes/button-layout-improvements.md` | `fixes/buttonLayoutImprovements.md` |
| `fixes/enter-behavior-clarification.md` | `fixes/enterBehaviorClarification.md` |
| `fixes/enter-button-enablement-fix.md` | `fixes/enterButtonEnablementFix.md` |
| `fixes/enter-button-refinement.md` | `fixes/enterButtonRefinement.md` |

### → `archive/`
| Current | New |
|---|---|
| `CSP_FIXES_SUMMARY.md` | `archive/cspFixesSummary.md` |
| `features/README.md` | `archive/featuresReadme.md` |
| `features/RIVE_PREVIEW_PLUGIN_DESIGN.md` | `archive/riveDupe-design.md` |
| `features/RIVE_PREVIEW_PLUGIN_IMPLEMENTATION.md` | `archive/riveDupe-implementation.md` |
| `features/RIVE_PREVIEW_PLUGIN_REQUIREMENTS.md` | `archive/riveDupe-requirements.md` |
| `features/versions/templateAuditAnalysis_v1.md` | `archive/versions/templateAuditAnalysis_v1.md` |
| `features/versions/templateAuditQuestions_v1.md` | `archive/versions/templateAuditQuestions_v1.md` |
| `features/versions/templateAuditReview_v1.md` | `archive/versions/templateAuditReview_v1.md` |
| All 11 `navigation/*.md` files | `archive/navigation/*.md` |

### → Delete (non-doc artifacts + Beads remnants)
- `stratusHue-beads-2026-03-22.sql` (Beads export, superseded by groundControl migration)
- `.beads-backup-save/` (Beads issues.jsonl + memories.txt backup, no longer needed)
- `stratushue-synthesis.html`
- `Example-2026-02-22-1824.excalidraw`
- `features/lint-mockup.excalidraw`

> Note: `docs/features/FIGMA_FIGJAM_MATRIX.md` (moving to `shared/`) contains content references to Beads ticket IDs ("Beads ar6") — those are historical decision context, not tool artifacts. Leave them as-is.

---

## Post-Move Cleanup

- Remove empty `features/` folder (all contents redistributed)
- Remove empty `navigation/` folder (all contents archived)
- Update `CLAUDE.md` reference: `docs/fixes/FIGMA_FUNCTIONAL_DEBUG_PLAYBOOK.md` → `docs/fixes/figmaFunctionalDebugPlaybook.md`
- Add `README.md` to new top-level folders (navigate, validate, scaffold, shared, dev) describing what lives there
- **Sweep all `docs/features/` cross-references** — update paths in:
  - `docs/roadmap.md` (6+ references to `docs/features/`)
  - Moved spec files that link to each other (SCAFFOLD_MODE, DESIGN_LINT_FEATURE, CONTENT_AUDIT_WORKFLOWS, etc.)
  - `.issues/open/P1-meta-aud-template-methodology-audit.md` — output paths for future deliverables should point to `shared/`, not `features/`
  - `.issues/open/P2-meta-spf-spec-writing-framework.md`
  - `.issues/open/P2-scaffold-sch-recipe-json-schema.md`
  - `.github/copilot-instructions.md` (references `docs/features/FIGMA_FIGJAM_MATRIX.md` and `docs/features/recipes/`)
  - `docs/context/STRATUSHUE_PENPOT_BLUEPRINT.md` (references `docs/features/CURRENT_PLUGIN_STRUCTURE_ANALYSIS.md`)
  - `.memory/` files referencing `docs/features/versions/`

---

## Notes

- `context/`, `standalone/`, `superpowers/`, `toolkit/` are untouched
- `styled-text` currently lives in `navigate/` — move to `shared/` when it spans modes
- Rive Preview dupes in `features/` are removed; `standalone/rive-preview/` is canonical per CLAUDE.md
