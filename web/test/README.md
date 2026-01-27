# EYESY Web - Test Suite

Comprehensive test suite for the EYESY web application using Pyodide.

## Running Tests

1. **Start a local server:**
   ```bash
   cd web
   python -m http.server 8000
   ```

2. **Open test page:**
   ```
   http://localhost:8000/test/test-runner.html
   ```

3. **Run tests:**
   - Click "Run All Tests" to run all tests
   - Click "Run Unit Tests" to run only unit tests
   - Click "Run Integration Tests" to run only integration tests

## Test Structure

### Test Framework (`test-framework.js`)
- Simple test framework for browser-based testing
- Provides test registration, assertion helpers, and result reporting
- No external dependencies

### Test Categories

1. **Pyodide Tests** (`tests/pyodide-tests.js`)
   - Pyodide loader initialization
   - Python code execution
   - Object access between JavaScript and Python
   - Error handling

2. **pygame Bridge Tests** (`tests/pygame-bridge-tests.js`)
   - Bridge initialization
   - Canvas drawing functions (circle, line, rect)
   - Surface management
   - Python pygame module creation
   - Drawing via Python calls

3. **EYESY API Tests** (`tests/eyesy-api-tests.js`)
   - API initialization
   - Knob value management
   - Color picker functions
   - Audio generation
   - Trigger handling
   - MIDI support

4. **Mode Runner Tests** (`tests/mode-runner-tests.js`)
   - Mode loading from code
   - Mode execution
   - Start/stop functionality
   - FPS control
   - Error handling
   - Auto-clear behavior

5. **Integration Tests** (`tests/integration-tests.js`)
   - Full system integration
   - Mode load and execute
   - Audio-reactive drawing
   - Trigger-based behavior
   - Color picker integration
   - Multiple frame rendering
   - Mode switching

## Writing Tests

### Basic Test

```javascript
testCategory('category', 'Test name', async () => {
    // Setup
    const value = 42;
    
    // Assert
    assertEquals(value, 42, 'Value should be 42');
});
```

### Assertion Helpers

- `assert(condition, message)` - Basic assertion
- `assertEquals(actual, expected, message)` - Equality check
- `assertApprox(actual, expected, tolerance, message)` - Floating point comparison
- `assertArrayEquals(actual, expected, message)` - Array comparison

### Async Tests

Tests can be async:

```javascript
testCategory('category', 'Async test', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    assert(loader.isLoaded(), 'Should be loaded');
});
```

## Test Results

The test runner displays:
- **Total Tests**: Number of tests run
- **Passed**: Number of passing tests
- **Failed**: Number of failing tests
- **Running**: Number of tests currently running

Each test shows:
- Test name
- Status (PASS/FAIL/RUNNING)
- Error message (if failed)

## Visual Tests

Some tests draw to a canvas for visual verification:
- pygame bridge tests draw shapes to verify drawing functions
- Integration tests render full modes

## Continuous Integration

To integrate with CI/CD:

1. Use headless browser (Puppeteer, Playwright)
2. Load `test-runner.html`
3. Click "Run All Tests"
4. Parse results from DOM
5. Exit with error code if tests fail

Example with Puppeteer:

```javascript
const puppeteer = require('puppeteer');

async function runTests() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000/test/test-runner.html');
    
    // Wait for tests to complete
    await page.waitForSelector('.test-item');
    
    // Get results
    const failed = await page.evaluate(() => {
        return document.getElementById('failed-tests').textContent;
    });
    
    await browser.close();
    return parseInt(failed) === 0;
}
```

## Coverage

Current test coverage:
- ✅ Pyodide loader: 7 tests
- ✅ pygame bridge: 10 tests
- ✅ EYESY API: 15 tests
- ✅ Mode runner: 6 tests
- ✅ Integration: 6 tests

**Total: 44 tests**

## Adding New Tests

1. Create test file in `tests/` directory
2. Use `testCategory()` to register tests
3. Include test file in `test-runner.html`
4. Run tests to verify

Example:

```javascript
// tests/my-new-tests.js
testCategory('mycategory', 'My new test', async () => {
    // Test code here
    assert(true, 'This should pass');
});
```

Then add to `test-runner.html`:

```html
<script src="tests/my-new-tests.js"></script>
```

## Known Issues

- Some tests may be flaky due to timing (especially animation tests)
- Canvas-based tests may need visual inspection
- Pyodide loading takes time - tests wait for it to load

## Future Improvements

- [ ] Add performance benchmarks
- [ ] Add visual regression tests
- [ ] Add test coverage reporting
- [ ] Add automated CI/CD integration
- [ ] Add stress tests (many modes, long running)

