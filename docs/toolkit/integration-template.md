# Penpot MCP Integration Template

Copy this template into your project to quickly integrate Penpot MCP capabilities.

## Setup Checklist

```markdown
## Penpot MCP Integration

### Prerequisites
- [ ] Penpot MCP server running (ports 4401, 4402)
- [ ] Penpot open in browser
- [ ] Penpot MCP plugin loaded and connected
- [ ] MCP client configured

### Connection Details
- **WebSocket:** ws://localhost:4402
- **MCP HTTP:** http://localhost:4401/mcp
- **MCP SSE:** http://localhost:4401/sse

### Quick Test
Test the connection with:
```javascript
await mcp_penpot_execute_code({
  code: "return { connected: true, file: penpot.currentFile?.name }"
});
```
```

## Project-Specific Helpers

Create a `penpot-helpers.js` (or `.ts`) file in your project:

```javascript
/**
 * Penpot MCP Helper Functions for [YOUR PROJECT NAME]
 */

/**
 * Execute Penpot code with error handling
 */
async function executePenpotCode(code) {
  try {
    const result = await mcp_penpot_execute_code({ code });
    
    if (result.error) {
      console.error('Penpot execution error:', result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to execute Penpot code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current design tokens from Penpot
 */
async function getDesignTokens() {
  return executePenpotCode(`
    const lib = penpot.library.local;
    return {
      colors: lib.colors.map(c => ({
        name: c.name,
        value: c.color,
        id: c.id
      })),
      typography: lib.typographies.map(t => ({
        name: t.name,
        fontFamily: t.fontFamily,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        lineHeight: t.lineHeight
      }))
    };
  `);
}

/**
 * Create a shape from your app's data
 */
async function createShapeFromData(data) {
  const code = `
    const shape = penpot.createRectangle();
    shape.name = ${JSON.stringify(data.name)};
    shape.resize(${data.width || 100}, ${data.height || 100});
    shape.x = ${data.x || 0};
    shape.y = ${data.y || 0};
    
    if (${JSON.stringify(data.color)}) {
      shape.fills = [{ fillColor: ${JSON.stringify(data.color)} }];
    }
    
    return { id: shape.id, name: shape.name };
  `;
  
  return executePenpotCode(code);
}

/**
 * Get currently selected shapes
 */
async function getSelection() {
  return executePenpotCode(`
    return penpot.selection.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height
    }));
  `);
}

/**
 * Export selection as image
 */
async function exportSelectionAsImage(outputPath) {
  try {
    await mcp_penpot_export_shape({
      shapeId: 'selection',
      format: 'png',
      filePath: outputPath
    });
    return { success: true, path: outputPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync your app's component with Penpot
 */
async function syncComponentWithPenpot(componentName, properties) {
  const code = `
    // Find component instance
    const shapes = penpot.currentPage.findShapes();
    const shape = shapes.find(s => s.name === ${JSON.stringify(componentName)});
    
    if (!shape) {
      return { error: 'Component not found: ${componentName}' };
    }
    
    // Update properties
    ${properties.color ? `shape.fills = [{ fillColor: '${properties.color}' }];` : ''}
    ${properties.width ? `shape.resize(${properties.width}, shape.height);` : ''}
    ${properties.height ? `shape.resize(shape.width, ${properties.height});` : ''}
    ${properties.x !== undefined ? `shape.x = ${properties.x};` : ''}
    ${properties.y !== undefined ? `shape.y = ${properties.y};` : ''}
    
    return { success: true, updated: shape.name };
  `;
  
  return executePenpotCode(code);
}

/**
 * Validate design against your requirements
 */
async function validateDesign(rules) {
  const code = `
    const rules = ${JSON.stringify(rules)};
    const selected = penpot.selection;
    const issues = [];
    
    selected.forEach(shape => {
      // Check minimum size
      if (rules.minWidth && shape.width < rules.minWidth) {
        issues.push({ shape: shape.name, issue: 'Width too small', value: shape.width });
      }
      
      if (rules.minHeight && shape.height < rules.minHeight) {
        issues.push({ shape: shape.name, issue: 'Height too small', value: shape.height });
      }
      
      // Check allowed colors
      if (rules.allowedColors) {
        shape.fills?.forEach(fill => {
          if (fill.fillColor && !rules.allowedColors.includes(fill.fillColor)) {
            issues.push({ shape: shape.name, issue: 'Invalid color', value: fill.fillColor });
          }
        });
      }
    });
    
    return {
      validated: selected.length,
      passed: issues.length === 0,
      issues
    };
  `;
  
  return executePenpotCode(code);
}

// Export all helpers
module.exports = {
  executePenpotCode,
  getDesignTokens,
  createShapeFromData,
  getSelection,
  exportSelectionAsImage,
  syncComponentWithPenpot,
  validateDesign
};
```

## Usage Examples for Your Project

### Example 1: Sync Design System to Code

```javascript
const { getDesignTokens } = require('./penpot-helpers');

async function syncDesignSystem() {
  const result = await getDesignTokens();
  
  if (!result.success) {
    console.error('Failed to get design tokens:', result.error);
    return;
  }
  
  const { colors, typography } = result.data;
  
  // Generate CSS variables
  const cssVars = colors.map(c => 
    `--color-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.value};`
  ).join('\n');
  
  // Write to file
  fs.writeFileSync('./styles/design-tokens.css', `:root {\n${cssVars}\n}`);
  
  console.log('✅ Design tokens synced!');
}
```

### Example 2: Create Components from Data

```javascript
const { createShapeFromData } = require('./penpot-helpers');

async function visualizeData(dataItems) {
  for (const item of dataItems) {
    await createShapeFromData({
      name: item.label,
      width: item.value * 10, // Scale value to width
      height: 50,
      x: item.index * 120,
      y: 100,
      color: item.status === 'active' ? '#10B981' : '#6B7280'
    });
  }
  
  console.log('✅ Data visualized in Penpot!');
}
```

### Example 3: Validate Implementation Against Design

```javascript
const { validateDesign } = require('./penpot-helpers');

async function validateImplementation() {
  const rules = {
    minWidth: 44,  // Touch target minimum
    minHeight: 44,
    allowedColors: ['#3B82F6', '#10B981', '#EF4444'] // Brand colors
  };
  
  const result = await validateDesign(rules);
  
  if (result.data.passed) {
    console.log('✅ Design validation passed!');
  } else {
    console.warn('⚠️  Design issues found:');
    result.data.issues.forEach(issue => {
      console.log(`  - ${issue.shape}: ${issue.issue} (${issue.value})`);
    });
  }
}
```

### Example 4: Export for Documentation

```javascript
const { exportSelectionAsImage } = require('./penpot-helpers');

async function exportComponentScreenshots() {
  const components = ['Button', 'Card', 'Modal'];
  
  for (const component of components) {
    // Select component in Penpot first, then export
    await exportSelectionAsImage(`./docs/images/${component.toLowerCase()}.png`);
  }
  
  console.log('✅ Component screenshots exported!');
}
```

### Example 5: Two-Way Sync

```javascript
const { getSelection, syncComponentWithPenpot } = require('./penpot-helpers');

// Watch for design changes
async function watchDesignChanges() {
  setInterval(async () => {
    const selection = await getSelection();
    
    if (selection.data.length > 0) {
      const shape = selection.data[0];
      console.log(`Design changed: ${shape.name} at (${shape.x}, ${shape.y})`);
      
      // Sync to your app
      updateAppComponent(shape);
    }
  }, 5000);
}

// Push code changes to design
async function pushChangesToDesign(componentName, newProps) {
  await syncComponentWithPenpot(componentName, newProps);
  console.log(`✅ Pushed changes to Penpot: ${componentName}`);
}
```

## AI Assistant Instructions

Include this in your project's AI context:

```markdown
## Penpot Integration

This project uses Penpot MCP for design system integration.

### Available Operations
1. **Read design tokens**: Use `getDesignTokens()` from penpot-helpers.js
2. **Create shapes**: Use `createShapeFromData(data)` with shape properties
3. **Export designs**: Use `exportSelectionAsImage(path)`
4. **Validate designs**: Use `validateDesign(rules)`
5. **Sync components**: Use `syncComponentWithPenpot(name, props)`

### Important Notes
- Always check result.success before using result.data
- Penpot MCP server must be running (localhost:4401/4402)
- Penpot plugin must be connected
- Use `executePenpotCode(code)` for custom operations

### Common Tasks

**Get current design colors:**
```javascript
const tokens = await getDesignTokens();
const colors = tokens.data.colors;
```

**Create a visual element:**
```javascript
await createShapeFromData({
  name: 'My Shape',
  width: 100,
  height: 50,
  color: '#3B82F6'
});
```

**Validate selection:**
```javascript
await validateDesign({
  minWidth: 44,
  allowedColors: ['#3B82F6', '#10B981']
});
```

See `PENPOT_MCP_TOOLKIT.md` for comprehensive documentation.
```

## Configuration File

Create `.penpot-mcp.config.json` in your project:

```json
{
  "penpot": {
    "mcpServer": {
      "url": "http://localhost:4401/mcp",
      "websocket": "ws://localhost:4402"
    },
    "autoConnect": false,
    "timeout": 30000
  },
  "sync": {
    "designTokens": {
      "enabled": true,
      "outputPath": "./styles/design-tokens.css",
      "format": "css-variables"
    },
    "components": {
      "enabled": true,
      "watchForChanges": false
    }
  },
  "validation": {
    "rules": {
      "minTouchTarget": 44,
      "allowedColors": [
        "#3B82F6",
        "#8B5CF6",
        "#10B981",
        "#F59E0B",
        "#EF4444"
      ],
      "textSizeRange": [12, 72]
    }
  }
}
```

## Testing

Create a test file `penpot-integration.test.js`:

```javascript
const { executePenpotCode, getDesignTokens } = require('./penpot-helpers');

describe('Penpot MCP Integration', () => {
  test('should connect to Penpot', async () => {
    const result = await executePenpotCode('return { connected: true }');
    expect(result.success).toBe(true);
  });
  
  test('should get design tokens', async () => {
    const result = await getDesignTokens();
    expect(result.success).toBe(true);
    expect(result.data.colors).toBeDefined();
  });
  
  test('should create shape', async () => {
    const result = await executePenpotCode(`
      const rect = penpot.createRectangle();
      rect.resize(100, 100);
      return { id: rect.id };
    `);
    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
  });
});
```

## Troubleshooting

### Plugin Not Connected
```javascript
async function checkConnection() {
  const result = await executePenpotCode('return { file: penpot.currentFile?.name }');
  
  if (!result.success) {
    console.error('❌ Penpot not connected!');
    console.log('1. Open Penpot in browser');
    console.log('2. Load plugin: http://localhost:4400/manifest.json');
    console.log('3. Click "Connect to MCP server"');
    return false;
  }
  
  console.log('✅ Connected to Penpot file:', result.data.file);
  return true;
}
```

### Error Handling
```javascript
async function safeExecute(code) {
  try {
    const result = await executePenpotCode(code);
    
    if (!result.success) {
      // Handle Penpot-side errors
      logError('Penpot Error', result.error);
      return null;
    }
    
    return result.data;
  } catch (error) {
    // Handle network/connection errors
    logError('Connection Error', error);
    return null;
  }
}
```

## Next Steps

1. Copy `PENPOT_MCP_TOOLKIT.md` to your project docs
2. Create `penpot-helpers.js` with the helper functions above
3. Add `.penpot-mcp.config.json` configuration
4. Update your project README with Penpot integration info
5. Add tests for your Penpot integration
6. Configure your AI assistant with the instructions above

---

**You're ready to integrate Penpot MCP! 🎨🤖**

