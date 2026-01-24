import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Zoom Scope
 * Ported from Python version
 * 
 * Knob1 - scope points
 * Knob2 - scope x position
 * Knob3 - scope y position
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Zoomscope implements Mode {
  private xr = 1280;
  private yr = 720;
  private x2 = 0;
  private f = 2;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x2 = Math.floor(this.xr * 0.00156);
    if (this.x2 <= 1) {
      this.x2 = 1;
    }
    this.f = 2;
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const s1 = Math.floor((eyesy.audio_in[i] || 0) * 0.00003058 * (this.yr / 2));
    const xs = Math.floor(this.xr / (this.f - 4));
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.003);
    const offx = Math.floor((eyesy.knob2 * this.xr) - (this.xr / 2));
    const offy = Math.floor(eyesy.knob3 * this.yr);
    
    const circleX = (i * xs) + offx;
    const circleY = offy + s1;
    const circleRadius = Math.floor((5 * this.xr) / this.xr);
    
    canvas.circle([circleX, circleY], circleRadius, color, 0);
    canvas.line([(i * xs) + offx, offy], [(i * xs) + offx, s1 + offy], color, this.x2);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    this.f = Math.floor(eyesy.knob1 * 94) + 6;
    for (let i = 0; i < this.f; i++) {
      this.seg(canvas, eyesy, i);
    }
  }
}
