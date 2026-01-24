import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Square Shadows - Uniform Color
 * Ported from Python version
 * 
 * Knob1 - Square Size
 * Knob2 - Shadow Control
 * Knob3 - Y Position
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Squareshadowsuniformcolor implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const x = Math.floor(eyesy.knob3 * this.xr) + ((eyesy.audio_in[i * 4] || 0) / 35);
    const y = i * (this.yr * 0.0402);
    const size125 = this.xr * 0.098;
    const squareSize = Math.floor(eyesy.knob1 * size125) + 1;
    const shad25 = this.xr * 0.020;
    
    // Shadow Squares
    const shadowColor: [number, number, number] = [0, 0, 0];
    const shadowX = x + (shad25 - Math.floor(eyesy.knob2 * 2 * shad25));
    const shadowY = y + (shad25 - Math.floor(eyesy.knob2 * 2 * shad25));
    canvas.line([shadowX, shadowY], [shadowX, shadowY + squareSize], shadowColor, squareSize);
    
    // Squares
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    canvas.line([x, y], [x, y + squareSize], color, squareSize);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    for (let i = 0; i < 25; i++) {
      this.seg(canvas, eyesy, i);
    }
  }
}
