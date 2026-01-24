import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Pulsing Shapes
 * Shapes that pulse/breath with time
 * 
 * Knob1 - Pulse speed
 * Knob2 - Pulse amplitude
 * Knob3 - Number of shapes
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class PulsingShapes implements Mode {
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

    // Update time using deltaTime for smooth animation
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

    // Knob1: Pulse speed (0.2 to 2.0 Hz)
    // Audio can boost speed
    let pulseSpeed = 0.2 + eyesy.knob1 * 1.8;
    pulseSpeed *= (1.0 + this.smoothedAudioLevel * 0.6);

    // Knob2: Pulse amplitude (0.3 to 0.9)
    // Audio can boost amplitude
    let pulseAmp = 0.3 + eyesy.knob2 * 0.6;
    pulseAmp = Math.min(1.0, pulseAmp + this.smoothedAudioLevel * 0.2);

    // Knob3: Number of shapes (3 to 8)
    // Audio can add more shapes
    let numShapes = Math.floor(3 + eyesy.knob3 * 5);
    numShapes += Math.floor(this.smoothedAudioLevel * 2);

    // Audio can affect base size
    let maxRadius = Math.min(eyesy.xres, eyesy.yres) * 0.4;
    maxRadius *= (1.0 + this.smoothedAudioLevel * 0.2);

    // MIDI trigger can add extra pulse boost
    const triggerBoost = eyesy.trig ? 1.4 : 1.0;

    // Draw pulsing shapes
    for (let i = 0; i < numShapes; i++) {
      const phase = (this.time * pulseSpeed * triggerBoost) + (i * 0.3);
      const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      const radius = maxRadius * (1.0 - (i / numShapes) * 0.6) * (0.5 + pulse * pulseAmp);

      // Draw polygon (triangle, square, pentagon, etc.)
      const sides = 3 + i;
      const points: [number, number][] = [];
      for (let s = 0; s < sides; s++) {
        const angle = (s * (Math.PI * 2 / sides)) + phase;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        points.push([Math.floor(x), Math.floor(y)]);
      }
      canvas.polygon(points, color, 2);
    }
  }
}
