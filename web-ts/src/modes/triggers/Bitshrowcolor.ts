import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Bits H - Row Color
 * Ported from Python version
 * 
 * Knob1 - number of lines
 * Knob2 - line length
 * Knob3 - shadow control
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Bitshrowcolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private xpos: number[] = [];
  private xpos1: number[] = [];
  private lineAmt = 0;
  private linelength = 0;
  private displace = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.linelength = Math.floor(this.xr * 0.039); // ((50*xr)/1280)
    this.lineAmt = Math.floor(eyesy.knob1 * (this.yr * 0.139)) + 2;
    this.displace = Math.floor(this.xr * 0.008); // ((10*xr)/1280)
    this.xpos = [];
    for (let i = 0; i < this.lineAmt + 2; i++) {
      this.xpos.push(Math.floor(Math.random() * (this.xr + (this.xr * 0.156))) - (this.xr * 0.156));
    }
    this.xpos1 = this.xpos.map(x => x + this.displace);
    this.trigger = false;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.15);
    const linewidth = Math.floor(this.yr / this.lineAmt);
    this.linelength = Math.floor(eyesy.knob2 * (this.xr * 0.234) + 1);
    const minus = (eyesy.knob3 * 0.5) + 0.5;
    const shadowColor: [number, number, number] = [
      Math.floor(eyesy.bg_color[0] * minus),
      Math.floor(eyesy.bg_color[1] * minus),
      Math.floor(eyesy.bg_color[2] * minus)
    ];
    
    // Check for trigger (both manual and random trigger)
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      // Regenerate line positions and count on trigger for visible change
      this.lineAmt = Math.floor(eyesy.knob1 * (this.yr * 0.139)) + 2;
      this.xpos = [];
      for (let i = 0; i < this.lineAmt + 2; i++) {
        // Generate new random positions across the full width
        this.xpos.push(Math.floor(Math.random() * (this.xr + (this.xr * 0.156))) - (this.xr * 0.156));
      }
      this.xpos1 = this.xpos.map(x => x + this.displace);
      // Reset trigger flag after processing
      this.trigger = false;
    }
    
    // Draw shadows first
    for (let k = 0; k < this.lineAmt + 2; k++) {
      const x = this.xpos1[k] + this.linelength;
      const y = (k * linewidth) + Math.floor(linewidth / 2) - 1;
      canvas.line(
        [this.xpos1[k], y + this.displace],
        [x, y + this.displace],
        shadowColor,
        linewidth
      );
    }
    
    // Draw main lines
    for (let j = 0; j < this.lineAmt + 2; j++) {
      const x = this.xpos[j] + this.linelength;
      const y = (j * linewidth) + Math.floor(linewidth / 2) - 1;
      const lineColor = eyesy.color_picker_lfo(eyesy.knob4, 0.15);
      canvas.line([this.xpos[j], y], [x, y], lineColor, linewidth);
    }
    
    this.trigger = false;
  }
}
