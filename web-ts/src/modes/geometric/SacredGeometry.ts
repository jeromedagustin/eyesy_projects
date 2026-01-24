import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * G - Sacred Geometry
 * Flower of life and sacred geometric patterns
 * 
 * Knob1 - Pattern scale
 * Knob2 - Rotation speed
 * Knob3 - Number of circles
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class SacredGeometry implements Mode {
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

    // Knob1: Pattern scale
    // Audio can affect scale
    let scale = 0.3 + eyesy.knob1 * 0.5;
    scale *= (1.0 + this.smoothedAudioLevel * 0.2);
    let baseRadius = Math.min(eyesy.xres, eyesy.yres) * scale * 0.3;

    // Knob2: Rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 0.5;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Number of circles (6 to 12)
    // Audio can add more circles
    let numCircles = Math.floor(6 + eyesy.knob3 * 6);
    numCircles += Math.floor(this.smoothedAudioLevel * 3);

    // Draw central circle
    canvas.circle([centerX, centerY], Math.floor(baseRadius), color, 2);

    // Draw surrounding circles (flower of life pattern)
    for (let i = 0; i < numCircles; i++) {
      const angle = rotation + (i * (Math.PI * 2 / numCircles));
      const radius = baseRadius * 1.5;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      canvas.circle([Math.floor(x), Math.floor(y)], Math.floor(baseRadius), color, 2);
      
      // Draw connecting lines
      if (i > 0) {
        const prevAngle = rotation + ((i - 1) * (Math.PI * 2 / numCircles));
        const prevX = centerX + Math.cos(prevAngle) * radius;
        const prevY = centerY + Math.sin(prevAngle) * radius;
        canvas.line([Math.floor(prevX), Math.floor(prevY)], [Math.floor(x), Math.floor(y)], color, 1);
      }
    }

    // Connect last to first
    if (numCircles > 2) {
      const firstAngle = rotation;
      const firstX = centerX + Math.cos(firstAngle) * baseRadius * 1.5;
      const firstY = centerY + Math.sin(firstAngle) * baseRadius * 1.5;
      const lastAngle = rotation + ((numCircles - 1) * (Math.PI * 2 / numCircles));
      const lastX = centerX + Math.cos(lastAngle) * baseRadius * 1.5;
      const lastY = centerY + Math.sin(lastAngle) * baseRadius * 1.5;
      canvas.line([Math.floor(firstX), Math.floor(firstY)], [Math.floor(lastX), Math.floor(lastY)], color, 1);
    }
  }
}

