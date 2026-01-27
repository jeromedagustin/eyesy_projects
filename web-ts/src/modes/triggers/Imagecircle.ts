import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * T - Image + Circle
 * Ported from Python version
 * 
 * Knob1 - image size/scale
 * Knob2 - circle size
 * Knob3 - image opacity
 * Knob4 - foreground color (circle color)
 * Knob5 - background color
 * 
 * REMEMBER TO SCALE YOUR IMAGES RELATIVE TO SCREEN RESOLUTION; Large images will cause lag!!
 */
export class Imagecircle implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private imageIndex = 0;
  private imageX = 100;
  private imageY = 100;
  private trigger = false;

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    
    // Load images from the mode's Images/ folder
    try {
      // Try to load all PNG images from Images/ folder
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
      
      this.images = images;
    } catch (error) {
      console.error('Failed to load images for Image + Circle mode:', error);
      // Continue with empty images array - mode will skip drawing if no images
    }
    
    this.imageIndex = 0;
    this.imageX = 100;
    this.imageY = 100;
    this.trigger = false;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length === 0) {
      return; // No images loaded
    }
    
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker(eyesy.knob4);
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      // Random position for image
      this.imageX = Math.floor(Math.random() * (this.xr * 0.844 - (-this.xr * 0.039)) + (-this.xr * 0.039));
      this.imageY = Math.floor(Math.random() * (this.yr * 0.833 - (-this.yr * 0.069)) + (-this.yr * 0.069));
      this.imageIndex += 1;
      if (this.imageIndex >= this.images.length) {
        this.imageIndex = 0;
      }
    }
    this.trigger = false;
    
    const image = this.images[this.imageIndex];
    const imageSizeX = Math.floor(image.width * eyesy.knob1);
    const imageSizeY = Math.floor(image.height * eyesy.knob1);
    const circleSize = Math.floor(eyesy.knob2 * imageSizeX / 1.5);
    
    // Draw circle at image center
    const circleX = this.imageX + Math.floor(imageSizeX / 2);
    const circleY = this.imageY + Math.floor(imageSizeY / 2);
    canvas.circle([circleX, circleY], circleSize, color, 0);
    
    // Draw image with opacity
    const opacity = eyesy.knob3;
    canvas.blitTexture(image.texture, this.imageX, this.imageY, imageSizeX, imageSizeY, opacity);
  }
}
