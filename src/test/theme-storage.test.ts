// Theme Storage System Tests
// Tests for enhanced theme storage with migration, error handling, and backup

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThemeStorage, ThemeStorageResult } from '../core/theme-storage';
import { ThemePreference, ThemeMode } from '../core/types';

// Mock Figma API
const mockClientStorage = {
  getAsync: vi.fn(),
  setAsync: vi.fn(),
  deleteAsync: vi.fn()
};

// Mock figma global
(global as any).figma = {
  clientStorage: mockClientStorage
};

describe('ThemeStorage', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear static state
    (ThemeStorage as any).inMemoryBackup = null;
    (ThemeStorage as any).lastSuccessfulWrite = 0;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('loadThemePreference', () => {
    it('should load valid theme preference from storage', async () => {
      const mockPreference: ThemePreference = {
        mode: 'dark',
        lastSystemTheme: 'dark',
        migrationVersion: 1
      };
      
      mockClientStorage.getAsync.mockResolvedValue(mockPreference);
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreference);
      expect(result.usedFallback).toBeUndefined();
      expect(mockClientStorage.getAsync).toHaveBeenCalledWith('themePreference');
    });

    it('should return default preference when no stored preference exists', async () => {
      mockClientStorage.getAsync.mockResolvedValue(null);
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        mode: 'system',
        migrationVersion: 1
      });
    });

    it('should migrate legacy string theme preferences', async () => {
      mockClientStorage.getAsync.mockResolvedValue('figma');
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('system'); // 'figma' migrates to 'system'
      expect(result.data?.migrationVersion).toBe(1);
      
      // Should save migrated version
      expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
        'themePreference',
        expect.objectContaining({
          mode: 'system',
          migrationVersion: 1
        })
      );
    });

    it('should migrate legacy object without migration version', async () => {
      const legacyPreference = {
        mode: 'light',
        lastSystemTheme: 'light'
        // No migrationVersion
      };
      
      mockClientStorage.getAsync.mockResolvedValue(legacyPreference);
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('light');
      expect(result.data?.migrationVersion).toBe(1);
    });

    it('should handle invalid theme modes gracefully', async () => {
      const invalidPreference = {
        mode: 'invalid-theme',
        migrationVersion: 0
      };
      
      mockClientStorage.getAsync.mockResolvedValue(invalidPreference);
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('system'); // Invalid mode defaults to 'system'
    });

    it('should use backup storage when primary storage fails', async () => {
      const backupPreference: ThemePreference = {
        mode: 'light',
        migrationVersion: 1
      };
      
      mockClientStorage.getAsync
        .mockRejectedValueOnce(new Error('Primary storage failed'))
        .mockResolvedValueOnce(backupPreference);
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(backupPreference);
      expect(result.usedFallback).toBe(true);
      expect(mockClientStorage.getAsync).toHaveBeenCalledWith('themePreference');
      expect(mockClientStorage.getAsync).toHaveBeenCalledWith('themePreferenceBackup');
    });

    it('should use in-memory backup when both storages fail', async () => {
      // Set up in-memory backup
      const memoryBackup: ThemePreference = {
        mode: 'dark',
        migrationVersion: 1
      };
      (ThemeStorage as any).inMemoryBackup = memoryBackup;
      
      mockClientStorage.getAsync.mockRejectedValue(new Error('Storage failed'));
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(memoryBackup);
      expect(result.usedFallback).toBe(true);
    });

    it('should return default when all fallbacks fail', async () => {
      mockClientStorage.getAsync.mockRejectedValue(new Error('Storage failed'));
      
      const result = await ThemeStorage.loadThemePreference();
      
      expect(result.success).toBe(false);
      expect(result.data).toEqual({
        mode: 'system',
        migrationVersion: 1
      });
      expect(result.usedFallback).toBe(true);
      expect(result.error).toBe('Storage unavailable, using default theme');
    });
  });

  describe('saveThemePreference', () => {
    it('should save theme preference successfully', async () => {
      const preference: ThemePreference = {
        mode: 'light',
        lastSystemTheme: 'light',
        migrationVersion: 1
      };
      
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.saveThemePreference(preference);
      
      expect(result.success).toBe(true);
      expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
        'themePreference',
        expect.objectContaining({
          mode: 'light',
          lastSystemTheme: 'light',
          migrationVersion: 1
        })
      );
    });

    it('should set migration version if not provided', async () => {
      const preference: ThemePreference = {
        mode: 'dark'
        // No migrationVersion
      };
      
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.saveThemePreference(preference);
      
      expect(result.success).toBe(true);
      expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
        'themePreference',
        expect.objectContaining({
          mode: 'dark',
          migrationVersion: 1
        })
      );
    });

    it('should handle storage failures gracefully', async () => {
      const preference: ThemePreference = {
        mode: 'light',
        migrationVersion: 1
      };
      
      mockClientStorage.setAsync.mockRejectedValue(new Error('Storage failed'));
      
      const result = await ThemeStorage.saveThemePreference(preference);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save theme preference to storage');
      
      // Should still update in-memory backup
      const health = ThemeStorage.getStorageHealth();
      expect(health.hasInMemoryBackup).toBe(true);
    });

    it('should create backup storage asynchronously', async () => {
      const preference: ThemePreference = {
        mode: 'cybertron',
        migrationVersion: 1
      };
      
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.saveThemePreference(preference);
      
      expect(result.success).toBe(true);
      
      // Primary storage should be called immediately
      expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
        'themePreference',
        expect.objectContaining({
          mode: 'cybertron',
          migrationVersion: 1
        })
      );
      
      // Note: Backup storage is called asynchronously via setTimeout
      // We can't easily test this without mocking setTimeout, but we can verify
      // that the primary save succeeded and in-memory backup was updated
      const health = ThemeStorage.getStorageHealth();
      expect(health.hasInMemoryBackup).toBe(true);
    });
  });

  describe('migration logic', () => {
    const testCases: Array<{
      input: any;
      expected: ThemeMode;
      description: string;
    }> = [
      { input: 'figma', expected: 'system', description: 'legacy figma theme' },
      { input: 'light', expected: 'light', description: 'legacy light theme' },
      { input: 'dark', expected: 'dark', description: 'legacy dark theme' },
      { input: 'boilerplate', expected: 'boilerplate', description: 'legacy boilerplate theme' },
      { input: 'cybertron', expected: 'cybertron', description: 'legacy cybertron theme' },
      { input: 'invalid', expected: 'system', description: 'invalid theme string' },
      { input: null, expected: 'system', description: 'null input' },
      { input: undefined, expected: 'system', description: 'undefined input' },
      { input: 123, expected: 'system', description: 'non-string input' }
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`should migrate ${description} correctly`, async () => {
        mockClientStorage.getAsync.mockResolvedValue(input);
        mockClientStorage.setAsync.mockResolvedValue(undefined);
        
        const result = await ThemeStorage.loadThemePreference();
        
        expect(result.success).toBe(true);
        expect(result.data?.mode).toBe(expected);
      });
    });
  });

  describe('storage health', () => {
    it('should report storage health correctly', async () => {
      const preference: ThemePreference = {
        mode: 'light',
        migrationVersion: 1
      };
      
      mockClientStorage.setAsync.mockResolvedValue(undefined);
      
      const beforeHealth = ThemeStorage.getStorageHealth();
      expect(beforeHealth.hasInMemoryBackup).toBe(false);
      expect(beforeHealth.lastSuccessfulWrite).toBe(0);
      
      await ThemeStorage.saveThemePreference(preference);
      
      const afterHealth = ThemeStorage.getStorageHealth();
      expect(afterHealth.hasInMemoryBackup).toBe(true);
      expect(afterHealth.lastSuccessfulWrite).toBeGreaterThan(0);
      expect(afterHealth.timeSinceLastWrite).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearThemeStorage', () => {
    it('should clear all theme storage', async () => {
      mockClientStorage.deleteAsync.mockResolvedValue(undefined);
      
      const result = await ThemeStorage.clearThemeStorage();
      
      expect(result.success).toBe(true);
      expect(mockClientStorage.deleteAsync).toHaveBeenCalledWith('themePreference');
      expect(mockClientStorage.deleteAsync).toHaveBeenCalledWith('themePreferenceBackup');
      
      const health = ThemeStorage.getStorageHealth();
      expect(health.hasInMemoryBackup).toBe(false);
      expect(health.lastSuccessfulWrite).toBe(0);
    });

    it('should handle clear storage failures', async () => {
      mockClientStorage.deleteAsync.mockRejectedValue(new Error('Delete failed'));
      
      const result = await ThemeStorage.clearThemeStorage();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to clear theme storage');
    });
  });
});