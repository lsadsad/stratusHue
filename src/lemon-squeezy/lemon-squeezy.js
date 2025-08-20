"use strict";
// Lemon Squeezy Integration for Figma Plugin
// This handles subscription validation and premium feature gating
Object.defineProperty(exports, "__esModule", { value: true });
exports.LemonSqueezyIntegration = exports.lemonSqueezy = exports.FREE_LIMITS = exports.PREMIUM_FEATURES = void 0;
const lemon_squeezy_config_1 = require("./lemon-squeezy-config");
class LemonSqueezyIntegration {
    constructor(config) {
        this.baseUrl = 'https://api.lemonsqueezy.com/v1';
        this.config = config;
    }
    // Generate checkout URL for premium subscription
    generateCheckoutUrl(userEmail) {
        var _a;
        const params = new URLSearchParams({
            'checkout[product_options][redirect_url]': lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG.successUrl,
            'checkout[custom][figma_user_id]': ((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous',
        });
        if (userEmail) {
            params.append('checkout[email]', userEmail);
        }
        const baseUrl = lemon_squeezy_config_1.useSandbox
            ? `https://${lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG.storeUrl}.lemonsqueezy.com/checkout/buy/${this.config.variantId}`
            : `https://${lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG.storeUrl}.lemonsqueezy.com/checkout/buy/${this.config.variantId}`;
        return `${baseUrl}?${params.toString()}`;
    }
    // Validate license key
    async validateLicense(licenseKey) {
        var _a;
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
                    instance_name: `Figma Plugin - ${((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown'}`,
                }),
            });
            if (!response.ok) {
                throw new Error(`License validation failed: ${response.status}`);
            }
            const data = await response.json();
            return {
                isActive: data.valid && data.license_key.status === 'active',
                isPremium: data.valid && data.license_key.status === 'active',
                expiresAt: data.license_key.expires_at || undefined,
                customerId: data.license_key.customer.id,
            };
        }
        catch (error) {
            console.error('License validation error:', error);
            return {
                isActive: false,
                isPremium: false,
            };
        }
    }
    // Store license key locally
    async storeLicenseKey(licenseKey) {
        await figma.clientStorage.setAsync('lemon_squeezy_license', licenseKey);
    }
    // Retrieve stored license key
    async getStoredLicenseKey() {
        try {
            return await figma.clientStorage.getAsync('lemon_squeezy_license');
        }
        catch (_a) {
            return null;
        }
    }
    // Check current subscription status
    async checkSubscriptionStatus() {
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
    async clearLicense() {
        await figma.clientStorage.setAsync('lemon_squeezy_license', null);
    }
}
exports.LemonSqueezyIntegration = LemonSqueezyIntegration;
// Premium feature definitions
exports.PREMIUM_FEATURES = {
    UNLIMITED_BOOKMARKS: 'unlimited_bookmarks',
    ADVANCED_NAVIGATION: 'advanced_navigation',
    CUSTOM_EMOJI_SETS: 'custom_emoji_sets',
    EXPORT_BOOKMARKS: 'export_bookmarks',
    TEAM_SHARING: 'team_sharing',
};
// Feature limits for free users
exports.FREE_LIMITS = {
    MAX_BOOKMARKS: 10,
    MAX_EMOJI_SETS: 2,
};
// Initialize Lemon Squeezy with your config
exports.lemonSqueezy = new LemonSqueezyIntegration(lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG);
