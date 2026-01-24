import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * S - Dancing Circle - Image
 * Ported from Python version
 * 
 * Knob1 - image size
 * Knob2 - diameter of 'dance'
 * Knob3 - circle size & unfilled/filled option
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Dancingcircleimage implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private i = 0;
  private lastPoint: [number, number] = [0, 360];

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lastPoint = [0, this.yr / 2];
    
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
      console.log(`Loaded ${this.images.length} images for Dancing Circle - Image mode.`);
    } catch (error) {
      console.error('Failed to load images for Dancing Circle - Image mode:', error);
    }
    
    this.i = 0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length === 0) {
      return; // No images loaded
    }
    
    eyesy.color_picker_bg(eyesy.knob5);
    
    const x300 = Math.floor(0.5 * eyesy.xres);
    const x30 = Math.floor(0.2 * eyesy.xres);
    
    const y1 = Math.floor(eyesy.knob2 * this.yr + ((eyesy.audio_in[this.i] / 32768.0) * 0.00003058) * (this.yr / 2));
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    let R = (eyesy.knob2 * x300) - x300;
    R = R + ((eyesy.audio_in[this.i] / 32768.0) * 0.00003058) * (this.yr / 2);
    
    const x = R * Math.cos((this.i / 100.0) * 6.28) + (this.xr / 2);
    const y = R * Math.sin((this.i / 100.0) * 6.28) + (this.yr / 2);
    
    const maxCircle = x300;
    let circleSize = 0;
    let lineWidth = 0;
    
    if (eyesy.knob3 <= 0.5) {
      circleSize = Math.floor(eyesy.knob3 * maxCircle);
      lineWidth = 0;
    }
    if (eyesy.knob3 > 0.501) {
      circleSize = Math.abs(maxCircle - Math.floor(eyesy.knob3 * maxCircle));
      lineWidth = Math.abs(x30 - Math.floor(eyesy.knob3 * x30));
    }
    
    canvas.circle([Math.floor(x), Math.floor(y)], circleSize, color, lineWidth);
    
    const image = this.images[0];
    const imageW = Math.floor(image.width * eyesy.knob1 * 6);
    const imageH = Math.floor(image.height * eyesy.knob1 * 6);
    
    canvas.blitTexture(
      image.texture,
      Math.floor(x - imageW / 2),
      Math.floor(y - imageH / 2),
      imageW,
      imageH
    );
    
    this.i = (this.i + 1) % 100;
  }
}
