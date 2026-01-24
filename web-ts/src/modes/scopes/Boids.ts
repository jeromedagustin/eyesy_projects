import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Boids
 * Ported from Python version
 * 
 * Knob1 - Boid size
 * Knob2 - Bar width
 * Knob3 - Bar style (filled/unfilled, curved/90-degree corners)
 * Knob4 - foreground color
 * Knob5 - background color
 */
class Boid {
  position: [number, number];
  velocity: [number, number];
  size: number;
  colorValue: number;

  constructor(x: number, y: number) {
    this.position = [x, y];
    const angle = Math.random() * Math.PI * 2;
    const speed = 20;
    this.velocity = [Math.cos(angle) * speed, Math.sin(angle) * speed];
    this.size = 1;
    this.colorValue = Math.random();
  }

  update(screenWidth: number, screenHeight: number, obstacles: Array<{x: number, y: number, w: number, h: number}>, size: number, deltaTime: number): void {
    this.size = size;
    
    // Update position
    this.position[0] += this.velocity[0] * deltaTime;
    this.position[1] += this.velocity[1] * deltaTime;
    
    // Wrap around screen edges
    if (this.position[0] > screenWidth) {
      this.position[0] = 0;
    } else if (this.position[0] < 0) {
      this.position[0] = screenWidth;
    }
    if (this.position[1] > screenHeight) {
      this.position[1] = 0;
    } else if (this.position[1] < 0) {
      this.position[1] = screenHeight;
    }
    
    // Check for collisions with obstacles and bounce
    for (const obstacle of obstacles) {
      const boidLeft = this.position[0] - this.size;
      const boidRight = this.position[0] + this.size;
      const boidTop = this.position[1] - this.size;
      const boidBottom = this.position[1] + this.size;
      
      if (boidRight > obstacle.x && boidLeft < obstacle.x + obstacle.w &&
          boidBottom > obstacle.y && boidTop < obstacle.y + obstacle.h) {
        this.bounce(obstacle);
      }
    }
  }

  private bounce(obstacle: {x: number, y: number, w: number, h: number}): void {
    const obstacleCenterX = obstacle.x + obstacle.w / 2;
    const obstacleCenterY = obstacle.y + obstacle.h / 2;
    
    const overlapX = Math.min(this.position[0] + this.size, obstacle.x + obstacle.w) - 
                     Math.max(this.position[0] - this.size, obstacle.x);
    const overlapY = Math.min(this.position[1] + this.size, obstacle.y + obstacle.h) - 
                     Math.max(this.position[1] - this.size, obstacle.y);
    
    if (overlapX < overlapY) {
      // Bounce horizontally
      if (this.position[0] < obstacleCenterX) {
        this.velocity[0] = -Math.abs(this.velocity[0]);
      } else {
        this.velocity[0] = Math.abs(this.velocity[0]);
      }
    } else {
      // Bounce vertically
      if (this.position[1] < obstacleCenterY) {
        this.velocity[1] = -Math.abs(this.velocity[1]);
      } else {
        this.velocity[1] = Math.abs(this.velocity[1]);
      }
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    const color = eyesy.color_picker(this.colorValue);
    canvas.circle([Math.floor(this.position[0]), Math.floor(this.position[1])], this.size, color, 0);
  }
}

export class Boids implements Mode {
  private xr = 1280;
  private yr = 720;
  private minHeight = 5;
  private yhalf = 0;
  private audioHistory: Map<number, number[]> = new Map();
  private boids: Boid[] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.minHeight = 5;
    this.yhalf = this.yr / 2;
    this.boids = [];
    const NUM_BOIDS = 250;
    for (let i = 0; i < NUM_BOIDS; i++) {
      this.boids.push(new Boid(
        Math.random() * this.xr,
        Math.random() * this.yr
      ));
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Calculate boid size based on knob1
    const boidSize = Math.floor(eyesy.knob1 * 24) + 1;
    
    // Number of vu boxes
    const count = 32;
    const spacing = this.xr / count;
    const boxWidth = Math.floor(eyesy.knob2 * spacing) + 2;
    const boxWidthHalf = Math.floor(boxWidth / 2);
    const boxOffset = Math.floor((spacing - boxWidth) / 2);
    
    const obstacles: Array<{x: number, y: number, w: number, h: number}> = [];
    
    // Draw vu_boxes!
    for (let i = 0; i < count; i++) {
      const currentValue = Math.abs((eyesy.audio_in[i] || 0) * this.yr / 32768);
      
      // Initialize history array for the index if not already present
      if (!this.audioHistory.has(i)) {
        this.audioHistory.set(i, []);
      }
      
      const history = this.audioHistory.get(i)!;
      history.push(currentValue);
      
      // Ensure the history array doesn't exceed 2 elements
      if (history.length > 2) {
        history.shift();
      }
      
      // Calculate the average of the history
      const averageValue = history.reduce((a, b) => a + b, 0) / history.length;
      const height = Math.floor(averageValue + this.minHeight);
      
      // Fill/stroke width & corner size
      let fill = 0;
      let corner = 0;
      if (eyesy.knob3 < 0.5) {
        fill = Math.floor(boxWidthHalf * eyesy.knob3) + 1;
        if (height <= (this.minHeight + fill) * 2) {
          corner = 0;
        } else {
          corner = Math.floor(boxWidthHalf * (eyesy.knob3 * 2));
        }
      } else {
        corner = Math.floor(boxWidthHalf * (2 - (eyesy.knob3 * 2)));
        fill = 0;
      }
      
      // Calculate the x position with consistent spacing
      const xPosition = Math.floor(i * spacing + boxOffset);
      
      // Draw a single box for each audio input
      const vuBox = {
        x: xPosition,
        y: this.yhalf - (height / 2),
        w: boxWidth,
        h: height
      };
      obstacles.push(vuBox);
      
      // Draw rectangle (Canvas API doesn't support rounded rectangles directly)
      if (fill > 0) {
        canvas.rect(vuBox.x, vuBox.y, vuBox.w, vuBox.h, color, 0);
      } else {
        canvas.rect(vuBox.x, vuBox.y, vuBox.w, vuBox.h, color, 1);
      }
    }
    
    // Update and draw boids with dynamic size and consistent color
    for (const boid of this.boids) {
      boid.update(this.xr, this.yr, obstacles, boidSize, eyesy.deltaTime);
      boid.draw(canvas, eyesy);
    }
  }
}
