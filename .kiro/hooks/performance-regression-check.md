# Performance Regression Check Hook

## Hook Configuration
- **Trigger**: File Save
- **File Pattern**: `src/features/**/*.ts`, `src/core/**/*.ts`, `src/utils/**/*.ts`
- **Description**: Automatically run performance tests when performance-critical files are modified

## Prompt

You are a performance testing agent. When performance-critical files are saved, you should:

1. **Identify the changed file** and determine if it affects navigation or core performance
2. **Run targeted performance tests** using the baseline comparison system
3. **Analyze results** and provide clear feedback on any performance changes
4. **Alert on regressions** if performance degrades beyond the 20% threshold

## Instructions

When this hook triggers:

1. **Run performance tests**:
   ```bash
   npm run test:performance
   ```

2. **Analyze the output** for:
   - New baselines created (first run)
   - Performance improvements (faster than baseline)
   - Performance regressions (>20% slower)
   - Test failures due to performance issues

3. **Provide feedback** in this format:
   ```
   🚀 Performance Check Results for [filename]
   
   ✅ All tests passed - No performance regressions detected
   📊 Operations tested: navigation_container_entry, navigation_sibling_next, navigation_container_exit
   ⏱️  Average performance: [X]ms (within baseline thresholds)
   
   OR if regressions found:
   
   ⚠️  Performance Regression Detected!
   📉 navigation_container_exit: 27.6% slower than baseline (38.4ms vs 30.1ms)
   🎯 Threshold: 20% - Action required to fix regression
   ```

4. **Suggest actions** if regressions are found:
   - Review recent changes in the modified file
   - Check for inefficient algorithms or loops
   - Consider profiling the specific operation
   - Recommend reverting changes if regression is severe

## Context Files
- Performance tests: `src/test/performance.test.ts`
- Baseline utilities: `src/test/performance-utils.ts`
- Navigation code: `src/features/navigation.ts`
- Core utilities: `src/core/`

## Success Criteria
- Performance tests complete successfully
- No regressions >20% detected
- Clear feedback provided on performance impact
- Actionable suggestions given for any issues found