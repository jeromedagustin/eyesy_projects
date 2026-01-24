import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { loadImage, LoadedImage, getImagePath } from '../../core/imageUtils';

/**
 * S - Circle Scope - Image
 * Ported from Python version
 * 
 * Knob1 - image size/scale
 * Knob2 - circle radius
 * Knob3 - line thickness
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Circlescopeimage implements Mode {
  private xr = 1280;
  private yr = 720;
  private images: LoadedImage[] = [];
  private lx = 640;
  private ly = 360;
  private begin = 0;
  private j = 0;
  private rotationAngle = 0;

  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.lx = this.xr / 2;
    this.ly = this.yr / 2;
    this.begin = 0;
    this.j = 0;
    this.rotationAngle = 0;
    
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
      console.log(`Loaded ${this.images.length} images for Circle Scope - Image mode.`);
    } catch (error) {
      console.error('Failed to load images for Circle Scope - Image mode:', error);
      // Continue with empty images array - mode will skip drawing if no images
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    if (this.images.length === 0) {
      return; // No images loaded
    }
    
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    this.rotationAngle += 0.75; // Increment the rotation angle for constant spinning
    
    for (let i = 0; i < 50; i++) {
      if (i <= 24) {
        this.j = this.j + 1;
      }
      if (i >= 25) {
        this.j = this.j - 1;
      }
      this.seg(canvas, eyesy, i, this.rotationAngle, this.j, color);
    }
  }

  private seg(
    canvas: Canvas,
    eyesy: EYESY,
    i: number,
    angle: number,
    j: number,
    color: [number, number, number]
  ): void {
    // Calculate radius with audio reactivity
    let R = ((eyesy.knob2 * 2) * (this.xr * 0.313)) - (this.xr * 0.117);
    // Use AudioScope for consistent audio handling
    // Python version uses audio_in[audioIdx] / 100
    const audioVal = AudioScope.getSampleClamped(eyesy, j, 100.0);
    R = R + (audioVal * 32768);
    
    // Calculate position on circle
    const x = R * Math.cos((i / 50.0) * 6.28) + (this.xr / 2);
    const y = R * Math.sin((i / 50.0) * 6.28) + (this.yr / 2);
    
    // Apply rotation
    const radAngle = (angle * Math.PI) / 180;
    const rotatedX = (x - this.xr / 2) * Math.cos(radAngle) - (y - this.yr / 2) * Math.sin(radAngle) + this.xr / 2;
    const rotatedY = (x - this.xr / 2) * Math.sin(radAngle) + (y - this.yr / 2) * Math.cos(radAngle) + this.yr / 2;
    
    if (this.begin === 0) {
      // Makes it look nice at startup
      this.ly = rotatedY;
      this.lx = rotatedX;
      this.begin = 1;
    }
    
    // Draw line
    const lineThickness = Math.floor(eyesy.knob3 * 25) + 1;
    canvas.line([this.lx, this.ly], [rotatedX, rotatedY], color, lineThickness);
    
    this.ly = rotatedY;
    this.lx = rotatedX;
    
    // Draw image at this point
    const image = this.images[0];
    const imageHeight = Math.floor(image.height * eyesy.knob1);
    const imageWidth = Math.floor(image.width * eyesy.knob1);
    
    canvas.blitTexture(
      image.texture,
      Math.floor(rotatedX - imageWidth / 2),
      Math.floor(rotatedY - imageHeight / 2),
      imageWidth,
      imageHeight
    );
  }
}
