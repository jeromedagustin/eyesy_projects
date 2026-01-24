import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Radial Scope - Rotate Stepped Color
 * Ported from Python version
 * 
 * Knob1 - rotation rate and direction
 * Knob2 - scope diameter
 * Knob3 - line width & circle size
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Radialscoperotatesteppedcolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private xr2 = 0;
  private yr2 = 0;
  private x800 = 0;
  private x20 = 0;
  private rotationAngle = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.yr2 = this.yr * 0.5;
    this.xr2 = this.xr * 0.5;
    this.x800 = this.xr * 0.625; // at 1280, x800 = 800
    this.x20 = this.xr * 0.016;
    this.rotationAngle = 0;
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number, angle: number): void {
    // Color rate calculation - stepped color based on position
    const colorRate = (i * (1 / (75 * (eyesy.knob4 + 0.001)))) % 1.0;
    const color = eyesy.color_picker(colorRate);
    
    const R1 = Math.floor(eyesy.knob2 * this.x800);
    const R = R1 + (Math.abs(eyesy.audio_in[i] || 0) / ((this.x800 * 20 / (R1 + 1)) + 1));
    const x = R * Math.cos((i / 75.0) * 6.28) + this.xr2;
    const y = R * Math.sin((i / 75.0) * 6.28) + this.yr2;
    const sel = eyesy.knob3 * 2;
    let circleSize = 0;
    let lineWidth = 0;
    
    // Apply rotation
    const radAngle = (angle * Math.PI) / 180;
    const rotatedX = (x - this.xr / 2) * Math.cos(radAngle) - (y - this.yr / 2) * Math.sin(radAngle) + this.xr / 2;
    const rotatedY = (x - this.xr / 2) * Math.sin(radAngle) + (y - this.yr / 2) * Math.cos(radAngle) + this.yr / 2;
    
    if (sel < 1) {
      lineWidth = Math.floor((1 - sel) * this.x20) + 1;
      circleSize = Math.floor((1 - sel) * (this.x20 - 2)) + 1;
      canvas.line([this.xr2, this.yr2], [rotatedX, rotatedY], color, lineWidth);
      canvas.circle([Math.floor(rotatedX), Math.floor(rotatedY)], circleSize, color, 0);
    }
    if (sel >= 1) {
      lineWidth = Math.floor((sel - 1) * this.x20) + 1;
      circleSize = 0;
      canvas.line([this.xr2, this.yr2], [rotatedX, rotatedY], color, lineWidth);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Control rotation rate and direction with eyesy.knob1
    let rotationIncrement = 0;
    if (eyesy.knob1 >= 0.48 && eyesy.knob1 <= 0.52) {
      rotationIncrement = 0; // No rotation
    } else {
      rotationIncrement = (eyesy.knob1 - 0.5) * 25; // Map knob1 value from 0-1 to -1 to 1
    }
    this.rotationAngle += rotationIncrement; // Increment the rotation angle based on knob1
    
    for (let i = 0; i < 75; i++) {
      this.seg(canvas, eyesy, i, this.rotationAngle);
    }
  }
}
