# Design Document

## Overview

The UI State Persistence system will extend the existing Stratus Hue plugin architecture to remember and restore the collapsed/expanded states of UI sections across plugin sessions. The system will integrate with the current collapsible section implementation and leverage the existing state management infrastructure.

## Architecture

### Current State Management Integration

The plugin already has a robust state management system in `src/core/state.ts` using Figma's `clientStorage` API for persistence. We'll extend this system to include UI section states alongside existing bookmark, anchor, and navigation states.

### Storage Strategy

- **Storage Location**: Figma's `clientStorage` API (same as existing license and anchor states)
- **Storage Key**: `'uiSectionStates'`
- **Data Structure**: JSON object mapping section IDs to their expanded/collapsed state
- **Persistence Scope**: Per-user, cross-document (consistent across all Figma files)

## Components and Interfaces

### 1. UI Section State Interface

```typescript
interface UISectionState {
  [sectionId: string]: {
    expanded: boolean;
    lastModified: number;
  };
}

interface UISectionStateManager {
  loadSectionStates(): Promise<UISectionState>;
  saveSectionState(sectionId: string, expanded: boolean): Promise<void>;
  getSectionState(sectionId: string): boolean; // returns expanded state
  initializeDefaultStates(): UISectionState;
}
```

### 2. Section Identification

Current collapsible sections in the UI:
- `tags-header` → `color-section` (Tags section)
- `anchors-header` → `anchors-section` (Anchors section)  
- `navigation-header` → `navigation-section` (Navigation section)

### 3. Integration Points

**Existing Toggle Function Enhancement**:
The current `toggleSection` function in `ui.ts` will be enhanced to:
1. Update the visual state (existing functionality)
2. Save the new state to persistent storage (new functionality)

**Initialization Enhancement**:
The plugin initialization will:
1. Load saved section states from storage
2. Apply states to UI sections before they become visible
3. Fall back to default expanded state for new sections

## Data Models

### State Storage Schema

```typescript
// Stored in figma.clientStorage under key 'uiSectionStates'
{
  "tags-header": {
    "expanded": false,
    "lastModified": 1640995200000
  },
  "anchors-header": {
    "expanded": true,
    "lastModified": 1640995200000
  },
  "navigation-header": {
    "expanded": true,
    "lastModified": 1640995200000
  }
}
```

### Default States

All sections default to `expanded: true` when:
- No saved state exists (first-time users)
- Saved state is corrupted or invalid
- New sections are added in plugin updates

## Error Handling

### Graceful Degradation

1. **Storage Failures**: If `clientStorage` operations fail, the system continues with in-memory state only
2. **Corrupted Data**: Invalid JSON or malformed state data triggers fallback to default expanded states
3. **Missing Sections**: If a saved state references a section that no longer exists, it's ignored
4. **Performance Issues**: State operations are debounced to prevent excessive storage writes

### Error Recovery

```typescript
// Fallback hierarchy:
1. Saved state from clientStorage
2. In-memory state (current session)
3. Default expanded state
```

## Testing Strategy

### Unit Tests

1. **State Manager Tests**:
   - Save/load operations with valid data
   - Handling of corrupted storage data
   - Default state initialization
   - Debounced save operations

2. **UI Integration Tests**:
   - Section state restoration on plugin load
   - State persistence when sections are toggled
   - Fallback behavior when storage fails

### Integration Tests

1. **Cross-Session Persistence**:
   - Toggle sections, close plugin, reopen → states preserved
   - Work in different Figma files → states consistent

2. **Performance Tests**:
   - Rapid section toggling doesn't cause UI lag
   - Storage operations complete within 50ms threshold

### Accessibility Tests

1. **Screen Reader Compatibility**:
   - `aria-expanded` attributes correctly reflect restored states
   - State changes are announced appropriately

## Implementation Details

### State Management Extension

Add to `src/core/state.ts`:

```typescript
// UI Section State Management
export let uiSectionStates: UISectionState = {};

export async function loadUISectionStates(): Promise<void> {
  try {
    const data = await figma.clientStorage.getAsync('uiSectionStates');
    if (data && typeof data === 'object') {
      uiSectionStates = data;
    }
  } catch (error) {
    console.error('Failed to load UI section states:', error);
    uiSectionStates = {};
  }
}

export async function saveUISectionState(sectionId: string, expanded: boolean): Promise<void> {
  uiSectionStates[sectionId] = {
    expanded,
    lastModified: Date.now()
  };
  
  try {
    await figma.clientStorage.setAsync('uiSectionStates', uiSectionStates);
  } catch (error) {
    console.error('Failed to save UI section state:', error);
  }
}
```

### UI Integration Enhancement

Modify the existing `toggleSection` function in `ui.ts`:

```typescript
const toggleSection = (header: HTMLElement, target: HTMLElement): void => {
  const currentlyExpanded = header.getAttribute('aria-expanded') !== 'false';
  const nextExpanded = !currentlyExpanded;
  
  // Update UI (existing logic)
  header.setAttribute('aria-expanded', String(nextExpanded));
  if (!nextExpanded) {
    target.classList.add('collapsed');
  } else {
    target.classList.remove('collapsed');
  }
  
  // Save state (new functionality)
  const sectionId = header.id;
  if (sectionId) {
    debouncedSaveState(sectionId, nextExpanded);
  }
  
  // Existing scroll behavior update
  updateScrollBehavior();
};
```

### Initialization Enhancement

Add state restoration to plugin initialization:

```typescript
async function restoreUISectionStates(): Promise<void> {
  const collapsibleHeaders = document.querySelectorAll<HTMLElement>('.section-header.collapsible');
  
  collapsibleHeaders.forEach(header => {
    const sectionId = header.id;
    const targetId = header.getAttribute('data-target');
    const target = targetId ? document.getElementById(targetId) : null;
    
    if (!target || !sectionId) return;
    
    // Get saved state or default to expanded
    const savedState = uiSectionStates[sectionId];
    const shouldExpand = savedState ? savedState.expanded : true;
    
    // Apply state without animation (before UI is visible)
    header.setAttribute('aria-expanded', String(shouldExpand));
    if (!shouldExpand) {
      target.classList.add('collapsed');
    } else {
      target.classList.remove('collapsed');
    }
  });
}
```

### Performance Optimization

Implement debounced saving to prevent excessive storage operations:

```typescript
const debouncedSaveState = debounce(async (sectionId: string, expanded: boolean) => {
  await saveUISectionState(sectionId, expanded);
}, 300);
```

## Migration Strategy

### Backward Compatibility

- Existing users without saved states will see all sections expanded (current behavior)
- No breaking changes to existing UI or functionality
- Plugin continues to work if storage operations fail

### Version Compatibility

- New sections added in future updates default to expanded state
- Removed sections in future updates are ignored in saved state
- State schema is extensible for future enhancements