import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Draws Hashmarks - Uniform Color
 * Ported from Python version
 * 
 * Knob1 - horizontal line count
 * Knob2 - line thickness
 * Knob3 - vertical line count
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Drawshashmarksuniformcolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private vertLines = 20;
  private xpos = 0;
  private x = 0;
  private y = 0;
  private height = 0;
  private width = 0;
  private angle = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.trigger = false;
    this.vertLines = 20;
    this.xpos = 0;
    this.x = 0;
    this.y = 0;
    this.height = 0;
    this.width = 0;
    this.angle = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.075); // uniform color
    const linewidth = Math.floor((((eyesy.knob2 * 7) + 1) * this.yr) / this.yr) + 1;
    const lines = Math.floor(9 * eyesy.knob1 + 1) + 90;
    const min200 = Math.floor(this.xr * 0.156); // ((200*xr)/1280)
    const min100 = Math.floor(this.xr * 0.078); // ((100*xr)/1280)
    const max1000 = Math.floor(this.xr * 0.781); // ((1280*xr)/1280)
    const max700 = Math.floor(this.yr * 0.972); // ((700*yr)/720)
    const ran50 = Math.floor(this.xr * 0.039); // ((50*xr)/1280)
    const ran70 = Math.floor(this.xr * 0.055); // ((70*xr)/1280)
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    // Vertical lines
    if (this.trigger) {
      this.vertLines = Math.floor(Math.random() * (Math.floor(eyesy.knob3 * ran70) + 8 - (Math.floor(eyesy.knob3 * ran50) + 2))) + (Math.floor(eyesy.knob3 * ran50) + 2);
      this.x = Math.floor(Math.random() * (max1000 - (-1 * min200))) + (-1 * min200);
      this.y = Math.floor(Math.random() * (max700 - (-1 * min200))) + (-1 * min200);
      this.width = Math.floor(Math.random() * (max1000 - (-1 * min100))) + (-1 * min100);
      this.height = Math.floor(Math.random() * (max1000 - (-1 * min100))) + (-1 * min100);
    }
    
    for (let k = 0; k < this.vertLines; k++) {
      this.xpos = this.x + (k + 1) * (this.width / this.vertLines);
      canvas.line(
        [this.xpos + this.angle, this.y],
        [this.xpos - this.angle, this.height],
        color,
        linewidth
      );
    }
    
    this.trigger = false;
    
    // Horizontal lines
    if (eyesy.knob1 > 0) {
      for (let j = 0; j < lines; j++) {
        const linespace = this.yr - (lines - 1) * (this.yr - 2) / 100;
        canvas.line(
          [0, (j * linespace) + linespace / 2],
          [this.xr, (j * linespace) + linespace / 2],
          color,
          linewidth
        );
      }
    }
  }
}
