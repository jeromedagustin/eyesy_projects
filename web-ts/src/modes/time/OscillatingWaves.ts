import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Oscillating Waves
 * Continuous wave oscillations
 * 
 * Knob1 - Wave speed
 * Knob2 - Wave amplitude
 * Knob3 - Number of wave layers
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class OscillatingWaves implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.smoothedAudioLevel = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);

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

    // Knob1: Wave speed
    // Audio can boost speed
    let waveSpeed = 0.5 + eyesy.knob1 * 2.0;
    waveSpeed *= (1.0 + this.smoothedAudioLevel * 0.7);

    // Knob2: Wave amplitude
    // Audio can boost amplitude
    let amplitude = eyesy.yres * (0.1 + eyesy.knob2 * 0.3);
    amplitude *= (1.0 + this.smoothedAudioLevel * 0.5);

    // Knob3: Number of layers (1 to 4)
    // Audio can add more layers
    let numLayers = Math.floor(1 + eyesy.knob3 * 3);
    numLayers += Math.floor(this.smoothedAudioLevel * 2);

    const centerY = eyesy.yres / 2;

    // MIDI trigger can add extra phase boost
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;

    // Draw wave layers
    for (let layer = 0; layer < numLayers; layer++) {
      const layerPhase = (this.time * waveSpeed * triggerBoost) + (layer * 0.5);
      const layerOffset = (layer - (numLayers - 1) / 2) * (amplitude * 0.5);
      
      const points: [number, number][] = [];
      const segments = 150;
      
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * eyesy.xres;
        // Multiple sine waves for complex pattern
        const wave1 = Math.sin((x / eyesy.xres) * Math.PI * 6 + layerPhase * Math.PI * 2);
        const wave2 = Math.sin((x / eyesy.xres) * Math.PI * 12 + layerPhase * Math.PI * 2 * 1.5) * 0.5;
        const y = centerY + layerOffset + (wave1 + wave2) * amplitude * 0.5;
        points.push([Math.floor(x), Math.floor(y)]);
      }
      
      // Draw wave
      for (let i = 0; i < points.length - 1; i++) {
        canvas.line(points[i], points[i + 1], color, 2);
      }
    }
  }
}
