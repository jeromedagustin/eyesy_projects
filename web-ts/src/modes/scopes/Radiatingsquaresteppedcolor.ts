import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Radiating Square - Stepped Color
 * Ported from Python version
 * 
 * Knob1 - x origin point LFO rate
 * Knob2 - line width
 * Knob3 - endpoint LFO rate
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

export class Radiatingsquaresteppedcolor implements Mode {
  private sqmover: LFO;
  private adjust1: LFO;
  private adjust2: LFO;
  private xr = 1280;
  private yr = 720;
  private colorRate = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.sqmover = new LFO(-1 * (this.yr / 2), this.yr / 2, 0.01);
    this.adjust1 = new LFO(-50, 50, 0.01);
    this.adjust2 = new LFO(-100, 100, 0.01);
    this.colorRate = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    for (let i = 0; i < 100; i++) {
      const width = Math.floor(eyesy.knob2 * ((15 * this.xr) / this.xr)) + 1;

      // LFOs
      let adjuster1 = this.adjust1.update();
      this.adjust1.step = eyesy.knob1 / 50;
      let adjuster2 = this.adjust2.update();
      this.adjust2.step = eyesy.knob1 + 0.001;
      if (eyesy.knob1 === 0) {
        adjuster1 = adjuster2 = 0;
      }

      this.sqmover.step = eyesy.knob3 + 0.01;
      let angle = this.sqmover.update();
      if (eyesy.knob3 === 0) {
        angle = 0;
      }

      // Color
      this.colorRate = (i * (1 / (100 * (eyesy.knob4 + 0.001)))) % 1;
      const color = eyesy.color_picker(this.colorRate);

      // Use AudioScope for consistent audio handling
      // Python version uses audio_in[i] / 100, so we need raw value / 100
      // AudioScope returns normalized (-1 to 1), so multiply by 32768 to get raw, then divide by 100
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const audioScaled = (audioVal * 32768) / 100;
      
      // Lines
      if (i < 25) {
        const x0 = (((490 + adjuster1 * i) * this.xr) / this.xr) % this.xr;
        const x1 = x0 - Math.floor(audioScaled);
        const y = (((210 + i * 12 + adjuster2) * this.yr) / this.yr) % this.yr;
        canvas.line([x0, y], [x1, y - angle], color, width);
      } else if (i >= 25 && i < 50) {
        const x = (((190 + i * 12 + adjuster2) * this.xr) / this.xr) % this.xr;
        const y0 = (((510 + adjuster1 * i) * this.yr) / this.yr) % this.yr;
        const y1 = y0 + Math.floor(audioScaled);
        canvas.line([x, y0], [x + angle, y1], color, width);
      } else if (i >= 50 && i < 75) {
        const x0 = (((790 + adjuster1 * i) * this.xr) / this.xr) % this.xr;
        const x1 = x0 + Math.floor(audioScaled);
        const y = (((1110 - i * 12 + adjuster2) * this.yr) / this.yr) % this.yr;
        canvas.line([x0, y], [x1, y + angle], color, width);
      } else if (i >= 75 && i < 100) {
        const x = (((1690 - i * 12 + adjuster2) * this.xr) / this.xr) % this.xr;
        const y0 = (((210 + adjuster1 * i) * this.yr) / this.yr) % this.yr;
        const y1 = y0 - Math.abs(audioScaled);
        canvas.line([x, y0], [x - angle, y1], color, width);
      }

      if (i === 1) {
        const x = (((490 + adjuster2) * this.xr) / this.xr) % this.xr;
        const y0 = (((210 + adjuster1 * i) * this.yr) / this.yr) % this.yr;
        const y1 = y0 - Math.floor(audioScaled);
        canvas.line([x, y0], [x - angle, y1], color, width);
      }
    }
  }
}
