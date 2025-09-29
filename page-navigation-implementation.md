# Page Navigation Implementation

## Overview

Implemented comprehensive page navigation functionality that respects Figma's selection model:
- **No layers selected** = Page is selected → Navigate between pages
- **Layers selected** = Layer navigation → Navigate between sibling layers

## Key Changes Made

### 1. Updated Empty Selection Handling (`src/features/navigation.ts`)

**Before:**
```typescript
case 'next-sibling':
case 'prev-sibling':
  // Both did the same thing - select first layer
  return LayerNavigationHandler.selectFirstTopLevelLayer();
```

**After:**
```typescript
case 'next-sibling':
  return LayerNavigationHandler.navigateToNextPage();
case 'prev-sibling':
  return LayerNavigationHandler.navigateToPrevPage();
case 'enter':
  return LayerNavigationHandler.selectFirstTopLevelLayer(); // Enter page
```

### 2. Added Page Navigation Methods

#### `navigateToNextPage()`
- Finds all pages in document
- Navigates to next page with wrapping (last → first)
- Clears selection to maintain page-level context
- Records page navigation in history
- Provides appropriate feedback messages

#### `navigateToPrevPage()`
- Navigates to previous page with wrapping (first → last)
- Same features as next page navigation
- Consistent error handling and feedback

### 3. Enhanced Navigation Context

**Updated `validateNavigationContext()` for empty selection:**
```typescript
if (!hasSelection) {
  const pages = figma.root.children.filter(child => child.type === 'PAGE');
  const canNavigatePages = pages.length > 1;
  const hasLayersOnPage = figma.currentPage.children.some(child => 'visible' in child && child.visible);
  
  return {
    hasSelection: false,
    canEnter: hasLayersOnPage,        // Can enter page if it has layers
    canExit: false,                   // No parent to exit to at page level
    canNavigateSiblings: canNavigatePages, // Can navigate if multiple pages
    // ... other properties
  };
}
```

### 4. Dynamic UI Labels (`src/ui.ts`)

#### Next/Prev Buttons
**Page Mode (no selection):**
- Labels: "Next page (Tab)" / "Previous page (Shift+Tab)"
- Descriptions: "Navigate to next/previous page"
- Disabled: "Only one page in document"

**Layer Mode (has selection):**
- Labels: "Next sibling (Tab)" / "Previous sibling (Shift+Tab)"  
- Descriptions: "Select next/previous sibling layer"
- Disabled: "No sibling layers available"

#### Enter Button
**Page Mode:**
- Label: "Enter page (Enter)"
- Description: "Select first layer on page"
- Disabled: "No layers available on current page"

**Layer Mode:**
- Label: "Enter container (Enter)"
- Description: "Select all children of container and focus view"
- Disabled: "No container selected to enter"

## Navigation Flow

### Page Level (No Selection)
```
Page A ←→ Page B ←→ Page C
  ↓ Enter
Layer navigation within page
```

### Layer Level (Has Selection)
```
Layer A ←→ Layer B ←→ Layer C
  ↑ Exit
Back to page level
```

## Features

### ✅ **Directional Consistency**
- Next = Forward/Down (pages: A→B, layers: up→down in panel)
- Prev = Backward/Up (pages: B→A, layers: down→up in panel)

### ✅ **Wrapping Navigation**
- Pages: Last page → First page (and vice versa)
- Layers: Last sibling → First sibling (and vice versa)

### ✅ **Context-Aware UI**
- Button labels change based on navigation mode
- Appropriate feedback for disabled states
- Clear indication of current navigation level

### ✅ **History Integration**
- Page navigation recorded in history
- Supports back/forward navigation
- Maintains navigation context

### ✅ **Error Handling**
- Graceful handling of single-page documents
- Proper feedback for empty pages
- Robust error boundaries

### ✅ **Accessibility**
- Dynamic aria-labels based on context
- Clear descriptions for screen readers
- Consistent keyboard shortcuts (Tab/Shift+Tab)

## Behavior Examples

### Multi-Page Document
1. **No selection** → Next/Prev navigate between pages
2. **Click Enter** → Select first layer on current page
3. **Now has selection** → Next/Prev navigate between sibling layers
4. **Click Exit** → Return to page level (no selection)

### Single-Page Document
1. **No selection** → Next/Prev buttons disabled ("Only one page")
2. **Click Enter** → Select first layer (if any exist)
3. **Layer navigation** → Works normally within the page

### Empty Page
1. **No selection** → Next/Prev work for page navigation
2. **Enter button disabled** → "No layers available on current page"

## Technical Implementation

### Page Navigation Logic
- Uses `figma.root.children` to get all pages
- Filters for `PAGE` type nodes
- Implements circular navigation with modulo arithmetic
- Uses `figma.setCurrentPageAsync()` for page switching
- Clears selection after page change to maintain page context

### Context Detection
- `!context.hasSelection` indicates page mode
- `context.canNavigateSiblings` enables/disables buttons appropriately
- `context.canEnter` allows entering page when layers exist

### UI Responsiveness
- Real-time label updates based on selection state
- Immediate feedback for navigation actions
- Consistent visual indicators across all navigation modes

This implementation provides a seamless, intuitive navigation experience that respects Figma's native selection model while extending it with powerful page-to-page navigation capabilities.