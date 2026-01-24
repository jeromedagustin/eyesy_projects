import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Bits V - Uniform Color
 * Ported from Python version
 * 
 * Knob1 - number of lines
 * Knob2 - line length
 * Knob3 - shadow control
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Bitsvuniformcolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private ypos: number[] = [];
  private ypos1: number[] = [];
  private lineAmt = 0;
  private linelength = 0;
  private displace = 0;
  private width = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.width = this.xr + 65;
    this.lineAmt = Math.floor(eyesy.knob1 * (this.xr * 0.078)) + 2;
    this.linelength = Math.floor(this.yr * 0.069); // ((50*yr)/720)
    this.displace = Math.floor(this.yr * 0.014); // ((10*yr)/720)
    this.ypos = [];
    for (let i = 0; i < this.lineAmt + 2; i++) {
      this.ypos.push(Math.floor(Math.random() * (this.yr + (this.yr * 0.278))) - (this.yr * 0.278));
    }
    this.ypos1 = this.ypos.map(y => y + this.displace);
    this.trigger = false;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.15);
    const linewidth = Math.floor(this.width / this.lineAmt);
    this.linelength = Math.floor(eyesy.knob2 * (this.yr * 0.417) + 1);
    const minus = (eyesy.knob3 * 0.5) + 0.5;
    const shadowColor: [number, number, number] = [
      Math.floor(eyesy.bg_color[0] * minus),
      Math.floor(eyesy.bg_color[1] * minus),
      Math.floor(eyesy.bg_color[2] * minus)
    ];
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.lineAmt = Math.floor(eyesy.knob1 * (this.xr * 0.078)) + 2;
      this.ypos = [];
      for (let i = 0; i < this.lineAmt + 2; i++) {
        this.ypos.push(Math.floor(Math.random() * (this.yr + (this.yr * 0.278))) - (this.yr * 0.278));
      }
      this.ypos1 = this.ypos.map(y => y + this.displace);
    }
    
    // Draw shadows first
    for (let k = 0; k < this.lineAmt + 2; k++) {
      const y = this.ypos1[k] + this.linelength;
      const x = (k * linewidth) + Math.floor(linewidth / 2) - 1;
      canvas.line(
        [x + this.displace, this.ypos1[k]],
        [x + this.displace, y],
        shadowColor,
        linewidth
      );
    }
    
    // Draw main lines (uniform color)
    for (let j = 0; j < this.lineAmt + 2; j++) {
      const y = this.ypos[j] + this.linelength;
      const x = (j * linewidth) + Math.floor(linewidth / 2) - 1;
      canvas.line([x, this.ypos[j]], [x, y], color, linewidth);
    }
    
    this.trigger = false;
  }
}
