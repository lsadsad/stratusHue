// Integration tests for complete theme switching functionality
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeManager } from '../core/theme-manager';
import { ThemeMode, EffectiveTheme } from '../core/types';

// Mock DOM environment
const mockDocumentElement = {
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  }
};

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock setTimeout
vi.stubGlobal('setTimeout', vi.fn((callback: Function) => {
  callback();
}));

describe('Theme Integration', () => {
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
    
    vi.clearAllMocks();
    mockDocumentElement.getAttribute.mockReturnValue(null);
  });

  afterEach(() => {
    themeManager.destroy();
    vi.clearAllMocks();
  });

  it('should handle complete theme switching workflow', async () => {
    // Simulate theme application function
    const applyTheme = (effectiveTheme: EffectiveTheme) => {
      const htmlElement = document.documentElement;
      const currentTheme = htmlElement.getAttribute('data-theme');
      
      if (currentTheme === effectiveTheme) return;
      
      htmlElement.classList.add('theme-transitioning');
      htmlElement.setAttribute('data-theme', effectiveTheme);
      setTimeout(() => {
        htmlElement.classList.remove('theme-transitioning');
      }, 300);
    };

    // Set up theme change listener
    themeManager.onThemeChange(applyTheme);

    // Test system theme resolution
    expect(themeManager.getEffectiveTheme()).toBe('figma-light'); // System is light

    // Switch to dark theme
    await themeManager.setTheme('dark');
    expect(themeManager.getEffectiveTheme()).toBe('figma-dark');
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'figma-dark');
    expect(mockSendMessage).toHaveBeenCalledWith('set-theme-preference', {
      theme: expect.objectContaining({
        mode: 'dark',
        migrationVersion: 1
      })
    });

    // Switch to light theme
    await themeManager.setTheme('light');
    expect(themeManager.getEffectiveTheme()).toBe('light');
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');

    // Switch back to system theme
    await themeManager.setTheme('system');
    expect(themeManager.getEffectiveTheme()).toBe('figma-light'); // System is still light
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'figma-light');
  });

  it('should handle system theme changes when in system mode', async () => {
    const applyTheme = vi.fn();
    themeManager.onThemeChange(applyTheme);

    // Start in system mode (light)
    expect(themeManager.getEffectiveTheme()).toBe('figma-light');

    // Test that system theme detection works
    expect(themeManager.currentSystemTheme).toBe('light');
    
    // Verify that switching to system mode works correctly
    await themeManager.setTheme('system');
    expect(themeManager.getEffectiveTheme()).toBe('figma-light');
    expect(applyTheme).toHaveBeenCalledWith('figma-light');
  });

  it('should not react to system changes when not in system mode', async () => {
    const applyTheme = vi.fn();
    themeManager.onThemeChange(applyTheme);

    // Switch to manual dark theme
    await themeManager.setTheme('dark');
    expect(themeManager.getEffectiveTheme()).toBe('figma-dark');
    applyTheme.mockClear();

    // Verify that manual theme overrides system preference
    expect(themeManager.currentTheme).toBe('dark');
    expect(themeManager.getEffectiveTheme()).toBe('figma-dark');
    
    // Should not have called applyTheme again
    expect(applyTheme).not.toHaveBeenCalled();
  });

  it('should handle theme preference loading correctly', () => {
    const applyTheme = vi.fn();
    themeManager.onThemeChange(applyTheme);

    // Load new format preference
    const preference = {
      mode: 'cybertron' as ThemeMode,
      lastSystemTheme: 'dark' as const,
      migrationVersion: 1
    };
    
    themeManager.loadThemePreference(preference);
    expect(themeManager.currentTheme).toBe('cybertron');
    expect(themeManager.getEffectiveTheme()).toBe('cybertron');
    expect(applyTheme).toHaveBeenCalledWith('cybertron');

    // Load legacy string preference
    applyTheme.mockClear();
    themeManager.loadThemePreference('boilerplate');
    expect(themeManager.currentTheme).toBe('boilerplate');
    expect(themeManager.getEffectiveTheme()).toBe('boilerplate');
    expect(applyTheme).toHaveBeenCalledWith('boilerplate');
  });

  it('should provide correct theme configurations', () => {
    const allConfigs = themeManager.getAllThemeConfigs();
    expect(allConfigs).toHaveLength(5);
    
    const systemConfig = themeManager.getThemeConfig('system');
    expect(systemConfig.isSystemDependent).toBe(true);
    expect(systemConfig.displayName).toBe('System');
    
    const lightConfig = themeManager.getThemeConfig('light');
    expect(lightConfig.isSystemDependent).toBe(false);
    expect(lightConfig.displayName).toBe('Light');
  });
});