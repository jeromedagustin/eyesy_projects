import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Gradient Friend
 * Ported from Python version
 * 
 * Knob1 - x position
 * Knob2 - y position
 * Knob3 - height
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Gradientfriend implements Mode {
  private startTime = Date.now() / 1000;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.startTime = Date.now() / 1000;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const yr = eyesy.yres;
    const xr = eyesy.xres;
    const maxI = Math.floor(yr * 0.25);
    const currentTime = Date.now() / 1000;
    
    for (let i = 0; i < maxI; i++) {
      const push = Math.abs(Math.floor(eyesy.knob3 * (eyesy.audio_in[i % 24] || 0) / (yr / 2)));
      const boing = Math.floor(eyesy.knob3 * i) + (eyesy.audio_in[1] || 0) / 500;
      const iAdjusted = boing;
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      const radius = Math.floor(10 + push + 10 * Math.sin(i * 0.05 + currentTime));
      const xpos = Math.floor(((((xr * eyesy.knob1 + 100 * Math.sin(i * 0.0006 + currentTime)) + 100) * xr) / eyesy.xres));
      const ypos = Math.floor((((((5 * eyesy.knob2 - 1) / 2 * yr + (yr / 2))) - Math.floor(i * eyesy.knob2)) * yr) / yr - 4 * i) - boing;
      
      canvas.circle([xpos, Math.floor(ypos - boing)], radius + 1, color, 0);
    }
  }
}
