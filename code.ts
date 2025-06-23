// This plugin allows the user to add a colored emoji to the beginning of a layer's name.

// This file holds the main code for the plugin. It has access to the figma document.
// You can access browser APIs in the <script> tag inside "ui.html".

// Show the HTML page in "ui.html".
figma.showUI(__html__, { width: 240, height: 180 });

// Handle messages from the HTML page.
figma.ui.onmessage = (msg: { type: string, emoji: string }) => {
  if (msg.type === 'add-emoji') {
    const selectedLayers = figma.currentPage.selection;

    if (selectedLayers.length === 0) {
      figma.notify('Please select at least one layer.');
    } else {
      for (const layer of selectedLayers) {
        // Prepend the emoji to the layer name.
        layer.name = msg.emoji + ' ' + layer.name;
      }
    }
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
  
  // Close the plugin after adding the emoji.
  if (msg.type === 'add-emoji') {
    figma.closePlugin();
  }
};