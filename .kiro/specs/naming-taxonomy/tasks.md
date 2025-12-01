# Naming Taxonomy - Implementation Tasks

## AI Context Summary

> **For AI Assistants**: This document tracks implementation progress for the Naming Taxonomy system. When helping with implementation, check task status and follow the dependency order. Each task includes acceptance criteria and references to the design document.

---

## Overview

This task list follows the implementation phases defined in `design.md`. Tasks are organized by priority and dependency.

---

## Phase 1: Core Infrastructure

### Task 1.1: Create Directory Structure
**Status**: 🔲 Not Started  
**Priority**: P0 - Blocker  
**Estimated Effort**: 15 minutes

**Description**: Create the naming module directory structure.

**Subtasks**:
- [ ] Create `src/core/naming/` directory
- [ ] Create `src/core/naming/index.ts` (exports)
- [ ] Create `src/core/naming/types.ts`
- [ ] Create `src/core/naming/schema.ts`
- [ ] Create `src/core/naming/transforms.ts`
- [ ] Create `src/core/naming/rules.ts`
- [ ] Create `src/core/naming/validators.ts`
- [ ] Create `src/core/naming/default-rules.ts`

**Acceptance Criteria**:
- All files exist and export correctly
- `index.ts` provides clean public API
- No TypeScript errors

---

### Task 1.2: Implement Type Definitions
**Status**: 🔲 Not Started  
**Priority**: P0 - Blocker  
**Estimated Effort**: 30 minutes  
**Depends On**: Task 1.1

**Description**: Define all TypeScript types for the naming system.

**Subtasks**:
- [ ] Define `NamingDomain` type
- [ ] Define `DesignElementType` type
- [ ] Define `NameToken` interface
- [ ] Define `ParsedName` interface
- [ ] Define `NamingRule` interface
- [ ] Define `RuleCondition` interface
- [ ] Define `RuleAction` interface
- [ ] Define `ValidationResult` interface
- [ ] Define `ValidationError` and `ValidationWarning` interfaces
- [ ] Define `NamingPreferences` interface

**Acceptance Criteria**:
- All types compile without errors
- Types are exported from `index.ts`
- JSDoc comments on all exported types

---

### Task 1.3: Implement Schema Definitions
**Status**: 🔲 Not Started  
**Priority**: P0 - Blocker  
**Estimated Effort**: 45 minutes  
**Depends On**: Task 1.2

**Description**: Define patterns, separators, and constants.

**Subtasks**:
- [ ] Define `SEPARATORS` constant
- [ ] Define `RESERVED_PREFIXES` by domain
- [ ] Define `PATTERN_TEMPLATES` by element type
- [ ] Define `VALIDATION_PATTERNS` (all regex patterns)
- [ ] Define `BREAKPOINT_NAMES` constant
- [ ] Define `STATE_NAMES` constant
- [ ] Define `SECTION_CATEGORIES` constant

**Acceptance Criteria**:
- All patterns are valid regex
- Patterns match expected inputs (manual testing)
- Constants exported and documented

---

### Task 1.4: Implement Transform Utilities
**Status**: 🔲 Not Started  
**Priority**: P1 - High  
**Estimated Effort**: 1 hour  
**Depends On**: Task 1.3

**Description**: Create string transformation functions.

**Subtasks**:
- [ ] Implement `toKebabCase()`
- [ ] Implement `toCamelCase()`
- [ ] Implement `toPascalCase()`
- [ ] Implement `toUpperCase()`
- [ ] Implement `applyTemplate()`
- [ ] Implement helper functions:
  - [ ] `getBreakpointName()`
  - [ ] `getStateName()`
  - [ ] `getBlockName()`
  - [ ] `getElementName()`
  - [ ] `getModifierName()`
  - [ ] `getCategoryName()`
  - [ ] `getTitleName()`

**Acceptance Criteria**:
- All transforms handle edge cases (empty string, special chars)
- Template substitution works with optional tokens
- Unit tests pass

---

## Phase 2: Validation Engine

### Task 2.1: Implement Core Validation
**Status**: 🔲 Not Started  
**Priority**: P1 - High  
**Estimated Effort**: 1.5 hours  
**Depends On**: Task 1.4

**Description**: Create the validation engine.

**Subtasks**:
- [ ] Implement `validateName()` main function
- [ ] Implement `validateDesignName()`
- [ ] Implement `validateDevName()`
- [ ] Implement `validateBusinessName()`
- [ ] Implement `validateDeliveryName()`
- [ ] Implement `parseName()` for token extraction

**Acceptance Criteria**:
- Validation returns proper error/warning objects
- Suggestions are actionable
- Performance < 10ms per name

---

### Task 2.2: Add Suggestion Generation
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 1 hour  
**Depends On**: Task 2.1

**Description**: Generate helpful correction suggestions.

**Subtasks**:
- [ ] Implement `suggestPageTitle()`
- [ ] Implement `suggestSectionHeader()`
- [ ] Implement `suggestLayerName()`
- [ ] Implement `suggestMessageType()`
- [ ] Implement `suggestAssetName()`

**Acceptance Criteria**:
- Suggestions follow taxonomy patterns
- Suggestions preserve user intent
- No empty suggestions returned

---

## Phase 3: Rule Engine

### Task 3.1: Implement Rule Matching
**Status**: 🔲 Not Started  
**Priority**: P1 - High  
**Estimated Effort**: 1.5 hours  
**Depends On**: Task 1.4

**Description**: Create the rule matching engine.

**Subtasks**:
- [ ] Implement `evaluateCondition()`
- [ ] Implement condition type handlers:
  - [ ] `node-type` condition
  - [ ] `name-pattern` condition
  - [ ] `property` condition
  - [ ] `hierarchy` condition
  - [ ] `composite` condition (AND/OR/NOT)
- [ ] Implement `findMatchingRules()`
- [ ] Implement `buildRuleContext()`

**Acceptance Criteria**:
- All condition types work correctly
- Composite conditions handle nesting
- Rules sorted by priority

---

### Task 3.2: Implement Rule Actions
**Status**: 🔲 Not Started  
**Priority**: P1 - High  
**Estimated Effort**: 1 hour  
**Depends On**: Task 3.1

**Description**: Create rule action executors.

**Subtasks**:
- [ ] Implement `applyRuleAction()`
- [ ] Implement action type handlers:
  - [ ] `prefix` action
  - [ ] `suffix` action
  - [ ] `replace` action
  - [ ] `template` action
  - [ ] `transform` action
- [ ] Handle function-based values

**Acceptance Criteria**:
- All action types work correctly
- Function values receive node context
- Non-destructive to unaffected name parts

---

### Task 3.3: Create Default Rule Sets
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 1 hour  
**Depends On**: Task 3.2

**Description**: Define the built-in rule sets.

**Subtasks**:
- [ ] Create `DEFAULT_DESIGN_RULES`
  - [ ] Frame type prefix rule
  - [ ] Type emoji prefix rule (opt-in)
  - [ ] Section header format rule
  - [ ] BEM layer naming rule (opt-in)
  - [ ] Breakpoint from width rule
- [ ] Create `DEFAULT_DEV_RULES`
  - [ ] Message type format rule

**Acceptance Criteria**:
- Rules have unique IDs
- Rules are well-documented
- Opt-in rules disabled by default

---

## Phase 4: Feature Integration

### Task 4.1: Implement Auto-Label Feature
**Status**: 🔲 Not Started  
**Priority**: P1 - High  
**Estimated Effort**: 2 hours  
**Depends On**: Task 3.3

**Description**: Create the main auto-labeling feature.

**Subtasks**:
- [ ] Create `src/features/auto-labeling.ts`
- [ ] Implement `autoLabelSelection()`
- [ ] Implement `validateSelection()`
- [ ] Implement result types
- [ ] Add to message handlers in `code.ts`

**Acceptance Criteria**:
- Works on single and multiple selection
- Reports results clearly
- Handles edge cases (no selection, locked nodes)

---

### Task 4.2: Add UI Integration
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 2 hours  
**Depends On**: Task 4.1

**Description**: Add UI controls for auto-labeling.

**Subtasks**:
- [ ] Add message types for auto-labeling
- [ ] Add UI button/section for auto-labeling
- [ ] Display validation warnings
- [ ] Add preferences panel (future)

**Acceptance Criteria**:
- UI follows existing design patterns
- Feedback is clear and immediate
- Preferences persist

---

### Task 4.3: Add Preferences Storage
**Status**: 🔲 Not Started  
**Priority**: P3 - Low  
**Estimated Effort**: 1 hour  
**Depends On**: Task 4.1

**Description**: Persist naming preferences.

**Subtasks**:
- [ ] Implement `loadNamingPreferences()`
- [ ] Implement `saveNamingPreferences()`
- [ ] Implement `getDefaultPreferences()`
- [ ] Integrate with plugin initialization

**Acceptance Criteria**:
- Preferences load on plugin start
- Changes persist across sessions
- Graceful fallback on errors

---

## Phase 5: Message Type Migration (Future)

### Task 5.1: Define New Message Types
**Status**: 🔲 Not Started  
**Priority**: P3 - Low  
**Estimated Effort**: 2 hours  
**Depends On**: Task 4.1

**Description**: Create taxonomy-compliant message types.

**Subtasks**:
- [ ] Define `TaxonomyMessageType` type
- [ ] Create `MESSAGE_TYPE_MAP` for migration
- [ ] Update type definitions

**Acceptance Criteria**:
- New types follow `domain:action:target` pattern
- Backward compatibility maintained
- Types documented

---

### Task 5.2: Migrate Existing Handlers
**Status**: 🔲 Not Started  
**Priority**: P3 - Low  
**Estimated Effort**: 3 hours  
**Depends On**: Task 5.1

**Description**: Update message handlers to new convention.

**Subtasks**:
- [ ] Create adapter layer for old message types
- [ ] Gradually migrate handlers
- [ ] Update UI message sending
- [ ] Deprecation warnings for old types

**Acceptance Criteria**:
- No breaking changes for existing code
- Migration path documented
- All tests pass

---

## Testing Tasks

### Task T.1: Unit Tests for Transforms
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 1 hour  
**Depends On**: Task 1.4

**Subtasks**:
- [ ] Test case conversion functions
- [ ] Test template application
- [ ] Test edge cases

---

### Task T.2: Unit Tests for Validation
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 1 hour  
**Depends On**: Task 2.1

**Subtasks**:
- [ ] Test valid names pass
- [ ] Test invalid names fail with proper errors
- [ ] Test suggestions are generated

---

### Task T.3: Unit Tests for Rules
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 1.5 hours  
**Depends On**: Task 3.2

**Subtasks**:
- [ ] Test condition evaluation
- [ ] Test rule matching
- [ ] Test action application

---

### Task T.4: Integration Tests
**Status**: 🔲 Not Started  
**Priority**: P2 - Medium  
**Estimated Effort**: 2 hours  
**Depends On**: Task 4.1

**Subtasks**:
- [ ] Test auto-labeling with mock nodes
- [ ] Test validation on selection
- [ ] Test preferences persistence

---

## Documentation Tasks

### Task D.1: Update Product Documentation
**Status**: 🔲 Not Started  
**Priority**: P3 - Low  
**Estimated Effort**: 1 hour  
**Depends On**: Task 4.1

**Subtasks**:
- [ ] Update `product.md` with naming feature
- [ ] Add user documentation
- [ ] Add examples

---

### Task D.2: Create Developer Guide
**Status**: 🔲 Not Started  
**Priority**: P3 - Low  
**Estimated Effort**: 1 hour  
**Depends On**: Task 5.1

**Subtasks**:
- [ ] Document message type conventions
- [ ] Document rule creation
- [ ] Document extension points

---

## Summary

| Phase | Tasks | Estimated Total |
|-------|-------|-----------------|
| Phase 1: Core Infrastructure | 4 tasks | ~2.5 hours |
| Phase 2: Validation Engine | 2 tasks | ~2.5 hours |
| Phase 3: Rule Engine | 3 tasks | ~3.5 hours |
| Phase 4: Feature Integration | 3 tasks | ~5 hours |
| Phase 5: Message Migration | 2 tasks | ~5 hours |
| Testing | 4 tasks | ~5.5 hours |
| Documentation | 2 tasks | ~2 hours |
| **Total** | **20 tasks** | **~26 hours** |

---

## Quick Start

To begin implementation, start with these tasks in order:

1. **Task 1.1**: Create Directory Structure
2. **Task 1.2**: Implement Type Definitions
3. **Task 1.3**: Implement Schema Definitions
4. **Task 1.4**: Implement Transform Utilities
5. **Task 3.1**: Implement Rule Matching (can parallel with Task 2.1)
6. **Task 4.1**: Implement Auto-Label Feature

This gives you a working auto-labeling feature with ~8 hours of focused work.
