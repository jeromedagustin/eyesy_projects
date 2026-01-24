import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * L - LFO Spiral
 * Spiral pattern with LFO animation
 * 
 * Knob1 - LFO speed
 * Knob2 - Spiral tightness
 * Knob3 - Number of spiral arms
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class LFOSpiral implements Mode {
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

    // Knob1: LFO speed (0.1 to 1.5 Hz)
    // Audio can boost speed
    let lfoSpeed = 0.1 + eyesy.knob1 * 1.4;
    lfoSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);

    // Knob2: Spiral tightness
    // Audio can affect tightness
    let tightness = 0.5 + eyesy.knob2 * 2.0;
    tightness *= (1.0 + this.smoothedAudioLevel * 0.2);

    // Knob3: Number of spiral arms (1 to 4)
    // Audio can add more arms
    let numArms = Math.floor(1 + eyesy.knob3 * 3);
    numArms += Math.floor(this.smoothedAudioLevel * 2);

    // Audio can affect max radius
    let maxRadius = Math.min(eyesy.xres, eyesy.yres) * 0.45;
    maxRadius *= (1.0 + this.smoothedAudioLevel * 0.15);

    // MIDI trigger can add extra rotation
    const triggerBoost = eyesy.trig ? 1.3 : 1.0;

    // Draw spiral arms
    for (let arm = 0; arm < numArms; arm++) {
      const armPhase = (arm * (Math.PI * 2 / numArms)) + (this.time * lfoSpeed * triggerBoost);
      
      const points: [number, number][] = [];
      const segments = 100;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = armPhase + (t * Math.PI * tightness);
        const radius = maxRadius * t;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        points.push([Math.floor(x), Math.floor(y)]);
      }
      
      // Draw spiral line
      for (let i = 0; i < points.length - 1; i++) {
        canvas.line(points[i], points[i + 1], color, 2);
      }
    }
  }
}
