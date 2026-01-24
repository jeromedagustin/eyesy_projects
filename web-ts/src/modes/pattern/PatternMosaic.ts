import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * PT - Pattern Mosaic
 * Mosaic tile pattern
 * 
 * Knob1 - Tile size
 * Knob2 - Pattern rotation
 * Knob3 - Pattern complexity
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class PatternMosaic implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.smoothedAudioLevel = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);

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

    // Knob1: Tile size
    // Audio can affect tile size
    let tileSize = 30 + eyesy.knob1 * 70;
    tileSize *= (1.0 + this.smoothedAudioLevel * 0.2);

    // Knob2: Rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 0.3;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.4);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Pattern complexity (1 to 4)
    // Audio can add more complexity
    let complexity = Math.floor(1 + eyesy.knob3 * 3);
    complexity += Math.floor(this.smoothedAudioLevel * 1);

    const cols = Math.ceil(eyesy.xres / tileSize) + 1;
    const rows = Math.ceil(eyesy.yres / tileSize) + 1;

    // Draw mosaic pattern
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;
        const centerX = x + tileSize / 2;
        const centerY = y + tileSize / 2;

        // Alternate pattern based on position
        const patternType = ((row + col) % complexity);
        
        if (patternType === 0) {
          // Draw circle (size reacts to audio)
          const circleSize = tileSize * 0.3 * (1.0 + this.smoothedAudioLevel * 0.3);
          canvas.circle([Math.floor(centerX), Math.floor(centerY)], Math.floor(circleSize), color, 2);
        } else if (patternType === 1) {
          // Draw square
          const size = tileSize * 0.4;
          canvas.rect(
            Math.floor(centerX - size / 2),
            Math.floor(centerY - size / 2),
            Math.floor(size),
            Math.floor(size),
            color,
            2
          );
        } else if (patternType === 2) {
          // Draw triangle
          const size = tileSize * 0.3;
          const points: [number, number][] = [
            [Math.floor(centerX), Math.floor(centerY - size)],
            [Math.floor(centerX - size), Math.floor(centerY + size)],
            [Math.floor(centerX + size), Math.floor(centerY + size)]
          ];
          canvas.polygon(points, color, 2);
        } else {
          // Draw diamond
          const size = tileSize * 0.3;
          const points: [number, number][] = [
            [Math.floor(centerX), Math.floor(centerY - size)],
            [Math.floor(centerX + size), Math.floor(centerY)],
            [Math.floor(centerX), Math.floor(centerY + size)],
            [Math.floor(centerX - size), Math.floor(centerY)]
          ];
          canvas.polygon(points, color, 2);
        }
      }
    }
  }
}

