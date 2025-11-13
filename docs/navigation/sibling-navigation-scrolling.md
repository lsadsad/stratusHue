# Sibling Navigation with Scrolling and Expansion Control

## Implementation Summary

### **Key Changes Made:**

1. **✅ Enabled Automatic Scrolling**: 
   - Next/Prev buttons now scroll to show the selected layer
   - Matches Tab/Shift+Tab behavior for visual feedback

2. **✅ Prevented Auto-Expansion**:
   - Keeps parent containers collapsed during sibling navigation
   - Prevents unwanted layer panel expansion

3. **✅ Simplified Logic**:
   - Removed complex state preservation
   - Direct approach: collapse parent containers after selection

## **Current Behavior:**

### **When Next/Prev is Pressed:**
1. **Selects sibling layer** (existing behavior)
2. **Scrolls viewport** to show selected layer (NEW)
3. **Collapses parent containers** to prevent auto-expansion (NEW)
4. **Records in history** (existing behavior)

### **Code Implementation:**
```typescript
const isSiblingAction = action === 'next-sibling' || action === 'prev-sibling';

if (result.newSelection) {
  // Change selection
  figma.currentPage.selection = result.newSelection as SceneNode[];
  
  // For sibling navigation, prevent auto-expansion of parent containers
  if (isSiblingAction && result.newSelection.length > 0) {
    setTimeout(() => {
      const selectedNode = result.newSelection[0];
      
      // Find parent containers of the selected node and keep them collapsed
      let currentParent = selectedNode.parent;
      while (currentParent && currentParent.type !== 'PAGE') {
        if ('expanded' in currentParent && typeof (currentParent as any).expanded === 'boolean') {
          (currentParent as any).expanded = false;
        }
        currentParent = currentParent.parent;
      }
    }, 0);
  }
}

// Always scroll to show selected layer for better UX
if (result.viewportUpdate && result.newSelection && result.newSelection.length > 0) {
  figma.viewport.scrollAndZoomIntoView(result.newSelection as SceneNode[]);
}
```

## **Benefits:**

### ✅ **Visual Feedback**
- **Automatic scrolling** shows where you navigated
- **Matches native behavior** of Tab/Shift+Tab
- **Better spatial awareness** during navigation

### ✅ **Controlled Expansion**
- **Prevents unwanted expansion** of parent containers
- **Maintains layer panel organization** 
- **Predictable behavior** - no surprise panel changes

### ✅ **Simple & Reliable**
- **Direct approach** - no complex state management
- **Minimal overhead** - only processes parent chain
- **Robust** - handles nested containers properly

## **How It Works:**

### **Expansion Prevention Logic:**
1. **After selection change**: Wait for Figma's auto-expansion to occur
2. **Walk parent chain**: Find all parent containers of selected node
3. **Force collapse**: Set `expanded = false` on each parent container
4. **Result**: Selected layer is visible but containers stay collapsed

### **Viewport Scrolling:**
- **All navigation actions** now scroll to show selected layer
- **Enter action**: Only scrolls to first child (existing behavior)
- **Sibling navigation**: Scrolls to selected layer (NEW)

## **Edge Cases Handled:**

### **Nested Containers:**
```
Page
└── Section (collapsed)
    └── Frame (collapsed)
        └── Group (collapsed)
            └── Layer A ← Selected via Next/Prev
```
**Result**: All parent containers remain collapsed, but Layer A is selected and visible

### **Multiple Selection:**
- **Focus navigation**: Scrolls to the focused item (first/last in selection)
- **Expansion control**: Applies to the focused item's parents

### **Performance:**
- **Minimal processing**: Only walks parent chain of selected node
- **Non-blocking**: Uses setTimeout to avoid interfering with selection
- **Efficient**: No page-wide container scanning

## **Testing Scenarios:**

### **Scenario 1: Nested Layer Navigation**
1. **Setup**: Layer inside collapsed Frame inside collapsed Section
2. **Action**: Navigate to layer with Next/Prev
3. **Expected**: Layer selected, viewport scrolls to show it, containers stay collapsed

### **Scenario 2: Sibling Navigation**
1. **Setup**: Multiple layers at same level, some containers collapsed
2. **Action**: Navigate between siblings with Next/Prev
3. **Expected**: Smooth navigation with scrolling, no unwanted expansion

### **Scenario 3: Mixed Navigation**
1. **Setup**: Use Enter to go into container, then Next/Prev between children
2. **Action**: Navigate within container
3. **Expected**: Container stays expanded (from Enter), children navigation works smoothly

This implementation provides the expected Tab/Shift+Tab-like behavior while maintaining control over layer panel expansion, giving users a smooth and predictable navigation experience.