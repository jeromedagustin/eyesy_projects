import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Cone Scope
 * Ported from Python version
 * 
 * Knob1 - x position
 * Knob2 - angle
 * Knob3 - line width
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class ConeScope implements Mode {
  private lastTriggerState = false;
  private triggerPulse = 0.0; // Trigger pulse value that decays

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.lastTriggerState = false;
    this.triggerPulse = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    // Handle trigger - create pulse on rising edge
    if (eyesy.trig && !this.lastTriggerState) {
      this.triggerPulse = 1.0; // Full pulse on trigger
    }
    this.lastTriggerState = eyesy.trig;
    
    // Decay trigger pulse over time
    this.triggerPulse = Math.max(0.0, this.triggerPulse - eyesy.deltaTime * 2.0);

    for (let i = 0; i < 50; i++) {
      this.seg(canvas, eyesy, i);
    }
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    const x0 = Math.floor(eyesy.knob1 * eyesy.xres);
    
    // Use AudioScope for consistent normalization and microphone checking
    let audioVal = AudioScope.getSampleClamped(eyesy, i);
    
    // If no audio and trigger is active, use trigger pulse to create visual feedback
    if (!eyesy.mic_enabled && this.triggerPulse > 0.0) {
      // Create a wave pattern based on trigger pulse
      const wave = Math.sin((i / 50) * Math.PI * 4 + eyesy.time * 3) * this.triggerPulse;
      audioVal = wave * 0.3; // Scale trigger wave to reasonable amplitude
    }
    
    // Python: soundwidth = (audio_in[i] * xres) / (xres * 35) = audio_in[i] / 35
    // Since audioVal is normalized (-1.0 to 1.0), we need to scale it back to match Python
    // audio_in[i] ranges from -32768 to 32767, so we scale: audioVal * 32768 / 35
    const soundwidth = (audioVal * 32768) / 35;
    const x1 = x0 + soundwidth;
    const linespacing = eyesy.yres / 50;
    const y = i * linespacing;
    const newy = 0.8 * eyesy.yres - Math.floor(eyesy.knob2 * 1.5972 * eyesy.yres);
    const linewratio = eyesy.xres * 0.016;
    const linewidth = Math.floor(eyesy.knob3 * linewratio);

    canvas.line([x0, y + i], [x1, y + i + newy], color, 1 + linewidth);
  }
}




