import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Grid Circles - Outlined Column Color
 * Ported from Python version
 * 
 * Knob1 - x offset
 * Knob2 - y offset
 * Knob3 - size of circles
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Gridcirclesoutlinedcolumncolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private x8 = 0;
  private y5 = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x8 = this.xr / 8;
    this.y5 = this.yr / 5;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const lineWidth = Math.floor(eyesy.xres * 0.00625);
    
    for (let i = 0; i < 7; i++) {
      const xoffset = Math.floor(eyesy.knob1 * this.x8);
      const yoffset = Math.floor(eyesy.knob2 * this.y5);
      
      for (let j = 0; j < 10; j++) {
        let x = j * this.x8;
        let y = i * this.y5;
        
        const rad = Math.abs(((eyesy.audio_in[j + i] || 0) / 32768) * this.xr * 0.1);
        const restRad = Math.floor(eyesy.knob3 * (this.xr * 0.023)) + 1;
        const radius = rad + restRad;
        
        if ((i % 2) === 1) {
          x = j * this.x8 + xoffset;
        }
        if ((j % 2) === 1) {
          y = i * this.y5 + yoffset;
        }
        
        // Column color - color varies by column (j)
        const color = eyesy.color_picker(((j * 0.1) + eyesy.knob4) % 1.0);
        
        // Draw outlined circle with partial quadrants
        // Top-left and bottom-right quadrants (filled)
        canvas.arc([x, y], radius, radius, Math.PI, Math.PI * 1.5, color, 0);
        canvas.arc([x, y], radius, radius, 0, Math.PI * 0.5, color, 0);
        
        // Top-right and bottom-left quadrants (outlined)
        canvas.arc([x, y], radius, radius, Math.PI * 1.5, Math.PI * 2, color, lineWidth);
        canvas.arc([x, y], radius, radius, Math.PI * 0.5, Math.PI, color, lineWidth);
      }
    }
  }
}
