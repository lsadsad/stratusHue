// StrateHue: A Figma plugin for layer tagging and navigation.

const LAYER_EMOJI_LIST = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜']; // Square emojis for layers
const PAGE_EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️']; // Circle emojis for pages

// --- Bookmark Type Definition ---
interface Bookmark {
  id: string; // node id
  name: string;
  pageName: string; // page name where the anchor is located
}
interface LegacyBookmark { id: string; name: string; pageName?: string; }

// --- Helper functions for file-specific bookmark storage ---
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
  const data = figma.root.getPluginData('bookmarks'); 
  const bookmarks = data ? JSON.parse(data) : []; 
  const migrationVersion = figma.root.getPluginData('migrationVersion') || '0'; 
  if (migrationVersion === '1') { 
    return bookmarks as Bookmark[]; 
  } 
  const migratedBookmarks = await Promise.all(bookmarks.map(async (bookmark: LegacyBookmark) => { 
    if (!bookmark.pageName) { 
      try { 
        const node = await figma.getNodeByIdAsync(bookmark.id); 
        if (node && 'parent' in node) { 
          bookmark.pageName = getPageName(node); 
        } else { 
          bookmark.pageName = 'Unknown Page'; 
        } 
      } catch (error) { 
        bookmark.pageName = 'Unknown Page'; 
        console.log('Failed to migrate bookmark:', bookmark.id, error); 
      } 
    } 
    return bookmark as Bookmark; 
  })); 
  await setBookmarks(migratedBookmarks); 
  figma.root.setPluginData('migrationVersion', '1'); 
  return migratedBookmarks; 
}

async function setBookmarks(bookmarks: Bookmark[]) { 
  figma.root.setPluginData('bookmarks', JSON.stringify(bookmarks)); 
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
function removeEmojiPrefix(name: string): string { 
  for (const emoji of [...LAYER_EMOJI_LIST, ...PAGE_EMOJI_LIST]) { 
    if (name.includes(emoji)) { 
      return name.replace(emoji, '').trim(); 
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
figma.showUI(__html__, { width: 240, height: 352 });
figma.on('selectionchange', () => { 
  sendSelectionStateToUI(); 
});

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
  let bookmarkUpdates = false; 
  for (const layer of layers) { 
    const cleanName = removeEmojiPrefix(layer.name); 
    const newName = emoji + ' ' + cleanName; 
    layer.name = newName; 
    if (await updateBookmarkIfExists(layer.id, newName)) { 
      bookmarkUpdates = true; 
    } 
  } 
  return bookmarkUpdates; 
}

async function updatePageEmoji(page: PageNode, emoji: string): Promise<boolean> { 
  // Check if the page name already has the arrow structure
  if (page.name.includes('↳')) {
    // If it has the arrow structure, find and replace any existing emoji
    let newName = page.name;
    let emojiFound = false;
    for (const existingEmoji of PAGE_EMOJI_LIST) {
      if (page.name.includes(existingEmoji)) {
        newName = page.name.replace(existingEmoji, emoji);
        emojiFound = true;
        break;
      }
    }
    
    // If no emoji was found, add the emoji after the arrow
    if (!emojiFound) {
      newName = page.name.replace('↳', `↳ ${emoji}`);
    }
    page.name = newName;
  } else {
    // If no arrow structure, add the default structure with the emoji
    const dateString = getCurrentDateString();
    page.name = `↳ ${emoji} ${dateString} : ${page.name}`;
  }
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
  
  for (const layer of layers) {
    const cleanName = removeEmojiPrefix(layer.name);
    if (cleanName !== layer.name) {
      layer.name = cleanName;
      emojiCleared = true;
      if (await updateBookmarkIfExists(layer.id, cleanName)) {
        bookmarkUpdates = true;
      }
    }
  }
  
  return { emojiCleared, bookmarkUpdates };
}

async function clearPageEmoji(page: PageNode): Promise<{ emojiCleared: boolean; bookmarkUpdates: boolean }> {
  let emojiCleared = false;
  let bookmarkUpdates = false;
  
  // Check if the page name has the arrow structure with emoji
  if (page.name.includes('↳')) {
    let newName = page.name;
    for (const emoji of PAGE_EMOJI_LIST) {
      if (page.name.includes(emoji)) {
        // Remove the emoji but keep the arrow structure
        newName = page.name.replace(emoji, '').trim();
        // Clean up any double spaces
        newName = newName.replace(/\s+/g, ' ');
        page.name = newName;
        emojiCleared = true;
        bookmarkUpdates = await updateBookmarksForPage(page.id, newName);
        break;
      }
    }
  }
  
  return { emojiCleared, bookmarkUpdates };
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
 * Creates a new page or prepends a title to selected layers based on context.
 */
async function handleAddDateTitle() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${month}.${day}`;
  const selectedLayers = figma.currentPage.selection;
  
  if (selectedLayers.length > 0) {
    // If layers are selected, prepend the title to their names
    let layersUpdated = 0;
    for (const layer of selectedLayers) {
      // Check if layer already has the current date pattern anywhere in the name
      const hasDatePattern = layer.name.includes(`${dateString} :`);
      if (!hasDatePattern) {
        layer.name = `${LAYER_EMOJI_LIST[2]} ${dateString} : ${layer.name}`;
        layersUpdated++;
      }
    }
    if (layersUpdated > 0) {
      figma.notify(`Date prefix added to ${layersUpdated} layer(s)!`);
    } else {
      figma.notify('All selected layers already have date prefixes.');
    }
  } else {
    // If no layers are selected, create a new page
    const newPage = figma.createPage();
    newPage.name = `↳ ${PAGE_EMOJI_LIST[2]} ${dateString} : New Page`;
    await figma.setCurrentPageAsync(newPage);
    figma.notify('New page created with date title!');
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
 * Collapses layers in the layer panel.
 */
async function handleCollapseLayers(selectedLayers: readonly SceneNode[]) {
  let layersToCollapse: SceneNode[] = [];
  
  if (selectedLayers.length === 0) {
    // If no layers selected, collapse all collapsible layers (like Alt+L)
    // Use optimized recursive function with depth limit
    layersToCollapse = getAllCollapsibleLayers(figma.currentPage, 3);
  } else {
    // If layers are selected, collapse only those layers
    layersToCollapse = selectedLayers.filter(node => 
      'expanded' in node
    ) as SceneNode[];
  }
  
  let collapsedCount = 0;
  for (const layer of layersToCollapse) {
    if ('expanded' in layer) {
      layer.expanded = false;
      collapsedCount++;
    }
  }
  
  if (collapsedCount > 0) {
    const action = selectedLayers.length === 0 ? 'all' : 'selected';
    figma.notify(`${collapsedCount} ${action} layer(s) collapsed!`);
  } else {
    const action = selectedLayers.length === 0 ? 'collapsible layers on this page' : 'collapsible layers selected';
    figma.notify(`No ${action}.`);
  }
}

// --- Main Message Handler ---
figma.ui.onmessage = async (msg) => {
  const selectedLayers = figma.currentPage.selection;
  
  try {
    switch (msg.type) {
      case 'ui-ready':
        await sendBookmarksToUI();
        sendSelectionStateToUI();
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