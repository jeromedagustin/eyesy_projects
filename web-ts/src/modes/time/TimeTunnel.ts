import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Time Tunnel
 * Tunnel/zoom effect with time
 * 
 * Knob1 - Tunnel speed
 * Knob2 - Tunnel depth
 * Knob3 - Number of rings
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class TimeTunnel implements Mode {
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

    // Knob1: Tunnel speed
    // Audio can boost speed
    let tunnelSpeed = 0.5 + eyesy.knob1 * 2.0;
    tunnelSpeed *= (1.0 + this.smoothedAudioLevel * 0.7);

    // Knob2: Tunnel depth
    // Audio can boost depth
    let depth = eyesy.knob2;
    depth = Math.min(1.0, depth + this.smoothedAudioLevel * 0.3);

    // Knob3: Number of rings (8 to 30)
    // Audio can add more rings
    let numRings = Math.floor(8 + eyesy.knob3 * 22);
    numRings += Math.floor(this.smoothedAudioLevel * 5);

    // Audio can affect max radius
    let maxRadius = Math.min(eyesy.xres, eyesy.yres) * 0.5;
    maxRadius *= (1.0 + this.smoothedAudioLevel * 0.15);

    // MIDI trigger can add extra speed boost
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;

    // Draw tunnel rings
    for (let i = 0; i < numRings; i++) {
      const ringPhase = (this.time * tunnelSpeed * triggerBoost) + (i * 0.1);
      const ringProgress = (i / numRings);
      
      // Calculate radius with tunnel effect
      const baseRadius = maxRadius * ringProgress;
      const radiusVariation = Math.sin(ringPhase * Math.PI * 2) * depth * 10;
      const radius = baseRadius + radiusVariation;

      // Draw ring
      canvas.circle([centerX, centerY], Math.max(1, Math.floor(radius)), color, 2);
    }
  }
}

