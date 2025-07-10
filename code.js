"use strict";
// This plugin allows the user to add, replace, or clear a colored emoji at the beginning of a layer's name.
const EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'];
// Show the HTML page in "ui.html", setting an initial size.
// The Figma plugin window is resizable by the user from this initial size.
figma.showUI(__html__, { width: 200, height: 200 });
// Handle messages from the HTML page.
figma.ui.onmessage = (msg) => {
    const selectedLayers = figma.currentPage.selection;
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
                    const restOfName = currentName.substring(oldEmoji.length).replace(/^\s+/, '');
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
                    layer.name = currentName.substring(emoji.length).replace(/^\s+/, '');
                    anEmojiWasCleared = true;
                    break;
                }
            }
        }
        if (anEmojiWasCleared) {
            figma.notify('Emoji cleared!');
        }
        else {
            figma.notify('No matching emoji to clear.');
        }
    }
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
};
