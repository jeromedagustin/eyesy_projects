import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Arcway
 * Ported from Python version
 * 
 * Knob1 - line width/length
 * Knob2 - rate of rotation (left half = counter clockwise, right half = clockwise)
 * Knob3 - offset of bottom disc
 * Knob4 - color of discs
 * Knob5 - background color
 */
export class Arcway implements Mode {
  private xr = 1280;
  private yr = 720;
  private xresHalf = 640;
  private yresHalf = 360;
  private toplimit = 0;
  private leftlimit = 0;
  private squareX = 0;
  private rotationFactor = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.xresHalf = Math.floor(eyesy.xres / 2);
    this.yresHalf = Math.floor(eyesy.yres / 2);
    this.toplimit = Math.floor(this.yr * 0.153);
    this.leftlimit = Math.floor(this.xr * 0.305);
    // Base size for arcs - will be scaled by knob1 in draw()
    this.squareX = Math.floor(Math.min(this.xr, this.yr) * 0.4); // 40% of smaller dimension
    this.rotationFactor = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    let startAngle = 0;
    let stopAngle = Math.PI / 50;
    
    // Knob1: Line width/length (1 to 20 pixels, with audio boost)
    const baseWidth = Math.floor(eyesy.knob1 * 19) + 1;
    // Make size responsive to audio
    const audioLevel = eyesy.audio_in && eyesy.audio_in.length > 0 
      ? Math.abs(eyesy.audio_in[Math.floor(eyesy.audio_in.length / 2)] || 0) / 32768.0 
      : 0;
    const width = Math.floor(baseWidth * (1.0 + audioLevel * 0.5));
    
    // Knob1 also affects the radius size for more interactivity
    const baseSizer = Math.floor(this.xr * 0.098);
    const sizer = Math.floor(baseSizer * (0.5 + eyesy.knob1 * 1.0));
    
    // Knob2: Rate of rotation (much faster and more responsive)
    // 0 = counter-clockwise (fast), 0.5 = stopped, 1 = clockwise (fast)
    const rotationSpeed = (eyesy.knob2 - 0.5) * 10; // -5 to +5 rotations per second
    this.rotationFactor += rotationSpeed * eyesy.deltaTime;
    
    // Knob3: Offset of bottom disc (more dramatic range)
    const rotationDetune = eyesy.knob3 * 2.0; // 0 to 2 full rotations offset
    
    // Center the visualization properly
    const centerX = this.xresHalf;
    const centerY = this.yresHalf;
    
    // Make arc size responsive to knob1
    const arcRadius = Math.floor((this.squareX / 2) * (0.5 + eyesy.knob1 * 1.0));
    
    for (let i = 0; i < 100; i++) {
      // BOTTOM DISC
      // Color of bottom disc - bounce the gradient so no hard color shifts
      let color: [number, number, number];
      if (i < 49) {
        color = eyesy.color_picker(i * 0.02);
      } else {
        color = eyesy.color_picker((99 - i) * 0.02);
      }
      
      // Enhanced audio reactivity - make it more dramatic
      const audioIndex = Math.floor((i / 100) * (eyesy.audio_in?.length || 100));
      const audioVal = eyesy.audio_in && eyesy.audio_in.length > 0 
        ? (eyesy.audio_in[audioIndex] || 0) / 32768.0 
        : 0;
      const audioOffset = audioVal * sizer * 0.3; // Much more responsive
      
      const angle = 2 * Math.PI * i / 100;
      const x = centerX + sizer * Math.cos(angle) + audioOffset * Math.cos(angle) - 0.1 * width;
      const y = centerY + sizer * Math.sin(angle) + audioOffset * Math.sin(angle) - 0.1 * width;
      
      const start = startAngle + 2 * Math.PI * (this.rotationFactor - rotationDetune);
      const end = stopAngle + 2 * Math.PI * (this.rotationFactor - rotationDetune);
      
      canvas.arc(
        [x, y],
        arcRadius,
        arcRadius,
        start,
        end,
        color,
        width
      );
      
      // TOP DISC
      const color2 = eyesy.color_picker_lfo(eyesy.knob4, 0.2);
      const x2 = centerX + sizer * Math.cos(angle) + audioOffset * Math.cos(angle) + 0.1 * width;
      const y2 = centerY + sizer * Math.sin(angle) + audioOffset * Math.sin(angle) + 0.1 * width;
      
      const start2 = startAngle + 2 * Math.PI * this.rotationFactor;
      const end2 = stopAngle + 2 * Math.PI * this.rotationFactor;
      
      canvas.arc(
        [x2, y2],
        arcRadius,
        arcRadius,
        start2,
        end2,
        color2,
        width
      );
      
      startAngle += Math.PI / 50;
      stopAngle += Math.PI / 50;
    }
  }
}
