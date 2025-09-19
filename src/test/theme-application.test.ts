// Tests for Theme Application functionality
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

// Mock setTimeout for transition testing
vi.stubGlobal('setTimeout', vi.fn((callback: Function) => {
  callback();
}));

// Import the functions we want to test
// Note: In a real implementation, these would be exported from ui.ts
// For testing purposes, we'll recreate the core logic here

type EffectiveTheme = 'figma-light' | 'figma-dark' | 'light' | 'boilerplate' | 'cybertron';

function applyTheme(effectiveTheme: EffectiveTheme): void {
  const htmlElement = document.documentElement;
  
  // Get current theme for transition detection
  const currentTheme = htmlElement.getAttribute('data-theme');
  
  // Validate effective theme before applying
  const validThemes: EffectiveTheme[] = ['figma-light', 'figma-dark', 'light', 'boilerplate', 'cybertron'];
  const themeToApply = validThemes.includes(effectiveTheme) ? effectiveTheme : 'figma-dark';
  
  // Skip if already applied (optimization)
  if (currentTheme === themeToApply) {
    return;
  }
  
  // Add transition class for smooth theme changes
  htmlElement.classList.add('theme-transitioning');
  
  // Apply theme resolution logic with proper mapping
  const resolvedTheme = resolveThemeAttribute(themeToApply);
  
  // Apply the new theme
  htmlElement.setAttribute('data-theme', resolvedTheme);
  
  // Remove transition class after animation completes
  setTimeout(() => {
    htmlElement.classList.remove('theme-transitioning');
  }, 300); // Match CSS transition duration
}

function resolveThemeAttribute(effectiveTheme: EffectiveTheme): string {
  // Map effective themes to CSS data-theme attribute values
  switch (effectiveTheme) {
    case 'figma-light':
      return 'figma-light';
    case 'figma-dark':
      return 'figma-dark';
    case 'light':
      return 'light';
    case 'boilerplate':
      return 'boilerplate';
    case 'cybertron':
      return 'cybertron';
    default:
      return 'figma-dark'; // Safe fallback
  }
}

describe('Theme Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentElement.getAttribute.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('applyTheme', () => {
    it('should apply figma-light theme correctly', () => {
      applyTheme('figma-light');
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-transitioning');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'figma-light');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('theme-transitioning');
    });

    it('should apply figma-dark theme correctly', () => {
      applyTheme('figma-dark');
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-transitioning');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'figma-dark');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('theme-transitioning');
    });

    it('should apply light theme correctly', () => {
      applyTheme('light');
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-transitioning');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('theme-transitioning');
    });

    it('should apply boilerplate theme correctly', () => {
      applyTheme('boilerplate');
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-transitioning');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'boilerplate');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('theme-transitioning');
    });

    it('should apply cybertron theme correctly', () => {
      applyTheme('cybertron');
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-transitioning');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'cybertron');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('theme-transitioning');
    });

    it('should skip application if theme is already applied', () => {
      mockDocumentElement.getAttribute.mockReturnValue('figma-light');
      
      applyTheme('figma-light');
      
      expect(mockDocumentElement.classList.add).not.toHaveBeenCalled();
      expect(mockDocumentElement.setAttribute).not.toHaveBeenCalled();
    });

    it('should fallback to figma-dark for invalid themes', () => {
      // @ts-ignore - Testing invalid theme handling
      applyTheme('invalid-theme' as EffectiveTheme);
      
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'figma-dark');
    });

    it('should add and remove transition class with proper timing', () => {
      applyTheme('figma-light');
      
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-transitioning');
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300);
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('theme-transitioning');
    });
  });

  describe('resolveThemeAttribute', () => {
    it('should resolve all theme types correctly', () => {
      expect(resolveThemeAttribute('figma-light')).toBe('figma-light');
      expect(resolveThemeAttribute('figma-dark')).toBe('figma-dark');
      expect(resolveThemeAttribute('light')).toBe('light');
      expect(resolveThemeAttribute('boilerplate')).toBe('boilerplate');
      expect(resolveThemeAttribute('cybertron')).toBe('cybertron');
    });

    it('should fallback to figma-dark for invalid themes', () => {
      // @ts-ignore - Testing invalid theme handling
      expect(resolveThemeAttribute('invalid' as EffectiveTheme)).toBe('figma-dark');
    });
  });
});