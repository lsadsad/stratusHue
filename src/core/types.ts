/// <reference types="@figma/plugin-typings" />

// Type Definitions for stratusHue Plugin
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

// ===== THEME SYSTEM TYPES =====
export type SystemTheme = 'light' | 'dark';
export type ThemeMode = 'system' | 'light' | 'dark' | 'boilerplate' | 'cybertron';
export type EffectiveTheme = 'figma-light' | 'figma-dark' | 'light' | 'boilerplate' | 'cybertron';

export interface ThemePreference {
  mode: ThemeMode;
  lastSystemTheme?: SystemTheme;
  migrationVersion?: number;
}

export interface ThemeConfig {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  cssDataAttribute: string;
  isSystemDependent: boolean;
}

// ===== NAVIGATION TYPES =====
export interface NavigationResult {
  success: boolean;
  message: string;
  newSelection?: readonly SceneNode[];
  viewportUpdate?: boolean;
}

export interface NavigationContext {
  hasSelection: boolean;
  canEnter: boolean;        // Has container selected
  canExit: boolean;         // Has parent container
  canNavigateSiblings: boolean;
  containerCount: number;   // For collapse toggle state (legacy - kept for compatibility)
  siblingContainerCount: number;   // Number of sibling containers for targeted collapse
  hasCollapsibleSiblings: boolean; // Whether sibling containers exist to collapse
  hasComponentInstance: boolean; // Whether selection contains component instances
}

export type NavigationAction = 'enter' | 'exit' | 'next-sibling' | 'prev-sibling' | 'toggle-collapse' | 'goto-main-component';

// Navigation message types
export interface NavigationActionMessage extends UIMessage {
  type: 'navigation-action';
  action: NavigationAction;
}

export interface ToggleNavigationControlsMessage extends UIMessage {
  type: 'toggle-navigation-controls';
  enabled: boolean;
}

export interface NavigationContextUpdateMessage extends UIMessage {
  type: 'navigation-context-update';
  context: NavigationContext;
}

export interface NavigationControlsSettingMessage extends UIMessage {
  type: 'navigation-controls-setting';
  enabled: boolean;
}