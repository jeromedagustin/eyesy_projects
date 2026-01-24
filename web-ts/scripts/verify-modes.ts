/**
 * Extended mode verification script
 * Tests setup() and draw() for all modes
 */
import { modes } from '../src/modes/index';
import { EYESYImpl } from '../src/core/EYESY';

// Mock browser globals
(global as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 1280,
        height: 720,
        getContext: () => ({
          fillRect: () => {},
          clearRect: () => {},
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {},
          drawImage: () => {},
          fillText: () => {},
          measureText: (text: string) => ({ width: text.length * 10 }),
          font: '',
          fillStyle: '',
          textAlign: '',
          textBaseline: '',
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
        }),
        toDataURL: () => 'data:image/png;base64,',
      };
    }
    return {};
  },
};

(global as any).navigator = {
  mediaDevices: {
    getUserMedia: () => Promise.reject(new Error('Mock - no camera')),
  },
};

(global as any).Image = class MockImage {
  src = '';
  onload: (() => void) | null = null;
  onerror: ((e: Error) => void) | null = null;
  width = 100;
  height = 100;
  
  constructor() {
    // Auto-fail image loading in Node.js mock
    setTimeout(() => {
      if (this.onerror) this.onerror(new Error('Mock image'));
    }, 10);
  }
};

// Create mock canvas for testing
const mockCanvas: any = {
  clear: () => {},
  fill: () => {},
  circle: () => {},
  line: () => {},
  lines: () => {},
  rect: () => {},
  polygon: () => {},
  arc: () => {},
  ellipse: () => {},
  bezier: () => {},
  flush: () => {},
  captureFrame: () => {},
  blitLastFrame: () => {},
  getLastFrameTexture: () => null,
  blit: () => {},
  blitText: () => {},
  blitTexture: () => {},
  setRotation: () => {},
  setZoom: () => {},
  getWidth: () => 1280,
  getHeight: () => 720,
};

async function runVerification() {
  const eyesy = new EYESYImpl(1280, 720);
  eyesy.auto_clear = true;
  eyesy.knob1 = 0.5;
  eyesy.knob2 = 0.5;
  eyesy.knob3 = 0.5;
  eyesy.knob4 = 0.5;
  eyesy.knob5 = 0.2;

  // Generate some audio data
  const audioData = new Array(100).fill(0).map((_, i) => Math.sin(i * 0.1) * 10000);
  eyesy.audio_in = audioData;

  console.log('=== EXTENDED MODE VERIFICATION ===');
  console.log('Testing setup() and draw() for all modes...');
  console.log('');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const mode of modes) {
    try {
      const ModeClass = mode.mode;
      const instance = new ModeClass();
      
      // Test setup
      const setupResult = instance.setup(mockCanvas, eyesy);
      if (setupResult instanceof Promise) {
        await setupResult;
      }
      
      // Test draw (multiple times with different settings)
      for (let i = 0; i < 3; i++) {
        eyesy.knob1 = Math.random();
        eyesy.knob2 = Math.random();
        eyesy.trig = i % 2 === 0;
        eyesy.updateTime(0.016);
        instance.draw(mockCanvas, eyesy);
      }
      
      passed++;
    } catch (error) {
      failed++;
      failures.push(`${mode.name}: ${(error as Error).message}`);
    }
  }

  console.log('Results:');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('');

  if (failures.length > 0) {
    console.log('Failed modes:');
    failures.forEach(f => console.log(`  ❌ ${f}`));
    process.exit(1);
  } else {
    console.log(`✅ All ${passed} modes passed verification!`);
    process.exit(0);
  }
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});

