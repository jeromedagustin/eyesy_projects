import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Rain
 * Ported from Python version
 * 
 * Knob 1 - Size and style of raindrops (affects both size and visual appearance)
 * Knob 2 - Intensity of rain (number of raindrops)
 * Knob 3 - Wind variability and rain speed (0 = slow/calm, 1 = fast/windy)
 * Knob 4 - Color of rain and other elements
 * Knob 5 - Background color
 */

class Raindrop {
  private x: number;
  private y: number;
  private screenWidth: number;
  private screenHeight: number;
  private speed: number;
  private windOffset: number;
  private prevY: number;
  private angle: number;

  constructor(x: number, y: number, screenWidth: number, screenHeight: number) {
    this.x = x;
    this.y = y;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.speed = Math.random() * 5 + 3; // Base falling speed
    this.windOffset = 0.0; // Horizontal wind effect
    this.prevY = y; // Track previous position for motion trail
    this.angle = 0.0; // Slight angle for wind effect
  }

  update(windStrength: number, speedMultiplier: number): void {
    // Store previous position for motion trail
    this.prevY = this.y;
    // Apply wind effect with slight angle
    this.windOffset += windStrength * (Math.random() - 0.5) * 0.6;
    this.x += this.windOffset;
    // Slight angle based on wind (raindrops tilt in wind)
    this.angle = windStrength * 0.15; // Max ~8.5 degrees
    // Fall down with speed multiplier (affected by knob3)
    this.y += this.speed * speedMultiplier;
    // Reset if off screen
    if (this.y > this.screenHeight) {
      this.y = Math.random() * 50 - 50;
      this.x = Math.random() * this.screenWidth;
      this.windOffset = 0.0;
      this.angle = 0.0;
      this.prevY = this.y;
    } else if (this.x < 0 || this.x > this.screenWidth) {
      // Reset if blown off screen horizontally
      this.y = Math.random() * 50 - 50;
      this.x = Math.random() * this.screenWidth;
      this.windOffset = 0.0;
      this.angle = 0.0;
      this.prevY = this.y;
    }
  }

  draw(canvas: Canvas, color: [number, number, number], size: number, styleFactor: number): void {
    const x = this.x;
    const y = this.y;

    // For very small drops, use a simple circle with trail
    if (size <= 1.5) {
      // Draw motion trail
      if (Math.abs(this.y - this.prevY) > 0.5) {
        const trailColor: [number, number, number] = [
          Math.max(0, Math.floor(color[0] * 0.4)),
          Math.max(0, Math.floor(color[1] * 0.4)),
          Math.max(0, Math.floor(color[2] * 0.4))
        ];
        canvas.line([x, this.prevY], [x, y], trailColor, 1);
      }
      canvas.circle([x, y], 1, color, 0);
      return;
    }

    // Style-based dimensions - appearance changes with knob1
    const widthBase = 0.6 + (styleFactor * 0.4); // 0.6 to 1.0
    const dropWidth = Math.max(2, Math.floor(size * widthBase));
    const lengthBase = 0.8 + (styleFactor * 0.8); // 0.8 to 1.6
    const dropLength = Math.max(4, Math.floor(4 + size * lengthBase));

    // Draw motion trail first (faded)
    const trailIntensity = 0.2 + (styleFactor * 0.15); // 0.2 to 0.35
    if (Math.abs(this.y - this.prevY) > 1.0 && size > 2) {
      const trailLength = Math.min(dropLength * 0.6, Math.abs(this.y - this.prevY));
      const trailStartY = this.prevY;
      const trailEndY = y - dropLength * 0.3;
      const trailWidth = Math.max(1, Math.floor(dropWidth * 0.5));
      const trailPoints = this.createTeardropPoints(x, trailStartY, trailWidth, Math.floor(trailLength * 0.7), this.angle, styleFactor);
      const trailColor: [number, number, number] = [
        Math.max(0, Math.floor(color[0] * trailIntensity)),
        Math.max(0, Math.floor(color[1] * trailIntensity)),
        Math.max(0, Math.floor(color[2] * trailIntensity))
      ];
      if (trailPoints.length > 2) {
        canvas.polygon(trailPoints, trailColor, 0);
      }
    }

    // Create main teardrop shape
    const points = this.createTeardropPoints(x, y, dropWidth, dropLength, this.angle, styleFactor);
    // Draw filled teardrop
    canvas.polygon(points, color, 0);

    // Add highlight at the top
    if (size > 2) {
      const highlightBase = 0.25 + (styleFactor * 0.15); // 0.25 to 0.4
      const highlightSize = Math.max(1, Math.min(3, Math.floor(size * highlightBase)));
      const highlightX = x + Math.sin(this.angle) * highlightSize * 0.5;
      const highlightY = y + highlightSize + Math.cos(this.angle) * highlightSize * 0.5;
      const highlightBrightness = 0.3 + (styleFactor * 0.2); // 0.3 to 0.5
      const highlightColor: [number, number, number] = [
        Math.floor(color[0] * (1 - highlightBrightness) + 255 * highlightBrightness),
        Math.floor(color[1] * (1 - highlightBrightness) + 255 * highlightBrightness),
        Math.floor(color[2] * (1 - highlightBrightness) + 255 * highlightBrightness)
      ];
      canvas.circle([highlightX, highlightY], highlightSize, highlightColor, 0);
    }
  }

  private createTeardropPoints(centerX: number, centerY: number, width: number, length: number, angle: number, styleFactor: number): [number, number][] {
    // Calculate rotation offsets
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    // Style affects shape characteristics
    const numPoints = Math.floor(12 + (styleFactor * 8)); // 12 to 20 points
    const capSize = Math.max(0.1, Math.min(0.3, 0.25 - (styleFactor * 0.1))); // 0.25 to 0.15
    const taperExponent = 1.3 + (styleFactor * 0.4); // 1.3 to 1.7
    const points: [number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1); // 0 to 1
      const yOffset = t * length;
      let xOffset: number;

      // Teardrop width profile: rounded top, then smooth taper
      if (t < capSize) {
        // Top rounded cap (semicircle-like)
        const tCap = t / capSize; // 0 to 1 for the cap
        const angleOffset = tCap * Math.PI; // 0 to pi
        xOffset = Math.sin(angleOffset) * width * 0.5;
      } else {
        // Tapering body - use exponential curve
        const tBody = (t - capSize) / (1 - capSize); // 0 to 1 for the body
        const taperFactor = Math.pow(1 - tBody, taperExponent);
        xOffset = width * 0.5 * taperFactor;
      }

      // Rotate point around center
      const rotX = xOffset * cosA - yOffset * sinA;
      const rotY = xOffset * sinA + yOffset * cosA;
      points.push([centerX + rotX, centerY + rotY]);
    }

    return points;
  }
}

export class Rain implements Mode {
  private raindrops: Raindrop[] = [];
  private maxRaindrops = 500; // Maximum number of raindrops

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.raindrops = [];
    // Create initial raindrops - some start on screen for immediate visibility
    const initialCount = Math.max(50, Math.floor(eyesy.knob2 * this.maxRaindrops));
    for (let i = 0; i < initialCount; i++) {
      const x = Math.random() * eyesy.xres;
      // Mix of drops: 70% on screen, 30% above screen (for continuous flow)
      const y = Math.random() < 0.7 
        ? Math.random() * eyesy.yres 
        : Math.random() * -eyesy.yres * 0.5;
      this.raindrops.push(new Raindrop(x, y, eyesy.xres, eyesy.yres));
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set background color
    eyesy.color_picker_bg(eyesy.knob5);
    // Get rain color
    const color = eyesy.color_picker(eyesy.knob4);
    // Calculate raindrop size (2-8 pixels)
    const dropSize = Math.max(2, Math.min(8, Math.floor(eyesy.knob1 * 8)));
    // Calculate style factor from knob1 (0-1)
    const styleFactor = eyesy.knob1;
    // Calculate rain intensity (number of raindrops)
    const targetCount = Math.floor(eyesy.knob2 * this.maxRaindrops);
    // Adjust number of raindrops to match intensity
    while (this.raindrops.length < targetCount) {
      const x = Math.random() * eyesy.xres;
      const y = Math.random() * -eyesy.yres;
      this.raindrops.push(new Raindrop(x, y, eyesy.xres, eyesy.yres));
    }
    while (this.raindrops.length > targetCount) {
      this.raindrops.shift();
    }
    // Calculate wind strength from knob3
    const windStrength = (eyesy.knob3 - 0.5) * 2.0; // Map to -1.0 to 1.0
    // Calculate speed multiplier from knob3
    const speedMultiplier = 0.3 + (eyesy.knob3 * 1.7); // Range: 0.3x to 2.0x speed
    // Update and draw raindrops
    for (const drop of this.raindrops) {
      drop.update(windStrength, speedMultiplier);
      drop.draw(canvas, color, dropSize, styleFactor);
    }
  }
}
