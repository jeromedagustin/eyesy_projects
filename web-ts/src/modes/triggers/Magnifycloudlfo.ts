import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { LFO } from '../utils';

/**
 * L - Magnify Cloud
 * LFO-based cloud of animated circles
 * 
 * Knob1 - Cloud Size
 * Knob2 - Cloud Count
 * Knob3 - LFO Step
 * Knob4 - Foreground Color
 * Knob5 - Background Color
 */

export class Magnifycloudlfo implements Mode {
  private xr = 1280;
  private yr = 720;
  private xhalf = 0;
  private yhalf = 0;
  private trigger = false;
  private pos: [number, number][] = [];
  private denser: LFO;
  private lastPositionUpdate: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.xhalf = this.xr / 2;
    this.yhalf = this.yr / 2;
    this.denser = new LFO(1, 360, 10);
    this.denser.max = this.yhalf;
    this.lastPositionUpdate = 0.0;
    this.pos = [];
    // Initialize positions spread across the screen
    for (let i = 0; i < 12; i++) {
      this.pos.push([
        Math.floor(Math.random() * this.xr),
        Math.floor(Math.random() * this.yr)
      ]);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const balls = Math.floor(eyesy.knob2 * 10) + 1;
    // Ensure LFO step is at least 10 for visible animation
    this.denser.step = Math.max(10, Math.floor(eyesy.knob3 * 12));
    // Increase base size multiplier for better visibility
    // Original: x20 = xr * 0.016 (about 20px for 1280px width)
    // New: x20 = xr * 0.05 (about 64px for 1280px width) - much more visible
    const x20 = Math.floor(this.xr * 0.05);
    
    // Update LFO once per frame and store the value
    const lfoValue = this.denser.update(eyesy.deltaTime);
    const xdensity = lfoValue * 2;
    const ydensity = lfoValue;
    // Calculate base size with better scaling
    // Ensure minimum size is visible even when knob1 is 0
    const baseSize = Math.max(20, Math.floor(eyesy.knob1 * x20) || 30);
    // Reduce the division factor from 30 to 10 for larger sizes
    // Also ensure minimum size is reasonable
    const size = Math.max(10, Math.abs(baseSize * lfoValue / 10 + baseSize * 0.3));
    
    // Use trig or midi_note_new if available (optional - mode works without triggers)
    const audioTrigger = eyesy.audio_trig || eyesy.trig || eyesy.midi_note_new;
    if (audioTrigger) {
      this.trigger = true;
    }
    
    // Update positions periodically based on LFO animation, or on trigger
    // Update every ~0.5 seconds or on trigger
    const updateInterval = 0.5;
    const shouldUpdatePositions = this.trigger || (eyesy.time - this.lastPositionUpdate >= updateInterval);
    
    if (shouldUpdatePositions) {
      this.lastPositionUpdate = eyesy.time;
      
      // Calculate valid ranges for random positions based on LFO density
      const xMin = Math.max(0, Math.floor(this.xhalf - xdensity));
      const xMax = Math.min(this.xr, Math.floor((this.xhalf + 2) + xdensity + 10));
      const yMin = Math.max(0, Math.floor(this.yhalf - ydensity));
      const yMax = Math.min(this.yr, Math.floor((this.yhalf + 2) + ydensity + 10));
      
      // Ensure valid ranges
      const finalXMax = xMax <= xMin ? xMin + 1 : xMax;
      const finalYMax = yMax <= yMin ? yMin + 1 : yMax;
      
      // Update positions for all balls
      for (let i = 0; i < 12; i++) {
        this.pos[i] = [
          Math.floor(Math.random() * (finalXMax - xMin) + xMin),
          Math.floor(Math.random() * (finalYMax - yMin) + yMin)
        ];
      }
    }
    
    // Ensure we don't access beyond pos array bounds
    const ballsToDraw = Math.min(balls, this.pos.length);
    for (let i = 0; i < ballsToDraw; i++) {
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      canvas.circle(this.pos[i], Math.floor(size), color, 0);
    }
    
    this.trigger = false;
  }
}
