import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - Audio Printer
 * Ported from Python version
 * 
 * Knob1 - print direction & quantity (scans up, scans down, up/down)
 * Knob2 - horizontal shift amount
 * Knob3 - audio level (quiet - loud)
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Audioprinter implements Mode {
  private xr = 1280;
  private yr = 720;
  private xc = 100; // horizontal count (matching the length of eyesy.audio_in)
  private yc = 72;  // vertical count
  private audioHistory: Array<Array<[number, [number, number, number]]>> = [];
  private squareSize = 0;
  private vSquareSize = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    // Initialize the history with default values for rows
    this.audioHistory = [];
    for (let j = 0; j < this.yc; j++) {
      const row: Array<[number, [number, number, number]]> = [];
      for (let i = 0; i < this.xc; i++) {
        row.push([0, [0, 0, 0]]);
      }
      this.audioHistory.push(row);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Calculate the size of each square based on the x resolution with a border
    this.squareSize = this.xr / this.xc;
    this.vSquareSize = this.yr / this.yc;
    
    // Shift the history down one row
    this.audioHistory.shift();
    
    // Set the threshold for capturing the audio input (normalized 0.0 to 1.0)
    const volume = 0.3 - (eyesy.knob3 * 0.3); // Maps to 0.0-0.3 range
    
    // Create a new row based on audio input threshold
    const newRow: Array<[number, [number, number, number]]> = [];
    for (let i = 0; i < this.xc; i++) {
      // Use AudioScope for consistent normalization and microphone checking
      const audioVal = AudioScope.getSampleClamped(eyesy, i);
      const value = Math.abs(audioVal); // Already normalized -1.0 to 1.0
      if (value > volume) {
        newRow.push([1, color]);
      } else {
        newRow.push([0, [0, 0, 0]]);
      }
    }
    this.audioHistory.push(newRow);
    
    // Calculate the horizontal shift based on knob2
    const maxShift = 3.8 * this.squareSize;
    let shift = 0;
    if (eyesy.knob2 < 0.40) {
      // shift left
      shift = (0.40 - eyesy.knob2) * maxShift * -1;
    } else if (eyesy.knob2 > 0.60) {
      // shift right
      shift = (eyesy.knob2 - 0.60) * maxShift;
    }
    
    // Select the style of drawing the boxes (scan up, down, up/down)
    const set = Math.floor(eyesy.knob1 * 2);
    
    for (let j = 0; j < this.yc; j++) {
      for (let i = 0; i < this.xc; i++) {
        const x = i * this.squareSize;
        const y = j * this.vSquareSize;
        const [audioInput, noteColor] = this.audioHistory[j][i];
        
        if (audioInput === 1) {
          if (set === 0) {
            // 2x bottom
            const rectX = x + ((this.yc - j) * shift);
            canvas.rect(rectX, y, this.squareSize, this.vSquareSize, noteColor, 0);
          } else if (set === 1) {
            // 2x top
            const rectX = x + ((this.yc - j) * shift);
            canvas.rect(rectX, this.yr - y - this.vSquareSize, this.squareSize, this.vSquareSize, noteColor, 0);
          } else {
            // set == 2: 1x top, 1x bottom
            const rectX = x + ((this.yc - j) * shift);
            const rect2X = x + ((this.yc - j) * shift * -1);
            canvas.rect(rectX, y, this.squareSize, this.vSquareSize, noteColor, 0);
            canvas.rect(rect2X, this.yr - y - this.vSquareSize, this.squareSize, this.vSquareSize, noteColor, 0);
          }
        }
      }
    }
  }
}
