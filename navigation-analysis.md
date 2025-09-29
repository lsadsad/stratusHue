# Navigation Panel Next/Prev Button Analysis

## Current Implementation Review

### How It Currently Works
- **Next Button (Tab)**: Moves UP in layers panel (toward top, lower array index)
- **Prev Button (Shift+Tab)**: Moves DOWN in layers panel (toward bottom, higher array index)
- **Wrapping**: Enabled - when reaching end, wraps to opposite end
- **Single Selection Only**: Requires exactly one layer selected

### Current UI Labels vs Behavior Mismatch
```
UI Label: "Next/Down sibling (Tab)" → Actually moves UP in layers
UI Label: "Previous/Down sibling (Shift+Tab)" → Actually moves DOWN in layers
```

## Issues Identified

### 1. Confusing Direction Mapping
The current implementation has a counter-intuitive direction mapping:
- Users expect "Next" to move DOWN in a list (like Tab in forms)
- Users expect "Previous" to move UP in a list (like Shift+Tab in forms)
- Current behavior is reversed from these expectations

### 2. Inconsistent Labels
The UI labels mention "Down" for both buttons, but:
- Next actually moves UP in layers panel
- Prev actually moves DOWN in layers panel

### 3. Code Comments vs Implementation
Code comments correctly describe the behavior but UI labels don't match.

## Scenarios to Test

### Scenario 1: Basic Sibling Navigation
**Setup**: 3 layers in a frame: Layer A (top), Layer B (middle), Layer C (bottom)
**Current Behavior**:
- Select Layer B → Click Next → Selects Layer A (moves UP)
- Select Layer B → Click Prev → Selects Layer C (moves DOWN)

**User Expectation**:
- Select Layer B → Click Next → Should select Layer C (move DOWN)
- Select Layer B → Click Prev → Should select Layer A (move UP)

### Scenario 2: Wrapping Behavior
**Setup**: Same 3 layers
**Current Behavior**:
- Select Layer A (top) → Click Next → Selects Layer C (wraps to bottom)
- Select Layer C (bottom) → Click Prev → Selects Layer A (wraps to top)

**Analysis**: Wrapping direction follows the reversed logic

### Scenario 3: Nested Containers
**Setup**: Frame with nested groups containing layers
**Current Behavior**: Navigation works within sibling groups at same level
**Potential Issue**: Users might expect to navigate across different hierarchy levels

### Scenario 4: Mixed Selection Types
**Setup**: Mix of frames, groups, and individual layers as siblings
**Current Behavior**: Navigates through all visible siblings regardless of type
**Analysis**: This seems correct

### Scenario 5: Empty/No Siblings
**Setup**: Single layer with no siblings
**Current Behavior**: Shows "no siblings available" message
**Analysis**: Good error handling

## Recommended Solutions

### Option 1: Fix Direction Mapping (Recommended)
**Change the core logic to match user expectations:**
```typescript
// In findSibling method:
if (direction === 'next') {
  // Next/Tab moves DOWN in layers (toward bottom = higher index)
  targetIndex = currentIndex + 1;
} else {
  // Prev/Shift+Tab moves UP in layers (toward top = lower index)  
  targetIndex = currentIndex - 1;
}
```

**Update UI labels:**
- Next: "Next sibling (Tab)" - moves down in layers
- Prev: "Previous sibling (Shift+Tab)" - moves up in layers

### Option 2: Fix Labels Only (Less Recommended)
Keep current behavior but fix labels to match:
- Next: "Up sibling (Tab)" - moves up in layers
- Prev: "Down sibling (Shift+Tab)" - moves down in layers

### Option 3: Add Direction Toggle (Complex)
Allow users to choose their preferred direction mapping in settings.

## Additional Enhancements to Consider

### 1. Visual Feedback Improvements
- Highlight the direction of movement in success messages
- Show layer position context (e.g., "2 of 5 siblings")

### 2. Smart Navigation Fallbacks
- When no siblings exist, offer to navigate to parent's siblings
- Provide option to navigate across hierarchy levels

### 3. Multi-Selection Support
- Currently requires single selection
- Could support navigating with multiple items selected

### 4. Keyboard Shortcut Consistency
- Ensure button behavior matches actual Tab/Shift+Tab if those shortcuts are implemented
- Consider adding arrow key navigation

## Testing Scenarios for Each Solution

### For Option 1 (Fix Direction):
1. **Basic Navigation**: Verify Next moves down, Prev moves up
2. **Wrapping**: Verify wrapping directions are intuitive
3. **User Muscle Memory**: Test with users familiar with current behavior
4. **Keyboard Consistency**: Ensure matches Tab/Shift+Tab expectations

### For Option 2 (Fix Labels):
1. **Label Clarity**: Verify new labels are clear and unambiguous
2. **User Confusion**: Test if "Up/Down" labels are more confusing than "Next/Prev"
3. **Accessibility**: Ensure screen readers handle new labels well

## Implementation Priority

**High Priority:**
- Fix direction mapping (Option 1) - addresses core UX issue
- Update UI labels to match behavior
- Add comprehensive testing

**Medium Priority:**
- Improve error messages with directional context
- Add position indicators (e.g., "3 of 7 siblings")

**Low Priority:**
- Multi-selection support
- Cross-hierarchy navigation options
- Direction preference settings

## Breaking Changes Consideration

Changing the direction mapping (Option 1) is a breaking change for existing users who have learned the current behavior. Consider:
- Adding a migration notice
- Providing temporary setting to use "legacy" direction
- Clear documentation of the change