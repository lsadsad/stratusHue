# Navigation Enhancement: Browser-Like Forward and Back Buttons

## Overview

The Forward and Back buttons in the stratusHue plugin header now function like web browser navigation buttons, allowing users to navigate through their selection history seamlessly.

## Features

### 🔄 Selection History Tracking
- **Automatic Tracking**: Every time you select an object (layer, component, group, etc.), it's automatically added to the navigation history
- **Smart Deduplication**: Consecutive selections of the same object won't create duplicate history entries
- **Cross-Page Support**: History works across different pages in your Figma file

### ⬅️ Back Navigation
- Navigate to previously selected objects
- Maintains the exact selection and viewport position
- Shows helpful messages about what you're navigating to
- Button is automatically disabled when there's no previous history

### ➡️ Forward Navigation  
- Navigate forward through history after going back
- Works exactly like browser forward button behavior
- Button is automatically disabled when you're at the latest point in history

### 📄 Page Change Tracking
- Page changes are also tracked in navigation history
- Navigate back to previous pages you were working on
- Seamless integration with object selection history

### 🔖 Bookmark Integration
- Jumping to bookmarks is added to navigation history
- You can navigate back from bookmarks using the Back button
- Maintains consistency with the overall navigation experience

## Technical Implementation

### History Entry Types
The navigation system tracks three types of history entries:

1. **Selection**: When you select objects/layers
2. **Page**: When you switch between pages  
3. **Bookmark**: When you jump to bookmarks

### Smart Navigation Prevention
- When navigating through history (Back/Forward), new history entries aren't created
- Prevents infinite loops and maintains clean navigation flow
- Uses a temporary flag system to distinguish between user selections and programmatic navigation

### UI State Management
- Forward/Back buttons are automatically enabled/disabled based on history availability
- Real-time updates as you navigate and make selections
- Consistent with browser navigation UX patterns

## Usage

### Basic Navigation
1. **Select objects** in your Figma file - they're automatically tracked
2. **Click Back** to return to previously selected objects
3. **Click Forward** to move forward through your selection history

### Cross-Page Navigation
1. **Switch pages** - page changes are tracked
2. **Use Back button** to return to previous pages
3. **Navigate between objects** on different pages seamlessly

### Bookmark Navigation
1. **Jump to bookmarks** using the anchor system
2. **Use Back button** to return to where you were before jumping
3. **Continue navigating** through your selection history

## Benefits

- **Improved Workflow**: Quickly return to previously selected objects
- **Better Context Switching**: Navigate between different areas of your design
- **Familiar UX**: Works exactly like browser navigation that users already know
- **Cross-Page Support**: Seamlessly work across multiple pages
- **Integration**: Works perfectly with existing bookmark system

## Technical Details

### Files Modified
- `src/code.ts`: Added navigation message handlers
- `src/navigation.ts`: Implemented browser-like navigation functions
- `src/state.ts`: Added navigation history state management
- `src/ui-communication.ts`: Added navigation state UI updates

### Key Functions
- `addSelectionToHistory()`: Tracks user selections
- `goBackInHistory()`: Navigate to previous selections
- `goForwardInHistory()`: Navigate forward through history
- `addPageChangeToHistory()`: Track page changes
- `getNavigationState()`: Get current navigation capabilities

### Performance Considerations
- History is limited to 50 entries to prevent memory issues
- Debounced selection tracking (100ms) to prevent excessive history entries
- Efficient duplicate detection to keep history clean
- Smart navigation flag prevents recursive history additions

## Future Enhancements

Potential future improvements could include:
- History persistence across plugin sessions
- Visual history preview (like browser history dropdown)
- Keyboard shortcuts for navigation (Ctrl+Left/Right)
- History search and filtering
- Export/import navigation patterns