# Design Document

## Overview

This design extends the existing drag-and-drop functionality from bookmarks to section headers, allowing users to reorder the main plugin sections (TAGS, ANCHORS, NAVIGATION). The implementation leverages the established patterns from the bookmark reordering system while adapting them for the unique requirements of section headers.

The design maintains consistency with the existing UI architecture, uses the established design token system, and integrates with the current state persistence mechanism.

## Architecture

### Core Components

1. **Section Container Management**: A new system to manage the main content sections as reorderable units
2. **Drag Handler Extension**: Extends the existing drag-and-drop patterns to work with section headers
3. **State Persistence Integration**: Leverages the existing UI state persistence system to save section order
4. **Accessibility Layer**: Keyboard shortcuts and screen reader support for section reordering

### Integration Points

- **Existing Drag System**: Reuses patterns from `updateBookmarksList()` drag-and-drop implementation
- **UI State Persistence**: Integrates with `debouncedSaveUISectionState()` and `loadUISectionStates()`
- **Design Token System**: Uses existing CSS custom properties for consistent styling
- **Message Passing**: Extends current `sendMessage()` patterns for section order persistence

## Components and Interfaces

### 1. Section Order Manager

```typescript
interface SectionOrderManager {
  // Section identification and ordering
  getSectionOrder(): string[];
  setSectionOrder(order: string[]): void;
  getDefaultOrder(): string[];
  
  // DOM manipulation
  reorderSectionsInDOM(order: string[]): void;
  getSectionElements(): HTMLElement[];
  
  // Persistence integration
  saveSectionOrder(order: string[]): void;
  loadSectionOrder(): Promise<string[]>;
}
```

### 2. Section Drag Handler

```typescript
interface SectionDragHandler {
  // Drag state management
  initializeDragHandlers(): void;
  handleDragStart(event: DragEvent, sectionElement: HTMLElement): void;
  handleDragOver(event: DragEvent, targetElement: HTMLElement): void;
  handleDrop(event: DragEvent, targetElement: HTMLElement): void;
  handleDragEnd(event: DragEvent): void;
  
  // Visual feedback
  showDropIndicator(position: DropPosition): void;
  hideDropIndicator(): void;
  updateDragPreview(element: HTMLElement): void;
}
```

### 3. Keyboard Navigation Handler

```typescript
interface KeyboardNavigationHandler {
  // Keyboard shortcuts
  handleKeyboardReorder(event: KeyboardEvent, sectionElement: HTMLElement): void;
  moveSectionUp(sectionId: string): boolean;
  moveSectionDown(sectionId: string): boolean;
  
  // Accessibility announcements
  announceReorder(sectionName: string, newPosition: number, totalSections: number): void;
}
```

## Data Models

### Section Configuration

```typescript
interface SectionConfig {
  id: string;           // 'tags-section', 'anchors-section', 'navigation-section'
  headerId: string;     // 'tags-header', 'anchors-header', 'navigation-header'
  name: string;         // 'TAGS', 'ANCHORS', 'NAVIGATION'
  icon: string;         // '🏷️', '⚓️', '🧭'
  defaultOrder: number; // 0, 1, 2
  draggable: boolean;   // true for all sections
}
```

### Drag State

```typescript
interface SectionDragState {
  isDragging: boolean;
  draggedSectionId: string | null;
  dragStartIndex: number | null;
  dropTargetIndex: number | null;
  dropPosition: 'before' | 'after' | null;
}
```

### Persistence Model

```typescript
interface SectionOrderState {
  sectionOrder: string[];           // ['tags-section', 'anchors-section', 'navigation-section']
  lastModified: number;            // timestamp
  version: number;                 // for future compatibility
}
```

## Implementation Strategy

### Phase 1: Section Container Restructuring

1. **Wrap Sections in Container**: Create a parent container for all draggable sections
2. **Section Identification**: Add unique IDs and data attributes to each section pair (header + content)
3. **Default Order Definition**: Establish the baseline section order

### Phase 2: Drag Handler Implementation

1. **Reuse Bookmark Patterns**: Adapt the existing drag-and-drop logic from bookmarks
2. **Section-Specific Adaptations**: Handle the header+content pairing during drag operations
3. **Visual Feedback System**: Implement drop indicators and drag previews

### Phase 3: State Persistence Integration

1. **Extend UI State System**: Add section order to the existing UI state persistence
2. **Migration Strategy**: Handle existing users without saved section order
3. **Error Handling**: Fallback to default order if saved state is invalid

### Phase 4: Accessibility Implementation

1. **Keyboard Shortcuts**: Implement Ctrl+Up/Down for section reordering
2. **Screen Reader Support**: Add ARIA announcements for reorder operations
3. **Focus Management**: Maintain focus during keyboard-driven reordering

## Visual Design

### Drag Indicators

Following the established bookmark drag patterns:

```css
.section-drop-indicator {
  position: absolute;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  height: 3px; /* Slightly thicker than bookmark indicator */
  background: var(--figma-color-border-brand);
  border-radius: var(--border-radius-sm);
  pointer-events: none;
  opacity: 0.9;
  z-index: var(--z-tooltip);
  display: none;
  box-shadow: 0 0 4px rgba(0, 123, 255, 0.3);
}
```

### Drag Handle Indicator

```css
.section-header.draggable {
  cursor: grab;
}

.section-header.draggable:active {
  cursor: grabbing;
}

.section-header.dragging {
  opacity: 0.6;
  background: var(--theme-bg-elevated);
  transform: scale(0.98);
  transition: all 0.2s ease;
}

.section-header:hover::after {
  content: "⋮⋮";
  position: absolute;
  right: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--icon-size-sm);
  opacity: 0.7;
}
```

### Drop Zone Feedback

```css
.section-container.drag-over-before::before {
  content: "";
  position: absolute;
  top: -2px;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  height: 3px;
  background: var(--figma-color-border-brand);
  border-radius: var(--border-radius-sm);
}

.section-container.drag-over-after::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: var(--spacing-lg);
  right: var(--spacing-lg);
  height: 3px;
  background: var(--figma-color-border-brand);
  border-radius: var(--border-radius-sm);
}
```

## Error Handling

### Drag Operation Failures

1. **Invalid Drop Zones**: Prevent dropping outside valid section areas
2. **DOM Manipulation Errors**: Graceful fallback to original order if reordering fails
3. **State Persistence Errors**: Continue with in-memory order if saving fails

### State Recovery

1. **Corrupted Order Data**: Validate saved order against available sections
2. **Missing Sections**: Handle cases where saved order references non-existent sections
3. **Version Compatibility**: Handle future changes to section structure

### Accessibility Fallbacks

1. **Keyboard Navigation Failures**: Provide error feedback if keyboard reordering fails
2. **Screen Reader Announcements**: Fallback to basic announcements if advanced features fail

## Testing Strategy

### Unit Tests

1. **Section Order Logic**: Test section reordering algorithms
2. **State Persistence**: Test save/load functionality with various data states
3. **Drag State Management**: Test drag operation state transitions

### Integration Tests

1. **DOM Manipulation**: Test actual section reordering in DOM
2. **Message Passing**: Test communication between UI and plugin sandbox
3. **State Persistence Integration**: Test integration with existing UI state system

### Accessibility Tests

1. **Keyboard Navigation**: Test Ctrl+Up/Down functionality
2. **Screen Reader Compatibility**: Test ARIA announcements
3. **Focus Management**: Test focus behavior during reordering

### Visual Tests

1. **Drag Indicators**: Test drop indicator positioning and visibility
2. **Theme Compatibility**: Test drag styling across all themes
3. **Responsive Behavior**: Test drag functionality at different plugin sizes

## Performance Considerations

### DOM Efficiency

1. **Minimal DOM Manipulation**: Only move necessary elements during reordering
2. **Event Delegation**: Use efficient event handling patterns
3. **Debounced State Saving**: Reuse existing debouncing for state persistence

### Memory Management

1. **Event Cleanup**: Properly remove event listeners when sections are reordered
2. **State Caching**: Efficient caching of section order state
3. **Animation Performance**: Use CSS transforms for smooth drag animations

## Migration Strategy

### Existing Users

1. **Default Order Preservation**: Users without saved order get current default order
2. **Gradual Rollout**: Feature can be enabled progressively
3. **Backward Compatibility**: No breaking changes to existing functionality

### Future Extensibility

1. **Additional Sections**: Design supports adding new sections in the future
2. **Section Configuration**: Flexible system for section properties and behavior
3. **Advanced Features**: Foundation for features like section grouping or custom sections