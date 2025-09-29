/// <reference types="@figma/plugin-typings" />

// Performance baseline interfaces
export interface PerformanceBaseline {
  operation: string;
  averageTime: number;
  maxTime: number;
  timestamp: string;
  version: string;
  samples: number;
}

export interface PerformanceResult {
  operation: string;
  currentTime: number;
  baselineTime?: number;
  percentChange?: number;
  passed: boolean;
}

export interface PerformanceReport {
  testRun: string;
  timestamp: string;
  results: PerformanceResult[];
  regressions: PerformanceRegression[];
}

export interface PerformanceRegression {
  operation: string;
  currentTime: number;
  baselineTime: number;
  percentIncrease: number;
  threshold: number;
}

export interface BaselineStorage {
  version: string;
  lastUpdated: string;
  baselines: Record<string, PerformanceBaseline>;
}

// Configuration
const REGRESSION_THRESHOLD = 0.20; // 20% threshold for performance regression
const PLUGIN_VERSION = '1.0.0'; // This could be read from package.json in a real implementation

/**
 * Performance baseline manager for storing and comparing performance metrics
 * Uses in-memory storage for tests with optional file persistence
 */
export class PerformanceBaselineManager {
  private static inMemoryBaselines: BaselineStorage = {
    version: PLUGIN_VERSION,
    lastUpdated: new Date().toISOString(),
    baselines: {}
  };

  private static useFileSystem = false;

  /**
   * Enable or disable file system persistence (disabled by default for tests)
   */
  static setFileSystemMode(enabled: boolean): void {
    this.useFileSystem = enabled;
  }

  /**
   * Load existing baselines from memory or file
   */
  static loadBaselines(): BaselineStorage {
    if (!this.useFileSystem) {
      return this.inMemoryBaselines;
    }

    try {
      // File system operations would go here in a real environment
      // For now, return in-memory baselines
      return this.inMemoryBaselines;
    } catch (error) {
      console.warn('Failed to load performance baselines, using in-memory baselines:', error);
      return this.inMemoryBaselines;
    }
  }

  /**
   * Save baselines to memory or file
   */
  static saveBaselines(baselines: BaselineStorage): void {
    this.inMemoryBaselines = { ...baselines };
    
    if (this.useFileSystem) {
      try {
        // File system operations would go here in a real environment
        console.log('Baselines saved to file system (simulated)');
      } catch (error) {
        console.error('Failed to save performance baselines:', error);
      }
    }
  }

  /**
   * Get baseline for a specific operation
   */
  static getBaseline(operation: string): PerformanceBaseline | null {
    const baselines = this.loadBaselines();
    return baselines.baselines[operation] || null;
  }

  /**
   * Update or create baseline for an operation
   */
  static updateBaseline(operation: string, time: number): void {
    const baselines = this.loadBaselines();
    const existing = baselines.baselines[operation];

    if (existing) {
      // Update existing baseline with new sample
      const newSamples = existing.samples + 1;
      const newAverage = ((existing.averageTime * existing.samples) + time) / newSamples;
      const newMax = Math.max(existing.maxTime, time);

      baselines.baselines[operation] = {
        ...existing,
        averageTime: newAverage,
        maxTime: newMax,
        samples: newSamples,
        timestamp: new Date().toISOString()
      };
    } else {
      // Create new baseline
      baselines.baselines[operation] = {
        operation,
        averageTime: time,
        maxTime: time,
        timestamp: new Date().toISOString(),
        version: PLUGIN_VERSION,
        samples: 1
      };
    }

    baselines.lastUpdated = new Date().toISOString();
    this.saveBaselines(baselines);
  }

  /**
   * Compare current performance against baseline
   */
  static compareWithBaseline(operation: string, currentTime: number): PerformanceResult {
    const baseline = this.getBaseline(operation);

    if (!baseline) {
      // No baseline exists, create one and pass the test
      this.updateBaseline(operation, currentTime);
      return {
        operation,
        currentTime,
        passed: true
      };
    }

    const baselineTime = baseline.averageTime;
    const percentChange = ((currentTime - baselineTime) / baselineTime);
    const passed = percentChange <= REGRESSION_THRESHOLD;

    // If performance improved significantly (>10% faster), update baseline
    if (percentChange < -0.10) {
      this.updateBaseline(operation, currentTime);
    }

    return {
      operation,
      currentTime,
      baselineTime,
      percentChange,
      passed
    };
  }

  /**
   * Run performance comparison for multiple operations
   */
  static runPerformanceComparison(results: Array<{ operation: string; time: number }>): PerformanceReport {
    const performanceResults: PerformanceResult[] = [];
    const regressions: PerformanceRegression[] = [];

    for (const { operation, time } of results) {
      const result = this.compareWithBaseline(operation, time);
      performanceResults.push(result);

      if (!result.passed && result.baselineTime && result.percentChange) {
        regressions.push({
          operation,
          currentTime: time,
          baselineTime: result.baselineTime,
          percentIncrease: result.percentChange,
          threshold: REGRESSION_THRESHOLD
        });
      }
    }

    return {
      testRun: `performance-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      results: performanceResults,
      regressions
    };
  }

  /**
   * Check if there are any performance regressions
   */
  static hasRegressions(report: PerformanceReport): boolean {
    return report.regressions.length > 0;
  }

  /**
   * Format performance report for console output
   */
  static formatReport(report: PerformanceReport): string {
    const lines: string[] = [];
    lines.push(`\n=== Performance Report (${report.timestamp}) ===`);
    
    report.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const baseline = result.baselineTime ? ` (baseline: ${result.baselineTime.toFixed(2)}ms)` : ' (new baseline)';
      const change = result.percentChange ? ` [${(result.percentChange * 100).toFixed(1)}%]` : '';
      
      lines.push(`${status} ${result.operation}: ${result.currentTime.toFixed(2)}ms${baseline}${change}`);
    });

    if (report.regressions.length > 0) {
      lines.push('\n🚨 Performance Regressions Detected:');
      report.regressions.forEach(regression => {
        const increase = (regression.percentIncrease * 100).toFixed(1);
        const threshold = (regression.threshold * 100).toFixed(0);
        lines.push(`  - ${regression.operation}: ${increase}% slower (threshold: ${threshold}%)`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Reset all baselines (useful for testing or major changes)
   */
  static resetBaselines(): void {
    const emptyBaselines: BaselineStorage = {
      version: PLUGIN_VERSION,
      lastUpdated: new Date().toISOString(),
      baselines: {}
    };
    this.saveBaselines(emptyBaselines);
  }

  /**
   * Get all current baselines (useful for testing)
   */
  static getAllBaselines(): Record<string, PerformanceBaseline> {
    return this.loadBaselines().baselines;
  }
}

/**
 * Utility function to measure performance of a function and compare with baseline
 */
export async function measureAndComparePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<{ result: T; performanceResult: PerformanceResult }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  const performanceResult = PerformanceBaselineManager.compareWithBaseline(operation, duration);

  return { result, performanceResult };
}