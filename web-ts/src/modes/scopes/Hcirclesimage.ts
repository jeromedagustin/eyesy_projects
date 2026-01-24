import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - H Circles - Image
 * Ported from Python version
 * 
 * Knob1 - image size
 * Knob2 - y offset
 * Knob3 - circle size
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Hcirclesimage implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private lastPoint: [number, number] = [0, 360];

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
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
      console.log(`Loaded ${this.images.length} images for H Circles - Image mode.`);
    } catch (error) {
      console.error('Failed to load images for H Circles - Image mode:', error);
    }
    
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lastPoint = [0, 360];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length === 0) {
      return; // No images loaded
    }
    
    // Ensure xr and yr are set
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    
    eyesy.color_picker_bg(eyesy.knob5);
    
    for (let i = 0; i < 50; i++) {
      this.seg(canvas, eyesy, i);
    }
  }

  private seg(canvas: Canvas, eyesy: EYESY, i: number): void {
    const xoffset = 0;
    // Use AudioScope for consistent audio handling
    // Python version uses audio_in[i] / 35
    const audioVal = AudioScope.getSampleClamped(eyesy, i, 35.0);
    const y1 = Math.floor(eyesy.knob2 * this.yr + (audioVal * 32768));
    const x = i * (this.xr * 0.0203);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    const maxCircle = this.xr * 0.078;
    let circleSize = 0;
    let lineWidth = 0;
    
    if (eyesy.knob3 <= 0.5) {
      circleSize = Math.floor(eyesy.knob3 * maxCircle) + 1;
      lineWidth = 0;
    }
    if (eyesy.knob3 > 0.501) {
      circleSize = Math.abs(maxCircle - Math.floor(eyesy.knob3 * maxCircle));
      lineWidth = Math.abs(10 - Math.floor(eyesy.knob3 * 10));
    }
    
    canvas.circle([Math.floor(x + xoffset), y1], circleSize, color, lineWidth);
    
    const image = this.images[0];
    const imgW = Math.floor(image.width * eyesy.knob1);
    const imgH = Math.floor(image.height * eyesy.knob1);
    
    canvas.blitTexture(
      image.texture,
      Math.floor(x + xoffset - imgW / 2),
      Math.floor(y1 - imgH / 2),
      imgW,
      imgH
    );
  }
}
