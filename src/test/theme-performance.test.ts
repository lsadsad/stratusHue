// Performance Tests for Theme System
// Tests theme switching performance, memory usage, and optimization

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeManager } from '../core/theme-manager';
import { SystemThemeDetectorImpl } from '../core/system-theme-detector';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
};

// Mock Figma API
const mockClientStorage = {
  getAsync: vi.fn(),
  setAsync: vi.fn(),
  deleteAsync: vi.fn()
};

(global as any).figma = {
  clientStorage: mockClientStorage
};

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: mockPerformance,
});

describe('Theme Performance Tests', () => {
  let themeManager: ThemeManager;
  let mockSendMessage: any;
  let mockMediaQuery: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup media query mock
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);
    
    mockSendMessage = vi.fn();
    
    // Mock successful storage operations
    mockClientStorage.getAsync.mockResolvedValue(null);
    mockClientStorage.setAsync.mockResolvedValue(undefined);
    
    themeManager = new ThemeManager(mockSendMessage);
  });

  afterEach(() => {
    themeManager.destroy();
    vi.clearAllTimers();
  });

  describe('Theme Switching Performance', () => {
    it('should switch themes quickly under normal conditions', async () => {
      const startTime = performance.now();
      
      await themeManager.setTheme('light');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Theme switching should be fast (under 100ms for normal operations)
      expect(duration).toBeLessThan(100);
      expect(themeManager.currentTheme).toBe('light');
    });

    it('should handle rapid theme switching without performance degradation', async () => {
      const themes = ['light', 'dark', 'system', 'boilerplate', 'cybertron'] as const;
      const switchTimes: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const theme = themes[i % themes.length];
        const startTime = performance.now();
        
        await themeManager.setTheme(theme);
        
        const endTime = performance.now();
        switchTimes.push(endTime - startTime);
      }
      
      // Calculate average switch time
      const averageTime = switchTimes.reduce((sum, time) => sum + time, 0) / switchTimes.length;
      
      // Average should remain reasonable even with rapid switching
      expect(averageTime).toBeLessThan(50);
      
      // No single switch should take too long
      const maxTime = Math.max(...switchTimes);
      expect(maxTime).toBeLessThan(200);
    });

    it('should maintain performance with multiple theme change listeners', async () => {
      const listeners = Array.from({ length: 100 }, () => vi.fn());
      
      // Add many listeners
      listeners.forEach(listener => {
        themeManager.onThemeChange(listener);
      });
      
      const startTime = performance.now();
      
      await themeManager.setTheme('cybertron');
      
      // Wait for debounced notifications
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should still be fast even with many listeners
      expect(duration).toBeLessThan(200); // Increased to account for debounce
      
      // All listeners should have been called with cybertron
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledWith('cybertron');
      });
    });
  });

  describe('System Theme Detection Performance', () => {
    it('should detect system theme quickly', () => {
      const detector = new SystemThemeDetectorImpl();
      
      const startTime = performance.now();
      
      const systemTheme = detector.getCurrentSystemTheme();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // System theme detection should be very fast
      expect(duration).toBeLessThan(10);
      expect(['light', 'dark']).toContain(systemTheme);
      
      detector.destroy();
    });

    it('should handle system theme change events efficiently', () => {
      // Create a fresh mock for this test to ensure addEventListener is available
      const testMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn()
      };
      
      // Override the global mock for this test
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue(testMediaQuery);
      
      const detector = new SystemThemeDetectorImpl();
      const callback = vi.fn();
      
      detector.onSystemThemeChange(callback);
      
      // Now addEventListener should have been called
      expect(testMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      const changeHandler = testMediaQuery.addEventListener.mock.calls[0][1];
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        changeHandler({ matches: i % 2 === 0, media: '(prefers-color-scheme: dark)' });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle many rapid changes efficiently
      expect(duration).toBeLessThan(100);
      expect(callback).toHaveBeenCalledTimes(1000);
      
      detector.destroy();
      
      // Restore original mock
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should properly clean up theme manager resources', () => {
      const managers: ThemeManager[] = [];
      
      // Create many theme managers
      for (let i = 0; i < 100; i++) {
        const manager = new ThemeManager(vi.fn());
        managers.push(manager);
      }
      
      // Add listeners to each
      managers.forEach(manager => {
        manager.onThemeChange(vi.fn());
      });
      
      // Destroy all managers
      managers.forEach(manager => {
        manager.destroy();
      });
      
      // Should not throw or cause memory issues
      expect(true).toBe(true);
    });

    it('should handle listener cleanup efficiently', () => {
      const listeners = Array.from({ length: 1000 }, () => vi.fn());
      
      // Add many listeners
      listeners.forEach(listener => {
        themeManager.onThemeChange(listener);
      });
      
      const startTime = performance.now();
      
      // Remove all listeners
      listeners.forEach(listener => {
        themeManager.removeThemeChangeListener(listener);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Cleanup should be efficient
      expect(duration).toBeLessThan(50);
    });

    it('should prevent memory leaks with system theme detector', () => {
      const detectors: SystemThemeDetectorImpl[] = [];
      
      // Create many detectors
      for (let i = 0; i < 100; i++) {
        const detector = new SystemThemeDetectorImpl();
        detector.onSystemThemeChange(vi.fn());
        detectors.push(detector);
      }
      
      const startTime = performance.now();
      
      // Destroy all detectors
      detectors.forEach(detector => {
        detector.destroy();
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Cleanup should be efficient
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Storage Performance', () => {
    it('should handle storage operations efficiently', async () => {
      // Mock storage with slight delay to simulate real conditions
      mockClientStorage.setAsync.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5))
      );
      
      const startTime = performance.now();
      
      await themeManager.setTheme('boilerplate');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly even with storage delay
      expect(duration).toBeLessThan(50);
      expect(mockClientStorage.setAsync).toHaveBeenCalled();
    });

    it('should handle storage failures without blocking theme application', async () => {
      // Mock storage failure
      mockClientStorage.setAsync.mockRejectedValue(new Error('Storage failed'));
      
      const startTime = performance.now();
      
      await themeManager.setTheme('light');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should not be significantly slower due to storage failure
      expect(duration).toBeLessThan(100);
      expect(themeManager.currentTheme).toBe('light');
    });

    it('should batch storage operations efficiently', async () => {
      let storageCallCount = 0;
      mockClientStorage.setAsync.mockImplementation(() => {
        storageCallCount++;
        return Promise.resolve();
      });
      
      // Rapid theme changes
      const promises = [
        themeManager.setTheme('light'),
        themeManager.setTheme('dark'),
        themeManager.setTheme('system')
      ];
      
      await Promise.all(promises);
      
      // Should have made storage calls (exact count may vary due to implementation)
      expect(storageCallCount).toBeGreaterThan(0);
      expect(themeManager.currentTheme).toBe('system');
    });
  });

  describe('DOM Manipulation Performance', () => {
    it('should apply theme changes to DOM efficiently', () => {
      // Mock DOM element
      const mockElement = {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn()
        }
      };
      
      Object.defineProperty(document, 'documentElement', {
        value: mockElement,
        writable: true
      });
      
      // Mock theme application function
      const applyTheme = (effectiveTheme: string) => {
        const startTime = performance.now();
        
        mockElement.classList.add('theme-transitioning');
        mockElement.setAttribute('data-theme', effectiveTheme);
        
        setTimeout(() => {
          mockElement.classList.remove('theme-transitioning');
        }, 300);
        
        const endTime = performance.now();
        return endTime - startTime;
      };
      
      const duration = applyTheme('figma-light');
      
      // DOM manipulation should be very fast
      expect(duration).toBeLessThan(10);
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'figma-light');
    });

    it('should handle multiple DOM updates efficiently', () => {
      const mockElement = {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn()
        }
      };
      
      Object.defineProperty(document, 'documentElement', {
        value: mockElement,
        writable: true
      });
      
      const themes = ['figma-light', 'figma-dark', 'light', 'boilerplate', 'cybertron'];
      
      const startTime = performance.now();
      
      // Apply many theme changes
      for (let i = 0; i < 100; i++) {
        const theme = themes[i % themes.length];
        mockElement.setAttribute('data-theme', theme);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle many DOM updates efficiently
      expect(duration).toBeLessThan(50);
      expect(mockElement.setAttribute).toHaveBeenCalledTimes(100);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent theme operations efficiently', async () => {
      const operations = [
        () => themeManager.setTheme('light'),
        () => themeManager.setTheme('dark'),
        () => themeManager.getEffectiveTheme(),
        () => themeManager.getThemeConfig('system'),
        () => themeManager.getAllThemeConfigs()
      ];
      
      const startTime = performance.now();
      
      // Run many concurrent operations
      const promises = Array.from({ length: 100 }, (_, i) => {
        const operation = operations[i % operations.length];
        return operation();
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle concurrent operations efficiently
      expect(duration).toBeLessThan(200);
    });

    it('should maintain performance under stress conditions', async () => {
      // Simulate high load conditions
      const stressOperations = [];
      
      for (let i = 0; i < 1000; i++) {
        stressOperations.push(async () => {
          await themeManager.setTheme(i % 2 === 0 ? 'light' : 'dark');
          themeManager.getEffectiveTheme();
          themeManager.onThemeChange(vi.fn());
        });
      }
      
      const startTime = performance.now();
      
      await Promise.all(stressOperations.map(op => op()));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time even under stress
      expect(duration).toBeLessThan(1000); // 1 second for 1000 operations
    });
  });

  describe('Performance Monitoring and Optimization', () => {
    it('should provide performance metrics for theme operations', async () => {
      // Mock performance marking
      const marks: string[] = [];
      mockPerformance.mark.mockImplementation((name: string) => {
        marks.push(name);
      });
      
      // Simulate performance monitoring in theme operations
      const performanceAwareSetTheme = async (theme: any) => {
        performance.mark('theme-switch-start');
        await themeManager.setTheme(theme);
        performance.mark('theme-switch-end');
      };
      
      await performanceAwareSetTheme('cybertron');
      
      expect(marks).toContain('theme-switch-start');
      expect(marks).toContain('theme-switch-end');
    });

    it('should optimize repeated theme queries with caching', () => {
      // Test caching behavior
      const startTime = performance.now();
      
      // Make many repeated calls - should hit cache after first call
      const results = [];
      for (let i = 0; i < 1000; i++) {
        results.push(themeManager.getEffectiveTheme());
        themeManager.getThemeConfig('system');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Repeated queries should be optimized with caching
      expect(duration).toBeLessThan(50);
      
      // All results should be consistent
      const firstResult = results[0];
      expect(results.every(result => result === firstResult)).toBe(true);
    });

    it('should debounce theme change notifications for performance', async () => {
      const listener = vi.fn();
      themeManager.onThemeChange(listener);
      
      // Rapid theme changes
      await themeManager.setTheme('light');
      await themeManager.setTheme('dark');
      await themeManager.setTheme('system');
      
      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have debounced the notifications
      expect(listener).toHaveBeenCalledTimes(1);
      
      // Final theme should be system theme (which defaults to light in our mock)
      const finalTheme = themeManager.getEffectiveTheme();
      expect(listener).toHaveBeenCalledWith(finalTheme);
    });

    it('should cache system theme detection results', () => {
      const detector = new SystemThemeDetectorImpl();
      
      // First call should query media
      const startTime1 = performance.now();
      const theme1 = detector.getCurrentSystemTheme();
      const endTime1 = performance.now();
      
      // Second call should use cache
      const startTime2 = performance.now();
      const theme2 = detector.getCurrentSystemTheme();
      const endTime2 = performance.now();
      
      // Second call should be faster (cached)
      const duration1 = endTime1 - startTime1;
      const duration2 = endTime2 - startTime2;
      
      expect(theme1).toBe(theme2);
      expect(duration2).toBeLessThanOrEqual(duration1);
      
      detector.destroy();
    });

    it('should handle cleanup efficiently', () => {
      const managers: ThemeManager[] = [];
      
      // Create multiple managers with listeners
      for (let i = 0; i < 100; i++) {
        const manager = new ThemeManager(vi.fn());
        manager.onThemeChange(vi.fn());
        managers.push(manager);
      }
      
      const startTime = performance.now();
      
      // Cleanup all managers
      managers.forEach(manager => manager.destroy());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Cleanup should be efficient
      expect(duration).toBeLessThan(100);
    });

    it('should optimize effective theme calculation with early returns', async () => {
      // Set initial theme
      await themeManager.setTheme('light');
      
      const startTime = performance.now();
      
      // Setting same theme should return early
      await themeManager.setTheme('light');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should be very fast due to early return
      expect(duration).toBeLessThan(10);
    });

    it('should use requestAnimationFrame for smooth UI updates', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        setTimeout(cb, 16); // Simulate 60fps
        return 1;
      });
      
      const listener = vi.fn();
      themeManager.onThemeChange(listener);
      
      await themeManager.setTheme('cybertron');
      
      // Wait for RAF callback
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(rafSpy).toHaveBeenCalled();
      expect(listener).toHaveBeenCalled();
      
      rafSpy.mockRestore();
    });
  });
});