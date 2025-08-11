// Stratus_Hue: A Figma plugin for layer tagging and navigation.

const LAYER_EMOJI_LIST = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜']; // Square emojis for layers
const PAGE_EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️']; // Circle emojis for pages

// --- Bookmark Type Definition ---
interface Bookmark {
  id: string; // node id
  name: string;
  pageName: string; // page name where the anchor is located
}
interface LegacyBookmark { id: string; name: string; pageName?: string; }

// Undo support removed

// --- Helper functions for file-specific bookmark storage ---
let bookmarksCache: Bookmark[] | null = null;
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
  figma.ui.postMessage({ type: 'bookmarks', bookmarks }); 
}

function sendSelectionStateToUI() { 
  const selectedLayers = figma.currentPage.selection; 
  const hasLayerSelected = selectedLayers.length > 0; 
  figma.ui.postMessage({ 
    type: 'selection-state', 
    hasLayerSelected, 
    layerEmojis: LAYER_EMOJI_LIST, 
    pageEmojis: PAGE_EMOJI_LIST 
  }); 
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
  normalized = normalized.replace(/^(\s*↳\s*[🔴🟠🟡🟢🔵🟣⚫⚪])\s+/, '$1 ');
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

  // Extract emoji explicitly from our page list anywhere before colon
  const emojiMatch = beforeColon.match(/[🔴🟠🟡🟢🔵🟣⚫⚪]/);
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
  for (const emoji of [...LAYER_EMOJI_LIST, ...PAGE_EMOJI_LIST]) { 
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
  for (const emoji of [...LAYER_EMOJI_LIST, ...PAGE_EMOJI_LIST]) { 
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

// --- Navigation & Cleanup Helpers ---
async function cleanupBookmark(bookmarkId: string) { 
  const bookmarks = await getBookmarks(); 
  const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId); 
  await updateAndSaveBookmarks(newBookmarks); 
}

async function navigateToNode(node: BaseNode & { name: string }) { 
  const targetPage = getContainingPage(node); 
  if (targetPage) { 
    if (figma.currentPage !== targetPage) { 
      await figma.setCurrentPageAsync(targetPage); 
    } 
    if ('visible' in node && node.visible) { 
      figma.currentPage.selection = [node as SceneNode]; 
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]); 
      figma.notify(`Jumped to: ${node.name} (Page: ${targetPage.name})`); 
    } 
  } else { 
    figma.notify('Could not locate page for this bookmark.'); 
  } 
}

// --- Plugin UI Setup ---
figma.showUI(__html__, { width: 184, height: 352 });

function debounce<T extends (...args: any[]) => unknown>(fn: T, wait = 100) {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => { fn(...args); }, wait) as unknown as number;
  };
}

const sendSelectionStateToUIDebounced = debounce(sendSelectionStateToUI, 100);
figma.on('selectionchange', () => { 
  sendSelectionStateToUIDebounced(); 
});
/**
 * Returns +1 if moving visually UP in the layer panel corresponds to a larger child index,
 * or -1 if the parent's z-index is reversed (e.g., Auto Layout with reverse stacking).
 */
function getPanelUpDeltaForParent(parent: BaseNode | null): number {
  if (parent && 'layoutMode' in parent) {
    const p: any = parent as any;
    // For Auto Layout frames/groups with reverse z-index, invert direction
    if (p.layoutMode && p.layoutMode !== 'NONE' && 'itemReverseZIndex' in p && p.itemReverseZIndex === true) {
      return -1;
    }
  }
  return 1;
}

// Refresh bookmarks by pulling latest names from the document
async function handleResyncBookmarks() {
  const bookmarks = await getBookmarks();
  if (bookmarks.length === 0) {
    figma.notify('No anchors to resync.');
    return;
  }

  let updatedCount = 0;
  for (const bookmark of bookmarks) {
    try {
      const node = await figma.getNodeByIdAsync(bookmark.id);
      if (node && 'name' in node) {
        const latestName = (node as BaseNode & { name: string }).name;
        const latestPageName = getPageName(node as BaseNode);
        if (bookmark.name !== latestName || bookmark.pageName !== latestPageName) {
          bookmark.name = latestName;
          bookmark.pageName = latestPageName;
          updatedCount++;
        }
      }
    } catch (_) {
      // Ignore missing nodes during resync
    }
  }

  if (updatedCount > 0) {
    await updateAndSaveBookmarks(bookmarks);
    figma.notify(`Resynced ${updatedCount} anchor(s).`);
  } else {
    figma.notify('Anchors already up to date.');
  }
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
  try { 
    const node = await figma.getNodeByIdAsync(bookmarkId); 
    if (!node || !('parent' in node)) { 
      figma.notify('Bookmark no longer exists. Cleaning up...'); 
      await cleanupBookmark(bookmarkId); 
      return; 
    } 
    await updateBookmarkIfExists(bookmarkId, node.name); 
    await navigateToNode(node); 
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

// --- Main Message Handler ---
figma.ui.onmessage = async (msg) => {
  const selectedLayers = figma.currentPage.selection;
  
  try {
    switch (msg.type) {
      case 'ui-ready':
        await sendBookmarksToUI();
        sendSelectionStateToUI();
        // Enforce fixed UI size to avoid host dialog drift when DevTools toggles
        figma.ui.resize(184, 352);
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

      // Layer navigation controls from UI
      case 'nav-up': {
        if (selectedLayers.length === 0) {
          // Page-level navigation: move visually UP to the previous page (smaller index)
          const pages = figma.root.children as readonly PageNode[];
          const index = pages.indexOf(figma.currentPage);
          if (index > 0) {
            const prevPage = pages[index - 1];
            await figma.setCurrentPageAsync(prevPage);
            sendSelectionStateToUI();
            figma.notify(`Page: ${prevPage.name}`);
          } else {
            figma.notify('Already at first page.');
          }
          break;
        }
        const node = selectedLayers[0];
        const parent = 'parent' in node ? node.parent : null;
        if (parent && 'children' in parent) {
          const siblings = parent.children as readonly SceneNode[];
          const index = siblings.indexOf(node as SceneNode);
          const delta = getPanelUpDeltaForParent(parent as BaseNode);
          const nextIndex = Math.max(0, Math.min(siblings.length - 1, index + delta));
          let candidate = siblings[nextIndex] as SceneNode | undefined;
          // Skip entering into groups/frames automatically; select the group itself
          if (candidate) {
            figma.currentPage.selection = [candidate];
            // Keep folders collapsed while navigating
            if ('expanded' in candidate) {
              (candidate as any).expanded = false;
            }
            figma.viewport.scrollAndZoomIntoView([candidate]);
          }
        }
        break;
      }
      case 'nav-down': {
        if (selectedLayers.length === 0) {
          // Page-level navigation: move visually DOWN to the next page (larger index)
          const pages = figma.root.children as readonly PageNode[];
          const index = pages.indexOf(figma.currentPage);
          if (index < pages.length - 1) {
            const nextPage = pages[index + 1];
            await figma.setCurrentPageAsync(nextPage);
            sendSelectionStateToUI();
            figma.notify(`Page: ${nextPage.name}`);
          } else {
            figma.notify('Already at last page.');
          }
          break;
        }
        const node = selectedLayers[0];
        const parent = 'parent' in node ? node.parent : null;
        if (parent && 'children' in parent) {
          const siblings = parent.children as readonly SceneNode[];
          const index = siblings.indexOf(node as SceneNode);
          const delta = getPanelUpDeltaForParent(parent as BaseNode);
          const nextIndex = Math.max(0, Math.min(siblings.length - 1, index - delta));
          let candidate = siblings[nextIndex] as SceneNode | undefined;
          if (candidate) {
            figma.currentPage.selection = [candidate];
            if ('expanded' in candidate) {
              (candidate as any).expanded = false;
            }
            figma.viewport.scrollAndZoomIntoView([candidate]);
          }
        }
        break;
      }
      case 'nav-enter': {
        if (selectedLayers.length === 0) {
          figma.notify('Select a frame or group to enter.');
          break;
        }
        // First press: if a single container is selected, select its children without expanding
        if (selectedLayers.length === 1) {
          const sel = selectedLayers[0];
          if ('children' in sel && (sel as any).children.length > 0) {
            const children = (sel as any).children as readonly SceneNode[];
            figma.currentPage.selection = [...children];
            figma.viewport.scrollAndZoomIntoView(children);
            break;
          }
        }

        // Second press (or multi-select): expand selected containers and select their children
        const nextSelection: SceneNode[] = [];
        for (const sel of selectedLayers) {
          if ('children' in sel && (sel as any).children.length > 0) {
            if ('expanded' in sel) {
              (sel as any).expanded = true;
            }
            for (const child of (sel as any).children as readonly SceneNode[]) {
              nextSelection.push(child);
            }
          }
        }
        if (nextSelection.length > 0) {
          figma.currentPage.selection = nextSelection;
          figma.viewport.scrollAndZoomIntoView(nextSelection);
        } else {
          figma.notify('No children to enter.');
        }
        break;
      }
      case 'nav-exit': {
        if (selectedLayers.length === 0) {
          figma.notify('Select a layer to exit its parent.');
          break;
        }
        const node = selectedLayers[0];
        const parent = 'parent' in node ? node.parent : null;
        if (parent && parent.type !== 'PAGE' && 'parent' in parent && parent.parent) {
          figma.currentPage.selection = [parent as unknown as SceneNode];
          figma.viewport.scrollAndZoomIntoView([parent as unknown as SceneNode]);
        } else {
          figma.notify('Already at top level.');
        }
        break;
      }
      case 'deselect':
        handleDeselect();
        break;

      case 'add-props':
        figma.notify('Add Props: coming soon.');
        break;

      case 'resync-bookmarks':
        await handleResyncBookmarks();
        break;
      
      case 'ensure-size':
        // Keep plugin width constant at 184px
        figma.ui.resize(184, 352);
        break;
        
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