import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Woven Feedback
 * Ported from Python version
 * 
 * Knob1 - Rectangle filled/outline thickness
 * Knob2 - Size of feedback screen
 * Knob3 - Opacity of feedback screen (turn on Persist for best viewing!)
 * Knob4 - Foreground color
 * Knob5 - Background color
 * Trigger - New rotations for rectangles
 */
export class Wovenfeedback implements Mode {
  private xr = 1280;
  private yr = 720;
  private rotationStates: number[] = [];
  private trigger = false;
  private numColumns = 16;
  private numRows = 11;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    // Initialize rotation states
    this.rotationStates = Array(this.numColumns * this.numRows)
      .fill(0)
      .map(() => [0, 90, 180, 270][Math.floor(Math.random() * 4)]);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const size80 = this.xr * 0.063; // 80 @ 1280
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.5);
    const rectwidth = Math.floor(size80);
    const rectheight = Math.floor(size80);
    const stroke = Math.floor(eyesy.knob1 * 20);
    
    const grid: Array<{ x: number; y: number; width: number; height: number; center: [number, number] }> = [];
    
    for (let row = 0; row < this.numRows; row++) {
      for (let col = 0; col < this.numColumns; col++) {
        const rectX = col * rectwidth;
        const rectY = row * rectheight;
        grid.push({
          x: rectX,
          y: rectY,
          width: rectwidth,
          height: Math.floor(rectheight / 2),
          center: [rectX + rectwidth / 2, rectY + rectheight / 4] as [number, number],
        });
      }
    }
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.rotationStates = [];
      for (const _rect of grid) {
        const angle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        this.rotationStates.push(angle);
      }
      this.trigger = false;
    }
    
    for (let i = 0; i < grid.length; i++) {
      if (i < this.rotationStates.length) {
        const rect = grid[i];
        const angle = this.rotationStates[i];
        const center = rect.center;
        
        let rotatedWidth: number;
        let rotatedHeight: number;
        
        if (angle === 90 || angle === 270) {
          rotatedWidth = rect.height;
          rotatedHeight = rect.width;
        } else {
          rotatedWidth = rect.width;
          rotatedHeight = rect.height;
        }
        
        // Calculate rotated rectangle position (centered on original center)
        const rotatedX = center[0] - rotatedWidth / 2;
        const rotatedY = center[1] - rotatedHeight / 2;
        
        canvas.rect(rotatedX, rotatedY, rotatedWidth, rotatedHeight, color, stroke);
      }
    }
    
    // Blit the previous frame (scaled, semi-transparent, centered)
    // Knob2: Feedback screen size (0 = small, 1 = large)
    // When knob2 is 0, use small size; when knob2 is 1, use full screen
    const minSize = this.xr * 0.1; // Minimum size (10% of screen)
    const maxSize = this.xr * 0.95; // Maximum size (95% of screen)
    const thingX = Math.floor(minSize + (eyesy.knob2 * (maxSize - minSize)));
    const thingY = Math.floor((thingX * this.yr) / this.xr); // Maintain aspect ratio
    
    // Center the feedback screen
    const placeX = Math.floor((this.xr - thingX) / 2);
    const placeY = Math.floor((this.yr - thingY) / 2);
    
    // Knob3: Opacity of feedback screen (0 = transparent, 1 = fully opaque)
    // Use full range 0.0 to 1.0 for better control
    const alpha = eyesy.knob3;
    
    canvas.blitLastFrame(placeX, placeY, thingX, thingY, alpha, false);
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }
}
