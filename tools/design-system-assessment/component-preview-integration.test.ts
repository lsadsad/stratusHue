/**
 * Component Preview Integration Tests
 * 
 * Tests the integration between component preview system and component definitions
 * without relying on file system access.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createComponentPreview, createComparisonTable } from './index.js';
import { allComponents, getComponentsByCategory } from './component-definitions.js';

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

const mockTokens = [
  {
    name: 'spacing-md',
    category: 'spacing',
    values: { 'boilerplate': '6px', 'cybertron': '8px', 'figma-light': '6px' },
    usage: [],
    description: 'Medium spacing value'
  },
  {
    name: 'theme-bg-primary',
    category: 'color',
    values: { 'boilerplate': '#ffffff', 'cybertron': '#1a1a1a', 'figma-light': '#ffffff' },
    usage: [],
    description: 'Primary background color'
  }
];

describe('Component Preview Integration', () => {
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

  describe('Component Preview and Comparison Table Integration', () => {
    it('should create both systems side by side', () => {
      // Create comparison table
      const comparisonContainer = document.createElement('div');
      container.appendChild(comparisonContainer);
      
      const comparisonTable = createComparisonTable(
        comparisonContainer,
        mockTokens,
        mockThemes
      );
      
      expect(comparisonTable).toBeDefined();
      expect(comparisonContainer.classList.contains('comparison-table')).toBe(true);
      
      // Create component preview
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes
      );
      
      expect(componentPreview).toBeDefined();
      expect(previewContainer.classList.contains('component-preview')).toBe(true);
      
      // Both should coexist
      expect(container.children.length).toBe(2);
    });

    it('should handle coordinated theme switching', () => {
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      let themeChangeCount = 0;
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes,
        {
          onThemeChange: (theme) => {
            themeChangeCount++;
            document.body.setAttribute('data-theme', theme);
          }
        }
      );
      
      // Test theme switching
      componentPreview.switchTheme('cybertron');
      expect(componentPreview.getCurrentTheme()).toBe('cybertron');
      expect(document.body.getAttribute('data-theme')).toBe('cybertron');
      expect(themeChangeCount).toBe(1);
      
      componentPreview.switchTheme('figma-light');
      expect(componentPreview.getCurrentTheme()).toBe('figma-light');
      expect(document.body.getAttribute('data-theme')).toBe('figma-light');
      expect(themeChangeCount).toBe(2);
    });

    it('should work with filtered component categories', () => {
      const buttonComponents = getComponentsByCategory('buttons');
      expect(buttonComponents.length).toBeGreaterThan(0);
      
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        buttonComponents,
        mockThemes
      );
      
      expect(componentPreview).toBeDefined();
      
      // Should only show button components
      const componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(buttonComponents.length);
      
      // All cards should be button components
      const componentNames = Array.from(componentCards).map(card => {
        const nameElement = card.querySelector('.component-preview__component-name');
        return nameElement?.textContent;
      });
      
      buttonComponents.forEach(component => {
        expect(componentNames).toContain(component.name);
      });
    });
  });

  describe('Component Definition Validation', () => {
    it('should have valid component definitions for all categories', () => {
      const categories = ['buttons', 'inputs', 'containers', 'navigation', 'typography'];
      
      categories.forEach(category => {
        const components = getComponentsByCategory(category);
        expect(components.length).toBeGreaterThan(0);
        
        components.forEach(component => {
          expect(component.name).toBeDefined();
          expect(component.category).toBe(category);
          expect(component.description).toBeDefined();
          expect(component.baseClass).toBeDefined();
          expect(component.states).toBeDefined();
          expect(component.template).toBeDefined();
          expect(Array.isArray(component.states)).toBe(true);
          expect(component.states.length).toBeGreaterThan(0);
          expect(typeof component.template).toBe('function');
        });
      });
    });

    it('should generate valid HTML from all component templates', () => {
      allComponents.forEach(component => {
        component.states.forEach(state => {
          const html = component.template(state);
          
          expect(typeof html).toBe('string');
          expect(html.length).toBeGreaterThan(0);
          
          // Should contain the base class
          expect(html).toContain(component.baseClass);
          
          // Should be valid HTML (basic check - allow multiline)
          expect(html).toMatch(/^<[^>]+>[\s\S]*<\/[^>]+>$/);
          
          // For button components, should have proper button structure
          if (component.category === 'buttons') {
            expect(html).toMatch(/<button[^>]*>/);
          }
          
          // For input components, should have proper input structure
          if (component.category === 'inputs') {
            expect(html).toMatch(/<input[^>]*>|<label[^>]*>/);
          }
        });
      });
    });

    it('should have consistent state naming across components', () => {
      const commonStates = ['default', 'hover', 'active', 'disabled'];
      
      allComponents.forEach(component => {
        const stateNames = component.states.map(state => state.name);
        
        // Should have at least a default state
        expect(stateNames).toContain('default');
        
        // Check for common states (not all components need all states)
        stateNames.forEach(stateName => {
          expect(typeof stateName).toBe('string');
          expect(stateName.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Theme Integration', () => {
    it('should handle theme switching across all component categories', () => {
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes
      );
      
      // Test switching to each theme
      mockThemes.forEach(theme => {
        componentPreview.switchTheme(theme.name);
        expect(componentPreview.getCurrentTheme()).toBe(theme.name);
        expect(document.body.getAttribute('data-theme')).toBe(theme.name);
        
        // Theme select should be updated
        const select = previewContainer.querySelector('.component-preview__theme-select') as HTMLSelectElement;
        expect(select?.value).toBe(theme.name);
      });
    });

    it('should maintain component functionality across theme switches', () => {
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes,
        { showStates: true, showCode: false }
      );
      
      // Switch themes and verify components are still rendered
      componentPreview.switchTheme('cybertron');
      
      let componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(allComponents.length);
      
      componentPreview.switchTheme('figma-light');
      
      componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(allComponents.length);
      
      // States should still be visible
      const stateLabels = previewContainer.querySelectorAll('.component-preview__state-label');
      expect(stateLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Usability', () => {
    it('should render all components efficiently', () => {
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
      
      // Should render in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Should have created all expected components
      const componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(allComponents.length);
    });

    it('should handle option updates efficiently', () => {
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const componentPreview = createComponentPreview(
        previewContainer,
        allComponents,
        mockThemes,
        { showStates: false, showCode: false }
      );
      
      // Initial state - no state labels or code blocks
      let stateLabels = previewContainer.querySelectorAll('.component-preview__state-label');
      let codeBlocks = previewContainer.querySelectorAll('.component-preview__code');
      expect(stateLabels.length).toBe(0);
      expect(codeBlocks.length).toBe(0);
      
      // Update options
      const startTime = performance.now();
      componentPreview.updateOptions({ showStates: true, showCode: true });
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should update quickly
      expect(updateTime).toBeLessThan(50);
      
      // Should now show states and code
      stateLabels = previewContainer.querySelectorAll('.component-preview__state-label');
      codeBlocks = previewContainer.querySelectorAll('.component-preview__code');
      expect(stateLabels.length).toBeGreaterThan(0);
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it('should handle component updates', () => {
      const previewContainer = document.createElement('div');
      container.appendChild(previewContainer);
      
      const buttonComponents = getComponentsByCategory('buttons');
      const componentPreview = createComponentPreview(
        previewContainer,
        buttonComponents,
        mockThemes
      );
      
      // Initial state - only button components
      let componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(buttonComponents.length);
      
      // Update with all components
      componentPreview.updateComponents(allComponents);
      
      // Should now show all components
      componentCards = previewContainer.querySelectorAll('.component-preview__component');
      expect(componentCards.length).toBe(allComponents.length);
    });
  });
});