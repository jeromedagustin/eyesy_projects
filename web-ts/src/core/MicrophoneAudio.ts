/**
 * Microphone Audio Input Handler
 * Uses Web Audio API to capture and process microphone input
 */
export class MicrophoneAudio {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isActive = false;
  private dataArray: Float32Array;
  private tempArray: Float32Array;
  private bufferLength: number;
  private gainNode: GainNode | null = null;
  private audioGain = 5.0; // Amplify microphone input for better sensitivity (increased default)

  constructor(bufferSize: number = 200) {
    this.bufferLength = bufferSize;
    this.dataArray = new Float32Array(bufferSize);
    // Temporary array for analyser (needs to match fftSize)
    // fftSize will be set to 2048 for better waveform detail
    this.tempArray = new Float32Array(2048);
  }

  /**
   * Find the nearest power of 2 that is >= n
   */
  private nextPowerOf2(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  /**
   * Request microphone access and start capturing audio
   */
  async start(): Promise<void> {
    if (this.isActive) {
      return; // Already started
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (some browsers suspend until user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Create gain node to amplify microphone input
      // Use a base gain in Web Audio API, then apply additional gain in conversion
      this.gainNode = this.audioContext.createGain();
      // Use a moderate base gain (2.0) to avoid clipping in Web Audio
      // Additional gain will be applied in the conversion step
      this.gainNode.gain.value = Math.min(2.0, this.audioGain);

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      // Use larger fftSize to get more samples for better waveform detail
      // 2048 gives us 1024 samples (half of fftSize), which we can downsample to 200
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.0; // No smoothing for crisp waveform
      // Update temp array size to match fftSize
      this.tempArray = new Float32Array(this.analyser.fftSize);

      // Create microphone source and connect through gain to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.gainNode);
      this.gainNode.connect(this.analyser);

      this.isActive = true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Stop capturing audio and release resources
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Disconnect nodes
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.isActive = false;
  }

  /**
   * Get current audio data (time domain)
   * Returns Float32Array of audio samples normalized to -1.0 to 1.0
   */
  getAudioData(): Float32Array {
    if (!this.isActive || !this.analyser) {
      // Return silence if not active
      return new Float32Array(this.bufferLength);
    }

    // Get time domain data (buffer must match fftSize)
    // This gives us the raw waveform - getFloatTimeDomainData returns the most recent samples
    this.analyser.getFloatTimeDomainData(this.tempArray as any);
    
    // fftSize gives us fftSize samples, but we only need bufferLength (200)
    // Take evenly spaced samples from the buffer to preserve waveform shape
    // Use the full buffer to get better frequency representation
    const sourceLength = this.tempArray.length; // Should be 2048 (fftSize)
    const targetLength = this.bufferLength; // 200
    
    // Sample evenly across the buffer to preserve waveform characteristics
    const step = sourceLength / targetLength;
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = i * step;
      const index1 = Math.floor(sourceIndex);
      const index2 = Math.min(index1 + 1, sourceLength - 1);
      const fraction = sourceIndex - index1;
      
      // Linear interpolation for smooth downsampling
      this.dataArray[i] = this.tempArray[index1] * (1 - fraction) + 
                         this.tempArray[index2] * fraction;
    }
    
    return this.dataArray;
  }

  /**
   * Check if microphone is currently active
   */
  get active(): boolean {
    return this.isActive;
  }

  /**
   * Set microphone gain (0.0 to 10.0)
   * Higher values amplify the input more
   */
  setGain(gain: number): void {
    this.audioGain = Math.max(0.0, Math.min(10.0, gain));
    if (this.gainNode) {
      // Apply moderate gain in Web Audio API to avoid clipping
      // The rest of the gain will be applied in conversion step
      this.gainNode.gain.value = Math.min(2.0, this.audioGain);
    }
  }

  /**
   * Get current microphone gain
   */
  getGain(): number {
    return this.audioGain;
  }

  /**
   * Get audio level (0.0 to 1.0) for visualization
   * This shows the RMS (root mean square) level for a more accurate representation
   * of the actual audio volume being detected
   */
  getAudioLevel(): number {
    if (!this.isActive || !this.analyser) {
      return 0;
    }

    // Get fresh audio data directly from analyser for level calculation
    this.analyser.getFloatTimeDomainData(this.tempArray as any);
    
    // Calculate RMS (Root Mean Square) for more accurate level representation
    let sumSquares = 0;
    for (let i = 0; i < this.tempArray.length; i++) {
      sumSquares += this.tempArray[i] * this.tempArray[i];
    }
    const rms = Math.sqrt(sumSquares / this.tempArray.length);
    
    // Apply gain to show what the actual output level will be
    // Scale by gain and normalize to 0-1 range
    const level = Math.min(1.0, rms * this.audioGain * 2.0); // Scale factor for better visibility
    
    return level;
  }
}

