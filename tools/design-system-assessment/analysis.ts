/**
 * Design System Analysis - Token usage scanning and optimization recommendations
 * 
 * This module analyzes design token usage across TypeScript files and provides
 * insights for optimization and consistency improvements.
 */

import { TokenData, ParsedTokens } from './token-parser';
import * as fs from 'fs';
import * as path from 'path';

export interface TokenUsage {
  tokenName: string;
  usageCount: number;
  files: string[];
  locations: Array<{
    file: string;
    line: number;
    context: string;
  }>;
}

export interface AnalysisResult {
  tokenUsage: TokenUsage[];
  unusedTokens: TokenData[];
  inconsistencies: Inconsistency[];
  recommendations: Recommendation[];
  stats: AnalysisStats;
}

export interface Inconsistency {
  type: 'duplicate-values' | 'naming-pattern' | 'missing-fallback' | 'hardcoded-value';
  severity: 'low' | 'medium' | 'high';
  description: string;
  tokens?: string[];
  files?: string[];
  suggestions: string[];
}

export interface Recommendation {
  type: 'consolidation' | 'cleanup' | 'naming' | 'organization';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  actions: string[];
}

export interface AnalysisStats {
  totalTokens: number;
  usedTokens: number;
  unusedTokens: number;
  filesScanned: number;
  inconsistenciesFound: number;
  recommendationsGenerated: number;
}

export class DesignSystemAnalyzer {
  private sourceDirectory: string;
  private excludePatterns: string[] = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'test',
    'spec',
    '*.test.ts',
    '*.spec.ts'
  ];

  constructor(sourceDirectory: string = 'src') {
    this.sourceDirectory = sourceDirectory;
  }

  /**
   * Perform comprehensive design system analysis
   */
  async analyzeDesignSystem(tokens: ParsedTokens): Promise<AnalysisResult> {
    const typeScriptFiles = await this.findTypeScriptFiles();
    const tokenUsage = await this.scanTokenUsage(tokens.tokens, typeScriptFiles);
    const unusedTokens = this.findUnusedTokens(tokens.tokens, tokenUsage);
    const inconsistencies = this.identifyInconsistencies(tokens.tokens, tokenUsage);
    const recommendations = this.generateRecommendations(tokens.tokens, tokenUsage, inconsistencies);

    const stats: AnalysisStats = {
      totalTokens: tokens.tokens.length,
      usedTokens: tokenUsage.filter(usage => usage.usageCount > 0).length,
      unusedTokens: unusedTokens.length,
      filesScanned: typeScriptFiles.length,
      inconsistenciesFound: inconsistencies.length,
      recommendationsGenerated: recommendations.length
    };

    return {
      tokenUsage,
      unusedTokens,
      inconsistencies,
      recommendations,
      stats
    };
  }

  /**
   * Find all TypeScript files in the source directory
   */
  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip excluded patterns
          if (this.shouldExclude(fullPath)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // In test environment or when directory doesn't exist, return empty array
        console.warn(`Warning: Could not scan directory ${dir}:`, error);
      }
    };

    try {
      await scanDirectory(this.sourceDirectory);
    } catch (error) {
      // Return empty array if scanning fails
      console.warn(`Warning: Could not scan source directory ${this.sourceDirectory}:`, error);
    }
    
    return files;
  }

  /**
   * Check if a file path should be excluded from analysis
   */
  private shouldExclude(filePath: string): boolean {
    return this.excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  /**
   * Scan TypeScript files for token usage
   */
  private async scanTokenUsage(tokens: TokenData[], files: string[]): Promise<TokenUsage[]> {
    const usageMap = new Map<string, TokenUsage>();
    
    // Initialize usage tracking for all tokens
    for (const token of tokens) {
      usageMap.set(token.name, {
        tokenName: token.name,
        usageCount: 0,
        files: [],
        locations: []
      });
    }

    // Scan each file for token usage
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          
          // Look for CSS custom property usage: var(--token-name)
          const varMatches = line.matchAll(/var\(--([^)]+)\)/g);
          for (const match of varMatches) {
            const tokenName = match[1];
            if (usageMap.has(tokenName)) {
              const usage = usageMap.get(tokenName)!;
              usage.usageCount++;
              if (!usage.files.includes(file)) {
                usage.files.push(file);
              }
              usage.locations.push({
                file,
                line: lineIndex + 1,
                context: line.trim()
              });
            }
          }
          
          // Look for direct token references in strings
          for (const token of tokens) {
            if (line.includes(`--${token.name}`) && !line.includes(`var(--${token.name})`)) {
              const usage = usageMap.get(token.name)!;
              usage.usageCount++;
              if (!usage.files.includes(file)) {
                usage.files.push(file);
              }
              usage.locations.push({
                file,
                line: lineIndex + 1,
                context: line.trim()
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read file ${file}:`, error);
      }
    }

    return Array.from(usageMap.values());
  }

  /**
   * Find tokens that are not used in any TypeScript files
   */
  private findUnusedTokens(tokens: TokenData[], usage: TokenUsage[]): TokenData[] {
    const usedTokenNames = new Set(
      usage.filter(u => u.usageCount > 0).map(u => u.tokenName)
    );
    
    return tokens.filter(token => !usedTokenNames.has(token.name));
  }

  /**
   * Identify inconsistencies in the design system
   */
  private identifyInconsistencies(tokens: TokenData[], usage: TokenUsage[]): Inconsistency[] {
    const inconsistencies: Inconsistency[] = [];
    
    // Find tokens with duplicate values
    const valueGroups = new Map<string, string[]>();
    for (const token of tokens) {
      for (const [theme, value] of Object.entries(token.values)) {
        if (!valueGroups.has(value)) {
          valueGroups.set(value, []);
        }
        valueGroups.get(value)!.push(`${token.name} (${theme})`);
      }
    }
    
    for (const [value, tokenList] of valueGroups) {
      if (tokenList.length > 1 && !this.isIntentionalDuplicate(value)) {
        inconsistencies.push({
          type: 'duplicate-values',
          severity: 'medium',
          description: `Multiple tokens have the same value: ${value}`,
          tokens: tokenList,
          suggestions: [
            'Consider consolidating these tokens if they serve the same purpose',
            'Ensure semantic naming reflects the intended use case'
          ]
        });
      }
    }
    
    // Find naming pattern inconsistencies
    const namingInconsistencies = this.findNamingInconsistencies(tokens);
    inconsistencies.push(...namingInconsistencies);
    
    // Find missing fallbacks
    const missingFallbacks = this.findMissingFallbacks(tokens);
    inconsistencies.push(...missingFallbacks);
    
    return inconsistencies;
  }

  /**
   * Check if duplicate values are intentional (e.g., semantic aliases)
   */
  private isIntentionalDuplicate(value: string): boolean {
    // Common intentional duplicates
    const intentionalValues = ['0', '0px', '1px', 'transparent', 'inherit', 'none'];
    return intentionalValues.includes(value);
  }

  /**
   * Find naming pattern inconsistencies
   */
  private findNamingInconsistencies(tokens: TokenData[]): Inconsistency[] {
    const inconsistencies: Inconsistency[] = [];
    const categories = new Map<string, string[]>();
    
    // Group tokens by category
    for (const token of tokens) {
      if (!categories.has(token.category)) {
        categories.set(token.category, []);
      }
      categories.get(token.category)!.push(token.name);
    }
    
    // Check naming patterns within categories
    for (const [category, tokenNames] of categories) {
      const patterns = this.analyzeNamingPatterns(tokenNames);
      if (patterns.inconsistencies.length > 0) {
        inconsistencies.push({
          type: 'naming-pattern',
          severity: 'low',
          description: `Inconsistent naming patterns in ${category} tokens`,
          tokens: patterns.inconsistencies,
          suggestions: [
            `Follow consistent naming pattern: ${patterns.suggestedPattern}`,
            'Use semantic names that describe purpose, not appearance'
          ]
        });
      }
    }
    
    return inconsistencies;
  }

  /**
   * Analyze naming patterns within a group of token names
   */
  private analyzeNamingPatterns(tokenNames: string[]): {
    suggestedPattern: string;
    inconsistencies: string[];
  } {
    // Simple pattern analysis - could be enhanced
    const patterns = new Map<string, number>();
    
    for (const name of tokenNames) {
      const parts = name.split('-');
      if (parts.length > 1) {
        const pattern = parts.slice(0, -1).join('-') + '-*';
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    }
    
    const mostCommonPattern = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    const suggestedPattern = mostCommonPattern ? mostCommonPattern[0] : 'category-size';
    const inconsistencies = tokenNames.filter(name => {
      if (!mostCommonPattern) return false;
      const pattern = mostCommonPattern[0].replace('-*', '');
      return !name.startsWith(pattern);
    });
    
    return { suggestedPattern, inconsistencies };
  }

  /**
   * Find tokens missing fallback values
   */
  private findMissingFallbacks(tokens: TokenData[]): Inconsistency[] {
    const inconsistencies: Inconsistency[] = [];
    
    for (const token of tokens) {
      const themes = Object.keys(token.values);
      if (themes.length < 3) { // Assuming 3 themes: root, cybertron, figma-light
        inconsistencies.push({
          type: 'missing-fallback',
          severity: 'medium',
          description: `Token "${token.name}" is missing in some themes`,
          tokens: [token.name],
          suggestions: [
            'Ensure all tokens have values defined for all supported themes',
            'Add fallback values for missing theme variants'
          ]
        });
      }
    }
    
    return inconsistencies;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    tokens: TokenData[], 
    usage: TokenUsage[], 
    inconsistencies: Inconsistency[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Unused token cleanup
    const unusedCount = usage.filter(u => u.usageCount === 0).length;
    if (unusedCount > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'medium',
        title: 'Remove Unused Tokens',
        description: `${unusedCount} tokens are not used in any TypeScript files`,
        impact: 'Reduces CSS bundle size and improves maintainability',
        actions: [
          'Review unused tokens to confirm they are not needed',
          'Remove confirmed unused tokens from styles.css',
          'Update documentation to reflect changes'
        ]
      });
    }
    
    // Token consolidation opportunities
    const duplicateValueInconsistencies = inconsistencies.filter(i => i.type === 'duplicate-values');
    if (duplicateValueInconsistencies.length > 0) {
      recommendations.push({
        type: 'consolidation',
        priority: 'high',
        title: 'Consolidate Duplicate Token Values',
        description: `${duplicateValueInconsistencies.length} groups of tokens have identical values`,
        impact: 'Improves consistency and reduces cognitive load for developers',
        actions: [
          'Review tokens with duplicate values',
          'Create semantic aliases for intentional duplicates',
          'Merge tokens that serve the same purpose'
        ]
      });
    }
    
    // Naming consistency improvements
    const namingInconsistencies = inconsistencies.filter(i => i.type === 'naming-pattern');
    if (namingInconsistencies.length > 0) {
      recommendations.push({
        type: 'naming',
        priority: 'low',
        title: 'Improve Naming Consistency',
        description: 'Some token categories have inconsistent naming patterns',
        impact: 'Improves developer experience and token discoverability',
        actions: [
          'Establish consistent naming conventions',
          'Rename tokens to follow established patterns',
          'Document naming guidelines for future tokens'
        ]
      });
    }
    
    // Theme completeness
    const missingFallbacks = inconsistencies.filter(i => i.type === 'missing-fallback');
    if (missingFallbacks.length > 0) {
      recommendations.push({
        type: 'organization',
        priority: 'high',
        title: 'Complete Theme Coverage',
        description: `${missingFallbacks.length} tokens are missing values in some themes`,
        impact: 'Ensures consistent appearance across all supported themes',
        actions: [
          'Add missing token values for all themes',
          'Establish fallback strategies for theme-specific tokens',
          'Test theme switching functionality thoroughly'
        ]
      });
    }
    
    return recommendations;
  }
}

/**
 * Utility function to perform quick analysis
 */
export async function analyzeDesignSystem(
  tokens: ParsedTokens, 
  sourceDirectory: string = 'src'
): Promise<AnalysisResult> {
  const analyzer = new DesignSystemAnalyzer(sourceDirectory);
  return analyzer.analyzeDesignSystem(tokens);
}