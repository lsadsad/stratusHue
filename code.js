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
// --- Helper to update and persist bookmarks ---
function updateAndSaveBookmarks(bookmarks) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setBookmarks(bookmarks);
        yield sendBookmarksToUI();
    });
}
// --- Helper to remove emoji prefix from layer name ---
function removeEmojiPrefix(name) {
    for (const emoji of EMOJI_LIST) {
        if (name.startsWith(emoji + ' ')) {
            return name.substring((emoji + ' ').length);
        }
    }
    return name;
}
// --- Helper to update bookmark name if it exists ---
function updateBookmarkIfExists(layerId, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        const bookmark = bookmarks.find(b => b.id === layerId);
        if (bookmark && bookmark.name !== newName) {
            bookmark.name = newName;
            yield updateAndSaveBookmarks(bookmarks);
            return true;
        }
        return false;
    });
}
// --- Helper to clean up invalid bookmarks ---
function cleanupBookmark(bookmarkId) {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        yield updateAndSaveBookmarks(newBookmarks);
    });
}
// --- Helper to navigate to a node ---
function navigateToNode(node) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Find containing page
        let currentNode = node;
        while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
            currentNode = currentNode.parent;
        }
        if (((_a = currentNode.parent) === null || _a === void 0 ? void 0 : _a.type) === 'PAGE') {
            const targetPage = currentNode.parent;
            // Switch to correct page if needed
            if (figma.currentPage !== targetPage) {
                yield figma.setCurrentPageAsync(targetPage);
            }
            // Navigate to node
            if ('visible' in node && node.visible) {
                figma.currentPage.selection = [node];
                figma.viewport.scrollAndZoomIntoView([node]);
                figma.notify('Jumped to: ' + node.name);
            }
        }
        else {
            figma.notify('Could not locate page for this bookmark.');
        }
    });
}
// --- Plugin UI Setup ---
figma.showUI(__html__, { width: 192, height: 352 });
// --- Message Handlers ---
function handleSaveBookmark(selectedLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedLayers.length === 0) {
            figma.notify('Please select a layer to bookmark.');
            return;
        }
        const node = selectedLayers[0];
        const bookmarks = yield getBookmarks();
        const existingBookmarkIndex = bookmarks.findIndex(b => b.id === node.id);
        if (existingBookmarkIndex !== -1) {
            // Update existing bookmark name if it has changed
            if (bookmarks[existingBookmarkIndex].name !== node.name) {
                bookmarks[existingBookmarkIndex].name = node.name;
                yield updateAndSaveBookmarks(bookmarks);
                figma.notify('Bookmark name updated!');
            }
            else {
                figma.notify('Layer already bookmarked.');
            }
        }
        else {
            // Create new bookmark
            bookmarks.push({ id: node.id, name: node.name });
            yield updateAndSaveBookmarks(bookmarks);
            figma.notify('Bookmark saved!');
        }
    });
}
function handleRemoveBookmark(bookmarkId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield cleanupBookmark(bookmarkId);
        figma.notify('Bookmark removed.');
    });
}
function handleJumpToBookmark(bookmarkId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const node = yield figma.getNodeByIdAsync(bookmarkId);
            if (!node || !('parent' in node)) {
                figma.notify('Bookmark no longer exists. Cleaning up...');
                yield cleanupBookmark(bookmarkId);
                return;
            }
            // Update bookmark name if it has changed
            yield updateBookmarkIfExists(bookmarkId, node.name);
            // Navigate to the node
            yield navigateToNode(node);
        }
        catch (error) {
            figma.notify('Error accessing bookmark. Cleaning up...');
            yield cleanupBookmark(bookmarkId);
        }
    });
}
function handleAddEmoji(selectedLayers, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
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
            if (yield updateBookmarkIfExists(layer.id, newName)) {
                bookmarkUpdates = true;
            }
        }
        const messages = ['Emoji updated!'];
        if (bookmarkUpdates) {
            messages.push('Bookmarks updated.');
        }
        figma.notify(messages.join(' '));
    });
}
function handleClearEmoji(selectedLayers) {
    return __awaiter(this, void 0, void 0, function* () {
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
                if (yield updateBookmarkIfExists(layer.id, cleanName)) {
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
        }
        else {
            figma.notify('No matching emoji to clear.');
        }
    });
}
// --- Main Message Handler ---
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const selectedLayers = figma.currentPage.selection;
    try {
        switch (msg.type) {
            case 'ui-ready':
                yield sendBookmarksToUI();
                break;
            case 'save-bookmark':
                yield handleSaveBookmark(selectedLayers);
                break;
            case 'remove-bookmark':
                yield handleRemoveBookmark(msg.id);
                break;
            case 'jump-to-bookmark':
                yield handleJumpToBookmark(msg.id);
                break;
            case 'add-emoji':
                yield handleAddEmoji(selectedLayers, msg.emoji);
                break;
            case 'clear-emoji':
                yield handleClearEmoji(selectedLayers);
                break;
            case 'cancel':
                figma.closePlugin();
                break;
            default:
                console.warn('Unknown message type:', msg.type);
        }
    }
    catch (error) {
        console.error('Error handling message:', error);
        figma.notify('An error occurred. Please try again.');
    }
});
