/**
 * Design System Analysis Integration Tests
 * 
 * Tests the analysis functionality with realistic CSS data
 */

import { describe, it, expect } from 'vitest';
import { parseDesignTokens } from './token-parser';
import { DesignSystemAnalyzer } from './analysis';

// Mock CSS content that represents a realistic design system
const mockCSSContent = `
:root {
  /* Spacing System */
  --spacing-xs: 2px;
  --spacing-sm: 4px;
  --spacing-md: 6px;
  --spacing-lg: 8px;
  --spacing-xl: 10px;
  --spacing-xxl: 12px;

  /* Typography */
  --font-size-xs: 10px;
  --font-size-sm: 11px;
  --font-size-md: 12px;
  --font-size-lg: 14px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Colors */
  --color-primary: #007acc;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;
  --color-background: #ffffff;
  --color-text: #212529;

  /* Component Sizes */
  --button-height-sm: 16px;
  --button-height-md: 24px;
  --button-height-lg: 32px;
  --icon-size-sm: 8px;
  --icon-size-md: 10px;
  --icon-size-lg: 16px;

  /* Border Radius */
  --border-radius-sm: 3px;
  --border-radius-md: 4px;
  --border-radius-lg: 6px;

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;

  /* Duplicate values for testing */
  --spacing-duplicate: 8px; /* Same as spacing-lg */
  --another-duplicate: 8px; /* Same as spacing-lg */
}

[data-theme="cybertron"] {
  --color-primary: #00ff88;
  --color-secondary: #ff0088;
  --color-background: #1a1a1a;
  --color-text: #ffffff;
  --spacing-lg: 10px; /* Different from root */
}

[data-theme="figma-light"] {
  --color-primary: #0066cc;
  --color-secondary: #999999;
  --color-background: #f8f9fa;
  --color-text: #333333;
  /* Missing some tokens for testing */
}
`;

describe('Design System Analysis Integration', () => {
  it('should analyze realistic design system tokens', async () => {
    // Use mock CSS content
    const cssContent = mockCSSContent;
    expect(cssContent).toBeTruthy();
    expect(cssContent.length).toBeGreaterThan(0);

    // Parse tokens from CSS
    const tokens = parseDesignTokens(cssContent);
    expect(tokens.tokens.length).toBeGreaterThan(0);
    expect(tokens.themes.length).toBeGreaterThan(0);

    // Perform analysis
    const analyzer = new DesignSystemAnalyzer('src');
    const analysis = await analyzer.analyzeDesignSystem(tokens);

    // Verify analysis structure
    expect(analysis.stats).toBeDefined();
    expect(analysis.tokenUsage).toBeDefined();
    expect(analysis.unusedTokens).toBeDefined();
    expect(analysis.inconsistencies).toBeDefined();
    expect(analysis.recommendations).toBeDefined();

    // Verify statistics make sense
    expect(analysis.stats.totalTokens).toBe(tokens.tokens.length);
    expect(analysis.stats.usedTokens).toBeGreaterThanOrEqual(0);
    expect(analysis.stats.unusedTokens).toBeGreaterThanOrEqual(0);
    expect(analysis.stats.usedTokens + analysis.stats.unusedTokens).toBe(analysis.stats.totalTokens);

    // Verify token usage tracking
    expect(analysis.tokenUsage.length).toBe(tokens.tokens.length);
    analysis.tokenUsage.forEach(usage => {
      expect(usage.tokenName).toBeTruthy();
      expect(typeof usage.usageCount).toBe('number');
      expect(Array.isArray(usage.files)).toBe(true);
      expect(Array.isArray(usage.locations)).toBe(true);
    });

    // Verify inconsistencies structure
    analysis.inconsistencies.forEach(inconsistency => {
      expect(inconsistency.type).toMatch(/^(duplicate-values|naming-pattern|missing-fallback|hardcoded-value)$/);
      expect(inconsistency.severity).toMatch(/^(low|medium|high)$/);
      expect(inconsistency.description).toBeTruthy();
      expect(Array.isArray(inconsistency.suggestions)).toBe(true);
    });

    // Verify recommendations structure
    analysis.recommendations.forEach(recommendation => {
      expect(recommendation.type).toMatch(/^(consolidation|cleanup|naming|organization)$/);
      expect(recommendation.priority).toMatch(/^(low|medium|high)$/);
      expect(recommendation.title).toBeTruthy();
      expect(recommendation.description).toBeTruthy();
      expect(recommendation.impact).toBeTruthy();
      expect(Array.isArray(recommendation.actions)).toBe(true);
    });
  });

  it('should identify specific token categories in realistic CSS', async () => {
    const cssContent = mockCSSContent;
    const tokens = parseDesignTokens(cssContent);

    // Should find spacing tokens
    const spacingTokens = tokens.tokens.filter(t => t.category === 'spacing');
    expect(spacingTokens.length).toBeGreaterThan(0);

    // Should find color tokens
    const colorTokens = tokens.tokens.filter(t => t.category === 'color');
    expect(colorTokens.length).toBeGreaterThan(0);

    // Should find typography tokens
    const typographyTokens = tokens.tokens.filter(t => t.category === 'typography');
    expect(typographyTokens.length).toBeGreaterThan(0);

    // Should find sizing tokens
    const sizingTokens = tokens.tokens.filter(t => t.category === 'sizing');
    expect(sizingTokens.length).toBeGreaterThan(0);
  });

  it('should detect theme differences in realistic tokens', async () => {
    const cssContent = mockCSSContent;
    const tokens = parseDesignTokens(cssContent);

    // Find tokens that have different values across themes
    const tokensWithDifferences = tokens.tokens.filter(token => {
      const values = Object.values(token.values);
      return values.length > 1 && new Set(values).size > 1;
    });

    // Should find some tokens with theme differences
    expect(tokensWithDifferences.length).toBeGreaterThan(0);

    // Verify structure of tokens with differences
    tokensWithDifferences.forEach(token => {
      expect(Object.keys(token.values).length).toBeGreaterThan(1);
      const uniqueValues = new Set(Object.values(token.values));
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });

  it('should generate meaningful recommendations for realistic design system', async () => {
    const cssContent = mockCSSContent;
    const tokens = parseDesignTokens(cssContent);
    const analyzer = new DesignSystemAnalyzer('src');
    const analysis = await analyzer.analyzeDesignSystem(tokens);

    // Should generate some recommendations
    expect(analysis.recommendations.length).toBeGreaterThan(0);

    // Check for common recommendation types
    const recommendationTypes = analysis.recommendations.map(r => r.type);
    const hasCleanupRec = recommendationTypes.includes('cleanup');
    const hasConsolidationRec = recommendationTypes.includes('consolidation');
    const hasOrganizationRec = recommendationTypes.includes('organization');

    // Should have at least one type of recommendation
    expect(hasCleanupRec || hasConsolidationRec || hasOrganizationRec).toBe(true);
  });

  it('should handle large token sets efficiently', async () => {
    const cssContent = mockCSSContent;
    const tokens = parseDesignTokens(cssContent);
    
    const startTime = Date.now();
    const analyzer = new DesignSystemAnalyzer('src');
    const analysis = await analyzer.analyzeDesignSystem(tokens);
    const endTime = Date.now();

    // Analysis should complete in reasonable time (less than 5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);

    // Should handle all tokens
    expect(analysis.tokenUsage.length).toBe(tokens.tokens.length);
  });

  it('should provide accurate token statistics', async () => {
    const cssContent = mockCSSContent;
    const tokens = parseDesignTokens(cssContent);
    const analyzer = new DesignSystemAnalyzer('src');
    const analysis = await analyzer.analyzeDesignSystem(tokens);

    // Statistics should be consistent
    expect(analysis.stats.totalTokens).toBe(tokens.tokens.length);
    expect(analysis.stats.usedTokens + analysis.stats.unusedTokens).toBe(analysis.stats.totalTokens);
    expect(analysis.stats.filesScanned).toBeGreaterThanOrEqual(0);
    expect(analysis.stats.inconsistenciesFound).toBe(analysis.inconsistencies.length);
    expect(analysis.stats.recommendationsGenerated).toBe(analysis.recommendations.length);

    // Usage counts should match
    const totalUsageFromArray = analysis.tokenUsage.reduce((sum, usage) => {
      return sum + (usage.usageCount > 0 ? 1 : 0);
    }, 0);
    expect(analysis.stats.usedTokens).toBe(totalUsageFromArray);
  });
});