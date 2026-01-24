import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Aquarium
 * Ported from Python version
 * 
 * Knob1 - number of 'fish'
 * Knob2 - fish length
 * Knob3 - line width
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Aquarium implements Mode {
  private xr = 1280;
  private yr = 720;
  private widthmax = 0;
  private speedList: number[] = [];
  private yList: number[] = [];
  private widthList: number[] = [];
  private countList: number[] = [];
  private xden = 1;
  private yden = 1;
  private trigger = false;
  private colorDirection = 1;
  private colorRate = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.widthmax = Math.floor(this.xr * 0.156);
    this.initializeLists();
  }

  private initializeLists(): void {
    this.speedList = [];
    this.yList = [];
    this.widthList = [];
    this.countList = [];
    for (let i = 0; i < 20; i++) {
      // Python: random.randrange(-2,2)+.1 gives -1.9 to 1.9
      this.speedList.push((Math.random() * 4 - 2) + 0.1);
      this.yList.push(Math.random() * (this.yr + 100) - 50);
      this.widthList.push(Math.floor(Math.random() * (this.widthmax - 20) + 20));
      this.countList.push(i);
    }
  }

  private updateColor(sel: number, eyesy: EYESY): [number, number, number] {
    if (sel < 1) {
      return eyesy.color_picker(eyesy.knob4 * 2);
    } else {
      const increment = Math.abs(sel - 1) * 0.05;
      this.colorRate += increment * this.colorDirection;
      if (this.colorRate >= 1.0) {
        this.colorRate = 1.0;
        this.colorDirection = -1; // Start decrementing
      }
      if (this.colorRate <= 0.0) {
        this.colorRate = 0.0;
        this.colorDirection = 1; // Start incrementing
      }
      return eyesy.color_picker(this.colorRate);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const sel = eyesy.knob4 * 2; // color selector
    const newYden = Math.floor(eyesy.knob1 * 19) + 1;
    const newXden = Math.floor(eyesy.knob2 * 19) + 1;
    
    if (this.yden !== newYden) {
      this.yden = newYden;
      // Python reinitializes all lists when yden changes
      this.initializeLists();
    }
    if (this.xden !== newXden) {
      this.xden = newXden;
      // Python reinitializes all lists when xden changes
      this.initializeLists();
    }
    
    for (let i = 0; i < this.yden; i++) {
      const y0 = this.yList[i];
      const ymod = this.yr * 0.694;
      
      for (let j = 0; j < this.xden; j++) {
        const color = this.updateColor(sel, eyesy);
        const width = this.widthList[i];
        // Use AudioScope for consistent normalization and microphone checking
        const audioVal = AudioScope.getSample(eyesy, j + i);
        // audioVal is normalized -1.0 to 1.0, scale appropriately
        const y1 = y0 + (audioVal * (ymod / 32768));
        
        this.countList[i] = this.countList[i] + this.speedList[i];
        const modSpeed = this.countList[i] % (eyesy.xres + width * 2);
        const x = (j * (width / 5)) + (modSpeed - width);
        
        // Draw the vertical line representing a fish segment
        // Python: pygame.draw.line(screen, color, [x, y1], [x, y0], width)
        // Each fish is made of multiple vertical line segments that move horizontally together
        const lineWidth = Math.max(1, Math.floor(eyesy.knob3 * (this.xr * 0.078) + 1));
        canvas.line([x, y1], [x, y0], color, lineWidth);
      }
    }
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    if (this.trigger) {
      this.initializeLists();
      this.trigger = false;
    }
  }
}
