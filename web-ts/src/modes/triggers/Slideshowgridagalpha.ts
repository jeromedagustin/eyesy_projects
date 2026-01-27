import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * T - Slideshow Grid-AG-Alpha
 * Ported from Python version
 * 
 * IMPORTANT -- SCALE ALL IMAGES TO SCREEN WIDTH X SCREEN HEIGHT
 * 
 * Knob1 - scale X
 * Knob2 - scale Y
 * Knob3 - alpha/opacity
 * Knob4 - flip mode (0-0.25: no flip, 0.25-0.5: flip X, 0.5-0.75: flip Y, 0.75-1: flip both)
 * Knob5 - background color
 */
export class Slideshowgridagalpha implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private imageIndex = 0;
  private trigger = false;

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    
    // Load images from the mode's Images/ folder
    try {
      const images: LoadedImage[] = [];
      
      // Try loading numbered images (image0.png, image1.png, etc.)
      for (let i = 0; i < 20; i++) {
        try {
          const imgPath = getImagePath(eyesy.mode_root, `image${i}.png`);
          const img = await loadImage(imgPath);
          images.push(img);
        } catch (e) {
          if (i === 0) break;
        }
      }
      
      this.images = images;
    } catch (error) {
      console.error('Failed to load images for Slideshow Grid-AG-Alpha mode:', error);
    }
    
    this.imageIndex = 0;
    this.trigger = false;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length === 0) {
      return; // No images loaded, can't draw
    }
    
    eyesy.color_picker_bg(eyesy.knob5);
    
    this.trigger = false;
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.imageIndex += 1;
    }
    if (this.imageIndex >= this.images.length) {
      this.imageIndex = 0;
    }
    
    const image = this.images[this.imageIndex];
    const xrHalf = this.xr / 2;
    const yrHalf = this.yr / 2;
    const xrSm = xrHalf;
    const yrSm = yrHalf;
    
    const scaleX = Math.floor(eyesy.knob1 * xrSm);
    const scaleY = Math.floor(eyesy.knob2 * yrSm);
    const recenterX = Math.floor(xrHalf - scaleX / 2);
    const recenterY = Math.floor(yrHalf - scaleY / 2);
    
    // Scale full screen image
    const fullScreenImage = image;
    const fullScreenWidth = this.xr;
    const fullScreenHeight = this.yr;
    
    // Draw the scaled previous frame (from feedback system)
    // Alpha comes from knob3
    const alpha = Math.floor(eyesy.knob3 * 255) / 255;
    
    // Determine flip mode based on knob4
    // Python: flip(bgi2, 0,0) = no flip, flip(bgi2, 0,1) = flip Y, flip(bgi2, 1,0) = flip X, flip(bgi2, 1,1) = flip both
    let flipX = false;
    if (eyesy.knob4 < 0.25) {
      // No flip
      flipX = false;
    } else if (eyesy.knob4 >= 0.25 && eyesy.knob4 < 0.5) {
      // Flip Y (vertical) - not directly supported, skip for now
      flipX = false;
    } else if (eyesy.knob4 >= 0.5 && eyesy.knob4 < 0.75) {
      // Flip X (horizontal)
      flipX = true;
    } else {
      // Flip both
      flipX = true; // X flip supported, Y flip would need additional texture manipulation
    }
    
    // Draw previous frame scaled, with alpha and flip
    canvas.blitLastFrame(recenterX, recenterY, scaleX, scaleY, alpha, flipX);
    
    // Draw current full-screen image (scaled to screen size)
    canvas.blitTexture(fullScreenImage.texture, 0, 0, fullScreenWidth, fullScreenHeight, 1.0);
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }
}
