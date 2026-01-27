import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * Font - Wave
 * Audio-reactive text that waves and pulses with the music
 * 
 * Knob1 - Wave frequency/speed
 * Knob2 - Wave amplitude
 * Knob3 - Text size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class FontWave extends BaseAnimatedMode {
  private font: Font | null = null;
  private textChars: string[] = [];

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    this.updateText(eyesy);
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Update text on trigger or if font_text changed
    const currentText = (eyesy.font_text && eyesy.font_text.trim() !== '') ? eyesy.font_text : '';
    if (eyesy.trig || (currentText && currentText !== this.textChars.join(''))) {
      this.updateText(eyesy);
    }
    
    // Get text to display
    const displayText = this.getDisplayText(eyesy);
    if (!displayText || displayText.length === 0) {
      // If no text, generate default
      this.updateText(eyesy);
      return;
    }
    
    // Calculate wave parameters
    const waveSpeed = eyesy.knob1 * 3.0 + 0.5;
    const waveAmplitude = eyesy.knob2 * 100 + 20;
    const baseSize = Math.floor(eyesy.knob3 * 150 + 50); // Increased minimum size
    
    // Audio reactivity affects wave amplitude and size
    const audioBoost = 1.0 + audioLevel * 0.5;
    const reactiveAmplitude = waveAmplitude * audioBoost;
    const reactiveSize = baseSize * (1.0 + audioLevel * 0.3);
    
    // Create font with reactive size
    const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
    if (!this.font || this.font.size !== Math.floor(reactiveSize) || this.font.fontFamily !== currentFontFamily) {
      this.font = createFont(eyesy.mode_root + '/font.ttf', Math.floor(reactiveSize), currentFontFamily);
    }
    
    const baseColor = eyesy.color_picker_lfo(eyesy.knob4, 0.1);
    // Ensure color is visible (not too dark)
    const color: [number, number, number] = [
      Math.max(50, baseColor[0]),
      Math.max(50, baseColor[1]),
      Math.max(50, baseColor[2])
    ];
    
    // Draw each character with wave distortion
    const chars = displayText.split('');
    const charSpacing = reactiveSize * 0.7;
    
    // Calculate total width accounting for spaces
    const visibleChars = chars.filter(c => c !== ' ').length;
    const totalWidth = (visibleChars - 1) * charSpacing;
    const startX = (eyesy.xres - totalWidth) / 2;
    
    let charIndex = 0; // Track position of visible characters (excluding spaces)
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char === ' ') continue; // Skip spaces but don't increment charIndex
      
      // Calculate wave offset for this character
      const wavePhase = (this.time * waveSpeed) + (charIndex * 0.5);
      const waveOffset = Math.sin(wavePhase) * reactiveAmplitude;
      
      // Add audio-reactive vertical offset
      const audioOffset = audioLevel * 30 * Math.sin(this.time * 2 + charIndex);
      
      const x = startX + (charIndex * charSpacing);
      const y = eyesy.yres / 2 + waveOffset + audioOffset;
      
      charIndex++; // Only increment for visible characters
      
      // Render character
      const textRender = renderText(this.font, char, false, color);
      canvas.blitText(textRender.texture, x, y, true, true);
    }
  }

  private updateText(eyesy: EYESY): void {
    if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      this.textChars = eyesy.font_text.split('');
    } else {
      // Generate random unicode characters
      const choices = [
        [0x25a0, 0x25ff], // Geometric Shapes
        [0x2190, 0x21ff], // Arrows
        [0x2600, 0x26ff], // Miscellaneous Symbols
        [0x2700, 0x27bf], // Dingbats
        [0x1f300, 0x1f5ff], // Miscellaneous Symbols and Pictographs
      ];
      const choice = choices[Math.floor(Math.random() * choices.length)];
      const numChars = 8 + Math.floor(Math.random() * 8);
      this.textChars = [];
      for (let i = 0; i < numChars; i++) {
        const code = choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1));
        try {
          this.textChars.push(String.fromCodePoint(code));
        } catch {
          this.textChars.push(String.fromCharCode(0x25a0));
        }
      }
    }
  }

  private getDisplayText(eyesy: EYESY): string {
    return this.textChars.join('');
  }
}

