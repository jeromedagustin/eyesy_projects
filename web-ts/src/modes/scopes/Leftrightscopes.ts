import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Left & Right Scopes
 * Ported from Python version
 * 
 * Knob1 - left scope x position
 * Knob2 - right scope x position
 * Knob3 - line width
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Leftrightscopes implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const w100 = this.yr * 0.045; // max line width

    // First scope - LEFT
    for (let i = 0; i < 50; i++) {
      const x0 = Math.floor(eyesy.knob1 * (this.xr * 0.5));
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const x1 = x0 + (audioVal * (32768 / 35)); // Scale to match original behavior
      const y = i * (this.yr / 48);
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      canvas.line([x0, y], [x1, y], color, Math.floor(eyesy.knob3 * w100 + 1));
    }

    // Second scope - RIGHT (uses: eyesy.audio_in_r[], but we'll use same channel for consistency)
    for (let i = 0; i < 50; i++) {
      const x0 = Math.floor((eyesy.knob2 * (this.xr * 0.5)) + (this.xr * 0.5));
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const x1 = x0 + (audioVal * (32768 / 35)); // Scale to match original behavior
      const y = i * (this.yr / 48);
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      canvas.line([x0, y], [x1, y], color, Math.floor(eyesy.knob3 * w100 + 1));
    }
  }
}
