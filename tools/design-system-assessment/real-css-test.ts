/**
 * Real CSS Test - Test token parsing with actual styles.css file
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TokenParser, parseDesignTokens } from './token-parser';
import { cleanCSSContent, validateCSSContent, getCSSStats } from './css-loader';

async function testRealCSS(): Promise<void> {
  console.log('🧪 Testing with real styles.css file...\n');
  
  try {
    // Load the actual styles.css file
    const cssPath = 'src/styles.css';
    const cssContent = readFileSync(cssPath, 'utf-8');
    
    console.log('📁 Loaded styles.css file');
    
    // Get CSS statistics
    const stats = getCSSStats(cssContent);
    console.log(`📊 CSS Stats:`);
    console.log(`   - Lines: ${stats.totalLines}`);
    console.log(`   - Characters: ${stats.totalCharacters}`);
    console.log(`   - Custom Properties: ${stats.customProperties}`);
    console.log(`   - Selectors: ${stats.selectors}`);
    console.log(`   - Themes: ${stats.themes}`);
    
    // Validate CSS content
    const validation = validateCSSContent(cssContent);
    console.log(`\n✅ CSS Validation:`);
    console.log(`   - Valid: ${validation.isValid}`);
    if (validation.errors.length > 0) {
      console.log(`   - Errors: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`   - Warnings: ${validation.warnings.join(', ')}`);
    }
    
    // Clean and parse tokens
    const cleanedCSS = cleanCSSContent(cssContent);
    console.log('\n🧹 Cleaned CSS content');
    
    const parser = new TokenParser(cleanedCSS);
    const result = parser.parseTokens();
    
    console.log(`\n🎯 Token Parsing Results:`);
    console.log(`   - Total tokens: ${result.tokens.length}`);
    console.log(`   - Themes found: ${result.themes.length}`);
    
    // Show tokens by category
    console.log(`\n📂 Tokens by Category:`);
    for (const [category, tokens] of Object.entries(result.categories)) {
      console.log(`   - ${category}: ${tokens.length} tokens`);
    }
    
    // Show some example tokens
    console.log(`\n🔍 Example Tokens:`);
    
    // Show spacing tokens
    const spacingTokens = result.categories.spacing.slice(0, 3);
    if (spacingTokens.length > 0) {
      console.log(`   Spacing tokens:`);
      spacingTokens.forEach(token => {
        const values = Object.entries(token.values).map(([theme, value]) => `${theme}: ${value}`).join(', ');
        console.log(`     - ${token.name}: ${values}`);
      });
    }
    
    // Show color tokens
    const colorTokens = result.categories.color.slice(0, 3);
    if (colorTokens.length > 0) {
      console.log(`   Color tokens:`);
      colorTokens.forEach(token => {
        const values = Object.entries(token.values).map(([theme, value]) => `${theme}: ${value}`).join(', ');
        console.log(`     - ${token.name}: ${values}`);
      });
    }
    
    // Show typography tokens
    const typographyTokens = result.categories.typography.slice(0, 3);
    if (typographyTokens.length > 0) {
      console.log(`   Typography tokens:`);
      typographyTokens.forEach(token => {
        const values = Object.entries(token.values).map(([theme, value]) => `${theme}: ${value}`).join(', ');
        console.log(`     - ${token.name}: ${values}`);
      });
    }
    
    // Analyze differences and missing tokens
    const differentTokens = parser.getDifferentTokens(result.tokens);
    const missingTokens = parser.getMissingTokens(result.tokens);
    
    console.log(`\n🔄 Token Analysis:`);
    console.log(`   - Tokens with different values across themes: ${differentTokens.length}`);
    console.log(`   - Tokens missing in some themes: ${missingTokens.length}`);
    
    // Show some examples of different tokens
    if (differentTokens.length > 0) {
      console.log(`\n   Examples of tokens with different values:`);
      differentTokens.slice(0, 3).forEach(token => {
        console.log(`     - ${token.name}:`);
        Object.entries(token.values).forEach(([theme, value]) => {
          console.log(`       ${theme}: ${value}`);
        });
      });
    }
    
    // Get overall statistics
    const tokenStats = parser.getTokenStats(result.tokens);
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   - Total tokens: ${tokenStats.totalTokens}`);
    console.log(`   - Different across themes: ${tokenStats.differentAcrossThemes}`);
    console.log(`   - Missing in some themes: ${tokenStats.missingInSomeThemes}`);
    
    console.log('\n🎉 Real CSS test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing real CSS:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the test
testRealCSS();