"use strict";
// Lemon Squeezy Configuration
// Replace these values with your actual Lemon Squeezy store details
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSandbox = exports.isDevelopment = exports.getCurrentPricingConfig = exports.PRICING_MODELS = exports.LEMON_SQUEEZY_CONFIG = exports.CURRENT_PRICING_MODEL = void 0;
// Current pricing model - change this to switch models
exports.CURRENT_PRICING_MODEL = 'freemium';
exports.LEMON_SQUEEZY_CONFIG = {
    // Your Lemon Squeezy store ID
    storeId: 'YOUR_STORE_ID',
    // Your Lemon Squeezy API key (keep this secure!)
    apiKey: 'YOUR_API_KEY',
    // Your product ID for the premium version
    productId: 'YOUR_PRODUCT_ID',
    // Multiple variant IDs for different pricing tiers
    variants: {
        monthly: 'YOUR_MONTHLY_VARIANT_ID',
        yearly: 'YOUR_YEARLY_VARIANT_ID',
        lifetime: 'YOUR_LIFETIME_VARIANT_ID',
        basic: 'YOUR_BASIC_TIER_VARIANT_ID',
        pro: 'YOUR_PRO_TIER_VARIANT_ID',
        enterprise: 'YOUR_ENTERPRISE_TIER_VARIANT_ID',
    },
    // Default variant (fallback)
    variantId: 'YOUR_DEFAULT_VARIANT_ID',
    // Your store URL (e.g., 'your-store-name')
    storeUrl: 'your-store-name',
    // Webhook endpoint URL (for handling subscription updates)
    webhookUrl: 'https://your-domain.com/webhook/lemon-squeezy',
    // Success/failure redirect URLs
    successUrl: 'https://your-plugin-website.com/success',
    cancelUrl: 'https://your-plugin-website.com/cancel',
};
// Pricing Model Configurations
exports.PRICING_MODELS = {
    // 1. FREEMIUM MODEL (current)
    freemium: {
        name: 'Freemium',
        description: 'Free tier with premium upgrade',
        tiers: {
            free: {
                name: 'Free',
                price: '$0',
                limits: {
                    maxBookmarks: 10,
                    maxEmojiSets: 2,
                    maxHistoryEntries: 20,
                },
                features: ['basic_tagging', 'basic_navigation'],
            },
            premium: {
                name: 'Premium',
                price: '$4.99/month',
                variantId: 'monthly',
                limits: {
                    maxBookmarks: -1, // unlimited
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['unlimited_bookmarks', 'all_emoji_sets', 'export_bookmarks', 'team_sharing'],
            },
        },
    },
    // 2. ONE-TIME PURCHASE MODEL
    'one-time': {
        name: 'One-Time Purchase',
        description: 'Single payment for lifetime access',
        tiers: {
            trial: {
                name: '7-Day Trial',
                price: 'Free',
                duration: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
                limits: {
                    maxBookmarks: -1,
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['all_features'],
            },
            lifetime: {
                name: 'Lifetime License',
                price: '$49.99 one-time',
                variantId: 'lifetime',
                limits: {
                    maxBookmarks: -1,
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['all_features', 'lifetime_updates'],
            },
        },
    },
    // 3. SUBSCRIPTION MODEL
    subscription: {
        name: 'Subscription Only',
        description: 'Monthly or yearly subscription',
        tiers: {
            monthly: {
                name: 'Monthly',
                price: '$4.99/month',
                variantId: 'monthly',
                limits: {
                    maxBookmarks: -1,
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['all_features'],
            },
            yearly: {
                name: 'Yearly',
                price: '$49.99/year',
                variantId: 'yearly',
                savings: '17% off',
                limits: {
                    maxBookmarks: -1,
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['all_features', 'priority_support'],
            },
        },
    },
    // 4. TIERED MODEL
    tiered: {
        name: 'Multiple Tiers',
        description: 'Different feature sets at different prices',
        tiers: {
            basic: {
                name: 'Basic',
                price: '$2.99/month',
                variantId: 'basic',
                limits: {
                    maxBookmarks: 50,
                    maxEmojiSets: 4,
                    maxHistoryEntries: 100,
                },
                features: ['extended_bookmarks', 'more_emoji_sets'],
            },
            pro: {
                name: 'Pro',
                price: '$7.99/month',
                variantId: 'pro',
                popular: true,
                limits: {
                    maxBookmarks: -1,
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['unlimited_everything', 'export_bookmarks', 'advanced_navigation'],
            },
            enterprise: {
                name: 'Enterprise',
                price: '$19.99/month',
                variantId: 'enterprise',
                limits: {
                    maxBookmarks: -1,
                    maxEmojiSets: -1,
                    maxHistoryEntries: -1,
                },
                features: ['all_pro_features', 'team_sharing', 'priority_support', 'custom_integrations'],
            },
        },
    },
    // 5. USAGE-BASED MODEL
    'usage-based': {
        name: 'Pay Per Use',
        description: 'Pay based on usage with credits',
        tiers: {
            starter: {
                name: 'Starter Pack',
                price: '$9.99 for 100 credits',
                variantId: 'starter',
                credits: 100,
                features: ['pay_per_bookmark', 'pay_per_export'],
            },
            power: {
                name: 'Power Pack',
                price: '$24.99 for 300 credits',
                variantId: 'power',
                credits: 300,
                savings: '17% more credits',
                features: ['pay_per_bookmark', 'pay_per_export', 'bulk_operations'],
            },
        },
    },
};
// Get current pricing configuration
const getCurrentPricingConfig = () => exports.PRICING_MODELS[exports.CURRENT_PRICING_MODEL];
exports.getCurrentPricingConfig = getCurrentPricingConfig;
// Development vs Production configuration
exports.isDevelopment = process.env.NODE_ENV === 'development';
// Use test/sandbox mode in development
exports.useSandbox = exports.isDevelopment;
