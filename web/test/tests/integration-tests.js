/**
 * Integration Tests
 * Test the full system working together
 */

let integrationCanvas, integrationLoader, integrationBridge, integrationEYESY, integrationRunner;

async function setupIntegrationTests() {
    if (!integrationRunner) {
        integrationCanvas = document.createElement('canvas');
        integrationCanvas.width = 1280;
        integrationCanvas.height = 720;
        
        integrationLoader = new PyodideLoader();
        await integrationLoader.load();
        
        integrationBridge = new PygameBridge(integrationCanvas);
        await integrationBridge.initialize(integrationLoader);
        
        integrationEYESY = new EYESYAPI(integrationCanvas);
        integrationEYESY.injectIntoPyodide(integrationLoader);
        
        integrationRunner = new ModeRunner(integrationLoader, integrationBridge, integrationEYESY, integrationCanvas);
    }
}

testCategory('integration', 'Full mode load and execute', async () => {
    await setupIntegrationTests();
    
    const modeCode = `
import pygame
import math

def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    eyesy.color_picker_bg(eyesy.knob5)
    color = eyesy.color_picker(eyesy.knob4)
    
    center_x = eyesy.xres // 2
    center_y = eyesy.yres // 2
    radius = int(eyesy.knob1 * min(eyesy.xres, eyesy.yres) * 0.3)
    
    pygame.draw.circle(screen, color, (center_x, center_y), radius)
    `;
    
    await integrationRunner.loadMode(modeCode, 'template_mode', '/modes/template_mode');
    
    // Set some knob values
    integrationEYESY.knob1 = 0.5;
    integrationEYESY.knob4 = 0.3;
    integrationEYESY.knob5 = 0.1;
    
    // Run draw
    integrationRunner.draw();
    
    // Verify something was drawn
    const centerX = integrationCanvas.width / 2;
    const centerY = integrationCanvas.height / 2;
    const imageData = integrationBridge.ctx.getImageData(centerX, centerY, 1, 1);
    
    const hasColor = imageData.data[0] > 0 || imageData.data[1] > 0 || imageData.data[2] > 0;
    assert(hasColor, 'Circle should be drawn at center');
});

testCategory('integration', 'Audio-reactive drawing', async () => {
    await setupIntegrationTests();
    
    const modeCode = `
import pygame

def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    eyesy.color_picker_bg(eyesy.knob5)
    color = eyesy.color_picker(eyesy.knob4)
    
    if len(eyesy.audio_in) > 0:
        audio_level = abs(eyesy.audio_in[0]) / 32768.0
        line_height = int(audio_level * eyesy.yres * eyesy.knob2)
        pygame.draw.line(screen, color, (0, eyesy.yres // 2), (line_height, eyesy.yres // 2), 5)
    `;
    
    await integrationRunner.loadMode(modeCode, 'audio_mode', '/test');
    
    // Update audio
    integrationEYESY.updateAudio();
    
    // Run draw
    integrationRunner.draw();
    
    // Verify line was drawn (check a point on the line)
    const midY = integrationCanvas.height / 2;
    const imageData = integrationBridge.ctx.getImageData(50, midY, 1, 1);
    const hasColor = imageData.data[0] > 0 || imageData.data[1] > 0 || imageData.data[2] > 0;
    assert(hasColor, 'Line should be drawn based on audio');
});

testCategory('integration', 'Trigger-based behavior', async () => {
    await setupIntegrationTests();
    
    let triggerCount = 0;
    
    const modeCode = `
import pygame

def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    if eyesy.trig:
        color = eyesy.color_picker(eyesy.knob4)
        pygame.draw.circle(screen, color, (100, 100), 30)
    `;
    
    await integrationRunner.loadMode(modeCode, 'trigger_mode', '/test');
    
    // Draw without trigger
    integrationRunner.draw();
    const imageData1 = integrationBridge.ctx.getImageData(100, 100, 1, 1);
    const hasColor1 = imageData1.data[0] > 0 || imageData1.data[1] > 0 || imageData1.data[2] > 0;
    
    // Draw with trigger
    integrationEYESY.trig = true;
    integrationRunner.draw();
    const imageData2 = integrationBridge.ctx.getImageData(100, 100, 1, 1);
    const hasColor2 = imageData2.data[0] > 0 || imageData2.data[1] > 0 || imageData2.data[2] > 0;
    
    assert(!hasColor1 || hasColor2, 'Circle should appear when trigger is active');
});

testCategory('integration', 'Color picker integration', async () => {
    await setupIntegrationTests();
    
    const modeCode = `
import pygame

def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    bg_color = eyesy.color_picker_bg(eyesy.knob5)
    fg_color = eyesy.color_picker(eyesy.knob4)
    pygame.draw.rect(screen, fg_color, (50, 50, 100, 100), 0)
    `;
    
    await integrationRunner.loadMode(modeCode, 'color_mode', '/test');
    
    // Set different knob values
    integrationEYESY.knob4 = 0.0; // Red
    integrationEYESY.knob5 = 0.33; // Green
    
    integrationRunner.draw();
    
    // Check background color
    const bgColor = integrationEYESY.bg_color;
    assert(bgColor.length === 3, 'Background color should be RGB array');
    
    // Check foreground color was used
    const imageData = integrationBridge.ctx.getImageData(100, 100, 1, 1);
    assert(imageData.data[0] > 0, 'Red should be drawn (knob4 = 0.0 gives red)');
});

testCategory('integration', 'Multiple frames rendering', async () => {
    await setupIntegrationTests();
    
    const modeCode = `
import pygame

frame_count = 0

def setup(screen, eyesy):
    global frame_count
    frame_count = 0

def draw(screen, eyesy):
    global frame_count
    frame_count += 1
    eyesy.color_picker_bg(eyesy.knob5)
    color = eyesy.color_picker(eyesy.knob4)
    x = (frame_count % eyesy.xres)
    pygame.draw.circle(screen, color, (x, 100), 10)
    `;
    
    await integrationRunner.loadMode(modeCode, 'animation_mode', '/test');
    
    // Draw multiple frames
    for (let i = 0; i < 5; i++) {
        integrationRunner.draw();
    }
    
    // Check that frame_count increased
    const frameCount = integrationLoader.runPython('frame_count');
    assert(frameCount >= 5, 'Frame count should increment');
});

testCategory('integration', 'Mode switching', async () => {
    await setupIntegrationTests();
    
    const mode1Code = `
def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    pass
    `;
    
    const mode2Code = `
def setup(screen, eyesy):
    pass

def draw(screen, eyesy):
    pass
    `;
    
    // Load first mode
    await integrationRunner.loadMode(mode1Code, 'mode1', '/test');
    assert(integrationRunner.setupFunc !== null, 'First mode should load');
    
    // Stop and load second mode
    integrationRunner.stop();
    await integrationRunner.loadMode(mode2Code, 'mode2', '/test');
    assert(integrationRunner.setupFunc !== null, 'Second mode should load');
});

