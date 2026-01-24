import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Breezy Feather LFO
 * Ported from Python version
 * 
 * Knob1 - rate of change for number of triangles
 * Knob2 - feather angle
 * Knob3 - y position step amount (bounce speed)
 * Knob4 - foreground color
 * Knob5 - background color
 */
class LFO {
  public start: number;
  public max: number;
  public step: number;
  public current: number;
  public direction: number;

  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = 0;
    this.direction = 1;
  }

  update(): number {
    this.current += this.step * this.direction;
    // When it gets to the top, flip direction
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max; // in case it steps above max
    }
    // When it gets to the bottom, flip direction
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start; // in case it steps below min
    }
    return this.current;
  }
}

export class Breezyfeatherlfo implements Mode {
  private xr = 1280;
  private yr = 720;
  private yposr: LFO;
  private tris: LFO;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.yposr = new LFO(0, 500, 10);
    this.tris = new LFO(2, 70, 1);
    this.yposr.start = Math.floor(this.yr - (this.yr * 1.05));
    this.yposr.max = Math.floor(this.yr * 1.05);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);

    this.tris.max = Math.floor(this.xr * 0.047);
    this.tris.step = Math.floor(eyesy.knob1 * (this.xr * 0.012));
    const triangles = this.tris.update() + 2;
    const space = Math.floor(this.xr / (triangles - 1));
    const offset = Math.floor((eyesy.knob2 * 2 - 1) * space * 4);
    this.yposr.step = Math.floor(eyesy.knob3 * (this.yr * 0.1));
    const y = this.yposr.update();

    // Draw base line
    canvas.line([0, y], [this.xr, y], color, 1);

    // Draw triangles
    for (let i = 0; i < triangles; i++) {
      // Use AudioScope for consistent audio handling
      // Python version uses audio_in[i] / 65
      const audioVal = AudioScope.getSampleClamped(eyesy, i, 65.0);
      const audio = Math.floor(audioVal * 32768);
      const ax = i * space;
      // Draw filled triangle (trigon)
      const trianglePoints: [number, number][] = [
        [ax, y],
        [ax + Math.floor(space / 2) + offset, audio + y],
        [ax + space, y]
      ];
      canvas.polygon(trianglePoints, color, 0);
    }
  }
}
