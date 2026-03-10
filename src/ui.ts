// Figma Plugin UI - TypeScript Implementation
// Handles all UI interactions and communication with the plugin sandbox

// Temporarily disable lottie to debug
// import lottie from 'lottie-web';
import type { NavigationContext } from './types';
// UI should not import plugin-side storage (which uses `figma`).
// We request and persist UI section states via postMessage to the plugin.

// ===== SHARED MODULES =====
import {
  activeTimers,
  clearAllTimers,
  removeAllEventListeners,
  pauseNonEssentialOperations,
  resumeNonEssentialOperations
} from './ui/shared/cleanup';
import {
  updateToggleState,
  updateScrollBehavior,
  setIsAutoFitEnabled
} from './ui/shared/layout';
import { destroyAllLottieAnimations } from './ui/shared/lottie';
import {
  themeManager,
  isThemeInitialized,
  initializeSystemThemeDetection,
  updateThemeUI,
  hideThemePreview,
  updateThemeRelatedComponents,
  applyTheme
} from './ui/shared/theme-manager-ui';
import type { EffectiveTheme } from './core/types';

// ===== NAVIGATE MODULES =====
import {
  updateEmojiButtons,
  updateAnatomySection,
  updateVisibilityLockIcons,
  registerShowCanvasHint as registerShowCanvasHintAnatomy
} from './ui/navigate/anatomy';
import {
  updateBookmarksList,
  updateNavigationButtons,
  updateLayoutSizingButtons,
  updateEmojiSetIndicator,
  updateAutoFitButtonState,
  resetFooterButtonStates,
  registerShowCanvasHintBookmarks,
  registerDisableAutoFit
} from './ui/navigate/bookmarks-ui';
import {
  setNavigationContext,
  setControlsEnabled,
  setGroupMovementZoomVisible,
  setGroupHierarchyVisible,
  setGroupSizingModesVisible,
  setGroupStyledTextVisible,
  updateControlButtons,
  updateControlsVisibility,
  updateGroupTogglesUI,
  applyGroupVisibility
} from './ui/navigate/controls-ui';
import { updateNudgeSettingsUI } from './ui/navigate/settings-ui';
import {
  initializePlugin,
  setupEventListeners,
  restoreUISectionStates,
  setUISectionStatesFromPlugin,
  announceNavigationResult,
  registerShowCanvasHintNavigate,
  registerDisableAutoFitNavigate,
  registerInitializeSystemThemeDetection,
  registerInitializeThemePerformanceMonitoring,
  registerSetupCleanupHandlers,
  registerUpdateEmojiButtons,
  updateStyledTextButtons
} from './ui/navigate/navigate-ui';

console.log('🔍 Script executing, DOM ready state:', document.readyState);

// Global error handlers to catch unexpected issues
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error || event.message);
  // Prevent error from bubbling to Figma's error handler
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  // Prevent error from bubbling to Figma's error handler
  event.preventDefault();
});

// Type definitions for better development experience
interface _PluginMessage {
  type: string;
  [key: string]: unknown;
}

// Canvas hint management
let canvasHintTimeout: number | null = null;

function showCanvasHint(): void {
  const hint = document.getElementById('canvas-hint');
  if (!hint) return;

  // Clear any existing timeout
  if (canvasHintTimeout !== null) {
    clearTimeout(canvasHintTimeout);
  }

  // Show the hint
  hint.classList.add('visible');

  // Hide after 2.5 seconds
  canvasHintTimeout = window.setTimeout(() => {
    hint.classList.remove('visible');
    canvasHintTimeout = null;
  }, 2500);
}

// Disable auto-fit and update UI state
function disableAutoFit(reason?: string): void {
  setIsAutoFitEnabled(false);
  updateAutoFitButtonState();
  console.log(`Auto-fit disabled${reason ? `: ${reason}` : ''}`);
}

// Message handler for plugin responses
function handlePluginMessage(event: MessageEvent): void {
  const message = event.data.pluginMessage;
  if (!message) return;

  console.log('📥 Received message from plugin:', message.type, message);

  switch (message.type) {
    case 'selection-state':
      // Handle emoji set updates based on selection
      const emojis = message.hasLayerSelected ? message.layerEmojis : message.pageEmojis;
      if (emojis) {
        updateEmojiButtons(emojis);
      }
      // Update mode state based on selection
      updateToggleState(message.hasLayerSelected);
      // Update anatomy section with current page/layer info
      updateAnatomySection(message.hasLayerSelected, message.pageName, message.selectedLayerName);
      // Update visibility and lock button icons based on selection state
      updateVisibilityLockIcons(message.selectionVisible, message.selectionLocked);
      break;
    case 'bookmarks':
      updateBookmarksList(
        message.bookmarks,
        message.currentAnchorId,
        message.previousBookmarkId,
        message.isInsideAnchor
      );
      break;
    case 'navigation-state':
      updateNavigationButtons(message.canGoBack, message.canGoForward);
      break;
    case 'emoji-navigation-state':
      updateEmojiSetIndicator(message.setName, message.currentSetIndex, message.totalSets);
      break;
    case 'error':
      console.error('Plugin error:', message.message);
      break;
    case 'success':
      console.log('Plugin success:', message.message);
      break;
    case 'ui-section-states':
      setUISectionStatesFromPlugin(message.states || {});
      // Restore the saved states to the UI
      restoreUISectionStates();
      break;
    case 'navigation-context-update':
      setNavigationContext(message.context as NavigationContext);
      updateControlButtons(message.context as NavigationContext);
      break;
    case 'controls-setting':
      setControlsEnabled(message.enabled as boolean);
      updateControlsVisibility(message.enabled as boolean);
      break;
    case 'controls-group-settings':
      if (message.groups) {
        const groups = message.groups as { movementZoom?: boolean; hierarchy?: boolean; sizingModes?: boolean; styledText?: boolean };
        setGroupMovementZoomVisible(groups.movementZoom ?? true);
        setGroupHierarchyVisible(groups.hierarchy ?? true);
        setGroupSizingModesVisible(groups.sizingModes ?? true);
        setGroupStyledTextVisible(groups.styledText ?? false);
        updateGroupTogglesUI();
        applyGroupVisibility();
      }
      break;
    case 'nudge-settings':
      updateNudgeSettingsUI(message.smallNudge as number, message.bigNudge as number);
      break;
    case 'navigation-action-result':
      // Announce the actual navigation result to screen readers
      announceNavigationResult({
        success: message.success as boolean,
        message: message.message as string
      });
      break;
    case 'update-layout-state':
      updateLayoutSizingButtons(message.horizontal, message.vertical);
      break;
    case 'update-styled-text-state':
      updateStyledTextButtons(message.hasTextNode as boolean);
      break;
    case 'styled-text-html': {
      const html = message.html as string;
      const plain = html.replace(/<[^>]+>/g, '');
      if (navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' })
        });
        navigator.clipboard.write([item]).catch(() => copyHTMLFallback(html, plain));
      } else {
        copyHTMLFallback(html, plain);
      }
      break;
    }
  }
}

function copyHTMLFallback(html: string, plain: string): void {
  const ta = document.createElement('textarea');
  ta.value = plain;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.addEventListener('copy', (e: ClipboardEvent) => {
    e.preventDefault();
    e.clipboardData?.setData('text/html', html);
    e.clipboardData?.setData('text/plain', plain);
  }, { once: true });
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ===== PERFORMANCE MONITORING AND OPTIMIZATION =====

// Performance monitoring for theme system
let themePerformanceMetrics = {
  themeChanges: 0,
  totalThemeChangeTime: 0,
  averageThemeChangeTime: 0,
  lastThemeChangeTime: 0,
  slowThemeChanges: 0, // Changes taking > 100ms
  cacheHits: 0,
  cacheMisses: 0
};

function initializeThemePerformanceMonitoring(): void {
  // Monitor theme change performance
  if (themeManager) {
    const originalApplyTheme = applyTheme;

    // Wrap applyTheme with performance monitoring
    (window as any).applyTheme = function (effectiveTheme: EffectiveTheme, skipTransition = false) {
      const startTime = performance.now();

      try {
        const result = originalApplyTheme.call(this, effectiveTheme);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Update metrics
        themePerformanceMetrics.themeChanges++;
        themePerformanceMetrics.totalThemeChangeTime += duration;
        themePerformanceMetrics.averageThemeChangeTime =
          themePerformanceMetrics.totalThemeChangeTime / themePerformanceMetrics.themeChanges;
        themePerformanceMetrics.lastThemeChangeTime = duration;

        if (duration > 100) {
          themePerformanceMetrics.slowThemeChanges++;
          console.warn(`Slow theme change detected: ${duration.toFixed(2)}ms for theme ${effectiveTheme}`);
        }

        // Log performance metrics periodically
        if (themePerformanceMetrics.themeChanges % 10 === 0) {
          console.log('Theme Performance Metrics:', {
            changes: themePerformanceMetrics.themeChanges,
            averageTime: `${themePerformanceMetrics.averageThemeChangeTime.toFixed(2)}ms`,
            slowChanges: themePerformanceMetrics.slowThemeChanges,
            lastChange: `${themePerformanceMetrics.lastThemeChangeTime.toFixed(2)}ms`
          });
        }

        return result;
      } catch (error) {
        console.error('Theme application error:', error);
        throw error;
      }
    };
  }

  // Monitor memory usage periodically with tiered thresholds
  if ('memory' in performance) {
    const memoryMonitorInterval = setInterval(() => {
      const memInfo = (performance as any).memory;
      const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
      const limitMB = memInfo.jsHeapSizeLimit / (1024 * 1024);
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;

      // Memory usage guidelines for Figma plugins:
      // Normal: < 50% of heap limit (~2000MB on 4GB heap)
      // Warning: 50-70% (indicates possible leak, should investigate)
      // Critical: > 70% (likely memory leak, may cause crashes)

      if (usagePercent > 70) {
        console.error('🚨 CRITICAL memory usage:', {
          used: `${usedMB.toFixed(2)}MB`,
          limit: `${limitMB.toFixed(2)}MB`,
          percentage: `${usagePercent.toFixed(1)}%`,
          status: 'Critical - possible memory leak!'
        });
      } else if (usagePercent > 50) {
        console.warn('⚠️ High memory usage detected:', {
          used: `${usedMB.toFixed(2)}MB`,
          limit: `${limitMB.toFixed(2)}MB`,
          percentage: `${usagePercent.toFixed(1)}%`,
          status: 'Warning - monitor closely'
        });
      }
      // Below 50% is considered normal, no warnings
    }, 30000); // Check every 30 seconds
    activeTimers.add(memoryMonitorInterval);
  }
}

// Cleanup handlers for memory management
function setupCleanupHandlers(): void {
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up theme system resources...');

    // Destroy theme manager
    if (themeManager) {
      themeManager.destroy();
    }

    // Destroy all Lottie animations
    destroyAllLottieAnimations();

    // Clear any remaining timers
    clearAllTimers();

    // Remove event listeners
    removeAllEventListeners();

    console.log('✅ Cleanup complete');
  });

  // Cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause non-essential operations when tab is hidden
      pauseNonEssentialOperations();
    } else {
      // Resume operations when tab becomes visible
      resumeNonEssentialOperations();
    }
  });
}

// CSS optimization: efficient theme variable inheritance
function optimizeThemeVariableInheritance(): void {
  // Create a style element for dynamic theme optimizations
  const optimizationStyle = document.createElement('style');
  optimizationStyle.id = 'theme-optimization-styles';

  // Add CSS that optimizes theme variable inheritance
  optimizationStyle.textContent = `
    /* Performance optimization: reduce CSS custom property lookups */
    .theme-optimized {
      /* Pre-calculate commonly used theme combinations */
      --optimized-border: 1px solid var(--theme-border-primary);
      --optimized-hover-bg: var(--theme-bg-hover);
      --optimized-text-color: var(--theme-text-primary);
      --optimized-transition: background-color 150ms ease-out, border-color 150ms ease-out;
    }

    /* Optimize frequently used button styles */
    .theme-optimized .btn-base {
      background: var(--optimized-hover-bg);
      border: var(--optimized-border);
      color: var(--optimized-text-color);
      transition: var(--optimized-transition);
    }

    /* Use contain property to limit style recalculation scope */
    .theme-container {
      contain: layout style;
    }

    /* Optimize for GPU acceleration on theme changes */
    .theme-gpu-optimized {
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
    }
  `;

  document.head.appendChild(optimizationStyle);

  // Apply optimization classes to relevant elements
  document.documentElement.classList.add('theme-optimized');
  document.body.classList.add('theme-container', 'theme-gpu-optimized');
}

// DOM Ready handling
function handleDOMReady(): void {
  console.log('📄 DOM ready, starting initialization sequence...');

  // Wire up all callbacks before initializePlugin is called
  registerShowCanvasHintNavigate(showCanvasHint);
  registerDisableAutoFitNavigate(disableAutoFit);
  registerShowCanvasHintBookmarks(showCanvasHint);
  registerDisableAutoFit(disableAutoFit);
  registerInitializeSystemThemeDetection(initializeSystemThemeDetection);
  registerInitializeThemePerformanceMonitoring(initializeThemePerformanceMonitoring);
  registerSetupCleanupHandlers(setupCleanupHandlers);
  registerUpdateEmojiButtons(updateEmojiButtons);

  // Wire anatomy's showCanvasHint callback
  registerShowCanvasHintAnatomy(showCanvasHint);

  // Initialize plugin functionality (includes system theme detection)
  initializePlugin();

  // Setup all event listeners (includes theme switching)
  setupEventListeners();

  // Listen for messages from plugin
  window.addEventListener('message', handlePluginMessage);

  // Listen specifically for theme preference from backend
  window.addEventListener('message', (event: MessageEvent) => {
    const msg = (event.data && (event.data as any).pluginMessage) || null;
    if (!msg) return;
    if (msg.type === 'theme-preference') {
      if (themeManager && isThemeInitialized) {
        // Use the theme data directly from the backend
        const themeData = msg.theme;

        console.log('📥 Received theme preference from backend:', themeData);

        // Debug: Check system theme before loading preference
        if (themeManager) {
          const beforeDebug = themeManager.getDebugInfo();
          console.log('🔍 Theme state BEFORE loading preference:', beforeDebug);
        }

        // Log storage information for debugging
        if (msg.storageInfo) {
          if (!msg.storageInfo.success) {
            console.warn('Theme storage load failed:', msg.storageInfo.error);
          }
          if (msg.storageInfo.usedFallback) {
            console.info('Theme preference loaded from fallback storage');
          }
        }

        // Load and apply the saved preference (this will override system fallback)
        themeManager.loadThemePreference(themeData);

        // Ensure UI is updated to reflect the loaded preference
        updateThemeUI();

        // Debug: Check system theme after loading preference
        if (themeManager) {
          const afterDebug = themeManager.getDebugInfo();
          console.log('🔍 Theme state AFTER loading preference:', afterDebug);
        }

        console.log('✅ Theme preference loaded and applied');
      } else {
        console.warn('⚠️ Received theme preference but theme manager not ready');
      }
    }
  });

  // Update scroll behavior on window resize
  window.addEventListener('resize', () => {
    setTimeout(updateScrollBehavior, 100);
  });

  // Listen for system theme changes (for debugging and additional handling)
  window.addEventListener('systemThemeSync', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { effectiveTheme, themeMode, systemTheme } = customEvent.detail;
    console.log(`🔄 System theme sync event: ${effectiveTheme} (mode: ${themeMode}, system: ${systemTheme})`);

    // Additional handling for system theme changes can be added here
    // For example, updating other UI elements that depend on theme
  });

  // Listen for theme change completion events
  window.addEventListener('themeChangeComplete', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { effectiveTheme, themeMode, systemTheme, isSystemTheme } = customEvent.detail;
    console.log(`✅ Theme change complete: ${effectiveTheme} (mode: ${themeMode}, system: ${systemTheme})`);

    // Update any components that need to know about theme changes
    updateThemeRelatedComponents(effectiveTheme, themeMode, isSystemTheme);
  });

  // Listen for settings overlay open/close to manage theme preview cleanup
  const settingsOverlay = document.getElementById('settings-overlay');
  if (settingsOverlay) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
          const isHidden = settingsOverlay.getAttribute('aria-hidden') === 'true';
          if (isHidden) {
            // Settings closed - cleanup any active preview
            hideThemePreview();
          }
        }
      });
    });

    observer.observe(settingsOverlay, { attributes: true });
  }

  // Cleanup theme manager on window unload
  window.addEventListener('beforeunload', () => {
    if (themeManager) {
      themeManager.destroy();
    }
  });

  // Reset footer button states on various events that might cause stuck states
  window.addEventListener('blur', resetFooterButtonStates);
  window.addEventListener('focus', resetFooterButtonStates);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(resetFooterButtonStates, 100);
    }
  });

  // Periodic cleanup to prevent stuck states (every 2 seconds)
  const footerCleanupInterval = setInterval(() => {
    const footerButtons = document.querySelectorAll('.footer-icon-btn');
    footerButtons.forEach((button) => {
      const btn = button as HTMLElement;
      // Only reset if not currently being interacted with
      if (!btn.matches(':hover') && !btn.matches(':focus') && !btn.matches(':active')) {
        btn.classList.remove('hover-active');
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
        btn.style.removeProperty('transform');
      }
    });
  }, 2000);
  activeTimers.add(footerCleanupInterval);
}

// ===== MODE ROUTING =====
// Phase 2 readiness: lazy-load Lint and Scaffold UI code only when activated.
// Navigate loads eagerly (it's the default mode). Inactive mode code never runs.

let activeMode: 'navigate' | 'lint' | 'scaffold' = 'navigate';

async function activateMode(mode: typeof activeMode): Promise<void> {
  activeMode = mode;
  if (mode === 'lint') {
    const { initializeLintUI } = await import('./ui/lint/lint-ui');
    initializeLintUI();
  } else if (mode === 'scaffold') {
    const { initializeScaffoldUI } = await import('./ui/scaffold/scaffold-ui');
    initializeScaffoldUI();
  }
  // TODO Phase 2: toggle <main> blocks, update footer tab state
}

// Export for use by message handler once mode toggle is wired (Phase 2)
(window as any).activateMode = activateMode;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleDOMReady);
} else {
  handleDOMReady();
}

// Initialize CSS optimizations
document.addEventListener('DOMContentLoaded', () => {
  optimizeThemeVariableInheritance();
});

// Export performance metrics for debugging
(window as any).getThemePerformanceMetrics = () => themePerformanceMetrics;
(window as any).resetThemePerformanceMetrics = () => {
  themePerformanceMetrics = {
    themeChanges: 0,
    totalThemeChangeTime: 0,
    averageThemeChangeTime: 0,
    lastThemeChangeTime: 0,
    slowThemeChanges: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
};

// Export theme debugging functions
(window as any).debugTheme = () => {
  if (!themeManager) {
    console.log('❌ Theme manager not initialized');
    return;
  }

  console.log('=== Theme Debug Info ===');
  const debugInfo = themeManager.getDebugInfo();
  console.log('Theme Mode:', debugInfo.currentThemeMode);
  console.log('System Theme:', debugInfo.systemTheme);
  console.log('Effective Theme:', debugInfo.effectiveTheme);
  console.log('Media Query Matches (dark):', debugInfo.mediaQueryMatches);
  console.log('Cache Valid:', debugInfo.cacheValid);

  // Check actual media query
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  console.log('Direct Media Query Check:', mediaQuery.matches);

  // Check HTML attribute
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  console.log('HTML data-theme:', htmlTheme);

  console.log('=== End Debug ===');

  return debugInfo;
};

// Export theme manager for debugging (will be set after initialization)
if (typeof window !== 'undefined') {
  (window as any).getThemeManager = () => themeManager;
}
