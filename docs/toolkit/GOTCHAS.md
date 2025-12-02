# Penpot MCP Gotchas & Learnings ⚠️

**Critical lessons learned from real-world usage**

---

## 🔴 Z-Order: appendChild Adds to FRONT, Not Back

**The Problem:** When you use `board.appendChild(shape)`, the shape is added to index 0 of the children array, NOT the end.

**Penpot's Z-Order Rule:** **Higher index = rendered ON TOP**

```javascript
// ❌ WRONG assumption: "I'll add background first, then foreground"
const bg = penpot.createRectangle();
bg.fills = [{ fillColor: '#1a1a1a' }];
board.appendChild(bg);  // Goes to index 0

const circle = penpot.createRectangle();
circle.fills = [{ fillColor: '#ff0000' }];
board.appendChild(circle);  // Goes to index 0, pushes bg to index 1

// Result: bg (index 1) renders ON TOP of circle (index 0) - circle is hidden!
```

**Solution 1:** Add elements in REVERSE order (foreground first, background last):
```javascript
// ✅ Add foreground elements FIRST
const circle = penpot.createRectangle();
board.appendChild(circle);  // index 0

// Then add background LAST (will have higher index = behind? NO!)
// This still doesn't work because appendChild always adds to index 0
```

**Solution 2:** Use the board's own fill as the background:
```javascript
// ✅ BEST: Use board fill instead of separate background rectangle
const board = penpot.createBoard();
board.fills = [{ fillColor: '#1a1a1a' }];  // Board itself is the background

// Now just add foreground elements - they'll all render on top of board fill
const circle = penpot.createRectangle();
circle.fills = [{ fillColor: '#ff0000' }];
board.appendChild(circle);  // Renders ON TOP of board fill ✓
```

---

## 🔴 Nested Backgrounds Cover Child Elements

**The Problem:** If you create a background rectangle INSIDE a board, it will cover elements added after it.

```javascript
// ❌ This will hide the colors!
const board = penpot.createBoard();
board.fills = [{ fillColor: '#1e1e1e' }];

// Adding a "container" background inside
const gridBg = penpot.createRectangle();
gridBg.resize(200, 100);
gridBg.fills = [{ fillColor: '#1a1a1a' }];
board.appendChild(gridBg);  // index 0

// Colors get lower indices, render BEHIND gridBg
const redDot = penpot.createRectangle();
redDot.fills = [{ fillColor: '#ff0000' }];
board.appendChild(redDot);  // index 0, gridBg pushed to index 1
// gridBg (index 1) covers redDot (index 0)!
```

**Solution:** Use nested boards instead of rectangles for containers:
```javascript
// ✅ Use a nested board - its fill becomes the background
const container = penpot.createBoard();
container.fills = [{ fillColor: '#1a1a1a' }];  // Background via fill
container.borderRadius = 6;
board.appendChild(container);

// Add children to the nested board - they render on top of its fill
const redDot = penpot.createRectangle();
container.appendChild(redDot);  // Renders on top of container's fill ✓
```

---

## 🔴 SVG Import Not Supported

**The Problem:** `mcp_penpot_import_image` only supports pixel formats (PNG, JPEG, GIF, WEBP), NOT SVG.

```javascript
// ❌ This will NOT work
await mcp_penpot_import_image({
  filePath: "/path/to/icon.svg"  // Fails - SVG not supported
});
```

**Solutions:**
1. **Manual drop:** Ask user to manually drag SVG files into Penpot
2. **Create placeholders:** Build button containers with names, user drops icons in
3. **Use CSS shapes:** `mcp_penpot_create_shape_from_css` for simple shapes
4. **Draw with paths:** Use `penpot.createPath()` for vector shapes (complex)

```javascript
// ✅ Create named placeholder for user to drop icon into
const iconBtn = penpot.createRectangle();
iconBtn.name = 'btn-settings';  // User finds this in layers panel
iconBtn.resize(24, 24);
iconBtn.fills = [{ fillColor: '#2a2a2a' }];
iconBtn.borderRadius = 4;
// Tell user: "Drop ICO-settings.svg into the 'btn-settings' layer"
```

---

## 🔴 Circles: Use borderRadius, Not Ellipses

**The Problem:** Ellipses inside boards sometimes have rendering issues in exports.

```javascript
// ⚠️ May have rendering issues in some contexts
const circle = penpot.createEllipse();
circle.resize(36, 36);
board.appendChild(circle);
```

**Solution:** Use rectangles with borderRadius = half the size:
```javascript
// ✅ More reliable circle rendering
const circle = penpot.createRectangle();
circle.resize(36, 36);
circle.borderRadius = 18;  // Half of 36 = perfect circle
circle.fills = [{ fillColor: '#ff0000' }];
board.appendChild(circle);
```

---

## 🔴 Export Debugging Checklist

When shapes don't appear in exports:

1. **Check Z-order:** Are children indices correct?
   ```javascript
   const children = board.children;
   children.forEach((c, i) => console.log(i, c.name, c.fills?.[0]?.fillColor));
   // Higher index = front, lower index = back
   ```

2. **Check bounds:** Is shape within parent bounds?
   ```javascript
   // Shape must be within board's x, y, width, height
   const inBounds = shape.x >= board.x && 
                    shape.x + shape.width <= board.x + board.width;
   ```

3. **Check for covering elements:** Is a background rectangle on top?
   ```javascript
   // Find background rect that might be covering
   const bgRect = children.find(c => 
     c.fills?.[0]?.fillColor === '#1a1a1a' && c.type === 'rectangle'
   );
   console.log('BG index:', children.indexOf(bgRect));
   // If bgRect has higher index than your shape, it's covering it
   ```

4. **Check visibility:**
   ```javascript
   console.log('visible:', shape.visible, 'hidden:', shape.hidden, 'opacity:', shape.opacity);
   ```

---

## 🟡 Best Practices for Building UIs

### Start Small
```javascript
// ✅ Build and test small components first
const swatch = penpot.createBoard();
swatch.resize(200, 100);
swatch.fills = [{ fillColor: '#1a1a1a' }];

// Add just the essential elements
const dot = penpot.createRectangle();
dot.fills = [{ fillColor: '#ff0000' }];
swatch.appendChild(dot);

// Export and verify before building more
```

### Use Board Fills for Backgrounds
```javascript
// ✅ Let the board's fill be the background
const section = penpot.createBoard();
section.fills = [{ fillColor: '#1a1a1a' }];  // Background
section.borderRadius = 6;

// All children render on top automatically
```

### Name Your Layers
```javascript
// ✅ Name everything for easy debugging and icon placement
button.name = 'btn-settings';
container.name = 'TagGrid';
circle.name = 'Color-Red';
```

### Test Exports Frequently
```javascript
// ✅ Export after each major addition to catch issues early
await mcp_penpot_export_shape({ shapeId: board.id, format: 'png' });
```

---

## 📋 Quick Reference: Z-Order

| Action | Result |
|--------|--------|
| `board.appendChild(shape)` | Shape goes to index 0 (BACK) |
| Higher index in children array | Rendered ON TOP (FRONT) |
| First element added | Ends up at highest index (FRONT) |
| Last element added | Ends up at index 0 (BACK) |
| Board's own `fills` property | Always behind all children |

---

## 📋 Quick Reference: Working Solutions

| Problem | Solution |
|---------|----------|
| Background covering foreground | Use board's `fills` instead of rectangle |
| Need nested container with bg | Use nested board with `fills` |
| Circles not rendering | Use rectangle with `borderRadius = size/2` |
| Need SVG icons | Create placeholders, user drops manually |
| Shapes not in export | Check z-order indices, bounds, visibility |

---

**Remember:** When in doubt, use a board's `fills` for backgrounds and build small testable components first!

