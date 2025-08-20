// Pricing Models Manager
// Handles different pricing strategies and tier management

import { CURRENT_PRICING_MODEL, getCurrentPricingConfig, LEMON_SQUEEZY_CONFIG } from '../lemon-squeezy/lemon-squeezy-config';

export interface UserTier {
  tierId: string;
  tierName: string;
  isActive: boolean;
  expiresAt?: number;
  credits?: number;
  features: string[];
  limits: {
    maxBookmarks: number;
    maxEmojiSets: number;
    maxHistoryEntries: number;
  };
}

export class PricingModelManager {
  private currentTier: UserTier | null = null;
  private trialStartTime: number | null = null;

  async initialize(): Promise<void> {
    await this.loadUserTier();
    await this.checkTrialStatus();
  }

  // Get available tiers for current pricing model
  getAvailableTiers() {
    const config = getCurrentPricingConfig();
    return Object.entries(config.tiers).map(([id, tier]) => ({
      id,
      ...tier,
    }));
  }

  // Get current user's tier
  getCurrentTier(): UserTier | null {
    return this.currentTier;
  }

  // Check if user can use a specific feature
  canUseFeature(feature: string): boolean {
    if (!this.currentTier) {
      return this.getFreeTierFeatures().includes(feature);
    }

    return this.currentTier.features.includes(feature) || 
           this.currentTier.features.includes('all_features');
  }

  // Check limits based on current pricing model
  async checkLimit(limitType: 'bookmarks' | 'emojiSets' | 'historyEntries', currentCount: number): Promise<boolean> {
    const tier = this.getCurrentTier();
    
    if (!tier) {
      // Free tier or no tier
      const freeLimits = this.getFreeTierLimits();
      const limit = freeLimits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}` as keyof typeof freeLimits];
      
      if (limit !== -1 && currentCount >= limit) {
        await this.showUpgradePrompt(limitType, limit);
        return false;
      }
      return true;
    }

    const limit = tier.limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}` as keyof typeof tier.limits];
    
    // Handle usage-based model
    if (CURRENT_PRICING_MODEL === 'usage-based' && tier.credits !== undefined) {
      return await this.checkCredits(limitType);
    }

    if (limit !== -1 && currentCount >= limit) {
      await this.showUpgradePrompt(limitType, limit);
      return false;
    }

    return true;
  }

  // Handle different upgrade flows based on pricing model
  async showUpgradePrompt(limitType: string, limit: number): Promise<void> {
    const config = getCurrentPricingConfig();
    let message = '';
    let upgradeOptions: any[] = [];

    switch (CURRENT_PRICING_MODEL) {
      case 'freemium':
        message = `You've reached the free limit of ${limit} ${limitType}. Upgrade to Premium for unlimited access!`;
        upgradeOptions = [{ 
          name: 'Premium', 
          price: config.tiers.premium.price,
          variantId: config.tiers.premium.variantId 
        }];
        break;

      case 'one-time':
        if (this.isTrialExpired()) {
          message = `Your 7-day trial has expired. Purchase a lifetime license to continue using all features.`;
          upgradeOptions = [{ 
            name: 'Lifetime License', 
            price: (config.tiers as any).lifetime?.price || '$19.99',
            variantId: (config.tiers as any).lifetime?.variantId || 'lifetime'
          }];
        }
        break;

      case 'subscription':
        message = `Upgrade to unlock unlimited ${limitType} and all premium features.`;
        upgradeOptions = Object.entries(config.tiers).map(([id, tier]: [string, any]) => ({
          name: tier.name,
          price: tier.price,
          variantId: tier.variantId,
          savings: tier.savings,
        }));
        break;

      case 'tiered':
        const currentTierIndex = this.getCurrentTierIndex();
        const nextTier = this.getNextTier(currentTierIndex);
        if (nextTier) {
          message = `Upgrade to ${nextTier.name} for ${nextTier.limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`] === -1 ? 'unlimited' : nextTier.limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`]} ${limitType}.`;
          upgradeOptions = [{ 
            name: nextTier.name, 
            price: nextTier.price,
            variantId: nextTier.variantId 
          }];
        }
        break;

      case 'usage-based':
        message = `You're running low on credits. Purchase more credits to continue.`;
        upgradeOptions = Object.entries(config.tiers).map(([id, tier]: [string, any]) => ({
          name: tier.name,
          price: tier.price,
          credits: tier.credits,
          variantId: tier.variantId,
        }));
        break;
    }

    figma.ui.postMessage({
      type: 'show-pricing-modal',
      model: CURRENT_PRICING_MODEL,
      message,
      upgradeOptions,
      currentTier: this.currentTier,
    });
  }

  // Generate checkout URL for specific tier
  generateCheckoutUrl(variantId: string, userEmail?: string): string {
    const params = new URLSearchParams({
      'checkout[product_options][redirect_url]': LEMON_SQUEEZY_CONFIG.successUrl,
      'checkout[custom][figma_user_id]': figma.currentUser?.id || 'anonymous',
      'checkout[custom][pricing_model]': CURRENT_PRICING_MODEL,
    });

    if (userEmail) {
      params.append('checkout[email]', userEmail);
    }

    const actualVariantId = LEMON_SQUEEZY_CONFIG.variants[variantId as keyof typeof LEMON_SQUEEZY_CONFIG.variants] || variantId;
    const baseUrl = `https://${LEMON_SQUEEZY_CONFIG.storeUrl}.lemonsqueezy.com/checkout/buy/${actualVariantId}`;

    return `${baseUrl}?${params.toString()}`;
  }

  // Trial management for one-time purchase model
  async startTrial(): Promise<void> {
    if (CURRENT_PRICING_MODEL !== 'one-time') return;

    this.trialStartTime = Date.now();
    await figma.clientStorage.setAsync('trial_start_time', this.trialStartTime);
    
    const config = getCurrentPricingConfig();
    this.currentTier = {
      tierId: 'trial',
      tierName: 'Trial',
      isActive: true,
      expiresAt: this.trialStartTime + ((config.tiers as any).trial?.duration || 7 * 24 * 60 * 60 * 1000),
      features: (config.tiers as any).trial?.features || ['all_features'],
      limits: (config.tiers as any).trial?.limits || { maxBookmarks: -1, maxEmojiSets: -1, maxHistoryEntries: -1 },
    };

    await this.saveUserTier();
    figma.notify('7-day trial started! Enjoy all premium features.');
  }

  private async checkTrialStatus(): Promise<void> {
    if (CURRENT_PRICING_MODEL !== 'one-time') return;

    const trialStart = await figma.clientStorage.getAsync('trial_start_time');
    if (trialStart && this.currentTier?.tierId === 'trial') {
      const config = getCurrentPricingConfig();
      const trialEnd = trialStart + ((config.tiers as any).trial?.duration || 7 * 24 * 60 * 60 * 1000);
      
      if (Date.now() > trialEnd) {
        // Trial expired
        this.currentTier = null;
        await this.saveUserTier();
        figma.notify('Your trial has expired. Purchase a lifetime license to continue.');
      }
    }
  }

  private isTrialExpired(): boolean {
    return this.trialStartTime !== null && 
           this.currentTier?.tierId === 'trial' && 
           Date.now() > (this.currentTier.expiresAt || 0);
  }

  // Usage-based model credit management
  private async checkCredits(action: string): Promise<boolean> {
    if (CURRENT_PRICING_MODEL !== 'usage-based' || !this.currentTier?.credits) {
      return true;
    }

    const creditCost = this.getCreditCost(action);
    
    if (this.currentTier.credits < creditCost) {
      await this.showUpgradePrompt('credits', creditCost);
      return false;
    }

    // Deduct credits
    this.currentTier.credits -= creditCost;
    await this.saveUserTier();
    
    figma.ui.postMessage({
      type: 'credits-updated',
      credits: this.currentTier.credits,
    });

    return true;
  }

  private getCreditCost(action: string): number {
    const costs = {
      bookmarks: 1,
      emojiSets: 2,
      export: 5,
      historyEntries: 1,
    };
    return costs[action as keyof typeof costs] || 1;
  }

  // Helper methods
  private getFreeTierFeatures(): string[] {
    const config = getCurrentPricingConfig();
    const freeTier = Object.values(config.tiers).find((tier: any) => 
      tier.price === '$0' || tier.price === 'Free'
    );
    return freeTier?.features || ['basic_tagging', 'basic_navigation'];
  }

  private getFreeTierLimits() {
    const config = getCurrentPricingConfig();
    const freeTier = Object.values(config.tiers).find((tier: any) => 
      tier.price === '$0' || tier.price === 'Free'
    );
    return freeTier?.limits || { maxBookmarks: 10, maxEmojiSets: 2, maxHistoryEntries: 20 };
  }

  private getCurrentTierIndex(): number {
    if (!this.currentTier) return -1;
    const tiers = Object.keys(getCurrentPricingConfig().tiers);
    return tiers.indexOf(this.currentTier.tierId);
  }

  private getNextTier(currentIndex: number): any {
    const config = getCurrentPricingConfig();
    const tiers = Object.entries(config.tiers);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1][1] : null;
  }

  private async loadUserTier(): Promise<void> {
    try {
      const tierData = await figma.clientStorage.getAsync('user_tier');
      this.currentTier = tierData || null;
    } catch {
      this.currentTier = null;
    }
  }

  private async saveUserTier(): Promise<void> {
    await figma.clientStorage.setAsync('user_tier', this.currentTier);
  }

  // Activate purchased tier
  async activateTier(tierId: string, licenseKey?: string): Promise<boolean> {
    const config = getCurrentPricingConfig();
    const tier = (config.tiers as any)[tierId];
    
    if (!tier) return false;

    this.currentTier = {
      tierId,
      tierName: tier.name,
      isActive: true,
      features: tier.features,
      limits: tier.limits,
      credits: tier.credits,
    };

    if (licenseKey) {
      await figma.clientStorage.setAsync('license_key', licenseKey);
    }

    await this.saveUserTier();
    
    figma.ui.postMessage({
      type: 'tier-activated',
      tier: this.currentTier,
    });

    figma.notify(`${tier.name} activated successfully!`);
    return true;
  }
}

export const pricingManager = new PricingModelManager();