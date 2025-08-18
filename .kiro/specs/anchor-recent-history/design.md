# Design Document

## Overview

This design extends the current anchor tracking system in Stratus_Hue by adding recent history indicators to show which anchors have been recently visited. The solution builds directly on the existing current anchor infrastructure while maintaining visual simplicity and avoiding interface clutter.

## Architecture

### Current System Integration

This feature extends the existing current anchor system:
- **Current Anchor State**: Already tracks which bookmark is currently active
- **Navigation Detection**: Already detects bookmark navigation and manual navigation
- **UI Message System**: Already sends current anchor data to frontend
- **Visual Indicators**: Already has CSS system for current anchor styling

### New Components

The recent history system will add:
- **Recent History State**: Track list of recently visited bookmark IDs
- **History Management**: Add/remove/rotate items in recent history list
- **Extended UI Messages**: Include recent history data in bookmark messages
- **Additional Visual Styling**: Subtle indicators for recently visited anchors

## Components and Interfaces

### 1. Recent History State Management

```typescript
interface RecentHistoryState {
  bookmarkIds: string[];     // Array of recently visited bookmark IDs (max 5)
  lastUpdated: number;       // Timestamp of last update
}
```

**Storage Location**: `figma.clientStorage` for session persistence
**Key**: `'recentHistory'`
**Max Items**: 5 (oldest items automatically removed)

### 2. History Management Logic

**Adding to Recent History**:
- When `handleJumpToBookmark()` is called, add bookmark ID to recent history
- If bookmark already exists in history, move it to front (most recent position)
- If history exceeds 5 items, remove oldest item
- Current anchor is NOT included in recent history (they are separate concepts)

**History Rotation**:
```typescript
// Pseudocode for adding to recent history
function addToRecentHistory(bookmarkId: string) {
  // Remove if already exists
  recentHistory = recentHistory.filter(id => id !== bookmarkId);
  // Add to front
  recentHistory.unshift(bookmarkId);
  // Keep only 5 most recent
  recentHistory = recentHistory.slice(0, 5);
}
```

### 3. UI Visual Indicators

**Recent History Styling**:
- Add `recent-history` CSS class to recently visited bookmark items
- Visual treatment: subtle gray accent border (less prominent than current anchor)
- Ensure current anchor styling takes precedence when both apply

**CSS Implementation**:
```css
.bookmark-item.recent-history {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.bookmark-item.recent-history .bookmark-name {
  color: rgba(255, 255, 255, 0.85);
}

/* Current anchor takes precedence over recent history */
.bookmark-item.current-anchor {
  background: rgba(111, 176, 255, 0.08);
  border: 1px solid rgba(111, 176, 255, 0.3);
}
```

### 4. Integration Points

**Backend Integration**:
- Extend `handleJumpToBookmark()` to add to recent history
- Add recent history loading/saving functions
- Modify `sendBookmarksToUI()` to include recent history data
- Add recent history validation and cleanup

**Frontend Integration**:
- Update bookmark rendering to apply recent history styling
- Handle both current anchor and recent history classes
- Maintain existing hover and interaction behaviors

## Data Models

### Extended Message Types

```typescript
// Extended bookmarks message to include recent history
interface BookmarksMessage {
  type: 'bookmarks';
  bookmarks: Bookmark[];
  currentAnchorId: string | null;
  recentHistoryIds: string[];  // New field
}
```

### State Management

**Recent History State**:
- Stored in `figma.clientStorage` alongside current anchor state
- Updated when user navigates to bookmarks (not when manually navigating)
- Cleaned up when bookmarks are deleted or become inaccessible
- Synchronized between backend and frontend

## Error Handling

### Stale History Cleanup

**Problem**: Recent history contains deleted or moved bookmarks
**Solution**: 
- Validate recent history on plugin startup
- Remove invalid bookmark IDs from recent history
- Clean up recent history during bookmark resync operations

### Current Anchor vs Recent History

**Problem**: Current anchor might also be in recent history
**Solution**:
- Current anchor and recent history are separate concepts
- Current anchor styling takes visual precedence
- Recent history shows where you've been, current anchor shows where you are

### Storage Corruption

**Problem**: Recent history data becomes corrupted
**Solution**:
- Graceful fallback to empty recent history
- Validate data structure on load
- Reset to empty array if validation fails

## Testing Strategy

### Unit Testing Scenarios

1. **Recent History Management**:
   - Add new bookmark to empty history
   - Add existing bookmark (should move to front)
   - Add 6th bookmark (should remove oldest)
   - Clear recent history

2. **State Persistence**:
   - Save and load recent history across sessions
   - Handle corrupted data gracefully
   - Clean up deleted bookmarks from history

3. **Visual Integration**:
   - Apply recent history styling correctly
   - Ensure current anchor takes precedence
   - Test with various combinations of states

### Integration Testing

1. **Navigation Flow**:
   - Jump to bookmark A → verify A in recent history
   - Jump to bookmark B → verify B at front, A second
   - Manually navigate away → verify recent history unchanged
   - Jump back to A → verify A moves to front

2. **Edge Cases**:
   - Delete bookmark that's in recent history
   - Rename bookmark that's in recent history
   - Clear all bookmarks with active recent history

### User Experience Testing

1. **Visual Clarity**:
   - Recent history indicators are subtle but visible
   - Current anchor clearly distinguished from recent history
   - No visual conflicts or confusion

2. **Performance**:
   - No lag when updating recent history
   - Efficient rendering with multiple indicators
   - Smooth transitions between states

## Implementation Approach

### Phase 1: Backend Recent History Management
1. Add recent history state storage and retrieval functions
2. Extend `handleJumpToBookmark()` to update recent history
3. Add recent history validation and cleanup logic

### Phase 2: UI Message Integration
1. Update `sendBookmarksToUI()` to include recent history data
2. Extend message interfaces to include recent history
3. Add recent history clearing functionality

### Phase 3: Frontend Visual Indicators
1. Add CSS classes for recent history styling
2. Update bookmark list rendering to handle recent history
3. Ensure proper precedence between current anchor and recent history

### Phase 4: Testing and Refinement
1. Test all navigation scenarios with recent history
2. Verify visual consistency and clarity
3. Optimize performance and user experience

This design provides a clean extension to the current anchor system, adding valuable navigation context without overwhelming the interface.