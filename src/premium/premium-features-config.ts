// Premium Features Configuration
// This file centralizes all premium feature settings for easy management

// ===== FEATURE DEFINITIONS =====
export const PREMIUM_FEATURES = {
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
} as const;

// ===== FREE TIER LIMITS =====
export const FREE_LIMITS = {
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
} as const;

// ===== FEATURE DESCRIPTIONS =====
export const FEATURE_DESCRIPTIONS = {
  [PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: {
    name: 'Unlimited Bookmarks',
    description: 'Create unlimited bookmarks for your layers and components',
    icon: '🔖',
    category: 'core',
  },
  [PREMIUM_FEATURES.ADVANCED_NAVIGATION]: {
    name: 'Advanced Navigation',
    description: 'Enhanced navigation with history, search, and quick jump features',
    icon: '🧭',
    category: 'core',
  },
  [PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: {
    name: 'All Emoji Sets',
    description: 'Access to all emoji sets for tagging and organization',
    icon: '🎨',
    category: 'core',
  },
  [PREMIUM_FEATURES.EXPORT_BOOKMARKS]: {
    name: 'Export Bookmarks',
    description: 'Export and import your bookmarks as JSON or CSV files',
    icon: '📤',
    category: 'productivity',
  },
  [PREMIUM_FEATURES.TEAM_SHARING]: {
    name: 'Team Sharing',
    description: 'Share bookmarks and tags with your team members',
    icon: '👥',
    category: 'collaboration',
  },
  [PREMIUM_FEATURES.BULK_OPERATIONS]: {
    name: 'Bulk Operations',
    description: 'Apply tags and operations to multiple layers at once',
    icon: '⚡',
    category: 'productivity',
  },
  [PREMIUM_FEATURES.CUSTOM_THEMES]: {
    name: 'Custom Themes',
    description: 'Customize the plugin appearance with themes and colors',
    icon: '🎭',
    category: 'customization',
  },
  [PREMIUM_FEATURES.API_ACCESS]: {
    name: 'API Access',
    description: 'Programmatic access to plugin features via REST API',
    icon: '🔌',
    category: 'developer',
  },
  [PREMIUM_FEATURES.PRIORITY_SUPPORT]: {
    name: 'Priority Support',
    description: 'Get priority email support and feature requests',
    icon: '🚀',
    category: 'support',
  },
  [PREMIUM_FEATURES.ANALYTICS]: {
    name: 'Usage Analytics',
    description: 'Track your design workflow and productivity metrics',
    icon: '📊',
    category: 'insights',
  },
  [PREMIUM_FEATURES.AUTOMATION]: {
    name: 'Automation Rules',
    description: 'Create rules to automatically tag and organize layers',
    icon: '🤖',
    category: 'automation',
  },
  [PREMIUM_FEATURES.INTEGRATIONS]: {
    name: 'Third-party Integrations',
    description: 'Connect with Slack, Notion, Jira, and other tools',
    icon: '🔗',
    category: 'integrations',
  },
} as const;

// ===== TIER CONFIGURATIONS =====
export const TIER_CONFIGS = {
  free: {
    name: 'Free',
    price: '$0',
    features: [
      PREMIUM_FEATURES.UNLIMITED_BOOKMARKS, // Limited by FREE_LIMITS
      PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,   // Limited by FREE_LIMITS
    ],
    limits: FREE_LIMITS,
    badge: null,
  },
  
  basic: {
    name: 'Basic',
    price: '$2.99/month',
    features: [
      PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
      PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
      PREMIUM_FEATURES.EXPORT_BOOKMARKS,
      PREMIUM_FEATURES.BULK_OPERATIONS,
    ],
    limits: {
      ...FREE_LIMITS,
      MAX_BOOKMARKS: 100,
      MAX_EMOJI_SETS: 5,
      MAX_EXPORTS_PER_DAY: 10,
      MAX_BULK_OPERATIONS: 5,
    },
    badge: null,
  },
  
  pro: {
    name: 'Pro',
    price: '$7.99/month',
    features: [
      PREMIUM_FEATURES.UNLIMITED_BOOKMARKS,
      PREMIUM_FEATURES.ADVANCED_NAVIGATION,
      PREMIUM_FEATURES.CUSTOM_EMOJI_SETS,
      PREMIUM_FEATURES.EXPORT_BOOKMARKS,
      PREMIUM_FEATURES.TEAM_SHARING,
      PREMIUM_FEATURES.BULK_OPERATIONS,
      PREMIUM_FEATURES.CUSTOM_THEMES,
      PREMIUM_FEATURES.ANALYTICS,
    ],
    limits: {
      ...FREE_LIMITS,
      MAX_BOOKMARKS: -1, // unlimited
      MAX_EMOJI_SETS: -1,
      MAX_HISTORY_ENTRIES: -1,
      MAX_EXPORTS_PER_DAY: -1,
      MAX_BULK_OPERATIONS: -1,
      MAX_CUSTOM_THEMES: 10,
      MAX_TEAM_MEMBERS: 5,
    },
    badge: 'popular',
  },
  
  enterprise: {
    name: 'Enterprise',
    price: '$19.99/month',
    features: Object.values(PREMIUM_FEATURES), // All features
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
} as const;

// ===== UPGRADE MESSAGES =====
export const UPGRADE_MESSAGES = {
  [PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: (limit: number) => 
    `You've reached the limit of ${limit} bookmarks. Upgrade to create unlimited bookmarks!`,
  
  [PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: (limit: number) => 
    `You can only use ${limit} emoji sets on the free plan. Upgrade to access all emoji sets!`,
  
  [PREMIUM_FEATURES.EXPORT_BOOKMARKS]: () => 
    `Export bookmarks is a premium feature. Upgrade to export your bookmarks as JSON or CSV!`,
  
  [PREMIUM_FEATURES.TEAM_SHARING]: () => 
    `Team sharing is a premium feature. Upgrade to share bookmarks with your team!`,
  
  [PREMIUM_FEATURES.BULK_OPERATIONS]: () => 
    `Bulk operations are a premium feature. Upgrade to apply changes to multiple layers at once!`,
  
  [PREMIUM_FEATURES.CUSTOM_THEMES]: () => 
    `Custom themes are a premium feature. Upgrade to personalize your plugin appearance!`,
  
  [PREMIUM_FEATURES.API_ACCESS]: () => 
    `API access is an enterprise feature. Upgrade to integrate with your development workflow!`,
  
  [PREMIUM_FEATURES.ANALYTICS]: () => 
    `Usage analytics are a premium feature. Upgrade to track your design productivity!`,
  
  [PREMIUM_FEATURES.AUTOMATION]: () => 
    `Automation rules are a premium feature. Upgrade to automatically organize your layers!`,
  
  [PREMIUM_FEATURES.INTEGRATIONS]: () => 
    `Third-party integrations are a premium feature. Upgrade to connect with your favorite tools!`,
} as const;

// ===== FEATURE CATEGORIES =====
export const FEATURE_CATEGORIES = {
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
} as const;

// ===== HELPER FUNCTIONS =====
export function getFeaturesByCategory(category: keyof typeof FEATURE_CATEGORIES) {
  return Object.entries(FEATURE_DESCRIPTIONS)
    .filter(([_, desc]) => desc.category === category)
    .map(([feature, desc]) => ({ feature, ...desc }));
}

export function getTierFeatures(tierName: keyof typeof TIER_CONFIGS) {
  const tier = TIER_CONFIGS[tierName];
  return tier.features.map(feature => ({
    feature,
    ...FEATURE_DESCRIPTIONS[feature],
  }));
}

export function getFeatureLimit(feature: string, tierName: keyof typeof TIER_CONFIGS): number {
  const tier = TIER_CONFIGS[tierName];
  
  // Map features to their corresponding limits
  const featureLimitMap: Record<string, keyof typeof tier.limits> = {
    [PREMIUM_FEATURES.UNLIMITED_BOOKMARKS]: 'MAX_BOOKMARKS',
    [PREMIUM_FEATURES.CUSTOM_EMOJI_SETS]: 'MAX_EMOJI_SETS',
    [PREMIUM_FEATURES.EXPORT_BOOKMARKS]: 'MAX_EXPORTS_PER_DAY',
    [PREMIUM_FEATURES.BULK_OPERATIONS]: 'MAX_BULK_OPERATIONS',
    [PREMIUM_FEATURES.CUSTOM_THEMES]: 'MAX_CUSTOM_THEMES',
    [PREMIUM_FEATURES.API_ACCESS]: 'MAX_API_CALLS_PER_DAY',
    [PREMIUM_FEATURES.TEAM_SHARING]: 'MAX_TEAM_MEMBERS',
  };
  
  const limitKey = featureLimitMap[feature];
  return limitKey ? tier.limits[limitKey] : -1;
}

// ===== USAGE TRACKING =====
export interface FeatureUsage {
  feature: string;
  count: number;
  lastUsed: number;
  dailyCount: number;
  lastDailyReset: number;
}

export function createDefaultUsage(feature: string): FeatureUsage {
  return {
    feature,
    count: 0,
    lastUsed: 0,
    dailyCount: 0,
    lastDailyReset: Date.now(),
  };
}

export function shouldResetDailyCount(usage: FeatureUsage): boolean {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return now - usage.lastDailyReset > oneDayMs;
}