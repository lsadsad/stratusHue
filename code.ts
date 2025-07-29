// StrateHue: A Figma plugin for layer tagging and navigation.

const EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'];

// --- Bookmark Type Definition ---
interface Bookmark {
  id: string; // node id
  name: string;
  pageName: string; // page name where the anchor is located
}

// Type for legacy bookmarks that might not have pageName
interface LegacyBookmark {
  id: string;
  name: string;
  pageName?: string;
}

// --- Helper functions for file-specific bookmark storage ---

// Helper to find the containing page for any node
function getContainingPage(node: BaseNode): PageNode | null {
  let currentNode = node;
  while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
    currentNode = currentNode.parent;
  }
  return currentNode.parent?.type === 'PAGE' ? currentNode.parent : null;
}

// Helper to get page name for a node
function getPageName(node: BaseNode): string {
  const page = getContainingPage(node);
  return page?.name || 'Unknown Page';
}

// Helper to update bookmarks for a specific page
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
      // Skip if node doesn't exist
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
  
  // Check if migration is needed
  const migrationVersion = figma.root.getPluginData('migrationVersion') || '0';
  if (migrationVersion === '1') {
    return bookmarks as Bookmark[];
  }
  
  // Migrate old bookmarks that don't have pageName
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
  
  // Save migrated bookmarks and mark migration as complete
  await setBookmarks(migratedBookmarks);
  figma.root.setPluginData('migrationVersion', '1');
  
  return migratedBookmarks;
}

async function setBookmarks(bookmarks: Bookmark[]) {
  figma.root.setPluginData('bookmarks', JSON.stringify(bookmarks));
}

// --- Helper to send bookmarks to the UI ---

async function sendBookmarksToUI() {
  const bookmarks = await getBookmarks();
  figma.ui.postMessage({ type: 'bookmarks', bookmarks });
}

// --- Helper to update and persist bookmarks ---

async function updateAndSaveBookmarks(bookmarks: Bookmark[]) {
  await setBookmarks(bookmarks);
  await sendBookmarksToUI();
}

// --- Helper to remove emoji prefix from layer name ---

function removeEmojiPrefix(name: string): string {
  for (const emoji of EMOJI_LIST) {
    if (name.startsWith(emoji + ' ')) {
      return name.substring((emoji + ' ').length);
    }
  }
  return name;
}

// --- Helper to replace any color emoji in a string with a new one ---

function replaceColorEmoji(name: string, newEmoji: string): string {
  // Find any existing color emoji in the string
  for (const emoji of EMOJI_LIST) {
    if (name.includes(emoji)) {
      // Replace the existing emoji with the new one, keeping it in the same position
      return name.replace(emoji, newEmoji);
    }
  }
  
  // If no color emoji found, add the new emoji at the beginning
  return newEmoji + ' ' + name;
}

// --- Helper to update bookmark name if it exists ---

async function updateBookmarkIfExists(layerId: string, newName: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  const bookmark = bookmarks.find(b => b.id === layerId);
  
  if (bookmark && bookmark.name !== newName) {
    bookmark.name = newName;
    // Also update page name if the node still exists
    try {
      const node = await figma.getNodeByIdAsync(layerId);
      if (node && 'parent' in node) {
        bookmark.pageName = getPageName(node);
      }
    } catch (error) {
      // If we can't get the node, keep the existing page name
      console.log('Failed to update bookmark page name:', layerId, error);
    }
    await updateAndSaveBookmarks(bookmarks);
    return true;
  }
  return false;
}

// --- Helper to clean up invalid bookmarks ---

async function cleanupBookmark(bookmarkId: string) {
  const bookmarks = await getBookmarks();
  const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
  await updateAndSaveBookmarks(newBookmarks);
}

// --- Helper to navigate to a node ---

async function navigateToNode(node: BaseNode & { name: string }) {
  // Find containing page
  const targetPage = getContainingPage(node);

  if (targetPage) {
    // Switch to correct page if needed
    if (figma.currentPage !== targetPage) {
      await figma.setCurrentPageAsync(targetPage);
    }
    
    // Navigate to node
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
figma.showUI(__html__, { width: 192, height: 352 });

// --- Message Handlers ---

async function handleSaveBookmark(selectedLayers: readonly SceneNode[]) {
  if (selectedLayers.length === 0) {
    figma.notify('Please select a layer to bookmark.');
    return;
  }

  const node = selectedLayers[0];
  const bookmarks = await getBookmarks();
  const existingBookmarkIndex = bookmarks.findIndex(b => b.id === node.id);
  
  // Get the page name
  const pageName = getPageName(node);
  
  if (existingBookmarkIndex !== -1) {
    // Update existing bookmark name if it has changed
    if (bookmarks[existingBookmarkIndex].name !== node.name) {
      bookmarks[existingBookmarkIndex].name = node.name;
      bookmarks[existingBookmarkIndex].pageName = pageName;
      await updateAndSaveBookmarks(bookmarks);
      figma.notify('Bookmark name updated!');
    } else {
      figma.notify('Layer already bookmarked.');
    }
  } else {
    // Create new bookmark
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
    
    // Update bookmark name if it has changed
    await updateBookmarkIfExists(bookmarkId, node.name);
    
    // Navigate to the node
    await navigateToNode(node);
  } catch (error) {
    figma.notify('Error accessing bookmark. Cleaning up...');
    await cleanupBookmark(bookmarkId);
  }
}

// --- Helper to add emoji to selected layers or current page ---

async function updateLayerEmojis(layers: readonly SceneNode[], emoji: string): Promise<boolean> {
  let bookmarkUpdates = false;
  
  for (const layer of layers) {
    const cleanName = removeEmojiPrefix(layer.name);
    const newName = emoji + ' ' + cleanName;
    layer.name = newName;
    
    // Update bookmark if it exists
    if (await updateBookmarkIfExists(layer.id, newName)) {
      bookmarkUpdates = true;
    }
  }
  
  return bookmarkUpdates;
}

async function updatePageEmoji(page: PageNode, emoji: string): Promise<boolean> {
  const newName = replaceColorEmoji(page.name, emoji);
  page.name = newName;
  
  // Update all bookmarks on this page to reflect the new page name
  return await updateBookmarksForPage(page.id, newName);
}

async function handleAddEmoji(selectedLayers: readonly SceneNode[], emoji: string) {
  // Check if any layers are selected
  if (selectedLayers.length > 0) {
    // Apply emoji to selected layers
    const bookmarkUpdates = await updateLayerEmojis(selectedLayers, emoji);
    
    const messages = ['Layer emoji updated!'];
    if (bookmarkUpdates) {
      messages.push('Bookmarks updated.');
    }
    
    figma.notify(messages.join(' '));
  } else {
    // No layers selected, apply emoji to current page
    const bookmarkUpdates = await updatePageEmoji(figma.currentPage, emoji);
    
    figma.notify(`Page emoji updated! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
  }
}

async function clearLayerEmojis(layers: readonly SceneNode[]): Promise<{ emojiCleared: boolean; bookmarkUpdates: boolean }> {
  let anEmojiWasCleared = false;
  let bookmarkUpdates = false;
  
  for (const layer of layers) {
    const originalName = layer.name;
    const cleanName = removeEmojiPrefix(originalName);
    
    if (cleanName !== originalName) {
      anEmojiWasCleared = true;
      layer.name = cleanName;
      
      // Update bookmark if it exists
      if (await updateBookmarkIfExists(layer.id, cleanName)) {
        bookmarkUpdates = true;
      }
    }
  }
  
  return { emojiCleared: anEmojiWasCleared, bookmarkUpdates };
}

async function clearPageEmoji(page: PageNode): Promise<{ emojiCleared: boolean; bookmarkUpdates: boolean }> {
  const originalName = page.name;
  const cleanName = removeEmojiPrefix(originalName);
  
  if (cleanName !== originalName) {
    page.name = cleanName;
    
    // Update all bookmarks on this page to reflect the new page name
    const bookmarkUpdates = await updateBookmarksForPage(page.id, cleanName);
    return { emojiCleared: true, bookmarkUpdates };
  }
  
  return { emojiCleared: false, bookmarkUpdates: false };
}

async function handleClearEmoji(selectedLayers: readonly SceneNode[]) {
  // Check if any layers are selected
  if (selectedLayers.length > 0) {
    // Clear emoji from selected layers
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
    // No layers selected, clear emoji from current page
    const { emojiCleared, bookmarkUpdates } = await clearPageEmoji(figma.currentPage);
    
    if (emojiCleared) {
      figma.notify(`Page emoji cleared! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
    } else {
      figma.notify('No matching emoji to clear from page title.');
    }
  }
}



// --- Main Message Handler ---
figma.ui.onmessage = async (msg) => {
  const selectedLayers = figma.currentPage.selection;

  try {
    switch (msg.type) {
      case 'ui-ready':
        await sendBookmarksToUI();
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