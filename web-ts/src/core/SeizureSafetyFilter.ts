/**
 * Seizure Safety Filter - Implements WCAG 2.3.1 guidelines for photosensitive epilepsy
 * Limits flashing, prevents red flashes, caps animation speed, and reduces visual intensity
 */
export class SeizureSafetyFilter {
  private enabled: boolean = false;
  
  // Flash detection (WCAG: max 3 flashes per second)
  private flashHistory: number[] = []; // Timestamps of detected flashes
  private readonly MAX_FLASHES_PER_SECOND = 3;
  private readonly FLASH_WINDOW_MS = 1000; // 1 second window
  
  // Red flash detection
  private lastFrameRedIntensity: number = 0;
  private readonly RED_FLASH_THRESHOLD = 0.3; // 30% red intensity change triggers filter
  private readonly MAX_RED_INTENSITY = 0.7; // Cap red at 70% intensity when safe mode enabled
  
  // Speed limiting
  private readonly MAX_SPEED_MULTIPLIER = 0.5; // Cap animation speed at 50% of normal
  
  // Brightness/contrast reduction
  private readonly BRIGHTNESS_REDUCTION = 0.15; // Reduce brightness by 15%
  private readonly CONTRAST_REDUCTION = 0.2; // Reduce contrast by 20%
  
  /**
   * Enable or disable seizure-safe mode
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      // Reset flash history when enabling
      this.flashHistory = [];
      this.lastFrameRedIntensity = 0;
    }
  }
  
  /**
   * Check if seizure-safe mode is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Check system prefers-reduced-motion preference
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Should actually apply filters (enabled OR system preference)
   */
  shouldApplyFilters(): boolean {
    return this.enabled || SeizureSafetyFilter.prefersReducedMotion();
  }
  
  /**
   * Limit animation speed multiplier
   * @param speedMultiplier Original speed (0.0 to 1.0+)
   * @returns Capped speed multiplier
   */
  limitSpeed(speedMultiplier: number): number {
    if (!this.shouldApplyFilters()) {
      return speedMultiplier;
    }
    return Math.min(speedMultiplier, this.MAX_SPEED_MULTIPLIER);
  }
  
  /**
   * Filter color to reduce red intensity and prevent red flashes
   * @param color RGB color [r, g, b] (0-255)
   * @param previousColor Previous frame color for flash detection
   * @returns Filtered RGB color
   */
  filterColor(color: [number, number, number], previousColor?: [number, number, number]): [number, number, number] {
    if (!this.shouldApplyFilters()) {
      return color;
    }
    
    let [r, g, b] = color;
    
    // Reduce red intensity to prevent red flashes
    const redIntensity = r / 255;
    if (redIntensity > this.MAX_RED_INTENSITY) {
      // Cap red at max intensity
      r = Math.floor(this.MAX_RED_INTENSITY * 255);
    }
    
    // Detect red flash (rapid increase in red intensity)
    if (previousColor) {
      const prevRedIntensity = previousColor[0] / 255;
      const redChange = Math.abs(redIntensity - prevRedIntensity);
      
      if (redChange > this.RED_FLASH_THRESHOLD && redIntensity > 0.5) {
        // Significant red flash detected - desaturate red
        const desaturation = 0.5; // Reduce red by 50%
        r = Math.floor(r * (1 - desaturation) + (r + g + b) / 3 * desaturation);
      }
    }
    
    // Reduce overall brightness and contrast slightly
    const brightnessFactor = 1 - this.BRIGHTNESS_REDUCTION;
    const contrastFactor = 1 - this.CONTRAST_REDUCTION;
    
    // Apply brightness reduction
    r = Math.floor((r * brightnessFactor));
    g = Math.floor((g * brightnessFactor));
    b = Math.floor((b * brightnessFactor));
    
    // Apply contrast reduction (move towards middle gray)
    const gray = 128; // Middle gray
    r = Math.floor(r * contrastFactor + gray * (1 - contrastFactor));
    g = Math.floor(g * contrastFactor + gray * (1 - contrastFactor));
    b = Math.floor(b * contrastFactor + gray * (1 - contrastFactor));
    
    // Clamp values
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return [r, g, b];
  }
  
  /**
   * Detect and throttle rapid flashing
   * @param currentTime Current timestamp in milliseconds
   * @param brightnessChange Change in brightness from previous frame (0-1)
   * @returns true if flash should be allowed, false if it should be throttled
   */
  checkFlashRate(currentTime: number, brightnessChange: number): boolean {
    if (!this.shouldApplyFilters()) {
      return true; // Allow all flashes when disabled
    }
    
    // Consider significant brightness changes as flashes (>20% change)
    const FLASH_THRESHOLD = 0.2;
    if (brightnessChange < FLASH_THRESHOLD) {
      return true; // Not a significant flash
    }
    
    // Remove old flash timestamps outside the window
    this.flashHistory = this.flashHistory.filter(
      timestamp => currentTime - timestamp < this.FLASH_WINDOW_MS
    );
    
    // Check if we're exceeding the flash rate limit
    if (this.flashHistory.length >= this.MAX_FLASHES_PER_SECOND) {
      // Too many flashes - throttle this one
      return false;
    }
    
    // Record this flash
    this.flashHistory.push(currentTime);
    return true;
  }
  
  /**
   * Get filtered delta time (for speed limiting)
   * @param deltaTime Original delta time in seconds (can be negative for reverse playback)
   * @returns Filtered delta time
   */
  filterDeltaTime(deltaTime: number): number {
    if (!this.shouldApplyFilters()) {
      return deltaTime;
    }
    // Apply speed cap by reducing delta time
    // Preserve sign for reverse playback
    return deltaTime * this.MAX_SPEED_MULTIPLIER;
  }
  
  /**
   * Reset flash history (call when mode changes)
   */
  reset(): void {
    this.flashHistory = [];
    this.lastFrameRedIntensity = 0;
  }
}


