import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Three Scopes
 * Ported from Python version
 */
export class ThreeScopes implements Mode {
  private xr = 0;
  private yr = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker_lfo(eyesy.knob4);
    const yhalf = this.yr / 2;
    const ythird = this.yr / 3;
    const y2third = (2 * this.yr) / 3;
    const step16 = this.xr * 0.0125;
    const wid = this.xr * 0.0328;
    const steppy = Math.floor(eyesy.knob1 * step16);
    const leftpoint = Math.floor(eyesy.knob2 * this.yr);
    const linewidth = Math.floor(eyesy.knob3 * wid + 1);
    const screendiv = this.xr / 60;

    // Bottom
    for (let i = 0; i < 30; i++) {
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const ay0 = ythird + leftpoint - steppy * i;
      const ay1 = ythird + leftpoint - steppy * i + audioVal * 128;
      const ax = i * screendiv;
      canvas.line([ax, ay1], [ax, ay0], color, linewidth);
    }

    // Top
    for (let i = 30; i < 60; i++) {
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const ay0 = y2third - leftpoint + steppy * (i - 30);
      const ay1 = y2third - leftpoint + steppy * (i - 30) + audioVal * 128;
      const ax = (i - 30) * screendiv;
      canvas.line([ax, ay1], [ax, ay0], color, linewidth);
    }

    // Right
    for (let i = 60; i < 94; i++) {
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const ay0 = yhalf;
      const ay1 = yhalf + audioVal * 80;
      const ax = (i - 30) * screendiv;
      canvas.line([ax, ay1], [ax, ay0], color, linewidth);
    }
  }
}




