/**
 * Component Preview System - Theme-aware component rendering and preview
 * 
 * This module provides a system for defining, rendering, and previewing UI components
 * across different themes with real-time theme switching functionality.
 */

import { ThemeDefinition } from './token-parser.js';

export interface ComponentState {
  name: string;
  label: string;
  modifiers?: string[];
  attributes?: Record<string, string>;
  content?: string;
}

export interface ComponentDefinition {
  name: string;
  category: 'buttons' | 'inputs' | 'containers' | 'navigation' | 'typography' | 'other';
  description: string;
  baseClass: string;
  states: ComponentState[];
  template: (state: ComponentState) => string;
  dependencies?: string[];
}

export interface ComponentPreviewOptions {
  showStates?: boolean;
  showCode?: boolean;
  compactMode?: boolean;
  onThemeChange?: (theme: string) => void;
}

export class ComponentPreview {
  private container: HTMLElement;
  private components: ComponentDefinition[];
  private themes: ThemeDefinition[];
  private currentTheme: string;
  private options: ComponentPreviewOptions;

  constructor(
    container: HTMLElement,
    components: ComponentDefinition[],
    themes: ThemeDefinition[],
    options: ComponentPreviewOptions = {}
  ) {
    this.container = container;
    this.components = components;
    this.themes = themes;
    this.currentTheme = themes[0]?.name || 'boilerplate';
    this.options = options;
    
    this.render();
  }

  /**
   * Render the complete component preview system
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'component-preview';
    
    // Add CSS styles
    this.addStyles();
    
    // Create theme switcher
    const themeSwitcher = this.createThemeSwitcher();
    this.container.appendChild(themeSwitcher);
    
    // Create component grid
    const componentGrid = this.createComponentGrid();
    this.container.appendChild(componentGrid);
  }

  /**
   * Add component-specific CSS styles
   */
  private addStyles(): void {
    const styleId = 'component-preview-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .component-preview {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--theme-bg-primary, #ffffff);
        color: var(--theme-text-primary, #333333);
        border-radius: var(--border-radius-md, 4px);
        overflow: hidden;
      }

      .component-preview__theme-switcher {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-secondary, #f8f9fa);
        border-bottom: 1px solid var(--theme-border-primary, #e1e5e9);
        display: flex;
        align-items: center;
        gap: var(--spacing-md, 6px);
      }

      .component-preview__theme-label {
        font-size: var(--font-size-sm, 11px);
        font-weight: var(--font-weight-medium, 500);
        color: var(--theme-text-secondary, #666666);
      }

      .component-preview__theme-select {
        padding: var(--spacing-sm, 4px) var(--spacing-md, 6px);
        border: 1px solid var(--theme-border-primary, #e1e5e9);
        border-radius: var(--border-radius-sm, 3px);
        background: var(--theme-bg-primary, #ffffff);
        color: var(--theme-text-primary, #333333);
        font-size: var(--font-size-sm, 11px);
        cursor: pointer;
      }

      .component-preview__theme-select:focus {
        outline: 2px solid var(--theme-info, #007acc);
        outline-offset: 2px;
      }

      .component-preview__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg, 8px);
        padding: var(--spacing-lg, 8px);
        max-height: 600px;
        overflow-y: auto;
      }

      .component-preview__category {
        grid-column: 1 / -1;
        margin-bottom: var(--spacing-md, 6px);
      }

      .component-preview__category-header {
        font-size: var(--font-size-md, 12px);
        font-weight: var(--font-weight-semibold, 600);
        color: var(--theme-text-primary, #333333);
        margin-bottom: var(--spacing-md, 6px);
        padding-bottom: var(--spacing-sm, 4px);
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
      }

      .component-preview__component {
        border: 1px solid var(--theme-border-primary, #e1e5e9);
        border-radius: var(--border-radius-md, 4px);
        background: var(--theme-bg-primary, #ffffff);
        overflow: hidden;
      }

      .component-preview__component-header {
        padding: var(--spacing-md, 6px) var(--spacing-lg, 8px);
        background: var(--theme-bg-secondary, #f8f9fa);
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
      }

      .component-preview__component-name {
        font-size: var(--font-size-sm, 11px);
        font-weight: var(--font-weight-medium, 500);
        color: var(--theme-text-primary, #333333);
        margin: 0 0 2px 0;
      }

      .component-preview__component-description {
        font-size: var(--font-size-xs, 10px);
        color: var(--theme-text-muted, #999999);
        margin: 0;
      }

      .component-preview__component-body {
        padding: var(--spacing-lg, 8px);
      }

      .component-preview__states {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 6px);
      }

      .component-preview__state {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm, 4px);
      }

      .component-preview__state-label {
        font-size: var(--font-size-xs, 10px);
        color: var(--theme-text-secondary, #666666);
        font-weight: var(--font-weight-medium, 500);
      }

      .component-preview__state-demo {
        padding: var(--spacing-md, 6px);
        background: var(--theme-bg-elevated, #ffffff);
        border: 1px solid var(--theme-border-secondary, #f0f0f0);
        border-radius: var(--border-radius-sm, 3px);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
      }

      .component-preview__code {
        margin-top: var(--spacing-sm, 4px);
        padding: var(--spacing-sm, 4px);
        background: var(--theme-bg-secondary, #f8f9fa);
        border: 1px solid var(--theme-border-secondary, #f0f0f0);
        border-radius: var(--border-radius-xs, 2px);
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: var(--font-size-xs, 10px);
        color: var(--theme-text-secondary, #666666);
        overflow-x: auto;
        white-space: pre;
      }

      /* Compact mode styles */
      .component-preview--compact .component-preview__grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-sm, 4px);
      }

      .component-preview--compact .component-preview__component-body {
        padding: var(--spacing-sm, 4px);
      }

      .component-preview--compact .component-preview__states {
        gap: var(--spacing-sm, 4px);
      }

      .component-preview--compact .component-preview__state-demo {
        min-height: 32px;
        padding: var(--spacing-sm, 4px);
      }

      /* Theme transition support */
      .component-preview,
      .component-preview * {
        transition: 
          background-color 200ms ease-out,
          border-color 200ms ease-out,
          color 200ms ease-out;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .component-preview__grid {
          grid-template-columns: 1fr;
        }
        
        .component-preview__theme-switcher {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-sm, 4px);
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Create theme switcher controls
   */
  private createThemeSwitcher(): HTMLElement {
    const switcher = document.createElement('div');
    switcher.className = 'component-preview__theme-switcher';
    
    const label = document.createElement('label');
    label.className = 'component-preview__theme-label';
    label.textContent = 'Theme:';
    label.htmlFor = 'theme-select';
    
    const select = document.createElement('select');
    select.className = 'component-preview__theme-select';
    select.id = 'theme-select';
    
    this.themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.name;
      option.textContent = theme.displayName;
      option.selected = theme.name === this.currentTheme;
      select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.switchTheme(target.value);
    });
    
    switcher.appendChild(label);
    switcher.appendChild(select);
    
    return switcher;
  }

  /**
   * Create component grid with categories
   */
  private createComponentGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'component-preview__grid';
    
    if (this.options.compactMode) {
      grid.classList.add('component-preview--compact');
    }
    
    // Group components by category
    const categories = this.groupComponentsByCategory();
    
    Object.entries(categories).forEach(([categoryName, components]) => {
      if (components.length === 0) return;
      
      // Category header
      const categorySection = document.createElement('div');
      categorySection.className = 'component-preview__category';
      
      const categoryHeader = document.createElement('h3');
      categoryHeader.className = 'component-preview__category-header';
      categoryHeader.textContent = this.formatCategoryName(categoryName);
      categorySection.appendChild(categoryHeader);
      
      grid.appendChild(categorySection);
      
      // Component cards
      components.forEach(component => {
        const componentCard = this.createComponentCard(component);
        grid.appendChild(componentCard);
      });
    });
    
    return grid;
  }

  /**
   * Group components by category
   */
  private groupComponentsByCategory(): Record<string, ComponentDefinition[]> {
    const categories: Record<string, ComponentDefinition[]> = {
      buttons: [],
      inputs: [],
      containers: [],
      navigation: [],
      typography: [],
      other: []
    };

    this.components.forEach(component => {
      if (categories[component.category]) {
        categories[component.category].push(component);
      } else {
        categories.other.push(component);
      }
    });

    // Sort components within each category
    Object.values(categories).forEach(categoryComponents => {
      categoryComponents.sort((a, b) => a.name.localeCompare(b.name));
    });

    return categories;
  }

  /**
   * Create a component card with states
   */
  private createComponentCard(component: ComponentDefinition): HTMLElement {
    const card = document.createElement('div');
    card.className = 'component-preview__component';
    
    // Header
    const header = document.createElement('div');
    header.className = 'component-preview__component-header';
    
    const name = document.createElement('h4');
    name.className = 'component-preview__component-name';
    name.textContent = component.name;
    
    const description = document.createElement('p');
    description.className = 'component-preview__component-description';
    description.textContent = component.description;
    
    header.appendChild(name);
    header.appendChild(description);
    card.appendChild(header);
    
    // Body with states
    const body = document.createElement('div');
    body.className = 'component-preview__component-body';
    
    const states = document.createElement('div');
    states.className = 'component-preview__states';
    
    component.states.forEach(state => {
      const stateElement = this.createStateDemo(component, state);
      states.appendChild(stateElement);
    });
    
    body.appendChild(states);
    card.appendChild(body);
    
    return card;
  }

  /**
   * Create a state demonstration
   */
  private createStateDemo(component: ComponentDefinition, state: ComponentState): HTMLElement {
    const stateElement = document.createElement('div');
    stateElement.className = 'component-preview__state';
    
    if (this.options.showStates !== false) {
      const label = document.createElement('div');
      label.className = 'component-preview__state-label';
      label.textContent = state.label;
      stateElement.appendChild(label);
    }
    
    // Demo container
    const demo = document.createElement('div');
    demo.className = 'component-preview__state-demo';
    
    // Render component HTML
    const componentHTML = component.template(state);
    demo.innerHTML = componentHTML;
    
    stateElement.appendChild(demo);
    
    // Show code if requested
    if (this.options.showCode) {
      const code = document.createElement('div');
      code.className = 'component-preview__code';
      code.textContent = componentHTML;
      stateElement.appendChild(code);
    }
    
    return stateElement;
  }

  /**
   * Switch to a different theme
   */
  public switchTheme(themeName: string): void {
    this.currentTheme = themeName;
    
    // Apply theme to document body or container
    document.body.setAttribute('data-theme', themeName);
    
    // Trigger theme change callback
    if (this.options.onThemeChange) {
      this.options.onThemeChange(themeName);
    }
    
    // Update select value
    const select = this.container.querySelector('.component-preview__theme-select') as HTMLSelectElement;
    if (select) {
      select.value = themeName;
    }
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(categoryName: string): string {
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  }

  /**
   * Update components and re-render
   */
  public updateComponents(components: ComponentDefinition[]): void {
    this.components = components;
    this.render();
  }

  /**
   * Update options and re-render
   */
  public updateOptions(options: Partial<ComponentPreviewOptions>): void {
    this.options = { ...this.options, ...options };
    this.render();
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Get available themes
   */
  public getThemes(): ThemeDefinition[] {
    return this.themes;
  }
}

/**
 * Factory function to create a component preview
 */
export function createComponentPreview(
  container: HTMLElement,
  components: ComponentDefinition[],
  themes: ThemeDefinition[],
  options?: ComponentPreviewOptions
): ComponentPreview {
  return new ComponentPreview(container, components, themes, options);
}