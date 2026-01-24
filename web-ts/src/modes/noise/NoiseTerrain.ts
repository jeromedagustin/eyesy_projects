import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * N - Noise Terrain
 * 3D-like terrain visualization from noise
 * 
 * Knob1 - Noise scale (terrain detail)
 * Knob2 - Animation speed
 * Knob3 - Height variation
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class NoiseTerrain implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

  private noise(x: number, y: number, time: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + time * 0.1) * 43758.5453;
    return n - Math.floor(n);
  }

  private getNoise(x: number, y: number, time: number, scale: number): number {
    const nx = (x / 200.0) * scale;
    const ny = (y / 200.0) * scale;
    const nt = time * 0.1;
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
    let noiseScale = 0.5 + eyesy.knob1 * 2.0;
    noiseScale *= (1.0 + this.smoothedAudioLevel * 0.3);

    // Knob2: Animation speed
    // Audio can boost speed
    let animSpeed = eyesy.knob2 * 0.5;
    animSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);

    // Knob3: Height variation
    // Audio can boost height variation
    let heightVar = eyesy.yres * (0.1 + eyesy.knob3 * 0.3);
    heightVar *= (1.0 + this.smoothedAudioLevel * 0.4);

    // MIDI trigger can add extra variation
    const triggerBoost = eyesy.trig ? 1.3 : 1.0;

    const centerY = eyesy.yres / 2;
    const segments = 100;

    // Draw terrain line
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * eyesy.xres;
      const noiseValue = this.getNoise(x, 0, this.time * animSpeed * triggerBoost, noiseScale);
      const height = (noiseValue - 0.5) * heightVar;
      const y = centerY + height;
      points.push([Math.floor(x), Math.floor(y)]);
    }

    // Draw terrain
    for (let i = 0; i < points.length - 1; i++) {
      canvas.line(points[i], points[i + 1], color, 2);
    }

    // Fill below terrain
    const fillPoints: [number, number][] = [
      ...points,
      [eyesy.xres, eyesy.yres],
      [0, eyesy.yres]
    ];
    canvas.polygon(fillPoints, color, 0);
  }
}

