import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * G - Polygon Patterns
 * Various polygon patterns
 * 
 * Knob1 - Polygon size
 * Knob2 - Rotation speed
 * Knob3 - Number of sides (3 to 8)
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class PolygonPatterns implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.smoothedAudioLevel = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);
    const centerX = Math.floor(eyesy.xres / 2);
    const centerY = Math.floor(eyesy.yres / 2);

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

    // Knob1: Polygon size
    // Audio can affect size
    let baseRadius = Math.min(eyesy.xres, eyesy.yres) * (0.2 + eyesy.knob1 * 0.3);
    baseRadius *= (1.0 + this.smoothedAudioLevel * 0.2);

    // Knob2: Rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 1.0;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.4 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Number of sides (3 to 8)
    const sides = Math.floor(3 + eyesy.knob3 * 5);

    // Draw nested polygons
    const numLayers = 4;
    for (let layer = 0; layer < numLayers; layer++) {
      const layerRadius = baseRadius * (1.0 - (layer / numLayers) * 0.6);
      const layerRotation = rotation + (layer * 0.2);
      
      const points: [number, number][] = [];
      for (let i = 0; i < sides; i++) {
        const angle = layerRotation + (i * (Math.PI * 2 / sides));
        const x = centerX + Math.cos(angle) * layerRadius;
        const y = centerY + Math.sin(angle) * layerRadius;
        points.push([Math.floor(x), Math.floor(y)]);
      }
      
      canvas.polygon(points, color, 2);
    }
  }
}

