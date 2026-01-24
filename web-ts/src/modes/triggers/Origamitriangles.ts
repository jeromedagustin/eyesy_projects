import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Origami Triangles
 * Ported from Python version
 * 
 * Knob1 - x position
 * Knob2 - y position
 * Knob3 - density
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Origamitriangles implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private pointz: [number, number][] = [[600, 400], [640, 340], [680, 400]];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.trigger = false;
    this.pointz = [[600, 400], [640, 340], [680, 400]];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.075);
    const posx = Math.floor(eyesy.knob1 * this.xr);
    const posy = Math.floor(eyesy.knob2 * this.yr);
    const density = Math.floor(eyesy.knob3 * (this.xr * 0.469)); // int(eyesy.knob3*((600*eyesy.xres)/1280))
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      const x = Math.floor(Math.random() * 3);
      this.pointz[x] = [
        Math.floor(Math.random() * (posx + density + 10 - (posx - density)) + (posx - density)),
        Math.floor(Math.random() * (posy + density + 10 - (posy - density)) + (posy - density))
      ];
    }
    this.trigger = false;
    
    canvas.polygon(this.pointz, color, 0);
  }
}
