import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { createFont, renderText, Font } from '../../core/FontRenderer';

interface TextParticle {
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: [number, number, number];
}

/**
 * Font - Particles
 * Text characters that explode into particles on trigger, with audio-reactive movement
 * 
 * Knob1 - Particle speed
 * Knob2 - Particle spread
 * Knob3 - Text size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class FontParticles extends BaseAnimatedMode {
  private font: Font | null = null;
  private particles: TextParticle[] = [];
  private lastTriggerState = false;
  private baseText = '';

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    this.particles = [];
    this.lastTriggerState = false;
    this.updateBaseText(eyesy);
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Update base text if it changed
    const currentText = (eyesy.font_text && eyesy.font_text.trim() !== '') ? eyesy.font_text : '';
    if (currentText !== this.baseText) {
      this.updateBaseText(eyesy);
    }
    
    // Create particles on trigger
    if (eyesy.trig && !this.lastTriggerState) {
      this.createParticles(eyesy);
    }
    this.lastTriggerState = eyesy.trig;
    
    // Calculate parameters
    const particleSpeed = eyesy.knob1 * 5.0 + 0.5;
    const particleSpread = eyesy.knob2 * 200 + 50;
    const baseSize = Math.floor(eyesy.knob3 * 150 + 40); // Increased base size for better visibility
    
    // Audio reactivity affects particle movement
    const audioBoost = 1.0 + audioLevel * 1.5;
    
    // Always show base text prominently in center (render each character separately for proper spacing)
    if (this.baseText) {
      const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
      const displaySize = Math.floor(baseSize * (1.0 + audioLevel * 0.2));
      const baseFont = createFont(eyesy.mode_root + '/font.ttf', displaySize, currentFontFamily);
      const baseColorRaw = eyesy.color_picker(eyesy.knob4);
      // Ensure color is visible (not too dark)
      const color: [number, number, number] = [
        Math.max(50, baseColorRaw[0]),
        Math.max(50, baseColorRaw[1]),
        Math.max(50, baseColorRaw[2])
      ];
      
      // Render each character separately for proper spacing
      const chars = this.baseText.split('');
      const charSpacing = displaySize * 0.7;
      const totalWidth = (chars.length - 1) * charSpacing;
      const startX = (eyesy.xres - totalWidth) / 2;
      
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === ' ') {
          // Skip spaces but account for them in spacing
          continue;
        }
        const x = startX + (i * charSpacing);
        const textRender = renderText(baseFont, char, false, color);
        canvas.blitText(textRender.texture, x, eyesy.yres / 2, true, true);
      }
    }
    
    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update particle physics
      p.x += p.vx * particleSpeed * audioBoost * eyesy.deltaTime * 60;
      p.y += p.vy * particleSpeed * audioBoost * eyesy.deltaTime * 60;
      
      // Add gravity
      p.vy += 0.2 * eyesy.deltaTime * 60;
      
      // Add audio-reactive forces
      const audioForceX = Math.sin(this.time * 2 + i) * audioLevel * 2;
      const audioForceY = Math.cos(this.time * 2 + i) * audioLevel * 2;
      p.vx += audioForceX * eyesy.deltaTime * 60;
      p.vy += audioForceY * eyesy.deltaTime * 60;
      
      // Update life
      p.life -= eyesy.deltaTime * 60;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Calculate size based on life (larger particles, longer life)
      const lifeRatio = p.life / p.maxLife;
      const particleSize = Math.floor(baseSize * 0.6 * lifeRatio * (1.0 + audioLevel * 0.3));
      
      if (particleSize < 12) continue; // Increased minimum size
      
      // Create font if needed
      const currentFontFamily = eyesy.font_family || 'Arial, sans-serif';
      let particleFont = this.font;
      if (!particleFont || Math.abs(particleFont.size - particleSize) > 3 || particleFont.fontFamily !== currentFontFamily) {
        particleFont = createFont(eyesy.mode_root + '/font.ttf', particleSize, currentFontFamily);
        this.font = particleFont; // Cache it
      }
      
      // Calculate color with fade (but keep it more visible)
      const fadeColor: [number, number, number] = [
        Math.floor(p.color[0] * (0.5 + lifeRatio * 0.5)), // Less aggressive fade
        Math.floor(p.color[1] * (0.5 + lifeRatio * 0.5)),
        Math.floor(p.color[2] * (0.5 + lifeRatio * 0.5))
      ];
      
      // Render particle
      const textRender = renderText(particleFont, p.char, false, fadeColor);
      canvas.blitText(textRender.texture, p.x, p.y, true, true);
    }
  }

  private updateBaseText(eyesy: EYESY): void {
    if (eyesy.font_text && eyesy.font_text.trim() !== '') {
      this.baseText = eyesy.font_text;
    } else {
      // Generate random unicode characters
      const choices = [
        [0x25a0, 0x25ff], // Geometric Shapes
        [0x2190, 0x21ff], // Arrows
        [0x2600, 0x26ff], // Miscellaneous Symbols
      ];
      const choice = choices[Math.floor(Math.random() * choices.length)];
      const numChars = 3 + Math.floor(Math.random() * 5);
      this.baseText = '';
      for (let i = 0; i < numChars; i++) {
        const code = choice[0] + Math.floor(Math.random() * (choice[1] - choice[0] + 1));
        try {
          this.baseText += String.fromCodePoint(code);
        } catch {
          this.baseText += String.fromCharCode(0x25a0);
        }
      }
    }
  }

  private createParticles(eyesy: EYESY): void {
    const chars = this.baseText.split('');
    const particleSpread = eyesy.knob2 * 200 + 50;
    const color = eyesy.color_picker(eyesy.knob4);
    
    // Don't clear all particles, just add new ones
    // this.particles = [];
    
    // Calculate character positions first
    const baseSize = Math.floor(eyesy.knob3 * 150 + 40);
    const charSpacing = baseSize * 0.7;
    const totalWidth = (chars.filter(c => c !== ' ').length - 1) * charSpacing;
    const startX = (eyesy.xres - totalWidth) / 2;
    
    let charIndex = 0;
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (char === ' ') continue;
      
      // Create particles for each character, starting from center
      const numParticles = 2 + Math.floor(Math.random() * 4); // More particles per character
      const charX = startX + (charIndex * charSpacing);
      
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 2.0; // Faster particles
        
        this.particles.push({
          char: char,
          x: charX + (Math.random() - 0.5) * 20, // Start near character position
          y: eyesy.yres / 2 + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 0,
          life: 120 + Math.random() * 180, // Longer life (2-5 seconds)
          maxLife: 120 + Math.random() * 180,
          color: [color[0], color[1], color[2]]
        });
      }
      charIndex++;
    }
  }
}

