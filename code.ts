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

// --- Plugin UI Setup ---
figma.showUI(__html__, { width: 260, height: 420 });

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
    if (bookmarks.some(b => b.id === node.id)) {
      figma.notify('Layer already bookmarked.');
      return;
    }
    const fileKey = figma.fileKey;
    bookmarks.push({ id: node.id, name: node.name });
    await setBookmarks(bookmarks);
    await sendBookmarksToUI();
    figma.notify('Bookmark saved!');
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
    for (const layer of selectedLayers) {
      let name = layer.name;
      for (const oldEmoji of EMOJI_LIST) {
        if (name.startsWith(oldEmoji + ' ')) {
          name = name.substring((oldEmoji + ' ').length);
          break;
        }
      }
      layer.name = msg.emoji + ' ' + name;
    }
    figma.notify('Emoji updated!');
  }
  
  else if (msg.type === 'clear-emoji') {
    let anEmojiWasCleared = false;
    if (selectedLayers.length === 0) {
      figma.notify('Please select at least one layer.');
      return;
    }
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
      }
      layer.name = name;
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