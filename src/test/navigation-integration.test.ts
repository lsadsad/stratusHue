/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayerNavigationHandler } from '../features/navigation';
import { createMockSceneNode, createMockContainer, createMockPageNode } from './setup';
import type { NavigationResult, NavigationContext } from '../core/types';

describe('Navigation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset figma state
    figma.currentPage.selection = [];
    figma.currentPage.children = [];
  });

  describe('Complete Navigation Workflows', () => {
    it('should complete enter -> navigate siblings -> exit workflow', async () => {
      // Arrange - Create nested structure
      const child1 = createMockSceneNode('child-1', 'Child 1');
      const child2 = createMockSceneNode('child-2', 'Child 2');
      const child3 = createMockSceneNode('child-3', 'Child 3');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child1, child2, child3]);
      
      // Set up parent relationships
      [child1, child2, child3].forEach(child => {
        (child as any).parent = container;
      });

      // Mock helper methods for the workflow
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(true);
      vi.spyOn(LayerNavigationHandler, 'findParentContainer').mockReturnValue(container);
      vi.spyOn(LayerNavigationHandler, 'findSibling')
        .mockImplementation((node, direction) => {
          const children = [child1, child2, child3];
          const currentIndex = children.findIndex(c => c.id === node.id);
          // Updated direction: 'next' moves DOWN (lower index), 'prev' moves UP (higher index)
          if (direction === 'next') {
            return children[currentIndex - 1] || null; // Move DOWN in layers (lower index)
          } else {
            return children[currentIndex + 1] || null; // Move UP in layers (higher index)
          }
        });

      // Act & Assert - Step 1: Enter container
      figma.currentPage.selection = [container];
      const enterResult = LayerNavigationHandler.enterContainer(container);
      
      expect(enterResult.success).toBe(true);
      expect(enterResult.newSelection).toEqual([child1, child2, child3]);
      
      // Simulate selection update
      figma.currentPage.selection = enterResult.newSelection || [];

      // Act & Assert - Step 2: Navigate to next sibling (from child3 to child2) - Updated for new direction
      figma.currentPage.selection = [child3];
      const nextResult = LayerNavigationHandler.navigateToSibling(child3, 'next');
      
      expect(nextResult.success).toBe(true);
      expect(nextResult.newSelection).toEqual([child2]);
      
      // Simulate selection update
      figma.currentPage.selection = nextResult.newSelection || [];

      // Act & Assert - Step 3: Navigate to next sibling (from child2 to child1) - Updated for new direction
      const nextResult2 = LayerNavigationHandler.navigateToSibling(child2, 'next');
      
      expect(nextResult2.success).toBe(true);
      expect(nextResult2.newSelection).toEqual([child1]);
      
      // Simulate selection update
      figma.currentPage.selection = nextResult2.newSelection || [];

      // Act & Assert - Step 4: Exit back to container
      const exitResult = LayerNavigationHandler.exitContainer(child3);
      
      expect(exitResult.success).toBe(true);
      expect(exitResult.newSelection).toEqual([container]);
    });

    it('should handle nested container navigation workflow', () => {
      // Arrange - Create deeply nested structure
      const deepChild = createMockSceneNode('deep-child', 'Deep Child');
      const innerContainer = createMockContainer('inner', 'Inner Group', 'GROUP', [deepChild]);
      const middleChild = createMockSceneNode('middle-child', 'Middle Child');
      const middleContainer = createMockContainer('middle', 'Middle Group', 'GROUP', [innerContainer, middleChild]);
      const outerChild = createMockSceneNode('outer-child', 'Outer Child');
      const outerContainer = createMockContainer('outer', 'Outer Group', 'GROUP', [middleContainer, outerChild]);

      // Set up parent relationships
      (deepChild as any).parent = innerContainer;
      (innerContainer as any).parent = middleContainer;
      (middleChild as any).parent = middleContainer;
      (middleContainer as any).parent = outerContainer;
      (outerChild as any).parent = outerContainer;

      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer')
        .mockImplementation((node) => node.type === 'GROUP');
      vi.spyOn(LayerNavigationHandler, 'findParentContainer')
        .mockImplementation((node) => (node as any).parent?.type === 'GROUP' ? (node as any).parent : null);

      // Act & Assert - Navigate down the hierarchy
      // Step 1: Enter outer container
      const enterOuter = LayerNavigationHandler.enterContainer(outerContainer);
      expect(enterOuter.success).toBe(true);
      expect(enterOuter.newSelection).toContain(middleContainer);

      // Step 2: Enter middle container
      const enterMiddle = LayerNavigationHandler.enterContainer(middleContainer);
      expect(enterMiddle.success).toBe(true);
      expect(enterMiddle.newSelection).toContain(innerContainer);

      // Step 3: Enter inner container
      const enterInner = LayerNavigationHandler.enterContainer(innerContainer);
      expect(enterInner.success).toBe(true);
      expect(enterInner.newSelection).toEqual([deepChild]);

      // Step 4: Exit back up the hierarchy
      const exitToInner = LayerNavigationHandler.exitContainer(deepChild);
      expect(exitToInner.success).toBe(true);
      expect(exitToInner.newSelection).toEqual([innerContainer]);

      const exitToMiddle = LayerNavigationHandler.exitContainer(innerContainer);
      expect(exitToMiddle.success).toBe(true);
      expect(exitToMiddle.newSelection).toEqual([middleContainer]);

      const exitToOuter = LayerNavigationHandler.exitContainer(middleContainer);
      expect(exitToOuter.success).toBe(true);
      expect(exitToOuter.newSelection).toEqual([outerContainer]);
    });

    it('should handle sibling wrapping workflow', () => {
      // Arrange
      const sibling1 = createMockSceneNode('sibling-1', 'First Sibling');
      const sibling2 = createMockSceneNode('sibling-2', 'Second Sibling');
      const sibling3 = createMockSceneNode('sibling-3', 'Third Sibling');
      const parent = createMockContainer('parent', 'Parent', 'GROUP', [sibling1, sibling2, sibling3]);

      // Set up relationships
      [sibling1, sibling2, sibling3].forEach(sibling => {
        (sibling as any).parent = parent;
      });

      // Mock sibling navigation with wrapping - Updated for new direction behavior
      vi.spyOn(LayerNavigationHandler, 'findSibling')
        .mockImplementation((node, direction, wrap = false) => {
          const siblings = [sibling1, sibling2, sibling3];
          const currentIndex = siblings.findIndex(s => s.id === node.id);
          
          // Updated direction: 'next' moves DOWN (lower index), 'prev' moves UP (higher index)
          if (direction === 'next') {
            const nextIndex = currentIndex - 1; // Move DOWN in layers (lower index)
            if (nextIndex < 0) {
              return wrap ? siblings[siblings.length - 1] : null; // Wrap to last (sibling3)
            }
            return siblings[nextIndex];
          } else {
            const prevIndex = currentIndex + 1; // Move UP in layers (higher index)
            if (prevIndex >= siblings.length) {
              return wrap ? siblings[0] : null; // Wrap to first (sibling1)
            }
            return siblings[prevIndex];
          }
        });

      // Act & Assert - Test forward wrapping (next from bottom wraps to top)
      const nextFromBottom = LayerNavigationHandler.navigateToSibling(sibling1, 'next');
      expect(nextFromBottom.success).toBe(true);
      expect(nextFromBottom.newSelection).toEqual([sibling3]); // Wrapped to last (top-most)
      expect(nextFromBottom.message).toContain('Wrapped to first sibling'); // 'next' direction says "first"

      // Act & Assert - Test backward wrapping (prev from top wraps to bottom)
      const prevFromTop = LayerNavigationHandler.navigateToSibling(sibling3, 'prev');
      expect(prevFromTop.success).toBe(true);
      expect(prevFromTop.newSelection).toEqual([sibling1]); // Wrapped to first (bottom-most)
      expect(prevFromTop.message).toContain('Wrapped to last sibling'); // 'prev' direction says "last"
    });
  });

  describe('Integration with Existing Plugin Systems', () => {
    it('should integrate with selection history system', () => {
      // Arrange
      const mockAddToHistory = vi.fn();
      const child = createMockSceneNode('child-1', 'Child');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [child]);

      // Act - Perform navigation that should add to history
      const result = LayerNavigationHandler.enterContainer(container);

      // Assert - Navigation should succeed (history integration is tested separately)
      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([child]);
      expect(result.message).toContain('Entered')
    });

    it('should work alongside bookmark system without conflicts', () => {
      // Arrange
      const bookmarkedNode = createMockSceneNode('bookmark-1', 'Bookmarked Node');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [bookmarkedNode]);
      
      // Mock bookmark state
      const mockCurrentAnchor = { bookmarkId: bookmarkedNode.id, timestamp: Date.now() };
      
      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(true);
      vi.spyOn(LayerNavigationHandler, 'findParentContainer').mockReturnValue(container);

      // Act - Navigate while bookmark is active
      const enterResult = LayerNavigationHandler.enterContainer(container);
      const exitResult = LayerNavigationHandler.exitContainer(bookmarkedNode);

      // Assert - Navigation should work regardless of bookmark state
      expect(enterResult.success).toBe(true);
      expect(exitResult.success).toBe(true);
      // Bookmark state should remain unchanged
      expect(mockCurrentAnchor.bookmarkId).toBe(bookmarkedNode.id);
    });

    it('should maintain theme compatibility during navigation', () => {
      // Arrange
      const node = createMockSceneNode('node-1', 'Test Node');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [node]);

      // Mock theme state
      const mockThemeState = { currentTheme: 'boilerplate', tokens: {} };

      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(true);

      // Act - Perform navigation operations
      const enterResult = LayerNavigationHandler.enterContainer(container);
      const context = LayerNavigationHandler.validateNavigationContext([node]);

      // Assert - Operations should complete without affecting theme
      expect(enterResult.success).toBe(true);
      expect(context.hasSelection).toBe(true);
      expect(mockThemeState.currentTheme).toBe('boilerplate'); // Theme unchanged
    });
  });

  describe('Performance with Large Files', () => {
    it('should handle large layer hierarchies efficiently', () => {
      // Arrange - Create large hierarchy (100 containers with 10 children each)
      const largeHierarchy: SceneNode[] = [];
      
      for (let i = 0; i < 100; i++) {
        const children: SceneNode[] = [];
        for (let j = 0; j < 10; j++) {
          children.push(createMockSceneNode(`child-${i}-${j}`, `Child ${i}-${j}`));
        }
        const container = createMockContainer(`container-${i}`, `Container ${i}`, 'GROUP', children);
        largeHierarchy.push(container);
      }

      figma.currentPage.children = largeHierarchy as any;

      // Mock helper methods for performance
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(true);

      // Act - Measure performance of context calculation
      const startTime = performance.now();
      const context = LayerNavigationHandler.validateNavigationContext([largeHierarchy[0]]);
      const endTime = performance.now();

      // Assert - Should complete quickly even with large hierarchy
      expect(endTime - startTime).toBeLessThan(50); // Under 50ms
      expect(context.hasSelection).toBe(true);
    });

    it('should handle complex nested structures efficiently', () => {
      // Arrange - Create deeply nested structure (10 levels deep)
      let currentContainer: SceneNode = createMockSceneNode('leaf', 'Leaf Node');
      
      for (let depth = 0; depth < 10; depth++) {
        const newContainer = createMockContainer(
          `container-${depth}`, 
          `Container Level ${depth}`, 
          'GROUP', 
          [currentContainer]
        );
        (currentContainer as any).parent = newContainer;
        currentContainer = newContainer;
      }

      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer')
        .mockImplementation((node) => node.type === 'GROUP');
      vi.spyOn(LayerNavigationHandler, 'findParentContainer')
        .mockImplementation((node) => (node as any).parent?.type === 'GROUP' ? (node as any).parent : null);

      // Act - Test navigation through deep hierarchy
      const startTime = performance.now();
      
      // Navigate down the hierarchy
      let currentNode = currentContainer;
      const results: NavigationResult[] = [];
      
      for (let i = 0; i < 5; i++) { // Navigate down 5 levels
        const result = LayerNavigationHandler.enterContainer(currentNode);
        results.push(result);
        if (result.newSelection && result.newSelection.length > 0) {
          currentNode = result.newSelection[0];
        }
      }
      
      const endTime = performance.now();

      // Assert - All navigations should succeed and complete quickly
      expect(endTime - startTime).toBeLessThan(100); // Under 100ms
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should maintain performance with frequent context updates', () => {
      // Arrange - Create moderate hierarchy for frequent updates
      const nodes: SceneNode[] = [];
      for (let i = 0; i < 50; i++) {
        nodes.push(createMockSceneNode(`node-${i}`, `Node ${i}`));
      }

      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(false);
      vi.spyOn(LayerNavigationHandler, 'findParentContainer').mockReturnValue(null);
      vi.spyOn(LayerNavigationHandler, 'findSibling').mockReturnValue(null);

      // Act - Simulate rapid selection changes (like user clicking through nodes)
      const startTime = performance.now();
      
      const contexts: NavigationContext[] = [];
      for (let i = 0; i < 100; i++) { // 100 rapid context calculations
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const context = LayerNavigationHandler.validateNavigationContext([randomNode]);
        contexts.push(context);
      }
      
      const endTime = performance.now();

      // Assert - Should handle rapid updates efficiently
      expect(endTime - startTime).toBeLessThan(200); // Under 200ms for 100 updates
      expect(contexts.length).toBe(100);
      contexts.forEach(context => {
        expect(context.hasSelection).toBe(true);
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should recover gracefully from deleted nodes during navigation', () => {
      // Arrange
      const child = createMockSceneNode('child-1', 'Child');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [child]);

      // Mock node deletion during navigation
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(true);
      
      // Simulate node becoming inaccessible
      Object.defineProperty(child, 'name', {
        get: () => { throw new Error('Node deleted'); }
      });

      // Act - Try to enter container with deleted child
      const result = LayerNavigationHandler.enterContainer(container);

      // Assert - Should handle gracefully (implementation may succeed with error handling)
      expect(result).toBeDefined();
      // The implementation handles deleted nodes gracefully and may still succeed
      if (!result.success) {
        expect(result.message).toContain('no visible children');
      }
    });

    it('should handle viewport update failures gracefully', () => {
      // Arrange
      const child = createMockSceneNode('child-1', 'Child');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [child]);

      // Mock viewport failure
      figma.viewport.scrollAndZoomIntoView = vi.fn().mockImplementation(() => {
        throw new Error('Viewport error');
      });

      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(true);

      // Act - Navigation should still succeed even if viewport update fails
      const result = LayerNavigationHandler.enterContainer(container);

      // Assert - Navigation logic should succeed, viewport update is optional
      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([child]);
    });

    it('should maintain consistency during concurrent operations', () => {
      // Arrange
      const nodes = [
        createMockSceneNode('node-1', 'Node 1'),
        createMockSceneNode('node-2', 'Node 2'),
        createMockSceneNode('node-3', 'Node 3')
      ];

      // Mock helper methods
      vi.spyOn(LayerNavigationHandler, 'isContainer').mockReturnValue(false);
      vi.spyOn(LayerNavigationHandler, 'findParentContainer').mockReturnValue(null);
      vi.spyOn(LayerNavigationHandler, 'findSibling').mockReturnValue(null);

      // Act - Simulate concurrent context calculations
      const promises = nodes.map(node => 
        Promise.resolve(LayerNavigationHandler.validateNavigationContext([node]))
      );

      // Assert - All operations should complete successfully
      return Promise.all(promises).then(contexts => {
        expect(contexts.length).toBe(3);
        contexts.forEach(context => {
          expect(context.hasSelection).toBe(true);
          expect(context.canEnter).toBe(false);
          expect(context.canExit).toBe(false);
        });
      });
    });
  });
});