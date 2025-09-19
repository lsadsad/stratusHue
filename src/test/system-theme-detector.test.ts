import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SystemThemeDetectorImpl } from '../core/system-theme-detector';
import type { SystemTheme } from '../core/types';

// Mock MediaQueryList for testing
class MockMediaQueryList implements MediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null;
  
  private listeners: ((event: MediaQueryListEvent) => void)[] = [];

  constructor(media: string, matches: boolean = false) {
    this.media = media;
    this.matches = matches;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === 'change' && typeof listener === 'function') {
      this.listeners.push(listener as (event: MediaQueryListEvent) => void);
    }
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === 'change' && typeof listener === 'function') {
      const index = this.listeners.indexOf(listener as (event: MediaQueryListEvent) => void);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    }
  }

  addListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }

  // Helper method to simulate theme change
  simulateChange(newMatches: boolean): void {
    this.matches = newMatches;
    const event = {
      matches: newMatches,
      media: this.media,
    } as MediaQueryListEvent;
    
    this.listeners.forEach(listener => listener(event));
  }
}

describe('SystemThemeDetector', () => {
  let detector: SystemThemeDetectorImpl;
  let mockMediaQuery: MockMediaQueryList;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Store original matchMedia
    originalMatchMedia = window.matchMedia;
    
    // Create mock media query
    mockMediaQuery = new MockMediaQueryList('(prefers-color-scheme: dark)', false);
    
    // Mock window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);
    
    // Create new detector instance
    detector = new SystemThemeDetectorImpl();
  });

  afterEach(() => {
    // Clean up detector
    detector.destroy();
    
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('getCurrentSystemTheme', () => {
    it('should return "light" when system prefers light theme', () => {
      mockMediaQuery.matches = false; // false means light theme
      
      const theme = detector.getCurrentSystemTheme();
      
      expect(theme).toBe('light');
    });

    it('should return "dark" when system prefers dark theme', () => {
      mockMediaQuery.matches = true; // true means dark theme
      
      const theme = detector.getCurrentSystemTheme();
      
      expect(theme).toBe('dark');
    });

    it('should return "dark" as fallback when media query is not available', () => {
      // Mock matchMedia to return null (unsupported)
      window.matchMedia = vi.fn().mockReturnValue(null);
      
      const detectorWithoutSupport = new SystemThemeDetectorImpl();
      const theme = detectorWithoutSupport.getCurrentSystemTheme();
      
      expect(theme).toBe('dark');
      
      detectorWithoutSupport.destroy();
    });

    it('should return "dark" as fallback when media query throws error', () => {
      // Mock media query to throw error on access
      Object.defineProperty(mockMediaQuery, 'matches', {
        get: () => {
          throw new Error('Media query access failed');
        }
      });
      
      const theme = detector.getCurrentSystemTheme();
      
      expect(theme).toBe('dark');
    });
  });

  describe('onSystemThemeChange', () => {
    it('should call callback when system theme changes from light to dark', () => {
      const callback = vi.fn();
      mockMediaQuery.matches = false; // Start with light theme
      
      detector.onSystemThemeChange(callback);
      
      // Simulate change to dark theme
      mockMediaQuery.simulateChange(true);
      
      expect(callback).toHaveBeenCalledWith('dark');
    });

    it('should call callback when system theme changes from dark to light', () => {
      const callback = vi.fn();
      mockMediaQuery.matches = true; // Start with dark theme
      
      detector.onSystemThemeChange(callback);
      
      // Simulate change to light theme
      mockMediaQuery.simulateChange(false);
      
      expect(callback).toHaveBeenCalledWith('light');
    });

    it('should handle callback errors gracefully', () => {
      const callback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      detector.onSystemThemeChange(callback);
      
      // Should not throw when callback throws
      expect(() => {
        mockMediaQuery.simulateChange(true);
      }).not.toThrow();
      
      expect(callback).toHaveBeenCalledWith('dark');
    });

    it('should not add listener when media query is not available', () => {
      // Mock matchMedia to return null
      window.matchMedia = vi.fn().mockReturnValue(null);
      
      const detectorWithoutSupport = new SystemThemeDetectorImpl();
      const callback = vi.fn();
      
      detectorWithoutSupport.onSystemThemeChange(callback);
      
      // Callback should not be called since no listener was added
      expect(callback).not.toHaveBeenCalled();
      
      detectorWithoutSupport.destroy();
    });

    it('should remove previous listener when setting new callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      detector.onSystemThemeChange(callback1);
      detector.onSystemThemeChange(callback2);
      
      mockMediaQuery.simulateChange(true);
      
      // Only the second callback should be called
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('dark');
    });
  });

  describe('removeSystemThemeListener', () => {
    it('should remove event listener and stop calling callback', () => {
      const callback = vi.fn();
      
      detector.onSystemThemeChange(callback);
      detector.removeSystemThemeListener();
      
      mockMediaQuery.simulateChange(true);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle removal when no listener was set', () => {
      expect(() => {
        detector.removeSystemThemeListener();
      }).not.toThrow();
    });

    it('should handle errors during listener removal gracefully', () => {
      const callback = vi.fn();
      
      // Mock removeEventListener to throw error
      mockMediaQuery.removeEventListener = vi.fn().mockImplementation(() => {
        throw new Error('Remove listener failed');
      });
      
      detector.onSystemThemeChange(callback);
      
      expect(() => {
        detector.removeSystemThemeListener();
      }).not.toThrow();
    });
  });

  describe('isSupported', () => {
    it('should return true when media query is available', () => {
      expect(detector.isSupported()).toBe(true);
    });

    it('should return false when media query is not available', () => {
      window.matchMedia = vi.fn().mockReturnValue(null);
      
      const detectorWithoutSupport = new SystemThemeDetectorImpl();
      
      expect(detectorWithoutSupport.isSupported()).toBe(false);
      
      detectorWithoutSupport.destroy();
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      const callback = vi.fn();
      
      detector.onSystemThemeChange(callback);
      detector.destroy();
      
      // Should not call callback after destroy
      mockMediaQuery.simulateChange(true);
      expect(callback).not.toHaveBeenCalled();
      
      // Should not be supported after destroy
      expect(detector.isSupported()).toBe(false);
    });

    it('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        detector.destroy();
        detector.destroy();
      }).not.toThrow();
    });
  });

  describe('fallback for older browsers', () => {
    it('should use addListener/removeListener when addEventListener is not available', () => {
      // Mock older browser behavior
      const mockOldMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: undefined,
        removeEventListener: undefined,
      } as any;
      
      window.matchMedia = vi.fn().mockReturnValue(mockOldMediaQuery);
      
      const oldBrowserDetector = new SystemThemeDetectorImpl();
      const callback = vi.fn();
      
      oldBrowserDetector.onSystemThemeChange(callback);
      
      expect(mockOldMediaQuery.addListener).toHaveBeenCalled();
      
      oldBrowserDetector.removeSystemThemeListener();
      
      expect(mockOldMediaQuery.removeListener).toHaveBeenCalled();
      
      oldBrowserDetector.destroy();
    });
  });

  describe('environment without window object', () => {
    it('should handle missing window object gracefully', () => {
      // Temporarily remove window
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;
      
      const detectorWithoutWindow = new SystemThemeDetectorImpl();
      
      expect(detectorWithoutWindow.getCurrentSystemTheme()).toBe('dark');
      expect(detectorWithoutWindow.isSupported()).toBe(false);
      
      detectorWithoutWindow.destroy();
      
      // Restore window
      globalThis.window = originalWindow;
    });
  });
});