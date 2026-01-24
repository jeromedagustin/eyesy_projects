import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * G - Geometric Spiral
 * Spiral patterns based on golden ratio/Fibonacci
 * 
 * Knob1 - Spiral scale
 * Knob2 - Rotation speed
 * Knob3 - Spiral tightness
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class GeometricSpiral implements Mode {
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

    // Knob1: Spiral scale
    // Audio can affect scale
    let scale = 0.3 + eyesy.knob1 * 0.5;
    scale *= (1.0 + this.smoothedAudioLevel * 0.2);
    let maxRadius = Math.min(eyesy.xres, eyesy.yres) * scale * 0.4;

    // Knob2: Rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 0.5;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.4 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Spiral tightness (golden ratio to tighter)
    // Audio can affect tightness
    const goldenRatio = 1.618;
    let tightness = goldenRatio + eyesy.knob3 * 1.0;
    tightness *= (1.0 + this.smoothedAudioLevel * 0.1);

    // Draw spiral
    const points: [number, number][] = [];
    const segments = 200;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = rotation + (t * Math.PI * tightness);
      const radius = maxRadius * t;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push([Math.floor(x), Math.floor(y)]);
    }
    
    // Draw spiral line
    for (let i = 0; i < points.length - 1; i++) {
      canvas.line(points[i], points[i + 1], color, 2);
    }

    // Draw points along spiral
    for (let i = 0; i < points.length; i += 10) {
      canvas.circle(points[i], 3, color, 0);
    }
  }
}

