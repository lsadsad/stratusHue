/// <reference types="@figma/plugin-typings" />

// stratusHue: A Figma plugin for layer tagging and navigation.
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
  navigateEmojiSet,
  addEmojiToSelectionRecursive,
  clearEmojiFromSelectionRecursive
} from './features/emoji-manager';
import {
  sendInitialUIState,
  sendSelectionStateToUI,
  updateUIAfterNavigation,
  updateUIAfterEmojiChange,
  updateUIAfterBookmarkChange,
  resizeUI,
  toggleUIWidth,
  sendNavigationStateToUI,
  sendBridgeSelectionEvent,
  sendBridgeDocumentEvent,
  sendBridgePageEvent,
} from './ui/ui-communication';
import {
  triggerValidationOnSelectionChange,
  triggerValidationOnPageChange,
  handleDocumentChange
} from './utils/validation';
import {
  handleError,
  withErrorBoundary,
  validateMessage,
  ErrorType
} from './core/error-handling';
import {
  loadPluginMode,
  persistPluginMode,
  getCurrentMode,
  persistLintSettings,
  loadLintSettings,
} from './core/lint-state';

/** Maximum node count for automatic scan on mode entry. Above this, show a manual-scan prompt. */
const AUTO_SCAN_NODE_LIMIT = 5000;

// Figma layer nodes have an 'expanded' property not in plugin typings.
type WithExpanded = { expanded: boolean };

// ===== BRIDGE =====
// Tracks whether the bridge client is enabled (loaded from clientStorage on init).
let bridgeEnabled = false;

// Intercept console.* in the sandbox and forward logs to the bridge UI for relay to MCP.
function installConsoleBridge(): void {
  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  function forwardLog(level: string, args: unknown[]): void {
    if (!bridgeEnabled) return;
    try {
      const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      figma.ui.postMessage({ type: 'bridge-console-log', level, message });
    } catch { /* ignore */ }
  }

  console.log = (...args: unknown[]) => { originalLog(...args); forwardLog('log', args); };
  console.warn = (...args: unknown[]) => { originalWarn(...args); forwardLog('warn', args); };
  console.error = (...args: unknown[]) => { originalError(...args); forwardLog('error', args); };
}

installConsoleBridge();

// ===== VIEWPORT ANIMATION =====
/**
 * Smoothly lerp the viewport to center on target nodes
 * @param nodes - The nodes to center on
 * @param duration - Animation duration in ms (default 200ms)
 */
function lerpViewportToNodes(nodes: readonly SceneNode[], duration = 200): void {
  if (nodes.length === 0) return;

  // Calculate the bounding box of all target nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
      const bounds = node.absoluteBoundingBox;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }
  }

  if (minX === Infinity) return; // No valid bounds found

  // Target center point
  const targetX = (minX + maxX) / 2;
  const targetY = (minY + maxY) / 2;

  // Current viewport center
  const startX = figma.viewport.center.x;
  const startY = figma.viewport.center.y;

  // Animation parameters
  const startTime = Date.now();
  const fps = 60;
  const frameInterval = 1000 / fps;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);

    // Interpolate position
    const currentX = startX + (targetX - startX) * eased;
    const currentY = startY + (targetY - startY) * eased;

    figma.viewport.center = { x: currentX, y: currentY };

    if (progress < 1) {
      setTimeout(animate, frameInterval);
    }
  }

  animate();
}

// ===== PLUGIN INITIALIZATION =====
figma.showUI(__html__, { width: currentUiWidth, height: lastUiHeight });

// Track if documentchange handler is registered
let documentChangeRegistered = false;

const initializePlugin = withErrorBoundary(async () => {
  // Load all pages first - required for documentchange event listener
  await figma.loadAllPagesAsync();
  
  // Register documentchange handler once after pages are loaded
  if (!documentChangeRegistered) {
    figma.on('documentchange', (event: DocumentChangeEvent) => {
      handleDocumentChange(event);
      if (bridgeEnabled) sendBridgeDocumentEvent();
    });
    documentChangeRegistered = true;
  }
  
  await loadAnchorState();
  await loadUISectionStates();
  await validateRecentHistory();
  await validateCurrentAnchor();
  await sendInitialUIState();
  sendStyledTextStateToUI();

  // Restore persisted plugin mode — UI will update tab strip accordingly.
  const restoredMode = await loadPluginMode();
  figma.ui.postMessage({ type: 'plugin-mode-restored', mode: restoredMode });

  // Restore bridge enabled state and pair code
  const storedBridgeEnabled = await figma.clientStorage.getAsync('bridgeEnabled') as boolean | undefined;
  const storedPairCode = await figma.clientStorage.getAsync('bridgePairCode') as string | undefined;
  bridgeEnabled = storedBridgeEnabled ?? false;
  figma.ui.postMessage({
    type: 'bridge-init',
    enabled: bridgeEnabled,
    pairCode: storedPairCode ?? '',
  });
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
  sendLayoutStateToUI();
  sendStyledTextStateToUI();

  // Send optimized navigation context updates with dedicated debounce
  debouncedNavigationContextUpdate();

  triggerValidationOnSelectionChange();

  // Broadcast to bridge clients when enabled
  if (bridgeEnabled) sendBridgeSelectionEvent();
}, 100);

const debouncedPageChange = debounce(async () => {
  // Clear navigation context cache when page changes
  const { clearNavigationContextCache } = await import('./ui/ui-communication');
  clearNavigationContextCache();

  await validateCurrentAnchor();
  await updateUIAfterNavigation();
  addPageChangeToHistory();
  triggerValidationOnPageChange();

  // Broadcast to bridge clients when enabled
  if (bridgeEnabled) sendBridgePageEvent();
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

      case 'add-emoji-recursive':
        if ('emoji' in msg && msg.emoji && typeof msg.emoji === 'string') {
          await handleAddEmojiRecursive(msg.emoji);
        }
        break;

      case 'clear-emoji-recursive':
        await handleClearEmojiRecursive();
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

      case 'export-plugin-data':
        await handleExportPluginData();
        break;

      case 'import-plugin-data':
        await handleImportPluginData();
        break;

      case 'deselect':
        figma.currentPage.selection = [];
        sendSelectionStateToUI();
        break;

      case 'nudge-elements':
        if ('direction' in msg && 'amount' in msg && 
            typeof msg.direction === 'string' && typeof msg.amount === 'number') {
          await handleNudgeElements(msg.direction as 'up' | 'down' | 'left' | 'right', msg.amount);
        }
        break;

      case 'resize-elements':
        if ('direction' in msg && 'amount' in msg && 
            typeof msg.direction === 'string' && typeof msg.amount === 'number') {
          await handleResizeElements(msg.direction as 'up' | 'down' | 'left' | 'right', msg.amount);
        }
        break;

      case 'duplicate-elements':
        if ('direction' in msg && 'amount' in msg && 
            typeof msg.direction === 'string' && typeof msg.amount === 'number') {
          await handleDuplicateElements(msg.direction as 'up' | 'down' | 'left' | 'right', msg.amount);
        }
        break;

      case 'reorder-layer':
        if ('direction' in msg && typeof msg.direction === 'string') {
          await handleReorderLayer(msg.direction as 'up' | 'down' | 'front' | 'back');
        }
        break;

      case 'zoom':
        if ('direction' in msg && typeof msg.direction === 'string') {
          await handleZoom(msg.direction as 'in' | 'out' | '100' | 'selection');
        }
        break;

      case 'delete-nodes':
        await handleDeleteNodes();
        break;

      case 'toggle-visibility':
        await handleToggleVisibility();
        break;

      case 'toggle-lock':
        await handleToggleLock();
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

      case 'clear-theme-storage': {
        const { ThemeStorage } = await import('./core/theme-storage');
        await ThemeStorage.clearThemeStorage();
        figma.ui.postMessage({
          type: 'theme-storage-cleared'
        });
        break;
      }

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

      case 'set-plugin-mode': {
        if ('mode' in msg && typeof msg.mode === 'string') {
          const mode = msg.mode;
          if (mode === 'navigate' || mode === 'lint' || mode === 'scaffold') {
            // Cancel any in-flight scan when leaving lint mode
            if (getCurrentMode() === 'lint' && mode !== 'lint') {
              const { cancelLintScan } = await import('./features/lint-engine');
              cancelLintScan();
            }
            await persistPluginMode(mode);
            if (mode === 'lint') {
              // Load settings to check scope before deciding whether to gate.
              // Selection and tagged scopes are inherently bounded, so the
              // large-file guard only applies to page scope.
              const lintSettings = await loadLintSettings();
              const lintScope = lintSettings.lintScope ?? 'selection';
              if (lintScope === 'page') {
                const nodeCount = figma.currentPage.findAll(() => true).length;
                if (nodeCount > AUTO_SCAN_NODE_LIMIT) {
                  figma.ui.postMessage({ type: 'lint-large-file', nodeCount });
                  break;
                }
              }
              const { runLintScan } = await import('./features/lint-engine');
              await runLintScan();
            }
          }
        }
        break;
      }

      case 'lint-run-scan': {
        const { runLintScan } = await import('./features/lint-engine');
        await runLintScan();
        break;
      }

      case 'lint-cancel-scan': {
        const { cancelLintScan } = await import('./features/lint-engine');
        cancelLintScan();
        break;
      }

      case 'lint-set-scope': {
        if ('scope' in msg && typeof msg.scope === 'string') {
          const scope = msg.scope;
          if (scope === 'selection' || scope === 'tagged' || scope === 'page') {
            await persistLintSettings({ lintScope: scope });
            const { runLintScan } = await import('./features/lint-engine');
            await runLintScan();
          }
        }
        break;
      }

      case 'lint-apply-fix': {
        if (
          'nodeId' in msg && typeof msg.nodeId === 'string' &&
          'category' in msg && typeof msg.category === 'string' &&
          'styleId' in msg && typeof msg.styleId === 'string'
        ) {
          const { applyLintFix } = await import('./features/lint-engine');
          const result = await applyLintFix(msg.nodeId, msg.category, msg.styleId);
          figma.notify(result.message, { error: !result.success });
          if (result.success) {
            const { runLintScan: reScan } = await import('./features/lint-engine');
            await reScan();
          }
        }
        break;
      }

      case 'lint-fix-all': {
        if ('fixes' in msg && Array.isArray(msg.fixes)) {
          const { runLintFixAll } = await import('./features/lint-engine');
          await runLintFixAll(msg.fixes as Array<{ nodeId: string; category: string; styleId: string }>);
        }
        break;
      }

      case 'lint-ignore-error': {
        if ('errorId' in msg && typeof msg.errorId === 'string') {
          const { addIgnoredError } = await import('./core/lint-state');
          await addIgnoredError(msg.errorId);
          figma.ui.postMessage({ type: 'lint-error-ignored', errorId: msg.errorId });
        }
        break;
      }

      case 'lint-ignore-all': {
        if ('errorIds' in msg && Array.isArray(msg.errorIds)) {
          const { addIgnoredError } = await import('./core/lint-state');
          for (const id of msg.errorIds as string[]) {
            await addIgnoredError(id);
          }
          figma.ui.postMessage({ type: 'lint-ignored-all', errorIds: msg.errorIds });
        }
        break;
      }

      case 'lint-select-all': {
        if ('nodeIds' in msg && Array.isArray(msg.nodeIds)) {
          const nodes: SceneNode[] = [];
          for (const id of msg.nodeIds as string[]) {
            const node = await figma.getNodeByIdAsync(id);
            if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
              nodes.push(node as SceneNode);
            }
          }
          if (nodes.length > 0) {
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
            figma.notify(`Selected ${nodes.length} node${nodes.length === 1 ? '' : 's'}`);
          }
        }
        break;
      }

      case 'lint-clear-ignored': {
        const { clearIgnoredErrors } = await import('./core/lint-state');
        await clearIgnoredErrors();
        const { runLintScan: reScan2 } = await import('./features/lint-engine');
        await reScan2();
        break;
      }

      case 'lint-select-node': {
        if ('nodeId' in msg && typeof msg.nodeId === 'string') {
          const node = await figma.getNodeByIdAsync(msg.nodeId);
          if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
            // Select the node (layer-panel visibility) then scroll to it.
            // Auto re-scans call runLintScan('auto'), which reuses the pinned
            // selection snapshot from the last user-initiated scan — so this
            // selection change does NOT alter the effective scan scope.
            figma.currentPage.selection = [node as SceneNode];
            figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
          }
        }
        break;
      }

      case 'lint-update-settings': {
        if ('settings' in msg && typeof msg.settings === 'object' && msg.settings !== null) {
          await persistLintSettings(msg.settings as Parameters<typeof persistLintSettings>[0]);
          // Re-scan to reflect the updated settings
          const { runLintScan: reScan3 } = await import('./features/lint-engine');
          await reScan3();
        }
        break;
      }

      case 'lint-get-settings': {
        const settings = await loadLintSettings();
        figma.ui.postMessage({ type: 'lint-settings-loaded', settings });
        break;
      }

      case 'toggle-controls':
        if ('enabled' in msg && typeof msg.enabled === 'boolean') {
          await handleToggleControls(msg.enabled);
        }
        break;

      case 'get-controls-setting':
        await handleGetControlsSetting();
        break;

      case 'set-controls-group-visibility':
        if ('groups' in msg && typeof msg.groups === 'object') {
          await handleSetControlsGroupVisibility(msg.groups as Record<string, boolean>);
        }
        break;

      case 'get-controls-group-settings':
        await handleGetControlsGroupSettings();
        break;

      case 'set-nudge-settings':
        if ('smallNudge' in msg && 'bigNudge' in msg) {
          await handleSetNudgeSettings(msg.smallNudge as number, msg.bigNudge as number);
        }
        break;

      case 'get-nudge-settings':
        await handleGetNudgeSettings();
        break;

      case 'cycle-layout-sizing':
        if ('axis' in msg && (msg.axis === 'horizontal' || msg.axis === 'vertical')) {
          await handleCycleLayoutSizing(msg.axis as 'horizontal' | 'vertical');
        }
        break;

      case 'paste-styled-text':
        if ('segments' in msg && Array.isArray(msg.segments)) {
          const replace = 'replaceSelected' in msg && !!(msg as Record<string, unknown>).replaceSelected;
          await handlePasteStyledText(msg.segments, replace);
        }
        break;

      case 'copy-styled-text':
        await handleCopyStyledText();
        break;

      case 'notify':
        if ('message' in msg && typeof (msg as Record<string, unknown>).message === 'string') {
          figma.notify((msg as Record<string, unknown>).message as string);
        }
        break;

      // Removed license management message handlers

      // === BRIDGE ===
      case 'bridge-set-enabled': {
        if ('enabled' in msg && typeof msg.enabled === 'boolean') {
          bridgeEnabled = msg.enabled;
          await figma.clientStorage.setAsync('bridgeEnabled', msg.enabled);
        }
        break;
      }

      case 'bridge-set-pair-code': {
        if ('pairCode' in msg && typeof msg.pairCode === 'string') {
          await figma.clientStorage.setAsync('bridgePairCode', msg.pairCode);
        }
        break;
      }

      case 'bridge-connected':
      case 'bridge-disconnected':
        // Informational — no sandbox action needed
        break;

      // ---- Bridge command dispatch ----
      // All bridge-cmd-* types are handled by lazy-importing bridge-handlers.ts.
      // The requestId is echoed in the BRIDGE_RESPONSE so the WS client can route
      // the reply back to the correct MCP request.

      case 'bridge-cmd-execute-code': {
        if ('requestId' in msg && 'code' in msg && typeof msg.requestId === 'string' && typeof msg.code === 'string') {
          const { handleBridgeExecuteCode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeExecuteCode(msg.requestId, msg.code);
        }
        break;
      }

      case 'bridge-cmd-get-variables': {
        if ('requestId' in msg && typeof msg.requestId === 'string') {
          const { handleBridgeGetVariables } = await import('./features/bridge/bridge-handlers');
          await handleBridgeGetVariables(msg.requestId);
        }
        break;
      }

      case 'bridge-cmd-refresh-variables': {
        if ('requestId' in msg && typeof msg.requestId === 'string') {
          const { handleBridgeGetVariables } = await import('./features/bridge/bridge-handlers');
          await handleBridgeGetVariables(msg.requestId);
        }
        break;
      }

      case 'bridge-cmd-update-variable': {
        if ('requestId' in msg && 'variableId' in msg && 'modeId' in msg && 'value' in msg &&
            typeof msg.requestId === 'string' && typeof msg.variableId === 'string' && typeof msg.modeId === 'string') {
          const { handleBridgeUpdateVariable } = await import('./features/bridge/bridge-handlers');
          await handleBridgeUpdateVariable(msg.requestId, msg.variableId, msg.modeId, msg.value);
        }
        break;
      }

      case 'bridge-cmd-create-variable': {
        if ('requestId' in msg && 'name' in msg && 'collectionId' in msg && 'resolvedType' in msg &&
            typeof msg.requestId === 'string' && typeof msg.name === 'string' &&
            typeof msg.collectionId === 'string' && typeof msg.resolvedType === 'string') {
          const { handleBridgeCreateVariable } = await import('./features/bridge/bridge-handlers');
          await handleBridgeCreateVariable(msg.requestId, msg.name, msg.collectionId,
            msg.resolvedType as VariableResolvedDataType,
            'options' in msg ? msg.options as Record<string, unknown> : undefined
          );
        }
        break;
      }

      case 'bridge-cmd-delete-variable': {
        if ('requestId' in msg && 'variableId' in msg &&
            typeof msg.requestId === 'string' && typeof msg.variableId === 'string') {
          const { handleBridgeDeleteVariable } = await import('./features/bridge/bridge-handlers');
          await handleBridgeDeleteVariable(msg.requestId, msg.variableId);
        }
        break;
      }

      case 'bridge-cmd-rename-variable': {
        if ('requestId' in msg && 'variableId' in msg && 'newName' in msg &&
            typeof msg.requestId === 'string' && typeof msg.variableId === 'string' && typeof msg.newName === 'string') {
          const { handleBridgeRenameVariable } = await import('./features/bridge/bridge-handlers');
          await handleBridgeRenameVariable(msg.requestId, msg.variableId, msg.newName);
        }
        break;
      }

      case 'bridge-cmd-create-variable-collection': {
        if ('requestId' in msg && 'name' in msg &&
            typeof msg.requestId === 'string' && typeof msg.name === 'string') {
          const { handleBridgeCreateVariableCollection } = await import('./features/bridge/bridge-handlers');
          await handleBridgeCreateVariableCollection(msg.requestId, msg.name,
            'options' in msg ? msg.options as Record<string, unknown> : undefined
          );
        }
        break;
      }

      case 'bridge-cmd-delete-variable-collection': {
        if ('requestId' in msg && 'collectionId' in msg &&
            typeof msg.requestId === 'string' && typeof msg.collectionId === 'string') {
          const { handleBridgeDeleteVariableCollection } = await import('./features/bridge/bridge-handlers');
          await handleBridgeDeleteVariableCollection(msg.requestId, msg.collectionId);
        }
        break;
      }

      case 'bridge-cmd-add-mode': {
        if ('requestId' in msg && 'collectionId' in msg && 'modeName' in msg &&
            typeof msg.requestId === 'string' && typeof msg.collectionId === 'string' && typeof msg.modeName === 'string') {
          const { handleBridgeAddMode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeAddMode(msg.requestId, msg.collectionId, msg.modeName);
        }
        break;
      }

      case 'bridge-cmd-rename-mode': {
        if ('requestId' in msg && 'collectionId' in msg && 'modeId' in msg && 'newName' in msg &&
            typeof msg.requestId === 'string' && typeof msg.collectionId === 'string' &&
            typeof msg.modeId === 'string' && typeof msg.newName === 'string') {
          const { handleBridgeRenameMode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeRenameMode(msg.requestId, msg.collectionId, msg.modeId, msg.newName);
        }
        break;
      }

      case 'bridge-cmd-get-component': {
        if ('requestId' in msg && 'nodeId' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
          const { handleBridgeGetComponent } = await import('./features/bridge/bridge-handlers');
          await handleBridgeGetComponent(msg.requestId, msg.nodeId);
        }
        break;
      }

      case 'bridge-cmd-get-local-components': {
        if ('requestId' in msg && typeof msg.requestId === 'string') {
          const { handleBridgeGetLocalComponents } = await import('./features/bridge/bridge-handlers');
          await handleBridgeGetLocalComponents(msg.requestId);
        }
        break;
      }

      case 'bridge-cmd-instantiate-component': {
        if ('requestId' in msg && 'componentKey' in msg &&
            typeof msg.requestId === 'string' && typeof msg.componentKey === 'string') {
          const { handleBridgeInstantiateComponent } = await import('./features/bridge/bridge-handlers');
          await handleBridgeInstantiateComponent(msg.requestId, msg.componentKey,
            'options' in msg ? msg.options as Record<string, unknown> : undefined
          );
        }
        break;
      }

      case 'bridge-cmd-get-metadata': {
        if ('requestId' in msg && 'nodeId' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
          const { handleBridgeGetMetadata } = await import('./features/bridge/bridge-handlers');
          await handleBridgeGetMetadata(msg.requestId, msg.nodeId);
        }
        break;
      }

      case 'bridge-cmd-resize-node': {
        if ('requestId' in msg && 'nodeId' in msg && 'width' in msg && 'height' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' &&
            typeof msg.width === 'number' && typeof msg.height === 'number') {
          const { handleBridgeResizeNode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeResizeNode(msg.requestId, msg.nodeId, msg.width, msg.height,
            'withConstraints' in msg ? !!(msg.withConstraints) : true
          );
        }
        break;
      }

      case 'bridge-cmd-move-node': {
        if ('requestId' in msg && 'nodeId' in msg && 'x' in msg && 'y' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' &&
            typeof msg.x === 'number' && typeof msg.y === 'number') {
          const { handleBridgeMoveNode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeMoveNode(msg.requestId, msg.nodeId, msg.x, msg.y);
        }
        break;
      }

      case 'bridge-cmd-set-node-fills': {
        if ('requestId' in msg && 'nodeId' in msg && 'fills' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && Array.isArray(msg.fills)) {
          const { handleBridgeSetNodeFills } = await import('./features/bridge/bridge-handlers');
          await handleBridgeSetNodeFills(msg.requestId, msg.nodeId, msg.fills as Array<{ type: 'SOLID'; color: string; opacity?: number }>);
        }
        break;
      }

      case 'bridge-cmd-set-node-strokes': {
        if ('requestId' in msg && 'nodeId' in msg && 'strokes' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && Array.isArray(msg.strokes)) {
          const { handleBridgeSetNodeStrokes } = await import('./features/bridge/bridge-handlers');
          await handleBridgeSetNodeStrokes(msg.requestId, msg.nodeId,
            msg.strokes as Array<{ type: 'SOLID'; color: string; opacity?: number }>,
            'strokeWeight' in msg && typeof msg.strokeWeight === 'number' ? msg.strokeWeight : undefined
          );
        }
        break;
      }

      case 'bridge-cmd-clone-node': {
        if ('requestId' in msg && 'nodeId' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
          const { handleBridgeCloneNode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeCloneNode(msg.requestId, msg.nodeId);
        }
        break;
      }

      case 'bridge-cmd-delete-node': {
        if ('requestId' in msg && 'nodeId' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string') {
          const { handleBridgeDeleteNode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeDeleteNode(msg.requestId, msg.nodeId);
        }
        break;
      }

      case 'bridge-cmd-rename-node': {
        if ('requestId' in msg && 'nodeId' in msg && 'newName' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && typeof msg.newName === 'string') {
          const { handleBridgeRenameNode } = await import('./features/bridge/bridge-handlers');
          await handleBridgeRenameNode(msg.requestId, msg.nodeId, msg.newName);
        }
        break;
      }

      case 'bridge-cmd-set-text': {
        if ('requestId' in msg && 'nodeId' in msg && 'text' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && typeof msg.text === 'string') {
          const { handleBridgeSetText } = await import('./features/bridge/bridge-handlers');
          await handleBridgeSetText(msg.requestId, msg.nodeId, msg.text,
            'fontSize' in msg && typeof msg.fontSize === 'number' ? msg.fontSize : undefined
          );
        }
        break;
      }

      case 'bridge-cmd-create-child': {
        if ('requestId' in msg && 'parentId' in msg && 'nodeType' in msg &&
            typeof msg.requestId === 'string' && typeof msg.parentId === 'string' && typeof msg.nodeType === 'string') {
          const { handleBridgeCreateChild } = await import('./features/bridge/bridge-handlers');
          await handleBridgeCreateChild(msg.requestId, msg.parentId,
            msg.nodeType as 'RECTANGLE' | 'ELLIPSE' | 'FRAME' | 'TEXT' | 'LINE',
            'properties' in msg ? msg.properties as Record<string, unknown> : undefined
          );
        }
        break;
      }

      case 'bridge-cmd-set-node-description': {
        if ('requestId' in msg && 'nodeId' in msg && 'description' in msg &&
            typeof msg.requestId === 'string' && typeof msg.nodeId === 'string' && typeof msg.description === 'string') {
          const { handleBridgeSetNodeDescription } = await import('./features/bridge/bridge-handlers');
          await handleBridgeSetNodeDescription(msg.requestId, msg.nodeId, msg.description,
            'descriptionMarkdown' in msg && typeof msg.descriptionMarkdown === 'string' ? msg.descriptionMarkdown : undefined
          );
        }
        break;
      }

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

const handleAddEmojiRecursive = withErrorBoundary(async (emoji: string) => {
  const result = await addEmojiToSelectionRecursive(emoji);
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleClearEmojiRecursive = withErrorBoundary(async () => {
  const result = await clearEmojiFromSelectionRecursive();
  figma.notify(result.message);
  if (result.success) {
    updateUIAfterEmojiChange();
  }
}, ErrorType.UNKNOWN);

const handleNudgeElements = withErrorBoundary(async (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return;
  }

  // Separate nodes into auto-layout children and regular nodes
  const autoLayoutNodes: { node: SceneNode; parent: FrameNode | ComponentNode | InstanceNode; layoutMode: 'HORIZONTAL' | 'VERTICAL' }[] = [];
  const regularNodes: SceneNode[] = [];

  for (const node of selection) {
    const parent = node.parent;
    // Check if parent is an auto-layout frame
    if (parent && 'layoutMode' in parent && (parent.layoutMode === 'HORIZONTAL' || parent.layoutMode === 'VERTICAL')) {
      autoLayoutNodes.push({
        node,
        parent: parent as FrameNode | ComponentNode | InstanceNode,
        layoutMode: parent.layoutMode
      });
    } else if ('x' in node && 'y' in node) {
      regularNodes.push(node);
    }
  }

  // Handle auto-layout nodes: reorder within parent
  if (autoLayoutNodes.length > 0) {
    // Group by parent to handle multi-selection correctly
    const nodesByParent = new Map<BaseNode, typeof autoLayoutNodes>();
    for (const item of autoLayoutNodes) {
      if (!nodesByParent.has(item.parent)) {
        nodesByParent.set(item.parent, []);
      }
      nodesByParent.get(item.parent)!.push(item);
    }

    let movedCount = 0;

    for (const [parent, items] of nodesByParent) {
      const containerParent = parent as ChildrenMixin;
      const layoutMode = items[0].layoutMode;

      // Determine if the direction matches the layout axis
      // Horizontal layout: left/right moves within the layout
      // Vertical layout: up/down moves within the layout
      const isAlongAxis = (layoutMode === 'HORIZONTAL' && (direction === 'left' || direction === 'right')) ||
                          (layoutMode === 'VERTICAL' && (direction === 'up' || direction === 'down'));

      if (!isAlongAxis) {
        // Direction doesn't match layout axis - skip these nodes
        continue;
      }

      // Determine if moving forward or backward in the children array
      // In Figma auto-layout:
      // - Horizontal: index 0 is leftmost, higher index is rightmost
      // - Vertical: index 0 is topmost, higher index is bottommost
      const moveForward = direction === 'right' || direction === 'down';

      // Sort nodes by current index
      // When moving forward: process from highest index first
      // When moving backward: process from lowest index first
      const sortedItems = [...items].sort((a, b) => {
        const indexA = containerParent.children.indexOf(a.node);
        const indexB = containerParent.children.indexOf(b.node);
        return moveForward ? indexB - indexA : indexA - indexB;
      });

      for (const item of sortedItems) {
        const currentIndex = containerParent.children.indexOf(item.node);
        if (currentIndex === -1) continue;

        const siblingCount = containerParent.children.length;

        if (moveForward) {
          // Move to higher index (right/down in the layout)
          if (currentIndex < siblingCount - 1) {
            containerParent.insertChild(currentIndex + 2, item.node);
            movedCount++;
          }
        } else {
          // Move to lower index (left/up in the layout)
          if (currentIndex > 0) {
            containerParent.insertChild(currentIndex - 1, item.node);
            movedCount++;
          }
        }
      }
    }

    if (movedCount > 0) {
      const directionName = direction === 'up' ? 'up' : direction === 'down' ? 'down' : direction === 'left' ? 'left' : 'right';
      figma.notify(`Moved ${movedCount} layer${movedCount === 1 ? '' : 's'} ${directionName} in auto-layout`);
    }
  }

  // Handle regular nodes: nudge position
  for (const node of regularNodes) {
    if ('x' in node && 'y' in node) {
      switch (direction) {
        case 'up':
          node.y -= amount;
          break;
        case 'down':
          node.y += amount;
          break;
        case 'left':
          node.x -= amount;
          break;
        case 'right':
          node.x += amount;
          break;
      }
    }
  }
}, ErrorType.UNKNOWN);

const handleResizeElements = withErrorBoundary(async (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    return;
  }

  for (const node of selection) {
    // Only resize nodes that have width and height properties and support resize
    if ('resize' in node && typeof (node as SceneNode & { resize?: unknown }).resize === 'function') {
      const resizableNode = node as SceneNode & { resize: (width: number, height: number) => void; width: number; height: number };
      let newWidth = resizableNode.width;
      let newHeight = resizableNode.height;

      switch (direction) {
        case 'up':
          // Decrease height (minimum 1px)
          newHeight = Math.max(1, newHeight - amount);
          break;
        case 'down':
          // Increase height
          newHeight = newHeight + amount;
          break;
        case 'left':
          // Decrease width (minimum 1px)
          newWidth = Math.max(1, newWidth - amount);
          break;
        case 'right':
          // Increase width
          newWidth = newWidth + amount;
          break;
      }

      resizableNode.resize(newWidth, newHeight);
    }
  }
}, ErrorType.UNKNOWN);

const handleDuplicateElements = withErrorBoundary(async (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    return;
  }

  const duplicatedNodes: SceneNode[] = [];

  for (const node of selection) {
    // Clone the node
    const clone = node.clone();
    
    // Position the clone based on direction
    if ('x' in clone && 'y' in clone) {
      switch (direction) {
        case 'up':
          clone.y = node.y - amount;
          break;
        case 'down':
          clone.y = node.y + amount;
          break;
        case 'left':
          clone.x = node.x - amount;
          break;
        case 'right':
          clone.x = node.x + amount;
          break;
      }
    }
    
    duplicatedNodes.push(clone);
  }

  // Select the duplicated nodes
  if (duplicatedNodes.length > 0) {
    figma.currentPage.selection = duplicatedNodes;
  }
}, ErrorType.UNKNOWN);

const handleReorderLayer = withErrorBoundary(async (direction: 'up' | 'down' | 'front' | 'back') => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return;
  }

  let movedCount = 0;

  // Group nodes by parent to handle multi-selection correctly
  const nodesByParent = new Map<BaseNode, SceneNode[]>();
  for (const node of selection) {
    const parent = node.parent;
    if (!parent || !('children' in parent)) continue;

    if (!nodesByParent.has(parent)) {
      nodesByParent.set(parent, []);
    }
    nodesByParent.get(parent)!.push(node);
  }

  // Process each parent's nodes
  for (const [parent, nodes] of nodesByParent) {
    const containerParent = parent as ChildrenMixin;

    // Sort nodes by their current index in the parent
    // For 'up' and 'front': process from highest index to lowest (so earlier moves don't affect later ones)
    // For 'down' and 'back': process from lowest index to highest
    const sortedNodes = [...nodes].sort((a, b) => {
      const indexA = containerParent.children.indexOf(a);
      const indexB = containerParent.children.indexOf(b);
      if (direction === 'up' || direction === 'front') {
        return indexB - indexA; // Highest index first
      } else {
        return indexA - indexB; // Lowest index first
      }
    });

    for (const node of sortedNodes) {
      // Re-fetch current index since array may have changed
      const currentIndex = containerParent.children.indexOf(node);
      if (currentIndex === -1) continue;

      const siblingCount = containerParent.children.length;

      switch (direction) {
        case 'up':
          // Bring forward (higher index = visually on top)
          if (currentIndex < siblingCount - 1) {
            containerParent.insertChild(currentIndex + 2, node);
            movedCount++;
          }
          break;
        case 'down':
          // Send backward (lower index = visually behind)
          if (currentIndex > 0) {
            containerParent.insertChild(currentIndex - 1, node);
            movedCount++;
          }
          break;
        case 'front':
          // Bring to front (highest index)
          if (currentIndex < siblingCount - 1) {
            containerParent.insertChild(siblingCount, node);
            movedCount++;
          }
          break;
        case 'back':
          // Send to back (index 0)
          if (currentIndex > 0) {
            containerParent.insertChild(0, node);
            movedCount++;
          }
          break;
      }
    }
  }

  if (movedCount > 0) {
    const actionName = direction === 'up' ? 'Brought forward' :
                       direction === 'down' ? 'Sent backward' :
                       direction === 'front' ? 'Brought to front' : 'Sent to back';
    figma.notify(`${actionName} ${movedCount} layer${movedCount === 1 ? '' : 's'}`);
  }
}, ErrorType.UNKNOWN);

const handleZoom = withErrorBoundary(async (direction: 'in' | 'out' | '100' | 'selection') => {
  const selection = figma.currentPage.selection;
  const currentZoom = figma.viewport.zoom;
  const zoomFactor = 1.2; // 20% zoom change
  
  // Handle zoom to selection (mimics Shift+2)
  if (direction === 'selection') {
    if (selection.length === 0) {
      // When nothing is selected, zoom to all content on the page (like Shift+2)
      const allNodes = figma.currentPage.children.filter(node => {
        try {
          return 'visible' in node && node.visible;
        } catch {
          return false;
        }
      }) as SceneNode[];
      
      if (allNodes.length > 0) {
        figma.viewport.scrollAndZoomIntoView(allNodes);
        figma.notify('Zoomed to fit all page content');
      } else {
        figma.notify('No visible content on page');
      }
      return;
    }
    
    // Filter to only visible, valid nodes
    const validNodes = selection.filter(node => {
      try {
        return 'visible' in node && node.visible;
      } catch {
        return false;
      }
    }) as SceneNode[];
    
    if (validNodes.length > 0) {
      // Zoom to fit selected nodes in view
      figma.viewport.scrollAndZoomIntoView(validNodes);
      figma.notify(`Zoomed to ${validNodes.length} selected element${validNodes.length === 1 ? '' : 's'}`);
    } else {
      figma.notify('Selected elements are not visible');
    }
    return;
  }
  
  // If there are selected nodes, scroll to them first to prioritize them
  if (selection.length > 0) {
    // Filter to only visible, valid nodes
    const validNodes = selection.filter(node => {
      try {
        return 'visible' in node && node.visible;
      } catch {
        return false;
      }
    }) as SceneNode[];
    
    if (validNodes.length > 0) {
      // Scroll to center on selected nodes first
      figma.viewport.scrollAndZoomIntoView(validNodes);
      // Restore current zoom since scrollAndZoomIntoView may have changed it
      figma.viewport.zoom = currentZoom;
    }
  }
  
  // Apply the zoom change (will zoom around current viewport center, which is now centered on selected nodes)
  if (direction === 'in') {
    figma.viewport.zoom = currentZoom * zoomFactor;
  } else if (direction === 'out') {
    figma.viewport.zoom = currentZoom / zoomFactor;
  } else if (direction === '100') {
    figma.viewport.zoom = 1.0; // Reset to 100%
  }
}, ErrorType.UNKNOWN);

const handleDeleteNodes = withErrorBoundary(async () => {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.notify('Please select at least one node to delete');
    return;
  }

  const count = selection.length;
  
  // Delete all selected nodes
  for (const node of selection) {
    node.remove();
  }
  
  // Clear selection after deletion
  figma.currentPage.selection = [];
  
  figma.notify(`Deleted ${count} node${count === 1 ? '' : 's'}`);
  
  // Update UI state
  sendSelectionStateToUI();
  sendNavigationStateToUI();
}, ErrorType.UNKNOWN);

const handleToggleVisibility = withErrorBoundary(async () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify('Please select at least one layer');
    return;
  }

  let hiddenCount = 0;
  let shownCount = 0;

  for (const node of selection) {
    if ('visible' in node) {
      if (node.visible) {
        node.visible = false;
        hiddenCount++;
      } else {
        node.visible = true;
        shownCount++;
      }
    }
  }

  if (hiddenCount > 0 && shownCount > 0) {
    figma.notify(`Toggled visibility: ${hiddenCount} hidden, ${shownCount} shown`);
  } else if (hiddenCount > 0) {
    figma.notify(`Hidden ${hiddenCount} layer${hiddenCount === 1 ? '' : 's'}`);
  } else if (shownCount > 0) {
    figma.notify(`Shown ${shownCount} layer${shownCount === 1 ? '' : 's'}`);
  }

  sendSelectionStateToUI();
}, ErrorType.UNKNOWN);

const handleToggleLock = withErrorBoundary(async () => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify('Please select at least one layer');
    return;
  }

  let lockedCount = 0;
  let unlockedCount = 0;

  for (const node of selection) {
    if ('locked' in node) {
      if (node.locked) {
        node.locked = false;
        unlockedCount++;
      } else {
        node.locked = true;
        lockedCount++;
      }
    }
  }

  if (lockedCount > 0 && unlockedCount > 0) {
    figma.notify(`Toggled lock: ${lockedCount} locked, ${unlockedCount} unlocked`);
  } else if (lockedCount > 0) {
    figma.notify(`Locked ${lockedCount} layer${lockedCount === 1 ? '' : 's'}`);
  } else if (unlockedCount > 0) {
    figma.notify(`Unlocked ${unlockedCount} layer${unlockedCount === 1 ? '' : 's'}`);
  }

  sendSelectionStateToUI();
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

const handleExportPluginData = withErrorBoundary(async () => {
  await (await import('./core/migration')).exportPluginDataToShared();
  await sendInitialUIState();
}, ErrorType.STORAGE_ERROR);

const handleImportPluginData = withErrorBoundary(async () => {
  await (await import('./core/migration')).importPluginDataFromShared();
  // Reload all states after import
  await loadAnchorState();
  await loadUISectionStates();
  await sendInitialUIState();
}, ErrorType.STORAGE_ERROR);

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
        const oldName = (node as SceneNode & { name: string }).name;
        const newName = addOrReplaceDateInLayerName(oldName);
        if (newName !== oldName) {
          (node as SceneNode & { name: string }).name = newName;
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
      if (selection.length === 0) {
        // Handle page entry when no layers are selected
        result = await LayerNavigationHandler.handleEmptySelection('enter');
      } else if (selection.length === 1) {
        // Handle single container entry
        result = LayerNavigationHandler.enterContainer(selection[0]);
      } else {
        // Handle multiple container entry
        result = LayerNavigationHandler.enterMultipleContainers(selection);
      }
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
        // Handle multiple selection navigation - focus on first item
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

    case 'goto-main-component':
      if (selection.length === 0) {
        figma.notify('Please select a component instance');
        return;
      }
      result = await LayerNavigationHandler.gotoMainComponent(selection);
      break;

    default:
      figma.notify('Unknown navigation action');
      return;
  }

  // Apply the navigation result
  if (result.success) {
    const isSiblingAction = action === 'next-sibling' || action === 'prev-sibling';
    const isEnterAction = action === 'enter';
    const isSingleEnter = isEnterAction && figma.currentPage.selection.length === 1;
    const _isMultipleEnter = isEnterAction && figma.currentPage.selection.length > 1;
    
    // Sibling actions and single selection Enter need expansion prevention
    // Multiple selection Enter should NOT have expansion prevention (containers should expand)
    const needsExpansionControl = isSiblingAction || isSingleEnter;

    if (result.newSelection) {
      // For navigation actions that should preserve expansion states
      const nodesToRestore: Array<{ node: SceneNode & WithExpanded, wasExpanded: boolean }> = [];

      if (needsExpansionControl && result.newSelection.length > 0) {
        if (isSingleEnter) {
          // Single Enter: prevent expansion of selected children (container children)
          result.newSelection.forEach(child => {
            if ('expanded' in child) {
              nodesToRestore.push({
                node: child as SceneNode & WithExpanded,
                wasExpanded: (child as SceneNode & WithExpanded).expanded
              });
            }
          });
        } else if (isSiblingAction) {
          // Sibling action: prevent expansion of the selected node and its parents
          const selectedNode = result.newSelection[0];

          if ('expanded' in selectedNode) {
            nodesToRestore.push({
              node: selectedNode as SceneNode & WithExpanded,
              wasExpanded: (selectedNode as SceneNode & WithExpanded).expanded
            });
          }

          let currentParent = selectedNode.parent;
          while (currentParent && currentParent.type !== 'PAGE') {
            if ('expanded' in currentParent) {
              nodesToRestore.push({
                node: currentParent as SceneNode & WithExpanded,
                wasExpanded: (currentParent as SceneNode & WithExpanded).expanded
              });
            }
            currentParent = currentParent.parent;
          }
        }
      }

      // Change selection (this may trigger auto-expansion)
      figma.currentPage.selection = result.newSelection as SceneNode[];

      // Restore expansion states after selection change
      if (needsExpansionControl && nodesToRestore.length > 0) {
        setTimeout(() => {
          nodesToRestore.forEach(({ node, wasExpanded }) => {
            if (node && 'expanded' in node) {
              node.expanded = wasExpanded;
            }
          });
        }, 0);
      }
    }

    // Only move the camera for sibling navigation actions (with smooth lerp)
    if (result.viewportUpdate && result.newSelection && result.newSelection.length > 0) {
      const isSiblingNavigation = action === 'prev-sibling' || action === 'next-sibling';
      if (isSiblingNavigation) {
        lerpViewportToNodes(result.newSelection as SceneNode[], 150);
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

const handleToggleControls = withErrorBoundary(async (enabled: boolean) => {
  // Store controls setting in plugin storage
  try {
    await figma.clientStorage.setAsync('controlsEnabled', enabled);

    // Send updated setting to UI
    figma.ui.postMessage({
      type: 'controls-setting',
      enabled: enabled
    });

    figma.notify(enabled ? 'Controls enabled' : 'Controls disabled');
  } catch (error) {
    console.error('Failed to save controls setting:', error);
    figma.notify('Failed to save controls setting');
  }
}, ErrorType.STORAGE_ERROR);

const handleGetControlsSetting = withErrorBoundary(async () => {
  try {
    const enabled = await figma.clientStorage.getAsync('controlsEnabled') ?? true;

    // Send current setting to UI
    figma.ui.postMessage({
      type: 'controls-setting',
      enabled: enabled
    });
  } catch (error) {
    console.error('Failed to load controls setting:', error);
    // Default to enabled
    figma.ui.postMessage({
      type: 'controls-setting',
      enabled: true
    });
  }
}, ErrorType.STORAGE_ERROR);

const handleSetControlsGroupVisibility = withErrorBoundary(async (groups: Record<string, boolean>) => {
  try {
    const defaultGroups = { movementZoom: true, hierarchy: true, sizingModes: true, styledText: false };
    const validated = {
      movementZoom: typeof groups.movementZoom === 'boolean' ? groups.movementZoom : defaultGroups.movementZoom,
      hierarchy: typeof groups.hierarchy === 'boolean' ? groups.hierarchy : defaultGroups.hierarchy,
      sizingModes: typeof groups.sizingModes === 'boolean' ? groups.sizingModes : defaultGroups.sizingModes,
      styledText: typeof groups.styledText === 'boolean' ? groups.styledText : defaultGroups.styledText
    };

    await figma.clientStorage.setAsync('controlsGroupVisibility', validated);

    figma.ui.postMessage({
      type: 'controls-group-settings',
      groups: validated
    });
  } catch (error) {
    console.error('Failed to save controls group visibility:', error);
  }
}, ErrorType.STORAGE_ERROR);

const handleGetControlsGroupSettings = withErrorBoundary(async () => {
  try {
    const stored = await figma.clientStorage.getAsync('controlsGroupVisibility') ?? {};
    const groups = {
      movementZoom: stored.movementZoom ?? true,
      hierarchy: stored.hierarchy ?? true,
      sizingModes: stored.sizingModes ?? true,
      styledText: stored.styledText ?? false
    };

    figma.ui.postMessage({
      type: 'controls-group-settings',
      groups
    });
  } catch (error) {
    console.error('Failed to load controls group settings:', error);
    figma.ui.postMessage({
      type: 'controls-group-settings',
      groups: { movementZoom: true, hierarchy: true, sizingModes: true, styledText: false }
    });
  }
}, ErrorType.STORAGE_ERROR);

const handleSetNudgeSettings = withErrorBoundary(async (smallNudge: number, bigNudge: number) => {
  try {
    // Validate and clamp values
    const validSmall = Math.max(1, Math.min(100, Math.round(smallNudge)));
    const validBig = Math.max(1, Math.min(100, Math.round(bigNudge)));

    await figma.clientStorage.setAsync('nudgeSettings', { smallNudge: validSmall, bigNudge: validBig });

    // Send updated settings to UI
    figma.ui.postMessage({
      type: 'nudge-settings',
      smallNudge: validSmall,
      bigNudge: validBig
    });
  } catch (error) {
    console.error('Failed to save nudge settings:', error);
    figma.notify('Failed to save nudge settings');
  }
}, ErrorType.STORAGE_ERROR);

const handleGetNudgeSettings = withErrorBoundary(async () => {
  try {
    const settings = await figma.clientStorage.getAsync('nudgeSettings') as { smallNudge: number; bigNudge: number } | undefined;

    // Send current settings to UI (default: 1 and 8)
    figma.ui.postMessage({
      type: 'nudge-settings',
      smallNudge: settings?.smallNudge ?? 1,
      bigNudge: settings?.bigNudge ?? 8
    });
  } catch (error) {
    console.error('Failed to load nudge settings:', error);
    // Default values
    figma.ui.postMessage({
      type: 'nudge-settings',
      smallNudge: 1,
      bigNudge: 8
    });
  }
}, ErrorType.STORAGE_ERROR);

// ===== STYLED TEXT HANDLERS =====

function sendStyledTextStateToUI(): void {
  const sel = figma.currentPage.selection;
  const hasTextNode = sel.length > 0 && sel.every(n => n.type === 'TEXT');
  figma.ui.postMessage({ type: 'update-styled-text-state', hasTextNode });
}

interface StyledTextSegment {
  characters: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  link?: string;
}

const handlePasteStyledText = withErrorBoundary(async (segments: StyledTextSegment[], replaceSelected: boolean) => {
  if (segments.length === 0) {
    figma.notify('No text found in clipboard');
    return;
  }

  const fullText = segments.map(s => s.characters).join('');

  // Collect unique font variants needed
  const fontVariants = new Set<string>();
  for (const seg of segments) {
    const bold = seg.bold ?? false;
    const italic = seg.italic ?? false;
    const style = bold && italic ? 'Bold Italic' : bold ? 'Bold' : italic ? 'Italic' : 'Regular';
    fontVariants.add(style);
  }

  const family = 'Inter';
  const fontsToLoad = Array.from(fontVariants).map(style => ({ family, style }));

  try {
    await Promise.all(fontsToLoad.map(f => figma.loadFontAsync(f)));
  } catch (_e) {
    figma.notify('Could not load fonts — check that Inter is available');
    return;
  }

  let targetNode: TextNode;

  if (replaceSelected) {
    const sel = figma.currentPage.selection;
    if (sel.length === 1 && sel[0].type === 'TEXT') {
      targetNode = sel[0] as TextNode;
      targetNode.fontName = { family, style: 'Regular' };
    } else {
      // Fallback: create new node
      targetNode = figma.createText();
      targetNode.fontName = { family, style: 'Regular' };
      targetNode.x = figma.viewport.center.x - 100;
      targetNode.y = figma.viewport.center.y - 20;
      figma.currentPage.appendChild(targetNode);
    }
  } else {
    targetNode = figma.createText();
    targetNode.fontName = { family, style: 'Regular' };
    targetNode.x = figma.viewport.center.x - 100;
    targetNode.y = figma.viewport.center.y - 20;
    figma.currentPage.appendChild(targetNode);
  }

  targetNode.characters = fullText;

  // Apply per-range styles
  let offset = 0;
  for (const seg of segments) {
    const start = offset;
    const end = offset + seg.characters.length;
    offset = end;

    if (start >= end) continue;

    const bold = seg.bold ?? false;
    const italic = seg.italic ?? false;
    const style = bold && italic ? 'Bold Italic' : bold ? 'Bold' : italic ? 'Italic' : 'Regular';
    targetNode.setRangeFontName(start, end, { family, style });

    if (seg.fontSize) {
      targetNode.setRangeFontSize(start, end, seg.fontSize);
    }
    if (seg.color) {
      targetNode.setRangeFills(start, end, [{ type: 'SOLID', color: seg.color }]);
    }
    if (seg.underline) {
      targetNode.setRangeTextDecoration(start, end, 'UNDERLINE');
    }
    if (seg.link) {
      try {
        targetNode.setRangeHyperlink(start, end, { type: 'URL', value: seg.link });
      } catch (_e) {
        // Ignore invalid URLs
      }
    }
  }

  figma.currentPage.selection = [targetNode];
  figma.viewport.scrollAndZoomIntoView([targetNode]);
  figma.notify('Styled text pasted');
}, ErrorType.UNKNOWN);

const handleCopyStyledText = withErrorBoundary(async () => {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1 || sel[0].type !== 'TEXT') {
    figma.notify('Select a single text layer to copy');
    return;
  }

  const node = sel[0] as TextNode;
  const segments = node.getStyledTextSegments(['fontName', 'fills', 'fontSize', 'textDecoration', 'hyperlink']);

  let html = '';
  for (const seg of segments) {
    const text = seg.characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    const bold = (seg.fontName as FontName).style.includes('Bold');
    const italic = (seg.fontName as FontName).style.includes('Italic');
    const underline = seg.textDecoration === 'UNDERLINE';
    const fill = (seg.fills as Paint[]).find(f => f.type === 'SOLID') as SolidPaint | undefined;
    const link = seg.hyperlink?.type === 'URL' ? seg.hyperlink.value : undefined;

    const styles: string[] = [];
    if (fill) {
      const { r, g, b } = fill.color;
      styles.push(`color: rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`);
    }
    if ((seg.fontSize as number) !== 14) {
      styles.push(`font-size: ${seg.fontSize}px`);
    }

    let open = '';
    let close = '';
    if (link) { open += `<a href="${link}">`; close = `</a>${close}`; }
    if (bold && italic) { open += '<strong><em>'; close = `</em></strong>${close}`; }
    else if (bold) { open += '<strong>'; close = `</strong>${close}`; }
    else if (italic) { open += '<em>'; close = `</em>${close}`; }
    if (underline) { open += '<u>'; close = `</u>${close}`; }
    if (styles.length > 0) { open += `<span style="${styles.join('; ')}">` ; close = `</span>${close}`; }

    html += open + text + close;
  }

  figma.ui.postMessage({ type: 'styled-text-html', html });
}, ErrorType.UNKNOWN);

const handleCycleLayoutSizing = withErrorBoundary(async (axis: 'horizontal' | 'vertical') => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify('⚠️ Please select at least one layer');
    return;
  }

  // Cycle order: HUG → FILL → FIXED
  const cycleOrder: Array<'HUG' | 'FILL' | 'FIXED'> = ['HUG', 'FILL', 'FIXED'];

  let count = 0;
  let newMode: 'HUG' | 'FILL' | 'FIXED' | undefined;

  selection.forEach(node => {
    if ('layoutSizingHorizontal' in node && 'layoutSizingVertical' in node) {
      const currentMode = axis === 'horizontal'
        ? node.layoutSizingHorizontal
        : node.layoutSizingVertical;

      const currentIndex = cycleOrder.indexOf(currentMode);
      newMode = cycleOrder[(currentIndex + 1) % 3];

      if (axis === 'horizontal') {
        node.layoutSizingHorizontal = newMode;
      } else {
        node.layoutSizingVertical = newMode;
      }
      count++;
    }
  });

  if (count > 0) {
    const axisName = axis === 'horizontal' ? 'width' : 'height';
    figma.notify(`✓ Set ${axisName} to ${newMode}`);

    // Send updated state back to UI for single selections
    sendLayoutStateToUI();
  } else {
    figma.notify('⚠️ Selected layers must be inside an auto-layout frame');
  }
}, ErrorType.UNKNOWN);

// Helper function to send layout state to UI
function sendLayoutStateToUI(): void {
  const selection = figma.currentPage.selection;

  if (selection.length === 1 && 'layoutSizingHorizontal' in selection[0]) {
    const node = selection[0] as SceneNode & { layoutSizingHorizontal: string; layoutSizingVertical: string };
    figma.ui.postMessage({
      type: 'update-layout-state',
      horizontal: node.layoutSizingHorizontal,
      vertical: node.layoutSizingVertical
    });
  } else {
    // Multiple selection or no layout properties - show neutral state
    figma.ui.postMessage({
      type: 'update-layout-state',
      horizontal: '—',
      vertical: '—'
    });
  }
}

// License management removed