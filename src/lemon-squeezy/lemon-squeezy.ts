// Lemon Squeezy Integration for Figma Plugin
// This handles subscription validation and premium feature gating

import { LEMON_SQUEEZY_CONFIG, useSandbox } from './lemon-squeezy-config';

interface LemonSqueezyConfig {
  storeId: string;
  apiKey: string;
  productId: string;
  variantId: string;
}

interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  expiresAt?: string;
  customerId?: string;
  subscriptionId?: string;
}

interface LicenseValidationResponse {
  valid: boolean;
  license_key: {
    id: string;
    status: string;
    expires_at: string | null;
    customer: {
      id: string;
      email: string;
    };
  };
}

class LemonSqueezyIntegration {
  private config: LemonSqueezyConfig;
  private baseUrl = 'https://api.lemonsqueezy.com/v1';
  
  constructor(config: LemonSqueezyConfig) {
    this.config = config;
  }

  // Generate checkout URL for premium subscription
  generateCheckoutUrl(userEmail?: string): string {
    const params = new URLSearchParams({
      'checkout[product_options][redirect_url]': LEMON_SQUEEZY_CONFIG.successUrl,
      'checkout[custom][figma_user_id]': figma.currentUser?.id || 'anonymous',
    });

    if (userEmail) {
      params.append('checkout[email]', userEmail);
    }

    const baseUrl = useSandbox 
      ? `https://${LEMON_SQUEEZY_CONFIG.storeUrl}.lemonsqueezy.com/checkout/buy/${this.config.variantId}`
      : `https://${LEMON_SQUEEZY_CONFIG.storeUrl}.lemonsqueezy.com/checkout/buy/${this.config.variantId}`;

    return `${baseUrl}?${params.toString()}`;
  }

  // Validate license key
  async validateLicense(licenseKey: string): Promise<SubscriptionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/licenses/validate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          license_key: licenseKey,
          instance_name: `Figma Plugin - ${figma.currentUser?.name || 'Unknown'}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`License validation failed: ${response.status}`);
      }

      const data: LicenseValidationResponse = await response.json();
      
      return {
        isActive: data.valid && data.license_key.status === 'active',
        isPremium: data.valid && data.license_key.status === 'active',
        expiresAt: data.license_key.expires_at || undefined,
        customerId: data.license_key.customer.id,
      };
    } catch (error) {
      console.error('License validation error:', error);
      return {
        isActive: false,
        isPremium: false,
      };
    }
  }

  // Store license key locally
  async storeLicenseKey(licenseKey: string): Promise<void> {
    await figma.clientStorage.setAsync('lemon_squeezy_license', licenseKey);
  }

  // Retrieve stored license key
  async getStoredLicenseKey(): Promise<string | null> {
    try {
      return await figma.clientStorage.getAsync('lemon_squeezy_license');
    } catch {
      return null;
    }
  }

  // Check current subscription status
  async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    const licenseKey = await this.getStoredLicenseKey();
    
    if (!licenseKey) {
      return {
        isActive: false,
        isPremium: false,
      };
    }

    return await this.validateLicense(licenseKey);
  }

  // Clear stored license (for logout/reset)
  async clearLicense(): Promise<void> {
    await figma.clientStorage.setAsync('lemon_squeezy_license', null);
  }
}

// Premium feature definitions
export const PREMIUM_FEATURES = {
  UNLIMITED_BOOKMARKS: 'unlimited_bookmarks',
  ADVANCED_NAVIGATION: 'advanced_navigation',
  CUSTOM_EMOJI_SETS: 'custom_emoji_sets',
  EXPORT_BOOKMARKS: 'export_bookmarks',
  TEAM_SHARING: 'team_sharing',
} as const;

// Feature limits for free users
export const FREE_LIMITS = {
  MAX_BOOKMARKS: 10,
  MAX_EMOJI_SETS: 2,
} as const;

// Initialize Lemon Squeezy with your config
export const lemonSqueezy = new LemonSqueezyIntegration(LEMON_SQUEEZY_CONFIG);

export type { SubscriptionStatus, LemonSqueezyConfig };
export { LemonSqueezyIntegration };