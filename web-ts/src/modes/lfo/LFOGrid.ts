import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * L - LFO Grid
 * Grid with LFO-driven motion
 * 
 * Knob1 - LFO speed
 * Knob2 - LFO amplitude (movement range)
 * Knob3 - Grid density
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class LFOGrid implements Mode {
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

    // Knob1: LFO speed (0.1 to 1.5 Hz)
    // Audio can boost speed
    let lfoSpeed = 0.1 + eyesy.knob1 * 1.4;
    lfoSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);

    // Knob2: LFO amplitude
    // Audio can boost amplitude
    let lfoAmp = eyesy.knob2 * 20;
    lfoAmp *= (1.0 + this.smoothedAudioLevel * 0.4);

    // Knob3: Grid density (5 to 25 cells)
    // Audio can affect density
    let gridSize = 5 + Math.floor(eyesy.knob3 * 20);
    gridSize += Math.floor(this.smoothedAudioLevel * 5);
    const cellWidth = eyesy.xres / gridSize;
    const cellHeight = eyesy.yres / gridSize;

    // MIDI trigger can add extra motion
    const triggerBoost = eyesy.trig ? 1.3 : 1.0;

    // Draw grid with LFO motion
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const baseX = col * cellWidth;
        const baseY = row * cellHeight;
        
        // LFO offset for this cell
        const phaseX = (this.time * lfoSpeed * triggerBoost) + (col * 0.2);
        const phaseY = (this.time * lfoSpeed * triggerBoost) + (row * 0.2);
        const offsetX = Math.sin(phaseX * Math.PI * 2) * lfoAmp;
        const offsetY = Math.cos(phaseY * Math.PI * 2) * lfoAmp;
        
        const x = baseX + cellWidth / 2 + offsetX;
        const y = baseY + cellHeight / 2 + offsetY;
        
        // Draw circle at grid point (size reacts to audio)
        const circleSize = 3 * (1.0 + this.smoothedAudioLevel * 0.5);
        canvas.circle([Math.floor(x), Math.floor(y)], Math.floor(circleSize), color, 0);
        
        // Draw lines to neighbors
        if (col < gridSize - 1) {
          const nextPhaseX = (this.time * lfoSpeed) + ((col + 1) * 0.2);
          const nextOffsetX = Math.sin(nextPhaseX * Math.PI * 2) * lfoAmp;
          const nextX = (col + 1) * cellWidth + cellWidth / 2 + nextOffsetX;
          const nextY = baseY + cellHeight / 2 + offsetY;
          canvas.line([Math.floor(x), Math.floor(y)], [Math.floor(nextX), Math.floor(nextY)], color, 1);
        }
        if (row < gridSize - 1) {
          const nextPhaseY = (this.time * lfoSpeed) + ((row + 1) * 0.2);
          const nextOffsetY = Math.cos(nextPhaseY * Math.PI * 2) * lfoAmp;
          const nextX = baseX + cellWidth / 2 + offsetX;
          const nextY = (row + 1) * cellHeight + cellHeight / 2 + nextOffsetY;
          canvas.line([Math.floor(x), Math.floor(y)], [Math.floor(nextX), Math.floor(nextY)], color, 1);
        }
      }
    }
  }
}

