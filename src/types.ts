// Type Definitions for Stratus Hue Plugin
// Centralized type definitions for better maintainability

// ===== CORE TYPES =====
export interface Bookmark {
  id: string; // node id
  name: string;
  pageName: string; // page name where the anchor is located
}

export interface LegacyBookmark { 
  id: string; 
  name: string; 
  pageName?: string; 
}

export interface CurrentAnchorState {
  bookmarkId: string | null;  // ID of currently active bookmark
  timestamp: number;          // When this anchor became active
}

export interface RecentHistoryState {
  previousBookmarkId: string | null;  // ID of the previous bookmark (only one)
  lastUpdated: number;                 // Timestamp of last update
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'selection' | 'page' | 'bookmark';
  pageId: string;
  pageName: string;
  nodeId?: string; // for selections/bookmarks
  nodeName?: string;
}

export interface EmojiSet {
  name: string;
  emojis: string[];
}

export interface PageTitleParts {
  leadingSpaces: string;
  emoji: string | null;
  date: string | null;
  title: string; // text after colon, or full name if no colon
}

// ===== PREMIUM TYPES =====
export interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  expiresAt?: string;
  customerId?: string;
  subscriptionId?: string;
}

export interface FeatureUsage {
  feature: string;
  count: number;
  lastUsed: number;
  dailyCount: number;
  lastDailyReset: number;
}

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

// ===== LEMON SQUEEZY TYPES =====
export interface LemonSqueezyConfig {
  storeId: string;
  apiKey: string;
  productId: string;
  variantId: string;
}

export interface LicenseValidationResponse {
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

export type PricingModel = 'freemium' | 'one-time' | 'subscription' | 'tiered' | 'usage-based';

// ===== UI MESSAGE TYPES =====
export interface UIMessage {
  type: string;
  [key: string]: unknown;
}

export interface SelectionStateMessage extends UIMessage {
  type: 'selection-state';
  hasLayerSelected: boolean;
  hasPreviousSelection: boolean;
  layerEmojis: string[];
  pageEmojis: string[];
}

export interface BookmarksMessage extends UIMessage {
  type: 'bookmarks';
  bookmarks: Bookmark[];
  currentAnchorId: string | null;
  previousBookmarkId: string | null;
  isInsideAnchor: boolean;
}

export interface NavigationStateMessage extends UIMessage {
  type: 'navigation-state';
  canGoBack: boolean;
  canGoForward: boolean;
  historyLength: number;
  currentIndex: number;
}

export interface EmojiNavigationStateMessage extends UIMessage {
  type: 'emoji-navigation-state';
  currentSetIndex: number;
  totalSets: number;
  setName: string;
}