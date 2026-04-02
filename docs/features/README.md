# Feature Docs

Specifications for features that are part of stratusHue's three-mode system (Navigate / Validate / Scaffold).

For the phased implementation plan and performance strategy, see `docs/ROADMAP.md`.

## audit/

Template methodology audit — research, analysis, and UX lead review.

| Doc | Phase | Purpose |
|---|---|---|
| `discoveryAudit.md` | Pre-work | Initial discovery & element inventory |
| `templateAuditQuestions.md` | 1 | 35-question questionnaire + all answers |
| `templateAuditAnalysis.md` | 2 | Synthesized findings — dispositions, gaps, thresholds |
| `templateAuditReview.md` | 3 | **UX lead deliverable** — decisions, open Qs, clarifications |
| `contentAuditWorkflows.md` | Support | Content writer workflow analysis |

## specs/

Active and future feature specifications.

| Spec | Mode | Status |
|---|---|---|
| `designLintFeature.md` | Validate | Phase 2 complete |
| `scaffoldMode.md` | Scaffold | Concept — Phase 3 |
| `styledTextFeature.md` | Navigate | Paused — see spec for blockers |
| `figmaFigjamMatrix.md` | Cross-cutting | Reference matrix |
| `stratusHueScaffoldValidateOnePager.md` | Cross-cutting | Onboarding one-pager |
| `rivePreviewPluginRequirements.md` | Standalone | Rive preview — requirements |
| `rivePreviewPluginDesign.md` | Standalone | Rive preview — design |
| `rivePreviewPluginImplementation.md` | Standalone | Rive preview — implementation |

## reference/

Shipped feature docs, guides, and internal refactors.

| Doc | Purpose |
|---|---|
| `layoutSizingFeature.md` | Layout sizing feature spec |
| `layoutSizingTestingGuide.md` | QA guide for sizing |
| `colorCodedButtons.md` | Header action icon color-context behavior |
| `accessibilityImplementationSummary.md` | Accessibility patterns across the plugin |
| `currentPluginStructureAnalysis.md` | Architecture snapshot of the codebase |
| `uiSplitRefactor.md` | ui.ts module split — Phase 1.5 |
| `lintMockup.excalidraw` | UI mockup for the lint error list |

## recipes/

Recipe JSON files for Scaffold mode. See `specs/scaffoldMode.md`.
