import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImages, LoadedImage } from '../../core/imageUtils';

/**
 * T - Basic Image
 * Ported from Python version
 * 
 * Knob1 - x pos
 * Knob2 - y pos
 * Knob3 - scale
 * Knob4 - opacity
 * Knob5 - background color
 * 
 * Important! Make sure images are scaled to display resolution beforehand; smaller is faster
 */
export class Basicimage implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private imageIndex = 0;
  private imagesLoaded = false;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    
    // Load images asynchronously (setup is synchronous, so we'll load in background)
    loadImages(eyesy.mode_root, 'Images/*.png')
      .then((images) => {
        this.images = images;
        this.imagesLoaded = true;
        console.log(`Loaded ${images.length} images`);
      })
      .catch((error) => {
        console.warn('Failed to load images:', error);
        this.imagesLoaded = false;
      });
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    if (!this.imagesLoaded || this.images.length === 0) {
      return; // No images to display
    }
    
    if (eyesy.trig) {
      this.imageIndex += 1;
      if (this.imageIndex >= this.images.length) {
        this.imageIndex = 0;
      }
    }
    
    const loadedImage = this.images[this.imageIndex];
    if (!loadedImage) return;
    
    const ximg = Math.floor(loadedImage.originalWidth * eyesy.knob3);
    const yimg = Math.floor(loadedImage.originalHeight * eyesy.knob3);
    
    const y = Math.floor(eyesy.knob2 * this.yr) - Math.floor(yimg * 0.5);
    const x = Math.floor(eyesy.knob1 * this.xr) - Math.floor(ximg * 0.5);
    
    const alpha = eyesy.knob4;
    
    // Draw image with scale and opacity
    canvas.blitTexture(loadedImage.texture, x, y, ximg, yimg, alpha);
  }
}
