import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Grid Triangles - Filled Column Color
 * Ported from Python version
 * 
 * Knob1 - x offset
 * Knob2 - y offset
 * Knob3 - size of triangles
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Gridtrianglesfilledcolumncolor implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const x8 = this.xr / 8;
    const y5 = this.yr / 5;
    
    for (let i = 0; i < 7; i++) {
      const xoffset = Math.floor(eyesy.knob1 * x8);
      const yoffset = Math.floor(eyesy.knob2 * y5);
      
      for (let j = 0; j < 10; j++) {
        let x = j * x8;
        let y = i * y5;
        
        // Handle negative indices like Python (wrap around)
        const audioLen = eyesy.audio_in.length;
        const audioIndex = audioLen > 0 ? ((j - i) % audioLen + audioLen) % audioLen : 0;
        const rad = Math.abs((eyesy.audio_in[audioIndex] || 0) * 0.00003058 * (this.xr * 0.1));
        const width = Math.floor(eyesy.knob3 * (this.xr * 0.063)) + 1;
        
        if ((i % 2) === 1) {
          x = j * x8 + xoffset;
        }
        if ((j % 2) === 1) {
          y = i * y5 + yoffset;
        }
        
        // Column color - color varies by column (j)
        const color = eyesy.color_picker(((j * 0.1) + eyesy.knob4) % 1.0);
        
        const points: [number, number][] = [
          [(x - width) - rad, (y + width) + rad],
          [x, (y - width) - rad],
          [(x + width) + rad, (y + width) + rad]
        ];
        
        canvas.polygon(points, color, 0);
      }
    }
  }
}
