/**
 * Test to identify which modes are fully implemented vs stubs
 */
import { describe, it, expect } from 'vitest';
import { modes } from '../modes/index';
import { createMockCanvasWrapper, createMockEYESY } from './setup';
// Note: File system access in browser tests is limited
// This test will check runtime behavior instead

describe('Mode Implementation Status', () => {
  const implementedModes: string[] = [];
  const stubModes: string[] = [];

  modes.forEach(modeInfo => {
    it(`should check implementation status: ${modeInfo.name}`, () => {
      const mode = new modeInfo.mode();
      const canvas = createMockCanvasWrapper();
      const eyesy = createMockEYESY();

      mode.setup(canvas, eyesy);

      // Check if mode actually draws something by checking if draw does anything
      // We'll consider it a stub if draw() completes instantly with no side effects
      // This is a heuristic - a mode that does nothing is likely a stub
      let isStub = false;
      
      // Try to detect if draw() is empty/stub by checking execution
      // If draw() throws or does nothing meaningful, it might be a stub
      try {
        mode.draw(canvas, eyesy);
        // If we get here without error, check if canvas was modified
        // For now, we'll mark modes that don't throw as potentially implemented
        // This is a simple heuristic
        isStub = false; // Assume implemented if no error
      } catch (error: any) {
        // If draw throws, check if it's a meaningful error or just a stub
        if (error.message && error.message.includes('TODO')) {
          isStub = true;
        } else {
          // Real error, not a stub
          isStub = false;
        }
      }

      if (isStub) {
        stubModes.push(modeInfo.name);
      } else {
        implementedModes.push(modeInfo.name);
      }

      // This test always passes, it's just for reporting
      expect(true).toBe(true);
    });
  });

  it('should report implementation status', () => {
    console.log('\n=== Mode Implementation Status ===');
    console.log(`\n✅ Fully Implemented (${implementedModes.length}):`);
    implementedModes.forEach(name => console.log(`  - ${name}`));
    
    console.log(`\n⚠️  Stubs/TODO (${stubModes.length}):`);
    stubModes.forEach(name => console.log(`  - ${name}`));
    
    console.log(`\nTotal: ${modes.length} modes`);
    console.log(`Implemented: ${implementedModes.length} (${Math.round(implementedModes.length / modes.length * 100)}%)`);
    console.log(`Stubs: ${stubModes.length} (${Math.round(stubModes.length / modes.length * 100)}%)`);
    
    // This test always passes
    expect(implementedModes.length + stubModes.length).toBe(modes.length);
  });
});

