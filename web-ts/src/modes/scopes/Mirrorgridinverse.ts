import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Mirror Grid - Inverse
 * Ported from Python version
 * 
 * Knob1 - line width
 * Knob2 - number of lines
 * Knob3 - square size
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Mirrorgridinverse implements Mode {
  private xr = 1280;
  private yr = 720;
  private zehn = 0;
  private colorRate = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.zehn = Math.floor(this.xr * 0.0078125);
    this.colorRate = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const linewidth = Math.floor(eyesy.knob1 * this.zehn) + 1;
    const lines = Math.floor((39 * eyesy.knob2) + 1) + 4;
    const spacehoriz = Math.floor(this.xr / (lines - 2));
    const spacevert = Math.floor(this.yr / (lines - 2));
    const recsize = Math.floor(this.zehn * eyesy.knob3) * 2;
    const sel = eyesy.knob4 * 2;
    
    // Horizontal lines
    for (let j = 0; j < lines; j++) {
      let color: [number, number, number];
      if (sel < 1) {
        color = eyesy.color_picker(eyesy.knob4 * 2);
      } else {
        this.colorRate = (this.colorRate + (Math.abs(sel - 1) * 0.1)) % 1.0;
        color = eyesy.color_picker(this.colorRate);
      }
      canvas.line([-1, j * spacevert], [this.xr, j * spacevert], color, linewidth);
    }
    
    // Top oscilloscope
    for (let m = 0; m < lines; m++) {
      const x = Math.floor(m * spacehoriz);
      const y = 0;
      const auDiom = ((eyesy.audio_in[m] || 0) * 0.00003058) * this.yr;
      
      let color: [number, number, number];
      if (sel < 1) {
        color = eyesy.color_picker(eyesy.knob4 * 2);
      } else {
        this.colorRate = (this.colorRate + (Math.abs(sel - 1) * 0.1)) % 1.0;
        color = eyesy.color_picker(this.colorRate);
      }
      
      canvas.line([x, y], [x, this.yr / 2 - auDiom], color, linewidth);
      if (recsize >= 1) {
        canvas.rect(x - Math.floor(recsize * 0.5), this.yr / 2 - auDiom, recsize, recsize, color, 0);
      }
    }
    
    // Bottom oscilloscope
    for (let i = 0; i < lines; i++) {
      const x = Math.floor(i * spacehoriz);
      const y = this.yr / 2;
      const auDio = ((eyesy.audio_in[Math.floor(i + (lines * 0.5))] || 0) * 0.00003058) * this.yr;
      
      let color: [number, number, number];
      if (sel < 1) {
        color = eyesy.color_picker(eyesy.knob4 * 2);
      } else {
        this.colorRate = (this.colorRate + (Math.abs(sel - 1) * 0.1)) % 1.0;
        color = eyesy.color_picker(this.colorRate);
      }
      
      canvas.line([x, this.yr], [x, y - auDio], color, linewidth);
      if (recsize >= 1 && y - auDio > y) {
        canvas.rect(x - Math.floor(recsize * 0.5), (y - auDio) - recsize, recsize, recsize, color, 0);
      }
    }
  }
}
