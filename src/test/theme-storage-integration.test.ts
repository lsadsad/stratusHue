// Integration tests for enhanced theme storage system
// Tests the complete flow from ThemeManager to ThemeStorage

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../core/theme-manager';
import { ThemeStorage } from '../core/theme-storage';
import { ThemePreference } from '../core/types';

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

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('Theme Storage Integration', () => {
  let themeManager: ThemeManager;
  let mockSendMessage: any;
  let mockMediaQuery: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Clear static state
    (ThemeStorage as any).inMemoryBackup = null;
    (ThemeStorage as any).lastSuccessfulWrite = 0;
    
    // Setup media query mock
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);
    
    mockSendMessage = vi.fn();
    themeManager = new ThemeManager(mockSendMessage);
  });

  afterEach(() => {
    themeManager.destroy();
  });

  it('should save and load theme preferences end-to-end', async () => {
    // Mock successful storage operations
    mockClientStorage.setAsync.mockResolvedValue(undefined);
    mockClientStorage.getAsync.mockResolvedValue(null);

    // Set a theme preference
    await themeManager.setTheme('cybertron');
    
    // Verify the theme was set
    expect(themeManager.currentTheme).toBe('cybertron');
    expect(themeManager.getEffectiveTheme()).toBe('cybertron');
    
    // Verify storage was called
    expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
      'themePreference',
      expect.objectContaining({
        mode: 'cybertron',
        migrationVersion: 1
      })
    );
  });

  it('should handle storage failures gracefully', async () => {
    // Mock storage failure
    mockClientStorage.setAsync.mockRejectedValue(new Error('Storage failed'));
    mockClientStorage.getAsync.mockRejectedValue(new Error('Storage failed'));

    // Set a theme preference (should not throw)
    await expect(themeManager.setTheme('light')).resolves.not.toThrow();
    
    // Theme should still be set despite storage failure
    expect(themeManager.currentTheme).toBe('light');
    
    // Load theme preference (should not throw and use fallback)
    await expect(themeManager.loadThemePreference()).resolves.not.toThrow();
    
    // Should have in-memory backup
    const health = themeManager.getStorageHealth();
    expect(health.hasInMemoryBackup).toBe(true);
  });

  it('should migrate legacy preferences during load', async () => {
    // Mock legacy string preference
    mockClientStorage.getAsync.mockResolvedValue('figma');
    mockClientStorage.setAsync.mockResolvedValue(undefined);

    // Load theme preference
    await themeManager.loadThemePreference();
    
    // Should migrate 'figma' to 'system'
    expect(themeManager.currentTheme).toBe('system');
    
    // Should save migrated version
    expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
      'themePreference',
      expect.objectContaining({
        mode: 'system',
        migrationVersion: 1
      })
    );
  });

  it('should use backup storage when primary fails', async () => {
    const backupPreference: ThemePreference = {
      mode: 'boilerplate',
      lastSystemTheme: 'dark',
      migrationVersion: 1
    };

    // Mock primary storage failure, backup success
    mockClientStorage.getAsync
      .mockRejectedValueOnce(new Error('Primary failed'))
      .mockResolvedValueOnce(backupPreference);

    // Load theme preference
    await themeManager.loadThemePreference();
    
    // Should use backup preference
    expect(themeManager.currentTheme).toBe('boilerplate');
    
    // Should have called both primary and backup storage
    expect(mockClientStorage.getAsync).toHaveBeenCalledWith('themePreference');
    expect(mockClientStorage.getAsync).toHaveBeenCalledWith('themePreferenceBackup');
  });

  it('should provide accurate storage health information', async () => {
    // Initially no backup
    let health = themeManager.getStorageHealth();
    expect(health.hasInMemoryBackup).toBe(false);
    expect(health.lastSuccessfulWrite).toBe(0);
    expect(health.timeSinceLastWrite).toBe(-1);

    // Mock successful save
    mockClientStorage.setAsync.mockResolvedValue(undefined);
    
    // Save a preference
    await themeManager.setTheme('dark');
    
    // Should now have backup and successful write
    health = themeManager.getStorageHealth();
    expect(health.hasInMemoryBackup).toBe(true);
    expect(health.lastSuccessfulWrite).toBeGreaterThan(0);
    expect(health.timeSinceLastWrite).toBeGreaterThanOrEqual(0);
  });

  it('should clear storage completely', async () => {
    // Setup some storage state
    mockClientStorage.setAsync.mockResolvedValue(undefined);
    await themeManager.setTheme('light');
    
    // Verify we have backup
    expect(themeManager.getStorageHealth().hasInMemoryBackup).toBe(true);
    
    // Mock successful clear
    mockClientStorage.deleteAsync.mockResolvedValue(undefined);
    
    // Clear storage
    const result = await themeManager.clearThemeStorage();
    
    expect(result.success).toBe(true);
    expect(mockClientStorage.deleteAsync).toHaveBeenCalledWith('themePreference');
    expect(mockClientStorage.deleteAsync).toHaveBeenCalledWith('themePreferenceBackup');
    
    // Should clear in-memory backup
    const health = themeManager.getStorageHealth();
    expect(health.hasInMemoryBackup).toBe(false);
    expect(health.lastSuccessfulWrite).toBe(0);
  });

  it('should handle system theme changes with storage persistence', async () => {
    mockClientStorage.setAsync.mockResolvedValue(undefined);
    
    // Set to system mode
    await themeManager.setTheme('system');
    expect(themeManager.currentTheme).toBe('system');
    
    // Simulate system theme change
    mockMediaQuery.matches = true; // Switch to dark
    const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
    changeHandler({ matches: true });
    
    // Should update effective theme but keep mode as system
    expect(themeManager.currentTheme).toBe('system');
    expect(themeManager.getEffectiveTheme()).toBe('figma-dark');
    
    // Storage should have been called with system mode
    expect(mockClientStorage.setAsync).toHaveBeenCalledWith(
      'themePreference',
      expect.objectContaining({
        mode: 'system',
        migrationVersion: 1
      })
    );
  });
});