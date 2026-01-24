import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Amp Color - Circles
 * Ported from Python version
 * 
 * Knob1 - Audio History
 * Knob2 - Rotation Direction & Rate
 * Knob3 - Nested Circle Count
 * Knob4 - LFO Step Size
 * Knob5 - background color
 * Trigger - picks five new circle sizes & positions
 */
export class Ampcolorcircles implements Mode {
  private xr = 1280;
  private yr = 720;
  private audioHistory: Map<number, number[]> = new Map();
  private currentHistoryLength: number | null = null;
  private currentRotation = 0;
  private trigger = false;
  private circles: Array<[number, number, number]> = [];
  private lfoAngle = 0;
  private lfoDirection = 1;
  private pauseUntil = 0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.circles = this.initializeCircles(this.xr, this.yr);
  }

  private initializeCircles(xr: number, yr: number): Array<[number, number, number]> {
    // Initialize five random circles
    const circles: Array<[number, number, number]> = [];
    for (let i = 0; i < 5; i++) {
      const diameter = Math.random() * (0.4 * xr - 0.03 * xr) + 0.03 * xr;
      const radius = diameter / 2;
      const x = Math.random() * (xr - radius * 2) + radius;
      const y = Math.random() * (yr - radius * 2) + radius;
      circles.push([x, y, radius]);
    }
    return circles;
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

  private calculateEndingAngle(count: number): number {
    // Calculate the ending angle based on the count
    if (count <= 8) {
      return 7.5;
    } else if (count >= 50) {
      return 3.0;
    } else {
      // Linear interpolation between 7.5 and 3.0 degrees
      return 7.5 - (7.5 - 3.0) * (count - 8) / (50 - 8);
    }
  }

  private updateLfo(eyesy: EYESY, count: number): void {
    // Update the LFO angle based on knob4 and count
    const endingAngle = this.calculateEndingAngle(count);
    const stepSize = eyesy.knob4 * 0.5;
    const currentTime = Date.now() / 1000;
    
    if (eyesy.knob4 === 0) {
      // LFO is off
      this.lfoAngle = 0;
    } else if (currentTime < this.pauseUntil) {
      // In pause period
      // pass
    } else {
      if (this.lfoDirection === 1) {
        this.lfoAngle += stepSize;
        if (this.lfoAngle >= endingAngle) {
          this.lfoAngle = endingAngle;
          this.lfoDirection = -1;
        }
      } else {
        this.lfoAngle -= stepSize;
        if (this.lfoAngle <= 0) {
          this.lfoAngle = 0;
          // Set pause for 0.5 seconds
          this.pauseUntil = currentTime + 0.5;
          this.lfoDirection = 1;
        }
      }
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Check trigger condition
    if (eyesy.trig) {
      this.trigger = true;
    }
    if (this.trigger) {
      // Generate new random circles
      this.circles = this.initializeCircles(this.xr, this.yr);
      this.trigger = false;
    }
    
    // Number of circles
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
    
    // Update LFO
    this.updateLfo(eyesy, count);
    
    const center: [number, number] = [this.xr / 2, this.yr / 2];
    
    // Draw nested circles
    for (let i = 0; i < count; i++) {
      const currentValue = Math.abs((eyesy.audio_in[i] || 0) / 22000);
      
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
      
      // Calculate circle dimensions with dynamic spacing
      const spacingFactor = 0.1;
      const circleRadius = (this.xr / 2) - (i * (this.xr / (2 * count)) * (1 + spacingFactor * (100 - count) / 100));
      
      // Draw each circle with nested effect
      for (const [x, y, radius] of this.circles) {
        // Scale the radius based on the current nesting level
        const scaledRadius = radius * (circleRadius / (this.xr / 2));
        
        // Calculate rotation angle for the current circle
        const rotationAngle = this.currentRotation + i * this.lfoAngle;
        
        // Rotate the circle's position
        const rotatedPoint = this.rotatePoint(center, [x, y], rotationAngle);
        
        // Draw the circle
        canvas.circle([Math.floor(rotatedPoint[0]), Math.floor(rotatedPoint[1])], Math.floor(scaledRadius), color, 0);
      }
    }
  }
}
