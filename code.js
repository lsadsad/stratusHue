"use strict";
// StrateHue: A Figma plugin for layer tagging and navigation.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'];
// --- Helper functions for file-specific bookmark storage ---
function getBookmarks() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = figma.root.getPluginData('bookmarks');
        return data ? JSON.parse(data) : [];
    });
}
function setBookmarks(bookmarks) {
    return __awaiter(this, void 0, void 0, function* () {
        figma.root.setPluginData('bookmarks', JSON.stringify(bookmarks));
    });
}
// --- Helper to send bookmarks to the UI ---
function sendBookmarksToUI() {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        figma.ui.postMessage({ type: 'bookmarks', bookmarks });
    });
}
// --- Plugin UI Setup ---
figma.showUI(__html__, { width: 208, height: 336 });
// --- Main Message Handler ---
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const selectedLayers = figma.currentPage.selection;
    // --- Initial UI Load ---
    if (msg.type === 'ui-ready') {
        yield sendBookmarksToUI();
    }
    // --- Bookmark Logic ---
    else if (msg.type === 'save-bookmark') {
        if (selectedLayers.length === 0) {
            figma.notify('Please select a layer to bookmark.');
            return;
        }
        const node = selectedLayers[0];
        const bookmarks = yield getBookmarks();
        if (bookmarks.some(b => b.id === node.id)) {
            figma.notify('Layer already bookmarked.');
            return;
        }
        const fileKey = figma.fileKey;
        bookmarks.push({ id: node.id, name: node.name });
        yield setBookmarks(bookmarks);
        yield sendBookmarksToUI();
        figma.notify('Bookmark saved!');
    }
    else if (msg.type === 'remove-bookmark') {
        const bookmarks = yield getBookmarks();
        const newBookmarks = bookmarks.filter(b => b.id !== msg.id);
        yield setBookmarks(newBookmarks);
        yield sendBookmarksToUI();
        figma.notify('Bookmark removed.');
    }
    else if (msg.type === 'jump-to-bookmark') {
        const node = yield figma.getNodeByIdAsync(msg.id);
        if (!node || !('parent' in node)) {
            figma.notify('Layer not found. It may have been deleted.');
            // Clean up the broken bookmark
            const bookmarks = yield getBookmarks();
            const newBookmarks = bookmarks.filter(b => b.id !== msg.id);
            yield setBookmarks(newBookmarks);
            yield sendBookmarksToUI();
            return;
        }
        // Find the page containing the node by traversing up the tree
        let parent = node.parent;
        while (parent && parent.type !== 'PAGE') {
            parent = parent.parent;
        }
        if (parent && parent.type === 'PAGE') {
            yield figma.setCurrentPageAsync(parent);
            // Yield to allow Figma to switch pages before selecting/zooming
            yield Promise.resolve();
            if ('visible' in node && typeof node.visible === 'boolean') {
                figma.currentPage.selection = [node];
                figma.viewport.scrollAndZoomIntoView([node]);
                figma.notify('Jumped to bookmark!');
            }
            else {
                figma.notify('This bookmark is not a visible layer.');
            }
        }
        else {
            figma.notify('Could not find the page for this layer.');
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
        }
        else {
            figma.notify('No matching emoji to clear.');
        }
    }
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
});
