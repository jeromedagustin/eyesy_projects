import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * N - Noise Clouds
 * Cloud-like patterns using noise
 * 
 * Knob1 - Noise scale
 * Knob2 - Animation speed
 * Knob3 - Cloud density
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class NoiseClouds implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

  private noise(x: number, y: number, time: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + time * 0.1) * 43758.5453;
    return n - Math.floor(n);
  }

  private getNoise(x: number, y: number, time: number, scale: number): number {
    const nx = (x / 150.0) * scale;
    const ny = (y / 150.0) * scale;
    const nt = time * 0.15;
    return this.noise(nx, ny, nt);
  }

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

    // Knob1: Noise scale
    // Audio can affect scale
    let noiseScale = 0.4 + eyesy.knob1 * 1.5;
    noiseScale *= (1.0 + this.smoothedAudioLevel * 0.3);

    // Knob2: Animation speed
    // Audio can boost speed
    let animSpeed = eyesy.knob2 * 0.3;
    animSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);

    // Knob3: Cloud density (threshold)
    // Audio can affect density
    let density = 0.3 + eyesy.knob2 * 0.4;
    density = Math.max(0.1, Math.min(0.9, density - this.smoothedAudioLevel * 0.2));

    // MIDI trigger can add extra speed boost
    const triggerBoost = eyesy.trig ? 1.4 : 1.0;

    // Draw cloud pattern
    const gridSize = 30;
    const cellWidth = eyesy.xres / gridSize;
    const cellHeight = eyesy.yres / gridSize;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        const noiseValue = this.getNoise(x, y, this.time * animSpeed * triggerBoost, noiseScale);
        
        if (noiseValue > density) {
          const alpha = (noiseValue - density) / (1.0 - density);
          const size = cellWidth * alpha * 1.5 * (1.0 + this.smoothedAudioLevel * 0.3);
          
          canvas.circle(
            [Math.floor(x + cellWidth / 2), Math.floor(y + cellHeight / 2)],
            Math.floor(size / 2),
            color,
            0
          );
        }
      }
    }
  }
}

