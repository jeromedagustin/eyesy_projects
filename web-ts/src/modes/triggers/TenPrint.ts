import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - 10 Print
 * Ported from Python version
 */
export class TenPrint implements Mode {
  private lines: [number, number, number, number][] = [];
  private squares = 40;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.lines = this.generateLines(this.squares, eyesy);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const sel = eyesy.knob4 * 8;
    const thickness = Math.floor(1 + eyesy.knob1 * 20);
    this.squares = Math.floor(40 + 80 * eyesy.knob3);

    const audioTrigger = eyesy.trig;

    if (audioTrigger) {
      this.lines = this.generateLines(this.squares, eyesy);
      for (let p = 0; p < this.lines.length; p++) {
        const line = this.lines[p];
        const l1: [number, number] = [line[2], line[3]];
        const l2: [number, number] = [line[0], line[1]];
        const color = this.getColor(sel, p);
        canvas.line(l1, l2, color, thickness);
      }
    } else {
      for (let p = 0; p < this.lines.length; p++) {
        const line = this.lines[p];
        const audioIndex = p % eyesy.audio_in.length;
        const rotationAngle = eyesy.audio_in[audioIndex] * 0.01 * eyesy.knob2;
        const [l1, l2] = this.rotateLinePoints(
          [line[0], line[1]],
          [line[2], line[3]],
          rotationAngle
        );
        const color = this.getColor(sel, p);
        canvas.line(l1, l2, color, thickness);
      }
    }
  }

  private generateLines(squares: number, eyesy: EYESY): [number, number, number, number][] {
    const lines: [number, number, number, number][] = [];
    for (let x = 0; x < 1280; x += squares) {
      for (let y = 0; y < 720; y += squares) {
        if (Math.random() > 0.5) {
          lines.push([x, y, x + squares, y + squares]);
        } else {
          lines.push([x, y + squares, x + squares, y]);
        }
      }
    }
    return lines;
  }

  private rotate(origin: [number, number], point: [number, number], angle: number): [number, number] {
    const [ox, oy] = origin;
    const [px, py] = point;
    const rad = (angle * Math.PI) / 180;
    const qx = ox + Math.cos(rad) * (px - ox) - Math.sin(rad) * (py - oy);
    const qy = oy + Math.sin(rad) * (px - ox) + Math.cos(rad) * (py - oy);
    return [qx, qy];
  }

  private rotateLinePoints(
    start: [number, number],
    end: [number, number],
    degrees: number
  ): [[number, number], [number, number]] {
    const [startx, starty] = start;
    const [endx, endy] = end;
    const middleX = (startx + endx) / 2;
    const middleY = (starty + endy) / 2;
    const newStart = this.rotate([middleX, middleY], start, degrees);
    const newEnd = this.rotate([middleX, middleY], end, degrees);
    return [newStart, newEnd];
  }

  private getColor(sel: number, p: number): [number, number, number] {
    const time = Date.now() * 0.001;
    if (sel >= 7) {
      return [
        Math.floor(127 + 127 * Math.sin(p * 0.1 + time)),
        Math.floor(127 + 127 * Math.sin(p * 0.05 + time)),
        Math.floor(127 + 127 * Math.sin(p * 0.01 + time)),
      ];
    } else if (sel >= 6 && sel < 7) {
      return [205, 200, Math.floor(127 + 127 * Math.sin(p * 0.1 + time))];
    } else if (sel >= 5 && sel < 6) {
      return [255, Math.floor(127 + 127 * Math.sin(p * 0.1 + time)), 127];
    } else if (sel >= 4 && sel < 5) {
      return [Math.floor(127 + 127 * Math.sin(p * 0.1 + time)), 255, 127];
    } else if (sel >= 3 && sel < 4) {
      return [42, 75, Math.floor(127 + 127 * Math.sin(p * 0.1 + time))];
    } else if (sel >= 2 && sel < 3) {
      return [75, Math.floor(127 + 127 * Math.sin(p * 0.1 + time)), 42];
    } else if (sel >= 1 && sel < 2) {
      return [Math.floor(127 + 127 * Math.sin(p * 0.1 + time)), 42, 75];
    } else {
      const val = Math.floor(127 + 127 * Math.sin(p * 0.1 + time));
      return [val, val, val];
    }
  }
}





