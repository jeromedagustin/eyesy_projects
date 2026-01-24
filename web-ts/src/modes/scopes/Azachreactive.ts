import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - A ZACH Reactive
 * Ported from Python version
 * Original code adapted from zach lieberman's talk
 * https://www.youtube.com/watch?v=bmztlO9_Wvo
 */
export class Azachreactive implements Mode {
  private w1 = 0;
  private h1 = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.w1 = eyesy.xres;
    this.h1 = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < (this.h1 / 2) - 10; i++) {
      const i2 = i * 2;
      
      // Calculate color with sine waves
      const color: [number, number, number] = [
        Math.floor(127 + 120 * Math.sin(i2 * 0.01 + time)),
        Math.floor(127 + 120 * Math.sin(i2 * (0.01 + eyesy.knob4 * 0.01) + time)),
        Math.floor(127 + 120 * Math.sin(i2 * (0.01 + eyesy.knob4 * 0.02) + time)),
      ];
      
      // Get audio value
      const audioIdx = Math.floor(i2 / 50);
      const r1 = eyesy.audio_in.length > 0 
        ? Math.abs(eyesy.audio_in[audioIdx % eyesy.audio_in.length] / 900)
        : 0;
      
      // Calculate radii with audio and sine waves
      const radius_1 = Math.floor(100 + r1 + 40 * Math.sin(i2 * (eyesy.knob1 * 0.05) + 0.0001 + time));
      const radius1 = Math.floor(eyesy.knob3 * radius_1);
      const radius_2 = Math.floor(70 + r1 - 20 * Math.sin(i2 * (eyesy.knob2 * 0.2) + 0.0001 + time));
      const radius2 = Math.floor(eyesy.knob3 * radius_2);
      
      const xoffset1 = i2;
      const xpos1 = Math.floor(
        ((this.w1 / 2) - i2) * Math.sin(i2 * 0.01 + (time * 0.3)) +
        (this.w1 / 2 - i2) + xoffset1
      ) + Math.floor(r1 * 1.5);
      const xpos2 = Math.floor(
        ((this.w1 / 2) - i2) * Math.sin(i2 * 0.01 + (time * 0.3)) +
        (this.w1 / 2 - i2) + xoffset1 + (this.h1 / 2)
      ) + Math.floor(r1 * 1.5);
      const xpos3 = Math.floor(
        ((this.w1 / 2) - i2) * Math.sin(i2 * 0.01 + (time * 0.3)) +
        (this.w1 / 2 - i2) + xoffset1 - (this.h1 / 2)
      ) + Math.floor(r1 * 1.5);
      
      // Draw rectangle (rect2)
      const rectSize = Math.floor(radius2 * 1.5);
      canvas.rect(xpos2, i, rectSize, rectSize, color, 0);
      
      // Calculate ellipse radii
      const radius3 = Math.floor(radius2 + 10 + 10 * Math.sin(i2 * (eyesy.knob2 * 0.2) + time));
      const radius4 = Math.floor(radius2 + 10 + 10 * Math.cos(i2 * (eyesy.knob1 * 0.2) + time));
      
      // Draw circle (xpos1)
      canvas.circle([xpos1, i], radius1, color, 0);
      
      // Draw ellipse (xpos3)
      canvas.ellipse([xpos3, i], radius3, radius4, color, 0);
    }
  }
}
