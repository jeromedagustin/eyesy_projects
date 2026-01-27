# Performance Testing

This document describes the performance testing system for the EYESY Web application.

## Overview

The performance test suite measures and tracks key performance metrics to ensure the application maintains high quality and acceptable frame rates. All test results are automatically saved to reports for historical tracking and trend analysis.

## Running Performance Tests

```bash
# Run performance tests and generate report
npm run test:performance

# Run tests and display the summary report
npm run test:performance:report
```

## Report Files

Performance reports are generated in the `performance-reports/` directory:

- **`summary.md`** - Human-readable markdown report with latest results, comparisons, and trends
- **`latest-report.json`** - JSON file with the most recent test run metrics
- **`performance-history.json`** - Historical data from the last 50 test runs

## Performance Metrics Tracked

The test suite measures:

- **Frame Rendering Performance**
  - Average frame time
  - Maximum frame time
  - Frame time consistency (standard deviation)
  - FPS calculations

- **Mode Switching Performance**
  - Mode switch time
  - Async setup time

- **Canvas Performance**
  - Draw call efficiency
  - Batch rendering performance

- **Audio Processing Performance**
  - Audio update processing time
  - 60fps audio handling

- **Transition Performance**
  - Frame capture speed

- **Stress Tests**
  - Rapid mode switching
  - Performance with many objects

## Performance Thresholds

The tests verify that performance meets these thresholds:

- **Target FPS:** 60
- **Minimum FPS:** 30
- **Max Frame Time:** 33.33ms (~30 FPS)
- **Ideal Frame Time:** 16.67ms (60 FPS)
- **Mode Switch Time:** < 100ms
- **Setup Time:** < 500ms

## Reading the Reports

### Summary Report (`summary.md`)

The summary report includes:

1. **Latest Run Summary** - Overview of the most recent test run
2. **Comparison with Previous Run** - Shows changes from the last run (if available)
3. **Detailed Metrics** - Breakdown of metrics for each test
4. **Historical Trends** - Table showing the last 10 runs for trend analysis

### JSON Reports

The JSON files contain structured data that can be:
- Parsed by scripts for automated analysis
- Imported into visualization tools
- Used for CI/CD performance monitoring

## Historical Tracking

The system automatically:
- Saves each test run with a timestamp
- Maintains the last 50 runs for trend analysis
- Compares current run with previous run
- Shows trends over time in the summary report

## Example Report Output

```markdown
# Performance Test Report

**Generated:** 2026-01-24T16:26:26.993Z

## Latest Run Summary

- **Total Tests:** 8
- **Passed:** 8
- **Failed:** 0
- **Average Frame Time:** 11.11ms
- **Max Frame Time:** 16.67ms
- **Average FPS:** 60.00
- **Minimum FPS:** 59.99

## Comparison with Previous Run

| Metric | Previous | Latest | Change |
|--------|----------|--------|--------|
| Avg Frame Time | 12.00ms | 11.11ms | -0.89ms |
| Avg FPS | 58.50 | 60.00 | +1.50 |
```

## Integration with CI/CD

You can integrate performance testing into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Performance Tests
  run: npm run test:performance

- name: Upload Performance Report
  uses: actions/upload-artifact@v3
  with:
    name: performance-report
    path: performance-reports/
```

## Best Practices

1. **Run tests regularly** - Run performance tests after significant changes
2. **Monitor trends** - Check the historical trends to catch performance regressions early
3. **Compare runs** - Use the comparison section to see if changes improved or degraded performance
4. **Set alerts** - Configure alerts if performance drops below thresholds
5. **Review before releases** - Always check performance reports before major releases

## Troubleshooting

If tests fail or show poor performance:

1. Check the detailed metrics to identify which test is failing
2. Review recent code changes that might affect performance
3. Compare with previous runs to see when performance degraded
4. Check system resources (CPU, memory) during test runs
5. Verify test environment matches production environment

## Future Enhancements

Potential improvements to the performance testing system:

- Real browser performance profiling
- Memory leak detection
- GPU performance metrics
- Network performance for asset loading
- Automated performance regression detection
- Integration with performance monitoring tools

