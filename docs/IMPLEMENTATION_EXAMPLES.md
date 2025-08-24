# Premium Features Implementation Examples

This document provides practical examples of how to implement and customize premium features in your Figma plugin.

## 🚀 Quick Start Examples

### Example 1: Adding a "Bulk Tag" Premium Feature

**Step 1: Add the feature definition**
```typescript
// In premium-features-config.ts
export const PREMIUM_FEATURES = {
  // ... existing features
  BULK_TAG_LAYERS: 'bulk_tag_layers',
} as const;

export const FEATURE_DESCRIPTIONS = {
  // ... existing descriptions
  [PREMIUM_FEATURES.BULK_TAG_LAYERS]: {
    name: 'Bulk Tag Layers',
    description: 'Apply tags to multiple selected layers at once',
    icon: '⚡',
    category: 'productivity',
  },
} as const;

export const TIER_CONFIGS = {
  pro: {
    features: [
      // ... existing features
      PREMIUM_FEATURES.BULK_TAG_LAYERS,
    ],
  },
} as const;

export const UPGRADE_MESSAGES = {
  // ... existing messages
  [PREMIUM_FEATURES.BULK_TAG_LAYERS]: () => 
    'Bulk tagging is a premium feature. Upgrade to tag multiple layers at once!',
} as const;
```

**Step 2: Implement the feature check in your code**
```typescript
// In your main plugin code
import { premiumFeatures } from './premium-features';
import { PREMIUM_FEATURES } from './premium-features-config';

async function handleBulkTag(selectedLayers: SceneNode[], emoji: string) {
  // Check if user can use bulk tagging
  const access = await premiumFeatures.checkFeatureAccess(PREMIUM_FEATURES.BULK_TAG_LAYERS);
  
  if (!access.allowed) {
    figma.ui.postMessage({
      type: 'show-upgrade-prompt',
      feature: PREMIUM_FEATURES.BULK_TAG_LAYERS,
      message: access.upgradeMessage,
    });
    return;
  }

  // Track feature usage
  await premiumFeatures.trackFeatureUsage(PREMIUM_FEATURES.BULK_TAG_LAYERS);

  // Implement bulk tagging
  selectedLayers.forEach(layer => {
    layer.name = `${emoji} ${layer.name}`;
  });

  figma.notify(`Tagged ${selectedLayers.length} layers with ${emoji}`);
}
```

**Step 3: Add UI elements**
```html
<!-- In your UI -->
<div class="bulk-actions" id="bulk-actions" style="display: none;">
  <button id="bulk-tag-btn" class="action-btn">
    <span class="icon">⚡</span>
    <span class="label">Bulk Tag</span>
  </button>
</div>
```

```javascript
// Show/hide bulk actions based on feature access
function updateBulkActionsUI(featureStatus) {
  const bulkActions = document.getElementById('bulk-actions');
  const hasBulkTag = featureStatus.features[PREMIUM_FEATURES.BULK_TAG_LAYERS];
  
  if (bulkActions) {
    bulkActions.style.display = hasBulkTag ? 'block' : 'none';
  }
}
```

### Example 2: Implementing Daily Export Limits

**Step 1: Add export limits to configuration**
```typescript
// In premium-features-config.ts
export const FREE_LIMITS = {
  // ... existing limits
  MAX_EXPORTS_PER_DAY: 3,
} as const;

export const TIER_CONFIGS = {
  free: {
    limits: {
      // ... existing limits
      MAX_EXPORTS_PER_DAY: 3,
    },
  },
  pro: {
    limits: {
      // ... existing limits
      MAX_EXPORTS_PER_DAY: -1, // unlimited
    },
  },
} as const;
```

**Step 2: Implement export with limit checking**
```typescript
async function handleExportBookmarks() {
  // Check daily export limit
  const canExport = await premiumFeatures.checkDailyLimit(
    PREMIUM_FEATURES.EXPORT_BOOKMARKS
  );

  if (!canExport) {
    return; // Upgrade prompt already shown by checkDailyLimit
  }

  // Track the export
  await premiumFeatures.trackFeatureUsage(PREMIUM_FEATURES.EXPORT_BOOKMARKS);

  // Perform export
  const bookmarks = await getBookmarks();
  const exportData = JSON.stringify(bookmarks, null, 2);
  
  // Send to UI for download
  figma.ui.postMessage({
    type: 'download-file',
    filename: 'bookmarks.json',
    content: exportData,
  });

  figma.notify('Bookmarks exported successfully!');
}
```

**Step 3: Show usage in UI**
```javascript
// Display export usage
async function updateExportUsage() {
  const usage = await premiumFeatures.getFeatureUsage(PREMIUM_FEATURES.EXPORT_BOOKMARKS);
  const limit = premiumFeatures.getFeatureLimit(PREMIUM_FEATURES.EXPORT_BOOKMARKS);
  
  const exportBtn = document.getElementById('export-btn');
  const usageText = limit === -1 
    ? `Exported ${usage.dailyCount} times today`
    : `${usage.dailyCount}/${limit} exports used today`;
  
  exportBtn.title = usageText;
  
  // Disable button if limit reached
  if (limit !== -1 && usage.dailyCount >= limit) {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Daily Limit Reached';
  }
}
```

### Example 3: Creating a Custom Pricing Tier

**Step 1: Add new tier configuration**
```typescript
// In premium-features-config.ts
export const TIER_CONFIGS = {
  // ... existing tiers
  designer: {
    name: 'Designer',
    price: '$4.99/month',
    features: [
      PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
      PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
      PREMIUM_FEATURES.EXPORT_BOOKMARKS,
      PREMIUM_FEATURES.CUSTOM_THEMES,
    ],
    limits: {
      MAX_BOOKMARKS: -1,
      MAX_EMOJI_SETS: -1,
      MAX_EXPORTS_PER_DAY: 20,
      MAX_CUSTOM_THEMES: 5,
      MAX_TEAM_MEMBERS: 0, // No team features
    },
    badge: null,
  },
} as const;
```

**Step 2: Update pricing model to include new tier**
```typescript
// In lemon-squeezy-config.ts
export const PRICING_MODELS = {
  tiered: {
    tiers: {
      // ... existing tiers
      designer: {
        name: 'Designer',
        price: '$4.99/month',
        variantId: 'designer',
        limits: {
          maxBookmarks: -1,
          maxEmojiSets: -1,
          maxExportsPerDay: 20,
        },
        features: ['unlimited_bookmarks', 'all_emoji_sets', 'export_bookmarks', 'custom_themes'],
      },
    },
  },
} as const;
```

### Example 4: A/B Testing Different Limits

```typescript
// In your plugin initialization
async function initializePremiumFeatures() {
  // A/B test different free limits
  const userId = figma.currentUser?.id || '';
  const userHash = hashString(userId);
  const testGroup = userHash % 2; // 50/50 split

  let customLimits;
  if (testGroup === 0) {
    // Group A: More generous limits
    customLimits = {
      MAX_BOOKMARKS: 15,
      MAX_EMOJI_SETS: 3,
    };
  } else {
    // Group B: Standard limits
    customLimits = {
      MAX_BOOKMARKS: 10,
      MAX_EMOJI_SETS: 2,
    };
  }

  // Apply custom limits
  await premiumFeatures.setCustomLimits(customLimits);
  
  // Track which group the user is in
  await figma.clientStorage.setAsync('ab_test_group', testGroup);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

### Example 5: Seasonal Pricing and Features

```typescript
// Dynamic pricing based on season/events
function getSeasonalPricing() {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  // Black Friday (November)
  if (month === 10 && day >= 25) {
    return {
      discount: 0.5, // 50% off
      message: 'Black Friday Special - 50% off Premium!',
      urgency: 'Limited time offer',
    };
  }

  // New Year (January)
  if (month === 0 && day <= 15) {
    return {
      discount: 0.3, // 30% off
      message: 'New Year, New Workflow - 30% off Premium!',
      urgency: 'Offer ends January 15th',
    };
  }

  return null;
}

// Apply seasonal pricing to UI
function updatePricingDisplay() {
  const seasonal = getSeasonalPricing();
  
  if (seasonal) {
    const originalPrice = 4.99;
    const discountedPrice = originalPrice * (1 - seasonal.discount);
    
    figma.ui.postMessage({
      type: 'update-pricing',
      originalPrice: `$${originalPrice.toFixed(2)}`,
      discountedPrice: `$${discountedPrice.toFixed(2)}`,
      message: seasonal.message,
      urgency: seasonal.urgency,
    });
  }
}
```

### Example 6: Feature Rollout Strategy

```typescript
// Gradual feature rollout
class FeatureRollout {
  private static rolloutPercentages: Record<string, number> = {
    [PREMIUM_FEATURES.AUTOMATION]: 0.1,      // 10% of users
    [PREMIUM_FEATURES.INTEGRATIONS]: 0.05,   // 5% of users
    [PREMIUM_FEATURES.ANALYTICS]: 0.25,      // 25% of users
  };

  static isFeatureEnabledForUser(feature: string, userId: string): boolean {
    const percentage = this.rolloutPercentages[feature];
    if (!percentage) return true; // Feature is fully rolled out

    const userHash = this.hashString(userId + feature);
    return (userHash % 100) < (percentage * 100);
  }

  static async enableFeatureForUser(feature: string, userId: string): Promise<void> {
    if (this.isFeatureEnabledForUser(feature, userId)) {
      await premiumFeatures.enableBetaFeature(feature);
    }
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Use in plugin initialization
async function initializeFeatureRollout() {
  const userId = figma.currentUser?.id || '';
  
  // Check each beta feature
  for (const feature of Object.values(PREMIUM_FEATURES)) {
    await FeatureRollout.enableFeatureForUser(feature, userId);
  }
}
```

### Example 7: Usage Analytics and Optimization

```typescript
// Track feature conversion rates
class FeatureAnalytics {
  static async trackFeatureAttempt(feature: string, wasBlocked: boolean): Promise<void> {
    const data = {
      feature,
      wasBlocked,
      timestamp: Date.now(),
      userId: figma.currentUser?.id || 'anonymous',
    };

    // Store locally for batch sending
    const attempts = await figma.clientStorage.getAsync('feature_attempts') || [];
    attempts.push(data);
    
    // Keep only last 100 attempts
    if (attempts.length > 100) {
      attempts.splice(0, attempts.length - 100);
    }
    
    await figma.clientStorage.setAsync('feature_attempts', attempts);
  }

  static async getConversionData(): Promise<Record<string, { attempts: number; blocks: number }>> {
    const attempts = await figma.clientStorage.getAsync('feature_attempts') || [];
    const data: Record<string, { attempts: number; blocks: number }> = {};

    attempts.forEach((attempt: any) => {
      if (!data[attempt.feature]) {
        data[attempt.feature] = { attempts: 0, blocks: 0 };
      }
      data[attempt.feature].attempts++;
      if (attempt.wasBlocked) {
        data[attempt.feature].blocks++;
      }
    });

    return data;
  }
}

// Use in your feature checks
async function checkFeatureWithAnalytics(feature: string): Promise<boolean> {
  const access = await premiumFeatures.checkFeatureAccess(feature);
  
  // Track the attempt
  await FeatureAnalytics.trackFeatureAttempt(feature, !access.allowed);
  
  return access.allowed;
}
```

## 🎯 Best Practices Summary

1. **Start Simple**: Begin with basic freemium model, add complexity later
2. **User-Centric Limits**: Set limits based on real user workflows
3. **Clear Value Prop**: Make premium benefits obvious before blocking
4. **Graceful Degradation**: Don't break workflows, offer alternatives
5. **Track Everything**: Monitor usage, conversion, and user feedback
6. **Test Changes**: A/B test different limits and pricing
7. **Communicate Changes**: Give users advance notice of limit changes
8. **Provide Escape Hatches**: Allow temporary access for critical workflows

## 🔧 Development Workflow

1. **Define Feature**: Add to configuration files
2. **Implement Logic**: Add feature checks in code
3. **Update UI**: Show/hide features based on access
4. **Test Thoroughly**: Test both free and premium flows
5. **Monitor Usage**: Track how users interact with limits
6. **Iterate**: Adjust based on user feedback and data

This system gives you complete control over your premium features while maintaining excellent user experience!