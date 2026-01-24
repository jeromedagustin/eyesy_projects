import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Trigon Traveller
 * Ported from Python version
 * 
 * Knob1 - x travel direction
 * Knob2 - y travel direction
 * Knob3 - rotation amount when triggered
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Trigontraveller implements Mode {
  private xr = 1280;
  private yr = 720;
  private trot = 0;
  private x1 = 640;
  private y1 = 360;
  private trigger = false;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x1 = this.xr / 2;
    this.y1 = this.yr / 2;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const rotrate = 15 - eyesy.knob3 * 30;
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.trot = this.trot + rotrate;
    }
    this.trigger = false;
    
    const p100 = Math.floor(this.xr * 0.078); // int((100*xr)/1280)
    const p200 = Math.floor(this.xr * 0.156); // int((200*xr)/1280)
    const p400 = Math.floor(this.xr * 0.313); // int((400*xr)/1280)
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Create triangle shape: (0, p400), (p100, 0), (p200, p400)
    const trianglePoints: [number, number][] = [
      [0, p400],
      [p100, 0],
      [p200, p400]
    ];
    
    // Draw triangle at position (x1, y1) with rotation
    // We need to rotate the triangle around its center
    const centerX = p200 / 2;
    const centerY = p400 / 2;
    
    // Rotate points around center
    const rotatedPoints: [number, number][] = trianglePoints.map(([px, py]) => {
      const dx = px - centerX;
      const dy = py - centerY;
      const angle = (this.trot * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return [this.x1 - centerX + rx, this.y1 - centerY + ry] as [number, number];
    });
    
    canvas.polygon(rotatedPoints, color, 0);
    
    const speedx = (eyesy.knob1 * 50 - 25);
    const speedy = (eyesy.knob2 * 50 - 25);
    
    this.x1 = this.x1 + speedx;
    this.y1 = this.y1 + speedy;
    
    // Wrap around boundaries
    if (this.x1 < 0) this.x1 = this.xr;
    if (this.x1 > this.xr) this.x1 = 0;
    if (this.y1 < 0) this.y1 = this.yr;
    if (this.y1 > this.yr) this.y1 = 0;
  }
}
