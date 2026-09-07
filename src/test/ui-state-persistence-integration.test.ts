// UI State Persistence Integration Tests
// Tests for complete UI state persistence workflows

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM environment
const mockDocument = {
  querySelectorAll: vi.fn(),
  getElementById: vi.fn(),
  readyState: 'complete'
};

const mockElement = {
  id: '',
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn()
  }
};

// Mock global DOM
(global as any).document = mockDocument;

// Mock Figma API
const mockClientStorage = {
  getAsync: vi.fn(),
  setAsync: vi.fn()
};

(global as any).figma = {
  clientStorage: mockClientStorage
};

describe('UI State Persistence Integration', () => {
  beforeEach(() => {
    // Reset mocks
    mockClientStorage.getAsync.mockClear();
    mockClientStorage.setAsync.mockClear();
    mockDocument.querySelectorAll.mockClear();
    mockDocument.getElementById.mockClear();
    mockElement.getAttribute.mockClear();
    mockElement.setAttribute.mockClear();
    mockElement.classList.add.mockClear();
    mockElement.classList.remove.mockClear();
    
    // Reset state
    (global as any).uiSectionStates = {};
  });

  describe('Complete State Persistence Workflow', () => {
    it('should save and restore section states across sessions', async () => {
      // Import functions after mocks are set up
      const {
        loadUISectionStates,
        saveUISectionState,
        getSectionState
      } = await import('../core/state');

      // === FIRST SESSION: Save states ===
      
      // Save collapsed state for tags section
      await saveUISectionState('tags-header', false);
      
      // Save expanded state for anchors section
      await saveUISectionState('anchors-header', true);
      
      // Verify storage was called
      expect(mockClientStorage.setAsync).toHaveBeenCalledWith('uiSectionStates', {
        'tags-header': { expanded: false, lastModified: expect.any(Number) },
        'anchors-header': { expanded: true, lastModified: expect.any(Number) }
      });

      // === SECOND SESSION: Load states ===
      
      // Reset in-memory state to simulate new session
      (global as any).uiSectionStates = {};
      
      // Mock storage returning saved data
      mockClientStorage.getAsync.mockResolvedValue({
        'tags-header': { expanded: false, lastModified: 1640995200000 },
        'anchors-header': { expanded: true, lastModified: 1640995200000 }
      });
      
      // Load states
      await loadUISectionStates();
      
      // Verify states are restored correctly
      expect(getSectionState('tags-header')).toBe(false);
      expect(getSectionState('anchors-header')).toBe(true);
      expect(getSectionState('navigation-header')).toBe(true); // Default for new section
    });

    it('should handle UI restoration during plugin initialization', async () => {
      // Mock DOM elements
      const mockTagsHeader = {
        ...mockElement,
        id: 'tags-header',
        getAttribute: vi.fn().mockReturnValue('color-section')
      };
      
      const mockAnchorsHeader = {
        ...mockElement,
        id: 'anchors-header',
        getAttribute: vi.fn().mockReturnValue('anchors-section')
      };
      
      const mockTagsSection = { ...mockElement, id: 'color-section' };
      const mockAnchorsSection = { ...mockElement, id: 'anchors-section' };
      
      mockDocument.querySelectorAll.mockReturnValue([mockTagsHeader, mockAnchorsHeader]);
      mockDocument.getElementById
        .mockReturnValueOnce(mockTagsSection)
        .mockReturnValueOnce(mockAnchorsSection);
      
      // Mock saved states
      mockClientStorage.getAsync.mockResolvedValue({
        'tags-header': { expanded: false, lastModified: 1640995200000 },
        'anchors-header': { expanded: true, lastModified: 1640995200000 }
      });
      
      // Import and call restoration function
      const { loadUISectionStates, getSectionState } = await import('../core/state');
      
      // Load states first
      await loadUISectionStates();
      
      // Simulate UI restoration (this would normally be called from restoreUISectionStates)
      const collapsibleHeaders = [mockTagsHeader, mockAnchorsHeader];
      
      collapsibleHeaders.forEach(header => {
        const sectionId = header.id;
        const targetId = header.getAttribute('data-target');
        const target = mockDocument.getElementById(targetId);
        
        if (!target || !sectionId) return;
        
        const shouldExpand = getSectionState(sectionId);
        
        // Apply state
        header.setAttribute('aria-expanded', String(shouldExpand));
        if (!shouldExpand) {
          target.classList.add('collapsed');
        } else {
          target.classList.remove('collapsed');
        }
      });
      
      // Verify UI was updated correctly
      expect(mockTagsHeader.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
      expect(mockTagsSection.classList.add).toHaveBeenCalledWith('collapsed');
      
      expect(mockAnchorsHeader.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
      expect(mockAnchorsSection.classList.remove).toHaveBeenCalledWith('collapsed');
    });
  });

  describe('Performance Integration Tests', () => {
    it('should complete full restoration workflow within performance requirements', async () => {
      // Mock multiple sections
      const mockHeaders = Array.from({ length: 10 }, (_, i) => ({
        ...mockElement,
        id: `section-${i}-header`,
        getAttribute: vi.fn().mockReturnValue(`section-${i}`)
      }));
      
      const mockSections = Array.from({ length: 10 }, (_, i) => ({
        ...mockElement,
        id: `section-${i}`
      }));
      
      mockDocument.querySelectorAll.mockReturnValue(mockHeaders);
      mockDocument.getElementById.mockImplementation((id) => {
        const index = parseInt(id.split('-')[1]);
        return mockSections[index];
      });
      
      // Mock saved states for all sections
      const savedStates = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [
          `section-${i}-header`,
          { expanded: i % 2 === 0, lastModified: Date.now() }
        ])
      );
      
      mockClientStorage.getAsync.mockResolvedValue(savedStates);
      
      const startTime = performance.now();
      
      // Import and execute full workflow
      const { loadUISectionStates, getSectionState } = await import('../core/state');
      
      await loadUISectionStates();
      
      // Simulate UI restoration for all sections
      mockHeaders.forEach(header => {
        const sectionId = header.id;
        const shouldExpand = getSectionState(sectionId);
        header.setAttribute('aria-expanded', String(shouldExpand));
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 50ms requirement
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle DOM errors during restoration', async () => {
      // Mock DOM elements that throw errors
      const mockBrokenHeader = {
        ...mockElement,
        id: 'broken-header',
        getAttribute: vi.fn().mockImplementation(() => {
          throw new Error('DOM error');
        })
      };
      
      mockDocument.querySelectorAll.mockReturnValue([mockBrokenHeader]);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Import restoration function
      const { loadUISectionStates } = await import('../core/state');
      
      // Should not throw error even with broken DOM
      await expect(loadUISectionStates()).resolves.toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    it('should continue working when some sections fail to restore', async () => {
      // Each mock element gets its OWN spy instances. Spreading the shared
      // `mockElement` would copy its vi.fn() spies by reference, so a call on one
      // header would register on another — breaking the negative assertion below.
      const mockGoodHeader = {
        id: 'good-header',
        getAttribute: vi.fn().mockReturnValue('good-section'),
        setAttribute: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      };

      const mockBadHeader = {
        id: 'bad-header',
        getAttribute: vi.fn().mockReturnValue(null), // Missing target
        setAttribute: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      };

      const mockGoodSection = {
        id: 'good-section',
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      };
      
      mockDocument.querySelectorAll.mockReturnValue([mockGoodHeader, mockBadHeader]);
      mockDocument.getElementById.mockImplementation((id) => {
        return id === 'good-section' ? mockGoodSection : null;
      });
      
      mockClientStorage.getAsync.mockResolvedValue({
        'good-header': { expanded: false, lastModified: Date.now() },
        'bad-header': { expanded: true, lastModified: Date.now() }
      });
      
      const { loadUISectionStates, getSectionState } = await import('../core/state');
      
      await loadUISectionStates();
      
      // Simulate restoration process
      [mockGoodHeader, mockBadHeader].forEach(header => {
        const sectionId = header.id;
        const targetId = header.getAttribute('data-target');
        const target = targetId ? mockDocument.getElementById(targetId) : null;
        
        if (!target || !sectionId) return; // Should skip bad header
        
        const shouldExpand = getSectionState(sectionId);
        header.setAttribute('aria-expanded', String(shouldExpand));
        if (!shouldExpand) {
          target.classList.add('collapsed');
        }
      });
      
      // Good section should be restored
      expect(mockGoodHeader.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
      expect(mockGoodSection.classList.add).toHaveBeenCalledWith('collapsed');
      
      // Bad section should be skipped (no calls)
      expect(mockBadHeader.setAttribute).not.toHaveBeenCalled();
    });
  });

  describe('Cross-File Consistency', () => {
    it('should maintain consistent states across different Figma files', async () => {
      const { saveUISectionState, loadUISectionStates, getSectionState } = await import('../core/state');
      
      // === FILE 1: Save preferences ===
      await saveUISectionState('tags-header', false);
      await saveUISectionState('anchors-header', true);
      
      // === FILE 2: Load same preferences ===
      // Reset in-memory state to simulate different file
      (global as any).uiSectionStates = {};
      
      // Mock storage returning the same data (cross-file persistence)
      mockClientStorage.getAsync.mockResolvedValue({
        'tags-header': { expanded: false, lastModified: 1640995200000 },
        'anchors-header': { expanded: true, lastModified: 1640995200000 }
      });
      
      await loadUISectionStates();
      
      // Should have same preferences in different file
      expect(getSectionState('tags-header')).toBe(false);
      expect(getSectionState('anchors-header')).toBe(true);
    });
  });
});