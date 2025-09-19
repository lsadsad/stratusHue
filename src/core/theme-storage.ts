// Enhanced Theme Storage System
// Handles theme preference persistence with migration, error handling, and backup

import { ThemePreference, ThemeMode } from './types';

export interface ThemeStorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usedFallback?: boolean;
}

export class ThemeStorage {
  private static readonly STORAGE_KEY = 'themePreference';
  private static readonly BACKUP_KEY = 'themePreferenceBackup';
  private static readonly CURRENT_MIGRATION_VERSION = 1;
  
  // In-memory backup for reliability
  private static inMemoryBackup: ThemePreference | null = null;
  private static lastSuccessfulWrite: number = 0;

  /**
   * Load theme preference with migration and fallback support
   */
  static async loadThemePreference(): Promise<ThemeStorageResult<ThemePreference>> {
    try {
      // Try to load from primary storage
      const stored = await figma.clientStorage.getAsync(this.STORAGE_KEY);
      
      if (stored) {
        const migrated = this.migrateThemePreference(stored);
        
        // Update in-memory backup with successful load
        this.inMemoryBackup = migrated;
        
        // If migration occurred, save the migrated version
        if (this.needsMigration(stored)) {
          await this.saveThemePreferenceInternal(migrated, false);
        }
        
        return {
          success: true,
          data: migrated
        };
      }
      
      // No stored preference, return default
      const defaultPreference = this.getDefaultThemePreference();
      this.inMemoryBackup = defaultPreference;
      
      return {
        success: true,
        data: defaultPreference
      };
      
    } catch (error) {
      console.warn('Primary theme storage load failed:', error);
      
      // Try backup storage
      try {
        const backup = await figma.clientStorage.getAsync(this.BACKUP_KEY);
        if (backup) {
          const migrated = this.migrateThemePreference(backup);
          this.inMemoryBackup = migrated;
          
          return {
            success: true,
            data: migrated,
            usedFallback: true
          };
        }
      } catch (backupError) {
        console.warn('Backup theme storage load failed:', backupError);
      }
      
      // Try in-memory backup
      if (this.inMemoryBackup) {
        return {
          success: true,
          data: this.inMemoryBackup,
          usedFallback: true
        };
      }
      
      // All fallbacks failed, return default
      const defaultPreference = this.getDefaultThemePreference();
      this.inMemoryBackup = defaultPreference;
      
      return {
        success: false,
        data: defaultPreference,
        error: 'Storage unavailable, using default theme',
        usedFallback: true
      };
    }
  }

  /**
   * Save theme preference with backup and error handling
   */
  static async saveThemePreference(preference: ThemePreference): Promise<ThemeStorageResult<void>> {
    return this.saveThemePreferenceInternal(preference, true);
  }

  /**
   * Internal save method with backup control
   */
  private static async saveThemePreferenceInternal(
    preference: ThemePreference, 
    updateBackup: boolean = true
  ): Promise<ThemeStorageResult<void>> {
    // Ensure migration version is set
    const preferenceToSave: ThemePreference = {
      ...preference,
      migrationVersion: this.CURRENT_MIGRATION_VERSION
    };

    try {
      // Save to primary storage
      await figma.clientStorage.setAsync(this.STORAGE_KEY, preferenceToSave);
      
      // Update in-memory backup
      this.inMemoryBackup = preferenceToSave;
      this.lastSuccessfulWrite = Date.now();
      
      // Save to backup storage (with delay to avoid conflicts)
      if (updateBackup) {
        try {
          // Use setTimeout to avoid blocking the main save
          setTimeout(async () => {
            try {
              await figma.clientStorage.setAsync(this.BACKUP_KEY, preferenceToSave);
            } catch (backupError) {
              console.warn('Backup theme storage save failed:', backupError);
            }
          }, 100);
        } catch (backupError) {
          console.warn('Backup theme storage save failed:', backupError);
        }
      }
      
      return {
        success: true
      };
      
    } catch (error) {
      console.warn('Theme preference save failed:', error);
      
      // Update in-memory backup even if storage fails
      this.inMemoryBackup = preferenceToSave;
      
      return {
        success: false,
        error: 'Failed to save theme preference to storage'
      };
    }
  }

  /**
   * Migrate legacy theme preferences to new format
   */
  private static migrateThemePreference(stored: any): ThemePreference {
    // Handle legacy string themes
    if (typeof stored === 'string') {
      return {
        mode: this.migrateLegacyThemeString(stored),
        migrationVersion: this.CURRENT_MIGRATION_VERSION
      };
    }
    
    // Handle objects that might need migration
    if (stored && typeof stored === 'object') {
      // If it's already in the correct format, return as-is
      if (stored.mode && stored.migrationVersion === this.CURRENT_MIGRATION_VERSION) {
        return stored as ThemePreference;
      }
      
      // Migrate older object formats
      const migratedMode = stored.mode ? this.validateThemeMode(stored.mode) : 'system';
      
      return {
        mode: migratedMode,
        lastSystemTheme: stored.lastSystemTheme || undefined,
        migrationVersion: this.CURRENT_MIGRATION_VERSION
      };
    }
    
    // Invalid format, return default
    return this.getDefaultThemePreference();
  }

  /**
   * Check if stored preference needs migration
   */
  private static needsMigration(stored: any): boolean {
    if (typeof stored === 'string') {
      return true;
    }
    
    if (stored && typeof stored === 'object') {
      return stored.migrationVersion !== this.CURRENT_MIGRATION_VERSION;
    }
    
    return true;
  }

  /**
   * Migrate legacy theme string to new theme mode
   */
  private static migrateLegacyThemeString(legacyTheme: string): ThemeMode {
    switch (legacyTheme) {
      case 'figma':
        return 'system'; // Default to system for old figma theme
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'boilerplate':
        return 'boilerplate';
      case 'cybertron':
        return 'cybertron';
      default:
        return 'system';
    }
  }

  /**
   * Validate and sanitize theme mode
   */
  private static validateThemeMode(mode: any): ThemeMode {
    const validModes: ThemeMode[] = ['system', 'light', 'dark', 'boilerplate', 'cybertron'];
    
    if (typeof mode === 'string' && validModes.includes(mode as ThemeMode)) {
      return mode as ThemeMode;
    }
    
    return 'system';
  }

  /**
   * Get default theme preference
   */
  private static getDefaultThemePreference(): ThemePreference {
    return {
      mode: 'system',
      migrationVersion: this.CURRENT_MIGRATION_VERSION
    };
  }

  /**
   * Clear all theme storage (for testing/reset purposes)
   */
  static async clearThemeStorage(): Promise<ThemeStorageResult<void>> {
    try {
      await Promise.all([
        figma.clientStorage.deleteAsync(this.STORAGE_KEY),
        figma.clientStorage.deleteAsync(this.BACKUP_KEY)
      ]);
      
      this.inMemoryBackup = null;
      this.lastSuccessfulWrite = 0;
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to clear theme storage'
      };
    }
  }

  /**
   * Get storage health information (for debugging)
   */
  static getStorageHealth(): {
    hasInMemoryBackup: boolean;
    lastSuccessfulWrite: number;
    timeSinceLastWrite: number;
  } {
    return {
      hasInMemoryBackup: this.inMemoryBackup !== null,
      lastSuccessfulWrite: this.lastSuccessfulWrite,
      timeSinceLastWrite: this.lastSuccessfulWrite > 0 ? Date.now() - this.lastSuccessfulWrite : -1
    };
  }
}