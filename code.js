"use strict";
// This plugin allows the user to add a colored emoji to the beginning of a layer's name.
// Show the HTML page in "ui.html". This now allows the window to be resized.
figma.showUI(__html__);
// Handle messages from the HTML page.
figma.ui.onmessage = (msg) => {
    if (msg.type === 'add-emoji') {
        const selectedLayers = figma.currentPage.selection;
        if (selectedLayers.length === 0) {
            figma.notify('Please select at least one layer.');
        }
        else {
            for (const layer of selectedLayers) {
                // Prepend the emoji to the layer name.
                layer.name = msg.emoji + ' ' + layer.name;
            }
            // Notify the user that the emoji was added.
            figma.notify('Emoji added!');
        }
    }
    if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
