/**
 * Mode Runner Tests
 */

let testRunner, testLoader, testBridge, testEYESY, testCanvas;

async function setupRunnerTests() {
    if (!testRunner) {
        testCanvas = document.createElement('canvas');
        testCanvas.width = 1280;
        testCanvas.height = 720;
        
        testLoader = new PyodideLoader();
        await testLoader.load();
        
        testBridge = new PygameBridge(testCanvas);
        await testBridge.initialize(testLoader);
        
        testEYESY = new EYESYAPI(testCanvas);
        testEYESY.injectIntoPyodide(testLoader);
        
        testRunner = new ModeRunner(testLoader, testBridge, testEYESY, testCanvas);
    }
}

testCategory('runner', 'Mode runner initialization', async () => {
    await setupRunnerTests();
    assert(testRunner !== null, 'Mode runner should be initialized');
    assertEquals(testRunner.fps, 60, 'FPS should default to 60');
});

testCategory('runner', 'Load mode from code', async () => {
    await setupRunnerTests();
    
    const modeCode = `
def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    pass
    `;
    
    await testRunner.loadMode(modeCode, 'test_mode', '/test');
    assert(testRunner.setupFunc !== null, 'Setup function should be loaded');
    assert(testRunner.drawFunc !== null, 'Draw function should be loaded');
});

testCategory('runner', 'Load mode with actual drawing', async () => {
    await setupRunnerTests();
    
    const modeCode = `
import pygame

def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    eyesy.color_picker_bg(eyesy.knob5)
    color = eyesy.color_picker(eyesy.knob4)
    pygame.draw.circle(screen, color, (640, 360), 50)
    `;
    
    await testRunner.loadMode(modeCode, 'drawing_mode', '/test');
    
    // Run draw once
    testRunner.draw();
    
    // Check that something was drawn (circle should be at center)
    const imageData = testBridge.ctx.getImageData(640, 360, 1, 1);
    // At least one channel should be non-zero (depending on color)
    const hasColor = imageData.data[0] > 0 || imageData.data[1] > 0 || imageData.data[2] > 0;
    assert(hasColor, 'Circle should be drawn');
});

testCategory('runner', 'Mode runner start/stop', async () => {
    await setupRunnerTests();
    
    const modeCode = `
def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    pass
    `;
    
    await testRunner.loadMode(modeCode, 'test_mode', '/test');
    
    assertEquals(testRunner.running, false, 'Should not be running initially');
    
    testRunner.start();
    assertEquals(testRunner.running, true, 'Should be running after start()');
    
    testRunner.stop();
    assertEquals(testRunner.running, false, 'Should not be running after stop()');
});

testCategory('runner', 'FPS setting', async () => {
    await setupRunnerTests();
    
    testRunner.setFPS(30);
    assertEquals(testRunner.fps, 30, 'FPS should be set correctly');
    assertEquals(testRunner.frameTime, 1000/30, 'Frame time should be calculated correctly');
});

testCategory('runner', 'Error handling in draw', async () => {
    await setupRunnerTests();
    
    const modeCode = `
def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    raise Exception("Test error")
    `;
    
    await testRunner.loadMode(modeCode, 'error_mode', '/test');
    
    // Draw should catch errors and stop running
    testRunner.start();
    testRunner.draw();
    
    // Runner should stop after error
    assertEquals(testRunner.running, false, 'Runner should stop after draw error');
});

testCategory('runner', 'Auto clear behavior', async () => {
    await setupRunnerTests();
    
    const modeCode = `
import pygame

def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    eyesy.color_picker_bg(eyesy.knob5)
    pygame.draw.circle(screen, [255, 0, 0], (100, 100), 10)
    `;
    
    await testRunner.loadMode(modeCode, 'clear_test', '/test');
    
    testEYESY.auto_clear = true;
    testRunner.draw();
    
    // With auto_clear, background should be filled
    const bgColor = testEYESY.bg_color;
    const imageData = testBridge.ctx.getImageData(50, 50, 1, 1);
    // Background should match bg_color
    assertApprox(imageData.data[0], bgColor[0], 5, 'Background should be filled');
});

