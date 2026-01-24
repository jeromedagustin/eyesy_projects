import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - 10 Print
 * Ported from Python version
 * 
 * Knob1 - line thickness
 * Knob2 - rotation amount
 * Knob3 - square size
 * Knob4 - foreground color
 * Knob5 - background color
 */
function rotate(origin: [number, number], point: [number, number], angle: number): [number, number] {
  const [ox, oy] = origin;
  const [px, py] = point;
  const qx = ox + Math.cos(angle) * (px - ox) - Math.sin(angle) * (py - oy);
  const qy = oy + Math.sin(angle) * (px - ox) + Math.cos(angle) * (py - oy);
  return [qx, qy];
}

function rotateLinePoints(
  start: [number, number],
  end: [number, number],
  degrees: number
): [[number, number], [number, number]] {
  const [startx, starty] = start;
  const [endx, endy] = end;
  const middleX = (startx + endx) / 2;
  const middleY = (starty + endy) / 2;
  const inRadians = (degrees * Math.PI) / 180;
  const newStart = rotate([middleX, middleY], start, inRadians);
  const newEnd = rotate([middleX, middleY], end, inRadians);
  return [newStart, newEnd];
}

function generateLines(squares: number, eyesy: EYESY): Array<[number, number, number, number]> {
  const lines: Array<[number, number, number, number]> = [];
  for (let x = 0; x < eyesy.xres; x += squares) {
    for (let y = 0; y < eyesy.yres; y += squares) {
      if (Math.random() > 0.5) {
        lines.push([x, y, x + squares, y + squares]);
      } else {
        lines.push([x, y + squares, x + squares, y]);
      }
    }
  }
  return lines;
}

export class Mode10print implements Mode {
  private lines: Array<[number, number, number, number]> = [];
  private squares = 40;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.lines = generateLines(this.squares, eyesy);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const sel = eyesy.knob4 * 8;
    const thickness = Math.floor(1 + eyesy.knob1 * 20);
    this.squares = Math.floor(40 + 80 * eyesy.knob3);
    
    // Use audio_trig if available (test runner), otherwise use trig (official API)
    const audioTrigger = eyesy.audio_trig || eyesy.trig;
    
    if (audioTrigger) {
      this.lines = generateLines(this.squares, eyesy);
      for (let p = 0; p < this.lines.length; p++) {
        const line = this.lines[p];
        const l1: [number, number] = [line[2], line[3]];
        const l2: [number, number] = [line[0], line[1]];
        
        let color: [number, number, number];
        if (sel >= 7) {
          color = [
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.05 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.01 + eyesy.time))
          ];
        } else if (sel >= 1 && sel < 2) {
          color = [Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 42, 75];
        } else if (sel >= 2 && sel < 3) {
          color = [75, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 42];
        } else if (sel >= 3 && sel < 4) {
          color = [42, 75, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time))];
        } else if (sel >= 4 && sel < 5) {
          color = [Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 255, 127];
        } else if (sel >= 5 && sel < 6) {
          color = [255, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 127];
        } else if (sel >= 6 && sel < 7) {
          color = [205, 200, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time))];
        } else {
          color = [
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time))
          ];
        }
        
        canvas.line(l1, l2, color, thickness);
      }
    } else {
      for (let p = 0; p < this.lines.length; p++) {
        const line = this.lines[p];
        const audioIdx = p % eyesy.audio_in.length;
        const rotationAngle = (eyesy.audio_in[audioIdx] || 0) * 0.01 * eyesy.knob2;
        const [l1, l2] = rotateLinePoints([line[0], line[1]], [line[2], line[3]], rotationAngle);
        
        let color: [number, number, number];
        if (sel >= 7) {
          color = [
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.05 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.01 + eyesy.time))
          ];
        } else if (sel >= 1 && sel < 2) {
          color = [Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 42, 75];
        } else if (sel >= 2 && sel < 3) {
          color = [75, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 42];
        } else if (sel >= 3 && sel < 4) {
          color = [42, 75, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time))];
        } else if (sel >= 4 && sel < 5) {
          color = [Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 255, 127];
        } else if (sel >= 5 && sel < 6) {
          color = [255, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)), 127];
        } else if (sel >= 6 && sel < 7) {
          color = [205, 200, Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time))];
        } else {
          color = [
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time)),
            Math.floor(127 + 127 * Math.sin((p * 1) * 0.1 + eyesy.time))
          ];
        }
        
        canvas.line(l1, l2, color, thickness);
      }
    }
  }
}
