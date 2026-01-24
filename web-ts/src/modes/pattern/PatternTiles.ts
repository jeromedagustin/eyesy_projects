import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * PT - Pattern Tiles
 * Repeating tiling patterns
 * 
 * Knob1 - Pattern scale
 * Knob2 - Pattern rotation
 * Knob3 - Pattern density/complexity
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class PatternTiles implements Mode {
  private time: number = 0.0;
  private smoothedAudioLevel: number = 0.0;

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

    // Knob1: Pattern scale (30 to 120 pixels)
    // Audio can affect scale
    let patternSize = 30 + eyesy.knob1 * 90;
    patternSize *= (1.0 + this.smoothedAudioLevel * 0.15);

    // Knob2: Pattern rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 1.0;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.4);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Pattern density (2 to 8 elements per pattern)
    const density = Math.floor(2 + eyesy.knob3 * 6);

    // Calculate grid
    const cols = Math.ceil(eyesy.xres / patternSize) + 1;
    const rows = Math.ceil(eyesy.yres / patternSize) + 1;

    // Draw repeating pattern
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const baseX = col * patternSize;
        const baseY = row * patternSize;
        const centerX = baseX + patternSize / 2;
        const centerY = baseY + patternSize / 2;

        // Draw pattern elements
        for (let i = 0; i < density; i++) {
          const angle = rotation + (i * (Math.PI * 2 / density));
          const radius = patternSize * 0.15 * (1.0 + i * 0.1);
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          // Draw small circle (size reacts to audio)
          const circleSize = patternSize * 0.08 * (1.0 + this.smoothedAudioLevel * 0.3);
          canvas.circle([Math.floor(x), Math.floor(y)], Math.floor(circleSize), color, 0);

          // Draw connecting lines
          if (i > 0) {
            const prevAngle = rotation + ((i - 1) * (Math.PI * 2 / density));
            const prevRadius = patternSize * 0.15 * (1.0 + (i - 1) * 0.1);
            const prevX = centerX + Math.cos(prevAngle) * prevRadius;
            const prevY = centerY + Math.sin(prevAngle) * prevRadius;
            canvas.line([Math.floor(prevX), Math.floor(prevY)], [Math.floor(x), Math.floor(y)], color, 1);
          }
        }

        // Connect last to first
        if (density > 2) {
          const firstAngle = rotation;
          const firstRadius = patternSize * 0.15 * 1.0;
          const firstX = centerX + Math.cos(firstAngle) * firstRadius;
          const firstY = centerY + Math.sin(firstAngle) * firstRadius;
          
          const lastAngle = rotation + ((density - 1) * (Math.PI * 2 / density));
          const lastRadius = patternSize * 0.15 * (1.0 + (density - 1) * 0.1);
          const lastX = centerX + Math.cos(lastAngle) * lastRadius;
          const lastY = centerY + Math.sin(lastAngle) * lastRadius;
          
          canvas.line([Math.floor(firstX), Math.floor(firstY)], [Math.floor(lastX), Math.floor(lastY)], color, 1);
        }
      }
    }
  }
}

