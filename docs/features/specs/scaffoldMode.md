# Scaffold Mode — Concept Notes

## Status
🔵 Concept only — not yet specced or implemented

## Overview
Scaffold mode automates project file setup and eliminates the manual process of duplicating template files, trimming unused pages, and assembling the right structure for each project type. It replaces the current workflow where designers duplicate an entire template file and delete what they don't need.

## Strategic Context

### The Three Modes of stratusHue

| Mode | When | Question | Value |
|------|------|----------|-------|
| **Scaffold** | Project start | *Is the file structured correctly?* | Eliminates template duplication |
| **Navigate** | During work | *Where am I? What's next?* | Speed and orientation |
| **Validate** | Before handoff | *Is it correct and complete?* | Confidence at delivery |

Scaffold and Validate are **mirrors of each other**:
- **Scaffold** creates file structure from a recipe
- **Validate** verifies the structure is still intact and compliant

They share the same underlying recipe format — a JSON definition of what a "complete" project file looks like.

## Current Pain Point
- Designers duplicate an entire template file at project start
- Templates are highly standardized across the team
- Designers then delete pages they don't need
- This is repetitive, error-prone, and time-consuming
- Delivery phase has the inverse problem: checking that all required pages/components are still present

## Core Concept

### Configurable Recipes
Recipes are JSON definitions that describe a project file structure. They are **configurable by the team** — stored in plugin settings, not hardcoded.

A recipe defines:
- Required pages (name, order, type)
- Optional pages (can be included/excluded at setup)
- Page groups (e.g., "Research", "Design", "Delivery")
- Naming conventions
- Expected components or sections within pages

### Recipe Format (draft)
```json
{
  "name": "Product Design — Full",
  "description": "Standard product design project with research, design, and delivery phases",
  "version": "1.0",
  "pages": [
    {
      "name": "Cover",
      "required": true,
      "group": "meta",
      "emoji": "📋",
      "description": "Project cover with title, team, dates"
    },
    {
      "name": "Research",
      "required": false,
      "group": "research",
      "emoji": "🔍",
      "description": "User research findings and insights"
    },
    {
      "name": "Wireframes",
      "required": false,
      "group": "design",
      "emoji": "✏️",
      "description": "Low-fidelity wireframes"
    },
    {
      "name": "Visual Design",
      "required": true,
      "group": "design",
      "emoji": "🎨",
      "description": "High-fidelity visual designs"
    },
    {
      "name": "Components",
      "required": false,
      "group": "design",
      "emoji": "🧩",
      "description": "Local component definitions"
    },
    {
      "name": "Specs",
      "required": true,
      "group": "delivery",
      "emoji": "📐",
      "description": "Developer handoff specifications"
    },
    {
      "name": "Changelog",
      "required": true,
      "group": "delivery",
      "emoji": "📝",
      "description": "Version history and change log"
    }
  ],
  "groups": {
    "meta": { "label": "Meta", "color": "gray" },
    "research": { "label": "Research", "color": "blue" },
    "design": { "label": "Design", "color": "purple" },
    "delivery": { "label": "Delivery", "color": "green" }
  }
}
```

### Setup Flow (envisioned)
1. User opens stratusHue in a new/empty file
2. Switches to Scaffold mode
3. Selects a recipe (e.g., "Product Design — Full")
4. Sees a checklist of pages with required/optional toggles
5. Clicks "Build" — stratusHue creates all selected pages with correct names, order, and emoji tags
6. File is ready to work in

### Validate Integration
The same recipe used to scaffold can later be used to audit:
- Are all required pages still present?
- Are they named correctly?
- Are they in the right order?
- Are delivery pages populated?

This becomes the **Readiness Check** feature under Validate mode.

## Future Ideas

### Content Seeding
Integration with Styled Text to populate template pages with starter content during scaffold. Content teams could maintain content recipes alongside page structure recipes.

### Recipe Library
- Team-managed recipe library stored in `clientStorage` or synced via a shared Figma file
- Multiple recipe types for different project types (app, marketing, design system, etc.)
- Recipe versioning — update the recipe, existing files can be re-validated against the new version

### Smart Detection
- Auto-detect project type from existing file structure
- Suggest missing pages based on what's already there
- "Add Delivery Pages" quick action that appends only the delivery group

## Open Questions
- Where should recipes be stored? `clientStorage` (per-user) vs. `pluginData` (per-file) vs. external?
- Should recipes support page templates (actual Figma content) or just page names?
- How to handle recipe updates — re-scaffold adds missing pages? Or just flag in Validate?
- Should Scaffold mode be accessible from an empty file only, or also mid-project?

## Related Docs
- `docs/features/specs/designLintFeature.md` — Validate mode (the mirror of Scaffold)
- `docs/features/specs/styledTextFeature.md` — Navigate mode, potential Scaffold content seeding integration
