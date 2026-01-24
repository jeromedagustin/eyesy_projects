import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * G - Geometric Tiles
 * Tiling geometric patterns
 * 
 * Knob1 - Tile size
 * Knob2 - Pattern rotation
 * Knob3 - Pattern complexity (number of shapes per tile)
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class GeometricTiles implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.smoothedAudioLevel = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);

    // Update time for rotation
    // Update time for animation
    // For reverse playback to work correctly, sync with eyesy.time when deltaTime is negative
    if (eyesy.deltaTime < 0) {
      // Reverse playback: use eyesy.time directly to stay in sync
      this.time = eyesy.time;
    } else {
      // Normal playback: accumulate using deltaTime
      this.time += eyesy.deltaTime;
    }

    // Calculate audio level using RMS (Root Mean Square) for better accuracy
    // Only react to audio if microphone is enabled
    let audioLevel = 0.0;
    if (eyesy.mic_enabled && eyesy.audio_in && eyesy.audio_in.length > 0) {
      let sumSquares = 0.0;
      for (let i = 0; i < eyesy.audio_in.length; i++) {
        const normalized = (eyesy.audio_in[i] || 0) / 32768.0;
        sumSquares += normalized * normalized;
      }
      audioLevel = Math.sqrt(sumSquares / eyesy.audio_in.length);
    }
    // Use faster decay when audio is below threshold (no audio detected) or mic is disabled
    const audioThreshold = 0.005; // Lower threshold for better sensitivity
    if (!eyesy.mic_enabled || audioLevel < audioThreshold) {
      // Very fast decay when no audio or mic disabled (decay 50% per frame)
      this.smoothedAudioLevel = this.smoothedAudioLevel * 0.5;
    } else {
      // More responsive smoothing when audio is present (less smoothing = more reactive)
      this.smoothedAudioLevel = this.smoothedAudioLevel * 0.85 + audioLevel * 0.15;
    }

    // Knob1: Tile size (20 to 100 pixels)
    // Audio can affect tile size
    let tileSize = 20 + eyesy.knob1 * 80;
    tileSize *= (1.0 + this.smoothedAudioLevel * 0.2);

    // Knob2: Pattern rotation speed (0 = static, 1 = rotating)
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 0.5;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 2.0 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Pattern complexity (1 to 4 shapes per tile)
    const shapesPerTile = Math.floor(1 + eyesy.knob3 * 3);

    // Calculate grid dimensions
    const cols = Math.ceil(eyesy.xres / tileSize) + 1;
    const rows = Math.ceil(eyesy.yres / tileSize) + 1;

    // Draw tiled pattern
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        const centerX = x + tileSize / 2;
        const centerY = y + tileSize / 2;

        // Draw shapes in each tile
        for (let s = 0; s < shapesPerTile; s++) {
          const shapeAngle = rotation + (s * (Math.PI * 2 / shapesPerTile));
          const shapeRadius = tileSize * 0.3 * (1.0 - s * 0.2);

          // Calculate shape position
          const shapeX = centerX + Math.cos(shapeAngle) * (tileSize * 0.2);
          const shapeY = centerY + Math.sin(shapeAngle) * (tileSize * 0.2);

          // Draw hexagon (6-sided polygon)
          const sides = 6;
          const points: [number, number][] = [];
          for (let i = 0; i < sides; i++) {
            const angle = shapeAngle + (i * (Math.PI * 2 / sides));
            const px = shapeX + Math.cos(angle) * shapeRadius;
            const py = shapeY + Math.sin(angle) * shapeRadius;
            points.push([Math.floor(px), Math.floor(py)]);
          }
          canvas.polygon(points, color, 2);
        }
      }
    }
  }
}

