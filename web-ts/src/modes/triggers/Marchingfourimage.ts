import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * T - Marching Four - Image
 * Ported from Python version
 * 
 * Knob1 - x axis speed
 * Knob2 - y axis speed
 * Knob3 - image size
 * Knob4 - foreground color (for palette manipulation)
 * Knob5 - background color
 */
export class Marchingfourimage implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private imageIndex = 0;
  private trigger = false;
  private x1Nudge = 0;
  private y1Nudge = 0;
  private x2Nudge = 0;
  private y2Nudge = 0;
  private x3Nudge = 0;
  private y3Nudge = 0;
  private x4Nudge = 0;
  private y4Nudge = 0;
  private begin = true;

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
      console.error('Failed to load images for Marching Four - Image mode:', error);
    }
    
    this.imageIndex = 0;
    this.trigger = false;
    this.begin = true;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length < 4) {
      return; // Need at least 4 images
    }
    
    eyesy.color_picker_bg(eyesy.knob5);
    
    const xr3rd = this.xr / 3;
    const yr3rd = this.yr / 3;
    const scaleX = Math.floor(eyesy.knob3 * (xr3rd - 1) + 1);
    const scaleY = scaleX;
    
    const x = scaleX / 2;
    const y = scaleY / 2;
    
    const speedScaleX = this.xr * 0.056;
    const speedScaleY = this.yr * 0.031;
    const xSpeed = (2 * speedScaleX * eyesy.knob1) - speedScaleX;
    const ySpeed = (2 * speedScaleY * eyesy.knob2) - speedScaleY;
    
    if (this.begin) {
      this.x1Nudge = Math.random() * (this.xr * 0.4 - this.xr * 0.1) + this.xr * 0.1;
      this.y1Nudge = Math.random() * (this.yr * 0.5 - this.yr * 0.1) + this.yr * 0.1;
      this.x2Nudge = Math.random() * (this.xr * 0.4 - this.xr * 0.1) + this.xr * 0.1;
      this.y2Nudge = Math.random() * (this.yr * 0.5 - this.yr * 0.1) + this.yr * 0.1;
      this.x3Nudge = Math.random() * (this.xr * 0.4 - this.xr * 0.2) + this.xr * 0.2;
      this.y3Nudge = Math.random() * (this.yr * 0.5 - this.yr * 0.1) + this.yr * 0.1;
      this.x4Nudge = Math.random() * (this.xr * 0.4 - this.xr * 0.2) + this.xr * 0.2;
      this.y4Nudge = Math.random() * (this.yr * 0.5 - this.yr * 0.1) + this.yr * 0.1;
      this.begin = false;
    }
    
    let x1 = x + this.x1Nudge;
    let y1 = y + this.y1Nudge;
    let x2 = x + this.x2Nudge * 1.25;
    let y2 = y + this.y2Nudge * 1.25;
    let x3 = x + this.x3Nudge * 1.5;
    let y3 = y + this.y3Nudge * 1.5;
    let x4 = x + this.x4Nudge * 2;
    let y4 = y + this.y4Nudge * 2;
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    if (this.trigger) {
      this.x1Nudge = this.x1Nudge + xSpeed;
      this.y1Nudge = this.y1Nudge + ySpeed;
      this.x2Nudge = this.x2Nudge + xSpeed;
      this.y2Nudge = this.y2Nudge + ySpeed;
      this.x3Nudge = this.x3Nudge + xSpeed;
      this.y3Nudge = this.y3Nudge + ySpeed;
      this.x4Nudge = this.x4Nudge + xSpeed;
      this.y4Nudge = this.y4Nudge + ySpeed;
    }
    this.trigger = false;
    
    // Draw image 1
    if (this.images[0]) {
      x1 = x + this.x1Nudge;
      y1 = y + this.y1Nudge;
      if (x1 > this.xr) this.x1Nudge = -scaleX - x;
      if (x1 < -scaleX) this.x1Nudge = this.xr - x;
      if (y1 > this.yr) this.y1Nudge = -scaleY - y;
      if (y1 < -scaleY) this.y1Nudge = this.yr - y;
      canvas.blitTexture(this.images[0].texture, Math.floor(x1), Math.floor(y1), scaleX, scaleY);
    }
    
    // Draw image 2
    if (this.images[1]) {
      x2 = x + this.x2Nudge * 1.25;
      y2 = y + this.y2Nudge * 1.25;
      if (x2 > this.xr) this.x2Nudge = (-scaleX - x) / 1.25;
      if (x2 < -scaleX) this.x2Nudge = (this.xr - x) / 1.25;
      if (y2 > this.yr) this.y2Nudge = (-scaleY - y) / 1.25;
      if (y2 < -scaleY) this.y2Nudge = (this.yr - y) / 1.25;
      canvas.blitTexture(this.images[1].texture, Math.floor(x2), Math.floor(y2), scaleX, scaleY);
    }
    
    // Draw image 3
    if (this.images[2]) {
      x3 = x + this.x3Nudge * 1.5;
      y3 = y + this.y3Nudge * 1.5;
      if (x3 > this.xr) this.x3Nudge = (-scaleX - x) / 1.5;
      if (x3 < -scaleX) this.x3Nudge = (this.xr - x) / 1.5;
      if (y3 > this.yr) this.y3Nudge = (-scaleY - y) / 1.5;
      if (y3 < -scaleY) this.y3Nudge = (this.yr - y) / 1.5;
      canvas.blitTexture(this.images[2].texture, Math.floor(x3), Math.floor(y3), scaleX, scaleY);
    }
    
    // Draw image 4
    if (this.images[3]) {
      x4 = x + this.x4Nudge * 2;
      y4 = y + this.y4Nudge * 2;
      if (x4 > this.xr) this.x4Nudge = (-scaleX - x) / 2 + 1;
      if (x4 < -scaleX) this.x4Nudge = (this.xr - x) / 2;
      if (y4 > this.yr) this.y4Nudge = (-scaleY - y) / 2;
      if (y4 < -scaleY) this.y4Nudge = (this.yr - y) / 2;
      canvas.blitTexture(this.images[3].texture, Math.floor(x4), Math.floor(y4), scaleX, scaleY);
    }
  }
}
