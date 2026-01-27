import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * T - Isometric Wave
 * Ported from Python version
 * 
 * Knob1 - Tile size/pattern range
 * Knob2 - Audio reactivity (Y position)
 * Knob3 - Pattern density (probability of pattern type)
 * Knob4 - Trails opacity
 * Knob5 - Background color
 */
interface Pattern {
  imageIndex: number;
  x: number;
  y: number;
}

export class Isometricwave implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private patterns: Pattern[] = [];

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    
    // Load images from the mode's Images/ folder
    try {
      // Try to load grass.png and wall.png
      const grassPath = getImagePath(eyesy.mode_root, 'grass.png');
      const wallPath = getImagePath(eyesy.mode_root, 'wall.png');
      
      const grass = await loadImage(grassPath);
      const wall = await loadImage(wallPath);
      
      this.images = [grass, wall];
    } catch (error) {
      console.error('Failed to load images for Isometric Wave mode:', error);
      // Continue with empty images array - mode will skip drawing if no images
    }
    
    // Generate initial pattern
    this.patterns = this.generatePattern(80, eyesy);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const tileSize = Math.floor(160 - 64 * eyesy.knob1);
    const tileWidthHalf = tileSize / 2;

    // Trails / feedback: draw the previous frame first, then draw new content on top.
    // (If we draw last frame *after* new tiles, it can wipe out the current frame.)
    const veilAlpha = Math.floor(eyesy.knob4 * 50) / 255;
    canvas.blitLastFrame(0, 0, this.xr, this.yr, 1.0 - veilAlpha);
    
    // Use trig or audio_trig if available
    const audioTrigger = eyesy.audio_trig || eyesy.trig;
    if (audioTrigger) {
      this.patterns = this.generatePattern(tileWidthHalf, eyesy);
    }
    
    // Safety check: ensure patterns is valid and not empty
    // If patterns are empty, generate them (shouldn't happen, but safety check)
    if (this.patterns.length === 0) {
      this.patterns = this.generatePattern(tileWidthHalf, eyesy);
    }
    
    // Ensure we have patterns before continuing
    if (this.patterns.length === 0) {
      return;
    }
    
    // Process patterns
    for (let p = 0; p < this.patterns.length; p++) {
      const pattern = this.patterns[p];
      if (!pattern) continue;
      
      const i = pattern.imageIndex % this.images.length;
      let j = pattern.x;
      let k = pattern.y;
      
      // Calculate audio-reactive Y position
      // Handle case where audio_in might be empty
      let y = k;
      if (eyesy.audio_in && eyesy.audio_in.length > 0) {
        const audioIndex = p % eyesy.audio_in.length;
        const audioVal = eyesy.audio_in[audioIndex] || 0;
        // Scale the wave enough to be visible in the web renderer
        const audioNorm = audioVal / 32768.0; // -1..1
        y = k + audioNorm * (tileSize * 0.45) * eyesy.knob2;
      }
      
      // Draw
      if (this.images.length > 0) {
        const pic = this.images[i];
        canvas.blitTexture(pic.texture, Math.floor(j), Math.floor(y), pic.width, pic.height);
      } else {
        // Fallback: draw an isometric tile (diamond) when assets are missing in web build
        const tileW = tileSize;
        const tileH = tileSize * 0.5;
        const cx = j;
        const cy = y;

        const baseColor: [number, number, number] =
          pattern.imageIndex === 0 ? [50, 180, 90] : [110, 110, 110];

        // Small brightness modulation from audio / knob2
        const audioBoost = eyesy.audio_in && eyesy.audio_in.length > 0
          ? Math.min(1, Math.abs((eyesy.audio_in[p % eyesy.audio_in.length] || 0) / 32768.0) * eyesy.knob2)
          : 0;

        const brighten = (c: number) => Math.max(0, Math.min(255, Math.round(c + 80 * audioBoost)));
        const fill: [number, number, number] = [brighten(baseColor[0]), brighten(baseColor[1]), brighten(baseColor[2])];

        canvas.polygon(
          [
            [cx, cy - tileH / 2],
            [cx + tileW / 2, cy],
            [cx, cy + tileH / 2],
            [cx - tileW / 2, cy],
          ],
          fill,
          0
        );
      }
    }

    canvas.captureFrame();
  }

  private generatePattern(tileWidthHalf: number, eyesy: EYESY): Pattern[] {
    const lines: Pattern[] = [];
    
    // Ensure TILEWIDTH_HALF is valid
    if (tileWidthHalf <= 0) {
      tileWidthHalf = 1.0;
    }
    
    const step = Math.max(1, Math.floor(tileWidthHalf));
    const maxRange = Math.max(1, Math.floor(600 - 200 * eyesy.knob1));
    
    for (let x = 0; x < maxRange; x += step) {
      for (let y = 0; y < maxRange; y += step) {
        const cartX = x;
        const cartY = y;
        const isoX = cartX - cartY;
        const isoY = (cartX + cartY) / 2;
        const centeredX = (this.xr / 2) + isoX - 60;
        const centeredY = (this.yr / 8) + isoY;
        
        const imageIndex = Math.random() > (1 * eyesy.knob3) ? 0 : 1;
        lines.push({
          imageIndex,
          x: centeredX,
          y: centeredY
        });
      }
    }
    
    return lines;
  }
}
