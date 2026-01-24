import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

// Initialize a global dictionary to store audio history for each index
const audioHistory: { [key: number]: number[] } = {};
let currentHistoryLength: number | null = null;

function calculateOffset(knobValue: number, maxRange: number, count: number): number {
  // Calculate offset with center detent and adjust dynamically based on the number of ellipses
  if (0.48 <= knobValue && knobValue <= 0.52) {
    return 0;
  } else if (knobValue < 0.5) {
    // Scale the offset inversely with the number of ellipses
    return ((0.5 - knobValue) * maxRange) / (count * 0.5) * -1;
  } else {
    // Scale the offset inversely with the number of ellipses
    return ((knobValue - 0.5) * maxRange) / (count * 0.5);
  }
}

/**
 * S - Nested Ellipses - Filled
 * Ported from Python version
 * 
 * Knob1 - Audio History
 * Knob2 - Vertical Position
 * Knob3 - Nested Ellipse Count
 * Knob4 - Foreground Color
 * Knob5 - Background Color
 */
export class Nestedellipsesfilled implements Mode {
  private xr = 1280;
  private yr = 720;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    currentHistoryLength = null; // Reset history length to force re-initialization
    for (const key in audioHistory) {
      delete audioHistory[key]; // Clear existing history
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Calculate the number of ellipses based on knob3
    const count = Math.floor(eyesy.knob3 * 49) + 1;
    const historyLength = Math.floor(eyesy.knob1 * 20) + 1;
    
    // Check if history_length has changed
    if (currentHistoryLength !== historyLength) {
      currentHistoryLength = historyLength;
      // Recreate arrays with the new maxlen
      for (const i in audioHistory) {
        const oldArray = audioHistory[i];
        audioHistory[i] = oldArray.slice(-historyLength);
      }
    }
    
    const center: [number, number] = [this.xr / 2, this.yr / 2];
    
    // Calculate y_offset based on knob2 with center detent and dynamic adjustment
    const yOffset = calculateOffset(eyesy.knob2, this.yr / 2, count);
    
    // Draw nested ellipses
    for (let i = 0; i < count; i++) {
      const audioVal = eyesy.audio_in[i] || 0;
      const currentValue = Math.abs(audioVal / 15000); // Adjust the divisor for reactivity
      
      // Initialize history array for the index if not already present
      if (!(i in audioHistory)) {
        audioHistory[i] = [];
      }
      
      // Append the current value to the history
      audioHistory[i].push(currentValue);
      
      // Trim to max length
      if (audioHistory[i].length > historyLength) {
        audioHistory[i].shift();
      }
      
      // Calculate the average of the history
      const averageValue = audioHistory[i].reduce((sum, val) => sum + val, 0) / audioHistory[i].length;
      const color = eyesy.color_picker_lfo(eyesy.knob4, 0.08);
      
      // Calculate ellipse dimensions with even vertical spacing
      const maxVerticalRadius = this.yr / 2;
      const verticalRadius = maxVerticalRadius - (i * (maxVerticalRadius / count));
      const horizontalRadius = verticalRadius * averageValue; // Use audio history to determine horizontal radius
      
      // Draw the ellipse with y_offset
      canvas.ellipse(
        [Math.floor(center[0]), Math.floor(center[1] + yOffset * i)],
        Math.floor(horizontalRadius),
        Math.floor(verticalRadius),
        color,
        0
      );
    }
  }
}
