/// <reference types="@figma/plugin-typings" />

/**
 * Script to add Stratus Hue design system variables to Figma
 * 
 * This script extracts design tokens from the plugin's CSS and creates
 * corresponding Figma variables organized by category.
 * 
 * Usage: Run this script in Figma's plugin development environment
 * or integrate it into the main plugin code.
 */

interface TokenDefinition {
  name: string;
  value: string;
  category: 'spacing' | 'typography' | 'color' | 'sizing' | 'border' | 'shadow' | 'transition' | 'z-index' | 'other';
  description?: string;
}

// Design tokens extracted from src/styles.css
const designTokens: TokenDefinition[] = [
  // Spacing System
  { name: 'spacing-xs', value: '2px', category: 'spacing', description: 'Micro spacing' },
  { name: 'spacing-sm', value: '4px', category: 'spacing', description: 'Small gaps' },
  { name: 'spacing-md', value: '6px', category: 'spacing', description: 'Default spacing' },
  { name: 'spacing-lg', value: '8px', category: 'spacing', description: 'Section padding' },
  { name: 'spacing-xl', value: '10px', category: 'spacing', description: 'Large spacing' },
  { name: 'spacing-xxl', value: '12px', category: 'spacing', description: 'Maximum spacing' },
  
  // Typography Sizes
  { name: 'font-size-base', value: '12px', category: 'typography', description: 'Base font size' },
  { name: 'font-size-xs', value: '10px', category: 'typography', description: 'Extra small text' },
  { name: 'font-size-sm', value: '11px', category: 'typography', description: 'Small text' },
  { name: 'font-size-md', value: '12px', category: 'typography', description: 'Medium text' },
  { name: 'font-size-lg', value: '14px', category: 'typography', description: 'Large text' },
  { name: 'letter-spacing-tight', value: '0.5px', category: 'typography', description: 'Tight letter spacing' },
  
  // Font Weights
  { name: 'font-weight-light', value: '300', category: 'typography', description: 'Light font weight' },
  { name: 'font-weight-normal', value: '400', category: 'typography', description: 'Normal font weight' },
  { name: 'font-weight-medium', value: '500', category: 'typography', description: 'Medium font weight' },
  { name: 'font-weight-semibold', value: '600', category: 'typography', description: 'Semibold font weight' },
  { name: 'font-weight-bold', value: '700', category: 'typography', description: 'Bold font weight' },
  
  // Component Sizes
  { name: 'button-height-sm', value: '16px', category: 'sizing', description: 'Small button height' },
  { name: 'button-height-md', value: '24px', category: 'sizing', description: 'Medium button height' },
  { name: 'button-height-lg', value: '32px', category: 'sizing', description: 'Large button height' },
  { name: 'icon-size-xs', value: '6px', category: 'sizing', description: 'Extra small icon' },
  { name: 'icon-size-sm', value: '8px', category: 'sizing', description: 'Small icon' },
  { name: 'icon-size-md', value: '10px', category: 'sizing', description: 'Medium icon' },
  { name: 'icon-size-md-plus', value: '12px', category: 'sizing', description: 'Medium plus icon' },
  { name: 'icon-size-lg', value: '16px', category: 'sizing', description: 'Large icon' },
  { name: 'icon-size-xl', value: '18px', category: 'sizing', description: 'Extra large icon' },
  { name: 'footer-height', value: '20px', category: 'sizing', description: 'Footer height' },
  { name: 'badge-size', value: '14px', category: 'sizing', description: 'Badge size' },
  { name: 'spinner-size', value: '12px', category: 'sizing', description: 'Spinner size' },
  { name: 'toggle-height', value: '28px', category: 'sizing', description: 'Toggle height' },
  { name: 'touch-target-min', value: '32px', category: 'sizing', description: 'Minimum touch target size' },
  
  // Border Radius
  { name: 'border-radius-xs', value: '2px', category: 'border', description: 'Extra small border radius' },
  { name: 'border-radius-sm', value: '3px', category: 'border', description: 'Small border radius' },
  { name: 'border-radius-md', value: '4px', category: 'border', description: 'Medium border radius' },
  { name: 'border-radius-lg', value: '6px', category: 'border', description: 'Large border radius' },
  { name: 'border-radius-xl', value: '8px', category: 'border', description: 'Extra large border radius' },
  { name: 'border-radius-pill', value: '999px', category: 'border', description: 'Pill-shaped border radius' },
  
  // Border Widths
  { name: 'border-width', value: '1px', category: 'border', description: 'Default border width' },
  { name: 'border-width-lg', value: '2px', category: 'border', description: 'Large border width' },
  
  // Outline
  { name: 'outline-width', value: '2px', category: 'border', description: 'Default outline width' },
  { name: 'outline-offset', value: '2px', category: 'border', description: 'Outline offset' },
  { name: 'outline-width-hc', value: '3px', category: 'border', description: 'High contrast outline width' },
  { name: 'outline-offset-hc', value: '1px', category: 'border', description: 'High contrast outline offset' },
  
  // Colors - Boilerplate Theme (Base)
  { name: 'theme-bg-primary', value: '#0f0f0f', category: 'color', description: 'Primary background color' },
  { name: 'theme-bg-secondary', value: '#1a1a1a', category: 'color', description: 'Secondary background color' },
  { name: 'theme-bg-tertiary', value: '#2a2a2a', category: 'color', description: 'Tertiary background color' },
  { name: 'theme-bg-elevated', value: '#0a0a0a', category: 'color', description: 'Elevated background color' },
  { name: 'theme-bg-accent', value: '#404040', category: 'color', description: 'Accent background color' },
  { name: 'theme-bg-hover', value: 'rgba(42, 42, 42, 0.2)', category: 'color', description: 'Hover background color' },
  { name: 'theme-bg-active', value: 'rgba(64, 64, 64, 0.2)', category: 'color', description: 'Active background color' },
  
  { name: 'theme-text-primary', value: '#f5f5f5', category: 'color', description: 'Primary text color' },
  { name: 'theme-text-secondary', value: '#d4d4d4', category: 'color', description: 'Secondary text color' },
  { name: 'theme-text-muted', value: 'rgba(255, 255, 255, 0.6)', category: 'color', description: 'Muted text color' },
  { name: 'theme-text-subtle', value: 'rgba(255, 255, 255, 0.8)', category: 'color', description: 'Subtle text color' },
  { name: 'theme-text-disabled', value: 'rgba(255, 255, 255, 0.4)', category: 'color', description: 'Disabled text color' },
  
  { name: 'theme-border-primary', value: '#2a2a2a', category: 'color', description: 'Primary border color' },
  { name: 'theme-border-secondary', value: '#404040', category: 'color', description: 'Secondary border color' },
  { name: 'theme-border-accent', value: '#13171B', category: 'color', description: 'Accent border color' },
  
  { name: 'theme-interactive-hover', value: '#2a2a2a', category: 'color', description: 'Interactive hover color' },
  { name: 'theme-interactive-active', value: '#404040', category: 'color', description: 'Interactive active color' },
  { name: 'theme-interactive-disabled', value: '#0f0f0f', category: 'color', description: 'Interactive disabled color' },
  
  // Status Colors
  { name: 'theme-success', value: '#4ade80', category: 'color', description: 'Success color' },
  { name: 'theme-warning', value: 'rgba(255, 193, 7, 0.9)', category: 'color', description: 'Warning color' },
  { name: 'theme-error', value: '#ff6b6b', category: 'color', description: 'Error color' },
  { name: 'theme-info', value: 'rgba(111, 176, 255, 0.9)', category: 'color', description: 'Info color' },
  
  // Accent Colors
  { name: 'theme-accent-red', value: 'rgba(255, 107, 107, 0.15)', category: 'color', description: 'Red accent color' },
  { name: 'theme-accent-green', value: 'rgba(110, 222, 110, 0.15)', category: 'color', description: 'Green accent color' },
  { name: 'theme-accent-yellow', value: 'rgba(255, 193, 7, 0.15)', category: 'color', description: 'Yellow accent color' },
  { name: 'theme-accent-blue', value: 'rgba(111, 176, 255, 0.08)', category: 'color', description: 'Blue accent color' },
  { name: 'theme-accent-pink', value: 'rgba(255, 105, 180, 0.4)', category: 'color', description: 'Pink accent color' },
  
  // Shadow Colors
  { name: 'theme-shadow-light', value: 'rgba(0, 0, 0, 0.32)', category: 'shadow', description: 'Light shadow color' },
  { name: 'theme-shadow-heavy', value: 'rgba(0, 0, 0, 0.5)', category: 'shadow', description: 'Heavy shadow color' },
  { name: 'theme-shadow-ambient', value: 'rgba(0, 0, 0, 0.4)', category: 'shadow', description: 'Ambient shadow color' },
  
  // Transitions
  { name: 'theme-transition-duration', value: '300ms', category: 'transition', description: 'Theme transition duration' },
  { name: 'transition-fast', value: '150ms ease-out', category: 'transition', description: 'Fast transition' },
  { name: 'transition-normal', value: '200ms ease-out', category: 'transition', description: 'Normal transition' },
  { name: 'transition-slow', value: '300ms ease-out', category: 'transition', description: 'Slow transition' },
  { name: 'transition-duration-fast', value: '150ms', category: 'transition', description: 'Fast transition duration' },
  { name: 'transition-duration-medium', value: '200ms', category: 'transition', description: 'Medium transition duration' },
  
  // Z-Index
  { name: 'z-tooltip', value: '1000', category: 'z-index', description: 'Tooltip z-index' },
  { name: 'z-footer', value: '1001', category: 'z-index', description: 'Footer z-index' },
  { name: 'z-modal', value: '2000', category: 'z-index', description: 'Modal z-index' },
  
  // Layout
  { name: 'section-padding', value: '8px', category: 'spacing', description: 'Section padding' },
  { name: 'container-padding', value: '8px', category: 'spacing', description: 'Container padding' },
  { name: 'max-content-height', value: '500px', category: 'sizing', description: 'Maximum content height' },
  { name: 'min-plugin-height', value: '488px', category: 'sizing', description: 'Minimum plugin height' },
  { name: 'container-min-width', value: '188px', category: 'sizing', description: 'Container minimum width' },
  { name: 'container-max-width', value: '188px', category: 'sizing', description: 'Container maximum width' },
];

/**
 * Converts CSS color value to Figma RGB color
 */
function parseColorToFigmaRgba(cssValue: string): RGBA | null {
  // Handle hex colors
  if (cssValue.startsWith('#')) {
    const hex = cssValue.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { r, g, b, a: 1 };
  }
  
  // Handle rgba colors
  const rgbaMatch = cssValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]) / 255,
      g: parseInt(rgbaMatch[2]) / 255,
      b: parseInt(rgbaMatch[3]) / 255,
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
    };
  }
  
  return null;
}

/**
 * Converts CSS value to Figma variable value
 */
function parseValueToFigmaVariable(value: string, category: TokenDefinition['category']): VariableValue {
  // Handle colors
  if (category === 'color' || category === 'shadow') {
    const rgba = parseColorToFigmaRgba(value);
    if (rgba) {
      return rgba;
    }
  }
  
  // Handle numeric values (spacing, sizing, etc.)
  const numericMatch = value.match(/([\d.]+)(px|ms|s)?/);
  if (numericMatch) {
    const num = parseFloat(numericMatch[1]);
    const unit = numericMatch[2];
    
    // For spacing and sizing, return as number (Figma uses pixels)
    if (category === 'spacing' || category === 'sizing' || category === 'border') {
      return num;
    }
    
    // For transitions (duration), return as number (milliseconds)
    if (category === 'transition' && unit === 'ms') {
      return num;
    }
    
    // For z-index, return as number
    if (category === 'z-index') {
      return num;
    }
    
    // For typography sizes, return as number (pixels)
    if (category === 'typography' && unit === 'px') {
      return num;
    }
  }
  
  // Fallback: return as string
  return value;
}

/**
 * Gets or creates a variable collection in Figma
 */
function getOrCreateCollection(name: string): VariableCollection {
  const existing = figma.variables.getLocalVariableCollections().find(
    col => col.name === name
  );
  
  if (existing) {
    return existing;
  }
  
  return figma.variables.createVariableCollection(name);
}

/**
 * Gets or creates a variable mode in a collection
 */
function getOrCreateMode(collection: VariableCollection, modeName: string = 'Default'): string {
  const existingMode = collection.modes.find(m => m.name === modeName);
  if (existingMode) {
    return existingMode.modeId;
  }
  
  const modeId = collection.addMode(modeName);
  return modeId;
}

/**
 * Creates a variable in Figma
 */
function createVariable(
  collection: VariableCollection,
  token: TokenDefinition,
  modeId: string
): Variable | null {
  try {
    // Check if variable already exists
    const existing = figma.variables.getLocalVariables().find(
      v => v.name === token.name && v.variableCollectionId === collection.id
    );
    
    if (existing) {
      console.log(`Variable "${token.name}" already exists, skipping...`);
      return existing;
    }
    
    // Determine variable type based on category
    let variableType: VariableResolvedDataType;
    if (token.category === 'color' || token.category === 'shadow') {
      variableType = 'COLOR';
    } else if (token.category === 'spacing' || token.category === 'sizing' || token.category === 'border' || token.category === 'typography') {
      variableType = 'FLOAT';
    } else {
      // For transitions, z-index, etc., use FLOAT
      variableType = 'FLOAT';
    }
    
    // Parse the value
    const variableValue = parseValueToFigmaVariable(token.value, token.category);
    
    // Create the variable
    const variable = figma.variables.createVariable(
      token.name,
      collection,
      variableType
    );
    
    // Set the value for the mode
    variable.setValueForMode(modeId, variableValue);
    
    // Set description if provided
    if (token.description) {
      variable.description = token.description;
    }
    
    console.log(`Created variable: ${token.name} = ${token.value}`);
    return variable;
  } catch (error) {
    console.error(`Error creating variable "${token.name}":`, error);
    return null;
  }
}

/**
 * Main function to add all design system variables to Figma
 */
export async function addDesignSystemVariablesToFigma(): Promise<void> {
  console.log('Starting to add design system variables to Figma...');
  
  // Group tokens by category
  const tokensByCategory = new Map<string, TokenDefinition[]>();
  for (const token of designTokens) {
    if (!tokensByCategory.has(token.category)) {
      tokensByCategory.set(token.category, []);
    }
    tokensByCategory.get(token.category)!.push(token);
  }
  
  // Create collections for each category
  const collections = new Map<string, VariableCollection>();
  
  for (const [category, tokens] of tokensByCategory) {
    const collectionName = `Stratus Hue / ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    const collection = getOrCreateCollection(collectionName);
    const modeId = getOrCreateMode(collection);
    collections.set(category, collection);
    
    console.log(`\nProcessing ${category} category (${tokens.length} tokens)...`);
    
    // Create variables for this category
    for (const token of tokens) {
      createVariable(collection, token, modeId);
    }
  }
  
  console.log('\n✅ Successfully added all design system variables to Figma!');
  console.log(`Created ${collections.size} variable collections with ${designTokens.length} total variables.`);
  
  figma.notify(`✅ Added ${designTokens.length} design system variables to Figma!`, { timeout: 3000 });
}

// Run if executed directly
if (require.main === module) {
  addDesignSystemVariablesToFigma().catch(error => {
    console.error('Error adding variables:', error);
    figma.notify('❌ Error adding variables. Check console for details.', { timeout: 5000 });
  });
}

