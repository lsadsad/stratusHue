// Enhanced Theme Management System
// Handles system theme detection, user preferences, and theme application

import { ThemeMode, EffectiveTheme, SystemTheme, ThemePreference, ThemeConfig } from './types';

// Simple storage result interface (simplified from theme-storage)
interface _ThemeStorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usedFallback?: boolean;
}

export class SystemThemeDetector {
  public mediaQuery: MediaQueryList; // Made public for debugging
  private listeners: ((theme: SystemTheme) => void)[] = [];
  private cachedTheme: SystemTheme | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 100; // Cache for 100ms to avoid excessive queries
  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_DELAY = 50; // Debounce system theme changes

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    
    // Initialize cache
    this.updateCache();
  }

  getCurrentSystemTheme(): SystemTheme {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.cachedTheme && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return this.cachedTheme;
    }
    
    // Update cache and return fresh result
    this.updateCache();
    return this.cachedTheme!;
  }

  private updateCache(): void {
    try {
      this.cachedTheme = this.mediaQuery.matches ? 'dark' : 'light';
      this.lastCacheTime = Date.now();
    } catch (error) {
      console.warn('System theme detection error, falling back to dark theme:', error);
      this.cachedTheme = 'dark'; // Fallback to dark theme
      this.lastCacheTime = Date.now();
    }
  }

  onSystemThemeChange(callback: (theme: SystemTheme) => void): void {
    this.listeners.push(callback);
  }

  removeSystemThemeListener(callback?: (theme: SystemTheme) => void): void {
    if (callback) {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    } else {
      // Remove all listeners
      this.listeners = [];
    }
  }

  private handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    // Clear existing debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    
    // Debounce rapid system theme changes
    this.debounceTimer = window.setTimeout(() => {
      const systemTheme = event.matches ? 'dark' : 'light';
      
      // Update cache
      this.cachedTheme = systemTheme;
      this.lastCacheTime = Date.now();
      
      // Notify listeners efficiently using requestAnimationFrame for better performance
      if (this.listeners.length > 0) {
        requestAnimationFrame(() => {
          this.listeners.forEach(callback => {
            try {
              callback(systemTheme);
            } catch (error) {
              console.warn('Theme change listener error:', error);
            }
          });
        });
      }
      
      this.debounceTimer = null;
    }, this.DEBOUNCE_DELAY);
  };

  destroy(): void {
    // Clear debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    this.listeners = [];
    this.cachedTheme = null;
  }
}

export class ThemeManager {
  private systemDetector: SystemThemeDetector;
  private currentThemeMode: ThemeMode = 'system';
  private systemTheme: SystemTheme = 'dark';
  private themeChangeListeners: ((theme: EffectiveTheme) => void)[] = [];
  private sendMessage: (type: string, data?: any) => void;
  
  // Performance optimization caches
  private effectiveThemeCache: EffectiveTheme | null = null;
  private lastEffectiveThemeUpdate: number = 0;
  private readonly EFFECTIVE_THEME_CACHE_DURATION = 50; // Cache for 50ms
  private notificationDebounceTimer: number | null = null;
  private readonly NOTIFICATION_DEBOUNCE_DELAY = 16; // ~60fps for smooth UI updates

  // Theme configuration mapping
  private themeConfigs: Record<ThemeMode, ThemeConfig> = {
    system: {
      name: 'system',
      displayName: 'System',
      description: '',
      icon: '🔄',
      cssDataAttribute: 'system',
      isSystemDependent: true
    },
    light: {
      name: 'light',
      displayName: 'Light',
      description: '',
      icon: '☀️',
      cssDataAttribute: 'light',
      isSystemDependent: false
    },
    dark: {
      name: 'dark',
      displayName: 'Dark',
      description: '',
      icon: '🌙',
      cssDataAttribute: 'figma-dark',
      isSystemDependent: false
    },
    boilerplate: {
      name: 'boilerplate',
      displayName: 'Boilerplate',
      description: '',
      icon: '⚫',
      cssDataAttribute: 'boilerplate',
      isSystemDependent: false
    },
    cybertron: {
      name: 'cybertron',
      displayName: 'Cybertron',
      description: '',
      icon: '🤖',
      cssDataAttribute: 'cybertron',
      isSystemDependent: false
    }
  };

  constructor(sendMessageFn: (type: string, data?: any) => void) {
    this.sendMessage = sendMessageFn;
    this.systemDetector = new SystemThemeDetector();
    this.systemTheme = this.systemDetector.getCurrentSystemTheme();
    
    // Listen for system theme changes
    this.systemDetector.onSystemThemeChange((theme) => {
      const previousSystemTheme = this.systemTheme;
      this.systemTheme = theme;
      
      // Only notify if we're in system mode and theme actually changed
      if (this.currentThemeMode === 'system' && previousSystemTheme !== theme) {
        this.invalidateEffectiveThemeCache();
        this.notifyThemeChange();
      }
    });
  }

  get currentTheme(): ThemeMode {
    return this.currentThemeMode;
  }

  get currentSystemTheme(): SystemTheme {
    return this.systemTheme;
  }

  async setTheme(mode: ThemeMode): Promise<void> {
    // Early return if theme hasn't changed
    if (this.currentThemeMode === mode) {
      return;
    }
    
    this.currentThemeMode = mode;
    
    // Invalidate cache immediately for responsive UI
    this.invalidateEffectiveThemeCache();
    
    // Persist the preference using enhanced storage (non-blocking)
    const preference: ThemePreference = {
      mode,
      lastSystemTheme: this.systemTheme,
      migrationVersion: 1
    };
    
    // Don't await storage to avoid blocking UI updates
    try {
      localStorage.setItem('themePreference', JSON.stringify(preference));
    } catch (error) {
      console.warn('Theme preference save failed:', error);
    }
    
    // Also send to code.ts for backward compatibility (non-blocking)
    try {
      this.sendMessage('set-theme-preference', { theme: preference });
    } catch (error) {
      console.warn('Theme message send error:', error);
    }
    
    // Notify listeners of the effective theme change
    this.notifyThemeChange();
  }

  getEffectiveTheme(): EffectiveTheme {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.effectiveThemeCache && (now - this.lastEffectiveThemeUpdate) < this.EFFECTIVE_THEME_CACHE_DURATION) {
      return this.effectiveThemeCache;
    }
    
    // Calculate effective theme
    let effectiveTheme: EffectiveTheme;
    switch (this.currentThemeMode) {
      case 'system':
        effectiveTheme = this.systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
        break;
      case 'light':
        effectiveTheme = 'light';
        break;
      case 'dark':
        effectiveTheme = 'figma-dark';
        break;
      case 'boilerplate':
        effectiveTheme = 'boilerplate';
        break;
      case 'cybertron':
        effectiveTheme = 'cybertron';
        break;
      default:
        effectiveTheme = 'figma-dark'; // fallback
    }
    
    // Update cache
    this.effectiveThemeCache = effectiveTheme;
    this.lastEffectiveThemeUpdate = now;
    
    return effectiveTheme;
  }

  getThemeConfig(mode: ThemeMode): ThemeConfig {
    return this.themeConfigs[mode];
  }

  getAllThemeConfigs(): ThemeConfig[] {
    // ES5 compatible version of Object.values
    return Object.keys(this.themeConfigs).map(key => this.themeConfigs[key as ThemeMode]);
  }

  onThemeChange(callback: (theme: EffectiveTheme) => void): void {
    this.themeChangeListeners.push(callback);
  }

  removeThemeChangeListener(callback?: (theme: EffectiveTheme) => void): void {
    if (callback) {
      const index = this.themeChangeListeners.indexOf(callback);
      if (index > -1) {
        this.themeChangeListeners.splice(index, 1);
      }
    } else {
      // Remove all listeners
      this.themeChangeListeners = [];
    }
  }

  async loadThemePreference(preference?: ThemePreference | string): Promise<void> {
    let themePreference: ThemePreference;
    
    if (preference) {
      // Handle legacy string preferences or direct preference objects
      if (typeof preference === 'string') {
        themePreference = {
          mode: this.migrateLegacyTheme(preference),
          migrationVersion: 1
        };
      } else {
        themePreference = preference;
      }
    } else {
      // Load from enhanced storage system
      try {
        const stored = localStorage.getItem('themePreference');
        if (stored) {
          themePreference = JSON.parse(stored);
        } else {
          themePreference = { mode: 'system' as ThemeMode };
        }
      } catch (error) {
        console.warn('Theme preference load failed:', error);
        themePreference = { mode: 'system' as ThemeMode };
      }
    }
    
    this.currentThemeMode = themePreference.mode;
    
    // Always use current system theme, not cached value from storage
    // The cached lastSystemTheme is only for reference, not for overriding current detection
    const currentSystemTheme = this.systemDetector.getCurrentSystemTheme();
    if (currentSystemTheme !== this.systemTheme) {
      console.log(`🔄 System theme changed since last session: ${this.systemTheme} -> ${currentSystemTheme}`);
      this.systemTheme = currentSystemTheme;
      this.invalidateEffectiveThemeCache();
    }
    
    // Apply the theme immediately
    this.notifyThemeChange();
  }

  private migrateLegacyTheme(legacyTheme: string): ThemeMode {
    // Map old theme names to new theme modes
    switch (legacyTheme) {
      case 'figma':
        return 'system'; // Default to system for old figma theme
      case 'light':
        return 'light';
      case 'boilerplate':
        return 'boilerplate';
      case 'cybertron':
        return 'cybertron';
      default:
        return 'system';
    }
  }

  private notifyThemeChange(): void {
    // Clear existing debounce timer
    if (this.notificationDebounceTimer !== null) {
      clearTimeout(this.notificationDebounceTimer);
    }
    
    // Debounce theme change notifications for better performance
    this.notificationDebounceTimer = window.setTimeout(() => {
      // Invalidate cache to ensure fresh calculation
      this.invalidateEffectiveThemeCache();
      
      const effectiveTheme = this.getEffectiveTheme();
      
      // Use requestAnimationFrame for smooth UI updates
      if (this.themeChangeListeners.length > 0) {
        requestAnimationFrame(() => {
          this.themeChangeListeners.forEach(callback => {
            try {
              callback(effectiveTheme);
            } catch (error) {
              console.warn('Theme change listener error:', error);
            }
          });
        });
      }
      
      this.notificationDebounceTimer = null;
    }, this.NOTIFICATION_DEBOUNCE_DELAY);
  }
  
  private invalidateEffectiveThemeCache(): void {
    this.effectiveThemeCache = null;
    this.lastEffectiveThemeUpdate = 0;
  }

  getStorageHealth(): {
    hasInMemoryBackup: boolean;
    lastSuccessfulWrite: number;
    timeSinceLastWrite: number;
  } {
    return {
      hasInMemoryBackup: false,
      lastSuccessfulWrite: Date.now(),
      timeSinceLastWrite: 0
    };
  }

  async clearThemeStorage(): Promise<{success: boolean; error?: string}> {
    try {
      localStorage.removeItem('themePreference');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Debug method to check theme state
  getDebugInfo(): {
    currentThemeMode: ThemeMode;
    systemTheme: SystemTheme;
    effectiveTheme: EffectiveTheme;
    mediaQueryMatches: boolean;
    cacheValid: boolean;
  } {
    const now = Date.now();
    return {
      currentThemeMode: this.currentThemeMode,
      systemTheme: this.systemTheme,
      effectiveTheme: this.getEffectiveTheme(),
      mediaQueryMatches: this.systemDetector.mediaQuery?.matches || false,
      cacheValid: this.effectiveThemeCache !== null && (now - this.lastEffectiveThemeUpdate) < this.EFFECTIVE_THEME_CACHE_DURATION
    };
  }

  destroy(): void {
    // Clear debounce timer
    if (this.notificationDebounceTimer !== null) {
      clearTimeout(this.notificationDebounceTimer);
      this.notificationDebounceTimer = null;
    }
    
    this.systemDetector.destroy();
    this.themeChangeListeners = [];
    
    // Clear caches
    this.effectiveThemeCache = null;
    this.lastEffectiveThemeUpdate = 0;
  }
}