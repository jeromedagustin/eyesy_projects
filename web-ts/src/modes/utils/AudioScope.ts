/**
 * Audio Scope Utility
 * Provides consistent audio input handling for scope modes
 * 
 * This ensures all scope modes:
 * - Use consistent normalization
 * - Map audio samples correctly to visual positions
 * - Handle microphone state properly
 * - Provide consistent scaling factors
 * - Filter out background noise with a threshold
 */
import { EYESY } from '../../../core/EYESY';

export class AudioScope {
  // Threshold for filtering out background noise (normalized, 0.0 to 1.0)
  // Values below this threshold will be treated as zero
  // Default: 0.03 (3% of full scale) - filters out quiet background noise
  private static readonly NOISE_THRESHOLD = 0.03;
  
  /**
   * Get a normalized audio sample value for a given index
   * Handles bounds checking and microphone state
   * Applies noise threshold to filter out background noise
   * 
   * @param eyesy The EYESY instance
   * @param index The sample index (will be wrapped/clamped as needed)
   * @param normalizeDivisor Optional custom divisor (default: 32768.0 for full range -1.0 to 1.0)
   * @returns Normalized audio value (-1.0 to 1.0 by default), or 0 if below threshold
   */
  static getSample(eyesy: EYESY, index: number, normalizeDivisor: number = 32768.0): number {
    // If microphone is not enabled, return 0
    if (!eyesy.mic_enabled || !eyesy.audio_in || eyesy.audio_in.length === 0) {
      return 0.0;
    }
    
    // Wrap index to valid range (like Python's negative indexing)
    const audioLen = eyesy.audio_in.length;
    const wrappedIndex = ((index % audioLen) + audioLen) % audioLen;
    
    // Get and normalize the sample
    const sample = eyesy.audio_in[wrappedIndex] || 0;
    const normalized = sample / normalizeDivisor;
    
    // Apply noise threshold - filter out very quiet sounds
    if (Math.abs(normalized) < AudioScope.NOISE_THRESHOLD) {
      return 0.0;
    }
    
    return normalized;
  }
  
  /**
   * Get a normalized audio sample with bounds checking (clamps instead of wrapping)
   * Applies noise threshold to filter out background noise
   * 
   * @param eyesy The EYESY instance
   * @param index The sample index (will be clamped to valid range)
   * @param normalizeDivisor Optional custom divisor (default: 32768.0)
   * @returns Normalized audio value (-1.0 to 1.0 by default), or 0 if below threshold
   */
  static getSampleClamped(eyesy: EYESY, index: number, normalizeDivisor: number = 32768.0): number {
    // If microphone is not enabled, return 0
    if (!eyesy.mic_enabled || !eyesy.audio_in || eyesy.audio_in.length === 0) {
      return 0.0;
    }
    
    // Clamp index to valid range
    const audioLen = eyesy.audio_in.length;
    const clampedIndex = Math.max(0, Math.min(index, audioLen - 1));
    
    // Get and normalize the sample
    const sample = eyesy.audio_in[clampedIndex] || 0;
    const normalized = sample / normalizeDivisor;
    
    // Apply noise threshold - filter out very quiet sounds
    if (Math.abs(normalized) < AudioScope.NOISE_THRESHOLD) {
      return 0.0;
    }
    
    return normalized;
  }
  
  /**
   * Get audio amplitude (average of absolute values) for a range of samples
   * Useful for overall reactivity
   * Applies noise threshold to filter out background noise
   * 
   * @param eyesy The EYESY instance
   * @param startIndex Starting sample index (default: 0)
   * @param count Number of samples to average (default: all samples)
   * @returns Average amplitude (0.0 to 1.0), or 0 if below threshold
   */
  static getAmplitude(eyesy: EYESY, startIndex: number = 0, count?: number): number {
    if (!eyesy.mic_enabled || !eyesy.audio_in || eyesy.audio_in.length === 0) {
      return 0.0;
    }
    
    const audioLen = eyesy.audio_in.length;
    const endIndex = count !== undefined ? Math.min(startIndex + count, audioLen) : audioLen;
    const actualStart = Math.max(0, startIndex);
    const actualEnd = Math.min(endIndex, audioLen);
    
    if (actualEnd <= actualStart) {
      return 0.0;
    }
    
    let total = 0.0;
    for (let i = actualStart; i < actualEnd; i++) {
      total += Math.abs(eyesy.audio_in[i] || 0);
    }
    
    const amplitude = (total / (actualEnd - actualStart)) / 32768.0;
    
    // Apply noise threshold - filter out very quiet sounds
    if (amplitude < AudioScope.NOISE_THRESHOLD) {
      return 0.0;
    }
    
    return amplitude;
  }
  
  /**
   * Get peak audio value (maximum absolute value) for a range of samples
   * 
   * @param eyesy The EYESY instance
   * @param startIndex Starting sample index (default: 0)
   * @param count Number of samples to check (default: all samples)
   * @returns Peak amplitude (0.0 to 1.0)
   */
  static getPeak(eyesy: EYESY, startIndex: number = 0, count?: number): number {
    if (!eyesy.mic_enabled || !eyesy.audio_in || eyesy.audio_in.length === 0) {
      return 0.0;
    }
    
    const audioLen = eyesy.audio_in.length;
    const endIndex = count !== undefined ? Math.min(startIndex + count, audioLen) : audioLen;
    const actualStart = Math.max(0, startIndex);
    const actualEnd = Math.min(endIndex, audioLen);
    
    if (actualEnd <= actualStart) {
      return 0.0;
    }
    
    let peak = 0.0;
    for (let i = actualStart; i < actualEnd; i++) {
      const absVal = Math.abs(eyesy.audio_in[i] || 0);
      if (absVal > peak) {
        peak = absVal;
      }
    }
    
    return peak / 32768.0;
  }
  
  /**
   * Map audio sample to a visual position
   * Common pattern: map audio value to screen coordinate
   * 
   * @param audioValue Normalized audio value (-1.0 to 1.0)
   * @param screenSize Screen dimension (xres or yres)
   * @param centerOffset Offset from center (default: 0.5 = center)
   * @param scale Multiplier for reactivity (default: 0.5 = 50% of screen)
   * @returns Screen coordinate
   */
  static mapToScreen(
    audioValue: number,
    screenSize: number,
    centerOffset: number = 0.5,
    scale: number = 0.5
  ): number {
    const center = screenSize * centerOffset;
    return center + (audioValue * screenSize * scale);
  }
  
  /**
   * Get all normalized audio samples as an array
   * Useful for modes that need the full audio buffer
   * 
   * @param eyesy The EYESY instance
   * @param normalizeDivisor Optional custom divisor (default: 32768.0)
   * @returns Array of normalized audio values
   */
  static getAllSamples(eyesy: EYESY, normalizeDivisor: number = 32768.0): number[] {
    if (!eyesy.mic_enabled || !eyesy.audio_in || eyesy.audio_in.length === 0) {
      return [];
    }
    
    const samples: number[] = [];
    for (let i = 0; i < eyesy.audio_in.length; i++) {
      samples.push((eyesy.audio_in[i] || 0) / normalizeDivisor);
    }
    return samples;
  }
}

