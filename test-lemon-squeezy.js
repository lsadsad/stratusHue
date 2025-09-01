// Test script for Lemon Squeezy integration
// Run with: node test-lemon-squeezy.js

import { LemonSqueezyService } from './src/lemon-squeezy.js';

// Test configuration
const testConfig = {
  storeId: 'test-store',
  apiKey: 'test-key',
  productId: 'test-product',
  variantId: 'test-variant'
};

async function testLemonSqueezyIntegration() {
  console.log('🍋 Testing Lemon Squeezy Integration...\n');
  
  const service = new LemonSqueezyService(testConfig);
  
  // Test API connection
  console.log('1. Testing API Connection...');
  const connectionResult = await service.testConnection();
  console.log(`   ${connectionResult.success ? '✅' : '❌'} ${connectionResult.message}\n`);
  
  // Test license validation - valid key
  console.log('2. Testing License Validation (valid key)...');
  const validLicense = await service.validateLicense('test-license-key');
  console.log(`   ${validLicense?.valid ? '✅' : '❌'} Valid license: ${validLicense?.valid}\n`);
  
  // Test license validation - invalid key
  console.log('3. Testing License Validation (invalid key)...');
  const invalidLicense = await service.validateLicense('invalid-key');
  console.log(`   ${!invalidLicense?.valid ? '✅' : '❌'} Invalid license rejected: ${!invalidLicense?.valid}\n`);
  
  // Test checkout URL generation
  console.log('4. Testing Checkout URL Generation...');
  const checkoutUrl = service.generateCheckoutUrl('test@example.com');
  console.log(`   ✅ Checkout URL: ${checkoutUrl}\n`);
  
  console.log('🎉 All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Update src/lemon-squeezy-config.ts with your real credentials');
  console.log('   2. Set testMode to false for production');
  console.log('   3. Test with real API keys');
  console.log('   4. Load the plugin in Figma and test the Settings panel');
}

// Run tests
testLemonSqueezyIntegration().catch(console.error);