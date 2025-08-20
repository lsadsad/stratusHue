// Premium Features Manager
// Handles feature gating and premium functionality

import { lemonSqueezy, SubscriptionStatus } from '../lemon-squeezy/lemon-squeezy';
import { 
  PREMIUM_FEATURES, 
  FREE_LIMITS, 
  TIER_CONFIGS, 
  UPGRADE_MESSAGES,
  FEATURE_DESCRIPTIONS,
  FeatureUsage,
  createDefaultUsage,
  shouldResetDailyCount 
} from './premium-features-config';

class PremiumFeaturesManager {
  private subscriptionStatus: SubscriptionStatus = {
    isActive: false,
    isPremium: false,
  };

  private lastStatusCheck = 0;
  private readonly STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async initialize(): Promise<void> {
    await this.refreshSubscriptionStatus();
  }

  async refreshSubscriptionStatus(): Promise<SubscriptionStatus> {
    const now = Date.now();
    
    // Use cached status if recent
    if (now - this.lastStatusCheck < this.STATUS_CACHE_DURATION) {
      return this.subscriptionStatus;
    }

    try {
      this.subscriptionStatus = await lemonSqueezy.checkSubscriptionStatus();
      this.lastStatusCheck = now;
      
      // Notify UI about subscription status
      figma.ui.postMessage({
        type: 'subscription-status',
        status: this.subscriptionStatus,
      });
      
      return this.subscriptionStatus;
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      return this.subscriptionStatus;
    }
  }

  isPremiumUser(): boolean {
    return this.subscriptionStatus.isPremium;
  }

  canUseFeature(feature: string): boolean {
    if (this.isPremiumUser()) {
      return true;
    }

    // Free users can use basic features
    switch (feature) {
      case PREMIUM_FEATURES.UNLIMITED_BOOKMARKS:
      case PREMIUM_FEATURES.ADVANCED_NAVIGATION:
      case PREMIUM_FEATURES.CUSTOM_EMOJI_SETS:
      case PREMIUM_FEATURES.EXPORT_BOOKMARKS:
      case PREMIUM_FEATURES.TEAM_SHARING:
        return false;
      default:
        return true;
    }
  }

  async checkBookmarkLimit(currentCount: number): Promise<boolean> {
    // For now, just check against free limits - will be enhanced with pricing manager later
    return currentCount < FREE_LIMITS.MAX_BOOKMARKS;
  }

  async checkEmojiSetLimit(currentSetIndex: number): Promise<boolean> {
    // For now, just check against free limits - will be enhanced with pricing manager later
    return currentSetIndex < FREE_LIMITS.MAX_EMOJI_SETS;
  }

  getUpgradeUrl(): string {
    return lemonSqueezy.generateCheckoutUrl(figma.currentUser?.id || undefined);
  }

  async activateLicense(licenseKey: string): Promise<boolean> {
    try {
      const status = await lemonSqueezy.validateLicense(licenseKey);
      
      if (status.isActive) {
        await lemonSqueezy.storeLicenseKey(licenseKey);
        this.subscriptionStatus = status;
        this.lastStatusCheck = Date.now();
        
        figma.ui.postMessage({
          type: 'license-activated',
          status: this.subscriptionStatus,
        });
        
        figma.notify('Premium license activated successfully!');
        return true;
      } else {
        figma.notify('Invalid or expired license key.');
        return false;
      }
    } catch (error) {
      console.error('License activation error:', error);
      figma.notify('Failed to activate license. Please try again.');
      return false;
    }
  }

  async deactivateLicense(): Promise<void> {
    await lemonSqueezy.clearLicense();
    this.subscriptionStatus = {
      isActive: false,
      isPremium: false,
    };
    this.lastStatusCheck = 0;
    
    figma.ui.postMessage({
      type: 'license-deactivated',
    });
    
    figma.notify('License deactivated.');
  }

  getFeatureStatus() {
    const features: Record<string, boolean> = {};
    
    // Check all premium features
    Object.values(PREMIUM_FEATURES).forEach(feature => {
      features[feature] = this.canUseFeature(feature);
    });

    return {
      isPremium: this.isPremiumUser(),
      features,
      limits: this.getCurrentLimits(),
      subscriptionStatus: this.subscriptionStatus,
      descriptions: FEATURE_DESCRIPTIONS,
    };
  }

  getCurrentLimits() {
    const tier = this.isPremiumUser() ? 'pro' : 'free';
    return TIER_CONFIGS[tier].limits;
  }

  // Enhanced feature checking with usage tracking
  async checkFeatureAccess(feature: string): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeMessage?: string;
    currentUsage?: number;
    limit?: number;
  }> {
    if (this.isPremiumUser()) {
      return { allowed: true };
    }

    // Check if feature is available in free tier
    const freeTierFeatures = TIER_CONFIGS.free.features;
    if (!freeTierFeatures.includes(feature as any)) {
      const upgradeMessage = UPGRADE_MESSAGES[feature as keyof typeof UPGRADE_MESSAGES];
      return {
        allowed: false,
        reason: 'premium_only',
        upgradeMessage: typeof upgradeMessage === 'function' ? upgradeMessage(0) : upgradeMessage,
      };
    }

    // Check usage limits for free tier features
    const usage = await this.getFeatureUsage(feature);
    const limit = this.getFeatureLimit(feature);
    
    if (limit !== -1 && usage.dailyCount >= limit) {
      const upgradeMessage = UPGRADE_MESSAGES[feature as keyof typeof UPGRADE_MESSAGES];
      return {
        allowed: false,
        reason: 'limit_exceeded',
        upgradeMessage: typeof upgradeMessage === 'function' ? upgradeMessage(limit) : upgradeMessage,
        currentUsage: usage.dailyCount,
        limit,
      };
    }

    return { 
      allowed: true, 
      currentUsage: usage.dailyCount, 
      limit 
    };
  }

  // Usage tracking methods
  async trackFeatureUsage(feature: string): Promise<void> {
    try {
      const usage = await this.getFeatureUsage(feature);
      
      // Reset daily count if needed
      if (shouldResetDailyCount(usage)) {
        usage.dailyCount = 0;
        usage.lastDailyReset = Date.now();
      }

      usage.count++;
      usage.dailyCount++;
      usage.lastUsed = Date.now();

      await figma.clientStorage.setAsync(`feature_usage_${feature}`, usage);
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }

  async getFeatureUsage(feature: string): Promise<FeatureUsage> {
    try {
      const usage = await figma.clientStorage.getAsync(`feature_usage_${feature}`);
      return usage || createDefaultUsage(feature);
    } catch {
      return createDefaultUsage(feature);
    }
  }

  private getFeatureLimit(feature: string): number {
    const tier = this.isPremiumUser() ? 'pro' : 'free';
    
    // Map features to their limits
    const featureLimitMap: Record<string, keyof typeof FREE_LIMITS> = {
      [PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: 'MAX_BOOKMARKS',
      [PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: 'MAX_EMOJI_SETS',
      [PREMIUM_FEATURES.EXPORT_BOOKMARKS]: 'MAX_EXPORTS_PER_DAY',
    };

    const limitKey = featureLimitMap[feature];
    if (!limitKey) return -1;

    return TIER_CONFIGS[tier].limits[limitKey] || -1;
  }

  // Daily limit checking
  async checkDailyLimit(feature: string, currentCount?: number): Promise<boolean> {
    const access = await this.checkFeatureAccess(feature);
    
    if (!access.allowed) {
      // Show upgrade prompt
      figma.ui.postMessage({
        type: 'show-upgrade-prompt',
        feature,
        message: access.upgradeMessage || 'This feature requires an upgrade.',
        currentUsage: access.currentUsage,
        limit: access.limit,
      });
      return false;
    }

    return true;
  }

  // Get available features for current user
  getAvailableFeatures(): string[] {
    if (this.isPremiumUser()) {
      return Object.values(PREMIUM_FEATURES);
    }
    
    return [...TIER_CONFIGS.free.features];
  }

  // Get feature description
  getFeatureDescription(feature: string) {
    return FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS];
  }
}

export const premiumFeatures = new PremiumFeaturesManager();