/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { LayerNavigationHandler } from '../features/navigation';
import { createMockSceneNode, createMockContainer } from './setup';
import { 
  PerformanceBaselineManager, 
  measureAndComparePerformance,
  type PerformanceReport 
} from './performance-utils';

// File size configurations for testing (Requirements 2.1, 2.2)
interface FileComplexity {
  size: 'small' | 'medium' | 'large';
  layerCount: number;
  nestingDepth: number;
  containerCount: number;
}

const FILE_SCENARIOS: Record<string, FileComplexity> = {
  small: {
    size: 'small',
    layerCount: 25,
    nestingDepth: 3,
    containerCount: 5
  },
  medium: {
    size: 'medium',
    layerCount: 250,
    nestingDepth: 6,
    containerCount: 25
  },
  large: {
    size: 'large',
    layerCount: 1000,
    nestingDepth: 10,
    containerCount: 100
  }
};

// Helper function to generate mock files with different layer counts
function generateMockFile(complexity: FileComplexity): SceneNode {
  const { layerCount, nestingDepth, containerCount } = complexity;
  
  // Calculate layers per container to distribute evenly
  const layersPerContainer = Math.floor(layerCount / containerCount);
  const remainingLayers = layerCount % containerCount;
  
  const containers: SceneNode[] = [];
  let totalLayersCreated = 0;
  
  // Create containers with nested structure
  for (let i = 0; i < containerCount && totalLayersCreated < layerCount; i++) {
    const layersInThisContainer = layersPerContainer + (i < remainingLayers ? 1 : 0);
    const container = createNestedContainer(
      `container-${i}`,
      `Container ${i}`,
      layersInThisContainer,
      Math.min(nestingDepth, 3) // Limit depth per container to avoid excessive nesting
    );
    containers.push(container);
    totalLayersCreated += layersInThisContainer;
  }
  
  // Create root container with all sub-containers
  const rootContainer = createMockContainer(
    `root-${complexity.size}`,
    `Root ${complexity.size} File`,
    'FRAME',
    containers
  );
  
  return rootContainer;
}

// Helper to create nested container structure
function createNestedContainer(
  id: string,
  name: string,
  targetLayers: number,
  depth: number
): SceneNode {
  if (depth <= 1 || targetLayers <= 3) {
    // Base case: create simple container with leaf nodes
    const children = Array.from({ length: targetLayers }, (_, i) =>
      createMockSceneNode(`${id}-leaf-${i}`, `${name} Leaf ${i}`)
    );
    return createMockContainer(id, name, 'GROUP', children);
  }
  
  // Recursive case: create nested structure
  const childContainers = Math.min(3, Math.ceil(targetLayers / 5)); // Limit branching
  const layersPerChild = Math.floor(targetLayers / childContainers);
  const children: SceneNode[] = [];
  
  for (let i = 0; i < childContainers; i++) {
    const childLayers = i === childContainers - 1 
      ? targetLayers - (layersPerChild * i) // Give remaining layers to last child
      : layersPerChild;
    
    const child = createNestedContainer(
      `${id}-child-${i}`,
      `${name} Child ${i}`,
      childLayers,
      depth - 1
    );
    children.push(child);
  }
  
  return createMockContainer(id, name, 'GROUP', children);
}

describe('Performance Tests', () => {
  let performanceResults: Array<{ operation: string; time: number }> = [];

  beforeEach(() => {
    // Reset any performance-related state
    performance.clearMarks?.();
    performance.clearMeasures?.();
    performanceResults = [];
  });

  afterAll(() => {
    // Generate final performance report
    if (performanceResults.length > 0) {
      const report = PerformanceBaselineManager.runPerformanceComparison(performanceResults);
      console.log(PerformanceBaselineManager.formatReport(report));
      
      // Fail the test suite if there are regressions
      if (PerformanceBaselineManager.hasRegressions(report)) {
        throw new Error(`Performance regressions detected. See report above.`);
      }
    }
  });

  describe('Baseline Comparison Tests', () => {
    it('should create baselines on first run', async () => {
      // Arrange - Reset baselines to ensure clean state
      PerformanceBaselineManager.resetBaselines();
      
      const children = Array.from({ length: 5 }, (_, i) => 
        createMockSceneNode(`child-${i}`, `Child ${i}`)
      );
      const container = createMockContainer('baseline-test', 'Baseline Test Container', 'GROUP', children);

      // Act - Measure performance and create baseline
      const { result, performanceResult } = await measureAndComparePerformance(
        'baseline_container_entry',
        () => LayerNavigationHandler.enterContainer(container)
      );

      // Assert - First run should pass and create baseline
      expect(performanceResult.passed).toBe(true);
      expect(performanceResult.baselineTime).toBeUndefined(); // No baseline existed
      expect(result.success).toBe(true);

      // Verify baseline was created
      const baseline = PerformanceBaselineManager.getBaseline('baseline_container_entry');
      expect(baseline).toBeTruthy();
      expect(baseline!.averageTime).toBe(performanceResult.currentTime);
      expect(baseline!.samples).toBe(1);
    });

    it('should compare against existing baselines', async () => {
      // Arrange - Create a baseline first
      const children = Array.from({ length: 5 }, (_, i) => 
        createMockSceneNode(`child-${i}`, `Child ${i}`)
      );
      const container = createMockContainer('comparison-test', 'Comparison Test Container', 'GROUP', children);

      // Create initial baseline
      await measureAndComparePerformance(
        'comparison_container_entry',
        () => LayerNavigationHandler.enterContainer(container)
      );

      // Act - Run the same operation again
      const { result, performanceResult } = await measureAndComparePerformance(
        'comparison_container_entry',
        () => LayerNavigationHandler.enterContainer(container)
      );

      // Assert - Should compare against baseline
      expect(performanceResult.passed).toBe(true);
      expect(performanceResult.baselineTime).toBeDefined();
      expect(performanceResult.percentChange).toBeDefined();
      expect(result.success).toBe(true);

      // Performance change should be reasonable (within 50% threshold for test environment)
      // Note: Test environments can have higher variance due to JIT compilation and system load
      expect(Math.abs(performanceResult.percentChange!)).toBeLessThan(0.50);
    });

    it('should fail when performance degrades beyond threshold', async () => {
      // Arrange - Create a fast baseline
      PerformanceBaselineManager.updateBaseline('slow_operation_test', 10); // 10ms baseline

      // Act - Simulate a slow operation by adding artificial delay
      const { performanceResult } = await measureAndComparePerformance(
        'slow_operation_test',
        async () => {
          // Simulate slow operation (>20% slower than 10ms baseline)
          await new Promise(resolve => setTimeout(resolve, 15)); // 15ms > 12ms (20% of 10ms)
          return { success: true };
        }
      );

      // Assert - Should detect regression
      expect(performanceResult.passed).toBe(false);
      expect(performanceResult.percentChange).toBeGreaterThan(0.20);
    });

    it('should update baseline when performance improves significantly', async () => {
      // Arrange - Create a slow baseline
      PerformanceBaselineManager.updateBaseline('improvement_test', 100); // 100ms baseline

      // Act - Run a much faster operation (>10% improvement)
      const { performanceResult } = await measureAndComparePerformance(
        'improvement_test',
        () => {
          // Fast operation - should be much faster than 100ms baseline
          return { success: true };
        }
      );

      // Assert - Should pass and potentially update baseline
      expect(performanceResult.passed).toBe(true);
      expect(performanceResult.currentTime).toBeLessThan(100);
      
      // Check if baseline was updated (if improvement was >10%)
      const updatedBaseline = PerformanceBaselineManager.getBaseline('improvement_test');
      if (performanceResult.percentChange && performanceResult.percentChange < -0.10) {
        expect(updatedBaseline!.averageTime).toBeLessThan(100);
      }
    });

    it('should generate comprehensive performance report', () => {
      // Arrange - Create test results
      const testResults = [
        { operation: 'fast_operation', time: 50 },
        { operation: 'medium_operation', time: 150 },
        { operation: 'slow_operation', time: 300 }
      ];

      // Act - Generate performance report
      const report = PerformanceBaselineManager.runPerformanceComparison(testResults);

      // Assert - Report should contain all results
      expect(report.results).toHaveLength(3);
      expect(report.timestamp).toBeDefined();
      expect(report.testRun).toBeDefined();
      
      // All operations should pass (creating new baselines)
      report.results.forEach(result => {
        expect(result.passed).toBe(true);
        expect(result.currentTime).toBeGreaterThan(0);
      });

      // Should have no regressions for new baselines
      expect(report.regressions).toHaveLength(0);
      expect(PerformanceBaselineManager.hasRegressions(report)).toBe(false);

      // Report formatting should work
      const formattedReport = PerformanceBaselineManager.formatReport(report);
      expect(formattedReport).toContain('Performance Report');
      expect(formattedReport).toContain('fast_operation');
    });
  });

  describe('Navigation Performance', () => {
    beforeEach(() => {
      // Reset any performance-related state
      performance.clearMarks?.();
      performance.clearMeasures?.();
    });

    it('should complete container entry within performance threshold', async () => {
      // Arrange - Create a container with multiple children
      const children = Array.from({ length: 10 }, (_, i) => 
        createMockSceneNode(`child-${i}`, `Child ${i}`)
      );
      const container = createMockContainer('test-container', 'Test Container', 'GROUP', children);

      // Act & Assert - Measure performance with baseline comparison
      const { result: navigationResult, performanceResult } = await measureAndComparePerformance(
        'navigation_container_entry',
        () => LayerNavigationHandler.enterContainer(container)
      );

      // Assert operation completes within 500ms threshold (requirement 1.4)
      expect(performanceResult.currentTime).toBeLessThan(500);
      expect(performanceResult.passed).toBe(true); // Should pass baseline comparison
      expect(navigationResult.success).toBe(true);
      expect(navigationResult.newSelection).toHaveLength(10);

      // Store result for final report
      performanceResults.push({ 
        operation: 'navigation_container_entry', 
        time: performanceResult.currentTime 
      });

      // Log performance for monitoring
      console.log(`Container entry took ${performanceResult.currentTime.toFixed(2)}ms`);
    });

    it('should complete sibling navigation within performance threshold', async () => {
      // Arrange - Create siblings within a parent container
      const node1 = createMockSceneNode('node-1', 'Node 1');
      const node2 = createMockSceneNode('node-2', 'Node 2');
      const node3 = createMockSceneNode('node-3', 'Node 3');
      const parent = createMockContainer('parent', 'Parent', 'GROUP', [node1, node2, node3]);

      // Set up parent relationships
      (node1 as any).parent = parent;
      (node2 as any).parent = parent;
      (node3 as any).parent = parent;

      // Act & Assert - Measure performance with baseline comparison
      const { result: navigationResult, performanceResult } = await measureAndComparePerformance(
        'navigation_sibling_next',
        () => LayerNavigationHandler.navigateToSibling(node1, 'next')
      );

      // Assert operation completes within 500ms threshold (requirement 1.4)
      expect(performanceResult.currentTime).toBeLessThan(500);
      expect(performanceResult.passed).toBe(true); // Should pass baseline comparison
      expect(navigationResult.success).toBe(true);
      expect(navigationResult.newSelection).toHaveLength(1);

      // Store result for final report
      performanceResults.push({ 
        operation: 'navigation_sibling_next', 
        time: performanceResult.currentTime 
      });

      // Log performance for monitoring
      console.log(`Sibling navigation took ${performanceResult.currentTime.toFixed(2)}ms`);
    });

    it('should complete container exit within performance threshold', () => {
      // Arrange - Create a child node with a parent container
      const child = createMockSceneNode('child', 'Child Node');
      const parent = createMockContainer('parent', 'Parent Container', 'GROUP', [child]);
      (child as any).parent = parent;

      // Act & Assert - Measure performance of container exit
      const start = performance.now();
      const navigationResult = LayerNavigationHandler.exitContainer(child);
      const end = performance.now();
      const duration = end - start;

      // Assert operation completes within 500ms threshold (requirement 1.4)
      expect(duration).toBeLessThan(500);
      expect(navigationResult.success).toBe(true);
      expect(navigationResult.newSelection).toHaveLength(1);
      expect(navigationResult.newSelection![0].id).toBe(parent.id);

      // Log performance for monitoring
      console.log(`Container exit took ${duration.toFixed(2)}ms`);
    });

    it('should handle multiple navigation operations efficiently', () => {
      // Arrange - Create a more complex hierarchy
      const grandchildren = Array.from({ length: 5 }, (_, i) => 
        createMockSceneNode(`grandchild-${i}`, `Grandchild ${i}`)
      );
      const children = Array.from({ length: 3 }, (_, i) => 
        createMockContainer(`child-${i}`, `Child ${i}`, 'GROUP', 
          i === 0 ? grandchildren : [createMockSceneNode(`leaf-${i}`, `Leaf ${i}`)]
        )
      );
      const rootContainer = createMockContainer('root', 'Root Container', 'GROUP', children);

      // Set up parent relationships
      children.forEach(child => {
        (child as any).parent = rootContainer;
        if ('children' in child && child.children) {
          child.children.forEach(grandchild => {
            (grandchild as any).parent = child;
          });
        }
      });

      // Act & Assert - Measure performance of sequential operations
      const start = performance.now();
      
      // Enter root container
      const enterResult = LayerNavigationHandler.enterContainer(rootContainer);
      expect(enterResult.success).toBe(true);
      
      // Navigate to sibling
      const siblingResult = LayerNavigationHandler.navigateToSibling(children[0], 'next');
      expect(siblingResult.success).toBe(true);
      
      // Enter child container
      const enterChildResult = LayerNavigationHandler.enterContainer(children[0]);
      expect(enterChildResult.success).toBe(true);
      
      // Exit back to parent
      const exitResult = LayerNavigationHandler.exitContainer(grandchildren[0]);
      expect(exitResult.success).toBe(true);
      
      const end = performance.now();
      const duration = end - start;

      // Assert all operations complete within reasonable time (requirement 1.1)
      expect(duration).toBeLessThan(1000); // Allow more time for multiple operations
      
      // Log performance for monitoring
      console.log(`Multiple navigation operations took ${duration.toFixed(2)}ms`);
    });

    it('should maintain consistent performance with repeated operations', () => {
      // Arrange - Create test data
      const children = Array.from({ length: 20 }, (_, i) => 
        createMockSceneNode(`child-${i}`, `Child ${i}`)
      );
      const container = createMockContainer('perf-test', 'Performance Test Container', 'GROUP', children);

      const durations: number[] = [];
      const iterations = 10;

      // Act - Perform the same operation multiple times
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const navigationResult = LayerNavigationHandler.enterContainer(container);
        const end = performance.now();
        const duration = end - start;
        
        durations.push(duration);
        expect(navigationResult.success).toBe(true);
        
        // Each individual operation should be fast
        expect(duration).toBeLessThan(500);
      }

      // Assert - Check for performance consistency (requirement 1.1)
      const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      
      // Performance should be consistent - max shouldn't be more than 10x the average (allowing for JIT warmup)
      expect(maxDuration).toBeLessThan(averageDuration * 10);
      
      // Average should be well under the threshold
      expect(averageDuration).toBeLessThan(250);
      
      // No single operation should take too long
      expect(maxDuration).toBeLessThan(500);
      
      console.log(`Performance stats - Avg: ${averageDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
    });
  });

  describe('File Size Performance Testing', () => {
    beforeEach(() => {
      // Reset any performance-related state
      performance.clearMarks?.();
      performance.clearMeasures?.();
    });

    it('should handle small files (25 layers) within performance threshold', () => {
      // Arrange - Generate small file
      const smallFile = generateMockFile(FILE_SCENARIOS.small);
      
      // Act & Assert - Test navigation operations on small file
      const start = performance.now();
      
      // Test container entry
      const enterResult = LayerNavigationHandler.enterContainer(smallFile);
      expect(enterResult.success).toBe(true);
      
      // Test sibling navigation if there are multiple children
      if (enterResult.newSelection && enterResult.newSelection.length > 1) {
        const siblingResult = LayerNavigationHandler.navigateToSibling(
          enterResult.newSelection[0], 
          'next'
        );
        expect(siblingResult.success).toBe(true);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Assert navigation completes within 500ms threshold (Requirement 2.2)
      expect(duration).toBeLessThan(500);
      
      console.log(`Small file (${FILE_SCENARIOS.small.layerCount} layers) navigation: ${duration.toFixed(2)}ms`);
    });

    it('should handle medium files (250 layers) within performance threshold', () => {
      // Arrange - Generate medium file
      const mediumFile = generateMockFile(FILE_SCENARIOS.medium);
      
      // Act & Assert - Test navigation operations on medium file
      const start = performance.now();
      
      // Test container entry
      const enterResult = LayerNavigationHandler.enterContainer(mediumFile);
      expect(enterResult.success).toBe(true);
      
      // Test sibling navigation if there are multiple children
      if (enterResult.newSelection && enterResult.newSelection.length > 1) {
        const siblingResult = LayerNavigationHandler.navigateToSibling(
          enterResult.newSelection[0], 
          'next'
        );
        expect(siblingResult.success).toBe(true);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Assert navigation completes within 500ms threshold (Requirement 2.2)
      expect(duration).toBeLessThan(500);
      
      console.log(`Medium file (${FILE_SCENARIOS.medium.layerCount} layers) navigation: ${duration.toFixed(2)}ms`);
    });

    it('should handle large files (1000 layers) within performance threshold', () => {
      // Arrange - Generate large file
      const largeFile = generateMockFile(FILE_SCENARIOS.large);
      
      // Act & Assert - Test navigation operations on large file
      const start = performance.now();
      
      // Test container entry
      const enterResult = LayerNavigationHandler.enterContainer(largeFile);
      expect(enterResult.success).toBe(true);
      
      // Test sibling navigation if there are multiple children
      if (enterResult.newSelection && enterResult.newSelection.length > 1) {
        const siblingResult = LayerNavigationHandler.navigateToSibling(
          enterResult.newSelection[0], 
          'next'
        );
        expect(siblingResult.success).toBe(true);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Assert navigation completes within 500ms threshold (Requirement 2.2)
      expect(duration).toBeLessThan(500);
      
      console.log(`Large file (${FILE_SCENARIOS.large.layerCount} layers) navigation: ${duration.toFixed(2)}ms`);
    });

    it('should demonstrate performance scaling across different file sizes', () => {
      // Arrange - Generate all file sizes
      const files = {
        small: generateMockFile(FILE_SCENARIOS.small),
        medium: generateMockFile(FILE_SCENARIOS.medium),
        large: generateMockFile(FILE_SCENARIOS.large)
      };
      
      const results: Array<{ size: string; duration: number; layerCount: number }> = [];
      
      // Act - Test each file size
      Object.entries(files).forEach(([size, file]) => {
        const scenario = FILE_SCENARIOS[size];
        
        const start = performance.now();
        
        // Perform consistent navigation operations
        const enterResult = LayerNavigationHandler.enterContainer(file);
        expect(enterResult.success).toBe(true);
        
        // Test multiple navigation operations to stress test
        let currentSelection = enterResult.newSelection;
        for (let i = 0; i < Math.min(3, currentSelection?.length || 0); i++) {
          if (currentSelection && currentSelection[i]) {
            const siblingResult = LayerNavigationHandler.navigateToSibling(
              currentSelection[i], 
              'next'
            );
            // Don't fail if sibling navigation doesn't work (might be last sibling)
            if (siblingResult.success) {
              currentSelection = siblingResult.newSelection;
            }
          }
        }
        
        const end = performance.now();
        const duration = end - start;
        
        // Assert each file size meets performance requirements (Requirement 2.1, 2.2)
        expect(duration).toBeLessThan(500);
        
        results.push({ 
          size, 
          duration, 
          layerCount: scenario.layerCount 
        });
      });
      
      // Assert - Verify performance characteristics
      results.forEach(result => {
        expect(result.duration).toBeLessThan(500);
        console.log(`${result.size} file (${result.layerCount} layers): ${result.duration.toFixed(2)}ms`);
      });
      
      // Performance should be reasonable even for large files
      const largeFileResult = results.find(r => r.size === 'large');
      expect(largeFileResult?.duration).toBeLessThan(500);
    });

    it('should maintain performance consistency across file sizes with repeated operations', () => {
      // Arrange - Test each file size multiple times
      const iterations = 5;
      const fileTypes = ['small', 'medium', 'large'] as const;
      
      fileTypes.forEach(fileType => {
        const scenario = FILE_SCENARIOS[fileType];
        const durations: number[] = [];
        
        // Act - Perform multiple iterations for each file size
        for (let i = 0; i < iterations; i++) {
          const file = generateMockFile(scenario);
          
          const start = performance.now();
          
          const enterResult = LayerNavigationHandler.enterContainer(file);
          expect(enterResult.success).toBe(true);
          
          const end = performance.now();
          const duration = end - start;
          
          durations.push(duration);
          expect(duration).toBeLessThan(500);
        }
        
        // Assert - Check consistency for this file type (Requirement 2.1)
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        
        // Performance should be consistent across iterations
        expect(maxDuration).toBeLessThan(500);
        expect(avgDuration).toBeLessThan(400); // Average should be well under threshold
        
        console.log(`${fileType} file consistency - Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
      });
    });
  });
});