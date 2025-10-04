/**
 * Design System Assessment Integration Tests
 * 
 * Tests the integration between token parsing, comparison table,
 * and component preview systems.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { analyzeDesignSystem, createComparisonTable, createComponentPreview } from './index.js';
import { allComponents } from './component-definitions.js';

// Mock DOM environment
const mockContainer = () => {
  const container = document.createElement('div');
  container.id = 'integration-test-container';
  document.body.appendChild(container);
  return container;
};

const mockThemes = [
  { name: 'boilerplate', selector: ':root', displayName: 'Base/Boilerplate' },
  { name: 'cybertron', selector: '[data-theme="cybertron"]', displayName: 'Cybertron' },
  { name: 'figma-light', selector: '[data-theme="figma-light"]', displayName: 'Figma Light' }
];

describe('Design System Assessment Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = mockContainer();
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clean up any added styles
    const styleElements = document.querySelectorAll('style[id*="test"], style[id*="comparison"], style[id*="component"]');
    styleElements.forEach(el => el.remove());
  });

  describe('Full System Integration', () => {
    it('should analyze design system and create both comparison table and component preview', async () => {
      // Analyze the design system
      const analysis = await analyzeDesignSystem();
      
      expect(analysis.tokens).toBeDefined();
      expect(analysis.tokens.tokens.length).toBeGreaterThan(0);
      expect(analysis.tokens.themes.length).toBeGreaterThan(0);
      
      // Create comparison table
      const comparisonContainer = document.createElement('div');
      container.appendChild(comparisonContainer);
      
      const comparisonTable = createComparisonTable(
        comparisonContainer,
        analysis.tokens.tokens,
        analysis.tokens.themes
      );
      
      expect(comparisonTable).toBeDefined();
      expect(comparisonContainer.querySelector('.comparison-table')).toBeTruthy();
      
      // Create component preview
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        analysis.tokens.themes
      );
      
      expect(componentPreview).toBeDefined();
      expect(previewContainer.classList.contains('component-preview')).toBe(true);
    });

    it('should handle theme switching across both systems', async () => {
      const analysis = await analyzeDesignSystem();
      
      // Create both systems
      const comparisonContainer = document.createElement('div');
      const previewContainer = document.createElement('div');
      container.appendChild(comparisonContainer);
      container.appendChild(previewContainer);
      
      const comparisonTable = createComparisonTable(
        comparisonContainer,
        analysis.tokens.tokens,
        analysis.tokens.themes
      );
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        analysis.tokens.themes,
        {
          onThemeChange: (theme) => {
            // Simulate coordinated theme switching
            document.body.setAttribute('data-theme', theme);
          }
        }
      );
      
      // Test theme switching
      componentPreview.switchTheme('cybertron');
      expect(componentPreview.getCurrentTheme()).toBe('cybertron');
      expect(document.body.getAttribute('data-theme')).toBe('cybertron');
      
      componentPreview.switchTheme('figma-light');
      expect(componentPreview.getCurrentTheme()).toBe('figma-light');
      expect(document.body.getAttribute('data-theme')).toBe('figma-light');
    });

    it('should work with filtered tokens and components', async () => {
      const analysis = await analyzeDesignSystem();
      
      // Filter to only color tokens
      const colorTokens = analysis.tokens.tokens.filter(token => token.category === 'color');
      expect(colorTokens.length).toBeGreaterThan(0);
      
      // Filter to only button components
      const buttonComponents = allComponents.filter(component => component.category === 'buttons');
      expect(buttonComponents.length).toBeGreaterThan(0);
      
      // Create systems with filtered data
      const comparisonContainer = document.createElement('div');
      const previewContainer = document.createElement('div');
      container.appendChild(comparisonContainer);
      container.appendChild(previewContainer);
      
      const comparisonTable = createComparisonTable(
        comparisonContainer,
        colorTokens,
        analysis.tokens.themes,
        { showDifferencesOnly: true }
      );
      
      const componentPreview = createComponentPreview(
        previewContainer,
        buttonComponents,
        analysis.tokens.themes,
        { compactMode: true }
      );
      
      expect(comparisonTable).toBeDefined();
      expect(componentPreview).toBeDefined();
      
      // Verify filtering worked
      const tokenRows = comparisonContainer.querySelectorAll('.comparison-table__row');
      expect(tokenRows.length).toBeLessThanOrEqual(colorTokens.length);
      
      const componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(buttonComponents.length);
    });
  });

  describe('Data Consistency', () => {
    it('should have consistent theme definitions across systems', async () => {
      const analysis = await analyzeDesignSystem();
      
      // Check that parsed themes match expected themes
      const parsedThemeNames = analysis.tokens.themes.map(theme => theme.name);
      const expectedThemeNames = mockThemes.map(theme => theme.name);
      
      // Should have at least the base theme
      expect(parsedThemeNames).toContain('boilerplate');
      
      // All parsed themes should be valid
      analysis.tokens.themes.forEach(theme => {
        expect(theme.name).toBeDefined();
        expect(theme.displayName).toBeDefined();
        expect(typeof theme.name).toBe('string');
        expect(typeof theme.displayName).toBe('string');
      });
    });

    it('should have tokens that match component usage', async () => {
      const analysis = await analyzeDesignSystem();
      
      // Check for common tokens that components should use
      const tokenNames = analysis.tokens.tokens.map(token => token.name);
      
      // Should have spacing tokens
      expect(tokenNames.some(name => name.includes('spacing'))).toBe(true);
      
      // Should have color tokens
      expect(tokenNames.some(name => name.includes('theme-bg') || name.includes('theme-text'))).toBe(true);
      
      // Should have typography tokens
      expect(tokenNames.some(name => name.includes('font-size') || name.includes('font-weight'))).toBe(true);
      
      // Should have component sizing tokens
      expect(tokenNames.some(name => name.includes('button-height') || name.includes('icon-size'))).toBe(true);
    });

    it('should generate valid component HTML that uses design tokens', () => {
      allComponents.forEach(component => {
        component.states.forEach(state => {
          const html = component.template(state);
          
          // Should contain the base class
          expect(html).toContain(component.baseClass);
          
          // Should be valid HTML (basic check - allow multiline)
          expect(html).toMatch(/^<[^>]+>[\s\S]*<\/[^>]+>$/);
          
          // For button components, should have proper button structure
          if (component.category === 'buttons') {
            expect(html).toMatch(/<button[^>]*>/);
          }
        });
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large numbers of tokens efficiently', async () => {
      const analysis = await analyzeDesignSystem();
      
      const startTime = performance.now();
      
      // Create comparison table with all tokens
      const comparisonContainer = document.createElement('div');
      container.appendChild(comparisonContainer);
      
      const comparisonTable = createComparisonTable(
        comparisonContainer,
        analysis.tokens.tokens,
        analysis.tokens.themes
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in reasonable time (less than 100ms for typical token counts)
      expect(renderTime).toBeLessThan(100);
      
      // Should have created the expected DOM structure
      expect(comparisonContainer.querySelector('.comparison-table')).toBeTruthy();
      expect(comparisonContainer.querySelectorAll('.comparison-table__row').length).toBeGreaterThan(0);
    });

    it('should handle component preview rendering efficiently', () => {
      const startTime = performance.now();
      
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in reasonable time
      expect(renderTime).toBeLessThan(50);
      
      // Should have created the expected DOM structure
      expect(previewContainer.classList.contains('component-preview')).toBe(true);
      expect(previewContainer.querySelectorAll('.component-preview__component').length).toBe(allComponents.length);
    });

    it('should clean up properly when components are destroyed', () => {
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes
      );
      
      // Verify styles were added
      const styleElement = document.getElementById('component-preview-styles');
      expect(styleElement).toBeTruthy();
      
      // Remove container (simulating component destruction)
      container.removeChild(previewContainer);
      
      // Component should still be functional for other instances
      const newContainer = document.createElement('div');
      container.appendChild(newContainer);
      
      const newPreview = createComponentPreview(
        newContainer,
        allComponents.slice(0, 2), // Smaller subset
        mockThemes
      );
      
      expect(newPreview).toBeDefined();
      expect(newContainer.classList.contains('component-preview')).toBe(true);
    });
  });
});