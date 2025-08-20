"use strict";
// Pricing Models Manager
// Handles different pricing strategies and tier management
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingManager = exports.PricingModelManager = void 0;
const lemon_squeezy_config_1 = require("../lemon-squeezy/lemon-squeezy-config");
class PricingModelManager {
    constructor() {
        this.currentTier = null;
        this.trialStartTime = null;
    }
    async initialize() {
        await this.loadUserTier();
        await this.checkTrialStatus();
    }
    // Get available tiers for current pricing model
    getAvailableTiers() {
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        return Object.entries(config.tiers).map(([id, tier]) => (Object.assign({ id }, tier)));
    }
    // Get current user's tier
    getCurrentTier() {
        return this.currentTier;
    }
    // Check if user can use a specific feature
    canUseFeature(feature) {
        if (!this.currentTier) {
            return this.getFreeTierFeatures().includes(feature);
        }
        return this.currentTier.features.includes(feature) ||
            this.currentTier.features.includes('all_features');
    }
    // Check limits based on current pricing model
    async checkLimit(limitType, currentCount) {
        const tier = this.getCurrentTier();
        if (!tier) {
            // Free tier or no tier
            const freeLimits = this.getFreeTierLimits();
            const limit = freeLimits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`];
            if (limit !== -1 && currentCount >= limit) {
                await this.showUpgradePrompt(limitType, limit);
                return false;
            }
            return true;
        }
        const limit = tier.limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`];
        // Handle usage-based model
        if (lemon_squeezy_config_1.CURRENT_PRICING_MODEL === 'usage-based' && tier.credits !== undefined) {
            return await this.checkCredits(limitType);
        }
        if (limit !== -1 && currentCount >= limit) {
            await this.showUpgradePrompt(limitType, limit);
            return false;
        }
        return true;
    }
    // Handle different upgrade flows based on pricing model
    async showUpgradePrompt(limitType, limit) {
        var _a, _b;
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        let message = '';
        let upgradeOptions = [];
        switch (lemon_squeezy_config_1.CURRENT_PRICING_MODEL) {
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
                            price: ((_a = config.tiers.lifetime) === null || _a === void 0 ? void 0 : _a.price) || '$19.99',
                            variantId: ((_b = config.tiers.lifetime) === null || _b === void 0 ? void 0 : _b.variantId) || 'lifetime'
                        }];
                }
                break;
            case 'subscription':
                message = `Upgrade to unlock unlimited ${limitType} and all premium features.`;
                upgradeOptions = Object.entries(config.tiers).map(([id, tier]) => ({
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
                upgradeOptions = Object.entries(config.tiers).map(([id, tier]) => ({
                    name: tier.name,
                    price: tier.price,
                    credits: tier.credits,
                    variantId: tier.variantId,
                }));
                break;
        }
        figma.ui.postMessage({
            type: 'show-pricing-modal',
            model: lemon_squeezy_config_1.CURRENT_PRICING_MODEL,
            message,
            upgradeOptions,
            currentTier: this.currentTier,
        });
    }
    // Generate checkout URL for specific tier
    generateCheckoutUrl(variantId, userEmail) {
        var _a;
        const params = new URLSearchParams({
            'checkout[product_options][redirect_url]': lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG.successUrl,
            'checkout[custom][figma_user_id]': ((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous',
            'checkout[custom][pricing_model]': lemon_squeezy_config_1.CURRENT_PRICING_MODEL,
        });
        if (userEmail) {
            params.append('checkout[email]', userEmail);
        }
        const actualVariantId = lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG.variants[variantId] || variantId;
        const baseUrl = `https://${lemon_squeezy_config_1.LEMON_SQUEEZY_CONFIG.storeUrl}.lemonsqueezy.com/checkout/buy/${actualVariantId}`;
        return `${baseUrl}?${params.toString()}`;
    }
    // Trial management for one-time purchase model
    async startTrial() {
        var _a, _b, _c;
        if (lemon_squeezy_config_1.CURRENT_PRICING_MODEL !== 'one-time')
            return;
        this.trialStartTime = Date.now();
        await figma.clientStorage.setAsync('trial_start_time', this.trialStartTime);
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        this.currentTier = {
            tierId: 'trial',
            tierName: 'Trial',
            isActive: true,
            expiresAt: this.trialStartTime + (((_a = config.tiers.trial) === null || _a === void 0 ? void 0 : _a.duration) || 7 * 24 * 60 * 60 * 1000),
            features: ((_b = config.tiers.trial) === null || _b === void 0 ? void 0 : _b.features) || ['all_features'],
            limits: ((_c = config.tiers.trial) === null || _c === void 0 ? void 0 : _c.limits) || { maxBookmarks: -1, maxEmojiSets: -1, maxHistoryEntries: -1 },
        };
        await this.saveUserTier();
        figma.notify('7-day trial started! Enjoy all premium features.');
    }
    async checkTrialStatus() {
        var _a, _b;
        if (lemon_squeezy_config_1.CURRENT_PRICING_MODEL !== 'one-time')
            return;
        const trialStart = await figma.clientStorage.getAsync('trial_start_time');
        if (trialStart && ((_a = this.currentTier) === null || _a === void 0 ? void 0 : _a.tierId) === 'trial') {
            const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
            const trialEnd = trialStart + (((_b = config.tiers.trial) === null || _b === void 0 ? void 0 : _b.duration) || 7 * 24 * 60 * 60 * 1000);
            if (Date.now() > trialEnd) {
                // Trial expired
                this.currentTier = null;
                await this.saveUserTier();
                figma.notify('Your trial has expired. Purchase a lifetime license to continue.');
            }
        }
    }
    isTrialExpired() {
        var _a;
        return this.trialStartTime !== null &&
            ((_a = this.currentTier) === null || _a === void 0 ? void 0 : _a.tierId) === 'trial' &&
            Date.now() > (this.currentTier.expiresAt || 0);
    }
    // Usage-based model credit management
    async checkCredits(action) {
        var _a;
        if (lemon_squeezy_config_1.CURRENT_PRICING_MODEL !== 'usage-based' || !((_a = this.currentTier) === null || _a === void 0 ? void 0 : _a.credits)) {
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
    getCreditCost(action) {
        const costs = {
            bookmarks: 1,
            emojiSets: 2,
            export: 5,
            historyEntries: 1,
        };
        return costs[action] || 1;
    }
    // Helper methods
    getFreeTierFeatures() {
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        const freeTier = Object.values(config.tiers).find((tier) => tier.price === '$0' || tier.price === 'Free');
        return (freeTier === null || freeTier === void 0 ? void 0 : freeTier.features) || ['basic_tagging', 'basic_navigation'];
    }
    getFreeTierLimits() {
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        const freeTier = Object.values(config.tiers).find((tier) => tier.price === '$0' || tier.price === 'Free');
        return (freeTier === null || freeTier === void 0 ? void 0 : freeTier.limits) || { maxBookmarks: 10, maxEmojiSets: 2, maxHistoryEntries: 20 };
    }
    getCurrentTierIndex() {
        if (!this.currentTier)
            return -1;
        const tiers = Object.keys((0, lemon_squeezy_config_1.getCurrentPricingConfig)().tiers);
        return tiers.indexOf(this.currentTier.tierId);
    }
    getNextTier(currentIndex) {
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        const tiers = Object.entries(config.tiers);
        return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1][1] : null;
    }
    async loadUserTier() {
        try {
            const tierData = await figma.clientStorage.getAsync('user_tier');
            this.currentTier = tierData || null;
        }
        catch (_a) {
            this.currentTier = null;
        }
    }
    async saveUserTier() {
        await figma.clientStorage.setAsync('user_tier', this.currentTier);
    }
    // Activate purchased tier
    async activateTier(tierId, licenseKey) {
        const config = (0, lemon_squeezy_config_1.getCurrentPricingConfig)();
        const tier = config.tiers[tierId];
        if (!tier)
            return false;
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
exports.PricingModelManager = PricingModelManager;
exports.pricingManager = new PricingModelManager();
