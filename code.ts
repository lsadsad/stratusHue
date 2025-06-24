// This plugin allows the user to add, replace, or clear a colored emoji at the beginning of a layer's name.

// This list should be kept in sync with the emojis in ui.html
const EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'];

// Show the HTML page in "ui.html", setting an initial size.
// The Figma plugin window is resizable by the user from this initial size.
figma.showUI(__html__, { width: 240, height: 400 });

// Handle messages from the HTML page.
figma.ui.onmessage = (msg: { type: string, emoji?: string }) => {
  const selectedLayers = figma.currentPage.selection;

  // Handle adding/replacing an emoji
  if (msg.type === 'add-emoji') {
    if (selectedLayers.length === 0) {
      figma.notify('Please select at least one layer.');
      return;
    }
    for (const layer of selectedLayers) {
      const currentName = layer.name;
      let oldEmojiFound = false;
      for (const oldEmoji of EMOJI_LIST) {
        if (currentName.startsWith(oldEmoji)) {
          const restOfName = currentName.substring(oldEmoji.length).trimStart();
          layer.name = msg.emoji + ' ' + restOfName;
          oldEmojiFound = true;
          break;
        }
      }
      if (!oldEmojiFound) {
        layer.name = msg.emoji + ' ' + currentName;
      }
    }
    figma.notify('Emoji updated!');
  }

  // Handle clearing an emoji
  else if (msg.type === 'clear-emoji') {
    let anEmojiWasCleared = false;
    if (selectedLayers.length === 0) {
      figma.notify('Please select at least one layer.');
      return;
    }
    for (const layer of selectedLayers) {
      const currentName = layer.name;
      for (const emoji of EMOJI_LIST) {
        if (currentName.startsWith(emoji)) {
          layer.name = currentName.substring(emoji.length).trimStart();
          anEmojiWasCleared = true;
          break;
        }
      }
    }
    if (anEmojiWasCleared) {
      figma.notify('Emoji cleared!');
    } else {
      figma.notify('No matching emoji to clear.');
    }
  }

  // Handle closing the plugin
  else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};