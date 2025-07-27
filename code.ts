// StrateHue: A Figma plugin for layer tagging and navigation.

const EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'];

// --- Bookmark Type Definition ---
interface Bookmark {
  id: string; // node id
  name: string;
}

// --- Helper functions for file-specific bookmark storage ---

async function getBookmarks(): Promise<Bookmark[]> {
  const data = figma.root.getPluginData('bookmarks');
  return data ? JSON.parse(data) : [];
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

// --- Helper to update bookmark name if it exists ---

async function updateBookmarkIfExists(layerId: string, newName: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  const bookmark = bookmarks.find(b => b.id === layerId);
  
  if (bookmark && bookmark.name !== newName) {
    bookmark.name = newName;
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
  let currentNode = node;
  while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
    currentNode = currentNode.parent;
  }

  if (currentNode.parent?.type === 'PAGE') {
    const targetPage = currentNode.parent;
    
    // Switch to correct page if needed
    if (figma.currentPage !== targetPage) {
      await figma.setCurrentPageAsync(targetPage);
    }
    
    // Navigate to node
    if ('visible' in node && node.visible) {
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      figma.notify('Jumped to: ' + node.name);
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
  
  if (existingBookmarkIndex !== -1) {
    // Update existing bookmark name if it has changed
    if (bookmarks[existingBookmarkIndex].name !== node.name) {
      bookmarks[existingBookmarkIndex].name = node.name;
      await updateAndSaveBookmarks(bookmarks);
      figma.notify('Bookmark name updated!');
    } else {
      figma.notify('Layer already bookmarked.');
    }
  } else {
    // Create new bookmark
    bookmarks.push({ id: node.id, name: node.name });
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

async function handleAddEmoji(selectedLayers: readonly SceneNode[], emoji: string) {
  if (selectedLayers.length === 0) {
    figma.notify('Please select at least one layer.');
    return;
  }
  
  let bookmarkUpdates = false;
  
  for (const layer of selectedLayers) {
    const cleanName = removeEmojiPrefix(layer.name);
    const newName = emoji + ' ' + cleanName;
    layer.name = newName;
    
    // Update bookmark if it exists
    if (await updateBookmarkIfExists(layer.id, newName)) {
      bookmarkUpdates = true;
    }
  }
  
  const messages = ['Emoji updated!'];
  if (bookmarkUpdates) {
    messages.push('Bookmarks updated.');
  }
  
  figma.notify(messages.join(' '));
}

async function handleClearEmoji(selectedLayers: readonly SceneNode[]) {
  if (selectedLayers.length === 0) {
    figma.notify('Please select at least one layer.');
    return;
  }
  
  let anEmojiWasCleared = false;
  let bookmarkUpdates = false;
  
  for (const layer of selectedLayers) {
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
  
  if (anEmojiWasCleared) {
    const messages = ['Emoji cleared!'];
    if (bookmarkUpdates) {
      messages.push('Bookmarks updated.');
    }
    figma.notify(messages.join(' '));
  } else {
    figma.notify('No matching emoji to clear.');
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