import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Classic Horizontal
 * Ported from Python version
 */
export class ClassicHorizontal implements Mode {
  private lines = 100;
  private lastTriggerState = false;
  private triggerPulse = 0.0; // Trigger pulse value that decays

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.lastTriggerState = false;
    this.triggerPulse = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set background
    eyesy.color_picker_bg(eyesy.knob5);

    // Handle trigger - create pulse on rising edge
    if (eyesy.trig && !this.lastTriggerState) {
      this.triggerPulse = 1.0; // Full pulse on trigger
    }
    this.lastTriggerState = eyesy.trig;
    
    // Decay trigger pulse over time
    this.triggerPulse = Math.max(0.0, this.triggerPulse - eyesy.deltaTime * 2.0);

    // Draw audio-reactive lines
    for (let i = 0; i < this.lines; i++) {
      this.seg(canvas, eyesy, i);
    }
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const space = eyesy.xres / (this.lines - 2);
    const y0 = 0;
    // Use AudioScope for consistent normalization and microphone checking
    let audioVal = AudioScope.getSample(eyesy, i);
    
    // If no audio and trigger is active, use trigger pulse to create visual feedback
    if (!eyesy.mic_enabled && this.triggerPulse > 0.0) {
      // Create a wave pattern based on trigger pulse
      const wave = Math.sin((i / this.lines) * Math.PI * 4 + eyesy.time * 3) * this.triggerPulse;
      audioVal = wave * 0.3; // Scale trigger wave to reasonable amplitude
    }
    
    const y1 = audioVal * eyesy.yres * (eyesy.knob3 + 0.5);
    const x = i * space;
    const linewidth = Math.max(1, Math.floor(eyesy.knob1 * eyesy.xres / this.lines));
    const position = eyesy.yres / 2;
    const ballSize = Math.max(1, Math.floor(eyesy.knob2 * eyesy.xres / (this.lines - 75)));
    const color = eyesy.color_picker_lfo(eyesy.knob4);

    // Draw circle
    canvas.circle([x, y1 + position], ballSize, color, 0);

    // Draw line
    canvas.line(
      [x, y0 + position],
      [x, y1 + position],
      color,
      linewidth
    );
  }
}

