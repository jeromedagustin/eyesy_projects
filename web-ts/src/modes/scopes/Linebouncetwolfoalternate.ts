import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Line Bounce Two - LFO Alternate
 * Ported from Python version
 * 
 * Knob1 - vertical bounce amount
 * Knob2 - line width
 * Knob3 - speed
 * Knob4 - foreground color
 * Knob5 - background color
 */
class LFO {
  public start: number;
  public max: number;
  public step: number;
  public current: number;
  public direction: number;

  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = start; // Initialize to start value
    this.direction = 1;
  }

  update(deltaTime: number): number {
    // Frame-rate independent update
    // Scale step by deltaTime and 60fps baseline to match Python's frame-based behavior
    const frameStep = this.step * this.direction * deltaTime * 60;
    this.current += frameStep;
    // When it gets to the top, flip direction
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max; // in case it steps above max
    }
    // When it gets to the bottom, flip direction
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start; // in case it steps below min
    }
    return this.current;
  }
}

export class Linebouncetwolfoalternate implements Mode {
  private xr = 1280;
  private yr = 720;
  private x100 = 0;
  private b1: LFO;
  private b2: LFO;
  private b3: LFO;
  private drawB1First = true;
  private triggerPulse: number = 0.0;
  private triggerDecay: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x100 = this.xr * 0.078;
    this.b1 = new LFO(0, this.xr, 10);
    this.b2 = new LFO(0, this.xr, 19);
    this.b3 = new LFO(0, this.yr, 2);
    this.drawB1First = true;
    this.triggerPulse = 0.0;
    this.triggerDecay = 0.05;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Handle trigger when mic is disabled
    if (eyesy.trig && !eyesy.mic_enabled) {
      this.triggerPulse = 1.0; // Max pulse
      this.triggerDecay = 0.05; // Decay rate
    }
    if (this.triggerPulse > 0) {
      this.triggerPulse = Math.max(0, this.triggerPulse - this.triggerDecay * eyesy.deltaTime * 1000);
    }
    
    // Get audio values - Python version uses raw audio_in[50] / 150
    // We need to get the raw value, not normalized
    let y1 = 0;
    let y2 = 0;
    
    if (eyesy.mic_enabled && eyesy.audio_in && eyesy.audio_in.length > 50) {
      // Match Python: eyesy.audio_in[50] / 150
      const rawAudio = eyesy.audio_in[50] || 0;
      y1 = rawAudio / 150;
      y2 = rawAudio / 150;
    } else if (!eyesy.mic_enabled) {
      // Use trigger pulse when mic is disabled
      // Scale trigger pulse to match audio range (32768 / 150 ≈ 218)
      y1 = this.triggerPulse * (32768 / 150);
      y2 = this.triggerPulse * (32768 / 150);
    }
    
    // Ensure minimum line height so something is always visible
    // This ensures the LFO animation is visible even without audio
    // The LFOs animate the horizontal position, but we need visible line height
    const minHeight = 10; // Minimum 10 pixels for visibility
    if (Math.abs(y1) < minHeight) {
      y1 = y1 >= 0 ? minHeight : -minHeight;
    }
    if (Math.abs(y2) < minHeight) {
      y2 = y2 >= 0 ? minHeight : -minHeight;
    }
    
    const color = eyesy.color_picker(eyesy.knob4);
    const color2 = eyesy.color_picker((eyesy.knob4 + 0.50) % 1.00);
    const width = Math.floor(eyesy.knob2 * this.x100) + 1;
    
    // Update step values (these control speed)
    this.b1.step = (eyesy.knob3 * (this.x100 / 3)) + 1;
    this.b2.step = (eyesy.knob3 * (this.x100 / 2)) + 1;
    this.b3.step = (eyesy.knob1 * (this.x100 / 9)) + 1;
    
    // Update LFOs with deltaTime for frame-rate independence
    const posx1 = this.b1.update(eyesy.deltaTime);
    const posx2 = this.b2.update(eyesy.deltaTime);
    const rise = this.b3.update(eyesy.deltaTime) + 1;
    
    // Check if b1 LFO reaches the start or max point
    if (posx1 === this.b1.start || posx1 === this.b1.max) {
      // 50% chance to set drawB1First to True or False
      this.drawB1First = Math.random() < 0.5;
    }
    
    // Draw based on the drawB1First boolean
    if (this.drawB1First) {
      canvas.line([posx1, rise - y1], [posx1, rise + y1], color, width);
      canvas.line([posx2, rise - 2 * y2], [posx2, rise + 2 * y2], color2, width * 2);
    } else {
      canvas.line([posx2, rise - 2 * y2], [posx2, rise + 2 * y2], color2, width * 2);
      canvas.line([posx1, rise - y1], [posx1, rise + y1], color, width);
    }
  }
}
