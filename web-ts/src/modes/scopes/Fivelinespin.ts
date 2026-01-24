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
export class Fivelinespin implements Mode {
  private xr = 1280;
  private yr = 720;
  private x128 = 0;
  private x8th = 0;
  private colorRate = 0;
  private speed = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.x128 = Math.floor(this.xr * 0.1);
    this.x8th = Math.floor(this.xr * 0.00625);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const thick = Math.floor(eyesy.knob3 * (this.xr * 0.078)) + 1;
    const lines = 5;

    // Determine rotation speed and direction
    if (eyesy.knob1 < 0.48) {
      this.speed = this.speed - (0.48 - eyesy.knob1) * 500;
    } else if (eyesy.knob1 > 0.52) {
      this.speed = this.speed + (eyesy.knob1 - 0.52) * 500;
    }

    for (let i = 0; i < lines; i++) {
      // Determine color speed and direction
      if (eyesy.knob4 < 0.48) {
        this.colorRate = (this.colorRate - ((0.48 - eyesy.knob4) * 0.09)) % 1.0;
      } else if (eyesy.knob4 > 0.52) {
        this.colorRate = (this.colorRate + ((eyesy.knob4 - 0.52) * 0.09)) % 1.0;
      }

      const color = eyesy.color_picker((i * 0.2 + this.colorRate) % 1.0);

      // Find peak audio for this line
      let peak = 0;
      const audioIndex = i * 10;
      if (audioIndex < eyesy.audio_in.length && eyesy.audio_in[audioIndex] > peak) {
        peak = eyesy.audio_in[audioIndex];
      }

      const R = (4 * eyesy.knob2 * (peak / this.x128)) + 20;
      const x = R * Math.cos((this.speed / 1000.0) * 6.28) + (this.xr / 2) + (i * this.xr / lines) - (2 * this.xr / lines);
      const y = R * Math.sin((this.speed / 1000.0) * 6.28) + (this.yr / 2);

      canvas.line(
        [Math.floor((i * this.xr / lines) + this.xr / 10), Math.floor(this.yr / 2)],
        [Math.floor(x), Math.floor(y)],
        color,
        thick
      );
    }
  }
}

