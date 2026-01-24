import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * PT - Pattern Weave
 * Woven/interlaced pattern
 * 
 * Knob1 - Pattern scale
 * Knob2 - Animation speed
 * Knob3 - Weave complexity
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class PatternWeave implements Mode {
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

    // Knob1: Pattern scale
    // Audio can affect scale
    let patternSize = 40 + eyesy.knob1 * 80;
    patternSize *= (1.0 + this.smoothedAudioLevel * 0.15);

    // Knob2: Animation speed
    // Audio can boost speed
    let animSpeed = eyesy.knob2 * 0.5;
    animSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra speed boost
    const triggerBoost = eyesy.trig ? 1.5 : 1.0;
    const offset = this.time * animSpeed * triggerBoost;

    // Knob3: Weave complexity (2 to 6)
    // Audio can add more complexity
    let complexity = Math.floor(2 + eyesy.knob3 * 4);
    complexity += Math.floor(this.smoothedAudioLevel * 2);

    // Draw woven pattern
    const cols = Math.ceil(eyesy.xres / patternSize) + 1;
    const rows = Math.ceil(eyesy.yres / patternSize) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * patternSize;
        const y = row * patternSize;
        
        // Alternate weave direction
        const isOver = ((row + col) % 2) === 0;
        const weaveOffset = isOver ? offset : -offset;
        
        // Draw horizontal and vertical lines with weave
        for (let i = 0; i < complexity; i++) {
          const lineOffset = (i / complexity) * patternSize;
          
          // Horizontal line
          const hx1 = x + weaveOffset;
          const hx2 = x + patternSize + weaveOffset;
          const hy = y + lineOffset;
          if (hx1 >= 0 && hx1 < eyesy.xres && hy >= 0 && hy < eyesy.yres) {
            canvas.line([Math.floor(hx1), Math.floor(hy)], [Math.floor(Math.min(hx2, eyesy.xres)), Math.floor(hy)], color, 1);
          }
          
          // Vertical line
          const vx = x + lineOffset;
          const vy1 = y + weaveOffset;
          const vy2 = y + patternSize + weaveOffset;
          if (vx >= 0 && vx < eyesy.xres && vy1 >= 0 && vy1 < eyesy.yres) {
            canvas.line([Math.floor(vx), Math.floor(vy1)], [Math.floor(vx), Math.floor(Math.min(vy2, eyesy.yres))], color, 1);
          }
        }
      }
    }
  }
}

