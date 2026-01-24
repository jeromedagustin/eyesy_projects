import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - 0 Arrival Scope
 * Ported from Python version
 *
 * Knob1: number of boxes
 * Knob2: box width
 * Knob3: box fill/line width
 * Knob4: foreground color
 * Knob5: background color
 */
export class Mode0arrivalscope implements Mode {
  private minHeight = 5;
  private yhalf = 0;
  private lastEven = 2;
  private lastTriggerState = false;
  private triggerPulse = 0.0; // Trigger pulse value that decays

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.yhalf = eyesy.yres / 2;
    this.lastTriggerState = false;
    this.triggerPulse = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    canvas.fill(eyesy.bg_color);

    const color = eyesy.color_picker_lfo(eyesy.knob4);

    // Handle trigger - create pulse on rising edge
    if (eyesy.trig && !this.lastTriggerState) {
      this.triggerPulse = 1.0; // Full pulse on trigger
    }
    this.lastTriggerState = eyesy.trig;
    
    // Decay trigger pulse over time
    this.triggerPulse = Math.max(0.0, this.triggerPulse - eyesy.deltaTime * 2.0);

    // Number of VU boxes
    const precount = Math.floor(eyesy.knob1 * 80 + 20);
    const count = this.checkEven(precount); // Keep it even for xres division
    const spacing = eyesy.xres / count;
    const boxWidth = Math.floor(eyesy.knob2 * spacing) + 2;
    const boxWidthHalf = Math.floor(boxWidth / 2);
    const boxOffset = Math.floor((spacing - boxWidth) / 2);

    // Draw VU boxes
    for (let i = 0; i < count; i++) {
      // Use AudioScope for consistent normalization and microphone checking
      let audioVal = AudioScope.getSampleClamped(eyesy, i);
      
      // If no audio and trigger is active, use trigger pulse to create visual feedback
      if (!eyesy.mic_enabled && this.triggerPulse > 0.0) {
        // Create a wave pattern based on trigger pulse
        const wave = Math.sin((i / count) * Math.PI * 2 + eyesy.time * 2) * this.triggerPulse;
        audioVal = wave * 0.5; // Scale trigger wave to reasonable amplitude
      }
      
      // Normalize to 0-1 range (absolute value), then scale to screen height
      const height = Math.floor(Math.abs(audioVal) * eyesy.yres + this.minHeight);

      let fill: number;
      let corner: number;

      // Fill/stroke width & corner size
      if (eyesy.knob3 < 0.5) {
        fill = Math.floor(boxWidthHalf * eyesy.knob3) + 1;
        if (height <= (this.minHeight + fill) * 2) {
          corner = 0;
        } else {
          corner = Math.floor(boxWidthHalf * (eyesy.knob3 * 2));
        }
      } else {
        corner = Math.floor(boxWidthHalf * (2 - eyesy.knob3 * 2));
        fill = 0;
      }

      const x = Math.floor(i * spacing + boxWidthHalf + boxOffset) - boxWidthHalf;
      const y = this.yhalf - height / 2;
      const w = boxWidth;
      const h = Math.floor(height);

      // Draw rectangle (Canvas API doesn't support rounded rectangles directly, so we'll draw a regular rect)
      if (fill > 0) {
        // Filled rectangle with border
        canvas.rect(x, y, w, h, color, fill);
      } else {
        // Outlined rectangle
        canvas.rect(x, y, w, h, color, 1);
      }
    }
  }

  private checkEven(number: number): number {
    if (number % 2 === 0) {
      this.lastEven = number;
      return number;
    } else {
      return this.lastEven;
    }
  }
}
