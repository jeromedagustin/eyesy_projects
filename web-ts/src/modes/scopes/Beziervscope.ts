import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Bezier V Scope
 * Ported from Python version
 * 
 * Knob1 - x offset for lines
 * Knob2 - y offset for lines
 * Knob3 - trails
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Beziervscope implements Mode {
  private xr = 1280;
  private yr = 720;
  private pointNumber = 24;
  private xhalf = 640;
  private margin = 0;
  private yoff = 0;
  private pointLists: [number, number][][] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    // Set up the vertical location of scope points
    // Two points are in the top & bottom margins (outside of the screen height) for better visuals
    this.pointNumber = 24; // total scope points
    const onScreenPoints = this.pointNumber - 4; // scope points 'centered' on screen
    const pointInterval = Math.floor(eyesy.yres / onScreenPoints);
    this.yr = pointInterval * this.pointNumber; // total height of scope
    this.margin = Math.floor(this.yr / this.pointNumber) * 2;
    this.xr = eyesy.xres;
    this.xhalf = Math.floor(this.xr / 2);
    this.yoff = 0;
    
    // Create arrays for 12 scopes
    this.pointLists = [];
    for (let scope = 0; scope < 12; scope++) {
      const pointList: [number, number][] = [];
      for (let i = 0; i < this.pointNumber; i++) {
        pointList.push([
          this.xhalf,
          Math.floor((this.yr / this.pointNumber) * i)
        ]);
      }
      this.pointLists.push(pointList);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set colors
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.1);
    const smooth = 2; // bezier curve step interpolation setting
    const hoffset = eyesy.knob1 * (this.xhalf / 10); // horizontal offset
    const centering = (hoffset * 12) / 2;
    
    // Set the vertical offset of the scopes
    if (eyesy.knob2 < 0.48) {
      this.yoff = (0.48 - eyesy.knob2) * (eyesy.yres * -0.078); // to the top
    } else if (eyesy.knob2 > 0.52) {
      this.yoff = (eyesy.knob2 - 0.52) * (eyesy.yres * 0.078); // to the bottom
    } else {
      this.yoff = 0;
    }
    
    // Update point positions based on audio
    for (let i = 0; i < this.pointNumber; i++) {
      const audioIndex = i * 2;
      const width = Math.floor(((eyesy.audio_in[audioIndex] || 0) * eyesy.xres) / 32768);
      const spot = Math.floor(this.yr / this.pointNumber) * i - this.margin;
      
      // Update all 12 scope point lists
      for (let scope = 0; scope < 12; scope++) {
        this.pointLists[scope][i] = [
          width + (this.xhalf - centering) + (hoffset * scope),
          spot + (this.yoff * scope)
        ];
      }
    }
    
    // Draw the scopes using bezier curves
    for (let scope = 0; scope < 12; scope++) {
      canvas.bezier(this.pointLists[scope], color, 1, smooth);
    }
    
    // Trails effect - similar to Bezier H Scope
    // Note: Full trails would require render targets
    const alpha = Math.floor(eyesy.knob3 * 20);
    if (alpha > 0 && alpha < 255) {
      // Trails work best when auto_clear is disabled
    }
  }
}
