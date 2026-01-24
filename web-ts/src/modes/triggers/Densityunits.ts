import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Density Units
 * Ported from Python version
 * 
 * Knob1 - rect diameter
 * Knob2 - spacing
 * Knob3 - filled/unfilled
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Densityunits implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private pList: [number, number][] = [];
  private fill = 0;
  private corner = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    const x100 = Math.floor(this.xr * 0.078);
    const y100 = Math.floor(this.yr * 0.139);
    this.pList = [];
    for (let i = 0; i < 100; i++) {
      this.pList.push([
        Math.floor(Math.random() * (eyesy.xres + x100 + x100)) - x100,
        Math.floor(Math.random() * (eyesy.yres + y100 + y100)) - y100
      ]);
    }
    this.fill = 0;
    this.corner = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const sizescale = Math.floor(this.xr * 0.156); // ((200*eyesy.xres)/1280)
    const xhalf = Math.floor(this.xr / 2);
    const yhalf = Math.floor(this.yr / 2);
    const dscale = Math.floor(this.xr * 0.078); // int((100*eyesy.xres)/1280)
    const size = Math.floor(eyesy.knob1 * sizescale) + 1;
    const xdensity = Math.floor(eyesy.knob2 * xhalf + 20);
    const ydensity = Math.floor(eyesy.knob2 * yhalf + 20);
    
    if (eyesy.knob3 < 0.5) {
      this.fill = Math.floor(size * eyesy.knob3) + 1;
      this.corner = Math.floor(size * (eyesy.knob3 * 2));
    } else {
      this.corner = Math.floor(size * (2 - (eyesy.knob3 * 2)));
      this.fill = 0;
    }
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.pList = [];
      for (let i = 0; i < dscale; i++) {
        this.pList.push([
          Math.floor(Math.random() * (eyesy.xres + dscale - xdensity + dscale - xdensity + 10)) - dscale + xdensity,
          Math.floor(Math.random() * (eyesy.yres + dscale - ydensity + dscale - ydensity + 10)) - dscale + ydensity
        ]);
      }
    }
    
    for (let j = 0; j < 30; j++) {
      const color = eyesy.color_picker_lfo(eyesy.knob4, 0.006);
      const x = this.pList[j][0] - (size / 2);
      const y = this.pList[j][1] - (size / 2);
      canvas.rect(x, y, size, size, color, this.fill);
    }
    
    this.trigger = false;
  }
}
