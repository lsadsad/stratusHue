/**
 * Comparison Table Component - Displays design tokens across themes in a tabular format
 * 
 * This component creates a responsive three-column layout showing token values
 * across different themes with difference highlighting and expandable categories.
 */

import { TokenData, ThemeDefinition, formatTokenValue, isColorToken } from './token-parser.js';

export interface ComparisonTableOptions {
  showDifferencesOnly?: boolean;
  expandedCategories?: Set<string>;
  onCategoryToggle?: (category: string, expanded: boolean) => void;
}

export class ComparisonTable {
  private container: HTMLElement;
  private tokens: TokenData[];
  private themes: ThemeDefinition[];
  private options: ComparisonTableOptions;
  private expandedCategories: Set<string>;

  constructor(
    container: HTMLElement,
    tokens: TokenData[],
    themes: ThemeDefinition[],
    options: ComparisonTableOptions = {}
  ) {
    this.container = container;
    this.tokens = tokens;
    this.themes = themes;
    this.options = options;
    this.expandedCategories = options.expandedCategories || new Set(['spacing', 'typography', 'color']);
    
    this.render();
  }

  /**
   * Render the complete comparison table
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'comparison-table';
    
    // Add CSS styles
    this.addStyles();
    
    // Create table structure
    const table = this.createTable();
    this.container.appendChild(table);
  }

  /**
   * Add component-specific CSS styles
   */
  private addStyles(): void {
    const styleId = 'comparison-table-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .comparison-table {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid var(--theme-border-primary, #e1e5e9);
        border-radius: var(--border-radius-md, 4px);
        overflow: hidden;
        background: var(--theme-bg-primary, #ffffff);
      }

      .comparison-table__header {
        display: grid;
        grid-template-columns: 2fr repeat(var(--theme-count, 3), 1fr);
        background: var(--theme-bg-secondary, #f8f9fa);
        border-bottom: 1px solid var(--theme-border-primary, #e1e5e9);
        font-weight: var(--font-weight-semibold, 600);
        font-size: var(--font-size-sm, 11px);
      }

      .comparison-table__header-cell {
        padding: var(--spacing-lg, 8px);
        border-right: 1px solid var(--theme-border-primary, #e1e5e9);
        color: var(--theme-text-primary, #333333);
        display: flex;
        align-items: center;
      }

      .comparison-table__header-cell:last-child {
        border-right: none;
      }

      .comparison-table__body {
        max-height: 600px;
        overflow-y: auto;
      }

      .comparison-table__category {
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
      }

      .comparison-table__category-header {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-secondary, #f8f9fa);
        font-weight: var(--font-weight-medium, 500);
        font-size: var(--font-size-sm, 11px);
        color: var(--theme-text-primary, #333333);
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 4px);
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
        transition: background-color 0.15s ease;
      }

      .comparison-table__category-header:hover {
        background: var(--theme-bg-hover, #f0f0f0);
      }

      .comparison-table__category-icon {
        width: 0;
        height: 0;
        border-left: 4px solid var(--theme-text-secondary, #666666);
        border-top: 3px solid transparent;
        border-bottom: 3px solid transparent;
        transition: transform 0.15s ease;
      }

      .comparison-table__category-header.expanded .comparison-table__category-icon {
        transform: rotate(90deg);
      }

      .comparison-table__category-content {
        display: none;
      }

      .comparison-table__category-content.expanded {
        display: block;
      }

      .comparison-table__row {
        display: grid;
        grid-template-columns: 2fr repeat(var(--theme-count, 3), 1fr);
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
        min-height: 32px;
      }

      .comparison-table__row:hover {
        background: var(--theme-bg-hover, #f8f9fa);
      }

      .comparison-table__cell {
        padding: var(--spacing-lg, 8px);
        border-right: 1px solid var(--theme-border-secondary, #f0f0f0);
        display: flex;
        align-items: center;
        font-size: var(--font-size-xs, 10px);
        line-height: 1.4;
      }

      .comparison-table__cell:last-child {
        border-right: none;
      }

      .comparison-table__token-name {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        color: var(--theme-text-primary, #333333);
        word-break: break-all;
      }

      .comparison-table__token-description {
        color: var(--theme-text-muted, #999999);
        font-size: var(--font-size-xs, 10px);
        margin-top: 2px;
        display: block;
      }

      .comparison-table__value {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        color: var(--theme-text-primary, #333333);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 4px);
        width: 100%;
      }

      .comparison-table__value--missing {
        color: var(--theme-text-muted, #999999);
        font-style: italic;
      }

      .comparison-table__value--different {
        background: rgba(255, 193, 7, 0.1);
        border-left: 3px solid var(--theme-warning, rgba(255, 193, 7, 0.9));
        margin-left: -8px;
        padding-left: 5px;
      }

      .comparison-table__color-preview {
        width: 12px;
        height: 12px;
        border: 1px solid var(--theme-border-primary, #e1e5e9);
        border-radius: var(--border-radius-xs, 2px);
        flex-shrink: 0;
        display: inline-block;
      }

      .comparison-table__stats {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-secondary, #f8f9fa);
        border-top: 1px solid var(--theme-border-primary, #e1e5e9);
        font-size: var(--font-size-xs, 10px);
        color: var(--theme-text-secondary, #666666);
        display: flex;
        gap: var(--spacing-xl, 10px);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .comparison-table__header,
        .comparison-table__row {
          grid-template-columns: 1fr;
        }
        
        .comparison-table__header-cell,
        .comparison-table__cell {
          border-right: none;
          border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
        }
        
        .comparison-table__header-cell:not(:first-child) {
          display: none;
        }
        
        .comparison-table__cell:first-child {
          font-weight: var(--font-weight-medium, 500);
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Create the main table structure
   */
  private createTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'comparison-table__table';
    
    // Set CSS custom property for theme count
    table.style.setProperty('--theme-count', this.themes.length.toString());
    
    // Create header
    const header = this.createHeader();
    table.appendChild(header);
    
    // Create body with categories
    const body = this.createBody();
    table.appendChild(body);
    
    // Create stats footer
    const stats = this.createStats();
    table.appendChild(stats);
    
    return table;
  }

  /**
   * Create table header with theme columns
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'comparison-table__header';
    
    // Token name column
    const tokenHeader = document.createElement('div');
    tokenHeader.className = 'comparison-table__header-cell';
    tokenHeader.textContent = 'Design Token';
    header.appendChild(tokenHeader);
    
    // Theme columns
    this.themes.forEach(theme => {
      const themeHeader = document.createElement('div');
      themeHeader.className = 'comparison-table__header-cell';
      themeHeader.textContent = theme.displayName;
      header.appendChild(themeHeader);
    });
    
    return header;
  }

  /**
   * Create table body with categorized tokens
   */
  private createBody(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'comparison-table__body';
    
    // Group tokens by category
    const categories = this.groupTokensByCategory();
    
    // Create category sections
    Object.entries(categories).forEach(([categoryName, categoryTokens]) => {
      if (categoryTokens.length === 0) return;
      
      const categorySection = this.createCategorySection(categoryName, categoryTokens);
      body.appendChild(categorySection);
    });
    
    return body;
  }

  /**
   * Group tokens by category
   */
  private groupTokensByCategory(): Record<string, TokenData[]> {
    const categories: Record<string, TokenData[]> = {
      spacing: [],
      typography: [],
      color: [],
      sizing: [],
      border: [],
      shadow: [],
      transition: [],
      other: []
    };

    // Filter tokens if showing differences only
    const tokensToShow = this.options.showDifferencesOnly 
      ? this.tokens.filter(token => this.hasDifferentValues(token))
      : this.tokens;

    tokensToShow.forEach(token => {
      if (categories[token.category]) {
        categories[token.category].push(token);
      } else {
        categories.other.push(token);
      }
    });

    // Sort tokens within each category
    Object.values(categories).forEach(categoryTokens => {
      categoryTokens.sort((a, b) => a.name.localeCompare(b.name));
    });

    return categories;
  }

  /**
   * Create a category section with header and token rows
   */
  private createCategorySection(categoryName: string, tokens: TokenData[]): HTMLElement {
    const section = document.createElement('div');
    section.className = 'comparison-table__category';
    
    // Category header
    const header = document.createElement('div');
    header.className = 'comparison-table__category-header';
    
    const isExpanded = this.expandedCategories.has(categoryName);
    if (isExpanded) {
      header.classList.add('expanded');
    }
    
    // Expand/collapse icon
    const icon = document.createElement('div');
    icon.className = 'comparison-table__category-icon';
    header.appendChild(icon);
    
    // Category title with count
    const title = document.createElement('span');
    title.textContent = `${this.formatCategoryName(categoryName)} (${tokens.length})`;
    header.appendChild(title);
    
    // Click handler for expand/collapse
    header.addEventListener('click', () => {
      const wasExpanded = this.expandedCategories.has(categoryName);
      if (wasExpanded) {
        this.expandedCategories.delete(categoryName);
        header.classList.remove('expanded');
        content.classList.remove('expanded');
      } else {
        this.expandedCategories.add(categoryName);
        header.classList.add('expanded');
        content.classList.add('expanded');
      }
      
      if (this.options.onCategoryToggle) {
        this.options.onCategoryToggle(categoryName, !wasExpanded);
      }
    });
    
    section.appendChild(header);
    
    // Category content
    const content = document.createElement('div');
    content.className = 'comparison-table__category-content';
    if (isExpanded) {
      content.classList.add('expanded');
    }
    
    // Token rows
    tokens.forEach(token => {
      const row = this.createTokenRow(token);
      content.appendChild(row);
    });
    
    section.appendChild(content);
    
    return section;
  }

  /**
   * Create a token row with values across themes
   */
  private createTokenRow(token: TokenData): HTMLElement {
    const row = document.createElement('div');
    row.className = 'comparison-table__row';
    
    // Token name cell
    const nameCell = document.createElement('div');
    nameCell.className = 'comparison-table__cell';
    
    const tokenName = document.createElement('div');
    tokenName.className = 'comparison-table__token-name';
    tokenName.textContent = `--${token.name}`;
    nameCell.appendChild(tokenName);
    
    if (token.description) {
      const description = document.createElement('span');
      description.className = 'comparison-table__token-description';
      description.textContent = token.description;
      nameCell.appendChild(description);
    }
    
    row.appendChild(nameCell);
    
    // Value cells for each theme
    const hasDifferentValues = this.hasDifferentValues(token);
    
    this.themes.forEach(theme => {
      const valueCell = document.createElement('div');
      valueCell.className = 'comparison-table__cell';
      
      const value = token.values[theme.name];
      const valueElement = this.createValueElement(token, value, hasDifferentValues);
      valueCell.appendChild(valueElement);
      
      row.appendChild(valueCell);
    });
    
    return row;
  }

  /**
   * Create a value element with appropriate styling and previews
   */
  private createValueElement(token: TokenData, value: string | undefined, hasDifferentValues: boolean): HTMLElement {
    const valueElement = document.createElement('div');
    valueElement.className = 'comparison-table__value';
    
    if (value === undefined) {
      valueElement.classList.add('comparison-table__value--missing');
      valueElement.textContent = '—';
      return valueElement;
    }
    
    if (hasDifferentValues) {
      valueElement.classList.add('comparison-table__value--different');
    }
    
    const formattedValue = formatTokenValue(value);
    
    // Add color preview for color tokens
    if (token.category === 'color' && isColorToken(value)) {
      const colorPreview = document.createElement('span');
      colorPreview.className = 'comparison-table__color-preview';
      colorPreview.style.backgroundColor = value;
      colorPreview.title = `Color: ${value}`;
      valueElement.appendChild(colorPreview);
    }
    
    // Add value text
    const valueText = document.createElement('span');
    valueText.textContent = formattedValue;
    valueText.title = `Value: ${formattedValue}`;
    valueElement.appendChild(valueText);
    
    return valueElement;
  }

  /**
   * Create stats footer showing token counts and differences
   */
  private createStats(): HTMLElement {
    const stats = document.createElement('div');
    stats.className = 'comparison-table__stats';
    
    const totalTokens = this.tokens.length;
    const differentTokens = this.tokens.filter(token => this.hasDifferentValues(token)).length;
    const missingTokens = this.tokens.filter(token => this.hasMissingValues(token)).length;
    
    const statsText = [
      `${totalTokens} total tokens`,
      `${differentTokens} with differences`,
      `${missingTokens} with missing values`
    ].join(' • ');
    
    stats.textContent = statsText;
    
    return stats;
  }

  /**
   * Check if a token has different values across themes
   */
  private hasDifferentValues(token: TokenData): boolean {
    const values = Object.values(token.values).filter(v => v !== undefined);
    return values.length > 1 && new Set(values).size > 1;
  }

  /**
   * Check if a token has missing values in some themes
   */
  private hasMissingValues(token: TokenData): boolean {
    return Object.keys(token.values).length < this.themes.length;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(categoryName: string): string {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  }

  /**
   * Update the table with new tokens or options
   */
  public update(tokens?: TokenData[], options?: Partial<ComparisonTableOptions>): void {
    if (tokens) {
      this.tokens = tokens;
    }
    
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    this.render();
  }

  /**
   * Expand all categories
   */
  public expandAll(): void {
    const categories = this.groupTokensByCategory();
    Object.keys(categories).forEach(category => {
      this.expandedCategories.add(category);
    });
    this.render();
  }

  /**
   * Collapse all categories
   */
  public collapseAll(): void {
    this.expandedCategories.clear();
    this.render();
  }

  /**
   * Toggle showing only tokens with differences
   */
  public toggleDifferencesOnly(): void {
    this.options.showDifferencesOnly = !this.options.showDifferencesOnly;
    this.render();
  }

  /**
   * Get current expanded categories
   */
  public getExpandedCategories(): Set<string> {
    return new Set(this.expandedCategories);
  }

  /**
   * Set expanded categories
   */
  public setExpandedCategories(categories: Set<string>): void {
    this.expandedCategories = categories;
    this.render();
  }
}

/**
 * Factory function to create a comparison table
 */
export function createComparisonTable(
  container: HTMLElement,
  tokens: TokenData[],
  themes: ThemeDefinition[],
  options?: ComparisonTableOptions
): ComparisonTable {
  return new ComparisonTable(container, tokens, themes, options);
}