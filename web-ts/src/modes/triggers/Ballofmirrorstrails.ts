import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Ball of Mirrors - Trails
 * Ported from Python version
 * 
 * Knob1 - ball size
 * Knob2 - trails distance
 * Knob3 - trails opacity
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Ballofmirrorstrails implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Draw circle on trigger
    if (eyesy.trig) {
      const color = eyesy.color_picker_lfo(eyesy.knob4, 0.01);
      const x = Math.floor(Math.random() * this.xr);
      const y = Math.floor(Math.random() * this.yr);
      const ballSize = Math.floor((this.xr * 0.078) * eyesy.knob1 + 10); // ball size on knob1
      canvas.circle([x, y], ballSize, color, 0);
    }
    
    // Blit the previous frame (scaled, semi-transparent, centered)
    const thingX = Math.floor((this.xr - (this.xr * 0.039)) * eyesy.knob2);
    const thingY = Math.floor((this.yr - (this.yr * 0.069)) * eyesy.knob2);
    const placeX = Math.floor((this.xr / 2) - eyesy.knob2 * (this.xr * 0.480));
    const placeY = Math.floor((this.yr / 2) - eyesy.knob2 * (this.yr * 0.465));
    const alpha = Math.floor(eyesy.knob3 * 180) / 255; // Convert 0-180 to 0.0-0.7 opacity
    
    canvas.blitLastFrame(placeX, placeY, thingX, thingY, alpha, false);
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }
}
