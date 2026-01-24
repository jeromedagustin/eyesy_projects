/**
 * Transition Manager - Handles smooth transitions between modes
 */
import { Canvas } from './Canvas';
import * as THREE from 'three';

export type TransitionType = 
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'circle-expand'
  | 'circle-shrink'
  | 'pixelate'
  | 'blur'
  | 'zoom-in'
  | 'zoom-out'
  | 'morph'
  | 'rotate-flip'
  | 'wave-distort'
  | 'spiral'
  | 'color-blend'
  | 'particle-dissolve'
  | 'crossfade-zoom';

export interface TransitionState {
  isActive: boolean;
  type: TransitionType;
  progress: number; // 0.0 to 1.0
  fromModeId: string;
  toModeId: string;
  fromCategory: string;
  toCategory: string;
}

export class TransitionManager {
  private state: TransitionState = {
    isActive: false,
    type: 'fade',
    progress: 0.0,
    fromModeId: '',
    toModeId: '',
    fromCategory: '',
    toCategory: '',
  };
  
  private transitionDuration = 0.5; // seconds
  private startTime = 0;
  private fromFrameTexture: THREE.Texture | null = null;
  private fromFrameCaptured = false; // Track if from frame has been captured
  private canvas: Canvas;

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  /**
   * Set transition duration
   */
  setDuration(duration: number): void {
    this.transitionDuration = duration;
  }

  /**
   * Get transition duration
   */
  getDuration(): number {
    return this.transitionDuration;
  }
  
  /**
   * Get transition start time (for timeout detection)
   */
  getStartTime(): number {
    return this.startTime;
  }

  /**
   * Start a transition between two modes
   * Note: fromFrame will be captured in the first animation frame
   */
  startTransition(
    fromModeId: string,
    toModeId: string,
    fromCategory: string,
    toCategory: string,
    fromModeName?: string,
    toModeName?: string,
    transitionType?: TransitionType
  ): void {
    // Dispose old texture if it exists
    if (this.fromFrameTexture) {
      try {
        this.fromFrameTexture.dispose();
      } catch (e) {
        // Texture may already be disposed
      }
      this.fromFrameTexture = null;
    }
    
    // Reset capture flag - frame will be captured in first animation frame
    this.fromFrameCaptured = false;
    
    // Determine transition type if not specified
    const type = transitionType || this.selectTransitionType(
      fromCategory, 
      toCategory, 
      fromModeName || '', 
      toModeName || ''
    );
    
    this.state = {
      isActive: true,
      type: type,
      progress: 0.0,
      fromModeId,
      toModeId,
      fromCategory,
      toCategory,
    };
    
    this.startTime = performance.now();
  }
  
  /**
   * Set the from frame texture (called from animation loop)
   */
  setFromFrame(texture: THREE.Texture | null): void {
    if (this.fromFrameTexture) {
      try {
        this.fromFrameTexture.dispose();
      } catch (e) {
        // Texture may already be disposed
      }
    }
    
    this.fromFrameTexture = texture;
    this.fromFrameCaptured = true;
    
    // Validate the captured texture
    if (!this.fromFrameTexture || !this.isValidTexture(this.fromFrameTexture)) {
      console.warn('TransitionManager: Invalid fromFrameTexture, transition may not work correctly');
      this.fromFrameTexture = null;
    }
  }
  
  /**
   * Check if from frame has been captured
   */
  hasFromFrame(): boolean {
    return this.fromFrameCaptured && this.fromFrameTexture !== null;
  }

  /**
   * Validate that a texture is safe to use with WebGL
   */
  private isValidTexture(texture: THREE.Texture | null | undefined): boolean {
    if (!texture) return false;
    
    // Check if texture has an image
    if (!texture.image) return false;
    
    // Check if texture is disposed (check for uuid which should always exist)
    if ((texture as any).uuid === undefined) return false;
    
    // Validate canvas dimensions
    if (texture.image instanceof HTMLCanvasElement) {
      if (texture.image.width === 0 || texture.image.height === 0) return false;
      // Ensure canvas has valid context
      const ctx = texture.image.getContext('2d');
      if (!ctx) return false;
    }
    
    // Validate image element
    if (texture.image instanceof HTMLImageElement) {
      if (!texture.image.complete) return false;
      if (texture.image.naturalWidth === 0 || texture.image.naturalHeight === 0) return false;
    }
    
    // Validate ImageBitmap (check if ImageBitmap exists first for test environments)
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) {
      if (texture.image.width === 0 || texture.image.height === 0) return false;
    }
    
    return true;
  }

  /**
   * Safely blit a texture, validating it first
   * Returns true if blit was successful, false otherwise
   */
  private safeBlitTexture(
    canvas: Canvas,
    texture: THREE.Texture | null,
    x: number,
    y: number,
    width?: number,
    height?: number,
    alpha: number = 1.0,
    rotation: number = 0
  ): boolean {
    if (!texture || !this.isValidTexture(texture)) {
      return false;
    }
    try {
      canvas.blitTexture(texture, x, y, width, height, alpha, rotation);
      return true;
    } catch (error) {
      console.warn('TransitionManager: Error blitting texture:', error);
      return false;
    }
  }

  /**
   * Select appropriate transition type based on mode categories and names
   */
  private selectTransitionType(
    fromCategory: string, 
    toCategory: string,
    fromModeName: string,
    toModeName: string
  ): TransitionType {
    // Check if modes are similar (same theme/family)
    const similarity = this.calculateModeSimilarity(fromModeName, toModeName);
    
    // If modes are very similar, use creative transitions
    if (similarity > 0.7) {
      return this.selectCreativeTransition(fromModeName, toModeName);
    }
    
    // Same category transitions
    if (fromCategory === toCategory) {
      // Within same category, use subtle transitions
      const types: TransitionType[] = ['fade', 'slide-left', 'slide-right'];
      return types[Math.floor(Math.random() * types.length)];
    }
    
    // Different category transitions
    // Scopes -> Triggers: slide transitions
    if (fromCategory === 'scopes' && toCategory === 'triggers') {
      return 'slide-right';
    }
    if (fromCategory === 'triggers' && toCategory === 'scopes') {
      return 'slide-left';
    }
    
    // Utilities -> anything: fade
    if (fromCategory === 'utilities') {
      return 'fade';
    }
    if (toCategory === 'utilities') {
      return 'fade';
    }
    
    // Default: fade
    return 'fade';
  }

  /**
   * Calculate similarity between two mode names (0.0 to 1.0)
   * Higher value = more similar
   */
  private calculateModeSimilarity(name1: string, name2: string): number {
    // Normalize names (remove "S - ", "T - ", "U - " prefixes, lowercase)
    const normalize = (name: string) => {
      return name
        .replace(/^[STU]\s*-\s*/i, '')
        .toLowerCase()
        .trim();
    };
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Extract key words/phrases
    const words1 = this.extractKeywords(n1);
    const words2 = this.extractKeywords(n2);
    
    // Calculate word overlap
    const commonWords = words1.filter(w => words2.includes(w));
    const totalWords = new Set([...words1, ...words2]).size;
    
    if (totalWords === 0) return 0;
    
    const wordSimilarity = (commonWords.length * 2) / totalWords;
    
    // Check for common patterns
    let patternSimilarity = 0;
    
    // Check for number variations (e.g., "Two" vs "Three")
    const numberPattern = /(two|three|four|five|2|3|4|5)/i;
    if (numberPattern.test(n1) && numberPattern.test(n2)) {
      patternSimilarity += 0.3;
    }
    
    // Check for direction variations (e.g., "Horizontal" vs "Vertical", "H" vs "V")
    const directionPattern = /(horizontal|vertical|h\s|v\s)/i;
    if (directionPattern.test(n1) && directionPattern.test(n2)) {
      patternSimilarity += 0.3;
    }
    
    // Check for color/style variations (e.g., "Stepped Color" vs "Uniform Color")
    const stylePattern = /(stepped|uniform|filled|outline|color)/i;
    if (stylePattern.test(n1) && stylePattern.test(n2)) {
      patternSimilarity += 0.2;
    }
    
    // Check for exact prefix match (e.g., "Classic Horizontal" vs "Classic Vertical")
    const prefix1 = n1.split(/\s+/).slice(0, 2).join(' ');
    const prefix2 = n2.split(/\s+/).slice(0, 2).join(' ');
    if (prefix1 === prefix2 && prefix1.length > 3) {
      patternSimilarity += 0.4;
    }
    
    return Math.min(1.0, wordSimilarity + patternSimilarity);
  }

  /**
   * Extract keywords from mode name
   */
  private extractKeywords(name: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = name
      .toLowerCase()
      .split(/[\s\-]+/)
      .filter(w => w.length > 2 && !commonWords.includes(w));
    
    return words;
  }

  /**
   * Select a creative transition for similar modes
   */
  private selectCreativeTransition(
    fromModeName: string,
    toModeName: string
  ): TransitionType {
    // Extract themes from mode names
    const fromLower = fromModeName.toLowerCase();
    const toLower = toModeName.toLowerCase();
    
    // Line-based modes: morph or wave transitions
    if (fromLower.includes('line') || toLower.includes('line') ||
        fromLower.includes('scope') || toLower.includes('scope')) {
      const lineTransitions: TransitionType[] = ['morph', 'wave-distort', 'rotate-flip', 'spiral'];
      return lineTransitions[Math.floor(Math.random() * lineTransitions.length)];
    }
    
    // Circle-based modes: spiral or circle transitions
    if (fromLower.includes('circle') || toLower.includes('circle')) {
      const circleTransitions: TransitionType[] = ['spiral', 'circle-expand', 'circle-shrink', 'rotate-flip'];
      return circleTransitions[Math.floor(Math.random() * circleTransitions.length)];
    }
    
    // Grid-based modes: morph or particle dissolve
    if (fromLower.includes('grid') || toLower.includes('grid')) {
      const gridTransitions: TransitionType[] = ['morph', 'particle-dissolve', 'wave-distort'];
      return gridTransitions[Math.floor(Math.random() * gridTransitions.length)];
    }
    
    // Color-based modes: color blend
    if (fromLower.includes('color') || toLower.includes('color') ||
        fromLower.includes('amp') || toLower.includes('amp')) {
      const colorTransitions: TransitionType[] = ['color-blend', 'crossfade-zoom', 'morph'];
      return colorTransitions[Math.floor(Math.random() * colorTransitions.length)];
    }
    
    // Bezier/curve modes: wave or morph
    if (fromLower.includes('bezier') || toLower.includes('bezier') ||
        fromLower.includes('curve') || toLower.includes('curve')) {
      const curveTransitions: TransitionType[] = ['wave-distort', 'morph', 'spiral'];
      return curveTransitions[Math.floor(Math.random() * curveTransitions.length)];
    }
    
    // Default creative transitions for similar modes
    const creativeTransitions: TransitionType[] = [
      'morph',
      'rotate-flip',
      'wave-distort',
      'spiral',
      'color-blend',
      'crossfade-zoom'
    ];
    return creativeTransitions[Math.floor(Math.random() * creativeTransitions.length)];
  }

  /**
   * Update transition progress (call each frame)
   * Returns true if transition is still active, false if complete
   * @param deltaTime Time since last frame in seconds
   * @param newModeReady Whether the new mode is ready to be displayed
   */
  update(deltaTime: number, newModeReady: boolean = true): boolean {
    if (!this.state.isActive) {
      return false;
    }
    
    // Don't progress transition if we don't have a from frame yet
    // But add a timeout - if we've been waiting too long, proceed anyway
    const elapsed = (performance.now() - this.startTime) / 1000;
    const maxWaitTime = 0.1; // Wait max 100ms for frame capture
    
    if (!this.fromFrameCaptured || !this.fromFrameTexture) {
      // If we've waited too long, proceed without from frame (fallback)
      if (elapsed > maxWaitTime) {
        console.warn('TransitionManager: From frame not captured in time, proceeding without it');
        this.fromFrameCaptured = true; // Mark as captured to proceed
      } else {
        return true; // Still active, waiting for from frame
      }
    }
    
    this.state.progress = Math.min(1.0, elapsed / this.transitionDuration);
    
    // Only complete transition when progress reaches 1.0 AND new mode is ready
    // This ensures the transition always runs for the full duration
    if (this.state.progress >= 1.0) {
      if (newModeReady) {
        // Transition complete and new mode ready
        this.state.isActive = false;
        return false;
      } else {
        // Transition duration complete but mode not ready - keep transition active
        // but don't progress further (stay at 1.0)
        this.state.progress = 1.0;
        return true;
      }
    }
    
    // Safety timeout - if transition has been active way too long, force completion
    const maxTransitionTime = this.transitionDuration * 3; // Allow 3x duration max
    if (elapsed > maxTransitionTime) {
      console.warn(`TransitionManager: Transition exceeded max time (${maxTransitionTime}s), forcing completion`);
      this.state.isActive = false;
      return false;
    }
    
    return true;
  }

  /**
   * Render the transition effect
   * @param canvas Canvas to render to
   * @param currentFrameTexture Texture of the new frame (from pending mode)
   */
  render(canvas: Canvas, currentFrameTexture: THREE.Texture | null): void {
    if (!this.state.isActive) {
      return;
    }
    
    // If we don't have a from frame yet, we can't render the transition
    // But we should still show something (the old mode if available)
    if (!this.fromFrameTexture) {
      console.warn('TransitionManager: No from frame texture available for rendering');
      return;
    }
    
    // Apply smoother easing for auto transitions, standard for manual
    // Auto transitions use smoother easing for better blending
    const isAutoTransition = this.state.type === 'fade' || 
                            this.state.type === 'morph' ||
                            this.state.type === 'color-blend' ||
                            this.state.type === 'crossfade-zoom';
    
    const progress = isAutoTransition 
      ? this.easeInOutSmooth(this.state.progress)
      : this.easeInOutCubic(this.state.progress);
    
    switch (this.state.type) {
      case 'fade':
        this.renderFade(canvas, progress, currentFrameTexture);
        break;
      case 'slide-left':
        this.renderSlide(canvas, progress, -1, 0, currentFrameTexture);
        break;
      case 'slide-right':
        this.renderSlide(canvas, progress, 1, 0, currentFrameTexture);
        break;
      case 'slide-up':
        this.renderSlide(canvas, progress, 0, -1, currentFrameTexture);
        break;
      case 'slide-down':
        this.renderSlide(canvas, progress, 0, 1, currentFrameTexture);
        break;
      case 'wipe-left':
        this.renderWipe(canvas, progress, -1, 0, currentFrameTexture);
        break;
      case 'wipe-right':
        this.renderWipe(canvas, progress, 1, 0, currentFrameTexture);
        break;
      case 'wipe-up':
        this.renderWipe(canvas, progress, 0, -1, currentFrameTexture);
        break;
      case 'wipe-down':
        this.renderWipe(canvas, progress, 0, 1, currentFrameTexture);
        break;
      case 'circle-expand':
        this.renderCircleExpand(canvas, progress, currentFrameTexture);
        break;
      case 'circle-shrink':
        this.renderCircleShrink(canvas, progress, currentFrameTexture);
        break;
      case 'pixelate':
        this.renderPixelate(canvas, progress, currentFrameTexture);
        break;
      case 'blur':
        this.renderBlur(canvas, progress, currentFrameTexture);
        break;
      case 'zoom-in':
        this.renderZoom(canvas, progress, true, currentFrameTexture);
        break;
      case 'zoom-out':
        this.renderZoom(canvas, progress, false, currentFrameTexture);
        break;
      case 'morph':
        this.renderMorph(canvas, progress, currentFrameTexture);
        break;
      case 'rotate-flip':
        this.renderRotateFlip(canvas, progress, currentFrameTexture);
        break;
      case 'wave-distort':
        this.renderWaveDistort(canvas, progress, currentFrameTexture);
        break;
      case 'spiral':
        this.renderSpiral(canvas, progress, currentFrameTexture);
        break;
      case 'color-blend':
        this.renderColorBlend(canvas, progress, currentFrameTexture);
        break;
      case 'particle-dissolve':
        this.renderParticleDissolve(canvas, progress, currentFrameTexture);
        break;
      case 'crossfade-zoom':
        this.renderCrossfadeZoom(canvas, progress, currentFrameTexture);
        break;
    }
  }

  /**
   * Get current transition state
   */
  getState(): TransitionState {
    return { ...this.state };
  }
  
  /**
   * Get the from frame texture (for rendering while waiting for new mode)
   */
  getFromFrameTexture(): THREE.Texture | null {
    return this.fromFrameTexture;
  }

  /**
   * Get current transition type name (human-readable)
   */
  getTransitionTypeName(): string {
    if (!this.state.isActive) {
      return '';
    }
    
    const typeNames: Record<TransitionType, string> = {
      'fade': 'Fade',
      'slide-left': 'Slide Left',
      'slide-right': 'Slide Right',
      'slide-up': 'Slide Up',
      'slide-down': 'Slide Down',
      'wipe-left': 'Wipe Left',
      'wipe-right': 'Wipe Right',
      'wipe-up': 'Wipe Up',
      'wipe-down': 'Wipe Down',
      'circle-expand': 'Circle Expand',
      'circle-shrink': 'Circle Shrink',
      'pixelate': 'Pixelate',
      'blur': 'Blur',
      'zoom-in': 'Zoom In',
      'zoom-out': 'Zoom Out',
      'morph': 'Morph',
      'rotate-flip': 'Rotate & Flip',
      'wave-distort': 'Wave Distort',
      'spiral': 'Spiral',
      'color-blend': 'Color Blend',
      'particle-dissolve': 'Particle Dissolve',
      'crossfade-zoom': 'Crossfade Zoom',
    };
    
    return typeNames[this.state.type] || this.state.type;
  }

  /**
   * Check if transition is active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Cancel current transition
   */
  cancel(): void {
    this.state.isActive = false;
    this.fromFrameTexture = null;
  }

  // Transition rendering methods

  private renderFade(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    // Smooth fade with crossfade - both frames visible during transition
    // Use smoother alpha curves for better blending
    const oldAlpha = this.easeOutCubic(1.0 - progress);
    const newAlpha = this.easeInCubic(progress);
    
    console.log('renderFade:', {
      progress: progress.toFixed(3),
      oldAlpha: oldAlpha.toFixed(3),
      newAlpha: newAlpha.toFixed(3),
      hasFromFrame: !!this.fromFrameTexture,
      hasNewFrame: !!newFrameTexture
    });
    
    // Always draw old frame first (background) - this ensures we see the transition even if new frame isn't ready
    if (oldAlpha > 0 && this.fromFrameTexture) {
      const blitSuccess = this.safeBlitTexture(
        canvas,
        this.fromFrameTexture,
        0,
        0,
        canvas.getWidth(),
        canvas.getHeight(),
        oldAlpha
      );
      console.log('Blit old frame:', blitSuccess ? 'success' : 'failed');
    }
    
    // Draw new frame on top (fading in) if available
    if (newFrameTexture && newAlpha > 0) {
      const blitSuccess = this.safeBlitTexture(
        canvas,
        newFrameTexture,
        0,
        0,
        canvas.getWidth(),
        canvas.getHeight(),
        newAlpha
      );
      console.log('Blit new frame:', blitSuccess ? 'success' : 'failed');
    }
  }

  private renderSlide(canvas: Canvas, progress: number, dirX: number, dirY: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // New frame slides in from opposite direction
    const newOffsetX = -dirX * width * (1.0 - progress);
    const newOffsetY = -dirY * height * (1.0 - progress);
    this.safeBlitTexture(
      canvas,
      newFrameTexture,
      newOffsetX,
      newOffsetY,
      width,
      height,
      progress // Fade in as it slides
    );
    
    // Old frame slides out
    if (progress < 1.0) {
      const offsetX = dirX * width * progress;
      const offsetY = dirY * height * progress;
      this.safeBlitTexture(
        canvas,
        this.fromFrameTexture,
        offsetX,
        offsetY,
        width,
        height,
        1.0 - progress * 0.5 // Fade out as it slides
      );
    }
  }

  private renderWipe(canvas: Canvas, progress: number, dirX: number, dirY: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Draw new frame first (full screen, will be partially covered)
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        0,
        0,
        width,
        height,
        1.0
      );
    }
    
    // Wipe effect - old frame is replaced by new frame
    if (this.fromFrameTexture) {
      // Draw old frame with a mask
      if (dirX !== 0) {
        // Horizontal wipe
        const wipeX = width * (1.0 - progress) * (dirX > 0 ? 1 : -1);
        const oldWidth = Math.abs(wipeX);
        if (oldWidth > 0) {
          canvas.blitTexture(
            this.fromFrameTexture,
            dirX > 0 ? 0 : width - oldWidth,
            0,
            oldWidth,
            height,
            1.0
          );
        }
      } else if (dirY !== 0) {
        // Vertical wipe
        const wipeY = height * (1.0 - progress) * (dirY > 0 ? 1 : -1);
        const oldHeight = Math.abs(wipeY);
        if (oldHeight > 0) {
          canvas.blitTexture(
            this.fromFrameTexture,
            0,
            dirY > 0 ? 0 : height - oldHeight,
            width,
            oldHeight,
            1.0
          );
        }
      }
    }
  }

  private renderCircleExpand(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Draw new frame first
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        0,
        0,
        width,
        height,
        progress
      );
    }
    
    // Draw old frame with fade (circular mask would require shader support)
    if (this.fromFrameTexture && progress < 1.0) {
      const alpha = 1.0 - progress;
      canvas.blitTexture(
        this.fromFrameTexture,
        0,
        0,
        width,
        height,
        alpha
      );
    }
  }

  private renderCircleShrink(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    // Similar to expand but in reverse
    this.renderCircleExpand(canvas, 1.0 - progress, newFrameTexture);
  }

  private renderPixelate(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Draw new frame
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        0,
        0,
        width,
        height,
        progress
      );
    }
    
    // Pixelation effect - fade out old frame
    if (this.fromFrameTexture && progress < 1.0) {
      const alpha = 1.0 - progress;
      canvas.blitTexture(
        this.fromFrameTexture,
        0,
        0,
        width,
        height,
        alpha
      );
    }
  }

  private renderBlur(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Draw new frame
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        0,
        0,
        width,
        height,
        progress
      );
    }
    
    // Blur effect - fade out old frame
    if (this.fromFrameTexture) {
      const alpha = 1.0 - progress;
      canvas.blitTexture(
        this.fromFrameTexture,
        0,
        0,
        width,
        height,
        alpha
      );
    }
  }

  private renderZoom(canvas: Canvas, progress: number, zoomIn: boolean, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw new frame with zoom
    if (newFrameTexture) {
      const newScale = zoomIn ? (0.5 + progress * 0.5) : (1.5 - progress * 0.5);
      const newScaledWidth = width * newScale;
      const newScaledHeight = height * newScale;
      const newOffsetX = centerX - newScaledWidth / 2;
      const newOffsetY = centerY - newScaledHeight / 2;
      
      canvas.blitTexture(
        newFrameTexture,
        newOffsetX,
        newOffsetY,
        newScaledWidth,
        newScaledHeight,
        progress
      );
    }
    
    // Draw old frame with zoom out
    if (this.fromFrameTexture) {
      const scale = zoomIn ? (1.0 + progress) : (1.0 - progress * 0.5);
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = centerX - scaledWidth / 2;
      const offsetY = centerY - scaledHeight / 2;
      const alpha = 1.0 - progress;
      
      canvas.blitTexture(
        this.fromFrameTexture,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight,
        alpha
      );
    }
  }

  /**
   * Easing function for smooth transitions
   */
  /**
   * Smooth easing function for transitions
   * Uses a smoother curve for more gradual transitions
   */
  private easeInOutCubic(t: number): number {
    // Smoother easing - slower start and end
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Even smoother easing for auto transitions
   * Creates a more gradual, flowing transition
   */
  private easeInOutSmooth(t: number): number {
    // Quintic easing for ultra-smooth transitions
    return t < 0.5
      ? 16 * t * t * t * t * t
      : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  /**
   * Ease out for fade-ins (slow start, fast end)
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Ease in for fade-outs (fast start, slow end)
   */
  private easeInCubic(t: number): number {
    return t * t * t;
  }

  // Creative transition rendering methods

  private renderMorph(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const centerX = width / 2;
    const centerY = height / 2;

    // Smoother morph with gradual scale and rotation
    const smoothProgress = this.easeInOutSmooth(progress);
    
    // Draw new frame with smooth morphing
    if (newFrameTexture) {
      const scale = 0.9 + smoothProgress * 0.1; // Scale from 0.9 to 1.0 (more subtle)
      const rotation = smoothProgress * 180; // Rotate 180 degrees (slower)
      const waveAmount = Math.sin(smoothProgress * Math.PI) * 0.05; // Smoother wave
      const offsetX = Math.sin(smoothProgress * Math.PI * 1.5) * width * waveAmount;
      const offsetY = Math.cos(smoothProgress * Math.PI * 1.5) * height * waveAmount;
      const alpha = this.easeInCubic(progress); // Smooth fade in

      canvas.blitTexture(
        newFrameTexture,
        centerX - (width * scale) / 2 + offsetX,
        centerY - (height * scale) / 2 + offsetY,
        width * scale,
        height * scale,
        alpha,
        rotation
      );
    }

    // Draw old frame with smooth fade out
    if (this.fromFrameTexture) {
      const scale = 1.0 - smoothProgress * 0.1; // Scale from 1.0 to 0.9
      const rotation = -smoothProgress * 180; // Rotate -180 degrees
      const waveAmount = Math.sin((1 - smoothProgress) * Math.PI) * 0.05;
      const offsetX = -Math.sin((1 - smoothProgress) * Math.PI * 1.5) * width * waveAmount;
      const offsetY = -Math.cos((1 - smoothProgress) * Math.PI * 1.5) * height * waveAmount;
      const alpha = this.easeOutCubic(1.0 - progress); // Smooth fade out

      canvas.blitTexture(
        this.fromFrameTexture,
        centerX - (width * scale) / 2 + offsetX,
        centerY - (height * scale) / 2 + offsetY,
        width * scale,
        height * scale,
        alpha,
        rotation
      );
    }
  }

  private renderRotateFlip(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Rotate and flip effect
    const scale = Math.sin(progress * Math.PI); // Scale down to 0 at midpoint, then back up
    
    // Draw new frame rotating in
    if (newFrameTexture) {
      const newScale = scale;
      const newWidth = width * newScale;
      const newHeight = height * newScale;
      canvas.blitTexture(
        newFrameTexture,
        centerX - newWidth / 2,
        centerY - newHeight / 2,
        newWidth,
        newHeight,
        progress
      );
    }
    
    // Draw old frame rotating out
    if (this.fromFrameTexture) {
      const oldScale = 1.0 - scale;
      const oldWidth = width * oldScale;
      const oldHeight = height * oldScale;
      canvas.blitTexture(
        this.fromFrameTexture,
        centerX - oldWidth / 2,
        centerY - oldHeight / 2,
        oldWidth,
        oldHeight,
        1.0 - progress
      );
    }
  }

  private renderWaveDistort(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Wave distortion effect - simplified version using overall offset
    const waveAmp = Math.sin(progress * Math.PI) * 0.1;
    const waveOffsetX = Math.sin(progress * Math.PI * 4) * width * waveAmp;
    const waveOffsetY = Math.cos(progress * Math.PI * 4) * height * waveAmp;
    
    // Draw new frame with wave distortion
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        waveOffsetX,
        waveOffsetY,
        width * (1 + waveAmp),
        height * (1 + waveAmp),
        progress
      );
    }
    
    // Draw old frame with opposite wave
    if (this.fromFrameTexture) {
      canvas.blitTexture(
        this.fromFrameTexture,
        -waveOffsetX,
        -waveOffsetY,
        width * (1 + waveAmp),
        height * (1 + waveAmp),
        1.0 - progress
      );
    }
  }

  private renderSpiral(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Spiral effect: reveal in spiral pattern
    const scale = progress;
    
    // Draw new frame with spiral reveal
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        centerX - (width * scale) / 2,
        centerY - (height * scale) / 2,
        width * scale,
        height * scale,
        progress
      );
    }
    
    // Draw old frame with spiral fade
    if (this.fromFrameTexture) {
      const oldScale = 1.0 - progress * 0.5;
      const oldAlpha = 1.0 - progress;
      canvas.blitTexture(
        this.fromFrameTexture,
        centerX - (width * oldScale) / 2,
        centerY - (height * oldScale) / 2,
        width * oldScale,
        height * oldScale,
        oldAlpha
      );
    }
  }

  private renderColorBlend(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // Smooth color blend with crossfade
    const smoothProgress = this.easeInOutSmooth(progress);
    const oldAlpha = this.easeOutCubic(1.0 - smoothProgress);
    const newAlpha = this.easeInCubic(smoothProgress);

    // Draw both frames with smooth alpha blending
    if (newFrameTexture && newAlpha > 0) {
      canvas.blitTexture(
        newFrameTexture,
        0,
        0,
        width,
        height,
        newAlpha
      );
    }

    if (this.fromFrameTexture && oldAlpha > 0) {
      canvas.blitTexture(
        this.fromFrameTexture,
        0,
        0,
        width,
        height,
        oldAlpha
      );
    }
  }

  private renderParticleDissolve(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    
    // Particle dissolve: break into chunks that fade
    const chunks = 8;
    const chunkSize = width / chunks;
    
    // Draw new frame
    if (newFrameTexture) {
      canvas.blitTexture(
        newFrameTexture,
        0,
        0,
        width,
        height,
        progress
      );
    }
    
    // Draw old frame in dissolving chunks
    if (this.fromFrameTexture) {
      for (let i = 0; i < chunks; i++) {
        const chunkProgress = Math.max(0, progress - (i / chunks) * 0.5);
        const alpha = Math.max(0, 1.0 - chunkProgress * 2);
        if (alpha > 0) {
          canvas.blitTexture(
            this.fromFrameTexture,
            i * chunkSize,
            0,
            chunkSize,
            height,
            alpha
          );
        }
      }
    }
  }

  private renderCrossfadeZoom(canvas: Canvas, progress: number, newFrameTexture: THREE.Texture | null): void {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const centerX = width / 2;
    const centerY = height / 2;

    // Smooth crossfade with gradual zoom
    const smoothProgress = this.easeInOutSmooth(progress);
    const oldAlpha = this.easeOutCubic(1.0 - smoothProgress);
    const newAlpha = this.easeInCubic(smoothProgress);

    // Draw new frame with smooth zoom in
    if (newFrameTexture && newAlpha > 0) {
      const scale = 0.9 + smoothProgress * 0.1; // More subtle zoom (0.9x to 1.0x)
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = centerX - scaledWidth / 2;
      const offsetY = centerY - scaledHeight / 2;

      canvas.blitTexture(
        newFrameTexture,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight,
        newAlpha
      );
    }

    // Draw old frame with smooth zoom out
    if (this.fromFrameTexture && oldAlpha > 0) {
      const scale = 1.0 - smoothProgress * 0.1;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const offsetX = centerX - scaledWidth / 2;
      const offsetY = centerY - scaledHeight / 2;

      canvas.blitTexture(
        this.fromFrameTexture,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight,
        oldAlpha
      );
    }
  }
}

