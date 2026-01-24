import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Circle Scope - Opposite Colors
 * Ported from Python version
 * 
 * Knob1 - line & circle sizes
 * Knob2 - scope diameter
 * Knob3 - rotation rate
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Circlescopeoppositecolors implements Mode {
  private xr = 1280;
  private yr = 720;
  private lx = 0;
  private ly = 0;
  private begin = 0;
  private j = 0;
  private rotationAngle = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lx = this.xr / 2;
    this.ly = this.yr / 2;
    this.begin = 0;
    this.j = 0;
    this.rotationAngle = 0;
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number, angle: number, j: number): void {
    const crad = this.xr * 0.016;
    const sizer = eyesy.knob1 * 3;
    let lineSize = 1;
    let circSize = 0;
    
    if (sizer < 1) {
      lineSize = 1;
      circSize = sizer * 2 * crad;
    } else if (sizer >= 1 && sizer <= 2) {
      lineSize = (sizer - 1) * 22 + 1;
      circSize = 0;
    } else {
      lineSize = (sizer - 2) * 22 + 1;
      circSize = (sizer - 2) * 2 * crad + 3;
    }
    
    let R = ((eyesy.knob2 * 2) * (this.xr * 0.313)) - (this.xr * 0.117);
    R = R + ((eyesy.audio_in[j] || 0) / 100);
    let x = R * Math.cos((i / 50.0) * 6.28) + (this.xr / 2);
    let y = R * Math.sin((i / 50.0) * 6.28) + (this.yr / 2);
    
    // Apply rotation
    const radAngle = (angle * Math.PI) / 180;
    const rotatedX = (x - this.xr / 2) * Math.cos(radAngle) - (y - this.yr / 2) * Math.sin(radAngle) + this.xr / 2;
    const rotatedY = (x - this.xr / 2) * Math.sin(radAngle) + (y - this.yr / 2) * Math.cos(radAngle) + this.yr / 2;
    
    if (this.begin === 0) {
      this.ly = rotatedY;
      this.lx = rotatedX;
      this.begin = 1;
    }
    
    // Opposite colors - line uses inverted color, circle uses normal
    const lineColor = eyesy.color_picker((1 - (((i * eyesy.knob4) + 0.5) % 1)) % 1.0);
    canvas.line([this.lx, this.ly], [rotatedX, rotatedY], lineColor, Math.floor(lineSize));
    this.ly = rotatedY;
    this.lx = rotatedX;
    
    const circleColor = eyesy.color_picker(((i * eyesy.knob4) + 0.5) % 1.0);
    canvas.circle([Math.floor(rotatedX), Math.floor(rotatedY)], Math.floor(circSize), circleColor, 0);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Determine the rotation speed and direction based on eyesy.knob3
    if (eyesy.knob3 < 0.48) {
      this.rotationAngle -= (0.48 - eyesy.knob3) * 50; // Counter-clockwise
    } else if (eyesy.knob3 > 0.52) {
      this.rotationAngle += (eyesy.knob3 - 0.52) * 50; // Clockwise
    }
    
    for (let i = 0; i < 50; i++) {
      if (i <= 24) {
        this.j = this.j + 1;
        this.seg(canvas, eyesy, i, this.rotationAngle, this.j);
      }
      if (i >= 25) {
        this.j = this.j - 1;
        this.seg(canvas, eyesy, i, this.rotationAngle, this.j);
      }
    }
  }
}
