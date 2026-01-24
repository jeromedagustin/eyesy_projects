/**
 * Audio Reactivity Utility
 * Provides shared audio level calculation and smoothing for modes
 * 
 * This eliminates code duplication across 23+ modes that all use
 * the same audio reactivity logic.
 */
import { EYESY } from '../../../core/EYESY';

export class AudioReactivity {
  private smoothedAudioLevel: number = 0.0;
  
  /**
   * Reset the smoothed audio level (call in setup)
   */
  reset(): void {
    this.smoothedAudioLevel = 0.0;
  }
  
  /**
   * Update audio reactivity based on current audio input
   * Call this each frame in the mode's draw() method
   * 
   * @param eyesy The EYESY instance with audio input
   * @returns The current smoothed audio level (0.0 to 1.0)
   */
  update(eyesy: EYESY): number {
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
    const audioThreshold = 0.03; // Threshold to filter out background noise (3% of full scale)
    if (!eyesy.mic_enabled || audioLevel < audioThreshold) {
      // Very fast decay when no audio or mic disabled (decay 50% per frame)
      this.smoothedAudioLevel = this.smoothedAudioLevel * 0.5;
    } else {
      // More responsive smoothing when audio is present (less smoothing = more reactive)
      this.smoothedAudioLevel = this.smoothedAudioLevel * 0.85 + audioLevel * 0.15;
    }
    
    return this.smoothedAudioLevel;
  }
  
  /**
   * Get the current smoothed audio level without updating
   */
  getLevel(): number {
    return this.smoothedAudioLevel;
  }
}

