import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Bits Vertical
 * Ported from Python version
 * 
 * Knob1 - number of lines
 * Knob2 - line length
 * Knob3 - angle adjustment
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Bitsvertical implements Mode {
  private xr = 1280;
  private yr = 720;
  private ypos: number[] = [];
  private lineAmt = 60;
  private lineAmtOld = 60;
  private trigger = false;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lineAmt = Math.floor(eyesy.knob1 * 59 + 1);
    this.lineAmtOld = this.lineAmt;
    const yrangelow = Math.floor(-0.15 * this.yr);
    this.ypos = [];
    for (let i = 0; i < this.lineAmt; i++) {
      this.ypos.push(Math.floor(Math.random() * (this.yr - yrangelow + 1)) + yrangelow);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const height = Math.floor(this.yr * 1.03125);
    const width = this.xr;
    const lengthcon = Math.floor(this.yr * 0.833);
    const linewidth = Math.floor((width + 40) / this.lineAmt);
    const linelength = Math.floor(eyesy.knob2 * lengthcon + 1);
    const yrangelow = Math.floor(-0.15 * eyesy.yres);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    this.lineAmt = Math.floor(eyesy.knob1 * 59 + 1);
    if (this.lineAmtOld !== this.lineAmt) {
      this.ypos = [];
      for (let i = 0; i < this.lineAmt; i++) {
        this.ypos.push(Math.floor(Math.random() * (height - yrangelow + 1)) + yrangelow);
      }
    }
    this.lineAmtOld = this.lineAmt;
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    if (this.trigger) {
      this.lineAmt = Math.floor(eyesy.knob1 * 59 + 1);
      this.ypos = [];
      for (let i = 0; i < this.lineAmt; i++) {
        this.ypos.push(Math.floor(Math.random() * (height - yrangelow + 1)) + yrangelow);
      }
    }
    this.trigger = false;
    
    for (let j = 0; j < this.lineAmt; j++) {
      const audio = (eyesy.audio_in[j] || 0) / 180;
      const diag = 0.05 * eyesy.xres;
      const y = this.ypos[j] + linelength;
      const x = (j * linewidth) + (linewidth / 2) - 1;
      canvas.line(
        [x, this.ypos[j] + audio],
        [x + eyesy.knob3 * (diag * 2) - diag, y + audio],
        color,
        linewidth
      );
    }
  }
}
