// Constants for Stratus Hue Plugin
// Centralized constants for better maintainability

import type { EmojiSet } from './types';

// ===== EMOJI SETS =====
// Emoji sets for layers (square emojis)
export const LAYER_EMOJI_SETS: EmojiSet[] = [
  { name: 'Colors', emojis: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜'] },
  { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
  { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🔮', '⭐', '📱'] }
];

// Emoji sets for pages (circle emojis)
export const PAGE_EMOJI_SETS: EmojiSet[] = [
  { name: 'Colors', emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'] },
  { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
  { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🔮', '⭐', '📱'] }
];

// Legacy constants for backward compatibility
export const LAYER_EMOJI_LIST = LAYER_EMOJI_SETS[0].emojis;
export const PAGE_EMOJI_LIST = PAGE_EMOJI_SETS[0].emojis;

// ===== PREMIUM FEATURES =====
export const PREMIUM_FEATURES = {
  // Core Features
  UNLIMITED_BOOKMARKS: 'unlimited_bookmarks',
  ADVANCED_NAVIGATION: 'advanced_navigation', 
  CUSTOM_EMOJI_SETS: 'custom_emoji_sets',
  EXPORT_BOOKMARKS: 'export_bookmarks',
  TEAM_SHARING: 'team_sharing',
  
  // Advanced Features
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

// ===== NAVIGATION CONSTANTS =====
export const MAX_HISTORY_ENTRIES = 100;
export const HISTORY_CLEANUP_AGE = 60 * 60 * 1000; // 1 hour in milliseconds

// ===== VALIDATION CONSTANTS =====
export const VALIDATION_INTERVAL = 30000; // 30 seconds

// ===== UI CONSTANTS =====
export const MAX_TITLE_LENGTH = 20;
export const MAX_PAGE_TITLE_LENGTH = 32;

// Default UI dimensions
export const DEFAULT_UI_WIDTH = 240;
export const DEFAULT_UI_HEIGHT = 352;

// ===== TIMING CONSTANTS =====
export const DEBOUNCE_DELAY = 100;
export const SELECTION_TRACKING_DELAY = 500;
export const STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes