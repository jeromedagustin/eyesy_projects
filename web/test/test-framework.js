/**
 * Simple Test Framework
 * Provides test running and reporting functionality
 */

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Register a test
     */
    test(name, fn) {
        this.tests.push({ name, fn, category: 'general' });
    }

    /**
     * Register a test with category
     */
    testCategory(category, name, fn) {
        this.tests.push({ name, fn, category });
    }

    /**
     * Assert helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Assert equals
     */
    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    /**
     * Assert approximately equals (for floating point)
     */
    assertApprox(actual, expected, tolerance = 0.001, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(message || `Expected approximately ${expected}, got ${actual}`);
        }
    }

    /**
     * Assert array equals
     */
    assertArrayEquals(actual, expected, message) {
        if (actual.length !== expected.length) {
            throw new Error(message || `Array length mismatch: expected ${expected.length}, got ${actual.length}`);
        }
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(message || `Array mismatch at index ${i}: expected ${expected[i]}, got ${actual[i]}`);
            }
        }
    }

    /**
     * Run a single test
     */
    async runTest(test) {
        const result = {
            name: test.name,
            category: test.category,
            status: 'running',
            error: null,
            duration: 0
        };

        const startTime = performance.now();

        try {
            await test.fn();
            result.status = 'pass';
        } catch (error) {
            result.status = 'fail';
            result.error = error.message || error.toString();
        }

        result.duration = performance.now() - startTime;
        return result;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        this.results = [];
        for (const test of this.tests) {
            const result = await this.runTest(test);
            this.results.push(result);
            this.updateUI(result);
        }
        this.updateSummary();
    }

    /**
     * Run tests by category
     */
    async runTestsByCategory(category) {
        this.results = [];
        const categoryTests = this.tests.filter(t => t.category === category);
        for (const test of categoryTests) {
            const result = await this.runTest(test);
            this.results.push(result);
            this.updateUI(result);
        }
        this.updateSummary();
    }

    /**
     * Update UI for a test result
     */
    updateUI(result) {
        const containerId = `${result.category}-test-results`;
        const container = document.getElementById(containerId);
        if (!container) return;

        const testItem = document.createElement('div');
        testItem.className = `test-item ${result.status}`;
        testItem.innerHTML = `
            <div class="test-name">${result.name}</div>
            <div class="test-status ${result.status}">${result.status.toUpperCase()}</div>
        `;

        if (result.error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'test-error';
            errorDiv.textContent = result.error;
            testItem.appendChild(errorDiv);
        }

        container.appendChild(testItem);
    }

    /**
     * Update summary statistics
     */
    updateSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const running = this.results.filter(r => r.status === 'running').length;

        document.getElementById('total-tests').textContent = total;
        document.getElementById('passed-tests').textContent = passed;
        document.getElementById('failed-tests').textContent = failed;
        document.getElementById('running-tests').textContent = running;
    }

    /**
     * Clear all test results
     */
    clearResults() {
        this.results = [];
        const containers = document.querySelectorAll('[id$="-test-results"]');
        containers.forEach(container => {
            container.innerHTML = '';
        });
        this.updateSummary();
    }
}

// Global test framework instance
const testFramework = new TestFramework();

// Helper functions
function test(name, fn) {
    testFramework.test(name, fn);
}

function testCategory(category, name, fn) {
    testFramework.testCategory(category, name, fn);
}

function assert(condition, message) {
    testFramework.assert(condition, message);
}

function assertEquals(actual, expected, message) {
    testFramework.assertEquals(actual, expected, message);
}

function assertApprox(actual, expected, tolerance, message) {
    testFramework.assertApprox(actual, expected, tolerance, message);
}

function assertArrayEquals(actual, expected, message) {
    testFramework.assertArrayEquals(actual, expected, message);
}

// Global functions for buttons
function runAllTests() {
    testFramework.clearResults();
    testFramework.runAllTests();
}

function runUnitTests() {
    testFramework.clearResults();
    Promise.all([
        testFramework.runTestsByCategory('pyodide'),
        testFramework.runTestsByCategory('pygame'),
        testFramework.runTestsByCategory('eyesy'),
        testFramework.runTestsByCategory('runner')
    ]);
}

function runIntegrationTests() {
    testFramework.clearResults();
    testFramework.runTestsByCategory('integration');
}

