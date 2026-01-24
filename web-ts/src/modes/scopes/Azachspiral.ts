import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - A Zach Spiral
 * Ported from Python version
 * Original code adapted from zach lieberman's talk
 * https://www.youtube.com/watch?v=bmztlO9_Wvo
 * http://www.mathrecreation.com/2016/10/some-familiar-spirals-in-desmos.html
 */
export class Azachspiral implements Mode {
  private w1 = 0;
  private h1 = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.w1 = eyesy.xres;
    this.h1 = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const time = Date.now() * 0.001;
    
    const k = Math.floor(
      this.h1 + this.h1 * Math.sin(time * (0.1 + eyesy.knob2 * 2))
    );
    const j = Math.floor(
      (this.h1 / 2) - 10 + ((this.h1 / 2) - 10) * Math.cos(time * (0.8 + 1 + eyesy.knob2))
    );
    const l = Math.floor(this.h1 - 25) - k;
    
    for (let i = 0; i < this.h1 + 20; i++) {
      const i2 = i * 2;
      
      // Calculate color with sine waves
      const color: [number, number, number] = [
        Math.floor(127 + 120 * Math.sin(i2 * 0.01 + time)),
        Math.floor(127 + 120 * Math.sin(i2 * (0.01 + eyesy.knob5 * 0.01) + time)),
        Math.floor(127 + 120 * Math.sin(i2 * (0.01 + eyesy.knob5 * 0.02) + time)),
      ];
      
      // Get audio value
      const r1 = eyesy.audio_in.length > 0 
        ? Math.abs(eyesy.audio_in[i2 % 100])
        : 0;
      
      // Calculate radius
      const radius_2 = Math.floor(50 - 20 * Math.sin(i2 * (eyesy.knob2 * 0.2) + 0.0001 + time));
      const radius2 = Math.floor(
        (eyesy.knob3 / 2) * radius_2 + (0.4 + eyesy.knob2 / 3) * (r1 / 400)
      );
      
      const xpos3 = this.w1 / 2;
      const ypos2 = this.h1 / 2;
      
      // Calculate spiral position
      const spiral_angle = 1 + Math.sqrt(5) * Math.PI / (Math.PI + 12 * eyesy.knob1);
      const xpos4 = Math.floor(
        xpos3 + (20 * eyesy.knob2 + 1) * Math.sqrt(i2) * Math.cos(i2 * spiral_angle)
      );
      const ypos3 = Math.floor(
        ypos2 + (20 * eyesy.knob2 + 1) * Math.sqrt(i2) * Math.sin(i2 * spiral_angle)
      );
      
      // Calculate ellipse radii
      const radius3 = Math.floor(radius2 + Math.sin(i2 * (eyesy.knob2 * 0.2) + time));
      const radius4 = Math.floor(radius2 + Math.cos(i2 * (eyesy.knob2 * 0.2) + time));
      
      // Only draw if within the range
      const rangeMin = k - ((this.h1 * 2) + 30) * eyesy.knob4 - 5;
      const rangeMax = k + ((this.h1 * 2) + 30) * eyesy.knob4 + 5;
      
      if (rangeMin <= i2 && i2 <= rangeMax) {
        canvas.ellipse([xpos4, ypos3], radius3, radius4, color, 0);
      }
    }
  }
}
