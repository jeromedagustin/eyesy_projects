import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - AA Selector
 * Ported from Python version
 *
 * Knob1 - number of layers
 * Knob2 - layer offset on knob2
 * Knob3 - shape selector
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Aaselector implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Calculate average audio
    let avg = 0;
    for (let i = 0; i < 100; i++) {
      avg += Math.abs(eyesy.audio_in[i] || 0);
    }
    avg = avg / 100;
    
    const arcs = Math.floor(eyesy.knob1 * 9 + 1); // number of layers
    const form = Math.floor(eyesy.knob3 * 6); // shape selector
    const offset = eyesy.knob2; // layer offset
    const scaler = this.xr * 0.781;
    const currentTime = eyesy.time; // Use eyesy.time which respects speed multiplier
    
    // Pre-calculate x and y positions
    const x22 = this.xr * 0.0172;
    const x86 = this.xr * 0.0672;
    const x187 = this.xr * 0.146;
    const x320 = this.xr * 0.25;
    const x474 = this.xr * 0.37;
    const x640 = this.xr * 0.5;
    const x806 = this.xr * 0.6296;
    const x960 = this.xr * 0.75;
    const x1093 = this.xr * 0.854;
    const x1194 = this.xr * 0.9328;
    const x1258 = this.xr * 0.9828;
    const y12 = this.yr * 0.0167;
    const y48 = this.yr * 0.0667;
    const y105 = this.yr * 0.1458;
    const y180 = this.yr * 0.25;
    const y267 = this.yr * 0.371;
    const y360 = this.yr * 0.5;
    const y453 = this.yr * 0.6291;
    const y540 = this.yr * 0.75;
    const y615 = this.yr * 0.8541;
    const y672 = this.yr * 0.9333;
    const y708 = this.yr * 0.9833;
    
    for (let i = 0; i < arcs; i++) {
      let A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0;
      const timeOffset = i * 0.5 + currentTime;
      
      // Calculate A-K based on form selector
      if (form < 1) {
        A = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.sin(timeOffset));
        B = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.sin(timeOffset));
        C = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.sin(timeOffset));
        D = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.sin(timeOffset));
        E = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        F = Math.abs(avg * 0.1) + Math.abs(scaler * offset * Math.sin(timeOffset));
        G = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        H = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.sin(timeOffset));
        I = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.sin(timeOffset));
        J = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.sin(timeOffset));
        K = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.sin(timeOffset));
      } else if (form < 2) {
        A = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.sin(timeOffset));
        B = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.sin(timeOffset));
        C = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.sin(timeOffset));
        D = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.cos(timeOffset));
        E = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        F = Math.abs(avg * 0.1) + Math.abs(scaler * offset * Math.sin(timeOffset));
        G = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        H = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.cos(timeOffset));
        I = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.sin(timeOffset));
        J = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.sin(timeOffset));
        K = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.sin(timeOffset));
      } else if (form < 3) {
        A = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.tan(timeOffset));
        B = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.tan(timeOffset));
        C = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.tan(timeOffset));
        D = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.tan(timeOffset));
        E = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.tan(timeOffset));
        F = Math.abs(avg * 0.1) + Math.abs(scaler * offset * Math.tan(timeOffset));
        G = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.tan(timeOffset));
        H = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.tan(timeOffset));
        I = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.tan(timeOffset));
        J = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.tan(timeOffset));
        K = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.tan(timeOffset));
      } else if (form < 4) {
        A = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.sin(timeOffset));
        B = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.cos(timeOffset));
        C = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.sin(timeOffset));
        D = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.cos(timeOffset));
        E = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        F = Math.abs(avg * 0.1) + Math.abs(scaler * offset * Math.cos(timeOffset));
        G = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        H = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.cos(timeOffset));
        I = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.sin(timeOffset));
        J = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.cos(timeOffset));
        K = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.sin(timeOffset));
      } else if (form < 5) {
        A = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.tan(timeOffset));
        B = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.tan(timeOffset));
        C = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.tan(timeOffset));
        D = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.tan(timeOffset));
        E = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        F = Math.abs(avg * 0.1) + Math.abs(scaler * offset * Math.cos(timeOffset));
        G = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.sin(timeOffset));
        H = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.tan(timeOffset));
        I = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.tan(timeOffset));
        J = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.tan(timeOffset));
        K = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.tan(timeOffset));
      } else {
        A = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.cos(timeOffset));
        B = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.tan(timeOffset));
        C = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.cos(timeOffset));
        D = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.cos(timeOffset));
        E = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.cos(timeOffset));
        F = Math.abs(avg * 0.1) + Math.abs(scaler * offset * Math.tan(timeOffset));
        G = Math.abs(avg * 0.097) + Math.abs(scaler * offset * Math.cos(timeOffset));
        H = Math.abs(avg * 0.087) + Math.abs(scaler * offset * Math.cos(timeOffset));
        I = Math.abs(avg * 0.071) + Math.abs(scaler * offset * Math.cos(timeOffset));
        J = Math.abs(avg * 0.05) + Math.abs(scaler * offset * Math.tan(timeOffset));
        K = Math.abs(avg * 0.026) + Math.abs(scaler * offset * Math.cos(timeOffset));
      }
      
      const corner = Math.abs(Math.floor(eyesy.audio_in[1] || 0) * (eyesy.knob3 * 2 - 1) / 2);
      
      // Top arc
      canvas.lines([
        [0, corner],
        [x22, A],
        [x86, B],
        [x187, C],
        [x320, D],
        [x474, E],
        [x640, F],
        [x806, G],
        [x960, H],
        [x1093, I],
        [x1194, J],
        [x1258, K],
        [this.xr, corner]
      ], color, 1, false);
      
      // Bottom arc
      canvas.lines([
        [0, this.yr - corner],
        [x22, this.yr - A],
        [x86, this.yr - B],
        [x187, this.yr - C],
        [x320, this.yr - D],
        [x474, this.yr - E],
        [x640, this.yr - F],
        [x806, this.yr - G],
        [x960, this.yr - H],
        [x1093, this.yr - I],
        [x1194, this.yr - J],
        [x1258, this.yr - K],
        [this.xr, this.yr - corner]
      ], color, 1, false);
      
      // Right arc
      canvas.lines([
        [this.xr + corner, 0],
        [this.xr - A, y12],
        [this.xr - B, y48],
        [this.xr - C, y105],
        [this.xr - D, y180],
        [this.xr - E, y267],
        [this.xr - F, y360],
        [this.xr - G, y453],
        [this.xr - H, y540],
        [this.xr - I, y615],
        [this.xr - J, y672],
        [this.xr - K, y708],
        [this.xr - corner, this.yr]
      ], color, 1, false);
      
      // Left arc
      canvas.lines([
        [corner, 0],
        [A, y12],
        [B, y48],
        [C, y105],
        [D, y180],
        [E, y267],
        [F, y360],
        [G, y453],
        [H, y540],
        [I, y615],
        [J, y672],
        [K, y708],
        [corner, this.yr]
      ], color, 1, false);
    }
  }
}
