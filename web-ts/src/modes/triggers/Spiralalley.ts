import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Spiral Alley
 * Ported from Python version
 * 
 * Knob1 - spiral radius
 * Knob2 - number of points
 * Knob3 - spiral tightness
 * Knob4 - foreground color / mode switch (0-0.75: random spirals, 0.75-1: alley mode)
 * Knob5 - background color
 */
export class Spiralalley implements Mode {
  private screen_res_x = 1280;
  private screen_res_y = 720;
  private screen_center_x = 0;
  private screen_center_y = 0;
  private spiral_angle_offset = 0;
  private num_spirals = 11;
  private spiral_centers: [number, number][] = [];
  private color_palette: [number, number, number][] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.screen_res_x = eyesy.xres;
    this.screen_res_y = eyesy.yres;
    this.screen_center_x = Math.floor(eyesy.xres / 2);
    this.screen_center_y = Math.floor(eyesy.yres / 2);
    this.spiral_angle_offset = 0;
    this.num_spirals = 11;
    this.spiral_centers = this.generateSpiralCenters(this.num_spirals);
    this.color_palette = this.generateColorPalette(this.num_spirals);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    if (eyesy.knob4 > 0.75) {
      this.drawSpiralAlley(canvas, eyesy);
    } else {
      if (eyesy.trig) {
        this.num_spirals = Math.floor(Math.random() * 11) + 1;
        this.spiral_centers = this.generateSpiralCenters(this.num_spirals);
        // Shuffle color palette
        for (let i = this.color_palette.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.color_palette[i], this.color_palette[j]] = [this.color_palette[j], this.color_palette[i]];
        }
      }
      if (eyesy.knob4 === 0) {
        this.color_palette = this.generateColorPalette(this.num_spirals);
      }
      for (let i = 0; i < this.spiral_centers.length && i < this.color_palette.length; i++) {
        const center = this.spiral_centers[i];
        const color = this.color_palette[i];
        const x = center[0] - (eyesy.knob3 * 50);
        const y = center[1] + (eyesy.knob3 * 50);
        this.drawSpiralLine(canvas, x, y, 1, eyesy, color);
      }
    }
  }

  private generateSpiralCenters(numSpirals: number): [number, number][] {
    const centers: [number, number][] = [];
    for (let i = 0; i < numSpirals; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * this.screen_center_x;
      const x = this.screen_center_x + distance * Math.cos(angle);
      const y = this.screen_center_y + distance * Math.sin(angle);
      centers.push([x, y]);
    }
    return centers;
  }

  private generateColorPalette(numSpirals: number): [number, number, number][] {
    const palette: [number, number, number][] = [];
    for (let i = 0; i < numSpirals; i++) {
      palette.push(this.randomColor());
    }
    return palette;
  }

  private randomColor(): [number, number, number] {
    return [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    ];
  }

  private drawSpiralLine(
    canvas: Canvas,
    x: number,
    y: number,
    radius: number,
    eyesy: EYESY,
    color: [number, number, number]
  ): void {
    radius += 500 * eyesy.knob1;
    this.spiral_angle_offset += 0.001 * eyesy.deltaTime * 60; // Frame-rate independent
    if (this.spiral_angle_offset > 2 * Math.PI) {
      this.spiral_angle_offset = 0;
    }
    const numPoints = Math.floor(500 * eyesy.knob2 + 10);
    const spiralPoints: [number, number][] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * (2 * Math.PI);
      const r = radius + i * 0.5;
      const px = x + r * Math.cos(theta + i * eyesy.knob3 + this.spiral_angle_offset);
      const py = y + r * Math.sin(theta + i * eyesy.knob3 + this.spiral_angle_offset);
      spiralPoints.push([px, py]);
    }
    
    if (spiralPoints.length > 1) {
      canvas.lines(spiralPoints, color, 2);
    }
  }

  private drawSpiralAlley(canvas: Canvas, eyesy: EYESY): void {
    const numOfSpirals = 7;
    const alleyLocation = Math.floor(eyesy.knob3 * this.screen_res_x);
    const leftAlleyX = 0 + alleyLocation;
    const rightAlleyX = this.screen_res_x - alleyLocation;
    let alleyHeight = this.screen_res_y;
    const heightDiff = Math.floor(this.screen_res_y / numOfSpirals);
    const WHITE: [number, number, number] = [255, 255, 255];
    const BLACK: [number, number, number] = [0, 0, 0];
    
    for (let i = 0; i < numOfSpirals + 1; i++) {
      this.drawSpiralLine(canvas, rightAlleyX, alleyHeight, 1, eyesy, WHITE);
      this.drawSpiralLine(canvas, leftAlleyX, alleyHeight, 1, eyesy, BLACK);
      alleyHeight -= heightDiff;
    }
  }
}
