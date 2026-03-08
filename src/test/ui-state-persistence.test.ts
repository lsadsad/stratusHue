// UI State Persistence Tests
// Tests for saving and restoring UI section states across plugin sessions

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  uiSectionStates,
  loadUISectionStates,
  saveUISectionState,
  debouncedSaveUISectionState,
  getSectionState,
  initializeDefaultStates
} from '../core/state';

// Mock Figma API
const mockClientStorage = {
  getAsync: vi.fn(),
  setAsync: vi.fn()
};

// Mock figma global
(global as any).figma = {
  clientStorage: mockClientStorage
};

describe('UI State Persistence', () => {
  beforeEach(() => {
    // Reset state before each test
    (global as any).uiSectionStates = {};
    mockClientStorage.getAsync.mockClear();
    mockClientStorage.setAsync.mockClear();
    vi.clearAllTimers();
  });

  describe('loadUISectionStates', () => {
    it('should load valid state data from storage', async () => {
      const mockData = {
        'tags-header': { expanded: false, lastModified: 1640995200000 },
        'anchors-header': { expanded: true, lastModified: 1640995200000 }
      };
      mockClientStorage.getAsync.mockResolvedValue(mockData);

      await loadUISectionStates();

      expect(mockClientStorage.getAsync).toHaveBeenCalledWith('uiSectionStates');
      expect(uiSectionStates).toEqual(mockData);
    });

    it('should handle missing storage data gracefully', async () => {
      mockClientStorage.getAsync.mockResolvedValue(null);

      await loadUISectionStates();

      expect(uiSectionStates).toEqual({});
    });

    it('should handle corrupted storage data gracefully', async () => {
      mockClientStorage.getAsync.mockResolvedValue('invalid-json');

      await loadUISectionStates();

      expect(uiSectionStates).toEqual({});
    });

    it('should handle storage errors gracefully', async () => {
      mockClientStorage.getAsync.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await loadUISectionStates();

      expect(uiSectionStates).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load UI section states:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveUISectionState', () => {
    it('should save section state to storage', async () => {
      const sectionId = 'tags-header';
      const expanded = false;
      const mockTimestamp = 1640995200000;
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      await saveUISectionState(sectionId, expanded);

      expect(uiSectionStates[sectionId]).toEqual({
        expanded: false,
        lastModified: mockTimestamp
      });
      expect(mockClientStorage.setAsync).toHaveBeenCalledWith('uiSectionStates', uiSectionStates);
    });

    it('should handle storage save errors gracefully', async () => {
      mockClientStorage.setAsync.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await saveUISectionState('tags-header', false);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save UI section state:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should update existing section state', async () => {
      const sectionId = 'tags-header';
      
      // Save initial state
      await saveUISectionState(sectionId, false);
      expect(uiSectionStates[sectionId].expanded).toBe(false);
      
      // Update state
      await saveUISectionState(sectionId, true);
      expect(uiSectionStates[sectionId].expanded).toBe(true);
    });
  });

  describe('debouncedSaveUISectionState', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce multiple rapid calls', async () => {
      const sectionId = 'tags-header';
      
      // Make multiple rapid calls
      debouncedSaveUISectionState(sectionId, false);
      debouncedSaveUISectionState(sectionId, true);
      debouncedSaveUISectionState(sectionId, false);

      // Should not have saved yet
      expect(mockClientStorage.setAsync).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      // Should have saved only the final state
      expect(mockClientStorage.setAsync).toHaveBeenCalledTimes(1);
      expect(uiSectionStates[sectionId].expanded).toBe(false);
    });

    it('should save after debounce timeout', async () => {
      const sectionId = 'tags-header';
      
      debouncedSaveUISectionState(sectionId, true);

      // Should not have saved immediately
      expect(mockClientStorage.setAsync).not.toHaveBeenCalled();

      // Fast-forward past debounce delay
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();

      // Should have saved after timeout
      expect(mockClientStorage.setAsync).toHaveBeenCalledTimes(1);
      expect(uiSectionStates[sectionId].expanded).toBe(true);
    });
  });

  describe('getSectionState', () => {
    it('should return saved expanded state', async () => {
      const sectionId = 'tags-header';
      await saveUISectionState(sectionId, false);

      const result = getSectionState(sectionId);

      expect(result).toBe(false);
    });

    it('should return default expanded state for unknown sections', () => {
      const result = getSectionState('unknown-section');

      expect(result).toBe(true);
    });

    it('should return default expanded state when no saved state exists', async () => {
      mockClientStorage.getAsync.mockResolvedValue(null);
      await loadUISectionStates();

      const result = getSectionState('tags-header');

      expect(result).toBe(true);
    });
  });

  describe('initializeDefaultStates', () => {
    it('should return default expanded states for all sections', () => {
      const mockTimestamp = 1640995200000;
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      const defaultStates = initializeDefaultStates();

      expect(defaultStates).toEqual({
        'tags-header': { expanded: true, lastModified: mockTimestamp },
        'anchors-header': { expanded: true, lastModified: mockTimestamp },
        'navigation-header': { expanded: true, lastModified: mockTimestamp }
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should complete save operations within 50ms', async () => {
      const startTime = performance.now();
      
      await saveUISectionState('tags-header', false);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
    });

    it('should complete load operations within 50ms', async () => {
      mockClientStorage.getAsync.mockResolvedValue({
        'tags-header': { expanded: false, lastModified: Date.now() }
      });

      const startTime = performance.now();
      
      await loadUISectionStates();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Cross-Session Persistence', () => {
    it('should maintain state consistency across plugin instances', async () => {
      const mockData = {
        'tags-header': { expanded: false, lastModified: 1640995200000 },
        'anchors-header': { expanded: true, lastModified: 1640995200000 }
      };

      // Simulate first plugin instance saving state
      await saveUISectionState('tags-header', false);
      await saveUISectionState('anchors-header', true);

      // Simulate second plugin instance loading state
      mockClientStorage.getAsync.mockResolvedValue(mockData);
      await loadUISectionStates();

      expect(getSectionState('tags-header')).toBe(false);
      expect(getSectionState('anchors-header')).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should fall back to default states when storage is corrupted', async () => {
      mockClientStorage.getAsync.mockResolvedValue({ invalid: 'data' });

      await loadUISectionStates();

      // Should fall back to default expanded state
      expect(getSectionState('tags-header')).toBe(true);
      expect(getSectionState('anchors-header')).toBe(true);
      expect(getSectionState('navigation-header')).toBe(true);
    });

    it('should continue working when storage operations fail', async () => {
      mockClientStorage.setAsync.mockRejectedValue(new Error('Storage full'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw error
      await expect(saveUISectionState('tags-header', false)).resolves.toBeUndefined();

      // Should still update in-memory state
      expect(uiSectionStates['tags-header'].expanded).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });
});