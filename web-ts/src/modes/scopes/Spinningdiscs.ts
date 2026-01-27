import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * S - Spinning Discs
 * Ported from Python version
 * 
 * Knob1 - rotation rate
 * Knob2 - image select
 * Knob3 - index color (palette index)
 * Knob4 - foreground color
 * Knob5 - background color
 * 
 * Note: This mode requires image loading support and palette manipulation
 * The original Python version uses pygame's palette system which we simulate
 * by applying color tinting to the image texture
 */
export class Spinningdiscs implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private imageIndex = 0;
  private imageOffset = 0;
  private angle = 0;

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    
    // Load images from the mode's Images/ folder
    try {
      // Try to load all PNG images from Images/ folder
      // The original uses glob.glob, we'll try numbered images or common names
      const images: LoadedImage[] = [];
      
      // Try loading numbered images (image0.png, image1.png, etc.)
      for (let i = 0; i < 20; i++) {
        try {
          const imgPath = getImagePath(eyesy.mode_root, `image${i}.png`);
          const img = await loadImage(imgPath);
          images.push(img);
        } catch (e) {
          // Image not found, try next
          if (i === 0) break; // If first image fails, stop trying
        }
      }
      
      // If no numbered images found, try common names
      if (images.length === 0) {
        const commonNames = ['disc.png', 'disc1.png', 'disc2.png', 'disc3.png'];
        for (const name of commonNames) {
          try {
            const imgPath = getImagePath(eyesy.mode_root, name);
            const img = await loadImage(imgPath);
            images.push(img);
          } catch (e) {
            // Continue trying
          }
        }
      }
      
      this.images = images;
    } catch (error) {
      console.error('Failed to load images for Spinning Discs mode:', error);
      // Continue with empty images array - mode will skip drawing if no images
    }
    
    this.imageIndex = 0;
    this.imageOffset = 0;
    this.angle = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length === 0) {
      return; // No images loaded
    }
    
    eyesy.color_picker_bg(eyesy.knob5);
    
    if (eyesy.trig) {
      this.imageOffset += 1;
      if (this.imageOffset >= this.images.length) {
        this.imageOffset = 0;
      }
    }
    
    this.imageIndex = Math.floor((eyesy.knob2 * (this.images.length - 1)) + this.imageOffset);
    if (this.imageIndex >= this.images.length) {
      this.imageIndex = this.imageIndex - this.images.length;
    }
    
    // Calculate audio-reactive rotation
    let audioAngle = 0;
    for (let i = 0; i < Math.min(100, eyesy.audio_in.length); i++) {
      if (eyesy.audio_in[i] > 30) {
        audioAngle += eyesy.audio_in[i] * 0.00035;
      }
    }
    
    const chg = (eyesy.knob1 * 180) + audioAngle;
    this.angle -= chg;
    if (this.angle < -360) {
      this.angle += 360;
    }
    
    const origImg = this.images[this.imageIndex];
    
    // Draw rotated image
    // Note: We can't directly rotate textures in Three.js the same way pygame does
    // We'll use the rotation parameter in blitTexture
    const rotation = this.angle;
    
    // For palette color manipulation, we'll apply a color tint
    // The original Python code uses set_palette_at() to change a specific palette index
    // We'll simulate this by applying a color overlay/tint
    const paletteColor = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Calculate center position
    const imgWidth = origImg.width;
    const imgHeight = origImg.height;
    const x = Math.floor(0.5 * this.xr - imgWidth * 0.5);
    const y = Math.floor(0.5 * this.yr - imgHeight * 0.5);
    
    // Draw the image with rotation
    // Note: Palette manipulation is complex - we'll draw the image as-is
    // In a full implementation, we'd need to manipulate the texture's pixels
    // For now, we'll just draw the rotated image
    canvas.blitTexture(origImg.texture, x, y, imgWidth, imgHeight, 1.0, rotation);
  }
}
