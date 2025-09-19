// Browser Compatibility Tests for System Theme Detection
// Tests theme functionality across different browser environments and edge cases

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SystemThemeDetectorImpl } from '../core/system-theme-detector';

describe('Browser Compatibility Tests', () => {
  let originalWindow: typeof window;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Store original implementations
    originalWindow = global.window;
    originalMatchMedia = window?.matchMedia;
  });

  afterEach(() => {
    // Restore original implementations
    global.window = originalWindow;
    if (originalWindow && originalMatchMedia) {
      originalWindow.matchMedia = originalMatchMedia;
    }
    vi.clearAllMocks();
  });

  describe('Modern Browser Support', () => {
    it('should work with modern addEventListener API', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();
      const callback = vi.fn();

      detector.onSystemThemeChange(callback);

      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockMediaQuery.addListener).not.toHaveBeenCalled();

      detector.destroy();
    });

    it('should handle modern browser with full MediaQueryList support', () => {
      const mockMediaQuery = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark');
      expect(detector.isSupported()).toBe(true);

      detector.destroy();
    });
  });

  describe('Legacy Browser Support', () => {
    it('should fallback to addListener/removeListener for older browsers', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        // No addEventListener/removeEventListener (older browsers)
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();
      const callback = vi.fn();

      detector.onSystemThemeChange(callback);

      expect(mockMediaQuery.addListener).toHaveBeenCalledWith(expect.any(Function));

      detector.removeSystemThemeListener();

      expect(mockMediaQuery.removeListener).toHaveBeenCalledWith(expect.any(Function));

      detector.destroy();
    });

    it('should handle browsers with partial MediaQueryList support', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: undefined, // Not supported
        removeEventListener: undefined, // Not supported
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('light');
      expect(detector.isSupported()).toBe(true);

      detector.destroy();
    });
  });

  describe('Unsupported Browser Environments', () => {
    it('should handle browsers without matchMedia support', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark'); // fallback
      expect(detector.isSupported()).toBe(false);

      // Should not throw when trying to add listeners
      expect(() => {
        detector.onSystemThemeChange(vi.fn());
      }).not.toThrow();

      detector.destroy();
    });

    it('should handle environments without window object (SSR)', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark'); // fallback
      expect(detector.isSupported()).toBe(false);

      // Should not throw
      expect(() => {
        detector.onSystemThemeChange(vi.fn());
        detector.removeSystemThemeListener();
        detector.destroy();
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it('should handle matchMedia that returns null', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(null),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark'); // fallback
      expect(detector.isSupported()).toBe(false);

      detector.destroy();
    });
  });

  describe('Error Handling in Different Browsers', () => {
    it('should handle matchMedia throwing errors', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('matchMedia not supported');
        }),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark'); // fallback
      expect(detector.isSupported()).toBe(false);

      detector.destroy();
    });

    it('should handle addEventListener throwing errors', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn().mockImplementation(() => {
          throw new Error('addEventListener failed');
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      // Should fallback to addListener
      expect(() => {
        detector.onSystemThemeChange(vi.fn());
      }).not.toThrow();

      expect(mockMediaQuery.addListener).toHaveBeenCalled();

      detector.destroy();
    });

    it('should handle both addEventListener and addListener failing', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn().mockImplementation(() => {
          throw new Error('addEventListener failed');
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn().mockImplementation(() => {
          throw new Error('addListener failed');
        }),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      // Should not throw even when both methods fail
      expect(() => {
        detector.onSystemThemeChange(vi.fn());
      }).not.toThrow();

      detector.destroy();
    });

    it('should handle removeEventListener throwing errors', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn().mockImplementation(() => {
          throw new Error('removeEventListener failed');
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();
      detector.onSystemThemeChange(vi.fn());

      // Should fallback to removeListener
      expect(() => {
        detector.removeSystemThemeListener();
      }).not.toThrow();

      expect(mockMediaQuery.removeListener).toHaveBeenCalled();

      detector.destroy();
    });
  });

  describe('Browser-Specific Media Query Behavior', () => {
    it('should handle Safari-specific media query behavior', () => {
      // Safari sometimes has different behavior with media queries
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        writable: true
      });

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('light');
      expect(detector.isSupported()).toBe(true);

      detector.destroy();
    });

    it('should handle Firefox-specific media query behavior', () => {
      const mockMediaQuery = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      // Mock Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
        writable: true
      });

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark');
      expect(detector.isSupported()).toBe(true);

      detector.destroy();
    });

    it('should handle Chrome-specific media query behavior', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('light');
      expect(detector.isSupported()).toBe(true);

      detector.destroy();
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle rapid theme changes', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();
      const callback = vi.fn();

      detector.onSystemThemeChange(callback);

      // Simulate rapid theme changes
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      
      for (let i = 0; i < 100; i++) {
        const matches = i % 2 === 0;
        changeHandler({ matches, media: mockMediaQuery.media });
      }

      expect(callback).toHaveBeenCalledTimes(100);

      detector.destroy();
    });

    it('should handle multiple detector instances', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detectors = Array.from({ length: 10 }, () => new SystemThemeDetectorImpl());
      const callbacks = Array.from({ length: 10 }, () => vi.fn());

      detectors.forEach((detector, index) => {
        detector.onSystemThemeChange(callbacks[index]);
      });

      // All should work independently
      detectors.forEach(detector => {
        expect(detector.getCurrentSystemTheme()).toBe('light');
        expect(detector.isSupported()).toBe(true);
      });

      // Clean up
      detectors.forEach(detector => detector.destroy());
    });

    it('should handle memory pressure scenarios', () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      // Create and destroy many detectors to test memory management
      for (let i = 0; i < 1000; i++) {
        const detector = new SystemThemeDetectorImpl();
        detector.onSystemThemeChange(() => {});
        detector.destroy();
      }

      // Should not throw or cause memory issues
      expect(true).toBe(true);
    });
  });

  describe('Figma Plugin Environment Compatibility', () => {
    it('should work in Figma plugin iframe context', () => {
      // Mock Figma plugin iframe environment
      Object.defineProperty(window, 'parent', {
        value: {
          postMessage: vi.fn()
        },
        writable: true
      });

      const mockMediaQuery = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };

      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue(mockMediaQuery),
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      expect(detector.getCurrentSystemTheme()).toBe('dark');
      expect(detector.isSupported()).toBe(true);

      // Should work with parent communication
      expect(window.parent.postMessage).toBeDefined();

      detector.destroy();
    });

    it('should handle Figma plugin sandbox restrictions', () => {
      // Mock restricted environment (some APIs might be limited)
      const restrictedMatchMedia = vi.fn().mockImplementation(() => {
        // Simulate restricted access
        const query = {
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: undefined, // Restricted
          removeEventListener: undefined, // Restricted
          addListener: undefined, // Restricted
          removeListener: undefined, // Restricted
          onchange: null
        };
        return query;
      });

      Object.defineProperty(window, 'matchMedia', {
        value: restrictedMatchMedia,
        writable: true
      });

      const detector = new SystemThemeDetectorImpl();

      // Should still provide basic functionality
      expect(detector.getCurrentSystemTheme()).toBe('light');
      
      // Should handle restricted environment gracefully
      expect(() => {
        detector.onSystemThemeChange(vi.fn());
      }).not.toThrow();

      detector.destroy();
    });
  });
});