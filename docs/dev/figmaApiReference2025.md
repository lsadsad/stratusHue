# Figma Plugin API Reference (2024-2025)
**Last Updated: September 2025**

This document provides current information about the Figma Plugin API for AI coding assistants. Use this as a reference when helping developers build Figma plugins.

---

## Architecture Overview

### Dual-Environment System
- **Main thread**: QuickJS/WebAssembly sandbox with Plugin API access, no browser APIs
- **UI thread**: Null-origin iframe with full browser APIs (HTML/CSS/JS)
- **Communication**: Message passing between environments via `figma.ui.postMessage()` and `window.onmessage`

### Critical Restrictions
- **NO localStorage/sessionStorage** - These APIs are NOT supported and will cause failures
- Use React state (`useState`, `useReducer`) or in-memory JavaScript variables instead
- Storage: Use `figma.clientStorage` API (5MB limit as of March 2025)

---

## Dynamic Page Loading (Mandatory as of April 2024)

### Key Concept
Plugins now load only the current page by default, not all pages. This eliminates 20-30 second load times in large files.

### Manifest Configuration
```json
{
  "documentAccess": "dynamic-page"
}
```

### Critical API Changes
All synchronous methods are DEPRECATED. Use async equivalents:

**Node/Style Lookups:**
- `figma.getNodeById(id)` → `await figma.getNodeByIdAsync(id)`
- `figma.getStyleById(id)` → `await figma.getStyleByIdAsync(id)`

**Variable Operations:**
- Now require object references, not string IDs
- `setBoundVariable(field, variableId)` → `setBoundVariable(field, variableObject)`

**Page Loading:**
- `await page.loadAsync()` - Must call before accessing page contents
- `await figma.loadAllPagesAsync()` - For document-wide operations

### Migration Support
Use ESLint plugin: `@figma/eslint-plugin-figma-plugins` (provides auto-fix)

---

## Storage & Performance Limits

### Client Storage (Updated March 2025)
- **Total capacity**: 5MB (up from 1MB)
- **Per-entry limit**: 100kB for `setPluginData()` and `setSharedPluginData()`
- API: `figma.clientStorage.setAsync()`, `getAsync()`, `deleteAsync()`, `keysAsync()`

### Codegen Timeouts (Updated April 2025)
- `figma.codegen.on()` callback timeout: **15 seconds**
- Use for LLM-powered code generation or complex operations
- Timeout triggers user-facing error message

---

## Node Types & Layout (Current)

### CSS Grid Layout (July 2025, Update 115)
Full CSS Grid support for modern layouts:

**Container Properties:**
```typescript
node.layoutMode = "GRID"
node.gridRowCount: number
node.gridColumnCount: number
node.gridRowGap: number | { value: number; unit: "PIXELS" | "PERCENT" }
node.gridColumnGap: number | { value: number; unit: "PIXELS" | "PERCENT" }
node.gridRowSizes: Array<{ type: "FIXED" | "AUTO" | "FLEX"; value: number }>
node.gridColumnSizes: Array<{ type: "FIXED" | "AUTO" | "FLEX"; value: number }>
```

**Child Properties:**
```typescript
child.gridRowSpan: number
child.gridColumnSpan: number
child.gridRowAnchorIndex: number
child.gridColumnAnchorIndex: number
child.gridChildHorizontalAlign: "MIN" | "MAX" | "CENTER" | "STRETCH"
child.gridChildVerticalAlign: "MIN" | "MAX" | "CENTER" | "STRETCH"
```

**Methods:**
```typescript
parent.appendChildAt(child, row, column)
child.setGridChildPosition(row, column)
```

### Text on Path (May 2025, Beta)
```typescript
const textPath = figma.createTextPathNode()
textPath.type = "TEXT_PATH"
// Compatible with Figma Design and Figma Draw
```

### Transform Groups (May 2025)
```typescript
const transformGroup = figma.createTransformGroupNode()
// Maintains relationships during grouped transformations
```

### Page Dividers (November 2024)
```typescript
const divider = figma.createPageDivider()
page.isPageDivider // boolean property
```

### Section Expand/Collapse Control
```typescript
// Control whether a section is expanded in the layers panel
section.expanded = true  // Expand the section
section.expanded = false // Collapse the section

// Also works on other container nodes like frames and groups
frame.expanded = false
group.expanded = true
```

**Note:** The `expanded` property is supported on SectionNode, FrameNode, GroupNode, ComponentNode, and most other container node types.

### Figma Slides Support (February 2025)
```typescript
figma.editorType // returns 'slides' in Slides files
figma.viewport.slidesMode // 'grid' | 'single-slide'
figma.currentPage.focusedSlide
figma.getSlideGrid()
figma.setSlideGrid(config)
```

Node types: `SLIDE`, `SLIDE_ROW`, `SLIDE_GRID`, `INTERACTIVE_SLIDE_ELEMENT`

---

## Visual Effects & Styling

### New Effects (May 2025, Update 110 - All Beta)

**Texture Effect:**
```typescript
{
  type: "TEXTURE",
  visible: boolean,
  opacity: number,
  blendMode: BlendMode
}
```

**Noise Effect:**
```typescript
{
  type: "NOISE",
  visible: boolean,
  opacity: number,
  blendMode: BlendMode,
  color: RGB // Added June 2025
}
```

**Progressive Blur:**
```typescript
{
  type: "PROGRESSIVE_BLUR",
  // Gradual blur from edge to edge
}
```

**Glass Effect (July 2025, Beta):**
```typescript
{
  type: "GLASS",
  // Frosted glass/glassmorphism
  // Frame-only, no variable binding yet
}
```

### Pattern Paint (May 2025, Beta)
```typescript
{
  type: "PATTERN",
  visible: boolean,
  opacity: number,
  blendMode: BlendMode
}
```

### Stroke Caps (July 2025)
New options: `"DIAMOND_FILLED"`, `"TRIANGLE_FILLED"`, `"CIRCLE_FILLED"`

---

## Typography Enhancements

### Per-Paragraph Properties (December 2024, Update 105)
```typescript
textNode.paragraphSpacing: number
textNode.paragraphIndent: number
textNode.listSpacing: number

// Ranged getters/setters for selections
textNode.getRangeParagraphSpacing(start, end)
textNode.setRangeParagraphSpacing(start, end, value)
```

### Advanced Underline Styling (December 2024, Update 106)
```typescript
textNode.textDecorationStyle: "SOLID" | "DOUBLE" | "DOTTED" | "DASHED" | "WAVY"
textNode.textDecorationOffset: number
textNode.textDecorationThickness: number
textNode.textDecorationColor: RGB
textNode.textDecorationSkipInk: boolean
```

All support `getStyledTextSegments()` and most support variable binding.

---

## Variable Binding & Design Tokens

### Current Variable Binding Support

**Typography (June 2024):**
- Font family, size, weight, line height, letter spacing
- Text decoration properties (with variable binding)

**Gradients (June 2024):**
- Gradient color stops can bind to variables

**Component Properties (November 2024):**
```typescript
componentPropertyDefinitions // Can reference variables
componentProperties // Can reference variables
```

**Layout (July 2025):**
- Grid gaps (`gridRowGap`, `gridColumnGap`) support variable binding

**Page-level Variable Modes (January 2024):**
```typescript
page.explicitVariableModes: { [collectionId: string]: string }
// View and set per-page variable states
```

### Variable Operations (Object-based)
```typescript
// Modern API - pass variable objects, not IDs
node.setBoundVariable(field, variableObject)
const boundVar = node.getBoundVariable(field)
```

---

## Dev Mode APIs

### Annotations & Measurements (December 2024, Update 104)

**Full CRUD Operations:**
```typescript
// Create annotations programmatically
const annotation = figma.createAnnotation()
annotation.label = "Implementation note"
annotation.text = "Use semantic HTML here"

// Read/update/delete
const annotations = node.getAnnotations()
annotation.remove()
```

**Annotation Categories (April 2025):**
```typescript
// Initialize categories at file level
figma.createAnnotationCategory({
  name: "Accessibility",
  color: { r: 0, g: 1, b: 0 },
  label: "A11Y"
})

// Assign to annotations
annotation.category = categoryObject
```

### Rich Text Formatting (December 2024)
```typescript
// Component descriptions with rich formatting
component.description = richTextObject
// Matches Figma UI capabilities
```

### Prototyping Interactions API (December 2024)
**Full access to prototyping reactions via Plugin and REST APIs:**
- Triggers (onClick, onChange, etc.)
- Transitions and animations
- Navigation actions
- Overlay behaviors

Enables prototype export, documentation automation, and validation.

---

## Code Connect

### Overview (GA: June 2024)
Maps Figma components to production code snippets in Dev Mode.

### NPM Package
```bash
npm install @figma/code-connect
```

### Property Mapping API
```typescript
import { figma } from '@figma/code-connect'

figma.string('textContent')     // Text properties
figma.boolean('isDisabled')     // Boolean variants
figma.enum('variant', {         // Variant mapping
  'Primary': 'primary',
  'Secondary': 'secondary'
})
figma.instance('icon')          // Nested components
```

### Supported Frameworks
- React, React Native, SwiftUI
- Storybook, Angular, Vue
- Android (Jetpack Compose)
- HTML/Web Components

### Code Connect UI (September 2025, Beta)
Visual interface in Figma for creating mappings without CLI:
- Direct GitHub integration
- Browse repository files
- Click to connect components
- Enables designer participation

---

## MCP Server (June 2025)

### Overview
Model Context Protocol server for AI coding tools (GitHub Copilot, Cursor, Windsurf, Claude Code).

### Deployment Options
1. **Local**: Enable in Figma Desktop → Preferences → Enable local MCP server
2. **Remote** (September 2025): `https://mcp.figma.com/mcp` (no desktop app required)

### Available Tools
```typescript
// Get code representation
get_figma_code(nodeId, framework)
// Frameworks: React + Tailwind (more coming)

// Get design screenshot
get_figma_image(nodeId, resolution)

// Get variable definitions
get_figma_variables()
// Returns code syntax for variables
```

### Context Types Provided
1. **Pattern metadata**: Component refs, variables, Code Connect mappings
2. **Screenshots**: High-level design + interactive content
3. **Interactive code examples**: Pseudocode for stateful components
4. **Content/layout data**: Text, SVG, images, Auto Layout structure

### Make File Resources (September 2025)
MCP can access Figma Make (AI prototyping) code for production workflows.

---

## REST API Updates

### Library Analytics API (June 2024, Enterprise Beta)
Programmatic access to design system usage:
- Component insertions, detachments, instances
- Team/file-level breakdowns
- Style tracking (October 2024)
- Variable tracking (October 2024)

Enables custom dashboards, ROI measurement, adoption tracking.

### OAuth Changes (Effective November 17, 2025)

**⚠️ BREAKING CHANGE - ACTION REQUIRED**

**All OAuth apps must re-publish by November 17, 2025:**
1. Designate Figma team/organization ownership
2. Declare scopes with explanations
3. Complete app review for public apps

**New Granular Scopes:**
Replace `file_read` and `files:read` with:
- `file_content:read` - Read file content
- `file_metadata:read` - Read metadata only
- `file_variables:read` - Read variables
- `file_variables:write` - Write variables (Enterprise only)
- `file_comments:write` - Write comments

**Rate Limits:**
- Tiered by Figma plan (Starter, Professional, Organization, Enterprise)
- Per-user limits for OAuth apps and personal access tokens
- Vary by seat type (View, Collab, Dev, Full)
- Preview period: October 21, 2025 (9 AM-1 PM PT)
- 429 responses include seat type for upgrade prompts

**Consequences:**
Apps not re-published by deadline will be unpublished and lose REST API access.

---

## TypeScript & Developer Experience

### JSDoc Docstrings (May 2025, Update 113)
Type definitions now include inline documentation:
- Hover tooltips in VS Code
- IntelliSense with API signatures
- Parameter descriptions
- Return types and usage notes

**Widget API** docstrings added June 2025.

### Bug Fixes (Update 113)
- `InteractiveSlideElementNode.clone()` - Missing method added
- `PatternPaint` - Added `visible`, `opacity`, `blendMode`
- `CodegenPreferences.unit` - Corrected to uppercase

### Type Definition Corrections (August 2024)
- Update 98: Removed nullable modifiers from `boundVariables` (caused errors)
- Update 99: Partial revert - restored nullability for `Paint` and `Effect` types

---

## Available Libraries (React Artifacts)

When creating React artifacts, these libraries are available:

```typescript
import { useState } from "react"
import { Camera } from "lucide-react"
import { LineChart, XAxis } from "recharts"
import * as math from 'mathjs'
import _ from 'lodash'
import * as d3 from 'd3'
import * as Plotly from 'plotly'
import * as THREE from 'three' // r128 - no CapsuleGeometry
import { Alert, AlertDescription } from '@/components/ui/alert' // shadcn/ui
import * as Chart from 'chart.js'
import * as Tone from 'tone'
import * as mammoth from 'mammoth'
import * as tf from 'tensorflow'
```

**For CSV/Excel processing:**
```typescript
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
```

---

## Security & Compliance

### Certifications (Current)
- **ISO/IEC 27001:2022** (renewed December 2024, valid through January 2027)
- **ISO/IEC 27018:2019** (renewed December 2024)
- **SOC 2 Type 2** (ongoing audits, public SOC 3 summaries)
- **EU Cloud Code of Conduct Level 2** (GDPR compliance)

### Plugin Security Model
- Main thread: Sandboxed JavaScript (no browser APIs)
- HTTPS required for external requests
- Domain allowlisting in manifest
- CSP enforcement
- TLS 1.2+ for transit
- Encryption at rest

---

## Monetization

### Current Status (September 2025)
- **Plugins/Widgets**: Full monetization available
- **Files (UI kits/templates)**: New paid file sellers NOT accepted
  - Existing approved creators can continue
  - This restriction does NOT affect plugins

### Plugin Monetization Details
- Minimum price: $2.00
- Platform fee: 15% (covers payment processing + fraud monitoring)
- Models: One-time purchase or subscription
- Free trials: 7-day default for subscriptions
- Pricing changes: Max 50% increase, 16-day user notice
- Payouts: 30-day terms, weekly cashout limits
- Supported: 66+ countries

### Payments API
Custom freemium models with time-based or usage-based trials.

### Creator Fund
- Nearly $300k distributed to 13 creators (9 countries) by mid-2023
- Supports free, high-value plugins
- Rolling applications (up to 5 recipients/month)

### Third-Party Options
Payment links permitted in plugin UIs and Community descriptions.

---

## Common Patterns & Best Practices

### File Reading in Plugins
```typescript
// Read uploaded files
const data = await window.fs.readFile('filename.csv', { encoding: 'utf8' })
```

### CSV Processing
```typescript
import Papa from 'papaparse'

const parsed = Papa.parse(data, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  delimitersToGuess: [',', '\t', '|', ';']
})

// ALWAYS strip whitespace from headers
const cleanHeaders = parsed.meta.fields.map(h => h.trim())

// Use lodash for operations like groupBy - don't write custom
import _ from 'lodash'
const grouped = _.groupBy(parsed.data, 'category')
```

### Excel Processing
```typescript
import * as XLSX from 'xlsx'

const response = await window.fs.readFile('filename.xlsx')
const workbook = XLSX.read(response, {
  cellStyles: true,
  cellFormulas: true,
  cellDates: true,
  cellNF: true,
  sheetStubs: true
})

// Always inspect structure first
console.log(workbook.Workbook) // Metadata
console.log(workbook.Sheets['Sheet1']['!ref']) // Sheet properties
```

### Performance Optimization
```typescript
// Enable selective loading for complex documents
figma.skipInvisibleInstanceChildren = true

// Batch operations
figma.ui.postMessage({ type: 'batch-update', nodes: [...] })

// Selective node loading (don't traverse entire document)
const node = await figma.getNodeByIdAsync(id)
await node.loadAsync() // Only load what you need
```

### Error Handling
Always wrap plugin operations in try-catch, especially:
- File reading
- Async operations
- Network requests
- Node manipulation

---

## Deprecated & Removed

### Synchronous Methods (February 2024)
- `figma.getNodeById()` → Use `getNodeByIdAsync()`
- `figma.getStyleById()` → Use `getStyleByIdAsync()`
- Variable operations with string IDs → Use object references
- `documentchange` event → Use `nodechange`, `stylechange`

### Migration Window
- February-April 2024 (8 weeks)
- ESLint plugin provides auto-fix
- Backward compatibility: Plugins without `"documentAccess": "dynamic-page"` still work (with full-page loading)

---

## Upcoming Changes

### November 17, 2025 Deadline
- OAuth app re-publication required
- Granular scope migration
- Rate limit enforcement begins
- Preview/testing period: October 21, 2025 (9 AM-1 PM PT)

### Beta Features (Use with Caution)
Currently in beta (subject to change):
- TextPathNode
- Texture/Noise/Progressive Blur effects
- Pattern paint
- Glass effect
- Code Connect UI
- Library Analytics API
- Annotation categories

---

## Quick Reference: Recent Updates Timeline

**2024:**
- Q1: Dynamic page loading, Dev Mode GA, page-level variable modes
- Q2: Config conference (Code Connect beta, typography/gradient variables, Dev Mode enhancements)
- Q3: FigJam dynamic loading, type definition fixes
- Q4: Annotations API, prototyping API, rich text formatting, paragraph properties, underline styling, page dividers, component property variables

**2025:**
- Q1: Storage increase (5MB), codegen timeout (15s), Slides support, advanced effects (texture/noise/blur), pattern paint
- Q2: Annotation categories, TypeScript docstrings, TextPathNode, glass effect
- Q3: CSS Grid layout, MCP server remote option, Code Connect UI, OAuth changes announced

---

## Resources

- **Official Docs**: https://developers.figma.com/docs/plugins/
- **Updates**: https://developers.figma.com/docs/plugins/updates/
- **ESLint Plugin**: `@figma/eslint-plugin-figma-plugins`
- **Code Connect**: `@figma/code-connect`
- **Community**: https://forum.figma.com/
- **OAuth Changes**: https://developers.figma.com/docs/updates-to-figmas-developer-platform/

---

**Note for AI Assistants**: This reference reflects the state of the Figma Plugin API as of September 2025. When helping developers:
1. Always use async/await patterns for node/style lookups
2. Never suggest localStorage/sessionStorage for artifacts
3. Check if features are in beta before recommending
4. Remind about November 2025 OAuth deadline if relevant
5. Use the ESLint plugin for migration assistance