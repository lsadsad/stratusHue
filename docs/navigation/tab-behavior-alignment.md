# Tab/Shift+Tab Behavior Alignment

## Changes Made

### **1. Enabled Viewport Scrolling for Sibling Navigation**

**Before:**
```typescript
// For sibling navigation, disable viewport updates to prevent auto-expansion of containers
const isSiblingAction = action === 'next-sibling' || action === 'prev-sibling';
if (!isSiblingAction) {
  figma.viewport.scrollAndZoomIntoView(viewportTargets as SceneNode[]);
}
```

**After:**
```typescript
// For sibling navigation, enable viewport updates to match Tab/Shift+Tab behavior
if (isSiblingAction) {
  // Sibling navigation: scroll to show selected layer (like Tab/Shift+Tab)
  figma.viewport.scrollAndZoomIntoView(result.newSelection as SceneNode[]);
}
```

### **2. Added Expansion State Preservation**

**Problem**: Figma automatically expands containers when selecting child layers
**Solution**: Store and restore expansion states around selection changes

```typescript
// Store current expansion states before selection change
const expansionStates = new Map<string, boolean>();

if (isSiblingAction) {
  // Capture all container expansion states
  const allContainers = figma.currentPage.findAll(node => 
    'expanded' in node && typeof (node as any).expanded === 'boolean'
  );
  
  allContainers.forEach(container => {
    expansionStates.set(container.id, (container as any).expanded);
  });
}

// Change selection
figma.currentPage.selection = result.newSelection as SceneNode[];

// Restore expansion states after selection change
setTimeout(() => {
  expansionStates.forEach((wasExpanded, containerId) => {
    const container = figma.getNodeById(containerId);
    if (container && 'expanded' in container) {
      (container as any).expanded = wasExpanded;
    }
  });
}, 0);
```

## **Figma Layer Expansion API**

### **Available Properties:**
- **`node.expanded`**: Boolean property controlling layer panel expansion
- **Supported Types**: FrameNode, GroupNode, SectionNode, ComponentNode, ComponentSetNode, InstanceNode

### **Built-in Figma Behavior:**
- **Auto-expansion**: Figma automatically expands containers when child layers are selected
- **Selection-triggered**: The expansion happens during selection change, not viewport scrolling
- **API Control**: The `expanded` property allows programmatic control

## **New Behavior**

### **Next/Prev Navigation Now:**
1. **Selects sibling layer** (same as before)
2. **Scrolls viewport** to show selected layer (NEW - matches Tab/Shift+Tab)
3. **Preserves expansion states** (NEW - prevents unwanted auto-expansion)
4. **Records in history** (same as before)

### **Alignment with Native Figma:**
- **Viewport scrolling**: Matches Tab/Shift+Tab behavior
- **No unwanted expansion**: Preserves user's layer panel organization
- **Visual feedback**: User can see where they navigated to
- **Consistent UX**: Behaves like native Figma keyboard shortcuts

## **Technical Implementation**

### **Expansion State Management:**
```typescript
// 1. Find all expandable containers
const allContainers = figma.currentPage.findAll(node => 
  'expanded' in node && typeof (node as any).expanded === 'boolean'
);

// 2. Store current states
allContainers.forEach(container => {
  expansionStates.set(container.id, (container as any).expanded);
});

// 3. Restore after selection change
setTimeout(() => {
  expansionStates.forEach((wasExpanded, containerId) => {
    const container = figma.getNodeById(containerId);
    if (container && 'expanded' in container) {
      (container as any).expanded = wasExpanded;
    }
  });
}, 0);
```

### **Viewport Behavior:**
- **Sibling navigation**: Always scrolls to show selected layer
- **Enter navigation**: Scrolls to first child only
- **Other actions**: Normal viewport behavior

## **Benefits**

### ✅ **Matches Native Behavior**
- **Tab/Shift+Tab alignment**: Navigation feels like native Figma shortcuts
- **Visual feedback**: User can see where they navigated
- **Consistent UX**: No surprising differences from expected behavior

### ✅ **Preserves User Intent**
- **No unwanted expansion**: Layer panel organization stays intact
- **Controlled expansion**: Only expands when user explicitly requests it
- **Predictable behavior**: Navigation doesn't change layer panel state

### ✅ **Better Usability**
- **Visual confirmation**: User sees the selected layer
- **Spatial awareness**: Maintains context of where they are
- **Smooth navigation**: Viewport smoothly follows navigation

## **Edge Cases Handled**

### **Performance:**
- **Efficient state capture**: Only captures states for sibling navigation
- **Minimal overhead**: Uses setTimeout for non-blocking restoration
- **Selective restoration**: Only restores containers that exist

### **Error Handling:**
- **Missing containers**: Gracefully handles deleted containers
- **Invalid states**: Type checking for expanded property
- **Async safety**: Uses setTimeout to avoid race conditions

### **Compatibility:**
- **All container types**: Supports all Figma container node types
- **Backward compatibility**: Doesn't break existing functionality
- **Future-proof**: Uses Figma's official expanded property

This implementation provides the expected Tab/Shift+Tab behavior while respecting the user's layer panel organization preferences.