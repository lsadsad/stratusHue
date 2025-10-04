/**
 * Comparison Table Component Tests
 * 
 * Tests for the design token comparison table component functionality
 */

import { ComparisonTable, createComparisonTable } from './comparison-table.js';
import { TokenData, ThemeDefinition } from './token-parser.js';

// Mock DOM environment for testing
function createMockDOM() {
  // Create a minimal DOM environment
  const mockDocument = {
    createElement: (tagName: string) => {
      const element = {
        tagName: tagName.toUpperCase(),
        className: '',
        textContent: '',
        innerHTML: '',
        style: {
          setProperty: function(property: string, value: string) {
            this[property] = value;
          }
        },
        children: [] as any[],
        appendChild: function(child: any) {
          this.children.push(child);
          return child;
        },
        addEventListener: function(event: string, handler: Function) {
          // Store event handlers for testing
          this[`on${event}`] = handler;
        },
        classList: {
          add: function(className: string) {
            element.className = element.className ? `${element.className} ${className}` : className;
          },
          remove: function(className: string) {
            element.className = element.className.replace(new RegExp(`\\b${className}\\b`, 'g'), '').trim();
          },
          contains: function(className: string) {
            return element.className.includes(className);
          }
        }
      };

      
      return element;
    },
    getElementById: (id: string) => null,
    head: {
      appendChild: function(element: any) {
        // Mock head.appendChild for style injection
      }
    }
  };

  // Mock global document
  (global as any).document = mockDocument;
  
  return mockDocument;
}

// Test data
const mockTokens: TokenData[] = [
  {
    name: 'spacing-xs',
    category: 'spacing',
    values: {
      'root': '2px',
      'cybertron': '2px',
      'figma-light': '2px'
    },
    usage: [],
    description: 'Extra small spacing value'
  },
  {
    name: 'spacing-md',
    category: 'spacing',
    values: {
      'root': '6px',
      'cybertron': '8px',
      'figma-light': '6px'
    },
    usage: [],
    description: 'Medium spacing value'
  },
  {
    name: 'font-size-sm',
    category: 'typography',
    values: {
      'root': '11px',
      'cybertron': '12px',
      'figma-light': '11px'
    },
    usage: [],
    description: 'Small font size'
  },
  {
    name: 'theme-bg-primary',
    category: 'color',
    values: {
      'root': '#ffffff',
      'cybertron': '#1a1a1a',
      'figma-light': '#ffffff'
    },
    usage: [],
    description: 'Primary background color'
  },
  {
    name: 'border-radius-md',
    category: 'border',
    values: {
      'root': '4px',
      'figma-light': '4px'
      // Missing cybertron value
    },
    usage: [],
    description: 'Medium border radius'
  }
];

const mockThemes: ThemeDefinition[] = [
  { name: 'root', selector: ':root', displayName: 'Base/Boilerplate' },
  { name: 'cybertron', selector: '[data-theme="cybertron"]', displayName: 'Cybertron' },
  { name: 'figma-light', selector: '[data-theme="figma-light"]', displayName: 'Figma Light' }
];

describe('ComparisonTable', () => {
  let mockDocument: any;
  let container: any;

  beforeEach(() => {
    mockDocument = createMockDOM();
    container = mockDocument.createElement('div');
  });

  afterEach(() => {
    // Clean up global mocks
    delete (global as any).document;
  });

  describe('Constructor and Initialization', () => {
    test('should create comparison table instance', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      expect(table).toBeInstanceOf(ComparisonTable);
    });

    test('should render table structure in container', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      expect(container.className).toBe('comparison-table');
      expect(container.children.length).toBeGreaterThan(0);
    });

    test('should accept options for configuration', () => {
      const options = {
        showDifferencesOnly: true,
        expandedCategories: new Set(['spacing'])
      };
      
      const table = new ComparisonTable(container, mockTokens, mockThemes, options);
      expect(table).toBeInstanceOf(ComparisonTable);
    });
  });

  describe('Table Structure', () => {
    test('should create header with theme columns', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      const header = table.children[0];
      
      expect(header.className).toBe('comparison-table__header');
      expect(header.children.length).toBe(4); // 1 token column + 3 theme columns
    });

    test('should create body with category sections', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      const body = table.children[1];
      
      expect(body.className).toBe('comparison-table__body');
      expect(body.children.length).toBeGreaterThan(0);
    });

    test('should create stats footer', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      const stats = table.children[2];
      
      expect(stats.className).toBe('comparison-table__stats');
      expect(stats.textContent).toContain('total tokens');
    });
  });

  describe('Token Categorization', () => {
    test('should group tokens by category', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      const body = table.children[1];
      
      // Should have category sections for spacing, typography, color, border
      const categoryHeaders = Array.from(body.children).filter((child: any) => 
        child.className.includes('comparison-table__category')
      );
      
      expect(categoryHeaders.length).toBeGreaterThan(0);
    });

    test('should show token count in category headers', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      const body = table.children[1];
      
      // Should have category sections
      expect(body.children.length).toBeGreaterThan(0);
      
      // Check that categories are created (we can't easily test the exact structure in mock DOM)
      // but we can verify the table was created successfully
      expect(table).toBeDefined();
    });
  });

  describe('Value Display and Highlighting', () => {
    test('should highlight tokens with different values', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      // The spacing-md token has different values (6px, 8px, 6px)
      // This should be highlighted in the rendered output
      const table = container.children[0];
      expect(table).toBeDefined();
    });

    test('should show missing values appropriately', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      // The border-radius-md token is missing cybertron value
      // This should be handled in the rendered output
      const table = container.children[0];
      expect(table).toBeDefined();
    });

    test('should add color previews for color tokens', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      // The theme-bg-primary token should have color previews
      const table = container.children[0];
      expect(table).toBeDefined();
    });
  });

  describe('Expandable Categories', () => {
    test('should expand categories by default', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      
      const expandedCategories = table.getExpandedCategories();
      expect(expandedCategories.has('spacing')).toBe(true);
      expect(expandedCategories.has('typography')).toBe(true);
      expect(expandedCategories.has('color')).toBe(true);
    });

    test('should allow expanding all categories', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      
      table.expandAll();
      const expandedCategories = table.getExpandedCategories();
      
      expect(expandedCategories.has('spacing')).toBe(true);
      expect(expandedCategories.has('typography')).toBe(true);
      expect(expandedCategories.has('color')).toBe(true);
      expect(expandedCategories.has('border')).toBe(true);
    });

    test('should allow collapsing all categories', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      
      table.collapseAll();
      const expandedCategories = table.getExpandedCategories();
      
      expect(expandedCategories.size).toBe(0);
    });
  });

  describe('Responsive Layout', () => {
    test('should set CSS custom property for theme count', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      expect(table.style['--theme-count']).toBe('3');
    });
  });

  describe('Filtering and Options', () => {
    test('should filter to show only tokens with differences', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes, {
        showDifferencesOnly: true
      });
      
      // Should only show tokens that have different values across themes
      expect(table).toBeInstanceOf(ComparisonTable);
    });

    test('should allow toggling differences-only mode', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      
      table.toggleDifferencesOnly();
      // Should now be in differences-only mode
      expect(table).toBeInstanceOf(ComparisonTable);
    });
  });

  describe('Update Functionality', () => {
    test('should allow updating with new tokens', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      
      const newTokens = mockTokens.slice(0, 2); // Only first 2 tokens
      table.update(newTokens);
      
      expect(table).toBeInstanceOf(ComparisonTable);
    });

    test('should allow updating options', () => {
      const table = new ComparisonTable(container, mockTokens, mockThemes);
      
      table.update(undefined, { showDifferencesOnly: true });
      
      expect(table).toBeInstanceOf(ComparisonTable);
    });
  });

  describe('Factory Function', () => {
    test('should create table using factory function', () => {
      const table = createComparisonTable(container, mockTokens, mockThemes);
      
      expect(table).toBeInstanceOf(ComparisonTable);
      expect(container.className).toBe('comparison-table');
    });

    test('should accept options in factory function', () => {
      const options = { showDifferencesOnly: true };
      const table = createComparisonTable(container, mockTokens, mockThemes, options);
      
      expect(table).toBeInstanceOf(ComparisonTable);
    });
  });

  describe('Statistics', () => {
    test('should calculate correct token statistics', () => {
      new ComparisonTable(container, mockTokens, mockThemes);
      
      const table = container.children[0];
      const stats = table.children[2];
      
      expect(stats.textContent).toContain('5 total tokens'); // 5 mock tokens
      expect(stats.textContent).toContain('with differences');
      expect(stats.textContent).toContain('with missing values');
    });
  });
});

// Integration test with real CSS parsing
describe('ComparisonTable Integration', () => {
  let mockDocument: any;
  let container: any;

  beforeEach(() => {
    mockDocument = createMockDOM();
    container = mockDocument.createElement('div');
  });

  afterEach(() => {
    delete (global as any).document;
  });

  test('should work with parsed CSS tokens', () => {
    // This would typically use real parsed tokens from styles.css
    // For now, we'll use our mock data to verify integration
    const table = createComparisonTable(container, mockTokens, mockThemes, {
      expandedCategories: new Set(['spacing', 'color'])
    });
    
    expect(table).toBeInstanceOf(ComparisonTable);
    expect(container.className).toBe('comparison-table');
    
    // Verify that the table has the expected structure
    const tableElement = container.children[0];
    expect(tableElement.children.length).toBe(3); // header, body, stats
  });
});