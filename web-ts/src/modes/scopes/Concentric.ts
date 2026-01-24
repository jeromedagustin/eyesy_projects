import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Concentric
 * Ported from Python version
 * 
 * Knob1 - x position
 * Knob2 - y position
 * Knob3 - circle scaler
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Concentric implements Mode {
  setup(canvas: Canvas, eyesy: EYESY): void {
    // No setup needed
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    let x = Math.floor(eyesy.knob1 * eyesy.xres);
    const y = Math.floor(eyesy.knob2 * eyesy.yres);
    const circles = 10;

    for (let i = 1; i < circles; i++) {
      x = x + i / 3;
      const R = Math.floor((Math.abs((eyesy.audio_in[i] || 0) / 100) * eyesy.yres / eyesy.yres) * (eyesy.knob3 * i)) + 10;
      const color = eyesy.color_picker((eyesy.knob4 * i) % 1.0);
      canvas.circle([x, y], R, color, 0);
    }
  }
}
