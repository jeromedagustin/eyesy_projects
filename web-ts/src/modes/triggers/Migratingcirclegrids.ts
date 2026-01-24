import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Migrating Circle Grids
 * Ported from Python version
 * 
 * Knob1 - x axis speed & direction
 * Knob2 - y axis speed & direction
 * Knob3 - circle size
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Migratingcirclegrids implements Mode {
  private xr = 1280;
  private yr = 720;
  private xhalf = 0;
  private yhalf = 0;
  private trigger = false;
  private x1_nudge = 0;
  private y1_nudge = 0;
  private x2_nudge = 0;
  private y2_nudge = 0;
  private x3_nudge = 0;
  private y3_nudge = 0;
  private x4_nudge = 0;
  private y4_nudge = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.xhalf = this.xr / 2;
    this.yhalf = this.yr / 2;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const rad50 = this.xr * 0.078; // ((50*xr)/1280)
    const speed60 = this.xr * 0.047; // ((60*xr)/1280)
    
    // Set different speeds for 4 layers
    this.x1_nudge = 1 * this.x1_nudge;
    this.y1_nudge = 1 * this.y1_nudge;
    this.x2_nudge = 1.25 * this.x1_nudge;
    this.y2_nudge = 1.25 * this.y1_nudge;
    this.x3_nudge = 1.5 * this.x1_nudge;
    this.y3_nudge = 1.5 * this.y1_nudge;
    this.x4_nudge = 1.75 * this.x1_nudge;
    this.y4_nudge = 1.75 * this.y1_nudge;
    
    const x_speed = (speed60 * eyesy.knob1) - (speed60 / 2); // horizontal speed on knob1
    const y_speed = (speed60 * eyesy.knob2) - (speed60 / 2); // vertical speed on knob2
    
    // Move circles on audio trigger
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.x1_nudge = this.x1_nudge + x_speed;
      this.y1_nudge = this.y1_nudge + y_speed;
      this.x2_nudge = this.x2_nudge + x_speed;
      this.y2_nudge = this.y2_nudge + y_speed;
      this.x3_nudge = this.x3_nudge + x_speed;
      this.y3_nudge = this.y3_nudge + y_speed;
      this.x4_nudge = this.x4_nudge + x_speed;
      this.y4_nudge = this.y4_nudge + y_speed;
    }
    this.trigger = false;
    
    // Wrap around boundaries
    if (this.x1_nudge > this.xhalf) this.x1_nudge = -this.xhalf;
    if (this.x2_nudge > this.xhalf) this.x2_nudge = -this.xhalf;
    if (this.x3_nudge > this.xhalf) this.x3_nudge = -this.xhalf;
    if (this.x4_nudge > this.xhalf) this.x4_nudge = -this.xhalf;
    if (this.x1_nudge < -this.xhalf) this.x1_nudge = this.xhalf;
    if (this.x2_nudge < -this.xhalf) this.x2_nudge = this.xhalf;
    if (this.x3_nudge < -this.xhalf) this.x3_nudge = this.xhalf;
    if (this.x4_nudge < -this.xhalf) this.x4_nudge = this.xhalf;
    if (this.y1_nudge > this.yhalf) this.y1_nudge = -this.yhalf;
    if (this.y2_nudge > this.yhalf) this.y2_nudge = -this.yhalf;
    if (this.y3_nudge > this.yhalf) this.y3_nudge = -this.yhalf;
    if (this.y4_nudge > this.yhalf) this.y4_nudge = -this.yhalf;
    if (this.y1_nudge < -this.yhalf) this.y1_nudge = this.yhalf;
    if (this.y2_nudge < -this.yhalf) this.y2_nudge = this.yhalf;
    if (this.y3_nudge < -this.yhalf) this.y3_nudge = this.yhalf;
    if (this.y4_nudge < -this.yhalf) this.y4_nudge = this.yhalf;
    
    // Define 4 circle grid layers, circle size on knob3
    const restRad = Math.floor(rad50 * eyesy.knob3) + 2;
    
    // Layer 1
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        let x1 = (j * (this.xr / 5)) + (this.xr / 10) + Math.floor(this.x1_nudge);
        let y1 = (i * (this.yr / 3)) + (this.yr / 6) + Math.floor(this.y1_nudge);
        if ((i % 2) === 1) {
          x1 = j * (this.xr / 5) + (this.xr / 10) + Math.floor(this.x1_nudge);
        }
        if ((j % 2) === 1) {
          y1 = i * (this.yr / 3) + (this.yr / 6) + Math.floor(this.y1_nudge);
        }
        const color = eyesy.color_picker_lfo(eyesy.knob4, 200);
        canvas.circle([x1, y1], restRad, color, 0);
      }
    }
    
    // Layer 2
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        let x2 = (j * (this.xr / 5)) + (this.xr / 10) + Math.floor(this.x2_nudge);
        let y2 = (i * (this.yr / 3)) + (this.yr / 6) + Math.floor(this.y2_nudge);
        if ((i % 2) === 1) {
          x2 = j * (this.xr / 5) + (this.xr / 10) + Math.floor(this.x2_nudge);
        }
        if ((j % 2) === 1) {
          y2 = i * (this.yr / 3) + (this.yr / 6) + Math.floor(this.y2_nudge);
        }
        const color = eyesy.color_picker_lfo(eyesy.knob4, 150);
        canvas.circle([x2, y2], restRad, color, 0);
      }
    }
    
    // Layer 3
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        let x3 = (j * (this.xr / 5)) + (this.xr / 10) + Math.floor(this.x3_nudge);
        let y3 = (i * (this.yr / 3)) + (this.yr / 6) + Math.floor(this.y3_nudge);
        if ((i % 2) === 1) {
          x3 = j * (this.xr / 5) + (this.xr / 10) + Math.floor(this.x3_nudge);
        }
        if ((j % 2) === 1) {
          y3 = i * (this.yr / 3) + (this.yr / 6) + Math.floor(this.y3_nudge);
        }
        const color = eyesy.color_picker_lfo(eyesy.knob4, 100);
        canvas.circle([x3, y3], restRad, color, 0);
      }
    }
    
    // Layer 4
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        let x4 = (j * (this.xr / 5)) + (this.xr / 10) + Math.floor(this.x4_nudge);
        let y4 = (i * (this.yr / 3)) + (this.yr / 6) + Math.floor(this.y4_nudge);
        if ((i % 2) === 1) {
          x4 = j * (this.xr / 5) + (this.xr / 10) + Math.floor(this.x4_nudge);
        }
        if ((j % 2) === 1) {
          y4 = i * (this.yr / 3) + (this.yr / 6) + Math.floor(this.y4_nudge);
        }
        const color = eyesy.color_picker_lfo(eyesy.knob4, 50);
        canvas.circle([x4, y4], restRad, color, 0);
      }
    }
  }
}
