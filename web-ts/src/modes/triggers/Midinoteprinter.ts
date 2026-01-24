import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - MIDI Note Printer
 * Ported from Python version
 * 
 * Knob1 - number/location of MIDI Note Stream (bottom, top, top&bottom, 2xtop&bottom)
 * Knob2 - Angle
 * Knob3 - Square --> Circle
 * Knob4 - foreground color
 * Knob5 - background color
 */
const XC = 128; // horizontal count
const YC = 72; // vertical count

interface MidiHistoryEntry {
  note: boolean;
  color: [number, number, number];
}

export class Midinoteprinter implements Mode {
  private xr = 1280;
  private yr = 720;
  private midiHistory: MidiHistoryEntry[][] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    // Initialize the history with default values for rows
    this.midiHistory = [];
    for (let j = 0; j < YC; j++) {
      const row: MidiHistoryEntry[] = [];
      for (let i = 0; i < XC; i++) {
        row.push({ note: false, color: [0, 0, 0] });
      }
      this.midiHistory.push(row);
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    const bgColor = eyesy.color_picker_bg(eyesy.knob5);
    const squareSize = this.xr / XC;
    const vSquareSize = this.yr / YC;
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Square Parameters
    const thickness = 1;
    const cornerRadius = Math.floor(eyesy.knob3 * (squareSize / 2));
    
    // Shift the history down one row
    this.midiHistory.shift();
    const newRow: MidiHistoryEntry[] = [];
    for (let i = 0; i < 128; i++) {
      newRow.push({ note: eyesy.midi_notes[i], color });
    }
    this.midiHistory.push(newRow);
    
    // Calculate the shift based on knob1
    const maxShift = 1.8 * squareSize;
    const shift = eyesy.knob2 * maxShift;
    const set = Math.floor(eyesy.knob1 * 3);
    
    for (let j = 0; j < YC; j++) {
      for (let i = 0; i < XC; i++) {
        const x = i * squareSize;
        const y = j * vSquareSize;
        
        // Calculate rect positions based on set mode
        let rect: [number, number, number, number];
        let rect2: [number, number, number, number];
        let rect3: [number, number, number, number] | null = null;
        let rect4: [number, number, number, number] | null = null;
        
        if (set === 0) {
          // 2x bottom
          rect = [x + ((72 - j) * shift), y, squareSize, vSquareSize];
          rect2 = [x + ((72 - j) * shift * -1), y, squareSize, vSquareSize];
        } else if (set === 1) {
          // 2x top
          rect = [x + ((72 - j) * shift), this.yr - y - squareSize, squareSize, vSquareSize];
          rect2 = [x + ((72 - j) * shift * -1), this.yr - y - squareSize, squareSize, vSquareSize];
        } else if (set === 2) {
          // 1x top, 1x bottom
          rect = [x + ((YC - j) * shift), y, squareSize, vSquareSize];
          rect2 = [x + ((YC - j) * shift * -1), this.yr - y - squareSize, squareSize, vSquareSize];
        } else {
          // 2x top & 2x bottom
          rect = [x + ((72 - j) * shift), y, squareSize, vSquareSize];
          rect2 = [x + ((72 - j) * shift * -1), y, squareSize, vSquareSize];
          rect3 = [x + ((72 - j) * shift), this.yr - y - squareSize, squareSize, vSquareSize];
          rect4 = [x + ((72 - j) * shift * -1), this.yr - y - squareSize, squareSize, vSquareSize];
        }
        
        const midiNote = this.midiHistory[j][i];
        if (midiNote.note) {
          if (set <= 2) {
            canvas.rect(rect[0], rect[1], rect[2], rect[3], midiNote.color, 0);
            canvas.rect(rect2[0], rect2[1], rect2[2], rect2[3], midiNote.color, 0);
          } else {
            canvas.rect(rect[0], rect[1], rect[2], rect[3], midiNote.color, 0);
            canvas.rect(rect2[0], rect2[1], rect2[2], rect2[3], midiNote.color, 0);
            if (rect3) {
              canvas.rect(rect3[0], rect3[1], rect3[2], rect3[3], midiNote.color, 0);
            }
            if (rect4) {
              canvas.rect(rect4[0], rect4[1], rect4[2], rect4[3], midiNote.color, 0);
            }
          }
        }
      }
    }
  }
}
