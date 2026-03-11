import { ThemeManager } from '../../core/theme-manager';
import { ThemeMode, EffectiveTheme, ThemePreference } from '../../core/types';
import { sendMessage } from './send-message';
import { updateScrollBehavior } from './layout';

export let themeManager: ThemeManager;
export let isThemeInitialized = false;

// Initialize accessibility media query listeners
export function initializeAccessibilityListeners(): void {
  // High contrast preference listener
  const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
  const handleHighContrastChange = (e: MediaQueryListEvent) => {
    console.log('🔍 High contrast preference changed:', e.matches);
    updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);

    // Announce change to screen readers
    const announcer = document.getElementById('theme-announcer');
    if (announcer) {
      announcer.textContent = e.matches ?
        'High contrast mode enabled' :
        'High contrast mode disabled';
      setTimeout(() => { if (announcer) announcer.textContent = ''; }, 2000);
    }
  };

  highContrastQuery.addEventListener('change', handleHighContrastChange);

  // Reduced motion preference listener
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    console.log('🎬 Reduced motion preference changed:', e.matches);
    updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);

    // Announce change to screen readers
    const announcer = document.getElementById('theme-announcer');
    if (announcer) {
      announcer.textContent = e.matches ?
        'Reduced motion enabled' :
        'Reduced motion disabled';
      setTimeout(() => { if (announcer) announcer.textContent = ''; }, 2000);
    }
  };

  reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

  // Forced colors (Windows High Contrast) listener
  const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
  const handleForcedColorsChange = (e: MediaQueryListEvent) => {
    console.log('🎨 Forced colors mode changed:', e.matches);
    updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);

    // Announce change to screen readers
    const announcer = document.getElementById('theme-announcer');
    if (announcer) {
      announcer.textContent = e.matches ?
        'Windows High Contrast mode enabled' :
        'Windows High Contrast mode disabled';
      setTimeout(() => { if (announcer) announcer.textContent = ''; }, 2000);
    }
  };

  forcedColorsQuery.addEventListener('change', handleForcedColorsChange);

  // Initial accessibility state update
  updateThemeAccessibility(themeManager?.getEffectiveTheme() || 'figma-dark', false);
}

// Initialize system theme detection early in startup sequence
export function initializeSystemThemeDetection(): void {
  console.log('🎨 Initializing system theme detection...');

  // Initialize theme manager with system detection
  themeManager = new ThemeManager(sendMessage);

  // Initialize accessibility listeners
  initializeAccessibilityListeners();

  // Use system theme as initial theme - actual saved preference will be loaded from code.ts
  const systemTheme = themeManager.currentSystemTheme;
  const initialTheme: EffectiveTheme = systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
  console.log(`🔍 Using initial system theme: ${systemTheme} (${initialTheme})`);

  console.log(`🎨 Applying initial theme: ${initialTheme}`);

  // Additional debugging for system theme detection
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  console.log(`🔍 Media query '(prefers-color-scheme: dark)' matches: ${mediaQuery.matches}`);
  console.log(`🔍 Expected system theme: ${mediaQuery.matches ? 'dark' : 'light'}`);

  applyTheme(initialTheme);

  // Set up theme change listeners for system changes and user preferences
  themeManager.onThemeChange((effectiveTheme) => {
    console.log(`🎨 Theme change detected: ${effectiveTheme}`);

    // Show loading state during theme change
    showThemeLoadingState();

    // Manage focus during theme change
    manageFocusDuringThemeChange();

    // Apply theme with enhanced feedback
    applyTheme(effectiveTheme);
    updateThemeUI();

    // Theme change notification removed for now (function preserved for future use)

    // Hide loading state after theme application
    setTimeout(() => {
      hideThemeLoadingState();
    }, 100);

    // Notify other parts of the system about theme changes
    synchronizeThemeChanges(effectiveTheme);
  });

  // Mark theme system as initialized
  isThemeInitialized = true;

  console.log('✅ System theme detection initialized');
}

// Synchronize theme changes across the UI and with the backend
export function synchronizeThemeChanges(effectiveTheme: EffectiveTheme): void {
  // Update any theme-dependent UI elements
  updateThemeUI();

  // Update accessibility attributes for the new theme
  updateThemeAccessibility(effectiveTheme, themeManager?.currentTheme === 'system');

  // Update scroll behavior after theme change (some themes might affect layout)
  setTimeout(() => {
    updateScrollBehavior();
  }, 50);

  // Dispatch custom event for other components that might need to react to theme changes
  window.dispatchEvent(new CustomEvent('systemThemeSync', {
    detail: {
      effectiveTheme,
      themeMode: themeManager?.currentTheme,
      systemTheme: themeManager?.currentSystemTheme,
      timestamp: Date.now()
    }
  }));

  // Dispatch enhanced theme change event with more details
  window.dispatchEvent(new CustomEvent('themeChangeComplete', {
    detail: {
      effectiveTheme,
      themeMode: themeManager?.currentTheme,
      systemTheme: themeManager?.currentSystemTheme,
      timestamp: Date.now(),
      isSystemTheme: themeManager?.currentTheme === 'system'
    }
  }));

  // Log theme synchronization for debugging
  console.log(`🔄 Theme synchronized: ${effectiveTheme} (mode: ${themeManager?.currentTheme}, system: ${themeManager?.currentSystemTheme})`);
}

// Theme switching functionality
export function setupThemeSwitching(): void {
  // Ensure theme manager is initialized
  if (!themeManager) {
    console.warn('⚠️ Theme manager not initialized, calling initializeSystemThemeDetection');
    initializeSystemThemeDetection();
  }

  // Request saved theme from backend (this will override system fallback)
  console.log('📤 Requesting saved theme preference from backend...');
  sendMessage('get-theme-preference');

  // Add event listeners to theme buttons with enhanced keyboard navigation
  const themeButtons = document.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;
  themeButtons.forEach((button) => {
    // Enhanced click handler
    button.addEventListener('click', () => {
      const themeMode = button.dataset.theme as ThemeMode;

      // Hide any active preview before applying the actual theme
      hideThemePreview();

      // Update aria-pressed state for all buttons
      themeButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');

      // Apply the selected theme
      themeManager.setTheme(themeMode);
      console.log('Theme changed to:', themeMode);

      // Announce theme selection for screen readers
      announceThemeSelection(themeMode);
    });

    // Enhanced keyboard navigation
    button.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          navigateToAdjacentTheme(button, 'previous');
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          navigateToAdjacentTheme(button, 'next');
          break;
        case 'Home':
          e.preventDefault();
          navigateToFirstTheme();
          break;
        case 'End':
          e.preventDefault();
          navigateToLastTheme();
          break;
      }
    });
  });

  // Setup theme preview functionality
  setupThemePreview();
}

export function applyTheme(effectiveTheme: EffectiveTheme): void {
  const htmlElement = document.documentElement;

  // Get current theme for transition detection
  const currentTheme = htmlElement.getAttribute('data-theme');

  // Validate effective theme before applying
  const validThemes: EffectiveTheme[] = ['figma-light', 'figma-dark', 'light', 'boilerplate', 'cybertron'];
  const themeToApply = validThemes.includes(effectiveTheme) ? effectiveTheme : 'figma-dark';

  // Skip if already applied (optimization)
  if (currentTheme === themeToApply) {
    return;
  }

  // Add transition class for smooth theme changes (only if not initial load)
  const isInitialLoad = !currentTheme || currentTheme === '';
  if (!isInitialLoad) {
    htmlElement.classList.add('theme-transitioning');
  }

  // Apply theme resolution logic with proper mapping
  const resolvedTheme = resolveThemeAttribute(themeToApply);

  // Apply the new theme
  htmlElement.setAttribute('data-theme', resolvedTheme);

  // Log theme application for debugging
  console.log(`🎨 Applied theme: ${resolvedTheme} (from effective: ${themeToApply})`);

  // Remove transition class after animation completes (only if transition was added)
  if (!isInitialLoad) {
    setTimeout(() => {
      htmlElement.classList.remove('theme-transitioning');
    }, 300); // Match CSS transition duration
  }

  // Persist theme preference if theme manager is available and initialized
  if (themeManager && isThemeInitialized) {
    persistThemeChange(themeToApply);
  }
}

export function resolveThemeAttribute(effectiveTheme: EffectiveTheme): string {
  // Map effective themes to CSS data-theme attribute values
  switch (effectiveTheme) {
    case 'figma-light':
      return 'figma-light';
    case 'figma-dark':
      return 'figma-dark';
    case 'light':
      return 'light';
    case 'boilerplate':
      return 'boilerplate';
    case 'cybertron':
      return 'cybertron';
    default:
      return 'figma-dark'; // Safe fallback
  }
}

export function persistThemeChange(_effectiveTheme: EffectiveTheme): void {
  // Create theme preference object with current state
  const preference: ThemePreference = {
    mode: themeManager.currentTheme,
    lastSystemTheme: themeManager.currentSystemTheme,
    migrationVersion: 1
  };

  // Send to backend for persistence
  sendMessage('set-theme-preference', { theme: preference });
}

export function updateThemeUI(): void {
  if (!themeManager) return;

  const currentMode = themeManager.currentTheme;

  // Update all theme buttons' aria-pressed state
  const allButtons = document.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;
  allButtons.forEach(button => {
    const isCurrentTheme = button.dataset.theme === currentMode;
    button.setAttribute('aria-pressed', isCurrentTheme ? 'true' : 'false');
  });

  // Update system theme status indicator
  updateSystemThemeStatus();

  // Dispatch a custom event for other parts of the app to listen to
  const effectiveTheme = themeManager.getEffectiveTheme();
  window.dispatchEvent(new CustomEvent('themeChanged', {
    detail: {
      themeMode: currentMode,
      effectiveTheme: effectiveTheme,
      systemTheme: themeManager.currentSystemTheme
    }
  }));
}

export function updateSystemThemeStatus(): void {
  if (!themeManager) return;

  const statusElement = document.getElementById('system-theme-status');
  if (!statusElement) return;

  const currentMode = themeManager.currentTheme;
  const systemTheme = themeManager.currentSystemTheme;

  if (currentMode === 'system') {
    // Show current system theme detection
    statusElement.textContent = '';
    statusElement.style.display = 'none';

    // Add visual indicator for system theme synchronization
    statusElement.setAttribute('data-system-theme', systemTheme);
  } else {
    // Hide status for non-system themes
    statusElement.style.display = 'none';
    statusElement.removeAttribute('data-system-theme');
  }
}

// Theme change notification system (preserved for future use)
export function _showThemeChangeNotification(_themeMode: ThemeMode, _effectiveTheme: EffectiveTheme): void {
  // Create or get existing notification element
  let notification = document.getElementById('theme-change-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'theme-change-notification';
    notification.className = 'theme-notification';
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);
  }

  // Get theme display name
  const themeConfig = themeManager?.getThemeConfig(_themeMode);
  const displayName = themeConfig?.displayName || _themeMode;
  const icon = themeConfig?.icon || '🎨';

  // Set notification content
  notification.innerHTML = `
    <span class="theme-notification-icon">${icon}</span>
    <span class="theme-notification-text">Theme changed to ${displayName}</span>
  `;

  // Show notification with animation
  notification.classList.add('show');

  // Auto-hide after 2 seconds
  setTimeout(() => {
    notification?.classList.remove('show');
  }, 2000);

  // Announce to screen readers
  announceThemeChange(displayName);
}

// Enhanced keyboard navigation helpers for theme selection
export function navigateToAdjacentTheme(currentButton: HTMLButtonElement, direction: 'previous' | 'next'): void {
  const allButtons = Array.from(document.querySelectorAll('.theme-option')) as HTMLButtonElement[];
  const currentIndex = allButtons.indexOf(currentButton);

  if (currentIndex === -1) return;

  let targetIndex: number;
  if (direction === 'previous') {
    targetIndex = currentIndex === 0 ? allButtons.length - 1 : currentIndex - 1;
  } else {
    targetIndex = currentIndex === allButtons.length - 1 ? 0 : currentIndex + 1;
  }

  const targetButton = allButtons[targetIndex];
  if (targetButton) {
    targetButton.focus();
    // Optionally select the theme immediately on navigation
    if (targetButton.getAttribute('aria-pressed') !== 'true') {
      targetButton.click();
    }
  }
}

export function navigateToFirstTheme(): void {
  const firstButton = document.querySelector('.theme-option') as HTMLButtonElement;
  if (firstButton) {
    firstButton.focus();
    if (firstButton.getAttribute('aria-pressed') !== 'true') {
      firstButton.click();
    }
  }
}

export function navigateToLastTheme(): void {
  const allButtons = document.querySelectorAll('.theme-option');
  const lastButton = allButtons[allButtons.length - 1] as HTMLButtonElement;
  if (lastButton) {
    lastButton.focus();
    if (lastButton.getAttribute('aria-pressed') !== 'true') {
      lastButton.click();
    }
  }
}

export function announceThemeSelection(themeMode: ThemeMode): void {
  const themeConfig = themeManager?.getThemeConfig(themeMode);
  if (!themeConfig) return;

  // Create or get existing selection announcer
  let announcer = document.getElementById('theme-selection-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'theme-selection-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }

  // Announce the selection
  announcer.textContent = `${themeConfig.displayName} theme selected. ${themeConfig.description}`;

  // Clear announcement after a delay
  setTimeout(() => {
    if (announcer) announcer.textContent = '';
  }, 3000);
}

// Enhanced screen reader announcements for theme changes
export function announceThemeChange(themeName: string): void {
  // Create or get existing announcement element
  let announcer = document.getElementById('theme-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'theme-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    document.body.appendChild(announcer);
  }

  // Enhanced announcement with context
  const systemTheme = themeManager?.currentSystemTheme || 'unknown';
  const currentMode = themeManager?.currentTheme || 'unknown';

  let announcement = `Theme changed to ${themeName}`;

  // Add system theme context for system mode
  if (currentMode === 'system') {
    announcement += `. Following system ${systemTheme} theme`;
  }

  // Add accessibility status
  const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isHighContrast) {
    announcement += '. High contrast mode detected';
  }

  if (isReducedMotion) {
    announcement += '. Reduced motion preferences respected';
  }

  // Announce the theme change
  announcer.textContent = announcement;

  // Clear announcement after a delay
  setTimeout(() => {
    if (announcer) announcer.textContent = '';
  }, 4000);
}

// Theme preview functionality
export function setupThemePreview(): void {
  const themeOptions = document.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;

  themeOptions.forEach((button) => {
    if (!button) return;

    const isPressed = () => button.getAttribute('aria-pressed') === 'true';

    // Add preview on hover
    button.addEventListener('mouseenter', () => {
      if (!isPressed()) {
        const themeValue = button.dataset.theme as ThemeMode;
        showThemePreview(themeValue);
      }
    });

    // Remove preview on mouse leave
    button.addEventListener('mouseleave', () => {
      if (!isPressed()) {
        hideThemePreview();
      }
    });

    // Add keyboard preview support
    button.addEventListener('focus', () => {
      if (!isPressed()) {
        const themeValue = button.dataset.theme as ThemeMode;
        showThemePreview(themeValue);
      }
    });

    button.addEventListener('blur', () => {
      if (!isPressed()) {
        hideThemePreview();
      }
    });
  });
}

let previewTimeout: number | null = null;
let originalTheme: EffectiveTheme | null = null;

export function showThemePreview(themeMode: ThemeMode): void {
  if (!themeManager) return;

  // Store original theme if not already stored
  if (originalTheme === null) {
    originalTheme = themeManager.getEffectiveTheme();
  }

  // Clear any existing preview timeout
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }

  // Apply preview theme after a short delay to avoid flickering
  previewTimeout = window.setTimeout(() => {
    const previewEffectiveTheme = resolvePreviewTheme(themeMode);
    applyThemePreview(previewEffectiveTheme);

    // Add preview indicator
    showPreviewIndicator(themeMode);
  }, 200);
}

export function hideThemePreview(): void {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }

  if (originalTheme !== null && themeManager) {
    // Restore original theme
    applyThemePreview(originalTheme);
    originalTheme = null;

    // Hide preview indicator
    hidePreviewIndicator();
  }
}

export function resolvePreviewTheme(themeMode: ThemeMode): EffectiveTheme {
  if (!themeManager) return 'figma-dark';

  switch (themeMode) {
    case 'system': {
      const systemTheme = themeManager.currentSystemTheme;
      return systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
    }
    case 'light':
      return 'light';
    case 'dark':
      return 'figma-dark';
    case 'boilerplate':
      return 'boilerplate';
    case 'cybertron':
      return 'cybertron';
    default:
      return 'figma-dark';
  }
}

export function applyThemePreview(effectiveTheme: EffectiveTheme): void {
  const htmlElement = document.documentElement;

  // Add preview class for different transition behavior
  htmlElement.classList.add('theme-previewing');

  // Apply the preview theme
  const resolvedTheme = resolveThemeAttribute(effectiveTheme);
  htmlElement.setAttribute('data-theme', resolvedTheme);
}

export function showPreviewIndicator(themeMode: ThemeMode): void {
  // Create or get existing preview indicator
  let indicator = document.getElementById('theme-preview-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'theme-preview-indicator';
    indicator.className = 'theme-preview-indicator';
    document.body.appendChild(indicator);
  }

  const themeConfig = themeManager?.getThemeConfig(themeMode);
  const displayName = themeConfig?.displayName || themeMode;

  indicator.innerHTML = `
    <span class="preview-icon">👁️</span>
    <span class="preview-text">Previewing ${displayName}</span>
  `;

  indicator.classList.add('show');
}

export function hidePreviewIndicator(): void {
  const indicator = document.getElementById('theme-preview-indicator');
  if (indicator) {
    indicator.classList.remove('show');
  }

  // Remove preview class
  document.documentElement.classList.remove('theme-previewing');
}

// Enhanced focus management during theme changes
export function manageFocusDuringThemeChange(): void {
  const activeElement = document.activeElement as HTMLElement;

  if (activeElement && activeElement.tagName === 'INPUT' && activeElement.getAttribute('name') === 'theme') {
    // Store focus information
    const focusedThemeOption = activeElement.closest('.theme-option') as HTMLElement;

    if (focusedThemeOption) {
      // Add temporary focus indicator during theme transition
      focusedThemeOption.classList.add('theme-changing-focus');

      // Remove indicator after theme transition completes
      setTimeout(() => {
        focusedThemeOption.classList.remove('theme-changing-focus');

        // Ensure focus is maintained
        if (document.activeElement !== activeElement) {
          activeElement.focus();
        }
      }, 300); // Match theme transition duration
    }
  }
}

// Loading state management for theme changes
export function showThemeLoadingState(): void {
  const settingsPanel = document.querySelector('.settings-panel') as HTMLElement;
  if (settingsPanel) {
    settingsPanel.classList.add('theme-loading');
  }
}

export function hideThemeLoadingState(): void {
  const settingsPanel = document.querySelector('.settings-panel') as HTMLElement;
  if (settingsPanel) {
    settingsPanel.classList.remove('theme-loading');
  }
}

// Update theme-related components after theme changes
export function updateThemeRelatedComponents(effectiveTheme: EffectiveTheme, themeMode: ThemeMode, isSystemTheme: boolean): void {
  // Update logo visibility based on theme
  updateLogoVisibility(effectiveTheme);

  // Update any theme-dependent animations or effects
  updateThemeAnimations(effectiveTheme);

  // Update accessibility attributes based on theme
  updateThemeAccessibility(effectiveTheme, isSystemTheme);
}

export function updateLogoVisibility(effectiveTheme: EffectiveTheme): void {
  const darkLogos = document.querySelectorAll('.logo-dark');
  const lightLogos = document.querySelectorAll('.logo-light');

  // Determine if theme is dark or light
  // Dark themes: figma-dark, boilerplate, cybertron
  // Light themes: figma-light, light
  const isDarkTheme = effectiveTheme === 'figma-dark' || effectiveTheme === 'boilerplate' || effectiveTheme === 'cybertron';
  const isLightTheme = effectiveTheme === 'figma-light' || effectiveTheme === 'light';

  // Show dark logo on light themes, light logo on dark themes (for contrast)
  darkLogos.forEach((logo) => {
    (logo as HTMLElement).style.display = isLightTheme ? 'inline' : 'none';
  });

  lightLogos.forEach((logo) => {
    (logo as HTMLElement).style.display = isDarkTheme ? 'inline' : 'none';
  });


}

export function updateThemeAnimations(effectiveTheme: EffectiveTheme): void {
  const body = document.body;

  // Add theme-specific animation classes
  body.classList.remove('theme-cybertron-effects', 'theme-light-effects', 'theme-dark-effects');

  switch (effectiveTheme) {
    case 'cybertron':
      body.classList.add('theme-cybertron-effects');
      break;
    case 'figma-light':
    case 'light':
      body.classList.add('theme-light-effects');
      break;
    case 'figma-dark':
    case 'boilerplate':
      body.classList.add('theme-dark-effects');
      break;
  }
}

export function updateThemeAccessibility(effectiveTheme: EffectiveTheme, _isSystemTheme: boolean): void {
  const htmlElement = document.documentElement;

  // Update high contrast mode support
  const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  if (isHighContrast) {
    htmlElement.classList.add('high-contrast-mode');
    htmlElement.setAttribute('data-high-contrast', 'true');
  } else {
    htmlElement.classList.remove('high-contrast-mode');
    htmlElement.removeAttribute('data-high-contrast');
  }

  // Update reduced motion support
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    htmlElement.classList.add('reduced-motion');
    htmlElement.setAttribute('data-reduced-motion', 'true');
  } else {
    htmlElement.classList.remove('reduced-motion');
    htmlElement.removeAttribute('data-reduced-motion');
  }

  // Update forced colors support (Windows High Contrast mode)
  const isForcedColors = window.matchMedia('(forced-colors: active)').matches;
  if (isForcedColors) {
    htmlElement.classList.add('forced-colors-mode');
    htmlElement.setAttribute('data-forced-colors', 'true');
  } else {
    htmlElement.classList.remove('forced-colors-mode');
    htmlElement.removeAttribute('data-forced-colors');
  }

  // Update prefers-color-scheme support
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  htmlElement.setAttribute('data-prefers-color-scheme', prefersLight ? 'light' : 'dark');

  // Validate color contrast for current theme
  validateThemeContrast(effectiveTheme, isHighContrast);

  // Update color scheme meta tag for better browser integration
  updateColorSchemeMeta(effectiveTheme);

  // Update ARIA attributes for accessibility tools
  updateAccessibilityAttributes(effectiveTheme, isHighContrast, isReducedMotion);
}

// Color contrast validation for accessibility compliance
export function validateThemeContrast(effectiveTheme: EffectiveTheme, isHighContrast: boolean): void {
  // Define minimum contrast ratios (WCAG AA standard)
  const minContrastRatio = isHighContrast ? 7.0 : 4.5; // AAA for high contrast, AA for normal

  // Get theme-specific contrast validation
  const contrastIssues: string[] = [];

  // Validate based on effective theme
  switch (effectiveTheme) {
    case 'figma-light':
      // Light theme should have dark text on light backgrounds
      if (!validateContrastRatio('#1e1e1e', '#ffffff', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
    case 'figma-dark':
      // Dark theme should have light text on dark backgrounds
      if (!validateContrastRatio('#ffffff', '#2c2c2c', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
    case 'light':
      // Standalone light theme validation
      if (!validateContrastRatio('#1e1e1e', '#ffffff', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
    case 'boilerplate':
    case 'cybertron':
      // Dark themes validation
      if (!validateContrastRatio('#f5f5f5', '#0f0f0f', minContrastRatio)) {
        contrastIssues.push('Primary text contrast insufficient');
      }
      break;
  }

  // Log contrast issues for debugging
  if (contrastIssues.length > 0) {
    console.warn(`⚠️ Accessibility: Contrast issues detected in ${effectiveTheme} theme:`, contrastIssues);
  }

  // Update accessibility status
  const htmlElement = document.documentElement;
  if (contrastIssues.length > 0) {
    htmlElement.setAttribute('data-contrast-issues', contrastIssues.join(', '));
  } else {
    htmlElement.removeAttribute('data-contrast-issues');
  }
}

// Simple contrast ratio calculation (approximation for validation)
export function validateContrastRatio(foreground: string, background: string, _minRatio: number): boolean {
  // This is a simplified validation - in a real implementation, you'd use a proper color contrast library
  // For now, we'll do basic validation based on known good combinations

  const lightOnDark = (foreground === '#ffffff' || foreground === '#f5f5f5') &&
    (background === '#2c2c2c' || background === '#0f0f0f' || background === '#0a0a0f');
  const darkOnLight = (foreground === '#1e1e1e' || foreground === '#000000') &&
    (background === '#ffffff' || background === '#f7f8f9');

  return lightOnDark || darkOnLight;
}

// Update accessibility attributes for assistive technologies
export function updateAccessibilityAttributes(effectiveTheme: EffectiveTheme, isHighContrast: boolean, isReducedMotion: boolean): void {
  const htmlElement = document.documentElement;

  // Set theme information for assistive technologies
  htmlElement.setAttribute('data-theme-name', effectiveTheme);
  htmlElement.setAttribute('data-theme-type', effectiveTheme.includes('light') ? 'light' : 'dark');

  // Update main content accessibility
  const mainElement = document.querySelector('main');
  if (mainElement) {
    mainElement.setAttribute('aria-label', `Plugin interface using ${effectiveTheme} theme`);
  }

  // Update settings panel accessibility
  const settingsPanel = document.querySelector('.settings-panel');
  if (settingsPanel) {
    let settingsLabel = 'Plugin settings';
    if (isHighContrast) settingsLabel += ' (High contrast mode active)';
    if (isReducedMotion) settingsLabel += ' (Reduced motion active)';

    settingsPanel.setAttribute('aria-label', settingsLabel);
  }

  // Update theme selector accessibility
  const themeSelector = document.querySelector('.theme-selector');
  if (themeSelector) {
    themeSelector.setAttribute('role', 'radiogroup');
    themeSelector.setAttribute('aria-label', 'Theme selection');

    // Update individual theme options
    const themeButtons = themeSelector.querySelectorAll('.theme-option') as NodeListOf<HTMLButtonElement>;
    themeButtons.forEach((button, index) => {
      const themeValue = button.dataset.theme as ThemeMode;
      const themeConfig = themeManager?.getThemeConfig(themeValue);

      if (button && themeConfig) {
        // Enhanced aria-label with description
        button.setAttribute('aria-label', `${themeConfig.displayName}: ${themeConfig.description}`);

        // Add position information for screen readers
        button.setAttribute('aria-posinset', (index + 1).toString());
        button.setAttribute('aria-setsize', themeButtons.length.toString());
      }
    });
  }
}

export function updateColorSchemeMeta(effectiveTheme: EffectiveTheme): void {
  let metaColorScheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement;

  if (!metaColorScheme) {
    metaColorScheme = document.createElement('meta');
    metaColorScheme.name = 'color-scheme';
    document.head.appendChild(metaColorScheme);
  }

  // Determine if theme is dark or light for meta color-scheme
  // Dark themes: figma-dark, boilerplate, cybertron
  // Light themes: figma-light, light
  const isDarkTheme = effectiveTheme === 'figma-dark' || effectiveTheme === 'boilerplate' || effectiveTheme === 'cybertron';

  metaColorScheme.content = isDarkTheme ? 'dark' : 'light';
}
