import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Sound Jaws - Stepped Color
 * Ported from Python version
 * 
 * Knob1 - number of teeth
 * Knob2 - teeth shape
 * Knob3 - how close together teeth are (clench)
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Soundjawssteppedcolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private lastcol2 = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lastcol2 = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Teeth and clench
    const teeth = Math.floor(eyesy.knob1 * 10);
    let teethWidth = Math.floor(((this.xr - (this.xr * 0.1) * teeth) * this.xr) / this.xr);
    if (teethWidth === 0) {
      teethWidth = Math.floor((0.1 * this.xr * this.xr) / this.xr);
    }
    
    let clench = Math.floor(eyesy.knob3 * (0.156 * this.xr) - Math.floor(teethWidth / 2));
    if (teethWidth > this.xr / 2) {
      clench = Math.floor(eyesy.knob1 * (0.156 * this.xr) - (this.xr * 0.39));
    }
    
    const shape = Math.floor(eyesy.knob2 * 3);
    if (shape < 1) {
      clench = Math.floor(eyesy.knob1 * (0.156 * this.xr) - (this.xr * 0.078));
    }
    
    // Top row
    for (let i = 0; i < 10; i++) {
      const colorRate = (i * (eyesy.knob4 * 0.01) + this.lastcol2) % 1.0;
      const color = eyesy.color_picker(colorRate);
      const x = (i * teethWidth) + teethWidth / 2;
      const y0 = 0;
      const audioL = Math.abs((eyesy.audio_in[i] || 0) / 85);
      const y1 = y0 + audioL + clench;
      
      canvas.line([x, y0], [x, y1], color, teethWidth);
      
      if (shape === 1) {
        // Draw triangle (filled trigon)
        const points: [number, number][] = [
          [x - teethWidth / 2, y1],
          [x, y1 + teethWidth / 2],
          [x + teethWidth / 2, y1]
        ];
        canvas.polygon(points, color, 0);
      }
      if (shape >= 2) {
        // Draw circle
        canvas.circle([Math.floor(x), Math.floor(y1)], Math.floor(teethWidth / 2), color, 0);
      }
    }
    
    // Bottom row
    for (let i = 10; i < 20; i++) {
      const colorRate = (i * (eyesy.knob4 * 0.01) + this.lastcol2) % 1.0;
      const color = eyesy.color_picker(colorRate);
      const x = ((i - 10) * teethWidth) + teethWidth / 2;
      const y0 = this.yr;
      const audioR = Math.abs((eyesy.audio_in[i] || 0) / 85);
      const y1 = y0 - audioR - clench;
      
      canvas.line([x, y0], [x, y1], color, teethWidth);
      
      if (shape === 1) {
        // Draw triangle (filled trigon)
        const points: [number, number][] = [
          [x - teethWidth / 2, y1],
          [x, y1 - teethWidth / 2],
          [x + teethWidth / 2, y1]
        ];
        canvas.polygon(points, color, 0);
      }
      if (shape >= 2) {
        // Draw circle
        canvas.circle([Math.floor(x), Math.floor(y1)], Math.floor(teethWidth / 2), color, 0);
      }
    }
    
    this.lastcol2 = (19 * (eyesy.knob4 * 0.01) + this.lastcol2) % 1.0;
  }
}
