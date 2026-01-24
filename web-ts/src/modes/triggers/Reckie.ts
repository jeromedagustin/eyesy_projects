import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Reckie
 * Ported from Python version
 * 
 * Knob1 - rect width
 * Knob2 - rect height
 * Knob3 - corner shape & outline thickness
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Reckie implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private myRectX = 0;
  private myRectY = 0;
  private myRectW = 10;
  private myRectH = 10;
  private begin = true;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.begin = true;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const size100 = this.xr * 0.234;
    const xhalf = this.xr / 2;
    const yhalf = this.yr / 2;
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.5);
    const rectwidth = Math.floor((eyesy.knob1 * 1.5 * size100) + 10);
    const rectheight = Math.floor((eyesy.knob2 * 1.5 * size100) + 10);
    
    if (this.begin) {
      this.myRectX = xhalf - rectwidth / 2;
      this.myRectY = yhalf - rectheight / 2;
      this.begin = false;
    }
    
    this.myRectW = rectwidth;
    this.myRectH = rectheight;
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      // Pick a new position based on current position
      const set = Math.floor(Math.random() * 8);
      const centerX = this.myRectX + this.myRectW / 2;
      const centerY = this.myRectY + this.myRectH / 2;
      
      if (set === 0) { // up
        this.myRectY = this.myRectY - this.myRectH;
      } else if (set === 1) { // upright
        this.myRectX = this.myRectX + this.myRectW;
        this.myRectY = this.myRectY - this.myRectH;
      } else if (set === 2) { // upleft
        this.myRectX = this.myRectX - this.myRectW;
        this.myRectY = this.myRectY - this.myRectH;
      } else if (set === 3) { // left
        this.myRectX = this.myRectX - this.myRectW;
      } else if (set === 4) { // right
        this.myRectX = this.myRectX + this.myRectW;
      } else if (set === 5) { // downright
        this.myRectX = this.myRectX + this.myRectW;
        this.myRectY = this.myRectY + this.myRectH;
      } else if (set === 6) { // down
        this.myRectY = this.myRectY + this.myRectH;
      } else if (set === 7) { // downleft
        this.myRectX = this.myRectX - this.myRectW;
        this.myRectY = this.myRectY + this.myRectH;
      }
    }
    this.trigger = false;
    
    // Reset if out of bounds
    const centerX = this.myRectX + this.myRectW / 2;
    const centerY = this.myRectY + this.myRectH / 2;
    
    if (centerX <= 0 - rectwidth / 3) {
      this.myRectX = xhalf - rectwidth / 2;
      this.myRectY = yhalf - rectheight / 2;
    }
    if (centerX >= this.xr + rectwidth / 3) {
      this.myRectX = xhalf - rectwidth / 2;
      this.myRectY = yhalf - rectheight / 2;
    }
    if (centerY <= 0 - rectheight / 3) {
      this.myRectX = xhalf - rectwidth / 2;
      this.myRectY = yhalf - rectheight / 2;
    }
    if (centerY >= this.yr + rectheight / 3) {
      this.myRectX = xhalf - rectwidth / 2;
      this.myRectY = yhalf - rectheight / 2;
    }
    
    // Filled/Unfilled & Corner Radius Settings
    if (eyesy.knob3 < 0.5) {
      const strokeweight = Math.floor((0.5 - eyesy.knob3) * rectwidth) + 1;
      canvas.rect(this.myRectX, this.myRectY, this.myRectW, this.myRectH, color, strokeweight);
    } else {
      // Check the corner radius not too big
      let corner = 0;
      if (rectwidth < this.xr * 0.281) {
        corner = Math.floor(rectwidth / 4);
      } else {
        corner = Math.floor(this.xr * 0.068);
      }
      const strokeweight = Math.floor(Math.abs(0.5 - eyesy.knob3) * rectwidth) + 1;
      if (strokeweight * 2 < rectwidth && strokeweight * 2 < rectheight) {
        // Outlined with rounded corners (we'll use regular rect for now, rounded corners not directly supported)
        canvas.rect(this.myRectX, this.myRectY, this.myRectW, this.myRectH, color, strokeweight);
      } else {
        // Filled with rounded corners
        canvas.rect(this.myRectX, this.myRectY, this.myRectW, this.myRectH, color, 0);
      }
    }
  }
}
