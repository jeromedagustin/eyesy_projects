/**
 * Tests for all EYESY modes
 */
import { describe, it, expect } from 'vitest';
import { modes } from '../modes/index';
import { createMockCanvasWrapper, createMockEYESY } from './setup';

describe('Mode Loading', () => {
  it('should have modes defined', () => {
    expect(modes).toBeDefined();
    expect(modes.length).toBeGreaterThan(0);
  });

  it('should have valid mode structure', () => {
    modes.forEach(mode => {
      expect(mode).toHaveProperty('id');
      expect(mode).toHaveProperty('name');
      expect(mode).toHaveProperty('category');
      expect(mode).toHaveProperty('mode');
      expect(typeof mode.id).toBe('string');
      expect(typeof mode.name).toBe('string');
      expect(['scopes', 'triggers', 'utilities', 'custom']).toContain(mode.category);
      expect(typeof mode.mode).toBe('function');
    });
  });

  it('should have unique mode IDs', () => {
    const ids = modes.map(m => m.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});

describe('Mode Instantiation', () => {
  modes.forEach(modeInfo => {
    describe(`${modeInfo.name} (${modeInfo.id})`, () => {
      it('should instantiate without errors', () => {
        expect(() => {
          new modeInfo.mode();
        }).not.toThrow();
      });

      it('should have setup method', () => {
        const mode = new modeInfo.mode();
        expect(mode.setup).toBeDefined();
        expect(typeof mode.setup).toBe('function');
      });

      it('should have draw method', () => {
        const mode = new modeInfo.mode();
        expect(mode.draw).toBeDefined();
        expect(typeof mode.draw).toBe('function');
      });

      it('should call setup without errors', () => {
        const mode = new modeInfo.mode();
        const canvas = createMockCanvasWrapper();
        const eyesy = createMockEYESY();

        expect(() => {
          mode.setup(canvas, eyesy);
        }).not.toThrow();
      });

      it('should call draw without errors', () => {
        const mode = new modeInfo.mode();
        const canvas = createMockCanvasWrapper();
        const eyesy = createMockEYESY();

        // Call setup first
        mode.setup(canvas, eyesy);

        // Then call draw
        expect(() => {
          mode.draw(canvas, eyesy);
        }).not.toThrow();
      });

      it('should handle multiple draw calls', () => {
        const mode = new modeInfo.mode();
        const canvas = createMockCanvasWrapper();
        const eyesy = createMockEYESY();

        mode.setup(canvas, eyesy);

        // Call draw multiple times (simulating animation loop)
        expect(() => {
          for (let i = 0; i < 5; i++) {
            mode.draw(canvas, eyesy);
          }
        }).not.toThrow();
      });

      it('should handle different knob values', () => {
        const mode = new modeInfo.mode();
        const canvas = createMockCanvasWrapper();
        const eyesy = createMockEYESY();

        mode.setup(canvas, eyesy);

        // Test with different knob values
        const testValues = [0, 0.25, 0.5, 0.75, 1.0];
        testValues.forEach(val => {
          eyesy.knob1 = val;
          eyesy.knob2 = val;
          eyesy.knob3 = val;
          eyesy.knob4 = val;
          eyesy.knob5 = val;

          expect(() => {
            mode.draw(canvas, eyesy);
          }).not.toThrow();
        });
      });

      it('should handle trigger state changes', () => {
        const mode = new modeInfo.mode();
        const canvas = createMockCanvasWrapper();
        const eyesy = createMockEYESY();

        mode.setup(canvas, eyesy);

        // Test with trigger on
        eyesy.trig = true;
        expect(() => {
          mode.draw(canvas, eyesy);
        }).not.toThrow();

        // Test with trigger off
        eyesy.trig = false;
        expect(() => {
          mode.draw(canvas, eyesy);
        }).not.toThrow();
      });
    });
  });
});

describe('Mode Categories', () => {
  it('should have scopes modes', () => {
    const scopeModes = modes.filter(m => m.category === 'scopes');
    expect(scopeModes.length).toBeGreaterThan(0);
  });

  it('should have triggers modes', () => {
    const triggerModes = modes.filter(m => m.category === 'triggers');
    expect(triggerModes.length).toBeGreaterThan(0);
  });

  it('should have utilities modes', () => {
    const utilityModes = modes.filter(m => m.category === 'utilities');
    expect(utilityModes.length).toBeGreaterThan(0);
  });
});





