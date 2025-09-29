# Design Document

## Overview

This design extends the existing Vitest-based test infrastructure to add performance regression testing and real-world file testing capabilities. The solution leverages the current `measurePerformance()` utility and test setup while adding baseline comparison and synthetic file generation for comprehensive performance validation.

## Architecture

### Performance Testing Framework
```
src/test/
├── performance/
│   ├── performance-regression.test.ts    # Regression tests with baselines
│   ├── real-world-files.test.ts         # Tests with various file complexities
│   ├── performance-utils.ts             # Utilities for metrics and baselines
│   └── baselines/
│       └── performance-baselines.json   # Stored performance baselines
└── fixtures/
    └── synthetic-files.ts               # Generated test files of varying complexity
```

### Integration with Existing Infrastructure
- Extends current Vitest configuration (`vitest.config.ts`)
- Uses existing test setup (`src/test/setup.ts`) for Figma API mocking
- Leverages existing `measurePerformance()` function from `error-handling.ts`
- Integrates with current npm scripts in `package.json`

## Components and Interfaces

### Performance Baseline System
```typescript
interface PerformanceBaseline {
  operation: string;
  averageTime: number;
  maxTime: number;
  timestamp: string;
  version: string;
}

interface PerformanceReport {
  testRun: string;
  timestamp: string;
  results: PerformanceResult[];
  regressions: PerformanceRegression[];
}

interface PerformanceResult {
  operation: string;
  currentTime: number;
  baselineTime: number;
  percentChange: number;
  passed: boolean;
}
```

### Synthetic File Generator
```typescript
interface FileComplexity {
  size: 'small' | 'medium' | 'large';
  layerCount: number;
  nestingDepth: number;
  containerCount: number;
}

class SyntheticFileGenerator {
  static generateFile(complexity: FileComplexity): MockFigmaFile;
  static createLayerHierarchy(depth: number, childrenPerLevel: number): SceneNode[];
}
```

### Performance Test Runner
```typescript
class PerformanceTestRunner {
  static runRegressionTests(): Promise<PerformanceReport>;
  static runRealWorldTests(): Promise<PerformanceReport>;
  static compareWithBaseline(results: PerformanceResult[]): PerformanceRegression[];
  static updateBaselines(results: PerformanceResult[]): void;
}
```

## Data Models

### Performance Baselines Storage
```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "baselines": {
    "navigation_enter_container": {
      "averageTime": 45,
      "maxTime": 120,
      "samples": 50
    },
    "navigation_sibling_next": {
      "averageTime": 25,
      "maxTime": 80,
      "samples": 50
    },
    "bookmark_create": {
      "averageTime": 15,
      "maxTime": 50,
      "samples": 30
    },
    "theme_switch": {
      "averageTime": 35,
      "maxTime": 100,
      "samples": 20
    }
  }
}
```

### Test File Configurations
```typescript
const FILE_SCENARIOS = {
  small: {
    layerCount: 25,
    nestingDepth: 3,
    containerCount: 5
  },
  medium: {
    layerCount: 250,
    nestingDepth: 6,
    containerCount: 25
  },
  large: {
    layerCount: 1500,
    nestingDepth: 10,
    containerCount: 100
  }
};
```

## Error Handling

### Regression Detection
- Performance degradation >20% triggers test failure
- Missing baselines automatically create new ones on first run
- Corrupted baseline files reset to defaults with warning
- Network/file system errors gracefully handled with fallbacks

### Test Isolation
- Each performance test runs in isolated environment
- Mock Figma API state reset between tests
- Memory cleanup after large file tests
- Timeout protection for long-running operations

## Testing Strategy

### Performance Regression Tests
1. **Core Navigation Operations**
   - Container entry/exit timing
   - Sibling navigation performance
   - Context calculation speed
   - Viewport update efficiency

2. **Bookmark Operations**
   - Bookmark creation/deletion timing
   - Bookmark validation performance
   - Large bookmark list handling

3. **Theme Operations**
   - Theme switching speed
   - Token calculation performance
   - UI update responsiveness

### Real-World File Tests
1. **File Size Scenarios**
   - Small files (10-50 layers): All operations <100ms
   - Medium files (100-500 layers): Navigation <300ms, other ops <150ms
   - Large files (1000+ layers): Navigation <500ms, other ops <250ms

2. **Complexity Scenarios**
   - Deep nesting (10+ levels)
   - Wide hierarchies (100+ siblings)
   - Mixed content types
   - Complex selection patterns

### Baseline Management
1. **Initial Baseline Creation**
   - Run tests 10 times to establish averages
   - Store both average and maximum times
   - Version baselines with plugin version

2. **Baseline Updates**
   - Automatic update when performance improves >10%
   - Manual baseline reset command available
   - Historical baseline tracking for trend analysis

## Implementation Approach

### Phase 1: Core Infrastructure
- Create performance test utilities
- Implement baseline storage system
- Add synthetic file generator
- Integrate with existing test setup

### Phase 2: Regression Testing
- Implement core operation benchmarks
- Add baseline comparison logic
- Create performance test runner
- Add npm script integration

### Phase 3: Real-World Testing
- Create file complexity scenarios
- Implement performance validation
- Add comprehensive test coverage
- Generate performance reports

### Integration Points
- Extends existing Vitest configuration
- Uses current mock Figma API setup
- Leverages existing `measurePerformance()` utility
- Integrates with current npm test scripts
- Maintains compatibility with existing test infrastructure