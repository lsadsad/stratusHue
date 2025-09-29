# Performance Baselines

This directory contains performance baseline data for the Stratus Hue plugin performance tests.

## How It Works

The performance testing system automatically:

1. **Creates baselines on first run** - When a performance test runs for the first time, it establishes a baseline timing
2. **Compares against baselines** - Subsequent runs compare current performance against stored baselines
3. **Fails on regressions** - If performance degrades by more than 20%, the test fails
4. **Updates improved baselines** - If performance improves by more than 10%, baselines are automatically updated

## Baseline File Structure

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "baselines": {
    "operation_name": {
      "operation": "operation_name",
      "averageTime": 45.2,
      "maxTime": 120.5,
      "timestamp": "2024-01-15T10:30:00Z",
      "version": "1.0.0",
      "samples": 50
    }
  }
}
```

## Running Performance Tests

```bash
# Run performance tests with baseline comparison
npm run test:performance

# Run all tests including performance
npm test
```

## Performance Operations Tracked

- `navigation_container_entry` - Time to enter a container and select its children
- `navigation_sibling_next` - Time to navigate to the next sibling element
- `navigation_container_exit` - Time to exit a container and select the parent

## Regression Threshold

- **20% slower** than baseline = Test failure
- **10% faster** than baseline = Baseline update
- Within ±10% = Normal variance, test passes

## Resetting Baselines

If you need to reset baselines (e.g., after major performance improvements):

```typescript
import { PerformanceBaselineManager } from './performance-utils';

// Reset all baselines
PerformanceBaselineManager.resetBaselines();
```

## Example Output

```
=== Performance Report (2024-01-15T10:30:00.000Z) ===
✅ PASS navigation_container_entry: 42.50ms (baseline: 45.20ms) [-6.0%]
✅ PASS navigation_sibling_next: 28.30ms (baseline: 25.80ms) [9.7%]
❌ FAIL navigation_container_exit: 38.40ms (baseline: 30.10ms) [27.6%]

🚨 Performance Regressions Detected:
  - navigation_container_exit: 27.6% slower (threshold: 20%)
```