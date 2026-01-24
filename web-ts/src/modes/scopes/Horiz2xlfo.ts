import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Horiz 2xLFO
 * Ported from Python version
 * 
 * Knob1 = Oscilloscope Shape & Size Selector - 3 divisions.
 *   Within each division of Knob1, the LFO rate of change for scope elements is set -
 *   turning to the right will increase the LFO frequency.
 * Knob2 = 'Trails' LFO rate of change - turn on "persist" to see it!
 * Knob3 = 'Trails' Opacity
 * Knob4 = Foreground Color - 8 positions
 * Knob5 = Background Color
 */
class LFO {
  public start: number;
  public max: number;
  public step: number;
  private current: number;
  private direction: number;

  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = 0;
    this.direction = 1;
  }

  update(deltaTime: number): number {
    this.current += this.step * this.direction * deltaTime;
    // when it gets to the top, flip direction
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max; // in case it steps above max
    }
    // when it gets to the bottom, flip direction
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start; // in case it steps below min
    }
    return this.current;
  }
}

export class Horiz2xlfo implements Mode {
  private lines = 100;
  private xr = 1280;
  private yr = 720;
  private lastScreenLFO: LFO;
  private shapeLFO: LFO;
  private shapey = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lastScreenLFO = new LFO(0, 200, 0.01);
    this.shapeLFO = new LFO(0, 0.33, 0.01);
    this.shapey = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    this.lastScreenLFO.max = 250;
    
    // Draw current frame
    for (let i = 0; i < this.lines; i++) {
      this.seg(canvas, eyesy, i);
    }
    
    // Update shape LFO
    this.shapey = this.shapeLFO.update(eyesy.deltaTime);
    
    // Draw trails (previous frame scaled down and semi-transparent)
    this.lastScreenLFO.step = eyesy.knob2 * 50; // LFO rate of change
    const lastScreenSize = this.lastScreenLFO.update(eyesy.deltaTime);
    const thingX = Math.floor(this.xr - lastScreenSize);
    const thingY = Math.floor(this.yr - (lastScreenSize * 0.5625));
    const placeX = Math.floor(this.xr / 2) - Math.floor(((thingX / 2) * this.xr) / 1280);
    const placeY = Math.floor(this.yr / 2) - Math.floor(((thingY / 2) * this.yr) / 720);
    const alpha = Math.floor(eyesy.knob3 * 180) / 255; // Convert 0-180 to 0.0-0.7 opacity
    
    // Blit the previous frame (scaled, semi-transparent, centered)
    canvas.blitLastFrame(placeX, placeY, thingX, thingY, alpha, false);
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const space = eyesy.xres / (this.lines - 2);
    const y0 = 0;
    const y1 = (eyesy.audio_in[i] || 0) / 90;
    const x = i * space;
    const position = eyesy.yres / 2;

    let linewidth = 0;
    let ballSize = 0;

    // Set the size of the graphic elements with Knob 1:
    if (eyesy.knob1 < 0.33) {
      linewidth = Math.floor(((Math.abs(this.shapey) * 3.5) * eyesy.xres) / (this.lines - 75) + 1);
      ballSize = 0; // no balls shown
      this.shapeLFO.step = eyesy.knob1 * eyesy.knob1; // LFO rate of change
    } else if (eyesy.knob1 >= 0.33 && eyesy.knob1 < 0.66) {
      linewidth = 0; // no lines shown
      ballSize = Math.floor((((0.66 - Math.abs(this.shapey * 2)) * 3) * eyesy.xres) / (this.lines - 75) + 1);
      this.shapeLFO.step = (eyesy.knob1 - 0.33) * (eyesy.knob1 - 0.33); // LFO rate of change
    } else {
      linewidth = Math.floor(((Math.abs(1 - this.shapey) - 0.66) * 1.5) * eyesy.xres / (this.lines - 75));
      ballSize = Math.floor((((Math.abs(this.shapey * 3 - 0.66)) * 3) * eyesy.xres) / (this.lines - 75));
      this.shapeLFO.step = (eyesy.knob1 - 0.66) * (eyesy.knob1 - 0.66); // LFO rate of change
    }
    
    const sel = eyesy.knob4 * 8; // select the colors with Knob 4
    const Cmod = 0.02; // how quickly the color shifts
    let color: [number, number, number];
    
    if (sel < 1) {
      color = [
        Math.floor(127 + 127 * Math.sin(i * 1 * Cmod + eyesy.time)),
        Math.floor(127 + 127 * Math.sin(i * 1 * Cmod + eyesy.time)),
        Math.floor(127 + 127 * Math.sin(i * 1 * Cmod + eyesy.time))
      ];
    } else if (sel >= 1 && sel < 2) {
      color = [Math.floor(127 + 127 * Math.sin(i * 1 * Cmod + eyesy.time)), 0, 45];
    } else if (sel >= 2 && sel < 3) {
      color = [255, Math.floor(155 + 100 * Math.sin(i * 1 * Cmod + eyesy.time)), 30];
    } else if (sel >= 3 && sel < 4) {
      color = [0, 200, Math.floor(127 + 127 * Math.sin(i * 1 * Cmod + eyesy.time))];
    } else if (sel >= 4 && sel < 5) {
      color = [
        Math.floor((127 * Cmod) % 255),
        Math.floor((127 * Cmod) % 255),
        Math.floor(127 + 127 * Math.sin(i * (Cmod + 0.1) + eyesy.time))
      ];
    } else if (sel >= 5 && sel < 6) {
      color = [
        Math.floor((127 * Cmod) % 255),
        Math.floor(127 + 127 * Math.sin(i * (Cmod + 0.1) + eyesy.time)),
        Math.floor((127 * Cmod) % 255)
      ];
    } else if (sel >= 6 && sel < 7) {
      color = [
        Math.floor(127 + 127 * Math.sin(i * (Cmod + 0.1) + eyesy.time)),
        Math.floor((127 * Cmod) % 255),
        Math.floor((127 * Cmod) % 255)
      ];
    } else {
      color = [
        Math.floor(127 + 127 * Math.sin((i + 30) * (1 * Cmod + 0.01) + eyesy.time)),
        Math.floor(127 + 127 * Math.sin((i + 30) * (0.5 * Cmod + 0.005) + eyesy.time)),
        Math.floor(127 + 127 * Math.sin((i + 15) * (0.1 * Cmod + 0.001) + eyesy.time))
      ];
    }

    canvas.circle([x, y1 + position], ballSize, color, 0);
    canvas.line([x, y0 + position], [x, y1 + position], color, linewidth);
  }
}
