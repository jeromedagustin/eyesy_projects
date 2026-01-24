import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Amp Color
 * Ported from Python version
 *
 * Knob1: Audio 'history' length - turn it up for 'smoother' colors
 * Knob2: bar width
 * Knob3: y position: switches between horizontal & vertical orientation
 * Knob4: [not used]
 * Knob5: background color
 */
export class Ampcolor implements Mode {
  private audioHistory: Map<number, number[]> = new Map();
  private currentHistoryLength: number | null = null;

  setup(canvas: Canvas, eyesy: EYESY): void {
    // No setup needed
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Number of vu boxes
    const count = 100;
    const spacing = eyesy.xres / count;
    const boxWidth = Math.floor(eyesy.knob2 * spacing) + 2;
    const boxOffset = Math.floor((spacing - boxWidth) / 2);
    const historyLength = Math.floor(eyesy.knob1 * 20) + 1;
    
    // Check if history_length has changed
    if (this.currentHistoryLength !== historyLength) {
      this.currentHistoryLength = historyLength;
      // Recreate history arrays with the new maxlen
      this.audioHistory.forEach((history, i) => {
        const newHistory = history.slice(-historyLength);
        this.audioHistory.set(i, newHistory);
      });
    }
    
    // Draw vu_boxes!
    for (let i = 0; i < count; i++) {
      const currentValue = Math.abs(eyesy.audio_in[i] / 32768);
      
      // Initialize history array for the index if not already present
      if (!this.audioHistory.has(i)) {
        this.audioHistory.set(i, []);
      }
      
      const history = this.audioHistory.get(i)!;
      history.push(currentValue);
      
      // Trim to max length
      if (history.length > historyLength) {
        history.shift();
      }
      
      // Calculate the average of the history
      const averageValue = history.reduce((a, b) => a + b, 0) / history.length;
      const color = eyesy.color_picker(averageValue);
      
      // Set vertical position
      const vPlace = eyesy.knob3 * eyesy.yres;
      
      // Calculate the x position with consistent spacing
      const xPosition = Math.floor(i * spacing + boxOffset);
      const xxPosition = Math.floor(-i * spacing - boxOffset - spacing);
      
      // Draw vertical box
      canvas.rect(xPosition, 0 + vPlace, boxWidth, eyesy.yres + vPlace, color, 0);
      
      // Draw horizontal box
      canvas.rect(0, xxPosition + vPlace, eyesy.xres, boxWidth, color, 0);
    }
  }
}
