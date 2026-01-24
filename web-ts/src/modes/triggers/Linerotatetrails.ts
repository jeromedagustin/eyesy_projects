import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Line Rotate - Trails
 * Ported from Python version
 * 
 * Knob1 - rotation speed (0 = slow, 1 = fast)
 * Knob2 - line length (0 = short, 1 = long) and direction (0-0.5 = CCW, 0.5-1 = CW)
 * Knob3 - line width (0 = thin, 1 = thick) and trails opacity
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Linerotatetrails implements Mode {
  private xr = 1280;
  private yr = 720;
  private sound = 0;
  private rotationSpeed = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.sound = 0;
    this.rotationSpeed = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Knob1: Rotation speed (0 to 4 revolutions per second)
    const speedMultiplier = eyesy.knob1 * 4.0; // 0 to 4 rev/sec
    
    // Knob2: Direction and line length
    // Direction: 0-0.5 = counter-clockwise, 0.5-1 = clockwise
    // Line length: 0 = 20% of screen, 1 = 90% of screen
    const directionFactor = (2 * eyesy.knob2 - 1); // -1 to 1
    const baseSpeed = directionFactor * speedMultiplier;
    const maxLength = Math.min(this.xr, this.yr);
    const lineLength = (0.2 + eyesy.knob2 * 0.7) * maxLength; // 20% to 90% of screen
    
    // Update rotation on trigger (adds impulse)
    if (eyesy.trig) {
      this.sound += directionFactor * 0.15;
      // Boost rotation speed on trigger
      this.rotationSpeed += directionFactor * speedMultiplier * 0.5;
    }
    
    // Continuous rotation - make it more responsive to knob changes
    // Use lighter damping for faster response
    this.rotationSpeed = this.rotationSpeed * 0.8 + baseSpeed * 0.2;
    this.sound += this.rotationSpeed * eyesy.deltaTime;
    
    const a = Math.PI * this.sound;
    const xc = this.xr / 2;
    const yc = this.yr / 2;
    
    // Knob3: Line width (1 to xr/3 pixels)
    const linewidth = Math.floor(1 + eyesy.knob3 * (this.xr * 0.33 - 1));
    
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Draw line based on direction
    if (eyesy.knob2 < 0.5) {
      const x21 = (lineLength / 2) * Math.cos(a);
      const y21 = (lineLength / 2) * Math.sin(a);
      const x2 = Math.floor(xc + x21);
      const y2 = Math.floor(yc - y21);
      const x3 = Math.floor(xc - x21);
      const y3 = Math.floor(yc + y21);
      canvas.line([x2, y2], [x3, y3], color, linewidth);
    }
    
    if (eyesy.knob2 > 0.5) {
      const x11 = (lineLength / 2) * Math.cos(a);
      const y11 = (lineLength / 2) * Math.sin(a);
      const x1 = xc - x11;
      const y1 = yc + y11;
      const x4 = xc + x11;
      const y4 = yc - y11;
      canvas.line([x1, y1], [x4, y4], color, linewidth);
    }
    
    // Trails effect - use feedback system
    // First, capture the current frame (will be used next frame)
    canvas.captureFrame();
    
    // Draw semi-transparent background overlay for trails
    // Knob3 also controls trails opacity (higher = more persistent trails)
    const alpha = Math.floor(eyesy.knob3 * 220) / 255;
    if (alpha > 0) {
      // Blit the previous frame with alpha to create trails effect
      canvas.blitLastFrame(0, 0, this.xr, this.yr, alpha);
    }
  }
}
