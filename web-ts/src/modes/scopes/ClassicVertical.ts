import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Classic Vertical
 * Ported from Python version
 */
export class ClassicVertical implements Mode {
  private lines = 100;
  private spacing = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.spacing = eyesy.yres / this.lines;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    for (let i = 0; i < this.lines; i++) {
      this.seg(canvas, eyesy, i);
    }
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const x0 = 0;
    // Use AudioScope for consistent normalization and microphone checking
    const audioVal = AudioScope.getSampleClamped(eyesy, i);
    const x1 = audioVal * eyesy.xres * (eyesy.knob3 + 0.5);
    const y = i * this.spacing;
    const linewidth = Math.max(1, Math.floor(eyesy.knob1 * this.spacing));
    const position = Math.floor(0.5 * eyesy.xres);
    const ballSize = Math.max(1, Math.floor(eyesy.knob2 * (this.spacing * 7)));
    const color = eyesy.color_picker_lfo(eyesy.knob4);

    canvas.circle([x1 + position, y], ballSize, color, 0);
    canvas.line(
      [x0 + position, y],
      [x1 + position, y],
      color,
      linewidth
    );
  }
}

