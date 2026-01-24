import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Grid Slide Square - Unfilled Column Color
 * Ported from Python version
 * 
 * Knob1 - LFO step amount
 * Knob2 - LFO start position
 * Knob3 - size of squares
 * Knob4 - foreground color
 * Knob5 - background color
 */
class LFO {
  public start: number;
  public max: number;
  public step: number;
  private current: number;
  private direction: number;

  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = 0;
    this.direction = 1;
  }

  update(deltaTime: number): number {
    this.current += this.step * this.direction * deltaTime;
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max;
    }
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start;
    }
    return this.current;
  }
}

export class Gridslidesquareunfilledcolumncolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private x8 = 0;
  private y5 = 0;
  private hund = 0;
  private otwen = 0;
  private drei = 0;
  private linew = 0;
  private sqmover: LFO;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x8 = this.xr / 8;
    this.y5 = this.yr / 5;
    this.hund = this.xr * 0.07734;
    this.otwen = this.xr * 0.09375;
    this.drei = Math.floor(this.xr * 0.00234);
    if (this.drei === 0) {
      this.drei = 1;
    }
    this.linew = Math.floor(this.xr * 0.0026);
    this.sqmover = new LFO(-this.otwen, this.otwen, 10);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    for (let i = 0; i < 7; i++) {
      this.sqmover.step = eyesy.knob1 * this.drei;
      this.sqmover.max = Math.floor(eyesy.knob2 * this.otwen);
      this.sqmover.start = Math.floor(eyesy.knob2 * -this.otwen);
      const xoffset = -this.sqmover.update(eyesy.deltaTime);
      const yoffset = this.sqmover.update(eyesy.deltaTime) * 0.8;
      
      for (let j = 0; j < 10; j++) {
        let x = (j * this.x8) - this.x8;
        let y = (i * this.y5) - this.y5;
        
        // Handle negative indices like Python (wrap around)
        const audioLen = eyesy.audio_in.length;
        const audioIndex = audioLen > 0 ? ((j - i) % audioLen + audioLen) % audioLen : 0;
        const rad = Math.abs((eyesy.audio_in[audioIndex] || 0) / this.hund);
        const width = Math.floor(eyesy.knob3 * this.hund) + 1;
        
        if ((i % 2) === 1) {
          x = (j * this.x8) - this.x8 + xoffset;
        }
        if ((j % 2) === 1) {
          y = (i * this.y5) - this.y5 + yoffset;
        }
        
        // Column color - color varies by column (j)
        const color = eyesy.color_picker(((j * 0.1) + eyesy.knob4) % 1.0);
        
        const rectX = x - (width / 2) - rad;
        const rectY = y - (width / 2) - rad;
        const rectWidth = width + (rad * 2);
        const rectHeight = width + (rad * 2);
        
        canvas.rect(rectX, rectY, rectWidth, rectHeight, color, this.linew);
      }
    }
  }
}
