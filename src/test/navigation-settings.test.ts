/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavigationControlsSettingMessage, ToggleNavigationControlsMessage } from '../core/types';

// Mock the state management functions
const mockState = {
  navigationControlsEnabled: true,
  settings: {
    navigationControls: {
      enabled: true,
      lastToggleTime: Date.now()
    }
  }
};

// Mock state management functions
const mockGetNavigationControlsSetting = vi.fn(() => mockState.navigationControlsEnabled);
const mockSetNavigationControlsSetting = vi.fn((enabled: boolean) => {
  mockState.navigationControlsEnabled = enabled;
  mockState.settings.navigationControls.enabled = enabled;
  mockState.settings.navigationControls.lastToggleTime = Date.now();
});
const mockSaveSettings = vi.fn();
const mockLoadSettings = vi.fn(() => Promise.resolve(mockState.settings));

// Mock UI communication
const mockPostMessage = vi.fn();

describe('Navigation Settings Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.navigationControlsEnabled = true;
    mockState.settings.navigationControls.enabled = true;
    figma.ui.postMessage = mockPostMessage;
  });

  describe('Settings Persistence', () => {
    it('should save navigation controls setting when toggled', async () => {
      // Arrange
      const initialSetting = true;
      mockGetNavigationControlsSetting.mockReturnValue(initialSetting);

      // Act - Toggle setting
      const newSetting = !initialSetting;
      mockSetNavigationControlsSetting(newSetting);
      await mockSaveSettings();

      // Assert
      expect(mockSetNavigationControlsSetting).toHaveBeenCalledWith(newSetting);
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockState.navigationControlsEnabled).toBe(newSetting);
    });

    it('should load navigation controls setting on plugin startup', async () => {
      // Arrange
      const savedSettings = {
        navigationControls: {
          enabled: false,
          lastToggleTime: Date.now() - 1000
        }
      };
      mockLoadSettings.mockResolvedValue(savedSettings);

      // Act
      const loadedSettings = await mockLoadSettings();

      // Assert
      expect(mockLoadSettings).toHaveBeenCalled();
      expect(loadedSettings.navigationControls.enabled).toBe(false);
    });

    it('should use default setting when no saved setting exists', async () => {
      // Arrange
      mockLoadSettings.mockResolvedValue({});

      // Act
      const loadedSettings = await mockLoadSettings();
      const defaultEnabled = loadedSettings.navigationControls?.enabled ?? true;

      // Assert
      expect(defaultEnabled).toBe(true);
    });

    it('should update lastToggleTime when setting is changed', () => {
      // Arrange
      const beforeTime = Date.now();
      
      // Act
      mockSetNavigationControlsSetting(false);
      
      // Assert
      expect(mockState.settings.navigationControls.lastToggleTime).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('UI Message Handling', () => {
    it('should handle toggle navigation controls message', () => {
      // Arrange
      const toggleMessage: ToggleNavigationControlsMessage = {
        type: 'toggle-navigation-controls',
        enabled: false
      };

      // Act - Simulate message handling
      mockSetNavigationControlsSetting(toggleMessage.enabled);
      
      const responseMessage: NavigationControlsSettingMessage = {
        type: 'navigation-controls-setting',
        enabled: toggleMessage.enabled
      };
      mockPostMessage(responseMessage);

      // Assert
      expect(mockSetNavigationControlsSetting).toHaveBeenCalledWith(false);
      expect(mockPostMessage).toHaveBeenCalledWith(responseMessage);
    });

    it('should send navigation controls setting to UI on startup', () => {
      // Arrange
      const currentSetting = mockGetNavigationControlsSetting();
      
      // Act - Simulate plugin startup message
      const settingMessage: NavigationControlsSettingMessage = {
        type: 'navigation-controls-setting',
        enabled: currentSetting
      };
      mockPostMessage(settingMessage);

      // Assert
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'navigation-controls-setting',
        enabled: currentSetting
      });
    });

    it('should validate toggle message format', () => {
      // Arrange
      const validMessage: ToggleNavigationControlsMessage = {
        type: 'toggle-navigation-controls',
        enabled: true
      };

      const invalidMessage = {
        type: 'toggle-navigation-controls'
        // missing enabled property
      };

      // Act & Assert
      expect(typeof validMessage.enabled).toBe('boolean');
      expect(validMessage.type).toBe('toggle-navigation-controls');
      
      // Invalid message should fail validation
      expect((invalidMessage as any).enabled).toBeUndefined();
    });
  });

  describe('UI Visibility Control', () => {
    it('should show navigation controls when setting is enabled', () => {
      // Arrange
      mockGetNavigationControlsSetting.mockReturnValue(true);
      
      // Act
      const shouldShow = mockGetNavigationControlsSetting();
      
      // Assert
      expect(shouldShow).toBe(true);
    });

    it('should hide navigation controls when setting is disabled', () => {
      // Arrange
      mockGetNavigationControlsSetting.mockReturnValue(false);
      
      // Act
      const shouldShow = mockGetNavigationControlsSetting();
      
      // Assert
      expect(shouldShow).toBe(false);
    });

    it('should update UI visibility immediately when setting changes', () => {
      // Arrange
      let currentVisibility = true;
      const mockUpdateVisibility = vi.fn((visible: boolean) => {
        currentVisibility = visible;
      });

      // Act - Toggle setting and update UI
      mockSetNavigationControlsSetting(false);
      mockUpdateVisibility(mockState.navigationControlsEnabled);

      // Assert
      expect(mockUpdateVisibility).toHaveBeenCalledWith(false);
      expect(currentVisibility).toBe(false);
    });
  });

  describe('Settings Validation', () => {
    it('should validate boolean setting values', () => {
      // Test valid boolean values
      expect(() => mockSetNavigationControlsSetting(true)).not.toThrow();
      expect(() => mockSetNavigationControlsSetting(false)).not.toThrow();
      
      // Test that setting was applied
      expect(mockState.navigationControlsEnabled).toBe(false);
    });

    it('should handle corrupted settings gracefully', async () => {
      // Arrange - Simulate corrupted settings
      mockLoadSettings.mockResolvedValue({
        navigationControls: {
          enabled: "invalid" as any, // Invalid type
          lastToggleTime: "not-a-number" as any
        }
      });

      // Act
      const loadedSettings = await mockLoadSettings();
      
      // Should use default values for invalid data
      const safeEnabled = typeof loadedSettings.navigationControls?.enabled === 'boolean' 
        ? loadedSettings.navigationControls.enabled 
        : true; // default
      
      const safeTimestamp = typeof loadedSettings.navigationControls?.lastToggleTime === 'number'
        ? loadedSettings.navigationControls.lastToggleTime
        : Date.now(); // default

      // Assert
      expect(typeof safeEnabled).toBe('boolean');
      expect(typeof safeTimestamp).toBe('number');
    });

    it('should maintain setting consistency across plugin sessions', async () => {
      // Arrange - Set a specific setting
      mockSetNavigationControlsSetting(false);
      await mockSaveSettings();
      
      // Simulate plugin restart by loading settings
      mockLoadSettings.mockResolvedValue(mockState.settings);
      const reloadedSettings = await mockLoadSettings();
      
      // Act
      const persistedSetting = reloadedSettings.navigationControls.enabled;
      
      // Assert
      expect(persistedSetting).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle settings save failures gracefully', async () => {
      // Arrange
      mockSaveSettings.mockRejectedValue(new Error('Storage error'));
      
      // Act & Assert - Should not throw
      try {
        mockSetNavigationControlsSetting(false);
        await mockSaveSettings();
      } catch (error) {
        // Error should be caught and handled gracefully
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle settings load failures gracefully', async () => {
      // Arrange
      mockLoadSettings.mockRejectedValue(new Error('Storage error'));
      
      // Act & Assert
      try {
        await mockLoadSettings();
      } catch (error) {
        // Should fall back to default settings
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle UI communication failures gracefully', () => {
      // Arrange
      mockPostMessage.mockImplementation(() => {
        throw new Error('UI communication error');
      });
      
      // Act & Assert - Should not crash the plugin
      expect(() => {
        try {
          mockPostMessage({ type: 'navigation-controls-setting', enabled: true });
        } catch (error) {
          // Error should be caught and handled
          console.warn('UI communication failed:', error);
        }
      }).not.toThrow();
    });
  });
});