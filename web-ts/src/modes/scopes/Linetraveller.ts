import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Line Traveller
 * Ported from Python version
 * 
 * Knob1 - size
 * Knob2 - y speed
 * Knob3 - x speed
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Linetraveller implements Mode {
  private xr = 1280;
  private yr = 720;
  private xhalf = 0;
  private yhalf = 0;
  private y = 0;
  private x = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.xhalf = this.xr / 2;
    this.yhalf = this.yr / 2;
    this.y = 0;
    this.x = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const yspeed = Math.floor(eyesy.knob2 * 20);
    const xspeed = Math.floor(eyesy.knob3 * 40);
    const thick = Math.floor(eyesy.knob1 * this.yhalf) + 1;
    
    let peak = 0;
    for (let i = 0; i < 1; i++) {
      peak = eyesy.audio_in[i * 50] || 0;
    }
    
    const L = peak / 6 + 1;
    const x1 = this.x - L;
    const x2 = this.x + L;
    
    this.y = this.y + yspeed;
    if (this.y > this.yr) {
      this.y = 0;
    }
    
    this.x = this.x + xspeed;
    if (this.x > this.xr) {
      this.x = 0;
    }
    
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    canvas.line([x1, this.y], [x2, this.y], color, thick);
  }
}
