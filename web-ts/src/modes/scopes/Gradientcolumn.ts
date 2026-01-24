import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Gradient Column
 * Ported from Python version
 * 
 * Knob1 - cloud height
 * Knob2 - cloud width
 * Knob3 - pattern shape and swell range
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Gradientcolumn implements Mode {
  private xr = 1280;
  private yr = 720;
  private x12 = 0;
  private colorRate = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x12 = this.xr * 0.009375; // (12*xr)/eyesy.xres
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const cool = Math.floor(eyesy.knob1 * (this.yr - 10)) + 10; // number of circles and height
    const yoff = Math.floor((this.yr / 2) - eyesy.knob1 * (this.yr / 2));
    const xtra = Math.floor(eyesy.knob2 * (this.xr - 2)) + 2; // width control
    const segs = 99; // number of audio data points to look at
    const sel = eyesy.knob4 * 5; // color select switch
    const swell = eyesy.knob3 * 0.999 + 0.001; // radius and scope shape

    for (let i = 0; i < cool; i++) {
      const audioPuff = Math.floor(((eyesy.audio_in[i % segs] || 0) * 0.00003058) * (this.yr / 2));
      this.colorRate = (this.colorRate + (eyesy.knob4 * 0.002)) % 1.0;
      const color = eyesy.color_picker(((i * 0.02) + this.colorRate) % 1.0);
      const radius = Math.floor(this.x12 + this.x12 * Math.sin(i * 0.1 * swell + Date.now() * 0.001));
      const xpos = Math.floor(((this.xr / 2) - xtra / 144) + (xtra / 2) * Math.sin(i * 2.5 + Date.now() * 0.001));
      canvas.circle([xpos + audioPuff, i + yoff], Math.abs(radius), color, 0);
    }
  }
}
