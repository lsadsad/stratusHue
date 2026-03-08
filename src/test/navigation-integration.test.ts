/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayerNavigationHandler } from '../features/navigation';
import { createMockSceneNode, createMockContainer, createMockPageNode } from './setup';
import type { NavigationResult } from '../core/types';

describe('Navigation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    figma.currentPage.selection = [];
    Object.defineProperty(figma.currentPage, 'children', {
      value: [],
      writable: true,
      configurable: true
    });
  });

  describe('Complete Navigation Workflows', () => {
    it('should complete enter -> navigate siblings -> exit workflow', () => {
      const child1 = createMockSceneNode('child-1', 'Child 1');
      const child2 = createMockSceneNode('child-2', 'Child 2');
      const child3 = createMockSceneNode('child-3', 'Child 3');
      const container = createMockContainer('container-1', 'Test Group', 'GROUP', [child1, child2, child3]);
      [child1, child2, child3].forEach(child => {
        (child as any).parent = container;
      });

      // Step 1: Enter container
      figma.currentPage.selection = [container];
      const enterResult = LayerNavigationHandler.enterContainer(container);
      expect(enterResult.success).toBe(true);
      expect(enterResult.newSelection).toEqual([child1, child2, child3]);

      // Step 2: Navigate up siblings (child1 -> child2)
      // In Figma: 'prev' = UP in panel = higher array index
      figma.currentPage.selection = [child1];
      const nextResult = LayerNavigationHandler.navigateToSibling(child1, 'prev');
      expect(nextResult.success).toBe(true);
      expect(nextResult.newSelection).toEqual([child2]);

      // Step 3: Navigate up siblings (child2 -> child3)
      const nextResult2 = LayerNavigationHandler.navigateToSibling(child2, 'prev');
      expect(nextResult2.success).toBe(true);
      expect(nextResult2.newSelection).toEqual([child3]);

      // Step 4: Exit back to container
      const exitResult = LayerNavigationHandler.exitContainer(child3);
      expect(exitResult.success).toBe(true);
      expect(exitResult.newSelection).toEqual([container]);
    });

    it('should handle nested container navigation workflow', () => {
      const deepChild = createMockSceneNode('deep-child', 'Deep Child');
      const innerContainer = createMockContainer('inner', 'Inner Group', 'GROUP', [deepChild]);
      const middleChild = createMockSceneNode('middle-child', 'Middle Child');
      const middleContainer = createMockContainer('middle', 'Middle Group', 'GROUP', [innerContainer, middleChild]);
      const outerChild = createMockSceneNode('outer-child', 'Outer Child');
      const outerContainer = createMockContainer('outer', 'Outer Group', 'GROUP', [middleContainer, outerChild]);

      (deepChild as any).parent = innerContainer;
      (innerContainer as any).parent = middleContainer;
      (middleChild as any).parent = middleContainer;
      (middleContainer as any).parent = outerContainer;
      (outerChild as any).parent = outerContainer;

      // Navigate down the hierarchy
      const enterOuter = LayerNavigationHandler.enterContainer(outerContainer);
      expect(enterOuter.success).toBe(true);
      expect(enterOuter.newSelection).toContain(middleContainer);

      const enterMiddle = LayerNavigationHandler.enterContainer(middleContainer);
      expect(enterMiddle.success).toBe(true);
      expect(enterMiddle.newSelection).toContain(innerContainer);

      const enterInner = LayerNavigationHandler.enterContainer(innerContainer);
      expect(enterInner.success).toBe(true);
      expect(enterInner.newSelection).toEqual([deepChild]);

      // Exit back up
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
      const sibling1 = createMockSceneNode('sibling-1', 'First Sibling');
      const sibling2 = createMockSceneNode('sibling-2', 'Second Sibling');
      const sibling3 = createMockSceneNode('sibling-3', 'Third Sibling');
      const parent = createMockContainer('parent', 'Parent', 'GROUP', [sibling1, sibling2, sibling3]);
      [sibling1, sibling2, sibling3].forEach(sibling => {
        (sibling as any).parent = parent;
      });

      // Navigate DOWN through siblings: 'next' = lower index
      // sibling3 (index 2) → sibling2 (index 1) → sibling1 (index 0)
      const next1 = LayerNavigationHandler.navigateToSibling(sibling3, 'next');
      expect(next1.success).toBe(true);
      expect(next1.newSelection).toEqual([sibling2]);

      const next2 = LayerNavigationHandler.navigateToSibling(sibling2, 'next');
      expect(next2.success).toBe(true);
      expect(next2.newSelection).toEqual([sibling1]);

      // Wrapping at the bottom: 'next' from index 0 wraps to top (index 2)
      const wrap = LayerNavigationHandler.navigateToSibling(sibling1, 'next');
      expect(wrap.success).toBe(true);
      expect(wrap.message).toContain('Wrapped');
      expect(wrap.newSelection).toEqual([sibling3]);
    });
  });

  describe('Integration with Existing Plugin Systems', () => {
    it('should integrate with selection history system', () => {
      const child = createMockSceneNode('child-1', 'Child');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [child]);

      const result = LayerNavigationHandler.enterContainer(container);

      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([child]);
    });

    it('should work alongside bookmark system without conflicts', () => {
      const bookmarkedNode = createMockSceneNode('bookmark-1', 'Bookmarked Node');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [bookmarkedNode]);
      (bookmarkedNode as any).parent = container;

      const enterResult = LayerNavigationHandler.enterContainer(container);
      const exitResult = LayerNavigationHandler.exitContainer(bookmarkedNode);

      expect(enterResult.success).toBe(true);
      expect(exitResult.success).toBe(true);
    });
  });

  describe('Performance with Large Files', () => {
    it('should handle large layer hierarchies efficiently', () => {
      const largeHierarchy: SceneNode[] = [];
      for (let i = 0; i < 100; i++) {
        const children: SceneNode[] = [];
        for (let j = 0; j < 10; j++) {
          children.push(createMockSceneNode(`child-${i}-${j}`, `Child ${i}-${j}`));
        }
        const container = createMockContainer(`container-${i}`, `Container ${i}`, 'GROUP', children);
        largeHierarchy.push(container);
      }

      Object.defineProperty(figma.currentPage, 'children', {
        value: largeHierarchy,
        writable: true,
        configurable: true
      });

      const startTime = performance.now();
      const context = LayerNavigationHandler.validateNavigationContext([largeHierarchy[0]]);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(context.hasSelection).toBe(true);
    });

    it('should handle complex nested structures efficiently', () => {
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

      // Navigate down the hierarchy
      const startTime = performance.now();
      const results: NavigationResult[] = [];
      let currentNode = currentContainer;

      for (let i = 0; i < 5; i++) {
        const result = LayerNavigationHandler.enterContainer(currentNode);
        results.push(result);
        if (result.newSelection && result.newSelection.length > 0) {
          currentNode = result.newSelection[0];
        }
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle viewport update failures gracefully', () => {
      const child = createMockSceneNode('child-1', 'Child');
      const container = createMockContainer('container-1', 'Container', 'GROUP', [child]);

      figma.viewport.scrollAndZoomIntoView = vi.fn().mockImplementation(() => {
        throw new Error('Viewport error');
      });

      const result = LayerNavigationHandler.enterContainer(container);

      // Navigation logic should succeed even if viewport update fails
      expect(result.success).toBe(true);
      expect(result.newSelection).toEqual([child]);
    });

    it('should maintain consistency during concurrent operations', () => {
      const nodes = [
        createMockSceneNode('node-1', 'Node 1'),
        createMockSceneNode('node-2', 'Node 2'),
        createMockSceneNode('node-3', 'Node 3')
      ];

      const promises = nodes.map(node =>
        Promise.resolve(LayerNavigationHandler.validateNavigationContext([node]))
      );

      return Promise.all(promises).then(contexts => {
        expect(contexts.length).toBe(3);
        contexts.forEach(context => {
          expect(context.hasSelection).toBe(true);
          expect(context.hasComponentInstance).toBe(false);
        });
      });
    });
  });
});
