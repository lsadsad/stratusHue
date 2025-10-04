/**
 * Design System Analysis Demo
 * 
 * Demonstrates the analysis functionality with real CSS and TypeScript files.
 */

import { parseDesignTokens } from './token-parser';
import { DesignSystemAnalyzer } from './analysis';
import { loadDefaultCSS } from './css-loader';

/**
 * Demo function to show analysis capabilities
 */
export async function runAnalysisDemo(): Promise<void> {
  console.log('🔍 Design System Analysis Demo');
  console.log('================================\n');

  try {
    // Load and parse design tokens from styles.css
    console.log('📄 Loading CSS and parsing tokens...');
    const cssContent = await loadDefaultCSS();
    const tokens = parseDesignTokens(cssContent);
    
    console.log(`✅ Found ${tokens.tokens.length} tokens across ${tokens.themes.length} themes`);
    console.log(`📊 Categories: ${Object.keys(tokens.categories).join(', ')}\n`);

    // Perform comprehensive analysis
    console.log('🔬 Analyzing design system...');
    const analyzer = new DesignSystemAnalyzer('src');
    const analysis = await analyzer.analyzeDesignSystem(tokens);

    // Display statistics
    console.log('📈 Analysis Statistics:');
    console.log(`   Total tokens: ${analysis.stats.totalTokens}`);
    console.log(`   Used tokens: ${analysis.stats.usedTokens}`);
    console.log(`   Unused tokens: ${analysis.stats.unusedTokens}`);
    console.log(`   Files scanned: ${analysis.stats.filesScanned}`);
    console.log(`   Inconsistencies found: ${analysis.stats.inconsistenciesFound}`);
    console.log(`   Recommendations generated: ${analysis.stats.recommendationsGenerated}\n`);

    // Show most used tokens
    const mostUsedTokens = analysis.tokenUsage
      .filter(usage => usage.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    if (mostUsedTokens.length > 0) {
      console.log('🏆 Most Used Tokens:');
      mostUsedTokens.forEach((usage, index) => {
        console.log(`   ${index + 1}. ${usage.tokenName}: ${usage.usageCount} uses`);
      });
      console.log('');
    }

    // Show unused tokens
    if (analysis.unusedTokens.length > 0) {
      console.log('🗑️  Unused Tokens:');
      analysis.unusedTokens.slice(0, 10).forEach(token => {
        console.log(`   - ${token.name} (${token.category})`);
      });
      if (analysis.unusedTokens.length > 10) {
        console.log(`   ... and ${analysis.unusedTokens.length - 10} more`);
      }
      console.log('');
    }

    // Show inconsistencies
    if (analysis.inconsistencies.length > 0) {
      console.log('⚠️  Inconsistencies Found:');
      analysis.inconsistencies.forEach((inconsistency, index) => {
        console.log(`   ${index + 1}. ${inconsistency.description}`);
        console.log(`      Severity: ${inconsistency.severity}`);
        if (inconsistency.suggestions.length > 0) {
          console.log(`      Suggestion: ${inconsistency.suggestions[0]}`);
        }
      });
      console.log('');
    }

    // Show top recommendations
    if (analysis.recommendations.length > 0) {
      console.log('💡 Top Recommendations:');
      analysis.recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 3)
        .forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.title} (${rec.priority} priority)`);
          console.log(`      ${rec.description}`);
          console.log(`      Impact: ${rec.impact}`);
        });
      console.log('');
    }

    // Show token categories breakdown
    console.log('📋 Token Categories:');
    Object.entries(tokens.categories).forEach(([category, categoryTokens]) => {
      if (categoryTokens.length > 0) {
        console.log(`   ${category}: ${categoryTokens.length} tokens`);
      }
    });
    console.log('');

    // Show theme differences
    const tokensWithDifferences = tokens.tokens.filter(token => {
      const values = Object.values(token.values);
      return values.length > 1 && new Set(values).size > 1;
    });

    if (tokensWithDifferences.length > 0) {
      console.log('🎨 Tokens with Theme Differences:');
      tokensWithDifferences.slice(0, 5).forEach(token => {
        console.log(`   ${token.name}:`);
        Object.entries(token.values).forEach(([theme, value]) => {
          console.log(`     ${theme}: ${value}`);
        });
      });
      if (tokensWithDifferences.length > 5) {
        console.log(`   ... and ${tokensWithDifferences.length - 5} more`);
      }
      console.log('');
    }

    console.log('✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

/**
 * Generate a detailed analysis report
 */
export async function generateAnalysisReport(): Promise<string> {
  try {
    const cssContent = await loadDefaultCSS();
    const tokens = parseDesignTokens(cssContent);
    const analyzer = new DesignSystemAnalyzer('src');
    const analysis = await analyzer.analyzeDesignSystem(tokens);

    const report = `# Design System Analysis Report

## Overview
- **Total Tokens**: ${analysis.stats.totalTokens}
- **Used Tokens**: ${analysis.stats.usedTokens}
- **Unused Tokens**: ${analysis.stats.unusedTokens}
- **Files Scanned**: ${analysis.stats.filesScanned}
- **Inconsistencies**: ${analysis.stats.inconsistenciesFound}
- **Recommendations**: ${analysis.stats.recommendationsGenerated}

## Token Usage

### Most Used Tokens
${analysis.tokenUsage
  .filter(usage => usage.usageCount > 0)
  .sort((a, b) => b.usageCount - a.usageCount)
  .slice(0, 10)
  .map((usage, index) => `${index + 1}. **${usage.tokenName}**: ${usage.usageCount} uses`)
  .join('\n')}

### Unused Tokens
${analysis.unusedTokens.length > 0 
  ? analysis.unusedTokens.slice(0, 20).map(token => `- ${token.name} (${token.category})`).join('\n')
  : 'No unused tokens found.'
}

## Inconsistencies

${analysis.inconsistencies.length > 0
  ? analysis.inconsistencies.map((inc, index) => `### ${index + 1}. ${inc.description}
**Severity**: ${inc.severity}
**Suggestions**: ${inc.suggestions.join(', ')}`).join('\n\n')
  : 'No inconsistencies found.'
}

## Recommendations

${analysis.recommendations.length > 0
  ? analysis.recommendations.map((rec, index) => `### ${index + 1}. ${rec.title}
**Priority**: ${rec.priority}
**Description**: ${rec.description}
**Impact**: ${rec.impact}
**Actions**:
${rec.actions.map(action => `- ${action}`).join('\n')}`).join('\n\n')
  : 'No recommendations generated.'
}

## Token Categories

${Object.entries(tokens.categories)
  .filter(([, categoryTokens]) => categoryTokens.length > 0)
  .map(([category, categoryTokens]) => `- **${category}**: ${categoryTokens.length} tokens`)
  .join('\n')}

---
*Report generated on ${new Date().toISOString()}*
`;

    return report;
  } catch (error) {
    return `# Analysis Report Error\n\nFailed to generate report: ${error}`;
  }
}

// Run demo if this file is executed directly
// Note: This check works in ES modules environments
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('analysis-demo')) {
  runAnalysisDemo().catch(console.error);
}