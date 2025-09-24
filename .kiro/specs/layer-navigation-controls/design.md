# Design Document

## Overview

The Layer Navigation Controls feature adds a new UI section to the Stratus Hue plugin that provides button-based access to Figma's layer hierarchy navigation shortcuts. This feature will integrate seamlessly with the existing plugin architecture while providing intuitive controls for navigating through layer structures, entering/exiting containers, and managing layer visibility.

The design leverages the existing plugin's dual-context architecture (sandbox + UI iframe), state management system, and design token framework to ensure consistency and maintainability.

## Architecture

### Component Integration

The layer navigation controls will be implemented as a new collapsible section in the main plugin interface, positioned between the existing TAGS and ANCHORS sections. This placement provides logical grouping of navigation-related functionality.

### Message Flow Architecture

```
UI Context (iframe)          Plugin Context (sandbox)
┌─────────────────┐         ┌──────────────────────┐
│ Navigation      │ ──────► │ Layer Navigation     │
│ Button Grid     │         │ Handler              │
│                 │         │                      │
│ - Enter         │         │ - figma.currentPage  │
│ - Exit          │         │   .selection         │
│ - Tab/Shift+Tab │         │ - Node traversal     │
│ - Collapse      │         │ - Viewport control   │
└─────────────────┘         └──────────────────────┘
```

### State Management Integration

The feature will extend the existing state management system to include:
- Navigation controls visibility preference (persistent setting)
- Current navigation context (temporary state)
- Integration with existing selection history tracking

## Components and Interfaces

### UI Components

#### NavigationControlsSection
A new collapsible section component following the existing pattern:

```typescript
interface NavigationControlsSection {
  // Collapsible header with navigation icon
  header: CollapsibleHeader;
  // 2x3 button grid container
  buttonGrid: NavigationButtonGrid;
  // Settings integration for visibility toggle
  isVisible: boolean;
}
```

#### NavigationButtonGrid
A responsive grid layout containing the navigation buttons:

```typescript
interface NavigationButtonGrid {
  buttons: {
    exit: NavigationButton;      // Top-left (Shift+Enter)
    prevSibling: NavigationButton; // Top-right (Shift+Tab)
    collapse: NavigationButton;   // Middle-left (Alt+L)
    nextSibling: NavigationButton; // Middle-right (Tab)
    enter: NavigationButton;     // Bottom-right (Enter)
  };
}
```

#### NavigationButton
Individual button component with consistent styling:

```typescript
interface NavigationButton {
  id: string;
  icon: string;           // Visual indicator
  label: string;          // Accessible label
  shortcut: string;       // Keyboard shortcut display
  action: NavigationAction;
  isEnabled: boolean;     // Dynamic state based on selection
}
```

### Plugin Context Interfaces

#### LayerNavigationHandler
Core navigation logic in the plugin sandbox:

```typescript
interface LayerNavigationHandler {
  enterContainer(node: SceneNode): NavigationResult;
  exitContainer(node: SceneNode): NavigationResult;
  navigateToSibling(node: SceneNode, direction: 'next' | 'prev'): NavigationResult;
  toggleCollapse(): NavigationResult;
  validateNavigationContext(selection: readonly SceneNode[]): NavigationContext;
}
```

#### NavigationResult
Standardized result interface for navigation operations:

```typescript
interface NavigationResult {
  success: boolean;
  message: string;
  newSelection?: readonly SceneNode[];
  viewportUpdate?: boolean;
}
```

#### NavigationContext
Context information for determining button states:

```typescript
interface NavigationContext {
  hasSelection: boolean;
  canEnter: boolean;        // Has container selected
  canExit: boolean;         // Has parent container
  canNavigateSiblings: boolean;
  containerCount: number;   // For collapse toggle state
}
```

## Data Models

### Settings Extension

Extend the existing plugin settings to include navigation controls preference:

```typescript
interface PluginSettings {
  // Existing settings...
  navigationControls: {
    enabled: boolean;
    lastToggleTime: number;
  };
}
```

### Message Types

New message types for UI-Plugin communication:

```typescript
// UI to Plugin messages
interface NavigationActionMessage {
  type: 'navigation-action';
  action: 'enter' | 'exit' | 'next-sibling' | 'prev-sibling' | 'toggle-collapse';
}

interface ToggleNavigationControlsMessage {
  type: 'toggle-navigation-controls';
  enabled: boolean;
}

// Plugin to UI messages
interface NavigationStateMessage {
  type: 'navigation-context-update';
  context: NavigationContext;
}

interface NavigationControlsSettingMessage {
  type: 'navigation-controls-setting';
  enabled: boolean;
}
```

## Error Handling

### Navigation Error Types

Extend the existing error handling system with navigation-specific error types:

```typescript
enum NavigationErrorType {
  NO_SELECTION = 'NO_SELECTION',
  INVALID_CONTAINER = 'INVALID_CONTAINER',
  NO_PARENT = 'NO_PARENT',
  NO_SIBLINGS = 'NO_SIBLINGS',
  VIEWPORT_ERROR = 'VIEWPORT_ERROR'
}
```

### Error Recovery Strategies

1. **Graceful Degradation**: Disable specific buttons when actions aren't available
2. **User Feedback**: Clear messaging about why actions can't be performed
3. **State Recovery**: Maintain selection state when navigation fails
4. **Fallback Behavior**: Provide alternative actions when primary actions fail

## Testing Strategy

### Unit Testing

1. **Navigation Logic Tests**
   - Container entry/exit logic
   - Sibling navigation with edge cases (first/last child)
   - Collapse/expand state management
   - Selection validation

2. **UI Component Tests**
   - Button state updates based on context
   - Grid layout responsiveness
   - Settings integration
   - Message handling

3. **Integration Tests**
   - End-to-end navigation flows
   - Settings persistence
   - Error handling scenarios
   - Performance with large layer hierarchies

### Manual Testing Scenarios

1. **Basic Navigation Flow**
   - Select container → Enter → Navigate siblings → Exit
   - Test with nested containers (Groups within Sections)
   - Test with empty containers

2. **Edge Cases**
   - Single layer selection
   - Multiple layer selection
   - Top-level layer navigation
   - Locked/hidden layers

3. **Settings Integration**
   - Toggle visibility on/off
   - Persistence across plugin sessions
   - UI layout adaptation

4. **Cross-Feature Integration**
   - Navigation with existing bookmark system
   - Navigation with color tagging
   - Navigation history integration

### Performance Testing

1. **Large File Handling**
   - Test with files containing 1000+ layers
   - Measure navigation response times
   - Memory usage during navigation

2. **Viewport Updates**
   - Smooth scrolling and zooming
   - Viewport performance with complex layouts
   - Multiple rapid navigation actions

## Implementation Approach

### Phase 1: Core Navigation Logic
- Implement navigation handler in plugin context
- Add message types and error handling
- Create basic navigation functions

### Phase 2: UI Components
- Design and implement button grid layout
- Add collapsible section integration
- Implement button state management

### Phase 3: Settings Integration
- Add settings toggle to existing settings panel
- Implement persistence logic
- Add UI visibility controls

### Phase 4: Polish and Integration
- Add animations and transitions
- Implement comprehensive error handling
- Add accessibility features
- Performance optimization

### Design Token Usage

The navigation controls will use the existing design token system:

```css
.navigation-controls {
  /* Spacing */
  padding: var(--spacing-lg);
  gap: var(--spacing-md);
  
  /* Colors */
  background: var(--theme-bg-secondary);
  border: 1px solid var(--theme-border-primary);
  
  /* Typography */
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  
  /* Layout */
  border-radius: var(--border-radius-md);
}

.navigation-button {
  /* Component sizing */
  height: var(--button-height-lg);
  min-width: var(--button-height-lg);
  
  /* Interactive states */
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

.navigation-button:hover {
  background: var(--theme-interactive-hover);
}

.navigation-button:disabled {
  background: var(--theme-interactive-disabled);
  color: var(--theme-text-disabled);
}
```

### Accessibility Considerations

1. **Keyboard Navigation**
   - Tab order through button grid
   - Arrow key navigation within grid
   - Enter/Space activation

2. **Screen Reader Support**
   - Descriptive button labels
   - State announcements (enabled/disabled)
   - Context information

3. **Visual Indicators**
   - Clear disabled states
   - Focus indicators
   - High contrast support

### Browser Compatibility

The feature will maintain compatibility with the existing plugin's browser support:
- Modern browsers supporting ES2020+
- Figma's embedded browser environment
- No additional dependencies beyond existing lottie-web

This design ensures the layer navigation controls integrate seamlessly with the existing Stratus Hue plugin while providing powerful new navigation capabilities that enhance the designer workflow.