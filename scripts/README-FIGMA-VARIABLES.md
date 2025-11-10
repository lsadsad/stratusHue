# Adding Design System Variables to Figma

This directory contains scripts to add the Stratus Hue plugin's design system variables to Figma using the Figma Variables API.

## Overview

The Stratus Hue plugin uses a comprehensive design token system defined in CSS custom properties. These scripts extract those tokens and create corresponding Figma variables, organized by category:

- **Spacing**: Spacing scale (xs, sm, md, lg, xl, xxl)
- **Typography**: Font sizes and weights
- **Sizing**: Component dimensions (buttons, icons, etc.)
- **Border**: Border radius and widths
- **Colors**: Theme colors (backgrounds, text, borders, status colors)
- **Shadow**: Shadow colors
- **Transition**: Transition durations
- **Z-Index**: Z-index scale

## Usage

### Option 1: Run as a Figma Plugin Command

1. **Add to your plugin's code.ts**:
   ```typescript
   import { addDesignSystemVariablesToFigma } from './scripts/add-figma-variables';
   
   // Add a menu command
   figma.ui.onmessage = (msg) => {
     if (msg.type === 'add-variables') {
       addDesignSystemVariablesToFigma();
     }
   };
   ```

2. **Or create a standalone plugin** that runs this script when executed.

### Option 2: Run in Figma Plugin Console

1. Open Figma Desktop
2. Go to **Plugins > Development > New Plugin**
3. Create a simple plugin with the code from `add-figma-variables-standalone.js`
4. Run the plugin

### Option 3: Use MCP Tools (Read-Only)

The MCP (Model Context Protocol) tools for Figma are currently read-only and can:
- Read existing variables: `mcp_Figma_Desktop_get_variable_defs`
- Get design context: `mcp_Figma_Desktop_get_design_context`
- Generate design system rules: `mcp_Figma_Desktop_create_design_system_rules`

To actually create variables, you need to use the Figma Plugin API directly (as shown in the scripts above).

## Scripts

### `add-figma-variables.ts`
TypeScript version with full type safety. Best for integration into the main plugin codebase.

### `add-figma-variables-standalone.js`
Standalone JavaScript version that can be run directly. Simpler and more portable.

## Variable Organization

Variables are organized into collections by category:

```
Stratus Hue /
  ├── Spacing
  ├── Typography
  ├── Sizing
  ├── Border
  ├── Colors
  ├── Shadow
  ├── Transition
  └── Z-index
```

Each collection contains variables with:
- **Name**: Matches the CSS custom property name (e.g., `spacing-md`)
- **Value**: Converted to Figma's format (RGBA for colors, numbers for sizes)
- **Description**: Human-readable description of the token's purpose

## Color Variables

Color variables are created as RGBA values. The scripts handle:
- Hex colors (`#0f0f0f`)
- RGBA colors (`rgba(255, 255, 255, 0.6)`)
- Conversion to Figma's RGBA format (0-1 range)

## Example Usage After Import

Once variables are added to Figma, you can:

1. **Use in designs**: Apply variables to fills, strokes, effects, etc.
2. **Create modes**: Add different modes (e.g., "Light", "Dark", "Cybertron") with different values
3. **Reference in code**: Use variable IDs in your plugin code to sync with designs

## Updating Variables

To update variables after they've been created:

1. Run the script again - it will skip existing variables
2. Or manually update variables in Figma's Variables panel
3. Or delete the collection and re-run the script

## Integration with MCP

While MCP tools can't directly create variables, you can:

1. Use `mcp_Figma_Desktop_get_variable_defs` to read existing variables
2. Compare with your CSS tokens to identify missing variables
3. Use the scripts here to add missing variables

## Notes

- Variables are created in the **local** variable collection (not published)
- All variables use the "Default" mode initially
- Existing variables with the same name are skipped (not overwritten)
- The script logs progress to the console

## Troubleshooting

**Variables not appearing?**
- Check the Figma console for errors
- Ensure you have permission to create variables
- Verify the variable collection was created successfully

**Wrong values?**
- Check the conversion logic in `parseColorToFigmaRgba` or `parseValueToFigmaVariable`
- Verify CSS token values match expected format

**Want to add more tokens?**
- Add them to the `designTokens` array in the script
- Re-run the script to create new variables

