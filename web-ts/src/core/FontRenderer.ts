/**
 * Font rendering utility for EYESY modes
 * Provides pygame-like font rendering API
 */
import * as THREE from 'three';
import { Canvas } from './Canvas';

export interface Font {
  size: number;
  fontFamily: string;
}

export class FontRenderer {
  private fontCache: Map<string, Font> = new Map();
  private defaultFontFamily = 'Arial, sans-serif';
  
  /**
   * Create a valid fallback texture (1x1 pixel transparent)
   */
  private createFallbackTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, 1, 1);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.flipY = false;
    return texture;
  }

  /**
   * Create a font object (mimics pygame.font.Font)
   * @param fontPath Path to font file (e.g., eyesy.mode_root + "/font.ttf")
   * @param size Font size in pixels
   * @param customFontFamily Optional custom font family to use instead of default
   * @returns Font object
   */
  Font(fontPath: string, size: number, customFontFamily?: string): Font {
    // Use custom font family if provided, otherwise use default
    const fontFamily = customFontFamily || this.defaultFontFamily;
    const cacheKey = `${fontFamily}:${size}`;
    
    if (this.fontCache.has(cacheKey)) {
      return this.fontCache.get(cacheKey)!;
    }

    // In web environment, we can't directly load TTF files without proper setup
    // For now, we'll use system fonts. In a full implementation, we'd need:
    // 1. Font loading via @font-face or FontFace API
    // 2. Font file serving from the server
    // 3. Font family registration
    
    const font = { size, fontFamily };
    this.fontCache.set(cacheKey, font);
    return font;
  }

  /**
   * Render text to a texture (mimics pygame.font.Font.render)
   * @param font Font object
   * @param text Text to render
   * @param antialiasing Whether to use antialiasing (default: false, matches pygame)
   * @param color Text color [R, G, B]
   * @returns Object with texture and position info
   */
  render(
    font: Font,
    text: string,
    antialiasing: boolean = false,
    color: [number, number, number] = [255, 255, 255]
  ): { texture: THREE.Texture; width: number; height: number; center: { x: number; y: number } } {
    // Handle empty or invalid text
    if (!text || text.trim() === '') {
      // Return a minimal valid texture for empty text
      const canvas = document.createElement('canvas');
      const height = Math.max(1, font.size);
      canvas.width = 1;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 1, height);
      }
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.flipY = false;
      return {
        texture,
        width: 1,
        height: height,
        center: { x: 0.5, y: height / 2 }
      };
    }

    // Create a canvas to render text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      // In test environment, return a valid fallback texture
      return {
        texture: this.createFallbackTexture(),
        width: 100,
        height: 100,
        center: { x: 50, y: 50 }
      };
    }

    // Set font properties
    context.font = `${font.size}px ${font.fontFamily}`;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    
    // Measure text to size canvas
    const metrics = context.measureText(text);
    const textWidth = Math.max(1, Math.ceil(metrics.width));
    const textHeight = Math.max(1, font.size); // Approximate height, ensure at least 1px
    
    // Set canvas size (add padding for better rendering, ensure minimum 1x1)
    const canvasWidth = Math.max(1, textWidth + 4);
    const canvasHeight = Math.max(1, textHeight + 4);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Re-get context after resizing (context is lost when canvas size changes)
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('FontRenderer: Failed to get canvas context after resize');
      const fallbackTexture = new THREE.Texture();
      return {
        texture: fallbackTexture,
        width: 100,
        height: 100,
        center: { x: 50, y: 50 },
      };
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set text rendering properties
    ctx.imageSmoothingEnabled = antialiasing;
    ctx.imageSmoothingQuality = antialiasing ? 'high' : 'low';
    
    // Draw text
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.font = `${font.size}px ${font.fontFamily}`;
    ctx.fillText(text, 2, 2); // Add small padding
    
    // Create Three.js texture from canvas
    try {
      // Ensure canvas has valid dimensions before creating texture
      if (canvas.width === 0 || canvas.height === 0 || !canvas.width || !canvas.height) {
        console.warn('FontRenderer: Invalid canvas dimensions', canvas.width, canvas.height);
        return {
          texture: this.createFallbackTexture(),
          width: 100,
          height: 100,
          center: { x: 50, y: 50 },
        };
      }
      
      // Validate canvas has valid image data
      const testCtx = canvas.getContext('2d');
      if (!testCtx) {
        console.warn('FontRenderer: Cannot get canvas context');
        return {
          texture: this.createFallbackTexture(),
          width: 100,
          height: 100,
          center: { x: 50, y: 50 },
        };
      }
      
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.flipY = false; // Match pygame's coordinate system
      
      // Validate texture was created successfully
      if (!texture || !texture.image) {
        console.warn('FontRenderer: Texture creation failed, using fallback');
        return {
          texture: this.createFallbackTexture(),
          width: 100,
          height: 100,
          center: { x: 50, y: 50 },
        };
      }
      
      // Ensure texture image has valid dimensions
      if (texture.image instanceof HTMLCanvasElement) {
        if (texture.image.width === 0 || texture.image.height === 0) {
          console.warn('FontRenderer: Texture image has zero dimensions');
          return {
            texture: this.createFallbackTexture(),
            width: 100,
            height: 100,
            center: { x: 50, y: 50 },
          };
        }
      }
      
      return {
        texture,
        width: canvas.width,
        height: canvas.height,
        center: {
          x: canvas.width / 2,
          y: canvas.height / 2,
        },
      };
    } catch (error) {
      console.warn('FontRenderer: Error creating texture:', error);
      // Return valid fallback texture
      return {
        texture: this.createFallbackTexture(),
        width: 100,
        height: 100,
        center: { x: 50, y: 50 },
      };
    }
  }

  /**
   * Dispose of all cached fonts
   */
  dispose(): void {
    this.fontCache.clear();
  }
}

// Global font renderer instance
export const fontRenderer = new FontRenderer();

/**
 * Helper function to create a font (mimics pygame.font.Font)
 * @param fontPath Path to font file (e.g., eyesy.mode_root + "/font.ttf")
 * @param size Font size in pixels
 * @param customFontFamily Optional custom font family to use instead of default
 */
export function createFont(fontPath: string, size: number, customFontFamily?: string): Font {
  return fontRenderer.Font(fontPath, size, customFontFamily);
}

/**
 * Helper function to render text (mimics font.render())
 */
export function renderText(
  font: Font,
  text: string,
  antialiasing: boolean = false,
  color: [number, number, number] = [255, 255, 255]
): { texture: THREE.Texture; width: number; height: number; center: { x: number; y: number } } {
  return fontRenderer.render(font, text, antialiasing, color);
}

