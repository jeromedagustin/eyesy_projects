import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Oscilloscope
 * Ported from Python version
 */
export class Oscilloscope implements Mode {
  private xr = 0;
  private yr = 0;
  private lastPoint: [number, number] = [0, 0];
  private x200 = 0;
  private x110 = 0;
  private a75 = 0;
  private x15 = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lastPoint = [0, this.yr / 2];
    this.x200 = Math.floor(this.xr * 0.156);
    this.x110 = Math.floor(this.xr * 0.234);
    this.a75 = Math.floor(this.xr * 0.391);
    this.x15 = Math.floor(this.xr * 0.02) + 1;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    // Shadow
    for (let i = 0; i < 50; i++) {
      this.bgLineSeg(canvas, eyesy, i);
    }

    // Scope
    for (let i = 0; i < 50; i++) {
      this.lineSeg(canvas, eyesy, i);
    }
  }

  private lineSeg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const linewidth = Math.floor(eyesy.knob1 * this.x110) + 1;
    // Use AudioScope for consistent normalization and microphone checking
    const audioVal = AudioScope.getSampleClamped(eyesy, i * 2);
    const y1 = Math.floor((eyesy.knob2 * this.yr) + (audioVal * this.yr));
    const x = i * this.x15;
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.01);

    if (i === 0) {
      this.lastPoint = [this.x110 * -1, this.yr / 2];
    }

    canvas.circle(this.lastPoint, linewidth * 0.49, color, 0);

    if (i === 49) {
      canvas.circle([x, y1], linewidth * 0.49, color, 0);
    }

    canvas.line(this.lastPoint, [x, y1], color, linewidth);
    this.lastPoint = [x, y1];
  }

  private bgLineSeg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const shadow = Math.floor(this.xr * 0.078);
    const linewidth = Math.floor(eyesy.knob1 * this.x110) + 1;
    // Use AudioScope for consistent normalization and microphone checking
    const audioVal = AudioScope.getSampleClamped(eyesy, i * 2);
    const y1 = Math.floor((eyesy.knob2 * this.yr) + (audioVal * this.yr));
    const x = i * this.x15;

    if (i === 0) {
      this.lastPoint = [this.x110 * -1, this.yr / 2];
    }

    const col1 = (eyesy.bg_color[0] * eyesy.knob3) / 1.0;
    const col2 = (eyesy.bg_color[1] * eyesy.knob3) / 1.0;
    const col3 = (eyesy.bg_color[2] * eyesy.knob3) / 1.0;
    const shadowColor: [number, number, number] = [Math.floor(col1), Math.floor(col2), Math.floor(col3)];

    const shadowX = this.lastPoint[0] - shadow * eyesy.knob3;
    const shadowY = this.lastPoint[1] + shadow * eyesy.knob3;
    const shadowX2 = x - shadow * eyesy.knob3;
    const shadowY2 = y1 + shadow * eyesy.knob3;

    canvas.circle([shadowX, shadowY], linewidth * 0.49, shadowColor, 0);

    if (i === 49) {
      canvas.circle([shadowX2, shadowY2], linewidth * 0.49, shadowColor, 0);
    }

    canvas.line([shadowX, shadowY], [shadowX2, shadowY2], shadowColor, linewidth);
    this.lastPoint = [x, y1];
  }
}



