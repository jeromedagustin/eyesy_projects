/**
 * Performance Test Reporter
 * 
 * Collects performance metrics from tests and generates reports
 * with historical tracking for trend analysis.
 */
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceMetrics {
  timestamp: string;
  testSuite: string;
  metrics: {
    [testName: string]: {
      avgFrameTime?: number;
      maxFrameTime?: number;
      frameTimeStdDev?: number;
      modeSwitchTime?: number;
      setupTime?: number;
      drawCallTime?: number;
      audioProcessTime?: number;
      frameCaptureTime?: number;
      memoryUsage?: number;
      [key: string]: number | undefined;
    };
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    avgFrameTime: number;
    maxFrameTime: number;
    minFPS: number;
    avgFPS: number;
  };
}

export class PerformanceReporter {
  private static readonly REPORT_DIR = path.join(process.cwd(), 'performance-reports');
  private static readonly REPORT_FILE = path.join(this.REPORT_DIR, 'performance-history.json');
  private static readonly LATEST_REPORT = path.join(this.REPORT_DIR, 'latest-report.json');
  private static readonly SUMMARY_REPORT = path.join(this.REPORT_DIR, 'summary.md');

  /**
   * Initialize the reports directory
   */
  static initialize(): void {
    if (!fs.existsSync(this.REPORT_DIR)) {
      fs.mkdirSync(this.REPORT_DIR, { recursive: true });
    }
  }

  /**
   * Load historical performance data
   */
  static loadHistory(): PerformanceMetrics[] {
    this.initialize();
    
    if (!fs.existsSync(this.REPORT_FILE)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.REPORT_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading performance history:', error);
      return [];
    }
  }

  /**
   * Save performance metrics
   */
  static saveMetrics(metrics: PerformanceMetrics): void {
    this.initialize();

    // Save latest report
    fs.writeFileSync(this.LATEST_REPORT, JSON.stringify(metrics, null, 2));

    // Load history and append
    const history = this.loadHistory();
    history.push(metrics);

    // Keep only last 50 reports to prevent file from growing too large
    const recentHistory = history.slice(-50);
    fs.writeFileSync(this.REPORT_FILE, JSON.stringify(recentHistory, null, 2));

    // Generate summary report
    this.generateSummaryReport(recentHistory);
  }

  /**
   * Generate a markdown summary report
   */
  static generateSummaryReport(history: PerformanceMetrics[]): void {
    if (history.length === 0) {
      return;
    }

    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;

    let report = `# Performance Test Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `## Latest Run Summary\n\n`;
    report += `- **Total Tests:** ${latest.summary.totalTests}\n`;
    report += `- **Passed:** ${latest.summary.passedTests}\n`;
    report += `- **Failed:** ${latest.summary.failedTests}\n`;
    const formatNumber = (n: number | null | undefined): string => {
      if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return 'N/A';
      return n.toFixed(2);
    };
    
    report += `- **Average Frame Time:** ${formatNumber(latest.summary.avgFrameTime)}ms\n`;
    report += `- **Max Frame Time:** ${formatNumber(latest.summary.maxFrameTime)}ms\n`;
    report += `- **Average FPS:** ${formatNumber(latest.summary.avgFPS)}\n`;
    report += `- **Minimum FPS:** ${formatNumber(latest.summary.minFPS)}\n\n`;

    if (previous) {
      report += `## Comparison with Previous Run\n\n`;
      const frameTimeDiff = latest.summary.avgFrameTime - previous.summary.avgFrameTime;
      const fpsDiff = latest.summary.avgFPS - previous.summary.avgFPS;
      
      report += `| Metric | Previous | Latest | Change |\n`;
      report += `|--------|----------|--------|--------|\n`;
      const formatNumber = (n: number | null | undefined): string => {
        if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return 'N/A';
        return n.toFixed(2);
      };
      
      report += `| Avg Frame Time | ${formatNumber(previous.summary.avgFrameTime)}ms | ${formatNumber(latest.summary.avgFrameTime)}ms | ${frameTimeDiff >= 0 ? '+' : ''}${formatNumber(frameTimeDiff)}ms |\n`;
      report += `| Max Frame Time | ${formatNumber(previous.summary.maxFrameTime)}ms | ${formatNumber(latest.summary.maxFrameTime)}ms | ${formatNumber(latest.summary.maxFrameTime - previous.summary.maxFrameTime)}ms |\n`;
      report += `| Avg FPS | ${formatNumber(previous.summary.avgFPS)} | ${formatNumber(latest.summary.avgFPS)} | ${fpsDiff >= 0 ? '+' : ''}${formatNumber(fpsDiff)} |\n`;
      report += `| Min FPS | ${formatNumber(previous.summary.minFPS)} | ${formatNumber(latest.summary.minFPS)} | ${formatNumber(latest.summary.minFPS - previous.summary.minFPS)} |\n\n`;
    }

    report += `## Detailed Metrics\n\n`;
    report += `### Latest Run (${latest.timestamp})\n\n`;
    
    for (const [testName, testMetrics] of Object.entries(latest.metrics)) {
      report += `#### ${testName}\n\n`;
      const formatNumber = (n: number | null | undefined): string => {
        if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return 'N/A';
        return n.toFixed(2);
      };
      
      for (const [metricName, value] of Object.entries(testMetrics)) {
        if (typeof value === 'number') {
          report += `- **${metricName}:** ${formatNumber(value)}${this.getMetricUnit(metricName)}\n`;
        }
      }
      report += `\n`;
    }

    if (history.length > 1) {
      report += `## Historical Trends\n\n`;
      report += `Showing last ${Math.min(10, history.length)} runs:\n\n`;
      report += `| Date | Avg Frame Time | Max Frame Time | Avg FPS | Min FPS |\n`;
      report += `|------|----------------|----------------|---------|---------|\n`;
      
      const formatNumber = (n: number | null | undefined): string => {
        if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return 'N/A';
        return n.toFixed(2);
      };
      
      const recentRuns = history.slice(-10);
      for (const run of recentRuns) {
        const date = new Date(run.timestamp).toLocaleDateString();
        report += `| ${date} | ${formatNumber(run.summary.avgFrameTime)}ms | ${formatNumber(run.summary.maxFrameTime)}ms | ${formatNumber(run.summary.avgFPS)} | ${formatNumber(run.summary.minFPS)} |\n`;
      }
      report += `\n`;
    }

    report += `---\n\n`;
    report += `*Report generated automatically by performance test suite*\n`;

    fs.writeFileSync(this.SUMMARY_REPORT, report);
  }

  /**
   * Get unit for a metric
   */
  private static getMetricUnit(metricName: string): string {
    if (metricName.includes('Time') || metricName.includes('Time')) {
      return 'ms';
    }
    if (metricName.includes('FPS') || metricName.includes('fps')) {
      return ' fps';
    }
    if (metricName.includes('Memory') || metricName.includes('memory')) {
      return ' MB';
    }
    return '';
  }

  /**
   * Collect metrics from test results
   */
  static collectMetrics(testResults: Map<string, any>): PerformanceMetrics {
    const metrics: PerformanceMetrics['metrics'] = {};
    let totalFrameTime = 0;
    let maxFrameTime = 0;
    let frameTimeCount = 0;
    let totalFPS = 0;
    let minFPS = Infinity;
    let fpsCount = 0;

    for (const [testName, result] of testResults.entries()) {
      const testMetrics: any = {};
      
      if (result.avgFrameTime !== undefined) {
        testMetrics.avgFrameTime = result.avgFrameTime;
        totalFrameTime += result.avgFrameTime;
        frameTimeCount++;
      }
      
      if (result.maxFrameTime !== undefined) {
        testMetrics.maxFrameTime = result.maxFrameTime;
        maxFrameTime = Math.max(maxFrameTime, result.maxFrameTime);
      }
      
      if (result.frameTimeStdDev !== undefined) {
        testMetrics.frameTimeStdDev = result.frameTimeStdDev;
      }
      
      if (result.modeSwitchTime !== undefined) {
        testMetrics.modeSwitchTime = result.modeSwitchTime;
      }
      
      if (result.maxModeSwitchTime !== undefined) {
        testMetrics.maxModeSwitchTime = result.maxModeSwitchTime;
      }
      
      if (result.minModeSwitchTime !== undefined) {
        testMetrics.minModeSwitchTime = result.minModeSwitchTime;
      }
      
      if (result.switchCount !== undefined) {
        testMetrics.switchCount = result.switchCount;
      }
      
      if (result.totalModes !== undefined) {
        testMetrics.totalModes = result.totalModes;
      }
      
      if (result.testedModes !== undefined) {
        testMetrics.testedModes = result.testedModes;
      }
      
      if (result.failedModes !== undefined) {
        testMetrics.failedModes = result.failedModes;
      }
      
      if (result.categoriesTested !== undefined) {
        testMetrics.categoriesTested = result.categoriesTested;
      }
      
      // Track mode switch times for summary
      if (result.modeSwitchTime !== undefined) {
        // This will be used in summary calculations
      }
      
      if (result.setupTime !== undefined) {
        testMetrics.setupTime = result.setupTime;
      }
      
      if (result.drawCallTime !== undefined) {
        testMetrics.drawCallTime = result.drawCallTime;
      }
      
      if (result.audioProcessTime !== undefined) {
        testMetrics.audioProcessTime = result.audioProcessTime;
      }
      
      if (result.frameCaptureTime !== undefined) {
        testMetrics.frameCaptureTime = result.frameCaptureTime;
      }

      // Calculate FPS from frame time
      if (result.avgFrameTime !== undefined) {
        const fps = 1000 / result.avgFrameTime;
        testMetrics.avgFPS = fps;
        totalFPS += fps;
        minFPS = Math.min(minFPS, fps);
        fpsCount++;
      }

      metrics[testName] = testMetrics;
    }

    const avgFrameTime = frameTimeCount > 0 ? totalFrameTime / frameTimeCount : 0;
    const avgFPS = fpsCount > 0 ? totalFPS / fpsCount : (avgFrameTime > 0 ? 1000 / avgFrameTime : null);

    return {
      timestamp: new Date().toISOString(),
      testSuite: 'performance',
      metrics,
      summary: {
        totalTests: testResults.size,
        passedTests: testResults.size, // Assume all passed if we have results
        failedTests: 0,
        avgFrameTime,
        maxFrameTime: maxFrameTime || avgFrameTime,
        minFPS: minFPS === Infinity ? (avgFPS || 0) : minFPS,
        avgFPS: avgFPS || null,
      },
    };
  }
}

