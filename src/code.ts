// Stratus_Hue: A Figma plugin for layer tagging and navigation.

// Temporarily disable premium features to fix syntax error
// import { premiumFeatures } from './premium/premium-features';
// import { pricingManager } from './premium/pricing-models';

// Emoji sets for layers (square emojis)
const LAYER_EMOJI_SETS = [
  { name: 'Colors', emojis: ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜'] },
  { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
  { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🔮', '⭐', '📱'] },
  { name: 'Date', emojis: ['📅', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪'] }
];

// Emoji sets for pages (circle emojis)
const PAGE_EMOJI_SETS = [
  { name: 'Colors', emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'] },
  { name: 'Tools', emojis: ['🏷️', '📌', '🎯', '💡', '⭐', '🔥', '💎', '🎨'] },
  { name: 'Status', emojis: ['🚧', '✅', '👀', '🚀', '🚫', '🔮', '⭐', '📱'] },
  { name: 'Date', emojis: ['📅', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪', '⚪'] }
];

// Legacy constants for backward compatibility
const LAYER_EMOJI_LIST = LAYER_EMOJI_SETS[0].emojis;
const PAGE_EMOJI_LIST = PAGE_EMOJI_SETS[0].emojis;

// --- Bookmark Type Definition ---
interface Bookmark {
  id: string; // node id
  name: string;
  pageName: string; // page name where the anchor is located
}
interface LegacyBookmark { id: string; name: string; pageName?: string; }

// --- Current Anchor State Definition ---
interface CurrentAnchorState {
  bookmarkId: string | null;  // ID of currently active bookmark
  timestamp: number;          // When this anchor became active
}

// --- Recent History State Definition ---
interface RecentHistoryState {
  previousBookmarkId: string | null;  // ID of the previous bookmark (only one)
  lastUpdated: number;                 // Timestamp of last update
}

// --- Navigation History Types ---
interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'selection' | 'page' | 'bookmark';
  pageId: string;
  pageName: string;
  nodeId?: string; // for selections/bookmarks
  nodeName?: string;
}

// Undo support removed

// --- Helper functions for file-specific bookmark storage ---
let bookmarksCache: Bookmark[] | null = null;

// --- Current Anchor State Management ---
let currentAnchorState: CurrentAnchorState = { bookmarkId: null, timestamp: 0 };

// --- Recent History State Management ---
let recentHistoryState: RecentHistoryState = { previousBookmarkId: null, lastUpdated: 0 };

async function loadCurrentAnchor(): Promise<CurrentAnchorState> {
  try {
    const data = await figma.clientStorage.getAsync('currentAnchor');
    if (data && typeof data === 'object' && 'bookmarkId' in data && 'timestamp' in data) {
      currentAnchorState = data as CurrentAnchorState;
      return currentAnchorState;
    }
  } catch (error) {
    console.log('Failed to load current anchor state:', error);
  }

  // Return default state if loading fails
  currentAnchorState = { bookmarkId: null, timestamp: 0 };
  return currentAnchorState;
}

async function saveCurrentAnchor(bookmarkId: string | null): Promise<void> {
  try {
    // Only update if the bookmark ID has actually changed
    if (currentAnchorState.bookmarkId === bookmarkId) {
      return;
    }

    currentAnchorState = {
      bookmarkId,
      timestamp: Date.now()
    };
    await figma.clientStorage.setAsync('currentAnchor', currentAnchorState);
    // Send updated bookmark data to UI with current anchor info
    await sendBookmarksToUI();
  } catch (error) {
    console.log('Failed to save current anchor state:', error);
  }
}

async function loadRecentHistory(): Promise<RecentHistoryState> {
  try {
    const data = await figma.clientStorage.getAsync('recentHistory');
    if (data && typeof data === 'object' && 'previousBookmarkId' in data && 'lastUpdated' in data) {
      recentHistoryState = data as RecentHistoryState;
      return recentHistoryState;
    }
  } catch (error) {
    console.log('Failed to load recent history state:', error);
  }

  // Return default state if loading fails
  recentHistoryState = { previousBookmarkId: null, lastUpdated: 0 };
  return recentHistoryState;
}

async function saveRecentHistory(): Promise<void> {
  try {
    recentHistoryState.lastUpdated = Date.now();
    await figma.clientStorage.setAsync('recentHistory', recentHistoryState);
  } catch (error) {
    console.log('Failed to save recent history state:', error);
  }
}

async function addToRecentHistory(bookmarkId: string): Promise<void> {
  try {
    // The current anchor becomes the previous one
    // Only update if we're switching to a different bookmark
    if (currentAnchorState.bookmarkId && currentAnchorState.bookmarkId !== bookmarkId) {
      recentHistoryState.previousBookmarkId = currentAnchorState.bookmarkId;
      await saveRecentHistory();
    }
  } catch (error) {
    console.log('Failed to add to recent history:', error);
  }
}

async function validateRecentHistory(): Promise<void> {
  try {
    if (!recentHistoryState.previousBookmarkId) {
      return; // Nothing to validate
    }

    const bookmarks = await getBookmarks();
    const validBookmarkIds = new Set(bookmarks.map(b => b.id));
    
    // Check if previous bookmark still exists
    if (!validBookmarkIds.has(recentHistoryState.previousBookmarkId)) {
      recentHistoryState.previousBookmarkId = null;
      await saveRecentHistory();
      return;
    }
    
    // Additional validation: check if node is still accessible
    try {
      const node = await figma.getNodeByIdAsync(recentHistoryState.previousBookmarkId);
      if (!node || !('parent' in node)) {
        recentHistoryState.previousBookmarkId = null;
        await saveRecentHistory();
      }
    } catch (error) {
      // Node is not accessible, clear it
      console.log('Previous bookmark not accessible:', recentHistoryState.previousBookmarkId);
      recentHistoryState.previousBookmarkId = null;
      await saveRecentHistory();
    }
  } catch (error) {
    console.log('Error validating recent history:', error);
    // Reset to empty on error
    recentHistoryState.previousBookmarkId = null;
    await saveRecentHistory();
  }
}



// Helper function to check if a node is a descendant of another node
function isDescendantOf(childNode: BaseNode, parentNode: BaseNode): boolean {
  let currentNode = childNode.parent;
  while (currentNode) {
    if (currentNode.id === parentNode.id) {
      return true;
    }
    currentNode = currentNode.parent;
  }
  return false;
}

async function detectCurrentAnchorFromSelection(): Promise<void> {
  if (isNavigatingHistory) return; // Don't update during history navigation

  const selection = figma.currentPage.selection;
  if (selection.length !== 1) {
    // Clear current anchor if no single selection
    if (currentAnchorState.bookmarkId !== null) {
      await saveCurrentAnchor(null);
    }
    return;
  }

  const selectedNode = selection[0];
  const bookmarks = await getBookmarks();

  // First check if the selected node matches any bookmark exactly
  const exactMatchBookmark = bookmarks.find(bookmark => bookmark.id === selectedNode.id);

  if (exactMatchBookmark) {
    // Set current anchor if it's different from the current one
    if (currentAnchorState.bookmarkId !== exactMatchBookmark.id) {
      await saveCurrentAnchor(exactMatchBookmark.id);
    }
    return;
  }

  // If no exact match, check if the selected node is inside any bookmarked node
  for (const bookmark of bookmarks) {
    try {
      const bookmarkNode = await figma.getNodeByIdAsync(bookmark.id);
      if (bookmarkNode && 'parent' in bookmarkNode) {
        if (isDescendantOf(selectedNode, bookmarkNode as BaseNode)) {
          // Set current anchor to the parent bookmark if it's different
          if (currentAnchorState.bookmarkId !== bookmark.id) {
            await saveCurrentAnchor(bookmark.id);
          }
          return;
        }
      }
    } catch (error) {
      // Skip inaccessible bookmarks
      continue;
    }
  }

  // Clear current anchor if selected node is not bookmarked and not inside any bookmark
  if (currentAnchorState.bookmarkId !== null) {
    await saveCurrentAnchor(null);
  }
}

async function validateCurrentAnchor(): Promise<void> {
  if (!currentAnchorState.bookmarkId) {
    return; // No current anchor to validate
  }

  try {
    // Check if the current anchor bookmark still exists
    const bookmarks = await getBookmarks();
    const currentBookmark = bookmarks.find(bookmark => bookmark.id === currentAnchorState.bookmarkId);

    if (!currentBookmark) {
      // Bookmark no longer exists, clear current anchor
      await saveCurrentAnchor(null);
      return;
    }

    // Check if the referenced element is still accessible
    const node = await figma.getNodeByIdAsync(currentAnchorState.bookmarkId);
    if (!node || !('parent' in node)) {
      // Element no longer exists or is inaccessible, clear current anchor
      await saveCurrentAnchor(null);
      return;
    }

    // Check if current anchor is on the current page
    const targetPage = getContainingPage(node);
    if (!targetPage || targetPage.id !== figma.currentPage.id) {
      // Current anchor is on a different page, clear it
      await saveCurrentAnchor(null);
      return;
    }

  } catch (error) {
    // Error accessing current anchor, clear it
    console.log('Error validating current anchor:', error);
    await saveCurrentAnchor(null);
  }
}

// --- Navigation History Management ---
let navigationHistory: HistoryEntry[] = [];
let historyIndex = -1;
let isNavigatingHistory = false; // Prevent recording during history navigation
const MAX_HISTORY_ENTRIES = 100;
const HISTORY_CLEANUP_AGE = 60 * 60 * 1000; // 1 hour in milliseconds

// --- Emoji Set Navigation State ---
let currentLayerEmojiSetIndex = 0;
let currentPageEmojiSetIndex = 0;

async function loadNavigationHistory(): Promise<void> {
  try {
    const historyData = await figma.clientStorage.getAsync('navigationHistory');
    const indexData = await figma.clientStorage.getAsync('historyIndex');

    if (historyData && Array.isArray(historyData)) {
      navigationHistory = historyData;
      historyIndex = typeof indexData === 'number' ? indexData : -1;
      await cleanupOldHistoryEntries();
    }
  } catch (error) {
    console.log('Failed to load navigation history:', error);
    navigationHistory = [];
    historyIndex = -1;
  }
}

async function saveNavigationHistory(): Promise<void> {
  try {
    await figma.clientStorage.setAsync('navigationHistory', navigationHistory);
    await figma.clientStorage.setAsync('historyIndex', historyIndex);
  } catch (error) {
    console.log('Failed to save navigation history:', error);
  }
}

async function cleanupOldHistoryEntries(): Promise<void> {
  const now = Date.now();
  const originalLength = navigationHistory.length;

  navigationHistory = navigationHistory.filter(entry =>
    (now - entry.timestamp) < HISTORY_CLEANUP_AGE
  );

  // Adjust index if entries were removed
  if (navigationHistory.length !== originalLength) {
    historyIndex = Math.min(historyIndex, navigationHistory.length - 1);
    if (navigationHistory.length > 0 && historyIndex < 0) {
      historyIndex = navigationHistory.length - 1;
    }
  }
}

function generateHistoryId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> {
  if (isNavigatingHistory) return; // Don't record during history navigation

  const newEntry: HistoryEntry = {
    ...entry,
    id: generateHistoryId(),
    timestamp: Date.now()
  };

  // Remove any entries after current index (when navigating back then making new action)
  if (historyIndex >= 0 && historyIndex < navigationHistory.length - 1) {
    navigationHistory = navigationHistory.slice(0, historyIndex + 1);
  }

  // Add new entry
  navigationHistory.push(newEntry);
  historyIndex = navigationHistory.length - 1;

  // Maintain size limit
  if (navigationHistory.length > MAX_HISTORY_ENTRIES) {
    const removeCount = navigationHistory.length - MAX_HISTORY_ENTRIES;
    navigationHistory = navigationHistory.slice(removeCount);
    historyIndex -= removeCount;
  }

  await saveNavigationHistory();
  sendNavigationStateToUI();
}

function canGoBack(): boolean {
  return historyIndex > 0;
}

function canGoForward(): boolean {
  return historyIndex >= 0 && historyIndex < navigationHistory.length - 1;
}

function sendNavigationStateToUI(): void {
  figma.ui.postMessage({
    type: 'navigation-state',
    canGoBack: canGoBack(),
    canGoForward: canGoForward(),
    historyLength: navigationHistory.length,
    currentIndex: historyIndex
  });
}

function getCurrentEmojiSet(isLayer: boolean) {
  if (isLayer) {
    return LAYER_EMOJI_SETS[currentLayerEmojiSetIndex];
  } else {
    return PAGE_EMOJI_SETS[currentPageEmojiSetIndex];
  }
}

function sendEmojiNavigationStateToUI(hasLayerSelected: boolean): void {
  const isLayer = hasLayerSelected;
  const currentSet = getCurrentEmojiSet(isLayer);
  const sets = isLayer ? LAYER_EMOJI_SETS : PAGE_EMOJI_SETS;
  const currentIndex = isLayer ? currentLayerEmojiSetIndex : currentPageEmojiSetIndex;

  figma.ui.postMessage({
    type: 'emoji-navigation-state',
    currentSetIndex: currentIndex,
    totalSets: sets.length,
    setName: currentSet.name
  });
}

function getContainingPage(node: BaseNode): PageNode | null {
  let currentNode = node;
  while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
    currentNode = currentNode.parent;
  }
  return currentNode.parent?.type === 'PAGE' ? currentNode.parent : null;
}

function getPageName(node: BaseNode): string {
  const page = getContainingPage(node);
  return page?.name || 'Unknown Page';
}

function getCurrentDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

async function updateBookmarksForPage(pageId: string, newPageName: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  let bookmarkUpdates = false;
  for (const bookmark of bookmarks) {
    try {
      const node = await figma.getNodeByIdAsync(bookmark.id);
      if (node && 'parent' in node) {
        const page = getContainingPage(node);
        if (page?.id === pageId) {
          bookmark.pageName = newPageName;
          bookmarkUpdates = true;
        }
      }
    } catch (error) {
      console.log('Node not found during bookmark update:', bookmark.id);
    }
  }
  if (bookmarkUpdates) {
    await updateAndSaveBookmarks(bookmarks);
  }
  return bookmarkUpdates;
}

async function getBookmarks(): Promise<Bookmark[]> {
  if (bookmarksCache) {
    return bookmarksCache;
  }
  const data = figma.root.getPluginData('bookmarks');
  const bookmarks = data ? JSON.parse(data) as (Bookmark | LegacyBookmark)[] : [];
  const migrationVersion = figma.root.getPluginData('migrationVersion') || '0';
  if (migrationVersion === '1') {
    bookmarksCache = bookmarks as Bookmark[];
    return bookmarksCache;
  }
  const migratedBookmarks = await Promise.all(bookmarks.map(async (bookmark: LegacyBookmark | Bookmark) => {
    const b = bookmark as LegacyBookmark;
    if (!b.pageName) {
      try {
        const node = await figma.getNodeByIdAsync(b.id);
        if (node && 'parent' in node) {
          b.pageName = getPageName(node);
        } else {
          b.pageName = 'Unknown Page';
        }
      } catch (error) {
        b.pageName = 'Unknown Page';
        console.log('Failed to migrate bookmark:', b.id, error);
      }
    }
    return b as Bookmark;
  }));
  await setBookmarks(migratedBookmarks);
  figma.root.setPluginData('migrationVersion', '1');
  bookmarksCache = migratedBookmarks;
  return migratedBookmarks;
}

async function setBookmarks(bookmarks: Bookmark[]) {
  figma.root.setPluginData('bookmarks', JSON.stringify(bookmarks));
  bookmarksCache = bookmarks;
}

// --- UI Communication Helpers ---
async function sendBookmarksToUI() {
  const bookmarks = await getBookmarks();
  
  // Only send previous bookmark if it's different from current anchor
  const previousBookmarkId = recentHistoryState.previousBookmarkId !== currentAnchorState.bookmarkId 
    ? recentHistoryState.previousBookmarkId 
    : null;

  // Check if user is inside a child of the current anchor
  let isInsideAnchor = false;
  if (currentAnchorState.bookmarkId) {
    const selection = figma.currentPage.selection;
    if (selection.length === 1) {
      try {
        const currentAnchorNode = await figma.getNodeByIdAsync(currentAnchorState.bookmarkId);
        if (currentAnchorNode && 'parent' in currentAnchorNode) {
          // Check if selected node is the anchor itself or a descendant
          const selectedNode = selection[0];
          isInsideAnchor = selectedNode.id === currentAnchorState.bookmarkId || 
                          isDescendantOf(selectedNode, currentAnchorNode as BaseNode);
        }
      } catch (error) {
        // Anchor node not accessible
      }
    }
  }
  
  figma.ui.postMessage({
    type: 'bookmarks',
    bookmarks,
    currentAnchorId: currentAnchorState.bookmarkId,
    previousBookmarkId: previousBookmarkId,
    isInsideAnchor: isInsideAnchor
  });
}

function sendSelectionStateToUI() {
  const selectedLayers = figma.currentPage.selection;
  const hasLayerSelected = selectedLayers.length > 0;
  const currentEmojiSet = getCurrentEmojiSet(hasLayerSelected);

  figma.ui.postMessage({
    type: 'selection-state',
    hasLayerSelected,
    layerEmojis: hasLayerSelected ? currentEmojiSet.emojis : LAYER_EMOJI_SETS[currentLayerEmojiSetIndex].emojis,
    pageEmojis: !hasLayerSelected ? currentEmojiSet.emojis : PAGE_EMOJI_SETS[currentPageEmojiSetIndex].emojis
  });

  // Send emoji navigation state
  sendEmojiNavigationStateToUI(hasLayerSelected);
}

async function updateAndSaveBookmarks(bookmarks: Bookmark[]) {
  await setBookmarks(bookmarks);
  await sendBookmarksToUI();
}

// --- Emoji & Naming Helpers ---
function sanitizeForMatching(name: string): string {
  // Remove emoji variation selectors, zero-width characters, NBSP/BOM, and replacement chars
  return name.replace(/[\uFE0F\u200B\u200C\u200D\u2060\u00A0\uFEFF\uFFFD]/g, '');
}

function normalizePageName(name: string): string {
  // First remove problematic invisible/replacement chars
  let normalized = sanitizeForMatching(name);
  // Ensure exactly one space after arrow (preserve indentation)
  normalized = normalized.replace(/^(\s*↳)\s+/, '$1 ');
  // Ensure exactly one space after emoji when present
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const emojiPattern = `[${allPageEmojis.join('')}]`;
  const regex = new RegExp(`^(\\s*↳\\s*${emojiPattern})\\s+`, 'g');
  normalized = normalized.replace(regex, '$1 ');
  return normalized;
}

// --- Canonical Page Title Builder ---
interface PageTitleParts {
  leadingSpaces: string;
  emoji: string | null;
  date: string | null;
  title: string; // text after colon, or full name if no colon
}

function parsePageTitleParts(rawName: string): PageTitleParts {
  const name = normalizePageName(rawName).normalize('NFC');
  const leadingSpacesMatch = name.match(/^(\s*)/);
  const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[1] : '';
  const colonIndex = name.indexOf(':');
  let beforeColon = colonIndex >= 0 ? name.slice(0, colonIndex) : name;
  let afterColon = colonIndex >= 0 ? name.slice(colonIndex + 1) : '';

  // Extract date anywhere before colon
  const dateMatch = beforeColon.match(/\b(\d{2}\.\d{2})\b/);
  const date = dateMatch ? dateMatch[1] : null;

  // Extract emoji explicitly from our page emoji sets anywhere before colon
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const emojiPattern = new RegExp(`[${allPageEmojis.join('')}]`);
  const emojiMatch = beforeColon.match(emojiPattern);
  const emoji = emojiMatch ? emojiMatch[0] : null;

  // Title is everything after the colon, trimmed of only leading spaces
  const title = afterColon.length > 0 ? afterColon.replace(/^\s+/, '') : name.replace(/^(\s*↳\s*)/, '');

  return { leadingSpaces, emoji, date, title };
}

function composePageTitle(parts: PageTitleParts): string {
  const cleanTitle = sanitizeForMatching(parts.title).trimStart();
  const tokens: string[] = [];
  tokens.push('↳');
  if (parts.emoji) tokens.push(parts.emoji);
  if (parts.date) tokens.push(parts.date);
  let core = tokens.join(' ');
  if (parts.date) {
    core += ' : ' + cleanTitle;
  } else {
    // No date means just put a single space and the title
    core += (tokens.length > 0 ? ' ' : '') + cleanTitle;
  }
  return normalizePageName(parts.leadingSpaces + core);
}
function removeEmojiPrefix(name: string): string {
  // Remove a LEADING emoji tag (layer/page) and an optional single space after it.
  // Get all emojis from all sets
  const allLayerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const allEmojis = [...allLayerEmojis, ...allPageEmojis];

  for (const emoji of allEmojis) {
    if (name.startsWith(emoji + ' ')) {
      return name.slice((emoji + ' ').length);
    }
    if (name.startsWith(emoji)) {
      return name.slice(emoji.length);
    }
  }
  return name;
}

function replaceColorEmoji(name: string, newEmoji: string): string {
  // Get all emojis from all sets
  const allLayerEmojis = LAYER_EMOJI_SETS.flatMap(set => set.emojis);
  const allPageEmojis = PAGE_EMOJI_SETS.flatMap(set => set.emojis);
  const allEmojis = [...allLayerEmojis, ...allPageEmojis];

  for (const emoji of allEmojis) {
    if (name.includes(emoji)) {
      return name.replace(emoji, newEmoji);
    }
  }
  return newEmoji + ' ' + name;
}

async function updateBookmarkIfExists(layerId: string, newName: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  const bookmark = bookmarks.find(b => b.id === layerId);
  if (bookmark && bookmark.name !== newName) {
    bookmark.name = newName;
    try {
      const node = await figma.getNodeByIdAsync(layerId);
      if (node && 'parent' in node) {
        bookmark.pageName = getPageName(node);
      }
    } catch (error) {
      console.log('Failed to update bookmark page name:', layerId, error);
    }
    await updateAndSaveBookmarks(bookmarks);
    return true;
  }
  return false;
}

// --- Automatic Validation System ---
let lastValidationTime = 0;
const VALIDATION_INTERVAL = 30000; // 30 seconds

async function autoValidateBookmarks(): Promise<void> {
  const now = Date.now();
  if (now - lastValidationTime < VALIDATION_INTERVAL) {
    return; // Don't validate too frequently
  }
  
  lastValidationTime = now;
  const result = await validateAndSyncBookmarks();
  
  // Silently update UI if there were changes
  if (result.updated > 0 || result.removed > 0) {
    await sendBookmarksToUI();
  }
}

// --- Navigation & Cleanup Helpers ---
async function cleanupBookmark(bookmarkId: string) {
  const bookmarks = await getBookmarks();
  const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
  await updateAndSaveBookmarks(newBookmarks);

  // Clear current anchor if the deleted bookmark was the current anchor
  if (currentAnchorState.bookmarkId === bookmarkId) {
    await saveCurrentAnchor(null);
  }

  // Remove from recent history if the deleted bookmark was the previous bookmark
  if (recentHistoryState.previousBookmarkId === bookmarkId) {
    recentHistoryState.previousBookmarkId = null;
    await saveRecentHistory();
  }
}

async function navigateToNode(node: BaseNode & { name: string }, recordHistory: boolean = true) {
  const targetPage = getContainingPage(node);
  if (targetPage) {
    if (figma.currentPage !== targetPage) {
      await figma.setCurrentPageAsync(targetPage);
    }
    if ('visible' in node && node.visible) {
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      figma.notify(`Jumped to: ${node.name} (Page: ${targetPage.name})`);

      // Record in history if not navigating through history
      if (recordHistory && !isNavigatingHistory) {
        await addHistoryEntry({
          type: 'selection',
          pageId: targetPage.id,
          pageName: targetPage.name,
          nodeId: node.id,
          nodeName: node.name
        });
      }
    }
  } else {
    figma.notify('Could not locate page for this bookmark.');
  }
}

async function handleGoBack(): Promise<void> {
  if (!canGoBack()) {
    figma.notify('No previous location in history.');
    return;
  }

  isNavigatingHistory = true;
  historyIndex--;
  const entry = navigationHistory[historyIndex];

  try {
    if (entry.nodeId) {
      // Navigate to specific node
      const node = await figma.getNodeByIdAsync(entry.nodeId);
      if (node && 'name' in node) {
        await navigateToNode(node as BaseNode & { name: string }, false);
      } else {
        // Node no longer exists, navigate to page instead
        const page = figma.root.children.find(p => p.id === entry.pageId);
        if (page && page.type === 'PAGE') {
          await figma.setCurrentPageAsync(page);
          figma.notify(`Went back to: ${entry.pageName}`);
        } else {
          figma.notify('Previous location no longer exists.');
        }
      }
    } else {
      // Navigate to page
      const page = figma.root.children.find(p => p.id === entry.pageId);
      if (page && page.type === 'PAGE') {
        await figma.setCurrentPageAsync(page);
        figma.notify(`Went back to: ${entry.pageName}`);
      } else {
        figma.notify('Previous page no longer exists.');
      }
    }
  } catch (error) {
    figma.notify('Error navigating to previous location.');
    console.error('Navigation error:', error);
  } finally {
    isNavigatingHistory = false;
    await saveNavigationHistory();
    sendNavigationStateToUI();
  }
}

async function handleGoForward(): Promise<void> {
  if (!canGoForward()) {
    figma.notify('No forward location in history.');
    return;
  }

  isNavigatingHistory = true;
  historyIndex++;
  const entry = navigationHistory[historyIndex];

  try {
    if (entry.nodeId) {
      // Navigate to specific node
      const node = await figma.getNodeByIdAsync(entry.nodeId);
      if (node && 'name' in node) {
        await navigateToNode(node as BaseNode & { name: string }, false);
      } else {
        // Node no longer exists, navigate to page instead
        const page = figma.root.children.find(p => p.id === entry.pageId);
        if (page && page.type === 'PAGE') {
          await figma.setCurrentPageAsync(page);
          figma.notify(`Went forward to: ${entry.pageName}`);
        } else {
          figma.notify('Forward location no longer exists.');
        }
      }
    } else {
      // Navigate to page
      const page = figma.root.children.find(p => p.id === entry.pageId);
      if (page && page.type === 'PAGE') {
        await figma.setCurrentPageAsync(page);
        figma.notify(`Went forward to: ${entry.pageName}`);
      } else {
        figma.notify('Forward page no longer exists.');
      }
    }
  } catch (error) {
    figma.notify('Error navigating to forward location.');
    console.error('Navigation error:', error);
  } finally {
    isNavigatingHistory = false;
    await saveNavigationHistory();
    sendNavigationStateToUI();
  }
}

// --- Plugin UI Setup ---
figma.showUI(__html__, { width: 188, height: 352 });

// Initialize premium features and pricing
// premiumFeatures.initialize();
// pricingManager.initialize();

function debounce<T extends (...args: any[]) => unknown>(fn: T, wait = 100) {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => { fn(...args); }, wait) as unknown as number;
  };
}

const sendSelectionStateToUIDebounced = debounce(sendSelectionStateToUI, 100);

// Debounced selection tracking for history
const trackSelectionForHistory = debounce(async () => {
  if (isNavigatingHistory) return; // Don't record during history navigation

  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const node = selection[0];
    const targetPage = getContainingPage(node);
    if (targetPage) {
      // Check if this selection is different from the current history entry
      const currentEntry = navigationHistory[historyIndex];
      if (!currentEntry ||
        currentEntry.nodeId !== node.id ||
        currentEntry.pageId !== targetPage.id) {
        await addHistoryEntry({
          type: 'selection',
          pageId: targetPage.id,
          pageName: targetPage.name,
          nodeId: node.id,
          nodeName: node.name
        });
      }
    }
  }
}, 500); // Wait 500ms to avoid recording rapid selections

// Debounced current anchor detection
const detectCurrentAnchorDebounced = debounce(detectCurrentAnchorFromSelection, 100);

figma.on('selectionchange', () => {
  sendSelectionStateToUIDebounced();
  trackSelectionForHistory(); // Track selections for history
  detectCurrentAnchorDebounced(); // Detect current anchor from selection
  
  // Also update bookmarks UI to reflect inside anchor state
  setTimeout(async () => {
    await sendBookmarksToUI();
  }, 150); // Slight delay to ensure anchor detection completes first
});

// Track page changes for history
figma.on('currentpagechange', async () => {
  if (isNavigatingHistory) return; // Don't record during history navigation

  const currentPage = figma.currentPage;

  // Check if this page change is different from the current history entry
  const currentEntry = navigationHistory[historyIndex];
  if (!currentEntry || currentEntry.pageId !== currentPage.id) {
    await addHistoryEntry({
      type: 'page',
      pageId: currentPage.id,
      pageName: currentPage.name
    });
  }

  // Auto-validate bookmarks when changing pages
  await autoValidateBookmarks();

  // Validate current anchor when page changes (will clear if on different page)
  await validateCurrentAnchor();
});


// Automatic validation and sync of bookmarks
async function validateAndSyncBookmarks(): Promise<{ updated: number; removed: number }> {
  const bookmarks = await getBookmarks();
  if (bookmarks.length === 0) {
    return { updated: 0, removed: 0 };
  }

  let updatedCount = 0;
  let removedCount = 0;
  const validBookmarks: Bookmark[] = [];

  for (const bookmark of bookmarks) {
    try {
      const node = await figma.getNodeByIdAsync(bookmark.id);
      if (node && 'name' in node) {
        const latestName = (node as BaseNode & { name: string }).name;
        const latestPageName = getPageName(node as BaseNode);
        
        // Update if name or page changed
        if (bookmark.name !== latestName || bookmark.pageName !== latestPageName) {
          bookmark.name = latestName;
          bookmark.pageName = latestPageName;
          updatedCount++;
        }
        validBookmarks.push(bookmark);
      } else {
        // Node exists but is not accessible (might be deleted)
        removedCount++;
      }
    } catch (_) {
      // Node doesn't exist anymore
      removedCount++;
    }
  }

  // Update bookmarks if there were changes
  if (updatedCount > 0 || removedCount > 0) {
    await updateAndSaveBookmarks(validBookmarks);
    
    // Clean up current anchor and recent history if needed
    if (currentAnchorState.bookmarkId && !validBookmarks.find(b => b.id === currentAnchorState.bookmarkId)) {
      await saveCurrentAnchor(null);
    }
    if (recentHistoryState.previousBookmarkId && !validBookmarks.find(b => b.id === recentHistoryState.previousBookmarkId)) {
      recentHistoryState.previousBookmarkId = null;
      await saveRecentHistory();
    }
  }

  return { updated: updatedCount, removed: removedCount };
}



// --- Message Handler Functions ---
async function handleSaveBookmark(selectedLayers: readonly SceneNode[]) {
  if (selectedLayers.length === 0) {
    figma.notify('Please select a layer to bookmark.');
    return;
  }
  
  const node = selectedLayers[0];
  const bookmarks = await getBookmarks();
  const existingBookmarkIndex = bookmarks.findIndex(b => b.id === node.id);
  const pageName = getPageName(node);
  
  if (existingBookmarkIndex !== -1) {
    if (bookmarks[existingBookmarkIndex].name !== node.name) {
      bookmarks[existingBookmarkIndex].name = node.name;
      bookmarks[existingBookmarkIndex].pageName = pageName;
      await updateAndSaveBookmarks(bookmarks);
      figma.notify('Bookmark name updated!');
    } else {
      figma.notify('Layer already bookmarked.');
    }
  } else {
    // Check premium limits before adding new bookmark
    // const canAdd = await premiumFeatures.checkBookmarkLimit(bookmarks.length);
    // if (!canAdd) {
    //   return; // Premium check will show upgrade prompt
    // }
    
    bookmarks.push({ id: node.id, name: node.name, pageName: pageName });
    await updateAndSaveBookmarks(bookmarks);
    figma.notify('Bookmark saved!');
  }
}

async function handleRemoveBookmark(bookmarkId: string) {
  await cleanupBookmark(bookmarkId);
  figma.notify('Bookmark removed.');
}

async function handleJumpToBookmark(bookmarkId: string) {
  // Auto-validate bookmarks before jumping
  await autoValidateBookmarks();
  
  try {
    const node = await figma.getNodeByIdAsync(bookmarkId);
    if (!node || !('parent' in node)) {
      figma.notify('Bookmark no longer exists. Cleaning up...');
      await cleanupBookmark(bookmarkId);
      return;
    }
    await updateBookmarkIfExists(bookmarkId, node.name);

    // Add to recent history before setting as current anchor
    await addToRecentHistory(bookmarkId);

    // Set current anchor state when navigating to bookmark
    await saveCurrentAnchor(bookmarkId);

    // Record as bookmark navigation in history
    if (!isNavigatingHistory) {
      const targetPage = getContainingPage(node);
      if (targetPage) {
        // Check if this bookmark jump is different from the current history entry
        const currentEntry = navigationHistory[historyIndex];
        if (!currentEntry ||
          currentEntry.nodeId !== node.id ||
          currentEntry.pageId !== targetPage.id) {
          await addHistoryEntry({
            type: 'bookmark',
            pageId: targetPage.id,
            pageName: targetPage.name,
            nodeId: node.id,
            nodeName: node.name
          });
        }
      }
    }

    await navigateToNode(node, false); // Don't double-record history
  } catch (error) {
    figma.notify('Error accessing bookmark. Cleaning up...');
    await cleanupBookmark(bookmarkId);
  }
}

async function updateLayerEmojis(layers: readonly SceneNode[], emoji: string): Promise<boolean> {
  if (layers.length === 0) return false;
  const bookmarks = await getBookmarks();
  const bookmarkById = new Map<string, Bookmark>(bookmarks.map(b => [b.id, b]));
  let bookmarkUpdates = false;
  for (const layer of layers) {
    const cleanName = removeEmojiPrefix(layer.name);
    const newName = emoji + ' ' + cleanName;
    layer.name = newName;
    const b = bookmarkById.get(layer.id);
    if (b && b.name !== newName) {
      b.name = newName;
      b.pageName = getPageName(layer);
      bookmarkUpdates = true;
    }
  }
  if (bookmarkUpdates) {
    await updateAndSaveBookmarks(bookmarks);
  }
  return bookmarkUpdates;
}

async function updatePageEmoji(page: PageNode, emoji: string): Promise<boolean> {
  const originalName = page.name;
  const parts = parsePageTitleParts(originalName);
  const date = parts.date ?? getCurrentDateString();
  const newTitle = composePageTitle({
    leadingSpaces: parts.leadingSpaces,
    emoji,
    date,
    title: parts.title
  });
  page.name = newTitle;
  return await updateBookmarksForPage(page.id, page.name);
}

async function handleAddEmoji(selectedLayers: readonly SceneNode[], emoji: string) {
  if (selectedLayers.length > 0) {
    const bookmarkUpdates = await updateLayerEmojis(selectedLayers, emoji);
    const messages = ['Layer emoji updated!'];
    if (bookmarkUpdates) {
      messages.push('Bookmarks updated.');
    }
    figma.notify(messages.join(' '));
  } else {
    const bookmarkUpdates = await updatePageEmoji(figma.currentPage, emoji);
    figma.notify(`Page emoji updated! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
  }
}

async function clearLayerEmojis(layers: readonly SceneNode[]): Promise<{ emojiCleared: boolean; bookmarkUpdates: boolean }> {
  let emojiCleared = false;
  let bookmarkUpdates = false;
  if (layers.length === 0) return { emojiCleared, bookmarkUpdates };

  const bookmarks = await getBookmarks();
  const bookmarkById = new Map<string, Bookmark>(bookmarks.map(b => [b.id, b]));

  for (const layer of layers) {
    const cleanName = removeEmojiPrefix(layer.name);
    if (cleanName !== layer.name) {
      layer.name = cleanName;
      emojiCleared = true;
      const b = bookmarkById.get(layer.id);
      if (b && b.name !== cleanName) {
        b.name = cleanName;
        b.pageName = getPageName(layer);
        bookmarkUpdates = true;
      }
    }
  }

  if (bookmarkUpdates) {
    await updateAndSaveBookmarks(bookmarks);
  }

  return { emojiCleared, bookmarkUpdates };
}

async function clearPageEmoji(page: PageNode): Promise<{ emojiCleared: boolean; bookmarkUpdates: boolean }> {
  const originalName = page.name;
  const parts = parsePageTitleParts(originalName);
  if (!parts.emoji && originalName.includes('↳')) {
    // Normalize even if no emoji to remove, to eliminate broken char cases
    const normalizedTitle = composePageTitle({
      leadingSpaces: parts.leadingSpaces,
      emoji: null,
      date: parts.date,
      title: parts.title
    });
    if (normalizedTitle !== originalName) {
      page.name = normalizedTitle;
      await updateBookmarksForPage(page.id, normalizedTitle);
      return { emojiCleared: true, bookmarkUpdates: true };
    }
    return { emojiCleared: false, bookmarkUpdates: false };
  }

  // Remove emoji and rebuild canonically
  const newTitle = composePageTitle({
    leadingSpaces: parts.leadingSpaces,
    emoji: null,
    date: parts.date,
    title: parts.title
  });
  if (newTitle !== originalName) {
    page.name = newTitle;
    await updateBookmarksForPage(page.id, newTitle);
    return { emojiCleared: true, bookmarkUpdates: true };
  }
  return { emojiCleared: false, bookmarkUpdates: false };
}

async function handleClearEmoji(selectedLayers: readonly SceneNode[]) {
  if (selectedLayers.length > 0) {
    const { emojiCleared, bookmarkUpdates } = await clearLayerEmojis(selectedLayers);
    if (emojiCleared) {
      const messages = ['Layer emoji cleared!'];
      if (bookmarkUpdates) {
        messages.push('Bookmarks updated.');
      }
      figma.notify(messages.join(' '));
    } else {
      figma.notify('No matching emoji to clear from layers.');
    }
  } else {
    const { emojiCleared, bookmarkUpdates } = await clearPageEmoji(figma.currentPage);
    if (emojiCleared) {
      figma.notify(`Page emoji cleared! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
    } else {
      figma.notify('No matching emoji to clear from page title.');
    }
  }
}

/**
 * Adds date to selected layers or current page based on context.
 * Replaces existing dates with the current date.
 */
async function handleAddDateTitle() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${month}.${day}`;
  const selectedLayers = figma.currentPage.selection;

  if (selectedLayers.length > 0) {
    // If layers are selected, update their names
    const bookmarks = await getBookmarks();
    const bookmarkById = new Map<string, Bookmark>(bookmarks.map(b => [b.id, b]));
    let layersUpdated = 0;
    let bookmarkUpdates = false;
    for (const layer of selectedLayers) {
      let newName = layer.name;

      // Check for existing date patterns in layer names
      // Pattern 1: 🟨 08.05 : Layer name
      // Pattern 2: (08.05 : Layer name)
      const datePattern1 = /\b\d{2}\.\d{2}\s*:\s*/;
      const datePattern2 = /\(\d{2}\.\d{2}\s*:\s*/;

      if (datePattern1.test(layer.name)) {
        // Replace existing date with current date
        newName = layer.name.replace(datePattern1, `${dateString} : `);
        layersUpdated++;
      } else if (datePattern2.test(layer.name)) {
        // Replace existing date in parentheses with current date
        newName = layer.name.replace(datePattern2, `(${dateString} : `);
        layersUpdated++;
      } else {
        // Add new date prefix if no existing date found
        newName = `${LAYER_EMOJI_LIST[2]} ${dateString} : ${layer.name}`;
        layersUpdated++;
      }

      layer.name = newName;
      const b = bookmarkById.get(layer.id);
      if (b && b.name !== newName) {
        b.name = newName;
        b.pageName = getPageName(layer);
        bookmarkUpdates = true;
      }
    }
    if (bookmarkUpdates) {
      await updateAndSaveBookmarks(bookmarks);
    }

    if (layersUpdated > 0) {
      figma.notify(`Date updated/added to ${layersUpdated} layer(s)!`);
    } else {
      figma.notify('No layers were updated.');
    }
  } else {
    // If no layers are selected, update the current page using canonical builder
    const currentPage = figma.currentPage;
    const originalName = currentPage.name;
    const parts = parsePageTitleParts(originalName);
    const newParts: PageTitleParts = {
      leadingSpaces: parts.leadingSpaces,
      emoji: parts.emoji,
      date: dateString,
      title: parts.title
    };
    const newPageName = composePageTitle(newParts);
    if (newPageName !== currentPage.name) {
      currentPage.name = newPageName;
      await updateBookmarksForPage(currentPage.id, currentPage.name);
      figma.notify('Date updated/added to current page!');
    } else {
      figma.notify('Current page already has today\'s date.');
    }
  }
}

/**
 * Creates a new page with a default name.
 */
async function handleCreateNewPage() {
  const newPage = figma.createPage();
  newPage.name = 'New Page';
  await figma.setCurrentPageAsync(newPage);
  figma.notify('New page created!');
}

/**
 * Recursively finds all collapsible layers in a node and its children.
 * This is optimized to avoid performance issues.
 */
function getAllCollapsibleLayers(node: BaseNode, maxDepth: number = 3): SceneNode[] {
  const collapsibleLayers: SceneNode[] = [];

  function traverse(currentNode: BaseNode, depth: number) {
    if (depth > maxDepth) return; // Limit depth to prevent performance issues

    // Check if this node itself is collapsible
    if ('expanded' in currentNode) {
      collapsibleLayers.push(currentNode as SceneNode);
    }

    // Recursively check children
    if ('children' in currentNode) {
      for (const child of currentNode.children) {
        traverse(child, depth + 1);
      }
    }
  }

  traverse(node, 0);
  return collapsibleLayers;
}

/**
 * Collapses selected layers in the layer panel.
 */
async function handleCollapseLayers(selectedLayers: readonly SceneNode[]) {
  if (selectedLayers.length === 0) {
    figma.notify('Please select layers to collapse.');
    return;
  }

  // Build a set of layers to collapse: selected + all collapsible siblings
  const layersToCollapse: SceneNode[] = [];
  const seen = new Set<string>();
  for (const node of selectedLayers) {
    if ('parent' in node && node.parent && 'children' in node.parent) {
      for (const sib of node.parent.children as readonly SceneNode[]) {
        if ('expanded' in sib && !seen.has(sib.id)) {
          layersToCollapse.push(sib);
          seen.add(sib.id);
        }
      }
    } else if ('expanded' in node && !seen.has(node.id)) {
      layersToCollapse.push(node as SceneNode);
      seen.add(node.id);
    }
  }

  let collapsedCount = 0;
  for (const layer of layersToCollapse) {
    if ('expanded' in layer) {
      layer.expanded = false;
      collapsedCount++;
    }
  }

  if (collapsedCount > 0) {
    figma.notify(`${collapsedCount} layer(s) collapsed!`);
  } else {
    figma.notify('No collapsible layers selected.');
  }
}

// Deselect only

function handleDeselect() {
  figma.currentPage.selection = [];
  sendSelectionStateToUI();
  figma.notify('Selection cleared.');
}

async function handleNavigateEmojiSet(direction: 'prev' | 'next') {
  const selectedLayers = figma.currentPage.selection;
  const hasLayerSelected = selectedLayers.length > 0;

  if (hasLayerSelected) {
    // Check premium limits for layer emoji sets
    const newIndex = direction === 'next' 
      ? (currentLayerEmojiSetIndex + 1) % LAYER_EMOJI_SETS.length
      : currentLayerEmojiSetIndex === 0 ? LAYER_EMOJI_SETS.length - 1 : currentLayerEmojiSetIndex - 1;
    
    // const canNavigate = await premiumFeatures.checkEmojiSetLimit(newIndex);
    // if (!canNavigate) {
    //   return; // Premium check will show upgrade prompt
    // }
    
    currentLayerEmojiSetIndex = newIndex;
  } else {
    // Check premium limits for page emoji sets
    const newIndex = direction === 'next'
      ? (currentPageEmojiSetIndex + 1) % PAGE_EMOJI_SETS.length
      : currentPageEmojiSetIndex === 0 ? PAGE_EMOJI_SETS.length - 1 : currentPageEmojiSetIndex - 1;
    
    // const canNavigate = await premiumFeatures.checkEmojiSetLimit(newIndex);
    // if (!canNavigate) {
    //   return; // Premium check will show upgrade prompt
    // }
    
    currentPageEmojiSetIndex = newIndex;
  }

  // Update UI with new emoji set
  sendSelectionStateToUI();

  const currentSet = getCurrentEmojiSet(hasLayerSelected);
  figma.notify(`Switched to ${currentSet.name} emoji set`);
}

// --- Main Message Handler ---
figma.ui.onmessage = async (msg) => {
  const selectedLayers = figma.currentPage.selection;

  try {
    switch (msg.type) {
      case 'ui-ready':
        await loadNavigationHistory(); // Load history on startup
        await loadCurrentAnchor(); // Load current anchor state on startup
        await loadRecentHistory(); // Load recent history state on startup
        await validateCurrentAnchor(); // Validate current anchor on startup
        await validateRecentHistory(); // Validate recent history on startup
        await autoValidateBookmarks(); // Auto-validate bookmarks on startup
        await sendBookmarksToUI();
        sendSelectionStateToUI();
        sendNavigationStateToUI(); // Send navigation state to UI
        // Enforce fixed UI size to avoid host dialog drift when DevTools toggles
        figma.ui.resize(188, 352);
        
        // Additional size enforcement after a short delay to ensure proper initialization
        setTimeout(() => {
          figma.ui.resize(188, 352);
        }, 100);
        break;

      case 'save-bookmark':
        await handleSaveBookmark(selectedLayers);
        break;

      case 'remove-bookmark':
        await handleRemoveBookmark(msg.id);
        break;

      case 'jump-to-bookmark':
        await handleJumpToBookmark(msg.id);
        break;

      case 'add-emoji':
        await handleAddEmoji(selectedLayers, msg.emoji);
        break;

      case 'clear-emoji':
        await handleClearEmoji(selectedLayers);
        break;

      case 'add-date-smart':
      case 'add-date-title':
        await handleAddDateTitle();
        break;

      case 'create-new-page':
        await handleCreateNewPage();
        break;

      case 'collapse-layers':
        await handleCollapseLayers(selectedLayers);
        break;


      case 'deselect':
        handleDeselect();
        break;

      case 'navigate-emoji-set':
        await handleNavigateEmojiSet(msg.direction);
        break;

      case 'check-subscription-status':
        // await premiumFeatures.refreshSubscriptionStatus();
        break;

      case 'activate-license':
        // await premiumFeatures.activateLicense(msg.licenseKey);
        break;

      case 'open-upgrade-url':
        // const upgradeUrl = premiumFeatures.getUpgradeUrl();
        figma.notify('Upgrade features temporarily disabled');
        // Note: Figma plugins can't directly open URLs, user needs to copy/paste
        figma.ui.postMessage({
          type: 'show-upgrade-url',
          url: 'https://example.com'
        });
        break;

      case 'select-pricing-tier':
        // const checkoutUrl = pricingManager.generateCheckoutUrl(msg.variantId, figma.currentUser?.id || undefined);
        figma.ui.postMessage({
          type: 'show-upgrade-url',
          url: 'https://example.com'
        });
        break;





      case 'close-plugin':
        figma.closePlugin();
        break;

      case 'go-back':
        await handleGoBack();
        break;

      case 'go-forward':
        await handleGoForward();
        break;

      case 'ensure-size':
        // Keep plugin width constant at 188px
        figma.ui.resize(188, 352);
        break;

      case 'resize-ui': {
        const width = typeof msg.width === 'number' ? msg.width : 188;
        const height = typeof msg.height === 'number' ? msg.height : 352;
        // Constrain width to our fixed width; adjust height within safe bounds
        const clampedWidth = 188;
        const clampedHeight = Math.max(200, Math.min(720, height));
        figma.ui.resize(clampedWidth, clampedHeight);
        break;
      }

      case 'cancel':
        figma.closePlugin();
        break;

      default:
        console.warn('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.notify('An error occurred. Please try again.');
  }
};