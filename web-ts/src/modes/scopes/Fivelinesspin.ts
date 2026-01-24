import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Five Lines Spin
 * Ported from Python version
 * 
 * Knob1 - line rate of rotation & direction
 * Knob2 - line length
 * Knob3 - line thickness
 * Knob4 - foreground color shift rate & direction
 * Knob5 - background color
 */
export class Fivelinesspin implements Mode {
  private xr = 1280;
  private yr = 720;
  private x128 = 0;
  private x8th = 0;
  private colorRate = 0;
  private speed = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x128 = Math.floor(this.xr * 0.1); // int((128*xr)/eyesy.xres)
    this.x8th = Math.floor(this.xr * 0.00625); // (8*xr)/eyesy.xres
    this.colorRate = 0;
    this.speed = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const thick = Math.floor(eyesy.knob3 * (this.xr * 0.078)) + 1;
    let peak = 0;
    const lines = 5;
    
    // Determine the rotation speed and direction based on eyesy.knob1
    if (eyesy.knob1 < 0.48) {
      this.speed = this.speed - (0.48 - eyesy.knob1) * 500 * eyesy.deltaTime;
    } else if (eyesy.knob1 > 0.52) {
      this.speed = this.speed + (eyesy.knob1 - 0.52) * 500 * eyesy.deltaTime;
    }
    
    for (let i = 0; i < lines; i++) {
      // Determine the color speed and direction based on eyesy.knob4
      if (eyesy.knob4 < 0.48) {
        this.colorRate = (this.colorRate - ((0.48 - eyesy.knob4) * 0.09 * eyesy.deltaTime)) % 1.0;
        if (this.colorRate < 0) this.colorRate += 1.0;
      } else if (eyesy.knob4 > 0.52) {
        this.colorRate = (this.colorRate + ((eyesy.knob4 - 0.52) * 0.09 * eyesy.deltaTime)) % 1.0;
      }
      
      const color = eyesy.color_picker((i * 0.2 + this.colorRate) % 1.0);
      
      const audioIndex = i * 10;
      if (audioIndex < eyesy.audio_in.length && eyesy.audio_in[audioIndex] > peak) {
        peak = eyesy.audio_in[audioIndex];
      }
      
      const R = (4 * eyesy.knob2 * (peak / this.x128)) + 20;
      const angle = (this.speed / 1000.0) * 6.28;
      const x = R * Math.cos(angle) + (this.xr / 2) + (i * this.xr / lines) - (2 * this.xr / lines);
      const y = R * Math.sin(angle) + (this.yr / 2);
      
      const startX = (i * this.xr / lines) + (this.xr / 10);
      const startY = this.yr / 2;
      
      canvas.line([startX, startY], [x, y], color, thick);
    }
  }
}
