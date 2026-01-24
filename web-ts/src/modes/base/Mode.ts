import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * Base interface for EYESY modes
 */
export interface Mode {
  setup(canvas: Canvas, eyesy: EYESY): void | Promise<void>;
  draw(canvas: Canvas, eyesy: EYESY): void;
  dispose?(): void;
}

