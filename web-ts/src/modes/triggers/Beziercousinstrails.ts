import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Bezier Cousins - Trails
 * Ported from Python version
 * 
 * Knob1 - how complex shape is
 * Knob2 - number of cousins
 * Knob3 - space between cousins & alpha channel
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Beziercousinstrails implements Mode {
  private xr = 1280;
  private yr = 720;
  private points: [number, number][] = [];
  private trigger = false;
  private pointNumber = 20;
  private points1: [number, number][] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    const x640 = Math.floor(this.xr * 0.5);
    const x45 = Math.floor(this.xr * 0.035);
    const x760 = Math.floor(this.xr * 0.593);
    const x90 = Math.floor(this.xr * 0.07);
    this.pointNumber = 20;
    this.points = [];
    for (let i = 1; i < this.pointNumber; i++) {
      this.points.push([
        Math.floor(Math.random() * (this.xr * 0.938)),
        Math.floor(Math.random() * (this.yr * 0.833))
      ]);
    }
    this.trigger = false;
    this.points.push(this.points[0]); // Close the loop
    this.points1 = [[x640, x640], [x45, x760], [x90, x90]];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const number = Math.floor(eyesy.knob2 * 5);
    const smooth = 6;
    const place = Math.floor(eyesy.knob3 * (this.xr * 0.14)) + 10;
    
    // Check for trigger
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    // Regenerate points on trigger
    if (this.trigger) {
      this.pointNumber = Math.floor(eyesy.knob1 * 16) + 4;
      // Ensure minimum points
      if (this.pointNumber < 3) this.pointNumber = 3;
      this.points = [];
      for (let i = 1; i < this.pointNumber; i++) {
        this.points.push([
          Math.floor(Math.random() * 20 + (this.xr * 0.97 - 20)),
          Math.floor(Math.random() * 20 + (this.yr * 0.95 - 20))
        ]);
      }
      // Close the loop
      if (this.points.length > 0) {
        this.points.push([this.points[0][0], this.points[0][1]]);
      }
      this.trigger = false;
    }
    
    // Ensure we have valid points
    if (this.points.length < 3) {
      // Initialize points if empty
      this.pointNumber = Math.floor(eyesy.knob1 * 16) + 4;
      if (this.pointNumber < 3) this.pointNumber = 3;
      this.points = [];
      for (let i = 1; i < this.pointNumber; i++) {
        this.points.push([
          Math.floor(Math.random() * (this.xr * 0.938)),
          Math.floor(Math.random() * (this.yr * 0.833))
        ]);
      }
      if (this.points.length > 0) {
        this.points.push([this.points[0][0], this.points[0][1]]);
      }
    }
    
    // Calculate offset points for "cousins" (offset versions of the main curve)
    const points1: [number, number][] = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      points1.push([this.points[i][0] - place, this.points[i][1] - place]);
    }
    if (points1.length > 0) {
      points1.push([points1[0][0], points1[0][1]]);
    }
    
    const points2: [number, number][] = [];
    for (let i = 0; i < points1.length - 1; i++) {
      points2.push([
        points1[i][0] + place + (place / 4),
        points1[i][1] + place + (place / 4)
      ]);
    }
    if (points2.length > 0) {
      points2.push([points2[0][0], points2[0][1]]);
    }
    
    const points3: [number, number][] = [];
    for (let i = 0; i < points2.length - 1; i++) {
      points3.push([
        points2[i][0] + place + (place / 2),
        points2[i][1] - place + (place / 2)
      ]);
    }
    if (points3.length > 0) {
      points3.push([points3[0][0], points3[0][1]]);
    }
    
    const points4: [number, number][] = [];
    for (let i = 0; i < points3.length - 1; i++) {
      points4.push([
        points3[i][0] - place + (place / 1),
        points3[i][1] + place + (place / 1)
      ]);
    }
    if (points4.length > 0) {
      points4.push([points4[0][0], points4[0][1]]);
    }
    
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.1);
    
    // Draw bezier curves (bezier function handles many points by creating segments)
    if (this.points.length >= 3) {
      canvas.bezier(this.points, color, 1, smooth);
    }
    if (number > 1 && points1.length >= 3) {
      canvas.bezier(points1, color, 1, smooth);
    }
    if (number > 2 && points2.length >= 3) {
      canvas.bezier(points2, color, 1, smooth);
    }
    if (number > 3 && points3.length >= 3) {
      canvas.bezier(points3, color, 1, smooth);
    }
    if (number > 4 && points4.length >= 3) {
      canvas.bezier(points4, color, 1, smooth);
    }
    
    // Trails effect - use feedback system to fade previous frame
    const alpha = Math.floor(eyesy.knob3 * 20) / 255;
    // Blit the previous frame with reduced opacity to create trails
    canvas.blitLastFrame(0, 0, this.xr, this.yr, 1.0 - alpha);
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }
}
