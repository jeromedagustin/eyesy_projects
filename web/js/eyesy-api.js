/**
 * EYESY API Implementation
 * Provides EYESY hardware API for Python modes running in Pyodide
 */

class EYESYAPI {
    constructor(canvas) {
        this.canvas = canvas;
        this.xres = canvas.width;
        this.yres = canvas.height;

        // Knob values (0.0 to 1.0)
        this.knob1 = 0.5;
        this.knob2 = 0.5;
        this.knob3 = 0.5;
        this.knob4 = 0.5; // Foreground color
        this.knob5 = 0.5; // Background color

        // Button states
        this.button1 = false;
        this.button2 = false;
        this.button3 = false;
        this.button4 = false;

        // Shift button state
        this.shift = false;

        // Audio input gain
        this.audio_gain = 1.0;

        // Trigger state
        this.trig = false;

        // Audio input (simulated)
        this.audio_in = [];
        this.audio_in_r = []; // Right audio channel

        // Audio generation state
        this._audio_time = 0.0;
        this._beat_time = 0.0;
        this._pattern_time = 0.0;

        // Settings
        this.auto_clear = true; // True = persist mode, False = clear each frame

        // Mode root (path to mode folder)
        this.mode_root = "";
        this.mode = ""; // Current mode name

        // Color picker state
        this._color_lfo_time = 0.0;

        // Background color
        const default_bg = this.colorPicker(this.knob5);
        this.bg_color = [default_bg[0], default_bg[1], default_bg[2]];

        // MIDI support
        this.midi_notes = new Array(128).fill(false);
        this.midi_note_new = false;

        // Audio trigger
        this._audio_trig = false;
        this.audio_trig = false;

        // Initialize audio
        this.updateAudio();
    }

    /**
     * Set mode root path
     */
    setModeRoot(path) {
        this.mode_root = path;
    }

    /**
     * Generate simulated audio samples
     */
    generateAudioSamples(numSamples = 200) {
        const samples = [];
        this._beat_time += 0.016;
        this._pattern_time += 0.016;

        const beatPhase = (this._beat_time % 0.5) / 0.5;
        let beatEnvelope = 1.0;
        if (beatPhase < 0.1) {
            beatEnvelope = 1.0 - (beatPhase / 0.1);
        } else {
            beatEnvelope = Math.max(0.1, 1.0 - (beatPhase - 0.1) * 2.0);
        }

        const patternPhase = (this._pattern_time % 2.0) / 2.0;

        for (let i = 0; i < numSamples; i++) {
            const t = this._audio_time + (i / numSamples) * 0.01;
            const baseFreq = 220 + Math.sin(this._pattern_time * 0.5) * 100;

            let sample = (
                Math.sin(t * baseFreq) * 0.4 * beatEnvelope +
                Math.sin(t * baseFreq * 2) * 0.25 * beatEnvelope +
                Math.sin(t * baseFreq * 3) * 0.15 * beatEnvelope +
                Math.sin(t * baseFreq * 0.5) * 0.2 * beatEnvelope
            );
            sample += Math.sin(t * baseFreq * 4) * 0.1 * beatEnvelope * 0.5;
            sample += Math.sin(t * baseFreq * 5) * 0.05 * beatEnvelope * 0.5;
            sample += (Math.random() - 0.5) * 0.15 * beatEnvelope;

            if (patternPhase > 0.3 && patternPhase < 0.35) {
                sample += Math.sin(t * baseFreq * 8) * 0.3 * beatEnvelope;
            }

            const amplitudeMod = 0.7 + 0.3 * Math.sin(this._pattern_time * 0.3);
            sample *= amplitudeMod;
            samples.push(Math.round(sample * 32768));
        }

        this._audio_time += 0.01;
        return samples;
    }

    /**
     * Update audio input array
     */
    updateAudio() {
        this._audio_trig = false;

        // Use simulated audio
        this.audio_in = this.generateAudioSamples();
        this.audio_in_r = [...this.audio_in];

        // Check if audio exceeds threshold for audio_trig
        if (this.audio_in.length > 0) {
            const audioPeak = Math.max(...this.audio_in.map(s => Math.abs(s)));
            if (audioPeak > 26214) {
                this._audio_trig = true;
            }
        }

        this.audio_trig = this._audio_trig;
    }

    /**
     * Color picker - convert knob value (0-1) to RGB color
     */
    colorPicker(knob) {
        const hue = knob * 360.0;
        const h = hue / 60.0;
        const i = Math.floor(h);
        const f = h - i;
        const p = 0;
        const q = 1 - f;
        const t = f;

        let r, g, b;
        if (i === 0) {
            r = 1; g = t; b = p;
        } else if (i === 1) {
            r = q; g = 1; b = p;
        } else if (i === 2) {
            r = p; g = 1; b = t;
        } else if (i === 3) {
            r = p; g = q; b = 1;
        } else if (i === 4) {
            r = t; g = p; b = 1;
        } else {
            r = 1; g = p; b = q;
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    /**
     * Color picker with LFO animation
     */
    colorPickerLFO(knob, maxRate = 0.1) {
        let baseHue, hue;
        if (knob < 0.5) {
            baseHue = knob * 2.0 * 360.0;
            hue = baseHue;
        } else {
            baseHue = 360.0;
            const lfoRate = (knob - 0.5) * 2.0 * maxRate;
            hue = (baseHue + Math.sin(this._color_lfo_time * lfoRate * 10) * 30) % 360;
        }

        const h = hue / 60.0;
        const i = Math.floor(h);
        const f = h - i;
        const p = 0;
        const q = 1 - f;
        const t = f;

        let r, g, b;
        if (i === 0) {
            r = 1; g = t; b = p;
        } else if (i === 1) {
            r = q; g = 1; b = p;
        } else if (i === 2) {
            r = p; g = 1; b = t;
        } else if (i === 3) {
            r = p; g = q; b = 1;
        } else if (i === 4) {
            r = t; g = p; b = 1;
        } else {
            r = 1; g = p; b = q;
        }

        this._color_lfo_time += 0.016;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    /**
     * Set background color based on knob value
     */
    colorPickerBG(knob) {
        const color = this.colorPicker(knob);
        this.bg_color = [color[0], color[1], color[2]];
        return color;
    }

    /**
     * Convert JavaScript value to Python-compatible string
     */
    toPythonValue(value) {
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        } else if (typeof value === 'string') {
            return `"${value.replace(/"/g, '\\"')}"`;
        } else if (typeof value === 'number') {
            return value.toString();
        } else if (value === null || value === undefined) {
            return 'None';
        }
        return String(value);
    }

    /**
     * Inject EYESY API into Pyodide Python namespace
     */
    injectIntoPyodide(loader) {
        const eyesy = this;

        // Create Python EYESY object
        const eyesyCode = `
class EYESY:
    def __init__(self):
        self.xres = ${this.xres}
        self.yres = ${this.yres}
        self.knob1 = ${this.knob1}
        self.knob2 = ${this.knob2}
        self.knob3 = ${this.knob3}
        self.knob4 = ${this.knob4}
        self.knob5 = ${this.knob5}
        self.button1 = ${this.toPythonValue(this.button1)}
        self.button2 = ${this.toPythonValue(this.button2)}
        self.button3 = ${this.toPythonValue(this.button3)}
        self.button4 = ${this.toPythonValue(this.button4)}
        self.shift = ${this.toPythonValue(this.shift)}
        self.audio_gain = ${this.audio_gain}
        self.trig = ${this.toPythonValue(this.trig)}
        self.audio_in = []
        self.audio_in_r = []
        self.auto_clear = ${this.toPythonValue(this.auto_clear)}
        self.mode_root = "${this.mode_root}"
        self.mode = "${this.mode}"
        self.bg_color = [${this.bg_color.join(',')}]
        self.midi_notes = [False] * 128
        self.midi_note_new = False
        self.audio_trig = False
    
    def color_picker(self, knob):
        return js.eyesy.colorPicker(knob).toJs()
    
    def color_picker_lfo(self, knob, max_rate=0.1):
        return js.eyesy.colorPickerLFO(knob, max_rate).toJs()
    
    def color_picker_bg(self, knob):
        return js.eyesy.colorPickerBG(knob).toJs()
    
    def set_mode_root(self, path):
        js.eyesy.setModeRoot(path)
        self.mode_root = path

eyesy = EYESY()
        `;

        // Set up eyesy so Python can access it via js.eyesy
        // In Pyodide, js is a built-in module for accessing JavaScript
        // We'll set it as a Python object and make it accessible via js module
        const eyesyJsProxy = loader.pyodide.toPy(this);
        loader.setPythonObject('__eyesy_js__', eyesyJsProxy);
        
        // Set up js.eyesy using setattr which works for both dicts and objects
        loader.runPython(`
import js
# Use setattr to set eyesy, which works even if js is dict-like
setattr(js, 'eyesy', __eyesy_js__)
        `);

        // Run Python code to create EYESY object
        loader.runPython(eyesyCode);

        // Set up property accessors so Python can read/write JavaScript properties
        // This allows Python code to access eyesy.knob1, etc.
        this.setupPropertyAccessors(loader);
    }

    /**
     * Set up property accessors so Python can read/write EYESY properties
     */
    setupPropertyAccessors(loader) {
        const eyesy = this;
        const props = ['knob1', 'knob2', 'knob3', 'knob4', 'knob5', 'trig', 'audio_in', 'audio_in_r', 'auto_clear'];

        props.forEach(prop => {
            loader.runPython(`
def get_${prop}(self):
    val = js.eyesy.${prop}
    if hasattr(val, 'toJs'):
        return val.toJs()
    else:
        return val

def set_${prop}(self, value):
    setattr(js.eyesy, '${prop}', value)

eyesy.${prop} = property(get_${prop}, set_${prop})
            `);
        });

        // For audio_in, we need special handling
        loader.runPython(`
def update_eyesy_properties():
    # Helper function to safely convert JS values to Python
    def to_py(value):
        if hasattr(value, 'toJs'):
            return value.toJs()
        else:
            return value
    
    eyesy.knob1 = to_py(js.eyesy.knob1)
    eyesy.knob2 = to_py(js.eyesy.knob2)
    eyesy.knob3 = to_py(js.eyesy.knob3)
    eyesy.knob4 = to_py(js.eyesy.knob4)
    eyesy.knob5 = to_py(js.eyesy.knob5)
    eyesy.trig = to_py(js.eyesy.trig)
    eyesy.audio_in = to_py(js.eyesy.audio_in)
    eyesy.audio_in_r = to_py(js.eyesy.audio_in_r)
    eyesy.auto_clear = to_py(js.eyesy.auto_clear)
        `);
    }

    /**
     * Update properties from JavaScript to Python (called each frame)
     */
    updateProperties(loader) {
        // Update audio first
        this.updateAudio();

        // Update Python EYESY object properties
        loader.runPython(`
update_eyesy_properties()
        `);
    }
}

