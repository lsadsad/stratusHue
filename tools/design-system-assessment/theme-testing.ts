/**
 * Theme Testing Interface - Interactive theme switching and validation system
 * 
 * This module provides a comprehensive theme testing interface that allows users to:
 * - Switch between themes with real-time preview
 * - Validate token resolution across all themes
 * - Test component behavior with simultaneous updates
 * - Log and highlight errors during theme switching
 */

import { ThemeDefinition, TokenData } from './token-parser.js';
import { ComponentDefinition } from './component-preview.js';

export interface ThemeTestingOptions {
  showValidation?: boolean;
  showErrors?: boolean;
  enableLogging?: boolean;
  onThemeChange?: (theme: string, errors: ThemeError[]) => void;
  onValidationComplete?: (results: ValidationResult[]) => void;
}

export interface ThemeError {
  type: 'token-resolution' | 'component-render' | 'css-parse' | 'theme-switch';
  severity: 'low' | 'medium' | 'high';
  message: string;
  theme: string;
  token?: string;
  component?: string;
  details?: string;
}

export interface ValidationResult {
  theme: string;
  tokenName: string;
  resolved: boolean;
  value?: string;
  error?: string;
}

export interface ThemeTestingState {
  currentTheme: string;
  availableThemes: ThemeDefinition[];
  errors: ThemeError[];
  validationResults: ValidationResult[];
  isValidating: boolean;
  isSwitching: boolean;
}

export class ThemeTestingInterface {
  private container: HTMLElement;
  private themes: ThemeDefinition[];
  private tokens: TokenData[];
  private components: ComponentDefinition[];
  private options: ThemeTestingOptions;
  private state: ThemeTestingState;
  private errorLog: ThemeError[] = [];
  private validationCache: Map<string, ValidationResult[]> = new Map();

  constructor(
    container: HTMLElement,
    themes: ThemeDefinition[],
    tokens: TokenData[],
    components: ComponentDefinition[],
    options: ThemeTestingOptions = {}
  ) {
    this.container = container;
    this.themes = themes;
    this.tokens = tokens;
    this.components = components;
    this.options = options;
    
    this.state = {
      currentTheme: themes[0]?.name || 'boilerplate',
      availableThemes: themes,
      errors: [],
      validationResults: [],
      isValidating: false,
      isSwitching: false
    };

    this.render();
    this.validateCurrentTheme();
  }

  /**
   * Render the complete theme testing interface
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'theme-testing-interface';
    
    // Add CSS styles
    this.addStyles();
    
    // Create interface sections
    const header = this.createHeader();
    const controls = this.createThemeControls();
    const validation = this.createValidationPanel();
    const errors = this.createErrorPanel();
    const componentTest = this.createComponentTestArea();
    
    this.container.appendChild(header);
    this.container.appendChild(controls);
    
    if (this.options.showValidation !== false) {
      this.container.appendChild(validation);
    }
    
    if (this.options.showErrors !== false) {
      this.container.appendChild(errors);
    }
    
    this.container.appendChild(componentTest);
  }

  /**
   * Add component-specific CSS styles
   */
  private addStyles(): void {
    const styleId = 'theme-testing-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .theme-testing-interface {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--theme-bg-primary, #ffffff);
        color: var(--theme-text-primary, #333333);
        border-radius: var(--border-radius-md, 4px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg, 8px);
      }

      .theme-testing__header {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-secondary, #f8f9fa);
        border-bottom: 1px solid var(--theme-border-primary, #e1e5e9);
      }

      .theme-testing__title {
        font-size: var(--font-size-md, 12px);
        font-weight: var(--font-weight-semibold, 600);
        color: var(--theme-text-primary, #333333);
        margin: 0 0 var(--spacing-sm, 4px) 0;
      }

      .theme-testing__subtitle {
        font-size: var(--font-size-xs, 10px);
        color: var(--theme-text-muted, #999999);
        margin: 0;
      }

      .theme-testing__controls {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-primary, #ffffff);
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-md, 6px);
        align-items: center;
      }

      .theme-testing__control-group {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 4px);
      }

      .theme-testing__label {
        font-size: var(--font-size-sm, 11px);
        font-weight: var(--font-weight-medium, 500);
        color: var(--theme-text-secondary, #666666);
      }

      .theme-testing__theme-select {
        padding: var(--spacing-sm, 4px) var(--spacing-md, 6px);
        border: 1px solid var(--theme-border-primary, #e1e5e9);
        border-radius: var(--border-radius-sm, 3px);
        background: var(--theme-bg-primary, #ffffff);
        color: var(--theme-text-primary, #333333);
        font-size: var(--font-size-sm, 11px);
        cursor: pointer;
        min-width: 120px;
      }

      .theme-testing__theme-select:focus {
        outline: 2px solid var(--theme-info, #007acc);
        outline-offset: 2px;
      }

      .theme-testing__theme-select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .theme-testing__action-btn {
        padding: var(--spacing-sm, 4px) var(--spacing-md, 6px);
        border: 1px solid var(--theme-border-primary, #e1e5e9);
        border-radius: var(--border-radius-sm, 3px);
        background: var(--theme-bg-secondary, #f8f9fa);
        color: var(--theme-text-primary, #333333);
        font-size: var(--font-size-xs, 10px);
        cursor: pointer;
        transition: all 150ms ease-out;
      }

      .theme-testing__action-btn:hover:not(:disabled) {
        background: var(--theme-interactive-hover, #e9ecef);
        border-color: var(--theme-info, #007acc);
      }

      .theme-testing__action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .theme-testing__action-btn--primary {
        background: var(--theme-info, #007acc);
        color: white;
        border-color: var(--theme-info, #007acc);
      }

      .theme-testing__action-btn--primary:hover:not(:disabled) {
        background: var(--theme-info-hover, #0056b3);
      }

      .theme-testing__validation-panel {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-elevated, #ffffff);
        border: 1px solid var(--theme-border-secondary, #f0f0f0);
        border-radius: var(--border-radius-sm, 3px);
        margin: 0 var(--spacing-lg, 8px);
      }

      .theme-testing__panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-md, 6px);
      }

      .theme-testing__panel-title {
        font-size: var(--font-size-sm, 11px);
        font-weight: var(--font-weight-medium, 500);
        color: var(--theme-text-primary, #333333);
        margin: 0;
      }

      .theme-testing__status-badge {
        padding: 2px var(--spacing-sm, 4px);
        border-radius: var(--border-radius-xs, 2px);
        font-size: var(--font-size-xs, 10px);
        font-weight: var(--font-weight-medium, 500);
      }

      .theme-testing__status-badge--success {
        background: var(--theme-success-bg, #d4edda);
        color: var(--theme-success, #155724);
      }

      .theme-testing__status-badge--warning {
        background: var(--theme-warning-bg, #fff3cd);
        color: var(--theme-warning, #856404);
      }

      .theme-testing__status-badge--error {
        background: var(--theme-error-bg, #f8d7da);
        color: var(--theme-error, #721c24);
      }

      .theme-testing__validation-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--theme-border-secondary, #f0f0f0);
        border-radius: var(--border-radius-xs, 2px);
      }

      .theme-testing__validation-item {
        padding: var(--spacing-sm, 4px) var(--spacing-md, 6px);
        border-bottom: 1px solid var(--theme-border-secondary, #f0f0f0);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: var(--font-size-xs, 10px);
      }

      .theme-testing__validation-item:last-child {
        border-bottom: none;
      }

      .theme-testing__validation-item--success {
        background: var(--theme-success-bg-light, #f8fff9);
      }

      .theme-testing__validation-item--error {
        background: var(--theme-error-bg-light, #fff8f8);
      }

      .theme-testing__token-name {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        color: var(--theme-text-secondary, #666666);
      }

      .theme-testing__token-value {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        color: var(--theme-text-muted, #999999);
        font-size: var(--font-size-xs, 10px);
      }

      .theme-testing__error-panel {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-error-bg-light, #fff8f8);
        border: 1px solid var(--theme-error-border, #f5c6cb);
        border-radius: var(--border-radius-sm, 3px);
        margin: 0 var(--spacing-lg, 8px);
      }

      .theme-testing__error-list {
        max-height: 150px;
        overflow-y: auto;
      }

      .theme-testing__error-item {
        padding: var(--spacing-sm, 4px) 0;
        border-bottom: 1px solid var(--theme-error-border-light, #fdeaea);
        font-size: var(--font-size-xs, 10px);
      }

      .theme-testing__error-item:last-child {
        border-bottom: none;
      }

      .theme-testing__error-message {
        color: var(--theme-error, #721c24);
        font-weight: var(--font-weight-medium, 500);
        margin-bottom: 2px;
      }

      .theme-testing__error-details {
        color: var(--theme-text-muted, #999999);
        font-size: var(--font-size-xs, 10px);
      }

      .theme-testing__component-test {
        padding: var(--spacing-lg, 8px);
        background: var(--theme-bg-primary, #ffffff);
        border-top: 1px solid var(--theme-border-secondary, #f0f0f0);
      }

      .theme-testing__test-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md, 6px);
        margin-top: var(--spacing-md, 6px);
      }

      .theme-testing__test-component {
        padding: var(--spacing-md, 6px);
        border: 1px solid var(--theme-border-secondary, #f0f0f0);
        border-radius: var(--border-radius-sm, 3px);
        background: var(--theme-bg-elevated, #ffffff);
        text-align: center;
      }

      .theme-testing__test-component-name {
        font-size: var(--font-size-xs, 10px);
        color: var(--theme-text-secondary, #666666);
        margin-bottom: var(--spacing-sm, 4px);
      }

      .theme-testing__spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid var(--theme-border-secondary, #f0f0f0);
        border-top: 2px solid var(--theme-info, #007acc);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Theme transition support */
      .theme-testing-interface,
      .theme-testing-interface * {
        transition: 
          background-color 200ms ease-out,
          border-color 200ms ease-out,
          color 200ms ease-out;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .theme-testing__controls {
          flex-direction: column;
          align-items: stretch;
        }
        
        .theme-testing__control-group {
          justify-content: space-between;
        }
        
        .theme-testing__test-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Create interface header
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'theme-testing__header';
    
    const title = document.createElement('h2');
    title.className = 'theme-testing__title';
    title.textContent = 'Theme Testing Interface';
    
    const subtitle = document.createElement('p');
    subtitle.className = 'theme-testing__subtitle';
    subtitle.textContent = 'Test theme switching, validate token resolution, and identify errors';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    
    return header;
  }

  /**
   * Create theme switching controls
   */
  private createThemeControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'theme-testing__controls';
    
    // Theme selector
    const themeGroup = document.createElement('div');
    themeGroup.className = 'theme-testing__control-group';
    
    const themeLabel = document.createElement('label');
    themeLabel.className = 'theme-testing__label';
    themeLabel.textContent = 'Current Theme:';
    themeLabel.htmlFor = 'theme-testing-select';
    
    const themeSelect = document.createElement('select');
    themeSelect.className = 'theme-testing__theme-select';
    themeSelect.id = 'theme-testing-select';
    
    this.themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.name;
      option.textContent = theme.displayName;
      option.selected = theme.name === this.state.currentTheme;
      themeSelect.appendChild(option);
    });
    
    themeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.switchTheme(target.value);
    });
    
    themeGroup.appendChild(themeLabel);
    themeGroup.appendChild(themeSelect);
    
    // Action buttons
    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'theme-testing__control-group';
    
    const validateBtn = document.createElement('button');
    validateBtn.className = 'theme-testing__action-btn theme-testing__action-btn--primary';
    validateBtn.textContent = 'Validate All Themes';
    validateBtn.addEventListener('click', () => this.validateAllThemes());
    
    const clearErrorsBtn = document.createElement('button');
    clearErrorsBtn.className = 'theme-testing__action-btn';
    clearErrorsBtn.textContent = 'Clear Errors';
    clearErrorsBtn.addEventListener('click', () => this.clearErrors());
    
    const testComponentsBtn = document.createElement('button');
    testComponentsBtn.className = 'theme-testing__action-btn';
    testComponentsBtn.textContent = 'Test Components';
    testComponentsBtn.addEventListener('click', () => this.testAllComponents());
    
    actionsGroup.appendChild(validateBtn);
    actionsGroup.appendChild(clearErrorsBtn);
    actionsGroup.appendChild(testComponentsBtn);
    
    controls.appendChild(themeGroup);
    controls.appendChild(actionsGroup);
    
    return controls;
  }

  /**
   * Create validation results panel
   */
  private createValidationPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'theme-testing__validation-panel';
    
    const header = document.createElement('div');
    header.className = 'theme-testing__panel-header';
    
    const title = document.createElement('h3');
    title.className = 'theme-testing__panel-title';
    title.textContent = 'Token Validation Results';
    
    const status = document.createElement('span');
    status.className = 'theme-testing__status-badge';
    status.id = 'validation-status';
    
    header.appendChild(title);
    header.appendChild(status);
    
    const list = document.createElement('div');
    list.className = 'theme-testing__validation-list';
    list.id = 'validation-results';
    
    panel.appendChild(header);
    panel.appendChild(list);
    
    this.updateValidationDisplay();
    
    return panel;
  }

  /**
   * Create error logging panel
   */
  private createErrorPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'theme-testing__error-panel';
    panel.style.display = this.errorLog.length > 0 ? 'block' : 'none';
    
    const header = document.createElement('div');
    header.className = 'theme-testing__panel-header';
    
    const title = document.createElement('h3');
    title.className = 'theme-testing__panel-title';
    title.textContent = 'Error Log';
    
    const count = document.createElement('span');
    count.className = 'theme-testing__status-badge theme-testing__status-badge--error';
    count.id = 'error-count';
    count.textContent = `${this.errorLog.length} errors`;
    
    header.appendChild(title);
    header.appendChild(count);
    
    const list = document.createElement('div');
    list.className = 'theme-testing__error-list';
    list.id = 'error-results';
    
    panel.appendChild(header);
    panel.appendChild(list);
    
    this.updateErrorDisplay();
    
    return panel;
  }

  /**
   * Create component testing area
   */
  private createComponentTestArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'theme-testing__component-test';
    
    const title = document.createElement('h3');
    title.className = 'theme-testing__panel-title';
    title.textContent = 'Component Theme Testing';
    
    const grid = document.createElement('div');
    grid.className = 'theme-testing__test-grid';
    grid.id = 'component-test-grid';
    
    area.appendChild(title);
    area.appendChild(grid);
    
    this.renderTestComponents();
    
    return area;
  }

  /**
   * Switch to a different theme with validation
   */
  public async switchTheme(themeName: string): Promise<void> {
    if (this.state.isSwitching) return;
    
    this.state.isSwitching = true;
    this.updateControlsState();
    
    try {
      // Log theme switch attempt
      this.logInfo(`Switching to theme: ${themeName}`);
      
      // Apply theme to document
      document.body.setAttribute('data-theme', themeName);
      
      // Update state
      const previousTheme = this.state.currentTheme;
      this.state.currentTheme = themeName;
      
      // Validate new theme
      await this.validateCurrentTheme();
      
      // Test component rendering
      await this.testComponentsForTheme(themeName);
      
      // Update UI
      this.updateThemeSelect();
      this.updateValidationDisplay();
      this.updateErrorDisplay();
      this.renderTestComponents();
      
      // Trigger callback
      if (this.options.onThemeChange) {
        this.options.onThemeChange(themeName, this.state.errors);
      }
      
      this.logInfo(`Successfully switched from ${previousTheme} to ${themeName}`);
      
    } catch (error) {
      this.logError('theme-switch', 'high', `Failed to switch to theme ${themeName}`, themeName, undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.state.isSwitching = false;
      this.updateControlsState();
    }
  }

  /**
   * Validate token resolution for current theme
   */
  private async validateCurrentTheme(): Promise<void> {
    return this.validateTheme(this.state.currentTheme);
  }

  /**
   * Validate token resolution for a specific theme
   */
  private async validateTheme(themeName: string): Promise<void> {
    this.state.isValidating = true;
    this.updateControlsState();
    
    try {
      const results: ValidationResult[] = [];
      
      // Check if we have cached results
      if (this.validationCache.has(themeName)) {
        this.state.validationResults = this.validationCache.get(themeName)!;
        return;
      }
      
      // Validate each token for this theme
      for (const token of this.tokens) {
        try {
          const hasValue = token.values.hasOwnProperty(themeName);
          const value = token.values[themeName];
          
          if (!hasValue) {
            results.push({
              theme: themeName,
              tokenName: token.name,
              resolved: false,
              error: `Token not defined for theme ${themeName}`
            });
            
            this.logError('token-resolution', 'medium', `Token ${token.name} not defined for theme ${themeName}`, themeName, token.name);
          } else if (!value || value.trim() === '') {
            results.push({
              theme: themeName,
              tokenName: token.name,
              resolved: false,
              value: value,
              error: 'Empty token value'
            });
            
            this.logError('token-resolution', 'low', `Token ${token.name} has empty value in theme ${themeName}`, themeName, token.name);
          } else {
            results.push({
              theme: themeName,
              tokenName: token.name,
              resolved: true,
              value: value
            });
          }
        } catch (error) {
          results.push({
            theme: themeName,
            tokenName: token.name,
            resolved: false,
            error: error instanceof Error ? error.message : 'Validation error'
          });
          
          this.logError('token-resolution', 'high', `Error validating token ${token.name}`, themeName, token.name, undefined, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Cache results
      this.validationCache.set(themeName, results);
      this.state.validationResults = results;
      
      // Trigger callback
      if (this.options.onValidationComplete) {
        this.options.onValidationComplete(results);
      }
      
    } finally {
      this.state.isValidating = false;
      this.updateControlsState();
    }
  }

  /**
   * Validate all themes
   */
  public async validateAllThemes(): Promise<void> {
    this.logInfo('Starting validation of all themes');
    
    for (const theme of this.themes) {
      await this.validateTheme(theme.name);
    }
    
    this.updateValidationDisplay();
    this.logInfo('Completed validation of all themes');
  }

  /**
   * Test component rendering for current theme
   */
  private async testComponentsForTheme(themeName: string): Promise<void> {
    try {
      // Test a sample of components to ensure they render correctly
      const testComponents = this.components.slice(0, 5); // Test first 5 components
      
      for (const component of testComponents) {
        try {
          // Create a temporary element to test rendering
          const testElement = document.createElement('div');
          testElement.setAttribute('data-theme', themeName);
          
          // Try to render the first state of the component
          if (component.states.length > 0) {
            const html = component.template(component.states[0]);
            testElement.innerHTML = html;
            
            // Check if rendering was successful (basic check)
            if (testElement.children.length === 0 && html.trim() !== '') {
              this.logError('component-render', 'medium', `Component ${component.name} failed to render in theme ${themeName}`, themeName, undefined, component.name);
            }
          }
        } catch (error) {
          this.logError('component-render', 'high', `Error testing component ${component.name}`, themeName, undefined, component.name, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } catch (error) {
      this.logError('component-render', 'high', `Error during component testing for theme ${themeName}`, themeName, undefined, undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test all components across all themes
   */
  public async testAllComponents(): Promise<void> {
    this.logInfo('Starting component testing across all themes');
    
    for (const theme of this.themes) {
      await this.testComponentsForTheme(theme.name);
    }
    
    this.updateErrorDisplay();
    this.logInfo('Completed component testing across all themes');
  }

  /**
   * Log an error
   */
  private logError(
    type: ThemeError['type'],
    severity: ThemeError['severity'],
    message: string,
    theme: string,
    token?: string,
    component?: string,
    details?: string
  ): void {
    const error: ThemeError = {
      type,
      severity,
      message,
      theme,
      token,
      component,
      details
    };
    
    this.errorLog.push(error);
    this.state.errors = this.errorLog;
    
    if (this.options.enableLogging !== false) {
      console.warn(`[Theme Testing] ${severity.toUpperCase()}: ${message}`, error);
    }
  }

  /**
   * Log an info message
   */
  private logInfo(message: string): void {
    if (this.options.enableLogging !== false) {
      console.info(`[Theme Testing] ${message}`);
    }
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errorLog = [];
    this.state.errors = [];
    this.updateErrorDisplay();
    this.logInfo('Cleared all errors');
  }

  /**
   * Update validation display
   */
  private updateValidationDisplay(): void {
    const statusElement = document.getElementById('validation-status');
    const resultsElement = document.getElementById('validation-results');
    
    if (!statusElement || !resultsElement) return;
    
    const results = this.state.validationResults;
    const successCount = results.filter(r => r.resolved).length;
    const errorCount = results.filter(r => !r.resolved).length;
    
    // Update status badge
    statusElement.className = 'theme-testing__status-badge';
    if (errorCount === 0) {
      statusElement.classList.add('theme-testing__status-badge--success');
      statusElement.textContent = `${successCount} tokens valid`;
    } else {
      statusElement.classList.add('theme-testing__status-badge--error');
      statusElement.textContent = `${errorCount} errors, ${successCount} valid`;
    }
    
    // Update results list
    resultsElement.innerHTML = '';
    
    if (this.state.isValidating) {
      const spinner = document.createElement('div');
      spinner.className = 'theme-testing__spinner';
      resultsElement.appendChild(spinner);
      return;
    }
    
    results.forEach(result => {
      const item = document.createElement('div');
      item.className = `theme-testing__validation-item ${result.resolved ? 'theme-testing__validation-item--success' : 'theme-testing__validation-item--error'}`;
      
      const tokenInfo = document.createElement('div');
      
      const tokenName = document.createElement('span');
      tokenName.className = 'theme-testing__token-name';
      tokenName.textContent = result.tokenName;
      
      const tokenValue = document.createElement('span');
      tokenValue.className = 'theme-testing__token-value';
      tokenValue.textContent = result.resolved ? `: ${result.value}` : ` - ${result.error}`;
      
      tokenInfo.appendChild(tokenName);
      tokenInfo.appendChild(tokenValue);
      
      const status = document.createElement('span');
      status.textContent = result.resolved ? '✓' : '✗';
      status.style.color = result.resolved ? 'var(--theme-success, #28a745)' : 'var(--theme-error, #dc3545)';
      
      item.appendChild(tokenInfo);
      item.appendChild(status);
      
      resultsElement.appendChild(item);
    });
  }

  /**
   * Update error display
   */
  private updateErrorDisplay(): void {
    const panel = this.container.querySelector('.theme-testing__error-panel') as HTMLElement;
    const countElement = document.getElementById('error-count');
    const resultsElement = document.getElementById('error-results');
    
    if (!panel || !countElement || !resultsElement) return;
    
    // Show/hide panel based on error count
    panel.style.display = this.errorLog.length > 0 ? 'block' : 'none';
    
    // Update error count
    countElement.textContent = `${this.errorLog.length} errors`;
    
    // Update error list
    resultsElement.innerHTML = '';
    
    this.errorLog.forEach(error => {
      const item = document.createElement('div');
      item.className = 'theme-testing__error-item';
      
      const message = document.createElement('div');
      message.className = 'theme-testing__error-message';
      message.textContent = error.message;
      
      const details = document.createElement('div');
      details.className = 'theme-testing__error-details';
      
      const detailParts = [];
      detailParts.push(`Theme: ${error.theme}`);
      detailParts.push(`Type: ${error.type}`);
      detailParts.push(`Severity: ${error.severity}`);
      
      if (error.token) detailParts.push(`Token: ${error.token}`);
      if (error.component) detailParts.push(`Component: ${error.component}`);
      if (error.details) detailParts.push(`Details: ${error.details}`);
      
      details.textContent = detailParts.join(' | ');
      
      item.appendChild(message);
      item.appendChild(details);
      
      resultsElement.appendChild(item);
    });
  }

  /**
   * Update theme select element
   */
  private updateThemeSelect(): void {
    const select = document.getElementById('theme-testing-select') as HTMLSelectElement;
    if (select) {
      select.value = this.state.currentTheme;
    }
  }

  /**
   * Update controls state (enabled/disabled)
   */
  private updateControlsState(): void {
    const select = document.getElementById('theme-testing-select') as HTMLSelectElement;
    const buttons = this.container.querySelectorAll('.theme-testing__action-btn');
    
    const isDisabled = this.state.isSwitching || this.state.isValidating;
    
    if (select) {
      select.disabled = isDisabled;
    }
    
    buttons.forEach(button => {
      (button as HTMLButtonElement).disabled = isDisabled;
    });
  }

  /**
   * Render test components
   */
  private renderTestComponents(): void {
    const grid = document.getElementById('component-test-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Show a sample of components for testing
    const testComponents = this.components.slice(0, 6);
    
    testComponents.forEach(component => {
      const testElement = document.createElement('div');
      testElement.className = 'theme-testing__test-component';
      
      const name = document.createElement('div');
      name.className = 'theme-testing__test-component-name';
      name.textContent = component.name;
      
      const demo = document.createElement('div');
      if (component.states.length > 0) {
        try {
          demo.innerHTML = component.template(component.states[0]);
        } catch (error) {
          demo.textContent = 'Render Error';
          demo.style.color = 'var(--theme-error, #dc3545)';
        }
      }
      
      testElement.appendChild(name);
      testElement.appendChild(demo);
      
      grid.appendChild(testElement);
    });
  }

  /**
   * Get current theme
   */
  public getCurrentTheme(): string {
    return this.state.currentTheme;
  }

  /**
   * Get current errors
   */
  public getErrors(): ThemeError[] {
    return [...this.errorLog];
  }

  /**
   * Get validation results
   */
  public getValidationResults(): ValidationResult[] {
    return [...this.state.validationResults];
  }

  /**
   * Get current state
   */
  public getState(): ThemeTestingState {
    return { ...this.state };
  }
}

/**
 * Factory function to create a theme testing interface
 */
export function createThemeTestingInterface(
  container: HTMLElement,
  themes: ThemeDefinition[],
  tokens: TokenData[],
  components: ComponentDefinition[],
  options?: ThemeTestingOptions
): ThemeTestingInterface {
  return new ThemeTestingInterface(container, themes, tokens, components, options);
}