# Updated Multiple Selection Behavior

## **New Behavior (Swapped):**

### **Example:**
```
Siblings: [A, B, C, D, E, F]
Selected: [C, D, E] (multiple selection)

Next → Selects C (focuses on FIRST item in selection)
Prev → Selects E (focuses on LAST item in selection)
```

## **Logic Change:**

### **Before:**
```typescript
if (direction === 'next') {
  targetIndex = selectedIndices[selectedIndices.length - 1]; // Last item
} else {
  targetIndex = selectedIndices[0]; // First item
}
```

### **After:**
```typescript
if (direction === 'next') {
  targetIndex = selectedIndices[0]; // First item (SWAPPED)
} else {
  targetIndex = selectedIndices[selectedIndices.length - 1]; // Last item (SWAPPED)
}
```

## **Updated Behavior Examples:**

### **Sequential Selection:**
```
Layers: [Header, Logo, Text, Button, Footer]
Selected: [Logo, Text, Button]

Next → Selects Logo (first in selection)
Prev → Selects Button (last in selection)
```

### **Non-Sequential Selection:**
```
Layers: [A, B, C, D, E, F, G]
Selected: [B, D, F] (non-sequential)

Next → Selects B (first selected)
Prev → Selects F (last selected)
```

### **Visual Flow:**
```
Selection: [C, D, E]
           ↑     ↑
         Next   Prev
        goes   goes
        here   here
```

## **Rationale:**

This behavior might feel more intuitive because:
- **Next** = "Go to the beginning/start" of the selection
- **Prev** = "Go to the end/finish" of the selection

Or it could align with a specific workflow pattern you prefer for focus management within multiple selections.

## **Complete Navigation Summary:**

### **No Selection (Page Mode):**
- **Next**: Navigate to next page
- **Prev**: Navigate to previous page

### **Single Selection (Layer Mode):**
- **Next**: Navigate to next sibling layer
- **Prev**: Navigate to previous sibling layer

### **Multiple Selection (Focus Mode):**
- **Next**: Focus on first item in selection
- **Prev**: Focus on last item in selection

### **All Modes:**
- **Enter**: Enter container (select all children)
- **Exit**: Exit to parent container
- **Collapse**: Toggle container expansion (only button that changes expansion)

The navigation now provides consistent, predictable behavior across all selection states while preserving layer panel organization!