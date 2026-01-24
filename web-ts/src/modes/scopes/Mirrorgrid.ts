import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Mirror Grid
 * Ported from Python version
 * 
 * Knob1 - line width
 * Knob2 - number of lines
 * Knob3 - square size
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Mirrorgrid implements Mode {
  private xr = 1280;
  private yr = 720;
  private y72 = 0;
  private x180 = 0;
  private zehn = 0;
  private colorRate = 0;
  private lines = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.y72 = Math.floor(this.yr * 0.1);
    this.x180 = this.xr * 0.1406;
    this.zehn = this.xr * 0.014;
    this.colorRate = 0;
    this.lines = this.y72;
    if (this.lines > 72) {
      this.lines = 72;
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const linewidth = Math.floor(eyesy.knob1 * this.zehn) + 1;
    const spacehoriz = (this.x180 * eyesy.knob2) + 18;
    const recsize = Math.floor(this.zehn * eyesy.knob3);
    const sel = eyesy.knob4 * 2;
    
    // Horizontal lines
    for (let j = 0; j < this.lines; j++) {
      let color: [number, number, number];
      if (sel < 1) {
        color = eyesy.color_picker(eyesy.knob4 * 2);
      } else {
        this.colorRate = (this.colorRate + (Math.abs(sel - 1) * 0.1)) % 1.0;
        color = eyesy.color_picker(this.colorRate);
      }
      const space = j * spacehoriz;
      canvas.line([0, space], [this.xr, space], color, linewidth);
    }
    
    // Top oscilloscope
    for (let m = 0; m < this.lines; m++) {
      let color: [number, number, number];
      if (sel < 1) {
        color = eyesy.color_picker(eyesy.knob4 * 2);
      } else {
        this.colorRate = (this.colorRate + (Math.abs(sel - 1) * 0.1)) % 1.0;
        color = eyesy.color_picker(this.colorRate);
      }
      const x = Math.floor(m * spacehoriz) + 2;
      const y = 0;
      let auDio = Math.floor((eyesy.audio_in[m] || 0) * 0.00003058 * this.yr);
      if (auDio < 0) {
        auDio = 0;
      }
      canvas.line([x, y], [x, y + auDio], color, linewidth);
      if (recsize >= 1) {
        canvas.rect(x - Math.floor(recsize * 0.5), y + auDio, recsize, recsize, color, 0);
      }
    }
    
    // Bottom oscilloscope
    for (let i = 0; i < this.lines; i++) {
      let color: [number, number, number];
      if (sel < 1) {
        color = eyesy.color_picker(eyesy.knob4 * 2);
      } else {
        this.colorRate = (this.colorRate + (Math.abs(sel - 1) * 0.1)) % 1.0;
        color = eyesy.color_picker(this.colorRate);
      }
      const x = Math.floor((i * spacehoriz) + 1);
      const y = Math.floor(this.yr - recsize);
      let auDio = Math.floor((eyesy.audio_in[i] || 0) * 0.00003058 * this.yr);
      if (auDio > 0) {
        auDio = 0;
      }
      canvas.line([x, y + recsize], [x, y - (auDio * -1)], color, linewidth);
      if (recsize >= 1) {
        canvas.rect(x - Math.floor((recsize / 2) + 1), y + auDio, recsize, recsize, color, 0);
      }
    }
  }
}
