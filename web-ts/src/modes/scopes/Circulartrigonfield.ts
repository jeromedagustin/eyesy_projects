import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Circular Trigon Field
 * Ported from Python version
 * 
 * Knob1 - diameter/radius
 * Knob2 - second point position
 * Knob3 - third point position
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Circulartrigonfield implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const x200 = this.xr * 0.156;
    const x640 = this.xr * 0.5;
    const x800 = this.xr * 0.625;
    const xran = Math.floor(this.xr * 0.0609);
    const y260 = this.yr * 0.44;
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    let R = Math.floor(eyesy.knob1 * x800);
    R = R + Math.floor((eyesy.audio_in[i] || 0) / 100);
    const x = R * Math.cos((i / 50.0) * 6.28) + x640;
    const y = R * Math.sin((i / 50.0) * 6.28) + y260;
    
    if ((i % 2) === 1) {
      // Filled triangle
      const x1 = Math.floor(x);
      const y1 = Math.floor(y);
      const x2 = Math.floor(x) + Math.floor(eyesy.knob2 * x200) + Math.floor(Math.random() * xran);
      const y2 = Math.floor(y) + Math.floor(eyesy.knob2 * x200);
      const x3 = Math.floor(x) - Math.floor(eyesy.knob3 * x200);
      const y3 = Math.floor(y) + Math.floor(eyesy.knob3 * x200);
      
      canvas.polygon([[x1, y1], [x2, y2], [x3, y3]], color, 0);
    } else {
      // Outlined triangle
      const outline = Math.random() * 0.01;
      const outlineColor = eyesy.color_picker(outline);
      const x1 = Math.floor(x);
      const y1 = Math.floor(y);
      const x2 = Math.floor(x) + Math.floor(eyesy.knob2 * x200) + Math.floor(Math.random() * xran);
      const y2 = Math.floor(y) + Math.floor(eyesy.knob2 * x200);
      const x3 = Math.floor(x) - Math.floor(eyesy.knob3 * x200);
      const y3 = Math.floor(y) + Math.floor(eyesy.knob3 * x200);
      
      canvas.polygon([[x1, y1], [x2, y2], [x3, y3]], outlineColor, 1);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    for (let i = 0; i < 50; i++) {
      this.seg(canvas, eyesy, i);
    }
  }
}
