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
// Helper to find the containing page for any node
function getContainingPage(node) {
    var _a;
    let currentNode = node;
    while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
        currentNode = currentNode.parent;
    }
    return ((_a = currentNode.parent) === null || _a === void 0 ? void 0 : _a.type) === 'PAGE' ? currentNode.parent : null;
}
// Helper to get page name for a node
function getPageName(node) {
    const page = getContainingPage(node);
    return (page === null || page === void 0 ? void 0 : page.name) || 'Unknown Page';
}
// Helper to update bookmarks for a specific page
function updateBookmarksForPage(pageId, newPageName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        let bookmarkUpdates = false;
        for (const bookmark of bookmarks) {
            try {
                const node = yield figma.getNodeByIdAsync(bookmark.id);
                if (node && 'parent' in node) {
                    const page = getContainingPage(node);
                    if ((page === null || page === void 0 ? void 0 : page.id) === pageId) {
                        bookmark.pageName = newPageName;
                        bookmarkUpdates = true;
                    }
                }
            }
            catch (error) {
                // Skip if node doesn't exist
                console.log('Node not found during bookmark update:', bookmark.id);
            }
        }
        if (bookmarkUpdates) {
            yield updateAndSaveBookmarks(bookmarks);
        }
        return bookmarkUpdates;
    });
}
function getBookmarks() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = figma.root.getPluginData('bookmarks');
        const bookmarks = data ? JSON.parse(data) : [];
        // Check if migration is needed
        const migrationVersion = figma.root.getPluginData('migrationVersion') || '0';
        if (migrationVersion === '1') {
            return bookmarks;
        }
        // Migrate old bookmarks that don't have pageName
        const migratedBookmarks = yield Promise.all(bookmarks.map((bookmark) => __awaiter(this, void 0, void 0, function* () {
            if (!bookmark.pageName) {
                try {
                    const node = yield figma.getNodeByIdAsync(bookmark.id);
                    if (node && 'parent' in node) {
                        bookmark.pageName = getPageName(node);
                    }
                    else {
                        bookmark.pageName = 'Unknown Page';
                    }
                }
                catch (error) {
                    bookmark.pageName = 'Unknown Page';
                    console.log('Failed to migrate bookmark:', bookmark.id, error);
                }
            }
            return bookmark;
        })));
        // Save migrated bookmarks and mark migration as complete
        yield setBookmarks(migratedBookmarks);
        figma.root.setPluginData('migrationVersion', '1');
        return migratedBookmarks;
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
// --- Helper to replace any color emoji in a string with a new one ---
function replaceColorEmoji(name, newEmoji) {
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
function updateBookmarkIfExists(layerId, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        const bookmark = bookmarks.find(b => b.id === layerId);
        if (bookmark && bookmark.name !== newName) {
            bookmark.name = newName;
            // Also update page name if the node still exists
            try {
                const node = yield figma.getNodeByIdAsync(layerId);
                if (node && 'parent' in node) {
                    bookmark.pageName = getPageName(node);
                }
            }
            catch (error) {
                // If we can't get the node, keep the existing page name
                console.log('Failed to update bookmark page name:', layerId, error);
            }
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
        // Find containing page
        const targetPage = getContainingPage(node);
        if (targetPage) {
            // Switch to correct page if needed
            if (figma.currentPage !== targetPage) {
                yield figma.setCurrentPageAsync(targetPage);
            }
            // Navigate to node
            if ('visible' in node && node.visible) {
                figma.currentPage.selection = [node];
                figma.viewport.scrollAndZoomIntoView([node]);
                figma.notify(`Jumped to: ${node.name} (Page: ${targetPage.name})`);
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
        // Get the page name
        const pageName = getPageName(node);
        if (existingBookmarkIndex !== -1) {
            // Update existing bookmark name if it has changed
            if (bookmarks[existingBookmarkIndex].name !== node.name) {
                bookmarks[existingBookmarkIndex].name = node.name;
                bookmarks[existingBookmarkIndex].pageName = pageName;
                yield updateAndSaveBookmarks(bookmarks);
                figma.notify('Bookmark name updated!');
            }
            else {
                figma.notify('Layer already bookmarked.');
            }
        }
        else {
            // Create new bookmark
            bookmarks.push({ id: node.id, name: node.name, pageName: pageName });
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
// --- Helper to add emoji to selected layers or current page ---
function updateLayerEmojis(layers, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
        let bookmarkUpdates = false;
        for (const layer of layers) {
            const cleanName = removeEmojiPrefix(layer.name);
            const newName = emoji + ' ' + cleanName;
            layer.name = newName;
            // Update bookmark if it exists
            if (yield updateBookmarkIfExists(layer.id, newName)) {
                bookmarkUpdates = true;
            }
        }
        return bookmarkUpdates;
    });
}
function updatePageEmoji(page, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
        const newName = replaceColorEmoji(page.name, emoji);
        page.name = newName;
        // Update all bookmarks on this page to reflect the new page name
        return yield updateBookmarksForPage(page.id, newName);
    });
}
function handleAddEmoji(selectedLayers, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if any layers are selected
        if (selectedLayers.length > 0) {
            // Apply emoji to selected layers
            const bookmarkUpdates = yield updateLayerEmojis(selectedLayers, emoji);
            const messages = ['Layer emoji updated!'];
            if (bookmarkUpdates) {
                messages.push('Bookmarks updated.');
            }
            figma.notify(messages.join(' '));
        }
        else {
            // No layers selected, apply emoji to current page
            const bookmarkUpdates = yield updatePageEmoji(figma.currentPage, emoji);
            figma.notify(`Page emoji updated! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
        }
    });
}
function clearLayerEmojis(layers) {
    return __awaiter(this, void 0, void 0, function* () {
        let anEmojiWasCleared = false;
        let bookmarkUpdates = false;
        for (const layer of layers) {
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
        return { emojiCleared: anEmojiWasCleared, bookmarkUpdates };
    });
}
function clearPageEmoji(page) {
    return __awaiter(this, void 0, void 0, function* () {
        const originalName = page.name;
        const cleanName = removeEmojiPrefix(originalName);
        if (cleanName !== originalName) {
            page.name = cleanName;
            // Update all bookmarks on this page to reflect the new page name
            const bookmarkUpdates = yield updateBookmarksForPage(page.id, cleanName);
            return { emojiCleared: true, bookmarkUpdates };
        }
        return { emojiCleared: false, bookmarkUpdates: false };
    });
}
function handleClearEmoji(selectedLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if any layers are selected
        if (selectedLayers.length > 0) {
            // Clear emoji from selected layers
            const { emojiCleared, bookmarkUpdates } = yield clearLayerEmojis(selectedLayers);
            if (emojiCleared) {
                const messages = ['Layer emoji cleared!'];
                if (bookmarkUpdates) {
                    messages.push('Bookmarks updated.');
                }
                figma.notify(messages.join(' '));
            }
            else {
                figma.notify('No matching emoji to clear from layers.');
            }
        }
        else {
            // No layers selected, clear emoji from current page
            const { emojiCleared, bookmarkUpdates } = yield clearPageEmoji(figma.currentPage);
            if (emojiCleared) {
                figma.notify(`Page emoji cleared! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
            }
            else {
                figma.notify('No matching emoji to clear from page title.');
            }
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
