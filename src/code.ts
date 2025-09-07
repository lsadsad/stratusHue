/// <reference types="@figma/plugin-typings" />

// Stratus Hue: A Figma plugin for layer tagging and navigation.
// Optimized modular architecture with error handling and performance

// ===== IMPORTS =====
import { debounce, addOrReplaceDateInLayerName, addOrReplaceDateInPageTitle } from './utils';
import {
  loadAnchorState,
  setUiWidth,
  setUiHeight,
  currentUiWidth,
  lastUiHeight,
  setPreviousSelection,
  getPreviousSelection,
  clearPreviousSelection,
  loadLicenseState,
  saveLicenseState,
  setLicenseKey,
  setLicenseValid,
  getLicenseState,
  shouldRevalidateLicense
} from './state';
import {
  addBookmark,
  removeBookmark,
  detectCurrentAnchorFromSelection,
  validateCurrentAnchor,
  validateRecentHistory,
  reorderBookmarks
} from './bookmarks';
import { jumpToBookmark, goBackInHistory, goForwardInHistory, addSelectionToHistory, addPageChangeToHistory, findNearestExistingSelectionEntryAnyDirection } from './navigation';
import {
  addEmojiToSelection,
  clearEmojiFromSelection,
  navigateEmojiSet
} from './emoji-manager';
import {
  sendInitialUIState,
  sendSelectionStateToUI,
  updateUIAfterNavigation,
  updateUIAfterEmojiChange,
  updateUIAfterBookmarkChange,
  resizeUI,
  toggleUIWidth,
  sendNavigationStateToUI
} from './ui-communication';
import {
  triggerValidationOnSelectionChange,
  triggerValidationOnPageChange
} from './validation';
import {
  handleError,
  withErrorBoundary,
  validateMessage,
  ErrorType
} from './error-handling';

// ===== PLUGIN INITIALIZATION =====
figma.showUI(__html__, { width: currentUiWidth, height: lastUiHeight });

const initializePlugin = withErrorBoundary(async () => {
  await loadAnchorState();
  await loadLicenseState();
  await validateRecentHistory();
  await validateCurrentAnchor();
  await sendInitialUIState();
  
  // Send initial license status to UI
  await handleGetLicenseStatus();
}, ErrorType.STORAGE_ERROR);

// ===== DEBOUNCED FUNCTIONS =====
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
  triggerValidationOnSelectionChange();
}, 100);

const debouncedPageChange = debounce(async () => {
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

      case 'open-url':
        if ('url' in msg && msg.url && typeof msg.url === 'string') {
          handleOpenUrl(msg.url);
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

      case 'validate-license':
        if ('licenseKey' in msg && msg.licenseKey && typeof msg.licenseKey === 'string') {
          await handleValidateLicense(msg.licenseKey);
        }
        break;

      case 'get-license-status':
        await handleGetLicenseStatus();
        break;

      case 'clear-license':
        await handleClearLicense();
        break;

      case 'license-validation-result':
        if ('success' in msg && 'licenseKey' in msg) {
          await handleLicenseValidationResult(msg);
        }
        break;

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
  const { updated, removed } = await (await import('./bookmarks')).validateAndSyncBookmarks();
  figma.notify(`Anchors resynced: ${updated} updated, ${removed} removed`);
  await updateUIAfterNavigation();
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

const handleOpenUrl = withErrorBoundary(async (url: string) => {
  try {
    // Use Figma's built-in method to open URLs
    figma.openExternal(url);
    figma.notify('Opening checkout page...');
  } catch (error) {
    console.error('Failed to open URL:', error);
    figma.notify('Failed to open URL');
  }
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
  const latestSelection = findNearestExistingSelectionEntryAnyDirection();

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

// ===== LICENSE MANAGEMENT HANDLERS =====
const handleValidateLicense = withErrorBoundary(async (licenseKey: string) => {
  try {
    // Store the license key
    setLicenseKey(licenseKey);
    
    // Send validation request to UI (which will handle the API call)
    figma.ui.postMessage({
      type: 'validate-license-request',
      licenseKey: licenseKey
    });
    
    figma.notify('Validating license...');
  } catch (error) {
    console.error('License validation error:', error);
    figma.notify('Failed to validate license');
    
    // Send error to UI
    figma.ui.postMessage({
      type: 'license-validation-result',
      success: false,
      error: 'Validation failed'
    });
  }
}, ErrorType.UNKNOWN);

const handleGetLicenseStatus = withErrorBoundary(async () => {
  await loadLicenseState();
  const state = getLicenseState();
  
  // Check if we should revalidate
  if (state.licenseKey && shouldRevalidateLicense()) {
    // Send revalidation request to UI
    figma.ui.postMessage({
      type: 'validate-license-request',
      licenseKey: state.licenseKey,
      isRevalidation: true
    });
  } else {
    // Send current status to UI
    figma.ui.postMessage({
      type: 'license-status',
      isValid: state.isValid,
      expiresAt: state.expiresAt,
      hasLicenseKey: !!state.licenseKey
    });
  }
}, ErrorType.UNKNOWN);

const handleClearLicense = withErrorBoundary(async () => {
  setLicenseKey(null);
  setLicenseValid(false);
  await saveLicenseState();
  
  figma.notify('License cleared');
  
  // Send updated status to UI
  figma.ui.postMessage({
    type: 'license-status',
    isValid: false,
    expiresAt: null,
    hasLicenseKey: false
  });
}, ErrorType.UNKNOWN);

const handleLicenseValidationResult = withErrorBoundary(async (msg: any) => {
  const { success, licenseKey, expiresAt, error, isRevalidation } = msg;
  
  if (success) {
    setLicenseKey(licenseKey);
    setLicenseValid(true, expiresAt);
    await saveLicenseState();
    
    if (!isRevalidation) {
      figma.notify('License validated successfully!');
    }
    
    // Send updated status to UI
    figma.ui.postMessage({
      type: 'license-status',
      isValid: true,
      expiresAt: expiresAt,
      hasLicenseKey: true
    });
  } else {
    setLicenseValid(false);
    await saveLicenseState();
    
    if (!isRevalidation) {
      figma.notify('License validation failed');
    }
    
    // Send error result to UI
    figma.ui.postMessage({
      type: 'license-validation-result',
      success: false,
      error: error || 'Invalid license key'
    });
  }
}, ErrorType.UNKNOWN);