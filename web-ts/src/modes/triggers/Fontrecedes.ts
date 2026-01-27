import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

interface RecedingText {
  char: string;
  size: number;
  x: number;
  y: number;
  yo: number;
  speed: number;
  life: number;
  maxLife: number;
  color: [number, number, number];
}

/**
 * Font - Recedes
 * Enhanced with multiple receding characters and audio reactivity
 * 
 * Knob1 - speed (how fast character shrinks)
 * Knob2 - initial size
 * Knob3 - shrink rate / trail length
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Fontrecedes extends BaseAnimatedMode {
  private recedingTexts: RecedingText[] = [];
  private font: Font | null = null;
  private smoothedAudioLevel = 0.0;
  private lastTriggerState = false;
  private baseText = '';

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    this.recedingTexts = [];
    this.smoothedAudioLevel = 0.0;
    this.lastTriggerState = false;
    this.updateBaseText(eyesy);
    // Create initial text on setup so something is visible
    this.createInitialText(eyesy);
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Update base text if it changed
    const currentText = (eyesy.font_text && eyesy.font_text.trim() !== '') ? eyesy.font_text : '';
    if (currentText !== this.baseText) {
      this.updateBaseText(eyesy);
    }
    
    // Calculate audio reactivity
    this.smoothedAudioLevel = this.smoothedAudioLevel * 0.85 + audioLevel * 0.15;
    
    // Use trig or midi_note_new if available (only on rising edge)
    const audioTrigger = eyesy.audio_trig || eyesy.trig || eyesy.midi_note_new;
    
    if (audioTrigger && !this.lastTriggerState) {
      // Trigger on rising edge only
      const xr = eyesy.xres;
      const size500 = (500 * xr) / 1280;
      const initialSize = size500 * (eyesy.knob2 + 0.1) * (1.0 + this.smoothedAudioLevel * 0.5);
      
      // Use custom text if provided, otherwise generate random Unicode character
      let displayChar = '';
      if (eyesy.font_text && eyesy.font_text.trim() !== '') {
        // Use random character from custom text
        const chars = eyesy.font_text.split('');
        displayChar = chars[Math.floor(Math.random() * chars.length)];
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
        displayChar = String.fromCharCode(choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1)));
      }
      
      const x = Math.floor(Math.random() * eyesy.xres);
      const y = Math.floor(Math.random() * eyesy.yres);
      const speed = Math.floor(eyesy.knob1 * 100 + 1);
      const color = eyesy.color_picker(eyesy.knob4);
      
      // Create multiple receding instances for trail effect
      const trailCount = Math.floor(eyesy.knob3 * 5) + 1;
      for (let i = 0; i < trailCount; i++) {
        this.recedingTexts.push({
          char: displayChar,
          size: initialSize * (1.0 - i * 0.1),
          x: x,
          y: y,
          yo: speed,
          speed: speed,
          life: 100 + i * 20,
          maxLife: 100 + i * 20,
          color: [color[0], color[1], color[2]]
        });
      }
    }
    this.lastTriggerState = audioTrigger;
    
    // If no receding texts and we have base text, show it centered
    if (this.recedingTexts.length === 0 && this.baseText) {
      const xr = eyesy.xres;
      const size500 = (500 * xr) / 1280;
      const displaySize = size500 * (eyesy.knob2 + 0.1) * (1.0 + this.smoothedAudioLevel * 0.3);
      const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
      const fontSize = Math.max(40, Math.floor(displaySize));
      
      if (!this.font || Math.abs(this.font.size - fontSize) > 2 || this.font.fontFamily !== currentFontFamily) {
        this.font = createFont(eyesy.mode_root + '/font.ttf', fontSize, currentFontFamily);
      }
      
      const color = eyesy.color_picker(eyesy.knob4);
      // Ensure color is visible
      const visibleColor: [number, number, number] = [
        Math.max(50, color[0]),
        Math.max(50, color[1]),
        Math.max(50, color[2])
      ];
      
      // Render each character separately for proper spacing
      const chars = this.baseText.split('');
      const charSpacing = fontSize * 0.7;
      const totalWidth = (chars.filter(c => c !== ' ').length - 1) * charSpacing;
      const startX = (eyesy.xres - totalWidth) / 2;
      
      let charIndex = 0;
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === ' ') continue;
        
        const x = startX + (charIndex * charSpacing);
        const textRender = renderText(this.font, char, false, visibleColor);
        canvas.blitText(textRender.texture, x, eyesy.yres / 2, true, true);
        charIndex++;
      }
    }
    
    // Update and draw all receding texts
    for (let i = this.recedingTexts.length - 1; i >= 0; i--) {
      const rt = this.recedingTexts[i];
      
      // Update size and color
      rt.size = rt.size - 5 * 50 * (eyesy.knob3 + 0.02) * eyesy.deltaTime * 60;
      rt.yo = rt.yo + 1;
      if (rt.yo > 255) rt.yo = 255;
      if (rt.size < 1) rt.size = 1;
      
      rt.life -= eyesy.deltaTime * 60;
      
      // Remove dead instances
      if (rt.life <= 0 || rt.size < 5) {
        this.recedingTexts.splice(i, 1);
        continue;
      }
      
      // Calculate color fade
      const lifeRatio = rt.life / rt.maxLife;
      const coloryo: [number, number, number] = [
        Math.floor(rt.color[0] * rt.speed / rt.yo * lifeRatio),
        Math.floor(rt.color[1] * rt.speed / rt.yo * lifeRatio),
        Math.floor(rt.color[2] * rt.speed / rt.yo * lifeRatio)
      ];
      
      // Ensure color is not too dark
      if (coloryo[0] === 1 && coloryo[1] === 1 && coloryo[2] === 1) {
        coloryo[0] = coloryo[1] = coloryo[2] = 0;
      }
      
      // Add audio-reactive position offset
      const audioOffsetX = Math.sin(this.time * 2 + i) * this.smoothedAudioLevel * 20;
      const audioOffsetY = Math.cos(this.time * 2 + i) * this.smoothedAudioLevel * 20;
      
      // Create font with current size
      const fontSize = Math.max(1, Math.floor(rt.size));
      const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
      if (!this.font || Math.abs(this.font.size - fontSize) > 2 || this.font.fontFamily !== currentFontFamily) {
        this.font = createFont(eyesy.mode_root + '/font.ttf', fontSize, currentFontFamily);
      }
      
      // Render text
      const textRender = renderText(this.font, rt.char, false, coloryo);
      
      // Draw text centered at (x, y) with audio offset
      canvas.blitText(textRender.texture, rt.x + audioOffsetX, rt.y + audioOffsetY, true, true);
    }
  }

  private updateBaseText(eyesy: EYESY): void {
    if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      this.baseText = eyesy.font_text;
    } else {
      this.baseText = '';
    }
  }

  private createInitialText(eyesy: EYESY): void {
    // Create initial receding text on setup so something is visible
    if (this.baseText) {
      const xr = eyesy.xres;
      const size500 = (500 * xr) / 1280;
      const initialSize = size500 * (eyesy.knob2 + 0.1);
      
      // Use first character of text or generate one
      let displayChar = '';
      if (this.baseText) {
        displayChar = this.baseText[0];
      } else {
        const choices = [
          [0x25a0, 0x25ff], // Geometric Shapes
        ];
        const choice = choices[0];
        displayChar = String.fromCharCode(choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1)));
      }
      
      const x = eyesy.xres / 2;
      const y = eyesy.yres / 2;
      const speed = Math.floor(eyesy.knob1 * 100 + 1);
      const color = eyesy.color_picker(eyesy.knob4);
      
      this.recedingTexts.push({
        char: displayChar,
        size: initialSize,
        x: x,
        y: y,
        yo: speed,
        speed: speed,
        life: 200,
        maxLife: 200,
        color: [color[0], color[1], color[2]]
      });
    }
  }
}
