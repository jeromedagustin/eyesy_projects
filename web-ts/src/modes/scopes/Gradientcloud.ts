import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Gradient Cloud
 * Ported from Python version
 * 
 * Knob1 - cloud x position
 * Knob2 - cloud y position
 * Knob3 - pattern shape and swell range
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Gradientcloud implements Mode {
  private colorRate = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.colorRate = 0; // Reset color rate on setup
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const xr = eyesy.xres;
    const x240 = xr * 0.188;
    const xhalf = xr / 2;
    const yr = eyesy.yres;
    const yhalf = yr / 2;
    const y480 = yr * 0.667;
    const xpos1 = Math.floor(eyesy.knob1 * 4 * x240) - 2 * x240;
    const cool = Math.floor(yhalf);
    const currentTime = eyesy.time; // Use eyesy.time which respects speed multiplier
    
    // Reset colorRate each frame to prevent overflow, use time-based cycling
    let frameColorRate = (currentTime * 0.1) % 1.0;
    
    for (let i = 0; i < cool; i++) {
      let xpos = Math.floor(x240 + Math.floor(xhalf * Math.sin(0.5 + currentTime) * eyesy.knob3));
      // Use AudioScope for consistent audio handling
      // Python version uses audio_in[i % 99] / 100
      // AudioScope returns normalized (-1 to 1), so multiply by 32768 to get raw, then divide by 100
      const audioVal = AudioScope.getSample(eyesy, i % 99);
      const audioScaled = (audioVal * 32768) / 100;
      const ypos = Math.floor((eyesy.knob2 * y480) + audioScaled + Math.floor(30 * Math.cos(1 * 1 + currentTime)));
      
      // Color cycling based on knob4 and loop index
      frameColorRate += (eyesy.knob4 * 0.02);
      const color = eyesy.color_picker(frameColorRate % 1.0);
      
      // Calculate radius - ensure minimum size of 2
      const radiusBase = 30 + 20 * Math.sin(i * eyesy.knob3 * 3 + currentTime);
      const radius = Math.max(2, Math.floor(radiusBase));
      
      xpos = Math.floor(xr / 2 + xpos * Math.sin(i * 1 + currentTime));
      
      canvas.circle([xpos + xpos1, i + ypos], radius, color, 0);
    }
  }
}
