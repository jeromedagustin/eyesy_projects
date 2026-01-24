import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Snow
 * Ported from Python version
 * 
 * Knob 1 - Size and style of snowflakes (affects both size and visual appearance)
 * Knob 2 - Intensity of snow (number of snowflakes)
 * Knob 3 - Wind variability and snow speed (0 = slow/calm, 1 = fast/windy)
 * Knob 4 - Color of snow and other elements
 * Knob 5 - Background color
 */

class Snowflake {
  private x: number;
  private y: number;
  private screenWidth: number;
  private screenHeight: number;
  private speed: number;
  private windOffset: number;
  private rotation: number;
  private rotationSpeed: number;
  private flutter: number;
  private flutterSpeed: number;
  private patternType: number;

  constructor(x: number, y: number, screenWidth: number, screenHeight: number) {
    this.x = x;
    this.y = y;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.speed = Math.random() * 3 + 1; // Base falling speed (slower than rain)
    this.windOffset = 0.0; // Horizontal wind effect
    this.rotation = Math.random() * Math.PI * 2; // Random starting rotation
    this.rotationSpeed = (Math.random() - 0.5) * 0.1; // Rotation speed
    this.flutter = Math.random() * Math.PI * 2; // Fluttering motion phase
    this.flutterSpeed = Math.random() * 0.06 + 0.02; // Flutter speed
    this.patternType = Math.floor(Math.random() * 3); // Different snowflake patterns
  }

  update(windStrength: number, speedMultiplier: number): void {
    // Apply wind effect with horizontal drift
    this.windOffset += windStrength * (Math.random() - 0.5) * 0.4;
    this.x += this.windOffset;
    // Rotate snowflake as it falls
    this.rotation += this.rotationSpeed;
    // Fluttering motion (side-to-side swaying)
    this.flutter += this.flutterSpeed;
    const flutterOffset = Math.sin(this.flutter) * 0.5;
    this.x += flutterOffset;
    // Fall down with speed multiplier (slower than rain)
    this.y += this.speed * speedMultiplier * 0.6; // Snow falls slower
    // Reset if off screen
    if (this.y > this.screenHeight) {
      this.y = Math.random() * 50 - 50;
      this.x = Math.random() * this.screenWidth;
      this.windOffset = 0.0;
      this.rotation = Math.random() * Math.PI * 2;
      this.flutter = Math.random() * Math.PI * 2;
    } else if (this.x < 0 || this.x > this.screenWidth) {
      // Reset if blown off screen horizontally
      this.y = Math.random() * 50 - 50;
      this.x = Math.random() * this.screenWidth;
      this.windOffset = 0.0;
      this.rotation = Math.random() * Math.PI * 2;
      this.flutter = Math.random() * Math.PI * 2;
    }
  }

  draw(canvas: Canvas, color: [number, number, number], size: number, styleFactor: number): void {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    // For very small snowflakes, use a simple star
    if (size <= 1.5) {
      this.drawSimpleStar(canvas, x, y, 2, color, this.rotation);
      return;
    }

    // Style affects snowflake complexity
    const baseRadius = Math.max(2, Math.floor(size * 1.5));

    if (styleFactor < 0.33) {
      // Simple 6-pointed star
      this.drawSimpleStar(canvas, x, y, baseRadius, color, this.rotation);
    } else if (styleFactor < 0.66) {
      // Hexagonal snowflake with branches
      this.drawHexagonalSnowflake(canvas, x, y, baseRadius, color, this.rotation, 1);
    } else {
      // Complex snowflake with multiple branches
      this.drawHexagonalSnowflake(canvas, x, y, baseRadius, color, this.rotation, 2);
    }
  }

  private drawSimpleStar(canvas: Canvas, x: number, y: number, radius: number, color: [number, number, number], rotation: number): void {
    const points: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) + rotation;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      points.push([px, py]);
    }
    // Draw star outline
    if (points.length >= 3) {
      canvas.polygon(points, color, 1);
      // Fill center
      canvas.circle([x, y], Math.max(1, Math.floor(radius / 3)), color, 0);
    }
  }

  private drawHexagonalSnowflake(canvas: Canvas, x: number, y: number, radius: number, color: [number, number, number], rotation: number, complexity: number): void {
    // Draw center hexagon
    const centerPoints: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) + rotation;
      const px = x + Math.cos(angle) * (radius * 0.3);
      const py = y + Math.sin(angle) * (radius * 0.3);
      centerPoints.push([px, py]);
    }
    if (centerPoints.length >= 3) {
      canvas.polygon(centerPoints, color, 0);
    }

    // Draw 6 main branches
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) + rotation;
      // Main branch line
      const endX = x + Math.cos(angle) * radius;
      const endY = y + Math.sin(angle) * radius;
      canvas.line([x, y], [endX, endY], color, 1);

      // Side branches (perpendicular to main branch)
      if (complexity >= 1) {
        const sideAngle1 = angle + Math.PI / 2;
        const sideAngle2 = angle - Math.PI / 2;
        const branchLength = radius * 0.4;
        const side1X = x + Math.cos(angle) * (radius * 0.6) + Math.cos(sideAngle1) * branchLength;
        const side1Y = y + Math.sin(angle) * (radius * 0.6) + Math.sin(sideAngle1) * branchLength;
        const side2X = x + Math.cos(angle) * (radius * 0.6) + Math.cos(sideAngle2) * branchLength;
        const side2Y = y + Math.sin(angle) * (radius * 0.6) + Math.sin(sideAngle2) * branchLength;
        const midX = x + Math.cos(angle) * (radius * 0.6);
        const midY = y + Math.sin(angle) * (radius * 0.6);
        canvas.line([midX, midY], [side1X, side1Y], color, 1);
        canvas.line([midX, midY], [side2X, side2Y], color, 1);
      }

      // Additional smaller branches for complexity level 2
      if (complexity >= 2) {
        const sideAngle1 = angle + Math.PI / 2;
        const sideAngle2 = angle - Math.PI / 2;
        const smallBranchLength = radius * 0.25;
        const small1X = x + Math.cos(angle) * (radius * 0.3) + Math.cos(sideAngle1) * smallBranchLength;
        const small1Y = y + Math.sin(angle) * (radius * 0.3) + Math.sin(sideAngle1) * smallBranchLength;
        const small2X = x + Math.cos(angle) * (radius * 0.3) + Math.cos(sideAngle2) * smallBranchLength;
        const small2Y = y + Math.sin(angle) * (radius * 0.3) + Math.sin(sideAngle2) * smallBranchLength;
        const smallMidX = x + Math.cos(angle) * (radius * 0.3);
        const smallMidY = y + Math.sin(angle) * (radius * 0.3);
        canvas.line([smallMidX, smallMidY], [small1X, small1Y], color, 1);
        canvas.line([smallMidX, smallMidY], [small2X, small2Y], color, 1);
      }
    }
  }
}

export class Snow implements Mode {
  private snowflakes: Snowflake[] = [];
  private maxSnowflakes = 300; // Maximum number of snowflakes (fewer than rain)

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.snowflakes = [];
    // Create initial snowflakes - some start on screen for immediate visibility
    const initialCount = Math.max(30, Math.floor(eyesy.knob2 * this.maxSnowflakes));
    for (let i = 0; i < initialCount; i++) {
      const x = Math.random() * eyesy.xres;
      // Mix of flakes: 70% on screen, 30% above screen (for continuous flow)
      const y = Math.random() < 0.7 
        ? Math.random() * eyesy.yres 
        : Math.random() * -eyesy.yres * 0.5;
      this.snowflakes.push(new Snowflake(x, y, eyesy.xres, eyesy.yres));
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set background color
    eyesy.color_picker_bg(eyesy.knob5);
    // Get snow color
    const color = eyesy.color_picker(eyesy.knob4);
    // Calculate snowflake size (2-10 pixels)
    const flakeSize = Math.max(2, Math.min(10, Math.floor(eyesy.knob1 * 10)));
    // Calculate style factor from knob1 (0-1) - affects visual appearance
    const styleFactor = eyesy.knob1;
    // Calculate snow intensity (number of snowflakes)
    const targetCount = Math.floor(eyesy.knob2 * this.maxSnowflakes);
    // Adjust number of snowflakes to match intensity
    while (this.snowflakes.length < targetCount) {
      const x = Math.random() * eyesy.xres;
      const y = Math.random() * -eyesy.yres;
      this.snowflakes.push(new Snowflake(x, y, eyesy.xres, eyesy.yres));
    }
    while (this.snowflakes.length > targetCount) {
      this.snowflakes.shift();
    }
    // Calculate wind strength from knob3
    // knob3 controls variability: 0 = no wind, 1 = strong wind
    const windStrength = (eyesy.knob3 - 0.5) * 2.0; // Map to -1.0 to 1.0
    // Calculate speed multiplier from knob3
    // knob3 also controls snow speed: 0 = slow, 1 = fast
    // Map knob3 (0-1) to speed multiplier (0.2 to 1.5) - slower than rain
    const speedMultiplier = 0.2 + (eyesy.knob3 * 1.3); // Range: 0.2x to 1.5x speed
    // Update and draw snowflakes
    for (const flake of this.snowflakes) {
      flake.update(windStrength, speedMultiplier);
      flake.draw(canvas, color, flakeSize, styleFactor);
    }
  }
}
