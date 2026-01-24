import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - X Scope
 * Ported from Python version
 * 
 * Knob1 - line width
 * Knob2 - shadow angle & position
 * Knob3 - scope angle & position
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Xscope implements Mode {
  private xr = 1280;
  private yr = 720;
  private li = 0;
  private xr8 = 0;
  private yr8 = 0;
  private linewidth = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.xr8 = this.xr / 10;
    this.yr8 = this.yr / 10;
    this.li = this.xr * 0.016;
    this.linewidth = Math.floor(eyesy.knob1 * this.li) + 1;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const squ = Math.floor(this.yr - (this.yr / 4));
    const shadow = Math.floor(eyesy.knob2 * (this.xr * 0.094));
    const xshadow = Math.cos(eyesy.knob2 * 6.28) * shadow;
    const yshadow = Math.sin(eyesy.knob2 * 6.28) * shadow;
    const shadowColor: [number, number, number] = [
      Math.floor((eyesy.bg_color[0] * eyesy.knob2) / 1.1),
      Math.floor((eyesy.bg_color[1] * eyesy.knob2) / 1.1),
      Math.floor((eyesy.bg_color[2] * eyesy.knob2) / 1.1)
    ];
    this.linewidth = Math.floor(eyesy.knob1 * this.li) + 1;
    const gixoff = Math.floor((this.xr - squ) / 2);
    const gjxoff = Math.floor(((this.xr - squ) / 2) + squ);
    
    // Shadow L-R (first loop)
    let last_pointi: [number, number] = [0, 0];
    for (let i = 0; i < 30; i++) {
      const xstep = Math.floor((squ / 30) + 0.49999);
      const yoff = Math.floor((this.yr8 + (this.yr8 / 3)) + yshadow) * eyesy.knob3 * 5 - this.yr / 3 + this.yr / 8;
      const auDio = Math.floor((eyesy.audio_in[i] || 0) * 0.00003058 * squ);
      const NauDio = auDio * -1;
      const color = shadowColor;
      const ixoff = Math.floor(((this.xr - squ) / 2) + xshadow);
      
      if (i === 0) {
        last_pointi = [ixoff + auDio, yoff + NauDio];
      } else if (i === 29) {
        canvas.line(last_pointi, [(ixoff + squ) + auDio, (squ + yoff) + NauDio], color, this.linewidth);
      } else {
        canvas.line(last_pointi, [((i * xstep) + ixoff) + auDio, ((i * xstep) + yoff) + NauDio], color, this.linewidth);
        last_pointi = [((i * xstep) + ixoff) + auDio, ((i * xstep) + yoff) + NauDio];
      }
    }
    
    // Shadow L-R (second loop)
    let last_pointj: [number, number] = [0, 0];
    for (let j = 0; j < 30; j++) {
      const xstep = Math.floor((squ / 30) + 0.49999);
      const jxoff = Math.floor((((this.xr - squ) / 2) + squ) + xshadow);
      const yoff = this.yr / 3 - Math.floor((this.yr8 + (this.yr8 / 3)) + yshadow) * eyesy.knob3 * 5 + this.yr / 8;
      const auDio = Math.floor((eyesy.audio_in[j] || 0) * 0.00003058 * squ);
      const NauDio = auDio * -1;
      const color = shadowColor;
      
      if (j === 0) {
        last_pointj = [jxoff + NauDio, yoff + NauDio];
      } else if (j === 29) {
        canvas.line(last_pointj, [gixoff + NauDio, (squ + yoff) + NauDio], color, this.linewidth);
      } else {
        canvas.line(last_pointj, [(jxoff - (j * xstep)) + NauDio, ((j * xstep) + yoff) + NauDio], color, this.linewidth);
        last_pointj = [(jxoff - (j * xstep)) + NauDio, ((j * xstep) + yoff) + NauDio];
      }
    }
    
    // LINE L-R (first loop)
    last_pointi = [0, 0];
    for (let i = 0; i < 30; i++) {
      const xstep = Math.floor((squ / 30) + 0.49999);
      const yoff = Math.floor(this.yr8 + (this.yr8 / 3)) * eyesy.knob3 * 5 - this.yr / 3 + this.yr / 8;
      const auDio = Math.floor((eyesy.audio_in[i] || 0) * 0.00003058 * squ);
      const NauDio = auDio * -1;
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      
      if (i === 0) {
        last_pointi = [gixoff + auDio, yoff + NauDio];
      } else if (i === 29) {
        canvas.line(last_pointi, [(gixoff + squ) + auDio, (squ + yoff) + NauDio], color, this.linewidth);
      } else {
        canvas.line(last_pointi, [((i * xstep) + gixoff) + auDio, ((i * xstep) + yoff) + NauDio], color, this.linewidth);
        last_pointi = [((i * xstep) + gixoff) + auDio, ((i * xstep) + yoff) + NauDio];
      }
    }
    
    // LINE L-R (second loop)
    last_pointj = [0, 0];
    for (let j = 0; j < 30; j++) {
      const xstep = Math.floor((squ / 30) + 0.49999);
      const yoff = this.yr / 3 - Math.floor(this.yr8 + (this.yr8 / 3)) * eyesy.knob3 * 5 + this.yr / 8;
      const auDio = Math.floor((eyesy.audio_in[j] || 0) * 0.00003058 * squ);
      const NauDio = auDio * -1;
      const color = eyesy.color_picker_lfo(eyesy.knob4);
      
      if (j === 0) {
        last_pointj = [gjxoff + NauDio, yoff + NauDio];
      } else if (j === 29) {
        canvas.line(last_pointj, [gixoff + NauDio, (squ + yoff) + NauDio], color, this.linewidth);
      } else {
        canvas.line(last_pointj, [(gjxoff - (j * xstep)) + NauDio, ((j * xstep) + yoff) + NauDio], color, this.linewidth);
        last_pointj = [(gjxoff - (j * xstep)) + NauDio, ((j * xstep) + yoff) + NauDio];
      }
    }
  }
}
