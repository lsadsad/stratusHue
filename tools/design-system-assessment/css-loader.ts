/**
 * CSS Loader - Utility for loading and processing CSS content
 * 
 * This module provides utilities to load CSS content from files or strings
 * and prepare it for token parsing.
 */

/**
 * Load CSS content from a file path (for Node.js environments)
 */
export async function loadCSSFromFile(filePath: string): Promise<string> {
  try {
    // In a browser environment, we'll need to fetch the file
    if (typeof window !== 'undefined') {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load CSS file: ${response.statusText}`);
      }
      return await response.text();
    }
    
    // In Node.js environment
    const fs = await import('fs');
    const path = await import('path');
    
    const fullPath = path.resolve(filePath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load CSS file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load CSS content from the default styles.css location
 */
export async function loadDefaultCSS(): Promise<string> {
  // Try different possible paths for styles.css
  const possiblePaths = [
    'src/styles.css',
    '../styles.css',
    './styles.css',
    '../../src/styles.css'
  ];
  
  for (const path of possiblePaths) {
    try {
      return await loadCSSFromFile(path);
    } catch (error) {
      // Continue to next path
      continue;
    }
  }
  
  throw new Error('Could not find styles.css file in any of the expected locations');
}

/**
 * Clean and normalize CSS content for parsing
 */
export function cleanCSSContent(cssContent: string): string {
  return cssContent
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove single-line comments (but preserve CSS custom property comments)
    .replace(/\/\/.*$/gm, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove empty lines
    .replace(/\n\s*\n/g, '\n')
    // Trim
    .trim();
}

/**
 * Extract CSS rules by selector pattern
 */
export function extractCSSRules(cssContent: string, selectorPattern: string): string[] {
  const regex = new RegExp(`${selectorPattern}\\s*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, 'gs');
  const matches = [];
  let match;
  
  while ((match = regex.exec(cssContent)) !== null) {
    matches.push(match[0]);
  }
  
  return matches;
}

/**
 * Validate CSS content structure
 */
export function validateCSSContent(cssContent: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for basic CSS structure
  if (!cssContent.includes(':root')) {
    warnings.push('No :root selector found - may not contain CSS custom properties');
  }
  
  // Check for unmatched braces
  const openBraces = (cssContent.match(/\{/g) || []).length;
  const closeBraces = (cssContent.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
  }
  
  // Check for CSS custom properties
  const customProperties = cssContent.match(/--[^:]+:/g);
  if (!customProperties || customProperties.length === 0) {
    warnings.push('No CSS custom properties found');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get CSS file statistics
 */
export function getCSSStats(cssContent: string): {
  totalLines: number;
  totalCharacters: number;
  customProperties: number;
  selectors: number;
  themes: number;
} {
  const lines = cssContent.split('\n');
  const customProperties = (cssContent.match(/--[^:]+:/g) || []).length;
  const selectors = (cssContent.match(/[^{}]+\{/g) || []).length;
  const themes = (cssContent.match(/\[data-theme="[^"]+"\]/g) || []).length;
  
  return {
    totalLines: lines.length,
    totalCharacters: cssContent.length,
    customProperties,
    selectors,
    themes
  };
}

/**
 * Extract theme names from CSS content
 */
export function extractThemeNames(cssContent: string): string[] {
  const themeMatches = cssContent.matchAll(/\[data-theme="([^"]+)"\]/g);
  const themes = new Set<string>();
  
  for (const match of themeMatches) {
    themes.add(match[1]);
  }
  
  return Array.from(themes).sort();
}

/**
 * Minify CSS content (remove unnecessary whitespace and comments)
 */
export function minifyCSS(cssContent: string): string {
  return cssContent
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around braces and semicolons
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, '}')
    .trim();
}

/**
 * Format CSS content for better readability
 */
export function formatCSS(cssContent: string): string {
  return cssContent
    // Add newlines after closing braces
    .replace(/}/g, '}\n')
    // Add newlines after opening braces
    .replace(/{/g, '{\n  ')
    // Add proper indentation for properties
    .replace(/;/g, ';\n  ')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    // Remove trailing whitespace
    .replace(/\s+$/gm, '')
    .trim();
}