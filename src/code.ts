/// <reference types="@figma/plugin-typings" />

// Stratus Hue: A Figma plugin for layer tagging and navigation.
// Optimized modular architecture with error handling and performance

// ===== IMPORTS =====
import { debounce, addOrReplaceDateInLayerName, addOrReplaceDateInPageTitle } from './utils';
// import { ThemePreference } from './core/types'; // Unused import
import {
  loadAnchorState,
  loadUISectionStates,
  setUiWidth,
  setUiHeight,
  currentUiWidth,
  lastUiHeight,
  setPreviousSelection,
  // getPreviousSelection, // Unused
  // clearPreviousSelection // Unused
} from './core/state';
import {
  addBookmark,
  removeBookmark,
  detectCurrentAnchorFromSelection,
  validateCurrentAnchor,
  validateRecentHistory,
  reorderBookmarks
} from './features/bookmarks';
import { jumpToBookmark, goBackInHistory, goForwardInHistory, addSelectionToHistory, addPageChangeToHistory, findNearestExistingSelectionEntryAnyDirection } from './features/navigation';
import {
  addEmojiToSelection,
  clearEmojiFromSelection,
  navigateEmojiSet
} from './features/emoji-manager';
import {
  sendInitialUIState,
  sendSelectionStateToUI,
  updateUIAfterNavigation,
  updateUIAfterEmojiChange,
  updateUIAfterBookmarkChange,
  resizeUI,
  toggleUIWidth,
  sendNavigationStateToUI
} from './ui/ui-communication';
import {
  triggerValidationOnSelectionChange,
  triggerValidationOnPageChange
} from './utils/validation';
import {
  handleError,
  withErrorBoundary,
  validateMessage,
  ErrorType
} from './core/error-handling';

// ===== PLUGIN INITIALIZATION =====
figma.showUI(__html__, { width: currentUiWidth, height: lastUiHeight });

const initializePlugin = withErrorBoundary(async () => {
  await loadAnchorState();
  await loadUISectionStates();
  await validateRecentHistory();
  await validateCurrentAnchor();
  await sendInitialUIState();
}, ErrorType.STORAGE_ERROR);

// ===== DEBOUNCED FUNCTIONS =====
const debouncedNavigationContextUpdate = debounce(() => {
  import('./ui/ui-communication').then(({ sendNavigationContextToUI }) => {
    sendNavigationContextToUI(); // Uses caching to avoid unnecessary updates
  }).catch(console.error);
}, 50); // Faster debounce for navigation context as it's lightweight with caching

const debouncedSelectionUpdate = debounce(() => {
  // Store current selection as previous before updating
  const currentSelection = figma.currentPage.selection;
  const currentPageId = figma.currentPage.id;
  
  if (currentSelection.length > 0) {
    const nodeIds = currentSelection.map(node => node.id);
    setPreviousSelection(nodeIds, currentPageId);
  }
  
  sendSelectionStateToUI();
  detectCurrentAnchorFromSelection();
  addSelectionToHistory();
  sendNavigationStateToUI();
  
  // Send optimized navigation context updates with dedicated debounce
  debouncedNavigationContextUpdate();
  
  triggerValidationOnSelectionChange();
}, 100);

const debouncedPageChange = debounce(async () => {
  // Clear navigation context cache when page changes
  const { clearNavigationContextCache } = await import('./ui/ui-communication');
  clearNavigationContextCache();
  
  await validateCurrentAnchor();
  await updateUIAfterNavigation();
  addPageChangeToHistory();
  triggerValidationOnPageChange();
}, 200);

// ===== EVENT HANDLERS =====
figma.on('selectionchange', debouncedSelectionUpdate);
figma.on('currentpagechange', debouncedPageChange);

// ===== MESSAGE HANDLERS =====
figma.ui.onmessage = async (msg) => {
  if (!validateMessage(msg)) {
    handleError({ type: ErrorType.UI_COMMUNICATION, message: 'Invalid message format', recoverable: true });
    return;
  }

  try {
    switch (msg.type) {
      case 'get-ui-section-states': {
        try {
          // Ensure latest states are loaded
          await loadUISectionStates();
          figma.ui.postMessage({
            type: 'ui-section-states',
            states: (await import('./core/state')).uiSectionStates
          });
        } catch (error) {
          console.error('Failed to send UI section states:', error);
          figma.ui.postMessage({ type: 'ui-section-states', states: {} });
        }
        break;
      }

      case 'save-ui-section-state': {
        if ('sectionId' in msg && typeof msg.sectionId === 'string' && 'expanded' in msg && typeof msg.expanded === 'boolean') {
          try {
            const { saveUISectionState } = await import('./core/state');
            await saveUISectionState(msg.sectionId, msg.expanded);
            // Optionally re-send updated states
            figma.ui.postMessage({
              type: 'ui-section-states',
              states: (await import('./core/state')).uiSectionStates
            });
          } catch (error) {
            console.error('Failed to save UI section state:', error);
          }
        }
        break;
      }
      case 'ui-ready':
        await initializePlugin();
        break;

      case 'add-emoji':
        if ('emoji' in msg && msg.emoji && typeof msg.emoji === 'string') {
          await handleAddEmoji(msg.emoji);
        }
        break;

      case 'clear-emoji':
        await handleClearEmoji();
        break;

      case 'navigate-emoji-set':
        if ('direction' in msg && (msg.direction === 'prev' || msg.direction === 'next')) {
          handleNavigateEmojiSet(msg.direction);
        }
        break;

      case 'save-bookmark':
        await handleSaveBookmark();
        break;

      case 'refresh-anchors':
        await handleRefreshAnchors();
        break;

      case 'jump-to-bookmark':
        if ('id' in msg && msg.id && typeof msg.id === 'string') {
          await handleJumpToBookmark(msg.id);
        }
        break;

      case 'remove-bookmark':
        if ('id' in msg && msg.id && typeof msg.id === 'string') {
          await handleRemoveBookmark(msg.id);
        }
        break;

      case 'reorder-bookmarks':
        if ('order' in msg && Array.isArray(msg.order) && msg.order.every((id: unknown) => typeof id === 'string')) {
          await handleReorderBookmarks(msg.order as string[]);
        }
        break;

      case 'deselect':
        figma.currentPage.selection = [];
        sendSelectionStateToUI();
        break;

      case 'toggle-mode':
        if ('mode' in msg && msg.mode === 'onLayer') {
          await handleToggleToLayerMode();
        }
        break;

      case 'go-back':
        await handleGoBack();
        break;

      case 'go-forward':
        await handleGoForward();
        break;

      case 'resize-ui':
        if ('height' in msg && typeof msg.height === 'number' && msg.height > 0) {
          const newHeight = Math.max(150, msg.height);
          setUiHeight(newHeight);
          resizeUI(currentUiWidth, newHeight);
        }
        break;

      case 'toggle-width': {
        const newWidth = toggleUIWidth(currentUiWidth, lastUiHeight);
        setUiWidth(newWidth);
        break;
      }

      // Removed upgrade/open-url flow

      // === THEME PERSISTENCE ===
      case 'get-theme-preference': {
        const { ThemeStorage } = await import('./core/theme-storage');
        const result = await ThemeStorage.loadThemePreference();
        
        figma.ui.postMessage({ 
          type: 'theme-preference', 
          theme: result.data,
          storageInfo: {
            success: result.success,
            usedFallback: result.usedFallback,
            error: result.error
          }
        });
        break;
      }

      case 'set-theme-preference':
        if ('theme' in msg) {
          const { ThemeStorage } = await import('./core/theme-storage');
          const result = await ThemeStorage.saveThemePreference(msg.theme as import('./core/types').ThemePreference);
          
          // Also maintain backward compatibility with direct storage
          try {
            await figma.clientStorage.setAsync('themePreference', msg.theme);
          } catch (_e) {
            // ignore storage errors; preference is non-critical
          }
          
          // Optionally notify UI of save result
          if (!result.success) {
            console.warn('Enhanced theme storage save failed:', result.error);
          }
        }
        break;

      case 'add-date':
        await handleAddDate();
        break;

      case 'create-new-page':
        await handleCreateNewPage();
        break;
      case 'indent-title':
        await handleIndentTitle();
        break;
      case 'outdent-title':
        await handleOutdentTitle();
        break;

      case 'open-kofi':
        await handleOpenKofi();
        break;

      case 'navigation-action':
        if ('action' in msg && typeof msg.action === 'string') {
          await handleNavigationAction(msg.action as import('./core/types').NavigationAction);
        }
        break;

      case 'toggle-navigation-controls':
        if ('enabled' in msg && typeof msg.enabled === 'boolean') {
          await handleToggleNavigationControls(msg.enabled);
        }
        break;

      case 'get-navigation-controls-setting':
        await handleGetNavigationControlsSetting();
        break;

      // Removed license management message handlers

      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    handleError(error);
  }
};

// ===== SPECIFIC MESSAGE HANDLERS =====
const handleAddEmoji = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelection(emoji);
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleClearEmoji = withErrorBoundary(async () => {
  const result = await clearEmojiFromSelection();
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleNavigateEmojiSet = withErrorBoundary(async (direction: 'prev' | 'next') => {
  const hasLayerSelected = figma.currentPage.selection.length > 0;
  const result = navigateEmojiSet(direction, hasLayerSelected);
  figma.notify(`Switched to ${result.setName} emoji set`);
  updateUIAfterEmojiChange();
}, ErrorType.UNKNOWN);

const handleSaveBookmark = withErrorBoundary(async () => {
  const selection = figma.currentPage.selection;

  if (selection.length !== 1) {
    figma.notify('Please select exactly one layer to bookmark.');
    return;
  }

  const node = selection[0];
  if (!('name' in node)) {
    figma.notify('Selected element cannot be bookmarked.');
    return;
  }

  try {
    const bookmark = await addBookmark(node as SceneNode & { name: string });
    figma.notify(`Bookmarked: ${bookmark.name}`);
    await updateUIAfterNavigation();
  } catch (error) {
    if (error instanceof Error) {
      figma.notify(error.message);
    } else {
      throw error;
    }
  }
}, ErrorType.BOOKMARK_NOT_FOUND);

const handleJumpToBookmark = withErrorBoundary(async (bookmarkId: string) => {
  const result = await jumpToBookmark(bookmarkId);
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterNavigation();
  }
}, ErrorType.NAVIGATION_FAILED);

const handleRemoveBookmark = withErrorBoundary(async (bookmarkId: string) => {
  await removeBookmark(bookmarkId);
  figma.notify('Bookmark removed.');
  await updateUIAfterNavigation();
}, ErrorType.BOOKMARK_NOT_FOUND);

const handleReorderBookmarks = withErrorBoundary(async (order: string[]) => {
  const result = await reorderBookmarks(order);
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterBookmarkChange();
  }
}, ErrorType.UNKNOWN);

async function handleGoBack(): Promise<void> {
  const result = await goBackInHistory();
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterNavigation();
  }
}

async function handleGoForward(): Promise<void> {
  const result = await goForwardInHistory();
  figma.notify(result.message);
  if (result.success) {
    await updateUIAfterNavigation();
  }
}

const handleRefreshAnchors = withErrorBoundary(async () => {
  const { updated, removed } = await (await import('./features/bookmarks')).validateAndSyncBookmarks();
  figma.notify(`Anchors resynced: ${updated} updated, ${removed} removed`);
  // Force fresh bookmark list so other windows see deletes/reorders after manual refresh
  await (await import('./ui/ui-communication')).sendBookmarksToUI({ forceReload: true });
  sendNavigationStateToUI();
  sendSelectionStateToUI();
}, ErrorType.UNKNOWN);

const handleAddDate = withErrorBoundary(async () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    // Apply to current page title
    const page = figma.currentPage;
    const oldName = page.name;
    const newName = addOrReplaceDateInPageTitle(oldName);
    if (newName !== oldName) {
      page.name = newName;
      figma.notify(`Updated page title: ${newName}`);
    } else {
      figma.notify('Page title unchanged');
    }
  } else {
    // Apply to selected layers
    let updatedCount = 0;
    for (const node of selection) {
      if ('name' in node) {
        const oldName = (node as any).name as string;
        const newName = addOrReplaceDateInLayerName(oldName);
        if (newName !== oldName) {
          (node as any).name = newName;
          updatedCount++;
        }
      }
    }
    figma.notify(`Updated ${updatedCount} layer${updatedCount === 1 ? '' : 's'} with today's date`);
  }

  await updateUIAfterNavigation();
}, ErrorType.UNKNOWN);

// Insert 4 spaces before the current page title's text
const handleIndentTitle = withErrorBoundary(async () => {
  const page = figma.currentPage;
  const oldName = page.name;
  const newName = (await import('./utils')).addIndentToPageTitle(oldName);
  if (newName !== oldName) {
    page.name = newName;
    figma.notify(`Indented page title`);
  } else {
    figma.notify('Page title unchanged');
  }
  await updateUIAfterNavigation();
}, ErrorType.UNKNOWN);

// Remove 4 leading spaces from the current page title (if present)
const handleOutdentTitle = withErrorBoundary(async () => {
  const page = figma.currentPage;
  const oldName = page.name;
  const newName = (await import('./utils')).removeIndentFromPageTitle(oldName);
  if (newName !== oldName) {
    page.name = newName;
    figma.notify(`Outdented page title`);
  } else {
    figma.notify('Page title unchanged');
  }
  await updateUIAfterNavigation();
}, ErrorType.UNKNOWN);


// Create a new page, name it with today's date prefix, and switch to it
const handleCreateNewPage = withErrorBoundary(async () => {
  // Create page
  const page = figma.createPage();
  // Title format: "↳ MM.DD : newPage"
  const today = (await import('./utils')).getTodayDateToken();
  const baseTitle = 'newPage';
  page.name = `↳ ${today} : ${baseTitle}`;

  // Move the new page to be immediately after the current page
  const currentIndex = figma.root.children.indexOf(figma.currentPage);
  const targetIndex = Math.min(currentIndex + 1, figma.root.children.length - 1);
  try {
    figma.root.insertChild(targetIndex, page);
  } catch (_e) {
    // If insertChild fails (shouldn't), ignore and keep default position
  }

  // Switch to the new page
  await figma.setCurrentPageAsync(page);

  // Clear selection and notify
  figma.currentPage.selection = [];
  figma.notify(`Created page: ${page.name}`);

  // Update UI/navigation
  addPageChangeToHistory();
  await updateUIAfterNavigation();
}, ErrorType.UNKNOWN);



const handleToggleToLayerMode = withErrorBoundary(async () => {
  const latestSelection = await findNearestExistingSelectionEntryAnyDirection();

  if (!latestSelection || !latestSelection.nodeId) {
    figma.notify('No recent selection available');
    sendSelectionStateToUI();
    return;
  }

  try {
    // Navigate to page if needed
    if (figma.currentPage.id !== latestSelection.pageId) {
      const targetPage = figma.root.children.find(p => p.id === latestSelection.pageId && p.type === 'PAGE') as PageNode | undefined;
      if (targetPage) {
        await figma.setCurrentPageAsync(targetPage);
      } else {
        figma.notify(`Page no longer exists for recent selection`);
        sendSelectionStateToUI();
        return;
      }
    }

    // Select the node if it exists
    const node = await figma.getNodeByIdAsync(latestSelection.nodeId);
    if (node) {
      figma.currentPage.selection = [node as SceneNode];
      if ('visible' in node && node.visible) {
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      }
      const label = latestSelection.nodeName || 'Layer';
      figma.notify(`Selected: ${label}`);
    } else {
      figma.notify('Previously selected layer is no longer available');
    }

    await updateUIAfterNavigation();
  } catch (error) {
    console.error('Error selecting recent layer from history:', error);
    figma.notify('Failed to select recent layer');
    sendSelectionStateToUI();
  }
}, ErrorType.UNKNOWN);

const handleOpenKofi = withErrorBoundary(async () => {
  // Open Ko-fi page in external browser
  const kofiUrl = 'https://ko-fi.com/l3vi_dsgn';
  
  try {
    // Use Figma's openExternal API to open the Ko-fi page
    figma.openExternal(kofiUrl);
    figma.notify('Opening Ko-fi page... Thank you for your support! 🍦');
  } catch (error) {
    console.error('Failed to open Ko-fi page:', error);
    figma.notify('Unable to open Ko-fi page. Please check your Ko-fi URL configuration.');
  }
}, ErrorType.EXTERNAL_API);

// ===== NAVIGATION ACTION HANDLERS =====
const handleNavigationAction = withErrorBoundary(async (action: import('./core/types').NavigationAction) => {
  const { LayerNavigationHandler } = await import('./features/navigation');
  const selection = figma.currentPage.selection;
  
  let result: import('./core/types').NavigationResult;
  
  switch (action) {
    case 'enter':
      if (selection.length !== 1) {
        figma.notify('Please select exactly one container to enter');
        return;
      }
      result = LayerNavigationHandler.enterContainer(selection[0]);
      break;
      
    case 'exit':
      if (selection.length === 0) {
        figma.notify('Please select a layer to exit from');
        return;
      }
      result = LayerNavigationHandler.exitContainer(selection);
      break;
      
    case 'next-sibling':
      if (selection.length === 0) {
        // Handle page navigation when no layers are selected
        result = await LayerNavigationHandler.handleEmptySelection('next-sibling');
      } else if (selection.length === 1) {
        // Handle layer navigation when one layer is selected
        result = LayerNavigationHandler.navigateToSibling(selection[0], 'next');
      } else {
        // Handle multiple selection navigation - focus on last item
        result = LayerNavigationHandler.navigateToSiblingMultiple(selection, 'next');
      }
      break;
      
    case 'prev-sibling':
      if (selection.length === 0) {
        // Handle page navigation when no layers are selected
        result = await LayerNavigationHandler.handleEmptySelection('prev-sibling');
      } else if (selection.length === 1) {
        // Handle layer navigation when one layer is selected
        result = LayerNavigationHandler.navigateToSibling(selection[0], 'prev');
      } else {
        // Handle multiple selection navigation - focus on first item
        result = LayerNavigationHandler.navigateToSiblingMultiple(selection, 'prev');
      }
      break;
      
    case 'toggle-collapse':
      result = LayerNavigationHandler.toggleCollapse();
      break;
      
    default:
      figma.notify('Unknown navigation action');
      return;
  }
  
  // Apply the navigation result
  if (result.success) {
    const isSiblingAction = action === 'next-sibling' || action === 'prev-sibling';
    
    if (result.newSelection) {
      // For sibling navigation, capture expansion states BEFORE selection change
      let nodesToRestore: Array<{node: any, wasExpanded: boolean}> = [];
      
      if (isSiblingAction && result.newSelection.length > 0) {
        const selectedNode = result.newSelection[0];
        
        // Store expansion state of the node we're about to select (if it's a container)
        if ('expanded' in selectedNode) {
          nodesToRestore.push({
            node: selectedNode,
            wasExpanded: (selectedNode as any).expanded
          });
        }
        
        // Also store parent chain expansion states
        let currentParent = selectedNode.parent;
        while (currentParent && currentParent.type !== 'PAGE') {
          if ('expanded' in currentParent) {
            nodesToRestore.push({
              node: currentParent,
              wasExpanded: (currentParent as any).expanded
            });
          }
          currentParent = currentParent.parent;
        }
      }
      
      // Change selection (this may trigger auto-expansion)
      figma.currentPage.selection = result.newSelection as SceneNode[];
      
      // Restore expansion states after selection change
      if (isSiblingAction && nodesToRestore.length > 0) {
        setTimeout(() => {
          nodesToRestore.forEach(({node, wasExpanded}) => {
            if (node && 'expanded' in node) {
              node.expanded = wasExpanded;
            }
          });
        }, 0);
      }
    }

    if (result.viewportUpdate && result.newSelection && result.newSelection.length > 0) {
      // Always scroll to show selected layer for better UX
      const isEnterAction = action === 'enter';
      
      if (isEnterAction) {
        // Enter action: only scroll to first child
        figma.viewport.scrollAndZoomIntoView([result.newSelection[0]] as SceneNode[]);
      } else {
        // All other actions: scroll to show selected layer(s)
        figma.viewport.scrollAndZoomIntoView(result.newSelection as SceneNode[]);
      }
    }

    // Ensure bookmark system detects new selection from navigation
    detectCurrentAnchorFromSelection();

    // Update UI state and navigation history (non-blocking for better performance)
    updateUIAfterNavigation();

    // Navigation context will be updated by the debounced selection change handler
  }
  
  figma.notify(result.message);
}, ErrorType.NAVIGATION_FAILED);

const handleToggleNavigationControls = withErrorBoundary(async (enabled: boolean) => {
  // Store navigation controls setting in plugin storage
  try {
    await figma.clientStorage.setAsync('navigationControlsEnabled', enabled);
    
    // Send updated setting to UI
    figma.ui.postMessage({
      type: 'navigation-controls-setting',
      enabled: enabled
    });
    
    figma.notify(enabled ? 'Navigation controls enabled' : 'Navigation controls disabled');
  } catch (error) {
    console.error('Failed to save navigation controls setting:', error);
    figma.notify('Failed to save navigation controls setting');
  }
}, ErrorType.STORAGE_ERROR);

const handleGetNavigationControlsSetting = withErrorBoundary(async () => {
  try {
    const enabled = await figma.clientStorage.getAsync('navigationControlsEnabled') ?? true;
    
    // Send current setting to UI
    figma.ui.postMessage({
      type: 'navigation-controls-setting',
      enabled: enabled
    });
  } catch (error) {
    console.error('Failed to load navigation controls setting:', error);
    // Default to enabled
    figma.ui.postMessage({
      type: 'navigation-controls-setting',
      enabled: true
    });
  }
}, ErrorType.STORAGE_ERROR);

// License management removed