import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Grid Polygons - Column Color
 * Ported from Python version
 * 
 * Knob1 - x offset
 * Knob2 - y offset
 * Knob3 - size of polygons
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Gridpolygonscolumncolor implements Mode {
  private xr = 1280;
  private yr = 720;
  private x8 = 0;
  private y5 = 0;
  private pList: Array<Array<[number, number]>> = [];
  private raNr = 0;
  private trigger = false;
  private ten = 0;
  private hten = 0;
  private hundert = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.raNr = Math.floor(this.xr * 0.016);
    const NraNr = -this.raNr;
    this.x8 = this.xr / 8;
    this.y5 = this.yr / 5;
    this.pList = [];
    for (let i = 0; i < 70; i++) {
      const polygon: Array<[number, number]> = [];
      for (let j = 0; j < 6; j++) {
        polygon.push([
          Math.floor(Math.random() * (this.raNr - NraNr + 1)) + NraNr,
          Math.floor(Math.random() * (this.raNr - NraNr + 1)) + NraNr
        ]);
      }
      this.pList.push(polygon);
    }
    this.ten = this.xr * 0.008;
    this.hten = this.ten / 2;
    this.hundert = this.xr * 0.078;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    if (this.trigger) {
      const NraNr = -this.raNr;
      this.pList = [];
      for (let i = 0; i < 70; i++) {
        const polygon: Array<[number, number]> = [];
        for (let j = 0; j < 6; j++) {
          polygon.push([
            Math.floor(Math.random() * (this.raNr - NraNr + 1)) + NraNr,
            Math.floor(Math.random() * (this.raNr - NraNr + 1)) + NraNr
          ]);
        }
        this.pList.push(polygon);
      }
    }
    this.trigger = false;
    
    for (let i = 0; i < 7; i++) {
      const xoffset = Math.floor(eyesy.knob1 * this.x8);
      const yoffset = Math.floor(eyesy.knob2 * this.y5);
      
      for (let j = 0; j < 10; j++) {
        let x = j * this.x8;
        let y = i * this.y5;
        
        const rad = (eyesy.audio_in[j + i] || 0) * 0.00003052 * this.hundert;
        const w = (eyesy.knob3 * 7) + 1;
        
        if ((i % 2) === 1) {
          x = j * this.x8 + xoffset;
        }
        if ((j % 2) === 1) {
          y = i * this.y5 + yoffset;
        }
        
        // Column color - color varies by column (j)
        const color = eyesy.color_picker(((j * 0.1) + eyesy.knob4) % 1.0);
        
        const points = this.pList[Math.floor((i * j) + this.hten)];
        const placePoints: [number, number][] = points.map(([px, py]) => [
          (px * w) + x,
          (py * w) + y
        ]);
        
        const morphPoints: [number, number][] = [
          [placePoints[0][0] - rad, placePoints[0][1] - rad],
          [placePoints[1][0] + rad, placePoints[1][1] - rad],
          [placePoints[2][0] + rad, placePoints[2][1]],
          [placePoints[3][0] + rad, placePoints[3][1] + rad],
          [placePoints[4][0], placePoints[4][1] - rad],
          [placePoints[5][0] - rad, placePoints[5][1] + rad]
        ];
        
        canvas.polygon(morphPoints, color, Math.floor(eyesy.xres * 0.0027));
      }
    }
  }
}
