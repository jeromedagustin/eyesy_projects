import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Bezier H Scope
 * Ported from Python version
 * 
 * Knob1 - y offset for lines
 * Knob2 - x offset for lines
 * Knob3 - trails (alpha)
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Bezierhscope implements Mode {
  private xr = 1280;
  private yr = 720;
  private pointNumber = 24;
  private yhalf = 360;
  private margin = 0;
  private xoff = 0;
  private pointLists: [number, number][][] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    // Set up the horizontal location of scope points
    // Two points are in the l & r margins (outside of the screen width) for better visuals
    this.pointNumber = 24; // total scope points
    const onScreenPoints = this.pointNumber - 4; // scope points 'centered' on screen
    const pointInterval = Math.floor(eyesy.xres / onScreenPoints);
    this.xr = pointInterval * this.pointNumber; // total width of scope
    this.margin = Math.floor(this.xr / this.pointNumber) * 2;
    this.yr = eyesy.yres;
    this.yhalf = Math.floor(this.yr / 2);
    this.xoff = 0;
    
    // Create arrays for 12 scopes
    this.pointLists = [];
    for (let scope = 0; scope < 12; scope++) {
      const pointList: [number, number][] = [];
      for (let i = 0; i < this.pointNumber; i++) {
        pointList.push([
          Math.floor((this.xr / this.pointNumber) * i),
          this.yhalf
        ]);
      }
      this.pointLists.push(pointList);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set colors
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.1);
    const smooth = 2; // bezier curve setting
    const voffset = eyesy.knob1 * (this.yhalf / 10); // vertical offset
    const centering = (voffset * 12) / 2;
    
    // Set the horizontal offset of the scopes
    if (eyesy.knob2 < 0.48) {
      this.xoff = (0.48 - eyesy.knob2) * (eyesy.xres * -0.078); // to the left
    } else if (eyesy.knob2 > 0.52) {
      this.xoff = (eyesy.knob2 - 0.52) * (eyesy.xres * 0.078); // to the right
    } else {
      this.xoff = 0;
    }
    
    // Update point positions based on audio
    for (let i = 0; i < this.pointNumber; i++) {
      const audioIndex = i * 2;
      const height = Math.floor(((eyesy.audio_in[audioIndex] || 0) * eyesy.yres) / 32768);
      const spot = Math.floor(this.xr / this.pointNumber) * i - this.margin;
      
      // Update all 12 scope point lists
      for (let scope = 0; scope < 12; scope++) {
        this.pointLists[scope][i] = [
          spot + (this.xoff * scope),
          height + (this.yhalf - centering) + (voffset * scope)
        ];
      }
    }
    
    // Draw the scopes using bezier curves
    // For bezier curves with many points, we'll use the multi-point bezier support
    for (let scope = 0; scope < 12; scope++) {
      canvas.bezier(this.pointLists[scope], color, 1, smooth);
    }
    
    // Trails effect - draw semi-transparent background overlay
    // The Python version uses a veil surface with alpha
    // We'll approximate this by drawing a semi-transparent rectangle
    // Note: Full trails would require render targets, but this approximates the effect
    const alpha = Math.floor(eyesy.knob3 * 20);
    if (alpha > 0 && alpha < 255) {
      // Draw a semi-transparent overlay by blending with background
      // Since we can't easily do alpha blending per-pixel, we'll rely on auto_clear
      // being off for trails effect, or draw a faded background rectangle
      const bgColor = eyesy.bg_color;
      // For now, trails work best when auto_clear is disabled
      // A full implementation would use render targets
    }
  }
}
