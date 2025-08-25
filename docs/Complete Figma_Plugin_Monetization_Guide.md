# Complete Figma Plugin Monetization Guide

## Overview
This comprehensive guide covers everything you need to monetize your Figma plugin, from initial setup through advanced pricing strategies and implementation examples.

---

## 🚀 **Quick Start: Lemon Squeezy Setup**

### **Step 1: Create Account & Product**
1. Sign up at [Lemon Squeezy](https://lemonsqueezy.com)
2. Create a new **Software License** product
3. Set up pricing (e.g., $4.99/month, $49.99/year)

### **Step 2: Get API Credentials**
From your Lemon Squeezy dashboard:
```typescript
// lemon-squeezy-config.ts
export const LEMON_SQUEEZY_CONFIG = {
  storeId: 'your-actual-store-id',        // Settings → General
  apiKey: 'your-actual-api-key',          // Settings → API
  productId: 'your-actual-product-id',    // From product page
  variantId: 'your-actual-variant-id',    // From product variants
  storeUrl: 'your-store-name',
};
```

### **Step 3: Choose Pricing Model**
Your plugin supports 5 pricing strategies:

| Model | Best For | Example |
|-------|----------|---------|
| **Freemium** | Building user base | 10 free bookmarks, unlimited with premium |
| **One-Time** | Users who prefer ownership | $49.99 lifetime license |
| **Subscription** | Recurring revenue | $4.99/month or $49.99/year |
| **Tiered** | Different user segments | Basic ($2.99), Pro ($7.99), Enterprise ($19.99) |
| **Usage-Based** | Variable usage patterns | Credits: 100 for $9.99, 300 for $24.99 |

---

## ⚙️ **Configuration Guide**

### **Setting Your Pricing Model**
Choose your model in `lemon-squeezy-config.ts`:
```typescript
export const CURRENT_PRICING_MODEL: PricingModel = 'freemium'; // Change this
```

### **Customizing Free Tier Limits**
Edit limits in `premium-features-config.ts`:
```typescript
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 10,           // Free bookmark limit
  MAX_EMOJI_SETS: 2,           // Free emoji sets
  MAX_EXPORTS_PER_DAY: 3,      // Daily export limit
  MAX_HISTORY_ENTRIES: 20,     // Navigation history
} as const;
```

### **Adding Premium Features**
1. **Add feature definition:**
```typescript
export const PREMIUM_FEATURES = {
  // ... existing features
  MY_NEW_FEATURE: 'my_new_feature',
} as const;
```

2. **Add feature description:**
```typescript
export const FEATURE_DESCRIPTIONS = {
  [PREMIUM_FEATURES.MY_NEW_FEATURE]: {
    name: 'My New Feature',
    description: 'What this feature does',
    icon: '✨',
    category: 'productivity',
  },
} as const;
```

3. **Add to premium tier:**
```typescript
export const TIER_CONFIGS = {
  pro: {
    features: [
      // ... existing features
      PREMIUM_FEATURES.MY_NEW_FEATURE,
    ],
  },
} as const;
```

---

## 💻 **Implementation Examples**

### **Example 1: Basic Feature Gate**
```typescript
// In your plugin code
import { premiumFeatures } from './premium-features';
import { PREMIUM_FEATURES } from './premium-features-config';

async function handleExportBookmarks() {
  // Check if user has access
  const access = await premiumFeatures.checkFeatureAccess(PREMIUM_FEATURES.EXPORT_BOOKMARKS);
  
  if (!access.allowed) {
    // Show upgrade prompt
    figma.ui.postMessage({
      type: 'show-upgrade-prompt',
      feature: PREMIUM_FEATURES.EXPORT_BOOKMARKS,
      message: access.upgradeMessage,
    });
    return;
  }

  // Track usage and proceed
  await premiumFeatures.trackFeatureUsage(PREMIUM_FEATURES.EXPORT_BOOKMARKS);
  
  // Implement export functionality
  const bookmarks = await getBookmarks();
  figma.notify('Bookmarks exported successfully!');
}
```

### **Example 2: Daily Usage Limits**
```typescript
async function handleBulkOperation() {
  // Check daily limit
  const canUse = await premiumFeatures.checkDailyLimit(
    PREMIUM_FEATURES.BULK_OPERATIONS
  );

  if (!canUse) {
    figma.notify('Daily limit reached. Upgrade for unlimited operations!');
    return;
  }

  // Track usage
  await premiumFeatures.trackFeatureUsage(PREMIUM_FEATURES.BULK_OPERATIONS);
  
  // Perform bulk operation
  performBulkTagging();
}
```

### **Example 3: UI Integration**
```typescript
// Show/hide features based on access
function updateUI(featureStatus) {
  const exportSection = document.getElementById('export-section');
  const hasExport = featureStatus.features[PREMIUM_FEATURES.EXPORT_BOOKMARKS];
  
  if (hasExport) {
    exportSection.style.display = 'block';
  } else {
    exportSection.innerHTML = `
      <div class="upgrade-prompt">
        <p>Export is a premium feature</p>
        <button onclick="showUpgrade()">Upgrade Now</button>
      </div>
    `;
  }
}
```

### **Example 4: Custom Pricing Tier**
```typescript
// Add a "Designer" tier between free and pro
export const TIER_CONFIGS = {
  designer: {
    name: 'Designer',
    price: '$4.99/month',
    features: [
      PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
      PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
      PREMIUM_FEATURES.EXPORT_BOOKMARKS,
    ],
    limits: {
      MAX_BOOKMARKS: -1,        // unlimited
      MAX_EMOJI_SETS: -1,       // unlimited
      MAX_EXPORTS_PER_DAY: 20,  // limited but generous
    },
  },
}
```

---

## 📊 **Pricing Strategies**

### **Freemium Strategy**
**Best for**: New plugins building user base
```typescript
// Generous free tier to encourage adoption
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 15,     // Higher than default
  MAX_EMOJI_SETS: 3,     // More variety
};

// Clear value in premium
const premiumFeatures = [
  'Unlimited bookmarks',
  'All emoji sets', 
  'Export/import',
  'Priority support'
];
```

### **Tiered Strategy**
**Best for**: Different user segments
```typescript
export const TIER_CONFIGS = {
  starter: {
    name: 'Starter',
    price: '$1.99/month',
    target: 'Occasional users',
    limits: { MAX_BOOKMARKS: 25 }
  },
  professional: {
    name: 'Professional',
    price: '$5.99/month', 
    popular: true,        // Show badge
    target: 'Daily users',
    limits: { MAX_BOOKMARKS: -1 }
  },
  team: {
    name: 'Team',
    price: '$15.99/month',
    target: 'Teams & organizations',
    features: ['team_sharing', 'admin_controls']
  }
};
```

### **Usage-Based Strategy**
**Best for**: Variable usage patterns
```typescript
// Credit costs per action
private getCreditCost(action: string): number {
  const costs = {
    bookmark: 1,         // 1 credit per bookmark
    export: 5,           // 5 credits per export
    bulkTag: 10,         // 10 credits per bulk operation
  };
  return costs[action as keyof typeof costs] || 1;
}
```

### **Seasonal Pricing**
```typescript
function getSeasonalDiscount(): number {
  const now = new Date();
  const month = now.getMonth();
  
  // Black Friday (November)
  if (month === 10) return 0.5; // 50% off
  
  // New Year (January)
  if (month === 0) return 0.3;  // 30% off
  
  return 1; // No discount
}
```

---

## 🧪 **Testing & Optimization**

### **A/B Testing Different Limits**
```typescript
async function initializeWithTesting() {
  const userId = figma.currentUser?.id || '';
  const testGroup = hashString(userId) % 2;
  
  const limits = testGroup === 0 
    ? { MAX_BOOKMARKS: 15, MAX_EMOJI_SETS: 3 }  // Generous group
    : { MAX_BOOKMARKS: 10, MAX_EMOJI_SETS: 2 }; // Standard group
    
  await premiumFeatures.setCustomLimits(limits);
}
```

### **Conversion Tracking**
```typescript
class AnalyticsTracker {
  static async trackFeatureBlock(feature: string) {
    const data = {
      feature,
      timestamp: Date.now(),
      action: 'blocked'
    };
    
    await figma.clientStorage.setAsync('analytics', [
      ...(await figma.clientStorage.getAsync('analytics') || []),
      data
    ].slice(-100)); // Keep last 100 events
  }
  
  static async getConversionRate(): Promise<number> {
    const events = await figma.clientStorage.getAsync('analytics') || [];
    const blocks = events.filter(e => e.action === 'blocked').length;
    const upgrades = events.filter(e => e.action === 'upgraded').length;
    
    return blocks > 0 ? upgrades / blocks : 0;
  }
}
```

---

## 🚀 **Going Live**

### **Pre-Launch Checklist**
- [ ] Test all free tier limits work correctly
- [ ] Verify upgrade prompts show proper pricing
- [ ] Test license activation with valid keys
- [ ] Ensure checkout URLs redirect properly  
- [ ] Test webhook endpoints receive events
- [ ] Validate across different Figma versions

### **Launch Strategy**
1. **Soft Launch**: Enable for 10% of users initially
2. **Monitor**: Watch conversion rates and user feedback
3. **Iterate**: Adjust limits and pricing based on data
4. **Scale**: Gradually increase availability

### **Post-Launch Monitoring**
Track these key metrics:
- **Conversion Rate**: Free to paid users
- **Churn Rate**: Monthly/yearly cancellations  
- **Feature Usage**: Which premium features drive upgrades
- **Support Load**: Common user questions and issues

---

## 🔧 **Advanced Features**

### **Team Features**
```typescript
// Enable team sharing for enterprise users
if (userTier === 'enterprise') {
  await premiumFeatures.enableTeamFeatures({
    sharing: true,
    adminControls: true,
    bulkManagement: true
  });
}
```

### **API Integration**
```typescript
// Integrate with design systems
const designSystemFeatures = {
  tokenSync: PREMIUM_FEATURES.API_ACCESS,
  componentImport: PREMIUM_FEATURES.INTEGRATIONS,
  automatedTagging: PREMIUM_FEATURES.AUTOMATION
};
```

### **Custom Pricing for Enterprise**
```typescript
// Handle enterprise inquiries
if (bookmarkCount > 1000) {
  figma.ui.postMessage({
    type: 'show-enterprise-contact',
    message: 'Need more bookmarks? Contact us for enterprise pricing.'
  });
}
```

---

## 📈 **Success Tips**

### **User Experience**
- **Clear Value**: Show premium features before blocking
- **Graceful Degradation**: Don't break workflows for free users
- **Progressive Disclosure**: Introduce premium features naturally
- **Transparent Limits**: Always show usage against limits

### **Conversion Optimization**
- **Strategic Timing**: Show upgrade prompts at high-value moments
- **Social Proof**: Display user counts or testimonials  
- **Limited Time Offers**: Seasonal discounts and promotions
- **Free Trials**: Allow temporary access to premium features

### **Retention Strategies**
- **Onboarding**: Help users discover value quickly
- **Feature Education**: Teach advanced use cases
- **Regular Updates**: Keep adding value for subscribers
- **Community**: Build user community around your plugin

This comprehensive guide gives you everything needed to successfully monetize your Figma plugin while maintaining excellent user experience.