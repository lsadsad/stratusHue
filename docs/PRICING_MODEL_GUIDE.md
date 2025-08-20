# Pricing Model Change Guide

This guide shows you how to change your plugin's pricing model. The system supports 5 different pricing strategies.

## 🎯 Available Pricing Models

### 1. Freemium (Current Default)
- **Free tier**: Limited features (10 bookmarks, 2 emoji sets)
- **Premium tier**: Unlimited features for $4.99/month

### 2. One-Time Purchase
- **7-day trial**: Full access for trial period
- **Lifetime license**: $49.99 one-time payment

### 3. Subscription Only
- **Monthly**: $4.99/month
- **Yearly**: $49.99/year (17% savings)

### 4. Tiered Pricing
- **Basic**: $2.99/month (50 bookmarks, 4 emoji sets)
- **Pro**: $7.99/month (unlimited everything)
- **Enterprise**: $19.99/month (pro + team features)

### 5. Usage-Based (Credits)
- **Starter Pack**: $9.99 for 100 credits
- **Power Pack**: $24.99 for 300 credits

## 🔧 How to Change Pricing Models

### Step 1: Update Configuration

Edit `lemon-squeezy-config.ts`:

```typescript
// Change this line to switch models
export const CURRENT_PRICING_MODEL: PricingModel = 'subscription'; // or 'one-time', 'tiered', etc.
```

### Step 2: Update Lemon Squeezy Products

Create the appropriate products in your Lemon Squeezy dashboard:

#### For Freemium:
- Create 1 product with monthly/yearly variants

#### For One-Time:
- Create 1 product with lifetime variant

#### For Subscription:
- Create 1 product with monthly and yearly variants

#### For Tiered:
- Create 3 separate products (Basic, Pro, Enterprise)

#### For Usage-Based:
- Create products for different credit packages

### Step 3: Update Variant IDs

In `lemon-squeezy-config.ts`, update the variants object:

```typescript
variants: {
  monthly: 'your-monthly-variant-id',
  yearly: 'your-yearly-variant-id',
  lifetime: 'your-lifetime-variant-id',
  basic: 'your-basic-tier-variant-id',
  pro: 'your-pro-tier-variant-id',
  enterprise: 'your-enterprise-tier-variant-id',
},
```

### Step 4: Customize Pricing Details

Edit the pricing configuration in `lemon-squeezy-config.ts`:

```typescript
// Example: Changing freemium limits
freemium: {
  tiers: {
    free: {
      limits: {
        maxBookmarks: 5, // Changed from 10
        maxEmojiSets: 1, // Changed from 2
      },
    },
    premium: {
      price: '$9.99/month', // Changed from $4.99
    },
  },
},
```

## 🎨 Customization Examples

### Example 1: Switching to One-Time Purchase

```typescript
// 1. Change the model
export const CURRENT_PRICING_MODEL: PricingModel = 'one-time';

// 2. Update your Lemon Squeezy variants
variants: {
  lifetime: 'your-lifetime-variant-id',
},

// 3. Customize the trial period (optional)
'one-time': {
  tiers: {
    trial: {
      duration: 14 * 24 * 60 * 60 * 1000, // 14 days instead of 7
    },
    lifetime: {
      price: '$79.99 one-time', // Changed from $49.99
    },
  },
},
```

### Example 2: Creating a 3-Tier System

```typescript
// 1. Change the model
export const CURRENT_PRICING_MODEL: PricingModel = 'tiered';

// 2. Customize the tiers
tiered: {
  tiers: {
    starter: {
      name: 'Starter',
      price: '$1.99/month',
      limits: {
        maxBookmarks: 25,
        maxEmojiSets: 3,
      },
    },
    professional: {
      name: 'Professional',
      price: '$5.99/month',
      popular: true, // Shows "POPULAR" badge
      limits: {
        maxBookmarks: -1, // unlimited
        maxEmojiSets: -1,
      },
    },
    team: {
      name: 'Team',
      price: '$15.99/month',
      features: ['team_sharing', 'priority_support'],
    },
  },
},
```

### Example 3: Usage-Based with Custom Credit Costs

```typescript
// 1. Change the model
export const CURRENT_PRICING_MODEL: PricingModel = 'usage-based';

// 2. In pricing-models.ts, update credit costs
private getCreditCost(action: string): number {
  const costs = {
    bookmarks: 2,    // Changed from 1
    emojiSets: 5,    // Changed from 2
    export: 10,      // Changed from 5
  };
  return costs[action as keyof typeof costs] || 1;
}
```

## 🧪 Testing Your Changes

### 1. Test Locally
```bash
# Build your plugin with the new pricing model
npm run build

# Test in Figma to ensure:
# - Correct limits are enforced
# - Upgrade prompts show the right pricing
# - Checkout URLs work correctly
```

### 2. Test Checkout Flow
1. Try to exceed the free limits
2. Verify the pricing modal shows correct tiers
3. Test the checkout URL generation
4. Verify license activation works

### 3. Test Edge Cases
- What happens when a subscription expires?
- How does the trial period work?
- Do credits get deducted correctly?

## 🚀 Going Live

### 1. Update Lemon Squeezy
- Create all necessary products and variants
- Set up webhooks for subscription events
- Test with Lemon Squeezy's sandbox mode

### 2. Deploy Changes
```bash
# Set production environment
NODE_ENV=production npm run build

# Deploy to your plugin distribution
```

### 3. Monitor and Adjust
- Track conversion rates for each tier
- Monitor user feedback
- Adjust pricing based on usage patterns

## 💡 Pro Tips

### Gradual Migration
If you're changing from one model to another:

1. **Grandfather existing users**: Keep their current pricing
2. **Announce changes**: Give users advance notice
3. **Offer migration incentives**: Discounts for switching

### A/B Testing
Test different pricing models:

```typescript
// Example: Random assignment for testing
const testGroup = Math.random() < 0.5 ? 'freemium' : 'tiered';
export const CURRENT_PRICING_MODEL: PricingModel = testGroup;
```

### Seasonal Pricing
Implement temporary pricing changes:

```typescript
// Example: Holiday discount
const isHolidaySeason = new Date().getMonth() === 11; // December
const holidayDiscount = isHolidaySeason ? 0.8 : 1; // 20% off

// Apply to pricing display
premium: {
  price: `$${(4.99 * holidayDiscount).toFixed(2)}/month`,
}
```

## 🔍 Analytics and Optimization

Track these metrics for each pricing model:

- **Conversion rate**: Free to paid users
- **Churn rate**: How many users cancel
- **Average revenue per user (ARPU)**
- **Customer lifetime value (CLV)**
- **Feature usage**: Which features drive upgrades

## 🆘 Troubleshooting

### Common Issues

1. **Checkout URLs not working**
   - Verify variant IDs in Lemon Squeezy
   - Check store URL configuration

2. **License validation failing**
   - Ensure API key is correct
   - Check network connectivity

3. **Limits not enforcing**
   - Verify pricing model is set correctly
   - Check limit values in configuration

4. **UI not updating**
   - Clear browser cache
   - Check console for JavaScript errors

### Getting Help

1. Check Lemon Squeezy documentation
2. Test in sandbox mode first
3. Monitor browser console for errors
4. Verify webhook endpoints are working

## 📈 Pricing Strategy Recommendations

### For New Plugins
- Start with **Freemium** to build user base
- Offer generous free tier to encourage adoption
- Clear upgrade path when users hit limits

### For Established Plugins
- Consider **Tiered** pricing for different user segments
- Use **One-time** for users who prefer ownership
- **Usage-based** works well for occasional users

### For Enterprise Features
- **Tiered** model with enterprise tier
- Include team features, priority support
- Custom pricing for large organizations

Remember: You can always change your pricing model later based on user feedback and business metrics!