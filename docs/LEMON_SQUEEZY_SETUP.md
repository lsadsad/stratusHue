# Lemon Squeezy Integration Setup Guide

This guide will help you set up Lemon Squeezy for your Figma plugin monetization.

## 1. Create Lemon Squeezy Account

1. Go to [Lemon Squeezy](https://lemonsqueezy.com) and create an account
2. Complete your store setup and verification

## 2. Create Your Product

1. In your Lemon Squeezy dashboard, go to **Products**
2. Click **New Product**
3. Choose **Software License** as the product type
4. Fill in your product details:
   - **Name**: "Stratus Hue Premium"
   - **Description**: Premium features for your Figma plugin
   - **Price**: Set your desired pricing (e.g., $4.99/month, $49.99/year)

## 3. Get Your API Credentials

1. Go to **Settings** → **API**
2. Create a new API key
3. Copy the following values:
   - **Store ID**: Found in Settings → General
   - **API Key**: The key you just created
   - **Product ID**: From your product page
   - **Variant ID**: From your product variants

## 4. Update Configuration

Edit `lemon-squeezy-config.ts` with your actual values:

```typescript
export const LEMON_SQUEEZY_CONFIG = {
  storeId: 'your-actual-store-id',
  apiKey: 'your-actual-api-key',
  productId: 'your-actual-product-id',
  variantId: 'your-actual-variant-id',
  storeUrl: 'your-store-name', // e.g., 'awesome-plugins'
  // ... other config
};
```

## 5. Test the Integration

1. Build your plugin with the updated configuration
2. Test the premium features:
   - Try creating more than 10 bookmarks (should show upgrade prompt)
   - Try navigating to premium emoji sets
   - Test the license activation flow

## 6. Set Up Webhooks (Optional but Recommended)

1. In Lemon Squeezy dashboard, go to **Settings** → **Webhooks**
2. Add a new webhook endpoint: `https://your-domain.com/webhook/lemon-squeezy`
3. Select these events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_resumed`
   - `subscription_expired`

## 7. Premium Features Included

Your plugin now includes:

### Free Tier
- Up to 10 bookmarks
- First 2 emoji sets
- Basic navigation

### Premium Tier
- ✨ Unlimited bookmarks
- 🎨 All emoji sets
- 🚀 Advanced navigation
- 📤 Export bookmarks (ready for implementation)
- 👥 Team sharing (ready for implementation)

## 8. Customization Options

### Adjust Free Limits
Edit `FREE_LIMITS` in `premium-features.ts`:

```typescript
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 5, // Change from 10 to 5
  MAX_EMOJI_SETS: 1, // Change from 2 to 1
};
```

### Add New Premium Features
1. Add feature to `PREMIUM_FEATURES` in `lemon-squeezy.ts`
2. Add feature check in `PremiumFeaturesManager.canUseFeature()`
3. Add feature gate where needed in your code

### Customize UI Messages
Edit the upgrade prompts in `premium-features.ts`:

```typescript
figma.ui.postMessage({
  type: 'show-upgrade-prompt',
  feature: PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
  message: 'Your custom message here!',
});
```

## 9. Security Best Practices

1. **Never expose your API key in client-side code**
2. **Validate licenses server-side if possible**
3. **Use HTTPS for all webhook endpoints**
4. **Implement rate limiting on your webhook endpoints**

## 10. Testing Checklist

- [ ] Free user can create up to 10 bookmarks
- [ ] 11th bookmark shows upgrade prompt
- [ ] Premium emoji sets show upgrade prompt for free users
- [ ] License activation works with valid key
- [ ] License activation fails with invalid key
- [ ] Premium users see unlimited bookmark count
- [ ] Upgrade button opens checkout URL

## 11. Going Live

1. Set `NODE_ENV=production` in your build process
2. Update `successUrl` and `cancelUrl` to your actual URLs
3. Test with real Lemon Squeezy checkout
4. Monitor webhook events and license validations

## Support

If you need help with the integration:
1. Check Lemon Squeezy documentation
2. Test with their sandbox environment first
3. Monitor the browser console for any errors
4. Verify your API credentials are correct

## Next Steps

Consider implementing:
- **Export/Import bookmarks** for premium users
- **Team sharing** functionality
- **Usage analytics** to understand feature adoption
- **Onboarding flow** to highlight premium features