/**
 * Theme Testing Interface - Integration Tests
 * 
 * Tests integration with existing design system assessment components
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ThemeTestingInterface, createThemeTestingInterface } from './theme-testing';
import { parseDesignTokens, TokenParser } from './token-parser';
import { allComponents } from './component-definitions';
import { loadDefaultCSS } from './css-loader';

// Mock DOM environment for integration tests
const mockDocument = {
  createElement: (tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      className: '',
      id: '',
      innerHTML: '',
      textContent: '',
      style: {},
      children: [],
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      removeChild: vi.fn(),
      insertBefore: vi.fn(),
      cloneNode: vi.fn(() => ({ ...element }))
    };
    return element;
  },
  getElementById: vi.fn(),
  head: {
    appendChild: vi.fn()
  },
  body: {
    setAttribute: vi.fn(),
    getAttribute: vi.fn()
  }
};

global.document = mockDocument as any;

describe('Theme Testing Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    
    container = {
      innerHTML: '',
      className: '',
      appendChild: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    } as any;
  });

  describe('Integration with Token Parser', () => {
    test('should work with real CSS token parsing', async () => {
      // Sample CSS content similar to the real styles.css
      const sampleCSS = `
        :root {
          --spacing-md: 6px;
          --font-size-md: 12px;
          --theme-bg-primary: #ffffff;
          --theme-text-primary: #333333;
          --border-radius-sm: 3px;
        }

        [data-theme="boilerplate"] {
          --theme-bg-primary: #0f0f0f;
          --theme-text-primary: #ffffff;
        }

        [data-theme="cybertron"] {
          --theme-bg-primary: #0a0a0f;
          --theme-text-primary: #00ffff;
        }

        [data-theme="figma-light"] {
          --theme-bg-primary: #ffffff;
          --theme-text-primary: #333333;
        }
      `;

      // Parse tokens using the real token parser
      const parsedTokens = parseDesignTokens(sampleCSS);
      
      expect(parsedTokens.tokens.length).toBeGreaterThan(0);
      expect(parsedTokens.themes.length).toBeGreaterThan(0);

      // Create theme testing interface with parsed data
      const themeInterface = createThemeTestingInterface(
        container,
        parsedTokens.themes,
        parsedTokens.tokens,
        allComponents.slice(0, 3) // Use first 3 components for testing
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
      expect(themeInterface.getCurrentTheme()).toBe(parsedTokens.themes[0].name);

      // Test theme switching with real data
      if (parsedTokens.themes.length > 1) {
        await themeInterface.switchTheme(parsedTokens.themes[1].name);
        expect(themeInterface.getCurrentTheme()).toBe(parsedTokens.themes[1].name);
      }

      // Test validation with real tokens
      await themeInterface.validateAllThemes();
      const validationResults = themeInterface.getValidationResults();
      expect(validationResults.length).toBe(parsedTokens.tokens.length);
    });

    test('should identify real token inconsistencies', async () => {
      // CSS with intentional inconsistencies
      const inconsistentCSS = `
        :root {
          --spacing-md: 6px;
          --theme-bg-primary: #ffffff;
        }

        [data-theme="boilerplate"] {
          --spacing-md: 6px;
          --theme-bg-primary: #0f0f0f;
        }

        [data-theme="cybertron"] {
          --spacing-md: 6px;
          /* Missing theme-bg-primary */
        }

        [data-theme="figma-light"] {
          --spacing-md: 8px; /* Different value */
          --theme-bg-primary: #ffffff;
        }
      `;

      const parsedTokens = parseDesignTokens(inconsistentCSS);
      
      const themeInterface = createThemeTestingInterface(
        container,
        parsedTokens.themes,
        parsedTokens.tokens,
        []
      );

      // Test each theme and collect errors
      for (const theme of parsedTokens.themes) {
        await themeInterface.switchTheme(theme.name);
        await themeInterface.validateAllThemes();
      }

      const errors = themeInterface.getErrors();
      
      // Should find missing token error
      const missingTokenErrors = errors.filter(e => 
        e.type === 'token-resolution' && e.message.includes('not defined')
      );
      expect(missingTokenErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Component Definitions', () => {
    test('should work with real component definitions', async () => {
      // Use real component definitions
      const realComponents = allComponents.slice(0, 5);
      
      // Simple theme setup
      const themes = [
        { name: 'boilerplate', displayName: 'Boilerplate', description: 'Dark theme' },
        { name: 'figma-light', displayName: 'Figma Light', description: 'Light theme' }
      ];

      const tokens = [
        {
          name: 'theme-bg-primary',
          category: 'color' as const,
          values: { 'boilerplate': '#0f0f0f', 'figma-light': '#ffffff' }
        },
        {
          name: 'theme-text-primary',
          category: 'color' as const,
          values: { 'boilerplate': '#ffffff', 'figma-light': '#333333' }
        }
      ];

      const themeInterface = createThemeTestingInterface(
        container,
        themes,
        tokens,
        realComponents
      );

      // Test component rendering across themes
      await themeInterface.testAllComponents();
      
      // Should complete without major errors
      const errors = themeInterface.getErrors();
      const criticalErrors = errors.filter(e => e.severity === 'high');
      
      // Allow some errors but not critical ones in this basic test
      expect(criticalErrors.length).toBe(0);
    });

    test('should handle component template errors gracefully', async () => {
      // Create a component with a problematic template
      const problematicComponent = {
        name: 'Problematic Component',
        category: 'other' as const,
        description: 'Component with template issues',
        baseClass: 'problematic',
        states: [
          {
            name: 'default',
            label: 'Default',
            content: 'Test'
          }
        ],
        template: (state: any) => {
          // This will cause an error
          throw new Error('Template rendering failed');
        }
      };

      const themes = [
        { name: 'test', displayName: 'Test', description: 'Test theme' }
      ];

      const tokens = [
        {
          name: 'test-token',
          category: 'color' as const,
          values: { 'test': '#000000' }
        }
      ];

      const themeInterface = createThemeTestingInterface(
        container,
        themes,
        tokens,
        [problematicComponent]
      );

      // Test components - should handle errors gracefully
      await themeInterface.testAllComponents();
      
      const errors = themeInterface.getErrors();
      const componentErrors = errors.filter(e => e.type === 'component-render');
      
      expect(componentErrors.length).toBeGreaterThan(0);
      expect(componentErrors[0].component).toBe('Problematic Component');
    });
  });

  describe('Full Workflow Integration', () => {
    test('should support complete design system assessment workflow', async () => {
      // Simulate a complete workflow with real-like data
      const fullCSS = `
        /* Base tokens */
        :root {
          --spacing-xs: 2px;
          --spacing-sm: 4px;
          --spacing-md: 6px;
          --spacing-lg: 8px;
          
          --font-size-xs: 10px;
          --font-size-sm: 11px;
          --font-size-md: 12px;
          
          --border-radius-sm: 3px;
          --border-radius-md: 4px;
          
          --theme-bg-primary: #ffffff;
          --theme-bg-secondary: #f8f9fa;
          --theme-text-primary: #333333;
          --theme-text-secondary: #666666;
          --theme-border-primary: #e1e5e9;
          --theme-info: #007acc;
        }

        /* Boilerplate theme */
        [data-theme="boilerplate"] {
          --theme-bg-primary: #0f0f0f;
          --theme-bg-secondary: #1a1a1a;
          --theme-text-primary: #ffffff;
          --theme-text-secondary: #cccccc;
          --theme-border-primary: #333333;
        }

        /* Cybertron theme */
        [data-theme="cybertron"] {
          --theme-bg-primary: #0a0a0f;
          --theme-bg-secondary: #141420;
          --theme-text-primary: #00ffff;
          --theme-text-secondary: #00ccff;
          --theme-border-primary: #00ccff;
        }

        /* Figma light theme */
        [data-theme="figma-light"] {
          --theme-bg-primary: #ffffff;
          --theme-bg-secondary: #f8f9fa;
          --theme-text-primary: #333333;
          --theme-text-secondary: #666666;
          --theme-border-primary: #e1e5e9;
        }
      `;

      // 1. Parse tokens
      const parsedTokens = parseDesignTokens(fullCSS);
      expect(parsedTokens.tokens.length).toBeGreaterThan(10);
      expect(parsedTokens.themes.length).toBe(3); // 3 themes (root is not included as a separate theme)

      // 2. Create theme testing interface
      const themeInterface = createThemeTestingInterface(
        container,
        parsedTokens.themes,
        parsedTokens.tokens,
        allComponents.slice(0, 4)
      );

      // 3. Test all themes
      for (const theme of parsedTokens.themes) {
        await themeInterface.switchTheme(theme.name);
        expect(themeInterface.getCurrentTheme()).toBe(theme.name);
      }

      // 4. Validate all themes
      await themeInterface.validateAllThemes();
      const validationResults = themeInterface.getValidationResults();
      
      // Should have validation results for all tokens
      expect(validationResults.length).toBe(parsedTokens.tokens.length);
      
      // Some tokens should be valid (themes may not have all tokens defined)
      const validTokens = validationResults.filter(r => r.resolved);
      expect(validTokens.length).toBeGreaterThan(0);

      // 5. Test components
      await themeInterface.testAllComponents();
      
      // 6. Check final state
      const finalState = themeInterface.getState();
      expect(finalState.availableThemes.length).toBe(parsedTokens.themes.length);
      expect(finalState.validationResults.length).toBe(parsedTokens.tokens.length);
      
      // Should have completed without critical errors
      const errors = themeInterface.getErrors();
      const criticalErrors = errors.filter(e => e.severity === 'high');
      expect(criticalErrors.length).toBe(0);
    });

    test('should provide comprehensive error reporting', async () => {
      // CSS with multiple types of issues
      const problematicCSS = `
        :root {
          --valid-token: #ffffff;
          --empty-token: ;
          --space-only-token:    ;
        }

        [data-theme="theme1"] {
          --valid-token: #000000;
          --empty-token: #111111;
          /* Missing space-only-token */
        }

        [data-theme="theme2"] {
          --valid-token: #222222;
          /* Missing both empty-token and space-only-token */
        }
      `;

      const parsedTokens = parseDesignTokens(problematicCSS);
      
      const themeInterface = createThemeTestingInterface(
        container,
        parsedTokens.themes,
        parsedTokens.tokens,
        []
      );

      // Test all themes to generate comprehensive errors
      for (const theme of parsedTokens.themes) {
        await themeInterface.switchTheme(theme.name);
        await themeInterface.validateAllThemes();
      }

      const errors = themeInterface.getErrors();
      
      // Should have multiple types of errors
      const errorTypes = new Set(errors.map(e => e.type));
      expect(errorTypes.has('token-resolution')).toBe(true);
      
      // Should have different severity levels
      const severityLevels = new Set(errors.map(e => e.severity));
      expect(severityLevels.size).toBeGreaterThan(1);
      
      // Should provide detailed error information
      errors.forEach(error => {
        expect(error.message).toBeTruthy();
        expect(error.theme).toBeTruthy();
        expect(['token-resolution', 'component-render', 'css-parse', 'theme-switch']).toContain(error.type);
        expect(['low', 'medium', 'high']).toContain(error.severity);
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large numbers of tokens efficiently', async () => {
      // Generate a large number of tokens
      const manyTokens = [];
      const themes = [
        { name: 'theme1', displayName: 'Theme 1', description: 'First theme' },
        { name: 'theme2', displayName: 'Theme 2', description: 'Second theme' }
      ];

      for (let i = 0; i < 100; i++) {
        manyTokens.push({
          name: `token-${i}`,
          category: 'color' as const,
          values: {
            'theme1': `#${i.toString(16).padStart(6, '0')}`,
            'theme2': `#${(i * 2).toString(16).padStart(6, '0')}`
          }
        });
      }

      const startTime = Date.now();
      
      const themeInterface = createThemeTestingInterface(
        container,
        themes,
        manyTokens,
        []
      );

      await themeInterface.validateAllThemes();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second for 100 tokens)
      expect(duration).toBeLessThan(1000);
      
      const validationResults = themeInterface.getValidationResults();
      expect(validationResults.length).toBe(100);
    });

    test('should cache validation results effectively', async () => {
      const themes = [
        { name: 'test', displayName: 'Test', description: 'Test theme' }
      ];

      const tokens = Array.from({ length: 50 }, (_, i) => ({
        name: `token-${i}`,
        category: 'color' as const,
        values: { 'test': `#${i.toString(16).padStart(6, '0')}` }
      }));

      const themeInterface = createThemeTestingInterface(
        container,
        themes,
        tokens,
        []
      );

      // First validation
      const startTime1 = Date.now();
      await themeInterface.validateAllThemes();
      const duration1 = Date.now() - startTime1;

      // Second validation (should use cache)
      const startTime2 = Date.now();
      await themeInterface.validateAllThemes();
      const duration2 = Date.now() - startTime2;

      // Second validation should be significantly faster due to caching (or at least not slower)
      expect(duration2).toBeLessThanOrEqual(duration1);
      
      // Results should be identical
      const results1 = themeInterface.getValidationResults();
      const results2 = themeInterface.getValidationResults();
      expect(results1).toEqual(results2);
    });
  });
});