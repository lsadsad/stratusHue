# Button Layout and Label Improvements

## Changes Made

### 1. Removed "PREV" and "NEXT" from Labels

**Before:**
- Top button: "Prev/Down" 
- Bottom button: "Next/Up"

**After:**
- Top button: "Down" (layer mode) / "Page" (page mode)
- Bottom button: "Up" (layer mode) / "Page" (page mode)

### 2. Swapped Button Positions

**Before Layout:**
```
[Exit]    [Prev/Down] ← Was on top
[Collapse] [Next/Up]   ← Was on bottom  
[Enter]
```

**After Layout:**
```
[Exit]    [Down/Page] ← Next button now on top (intuitive forward movement)
[Collapse] [Up/Page]  ← Prev button now on bottom
[Enter]
```

### 3. Updated Visual Alignment

**Button Icons:**
- Top button (Next): ↓ arrow (down movement)
- Bottom button (Prev): ↑ arrow (up movement)

**Grid Positions:**
- Swapped `data-grid-row` values to maintain proper grid structure
- Next button: `data-grid-row="0"` (top position)
- Prev button: `data-grid-row="1"` (bottom position)

### 4. Dynamic Context-Aware Labels

#### Page Mode (No Selection)
- **Top button**: "Page" → Navigate to next page
- **Bottom button**: "Page" → Navigate to previous page
- **Icons**: Same arrows (↓ for next, ↑ for prev)

#### Layer Mode (Has Selection)  
- **Top button**: "Down" → Navigate down in layers panel
- **Bottom button**: "Up" → Navigate up in layers panel
- **Icons**: Match the movement direction

### 5. Improved Visual Logic

**Intuitive Flow:**
```
Page Navigation:    Layer Navigation:
Page A              Layer A (top)
  ↓ (Next)            ↑ (Prev)  
Page B              Layer B (middle)
  ↓ (Next)            ↓ (Next)
Page C              Layer C (bottom)
```

**Button Positioning Logic:**
- **Top button** = Forward/Down movement (Next action)
- **Bottom button** = Backward/Up movement (Prev action)
- **Visual alignment** matches the directional flow

## Implementation Details

### HTML Structure Updates
```html
<!-- Top position: Next button -->
<button id="nav-next" data-grid-row="0" data-shortcut="Tab">
  <span class="nav-icon">↓</span>
  <span class="nav-label">Down</span>
</button>

<!-- Bottom position: Prev button -->  
<button id="nav-prev" data-grid-row="1" data-shortcut="Shift+Tab">
  <span class="nav-icon">↑</span>
  <span class="nav-label">Up</span>
</button>
```

### Dynamic Label Updates
```typescript
// Update visible labels based on context
const labelElement = nextBtn.querySelector('.nav-label');
if (labelElement) {
  labelElement.textContent = isPageMode ? 'Page' : 'Down';
}
```

### Accessibility Improvements
- **Aria-labels** remain descriptive and context-aware
- **Screen reader descriptions** update based on navigation mode
- **Keyboard shortcuts** stay consistent (Tab/Shift+Tab)

## User Experience Benefits

### ✅ **Cleaner Visual Design**
- Removed redundant "PREV/NEXT" text
- Simplified to essential directional indicators
- Less visual clutter

### ✅ **Intuitive Button Placement**
- Top button = Forward movement (Next)
- Bottom button = Backward movement (Prev)
- Matches natural reading/navigation flow

### ✅ **Context-Aware Labels**
- "Page" when navigating between pages
- "Down/Up" when navigating between layers
- Clear indication of current navigation mode

### ✅ **Consistent Visual Logic**
- Button position matches movement direction
- Icons align with actual navigation behavior
- Reduces cognitive load for users

### ✅ **Maintained Functionality**
- All keyboard shortcuts preserved (Tab/Shift+Tab)
- Accessibility features intact
- Dynamic behavior based on selection state

## Visual Layout

```
Navigation Grid:
┌─────────┬─────────┐
│  Exit   │  Down   │ ← Next button (Tab)
├─────────┼─────────┤     Navigate forward/down
│Collapse │   Up    │ ← Prev button (Shift+Tab)  
├─────────┴─────────┤     Navigate backward/up
│      Enter        │
└───────────────────┘
```

The improved layout provides a more intuitive and visually clean navigation experience while maintaining all functionality and accessibility features.