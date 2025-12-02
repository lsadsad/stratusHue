/**
 * Penpot MCP Code Examples
 * Ready-to-use code snippets for common operations
 * 
 * Usage: Copy these examples into mcp_penpot_execute_code calls
 */

// ============================================================================
// SELECTION & QUERYING
// ============================================================================

/**
 * Get information about currently selected shapes
 */
const getSelectionInfo = `
return penpot.selection.map(shape => ({
  id: shape.id,
  name: shape.name,
  type: shape.type,
  x: shape.x,
  y: shape.y,
  width: shape.width,
  height: shape.height,
  fills: shape.fills?.map(f => f.fillColor),
  isComponent: shape.isComponentInstance()
}));
`;

/**
 * Find all shapes of a specific type
 */
const findShapesByType = `
const shapeType = 'rectangle'; // or 'ellipse', 'text', 'board', etc.
const shapes = penpot.currentPage.findShapes();
return shapes
  .filter(s => s.type === shapeType)
  .map(s => ({ id: s.id, name: s.name, type: s.type }));
`;

/**
 * Find shapes by name pattern
 */
const findShapesByName = `
const pattern = 'Button'; // partial match
const shapes = penpot.currentPage.findShapes();
return shapes
  .filter(s => s.name.includes(pattern))
  .map(s => ({ id: s.id, name: s.name }));
`;

/**
 * Get page structure
 */
const getPageStructure = `
return {
  fileName: penpot.currentFile?.name,
  currentPage: penpot.currentPage?.name,
  totalPages: penpot.currentFile?.pages.length,
  pages: penpot.currentFile?.pages.map(p => ({
    id: p.id,
    name: p.name
  }))
};
`;

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

/**
 * Extract all design tokens
 */
const extractDesignTokens = `
const lib = penpot.library.local;

return {
  colors: lib.colors.map(c => ({
    name: c.name,
    color: c.color,
    opacity: c.opacity,
    id: c.id
  })),
  typography: lib.typographies.map(t => ({
    name: t.name,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    fontStyle: t.fontStyle,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    id: t.id
  })),
  components: lib.components.map(c => ({
    name: c.name,
    id: c.id,
    path: c.path
  }))
};
`;

/**
 * Get color palette from current page
 */
const getColorPalette = `
const shapes = penpot.currentPage.findShapes();
const colors = new Set();

shapes.forEach(shape => {
  shape.fills?.forEach(fill => {
    if (fill.fillColor) colors.add(fill.fillColor);
  });
  shape.strokes?.forEach(stroke => {
    if (stroke.strokeColor) colors.add(stroke.strokeColor);
  });
});

return Array.from(colors).sort();
`;

/**
 * Get all component names
 */
const getComponentNames = `
return penpot.library.local.components.map(c => ({
  name: c.name,
  path: c.path,
  id: c.id
}));
`;

// ============================================================================
// SHAPE CREATION
// ============================================================================

/**
 * Create a styled button
 */
const createButton = `
// Create background
const bg = penpot.createRectangle();
bg.name = 'Button Background';
bg.resize(120, 44);
bg.x = 100;
bg.y = 100;
bg.fills = [{ fillColor: '#3B82F6' }];
bg.borderRadius = 8;

// Create text
const text = penpot.createText('Click Me');
text.name = 'Button Label';
text.x = bg.x + 30;
text.y = bg.y + 14;
text.fills = [{ fillColor: '#FFFFFF' }];
text.fontSize = '16';
text.fontWeight = '600';

// Group them
const button = penpot.group([bg, text]);
button.name = 'Button';

return { 
  buttonId: button.id,
  x: button.x,
  y: button.y 
};
`;

/**
 * Create a card component
 */
const createCard = `
// Card background
const card = penpot.createRectangle();
card.name = 'Card';
card.resize(300, 200);
card.x = 100;
card.y = 100;
card.fills = [{ fillColor: '#FFFFFF' }];
card.borderRadius = 12;
card.shadows = [{
  color: '#00000026',
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0
}];

// Title
const title = penpot.createText('Card Title');
title.name = 'Title';
title.x = card.x + 20;
title.y = card.y + 20;
title.fontSize = '20';
title.fontWeight = '700';

// Description
const desc = penpot.createText('Card description text goes here');
desc.name = 'Description';
desc.x = card.x + 20;
desc.y = card.y + 50;
desc.fontSize = '14';
desc.fills = [{ fillColor: '#6B7280' }];

// Group
card.appendChild(title);
card.appendChild(desc);

return { cardId: card.id };
`;

/**
 * Create an icon set
 */
const createIconSet = `
const icons = [];
const size = 24;
const gap = 40;
const startX = 100;
const startY = 100;
const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

colors.forEach((color, i) => {
  const icon = penpot.createEllipse();
  icon.resize(size, size);
  icon.x = startX + (i * (size + gap));
  icon.y = startY;
  icon.fills = [{ fillColor: color }];
  icon.name = \`Icon \${i + 1}\`;
  icons.push({ id: icon.id, color });
});

return { created: icons.length, icons };
`;

/**
 * Create a grid layout
 */
const createGrid = `
const config = {
  cols: 4,
  rows: 3,
  itemWidth: 100,
  itemHeight: 100,
  gap: 16,
  startX: 100,
  startY: 100
};

const items = [];

for (let row = 0; row < config.rows; row++) {
  for (let col = 0; col < config.cols; col++) {
    const rect = penpot.createRectangle();
    rect.resize(config.itemWidth, config.itemHeight);
    rect.x = config.startX + (col * (config.itemWidth + config.gap));
    rect.y = config.startY + (row * (config.itemHeight + config.gap));
    rect.fills = [{ fillColor: '#E5E7EB' }];
    rect.borderRadius = 8;
    rect.name = \`Grid Item \${row}-\${col}\`;
    items.push(rect);
  }
}

const grid = penpot.group(items);
grid.name = 'Grid Layout';

return { 
  gridId: grid.id,
  totalItems: items.length 
};
`;

// ============================================================================
// SHAPE MODIFICATION
// ============================================================================

/**
 * Apply theme colors to selection
 */
const applyThemeToSelection = `
const theme = {
  background: '#1F2937',
  text: '#FFFFFF',
  border: '#374151',
  accent: '#3B82F6'
};

const selected = penpot.selection;
let modified = 0;

selected.forEach(shape => {
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    shape.fills = [{ fillColor: theme.background }];
    shape.strokes = [{
      strokeColor: theme.border,
      strokeWidth: 1,
      strokeStyle: 'solid',
      strokeAlignment: 'inner'
    }];
    modified++;
  }
  
  if (shape.type === 'text') {
    shape.fills = [{ fillColor: theme.text }];
    modified++;
  }
});

return { modified, theme: 'dark' };
`;

/**
 * Resize all selected shapes proportionally
 */
const resizeSelection = `
const scaleFactor = 1.5; // 150% size
const selected = penpot.selection;

selected.forEach(shape => {
  const newWidth = shape.width * scaleFactor;
  const newHeight = shape.height * scaleFactor;
  shape.resize(newWidth, newHeight);
});

return { 
  resized: selected.length,
  scaleFactor 
};
`;

/**
 * Add rounded corners to selection
 */
const addRoundedCorners = `
const radius = 12;
const selected = penpot.selection;
let modified = 0;

selected.forEach(shape => {
  if ('borderRadius' in shape) {
    shape.borderRadius = radius;
    modified++;
  }
});

return { modified, radius };
`;

/**
 * Distribute shapes horizontally
 */
const distributeHorizontally = `
const selected = penpot.selection;

if (selected.length < 2) {
  return { error: 'Select at least 2 shapes' };
}

penpot.distributeHorizontal(selected);
return { distributed: selected.length };
`;

/**
 * Align shapes to center
 */
const alignToCenter = `
const selected = penpot.selection;

if (selected.length < 2) {
  return { error: 'Select at least 2 shapes' };
}

penpot.alignHorizontal(selected, 'center');
penpot.alignVertical(selected, 'center');

return { aligned: selected.length };
`;

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Create component from selection
 */
const createComponentFromSelection = `
const selected = penpot.selection;

if (selected.length === 0) {
  return { error: 'No shapes selected' };
}

// Group if multiple shapes
let shapes = selected;
if (selected.length > 1) {
  const group = penpot.group(selected);
  shapes = [group];
}

// Create component
const component = penpot.library.local.createComponent(shapes);

return {
  componentId: component.id,
  componentName: component.name,
  shapesCount: selected.length
};
`;

/**
 * Find all component instances
 */
const findComponentInstances = `
const allShapes = penpot.currentPage.findShapes();
const instances = allShapes.filter(s => s.isComponentInstance());

return instances.map(inst => {
  const comp = inst.component();
  return {
    shapeId: inst.id,
    shapeName: inst.name,
    componentName: comp?.name,
    componentId: comp?.id,
    isMain: inst.isComponentMainInstance(),
    x: inst.x,
    y: inst.y
  };
});
`;

/**
 * Update all instances of a component
 */
const updateComponentInstances = `
const componentName = 'Button/Primary'; // Replace with your component
const allShapes = penpot.currentPage.findShapes();

const instances = allShapes.filter(shape => {
  if (!shape.isComponentInstance()) return false;
  const comp = shape.component();
  return comp && comp.name === componentName;
});

// Modify all instances
instances.forEach(instance => {
  instance.opacity = 0.9;
  // Add more modifications as needed
});

return {
  componentName,
  instancesFound: instances.length,
  updated: instances.length
};
`;

/**
 * Create component variant
 */
const createComponentVariant = `
// Find original component
const componentName = 'Button';
const component = penpot.library.local.components
  .find(c => c.name === componentName);

if (!component) {
  return { error: \`Component '\${componentName}' not found\` };
}

// Clone the main instance
const original = component.mainInstance;
const variant = original.clone();
variant.name = \`\${componentName} Secondary\`;
variant.x = original.x + original.width + 50;

// Modify the variant
if (variant.fills) {
  variant.fills = [{ fillColor: '#8B5CF6' }]; // Different color
}

// Create new component from variant
const newComponent = penpot.library.local.createComponent([variant]);

return {
  originalComponent: component.name,
  newComponent: newComponent.name,
  variantId: variant.id
};
`;

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Generate CSS from selection
 */
const generateCssFromSelection = `
const selected = penpot.selection;

if (selected.length === 0) {
  return { error: 'No shapes selected' };
}

const css = penpot.generateStyle(selected, {
  type: 'css',
  withPrelude: true,
  includeChildren: true
});

return { css };
`;

/**
 * Generate HTML markup from selection
 */
const generateHtmlFromSelection = `
const selected = penpot.selection;

if (selected.length === 0) {
  return { error: 'No shapes selected' };
}

const html = penpot.generateMarkup(selected, {
  type: 'html'
});

return { html };
`;

/**
 * Export shape data as JSON
 */
const exportShapeData = `
const shape = penpot.selection[0];

if (!shape) {
  return { error: 'No shape selected' };
}

return {
  id: shape.id,
  name: shape.name,
  type: shape.type,
  geometry: {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation
  },
  style: {
    fills: shape.fills,
    strokes: shape.strokes,
    opacity: shape.opacity,
    shadows: shape.shadows,
    blurs: shape.blurs
  },
  hierarchy: {
    parent: shape.parent?.name,
    childrenCount: shape.children?.length || 0,
    children: shape.children?.map(c => ({ id: c.id, name: c.name }))
  }
};
`;

/**
 * Get component usage statistics
 */
const getComponentStats = `
const allShapes = penpot.currentPage.findShapes();
const components = penpot.library.local.components;

const stats = components.map(comp => {
  const instances = allShapes.filter(shape => {
    if (!shape.isComponentInstance()) return false;
    const c = shape.component();
    return c && c.id === comp.id;
  });
  
  return {
    name: comp.name,
    id: comp.id,
    instanceCount: instances.length,
    locations: instances.map(i => ({ 
      x: i.x, 
      y: i.y, 
      name: i.name 
    }))
  };
});

return {
  totalComponents: components.length,
  stats
};
`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Store design tokens in storage
 */
const storeDesignTokens = `
const lib = penpot.library.local;

storage.designTokens = {
  colors: Object.fromEntries(
    lib.colors.map(c => [
      c.name.replace(/\\s+/g, '-').toLowerCase(),
      c.color
    ])
  ),
  typography: Object.fromEntries(
    lib.typographies.map(t => [
      t.name.replace(/\\s+/g, '-').toLowerCase(),
      {
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        lineHeight: t.lineHeight
      }
    ])
  )
};

return storage.designTokens;
`;

/**
 * Create reusable style function
 */
const createStyleFunction = `
// Store a reusable function in storage
storage.applyPrimaryButton = function(shape) {
  shape.fills = [{ fillColor: '#3B82F6' }];
  shape.borderRadius = 8;
  shape.resize(120, 44);
  return shape;
};

// Test it
const rect = penpot.createRectangle();
storage.applyPrimaryButton(rect);
rect.name = 'Primary Button';

return { 
  message: 'Function stored in storage.applyPrimaryButton',
  testId: rect.id 
};
`;

/**
 * Batch create from array
 */
const batchCreateFromArray = `
const buttonData = [
  { label: 'Save', color: '#10B981', x: 100 },
  { label: 'Cancel', color: '#EF4444', x: 240 },
  { label: 'Reset', color: '#F59E0B', x: 380 }
];

const created = buttonData.map(data => {
  const rect = penpot.createRectangle();
  rect.resize(120, 44);
  rect.x = data.x;
  rect.y = 100;
  rect.fills = [{ fillColor: data.color }];
  rect.borderRadius = 8;
  rect.name = \`Button: \${data.label}\`;
  
  const text = penpot.createText(data.label);
  text.x = rect.x + 35;
  text.y = rect.y + 14;
  text.fills = [{ fillColor: '#FFFFFF' }];
  text.fontWeight = '600';
  
  return { id: rect.id, label: data.label };
});

return { created: created.length, buttons: created };
`;

// ============================================================================
// VALIDATION & TESTING
// ============================================================================

/**
 * Validate design system compliance
 */
const validateDesignSystem = `
const rules = {
  minTouchTarget: 44, // Accessibility
  allowedColors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
  maxTextSize: 72,
  minTextSize: 12
};

const selected = penpot.selection;
const issues = [];

selected.forEach(shape => {
  // Check touch target size
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    if (shape.width < rules.minTouchTarget || shape.height < rules.minTouchTarget) {
      issues.push({
        shape: shape.name,
        issue: 'Too small for touch target',
        size: { w: shape.width, h: shape.height }
      });
    }
  }
  
  // Check colors
  shape.fills?.forEach(fill => {
    if (fill.fillColor && !rules.allowedColors.includes(fill.fillColor)) {
      issues.push({
        shape: shape.name,
        issue: 'Color not in design system',
        color: fill.fillColor
      });
    }
  });
  
  // Check text size
  if (shape.type === 'text') {
    const size = parseInt(shape.fontSize);
    if (size < rules.minTextSize || size > rules.maxTextSize) {
      issues.push({
        shape: shape.name,
        issue: 'Font size out of range',
        fontSize: size
      });
    }
  }
});

return {
  validated: selected.length,
  issuesFound: issues.length,
  issues
};
`;

/**
 * Find unused components
 */
const findUnusedComponents = `
const components = penpot.library.local.components;
const allShapes = penpot.currentPage.findShapes();

const unused = components.filter(comp => {
  const hasInstance = allShapes.some(shape => {
    if (!shape.isComponentInstance()) return false;
    const c = shape.component();
    return c && c.id === comp.id;
  });
  return !hasInstance;
});

return {
  totalComponents: components.length,
  unusedCount: unused.length,
  unused: unused.map(c => ({ name: c.name, id: c.id }))
};
`;

// ============================================================================
// UI BUILDING (Correct Z-Order Patterns)
// ============================================================================

/**
 * Create a container with background - CORRECT way
 * Uses board's fills property instead of separate rectangle
 */
const createContainerCorrect = `
// ✅ CORRECT: Board fill as background
const container = penpot.createBoard();
container.name = 'Container';
container.resize(200, 150);
container.x = 100;
container.y = 100;
container.fills = [{ fillColor: '#1a1a1a' }];  // Background via board fill
container.borderRadius = 8;

// Children render ON TOP of the board's fill automatically
const title = penpot.createText('Title');
title.x = container.x + 16;
title.y = container.y + 12;
title.fills = [{ fillColor: '#ffffff' }];
title.fontSize = '14';
title.fontWeight = '600';
container.appendChild(title);

// Color dots render correctly
const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
colors.forEach((color, i) => {
  const dot = penpot.createRectangle();
  dot.resize(32, 32);
  dot.x = container.x + 16 + (i * 44);
  dot.y = container.y + 40;
  dot.fills = [{ fillColor: color }];
  dot.borderRadius = 16;  // Use borderRadius for circles, not ellipse
  container.appendChild(dot);
});

return { containerId: container.id };
`;

/**
 * Create a container with background - WRONG way (for reference)
 * Shows what NOT to do
 */
const createContainerWrong = `
// ❌ WRONG: Separate background rectangle covers children
const container = penpot.createBoard();
container.resize(200, 150);
container.fills = [{ fillColor: 'transparent' }];  // Transparent board

// Adding a background rectangle INSIDE
const bgRect = penpot.createRectangle();
bgRect.resize(200, 150);
bgRect.fills = [{ fillColor: '#1a1a1a' }];
container.appendChild(bgRect);  // Goes to index 0

// This dot will be BEHIND bgRect because appendChild adds to index 0
// bgRect gets pushed to index 1 (higher = front = covers the dot!)
const dot = penpot.createRectangle();
dot.resize(32, 32);
dot.fills = [{ fillColor: '#ff0000' }];
container.appendChild(dot);  // Goes to index 0, bgRect at index 1

// Result: bgRect covers dot - dot is invisible!
return { warning: 'Dot is hidden behind bgRect!' };
`;

/**
 * Create reliable circles using rectangles with borderRadius
 */
const createCircles = `
// ✅ Use rectangles with borderRadius for reliable circle rendering
const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
const circles = [];

colors.forEach((color, i) => {
  const circle = penpot.createRectangle();  // Rectangle, not Ellipse
  circle.resize(36, 36);
  circle.x = 100 + (i * 50);
  circle.y = 100;
  circle.fills = [{ fillColor: color }];
  circle.borderRadius = 18;  // Half of size = perfect circle
  circle.name = \`Circle-\${i}\`;
  circles.push({ id: circle.id, color });
});

return { created: circles.length, circles };
`;

/**
 * Debug z-order issues
 */
const debugZOrder = `
const shape = penpot.selection[0];
if (!shape) return { error: 'Select a shape' };

// Check if shape is a board/group with children
const children = shape.children || [];

return {
  shapeName: shape.name,
  shapeType: shape.type,
  childCount: children.length,
  zOrder: children.map((c, i) => ({
    index: i,
    name: c.name,
    type: c.type,
    fill: c.fills?.[0]?.fillColor,
    // Higher index = rendered ON TOP (front)
    renderOrder: i === children.length - 1 ? 'FRONT' : i === 0 ? 'BACK' : 'middle'
  })),
  hint: 'Higher index = rendered on top. appendChild adds to index 0 (back).'
};
`;

/**
 * Create icon button placeholder for manual SVG drop
 */
const createIconButtonPlaceholder = `
// Create a named button container for user to drop SVG icon into
const btn = penpot.createRectangle();
btn.name = 'btn-settings';  // User finds this in layers panel
btn.resize(24, 24);
btn.x = 100;
btn.y = 100;
btn.fills = [{ fillColor: '#2a2a2a' }];
btn.borderRadius = 4;

return {
  buttonId: btn.id,
  buttonName: btn.name,
  instruction: 'Drop your 16x16 SVG icon into the "btn-settings" layer and center it'
};
`;

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

module.exports = {
  // Selection & Querying
  getSelectionInfo,
  findShapesByType,
  findShapesByName,
  getPageStructure,
  
  // Design System
  extractDesignTokens,
  getColorPalette,
  getComponentNames,
  
  // Shape Creation
  createButton,
  createCard,
  createIconSet,
  createGrid,
  
  // Shape Modification
  applyThemeToSelection,
  resizeSelection,
  addRoundedCorners,
  distributeHorizontally,
  alignToCenter,
  
  // Components
  createComponentFromSelection,
  findComponentInstances,
  updateComponentInstances,
  createComponentVariant,
  
  // Data Extraction
  generateCssFromSelection,
  generateHtmlFromSelection,
  exportShapeData,
  getComponentStats,
  
  // Utilities
  storeDesignTokens,
  createStyleFunction,
  batchCreateFromArray,
  
  // Validation
  validateDesignSystem,
  findUnusedComponents,
  
  // UI Building (Z-Order Patterns)
  createContainerCorrect,
  createContainerWrong,
  createCircles,
  debugZOrder,
  createIconButtonPlaceholder
};

