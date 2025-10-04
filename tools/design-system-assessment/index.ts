/**
 * Design System Assessment - Main Entry Point
 * 
 * This module provides the main API for the design system assessment tool.
 * It combines token parsing, CSS loading, and analysis utilities.
 */

// Export all token parsing functionality
export {
  TokenParser,
  parseDesignTokens,
  formatTokenValue,
  isColorToken,
  type TokenData,
  type ThemeDefinition,
  type ParsedTokens
} from './token-parser';

// Export CSS loading utilities
export {
  loadCSSFromFile,
  loadDefaultCSS,
  cleanCSSContent,
  extractCSSRules,
  validateCSSContent,
  getCSSStats,
  extractThemeNames,
  minifyCSS,
  formatCSS
} from './css-loader';

// Export comparison table component
export {
  ComparisonTable,
  createComparisonTable,
  type ComparisonTableOptions
} from './comparison-table';

// Export component preview system
export {
  ComponentPreview,
  createComponentPreview,
  type ComponentDefinition,
  type ComponentState,
  type ComponentPreviewOptions
} from './component-preview';

// Export component definitions
export {
  allComponents,
  buttonComponents,
  inputComponents,
  containerComponents,
  navigationComponents,
  typographyComponents,
  getComponentsByCategory,
  getComponentByName,
  getAvailableCategories
} from './component-definitions';

/**
 * Main function to analyze the design system
 */
export async function analyzeDesignSystem(cssFilePath?: string): Promise<{
  tokens: ParsedTokens;
  stats: any;
  validation: any;
}> {
  try {
    // Load CSS content
    const cssContent = cssFilePath 
      ? await loadCSSFromFile(cssFilePath)
      : await loadDefaultCSS();
    
    // Validate CSS content
    const validation = validateCSSContent(cssContent);
    if (!validation.isValid) {
      throw new Error(`Invalid CSS content: ${validation.errors.join(', ')}`);
    }
    
    // Parse tokens
    const tokens = parseDesignTokens(cssContent);
    
    // Get statistics
    const parser = new TokenParser(cssContent);
    const stats = parser.getTokenStats(tokens.tokens);
    
    return {
      tokens,
      stats,
      validation
    };
  } catch (error) {
    throw new Error(`Failed to analyze design system: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Quick analysis function for immediate token extraction
 */
export function quickAnalyze(cssContent: string): ParsedTokens {
  const cleanedCSS = cleanCSSContent(cssContent);
  return parseDesignTokens(cleanedCSS);
}

/**
 * Utility to get theme comparison data
 */
export function getThemeComparison(tokens: ParsedTokens): {
  themes: ThemeDefinition[];
  tokensByCategory: Record<string, TokenData[]>;
  differences: TokenData[];
  missing: TokenData[];
} {
  const parser = new TokenParser();
  
  return {
    themes: tokens.themes,
    tokensByCategory: tokens.categories,
    differences: parser.getDifferentTokens(tokens.tokens),
    missing: parser.getMissingTokens(tokens.tokens)
  };
}

// Export design system analysis functionality
export {
  DesignSystemAnalyzer,
  analyzeDesignSystem as performAnalysis,
  type TokenUsage,
  type AnalysisResult,
  type Inconsistency,
  type Recommendation,
  type AnalysisStats
} from './analysis';

// Export theme testing interface
export {
  ThemeTestingInterface,
  createThemeTestingInterface,
  type ThemeTestingOptions,
  type ThemeError,
  type ValidationResult,
  type ThemeTestingState
} from './theme-testing';

// Import utilities for internal use
import { loadCSSFromFile, loadDefaultCSS, validateCSSContent, cleanCSSContent } from './css-loader';
import { TokenParser, parseDesignTokens, type ParsedTokens, type TokenData, type ThemeDefinition } from './token-parser';