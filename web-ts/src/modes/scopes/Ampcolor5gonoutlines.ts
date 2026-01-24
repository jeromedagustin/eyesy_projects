import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Amp Color - 5gon Outlines
 * Ported from Python version
 * 
 * Knob1 - Audio History
 * Knob2 - Rotation Direction & Rate
 * Knob3 - Nested Polygon Count
 * Knob4 - Offset Angle
 * Knob5 - Background color
 * Trigger - Randomly picks new positions for polygon vertices
 */
export class Ampcolor5gonoutlines implements Mode {
  private xr = 1280;
  private yr = 720;
  private audioHistory: Map<number, number[]> = new Map();
  private currentHistoryLength: number | null = null;
  private currentRotation = 0;
  private trigger = false;
  private polygonPoints: Array<[number, number]> = [
    [0, -1],      // Default top vertex
    [1, -0.3],    // Default upper right vertex
    [0.8, 1],     // Default lower right vertex
    [-0.8, 1],    // Default lower left vertex
    [-1, -0.3]    // Default upper left vertex
  ];

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
    
    // Check trigger condition
    if (eyesy.trig) {
      this.trigger = true;
    }
    if (this.trigger) {
      // Pick new random positions for the polygon vertices
      this.polygonPoints = [];
      for (let i = 0; i < 5; i++) {
        this.polygonPoints.push([
          Math.random() * 2 - 1,  // -1 to 1
          Math.random() * 2 - 1   // -1 to 1
        ]);
      }
      this.trigger = false;
    }
    
    // Number of polygons
    const count = Math.floor(eyesy.knob3 * 59) + 1;
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
    
    // Draw nested polygons
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
      
      // Calculate polygon dimensions with dynamic spacing
      const spacingFactor = 0.1;
      const polyWidth = this.xr - (i * (this.xr / count) * (1 + spacingFactor * (60 - count) / 60));
      const polyHeight = this.yr - (i * (this.yr / count) * (1 + spacingFactor * (60 - count) / 60));
      
      // Scale the polygon points based on the current width and height
      const scaledPoints: [number, number][] = this.polygonPoints.map(point => [
        point[0] * polyWidth / 2,
        point[1] * polyHeight / 2
      ]);
      
      // Calculate rotation angle for the current polygon
      const rotationAngle = this.currentRotation + i * (eyesy.knob4 * 180);
      
      // Rotate each point
      const rotatedPoints = scaledPoints.map(point => 
        this.rotatePoint([0, 0], point, rotationAngle)
      );
      
      // Translate points to the center of the screen
      const finalPoints: [number, number][] = rotatedPoints.map(point => [
        point[0] + center[0],
        point[1] + center[1]
      ]);
      
      // Draw the polygon (outlined, linewidth = 7)
      canvas.polygon(finalPoints, color, 7);
    }
  }
}
