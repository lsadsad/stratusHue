/**
 * Component Preview System Tests
 * 
 * Tests for the component preview system functionality including
 * component definitions, theme switching, and rendering.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentPreview, createComponentPreview, type ComponentDefinition, type ComponentState } from './component-preview.js';
import { allComponents, getComponentsByCategory, getComponentByName } from './component-definitions.js';

// Mock DOM environment
const mockContainer = () => {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
};

const mockThemes = [
  { name: 'boilerplate', selector: ':root', displayName: 'Base/Boilerplate' },
  { name: 'cybertron', selector: '[data-theme="cybertron"]', displayName: 'Cybertron' },
  { name: 'figma-light', selector: '[data-theme="figma-light"]', displayName: 'Figma Light' }
];

const mockComponents: ComponentDefinition[] = [
  {
    name: 'Test Button',
    category: 'buttons',
    description: 'A test button component',
    baseClass: 'test-btn',
    states: [
      { name: 'default', label: 'Default', content: 'Test' },
      { name: 'hover', label: 'Hover', modifiers: ['hover'], content: 'Test' }
    ],
    template: (state: ComponentState) => {
      const modifiers = state.modifiers ? state.modifiers.map(m => `test-btn--${m}`).join(' ') : '';
      return `<button class="test-btn ${modifiers}">${state.content}</button>`;
    }
  }
];

describe('ComponentPreview', () => {
  let container: HTMLElement;
  let preview: ComponentPreview;

  beforeEach(() => {
    container = mockContainer();
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clean up any added styles
    const styleElement = document.getElementById('component-preview-styles');
    if (styleElement) {
      styleElement.remove();
    }
  });

  describe('Initialization', () => {
    it('should create a component preview instance', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes);
      expect(preview).toBeInstanceOf(ComponentPreview);
    });

    it('should render the preview container', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes);
      expect(container.classList.contains('component-preview')).toBe(true);
    });

    it('should create theme switcher', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes);
      const switcher = container.querySelector('.component-preview__theme-switcher');
      expect(switcher).toBeTruthy();
      
      const select = switcher?.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.options.length).toBe(3);
    });

    it('should create component grid', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes);
      const grid = container.querySelector('.component-preview__grid');
      expect(grid).toBeTruthy();
    });
  });

  describe('Theme Switching', () => {
    beforeEach(() => {
      preview = new ComponentPreview(container, mockComponents, mockThemes);
    });

    it('should switch themes correctly', () => {
      preview.switchTheme('cybertron');
      expect(preview.getCurrentTheme()).toBe('cybertron');
      expect(document.body.getAttribute('data-theme')).toBe('cybertron');
    });

    it('should update select value when theme changes', () => {
      preview.switchTheme('figma-light');
      const select = container.querySelector('.component-preview__theme-select') as HTMLSelectElement;
      expect(select?.value).toBe('figma-light');
    });

    it('should call onThemeChange callback', () => {
      let callbackTheme = '';
      const previewWithCallback = new ComponentPreview(
        container, 
        mockComponents, 
        mockThemes, 
        { onThemeChange: (theme) => { callbackTheme = theme; } }
      );
      
      previewWithCallback.switchTheme('cybertron');
      expect(callbackTheme).toBe('cybertron');
    });
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      preview = new ComponentPreview(container, mockComponents, mockThemes);
    });

    it('should render component cards', () => {
      const componentCard = container.querySelector('.component-preview__component');
      expect(componentCard).toBeTruthy();
    });

    it('should render component header with name and description', () => {
      const name = container.querySelector('.component-preview__component-name');
      const description = container.querySelector('.component-preview__component-description');
      
      expect(name?.textContent).toBe('Test Button');
      expect(description?.textContent).toBe('A test button component');
    });

    it('should render component states', () => {
      const states = container.querySelectorAll('.component-preview__state');
      expect(states.length).toBe(2); // default and hover states
    });

    it('should render state demos with correct HTML', () => {
      const demos = container.querySelectorAll('.component-preview__state-demo');
      expect(demos.length).toBe(2);
      
      const firstDemo = demos[0];
      const button = firstDemo.querySelector('button');
      expect(button?.className).toBe('test-btn ');
      expect(button?.textContent).toBe('Test');
    });
  });

  describe('Options', () => {
    it('should hide states when showStates is false', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes, { showStates: false });
      const stateLabels = container.querySelectorAll('.component-preview__state-label');
      expect(stateLabels.length).toBe(0);
    });

    it('should show code when showCode is true', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes, { showCode: true });
      const codeBlocks = container.querySelectorAll('.component-preview__code');
      expect(codeBlocks.length).toBe(2); // One for each state
    });

    it('should apply compact mode class', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes, { compactMode: true });
      const grid = container.querySelector('.component-preview__grid');
      expect(grid?.classList.contains('component-preview--compact')).toBe(true);
    });

    it('should update options and re-render', () => {
      preview = new ComponentPreview(container, mockComponents, mockThemes, { showCode: false });
      
      let codeBlocks = container.querySelectorAll('.component-preview__code');
      expect(codeBlocks.length).toBe(0);
      
      preview.updateOptions({ showCode: true });
      
      codeBlocks = container.querySelectorAll('.component-preview__code');
      expect(codeBlocks.length).toBe(2);
    });
  });

  describe('Factory Function', () => {
    it('should create component preview using factory function', () => {
      const factoryPreview = createComponentPreview(container, mockComponents, mockThemes);
      expect(factoryPreview).toBeInstanceOf(ComponentPreview);
    });
  });
});

describe('Component Definitions', () => {
  describe('Component Categories', () => {
    it('should have components in all expected categories', () => {
      const categories = ['buttons', 'inputs', 'containers', 'navigation', 'typography'];
      
      categories.forEach(category => {
        const components = getComponentsByCategory(category);
        expect(components.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array for non-existent category', () => {
      const components = getComponentsByCategory('non-existent');
      expect(components).toEqual([]);
    });
  });

  describe('Component Lookup', () => {
    it('should find component by name', () => {
      const component = getComponentByName('Base Button');
      expect(component).toBeDefined();
      expect(component?.name).toBe('Base Button');
      expect(component?.category).toBe('buttons');
    });

    it('should return undefined for non-existent component', () => {
      const component = getComponentByName('Non-existent Component');
      expect(component).toBeUndefined();
    });
  });

  describe('Component Structure', () => {
    it('should have valid component definitions', () => {
      allComponents.forEach(component => {
        expect(component.name).toBeDefined();
        expect(component.category).toBeDefined();
        expect(component.description).toBeDefined();
        expect(component.baseClass).toBeDefined();
        expect(component.states).toBeDefined();
        expect(component.template).toBeDefined();
        expect(Array.isArray(component.states)).toBe(true);
        expect(component.states.length).toBeGreaterThan(0);
        expect(typeof component.template).toBe('function');
      });
    });

    it('should have valid state definitions', () => {
      allComponents.forEach(component => {
        component.states.forEach(state => {
          expect(state.name).toBeDefined();
          expect(state.label).toBeDefined();
          expect(typeof state.name).toBe('string');
          expect(typeof state.label).toBe('string');
        });
      });
    });

    it('should generate valid HTML from templates', () => {
      allComponents.forEach(component => {
        component.states.forEach(state => {
          const html = component.template(state);
          expect(typeof html).toBe('string');
          expect(html.length).toBeGreaterThan(0);
          
          // Should contain the base class
          expect(html).toContain(component.baseClass);
        });
      });
    });
  });

  describe('Button Components', () => {
    it('should have all expected button components', () => {
      const buttonNames = ['Base Button', 'Action Button', 'Emoji Button', 'Navigation Button'];
      
      buttonNames.forEach(name => {
        const component = getComponentByName(name);
        expect(component).toBeDefined();
        expect(component?.category).toBe('buttons');
      });
    });

    it('should have common button states', () => {
      const buttonComponents = getComponentsByCategory('buttons');
      
      buttonComponents.forEach(component => {
        const stateNames = component.states.map(state => state.name);
        expect(stateNames).toContain('default');
        
        // Most buttons should have hover and disabled states
        if (component.name !== 'Navigation Button') {
          expect(stateNames).toContain('hover');
        }
      });
    });
  });

  describe('Input Components', () => {
    it('should have theme option component', () => {
      const component = getComponentByName('Theme Option');
      expect(component).toBeDefined();
      expect(component?.category).toBe('inputs');
    });
  });

  describe('Container Components', () => {
    it('should have section header component', () => {
      const component = getComponentByName('Section Header');
      expect(component).toBeDefined();
      expect(component?.category).toBe('containers');
    });

    it('should have bookmark item component', () => {
      const component = getComponentByName('Bookmark Item');
      expect(component).toBeDefined();
      expect(component?.category).toBe('containers');
    });
  });

  describe('Typography Components', () => {
    it('should have text sizes component', () => {
      const component = getComponentByName('Text Sizes');
      expect(component).toBeDefined();
      expect(component?.category).toBe('typography');
    });
  });
});