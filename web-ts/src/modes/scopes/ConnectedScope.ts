import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Connected Scope
 * Ported from Python version
 */
export class ConnectedScope implements Mode {
  private lastPoint: [number, number] = [0, 360];
  private firstPoint: [number, number] = [0, 0];

  setup(canvas: Canvas, eyesy: EYESY): void {
    // No setup needed
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    const sel = eyesy.knob4 * 8;
    eyesy.color_picker_bg(eyesy.knob5);

    for (let i = 0; i < 100; i++) {
      const color = this.getColor(sel, i);
      this.lineSeg(canvas, eyesy, i, color);
      this.ballSeg(canvas, eyesy, i, color);
    }

    // Random rectangles
    for (let i = 0; i < Math.floor(eyesy.knob3 * 100); i++) {
      const x = Math.floor(Math.random() * 1280);
      const y = Math.floor(Math.random() * 720);
      const color = this.getColor(sel, i);
      canvas.rect(x, y, 5, 5, color, 0);
    }
  }

  private getColor(sel: number, i: number): [number, number, number] {
    const time = Date.now() * 0.001;
    if (sel >= 7) {
      return [
        Math.floor(127 + 127 * Math.sin(i * 0.1 + time)),
        Math.floor(127 + 127 * Math.sin(i * 0.05 + time)),
        Math.floor(127 + 127 * Math.sin(i * 0.01 + time)),
      ];
    } else if (sel >= 6 && sel < 7) {
      return [205, 200, Math.floor(127 + 127 * Math.sin(i * 0.1 + time))];
    } else if (sel >= 5 && sel < 6) {
      return [255, Math.floor(127 + 127 * Math.sin(i * 0.1 + time)), 127];
    } else if (sel >= 4 && sel < 5) {
      return [Math.floor(127 + 127 * Math.sin(i * 0.1 + time)), 255, 127];
    } else if (sel >= 3 && sel < 4) {
      return [42, 75, Math.floor(127 + 127 * Math.sin(i * 0.1 + time))];
    } else if (sel >= 2 && sel < 3) {
      return [75, Math.floor(127 + 127 * Math.sin(i * 0.1 + time)), 42];
    } else if (sel >= 1 && sel < 2) {
      return [Math.floor(127 + 127 * Math.sin(i * 0.1 + time)), 42, 75];
    } else {
      const val = Math.floor(127 + 127 * Math.sin(i * 0.1 + time));
      return [val, val, val];
    }
  }

  private lineSeg(canvas: Canvas, eyesy: EYESY, i: number, color: [number, number, number]): void {
    const linewidth = Math.floor(eyesy.knob1 * 75) + 1;
    const audioIndex = Math.min(i, eyesy.audio_in.length - 1);
    const y1 = Math.floor(eyesy.yres / 2) + ((eyesy.audio_in[audioIndex] || 0) / 50);
    const x = i * 10;
    const xoffset = Math.floor((1280 - 99 * 10) / 2);

    if (i === 0) {
      this.firstPoint = this.lastPoint;
    }

    canvas.line(this.lastPoint, [x + xoffset, y1], color, linewidth);
    this.lastPoint = [x + xoffset, y1];
  }

  private ballSeg(canvas: Canvas, eyesy: EYESY, i: number, color: [number, number, number]): void {
    const ballwidth = Math.floor(eyesy.knob2 * 75) + 1;
    const audioIndex = Math.min(i, eyesy.audio_in.length - 1);
    const y1 = Math.floor(eyesy.yres / 2) + ((eyesy.audio_in[audioIndex] || 0) / 50);
    const x = i * 10;
    const xoffset = Math.floor((1280 - 99 * 10) / 2);
    canvas.circle([x + xoffset, y1], ballwidth, color, 0);
  }
}

