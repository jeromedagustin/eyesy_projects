import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Rotating Patterns
 * Continuous rotation animation driven by time
 * 
 * Knob1 - Rotation speed (0 = very slow, 1 = fast)
 * Knob2 - Pattern complexity (number of elements)
 * Knob3 - Pattern scale/size
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class RotatingPatterns implements Mode {
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

    // Knob1: Rotation speed (0 = 0.2 rad/s, 1 = 3.0 rad/s)
    // Audio can boost rotation speed
    let rotationSpeed = 0.2 + eyesy.knob1 * 2.8;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.8);

    // Knob2: Pattern complexity (3 to 12 elements)
    // Audio can add more elements
    let numElements = Math.floor(3 + eyesy.knob2 * 9);
    numElements += Math.floor(this.smoothedAudioLevel * 3);

    // Knob3: Pattern scale (30% to 80% of screen)
    // Audio can affect scale
    let maxRadius = Math.min(eyesy.xres, eyesy.yres) * (0.3 + eyesy.knob3 * 0.5);
    maxRadius *= (1.0 + this.smoothedAudioLevel * 0.2);

    // MIDI trigger can add extra rotation boost
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;
    const angle = this.time * rotationSpeed * triggerBoost;

    // Draw rotating pattern
    for (let i = 0; i < numElements; i++) {
      // Angle for this element
      const elementAngle = angle + (i * (Math.PI * 2 / numElements));
      
      // Position on circle
      const radius = maxRadius * 0.6;
      const x = centerX + Math.cos(elementAngle) * radius;
      const y = centerY + Math.sin(elementAngle) * radius;
      
      // Draw circle at position
      const circleRadius = maxRadius * 0.15 * (1.0 + this.smoothedAudioLevel * 0.3);
      canvas.circle([Math.floor(x), Math.floor(y)], Math.floor(circleRadius), color, 0);
      
      // Draw line from center to element
      canvas.line([centerX, centerY], [Math.floor(x), Math.floor(y)], color, 2);
    }

    // Draw center circle (pulses with audio)
    const centerRadius = maxRadius * 0.1 * (1.0 + this.smoothedAudioLevel * 0.5);
    canvas.circle([centerX, centerY], Math.floor(centerRadius), color, 0);
  }
}

