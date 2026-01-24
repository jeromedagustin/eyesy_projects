import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Two Scopes
 * Ported from Python version
 */
export class TwoScopes implements Mode {
  private xr = 0;
  private yr = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const w100 = this.yr * 0.045; // max line width

    // First scope
    for (let i = 0; i < 50; i++) {
      const x0 = Math.floor(eyesy.knob1 * this.xr);
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const x1 = x0 + (audioVal * 35); // audioVal is already normalized -1.0 to 1.0
      const y = i * (this.yr / 48);
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      canvas.line([x0, y], [x1, y], color, Math.floor(eyesy.knob3 * w100 + 1));
    }

    // Second scope
    for (let i = 51; i < 100; i++) {
      const x0 = Math.floor(eyesy.knob2 * this.xr);
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const x1 = x0 + (audioVal * 35); // audioVal is already normalized -1.0 to 1.0
      const y = (i - 50) * (this.yr / 48);
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      canvas.line([x0, y], [x1, y], color, Math.floor(eyesy.knob3 * w100 + 1));
    }
  }
}




