/**
 * Pyodide Loader Tests
 */

testCategory('pyodide', 'Pyodide loader initialization', async () => {
    const loader = new PyodideLoader();
    assert(!loader.isLoaded(), 'Loader should not be loaded initially');
    
    await loader.load();
    assert(loader.isLoaded(), 'Loader should be loaded after load()');
    
    const pyodide = loader.getPyodide();
    assert(pyodide !== null, 'Pyodide instance should not be null');
});

testCategory('pyodide', 'Python code execution', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    
    const result = loader.runPython('2 + 2');
    assertEquals(result, 4, 'Python code should execute correctly');
});

testCategory('pyodide', 'Python object access', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    
    loader.runPython('x = 42');
    const x = loader.getPythonObject('x');
    assertEquals(x, 42, 'Should be able to get Python objects');
});

testCategory('pyodide', 'JavaScript to Python object injection', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    
    loader.setPythonObject('test_var', 123);
    const result = loader.runPython('test_var');
    assertEquals(result, 123, 'Should be able to inject JavaScript objects into Python');
});

testCategory('pyodide', 'Python to JavaScript object access', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    
    loader.runPython('test_list = [1, 2, 3]');
    const testList = loader.getPythonObject('test_list');
    assert(testList !== null, 'Should be able to get Python list');
    assertEquals(testList.length, 3, 'Python list should have correct length');
});

testCategory('pyodide', 'Math module availability', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    
    loader.runPython('import math');
    const pi = loader.runPython('math.pi');
    assertApprox(pi, Math.PI, 0.0001, 'Math module should be available');
});

testCategory('pyodide', 'Error handling', async () => {
    const loader = new PyodideLoader();
    await loader.load();
    
    let errorCaught = false;
    try {
        loader.runPython('undefined_variable');
    } catch (error) {
        errorCaught = true;
    }
    assert(errorCaught, 'Should catch Python errors');
});

