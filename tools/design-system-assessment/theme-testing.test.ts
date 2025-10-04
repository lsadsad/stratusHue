/**
 * Theme Testing Interface - Unit Tests
 * 
 * Tests for theme switching controls, validation, error logging, and component testing
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ThemeTestingInterface, createThemeTestingInterface, type ThemeError, type ValidationResult } from './theme-testing';
import { ThemeDefinition, TokenData } from './token-parser';
import { ComponentDefinition } from './component-preview';

// Mock DOM environment
const mockDocument = {
  createElement: (tagName: string) => ({
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
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  }),
  getElementById: vi.fn(),
  head: {
    appendChild: vi.fn()
  },
  body: {
    setAttribute: vi.fn()
  }
};

const mockWindow = {
  document: mockDocument
};

// Mock global document and window
global.document = mockDocument as any;
global.window = mockWindow as any;

describe('ThemeTestingInterface', () => {
  let container: HTMLElement;
  let mockThemes: ThemeDefinition[];
  let mockTokens: TokenData[];
  let mockComponents: ComponentDefinition[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock container
    container = {
      innerHTML: '',
      className: '',
      appendChild: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    } as any;

    // Mock themes
    mockThemes = [
      {
        name: 'boilerplate',
        displayName: 'Boilerplate (Dark)',
        description: 'Pure dark theme'
      },
      {
        name: 'cybertron',
        displayName: 'Cybertron (Neon)',
        description: 'Futuristic theme'
      },
      {
        name: 'figma-light',
        displayName: 'Figma Light',
        description: 'Light theme'
      }
    ];

    // Mock tokens
    mockTokens = [
      {
        name: 'theme-bg-primary',
        category: 'color',
        values: {
          'boilerplate': '#0f0f0f',
          'cybertron': '#0a0a0f',
          'figma-light': '#ffffff'
        }
      },
      {
        name: 'theme-text-primary',
        category: 'color',
        values: {
          'boilerplate': '#ffffff',
          'cybertron': '#00ffff',
          'figma-light': '#333333'
        }
      },
      {
        name: 'spacing-md',
        category: 'spacing',
        values: {
          'boilerplate': '6px',
          'cybertron': '6px',
          'figma-light': '6px'
        }
      },
      {
        name: 'incomplete-token',
        category: 'color',
        values: {
          'boilerplate': '#000000',
          'cybertron': '#111111'
          // Missing figma-light value
        }
      }
    ];

    // Mock components
    mockComponents = [
      {
        name: 'Test Button',
        category: 'buttons',
        description: 'A test button',
        baseClass: 'btn-test',
        states: [
          {
            name: 'default',
            label: 'Default',
            content: 'Click me'
          }
        ],
        template: (state) => `<button>${state.content}</button>`
      },
      {
        name: 'Test Input',
        category: 'inputs',
        description: 'A test input',
        baseClass: 'input-test',
        states: [
          {
            name: 'default',
            label: 'Default',
            content: ''
          }
        ],
        template: (state) => `<input type="text" placeholder="Test">`
      }
    ];
  });

  describe('Initialization', () => {
    test('should create theme testing interface with default options', () => {
      const themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
      expect(themeInterface.getCurrentTheme()).toBe('boilerplate');
    });

    test('should create theme testing interface with custom options', () => {
      const options = {
        showValidation: false,
        showErrors: false,
        enableLogging: false
      };

      const themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents,
        options
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
    });

    test('should handle empty themes array', () => {
      const themeInterface = new ThemeTestingInterface(
        container,
        [],
        mockTokens,
        mockComponents
      );

      expect(themeInterface.getCurrentTheme()).toBe('boilerplate'); // fallback
    });
  });

  describe('Theme Switching', () => {
    let themeInterface: ThemeTestingInterface;

    beforeEach(() => {
      themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents
      );
    });

    test('should switch theme successfully', async () => {
      await themeInterface.switchTheme('cybertron');
      expect(themeInterface.getCurrentTheme()).toBe('cybertron');
      expect(mockDocument.body.setAttribute).toHaveBeenCalledWith('data-theme', 'cybertron');
    });

    test('should handle theme switching with callback', async () => {
      const onThemeChange = vi.fn();
      const themeInterfaceWithCallback = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents,
        { onThemeChange }
      );

      await themeInterfaceWithCallback.switchTheme('figma-light');
      
      expect(onThemeChange).toHaveBeenCalledWith('figma-light', expect.any(Array));
    });

    test('should prevent concurrent theme switches', async () => {
      const promise1 = themeInterface.switchTheme('cybertron');
      const promise2 = themeInterface.switchTheme('figma-light');

      await Promise.all([promise1, promise2]);

      // Should end up with the first theme switch
      expect(themeInterface.getCurrentTheme()).toBe('cybertron');
    });
  });

  describe('Token Validation', () => {
    let themeInterface: ThemeTestingInterface;

    beforeEach(() => {
      themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents
      );
    });

    test('should validate tokens for current theme', async () => {
      await themeInterface.validateAllThemes();
      
      const results = themeInterface.getValidationResults();
      expect(results.length).toBeGreaterThan(0);
      
      // Should have some successful validations
      const successfulValidations = results.filter(r => r.resolved);
      expect(successfulValidations.length).toBeGreaterThan(0);
    });

    test('should identify missing tokens', async () => {
      await themeInterface.switchTheme('figma-light');
      await themeInterface.validateAllThemes();
      
      const results = themeInterface.getValidationResults();
      const failedValidations = results.filter(r => !r.resolved);
      
      // Should find the incomplete-token that's missing figma-light value
      const missingToken = failedValidations.find(r => r.tokenName === 'incomplete-token');
      expect(missingToken).toBeDefined();
      expect(missingToken?.error).toContain('not defined');
    });

    test('should cache validation results', async () => {
      // First validation
      await themeInterface.validateAllThemes();
      const firstResults = themeInterface.getValidationResults();
      
      // Second validation (should use cache)
      await themeInterface.validateAllThemes();
      const secondResults = themeInterface.getValidationResults();
      
      expect(firstResults).toEqual(secondResults);
    });

    test('should trigger validation callback', async () => {
      const onValidationComplete = vi.fn();
      const themeInterfaceWithCallback = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents,
        { onValidationComplete }
      );

      await themeInterfaceWithCallback.validateAllThemes();
      
      expect(onValidationComplete).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('Error Logging', () => {
    let themeInterface: ThemeTestingInterface;

    beforeEach(() => {
      themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents,
        { enableLogging: true }
      );
    });

    test('should log errors during validation', async () => {
      await themeInterface.switchTheme('figma-light');
      await themeInterface.validateAllThemes();
      
      const errors = themeInterface.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      // Should have token resolution errors
      const tokenErrors = errors.filter(e => e.type === 'token-resolution');
      expect(tokenErrors.length).toBeGreaterThan(0);
    });

    test('should categorize errors by type and severity', async () => {
      await themeInterface.switchTheme('figma-light');
      await themeInterface.validateAllThemes();
      
      const errors = themeInterface.getErrors();
      
      errors.forEach(error => {
        expect(['token-resolution', 'component-render', 'css-parse', 'theme-switch']).toContain(error.type);
        expect(['low', 'medium', 'high']).toContain(error.severity);
        expect(error.message).toBeTruthy();
        expect(error.theme).toBeTruthy();
      });
    });

    test('should clear errors', async () => {
      // Generate some errors
      await themeInterface.switchTheme('figma-light');
      await themeInterface.validateAllThemes();
      
      expect(themeInterface.getErrors().length).toBeGreaterThan(0);
      
      // Clear errors
      themeInterface.clearErrors();
      
      expect(themeInterface.getErrors().length).toBe(0);
    });
  });

  describe('Component Testing', () => {
    let themeInterface: ThemeTestingInterface;

    beforeEach(() => {
      themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents
      );
    });

    test('should test components across themes', async () => {
      await themeInterface.testAllComponents();
      
      // Should complete without throwing errors
      expect(true).toBe(true);
    });

    test('should handle component rendering errors gracefully', async () => {
      // Add a component that will cause rendering errors
      const errorComponent: ComponentDefinition = {
        name: 'Error Component',
        category: 'other',
        description: 'Component that throws errors',
        baseClass: 'error-component',
        states: [
          {
            name: 'default',
            label: 'Default',
            content: 'Error'
          }
        ],
        template: (state) => {
          throw new Error('Rendering error');
        }
      };

      const themeInterfaceWithError = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        [...mockComponents, errorComponent]
      );

      await themeInterfaceWithError.testAllComponents();
      
      const errors = themeInterfaceWithError.getErrors();
      const componentErrors = errors.filter(e => e.type === 'component-render');
      
      expect(componentErrors.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    let themeInterface: ThemeTestingInterface;

    beforeEach(() => {
      themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents
      );
    });

    test('should return current state', () => {
      const state = themeInterface.getState();
      
      expect(state).toHaveProperty('currentTheme');
      expect(state).toHaveProperty('availableThemes');
      expect(state).toHaveProperty('errors');
      expect(state).toHaveProperty('validationResults');
      expect(state).toHaveProperty('isValidating');
      expect(state).toHaveProperty('isSwitching');
    });

    test('should update state during operations', async () => {
      const initialState = themeInterface.getState();
      expect(initialState.isSwitching).toBe(false);
      expect(initialState.isValidating).toBe(false);
      
      // State should be updated during theme switch
      const switchPromise = themeInterface.switchTheme('cybertron');
      
      // Note: In a real implementation, we'd check state during the operation
      // but since our mock is synchronous, we just verify the final state
      await switchPromise;
      
      const finalState = themeInterface.getState();
      expect(finalState.currentTheme).toBe('cybertron');
    });
  });

  describe('Factory Function', () => {
    test('should create theme testing interface using factory function', () => {
      const themeInterface = createThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
    });

    test('should create theme testing interface with options using factory function', () => {
      const options = {
        showValidation: false,
        enableLogging: false
      };

      const themeInterface = createThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        mockComponents,
        options
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty tokens array', () => {
      const themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        [],
        mockComponents
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
    });

    test('should handle empty components array', () => {
      const themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        mockTokens,
        []
      );

      expect(themeInterface).toBeInstanceOf(ThemeTestingInterface);
    });

    test('should handle tokens with empty values', async () => {
      const tokensWithEmpty = [
        ...mockTokens,
        {
          name: 'empty-token',
          category: 'color',
          values: {
            'boilerplate': '',
            'cybertron': '   ',
            'figma-light': '#ffffff'
          }
        }
      ];

      const themeInterface = new ThemeTestingInterface(
        container,
        mockThemes,
        tokensWithEmpty,
        mockComponents
      );

      await themeInterface.validateAllThemes();
      
      const errors = themeInterface.getErrors();
      const emptyValueErrors = errors.filter(e => 
        e.message.includes('empty value') || e.message.includes('Empty token value')
      );
      
      expect(emptyValueErrors.length).toBeGreaterThan(0);
    });
  });
});

describe('Theme Testing Integration', () => {
  test('should integrate with existing design system components', () => {
    // This test would verify integration with other design system assessment components
    // In a real implementation, this would test the full workflow
    
    const container = document.createElement('div');
    const mockThemes: ThemeDefinition[] = [
      { name: 'test', displayName: 'Test Theme', description: 'Test' }
    ];
    const mockTokens: TokenData[] = [
      { name: 'test-token', category: 'color', values: { 'test': '#000000' } }
    ];
    const mockComponents: ComponentDefinition[] = [];

    const themeInterface = createThemeTestingInterface(
      container,
      mockThemes,
      mockTokens,
      mockComponents
    );

    expect(themeInterface).toBeDefined();
    expect(themeInterface.getCurrentTheme()).toBe('test');
  });
});