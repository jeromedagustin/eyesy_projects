import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * T - Font Recedes
 * Ported from Python version
 * 
 * Knob1 - speed (how fast character shrinks)
 * Knob2 - initial size
 * Knob3 - shrink rate
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Fontrecedes implements Mode {
  private size = 1000;
  private gs = 0;
  private x = 640;
  private y = 360;
  private yo = 255;
  private speed = 1;
  private unistr = '';
  private font: Font | null = null;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.size = 1000;
    this.gs = 0;
    this.x = 640;
    this.y = 360;
    this.yo = 255;
    this.speed = 1;
    this.unistr = '';
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Use trig or midi_note_new if available
    const audioTrigger = eyesy.audio_trig || eyesy.trig || eyesy.midi_note_new;
    
    if (audioTrigger) {
      this.gs = 1;
      const xr = eyesy.xres;
      const size500 = (500 * xr) / 1280;
      this.size = size500 * (eyesy.knob2 + 0.1);
      
      // Use custom text if provided, otherwise generate random Unicode character
      if (eyesy.font_text && eyesy.font_text.trim() !== '') {
        this.unistr = eyesy.font_text;
      } else {
        const choices = [
          [0x2580, 0x25AF], // Different Boxes
          [0xA500, 0xA62B], // Vai syllables
          [0x4DC2, 0x4DCF], // I Ching
          [0x2800, 0x28FF], // Braille
          [0x2500, 0x257f], // Box Drawing
          [0x1680, 0x169C], // Ogham
          [0x25a0, 0x25ff]  // Geometric Shapes
        ];
        const choice = choices[Math.floor(Math.random() * choices.length)];
        this.unistr = String.fromCharCode(choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1)));
      }
      
      this.x = Math.floor(Math.random() * eyesy.xres);
      this.y = Math.floor(Math.random() * eyesy.yres);
      this.speed = Math.floor(eyesy.knob1 * 100 + 1);
      this.yo = this.speed;
    }
    
    if (this.gs === 1 && this.size > 0 && this.unistr) {
      const color = eyesy.color_picker(eyesy.knob4);
      const coloryo: [number, number, number] = [
        Math.floor(color[0] * this.speed / this.yo),
        Math.floor(color[1] * this.speed / this.yo),
        Math.floor(color[2] * this.speed / this.yo)
      ];
      
      // Ensure color is not too dark (avoid (1,1,1))
      if (coloryo[0] === 1 && coloryo[1] === 1 && coloryo[2] === 1) {
        coloryo[0] = coloryo[1] = coloryo[2] = 0;
      }
      
      // Create font with current size and custom font family
      const fontSize = Math.max(1, Math.floor(this.size));
      const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
      if (!this.font || this.font.size !== fontSize || this.font.fontFamily !== currentFontFamily) {
        this.font = createFont(eyesy.mode_root + '/font.ttf', fontSize, currentFontFamily);
      }
      
      // Use custom text if provided, otherwise use unistr
      const displayText = (eyesy.font_text && eyesy.font_text.trim() !== '') ? eyesy.font_text : this.unistr;
      
      // Render text
      const textRender = renderText(this.font, displayText, false, coloryo);
      
      // Draw text centered at (x, y)
      canvas.blitText(textRender.texture, this.x, this.y, true, true); // centerX, centerY
      
      // Shrink size
      this.size = this.size - 5 * 50 * (eyesy.knob3 + 0.02);
      this.yo = this.yo + 1;
      if (this.yo > 255) this.yo = 255;
      if (this.size < 1) this.size = 1;
    }
  }
}
