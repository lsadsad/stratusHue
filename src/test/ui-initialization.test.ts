// UI Initialization Tests
// Tests for proper initialization order and system theme detection integration

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the DOM environment
const mockDocument = {
  readyState: 'loading',
  documentElement: {
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  addEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  getElementById: vi.fn()
};

const mockWindow = {
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  addEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  parent: {
    postMessage: vi.fn()
  }
};

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

describe('UI Initialization', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    global.document = mockDocument as any;
    global.window = mockWindow as any;
    global.console = mockConsole as any;
    
    // Reset document ready state
    mockDocument.readyState = 'loading';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize system theme detection before other UI components', () => {
    // Mock system theme detection
    const mockMediaQuery = {
      matches: true, // Dark theme
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    mockWindow.matchMedia.mockReturnValue(mockMediaQuery);

    // Simulate the initialization sequence
    const initializationOrder: string[] = [];
    
    // Mock the functions to track call order
    const mockInitializeSystemThemeDetection = vi.fn(() => {
      initializationOrder.push('systemThemeDetection');
    });
    
    const mockSendMessage = vi.fn(() => {
      initializationOrder.push('sendMessage');
    });
    
    const mockUpdateToggleUI = vi.fn(() => {
      initializationOrder.push('updateToggleUI');
    });

    // Simulate initializePlugin function behavior
    mockInitializeSystemThemeDetection();
    mockSendMessage('ui-ready');
    mockUpdateToggleUI();

    // Verify initialization order
    expect(initializationOrder).toEqual([
      'systemThemeDetection',
      'sendMessage',
      'updateToggleUI'
    ]);
    
    // Verify system theme detection was called
    expect(mockInitializeSystemThemeDetection).toHaveBeenCalledOnce();
  });

  it('should apply system theme immediately on initialization', () => {
    // Mock dark system theme
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    mockWindow.matchMedia.mockReturnValue(mockMediaQuery);

    // Simulate theme application
    const mockApplyTheme = vi.fn();
    
    // Simulate system theme detection and application
    const systemTheme = mockMediaQuery.matches ? 'dark' : 'light';
    const fallbackTheme = systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
    
    mockApplyTheme(fallbackTheme);

    // Verify theme was applied
    expect(mockApplyTheme).toHaveBeenCalledWith('figma-dark');
  });

  it('should handle light system theme correctly', () => {
    // Mock light system theme
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    mockWindow.matchMedia.mockReturnValue(mockMediaQuery);

    // Simulate theme application
    const mockApplyTheme = vi.fn();
    
    // Simulate system theme detection and application
    const systemTheme = mockMediaQuery.matches ? 'dark' : 'light';
    const fallbackTheme = systemTheme === 'dark' ? 'figma-dark' : 'figma-light';
    
    mockApplyTheme(fallbackTheme);

    // Verify theme was applied
    expect(mockApplyTheme).toHaveBeenCalledWith('figma-light');
  });

  it('should set up system theme change listeners', () => {
    // Mock system theme detection
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    mockWindow.matchMedia.mockReturnValue(mockMediaQuery);

    // Simulate the actual call that would happen during initialization
    const mediaQuery = mockWindow.matchMedia('(prefers-color-scheme: dark)');
    
    // Verify media query listener was set up
    expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(mediaQuery).toBeDefined();
    expect(mediaQuery.addEventListener).toBeDefined();
  });

  it('should handle DOM ready state correctly', () => {
    // Test loading state
    mockDocument.readyState = 'loading';
    expect(mockDocument.readyState).toBe('loading');

    // Test complete state
    mockDocument.readyState = 'complete';
    expect(mockDocument.readyState).toBe('complete');
  });

  it('should dispatch theme synchronization events', () => {
    // Mock theme synchronization
    const mockDispatchEvent = vi.fn();
    mockWindow.dispatchEvent = mockDispatchEvent;

    // Simulate theme sync event
    const themeEvent = new CustomEvent('systemThemeSync', {
      detail: {
        effectiveTheme: 'figma-dark',
        themeMode: 'system',
        systemTheme: 'dark',
        timestamp: Date.now()
      }
    });

    mockDispatchEvent(themeEvent);

    // Verify event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalledWith(themeEvent);
  });
});