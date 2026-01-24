import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Horizontal + Trails
 * Ported from Python version
 * 
 * Knob1 = Oscilloscope Shape & Size Selector - 3 divisions
 * Knob2 = Size of 'Trails'
 * Knob3 = 'Trails' Opacity
 * Knob4 = Foreground Color - 8 positions
 * Knob5 = Background Color
 */
export class Horizontaltrails implements Mode {
  private lines = 100;
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    // Draw trails (previous frame scaled down and semi-transparent)
    const lastScreenSize = this.xr * 0.16; // 200 at 1280x720
    const thingX = Math.floor(this.xr - (eyesy.knob2 * lastScreenSize));
    const thingY = Math.floor(this.yr - (eyesy.knob2 * (lastScreenSize * 0.5625)));
    const placeX = Math.floor(this.xr / 2) - Math.floor(((thingX / 2) * this.xr) / this.xr);
    const placeY = Math.floor(this.yr / 2) - Math.floor(((thingY / 2) * this.yr) / this.yr);
    const alpha = Math.floor(eyesy.knob3 * 180) / 255; // Convert 0-180 to 0.0-0.7 opacity
    
    // Blit the previous frame (scaled, semi-transparent, centered)
    canvas.blitLastFrame(placeX, placeY, thingX, thingY, alpha, false);

    // Draw current frame
    for (let i = 0; i < this.lines; i++) {
      this.seg(canvas, eyesy, i);
    }

    // Capture current frame for next iteration
    canvas.captureFrame();
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const space = eyesy.xres / (this.lines - 2);
    const y0 = 0;
    const y1 = (eyesy.audio_in[i] || 0) / 90;
    const x = i * space;
    const position = this.yr / 2;

    let linewidth = 0;
    let ballSize = 0;

    // Set the size of the graphic elements with Knob 1:
    if (eyesy.knob1 < 0.33) {
      linewidth = Math.floor(((eyesy.knob1 * 3.5) * eyesy.xres) / (this.lines - 75) + 1);
      ballSize = 0; // no balls shown
    } else if (eyesy.knob1 >= 0.33 && eyesy.knob1 < 0.66) {
      linewidth = 0; // no lines shown
      ballSize = Math.floor((((0.66 - eyesy.knob1) * 3) * eyesy.xres) / (this.lines - 75) + 1);
    } else {
      linewidth = Math.floor(((eyesy.knob1 - 0.66) * 1.5) * eyesy.xres / (this.lines - 75));
      ballSize = Math.floor((((eyesy.knob1 - 0.66) * 3) * eyesy.xres) / (this.lines - 75));
    }

    const color = eyesy.color_picker_lfo(eyesy.knob4);

    // Draw circle
    if (ballSize > 0) {
      canvas.circle([x, y1 + position], ballSize, color, 0);
    }

    // Draw line
    if (linewidth > 0) {
      canvas.line(
        [x, y0 + position],
        [x, y1 + position],
        color,
        linewidth
      );
    }
  }
}
