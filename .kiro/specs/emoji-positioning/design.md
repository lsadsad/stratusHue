# Design Document

## Overview

Add emoji positioning preferences to Stratus Hue, allowing users to choose whether emojis appear at the beginning, end, or both positions in layer and page titles. This extends the existing emoji management system with configurable placement options.

## Architecture

### State Management
- Add positioning preferences to existing state system
- Store separate settings for layers vs pages
- Persist preferences using Figma's clientStorage API
- Default to "Beginning" for backward compatibility

### UI Components
- Add positioning controls to settings overlay
- Radio button group for Beginning/End/Both options
- Separate controls for layers and pages

### Core Logic Flow
1. User selects positioning preference in settings
2. Preference stored in state and persisted
3. When adding emoji, check positioning preference
4. Apply emoji using new positioning logic

## Components and Interfaces

### New State Properties
```typescript
interface EmojiPositioningState {
  layerPosition: 'beginning' | 'end' | 'both';
  pagePosition: 'beginning' | 'end' | 'both';
}
```

### Modified Functions
- `replaceColorEmoji()` - Add positioning parameter
- `addEmojiToSelection()` - Use positioning preference
- New `applyEmojiPositioning()` - Core positioning logic

### UI Message Types
```typescript
interface SetEmojiPositionMessage {
  type: 'set-emoji-position';
  target: 'layer' | 'page';
  position: 'beginning' | 'end' | 'both';
}
```

## Data Models

### Positioning Logic
- **Beginning**: `"🟥 Layer Name"`
- **End**: `"Layer Name 🟥"`  
- **Both**: `"🟥 Layer Name 🟥"`

### Page Title Handling
- Respect canonical format `"↳ [emoji] [MM.DD] : Title"`
- For "End" positioning, place after title text
- For "Both", use same emoji at both positions

## Error Handling

### Validation
- Validate positioning values are valid enum options
- Handle missing or corrupted preference data gracefully
- Fall back to "Beginning" if preference unavailable

## Testing Strategy

### Unit Tests
- Test positioning logic with various title formats
- Test state persistence and retrieval
- Test emoji detection and replacement

### Integration Tests  
- Test UI preference changes trigger correct behavior
- Test interaction with existing canonical page format

### Edge Cases
- Empty titles
- Titles with multiple existing emojis
- Titles with special characters or formatting
- Very long titles that might cause UI issues