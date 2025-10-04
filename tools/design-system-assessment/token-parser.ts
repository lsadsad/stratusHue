/**
 * Token Parser - Extracts and categorizes design tokens from CSS files
 * 
 * This module parses CSS custom properties (design tokens) from the styles.css file
 * and categorizes them by type and theme for analysis and comparison.
 */

export interface TokenData {
  name: string;
  category: 'spacing' | 'typography' | 'color' | 'sizing' | 'border' | 'shadow' | 'transition' | 'other';
  values: Record<string, string>;
  usage: string[];
  description?: string;
}

export interface ThemeDefinition {
  name: string;
  selector: string;
  displayName: string;
}

export interface ParsedTokens {
  tokens: TokenData[];
  themes: ThemeDefinition[];
  categories: Record<string, TokenData[]>;
}

export class TokenParser {
  private cssContent: string = '';
  private themes: ThemeDefinition[] = [
    { name: 'root', selector: ':root', displayName: 'Base/Boilerplate' },
    { name: 'cybertron', selector: '[data-theme="cybertron"]', displayName: 'Cybertron' },
    { name: 'figma-light', selector: '[data-theme="figma-light"]', displayName: 'Figma Light' }
  ];

  constructor(cssContent?: string) {
    if (cssContent) {
      this.cssContent = cssContent;
    }
  }

  /**
   * Load CSS content from a string
   */
  loadCSS(cssContent: string): void {
    this.cssContent = cssContent;
  }

  /**
   * Parse all design tokens from the loaded CSS content
   */
  parseTokens(): ParsedTokens {
    if (!this.cssContent) {
      throw new Error('No CSS content loaded. Call loadCSS() first.');
    }

    const tokens = new Map<string, TokenData>();
    
    // Parse tokens from each theme
    for (const theme of this.themes) {
      const themeTokens = this.parseThemeTokens(theme);
      
      for (const token of themeTokens) {
        if (tokens.has(token.name)) {
          // Merge values for existing token
          const existingToken = tokens.get(token.name)!;
          existingToken.values[theme.name] = token.values[theme.name];
        } else {
          // Add new token
          tokens.set(token.name, token);
        }
      }
    }

    const tokenArray = Array.from(tokens.values());
    const categories = this.categorizeTokens(tokenArray);

    return {
      tokens: tokenArray,
      themes: this.themes,
      categories
    };
  }

  /**
   * Parse tokens from a specific theme selector
   */
  private parseThemeTokens(theme: ThemeDefinition): TokenData[] {
    const tokens: TokenData[] = [];
    
    // Create regex to match the theme selector and its content
    const selectorPattern = this.escapeRegex(theme.selector);
    const themeRegex = new RegExp(
      `${selectorPattern}\\s*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`,
      'gs'
    );

    const matches = this.cssContent.matchAll(themeRegex);
    
    for (const match of matches) {
      const content = match[1];
      const tokenMatches = content.matchAll(/--([^:]+):\s*([^;]+);/g);
      
      for (const tokenMatch of tokenMatches) {
        const tokenName = tokenMatch[1].trim();
        const tokenValue = tokenMatch[2].trim();
        
        // Skip if this looks like a comment or invalid token
        if (tokenName.includes('/*') || tokenValue.includes('/*')) {
          continue;
        }

        const category = this.categorizeToken(tokenName);
        const description = this.extractTokenDescription(tokenName, content);
        
        tokens.push({
          name: tokenName,
          category,
          values: { [theme.name]: tokenValue },
          usage: [],
          description
        });
      }
    }

    return tokens;
  }

  /**
   * Categorize a token based on its name
   */
  private categorizeToken(tokenName: string): TokenData['category'] {
    const name = tokenName.toLowerCase();
    
    if (name.includes('spacing') || name.includes('gap') || name.includes('padding') || name.includes('margin')) {
      return 'spacing';
    }
    
    if (name.includes('font') || name.includes('text') || name.includes('letter')) {
      return 'typography';
    }
    
    if (name.includes('color') || name.includes('bg') || name.includes('border') || 
        name.includes('text') || name.includes('theme') || name.includes('accent') ||
        name.includes('success') || name.includes('warning') || name.includes('error') || 
        name.includes('info') || name.includes('shadow')) {
      return 'color';
    }
    
    if (name.includes('width') || name.includes('height') || name.includes('size') || 
        name.includes('button') || name.includes('icon') || name.includes('container')) {
      return 'sizing';
    }
    
    if (name.includes('radius') || name.includes('border')) {
      return 'border';
    }
    
    if (name.includes('shadow') || name.includes('elevation')) {
      return 'shadow';
    }
    
    if (name.includes('transition') || name.includes('duration') || name.includes('timing')) {
      return 'transition';
    }
    
    return 'other';
  }

  /**
   * Extract description from comments near the token
   */
  private extractTokenDescription(tokenName: string, content: string): string | undefined {
    // Look for comments before the token
    const lines = content.split('\n');
    const tokenLine = lines.findIndex(line => line.includes(`--${tokenName}:`));
    
    if (tokenLine > 0) {
      const previousLine = lines[tokenLine - 1].trim();
      if (previousLine.startsWith('/*') && previousLine.endsWith('*/')) {
        return previousLine.replace(/\/\*\s*|\s*\*\//g, '').trim();
      }
    }
    
    return undefined;
  }

  /**
   * Group tokens by category
   */
  private categorizeTokens(tokens: TokenData[]): Record<string, TokenData[]> {
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

    for (const token of tokens) {
      categories[token.category].push(token);
    }

    // Sort tokens within each category
    for (const category in categories) {
      categories[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return categories;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get tokens that have different values across themes
   */
  getDifferentTokens(tokens: TokenData[]): TokenData[] {
    return tokens.filter(token => {
      const values = Object.values(token.values);
      return values.length > 1 && new Set(values).size > 1;
    });
  }

  /**
   * Get tokens that are missing in some themes
   */
  getMissingTokens(tokens: TokenData[]): TokenData[] {
    const themeCount = this.themes.length;
    return tokens.filter(token => Object.keys(token.values).length < themeCount);
  }

  /**
   * Get usage statistics for tokens
   */
  getTokenStats(tokens: TokenData[]): {
    totalTokens: number;
    byCategory: Record<string, number>;
    differentAcrossThemes: number;
    missingInSomeThemes: number;
  } {
    const byCategory: Record<string, number> = {};
    
    for (const token of tokens) {
      byCategory[token.category] = (byCategory[token.category] || 0) + 1;
    }

    return {
      totalTokens: tokens.length,
      byCategory,
      differentAcrossThemes: this.getDifferentTokens(tokens).length,
      missingInSomeThemes: this.getMissingTokens(tokens).length
    };
  }
}

/**
 * Utility function to create a token parser instance and parse CSS content
 */
export function parseDesignTokens(cssContent: string): ParsedTokens {
  const parser = new TokenParser(cssContent);
  return parser.parseTokens();
}

/**
 * Utility function to format token values for display
 */
export function formatTokenValue(value: string): string {
  // Clean up common CSS value formats for better readability
  return value
    .replace(/calc\(/g, 'calc(')
    .replace(/var\(--([^)]+)\)/g, 'var(--$1)')
    .replace(/rgba?\([^)]+\)/g, (match) => {
      // Format color values
      return match.replace(/\s+/g, ' ');
    })
    .trim();
}

/**
 * Utility function to detect if a token value is a color
 */
export function isColorToken(value: string): boolean {
  return /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|[a-z]+)$/i.test(value.trim()) ||
         value.includes('color') ||
         value.includes('rgba') ||
         value.includes('hsla');
}