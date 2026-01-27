import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

interface RainDrop {
  char: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: [number, number, number];
  trailLength: number;
}

/**
 * Font - Rain
 * Text characters fall from the top like rain
 * 
 * Knob1 - Fall speed
 * Knob2 - Character density / number of drops
 * Knob3 - Text size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class FontRain extends BaseAnimatedMode {
  private font: Font | null = null;
  private rainDrops: RainDrop[] = [];
  private textChars: string[] = [];
  private lastTriggerState = false;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    this.updateText(eyesy);
    this.rainDrops = [];
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
      this.updateText(eyesy);
      if (this.textChars.length === 0) return;
    }
    
    // Calculate parameters
    const fallSpeed = eyesy.knob1 * 300 + 50; // 50-350 pixels per second
    const density = Math.floor(eyesy.knob2 * 30 + 5); // 5-35 drops
    const baseSize = Math.floor(eyesy.knob3 * 120 + 40); // 40-160px
    
    // Audio-reactive size
    const reactiveSize = baseSize * (1.0 + audioLevel * 0.3);
    
    // Create font
    const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
    if (!this.font || Math.abs(this.font.size - reactiveSize) > 2 || this.font.fontFamily !== currentFontFamily) {
      this.font = createFont(eyesy.mode_root + '/font.ttf', Math.floor(reactiveSize), currentFontFamily);
    }
    
    const baseColor = eyesy.color_picker(eyesy.knob4);
    // Ensure color is visible
    const visibleColor: [number, number, number] = [
      Math.max(50, baseColor[0]),
      Math.max(50, baseColor[1]),
      Math.max(50, baseColor[2])
    ];
    
    // Maintain desired number of rain drops
    while (this.rainDrops.length < density) {
      this.createRainDrop(eyesy, visibleColor, reactiveSize, fallSpeed);
    }
    
    // Remove excess drops if density decreased
    if (this.rainDrops.length > density) {
      this.rainDrops = this.rainDrops.slice(0, density);
    }
    
    // Update and render rain drops
    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const drop = this.rainDrops[i];
      
      // Update position
      drop.y += drop.speed * eyesy.deltaTime * 60;
      
      // Audio-reactive speed variation
      const speedVariation = 1.0 + (audioLevel * 0.5);
      drop.y += (drop.speed * speedVariation - drop.speed) * eyesy.deltaTime * 30;
      
      // Reset if off screen
      if (drop.y > eyesy.yres + reactiveSize) {
        // Reuse this drop at the top
        drop.y = -reactiveSize;
        drop.x = Math.random() * eyesy.xres;
        drop.char = this.getRandomChar();
        drop.speed = fallSpeed * (0.7 + Math.random() * 0.6); // Vary speed
        drop.size = reactiveSize * (0.8 + Math.random() * 0.4); // Vary size
      }
      
      // Render character with trail effect
      this.renderRainDrop(canvas, drop, eyesy, visibleColor, reactiveSize);
    }
  }

  private createRainDrop(eyesy: EYESY, color: [number, number, number], baseSize: number, baseSpeed: number): void {
    const drop: RainDrop = {
      char: this.getRandomChar(),
      x: Math.random() * eyesy.xres,
      y: Math.random() * eyesy.yres * 0.5 - eyesy.yres * 0.5, // Start above or in upper half
      speed: baseSpeed * (0.7 + Math.random() * 0.6), // Vary speed
      size: baseSize * (0.8 + Math.random() * 0.4), // Vary size
      color: [color[0], color[1], color[2]],
      trailLength: Math.floor(3 + Math.random() * 5) // 3-7 characters in trail
    };
    this.rainDrops.push(drop);
  }

  private renderRainDrop(canvas: Canvas, drop: RainDrop, eyesy: EYESY, baseColor: [number, number, number], baseSize: number): void {
    // Render trail (fading characters above the main one)
    for (let i = 0; i < drop.trailLength; i++) {
      const trailY = drop.y - (i * drop.size * 0.8);
      if (trailY < -baseSize) continue; // Skip if off screen
      
      // Fade trail (darker as it goes up)
      const fade = 1.0 - (i / drop.trailLength) * 0.7; // Fade to 30% opacity
      const trailColor: [number, number, number] = [
        Math.floor(baseColor[0] * fade),
        Math.floor(baseColor[1] * fade),
        Math.floor(baseColor[2] * fade)
      ];
      
      // Smaller size for trail
      const trailSize = drop.size * (1.0 - i * 0.1);
      if (trailSize < 20) continue;
      
      const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
      const trailFont = createFont(eyesy.mode_root + '/font.ttf', Math.floor(trailSize), currentFontFamily);
      const textRender = renderText(trailFont, drop.char, false, trailColor);
      canvas.blitText(textRender.texture, drop.x, trailY, true, true);
    }
    
    // Render main character (brightest)
    const mainFont = createFont(eyesy.mode_root + '/font.ttf', Math.floor(drop.size), eyesy.font_family || 'Arial, sans-serif');
    const mainTextRender = renderText(mainFont, drop.char, false, drop.color);
    canvas.blitText(mainTextRender.texture, drop.x, drop.y, true, true);
  }

  private getRandomChar(): string {
    if (this.textChars.length === 0) return '█';
    
    // Prefer non-space characters
    const nonSpaceChars = this.textChars.filter(c => c !== ' ');
    if (nonSpaceChars.length > 0) {
      return nonSpaceChars[Math.floor(Math.random() * nonSpaceChars.length)];
    }
    return this.textChars[Math.floor(Math.random() * this.textChars.length)];
  }

  private updateText(eyesy: EYESY): void {
    if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      this.textChars = eyesy.font_text.split('');
    } else {
      // Generate default characters
      const choices = [
        [0x2580, 0x259f], // Block Elements
        [0x25a0, 0x25ff], // Geometric Shapes
        [0x2190, 0x21ff], // Arrows
      ];
      const choice = choices[Math.floor(Math.random() * choices.length)];
      const numChars = 20;
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
}


