// Constants for stratusHue Plugin
// Centralized constants for better maintainability

import type { EmojiSet } from './types';

// ===== EMOJI SETS =====
// Emoji sets for layers (square emojis)
export const LAYER_EMOJI_SETS: EmojiSet[] = [
  { name: 'Colors', emojis: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜'] },
  { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
  { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🪦', '⭐', '📱'] }
];

// Emoji sets for pages (circle emojis)
export const PAGE_EMOJI_SETS: EmojiSet[] = [
  { name: 'Colors', emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'] },
  { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
  { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🪦', '⭐', '📱'] }
];

// Legacy constants for backward compatibility
export const LAYER_EMOJI_LIST = LAYER_EMOJI_SETS[0].emojis;
export const PAGE_EMOJI_LIST = PAGE_EMOJI_SETS[0].emojis;


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
export const DEFAULT_UI_HEIGHT = 488;

// ===== TIMING CONSTANTS =====
export const DEBOUNCE_DELAY = 100;
export const SELECTION_TRACKING_DELAY = 500;
export const STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes