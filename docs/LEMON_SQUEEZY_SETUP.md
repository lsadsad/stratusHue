# Lemon Squeezy Integration Setup

This guide will help you set up Lemon Squeezy for your Figma plugin monetization.

## 🍋 What's Included

The plugin now includes:
- **Settings Panel**: Access via the Settings button (≡) in the plugin UI
- **License Validation**: Users can enter and validate license keys
- **API Testing**: Test your Lemon Squeezy API connection
- **Upgrade Flow**: Direct users to your checkout page
- **Subscription Status**: Visual indicators for premium/free users

## 🚀 Quick Start

### 1. Set Up Your Lemon Squeezy Store

1. Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create a new store
3. Add a product for your Figma plugin
4. Set up pricing (one-time purchase or subscription)

### 2. Get Your API Credentials

1. Go to Settings > API in your Lemon Squeezy dashboard
2. Create a new API key
3. Note down your:
   - Store ID
   - API Key
   - Product ID
   - Variant ID (pricing plan)

### 3. Configure the Plugin

Edit `src/lemon-squeezy-config.ts`:

```typescript
export const LEMON_SQUEEZY_CONFIG = {
  storeId: 'your-actual-store-id',
  apiKey: 'your-actual-api-key', 
  productId: 'your-actual-product-id',
  variantId: 'your-actual-variant-id',
  testMode: false // Set to false for production
};
```

### 4. Test the Integration

1. Build the plugin: `npm run build`
2. Load it in Figma
3. Click the Settings button (≡)
4. Try the "Test API Connection" button

## 🧪 Testing Features

### Test Mode
When `testMode: true`, the plugin uses mock responses:
- API connection always succeeds
- License key `test-license-key` validates successfully
- No real API calls are made

### License Validation
Users can enter license keys in the Settings panel. Valid licenses will:
- Show "Premium Active" status
- Store the license locally
- Enable premium features (implement as needed)

### Upgrade Flow
The "Upgrade to Premium" button opens your Lemon Squeezy checkout page in the user's browser.

## 🎨 UI Components

### Settings Panel
- **Subscription Status**: Visual indicator (green/red dot)
- **License Input**: Text field for license key entry
- **Action Buttons**: Test API, Validate License, Upgrade
- **Feedback Messages**: Success/error notifications

### Status Indicators
- 🟢 **Premium Active**: Valid subscription
- 🔴 **Free Version**: No active subscription  
- 🟡 **Checking**: Loading state

## 🔧 Customization

### Styling
Settings styles are in `src/styles.css` under the "LEMON SQUEEZY SETTINGS STYLES" section.

### API Endpoints
Modify `src/lemon-squeezy.ts` to customize:
- License validation logic
- Subscription checking
- Product information retrieval

### UI Messages
Update feedback messages in the `showFeedback()` function in `src/ui.ts`.

## 📋 Implementation Checklist

- [ ] Set up Lemon Squeezy store and product
- [ ] Get API credentials
- [ ] Update configuration file
- [ ] Test API connection
- [ ] Test license validation
- [ ] Customize UI styling
- [ ] Implement premium feature gates
- [ ] Test upgrade flow
- [ ] Deploy to production

## 🔒 Security Notes

- Keep your API key secure and never commit it to public repositories
- Consider using environment variables for production
- Validate licenses server-side for critical features
- Implement proper error handling for API failures

## 🆘 Troubleshooting

### API Connection Fails
- Verify your API key is correct
- Check your store ID matches your dashboard
- Ensure you have proper permissions

### License Validation Issues
- Confirm the license key format
- Check if the license is active in your dashboard
- Verify the product/variant IDs match

### Checkout Page Issues
- Test the generated URL manually
- Ensure your product is published
- Check variant availability

## 📚 Next Steps

1. **Feature Gating**: Implement logic to restrict features based on subscription status
2. **Analytics**: Track usage and conversion metrics
3. **Customer Support**: Set up help documentation and support channels
4. **Updates**: Plan for handling subscription renewals and updates

## 🔗 Useful Links

- [Lemon Squeezy API Documentation](https://docs.lemonsqueezy.com/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Plugin Monetization Best Practices](./docs/Complete%20Figma_Plugin_Monetization_Guide.md)

---

**Ready to monetize your Figma plugin!** 🚀

The integration is now complete and ready for testing. Users can access all Lemon Squeezy features through the Settings panel in your plugin.