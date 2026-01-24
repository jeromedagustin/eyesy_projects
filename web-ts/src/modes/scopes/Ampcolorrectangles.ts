import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Amp Color - Rectangles
 * Ported from Python version
 * 
 * Knob1 - Audio 'history' amount
 * Knob2 - Rotation direction & Speed. Center = no rotation.
 * Knob3 - Number of rectangles
 * Knob4 - Offset angle
 * Knob5 - Background color (might only see background while rotating)
 */
export class Ampcolorrectangles implements Mode {
  private xr = 1280;
  private yr = 720;
  private audioHistory: Map<number, number[]> = new Map();
  private currentHistoryLength: number | null = null;
  private currentRotation = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
  }

  private rotatePoint(center: [number, number], point: [number, number], angle: number): [number, number] {
    // Rotate a point around a center by a given angle (in degrees)
    const angleRad = (angle * Math.PI) / 180;
    const [x, y] = point;
    const [cx, cy] = center;
    
    // Translate point to origin
    const translatedX = x - cx;
    const translatedY = y - cy;
    
    // Apply rotation
    const newX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
    const newY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);
    
    // Translate back
    return [newX + cx, newY + cy];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Number of rectangles
    const count = Math.floor(eyesy.knob3 * 49) + 1;
    const historyLength = Math.floor(eyesy.knob1 * 20) + 1;
    
    // Check if history_length has changed
    if (this.currentHistoryLength !== historyLength) {
      this.currentHistoryLength = historyLength;
      // Recreate arrays with the new maxlen
      for (const [key, values] of this.audioHistory.entries()) {
        this.audioHistory.set(key, values.slice(-historyLength));
      }
    }
    
    // Reset rotation if knob2 is between 0.49 and 0.51
    if (eyesy.knob2 >= 0.49 && eyesy.knob2 <= 0.51) {
      this.currentRotation = 0;
    } else {
      // Determine rotation direction and rate based on knob2
      let rotationRate = 0;
      if (eyesy.knob2 < 0.48) {
        rotationRate = Math.abs(eyesy.knob2 - 0.48) * -52; // Rotate counterclockwise
      } else if (eyesy.knob2 > 0.52) {
        rotationRate = (eyesy.knob2 - 0.52) * 52; // Rotate clockwise
      }
      // Update the current rotation based on rotation_rate
      this.currentRotation += rotationRate;
    }
    
    const center: [number, number] = [this.xr / 2, this.yr / 2];
    
    // Draw nested rectangles
    for (let i = 0; i < count; i++) {
      const currentValue = Math.abs((eyesy.audio_in[i] || 0) / 32768);
      
      // Initialize history array for the index if not already present
      if (!this.audioHistory.has(i)) {
        this.audioHistory.set(i, []);
      }
      
      const history = this.audioHistory.get(i)!;
      // Append the current value to the history
      history.push(currentValue);
      // Trim to max length
      if (history.length > historyLength) {
        history.shift();
      }
      
      // Calculate the average of the history
      const averageValue = history.reduce((a, b) => a + b, 0) / history.length;
      const color = eyesy.color_picker(averageValue);
      
      // Calculate rectangle dimensions with dynamic spacing
      const spacingFactor = 0.1;
      const rectWidth = this.xr - (i * (this.xr / count) * (1 + spacingFactor * (50 - count) / 50));
      const rectHeight = this.yr - (i * (this.yr / count) * (1 + spacingFactor * (50 - count) / 50));
      
      // Calculate rotation angle for the current rectangle
      const rotationAngle = this.currentRotation + i * (eyesy.knob4 * 45);
      
      // Calculate the four corners of the rectangle
      const halfWidth = rectWidth / 2;
      const halfHeight = rectHeight / 2;
      
      // Define the rectangle's vertices before rotation
      const points: [number, number][] = [
        [-halfWidth, -halfHeight],
        [halfWidth, -halfHeight],
        [halfWidth, halfHeight],
        [-halfWidth, halfHeight]
      ];
      
      // Rotate each point
      const rotatedPoints = points.map(point => 
        this.rotatePoint([0, 0], point as [number, number], rotationAngle)
      );
      
      // Translate points to the center of the screen
      const finalPoints: [number, number][] = rotatedPoints.map(point => [
        point[0] + center[0],
        point[1] + center[1]
      ]);
      
      // Draw the polygon
      canvas.polygon(finalPoints, color, 0);
    }
  }
}
