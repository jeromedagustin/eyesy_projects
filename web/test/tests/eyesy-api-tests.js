/**
 * EYESY API Tests
 */

let testCanvas, testEYESY;

function setupEYESYTests() {
    if (!testCanvas) {
        testCanvas = document.createElement('canvas');
        testCanvas.width = 1280;
        testCanvas.height = 720;
        testEYESY = new EYESYAPI(testCanvas);
    }
}

testCategory('eyesy', 'EYESY API initialization', () => {
    setupEYESYTests();
    assert(testEYESY !== null, 'EYESY API should be initialized');
    assertEquals(testEYESY.xres, 1280, 'Should have correct xres');
    assertEquals(testEYESY.yres, 720, 'Should have correct yres');
});

testCategory('eyesy', 'Knob values initialization', () => {
    setupEYESYTests();
    assertEquals(testEYESY.knob1, 0.5, 'Knob1 should initialize to 0.5');
    assertEquals(testEYESY.knob2, 0.5, 'Knob2 should initialize to 0.5');
    assertEquals(testEYESY.knob3, 0.5, 'Knob3 should initialize to 0.5');
    assertEquals(testEYESY.knob4, 0.5, 'Knob4 should initialize to 0.5');
    assertEquals(testEYESY.knob5, 0.5, 'Knob5 should initialize to 0.5');
});

testCategory('eyesy', 'Knob value updates', () => {
    setupEYESYTests();
    testEYESY.knob1 = 0.75;
    assertEquals(testEYESY.knob1, 0.75, 'Knob1 should update correctly');
    
    testEYESY.knob2 = 0.25;
    assertEquals(testEYESY.knob2, 0.25, 'Knob2 should update correctly');
});

testCategory('eyesy', 'Color picker - red', () => {
    setupEYESYTests();
    // Knob value 0.0 should give red (hue 0)
    const color = testEYESY.colorPicker(0.0);
    assertEquals(color[0], 255, 'Red channel should be 255');
    assertEquals(color[1], 0, 'Green channel should be 0');
    assertEquals(color[2], 0, 'Blue channel should be 0');
});

testCategory('eyesy', 'Color picker - green', () => {
    setupEYESYTests();
    // Knob value ~0.33 should give green (hue 120)
    const color = testEYESY.colorPicker(1/3);
    assertApprox(color[1], 255, 10, 'Green channel should be high');
});

testCategory('eyesy', 'Color picker - blue', () => {
    setupEYESYTests();
    // Knob value ~0.67 should give blue (hue 240)
    const color = testEYESY.colorPicker(2/3);
    assertApprox(color[2], 255, 10, 'Blue channel should be high');
});

testCategory('eyesy', 'Color picker BG', () => {
    setupEYESYTests();
    const color = testEYESY.colorPickerBG(0.5);
    assertArrayEquals(testEYESY.bg_color, color, 'Background color should be set');
});

testCategory('eyesy', 'Color picker LFO', () => {
    setupEYESYTests();
    const color1 = testEYESY.colorPickerLFO(0.6);
    // Wait a bit and check again (should change due to LFO)
    testEYESY._color_lfo_time += 0.1;
    const color2 = testEYESY.colorPickerLFO(0.6);
    // Colors should be different due to LFO animation
    assert(color1[0] !== color2[0] || color1[1] !== color2[1] || color1[2] !== color2[2], 
           'LFO should animate colors');
});

testCategory('eyesy', 'Audio generation', () => {
    setupEYESYTests();
    testEYESY.updateAudio();
    assert(testEYESY.audio_in.length > 0, 'Audio should be generated');
    assert(testEYESY.audio_in.length >= 100, 'Audio should have sufficient samples');
    
    // Check audio values are in valid range
    const maxSample = Math.max(...testEYESY.audio_in.map(Math.abs));
    assert(maxSample <= 32768, 'Audio samples should be in valid range');
    assert(maxSample >= -32768, 'Audio samples should be in valid range');
});

testCategory('eyesy', 'Audio trigger detection', () => {
    setupEYESYTests();
    // Generate audio with high amplitude
    testEYESY._audio_time = 0;
    testEYESY._beat_time = 0;
    testEYESY.updateAudio();
    
    // audio_trig might be true or false depending on generated audio
    assert(typeof testEYESY.audio_trig === 'boolean', 'audio_trig should be boolean');
});

testCategory('eyesy', 'Trigger state', () => {
    setupEYESYTests();
    assertEquals(testEYESY.trig, false, 'Trigger should initialize to false');
    
    testEYESY.trig = true;
    assertEquals(testEYESY.trig, true, 'Trigger should update correctly');
});

testCategory('eyesy', 'Mode root setting', () => {
    setupEYESYTests();
    testEYESY.setModeRoot('/path/to/mode');
    assertEquals(testEYESY.mode_root, '/path/to/mode', 'Mode root should be set');
});

testCategory('eyesy', 'Auto clear setting', () => {
    setupEYESYTests();
    assertEquals(testEYESY.auto_clear, true, 'Auto clear should default to true');
    
    testEYESY.auto_clear = false;
    assertEquals(testEYESY.auto_clear, false, 'Auto clear should update');
});

testCategory('eyesy', 'MIDI notes array', () => {
    setupEYESYTests();
    assertEquals(testEYESY.midi_notes.length, 128, 'MIDI notes should have 128 elements');
    assertEquals(testEYESY.midi_notes[0], false, 'MIDI notes should initialize to false');
});

