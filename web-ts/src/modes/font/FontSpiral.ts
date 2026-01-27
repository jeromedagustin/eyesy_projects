import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

/**
 * Font - Spiral
 * Text characters arranged in a spiral pattern that rotates and pulses with audio
 * 
 * Knob1 - Rotation speed
 * Knob2 - Spiral tightness
 * Knob3 - Text size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class FontSpiral extends BaseAnimatedMode {
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
    
    // Calculate parameters
    const rotationSpeed = eyesy.knob1 * 2.0 + 0.2;
    const spiralTightness = eyesy.knob2 * 0.1 + 0.02;
    const baseSize = Math.floor(eyesy.knob3 * 120 + 40); // Increased minimum size
    
    // Audio reactivity affects rotation speed and size
    const audioBoost = 1.0 + audioLevel * 0.8;
    const reactiveRotation = this.time * rotationSpeed * audioBoost;
    const reactiveSize = baseSize * (1.0 + audioLevel * 0.4);
    
    // Create font
    const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
    if (!this.font || this.font.size !== Math.floor(reactiveSize) || this.font.fontFamily !== currentFontFamily) {
      this.font = createFont(eyesy.mode_root + '/font.ttf', Math.floor(reactiveSize), currentFontFamily);
    }
    
    const baseColorRaw = eyesy.color_picker_lfo(eyesy.knob4, 0.1);
    // Ensure base color is visible (not too dark)
    const baseColor: [number, number, number] = [
      Math.max(50, baseColorRaw[0]),
      Math.max(50, baseColorRaw[1]),
      Math.max(50, baseColorRaw[2])
    ];
    const centerX = eyesy.xres / 2;
    const centerY = eyesy.yres / 2;
    const maxRadius = Math.min(eyesy.xres, eyesy.yres) * 0.4;
    
    // Draw characters in spiral
    for (let i = 0; i < this.textChars.length; i++) {
      const char = this.textChars[i];
      if (char === ' ') continue;
      
      // Calculate spiral position
      const angle = (i * spiralTightness) + reactiveRotation;
      const radius = (i / this.textChars.length) * maxRadius * (1.0 + audioLevel * 0.3);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Size variation based on position in spiral
      const sizeVariation = 0.8 + (i / this.textChars.length) * 0.4;
      const charSize = reactiveSize * sizeVariation;
      
      if (charSize < 20) continue; // Increased minimum size
      
      // Create font for this character if size changed
      let charFont = this.font;
      if (Math.abs(charSize - reactiveSize) > 5) {
        charFont = createFont(eyesy.mode_root + '/font.ttf', Math.floor(charSize), currentFontFamily);
      }
      
      // Color variation based on angle
      const colorPhase = (angle / Math.PI) % 1.0;
      const color: [number, number, number] = [
        Math.floor(baseColor[0] * (0.6 + colorPhase * 0.4)),
        Math.floor(baseColor[1] * (0.6 + colorPhase * 0.4)),
        Math.floor(baseColor[2] * (0.6 + colorPhase * 0.4))
      ];
      
      // Render character
      const textRender = renderText(charFont, char, false, color);
      canvas.blitText(textRender.texture, x, y, true, true);
    }
  }

  private updateText(eyesy: EYESY): void {
    if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      this.textChars = eyesy.font_text.split('');
    } else {
      // Generate characters for spiral
      const numChars = 20 + Math.floor(Math.random() * 20);
      const choices = [
        [0x25a0, 0x25ff], // Geometric Shapes
        [0x2600, 0x26ff], // Miscellaneous Symbols
        [0x2700, 0x27bf], // Dingbats
      ];
      const choice = choices[Math.floor(Math.random() * choices.length)];
      this.textChars = [];
      for (let i = 0; i < numChars; i++) {
        const code = choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1));
        try {
          this.textChars.push(String.fromCodePoint(code));
        } catch {
          this.textChars.push(String.fromCharCode(0x25cf)); // Black circle
        }
      }
    }
  }
}

