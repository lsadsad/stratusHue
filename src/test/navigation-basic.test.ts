/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayerNavigationHandler } from '../features/navigation';
import { createMockSceneNode, createMockContainer } from './setup';
import type { NavigationResult, NavigationContext } from '../core/types';

describe('LayerNavigationHandler - Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    figma.currentPage.selection = [];
    Object.defineProperty(figma.currentPage, 'children', {
      value: [],
      writable: true,
      configurable: true
    });
  });

  describe('enterContainer', () => {
    it('should successfully enter a container with children', () => {
      // Arrange
      const child1 = createMockSceneNode('child-1', 'Child 1');
      const child2 = createMockSceneNode('child-2', 'Child 2');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child1, child2]);

      // Act
      const result = LayerNavigationHandler.enterContainer(container);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Entered group');
      expect(result.newSelection).toEqual([child1, child2]);
      expect(result.viewportUpdate).toBe(true);
    });

    it('should fail when trying to enter an empty container', () => {
      // Arrange
      const emptyContainer = createMockContainer('empty-1', 'Empty Group', 'GROUP', []);

      // Act
      const result = LayerNavigationHandler.enterContainer(emptyContainer);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('empty');
      expect(result.viewportUpdate).toBe(false);
    });

    it('should fail when trying to enter a non-container node', () => {
      // Arrange
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');

      // Act
      const result = LayerNavigationHandler.enterContainer(rectangle);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('not a container');
      expect(result.viewportUpdate).toBe(false);
    });
  });

  describe('validateNavigationContext', () => {
    it('should return correct context for empty selection', () => {
      // Act
      const context = LayerNavigationHandler.validateNavigationContext([]);

      // Assert
      expect(context.hasSelection).toBe(false);
      expect(context.canEnter).toBe(false);
      expect(context.canExit).toBe(false);
      expect(context.canNavigateSiblings).toBe(false);
    });

    it('should return correct context for container selection', () => {
      // Arrange
      const child = createMockSceneNode('child-1', 'Child 1');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child]);

      // Act
      const context = LayerNavigationHandler.validateNavigationContext([container]);

      // Assert
      expect(context.hasSelection).toBe(true);
      expect(context.canEnter).toBe(true); // Has children
    });

    it('should return correct context for non-container selection', () => {
      // Arrange
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');

      // Act
      const context = LayerNavigationHandler.validateNavigationContext([rectangle]);

      // Assert
      expect(context.hasSelection).toBe(true);
      expect(context.canEnter).toBe(false); // Not a container
    });
  });

  describe('performNavigation', () => {
    it('should handle enter action correctly', async () => {
      // Arrange
      const child = createMockSceneNode('child-1', 'Child 1');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child]);

      // Act
      const result = await LayerNavigationHandler.performNavigation('enter', [container]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Entered');
    });

    it('should handle empty selection gracefully', async () => {
      // Act: empty selection + 'enter' falls back to selecting the first
      // top-level layer; with an empty page (children = []) there is none.
      const result = await LayerNavigationHandler.performNavigation('enter', []);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('No visible layers');
    });

    it('should handle invalid actions gracefully', async () => {
      // Arrange
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');

      // Act
      const result = await LayerNavigationHandler.performNavigation('enter', [rectangle]);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('not a container');
    });
  });

  describe('Error Handling', () => {
    it('should handle deleted nodes gracefully', () => {
      // Arrange
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', []);
      
      // Simulate node deletion by making properties throw
      Object.defineProperty(container, 'children', {
        get: () => { throw new Error('Node deleted'); }
      });

      // Act
      const result = LayerNavigationHandler.enterContainer(container);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('no longer');
    });

    it('should provide meaningful error messages', () => {
      // Arrange
      const rectangle = createMockSceneNode('rect-1', 'Rectangle', 'RECTANGLE');

      // Act
      const result = LayerNavigationHandler.enterContainer(rectangle);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should handle large selections efficiently', () => {
      // Arrange
      const largeSelection: SceneNode[] = [];
      for (let i = 0; i < 100; i++) {
        largeSelection.push(createMockSceneNode(`node-${i}`, `Node ${i}`));
      }

      // Act
      const startTime = performance.now();
      const context = LayerNavigationHandler.validateNavigationContext(largeSelection);
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(context.hasSelection).toBe(true);
    });
  });
});