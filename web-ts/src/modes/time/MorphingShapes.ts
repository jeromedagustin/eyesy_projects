import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * T - Morphing Shapes
 * Shapes that morph between different forms
 * 
 * Knob1 - Morph speed
 * Knob2 - Morph amount
 * Knob3 - Number of shapes
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class MorphingShapes implements Mode {
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

    // Knob1: Morph speed
    // Audio can boost speed
    let morphSpeed = 0.2 + eyesy.knob1 * 1.5;
    morphSpeed *= (1.0 + this.smoothedAudioLevel * 0.6);

    // Knob2: Morph amount (0 = circle, 1 = star)
    // Audio can affect morph amount
    let morphAmount = eyesy.knob2;
    morphAmount += this.smoothedAudioLevel * 0.2;
    morphAmount = Math.max(0, Math.min(1, morphAmount));

    // Knob3: Number of shapes (3 to 8)
    // Audio can add more shapes
    let numShapes = Math.floor(3 + eyesy.knob3 * 5);
    numShapes += Math.floor(this.smoothedAudioLevel * 2);

    // Audio can affect base size
    let maxRadius = Math.min(eyesy.xres, eyesy.yres) * 0.4;
    maxRadius *= (1.0 + this.smoothedAudioLevel * 0.2);

    // MIDI trigger can add extra morph boost
    const triggerBoost = eyesy.trig ? 1.4 : 1.0;
    const morphPhase = ((this.time * morphSpeed * triggerBoost) % 1.0);

    // Draw morphing shapes
    for (let shape = 0; shape < numShapes; shape++) {
      const shapeAngle = (shape * (Math.PI * 2 / numShapes)) + morphPhase * Math.PI * 2;
      const shapeRadius = maxRadius * (1.0 - (shape / numShapes) * 0.5);
      const shapeX = centerX + Math.cos(shapeAngle) * (maxRadius * 0.3);
      const shapeY = centerY + Math.sin(shapeAngle) * (maxRadius * 0.3);

      // Morph between circle (sides=20) and star (sides=5)
      const baseSides = 5;
      const targetSides = 20;
      const sides = Math.floor(baseSides + (targetSides - baseSides) * (1.0 - morphAmount));

      const points: [number, number][] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * (Math.PI * 2 / sides)) + morphPhase * Math.PI * 2;
        // Interpolate between star (pointy) and circle (round)
        const radius = shapeRadius * (1.0 - morphAmount * 0.3 * Math.sin(angle * (sides / 2)));
        const x = shapeX + Math.cos(angle) * radius;
        const y = shapeY + Math.sin(angle) * radius;
        points.push([Math.floor(x), Math.floor(y)]);
      }
      
      canvas.polygon(points, color, 2);
    }
  }
}

