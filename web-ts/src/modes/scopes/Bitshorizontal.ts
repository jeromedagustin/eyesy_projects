import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Bits Horizontal
 * Ported from Python version
 * 
 * Knob1 - number of lines
 * Knob2 - line length
 * Knob3 - angle adjustment
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Bitshorizontal implements Mode {
  private xr = 1280;
  private yr = 720;
  private xpos: number[] = [];
  private lineAmt = 60;
  private lineAmtOld = 60;
  private trigger = false;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lineAmt = Math.floor(eyesy.knob1 * 59 + 1);
    this.lineAmtOld = this.lineAmt;
    const xrangelow = Math.floor(-0.16 * eyesy.xres);
    this.xpos = [];
    for (let i = 0; i < this.lineAmt + 2; i++) {
      this.xpos.push(Math.floor(Math.random() * (eyesy.xres - xrangelow + 1)) + xrangelow);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const height = this.yr;
    const width = Math.floor(eyesy.xres + (eyesy.xres * 0.16));
    const lengthcon = Math.floor(0.25 * eyesy.xres);
    const linelength = Math.floor(eyesy.knob2 * lengthcon + 10);
    const linewidth = height / this.lineAmt;
    const xrangelow = Math.floor(-0.16 * eyesy.xres);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    this.lineAmt = Math.floor(eyesy.knob1 * 59 + 1);
    if (this.lineAmtOld !== this.lineAmt) {
      this.xpos = [];
      for (let i = 0; i < this.lineAmt + 2; i++) {
        this.xpos.push(Math.floor(Math.random() * (eyesy.xres - xrangelow + 1)) + xrangelow);
      }
    }
    this.lineAmtOld = this.lineAmt;
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    if (this.trigger) {
      this.lineAmt = Math.floor(eyesy.knob1 * 59 + 1);
      this.xpos = [];
      for (let i = 0; i < this.lineAmt + 2; i++) {
        this.xpos.push(Math.floor(Math.random() * (eyesy.xres - xrangelow + 1)) + xrangelow);
      }
    }
    this.trigger = false;
    
    for (let i = 0; i < this.lineAmt; i++) {
      const audio = Math.floor(Math.abs((eyesy.audio_in[i] || 0) / 180));
      const diag = Math.floor(0.07 * eyesy.yres);
      const x = this.xpos[i] + linelength;
      const y = (i * linewidth) + Math.floor(linewidth / 2);
      canvas.line(
        [this.xpos[i] + audio, y],
        [Math.floor(x + audio), y + Math.floor(eyesy.knob3 * (diag * 2) - diag)],
        color,
        Math.floor(linewidth)
      );
    }
  }
}
