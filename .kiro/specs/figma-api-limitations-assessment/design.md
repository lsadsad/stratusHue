# Design Document

## Overview

This document provides a comprehensive analysis of the Figma Plugin API limitations affecting the Layer Navigation Controls feature in Stratus Hue. The analysis reveals that the current implementation attempts to use non-existent API features, specifically trying to control the expanded/collapsed state of containers in Figma's layer panel. This design outlines the specific limitations, identifies the problematic code, and provides a clear remediation strategy.

## Architecture

### Current Problematic Implementation

The Layer Navigation Controls feature currently attempts to use the following unsupported Figma Plugin API operations:

```typescript
// ❌ This does NOT exist in the Figma Plugin API
(container as FrameNode | GroupNode).expanded = false;

// ❌ This property is not available to plugins
if ('expanded' in node && typeof (node as any).expanded === 'boolean') {
  // This check will always fail
}
```

### Figma Plugin API Reality

Based on the official Figma Plugin API documentation, plugins have access to:

**✅ Supported Operations:**
- `figma.currentPage.selection` - Read and modify current selection
- `figma.viewport.scrollAndZoomIntoView()` - Control viewport focus
- Node traversal through `parent`, `children` properties
- Node properties like `name`, `type`, `visible`, etc.
- Page navigation with `figma.setCurrentPageAsync()`

**❌ Unsupported Operations:**
- Layer panel expanded/collapsed state control
- Layer panel visibility or organization
- UI panel state outside of the plugin's own interface
- Native Figma interface manipulation

### Root Cause Analysis

The problematic code exists in these specific locations:

1. **`src/features/navigation.ts` line ~1229:**
   ```typescript
   (container as FrameNode | GroupNode | ComponentNode | ComponentSetNode | InstanceNode).expanded = false;
   ```

2. **`src/features/navigation.ts` line ~2245:**
   ```typescript
   return 'expanded' in node && typeof (node as any).expanded === 'boolean';
   ```

3. **`src/features/navigation.ts` line ~2684:**
   ```typescript
   (container as FrameNode | GroupNode | SectionNode | ComponentNode | ComponentSetNode | InstanceNode).expanded = false;
   ```

## Components and Interfaces

### Affected Components

#### LayerNavigationHandler.toggleCollapse()
**Status:** Must be completely redesigned or removed
**Issue:** Attempts to set `expanded` property on nodes
**Impact:** This function will fail silently or throw errors

#### LayerNavigationHandler.isExpandableContainer()
**Status:** Must be redesigned
**Issue:** Checks for non-existent `expanded` property
**Impact:** Always returns false, making collapse detection impossible

#### NavigationContext.hasCollapsibleSiblings
**Status:** Must be removed or redefined
**Issue:** Based on non-existent expanded state detection
**Impact:** Context analysis provides incorrect information

### Supported Navigation Components

#### LayerNavigationHandler.enterContainer() ✅
**Status:** Fully supported
**Functionality:** Changes selection to container children, updates viewport
**API Usage:** Uses supported selection and viewport APIs

#### LayerNavigationHandler.exitContainer() ✅
**Status:** Fully supported  
**Functionality:** Changes selection to parent container, updates viewport
**API Usage:** Uses supported node traversal and selection APIs

#### LayerNavigationHandler.navigateToSibling() ✅
**Status:** Fully supported
**Functionality:** Changes selection to next/previous sibling, updates viewport
**API Usage:** Uses supported node traversal and selection APIs

## Data Models

### Updated NavigationContext Interface

```typescript
interface NavigationContext {
  hasSelection: boolean;
  canEnter: boolean;        // ✅ Supported - based on container detection
  canExit: boolean;         // ✅ Supported - based on parent detection  
  canNavigateSiblings: boolean; // ✅ Supported - based on sibling detection
  containerCount: number;   // ✅ Supported - count of containers on page
  
  // ❌ Remove these - not supported by Figma Plugin API
  // siblingContainerCount: number;
  // hasCollapsibleSiblings: boolean;
}
```

### Removed Message Types

```typescript
// ❌ Remove - collapse functionality not supported
interface NavigationActionMessage {
  // Remove 'toggle-collapse' action
  action: 'enter' | 'exit' | 'next-sibling' | 'prev-sibling'; // No collapse
}
```

## Error Handling

### API Limitation Error Types

```typescript
enum NavigationErrorType {
  // Existing supported error types
  NO_SELECTION = 'NO_SELECTION',
  INVALID_CONTAINER = 'INVALID_CONTAINER', 
  NO_PARENT = 'NO_PARENT',
  NO_SIBLINGS = 'NO_SIBLINGS',
  VIEWPORT_ERROR = 'VIEWPORT_ERROR',
  
  // ❌ Remove - not applicable
  // COLLAPSE_FAILED = 'COLLAPSE_FAILED'
}
```

### Graceful Degradation Strategy

1. **Remove Collapse Functionality:** Completely remove the collapse/expand toggle feature
2. **Update UI:** Remove the collapse button from the navigation grid
3. **Update Context:** Remove collapse-related context properties
4. **Update Tests:** Remove or update tests that verify collapse functionality

## Testing Strategy

### Updated Test Requirements

#### Remove Collapse Tests
- Remove all tests in `navigation.test.ts` related to `toggleCollapse`
- Remove collapse-related integration tests
- Remove UI tests for collapse button functionality

#### Verify Supported Navigation
- Ensure `enterContainer` tests pass with selection-only changes
- Verify `exitContainer` tests work with parent selection
- Confirm `navigateToSibling` tests work with sibling selection
- Test viewport updates work correctly

#### Add API Limitation Tests
- Test that navigation functions don't attempt unsupported operations
- Verify error handling when nodes become inaccessible
- Test graceful degradation when navigation targets are invalid

## Implementation Approach

### Phase 1: Remove Unsupported Code
1. **Delete `toggleCollapse` function entirely**
2. **Remove `isExpandableContainer` function**
3. **Update `validateNavigationContext` to remove collapse-related properties**
4. **Remove collapse-related error types and handling**

### Phase 2: Update UI Components
1. **Remove collapse button from navigation grid**
2. **Update grid layout from 2x3 to 2x2 or alternative arrangement**
3. **Remove collapse-related message handlers**
4. **Update button state management**

### Phase 3: Update Tests and Documentation
1. **Remove all collapse-related tests**
2. **Update integration tests to reflect new functionality**
3. **Update requirements and design docs to remove collapse references**
4. **Update user-facing documentation**

### Phase 4: Optimize Remaining Features
1. **Enhance enter/exit navigation with better feedback**
2. **Improve sibling navigation with wrapping behavior**
3. **Add better error messages for unsupported scenarios**
4. **Optimize viewport updates for smoother navigation**

## Alternative Solutions Considered

### Option 1: Mock Collapse Functionality
**Rejected:** Would provide false feedback to users about non-functional features

### Option 2: Collapse via Selection Management
**Rejected:** Cannot actually collapse containers in layer panel, only change selection

### Option 3: Focus on Selection-Based Organization
**Selected:** Provide powerful selection and viewport navigation within API constraints

## Recommended Navigation Grid Layout

Since collapse functionality must be removed, update the button grid:

```
┌─────────────┬─────────────┐
│    Exit     │  Prev/Up    │
│ (Shift+Ent) │ (Shift+Tab) │
├─────────────┼─────────────┤
│   Enter     │  Next/Down  │
│   (Enter)   │    (Tab)    │
└─────────────┴─────────────┘
```

This 2x2 grid maintains the core navigation functionality while removing the unsupported collapse feature.

## Performance Considerations

### Optimizations After Removal
1. **Faster Context Analysis:** No need to scan for expandable containers
2. **Reduced Error Handling:** Fewer failure modes without collapse operations
3. **Simpler State Management:** No collapse state tracking required
4. **Better Reliability:** Only using supported API operations

## Accessibility Impact

### Improved Accessibility
1. **Clearer Functionality:** Users understand exactly what each button does
2. **Reliable Behavior:** No buttons that appear to work but don't
3. **Better Error Messages:** Clear feedback about what's possible vs. impossible
4. **Consistent Experience:** All navigation actions work as expected

This design ensures the Layer Navigation Controls feature works reliably within the actual constraints of the Figma Plugin API, providing valuable navigation functionality without attempting impossible operations.