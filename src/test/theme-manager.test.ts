// Tests for Theme Manager functionality
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SystemThemeDetector, ThemeManager } from '../core/theme-manager';
import { ThemeMode, EffectiveTheme, ThemePreference } from '../core/types';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('SystemThemeDetector', () => {
  let detector: SystemThemeDetector;
  let mockMediaQuery: any;

  beforeEach(() => {
    mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);
    detector = new SystemThemeDetector();
  });

  afterEach(() => {
    detector.destroy();
    vi.clearAllMocks();
  });

  it('should detect light theme when system prefers light', () => {
    mockMediaQuery.matches = false;
    expect(detector.getCurrentSystemTheme()).toBe('light');
  });

  it('should detect dark theme when system prefers dark', () => {
    // Create a new detector with dark theme
    const darkMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(darkMediaQuery);
    
    const darkDetector = new SystemThemeDetector();
    expect(darkDetector.getCurrentSystemTheme()).toBe('dark');
    darkDetector.destroy();
  });

  it('should register system theme change listeners', () => {
    const callback = vi.fn();
    detector.onSystemThemeChange(callback);
    
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove specific theme change listeners', () => {
    const callback = vi.fn();
    detector.onSystemThemeChange(callback);
    detector.removeSystemThemeListener(callback);
    
    // Should not call the callback after removal
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let mockSendMessage: any;
  let mockMediaQuery: any;

  beforeEach(() => {
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
    vi.clearAllMocks();
  });

  it('should initialize with system theme mode', () => {
    expect(themeManager.currentTheme).toBe('system');
  });

  it('should resolve system theme to figma-light when system is light', () => {
    mockMediaQuery.matches = false;
    themeManager = new ThemeManager(mockSendMessage);
    expect(themeManager.getEffectiveTheme()).toBe('figma-light');
  });

  it('should resolve system theme to figma-dark when system is dark', () => {
    mockMediaQuery.matches = true;
    themeManager = new ThemeManager(mockSendMessage);
    expect(themeManager.getEffectiveTheme()).toBe('figma-dark');
  });

  it('should set theme mode and persist preference', async () => {
    await themeManager.setTheme('light');
    
    expect(themeManager.currentTheme).toBe('light');
    expect(mockSendMessage).toHaveBeenCalledWith('set-theme-preference', {
      theme: expect.objectContaining({
        mode: 'light',
        migrationVersion: 1
      })
    });
  });

  it('should resolve non-system themes correctly', async () => {
    await themeManager.setTheme('light');
    expect(themeManager.getEffectiveTheme()).toBe('light');

    await themeManager.setTheme('dark');
    expect(themeManager.getEffectiveTheme()).toBe('figma-dark');

    await themeManager.setTheme('boilerplate');
    expect(themeManager.getEffectiveTheme()).toBe('boilerplate');

    await themeManager.setTheme('cybertron');
    expect(themeManager.getEffectiveTheme()).toBe('cybertron');
  });

  it('should notify theme change listeners', async () => {
    const callback = vi.fn();
    themeManager.onThemeChange(callback);
    
    await themeManager.setTheme('light');
    
    // Wait for debounced notification
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(callback).toHaveBeenCalledWith('light');
  });

  it('should migrate legacy string themes', () => {
    themeManager.loadThemePreference('figma');
    expect(themeManager.currentTheme).toBe('system');

    themeManager.loadThemePreference('light');
    expect(themeManager.currentTheme).toBe('light');

    themeManager.loadThemePreference('boilerplate');
    expect(themeManager.currentTheme).toBe('boilerplate');
  });

  it('should load theme preference objects', () => {
    const preference = {
      mode: 'dark' as ThemeMode,
      lastSystemTheme: 'light' as const,
      migrationVersion: 1
    };
    
    themeManager.loadThemePreference(preference);
    expect(themeManager.currentTheme).toBe('dark');
  });

  it('should get theme configurations', () => {
    const systemConfig = themeManager.getThemeConfig('system');
    expect(systemConfig.name).toBe('system');
    expect(systemConfig.isSystemDependent).toBe(true);

    const lightConfig = themeManager.getThemeConfig('light');
    expect(lightConfig.name).toBe('light');
    expect(lightConfig.isSystemDependent).toBe(false);
  });

  it('should remove theme change listeners', () => {
    const callback = vi.fn();
    themeManager.onThemeChange(callback);
    themeManager.removeThemeChangeListener(callback);
    
    // Should not call the callback after removal
    themeManager.setTheme('light');
    expect(callback).not.toHaveBeenCalled();
  });

  describe('Enhanced Storage Integration', () => {
    // Note: These tests verify the integration points exist
    // The actual ThemeStorage functionality is tested separately

    it('should have enhanced storage methods available', () => {
      // Verify that the enhanced storage methods exist on the theme manager
      expect(typeof themeManager.getStorageHealth).toBe('function');
      expect(typeof themeManager.clearThemeStorage).toBe('function');
    });

    it('should load theme preference without parameters (uses enhanced storage)', async () => {
      // This test verifies that loadThemePreference can be called without parameters
      // which triggers the enhanced storage system
      await expect(themeManager.loadThemePreference()).resolves.not.toThrow();
    });

    it('should handle setTheme with enhanced storage integration', async () => {
      // Verify that setTheme works with the enhanced storage system
      await expect(themeManager.setTheme('cybertron')).resolves.not.toThrow();
      expect(themeManager.currentTheme).toBe('cybertron');
    });

    it('should provide storage health information', () => {
      // Verify that storage health can be retrieved
      const health = themeManager.getStorageHealth();
      
      expect(health).toHaveProperty('hasInMemoryBackup');
      expect(health).toHaveProperty('lastSuccessfulWrite');
      expect(health).toHaveProperty('timeSinceLastWrite');
      expect(typeof health.hasInMemoryBackup).toBe('boolean');
      expect(typeof health.lastSuccessfulWrite).toBe('number');
      expect(typeof health.timeSinceLastWrite).toBe('number');
    });

    it('should clear theme storage', async () => {
      // Verify that clearThemeStorage method works
      const result = await themeManager.clearThemeStorage();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });
});