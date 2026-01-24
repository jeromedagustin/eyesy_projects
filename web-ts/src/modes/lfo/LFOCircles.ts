import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * L - LFO Circles
 * Oscillating circles using Low-Frequency Oscillators
 * 
 * Knob1 - LFO speed/frequency (0 = 0.1 Hz, 1 = 1.5 Hz)
 * Knob2 - LFO amplitude (circle size variation)
 * Knob3 - Number of circles
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class LFOCircles extends BaseAnimatedMode {
  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Base class handles time and audio reactivity initialization
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);
    const centerX = Math.floor(eyesy.xres / 2);
    const centerY = Math.floor(eyesy.yres / 2);

    // Knob1: LFO speed (0 = 0.1 Hz, 1 = 1.5 Hz)
    // Audio can boost speed
    let lfoSpeed = 0.1 + eyesy.knob1 * 1.4;
    lfoSpeed *= (1.0 + audioLevel * 0.5);

    // Knob2: LFO amplitude (0 = no variation, 1 = full variation)
    // Audio can boost amplitude
    let lfoAmplitude = eyesy.knob2;
    lfoAmplitude = Math.min(1.0, lfoAmplitude + audioLevel * 0.3);

    // Knob3: Number of circles (3 to 12)
    const numCircles = Math.floor(3 + eyesy.knob3 * 9);

    // Base radius (30% to 60% of screen height)
    // Audio can affect base size
    let baseRadius = Math.min(eyesy.xres, eyesy.yres) * (0.3 + eyesy.knob2 * 0.3);
    baseRadius *= (1.0 + audioLevel * 0.2);

    // MIDI trigger can add extra circles or pulse
    const triggerBoost = eyesy.trig ? 1.3 : 1.0;

    // Draw multiple concentric circles with LFO animation
    for (let i = 0; i < numCircles; i++) {
      // Each circle has a phase offset for variety
      const phase = (this.time * lfoSpeed) + (i * 0.3);
      
      // LFO oscillation: sin wave from -1 to 1
      const lfo = Math.sin(phase * Math.PI * 2);
      
      // Calculate radius with LFO variation
      const radiusVariation = lfo * lfoAmplitude;
      const radius = baseRadius * (1.0 - (i / numCircles) * 0.7) * (1.0 + radiusVariation * 0.3) * triggerBoost;

      // Draw circle (outline)
      canvas.circle([centerX, centerY], Math.max(1, Math.floor(radius)), color, 2);
    }
  }
}
