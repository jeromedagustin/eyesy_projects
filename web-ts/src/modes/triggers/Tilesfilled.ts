import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Tiles - Filled
 * Ported from Python version
 * 
 * Knob1 - Number of displayed tiles
 * Knob2 - Size of feedback screen
 * Knob3 - Opacity of feedback screen (turn on Persist for best viewing!)
 * Knob4 - Foreground Color
 * Knob5 - Background Color
 * Trigger - Generates new tiles
 */
function rotatePoint(center: [number, number], point: [number, number], angle: number): [number, number] {
  const angleRad = (angle * Math.PI) / 180;
  const [x, y] = point;
  const [cx, cy] = center;
  // Translate point to origin
  const tx = x - cx;
  const ty = y - cy;
  // Apply rotation
  const rotatedX = tx * Math.cos(angleRad) - ty * Math.sin(angleRad);
  const rotatedY = tx * Math.sin(angleRad) + ty * Math.cos(angleRad);
  // Translate back
  return [rotatedX + cx, rotatedY + cy];
}

function getRectPoints(x: number, y: number, width: number, height: number) {
  return {
    topleft: [x, y] as [number, number],
    topright: [x + width, y] as [number, number],
    bottomleft: [x, y + height] as [number, number],
    bottomright: [x + width, y + height] as [number, number],
    midtop: [x + width / 2, y] as [number, number],
    midbottom: [x + width / 2, y + height] as [number, number],
    midleft: [x, y + height / 2] as [number, number],
    midright: [x + width, y + height / 2] as [number, number],
    center: [x + width / 2, y + height / 2] as [number, number],
  };
}

export class Tilesfilled implements Mode {
  private xr = 1280;
  private yr = 720;
  private gridPoints: ([number, number][] | null)[][] = [];
  private trigger = false;
  private lastNumColumnsToDraw = -1;
  private cols = 16;
  private rows = 11;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    const size80 = this.xr * 0.063;
    this.gridPoints = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * size80;
        const y = row * size80;
        const rect = getRectPoints(x, y, size80, size80);
        
        // Define polygon point lists
        const polygonPoints1 = [rect.topright, rect.midtop, rect.center, rect.bottomright];
        const polygonPoints2 = [rect.topleft, rect.midtop, rect.center, rect.bottomleft];
        const polygonPoints3 = [rect.topleft, rect.midtop, rect.midright, rect.center];
        const polygonPoints4 = [rect.midtop, rect.topright, rect.center, rect.midleft];
        const polygonPoints5 = [rect.midtop, rect.midleft, rect.midright, rect.midbottom, rect.bottomleft, rect.topright];
        const polygonPoints6 = [rect.topright, rect.center, rect.midright, rect.midbottom, rect.bottomright];
        const polygonPoints7 = [rect.topright, rect.midright, rect.center, rect.midtop];
        const polygonPoints8 = [rect.topright, rect.midright, rect.midleft, rect.bottomleft, rect.midbottom, rect.midtop];
        const polygonPoints9 = [rect.topleft, rect.midtop, rect.midright, rect.midleft, rect.midbottom, rect.bottomright];
        const polygonPoints10 = [rect.topleft, rect.center, rect.midleft, rect.midbottom, rect.bottomleft];
        const polygonPoints11 = [rect.midtop, rect.midbottom, rect.midright, rect.midleft];
        const polygonPoints12 = [rect.midtop, rect.midbottom, rect.midleft, rect.midright];
        const polygonPoints13 = [rect.topright, rect.midright, rect.center, rect.midbottom, rect.bottomleft];
        const polygonPoints14 = [rect.topleft, rect.midleft, rect.center, rect.midbottom, rect.bottomright];
        const polygonPoints15 = [rect.topleft, rect.bottomleft, rect.center, rect.midbottom, rect.midright, rect.center, rect.midtop];
        const polygonPoints16 = [rect.topright, rect.bottomright, rect.center, rect.midbottom, rect.midleft, rect.center, rect.midtop];
        const polygonPoints17 = [rect.topright, rect.bottomright, rect.midbottom, rect.midtop];
        const polygonPoints18 = [rect.midtop, rect.midbottom, rect.bottomright, rect.topleft];
        const polygonPoints19 = [rect.midtop, rect.midbottom, rect.bottomleft, rect.topright];
        
        const pointlist = [
          polygonPoints1, polygonPoints2, polygonPoints3, polygonPoints4, polygonPoints5, polygonPoints6,
          polygonPoints7, polygonPoints8, polygonPoints9, polygonPoints10, polygonPoints11, polygonPoints12,
          polygonPoints13, polygonPoints14, polygonPoints15, polygonPoints16, polygonPoints17, polygonPoints18, polygonPoints19
        ];
        
        // Set initial points for each cell
        const points = pointlist[Math.floor(Math.random() * pointlist.length)];
        const angle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        const center = rect.center;
        this.gridPoints[row][col] = points.map(point => rotatePoint(center, point, angle));
      }
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Map knob1 value to an integer between 5 and 16
    const numColumnsToDraw = Math.floor(5 + eyesy.knob1 * 11);
    
    // Auto-trigger if the number of columns to draw has changed
    if (numColumnsToDraw !== this.lastNumColumnsToDraw) {
      this.trigger = true;
      this.lastNumColumnsToDraw = numColumnsToDraw;
    }
    
    // Calculate the size of each column based on the number of columns to draw
    const size80 = this.xr / numColumnsToDraw;
    const stroke = 0; // Filled
    
    if (eyesy.trig) {
      this.trigger = true;
    }
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < Math.min(numColumnsToDraw, this.cols); col++) {
        const x = col * size80;
        const y = row * size80;
        const rect = getRectPoints(x, y, size80, size80);
        
        // Define polygon point lists
        const polygonPoints1 = [rect.topright, rect.midtop, rect.center, rect.bottomright];
        const polygonPoints2 = [rect.topleft, rect.midtop, rect.center, rect.bottomleft];
        const polygonPoints3 = [rect.topleft, rect.midtop, rect.midright, rect.center];
        const polygonPoints4 = [rect.midtop, rect.topright, rect.center, rect.midleft];
        const polygonPoints5 = [rect.midtop, rect.midleft, rect.midright, rect.midbottom, rect.bottomleft, rect.topright];
        const polygonPoints6 = [rect.topright, rect.center, rect.midright, rect.midbottom, rect.bottomright];
        const polygonPoints7 = [rect.topright, rect.midright, rect.center, rect.midtop];
        const polygonPoints8 = [rect.topright, rect.midright, rect.midleft, rect.bottomleft, rect.midbottom, rect.midtop];
        const polygonPoints9 = [rect.topleft, rect.midtop, rect.midright, rect.midleft, rect.midbottom, rect.bottomright];
        const polygonPoints10 = [rect.topleft, rect.center, rect.midleft, rect.midbottom, rect.bottomleft];
        const polygonPoints11 = [rect.midtop, rect.midbottom, rect.midright, rect.midleft];
        const polygonPoints12 = [rect.midtop, rect.midbottom, rect.midleft, rect.midright];
        const polygonPoints13 = [rect.topright, rect.midright, rect.center, rect.midbottom, rect.bottomleft];
        const polygonPoints14 = [rect.topleft, rect.midleft, rect.center, rect.midbottom, rect.bottomright];
        const polygonPoints15 = [rect.topleft, rect.bottomleft, rect.center, rect.midbottom, rect.midright, rect.center, rect.midtop];
        const polygonPoints16 = [rect.topright, rect.bottomright, rect.center, rect.midbottom, rect.midleft, rect.center, rect.midtop];
        const polygonPoints17 = [rect.topright, rect.bottomright, rect.midbottom, rect.midtop];
        const polygonPoints18 = [rect.midtop, rect.midbottom, rect.bottomright, rect.topleft];
        const polygonPoints19 = [rect.midtop, rect.midbottom, rect.bottomleft, rect.topright];
        
        const pointlist = [
          polygonPoints1, polygonPoints2, polygonPoints3, polygonPoints4, polygonPoints5, polygonPoints6,
          polygonPoints7, polygonPoints8, polygonPoints9, polygonPoints10, polygonPoints11, polygonPoints12,
          polygonPoints13, polygonPoints14, polygonPoints15, polygonPoints16, polygonPoints17, polygonPoints18, polygonPoints19
        ];
        
        if (this.trigger) {
          const points = pointlist[Math.floor(Math.random() * pointlist.length)];
          const angle = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
          const center = rect.center;
          this.gridPoints[row][col] = points.map(point => rotatePoint(center, point, angle));
        }
        
        const color = eyesy.color_picker_lfo(eyesy.knob4, 1.1);
        
        // Draw the polygon if points exist
        if (this.gridPoints[row][col]) {
          canvas.polygon(this.gridPoints[row][col]!, color, stroke);
        }
      }
    }
    
    if (this.trigger) {
      this.trigger = false;
    }
    
    // Blit the previous frame (scaled, semi-transparent, centered)
    const lastScreenSize = this.xr * 0.16; // 200
    const thingX = Math.floor(this.xr - (eyesy.knob2 * lastScreenSize));
    const thingY = Math.floor(this.yr - (eyesy.knob2 * (lastScreenSize * 0.5625)));
    const placeX = Math.floor(this.xr / 2) - Math.floor(((thingX / 2) * this.xr) / this.xr);
    const placeY = Math.floor(this.yr / 2) - Math.floor(((thingY / 2) * this.yr) / this.yr);
    const alpha = Math.floor(eyesy.knob3 * 180) / 255; // Convert 0-180 to 0.0-0.7 opacity
    
    canvas.blitLastFrame(placeX, placeY, thingX, thingY, alpha, false);
    
    // Capture current frame for next iteration
    canvas.captureFrame();
  }
}
