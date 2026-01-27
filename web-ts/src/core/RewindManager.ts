/**
 * Rewind Manager - Captures and restores animation states for undo/rewind functionality
 */
import { Canvas } from './Canvas';
import { EYESY } from './EYESY';

export interface FrameState {
  timestamp: number;
  frameTexture: ImageData | null;
  eyesyState: {
    knob1: number;
    knob2: number;
    knob3: number;
    knob4: number;
    knob5: number;
    knob6?: number;
    knob7?: number;
    trig: boolean;
    audio_in: number[];
  };
  modeId: string | null;
}

export class RewindManager {
  private history: FrameState[] = [];
  private maxHistorySize: number = 60; // Store up to 60 frames (1 second at 60fps)
  private currentIndex: number = -1;
  private isRewinding: boolean = false;
  private captureInterval: number = 1; // Capture every N frames (1 = every frame)
  private frameCounter: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private reversePlayback: boolean = false; // True when playing in reverse
  private reverseSpeed: number = 1; // How many frames to step back per animation frame (1 = normal speed)
  private reversePlaybackEnabled: boolean = false; // User-enabled reverse playback mode

  constructor(maxHistorySize: number = 60, captureInterval: number = 1) {
    this.maxHistorySize = maxHistorySize;
    this.captureInterval = captureInterval;
  }

  /**
   * Initialize with canvas for frame capture
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    // IMPORTANT: Three.js will often create a WebGL2 context on the main canvas.
    // Calling `getContext('webgl')` first can produce the console error:
    // "Canvas has an existing context of a different type".
    // So prefer WebGL2 first, then fall back to WebGL1.
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    const gl1 = gl2 ? null : (canvas.getContext('webgl') as WebGLRenderingContext | null);
    this.gl = gl2 || gl1;
  }

  /**
   * Update reverse playback - steps backwards through history automatically
   * Call this every frame when in reverse playback mode
   */
  updateReversePlayback(eyesy: EYESY): boolean {
    if (!this.reversePlayback) {
      return false;
    }
    
    // If no history yet, wait for frames to be captured (but don't return false yet)
    // This allows the system to continue capturing frames
    if (this.history.length === 0) {
      // Ensure currentIndex is set correctly for when history becomes available
      this.currentIndex = -1;
      return false; // No history yet, can't play in reverse
    }
    
    // Ensure currentIndex is valid - if it's -1 or out of bounds, start from the end
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      this.currentIndex = this.history.length - 1;
    }

    // Step backwards through history
    this.currentIndex = Math.max(0, this.currentIndex - this.reverseSpeed);
    
    const state = this.history[this.currentIndex];
    if (state) {
      this.restoreState(eyesy, state);
      
      // If we've reached the beginning
      if (this.currentIndex <= 0) {
        if (this.reversePlaybackEnabled) {
          // If user-enabled reverse playback, loop back to the end
          this.currentIndex = this.history.length - 1;
        } else {
          // Otherwise, stop reverse playback
          this.reversePlayback = false;
          this.isRewinding = false;
        }
      }
      
      return true;
    }

    return false;
  }

  /**
   * Enable/disable reverse playback mode
   */
  setReversePlaybackEnabled(enabled: boolean): void {
    const wasEnabled = this.reversePlaybackEnabled;
    this.reversePlaybackEnabled = enabled;
    this.reversePlayback = enabled;
    
    // If disabling reverse playback and time might be negative, 
    // the App will handle resetting time if needed
    // Note: Reverse playback now works by negating time delta, not by restoring history states
  }

  /**
   * Check if reverse playback is enabled by user
   */
  isReversePlaybackEnabled(): boolean {
    return this.reversePlaybackEnabled;
  }

  /**
   * Capture current frame state
   */
  captureFrame(eyesy: EYESY, modeId: string | null): void {
    if (this.isRewinding && !this.reversePlayback) {
      return; // Don't capture while manually rewinding (but allow during reverse playback)
    }
    
    // Reverse playback now works by negating time, so we can still capture frames
    // (the history is still useful for manual rewind functionality)

    this.frameCounter++;
    if (this.frameCounter < this.captureInterval) {
      return; // Skip this frame
    }
    this.frameCounter = 0;

    // If we're not at the end of history, truncate future frames
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Capture frame texture
    let frameTexture: ImageData | null = null;
    if (this.canvas && this.gl) {
      try {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const pixels = new Uint8Array(width * height * 4);
        this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        
        // Flip vertically (WebGL origin is bottom-left, ImageData is top-left)
        const flippedPixels = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
          const srcRow = y * width * 4;
          const dstRow = (height - 1 - y) * width * 4;
          flippedPixels.set(pixels.subarray(srcRow, srcRow + width * 4), dstRow);
        }
        
        frameTexture = new ImageData(
          new Uint8ClampedArray(flippedPixels),
          width,
          height
        );
      } catch (error) {
        console.warn('[RewindManager] Failed to capture frame:', error);
      }
    }

    // Capture EYESY state
    const state: FrameState = {
      timestamp: performance.now(),
      frameTexture,
      eyesyState: {
        knob1: eyesy.knob1,
        knob2: eyesy.knob2,
        knob3: eyesy.knob3,
        knob4: eyesy.knob4,
        knob5: eyesy.knob5,
        knob6: eyesy.knob6,
        knob7: eyesy.knob7,
        trig: eyesy.trig,
        audio_in: [...eyesy.audio_in], // Copy array
      },
      modeId,
    };

    // Add to history
    this.history.push(state);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      const removed = this.history.shift();
      if (removed?.frameTexture) {
        // Clean up ImageData (though it's automatically garbage collected)
      }
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Rewind to previous frame
   * Returns true if rewound, false if already at beginning (will start reverse playback)
   */
  rewind(eyesy: EYESY): boolean {
    if (this.currentIndex <= 0) {
      // At the beginning - start reverse playback
      if (this.history.length > 0) {
        this.reversePlayback = true;
        this.isRewinding = true;
        this.currentIndex = this.history.length - 1; // Start from the end and play backwards
        return true;
      }
      return false; // No history at all
    }

    this.isRewinding = true;
    this.currentIndex--;

    const state = this.history[this.currentIndex];
    if (state) {
      // Restore EYESY state
      eyesy.knob1 = state.eyesyState.knob1;
      eyesy.knob2 = state.eyesyState.knob2;
      eyesy.knob3 = state.eyesyState.knob3;
      eyesy.knob4 = state.eyesyState.knob4;
      eyesy.knob5 = state.eyesyState.knob5;
      if (state.eyesyState.knob6 !== undefined) {
        eyesy.knob6 = state.eyesyState.knob6;
      }
      if (state.eyesyState.knob7 !== undefined) {
        eyesy.knob7 = state.eyesyState.knob7;
      }
      eyesy.trig = state.eyesyState.trig;
      eyesy.audio_in = [...state.eyesyState.audio_in];

      return true;
    }

    this.isRewinding = false;
    return false;
  }

  /**
   * Fast forward to next frame (if available)
   * Stops reverse playback if active
   */
  fastForward(eyesy: EYESY): boolean {
    // If in reverse playback, stop it and resume normal playback
    if (this.reversePlayback) {
      this.reversePlayback = false;
      this.isRewinding = false;
      // Jump to the end (most recent frame)
      if (this.history.length > 0) {
        this.currentIndex = this.history.length - 1;
        const state = this.history[this.currentIndex];
        if (state) {
          this.restoreState(eyesy, state);
          return true;
        }
      }
      return false;
    }

    if (this.currentIndex >= this.history.length - 1) {
      this.isRewinding = false;
      return false; // Already at the end
    }

    this.currentIndex++;
    const state = this.history[this.currentIndex];
    if (state) {
      this.restoreState(eyesy, state);

      // If we reach the end, stop rewinding
      if (this.currentIndex >= this.history.length - 1) {
        this.isRewinding = false;
      }

      return true;
    }

    this.isRewinding = false;
    return false;
  }

  /**
   * Helper to restore EYESY state from a frame state
   */
  private restoreState(eyesy: EYESY, state: FrameState): void {
    eyesy.knob1 = state.eyesyState.knob1;
    eyesy.knob2 = state.eyesyState.knob2;
    eyesy.knob3 = state.eyesyState.knob3;
    eyesy.knob4 = state.eyesyState.knob4;
    eyesy.knob5 = state.eyesyState.knob5;
    if (state.eyesyState.knob6 !== undefined) {
      eyesy.knob6 = state.eyesyState.knob6;
    }
    if (state.eyesyState.knob7 !== undefined) {
      eyesy.knob7 = state.eyesyState.knob7;
    }
    eyesy.trig = state.eyesyState.trig;
    eyesy.audio_in = [...state.eyesyState.audio_in];
  }

  /**
   * Jump to a specific frame in history
   */
  jumpToFrame(index: number, eyesy: EYESY): boolean {
    if (index < 0 || index >= this.history.length) {
      return false;
    }

    this.currentIndex = index;
    const state = this.history[this.currentIndex];
    if (state) {
      // Restore EYESY state
      eyesy.knob1 = state.eyesyState.knob1;
      eyesy.knob2 = state.eyesyState.knob2;
      eyesy.knob3 = state.eyesyState.knob3;
      eyesy.knob4 = state.eyesyState.knob4;
      eyesy.knob5 = state.eyesyState.knob5;
      if (state.eyesyState.knob6 !== undefined) {
        eyesy.knob6 = state.eyesyState.knob6;
      }
      if (state.eyesyState.knob7 !== undefined) {
        eyesy.knob7 = state.eyesyState.knob7;
      }
      eyesy.trig = state.eyesyState.trig;
      eyesy.audio_in = [...state.eyesyState.audio_in];

      // If we reach the end, stop rewinding
      if (this.currentIndex >= this.history.length - 1) {
        this.isRewinding = false;
      } else {
        this.isRewinding = true;
      }

      return true;
    }

    return false;
  }

  /**
   * Get current frame index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get total history size
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Check if we can rewind
   */
  canRewind(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if we can fast forward
   */
  canFastForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Check if currently rewinding
   */
  isCurrentlyRewinding(): boolean {
    return this.isRewinding;
  }

  /**
   * Check if in reverse playback mode
   */
  isInReversePlayback(): boolean {
    return this.reversePlayback;
  }

  /**
   * Stop reverse playback and resume normal playback
   */
  stopReversePlayback(): void {
    this.reversePlayback = false;
    this.isRewinding = false;
    // Jump to most recent frame
    if (this.history.length > 0) {
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Set reverse playback speed (frames per animation frame)
   */
  setReverseSpeed(speed: number): void {
    this.reverseSpeed = Math.max(1, Math.floor(speed));
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.isRewinding = false;
    this.frameCounter = 0;
  }

  /**
   * Set capture interval (capture every N frames)
   */
  setCaptureInterval(interval: number): void {
    this.captureInterval = Math.max(1, interval);
  }

  /**
   * Set max history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);
    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      const removeCount = this.history.length - this.maxHistorySize;
      this.history = this.history.slice(removeCount);
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Get frame state at index (for preview/thumbnail)
   */
  getFrameState(index: number): FrameState | null {
    if (index < 0 || index >= this.history.length) {
      return null;
    }
    return this.history[index];
  }
}

