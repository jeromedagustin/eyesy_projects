/**
 * Base class for animated modes with common patterns
 * Provides time tracking and audio reactivity
 */
import { Mode } from './Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioReactivity } from '../utils/AudioReactivity';

/**
 * Base class for modes that use time-based animation and audio reactivity
 * Reduces boilerplate code across animated modes
 */
export abstract class BaseAnimatedMode implements Mode {
  protected time: number = 0.0;
  protected audioReactivity: AudioReactivity;

  constructor() {
    this.audioReactivity = new AudioReactivity();
  }

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.audioReactivity.reset();
    this.onSetup(canvas, eyesy);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Update time using deltaTime for smooth animation
    // For reverse playback to work correctly, sync with eyesy.time when deltaTime is negative
    // This ensures the mode's time stays in sync with the global time
    if (eyesy.deltaTime < 0) {
      // Reverse playback: use eyesy.time directly to stay in sync
      this.time = eyesy.time;
    } else {
      // Normal playback: accumulate using deltaTime
      this.time += eyesy.deltaTime;
    }
    
    // Update audio reactivity
    const audioLevel = this.audioReactivity.update(eyesy);
    
    // Call the mode-specific draw implementation
    this.onDraw(canvas, eyesy, audioLevel);
  }

  /**
   * Override this method for mode-specific setup
   */
  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Override in subclasses
  }

  /**
   * Override this method for mode-specific drawing
   * @param audioLevel The current smoothed audio level (0.0 to 1.0)
   */
  protected abstract onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void;
}

