/**
 * pygame Bridge Tests
 */

let testCanvas, testBridge, testLoader;

// Setup before tests
async function setupPygameTests() {
    if (!testCanvas) {
        testCanvas = document.getElementById('test-canvas');
        testBridge = new PygameBridge(testCanvas);
        testLoader = new PyodideLoader();
        await testLoader.load();
        await testBridge.initialize(testLoader);
    }
}

testCategory('pygame', 'Pygame bridge initialization', async () => {
    await setupPygameTests();
    assert(testBridge !== null, 'Bridge should be initialized');
    assert(testBridge.canvas !== null, 'Bridge should have canvas');
    assert(testBridge.ctx !== null, 'Bridge should have context');
});

testCategory('pygame', 'Canvas fill', async () => {
    await setupPygameTests();
    
    testBridge.fillCanvas([255, 0, 0]);
    const imageData = testBridge.ctx.getImageData(100, 100, 1, 1);
    assertEquals(imageData.data[0], 255, 'Red channel should be set');
    assertEquals(imageData.data[1], 0, 'Green channel should be 0');
    assertEquals(imageData.data[2], 0, 'Blue channel should be 0');
});

testCategory('pygame', 'Draw circle', async () => {
    await setupPygameTests();
    
    testBridge.clear();
    testBridge.drawCircle('main_screen', [0, 255, 0], 200, 150, 50, 0);
    
    // Check that circle was drawn (check center pixel)
    const imageData = testBridge.ctx.getImageData(200, 150, 1, 1);
    assertEquals(imageData.data[1], 255, 'Circle should be drawn in green');
});

testCategory('pygame', 'Draw line', async () => {
    await setupPygameTests();
    
    testBridge.clear();
    testBridge.drawLine('main_screen', [0, 0, 255], 0, 0, 100, 100, 2);
    
    // Check that line was drawn (check a point on the line)
    const imageData = testBridge.ctx.getImageData(50, 50, 1, 1);
    assertEquals(imageData.data[2], 255, 'Line should be drawn in blue');
});

testCategory('pygame', 'Draw rectangle', async () => {
    await setupPygameTests();
    
    testBridge.clear();
    testBridge.drawRect('main_screen', [255, 255, 0], 50, 50, 100, 100, 0);
    
    // Check that rectangle was drawn
    const imageData = testBridge.ctx.getImageData(100, 100, 1, 1);
    assertEquals(imageData.data[0], 255, 'Rectangle should be drawn');
    assertEquals(imageData.data[1], 255, 'Rectangle should be yellow');
});

testCategory('pygame', 'Surface registration', async () => {
    await setupPygameTests();
    
    testBridge.registerSurface('test_surface', 100, 100);
    assert(testBridge.surfaces.has('test_surface'), 'Surface should be registered');
    
    const surface = testBridge.surfaces.get('test_surface');
    assertEquals(surface.width, 100, 'Surface should have correct width');
    assertEquals(surface.height, 100, 'Surface should have correct height');
});

testCategory('pygame', 'Surface fill', async () => {
    await setupPygameTests();
    
    testBridge.registerSurface('test_surface2', 50, 50);
    testBridge.fillSurface('test_surface2', [128, 128, 128]);
    
    const surface = testBridge.surfaces.get('test_surface2');
    const data = surface.imageData.data;
    assertEquals(data[0], 128, 'Surface should be filled with gray');
    assertEquals(data[1], 128, 'Surface should be filled with gray');
    assertEquals(data[2], 128, 'Surface should be filled with gray');
});

testCategory('pygame', 'Python pygame module creation', async () => {
    await setupPygameTests();
    
    const pygame = testLoader.getPythonObject('pygame');
    assert(pygame !== null, 'pygame module should exist in Python');
    
    const draw = testLoader.runPython('pygame.draw');
    assert(draw !== null, 'pygame.draw should exist');
});

testCategory('pygame', 'Python screen creation', async () => {
    await setupPygameTests();
    
    testLoader.runPython('screen = set_mode((400, 300))');
    const screen = testLoader.getPythonObject('screen');
    assert(screen !== null, 'Screen should be created');
    
    const width = testLoader.runPython('screen.width');
    assertEquals(width, 400, 'Screen should have correct width');
    
    const height = testLoader.runPython('screen.height');
    assertEquals(height, 300, 'Screen should have correct height');
});

testCategory('pygame', 'Python draw.circle call', async () => {
    await setupPygameTests();
    
    testLoader.runPython(`
screen = set_mode((400, 300))
pygame.draw.circle(screen, [255, 0, 0], (200, 150), 50)
    `);
    
    // Check that circle was drawn on canvas
    const imageData = testBridge.ctx.getImageData(200, 150, 1, 1);
    assertEquals(imageData.data[0], 255, 'Circle should be drawn via Python');
});

