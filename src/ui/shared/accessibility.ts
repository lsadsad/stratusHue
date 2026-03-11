// Accessibility preferences detection and handling
export function setupAccessibilitySupport(): void {
  // Detect and respond to reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-reduced-motion', e.matches.toString());
    console.log('Reduced motion preference changed:', e.matches);
  };

  // Set initial state
  document.documentElement.setAttribute('data-reduced-motion', prefersReducedMotion.matches.toString());

  // Listen for changes
  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', handleReducedMotionChange);
  } else {
    // Fallback for older browsers
    prefersReducedMotion.addListener(handleReducedMotionChange);
  }

  // Detect and respond to high contrast preference
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
  const handleHighContrastChange = (e: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-high-contrast', e.matches.toString());
    console.log('High contrast preference changed:', e.matches);
  };

  // Set initial state
  document.documentElement.setAttribute('data-high-contrast', prefersHighContrast.matches.toString());

  // Listen for changes
  if (prefersHighContrast.addEventListener) {
    prefersHighContrast.addEventListener('change', handleHighContrastChange);
  } else {
    // Fallback for older browsers
    prefersHighContrast.addListener(handleHighContrastChange);
  }

  // Detect forced colors mode (Windows High Contrast)
  const forcedColors = window.matchMedia('(forced-colors: active)');
  const handleForcedColorsChange = (e: MediaQueryListEvent) => {
    document.documentElement.setAttribute('data-forced-colors', e.matches.toString());
    console.log('Forced colors mode changed:', e.matches);

    // Adjust navigation announcements for high contrast users
    if (e.matches) {
      // More verbose announcements for high contrast users
      enhanceScreenReaderAnnouncements(true);
    } else {
      enhanceScreenReaderAnnouncements(false);
    }
  };

  // Set initial state
  document.documentElement.setAttribute('data-forced-colors', forcedColors.matches.toString());

  // Listen for changes
  if (forcedColors.addEventListener) {
    forcedColors.addEventListener('change', handleForcedColorsChange);
  } else {
    // Fallback for older browsers
    forcedColors.addListener(handleForcedColorsChange);
  }
}

// Enhanced screen reader announcements for accessibility
export function enhanceScreenReaderAnnouncements(enhanced: boolean): void {
  // Store the preference for use in announcement functions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).enhancedAnnouncements = enhanced;
}
