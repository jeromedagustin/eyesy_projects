import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * S - Folia Curves
 * Ported from Python version
 * 
 * Knob1 - Drawing option selection
 * Knob2 - Max. rotation speed. If knob is turned all the way right, the rotation speed is stopped and the angle is set to 0.
 * Knob3 - 'Trails' amount. Need to turn on 'Persist' button to see the effect.
 * Knob4 - foreground color
 * Knob5 - background color
 */
export class Foliacurves implements Mode {
  private xr = 1280;
  private yr = 720;
  private l100 = 0;
  private audioHistory: number[][] = [];
  private rotationAngles: number[] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.xr = eyesy.xres;
    this.yr = eyesy.yres;
    this.l100 = this.xr * 0.037;
    // Initialize the audio history for each slot (63 boxes, 7 samples each)
    this.audioHistory = Array(63).fill(null).map(() => Array(7).fill(0));
    // Initialize the rotation angles for each box
    this.rotationAngles = Array(63).fill(0);
  }

  private rotatePoint(cx: number, cy: number, x: number, y: number, angle: number): [number, number] {
    // Rotate a point around a center
    const radians = (angle * Math.PI) / 180;
    const cosAngle = Math.cos(radians);
    const sinAngle = Math.sin(radians);
    const translatedX = x - cx;
    const translatedY = y - cy;
    const rotatedX = translatedX * cosAngle - translatedY * sinAngle;
    const rotatedY = translatedX * sinAngle + translatedY * cosAngle;
    return [rotatedX + cx, rotatedY + cy];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Color settings
    eyesy.color_picker_bg(eyesy.knob5);
    const color = eyesy.color_picker_lfo(eyesy.knob4, 0.05);

    // Calculate the spacing between the boxes
    const gridWidth = 9;
    const gridHeight = 7;
    const boxWidth = this.l100;
    const boxHeight = this.l100;
    const horizontalSpacing = (this.xr - gridWidth * boxWidth) / (gridWidth + 1);
    const verticalSpacing = (this.yr - gridHeight * boxHeight) / (gridHeight + 1);

    // Draw the grid of boxes
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        // Calculate the position of the box
        const x = horizontalSpacing * (col + 1) + col * boxWidth;
        const y = verticalSpacing * (row + 1) + row * boxHeight;

        // Get the y-position offset from the audio input
        const index = row * gridWidth + col;
        const currentValue = ((eyesy.audio_in[index] || 0) * this.yr) / 32768;

        // Update the history and calculate the average
        this.audioHistory[index].shift();
        this.audioHistory[index].push(currentValue);
        const a1 = this.audioHistory[index].reduce((a, b) => a + b, 0) / this.audioHistory[index].length;

        // Update the rotation angle based on a1
        const maxRotationSpeed = eyesy.knob2 * 200; // Maximum rotation speed in degrees per frame
        const rotationSpeed = (a1 / this.yr) * maxRotationSpeed * 2; // Scale a1
        this.rotationAngles[index] += rotationSpeed;

        // Limit the rotation angle to [-180, 180]
        this.rotationAngles[index] = Math.max(-180, Math.min(180, this.rotationAngles[index]));

        if (eyesy.knob2 === 1) {
          this.rotationAngles = Array(63).fill(0);
        }

        // Calculate the rotated vertices of the box
        const centerX = x + boxWidth / 2;
        const centerY = y + boxHeight / 2;

        // Determine the drawing option based on eyesy.knob1
        if (eyesy.knob1 < 0.15) {
          // 1 - single
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
        } else if (eyesy.knob1 >= 0.15 && eyesy.knob1 < 0.3) {
          // 2 - broken lozenge
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          const additionalLine2: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y + boxWidth, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + boxWidth - a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y + boxWidth, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
          canvas.bezier(additionalLine2, color, 1, 4);
        } else if (eyesy.knob1 >= 0.3 && eyesy.knob1 < 0.45) {
          // 3 - angle
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          const additionalLine3: [number, number][] = [
            this.rotatePoint(centerX, centerY, x, y + boxWidth, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + a1, y + boxWidth / 2, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
          canvas.bezier(additionalLine3, color, 1, 4);
        } else if (eyesy.knob1 >= 0.45 && eyesy.knob1 < 0.6) {
          // 4 - bird beak
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          const additionalLine2: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y - a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
          canvas.bezier(additionalLine2, color, 1, 4);
        } else if (eyesy.knob1 >= 0.6 && eyesy.knob1 < 0.75) {
          // 5 - house
          const vertices: [number, number][] = [
            [x, y],
            [x, y + boxHeight],
            [x + boxWidth, y + boxHeight],
            [x + boxWidth, y]
          ];
          const rotatedVertices = vertices.map(([vx, vy]) =>
            this.rotatePoint(centerX, centerY, vx, vy, this.rotationAngles[index])
          );
          canvas.lines(rotatedVertices, color, 1, true);
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
        } else if (eyesy.knob1 >= 0.75 && eyesy.knob1 < 0.9) {
          // 6 - lozenge
          const vertices: [number, number][] = [
            [x, y],
            [x, y + boxHeight],
            [x + boxWidth, y + boxHeight],
            [x + boxWidth, y]
          ];
          const rotatedVertices = vertices.map(([vx, vy]) =>
            this.rotatePoint(centerX, centerY, vx, vy, this.rotationAngles[index])
          );
          canvas.lines([rotatedVertices[0], rotatedVertices[1]], color, 1, false);
          canvas.lines([rotatedVertices[2], rotatedVertices[3]], color, 1, false);
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          const additionalLine2: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y + boxWidth, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + boxWidth - a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y + boxWidth, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
          canvas.bezier(additionalLine2, color, 1, 4);
        } else {
          // 7 - star
          const additionalLine: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          const additionalLine2: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y + boxWidth, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth / 2, y + boxWidth - a1, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y + boxWidth, this.rotationAngles[index])
          ];
          const additionalLine3: [number, number][] = [
            this.rotatePoint(centerX, centerY, x, y + boxWidth, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + a1, y + boxWidth / 2, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x, y, this.rotationAngles[index])
          ];
          const additionalLine4: [number, number][] = [
            this.rotatePoint(centerX, centerY, x + boxWidth, y + boxWidth, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x - a1 + boxWidth, y + boxWidth / 2, this.rotationAngles[index]),
            this.rotatePoint(centerX, centerY, x + boxWidth, y, this.rotationAngles[index])
          ];
          canvas.bezier(additionalLine, color, 1, 4);
          canvas.bezier(additionalLine2, color, 1, 4);
          canvas.bezier(additionalLine3, color, 1, 4);
          canvas.bezier(additionalLine4, color, 1, 4);
        }
      }
    }

    // Trails effect - handled by auto_clear setting in App.ts
  }
}
