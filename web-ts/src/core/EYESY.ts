/**
 * EYESY API - Core interface matching Python version
 */
export interface EYESY {
  // Knobs (0.0 to 1.0)
  knob1: number;
  knob2: number;
  knob3: number;
  knob4: number; // Foreground color
  knob5: number; // Background color
  knob6?: number; // Web-only: Rotation (0-360 degrees)
  knob7?: number; // Web-only: Zoom (0.0 = zoom out, 0.5 = default, 1.0 = zoom in)
  knob8?: number; // Web-only: Animation Speed (0.0 = slowest, 0.5 = normal, 1.0 = fastest)
  knob9?: number; // Web-only: X Position offset (-1.0 to 1.0, 0.5 = center/no offset)
  knob10?: number; // Web-only: Y Position offset (-1.0 to 1.0, 0.5 = center/no offset)

  // Display
  xres: number;
  yres: number;

  // Audio input (normalized -1.0 to 1.0)
  audio_in: Float32Array;
  audio_in_r: Float32Array;

  // State
  trig: boolean;
  auto_clear: boolean;
  
  // Audio trigger (derived from audio input, similar to trig but audio-reactive)
  audio_trig: boolean;
  
  // Microphone state (true when microphone is enabled and active)
  mic_enabled: boolean;
  
  // MIDI support (128 MIDI notes, indexed 0-127)
  midi_notes: boolean[];
  midi_note_new: boolean; // True when a new MIDI note is triggered

  // Background color
  bg_color: [number, number, number]; // RGB

  // Time (for animations, updated each frame with speed adjustment)
  time: number;
  
  // Delta time (time since last frame in seconds, with speed adjustment)
  deltaTime: number;

  // Mode root path (for loading images, fonts, etc.)
  mode_root: string;

  // Font settings (for font modes)
  font_family: string; // Font family name
  font_text: string; // Custom text to display (empty = use default)

  // Color picker functions
  color_picker(knob: number): [number, number, number];
  color_picker_lfo(knob: number, maxRate?: number): [number, number, number];
  color_picker_bg(knob: number): [number, number, number];
  
  // Update time-based animations (called each frame with adjusted delta)
  updateTime(deltaSeconds: number): void;
}

export class EYESYImpl implements EYESY {
  knob1 = 0.0;
  knob2 = 0.0;
  knob3 = 0.0;
  knob4 = 0.0;
  knob5 = 0.0;
  knob6 = 0.0; // Web-only: Rotation (0.0 = 0°, 1.0 = 360°)
  knob7 = 0.5; // Web-only: Zoom (0.5 = default/1.0x zoom)
  knob8 = 0.45; // Web-only: Animation Speed (0.45 = ~0.63x default, 0.5 = normal/1.0x speed)
  knob9 = 0.5; // Web-only: X Position (0.5 = center/no offset, 0.0 = left, 1.0 = right)
  knob10 = 0.5; // Web-only: Y Position (0.5 = center/no offset, 0.0 = top, 1.0 = bottom)
  
  // Seizure safety filter (optional, set by App)
  private seizureSafetyFilter: ((color: [number, number, number], previousColor?: [number, number, number]) => [number, number, number]) | null = null;
  private lastColor: [number, number, number] | null = null;

  xres: number;
  yres: number;

  audio_in: Float32Array;
  audio_in_r: Float32Array;

  trig = false;
  auto_clear = true;
  audio_trig = false; // Audio-triggered event (derived from audio input)
  mic_enabled = false; // Microphone enabled state
  
  midi_notes: boolean[] = new Array(128).fill(false);
  midi_note_new = false;

  bg_color: [number, number, number] = [0, 0, 0];

  time = 0.0; // Time in seconds, updated each frame with speed adjustment
  deltaTime = 0.0; // Time since last frame in seconds (with speed adjustment)
  mode_root = ''; // Path to mode folder (set by App when loading mode)
  font_family = 'Arial, sans-serif'; // Font family for font modes
  font_text = ''; // Custom text for font modes (empty = use default unicode characters)
  private _color_lfo_time = 0.0;

  constructor(width: number, height: number) {
    this.xres = width;
    this.yres = height;
    this.audio_in = new Float32Array(200);
    this.audio_in_r = new Float32Array(200);
  }

  /**
   * Color picker - convert knob value (0-1) to RGB color
   * Uses HSV color space (hue based on knob value)
   * Includes grays and black at the end of the range
   */
  color_picker(knob: number): [number, number, number] {
    // Map knob values:
    // 0.0 - 0.85: Full color spectrum (hue-based)
    // 0.85 - 0.95: Grays (light to dark)
    // 0.95 - 1.0: Black
    if (knob >= 0.95) {
      // Black
      return [0, 0, 0];
    } else if (knob >= 0.85) {
      // Grays: 0.85 = light gray, 0.95 = dark gray
      const grayValue = 1.0 - ((knob - 0.85) / 0.1); // 1.0 to 0.0
      const gray = Math.round(grayValue * 255);
      return [gray, gray, gray];
    } else {
      // Full color spectrum: map 0.0-0.85 to 0-360 degrees
      const hue = (knob / 0.85) * 360.0;
      const h = hue / 60.0;
      const i = Math.floor(h);
      const f = h - i;
      const p = 0;
      const q = 1 - f;
      const t = f;

      let r: number, g: number, b: number;
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
  }

  /**
   * Color picker with LFO animation
   */
  color_picker_lfo(knob: number, maxRate = 0.1): [number, number, number] {
    // Map knob values:
    // 0.0 - 0.85: Full color spectrum with LFO animation
    // 0.85 - 0.95: Grays (light to dark)
    // 0.95 - 1.0: Black
    if (knob >= 0.95) {
      // Black
      return [0, 0, 0];
    } else if (knob >= 0.85) {
      // Grays: 0.85 = light gray, 0.95 = dark gray
      const grayValue = 1.0 - ((knob - 0.85) / 0.1); // 1.0 to 0.0
      const gray = Math.round(grayValue * 255);
      return [gray, gray, gray];
    } else {
      // Full color spectrum with LFO: map 0.0-0.85 to color range
      const normalizedKnob = knob / 0.85; // 0.0 to 1.0
      let baseHue: number, hue: number;
      if (normalizedKnob < 0.5) {
        baseHue = normalizedKnob * 2.0 * 360.0;
        hue = baseHue;
      } else {
        baseHue = 360.0;
        const lfoRate = (normalizedKnob - 0.5) * 2.0 * maxRate;
        hue = (baseHue + Math.sin(this._color_lfo_time * lfoRate * 10) * 30) % 360;
      }

      const h = hue / 60.0;
      const i = Math.floor(h);
      const f = h - i;
      const p = 0;
      const q = 1 - f;
      const t = f;

      let r: number, g: number, b: number;
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

      // _color_lfo_time is updated via updateTime() method
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
  }

  /**
   * Update time-based animations (called each frame with speed-adjusted delta)
   * Time can go negative for reverse playback - sin/cos and most math functions handle this fine
   */
  updateTime(deltaSeconds: number): void {
    this.time += deltaSeconds;
    this._color_lfo_time += deltaSeconds;
    // Allow time to go negative for reverse playback
    // Most animations using sin/cos will work fine with negative time
  }

  /**
   * Set background color based on knob value
   */
  color_picker_bg(knob: number): [number, number, number] {
    const color = this.color_picker(knob);
    this.bg_color = [color[0], color[1], color[2]];
    return color;
  }

  /**
   * Update audio input (called each frame)
   * audioData should be normalized floats (-1.0 to 1.0)
   * We convert to integer range (-32768 to 32767) to match Python EYESY format
   * @param audioGain Optional additional gain multiplier (like Python version applies)
   * @param micEnabled If false, zero out the audio arrays instead of updating them
   */
  updateAudio(audioData: Float32Array, audioGain: number = 1.0, micEnabled: boolean = true) {
    if (!micEnabled) {
      // When microphone is disabled, zero out all audio samples
      for (let i = 0; i < this.audio_in.length; i++) {
        this.audio_in[i] = 0;
        this.audio_in_r[i] = 0;
      }
      return;
    }
    
    // Convert normalized float audio (-1.0 to 1.0) to integer range (-32768 to 32767)
    // This matches the Python EYESY format where audio_in is a list of integers
    // Apply gain like Python version: sample * gain, then clamp
    for (let i = 0; i < Math.min(audioData.length, this.audio_in.length); i++) {
      // Convert to integer first, then apply gain (matches Python behavior)
      const normalized = Math.max(-1.0, Math.min(1.0, audioData[i]));
      let intValue = Math.round(normalized * 32767);
      
      // Apply gain multiplier (like Python: sample * gain)
      intValue = Math.round(intValue * audioGain);
      
      // Clamp to valid 16-bit signed integer range
      this.audio_in[i] = Math.max(-32768, Math.min(32767, intValue));
      this.audio_in_r[i] = this.audio_in[i];
    }
  }
}

