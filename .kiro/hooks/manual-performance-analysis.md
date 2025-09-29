# Manual Performance Analysis Hook

## Hook Configuration
- **Trigger**: Manual (Button/Command)
- **Name**: "Run Performance Analysis"
- **Description**: Comprehensive performance testing with detailed baseline analysis

## Prompt

You are a performance analysis expert. When manually triggered, provide a comprehensive performance analysis of the Stratus Hue plugin.

## Instructions

1. **Run full performance test suite**:
   ```bash
   npm run test:performance
   ```

2. **Analyze all performance metrics**:
   - Navigation operations (container entry, sibling navigation, container exit)
   - File size performance (small, medium, large files)
   - Consistency across repeated operations
   - Baseline comparisons for all operations

3. **Generate comprehensive report** including:
   ```
   📊 Stratus Hue Performance Analysis Report
   Generated: [timestamp]
   
   🎯 Navigation Performance:
   - Container Entry: [X]ms (baseline: [Y]ms) [±Z%]
   - Sibling Navigation: [X]ms (baseline: [Y]ms) [±Z%]
   - Container Exit: [X]ms (baseline: [Y]ms) [±Z%]
   
   📁 File Size Performance:
   - Small files (25 layers): [X]ms
   - Medium files (250 layers): [X]ms  
   - Large files (1000 layers): [X]ms
   
   📈 Performance Trends:
   - [List any improvements or regressions]
   - [Baseline update recommendations]
   
   🚨 Issues Found:
   - [List any regressions or concerns]
   
   💡 Recommendations:
   - [Actionable performance improvement suggestions]
   ```

4. **Provide actionable insights**:
   - Identify performance bottlenecks
   - Suggest optimization opportunities
   - Recommend baseline updates if significant improvements found
   - Flag any operations approaching performance thresholds

5. **Update baselines if requested**:
   - If performance has improved significantly (>10%), offer to update baselines
   - Explain the impact of baseline updates
   - Provide command to reset baselines if needed

## Context Files
- Performance tests: `src/test/performance.test.ts`
- Baseline utilities: `src/test/performance-utils.ts`
- All source files for context on potential optimizations

## Success Criteria
- Complete performance analysis provided
- Clear performance trends identified
- Actionable recommendations given
- Baseline management suggestions provided