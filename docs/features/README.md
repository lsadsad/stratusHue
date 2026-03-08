# Feature Specs

Specifications for features that are part of stratusHue's three-mode system (Navigate / Validate / Scaffold).

For the phased implementation plan and performance strategy, see `docs/ROADMAP.md`.

## Navigate Mode (shipped)

Core navigation and productivity tools for active design work.

| Feature | Spec | Status |
|---|---|---|
| Bookmarks & Anchors | (in codebase) | Shipped |
| Navigation History | (in codebase) | Shipped |
| Emoji Tags | (in codebase) | Shipped |
| Layout Sizing | `LAYOUT_SIZING_FEATURE.md` | Shipped |
| Styled Text | `STYLED_TEXT_FEATURE.md` | ⏸ Paused — hidden, see spec for blockers |

### Reference docs

| Document | Purpose |
|---|---|
| `LAYOUT_SIZING_TESTING_GUIDE.md` | QA guide for the sizing feature |
| `COLOR_CODED_BUTTONS.md` | Button color system documentation |
| `ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md` | Accessibility patterns used across the plugin |
| `CURRENT_PLUGIN_STRUCTURE_ANALYSIS.md` | Architecture snapshot of the existing codebase |

## Internal Refactors

| Feature | Spec | Status |
|---|---|---|
| ui.ts module split | `UI_SPLIT_REFACTOR.md` | Specced — Phase 1.5 |

Splits the 4,890-line `ui.ts` monolith into a thin shell + shared infrastructure + per-mode modules. Prerequisite for Design Lint (Phase 2) to ensure zero-cost mode loading.

## Validate Mode

Design auditing and handoff readiness.

| Feature | Spec | Status |
|---|---|---|
| Design Lint (Error List) | `DESIGN_LINT_FEATURE.md` | Specced — Phase 2 |
| Token Audit | (section in Design Lint spec) | Future |
| Component Check | (section in Design Lint spec) | Future |
| Readiness Check | — | Future (depends on Scaffold recipes) |

### Reference docs

| Document | Purpose |
|---|---|
| `lint-mockup.excalidraw` | UI mockup for the lint error list |

## Scaffold Mode

Project file setup from configurable templates.

| Feature | Spec | Status |
|---|---|---|
| Recipe-based scaffolding | `SCAFFOLD_MODE.md` | Concept only — Phase 3 |
