/**
 * Simple Test Runner for Token Parser
 * 
 * A basic test runner to verify the token parsing functionality works correctly.
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

function runTests(): void {
  console.log('🧪 Running Token Parser Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name: string, testFn: () => void): void {
    try {
      testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }
  
  function expect(actual: any): {
    toBe: (expected: any) => void;
    toBeGreaterThan: (expected: number) => void;
    toBeDefined: () => void;
  } {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      toBeGreaterThan: (expected: number) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined || actual === null) {
          throw new Error(`Expected ${actual} to be defined`);
        }
      }
    };
  }
  
  // Test 1: Basic token parsing
  test('should parse tokens from CSS content', () => {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    
    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.themes.length).toBe(3);
    expect(result.categories).toBeDefined();
  });
  
  // Test 2: Token categorization
  test('should categorize tokens correctly', () => {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    
    const spacingTokens = result.categories.spacing;
    const hasSpacingXs = spacingTokens.some(token => token.name === 'spacing-xs');
    if (!hasSpacingXs) {
      throw new Error('spacing-xs token not found in spacing category');
    }
    
    const typographyTokens = result.categories.typography;
    const hasFontSize = typographyTokens.some(token => token.name === 'font-size-base');
    if (!hasFontSize) {
      throw new Error('font-size-base token not found in typography category');
    }
  });
  
  // Test 3: Theme-specific values
  test('should handle theme-specific token values', () => {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    
    const bgToken = result.tokens.find(token => token.name === 'theme-bg-primary');
    if (!bgToken) {
      throw new Error('theme-bg-primary token not found');
    }
    
    expect(bgToken.values.root).toBe('#0f0f0f');
    expect(bgToken.values.cybertron).toBe('#0a0a0f');
    expect(bgToken.values['figma-light']).toBe('#ffffff');
  });
  
  // Test 4: Different tokens detection
  test('should identify tokens with different values across themes', () => {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    const differentTokens = parser.getDifferentTokens(result.tokens);
    
    expect(differentTokens.length).toBeGreaterThan(0);
    
    const bgToken = differentTokens.find(token => token.name === 'theme-bg-primary');
    if (!bgToken) {
      throw new Error('theme-bg-primary should be in different tokens list');
    }
  });
  
  // Test 5: Missing tokens detection
  test('should identify tokens missing in some themes', () => {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    const missingTokens = parser.getMissingTokens(result.tokens);
    
    expect(missingTokens.length).toBeGreaterThan(0);
  });
  
  // Test 6: Statistics generation
  test('should generate token statistics', () => {
    const parser = new TokenParser(sampleCSS);
    const result = parser.parseTokens();
    const stats = parser.getTokenStats(result.tokens);
    
    expect(stats.totalTokens).toBeGreaterThan(0);
    expect(stats.byCategory).toBeDefined();
    expect(stats.differentAcrossThemes).toBeGreaterThan(0);
  });
  
  // Test 7: Utility functions
  test('parseDesignTokens standalone function should work', () => {
    const result = parseDesignTokens(sampleCSS);
    expect(result.tokens.length).toBeGreaterThan(0);
  });
  
  test('formatTokenValue should clean up values', () => {
    expect(formatTokenValue('  #ffffff  ')).toBe('#ffffff');
    expect(formatTokenValue('rgba(255, 255, 255, 0.5)')).toBe('rgba(255, 255, 255, 0.5)');
  });
  
  test('isColorToken should identify colors', () => {
    if (!isColorToken('#ffffff')) {
      throw new Error('#ffffff should be identified as color');
    }
    if (!isColorToken('rgba(255, 255, 255, 0.5)')) {
      throw new Error('rgba value should be identified as color');
    }
    if (isColorToken('12px')) {
      throw new Error('12px should not be identified as color');
    }
  });
  
  // Summary
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}

export { runTests };