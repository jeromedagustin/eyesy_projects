import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Arcway Black
 * Ported from Python version
 * 
 * Knob1 - line width/length
 * Knob2 - rate of rotation (left half = counter clockwise, right half = clockwise)
 * Knob3 - offset of bottom disc
 * Knob4 - color of discs
 * Knob5 - background color
 */
export class Arcwayblack implements Mode {
  private xr = 1280;
  private yr = 720;
  private xresHalf = 640;
  private yresHalf = 360;
  private toplimit = 0;
  private leftlimit = 0;
  private squareX = 0;
  private rotationFactor = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.xresHalf = Math.floor(eyesy.xres / 2);
    this.yresHalf = Math.floor(eyesy.yres / 2);
    this.toplimit = Math.floor(this.yr * 0.153);
    this.leftlimit = Math.floor(this.xr * 0.305);
    this.squareX = Math.floor(this.xr * 0.391);
    this.rotationFactor = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    let startAngle = 0;
    let stopAngle = Math.PI / 50;
    const width = Math.floor(eyesy.knob1 * 65) + 1;
    const sizer = Math.floor(this.xr * 0.098);
    
    // Rate of rotation
    if (eyesy.knob2 <= 0.5) {
      this.rotationFactor += eyesy.knob2 * 2;
    } else {
      this.rotationFactor -= (eyesy.knob2 * 2 - 1);
    }
    const rotationDetune = eyesy.knob3; // offset the bottom disc
    
    for (let i = 0; i < 100; i++) {
      // BOTTOM DISC - always black
      const color: [number, number, number] = [0, 0, 0];
      
      const centerX = this.xresHalf - Math.floor(this.xr * 0.195);
      const centerY = this.yresHalf - Math.floor(this.squareX / 2);
      const audioOffset = (eyesy.audio_in[i] || 0) / 500;
      const x = centerX + sizer * Math.cos(2 * Math.PI * i / 100) + audioOffset - 0.1 * width;
      const y = centerY + sizer * Math.sin(2 * Math.PI * i / 100) + audioOffset - 0.1 * width;
      
      const start = startAngle + 2 * Math.PI * (this.rotationFactor - rotationDetune);
      const end = stopAngle + 2 * Math.PI * (this.rotationFactor - rotationDetune);
      
      canvas.arc(
        [x, y],
        this.squareX / 2,
        this.squareX / 2,
        start,
        end,
        color,
        width
      );
      
      // TOP DISC
      const color2 = eyesy.color_picker_lfo(eyesy.knob4);
      const x2 = centerX + sizer * Math.cos(2 * Math.PI * i / 100) + audioOffset + 0.1 * width;
      const y2 = centerY + sizer * Math.sin(2 * Math.PI * i / 100) + audioOffset + 0.1 * width;
      
      const start2 = startAngle + 2 * Math.PI * this.rotationFactor;
      const end2 = stopAngle + 2 * Math.PI * this.rotationFactor;
      
      canvas.arc(
        [x2, y2],
        this.squareX / 2,
        this.squareX / 2,
        start2,
        end2,
        color2,
        width
      );
      
      startAngle += Math.PI / 50;
      stopAngle += Math.PI / 50;
    }
  }
}
