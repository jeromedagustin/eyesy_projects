import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Ball of Mirrors
 * Ported from Python version
 * 
 * Knob1 - x pos
 * Knob2 - y pos
 * Knob3 - x scale
 * Knob4 - y scale
 * Knob5 - background color
 */
export class Ballofmirrors implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const cscale = Math.floor(this.xr * 0.04);
    
    // Draw circle on trigger
    if (eyesy.trig) {
      const color = eyesy.color_picker(Math.random() * 1.0);
      const x = Math.floor(Math.random() * (this.xr + cscale)) - Math.floor(cscale / 2);
      const y = Math.floor(Math.random() * (this.yr + cscale)) - Math.floor(cscale / 2);
      canvas.circle([x, y], cscale, color, 0);
    }
    
    // Blit the previous frame (scaled, flipped horizontally, positioned)
    const thingX = Math.floor(eyesy.knob3 * this.xr);
    const thingY = Math.floor(eyesy.knob4 * this.yr);
    const placeX = Math.floor(eyesy.knob1 * this.xr);
    const placeY = Math.floor(eyesy.knob2 * this.yr);
    
    canvas.blitLastFrame(placeX, placeY, thingX, thingY, 1.0, true); // flipX = true
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }
}
