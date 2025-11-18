/**
 * Standalone script to add stratusHue design system variables to Figma
 * 
 * This can be run directly in Figma's plugin console or integrated into your plugin.
 * 
 * Usage in Figma Plugin Console:
 * 1. Open Figma
 * 2. Go to Plugins > Development > Import plugin from manifest
 * 3. Or run this code in a plugin's code.ts file
 */

// Design tokens organized by category
const designTokens = {
  spacing: [
    { name: 'spacing-xs', value: 2, description: 'Micro spacing' },
    { name: 'spacing-sm', value: 4, description: 'Small gaps' },
    { name: 'spacing-md', value: 6, description: 'Default spacing' },
    { name: 'spacing-lg', value: 8, description: 'Section padding' },
    { name: 'spacing-xl', value: 10, description: 'Large spacing' },
    { name: 'spacing-xxl', value: 12, description: 'Maximum spacing' },
    { name: 'section-padding', value: 8, description: 'Section padding' },
    { name: 'container-padding', value: 8, description: 'Container padding' },
  ],
  
  typography: [
    { name: 'font-size-base', value: 12, description: 'Base font size' },
    { name: 'font-size-xs', value: 10, description: 'Extra small text' },
    { name: 'font-size-sm', value: 11, description: 'Small text' },
    { name: 'font-size-md', value: 12, description: 'Medium text' },
    { name: 'font-size-lg', value: 14, description: 'Large text' },
    { name: 'font-weight-light', value: 300, description: 'Light font weight' },
    { name: 'font-weight-normal', value: 400, description: 'Normal font weight' },
    { name: 'font-weight-medium', value: 500, description: 'Medium font weight' },
    { name: 'font-weight-semibold', value: 600, description: 'Semibold font weight' },
    { name: 'font-weight-bold', value: 700, description: 'Bold font weight' },
  ],
  
  sizing: [
    { name: 'button-height-sm', value: 16, description: 'Small button height' },
    { name: 'button-height-md', value: 24, description: 'Medium button height' },
    { name: 'button-height-lg', value: 32, description: 'Large button height' },
    { name: 'icon-size-xs', value: 6, description: 'Extra small icon' },
    { name: 'icon-size-sm', value: 8, description: 'Small icon' },
    { name: 'icon-size-md', value: 10, description: 'Medium icon' },
    { name: 'icon-size-md-plus', value: 12, description: 'Medium plus icon' },
    { name: 'icon-size-lg', value: 16, description: 'Large icon' },
    { name: 'icon-size-xl', value: 18, description: 'Extra large icon' },
    { name: 'footer-height', value: 20, description: 'Footer height' },
    { name: 'badge-size', value: 14, description: 'Badge size' },
    { name: 'spinner-size', value: 12, description: 'Spinner size' },
    { name: 'toggle-height', value: 28, description: 'Toggle height' },
    { name: 'touch-target-min', value: 32, description: 'Minimum touch target size' },
    { name: 'max-content-height', value: 500, description: 'Maximum content height' },
    { name: 'min-plugin-height', value: 488, description: 'Minimum plugin height' },
    { name: 'container-min-width', value: 188, description: 'Container minimum width' },
    { name: 'container-max-width', value: 188, description: 'Container maximum width' },
  ],
  
  border: [
    { name: 'border-radius-xs', value: 2, description: 'Extra small border radius' },
    { name: 'border-radius-sm', value: 3, description: 'Small border radius' },
    { name: 'border-radius-md', value: 4, description: 'Medium border radius' },
    { name: 'border-radius-lg', value: 6, description: 'Large border radius' },
    { name: 'border-radius-xl', value: 8, description: 'Extra large border radius' },
    { name: 'border-radius-pill', value: 999, description: 'Pill-shaped border radius' },
    { name: 'border-width', value: 1, description: 'Default border width' },
    { name: 'border-width-lg', value: 2, description: 'Large border width' },
    { name: 'outline-width', value: 2, description: 'Default outline width' },
    { name: 'outline-offset', value: 2, description: 'Outline offset' },
    { name: 'outline-width-hc', value: 3, description: 'High contrast outline width' },
    { name: 'outline-offset-hc', value: 1, description: 'High contrast outline offset' },
  ],
  
  colors: [
    // Boilerplate Theme Colors
    { name: 'theme-bg-primary', value: { r: 0.0588, g: 0.0588, b: 0.0588, a: 1 }, description: 'Primary background color' },
    { name: 'theme-bg-secondary', value: { r: 0.1019, g: 0.1019, b: 0.1019, a: 1 }, description: 'Secondary background color' },
    { name: 'theme-bg-tertiary', value: { r: 0.1647, g: 0.1647, b: 0.1647, a: 1 }, description: 'Tertiary background color' },
    { name: 'theme-bg-elevated', value: { r: 0.0392, g: 0.0392, b: 0.0392, a: 1 }, description: 'Elevated background color' },
    { name: 'theme-bg-accent', value: { r: 0.2510, g: 0.2510, b: 0.2510, a: 1 }, description: 'Accent background color' },
    { name: 'theme-bg-hover', value: { r: 0.1647, g: 0.1647, b: 0.1647, a: 0.2 }, description: 'Hover background color' },
    { name: 'theme-bg-active', value: { r: 0.2510, g: 0.2510, b: 0.2510, a: 0.2 }, description: 'Active background color' },
    
    { name: 'theme-text-primary', value: { r: 0.9608, g: 0.9608, b: 0.9608, a: 1 }, description: 'Primary text color' },
    { name: 'theme-text-secondary', value: { r: 0.8314, g: 0.8314, b: 0.8314, a: 1 }, description: 'Secondary text color' },
    { name: 'theme-text-muted', value: { r: 1, g: 1, b: 1, a: 0.6 }, description: 'Muted text color' },
    { name: 'theme-text-subtle', value: { r: 1, g: 1, b: 1, a: 0.8 }, description: 'Subtle text color' },
    { name: 'theme-text-disabled', value: { r: 1, g: 1, b: 1, a: 0.4 }, description: 'Disabled text color' },
    
    { name: 'theme-border-primary', value: { r: 0.1647, g: 0.1647, b: 0.1647, a: 1 }, description: 'Primary border color' },
    { name: 'theme-border-secondary', value: { r: 0.2510, g: 0.2510, b: 0.2510, a: 1 }, description: 'Secondary border color' },
    { name: 'theme-border-accent', value: { r: 0.0745, g: 0.0902, b: 0.1059, a: 1 }, description: 'Accent border color' },
    
    { name: 'theme-interactive-hover', value: { r: 0.1647, g: 0.1647, b: 0.1647, a: 1 }, description: 'Interactive hover color' },
    { name: 'theme-interactive-active', value: { r: 0.2510, g: 0.2510, b: 0.2510, a: 1 }, description: 'Interactive active color' },
    { name: 'theme-interactive-disabled', value: { r: 0.0588, g: 0.0588, b: 0.0588, a: 1 }, description: 'Interactive disabled color' },
    
    // Status Colors
    { name: 'theme-success', value: { r: 0.2902, g: 0.8706, b: 0.5020, a: 1 }, description: 'Success color' },
    { name: 'theme-warning', value: { r: 1, g: 0.7569, b: 0.0275, a: 0.9 }, description: 'Warning color' },
    { name: 'theme-error', value: { r: 1, g: 0.4196, b: 0.4196, a: 1 }, description: 'Error color' },
    { name: 'theme-info', value: { r: 0.4353, g: 0.6902, b: 1, a: 0.9 }, description: 'Info color' },
    
    // Accent Colors
    { name: 'theme-accent-red', value: { r: 1, g: 0.4196, b: 0.4196, a: 0.15 }, description: 'Red accent color' },
    { name: 'theme-accent-green', value: { r: 0.4314, g: 0.8706, b: 0.4314, a: 0.15 }, description: 'Green accent color' },
    { name: 'theme-accent-yellow', value: { r: 1, g: 0.7569, b: 0.0275, a: 0.15 }, description: 'Yellow accent color' },
    { name: 'theme-accent-blue', value: { r: 0.4353, g: 0.6902, b: 1, a: 0.08 }, description: 'Blue accent color' },
    { name: 'theme-accent-pink', value: { r: 1, g: 0.4118, b: 0.7059, a: 0.4 }, description: 'Pink accent color' },
  ],
  
  shadow: [
    { name: 'theme-shadow-light', value: { r: 0, g: 0, b: 0, a: 0.32 }, description: 'Light shadow color' },
    { name: 'theme-shadow-heavy', value: { r: 0, g: 0, b: 0, a: 0.5 }, description: 'Heavy shadow color' },
    { name: 'theme-shadow-ambient', value: { r: 0, g: 0, b: 0, a: 0.4 }, description: 'Ambient shadow color' },
  ],
  
  transition: [
    { name: 'theme-transition-duration', value: 300, description: 'Theme transition duration (ms)' },
    { name: 'transition-duration-fast', value: 150, description: 'Fast transition duration (ms)' },
    { name: 'transition-duration-medium', value: 200, description: 'Medium transition duration (ms)' },
  ],
  
  zIndex: [
    { name: 'z-tooltip', value: 1000, description: 'Tooltip z-index' },
    { name: 'z-footer', value: 1001, description: 'Footer z-index' },
    { name: 'z-modal', value: 2000, description: 'Modal z-index' },
  ],
};

/**
 * Gets or creates a variable collection
 */
function getOrCreateCollection(name) {
  const existing = figma.variables.getLocalVariableCollections().find(
    col => col.name === name
  );
  
  if (existing) {
    return existing;
  }
  
  return figma.variables.createVariableCollection(name);
}

/**
 * Gets or creates a variable mode
 */
function getOrCreateMode(collection, modeName = 'Default') {
  const existingMode = collection.modes.find(m => m.name === modeName);
  if (existingMode) {
    return existingMode.modeId;
  }
  
  return collection.addMode(modeName);
}

/**
 * Creates a variable in Figma
 */
function createVariable(collection, token, modeId, variableType) {
  try {
    // Check if variable already exists
    const existing = figma.variables.getLocalVariables().find(
      v => v.name === token.name && v.variableCollectionId === collection.id
    );
    
    if (existing) {
      console.log(`Variable "${token.name}" already exists, skipping...`);
      return existing;
    }
    
    // Create the variable
    const variable = figma.variables.createVariable(
      token.name,
      collection,
      variableType
    );
    
    // Set the value for the mode
    variable.setValueForMode(modeId, token.value);
    
    // Set description if provided
    if (token.description) {
      variable.description = token.description;
    }
    
    console.log(`Created variable: ${token.name}`);
    return variable;
  } catch (error) {
    console.error(`Error creating variable "${token.name}":`, error);
    return null;
  }
}

/**
 * Main function to add all design system variables
 */
async function addDesignSystemVariablesToFigma() {
  console.log('Starting to add design system variables to Figma...');
  
  let totalCreated = 0;
  
  // Process each category
  for (const [category, tokens] of Object.entries(designTokens)) {
    const collectionName = `stratusHue / ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    const collection = getOrCreateCollection(collectionName);
    const modeId = getOrCreateMode(collection);
    
    // Determine variable type
    let variableType;
    if (category === 'colors' || category === 'shadow') {
      variableType = 'COLOR';
    } else {
      variableType = 'FLOAT';
    }
    
    console.log(`\nProcessing ${category} category (${tokens.length} tokens)...`);
    
    // Create variables for this category
    for (const token of tokens) {
      const created = createVariable(collection, token, modeId, variableType);
      if (created) {
        totalCreated++;
      }
    }
  }
  
  console.log(`\n✅ Successfully added ${totalCreated} design system variables to Figma!`);
  figma.notify(`✅ Added ${totalCreated} design system variables to Figma!`, { timeout: 3000 });
  
  return totalCreated;
}

// Export for use in plugins
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addDesignSystemVariablesToFigma, designTokens };
}

// Auto-run if in Figma plugin context
if (typeof figma !== 'undefined') {
  addDesignSystemVariablesToFigma().catch(error => {
    console.error('Error adding variables:', error);
    figma.notify('❌ Error adding variables. Check console for details.', { timeout: 5000 });
  });
}










