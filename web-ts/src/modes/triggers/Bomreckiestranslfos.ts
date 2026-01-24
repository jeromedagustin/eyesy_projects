import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - BoM Reckies Trans LFOs
 * Ported from Python version
 * 
 * Knob1 - rect size change rate
 * Knob2 - trails screen scale rate
 * Knob3 - transparency
 * Knob4 - line color selector (grayscale for first half, random colors for second half)
 * Knob5 - background color
 */
class LFOhalf {
  public start: number;
  public min: number;
  public step: number;
  private current: number;
  private direction: number;

  constructor(start: number, min: number, step: number) {
    this.start = start;
    this.min = min;
    this.step = step;
    this.current = start; // Initialize to start value, not 0
    this.direction = -1;
  }

  update(deltaTime: number): number {
    // when it gets to the bottom, start back at start
    if (this.current <= this.min) {
      this.current = this.start; // in case it steps below min
    }
    this.current += this.step * this.direction * deltaTime;
    return this.current;
  }
}

class LFO {
  public start: number;
  public max: number;
  public step: number;
  private current: number;
  private direction: number;

  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = start; // Initialize to start value, not 0
    this.direction = 1;
  }

  update(deltaTime: number): number {
    // Check bounds first, then update (matching Python behavior)
    // when it gets to the top, flip direction
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max; // in case it steps above max
    }
    // when it gets to the bottom, flip direction
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start; // in case it steps below min
    }
    // Update with deltaTime for frame-rate independence
    this.current += this.step * this.direction * deltaTime;
    return this.current;
  }
}

export class Bomreckiestranslfos implements Mode {
  private xr = 1280;
  private yr = 720;
  private lineLFO: LFO;
  private scalar: LFOhalf;
  private trig = 0;
  private r = 0;
  private g = 0;
  private b = 0;
  private x = 0;
  private y = 0;
  private x2 = 0;
  private y2 = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lineLFO = new LFO(4, 200, 10);
    this.scalar = new LFOhalf(1.0, 0.07, 0.01);
    this.trig = 0;
    // Initialize with default values so something is visible on first load
    this.r = 128;
    this.g = 128;
    this.b = 128;
    this.x = Math.floor(this.xr / 2);
    this.y = Math.floor(this.yr / 2);
    this.x2 = 100; // Initial width
    this.y2 = 100; // Initial height
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set background color (but don't clear - this mode uses feedback/trails)
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Update LFOs (matching Python order: update first, then set step)
    const scalar2 = this.scalar.update(eyesy.deltaTime);
    this.scalar.step = eyesy.knob2 / 2; // trails screen scale rate
    const placex = Math.floor(this.xr * scalar2);
    const placey = Math.floor(this.yr * scalar2);
    
    const line = Math.floor(this.lineLFO.update(eyesy.deltaTime));
    this.lineLFO.step = eyesy.knob1 * 50; // rect size change rate
    
    // Use trig or midi_note_new if available (matching Python logic)
    const audioTrigger = eyesy.audio_trig || eyesy.trig || eyesy.midi_note_new;
    if (audioTrigger) {
      this.trig = 1;
    }
    
    if (this.trig === 1) {
      if (eyesy.knob4 < 0.5) {
        // Grayscale line color selector for 1st half of knob4
        this.r = this.g = this.b = Math.floor(eyesy.knob4 * 509 + 1);
      } else {
        // Random line color selector for 2nd half of knob4
        this.r = Math.floor(Math.random() * (244 * eyesy.knob4 + 11 - 10) + 10);
        this.g = Math.floor(Math.random() * (244 * eyesy.knob4 + 11 - 10) + 10);
        this.b = Math.floor(Math.random() * (244 * eyesy.knob4 + 11 - 10) + 10);
      }
      this.x = Math.floor(Math.random() * 1300) - 10;
      this.y = Math.floor(Math.random() * 740) - 10;
      // Ensure minimum size so rectangle is visible
      this.x2 = Math.max(10, Math.floor(Math.random() * 255));
      this.y2 = Math.max(10, Math.floor(Math.random() * 255));
      this.trig = 0;
    }
    
    // Draw rectangle (on top of previous frames - no clearing for feedback effect)
    // Only draw if rectangle has valid dimensions
    if (this.x2 > 0 && this.y2 > 0) {
      const color: [number, number, number] = [this.r, this.g, this.b];
      canvas.rect(this.x, this.y, this.x2, this.y2, color, line);
    }
    
    // Flush to ensure rectangle is rendered before capturing
    canvas.flush();
    
    // Capture current frame (after drawing rectangle, before blitting feedback)
    canvas.captureFrame();
    
    // Blit the previous frame (scaled, semi-transparent, centered, flipped)
    // Matching Python: bottom_screen (flipped) and thing (scaled)
    const alpha = Math.floor(eyesy.knob3 * 200) / 255;
    
    // First blit: flipped version (bottom_screen) - full screen, flipped
    // Python flips both X and Y, but blitLastFrame only supports horizontal flip
    canvas.blitLastFrame(0, 0, this.xr, this.yr, alpha, true);
    
    // Second blit: scaled version (thing) - centered, scaled
    canvas.blitLastFrame(
      Math.floor((this.xr - placex) / 2),
      Math.floor((this.yr - placey) / 2),
      Math.abs(placex),
      Math.abs(placey),
      alpha,
      false
    );
  }
}
