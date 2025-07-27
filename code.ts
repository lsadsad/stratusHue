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

// --- Helper to update bookmark names when they change ---

async function updateBookmarkNames() {
  const bookmarks = await getBookmarks();
  let hasChanges = false;
  
  for (const bookmark of bookmarks) {
    try {
      const node = await figma.getNodeByIdAsync(bookmark.id);
      if (node && 'name' in node && node.name !== bookmark.name) {
        bookmark.name = node.name;
        hasChanges = true;
      }
    } catch (error) {
      // Node no longer exists, will be cleaned up later
    }
  }
  
  if (hasChanges) {
    await setBookmarks(bookmarks);
    await sendBookmarksToUI();
  }
}

// --- Plugin UI Setup ---
figma.showUI(__html__, { width: 192, height: 352 });

// --- Main Message Handler ---
figma.ui.onmessage = async (msg) => {
  const selectedLayers = figma.currentPage.selection;

  // --- Initial UI Load ---
  if (msg.type === 'ui-ready') {
    await sendBookmarksToUI();
  }

  // --- Bookmark Logic ---
  else if (msg.type === 'save-bookmark') {
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
        await setBookmarks(bookmarks);
        await sendBookmarksToUI();
        figma.notify('Bookmark name updated!');
      } else {
        figma.notify('Layer already bookmarked.');
      }
    } else {
      // Create new bookmark
      bookmarks.push({ id: node.id, name: node.name });
      await setBookmarks(bookmarks);
      await sendBookmarksToUI();
      figma.notify('Bookmark saved!');
    }
  }

  else if (msg.type === 'remove-bookmark') {
    const bookmarks = await getBookmarks();
    const newBookmarks = bookmarks.filter(b => b.id !== msg.id);
    await setBookmarks(newBookmarks);
    await sendBookmarksToUI();
    figma.notify('Bookmark removed.');
  }

  else if (msg.type === 'jump-to-bookmark') {
    const node = await figma.getNodeByIdAsync(msg.id);
    if (!node || !('parent' in node)) {
      figma.notify('Bookmark no longer exists. Cleaning up...');
      // Clean up broken bookmark
      const bookmarks = await getBookmarks();
      const newBookmarks = bookmarks.filter(b => b.id !== msg.id);
      await setBookmarks(newBookmarks);
      await sendBookmarksToUI();
      return;
    }
    
    // Update bookmark name if it has changed
    const bookmarks = await getBookmarks();
    const bookmark = bookmarks.find(b => b.id === msg.id);
    if (bookmark && bookmark.name !== node.name) {
      bookmark.name = node.name;
      await setBookmarks(bookmarks);
      await sendBookmarksToUI();
    }
    
    // Find containing page
    let currentNode = node;
    while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
      currentNode = currentNode.parent;
    }
    if (currentNode.parent?.type === 'PAGE') {
      const targetPage = currentNode.parent;
      if (figma.currentPage === targetPage) {
        // Already on the correct page, no delay needed
        if ('visible' in node && node.visible) {
          figma.currentPage.selection = [node as SceneNode];
          figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
          figma.notify('Jumped to: ' + node.name);
        }
      } else {
        // Switch to correct page asynchronously
        await figma.setCurrentPageAsync(targetPage);
        // Small delay to ensure page switch completes
        setTimeout(() => {
          if ('visible' in node && node.visible) {
            figma.currentPage.selection = [node as SceneNode];
            figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
            figma.notify('Jumped to: ' + node.name);
          }
        }, 100);
      }
    } else {
      figma.notify('Could not locate page for this bookmark.');
    }
  }

  // --- Emoji Logic ---
  else if (msg.type === 'add-emoji') {
    if (selectedLayers.length === 0) {
      figma.notify('Please select at least one layer.');
      return;
    }
    
    // Get current bookmarks to check for updates
    const bookmarks = await getBookmarks();
    let bookmarkUpdates = false;
    
    for (const layer of selectedLayers) {
      let name = layer.name;
      for (const oldEmoji of EMOJI_LIST) {
        if (name.startsWith(oldEmoji + ' ')) {
          name = name.substring((oldEmoji + ' ').length);
          break;
        }
      }
      const newName = msg.emoji + ' ' + name;
      layer.name = newName;
      
      // Check if this layer is bookmarked and update it
      const bookmark = bookmarks.find(b => b.id === layer.id);
      if (bookmark && bookmark.name !== newName) {
        figma.notify('Bookmark updated.');
        bookmark.name = newName;
        bookmarkUpdates = true;
      }
    }
    
    // Save bookmark updates if any
    if (bookmarkUpdates) {
      await setBookmarks(bookmarks);
      await sendBookmarksToUI();
    }
    
    figma.notify('Emoji updated!');
  }
  
  else if (msg.type === 'clear-emoji') {
    let anEmojiWasCleared = false;
    if (selectedLayers.length === 0) {
      figma.notify('Please select at least one layer.');
      return;
    }
    
    // Get current bookmarks to check for updates
    const bookmarks = await getBookmarks();
    let bookmarkUpdates = false;
    
    for (const layer of selectedLayers) {
      let name = layer.name;
      let emojiCleared = false;
      for (const emoji of EMOJI_LIST) {
        if (name.startsWith(emoji + ' ')) {
          name = name.substring((emoji + ' ').length);
          emojiCleared = true;
          break;
        }
      }
      if (emojiCleared) {
        anEmojiWasCleared = true;
        layer.name = name;
        
        // Check if this layer is bookmarked and update it
        const bookmark = bookmarks.find(b => b.id === layer.id);
        if (bookmark && bookmark.name !== name) {
          figma.notify('Bookmark updated.');
          bookmark.name = name;
          bookmarkUpdates = true;
        }
      }
    }
    
    // Save bookmark updates if any
    if (bookmarkUpdates) {
      await setBookmarks(bookmarks);
      await sendBookmarksToUI();
    }
    
    if (anEmojiWasCleared) {
      figma.notify('Emoji cleared!');
    } else {
      figma.notify('No matching emoji to clear.');
    }
  }
  
  else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};