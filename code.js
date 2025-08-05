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
const LAYER_EMOJI_LIST = ['🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜']; // Square emojis for layers
const PAGE_EMOJI_LIST = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️']; // Circle emojis for pages
// --- Helper functions for file-specific bookmark storage ---
function getContainingPage(node) {
    var _a;
    let currentNode = node;
    while (currentNode.parent && currentNode.parent.type !== 'PAGE') {
        currentNode = currentNode.parent;
    }
    return ((_a = currentNode.parent) === null || _a === void 0 ? void 0 : _a.type) === 'PAGE' ? currentNode.parent : null;
}
function getPageName(node) {
    const page = getContainingPage(node);
    return (page === null || page === void 0 ? void 0 : page.name) || 'Unknown Page';
}
function getCurrentDateString() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${month}.${day}`;
}
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
        const migrationVersion = figma.root.getPluginData('migrationVersion') || '0';
        if (migrationVersion === '1') {
            return bookmarks;
        }
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
// --- UI Communication Helpers ---
function sendBookmarksToUI() {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        figma.ui.postMessage({ type: 'bookmarks', bookmarks });
    });
}
function sendSelectionStateToUI() {
    const selectedLayers = figma.currentPage.selection;
    const hasLayerSelected = selectedLayers.length > 0;
    figma.ui.postMessage({
        type: 'selection-state',
        hasLayerSelected,
        layerEmojis: LAYER_EMOJI_LIST,
        pageEmojis: PAGE_EMOJI_LIST
    });
}
function updateAndSaveBookmarks(bookmarks) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setBookmarks(bookmarks);
        yield sendBookmarksToUI();
    });
}
// --- Emoji & Naming Helpers ---
function removeEmojiPrefix(name) {
    for (const emoji of [...LAYER_EMOJI_LIST, ...PAGE_EMOJI_LIST]) {
        if (name.includes(emoji)) {
            return name.replace(emoji, '').trim();
        }
    }
    return name;
}
function replaceColorEmoji(name, newEmoji) {
    for (const emoji of [...LAYER_EMOJI_LIST, ...PAGE_EMOJI_LIST]) {
        if (name.includes(emoji)) {
            return name.replace(emoji, newEmoji);
        }
    }
    return newEmoji + ' ' + name;
}
function updateBookmarkIfExists(layerId, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        const bookmark = bookmarks.find(b => b.id === layerId);
        if (bookmark && bookmark.name !== newName) {
            bookmark.name = newName;
            try {
                const node = yield figma.getNodeByIdAsync(layerId);
                if (node && 'parent' in node) {
                    bookmark.pageName = getPageName(node);
                }
            }
            catch (error) {
                console.log('Failed to update bookmark page name:', layerId, error);
            }
            yield updateAndSaveBookmarks(bookmarks);
            return true;
        }
        return false;
    });
}
// --- Navigation & Cleanup Helpers ---
function cleanupBookmark(bookmarkId) {
    return __awaiter(this, void 0, void 0, function* () {
        const bookmarks = yield getBookmarks();
        const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        yield updateAndSaveBookmarks(newBookmarks);
    });
}
function navigateToNode(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetPage = getContainingPage(node);
        if (targetPage) {
            if (figma.currentPage !== targetPage) {
                yield figma.setCurrentPageAsync(targetPage);
            }
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
figma.showUI(__html__, { width: 240, height: 352 });
figma.on('selectionchange', () => {
    sendSelectionStateToUI();
});
// --- Message Handler Functions ---
function handleSaveBookmark(selectedLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedLayers.length === 0) {
            figma.notify('Please select a layer to bookmark.');
            return;
        }
        const node = selectedLayers[0];
        const bookmarks = yield getBookmarks();
        const existingBookmarkIndex = bookmarks.findIndex(b => b.id === node.id);
        const pageName = getPageName(node);
        if (existingBookmarkIndex !== -1) {
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
            yield updateBookmarkIfExists(bookmarkId, node.name);
            yield navigateToNode(node);
        }
        catch (error) {
            figma.notify('Error accessing bookmark. Cleaning up...');
            yield cleanupBookmark(bookmarkId);
        }
    });
}
function updateLayerEmojis(layers, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
        let bookmarkUpdates = false;
        for (const layer of layers) {
            const cleanName = removeEmojiPrefix(layer.name);
            const newName = emoji + ' ' + cleanName;
            layer.name = newName;
            if (yield updateBookmarkIfExists(layer.id, newName)) {
                bookmarkUpdates = true;
            }
        }
        return bookmarkUpdates;
    });
}
function updatePageEmoji(page, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if the page name already has the arrow structure
        if (page.name.includes('↳')) {
            // If it has the arrow structure, find and replace any existing emoji
            let newName = page.name;
            let emojiFound = false;
            for (const existingEmoji of PAGE_EMOJI_LIST) {
                if (page.name.includes(existingEmoji)) {
                    newName = page.name.replace(existingEmoji, emoji);
                    emojiFound = true;
                    break;
                }
            }
            // If no emoji was found, add the emoji after the arrow
            if (!emojiFound) {
                newName = page.name.replace('↳', `↳ ${emoji}`);
            }
            page.name = newName;
        }
        else {
            // If no arrow structure, add the default structure with the emoji
            const dateString = getCurrentDateString();
            page.name = `↳ ${emoji} ${dateString} : ${page.name}`;
        }
        return yield updateBookmarksForPage(page.id, page.name);
    });
}
function handleAddEmoji(selectedLayers, emoji) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedLayers.length > 0) {
            const bookmarkUpdates = yield updateLayerEmojis(selectedLayers, emoji);
            const messages = ['Layer emoji updated!'];
            if (bookmarkUpdates) {
                messages.push('Bookmarks updated.');
            }
            figma.notify(messages.join(' '));
        }
        else {
            const bookmarkUpdates = yield updatePageEmoji(figma.currentPage, emoji);
            figma.notify(`Page emoji updated! ${bookmarkUpdates ? 'Bookmarks updated.' : ''}`);
        }
    });
}
function clearLayerEmojis(layers) {
    return __awaiter(this, void 0, void 0, function* () {
        let emojiCleared = false;
        let bookmarkUpdates = false;
        for (const layer of layers) {
            const cleanName = removeEmojiPrefix(layer.name);
            if (cleanName !== layer.name) {
                layer.name = cleanName;
                emojiCleared = true;
                if (yield updateBookmarkIfExists(layer.id, cleanName)) {
                    bookmarkUpdates = true;
                }
            }
        }
        return { emojiCleared, bookmarkUpdates };
    });
}
function clearPageEmoji(page) {
    return __awaiter(this, void 0, void 0, function* () {
        let emojiCleared = false;
        let bookmarkUpdates = false;
        // Check if the page name has the arrow structure with emoji
        if (page.name.includes('↳')) {
            let newName = page.name;
            for (const emoji of PAGE_EMOJI_LIST) {
                if (page.name.includes(emoji)) {
                    // Remove the emoji but keep the arrow structure
                    newName = page.name.replace(emoji, '').trim();
                    // Clean up any double spaces
                    newName = newName.replace(/\s+/g, ' ');
                    page.name = newName;
                    emojiCleared = true;
                    bookmarkUpdates = yield updateBookmarksForPage(page.id, newName);
                    break;
                }
            }
        }
        return { emojiCleared, bookmarkUpdates };
    });
}
function handleClearEmoji(selectedLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selectedLayers.length > 0) {
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
/**
 * Creates a new page or prepends a title to selected layers based on context.
 */
function handleAddDateTitle() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${month}.${day}`;
        const selectedLayers = figma.currentPage.selection;
        if (selectedLayers.length > 0) {
            // If layers are selected, prepend the title to their names
            let layersUpdated = 0;
            for (const layer of selectedLayers) {
                // Check if layer already has the current date pattern anywhere in the name
                const hasDatePattern = layer.name.includes(`${dateString} :`);
                if (!hasDatePattern) {
                    layer.name = `${LAYER_EMOJI_LIST[2]} ${dateString} : ${layer.name}`;
                    layersUpdated++;
                }
            }
            if (layersUpdated > 0) {
                figma.notify(`Date prefix added to ${layersUpdated} layer(s)!`);
            }
            else {
                figma.notify('All selected layers already have date prefixes.');
            }
        }
        else {
            // If no layers are selected, create a new page
            const newPage = figma.createPage();
            newPage.name = `↳ ${PAGE_EMOJI_LIST[2]} ${dateString} : New Page`;
            yield figma.setCurrentPageAsync(newPage);
            figma.notify('New page created with date title!');
        }
    });
}
/**
 * Creates a new page with a default name.
 */
function handleCreateNewPage() {
    return __awaiter(this, void 0, void 0, function* () {
        const newPage = figma.createPage();
        newPage.name = 'New Page';
        yield figma.setCurrentPageAsync(newPage);
        figma.notify('New page created!');
    });
}
/**
 * Recursively finds all collapsible layers in a node and its children.
 * This is optimized to avoid performance issues and properly identifies collapsible node types.
 */
function getAllCollapsibleLayers(node, maxDepth = 10) {
    const collapsibleLayers = [];
    
    // Define node types that can be collapsed in the layers panel
    const collapsibleNodeTypes = new Set([
        'FRAME',
        'COMPONENT', 
        'COMPONENT_SET',
        'INSTANCE',
        'GROUP',
        'SECTION',
        'BOOLEAN_OPERATION'
    ]);
    
    function traverse(currentNode, depth) {
        if (depth > maxDepth) {
            return; // Limit depth to prevent performance issues
        }
        
        try {
            // Check if this node type can be collapsible and has the expanded property
            if (currentNode && 
                collapsibleNodeTypes.has(currentNode.type) && 
                'expanded' in currentNode &&
                currentNode.expanded === true) {
                collapsibleLayers.push(currentNode);
            }
            
            // Recursively check children
            if ('children' in currentNode && currentNode.children) {
                for (const child of currentNode.children) {
                    traverse(child, depth + 1);
                }
            }
        } catch (error) {
            // Skip nodes that cause errors (e.g., removed nodes)
            console.warn('Error processing node during collapse traversal:', error);
        }
    }
    
    traverse(node, 0);
    return collapsibleLayers;
}
/**
 * Collapses layers in the layer panel.
 */
function handleCollapseLayers(selectedLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        let layersToCollapse = [];
        
        // Define node types that can be collapsed in the layers panel
        const collapsibleNodeTypes = new Set([
            'FRAME',
            'COMPONENT', 
            'COMPONENT_SET',
            'INSTANCE',
            'GROUP',
            'SECTION',
            'BOOLEAN_OPERATION'
        ]);
        
        if (selectedLayers.length === 0) {
            // If no layers selected, collapse all collapsible layers (like Alt+L)
            // Use optimized recursive function with increased depth limit
            layersToCollapse = getAllCollapsibleLayers(figma.currentPage, 10);
        }
        else {
            // If layers are selected, collapse only those layers that are actually collapsible and expanded
            layersToCollapse = selectedLayers.filter(node => {
                try {
                    return node && 
                           collapsibleNodeTypes.has(node.type) && 
                           'expanded' in node && 
                           node.expanded === true;
                } catch (error) {
                    console.warn('Error checking node for collapse:', error);
                    return false;
                }
            });
        }
        
        let collapsedCount = 0;
        let errorCount = 0;
        
        for (const layer of layersToCollapse) {
            try {
                if ('expanded' in layer && layer.expanded === true) {
                    layer.expanded = false;
                    collapsedCount++;
                }
            } catch (error) {
                console.warn('Error collapsing layer:', layer.name || 'Unknown', error);
                errorCount++;
            }
        }
        
        if (collapsedCount > 0) {
            const action = selectedLayers.length === 0 ? 'all' : 'selected';
            let message = `${collapsedCount} ${action} layer(s) collapsed!`;
            if (errorCount > 0) {
                message += ` (${errorCount} errors)`;
            }
            figma.notify(message);
        }
        else {
            const action = selectedLayers.length === 0 ? 'expanded collapsible layers on this page' : 'expanded collapsible layers selected';
            const foundLayers = layersToCollapse.length;
            if (foundLayers === 0) {
                figma.notify(`No ${action} found.`);
            } else {
                figma.notify(`Found ${foundLayers} collapsible layer(s) but none were expanded.`);
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
                sendSelectionStateToUI();
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
            case 'add-date-smart':
            case 'add-date-title':
                yield handleAddDateTitle();
                break;
            case 'create-new-page':
                yield handleCreateNewPage();
                break;
            case 'collapse-layers':
                yield handleCollapseLayers(selectedLayers);
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
