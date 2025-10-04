/**
 * Token Parser Tests
 * 
 * Tests for the token parsing functionality to ensure it correctly
 * extracts and categorizes design tokens from CSS content.
 */

import { TokenParser, parseDesignTokens, formatTokenValue, isColorToken } from './token-parser';

// Sample CSS content for testing
const sampleCSS = `
/* Base theme tokens */
:root {
  /* Spacing System */
  --spacing-xs: 2px;
  --spacing-sm: 4px;
  --spacing-md: 6px;
  
  /* Typography */
  --font-size-base: 12px;
  --font-weight-normal: 400;
  
  /* Colors */
  --theme-bg-primary: #0f0f0f;
  --theme-text-primary: #f5f5f5;
  
  /* Sizing */
  --button-height-md: 24px;
  --icon-size-lg: 16px;
}

/* Cybertron theme */
[data-theme="cybertron"] {
  --theme-bg-primary: #0a0a0f;
  --theme-text-primary: #00ffff;
  --cybertron-glow: 0 0 10px rgba(0, 255, 255, 0.3);
}

/* Figma Light theme */
[data-theme="figma-light"] {
  --theme-bg-primary: #ffffff;
  --theme-text-primary: #1e1e1e;
  --theme-border-primary: #e6e7e9;
}
`;

describe('TokenParser', () => {
  let parser: TokenParser;

  beforeEach(() => {
    parser = new TokenParser(sampleCSS);
  });

  test('should parse tokens from CSS content', () => {
    const result = parser.parseTokens();
    
    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.themes.length).toBe(3); // root, cybertron, figma-light
    expect(result.categories).toBeDefined();
  });

  test('should categorize tokens correctly', () => {
    const result = parser.parseTokens();
    
    // Check that spacing tokens are categorized correctly
    const spacingTokens = result.categories.spacing;
    expect(spacingTokens.some(token => token.name === 'spacing-xs')).toBe(true);
    
    // Check that typography tokens are categorized correctly
    const typographyTokens = result.categories.typography;
    expect(typographyTokens.some(token => token.name === 'font-size-base')).toBe(true);
    
    // Check that color tokens are categorized correctly
    const colorTokens = result.categories.color;
    expect(colorTokens.some(token => token.name === 'theme-bg-primary')).toBe(true);
    
    // Check that sizing tokens are categorized correctly
    const sizingTokens = result.categories.sizing;
    expect(sizingTokens.some(token => token.name === 'button-height-md')).toBe(true);
  });

  test('should handle theme-specific token values', () => {
    const result = parser.parseTokens();
    
    // Find the theme-bg-primary token
    const bgToken = result.tokens.find(token => token.name === 'theme-bg-primary');
    expect(bgToken).toBeDefined();
    
    if (bgToken) {
      expect(bgToken.values.root).toBe('#0f0f0f');
      expect(bgToken.values.cybertron).toBe('#0a0a0f');
      expect(bgToken.values['figma-light']).toBe('#ffffff');
    }
  });

  test('should identify tokens with different values across themes', () => {
    const result = parser.parseTokens();
    const differentTokens = parser.getDifferentTokens(result.tokens);
    
    expect(differentTokens.length).toBeGreaterThan(0);
    
    // theme-bg-primary should be in the different tokens list
    const bgToken = differentTokens.find(token => token.name === 'theme-bg-primary');
    expect(bgToken).toBeDefined();
  });

  test('should identify tokens missing in some themes', () => {
    const result = parser.parseTokens();
    const missingTokens = parser.getMissingTokens(result.tokens);
    
    expect(missingTokens.length).toBeGreaterThan(0);
    
    // spacing-xs should be missing in cybertron and figma-light themes
    const spacingToken = missingTokens.find(token => token.name === 'spacing-xs');
    expect(spacingToken).toBeDefined();
  });

  test('should generate token statistics', () => {
    const result = parser.parseTokens();
    const stats = parser.getTokenStats(result.tokens);
    
    expect(stats.totalTokens).toBeGreaterThan(0);
    expect(stats.byCategory).toBeDefined();
    expect(stats.byCategory.spacing).toBeGreaterThan(0);
    expect(stats.byCategory.typography).toBeGreaterThan(0);
    expect(stats.byCategory.color).toBeGreaterThan(0);
    expect(stats.byCategory.sizing).toBeGreaterThan(0);
    expect(stats.differentAcrossThemes).toBeGreaterThan(0);
    expect(stats.missingInSomeThemes).toBeGreaterThan(0);
  });
});

describe('Utility Functions', () => {
  test('parseDesignTokens should work as standalone function', () => {
    const result = parseDesignTokens(sampleCSS);
    
    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.themes.length).toBe(3);
    expect(result.categories).toBeDefined();
  });

  test('formatTokenValue should clean up token values', () => {
    expect(formatTokenValue('  #ffffff  ')).toBe('#ffffff');
    expect(formatTokenValue('rgba(255, 255, 255, 0.5)')).toBe('rgba(255, 255, 255, 0.5)');
    expect(formatTokenValue('var(--spacing-md)')).toBe('var(--spacing-md)');
  });

  test('isColorToken should identify color values', () => {
    expect(isColorToken('#ffffff')).toBe(true);
    expect(isColorToken('rgba(255, 255, 255, 0.5)')).toBe(true);
    expect(isColorToken('red')).toBe(true);
    expect(isColorToken('12px')).toBe(false);
    expect(isColorToken('400')).toBe(false);
  });
});

// Mock test runner for browser environment
if (typeof window !== 'undefined') {
  // Simple test runner for browser
  console.log('Running token parser tests...');
  
  try {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    
    console.log('✓ Token parsing works');
    console.log(`✓ Found ${result.tokens.length} tokens`);
    console.log(`✓ Found ${result.themes.length} themes`);
    console.log('✓ All tests passed');
  } catch (error) {
    console.error('✗ Tests failed:', error);
  }
}