import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioScope } from '../utils/AudioScope';

/**
 * S - Breathing Circles
 * Calming, meditative breathing visualization
 * 
 * Knob1 - Breathing speed (0 = very slow ~20sec, 1 = moderate ~4sec)
 * Knob2 - Breathing depth/amplitude
 * Knob3 - Number of concentric circles
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * When microphone is active, breathing follows your breath sounds
 */
export class BreathingCircles implements Mode {
  private phase: number = 0.0; // Accumulated phase (0 to 1, wraps around)
  private lastTime: number = 0.0;
  private smoothedAmplitude: number = 0.3;
  private smoothedAudioLevel: number = 0.0;

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.phase = 0.0;
    this.lastTime = eyesy.time;
    this.smoothedAmplitude = 0.3;
    this.smoothedAudioLevel = 0.0;
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);
    const centerX = Math.floor(eyesy.xres / 2);
    const centerY = Math.floor(eyesy.yres / 2);

    // Calculate delta time for smooth phase accumulation
    // Use eyesy.deltaTime which handles reverse playback correctly
    const deltaTime = eyesy.deltaTime;
    this.lastTime = eyesy.time;

    // Calculate audio level (emphasize low frequencies for breathing detection)
    // Use AudioScope for consistent audio handling
    // Focus on low frequencies (first 20% of samples)
    const lowFreqCount = eyesy.audio_in && eyesy.audio_in.length > 0 
      ? Math.max(10, Math.floor(eyesy.audio_in.length * 0.2))
      : 10;
    const audioLevel = AudioScope.getAmplitude(eyesy, 0, lowFreqCount);
    
    // Smooth the audio level to prevent jitter
    this.smoothedAudioLevel = this.smoothedAudioLevel * 0.9 + audioLevel * 0.1;
    
    // Detect if microphone is active (significant audio input)
    const isMicActive = this.smoothedAudioLevel > 0.03;

    // Calculate breathing speed (cycles per second)
    // Knob1: 0 = 0.05 Hz (~20 sec cycle), 1 = 0.25 Hz (~4 sec cycle)
    let breathingSpeed = 0.05 + eyesy.knob1 * 0.20;
    
    // When mic is active, audio can boost speed
    if (isMicActive) {
      breathingSpeed *= (1.0 + this.smoothedAudioLevel * 0.5);
    }

    // Accumulate phase using delta time (prevents stuttering)
    // Phase increases smoothly based on current speed
    this.phase += deltaTime * breathingSpeed;
    // Keep phase in 0-1 range
    while (this.phase >= 1.0) this.phase -= 1.0;
    while (this.phase < 0.0) this.phase += 1.0;

    // Calculate breathing amplitude
    // Knob2: 0 = 0.3 (subtle), 1 = 0.9 (dramatic)
    let targetAmplitude = 0.3 + eyesy.knob2 * 0.6;
    
    // When mic is active, audio can boost amplitude
    if (isMicActive) {
      targetAmplitude = Math.min(1.0, targetAmplitude + this.smoothedAudioLevel * 0.5);
    }
    
    // Smooth amplitude changes
    this.smoothedAmplitude = this.smoothedAmplitude * 0.95 + targetAmplitude * 0.05;

    // Convert phase to smooth sine wave (-1 to 1)
    const breathPhase = Math.sin(this.phase * 2 * Math.PI);
    // Normalized version (0 to 1)
    const normalizedPhase = (breathPhase + 1.0) / 2.0;

    // Number of circles
    const numCircles = Math.floor(3 + eyesy.knob3 * 9);
    const maxRadius = Math.min(eyesy.xres, eyesy.yres) * 0.4;

    // Draw concentric circles with staggered phases
    for (let i = 0; i < numCircles; i++) {
      // Each circle has a slightly different phase offset for wave effect
      const circlePhase = (this.phase + i * 0.08) % 1.0;
      const circleSin = Math.sin(circlePhase * 2 * Math.PI);
      const breathingFactor = 0.5 + 0.5 * circleSin;
      
      // Apply breathing amplitude to radius
      const radiusMultiplier = 1.0 - this.smoothedAmplitude + this.smoothedAmplitude * breathingFactor;
      const baseRadius = maxRadius * (1.0 - (i / numCircles) * 0.7);
      const radius = Math.max(1, Math.floor(baseRadius * radiusMultiplier));

      canvas.circle([centerX, centerY], radius, color, 2);
    }

    // Draw center circle (filled, breathes with main phase)
    const centerRadius = Math.max(1, Math.floor(maxRadius * 0.15 * (1.0 + this.smoothedAmplitude * breathPhase)));
    canvas.circle([centerX, centerY], centerRadius, color, 0);
  }
}

