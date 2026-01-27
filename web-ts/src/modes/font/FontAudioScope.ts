import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * Font - Audio Scope
 * Text characters arranged along audio waveform, creating a visualizer effect
 * 
 * Knob1 - Waveform scale
 * Knob2 - Character spacing
 * Knob3 - Text size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class FontAudioScope extends BaseAnimatedMode {
  private font: Font | null = null;
  private textChars: string[] = [];
  private lastTriggerState = false;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    this.updateText(eyesy);
    this.lastTriggerState = false;
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Update text on trigger or if font_text changed
    const currentText = (eyesy.font_text && eyesy.font_text.trim() !== '') ? eyesy.font_text : '';
    if ((eyesy.trig && !this.lastTriggerState) || (currentText && currentText !== this.textChars.join(''))) {
      this.updateText(eyesy);
    }
    this.lastTriggerState = eyesy.trig;
    
    if (this.textChars.length === 0) {
      // If no text, generate default
      this.updateText(eyesy);
      if (this.textChars.length === 0) return;
    }
    
    // Get audio samples for waveform
    const audioSamples = this.getAudioSamples(eyesy);
    if (audioSamples.length === 0) return;
    
    // Calculate parameters
    const waveformScale = eyesy.knob1 * 200 + 50;
    const charSpacing = eyesy.knob2 * 40 + 20;
    const baseSize = Math.floor(eyesy.knob3 * 120 + 40); // Increased minimum size for visibility
    
    // Audio-reactive size
    const reactiveSize = baseSize * (1.0 + audioLevel * 0.5);
    
    // Create font
    const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
    if (!this.font || this.font.size !== Math.floor(reactiveSize) || this.font.fontFamily !== currentFontFamily) {
      this.font = createFont(eyesy.mode_root + '/font.ttf', Math.floor(reactiveSize), currentFontFamily);
    }
    
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.15);
    // Ensure color is visible (not too dark)
    const visibleColor: [number, number, number] = [
      Math.max(50, color[0]),
      Math.max(50, color[1]),
      Math.max(50, color[2])
    ];
    const centerY = eyesy.yres / 2;
    
    // Calculate positions for all characters, accounting for spaces
    // Spaces should take up space in the layout
    const spaceWidth = charSpacing * 0.6; // Spaces are 60% of character spacing
    const charWidth = reactiveSize * 0.6; // Approximate character width
    
    // First pass: calculate positions and total width including spaces
    const charPositions: { char: string; x: number; visibleIndex: number }[] = [];
    let currentX = 0;
    let visibleCharIndex = 0;
    
    for (let i = 0; i < this.textChars.length; i++) {
      const char = this.textChars[i];
      if (char === ' ') {
        // Space takes up spaceWidth
        charPositions.push({ char, x: currentX, visibleIndex: -1 });
        currentX += spaceWidth;
      } else {
        // Regular character: position it, then add spacing for next char
        charPositions.push({ char, x: currentX, visibleIndex: visibleCharIndex });
        currentX += charWidth; // Character width
        if (i < this.textChars.length - 1) {
          // Add spacing after character (except for last char)
          currentX += charSpacing;
        }
        visibleCharIndex++;
      }
    }
    
    // Total width is currentX (where we ended up)
    const totalWidth = currentX;
    const startX = (eyesy.xres - totalWidth) / 2;
    
    // Map audio samples to character positions
    const visibleChars = this.textChars.filter(c => c !== ' ').length;
    const samplesPerChar = Math.max(1, Math.floor(audioSamples.length / visibleChars));
    
    // Render characters at their calculated positions
    for (let i = 0; i < charPositions.length; i++) {
      const pos = charPositions[i];
      const char = pos.char;
      
      if (char === ' ') {
        continue; // Skip rendering spaces
      }
      
      // Get audio sample for this character
      const sampleIndex = Math.floor(pos.visibleIndex * samplesPerChar);
      const audioValue = audioSamples[Math.min(sampleIndex, audioSamples.length - 1)];
      
      // Calculate Y position based on audio
      const yOffset = audioValue * waveformScale;
      const x = startX + pos.x;
      const y = centerY + yOffset;
      
      // Size variation based on audio
      const charSize = reactiveSize * (0.8 + Math.abs(audioValue) * 0.4);
      if (charSize < 20) continue; // Increased minimum size
      
      // Create font for this character if size changed significantly
      let charFont = this.font;
      if (Math.abs(charSize - reactiveSize) > 5) {
        charFont = createFont(eyesy.mode_root + '/font.ttf', Math.floor(charSize), currentFontFamily);
      }
      
      // Color variation based on audio (ensure minimum brightness)
      const audioColor: [number, number, number] = [
        Math.max(50, Math.floor(visibleColor[0] * (0.7 + Math.abs(audioValue) * 0.3))),
        Math.max(50, Math.floor(visibleColor[1] * (0.7 + Math.abs(audioValue) * 0.3))),
        Math.max(50, Math.floor(visibleColor[2] * (0.7 + Math.abs(audioValue) * 0.3)))
      ];
      
      // Render character
      const textRender = renderText(charFont, char, false, audioColor);
      canvas.blitText(textRender.texture, x, y, true, true);
    }
  }

  private updateText(eyesy: EYESY): void {
    if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      this.textChars = eyesy.font_text.split('');
    } else {
      // Generate characters based on audio input length or default
      const numChars = Math.min(50, Math.max(10, Math.floor(eyesy.audio_in.length / 10) || 20));
      const choices = [
        [0x25a0, 0x25ff], // Geometric Shapes
        [0x2580, 0x259f], // Block Elements
        [0x2190, 0x21ff], // Arrows
      ];
      const choice = choices[Math.floor(Math.random() * choices.length)];
      this.textChars = [];
      for (let i = 0; i < numChars; i++) {
        const code = choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1));
        try {
          this.textChars.push(String.fromCodePoint(code));
        } catch {
          this.textChars.push(String.fromCharCode(0x2588)); // Full block
        }
      }
    }
  }

  private getAudioSamples(eyesy: EYESY): number[] {
    if (!eyesy.audio_in || eyesy.audio_in.length === 0) {
      // Generate fake waveform if no audio
      const samples: number[] = [];
      for (let i = 0; i < 50; i++) {
        samples.push(Math.sin(this.time * 2 + i * 0.1) * 0.3);
      }
      return samples;
    }
    
    // Normalize audio samples
    const samples: number[] = [];
    const step = Math.max(1, Math.floor(eyesy.audio_in.length / 50));
    for (let i = 0; i < eyesy.audio_in.length; i += step) {
      const normalized = (eyesy.audio_in[i] || 0) / 32768.0;
      samples.push(normalized);
    }
    return samples;
  }
}

