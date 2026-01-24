import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils';

/**
 * S - 0 Joy Division
 * Ported from Python version
 */
export class Mode0joydivision implements Mode {
  private lineBuffer: number[][] = [];

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.lineBuffer = [];
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Set black background
    eyesy.color_picker_bg(eyesy.knob5);
    canvas.fill(eyesy.bg_color);

    const w = eyesy.xres;
    const h = eyesy.yres;

    // Number of horizontal segments across width
    const numPoints = 100;
    const lineWidthRatio = 0.6;
    const xStart = (1 - lineWidthRatio) * w / 2;
    const xEnd = w - xStart;
    const usableWidth = xEnd - xStart;
    const spacing = usableWidth / numPoints;

    // Normalize audio into waveform
    const waveform: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      const idx = Math.floor(i * (eyesy.audio_in.length || 200) / numPoints);
      // Use AudioScope for consistent normalization and microphone checking
      const sample = AudioScope.getSampleClamped(eyesy, idx);
      const yOffset = sample * (10 + eyesy.knob5 * 100);
      waveform.push(yOffset);
    }

    // Add new line to buffer
    this.lineBuffer.unshift(waveform);

    // Keep only enough lines to fill screen
    const maxLines = Math.floor(h / 6);
    const lineSpacing = 16;
    this.lineBuffer = this.lineBuffer.slice(0, maxLines);

    // Draw each horizontal line
    const color: [number, number, number] = [255, 255, 255];
    for (let i = 0; i < this.lineBuffer.length; i++) {
      const line = this.lineBuffer[i];
      const y = h - i * lineSpacing;
      const points: [number, number][] = [];

      for (let j = 0; j < line.length; j++) {
        const offset = line[j];
        const x = Math.floor(xStart + j * spacing);
        let wave = offset;

        // Apply center pull (like the original artwork)
        const distFromCenter = Math.abs(j - numPoints / 2);
        wave *= 1 - (distFromCenter / (numPoints / 2));
        points.push([x, Math.floor(y + wave)]);
      }

      if (points.length > 1) {
        // Draw connected lines
        canvas.lines(points, color, 1, false);
      }
    }
  }
}
