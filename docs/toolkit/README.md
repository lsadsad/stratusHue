# Penpot MCP Toolkit 📦

**Drop-in resources for integrating Penpot MCP into any AI-powered project**

## What's Inside

This toolkit provides everything you need to quickly integrate Penpot design capabilities into your project with AI assistance.

### 📄 Files

1. **`../PENPOT_MCP_TOOLKIT.md`** (Main Guide)
   - Comprehensive documentation
   - API reference
   - Common patterns
   - Best practices
   - 40+ code examples

2. **`examples.js`** (Code Library)
   - Ready-to-use code snippets
   - Organized by category
   - Copy-paste into your project
   - Covers all common operations

3. **`integration-template.md`** (Project Template)
   - Quick setup guide
   - Helper functions
   - Configuration examples
   - Testing templates
   - AI instructions

4. **`GOTCHAS.md`** (⚠️ Critical Learnings)
   - Z-order gotcha: appendChild adds to FRONT (index 0)
   - Background rectangles covering foreground elements
   - SVG import not supported - workarounds
   - Ellipse vs Rectangle for circles
   - Export debugging checklist
   - **READ THIS BEFORE BUILDING UIs!**

## Quick Start

### For AI Assistants

When starting work on a project that needs Penpot integration:

1. Read `PENPOT_MCP_TOOLKIT.md` first for comprehensive understanding
2. Reference `examples.js` for specific code patterns
3. Use `integration-template.md` to set up the project

### For Developers

To integrate Penpot MCP into your project:

```bash
# 1. Copy the toolkit to your project
cp -r toolkit/ your-project/penpot-toolkit/

# 2. Copy the main guide to docs
cp PENPOT_MCP_TOOLKIT.md your-project/docs/

# 3. Follow integration-template.md instructions
```

## What Can You Build?

### Design System Tools
- ✅ Extract design tokens (colors, typography, spacing)
- ✅ Generate CSS/Sass variables from designs
- ✅ Sync design changes to codebase
- ✅ Validate code against design specs

### Code Generators
- ✅ Generate React/Vue/HTML components from designs
- ✅ Create styled-components/Tailwind from Penpot shapes
- ✅ Auto-generate design system documentation
- ✅ Build living style guides

### Design Automation
- ✅ Batch create UI components
- ✅ Auto-layout generation
- ✅ Component variant creation
- ✅ Mass updates to designs

### Integration & Sync
- ✅ Two-way sync between code and design
- ✅ Export designs for documentation
- ✅ Visual regression testing
- ✅ Design validation pipelines

### Data Visualization
- ✅ Create charts from data
- ✅ Dynamic diagram generation
- ✅ Automated mockup generation
- ✅ Report visualization

## Usage Examples

### Example 1: Extract Design Tokens

```javascript
// From examples.js
await mcp_penpot_execute_code({
  code: extractDesignTokens
});
```

### Example 2: Create Component Library

```javascript
// From examples.js
await mcp_penpot_execute_code({
  code: createButton
});

await mcp_penpot_execute_code({
  code: createCard
});
```

### Example 3: Validate Design

```javascript
// From examples.js
await mcp_penpot_execute_code({
  code: validateDesignSystem
});
```

## File Structure

```
toolkit/
├── README.md                    # This file
├── examples.js                  # Code snippets library
└── integration-template.md      # Project setup template

../PENPOT_MCP_TOOLKIT.md        # Main comprehensive guide
```

## How to Use This Toolkit

### Scenario 1: New Project Integration

1. Read `PENPOT_MCP_TOOLKIT.md` - Overview & API reference
2. Follow `integration-template.md` - Set up helpers
3. Browse `examples.js` - Find patterns you need
4. Start building!

### Scenario 2: Specific Task

1. Search `examples.js` for relevant code
2. Copy snippet to your tool call
3. Customize as needed
4. Reference `PENPOT_MCP_TOOLKIT.md` for API details if needed

### Scenario 3: AI Onboarding

When an AI assistant needs to understand Penpot MCP:

```
AI: Read toolkit/README.md first (you are here!)
↓
Then: Read PENPOT_MCP_TOOLKIT.md sections as needed
↓
Reference: examples.js for specific patterns
↓
Implement: Follow integration-template.md
```

## Key Concepts

### Available MCP Tools

1. **`mcp_penpot_execute_code`** - Execute JavaScript in Penpot
2. **`mcp_penpot_penpot_api_info`** - Get API documentation
3. **`mcp_penpot_export_shape`** - Export as PNG/SVG
4. **`mcp_penpot_import_image`** - Import image files
5. **`mcp_penpot_create_shape_from_css`** - Create from CSS

### Core Penpot Objects

- **`penpot`** - Main API object
- **`penpot.selection`** - Currently selected shapes
- **`penpot.library.local`** - Design system (colors, typography, components)
- **`penpot.currentPage`** - Active page
- **`storage`** - Persistent storage across calls

### Common Operations

```javascript
// Get selection
penpot.selection

// Create shapes
penpot.createRectangle()
penpot.createEllipse()
penpot.createText("Hello")

// Find shapes
penpot.currentPage.findShapes()

// Create component
penpot.library.local.createComponent([shape])

// Generate code
penpot.generateStyle(shapes)
penpot.generateMarkup(shapes)
```

## Categories in examples.js

1. **Selection & Querying** - Get information about shapes
2. **Design System** - Extract tokens, colors, typography
3. **Shape Creation** - Create buttons, cards, grids
4. **Shape Modification** - Update styles, positions, properties
5. **Components** - Create, find, update components
6. **Data Extraction** - Generate CSS, HTML, JSON
7. **Utilities** - Storage, batch operations
8. **Validation** - Check compliance, find issues

## Best Practices

### ✅ Do

- Check for null/undefined before accessing properties
- Use `storage` for data that persists across calls
- Batch operations in a single `execute_code` call
- Return useful data (IDs, names, properties)
- Handle errors gracefully

### ❌ Don't

- Make multiple API calls when one would suffice
- Assume shapes exist without checking
- Create shapes without naming them
- Ignore error responses
- Use infinite loops

## Integration Checklist

When integrating into a new project:

- [ ] Copy toolkit files to project
- [ ] Read `PENPOT_MCP_TOOLKIT.md`
- [ ] Set up helper functions from `integration-template.md`
- [ ] Verify Penpot MCP server is running
- [ ] Test basic connection
- [ ] Identify your use cases
- [ ] Find relevant examples in `examples.js`
- [ ] Customize for your needs
- [ ] Add tests
- [ ] Document integration

## Support & Resources

### Documentation
- **Main Guide**: `PENPOT_MCP_TOOLKIT.md`
- **Examples**: `examples.js`
- **Setup**: `integration-template.md`

### API Reference
Use the `mcp_penpot_penpot_api_info` tool:

```javascript
await mcp_penpot_penpot_api_info({
  type: "Penpot",
  member: "createRectangle"
});
```

### Common Issues

**Plugin Not Connected**
- Ensure Penpot is open
- Load plugin at `http://localhost:4400/manifest.json`
- Click "Connect to MCP server" in plugin UI

**Code Execution Failed**
- Check browser console for errors
- Verify code syntax
- Ensure shapes/objects exist

**Timeout**
- Break large operations into smaller chunks
- Use async/await appropriately
- Check for infinite loops

## Examples by Use Case

### Design System Management
```javascript
// examples.js
extractDesignTokens
storeDesignTokens
getColorPalette
```

### Component Development
```javascript
// examples.js
createButton
createCard
createComponentFromSelection
findComponentInstances
```

### Validation & Testing
```javascript
// examples.js
validateDesignSystem
findUnusedComponents
getComponentStats
```

### Code Generation
```javascript
// examples.js
generateCssFromSelection
generateHtmlFromSelection
exportShapeData
```

### Layout & Positioning
```javascript
// examples.js
createGrid
distributeHorizontally
alignToCenter
```

## Contributing Examples

If you create useful patterns, consider adding them to `examples.js`:

1. Follow existing code style
2. Add descriptive comments
3. Include error handling
4. Test before adding
5. Document use cases

## Version Info

- **Toolkit Version**: 1.0.0
- **Compatible with**: Penpot MCP 1.0.0+
- **Last Updated**: December 2025

---

## Quick Reference

```
NEED TO...                   → SEE...
────────────────────────────────────────────────────
Understand Penpot MCP        → PENPOT_MCP_TOOLKIT.md
Find code examples           → examples.js
Set up new project           → integration-template.md
Get API documentation        → mcp_penpot_penpot_api_info tool
Troubleshoot issues          → PENPOT_MCP_TOOLKIT.md § Troubleshooting
```

---

**Ready to build amazing design integrations! 🎨🚀**

For questions or contributions, see the main project README.

