# Naming Taxonomy Specification

## AI Context Summary

> **For AI Assistants**: This document defines a unified naming convention system for the Stratus Hue Figma plugin ecosystem. The taxonomy spans four domains: Design (Figma layers/components), Development (code contracts/messages), Business (tickets/features), and Delivery (assets/exports). When helping with naming-related tasks, reference this specification to ensure consistency across all touchpoints.

## Introduction

This specification establishes a **Unified Naming Taxonomy** — a consistent, rule-based naming convention that bridges design, development, business, and delivery workflows. The goal is to create machine-readable, human-friendly names that:

1. Enable automated processing and validation
2. Provide clear context at a glance
3. Support cross-domain traceability (design → ticket → code → asset)
4. Allow rule-based auto-labeling without AI inference

### Problem Statement

Without a unified naming convention:
- Designers use inconsistent layer names making handoff difficult
- Developers create ad-hoc message types that don't scale
- Business stakeholders can't trace features from ticket to implementation
- Assets are exported with names that don't match production requirements
- AI assistants lack context to provide consistent naming suggestions

### Solution Overview

A **token-based naming schema** that:
- Uses consistent separators and structure across domains
- Supports progressive disclosure (more tokens = more specificity)
- Enables pattern matching and validation
- Can be enforced programmatically via the Figma plugin

---

## Requirements

### Requirement 1: Core Taxonomy Structure

**User Story:** As a designer/developer using Stratus Hue, I want a consistent naming pattern across all domains so that I can understand any element's purpose and context from its name alone.

#### Acceptance Criteria

1. WHEN naming any element THEN it SHALL follow the token pattern: `[PREFIX].[CATEGORY].[TYPE].[NAME].[MODIFIER]`
2. WHEN tokens are optional THEN the pattern SHALL gracefully degrade (e.g., `TYPE.NAME` is valid)
3. WHEN separators are used THEN they SHALL be consistent: `.` for hierarchy, `-` for compound words, `_` for variants
4. WHEN names are displayed THEN they SHALL be readable without decoding (no cryptic abbreviations)

### Requirement 2: Design Domain Naming

**User Story:** As a Figma designer, I want automatic naming conventions applied to my layers, frames, and components so that my design files are consistently organized for handoff.

#### Acceptance Criteria

1. WHEN a page is created/renamed THEN it SHALL follow: `↳ [EMOJI] [DATE] : [Title]`
2. WHEN a section is created THEN it SHALL follow: `[CATEGORY] Title` (e.g., `[COMPONENTS] Buttons`)
3. WHEN a frame is named THEN it SHALL follow: `Breakpoint.Component.State` (e.g., `Desktop.Hero.Default`)
4. WHEN a layer is named THEN it SHALL follow atomic/BEM pattern: `block.element.modifier` (e.g., `btn.label.disabled`)
5. WHEN a component is created THEN it SHALL follow Figma variant syntax: `Component/Property=Value`
6. WHEN auto-labeling is applied THEN the plugin SHALL preserve user-defined portions of the name

### Requirement 3: Development Domain Naming

**User Story:** As a developer maintaining the plugin, I want message types and contracts to follow a predictable pattern so that I can easily find, extend, and debug communication between sandbox and UI.

#### Acceptance Criteria

1. WHEN a message is sent between UI and sandbox THEN its type SHALL follow: `domain:action:target`
2. WHEN a new message type is added THEN it SHALL be registered in a central type definition
3. WHEN message payloads are defined THEN property names SHALL use camelCase
4. WHEN event handlers are named THEN they SHALL follow: `handle[Domain][Action]` (e.g., `handleLayerAdd`)
5. WHEN state variables are named THEN they SHALL follow: `[scope][Entity][Property]` (e.g., `currentAnchorState`)

### Requirement 4: Business Domain Naming

**User Story:** As a product manager or stakeholder, I want tickets and features to follow a naming pattern that maps to design and development artifacts so that I can trace work across systems.

#### Acceptance Criteria

1. WHEN a ticket is created THEN it SHALL follow: `[PROJECT]-[TYPE]-[SEQ]: [Title]`
2. WHEN a feature is defined THEN it SHALL have a canonical slug: `feature-name-here`
3. WHEN design work is linked to a ticket THEN the design page/frame SHALL include the ticket reference
4. WHEN status changes THEN both design (emoji) and ticket (label) SHALL update consistently

### Requirement 5: Delivery Domain Naming

**User Story:** As a designer or developer preparing assets for production, I want exported files to follow a predictable naming pattern so that build systems and CDNs can process them correctly.

#### Acceptance Criteria

1. WHEN an asset is exported THEN it SHALL follow: `category/type/name.variant.size.format`
2. WHEN names contain spaces THEN they SHALL be converted to kebab-case
3. WHEN special characters are present THEN they SHALL be stripped or replaced with safe alternatives
4. WHEN multiple sizes are exported THEN the size token SHALL indicate scale: `1x`, `2x`, `3x` or pixel dimensions

### Requirement 6: Cross-Domain Traceability

**User Story:** As any team member, I want to trace an element from its design origin through development to delivery so that I can understand the full context and history.

#### Acceptance Criteria

1. WHEN an element exists in multiple domains THEN its core identifier SHALL remain consistent
2. WHEN linking across domains THEN references SHALL use the format: `[DOMAIN]:[IDENTIFIER]`
3. WHEN searching across domains THEN the core name token SHALL be findable regardless of domain prefix
4. WHEN generating documentation THEN cross-references SHALL be automatically linkable

### Requirement 7: Validation and Enforcement

**User Story:** As a team lead, I want naming conventions to be validated automatically so that inconsistencies are caught before they propagate.

#### Acceptance Criteria

1. WHEN a name is created/modified THEN optional validation SHALL check against taxonomy rules
2. WHEN validation fails THEN the user SHALL receive a clear suggestion for correction
3. WHEN bulk operations occur THEN validation SHALL run efficiently without blocking the UI
4. WHEN exceptions are needed THEN users SHALL be able to override with explicit opt-out

### Requirement 8: Extensibility

**User Story:** As a future maintainer, I want the taxonomy system to be extensible so that new domains, categories, or patterns can be added without breaking existing conventions.

#### Acceptance Criteria

1. WHEN new token types are needed THEN they SHALL be addable via configuration
2. WHEN custom prefixes are required THEN teams SHALL be able to define their own
3. WHEN the taxonomy evolves THEN versioning SHALL track changes over time
4. WHEN migrating to new patterns THEN tooling SHALL assist in bulk renaming

---

## Domain Overview

### The Four Domains

| Domain | Scope | Primary Users | Key Artifacts |
|--------|-------|---------------|---------------|
| **Design** | Figma files | Designers | Pages, Sections, Frames, Layers, Components |
| **Development** | Codebase | Developers | Messages, Types, Functions, State, Events |
| **Business** | Project management | PMs, Stakeholders | Tickets, Epics, Features, Milestones |
| **Delivery** | Production assets | All | Exported images, icons, specs, documentation |

### Cross-Domain Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   BUSINESS  │ ──── │   DESIGN    │ ──── │ DEVELOPMENT │ ──── │  DELIVERY   │
│             │      │             │      │             │      │             │
│ STRAT-FEAT  │      │ 🟢 12.01 :  │      │ layer:add:  │      │ icons/nav/  │
│ -042        │  ──▶ │ AutoLabel   │  ──▶ │ emoji       │  ──▶ │ home.svg    │
│             │      │             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
     │                     │                    │                    │
     └─────────────────────┴────────────────────┴────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  SHARED IDENTIFIER  │
                         │    "auto-label"     │
                         └─────────────────────┘
```

---

## Token Reference

### Universal Tokens

| Token | Purpose | Format | Examples |
|-------|---------|--------|----------|
| `PREFIX` | Domain identifier | lowercase | `design`, `dev`, `biz`, `asset` |
| `CATEGORY` | Broad classification | PascalCase or UPPERCASE | `UI`, `Navigation`, `[COMPONENTS]` |
| `TYPE` | Specific element type | PascalCase | `Button`, `Frame`, `Message` |
| `NAME` | Descriptive identifier | kebab-case | `primary-action`, `hero-banner` |
| `MODIFIER` | State, variant, version | lowercase | `hover`, `disabled`, `v2` |

### Separator Rules

| Separator | Usage | Example |
|-----------|-------|---------|
| `.` | Hierarchy levels | `btn.label.text` |
| `-` | Compound words within token | `primary-action` |
| `_` | Variant indicators | `button_large` |
| `/` | Path or category nesting | `icons/navigation/home` |
| `:` | Domain or action separation | `layer:add:emoji` |

### Reserved Prefixes

| Prefix | Domain | Usage |
|--------|--------|-------|
| `↳` | Design | Page titles |
| `[BRACKET]` | Design | Section headers |
| `STRAT-` | Business | Project tickets |
| `@` | Cross-domain | References |

---

## Status Mapping

### Unified Status Indicators

| Status | Design Emoji | Ticket Label | Code Constant | Asset Suffix |
|--------|--------------|--------------|---------------|--------------|
| Draft/WIP | 🚧 | `[WIP]` | `STATUS_DRAFT` | `.draft` |
| In Review | 👀 | `[REVIEW]` | `STATUS_REVIEW` | `.review` |
| Approved | ✅ | (none) | `STATUS_APPROVED` | (none) |
| Shipped | 🚀 | `[SHIPPED]` | `STATUS_SHIPPED` | `.final` |
| Blocked | 🚫 | `[BLOCKED]` | `STATUS_BLOCKED` | — |
| Archived | 🪦 | `[ARCHIVED]` | `STATUS_ARCHIVED` | `.archived` |
| Starred | ⭐ | `[PRIORITY]` | `STATUS_PRIORITY` | — |

---

## Validation Rules

### Pattern Definitions (Regex)

```typescript
const TAXONOMY_PATTERNS = {
  // Design domain
  pageTitle: /^↳\s*([🔴🟠🟡🟢🔵🟣⚫️⚪️🚧✅👀🚀🚫🪦⭐📱])?\s*(\d{2}\.\d{2})?\s*:?\s*(.+)$/,
  sectionHeader: /^\[([A-Z]+)\]\s*(.+)$/,
  frameName: /^([A-Z][a-z]+)\.([A-Z][a-zA-Z]+)(\.([A-Z][a-z]+))?$/,
  layerName: /^([a-z]+)(\.([a-z]+))*(\.([a-z]+))?$/,
  
  // Development domain
  messageType: /^([a-z]+):([a-z]+):([a-z-]+)$/,
  handlerName: /^handle([A-Z][a-zA-Z]+)$/,
  stateVariable: /^([a-z]+)([A-Z][a-zA-Z]+)(State|Data|Config)?$/,
  
  // Business domain
  ticketId: /^([A-Z]+)-([A-Z]+)-(\d+)$/,
  featureSlug: /^[a-z]+(-[a-z]+)*$/,
  
  // Delivery domain
  assetPath: /^([a-z]+)\/([a-z]+)\/([a-z-]+)(\.([a-z]+))?(\.(\d+x|\d+))?\.([a-z]+)$/
};
```

### Validation Error Messages

| Pattern | Valid Example | Invalid Example | Error Message |
|---------|---------------|-----------------|---------------|
| `pageTitle` | `↳ 🟢 12.01 : Homepage` | `Homepage v2` | "Page titles should start with ↳" |
| `sectionHeader` | `[COMPONENTS] Buttons` | `Components - Buttons` | "Section headers should use [CATEGORY] format" |
| `messageType` | `layer:add:emoji` | `addEmojiToLayer` | "Message types should use domain:action:target format" |
| `assetPath` | `icons/nav/home.default.24.svg` | `Home Icon.svg` | "Asset names should use lowercase with path structure" |

---

## Implementation Priority

### Phase 1: Foundation
- [ ] Finalize taxonomy patterns
- [ ] Create TypeScript type definitions
- [ ] Add validation utilities

### Phase 2: Design Domain
- [ ] Page title auto-formatting
- [ ] Section header conventions
- [ ] Layer auto-labeling rules

### Phase 3: Development Domain
- [ ] Message type refactoring
- [ ] Handler naming standards
- [ ] State variable conventions

### Phase 4: Integration
- [ ] Cross-domain reference system
- [ ] Validation in plugin UI
- [ ] Documentation generation

---

## Glossary

| Term | Definition |
|------|------------|
| **Token** | A single unit within a name, separated by delimiters |
| **Taxonomy** | The hierarchical classification system for naming |
| **Domain** | A distinct area of the workflow (Design, Dev, Business, Delivery) |
| **Slug** | A URL-safe, lowercase identifier |
| **Canonical** | The authoritative, standardized form of a name |
| **Progressive Disclosure** | Adding more tokens for increased specificity |

---

## References

- Figma Plugin API: Node naming properties
- Existing emoji sets: `src/core/constants.ts`
- Current message types: `src/core/types.ts`
- Page title utilities: `src/utils/utils.ts`
