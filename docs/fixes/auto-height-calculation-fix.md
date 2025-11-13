# Auto-Height Calculation Fix

## Problem Analysis

The auto-height function had two main issues:
1. **Feedback loop**: Height calculation → UI resize → layout changes → another calculation
2. **Collapsed sections ignored**: `scrollHeight` included full height of collapsed sections even when they have `max-height: 0`

## Collapsed-Aware Solution

### Key Changes:

1. **Collapsed section detection**:
   ```typescript
   for (const child of children) {
     if (child.classList.contains('collapsible-content') && child.classList.contains('collapsed')) {
       // Skip collapsed sections (they have max-height: 0)
       continue;
     } else {
       totalContentHeight += child.offsetHeight;
     }
   }
   ```

2. **Accurate height calculation**:
   ```typescript
   const totalHeight = totalContentHeight + mainPaddingTop + mainPaddingBottom + footerHeight + 2;
   ```

3. **Double debouncing + change detection**:
   - `updateScrollBehavior()` debounced at 50ms to prevent excessive calls
   - Auto-fit only triggers when height changes by more than 3px
   - Tracks `lastAutoFitHeight` to prevent unnecessary updates
   - Reduced logging noise (only logs when height actually changes)

### Why This Works:

- **Respects UI state**: Only measures visible content, ignoring collapsed sections
- **Accurate measurement**: Uses `offsetHeight` which respects CSS layout
- **Stable updates**: Debouncing prevents feedback loops
- **Efficient**: Only resizes when content actually changes

## Layout Structure:

```
┌─────────────────────────┐
│ main.scrollable-content │
│ ┌─────────────────────┐ │ ← Tags section (visible/collapsed)
│ │ Tags Content        │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │ ← Anchors section (visible/collapsed)  
│ │ Anchors Content     │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │ ← Navigation section (visible/collapsed)
│ │ Navigation Content  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
┌─────────────────────────┐
│ #footer (absolute)      │ ← 20px height
└─────────────────────────┘

Total: sum of visible sections + padding + footer + buffer
```

## Debug Output:

```javascript
{
  totalContentHeight: 320,    // Sum of visible section heights
  mainPaddingTop: 0,         // Main content padding
  mainPaddingBottom: 6,      // Main content padding  
  footerHeight: 20,          // Footer height
  totalHeight: 348,          // Final calculated height
  collapsedSections: 1       // Number of collapsed sections
}
```

## Default Behavior

Auto-height is now **enabled by default** for better user experience:

```typescript
let isAutoFitEnabled = true; // Default to enabled
```

- Plugin starts with optimal height on load
- Initial height calculation triggered after 100ms delay
- Button shows active state by default
- Users can still disable if they prefer manual sizing

## Result

- **Accurate sizing**: Respects collapsed/expanded states
- **No animation loops**: Double-debounced for maximum stability
- **Responsive**: Automatically adjusts when sections expand/collapse
- **Enabled by default**: Better out-of-the-box experience
- **Quiet operation**: Reduced logging noise, only logs actual changes
- **Performance optimized**: Prevents excessive function calls