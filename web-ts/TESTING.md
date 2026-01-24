# Testing Guide

## Test Suite Overview

The test suite verifies that all EYESY modes can be instantiated and run without errors.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### Mode Tests (`src/test/modes.test.ts`)

Tests all 126 modes to ensure:
- ✅ Modes can be instantiated
- ✅ `setup()` method exists and can be called
- ✅ `draw()` method exists and can be called
- ✅ Multiple `draw()` calls work (simulating animation loop)
- ✅ Modes handle different knob values (0, 0.25, 0.5, 0.75, 1.0)
- ✅ Modes handle trigger state changes

**Total: 1,014 tests** (126 modes × ~8 tests per mode)

### Core API Tests (`src/test/core.test.ts`)

Tests the core EYESY and Canvas APIs:
- ✅ EYESY instance creation
- ✅ Knob value handling
- ✅ Audio data updates
- ✅ Color picker functions
- ✅ Canvas drawing methods (fill, circle, line, lines, rect, clear)

**Total: 12 tests**

### Mode Status Tests (`src/test/mode-status.test.ts`)

Reports which modes are fully implemented vs stubs:
- ✅ Checks all 126 modes
- ✅ Reports implementation status

**Total: 127 tests**

### Transition Tests (`src/test/transitions.test.ts`)

Tests the transition system between modes:
- ✅ Transition state management
- ✅ Frame capture and texture handling
- ✅ Transition progress and timing
- ✅ Transition rendering (fade, slide, wipe, etc.)
- ✅ Integration with mode switching
- ✅ Edge cases (rapid switches, missing frames)

**Total: 26 tests**

## Test Results

```
Test Files  4 passed (4)
Tests      1179 passed (1179)
```

All tests passing! ✅

**Test Breakdown:**
- Mode Tests: 1,014 tests
- Core API Tests: 12 tests
- Mode Status Tests: 127 tests
- Transition Tests: 26 tests

## What the Tests Verify

1. **No Runtime Errors**: All modes can be instantiated and their methods called without throwing errors
2. **API Compatibility**: Modes correctly implement the `Mode` interface
3. **Parameter Handling**: Modes handle various knob values and trigger states
4. **Animation Loop**: Modes can be called multiple times (simulating frame rendering)

## What the Tests Don't Verify

- Visual correctness (modes may render incorrectly but not crash)
- Performance (modes may be slow but still pass)
- Complete implementation (stub modes with empty `draw()` will pass)

## Adding New Tests

To add tests for a specific mode:

```typescript
describe('My Custom Mode', () => {
  it('should render specific pattern', () => {
    const mode = new MyCustomMode();
    const canvas = createMockCanvasWrapper();
    const eyesy = createMockEYESY();
    
    mode.setup(canvas, eyesy);
    mode.draw(canvas, eyesy);
    
    // Add specific assertions here
  });
});
```

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```bash
npm run test:run
```

This will exit with code 0 if all tests pass, or non-zero if any fail.





