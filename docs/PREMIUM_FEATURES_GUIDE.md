# Premium Features Configuration Guide

This guide shows you how to update, add, remove, and configure premium features in your Figma plugin.

## 📁 Configuration Files

- **`premium-features-config.ts`** - Main configuration for all premium features
- **`lemon-squeezy.ts`** - Basic feature definitions (legacy)
- **`lemon-squeezy-config.ts`** - Pricing model configurations
- **`premium-features.ts`** - Feature management logic

## 🎯 Quick Changes

### Change Free Tier Limits

Edit `premium-features-config.ts`:

```typescript
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 5,        // Changed from 10
  MAX_EMOJI_SETS: 1,       // Changed from 2
  MAX_EXPORTS_PER_DAY: 1,  // New limit
} as const;
```

### Add a New Premium Feature

1. **Add to feature definitions:**
```typescript
export const PREMIUM_FEATURES = {
  // Existing features...
  MY_NEW_FEATURE: 'my_new_feature',  // Add this line
} as const;
```

2. **Add feature description:**
```typescript
export const FEATURE_DESCRIPTIONS = {
  // Existing descriptions...
  [PREMIUM_FEATURES.MY_NEW_FEATURE]: {
    name: 'My New Feature',
    description: 'Description of what this feature does',
    icon: '✨',
    category: 'productivity',
  },
} as const;
```

3. **Add to tier configurations:**
```typescript
export const TIER_CONFIGS = {
  pro: {
    features: [
      // Existing features...
      PREMIUM_FEATURES.MY_NEW_FEATURE,  // Add to desired tiers
    ],
  },
} as const;
```

4. **Add upgrade message:**
```typescript
export const UPGRADE_MESSAGES = {
  // Existing messages...
  [PREMIUM_FEATURES.MY_NEW_FEATURE]: () => 
    'My new feature is premium only. Upgrade to access it!',
} as const;
```

### Remove a Premium Feature

1. **Remove from `PREMIUM_FEATURES`**
2. **Remove from `FEATURE_DESCRIPTIONS`**
3. **Remove from all `TIER_CONFIGS`**
4. **Remove from `UPGRADE_MESSAGES`**
5. **Remove feature checks from your code**

## 🔧 Common Configuration Changes

### 1. Change Bookmark Limits

```typescript
// Make free tier more generous
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 25,  // Increased from 10
}

// Or make it more restrictive
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 5,   // Decreased from 10
}
```

### 2. Add Daily Usage Limits

```typescript
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 10,
  MAX_EXPORTS_PER_DAY: 3,     // New daily limit
  MAX_API_CALLS_PER_DAY: 100, // New daily limit
}
```

### 3. Create New Pricing Tiers

```typescript
export const TIER_CONFIGS = {
  // Add a new "Starter" tier between free and pro
  starter: {
    name: 'Starter',
    price: '$1.99/month',
    features: [
      PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
      PREMIUM_FEATURES.EXPORT_BOOKMARKS,
    ],
    limits: {
      ...FREE_LIMITS,
      MAX_BOOKMARKS: 50,
      MAX_EXPORTS_PER_DAY: 10,
    },
    badge: null,
  },
}
```

### 4. Modify Feature Categories

```typescript
// Add a new category
export const FEATURE_CATEGORIES = {
  // Existing categories...
  security: {
    name: 'Security',
    description: 'Privacy and security features',
    icon: '🔒',
  },
}

// Then assign features to the new category
export const FEATURE_DESCRIPTIONS = {
  [PREMIUM_FEATURES.TEAM_SHARING]: {
    category: 'security',  // Changed from 'collaboration'
  },
}
```

## 🚀 Advanced Feature Management

### 1. Feature Gates in Code

Add feature checks throughout your plugin:

```typescript
// In your main code
import { premiumFeatures } from './premium-features';
import { PREMIUM_FEATURES } from './premium-features-config';

// Check if user can use a feature
if (premiumFeatures.canUseFeature(PREMIUM_FEATURES.EXPORT_BOOKMARKS)) {
  // Show export button
  showExportButton();
} else {
  // Show upgrade prompt
  showUpgradePrompt(PREMIUM_FEATURES.EXPORT_BOOKMARKS);
}

// Check usage limits
const canExport = await premiumFeatures.checkDailyLimit(
  PREMIUM_FEATURES.EXPORT_BOOKMARKS, 
  currentExportCount
);

if (!canExport) {
  figma.notify('Daily export limit reached. Upgrade for unlimited exports!');
  return;
}
```

### 2. Usage Tracking

Track how users interact with features:

```typescript
// Track feature usage
await premiumFeatures.trackFeatureUsage(PREMIUM_FEATURES.EXPORT_BOOKMARKS);

// Get usage statistics
const usage = await premiumFeatures.getFeatureUsage(PREMIUM_FEATURES.EXPORT_BOOKMARKS);
console.log(`Feature used ${usage.count} times, ${usage.dailyCount} times today`);
```

### 3. Dynamic Feature Enabling

Enable features based on conditions:

```typescript
// Enable features based on user type
const isDesignSystemTeam = figma.currentUser?.email?.includes('@company.com');

if (isDesignSystemTeam) {
  // Give free access to team features
  premiumFeatures.enableFeature(PREMIUM_FEATURES.TEAM_SHARING);
}
```

## 🎨 UI Integration

### 1. Show Feature Status in UI

```typescript
// Send feature status to UI
figma.ui.postMessage({
  type: 'feature-status',
  features: premiumFeatures.getFeatureStatus(),
});
```

### 2. Feature-Specific UI Elements

```html
<!-- Show different UI based on feature access -->
<div id="export-section" class="feature-section">
  <h3>Export Bookmarks</h3>
  <div id="export-content" class="hidden">
    <button id="export-json">Export as JSON</button>
    <button id="export-csv">Export as CSV</button>
  </div>
  <div id="export-upgrade" class="upgrade-prompt">
    <p>Export bookmarks is a premium feature</p>
    <button class="upgrade-btn">Upgrade Now</button>
  </div>
</div>
```

```javascript
// JavaScript to show/hide based on feature access
function updateFeatureUI(features) {
  const hasExport = features[PREMIUM_FEATURES.EXPORT_BOOKMARKS];
  
  document.getElementById('export-content').classList.toggle('hidden', !hasExport);
  document.getElementById('export-upgrade').classList.toggle('hidden', hasExport);
}
```

## 📊 Analytics and Monitoring

### 1. Track Feature Adoption

```typescript
// Track which features users try to access
premiumFeatures.trackFeatureAttempt(PREMIUM_FEATURES.TEAM_SHARING, false); // blocked
premiumFeatures.trackFeatureAttempt(PREMIUM_FEATURES.EXPORT_BOOKMARKS, true); // allowed
```

### 2. A/B Testing Features

```typescript
// Test different feature configurations
const testGroup = Math.random() < 0.5 ? 'generous' : 'restrictive';

const limits = testGroup === 'generous' 
  ? { MAX_BOOKMARKS: 20, MAX_EMOJI_SETS: 4 }
  : { MAX_BOOKMARKS: 5, MAX_EMOJI_SETS: 1 };

premiumFeatures.setCustomLimits(limits);
```

## 🔄 Migration and Updates

### 1. Migrating Existing Users

```typescript
// Handle users who had different limits before
async function migrateUserLimits() {
  const version = await figma.clientStorage.getAsync('feature_version');
  
  if (!version || version < 2) {
    // Grandfather existing users with higher limits
    const bookmarkCount = await getCurrentBookmarkCount();
    if (bookmarkCount > FREE_LIMITS.MAX_BOOKMARKS) {
      await premiumFeatures.setGrandfatheredLimits({
        MAX_BOOKMARKS: bookmarkCount + 10, // Give them some buffer
      });
    }
    
    await figma.clientStorage.setAsync('feature_version', 2);
  }
}
```

### 2. Feature Rollout

```typescript
// Gradually roll out new features
const rolloutPercentage = 0.1; // 10% of users
const userId = figma.currentUser?.id || '';
const userHash = hashString(userId);

if (userHash % 100 < rolloutPercentage * 100) {
  premiumFeatures.enableBetaFeature(PREMIUM_FEATURES.MY_NEW_FEATURE);
}
```

## 🧪 Testing Your Changes

### 1. Test Feature Limits

```typescript
// Test that limits are enforced
async function testBookmarkLimit() {
  const currentCount = 15; // Above free limit
  const canAdd = await premiumFeatures.checkBookmarkLimit(currentCount);
  console.assert(!canAdd, 'Should block adding bookmark above limit');
}
```

### 2. Test Upgrade Flows

```typescript
// Test that upgrade prompts work
async function testUpgradePrompt() {
  const result = await premiumFeatures.checkFeatureAccess(PREMIUM_FEATURES.TEAM_SHARING);
  if (!result.allowed) {
    console.log('Upgrade message:', result.upgradeMessage);
  }
}
```

## 📝 Best Practices

### 1. Feature Naming
- Use descriptive, consistent names
- Group related features with prefixes
- Keep names short but clear

### 2. Limit Setting
- Start generous, then tighten if needed
- Consider user workflows when setting limits
- Provide clear upgrade paths

### 3. User Experience
- Show feature value before blocking
- Provide clear upgrade messaging
- Don't interrupt critical workflows

### 4. Performance
- Cache feature status to avoid repeated checks
- Use efficient storage for usage tracking
- Minimize API calls for license validation

## 🚨 Common Pitfalls

1. **Circular Dependencies**: Import premium features carefully
2. **Inconsistent Limits**: Keep limits in sync across files
3. **Poor UX**: Don't block users without explanation
4. **Missing Migrations**: Handle existing users when changing limits
5. **Testing Gaps**: Test both free and premium user flows

## 📋 Checklist for Adding New Features

- [ ] Add to `PREMIUM_FEATURES` constant
- [ ] Add to `FEATURE_DESCRIPTIONS` with proper category
- [ ] Add to appropriate tiers in `TIER_CONFIGS`
- [ ] Add upgrade message to `UPGRADE_MESSAGES`
- [ ] Implement feature check in code
- [ ] Add UI elements for the feature
- [ ] Test with free and premium users
- [ ] Update documentation
- [ ] Consider analytics tracking
- [ ] Plan rollout strategy

This system gives you complete control over your premium features while maintaining a great user experience!