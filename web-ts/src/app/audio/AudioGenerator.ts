/**
 * Audio generation utilities for mock audio
 */
export class AudioGenerator {
  private mockAudioTime = 0.0;
  private mockAudioEnabled = false;
  private useMicrophone = false;
  private mockAudioFrequency = 0.5;
  private mockAudioIntensityRandomness = 0.0;

  constructor() {}

  setMockAudioEnabled(enabled: boolean): void {
    this.mockAudioEnabled = enabled;
  }

  setUseMicrophone(useMic: boolean): void {
    this.useMicrophone = useMic;
  }

  setMockAudioFrequency(frequency: number): void {
    this.mockAudioFrequency = frequency;
  }

  setMockAudioIntensityRandomness(randomness: number): void {
    this.mockAudioIntensityRandomness = randomness;
  }

  updateTime(deltaSeconds: number): void {
    if (this.mockAudioEnabled && !this.useMicrophone) {
      this.mockAudioTime += deltaSeconds;
    }
  }

  generateAudioData(): Float32Array {
    const data = new Float32Array(200);
    
    if (this.mockAudioEnabled && !this.useMicrophone) {
      // Generate mock audio with varying pattern complexity
      // Pattern complexity: 0.0 = simple 4/4 beat, 1.0 = random
      const complexity = this.mockAudioFrequency;
      
      // Base intensity (increased to ensure values are above noise threshold)
      // Noise threshold is 0.03, so we need values well above that
      const baseIntensity = 1.0;
      
      // Determine pattern type based on complexity
      let beatPattern: number;
      let freqVariation: number;
      let rhythmVariation: number;
      
      if (complexity < 0.3) {
        // Simple 4/4 beat pattern
        const beatTime = this.mockAudioTime * 2.0; // 2 beats per second (120 BPM)
        const beatPhase = (beatTime % 1.0) * 4.0; // 4 beats per measure
        // Strong beat on 1, weaker on 2, 3, 4
        if (beatPhase < 1.0) {
          beatPattern = 1.0; // Strong downbeat
        } else if (beatPhase < 2.0) {
          beatPattern = 0.3; // Weak beat
        } else if (beatPhase < 3.0) {
          beatPattern = 0.6; // Medium beat
        } else {
          beatPattern = 0.3; // Weak beat
        }
        freqVariation = 0.1; // Minimal frequency variation
        rhythmVariation = 0.0; // No rhythm variation
      } else if (complexity < 0.7) {
        // More complex patterns (polyrhythms, syncopation)
        const blend = (complexity - 0.3) / 0.4; // 0 to 1 within this range
        
        // Mix of 4/4 and 3/4 time
        const beatTime4 = this.mockAudioTime * 2.0;
        const beatTime3 = this.mockAudioTime * 1.5;
        const pattern4 = Math.sin(beatTime4 * Math.PI * 2) * 0.5 + 0.5;
        const pattern3 = Math.sin(beatTime3 * Math.PI * 2) * 0.5 + 0.5;
        beatPattern = pattern4 * (1.0 - blend * 0.5) + pattern3 * (blend * 0.5);
        
        // Add syncopation
        const syncopation = Math.sin(this.mockAudioTime * 3.0) * 0.3 * blend;
        beatPattern = Math.max(0.2, Math.min(1.0, beatPattern + syncopation));
        
        freqVariation = 0.1 + blend * 0.3; // Moderate frequency variation
        rhythmVariation = blend * 0.4; // Some rhythm variation
      } else {
        // Random patterns
        const randomness = (complexity - 0.7) / 0.3; // 0 to 1 within this range
        
        // Random beat pattern with some structure
        const structured = Math.sin(this.mockAudioTime * 2.0) * 0.5 + 0.5;
        const random = Math.random();
        beatPattern = structured * (1.0 - randomness) + random * randomness;
        beatPattern = Math.max(0.2, Math.min(1.0, beatPattern));
        
        freqVariation = 0.4 + randomness * 0.3; // High frequency variation
        rhythmVariation = 0.4 + randomness * 0.4; // High rhythm variation
      }
      
      // Frequency components with variation
      const baseFreq1 = 60 + freqVariation * 40; // 60-100 Hz (bass)
      const baseFreq2 = 200 + freqVariation * 100; // 200-300 Hz (mid)
      const baseFreq3 = 800 + freqVariation * 400; // 800-1200 Hz (treble)
      
      // Apply rhythm variation to frequencies
      const freq1 = baseFreq1 + Math.sin(this.mockAudioTime * (1.0 + rhythmVariation * 2.0)) * 20;
      const freq2 = baseFreq2 + Math.sin(this.mockAudioTime * (1.5 + rhythmVariation * 3.0)) * 50;
      const freq3 = baseFreq3 + Math.sin(this.mockAudioTime * (2.0 + rhythmVariation * 4.0)) * 200;
      
      // Amplitude modulation
      const ampMod = 0.7 + Math.sin(this.mockAudioTime * 0.5) * 0.3;
      
      // Intensity randomness: adds variation to the base intensity
      // 0.0 = consistent intensity, 1.0 = highly random intensity
      const intensityRandomness = this.mockAudioIntensityRandomness;
      
      for (let i = 0; i < data.length; i++) {
        // Time offset for each sample (simulates audio buffer)
        const t = this.mockAudioTime + (i / data.length) * 0.01;
        
        // Apply intensity randomness: vary the intensity per sample
        // Use per-sample random variation when intensityRandomness > 0
        const randomIntensityVariation = intensityRandomness > 0 
          ? 1.0 + (Math.random() - 0.5) * intensityRandomness * 0.8 // ±40% variation at max
          : 1.0;
        const effectiveIntensity = baseIntensity * randomIntensityVariation;
        
        // Combine multiple frequencies with harmonics, modulated by beat pattern
        // Scale beatPattern to ensure minimum amplitude (map 0.2-1.0 to 0.3-1.0)
        const scaledBeatPattern = 0.3 + (beatPattern - 0.2) * (1.0 - 0.3) / (1.0 - 0.2);
        const effectiveBeatPattern = Math.max(0.3, Math.min(1.0, scaledBeatPattern));
        
        const sample = 
          Math.sin(t * freq1 * Math.PI * 2) * 0.4 * effectiveIntensity * effectiveBeatPattern +
          Math.sin(t * freq2 * Math.PI * 2) * 0.3 * effectiveIntensity * effectiveBeatPattern +
          Math.sin(t * freq3 * Math.PI * 2) * 0.2 * effectiveIntensity * effectiveBeatPattern +
          Math.sin(t * freq1 * Math.PI * 4) * 0.05 * effectiveIntensity * effectiveBeatPattern + // Harmonic
          Math.sin(t * freq2 * Math.PI * 3) * 0.05 * effectiveIntensity * effectiveBeatPattern; // Harmonic
        
        // Add noise based on complexity (more random = more noise)
        const noiseAmount = complexity * 0.1;
        const noise = (Math.random() - 0.5) * noiseAmount;
        
        // Combine sample with amplitude modulation and noise
        // Ensure ampMod doesn't go too low (minimum 0.6 instead of 0.4)
        const effectiveAmpMod = Math.max(0.6, ampMod);
        let finalSample = sample * effectiveAmpMod + noise;
        
        // Ensure minimum amplitude to avoid noise threshold filtering (0.03)
        // Target: at least 0.15 amplitude (well above 0.03 threshold)
        const targetMinAmp = 0.15;
        const currentAmp = Math.abs(finalSample);
        if (currentAmp < targetMinAmp) {
          // Scale up to ensure meaningful signal
          // Preserve the sign and scale to target minimum
          finalSample = Math.sign(finalSample) * targetMinAmp;
        }
        
        // Clamp to valid range
        data[i] = Math.max(-1.0, Math.min(1.0, finalSample));
      }
    } else {
      // Simple fallback when mock audio is disabled
      const time = Date.now() * 0.001;
      for (let i = 0; i < data.length; i++) {
        const t = time + (i / data.length) * 0.01;
        data[i] = Math.sin(t * 220) * 0.5 + Math.sin(t * 440) * 0.25;
      }
    }
    
    return data;
  }
}
