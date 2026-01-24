import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * G - Geometric Lattice
 * 3D-like lattice structure
 * 
 * Knob1 - Lattice scale
 * Knob2 - Rotation speed
 * Knob3 - Lattice density
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class GeometricLattice implements Mode {
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

    // Knob1: Lattice scale
    // Audio can affect scale
    let scale = 0.4 + eyesy.knob1 * 0.4;
    scale *= (1.0 + this.smoothedAudioLevel * 0.2);
    let baseSize = Math.min(eyesy.xres, eyesy.yres) * scale;

    // Knob2: Rotation speed
    // Audio can boost rotation
    let rotationSpeed = eyesy.knob2 * 0.3;
    rotationSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.4 : 1.0;
    const rotation = this.time * rotationSpeed * triggerBoost;

    // Knob3: Lattice density (3 to 8)
    // Audio can add more density
    let density = Math.floor(3 + eyesy.knob3 * 5);
    density += Math.floor(this.smoothedAudioLevel * 2);

    // Draw 3D-like lattice
    for (let i = 0; i < density; i++) {
      for (let j = 0; j < density; j++) {
        const x = centerX + (i - (density - 1) / 2) * (baseSize / density);
        const y = centerY + (j - (density - 1) / 2) * (baseSize / density);
        
        // 3D perspective offset
        const zOffset = Math.sin(rotation + (i + j) * 0.3) * (baseSize / density * 0.3);
        const perspectiveX = x + zOffset * 0.5;
        const perspectiveY = y + zOffset * 0.3;
        
        // Draw node (size reacts to audio)
        const nodeSize = 4 * (1.0 + this.smoothedAudioLevel * 0.5);
        canvas.circle([Math.floor(perspectiveX), Math.floor(perspectiveY)], Math.floor(nodeSize), color, 0);
        
        // Connect to neighbors
        if (i < density - 1) {
          const nextX = centerX + ((i + 1) - (density - 1) / 2) * (baseSize / density);
          const nextZOffset = Math.sin(rotation + ((i + 1) + j) * 0.3) * (baseSize / density * 0.3);
          const nextPerspectiveX = nextX + nextZOffset * 0.5;
          const nextPerspectiveY = y + nextZOffset * 0.3;
          canvas.line(
            [Math.floor(perspectiveX), Math.floor(perspectiveY)],
            [Math.floor(nextPerspectiveX), Math.floor(nextPerspectiveY)],
            color,
            1
          );
        }
        if (j < density - 1) {
          const nextY = centerY + ((j + 1) - (density - 1) / 2) * (baseSize / density);
          const nextZOffset = Math.sin(rotation + (i + (j + 1)) * 0.3) * (baseSize / density * 0.3);
          const nextPerspectiveX = x + nextZOffset * 0.5;
          const nextPerspectiveY = nextY + nextZOffset * 0.3;
          canvas.line(
            [Math.floor(perspectiveX), Math.floor(perspectiveY)],
            [Math.floor(nextPerspectiveX), Math.floor(nextPerspectiveY)],
            color,
            1
          );
        }
      }
    }
  }
}

