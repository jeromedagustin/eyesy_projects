import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * T - Font Patterns
 * Ported from Python version
 * 
 * Knob1 - horizontal offset
 * Knob2 - size
 * Knob3 - font set
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Fontpatterns implements Mode {
  private xr = 1280;
  private yr = 720;
  private trigger = false;
  private unistr = String.fromCharCode(0x25a0 + Math.floor(Math.random() * (0x25ff - 0x25a0 + 1)));
  private font: Font | null = null;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.trigger = false;
    this.unistr = String.fromCharCode(0x25a0 + Math.floor(Math.random() * (0x25ff - 0x25a0 + 1)));
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    const x320 = Math.floor(this.xr * 0.250); // ((320*xr)/1280)
    const x160 = Math.floor(this.xr * 0.125); // ((160*xr)/1280)
    const x260 = Math.floor(this.xr * 0.3); // ((260*xr)/1280)
    const y90 = Math.floor(this.yr * 0.125); // ((90*yr)/720)
    const y45 = Math.floor(this.yr * 0.063); // ((45*yr)/720)
    
    const shift = Math.floor(eyesy.knob1 * x320 - x160);
    const size = Math.floor(eyesy.knob2 * x260) + 5;
    
    // Create font (recreate if size changed or font family changed)
    const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
    if (!this.font || this.font.size !== size || this.font.fontFamily !== currentFontFamily) {
      this.font = createFont(eyesy.mode_root + '/font.ttf', size, currentFontFamily);
    }
    
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.05); // uniform color
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    // Use custom text if provided, otherwise use unicode characters
    let displayText = this.unistr;
    if (this.trigger) {
      if (eyesy.font_text && eyesy.font_text.trim() !== '') {
        // Use custom text - cycle through characters or use as-is
        displayText = eyesy.font_text;
      } else {
        // Use default unicode character generation
        this.unistr = this.getUnicodeCharacter(Math.floor(eyesy.knob3 * 11) + 1);
        displayText = this.unistr;
      }
    } else if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      // Use custom text even when not triggered
      displayText = eyesy.font_text;
    }
    this.trigger = false;
    
    // Render text once
    const textRender = renderText(this.font, displayText, false, color);
    
    // Draw text in grid pattern (10 rows x 9 columns)
    for (let j = 0; j < 10; j++) {
      for (let i = 0; i < 9; i++) {
        const odd = i % 2;
        let x: number;
        let y: number;
        
        if (odd === 0) {
          x = (i * x160 + x160 + shift) - x160;
          y = (j * y90) - y45;
        } else {
          x = (i * x160 + x160) - x160;
          y = (j * y90) - y45;
        }
        
        // Draw text centered at (x, y)
        canvas.blitText(textRender.texture, x, y, true, true); // centerX, centerY
      }
    }
  }

  private getUnicodeCharacter(set: number): string {
    if (set === 1) {
      // geometric shapes
      return String.fromCharCode(0x25a0 + Math.floor(Math.random() * (0x25ff - 0x25a0 + 1)));
    } else if (set === 2) {
      // arrows
      return String.fromCharCode(0x219C + Math.floor(Math.random() * (0x21BB - 0x219C + 1)));
    } else if (set === 3) {
      // math
      return String.fromCharCode(0x223D + Math.floor(Math.random() * (0x224D - 0x223D + 1)));
    } else if (set === 4) {
      // ogham
      return String.fromCharCode(0x1680 + Math.floor(Math.random() * (0x169C - 0x1680 + 1)));
    } else if (set === 5) {
      // box drawing
      return String.fromCharCode(0x2500 + Math.floor(Math.random() * (0x257f - 0x2500 + 1)));
    } else if (set === 6) {
      // Braille
      return String.fromCharCode(0x2800 + Math.floor(Math.random() * (0x28FF - 0x2800 + 1)));
    } else if (set === 7) {
      // I Ching
      return String.fromCharCode(0x4DC2 + Math.floor(Math.random() * (0x4DCF - 0x4DC2 + 1)));
    } else if (set === 8) {
      // from math -- sharp symbols
      return String.fromCharCode(0x2A80 + Math.floor(Math.random() * (0x2ABC - 0x2A80 + 1)));
    } else if (set === 9) {
      // vai syllables
      return String.fromCharCode(0xA500 + Math.floor(Math.random() * (0xA62B - 0xA500 + 1)));
    } else if (set === 10) {
      // chess
      return String.fromCharCode(0xE010 + Math.floor(Math.random() * (0xE04F - 0xE010 + 1)));
    } else if (set === 11) {
      // different boxes
      return String.fromCharCode(0x2580 + Math.floor(Math.random() * (0x25AF - 0x2580 + 1)));
    } else if (set === 12) {
      // select random glyph from the above subsets
      const choices = [
        [0x2580, 0x25AF], // Different Boxes
        [0xE010, 0xE04F], // Chess
        [0xA500, 0xA62B], // Vai syllables
        [0x2A80, 0x2ABC], // Sharp Symbols
        [0x4DC2, 0x4DCF], // I Ching
        [0x2800, 0x28FF], // Braille
        [0x2500, 0x257f], // Box Drawing
        [0x1680, 0x169C], // Ogham
        [0x223D, 0x224D], // Math
        [0x219C, 0x21BB], // Arrows
        [0x25a0, 0x25ff]  // Geometric Shapes
      ];
      const choice = choices[Math.floor(Math.random() * choices.length)];
      return String.fromCharCode(choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1)));
    }
    // Default fallback
    return String.fromCharCode(0x25a0);
  }
}
