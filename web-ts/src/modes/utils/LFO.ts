/**
 * LFO (Low-Frequency Oscillator) Utility
 * Provides shared LFO implementation for modes that need oscillating values
 * 
 * This eliminates code duplication across modes that use LFOs
 */
export class LFO {
  public start: number;
  public max: number;
  public step: number;
  private current: number;
  private direction: number;

  /**
   * Create a new LFO
   * @param start Minimum value
   * @param max Maximum value
   * @param step Step size (speed of oscillation)
   */
  constructor(start: number, max: number, step: number) {
    this.start = start;
    this.max = max;
    this.step = step;
    this.current = start; // Initialize to start value
    this.direction = 1;
  }

  /**
   * Update the LFO and return current value
   * Call this each frame with deltaTime for frame-rate independent animation
   * 
   * @param deltaTime Time since last frame in seconds
   * @returns Current LFO value (between start and max)
   */
  update(deltaTime: number): number {
    // Check bounds first, then update (matching Python behavior)
    if (this.current >= this.max) {
      this.direction = -1;
      this.current = this.max;
    }
    if (this.current <= this.start) {
      this.direction = 1;
      this.current = this.start;
    }
    // Update with deltaTime for frame-rate independence
    this.current += this.step * this.direction * deltaTime;
    return this.current;
  }
  
  /**
   * Get current value without updating
   */
  getValue(): number {
    return this.current;
  }
  
  /**
   * Reset LFO to start value
   */
  reset(): void {
    this.current = this.start;
    this.direction = 1;
  }
}


