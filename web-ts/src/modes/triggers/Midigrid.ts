import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * T - MIDI Grid
 * Ported from Python version
 * 
 * Knob1 - MIDI Data (number, name, number & name, blank)
 * Knob2 - Grid Settings (off, square --> circle, off)
 * Knob3 - Feedback setting. all the way left is 'off'
 * Knob4 - foreground color
 * Knob5 - background color
 */
const MIDI_NOTE_NAMES = [
  "G9", "F#9", "F9", "E9", "D#9", "D9", "C#9", "C9",
  "B8", "A#8", "A8", "G#8", "G8", "F#8", "F8", "E8", "D#8", "D8", "C#8", "C8",
  "B7", "A#7", "A7", "G#7", "G7", "F#7", "F7", "E7", "D#7", "D7", "C#7", "C7",
  "B6", "A#6", "A6", "G#6", "G6", "F#6", "F6", "E6", "D#6", "D6", "C#6", "C6",
  "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5", "C5",
  "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4",
  "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3", "C3",
  "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2", "D#2", "D2", "C#2", "C2",
  "B1", "A#1", "A1", "G#1", "G1", "F#1", "F1", "E1", "D#1", "D1", "C#1", "C1",
  "B0", "A#0", "A0", "G#0", "G0", "F#0", "F0", "E0", "D#0", "D0", "C#0", "C0",
  "B-1", "A#-1", "A-1", "G#-1", "G-1", "F#-1", "F-1", "E-1", "D#-1", "D-1", "C#-1", "C-1"
];

function scaleKnob2Value(knob2Value: number): number {
  const inputMin = 0.25;
  const inputMax = 0.80;
  if (knob2Value < inputMin) {
    return 0.0;
  } else if (knob2Value > inputMax) {
    return 1.0;
  } else {
    return (knob2Value - inputMin) / (inputMax - inputMin);
  }
}

export class Midigrid implements Mode {
  private xr = 1280;
  private yr = 720;
  private squareSize = 0;
  private font: Font | null = null;
  private smallFont: Font | null = null;
  private cornerRadius = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.squareSize = (eyesy.xres * 0.9) / 16;
    this.smallFont = createFont('', Math.floor(this.squareSize / 2.2));
    this.font = createFont('', Math.floor(this.squareSize / 2));
    this.cornerRadius = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    const bgColor = eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4, 1.5);
    
    const xF = 0.078; // max feedback distance in x dimension
    const yF = 0.139; // max feedback distance in y dimension
    const xrSm = this.xr - (this.xr * (eyesy.knob3 * xF));
    const yrSm = this.yr - (this.yr * (eyesy.knob3 * yF));
    
    // Screengrab feedback loop
    if (eyesy.knob3 > 0.1) {
      // Turn on feedback
      const feedbackX = Math.floor(this.xr * (eyesy.knob3 * (xF / 2)));
      const feedbackY = Math.floor(this.yr * (eyesy.knob3 * (yF / 2)));
      canvas.blitLastFrame(feedbackX, feedbackY, Math.floor(xrSm), Math.floor(yrSm), 1.0);
    }
    
    // Square Parameters
    const thickness = 1;
    if (eyesy.knob2 < 0.25) {
      this.cornerRadius = 0;
    }
    if (0.25 <= eyesy.knob2 && eyesy.knob2 < 0.85) {
      this.cornerRadius = Math.floor(scaleKnob2Value(eyesy.knob2) * (this.squareSize / 2));
    }
    const gridlines = !(eyesy.knob2 < 0.15 || eyesy.knob2 > 0.91);
    
    for (let i = 0; i < 128; i++) {
      const row = Math.floor(i / 16);
      const col = i % 16;
      const x = col * this.squareSize + (eyesy.xres - 16 * this.squareSize) / 2;
      const y = row * this.squareSize + (eyesy.yres - 8 * this.squareSize) / 2;
      
      // Draw the square
      if (eyesy.midi_notes[i]) {
        canvas.rect(x, y, this.squareSize, this.squareSize, color, 0);
      } else {
        if (gridlines) {
          const outlineColor: [number, number, number] = [255, 255, 255];
          canvas.rect(x, y, this.squareSize, this.squareSize, outlineColor, thickness);
        }
      }
      
      // Determine the text to display based on knob1 value
      let textContent: string;
      if (eyesy.knob1 < 0.25) {
        textContent = i.toString();
      } else if (0.25 <= eyesy.knob1 && eyesy.knob1 < 0.5) {
        textContent = MIDI_NOTE_NAMES[127 - i];
      } else if (0.5 <= eyesy.knob1 && eyesy.knob1 < 0.75) {
        textContent = `${i}\n${MIDI_NOTE_NAMES[127 - i]}`;
      } else {
        textContent = '\u2003'; // em space character
      }
      
      // Draw the text
      if (textContent.includes('\n')) {
        // Split the text into two lines
        const lines = textContent.split('\n');
        const text1 = renderText(this.smallFont!, lines[0], false, [255, 255, 255]);
        const text2 = renderText(this.smallFont!, lines[1], false, [255, 255, 255]);
        const textX = x + this.squareSize / 2;
        const textY1 = y + this.squareSize / 3;
        const textY2 = y + (3 * this.squareSize) / 4.5;
        canvas.blitText(text1.texture, textX, textY1, true, true);
        canvas.blitText(text2.texture, textX, textY2, true, true);
      } else {
        const text = renderText(this.font!, textContent, false, [255, 255, 255]);
        const textX = x + this.squareSize / 2;
        const textY = y + this.squareSize / 2;
        canvas.blitText(text.texture, textX, textY, true, true);
      }
    }
    
    // Capture frame for feedback
    canvas.captureFrame();
  }
}
