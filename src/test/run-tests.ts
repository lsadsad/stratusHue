#!/usr/bin/env node

/**
 * Test Runner for Layer Navigation Controls
 * 
 * This script runs all automated tests for the navigation feature
 * and generates a comprehensive test report.
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  suites: TestResult[];
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

class NavigationTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Run all navigation-related tests
   */
  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Layer Navigation Controls Test Suite...\n');

    // Test suites to run
    const testSuites = [
      {
        name: 'Navigation Logic Tests',
        pattern: 'src/test/navigation.test.ts',
        description: 'Core navigation functionality and edge cases'
      },
      {
        name: 'Navigation Context Tests',
        pattern: 'src/test/navigation-context.test.ts',
        description: 'Button state calculation and context analysis'
      },
      {
        name: 'Settings Integration Tests',
        pattern: 'src/test/navigation-settings.test.ts',
        description: 'Settings persistence and UI integration'
      },
      {
        name: 'Integration Tests',
        pattern: 'src/test/navigation-integration.test.ts',
        description: 'End-to-end workflows and system integration'
      },
      {
        name: 'UI Integration Tests',
        pattern: 'src/test/navigation-ui-integration.test.ts',
        description: 'UI components and message handling'
      }
    ];

    // Run each test suite
    for (const suite of testSuites) {
      console.log(`📋 Running ${suite.name}...`);
      console.log(`   ${suite.description}`);
      
      try {
        const result = await this.runTestSuite(suite.pattern, suite.name);
        this.results.push(result);
        
        if (result.failed > 0) {
          console.log(`❌ ${suite.name}: ${result.failed} failed, ${result.passed} passed`);
        } else {
          console.log(`✅ ${suite.name}: All ${result.passed} tests passed`);
        }
      } catch (error) {
        console.error(`💥 ${suite.name}: Failed to run tests`);
        console.error(error);
        
        this.results.push({
          suite: suite.name,
          passed: 0,
          failed: 1,
          skipped: 0,
          duration: 0,
          errors: [String(error)]
        });
      }
      
      console.log('');
    }

    // Generate final report
    const report = this.generateReport();
    
    // Save report to file
    this.saveReport(report);
    
    // Print summary
    this.printSummary(report);
    
    return report;
  }

  /**
   * Run a specific test suite
   */
  private async runTestSuite(pattern: string, suiteName: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Check if test file exists
      if (!existsSync(pattern)) {
        throw new Error(`Test file not found: ${pattern}`);
      }

      // Run vitest for the specific pattern
      const command = `npx vitest run ${pattern} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Parse vitest JSON output
      const result = this.parseVitestOutput(output);
      
      return {
        suite: suiteName,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        duration: Date.now() - startTime,
        errors: result.errors
      };
      
    } catch (error) {
      // Handle test execution errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        suite: suiteName,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Parse vitest JSON output
   */
  private parseVitestOutput(output: string): { passed: number; failed: number; skipped: number; errors: string[] } {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      const jsonLine = lines.find(line => line.startsWith('{'));
      
      if (!jsonLine) {
        throw new Error('No JSON output found from vitest');
      }

      const result = JSON.parse(jsonLine);
      
      return {
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
        skipped: result.numPendingTests || 0,
        errors: result.testResults?.flatMap((tr: any) => 
          tr.assertionResults?.filter((ar: any) => ar.status === 'failed')
            .map((ar: any) => ar.failureMessages?.join('\n') || 'Unknown error')
        ) || []
      };
    } catch (parseError) {
      // Fallback parsing for non-JSON output
      const passed = (output.match(/✓/g) || []).length;
      const failed = (output.match(/✗|×/g) || []).length;
      const skipped = (output.match(/○/g) || []).length;
      
      return {
        passed,
        failed,
        skipped,
        errors: failed > 0 ? ['Parse error: ' + String(parseError)] : []
      };
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): TestReport {
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const totalDuration = Date.now() - this.startTime;

    return {
      timestamp: new Date().toISOString(),
      totalTests: totalPassed + totalFailed + totalSkipped,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration,
      suites: this.results
    };
  }

  /**
   * Save report to file
   */
  private saveReport(report: TestReport): void {
    const reportPath = join(process.cwd(), 'test-results', 'navigation-test-report.json');
    
    try {
      // Ensure directory exists
      execSync('mkdir -p test-results', { stdio: 'ignore' });
      
      // Save JSON report
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      // Generate HTML report
      this.generateHtmlReport(report);
      
      console.log(`📊 Test report saved to: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️  Could not save test report:', error);
    }
  }

  /**
   * Generate HTML test report
   */
  private generateHtmlReport(report: TestReport): void {
    const htmlPath = join(process.cwd(), 'test-results', 'navigation-test-report.html');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Layer Navigation Controls - Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f6f8fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .suite { background: white; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .suite-header { background: #f6f8fa; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 10px; margin-top: 10px; font-family: monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Layer Navigation Controls - Test Report</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Duration: ${(report.totalDuration / 1000).toFixed(2)}s</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value passed">${report.totalPassed}</div>
            <div>Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value failed">${report.totalFailed}</div>
            <div>Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value skipped">${report.totalSkipped}</div>
            <div>Skipped</div>
        </div>
    </div>
    
    <h2>Test Suites</h2>
    ${report.suites.map(suite => `
        <div class="suite">
            <div class="suite-header">
                ${suite.suite}
                <span style="float: right;">
                    <span class="passed">${suite.passed} passed</span>
                    ${suite.failed > 0 ? `<span class="failed">${suite.failed} failed</span>` : ''}
                    ${suite.skipped > 0 ? `<span class="skipped">${suite.skipped} skipped</span>` : ''}
                </span>
            </div>
            <div class="suite-content">
                <p>Duration: ${(suite.duration / 1000).toFixed(2)}s</p>
                ${suite.errors.length > 0 ? `
                    <h4>Errors:</h4>
                    ${suite.errors.map(error => `<div class="error">${error}</div>`).join('')}
                ` : ''}
            </div>
        </div>
    `).join('')}
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9; color: #666;">
        <p>This report was generated automatically by the Layer Navigation Controls test runner.</p>
        <p>For manual testing scenarios, see: <code>src/test/manual-testing-scenarios.md</code></p>
    </div>
</body>
</html>`;

    try {
      writeFileSync(htmlPath, html);
      console.log(`📄 HTML report saved to: ${htmlPath}`);
    } catch (error) {
      console.warn('⚠️  Could not save HTML report:', error);
    }
  }

  /**
   * Print test summary to console
   */
  private printSummary(report: TestReport): void {
    console.log('=' .repeat(60));
    console.log('🎯 LAYER NAVIGATION CONTROLS - TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`⏭️  Skipped: ${report.totalSkipped}`);
    console.log(`⏱️  Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);
    console.log('');

    if (report.totalFailed > 0) {
      console.log('❌ FAILED TESTS:');
      report.suites.forEach(suite => {
        if (suite.failed > 0) {
          console.log(`   ${suite.suite}: ${suite.failed} failed`);
          suite.errors.forEach(error => {
            console.log(`      ${error.split('\n')[0]}`);
          });
        }
      });
      console.log('');
    }

    const successRate = report.totalTests > 0 ? (report.totalPassed / report.totalTests * 100).toFixed(1) : '0';
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (report.totalFailed === 0) {
      console.log('🎉 All tests passed! Navigation controls are ready for release.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues before release.');
    }
    
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Review any failed tests and fix issues');
    console.log('   2. Run manual testing scenarios (see manual-testing-scenarios.md)');
    console.log('   3. Verify accessibility with screen readers and keyboard navigation');
    console.log('   4. Test with large, complex Figma files');
    console.log('   5. Validate integration with existing plugin features');
    console.log('=' .repeat(60));
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const runner = new NavigationTestRunner();
  runner.runAllTests()
    .then(report => {
      process.exit(report.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

export { NavigationTestRunner };