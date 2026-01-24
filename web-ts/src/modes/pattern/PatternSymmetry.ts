import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * PT - Pattern Symmetry
 * Symmetrical patterns with mirroring
 * 
 * Knob1 - Pattern scale
 * Knob2 - Rotation speed
 * Knob3 - Symmetry type (2, 4, 8 fold)
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class PatternSymmetry implements Mode {
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
    let radius = Math.min(eyesy.xres, eyesy.yres) * scale * 0.3;

    // Knob2: Rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 0.5;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Symmetry folds (2, 4, or 8)
    const folds = [2, 4, 8][Math.floor(eyesy.knob3 * 3)];

    // Draw symmetrical pattern
    for (let fold = 0; fold < folds; fold++) {
      const angle = rotation + (fold * (Math.PI * 2 / folds));
      
      // Draw pattern element
      const elementX = centerX + Math.cos(angle) * radius;
      const elementY = centerY + Math.sin(angle) * radius;
      
      // Draw circle at position (size reacts to audio)
      const circleSize = radius * 0.3 * (1.0 + this.smoothedAudioLevel * 0.3);
      canvas.circle([Math.floor(elementX), Math.floor(elementY)], Math.floor(circleSize), color, 2);
      
      // Draw line from center
      canvas.line([centerX, centerY], [Math.floor(elementX), Math.floor(elementY)], color, 1);
      
      // Draw connecting lines
      if (fold > 0) {
        const prevAngle = rotation + ((fold - 1) * (Math.PI * 2 / folds));
        const prevX = centerX + Math.cos(prevAngle) * radius;
        const prevY = centerY + Math.sin(prevAngle) * radius;
        canvas.line([Math.floor(prevX), Math.floor(prevY)], [Math.floor(elementX), Math.floor(elementY)], color, 1);
      }
    }

    // Connect last to first
    if (folds > 2) {
      const firstAngle = rotation;
      const firstX = centerX + Math.cos(firstAngle) * radius;
      const firstY = centerY + Math.sin(firstAngle) * radius;
      const lastAngle = rotation + ((folds - 1) * (Math.PI * 2 / folds));
      const lastX = centerX + Math.cos(lastAngle) * radius;
      const lastY = centerY + Math.sin(lastAngle) * radius;
      canvas.line([Math.floor(firstX), Math.floor(firstY)], [Math.floor(lastX), Math.floor(lastY)], color, 1);
    }
  }
}

