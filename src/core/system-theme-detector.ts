/**
 * SystemThemeDetector - Detects and monitors system theme preferences
 * 
 * This class provides functionality to detect the user's system theme preference
 * (light or dark) and listen for changes to that preference using CSS media queries.
 */

import type { SystemTheme } from './types';

export interface SystemThemeDetector {
  getCurrentSystemTheme(): SystemTheme;
  onSystemThemeChange(callback: (theme: SystemTheme) => void): void;
  removeSystemThemeListener(): void;
}

export class SystemThemeDetectorImpl implements SystemThemeDetector {
  private mediaQuery: MediaQueryList | null = null;
  private changeCallback: ((theme: SystemTheme) => void) | null = null;
  private boundHandleChange: ((event: MediaQueryListEvent) => void) | null = null;

  constructor() {
    this.initializeMediaQuery();
  }

  /**
   * Initialize the media query for detecting dark mode preference
   * Falls back gracefully if media queries are not supported
   */
  private initializeMediaQuery(): void {
    try {
      // Check if window and matchMedia are available (browser environment)
      if (typeof window !== 'undefined' && window.matchMedia) {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      }
    } catch (error) {
      console.warn('SystemThemeDetector: Media query initialization failed', error);
      this.mediaQuery = null;
    }
  }

  /**
   * Get the current system theme preference
   * @returns 'light' or 'dark' based on system preference, defaults to 'dark' if detection fails
   */
  getCurrentSystemTheme(): SystemTheme {
    try {
      if (this.mediaQuery) {
        return this.mediaQuery.matches ? 'dark' : 'light';
      }
    } catch (error) {
      console.warn('SystemThemeDetector: Failed to get current system theme', error);
    }
    
    // Fallback to dark theme (current Figma default) if detection fails
    return 'dark';
  }

  /**
   * Register a callback to be called when the system theme changes
   * @param callback Function to call when theme changes
   */
  onSystemThemeChange(callback: (theme: SystemTheme) => void): void {
    if (!this.mediaQuery) {
      console.warn('SystemThemeDetector: Cannot listen for theme changes - media query not available');
      return;
    }

    // Remove existing listener if any
    this.removeSystemThemeListener();

    // Store the callback
    this.changeCallback = callback;

    // Create bound handler for proper cleanup
    this.boundHandleChange = (event: MediaQueryListEvent) => {
      const newTheme: SystemTheme = event.matches ? 'dark' : 'light';
      if (this.changeCallback) {
        try {
          this.changeCallback(newTheme);
        } catch (error) {
          console.error('SystemThemeDetector: Error in theme change callback', error);
        }
      }
    };

    // Add the event listener
    try {
      this.mediaQuery.addEventListener('change', this.boundHandleChange);
    } catch (error) {
      // Fallback for older browsers that don't support addEventListener on MediaQueryList
      try {
        this.mediaQuery.addListener(this.boundHandleChange);
      } catch (fallbackError) {
        console.error('SystemThemeDetector: Failed to add theme change listener', fallbackError);
      }
    }
  }

  /**
   * Remove the system theme change listener and clean up resources
   */
  removeSystemThemeListener(): void {
    if (this.mediaQuery && this.boundHandleChange) {
      try {
        this.mediaQuery.removeEventListener('change', this.boundHandleChange);
      } catch (error) {
        // Fallback for older browsers
        try {
          this.mediaQuery.removeListener(this.boundHandleChange);
        } catch (fallbackError) {
          console.warn('SystemThemeDetector: Failed to remove theme change listener', fallbackError);
        }
      }
    }

    // Clear references
    this.changeCallback = null;
    this.boundHandleChange = null;
  }

  /**
   * Check if system theme detection is supported in the current environment
   * @returns true if system theme detection is available
   */
  isSupported(): boolean {
    return this.mediaQuery !== null;
  }

  /**
   * Clean up all resources when the detector is no longer needed
   */
  destroy(): void {
    this.removeSystemThemeListener();
    this.mediaQuery = null;
  }
}

// Export a singleton instance for convenience
export const systemThemeDetector = new SystemThemeDetectorImpl();