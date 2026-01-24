import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Perspective Lines
 * Ported from Python version
 * 
 * Knob1 - x position
 * Knob2 - y position
 * Knob3 - line & circle size
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Perspectivelines implements Mode {
  private xr = 1280;
  private yr = 720;
  private lastPoint: [number, number] = [0, 0];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lastPoint = [0, this.yr / 2];
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const xoffset = this.xr / 48;
    const x19 = (10 * this.xr) / this.xr;
    const y0 = this.yr / 2;
    const y1 = Math.floor((this.yr / 2) + ((eyesy.audio_in[i] || 0) * 0.00003058 * (this.yr / 2)));
    const x = Math.floor(i * xoffset);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    this.lastPoint = [Math.floor(eyesy.knob1 * this.xr), Math.floor(eyesy.knob2 * this.yr)];
    
    canvas.circle([x, y1], Math.floor(eyesy.knob3 * x19) + 3, color, 0);
    canvas.line(this.lastPoint, [x, y1], color, Math.floor(eyesy.knob3 * x19) + 1);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    for (let i = 0; i < 50; i++) {
      this.seg(canvas, eyesy, i);
    }
  }
}
