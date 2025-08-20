"use strict";
// Premium Features Manager
// Handles feature gating and premium functionality
Object.defineProperty(exports, "__esModule", { value: true });
exports.premiumFeatures = void 0;
const lemon_squeezy_1 = require("../lemon-squeezy/lemon-squeezy");
const premium_features_config_1 = require("./premium-features-config");
class PremiumFeaturesManager {
    constructor() {
        this.subscriptionStatus = {
            isActive: false,
            isPremium: false,
        };
        this.lastStatusCheck = 0;
        this.STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }
    async initialize() {
        await this.refreshSubscriptionStatus();
    }
    async refreshSubscriptionStatus() {
        const now = Date.now();
        // Use cached status if recent
        if (now - this.lastStatusCheck < this.STATUS_CACHE_DURATION) {
            return this.subscriptionStatus;
        }
        try {
            this.subscriptionStatus = await lemon_squeezy_1.lemonSqueezy.checkSubscriptionStatus();
            this.lastStatusCheck = now;
            // Notify UI about subscription status
            figma.ui.postMessage({
                type: 'subscription-status',
                status: this.subscriptionStatus,
            });
            return this.subscriptionStatus;
        }
        catch (error) {
            console.error('Failed to refresh subscription status:', error);
            return this.subscriptionStatus;
        }
    }
    isPremiumUser() {
        return this.subscriptionStatus.isPremium;
    }
    canUseFeature(feature) {
        if (this.isPremiumUser()) {
            return true;
        }
        // Free users can use basic features
        switch (feature) {
            case premium_features_config_1.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS:
            case premium_features_config_1.PREMIUM_FEATURES.ADVANCED_NAVIGATION:
            case premium_features_config_1.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS:
            case premium_features_config_1.PREMIUM_FEATURES.EXPORT_BOOKMARKS:
            case premium_features_config_1.PREMIUM_FEATURES.TEAM_SHARING:
                return false;
            default:
                return true;
        }
    }
    async checkBookmarkLimit(currentCount) {
        // For now, just check against free limits - will be enhanced with pricing manager later
        return currentCount < premium_features_config_1.FREE_LIMITS.MAX_BOOKMARKS;
    }
    async checkEmojiSetLimit(currentSetIndex) {
        // For now, just check against free limits - will be enhanced with pricing manager later
        return currentSetIndex < premium_features_config_1.FREE_LIMITS.MAX_EMOJI_SETS;
    }
    getUpgradeUrl() {
        var _a;
        return lemon_squeezy_1.lemonSqueezy.generateCheckoutUrl(((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.id) || undefined);
    }
    async activateLicense(licenseKey) {
        try {
            const status = await lemon_squeezy_1.lemonSqueezy.validateLicense(licenseKey);
            if (status.isActive) {
                await lemon_squeezy_1.lemonSqueezy.storeLicenseKey(licenseKey);
                this.subscriptionStatus = status;
                this.lastStatusCheck = Date.now();
                figma.ui.postMessage({
                    type: 'license-activated',
                    status: this.subscriptionStatus,
                });
                figma.notify('Premium license activated successfully!');
                return true;
            }
            else {
                figma.notify('Invalid or expired license key.');
                return false;
            }
        }
        catch (error) {
            console.error('License activation error:', error);
            figma.notify('Failed to activate license. Please try again.');
            return false;
        }
    }
    async deactivateLicense() {
        await lemon_squeezy_1.lemonSqueezy.clearLicense();
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
        const features = {};
        // Check all premium features
        Object.values(premium_features_config_1.PREMIUM_FEATURES).forEach(feature => {
            features[feature] = this.canUseFeature(feature);
        });
        return {
            isPremium: this.isPremiumUser(),
            features,
            limits: this.getCurrentLimits(),
            subscriptionStatus: this.subscriptionStatus,
            descriptions: premium_features_config_1.FEATURE_DESCRIPTIONS,
        };
    }
    getCurrentLimits() {
        const tier = this.isPremiumUser() ? 'pro' : 'free';
        return premium_features_config_1.TIER_CONFIGS[tier].limits;
    }
    // Enhanced feature checking with usage tracking
    async checkFeatureAccess(feature) {
        if (this.isPremiumUser()) {
            return { allowed: true };
        }
        // Check if feature is available in free tier
        const freeTierFeatures = premium_features_config_1.TIER_CONFIGS.free.features;
        if (!freeTierFeatures.includes(feature)) {
            const upgradeMessage = premium_features_config_1.UPGRADE_MESSAGES[feature];
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
            const upgradeMessage = premium_features_config_1.UPGRADE_MESSAGES[feature];
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
    async trackFeatureUsage(feature) {
        try {
            const usage = await this.getFeatureUsage(feature);
            // Reset daily count if needed
            if ((0, premium_features_config_1.shouldResetDailyCount)(usage)) {
                usage.dailyCount = 0;
                usage.lastDailyReset = Date.now();
            }
            usage.count++;
            usage.dailyCount++;
            usage.lastUsed = Date.now();
            await figma.clientStorage.setAsync(`feature_usage_${feature}`, usage);
        }
        catch (error) {
            console.error('Failed to track feature usage:', error);
        }
    }
    async getFeatureUsage(feature) {
        try {
            const usage = await figma.clientStorage.getAsync(`feature_usage_${feature}`);
            return usage || (0, premium_features_config_1.createDefaultUsage)(feature);
        }
        catch (_a) {
            return (0, premium_features_config_1.createDefaultUsage)(feature);
        }
    }
    getFeatureLimit(feature) {
        const tier = this.isPremiumUser() ? 'pro' : 'free';
        // Map features to their limits
        const featureLimitMap = {
            [premium_features_config_1.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: 'MAX_BOOKMARKS',
            [premium_features_config_1.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: 'MAX_EMOJI_SETS',
            [premium_features_config_1.PREMIUM_FEATURES.EXPORT_BOOKMARKS]: 'MAX_EXPORTS_PER_DAY',
        };
        const limitKey = featureLimitMap[feature];
        if (!limitKey)
            return -1;
        return premium_features_config_1.TIER_CONFIGS[tier].limits[limitKey] || -1;
    }
    // Daily limit checking
    async checkDailyLimit(feature, currentCount) {
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
    getAvailableFeatures() {
        if (this.isPremiumUser()) {
            return Object.values(premium_features_config_1.PREMIUM_FEATURES);
        }
        return [...premium_features_config_1.TIER_CONFIGS.free.features];
    }
    // Get feature description
    getFeatureDescription(feature) {
        return premium_features_config_1.FEATURE_DESCRIPTIONS[feature];
    }
}
exports.premiumFeatures = new PremiumFeaturesManager();
