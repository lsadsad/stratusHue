# Penpot MCP Quick Reference 🚀

**One-page reference for common operations**

---

## 🔌 Connection

```javascript
// Test connection
await mcp_penpot_execute_code({
  code: "return { connected: true, file: penpot.currentFile?.name }"
});
```

**Servers:**
- MCP HTTP: `http://localhost:4401/mcp`
- MCP SSE: `http://localhost:4401/sse`
- WebSocket: `ws://localhost:4402`
- Plugin: `http://localhost:4400/manifest.json`

---

## 🛠️ Available MCP Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `mcp_penpot_execute_code` | Run any JS code | `{ code: "return penpot.selection" }` |
| `mcp_penpot_penpot_api_info` | Get API docs | `{ type: "Rectangle" }` |
| `mcp_penpot_export_shape` | Export PNG/SVG | `{ shapeId: "selection", format: "png" }` |
| `mcp_penpot_import_image` | Import image | `{ filePath: "/path/to/img.png" }` |
| `mcp_penpot_create_shape_from_css` | Create from CSS | `{ css: "width: 100px; background: red" }` |

---

## 📦 Core API Objects

```javascript
penpot.currentFile         // Current Penpot file
penpot.currentPage         // Active page
penpot.selection           // Selected shapes array
penpot.library.local       // Design system (colors, typography, components)
penpot.root                // Root shape
storage                    // Persistent storage across calls
```

---

## 🎨 Shape Creation

```javascript
// Rectangle
const rect = penpot.createRectangle();
rect.resize(100, 50);
rect.x = 100;
rect.y = 100;
rect.fills = [{ fillColor: "#3B82F6" }];
rect.borderRadius = 8;

// Ellipse/Circle
const circle = penpot.createEllipse();
circle.resize(50, 50);
circle.fills = [{ fillColor: "#EF4444" }];

// Text
const text = penpot.createText("Hello World");
text.fontSize = "16";
text.fontWeight = "600";
text.fills = [{ fillColor: "#000000" }];

// Board (Frame)
const board = penpot.createBoard();
board.resize(375, 812); // iPhone size

// Path
const path = penpot.createPath();
```

---

## 🔍 Querying & Selection

```javascript
// Get current selection
const selected = penpot.selection;

// Find all shapes
const all = penpot.currentPage.findShapes();

// Find by type
const rectangles = all.filter(s => s.type === 'rectangle');

// Find by name
const buttons = all.filter(s => s.name.includes('Button'));

// Find by ID
const shape = all.find(s => s.id === 'shape-id-here');

// Check if component
const isComponent = shape.isComponentInstance();
```

---

## 🎭 Shape Properties

```javascript
// Position & Size
shape.x = 100;
shape.y = 100;
shape.width = 200;
shape.height = 100;
shape.rotation = 45;
shape.resize(200, 100);

// Fills (Background)
shape.fills = [
  { fillColor: "#3B82F6" },
  { fillColor: "#8B5CF6", fillOpacity: 0.5 }
];

// Strokes (Borders)
shape.strokes = [{
  strokeColor: "#000000",
  strokeWidth: 2,
  strokeStyle: "solid", // or "dashed", "dotted"
  strokeAlignment: "inner" // or "center", "outer"
}];

// Effects
shape.opacity = 0.8;
shape.shadows = [{
  color: "#00000026",
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0
}];
shape.blurs = [{
  type: "layer-blur",
  value: 4
}];

// Border Radius (Rectangle only)
shape.borderRadius = 8;

// Name
shape.name = "My Shape";

// Hierarchy
shape.parent
shape.children
shape.appendChild(childShape)
```

---

## 📐 Operations

```javascript
// Group shapes
const group = penpot.group([shape1, shape2, shape3]);

// Ungroup
penpot.ungroup(group);

// Clone
const clone = shape.clone();

// Remove
shape.remove();

// Rotate
shape.rotate(45); // degrees
shape.rotate(45, { x: 100, y: 100 }); // around point

// Align
penpot.alignHorizontal([shape1, shape2], "center"); // or "left", "right"
penpot.alignVertical([shape1, shape2], "center");   // or "top", "bottom"

// Distribute
penpot.distributeHorizontal([shape1, shape2, shape3]);
penpot.distributeVertical([shape1, shape2, shape3]);
```

---

## 🧩 Components

```javascript
// Create component
const component = penpot.library.local.createComponent([shape]);

// Get all components
const components = penpot.library.local.components;

// Check if component
shape.isComponentInstance()      // Any instance
shape.isComponentMainInstance()  // Main instance
shape.isComponentCopyInstance()  // Copy instance
shape.isComponentRoot()          // Root of component tree

// Get component reference
const comp = shape.component();

// Find component instances
const instances = penpot.currentPage.findShapes()
  .filter(s => s.isComponentInstance());
```

---

## 🎨 Design System

```javascript
// Colors
const colors = penpot.library.local.colors;
colors.forEach(c => {
  console.log(c.name, c.color, c.id);
});

// Create color
const newColor = penpot.library.local.createColor();
newColor.name = "Primary Blue";
newColor.color = "#3B82F6";

// Typography
const typographies = penpot.library.local.typographies;
typographies.forEach(t => {
  console.log(t.name, t.fontFamily, t.fontSize);
});

// Create typography
const newTypo = penpot.library.local.createTypography();
newTypo.name = "Heading 1";
newTypo.fontFamily = "Inter";
newTypo.fontSize = "32";
newTypo.fontWeight = "700";

// Get all used colors
const usedColors = penpot.shapesColors(penpot.currentPage.findShapes());

// Replace color
penpot.replaceColor(
  penpot.currentPage.findShapes(),
  { color: "#FF0000" },
  { color: "#00FF00" }
);
```

---

## 💾 Storage

```javascript
// Store data (persists across execute_code calls)
storage.myData = { count: 0, items: [] };
storage.myFunction = function(x) { return x * 2; };

// Retrieve data
const data = storage.myData;
const result = storage.myFunction(5);

// Common pattern: Store for later use
storage.selectedIds = penpot.selection.map(s => s.id);

// Later call
const shapes = storage.selectedIds.map(id => 
  penpot.currentPage.findShapes().find(s => s.id === id)
);
```

---

## 📤 Code Generation

```javascript
// Generate CSS
const css = penpot.generateStyle(penpot.selection, {
  type: 'css',
  withPrelude: true,
  includeChildren: true
});

// Generate HTML
const html = penpot.generateMarkup(penpot.selection, {
  type: 'html' // or 'svg'
});

// Generate Font Faces
const fonts = await penpot.generateFontFaces(penpot.selection);
```

---

## 📁 Pages

```javascript
// Current page
const page = penpot.currentPage;

// All pages
const pages = penpot.currentFile.pages;

// Create page
const newPage = penpot.createPage();
newPage.name = "New Page";

// Open page
penpot.openPage(page);

// Page properties
page.name
page.id
page.findShapes()
```

---

## 🎯 Common Patterns

### Get Selection Info
```javascript
penpot.selection.map(s => ({
  id: s.id,
  name: s.name,
  type: s.type,
  x: s.x,
  y: s.y,
  width: s.width,
  height: s.height
}))
```

### Create Styled Button
```javascript
const bg = penpot.createRectangle();
bg.resize(120, 44);
bg.fills = [{ fillColor: "#3B82F6" }];
bg.borderRadius = 8;

const text = penpot.createText("Click");
text.x = bg.x + 40;
text.y = bg.y + 14;
text.fills = [{ fillColor: "#FFFFFF" }];

penpot.group([bg, text]);
```

### Find & Modify All
```javascript
const shapes = penpot.currentPage.findShapes();
shapes.forEach(shape => {
  if (shape.type === 'rectangle') {
    shape.borderRadius = 8;
  }
});
```

### Extract Design Tokens
```javascript
{
  colors: penpot.library.local.colors.map(c => ({
    name: c.name,
    value: c.color
  })),
  typography: penpot.library.local.typographies.map(t => ({
    name: t.name,
    font: t.fontFamily,
    size: t.fontSize,
    weight: t.fontWeight
  }))
}
```

### Create Grid
```javascript
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    const rect = penpot.createRectangle();
    rect.resize(100, 100);
    rect.x = col * 120;
    rect.y = row * 120;
    rect.fills = [{ fillColor: "#E5E7EB" }];
  }
}
```

---

## 🔧 Error Handling

```javascript
try {
  const shape = penpot.selection[0];
  if (!shape) {
    return { error: "No shape selected" };
  }
  
  // Operations...
  
  return { success: true, data: result };
} catch (error) {
  return { error: error.message };
}
```

---

## 🎨 CSS Properties → Penpot

| CSS Property | Penpot Equivalent |
|--------------|-------------------|
| `width` | `shape.resize(width, height)` |
| `height` | `shape.resize(width, height)` |
| `background-color` | `shape.fills = [{ fillColor: "#..." }]` |
| `border` | `shape.strokes = [{ strokeColor, strokeWidth }]` |
| `border-radius` | `shape.borderRadius = 8` |
| `opacity` | `shape.opacity = 0.8` |
| `box-shadow` | `shape.shadows = [{ ... }]` |
| `transform: rotate()` | `shape.rotate(angle)` |

---

## 📊 Shape Types

- `rectangle` - Rectangle/Box
- `ellipse` - Circle/Ellipse  
- `text` - Text
- `path` - Vector path
- `board` - Frame/Artboard
- `group` - Group of shapes
- `bool` - Boolean operation
- `svg-raw` - Raw SVG

---

## ⚡ Performance Tips

✅ **Batch operations**
```javascript
// Good
shapes.forEach(s => s.fills = [{ fillColor: "#FF0000" }]);

// Bad
for (let shape of shapes) {
  await mcp_penpot_execute_code({ 
    code: `shape.fills = [{ fillColor: "#FF0000" }]` 
  });
}
```

✅ **Use storage for multi-step ops**
```javascript
// Step 1
storage.shapes = penpot.selection.map(s => s.id);

// Step 2 (later call)
const shapes = storage.shapes.map(id => ...);
```

✅ **Return only what you need**
```javascript
// Instead of returning entire shape
return { id: shape.id, name: shape.name };
```

---

## 🐛 Debugging

```javascript
// Log to browser console (visible in Penpot's dev tools)
console.log("Debug info:", shape);

// Return debug data
return {
  debug: {
    selection: penpot.selection.length,
    page: penpot.currentPage?.name,
    storage: Object.keys(storage)
  }
};
```

---

## 📚 More Resources

- **Full Guide**: `PENPOT_MCP_TOOLKIT.md`
- **Examples**: `examples.js`
- **Setup**: `integration-template.md`
- **API Docs**: Use `mcp_penpot_penpot_api_info` tool

---

## ⚠️ Critical Gotchas (READ FIRST!)

| Gotcha | What Happens | Solution |
|--------|--------------|----------|
| **Z-Order Reversed** | `appendChild` adds to index 0 (BACK), higher index = FRONT | Use board's `fills` for backgrounds, not separate rectangles |
| **BG Covers Foreground** | Background rectangle inside board covers children | Use board's own `fills` property as background |
| **SVG Import Fails** | `import_image` only supports PNG/JPEG/GIF/WEBP | Create placeholders, user drops SVGs manually |
| **Ellipses Don't Render** | Ellipses in boards may not export properly | Use rectangles with `borderRadius = size/2` |

```javascript
// ✅ CORRECT: Board fill as background, shapes on top
const board = penpot.createBoard();
board.fills = [{ fillColor: '#1a1a1a' }];  // Background
const circle = penpot.createRectangle();
circle.borderRadius = 18;  // Circle via borderRadius
board.appendChild(circle);  // Renders on top ✓

// ❌ WRONG: Separate bg rectangle covers children
const bgRect = penpot.createRectangle();
board.appendChild(bgRect);  // index 0
const circle = penpot.createRectangle();
board.appendChild(circle);  // index 0, bgRect→index 1 (covers circle!)
```

**Full details:** See `GOTCHAS.md`

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Plugin not connected" | Load plugin, click "Connect to MCP server" |
| Timeout | Break operation into smaller chunks |
| Shape not found | Check if shape exists with `findShapes()` |
| Property error | Verify property exists for shape type |
| Code fails silently | Check browser console for errors |
| Shapes not in export | Check z-order indices (higher = front) |
| Colors hidden | Background rect covering them - use board fills |

---

## 📚 More Resources

- **Full Guide**: `PENPOT_MCP_TOOLKIT.md`
- **Examples**: `examples.js`
- **Setup**: `integration-template.md`
- **Gotchas**: `GOTCHAS.md` ⚠️
- **API Docs**: Use `mcp_penpot_penpot_api_info` tool

---

**Print this page for quick reference! 📄**

