"use strict";
// Premium Features Configuration
// This file centralizes all premium feature settings for easy management
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_CATEGORIES = exports.UPGRADE_MESSAGES = exports.TIER_CONFIGS = exports.FEATURE_DESCRIPTIONS = exports.FREE_LIMITS = exports.PREMIUM_FEATURES = void 0;
exports.getFeaturesByCategory = getFeaturesByCategory;
exports.getTierFeatures = getTierFeatures;
exports.getFeatureLimit = getFeatureLimit;
exports.createDefaultUsage = createDefaultUsage;
exports.shouldResetDailyCount = shouldResetDailyCount;
// ===== FEATURE DEFINITIONS =====
exports.PREMIUM_FEATURES = {
    // Core Features
    UNLIMITED_BOOKMARKS: 'unlimited_bookmarks',
    ADVANCED_NAVIGATION: 'advanced_navigation',
    CUSTOM_EMOJI_SETS: 'custom_emoji_sets',
    EXPORT_BOOKMARKS: 'export_bookmarks',
    TEAM_SHARING: 'team_sharing',
    // Advanced Features (add new ones here)
    BULK_OPERATIONS: 'bulk_operations',
    CUSTOM_THEMES: 'custom_themes',
    API_ACCESS: 'api_access',
    PRIORITY_SUPPORT: 'priority_support',
    ANALYTICS: 'analytics',
    AUTOMATION: 'automation',
    INTEGRATIONS: 'integrations',
};
// ===== FREE TIER LIMITS =====
exports.FREE_LIMITS = {
    // Core Limits
    MAX_BOOKMARKS: 10,
    MAX_EMOJI_SETS: 2,
    MAX_HISTORY_ENTRIES: 20,
    // Advanced Limits
    MAX_EXPORTS_PER_DAY: 3,
    MAX_BULK_OPERATIONS: 0,
    MAX_CUSTOM_THEMES: 0,
    MAX_API_CALLS_PER_DAY: 0,
    MAX_TEAM_MEMBERS: 0,
};
// ===== FEATURE DESCRIPTIONS =====
exports.FEATURE_DESCRIPTIONS = {
    [exports.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: {
        name: 'Unlimited Bookmarks',
        description: 'Create unlimited bookmarks for your layers and components',
        icon: '🔖',
        category: 'core',
    },
    [exports.PREMIUM_FEATURES.ADVANCED_NAVIGATION]: {
        name: 'Advanced Navigation',
        description: 'Enhanced navigation with history, search, and quick jump features',
        icon: '🧭',
        category: 'core',
    },
    [exports.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: {
        name: 'All Emoji Sets',
        description: 'Access to all emoji sets for tagging and organization',
        icon: '🎨',
        category: 'core',
    },
    [exports.PREMIUM_FEATURES.EXPORT_BOOKMARKS]: {
        name: 'Export Bookmarks',
        description: 'Export and import your bookmarks as JSON or CSV files',
        icon: '📤',
        category: 'productivity',
    },
    [exports.PREMIUM_FEATURES.TEAM_SHARING]: {
        name: 'Team Sharing',
        description: 'Share bookmarks and tags with your team members',
        icon: '👥',
        category: 'collaboration',
    },
    [exports.PREMIUM_FEATURES.BULK_OPERATIONS]: {
        name: 'Bulk Operations',
        description: 'Apply tags and operations to multiple layers at once',
        icon: '⚡',
        category: 'productivity',
    },
    [exports.PREMIUM_FEATURES.CUSTOM_THEMES]: {
        name: 'Custom Themes',
        description: 'Customize the plugin appearance with themes and colors',
        icon: '🎭',
        category: 'customization',
    },
    [exports.PREMIUM_FEATURES.API_ACCESS]: {
        name: 'API Access',
        description: 'Programmatic access to plugin features via REST API',
        icon: '🔌',
        category: 'developer',
    },
    [exports.PREMIUM_FEATURES.PRIORITY_SUPPORT]: {
        name: 'Priority Support',
        description: 'Get priority email support and feature requests',
        icon: '🚀',
        category: 'support',
    },
    [exports.PREMIUM_FEATURES.ANALYTICS]: {
        name: 'Usage Analytics',
        description: 'Track your design workflow and productivity metrics',
        icon: '📊',
        category: 'insights',
    },
    [exports.PREMIUM_FEATURES.AUTOMATION]: {
        name: 'Automation Rules',
        description: 'Create rules to automatically tag and organize layers',
        icon: '🤖',
        category: 'automation',
    },
    [exports.PREMIUM_FEATURES.INTEGRATIONS]: {
        name: 'Third-party Integrations',
        description: 'Connect with Slack, Notion, Jira, and other tools',
        icon: '🔗',
        category: 'integrations',
    },
};
// ===== TIER CONFIGURATIONS =====
exports.TIER_CONFIGS = {
    free: {
        name: 'Free',
        price: '$0',
        features: [
            exports.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS, // Limited by FREE_LIMITS
            exports.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS, // Limited by FREE_LIMITS
        ],
        limits: exports.FREE_LIMITS,
        badge: null,
    },
    basic: {
        name: 'Basic',
        price: '$2.99/month',
        features: [
            exports.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
            exports.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
            exports.PREMIUM_FEATURES.EXPORT_BOOKMARKS,
            exports.PREMIUM_FEATURES.BULK_OPERATIONS,
        ],
        limits: Object.assign(Object.assign({}, exports.FREE_LIMITS), { MAX_BOOKMARKS: 100, MAX_EMOJI_SETS: 5, MAX_EXPORTS_PER_DAY: 10, MAX_BULK_OPERATIONS: 5 }),
        badge: null,
    },
    pro: {
        name: 'Pro',
        price: '$7.99/month',
        features: [
            exports.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
            exports.PREMIUM_FEATURES.ADVANCED_NAVIGATION,
            exports.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
            exports.PREMIUM_FEATURES.EXPORT_BOOKMARKS,
            exports.PREMIUM_FEATURES.TEAM_SHARING,
            exports.PREMIUM_FEATURES.BULK_OPERATIONS,
            exports.PREMIUM_FEATURES.CUSTOM_THEMES,
            exports.PREMIUM_FEATURES.ANALYTICS,
        ],
        limits: Object.assign(Object.assign({}, exports.FREE_LIMITS), { MAX_BOOKMARKS: -1, MAX_EMOJI_SETS: -1, MAX_HISTORY_ENTRIES: -1, MAX_EXPORTS_PER_DAY: -1, MAX_BULK_OPERATIONS: -1, MAX_CUSTOM_THEMES: 10, MAX_TEAM_MEMBERS: 5 }),
        badge: 'popular',
    },
    enterprise: {
        name: 'Enterprise',
        price: '$19.99/month',
        features: Object.values(exports.PREMIUM_FEATURES), // All features
        limits: {
            MAX_BOOKMARKS: -1,
            MAX_EMOJI_SETS: -1,
            MAX_HISTORY_ENTRIES: -1,
            MAX_EXPORTS_PER_DAY: -1,
            MAX_BULK_OPERATIONS: -1,
            MAX_CUSTOM_THEMES: -1,
            MAX_API_CALLS_PER_DAY: 10000,
            MAX_TEAM_MEMBERS: -1,
        },
        badge: 'enterprise',
    },
};
// ===== UPGRADE MESSAGES =====
exports.UPGRADE_MESSAGES = {
    [exports.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: (limit) => `You've reached the limit of ${limit} bookmarks. Upgrade to create unlimited bookmarks!`,
    [exports.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: (limit) => `You can only use ${limit} emoji sets on the free plan. Upgrade to access all emoji sets!`,
    [exports.PREMIUM_FEATURES.EXPORT_BOOKMARKS]: () => `Export bookmarks is a premium feature. Upgrade to export your bookmarks as JSON or CSV!`,
    [exports.PREMIUM_FEATURES.TEAM_SHARING]: () => `Team sharing is a premium feature. Upgrade to share bookmarks with your team!`,
    [exports.PREMIUM_FEATURES.BULK_OPERATIONS]: () => `Bulk operations are a premium feature. Upgrade to apply changes to multiple layers at once!`,
    [exports.PREMIUM_FEATURES.CUSTOM_THEMES]: () => `Custom themes are a premium feature. Upgrade to personalize your plugin appearance!`,
    [exports.PREMIUM_FEATURES.API_ACCESS]: () => `API access is an enterprise feature. Upgrade to integrate with your development workflow!`,
    [exports.PREMIUM_FEATURES.ANALYTICS]: () => `Usage analytics are a premium feature. Upgrade to track your design productivity!`,
    [exports.PREMIUM_FEATURES.AUTOMATION]: () => `Automation rules are a premium feature. Upgrade to automatically organize your layers!`,
    [exports.PREMIUM_FEATURES.INTEGRATIONS]: () => `Third-party integrations are a premium feature. Upgrade to connect with your favorite tools!`,
};
// ===== FEATURE CATEGORIES =====
exports.FEATURE_CATEGORIES = {
    core: {
        name: 'Core Features',
        description: 'Essential functionality for layer organization',
        icon: '⚡',
    },
    productivity: {
        name: 'Productivity',
        description: 'Tools to speed up your workflow',
        icon: '🚀',
    },
    collaboration: {
        name: 'Collaboration',
        description: 'Features for team work',
        icon: '👥',
    },
    customization: {
        name: 'Customization',
        description: 'Personalize your experience',
        icon: '🎨',
    },
    developer: {
        name: 'Developer Tools',
        description: 'Advanced integration capabilities',
        icon: '🔧',
    },
    insights: {
        name: 'Insights',
        description: 'Analytics and reporting',
        icon: '📊',
    },
    automation: {
        name: 'Automation',
        description: 'Automated workflows and rules',
        icon: '🤖',
    },
    integrations: {
        name: 'Integrations',
        description: 'Connect with external tools',
        icon: '🔗',
    },
    support: {
        name: 'Support',
        description: 'Help and assistance',
        icon: '💬',
    },
};
// ===== HELPER FUNCTIONS =====
function getFeaturesByCategory(category) {
    return Object.entries(exports.FEATURE_DESCRIPTIONS)
        .filter(([_, desc]) => desc.category === category)
        .map(([feature, desc]) => (Object.assign({ feature }, desc)));
}
function getTierFeatures(tierName) {
    const tier = exports.TIER_CONFIGS[tierName];
    return tier.features.map(feature => (Object.assign({ feature }, exports.FEATURE_DESCRIPTIONS[feature])));
}
function getFeatureLimit(feature, tierName) {
    const tier = exports.TIER_CONFIGS[tierName];
    // Map features to their corresponding limits
    const featureLimitMap = {
        [exports.PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: 'MAX_BOOKMARKS',
        [exports.PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: 'MAX_EMOJI_SETS',
        [exports.PREMIUM_FEATURES.EXPORT_BOOKMARKS]: 'MAX_EXPORTS_PER_DAY',
        [exports.PREMIUM_FEATURES.BULK_OPERATIONS]: 'MAX_BULK_OPERATIONS',
        [exports.PREMIUM_FEATURES.CUSTOM_THEMES]: 'MAX_CUSTOM_THEMES',
        [exports.PREMIUM_FEATURES.API_ACCESS]: 'MAX_API_CALLS_PER_DAY',
        [exports.PREMIUM_FEATURES.TEAM_SHARING]: 'MAX_TEAM_MEMBERS',
    };
    const limitKey = featureLimitMap[feature];
    return limitKey ? tier.limits[limitKey] : -1;
}
function createDefaultUsage(feature) {
    return {
        feature,
        count: 0,
        lastUsed: 0,
        dailyCount: 0,
        lastDailyReset: Date.now(),
    };
}
function shouldResetDailyCount(usage) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now - usage.lastDailyReset > oneDayMs;
}
