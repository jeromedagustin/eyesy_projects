/**
 * Audit script to identify modes that might appear blank at default settings
 * Checks for common issues that cause modes to not display anything
 */

import { modes, ModeInfo } from '../src/modes/index.js';

interface AuditResult {
  mode: ModeInfo;
  issues: string[];
  category: 'blank' | 'trigger-only' | 'needs-audio' | 'needs-images' | 'needs-webcam' | 'ok';
}

// Modes that only draw when triggered
const TRIGGER_ONLY_MODES = [
  'Ball of Mirrors',
  'Ball of Mirrors - Trails',
  'Marching Four',
  'MIDI',
  'Font Patterns',
  'Font Recedes',
  'Image + Circle',
  'Tiles',
];

// Modes that need audio input to show anything meaningful
const AUDIO_DEPENDENT_MODES = [
  'Classic Horizontal',
  'Classic Vertical', 
  'Scope',
  'Waveform',
  'Audio',
  'Dancing',
  'Breathing',
];

// Image-based modes
const IMAGE_MODES = [
  'Image -',
  'Slideshow',
  'Circle Scope - Image',
  'Dancing Circle - Image',
  'H Circles - Image',
  'Marching Four - Image',
];

// Webcam modes
const WEBCAM_MODES = [
  'Webcam',
];

function auditMode(mode: ModeInfo): AuditResult {
  const issues: string[] = [];
  const nameLower = mode.name.toLowerCase();
  const name = mode.name;
  
  // Check if it's a trigger-only mode
  const isTriggerOnly = TRIGGER_ONLY_MODES.some(t => name.includes(t)) || 
    mode.category === 'triggers';
  
  // Check if it's audio-dependent
  const isAudioDependent = AUDIO_DEPENDENT_MODES.some(a => name.includes(a));
  
  // Check if it needs images
  const isImageMode = IMAGE_MODES.some(i => name.includes(i)) || 
    nameLower.startsWith('image -');
  
  // Check if it needs webcam
  const isWebcamMode = WEBCAM_MODES.some(w => name.includes(w));
  
  // Determine category
  let category: AuditResult['category'] = 'ok';
  
  if (isWebcamMode) {
    category = 'needs-webcam';
    issues.push('Requires webcam permission');
  } else if (isImageMode) {
    category = 'needs-images';
    issues.push('Requires uploaded images');
  } else if (isTriggerOnly && !isAudioDependent) {
    category = 'trigger-only';
    issues.push('Only draws when triggered (trig=true)');
  } else if (isAudioDependent) {
    category = 'needs-audio';
    issues.push('Needs audio input to show meaningful visualization');
  }
  
  // Check for experimental modes
  if (mode.experimental) {
    issues.push('Marked as experimental');
  }
  
  return { mode, issues, category };
}

async function runAudit() {
  console.log('=== MODE BLANK AUDIT ===\n');
  console.log('Checking all modes for potential blank display issues...\n');
  
  const results: AuditResult[] = modes.map(auditMode);
  
  // Group by category
  const blankModes = results.filter(r => r.category === 'blank');
  const triggerOnlyModes = results.filter(r => r.category === 'trigger-only');
  const audioModes = results.filter(r => r.category === 'needs-audio');
  const imageModes = results.filter(r => r.category === 'needs-images');
  const webcamModes = results.filter(r => r.category === 'needs-webcam');
  const okModes = results.filter(r => r.category === 'ok');
  
  console.log('📊 SUMMARY:\n');
  console.log(`  ✅ OK (should show something by default): ${okModes.length}`);
  console.log(`  🎯 Trigger-only (need trigger to draw): ${triggerOnlyModes.length}`);
  console.log(`  🎵 Audio-dependent: ${audioModes.length}`);
  console.log(`  🖼️  Image modes (need uploads): ${imageModes.length}`);
  console.log(`  📹 Webcam modes (need permission): ${webcamModes.length}`);
  console.log(`  ❌ Potentially blank: ${blankModes.length}`);
  
  console.log('\n\n--- TRIGGER-ONLY MODES ---');
  console.log('These modes only draw when eyesy.trig is true:\n');
  triggerOnlyModes.forEach(r => {
    console.log(`  • ${r.mode.name} (${r.mode.id})`);
  });
  
  console.log('\n\n--- AUDIO-DEPENDENT MODES ---');
  console.log('These modes need audio input to show meaningful visualization:\n');
  audioModes.forEach(r => {
    console.log(`  • ${r.mode.name} (${r.mode.id})`);
  });
  
  console.log('\n\n--- IMAGE MODES ---');
  console.log('These modes require uploaded images:\n');
  imageModes.forEach(r => {
    console.log(`  • ${r.mode.name} (${r.mode.id})`);
  });
  
  console.log('\n\n--- WEBCAM MODES ---');
  console.log('These modes require webcam permission:\n');
  webcamModes.forEach(r => {
    console.log(`  • ${r.mode.name} (${r.mode.id})`);
  });
  
  console.log('\n\n--- OK MODES ---');
  console.log('These should display something by default:\n');
  okModes.forEach(r => {
    const exp = r.mode.experimental ? ' (experimental)' : '';
    console.log(`  • ${r.mode.name}${exp}`);
  });
  
  // Now let's actually test each mode by instantiating it
  console.log('\n\n=== DETAILED MODE CHECK ===\n');
  console.log('Testing mode instantiation and checking for issues...\n');
  
  // Create mock canvas and eyesy
  const mockCanvas = {
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
    blit: () => {},
    blitText: () => {},
    blitTexture: () => {},
    blitLastFrame: () => {},
    captureFrame: () => {},
    getLastFrameTexture: () => null,
    setRotation: () => {},
    setZoom: () => {},
    flush: () => {},
  };
  
  const mockEyesy = {
    knob1: 0.5,
    knob2: 0.5,
    knob3: 0.5,
    knob4: 0.5,
    knob5: 0.5,
    knob6: 0.0,
    knob7: 0.5,
    knob8: 0.45,
    xres: 1280,
    yres: 720,
    audio_in: new Float32Array(100).fill(0),
    audio_in_r: new Float32Array(100).fill(0),
    trig: false,
    audio_trig: false,
    auto_clear: true,
    bg_color: [0, 0, 0] as [number, number, number],
    mode_root: '/modes/test',
    time: 0,
    deltaTime: 0.016,
    color_picker: () => [255, 255, 255] as [number, number, number],
    color_picker_bg: () => {},
    color_picker_lfo: () => [255, 255, 255] as [number, number, number],
    updateAudio: () => {},
    updateTime: () => {},
  };
  
  const issues: { mode: string; error: string }[] = [];
  
  for (const modeInfo of modes) {
    try {
      const instance = new modeInfo.mode();
      
      // Try setup
      try {
        instance.setup(mockCanvas as any, mockEyesy as any);
      } catch (e: any) {
        issues.push({ mode: modeInfo.name, error: `setup() error: ${e.message}` });
        continue;
      }
      
      // Try draw
      try {
        instance.draw(mockCanvas as any, mockEyesy as any);
      } catch (e: any) {
        issues.push({ mode: modeInfo.name, error: `draw() error: ${e.message}` });
      }
    } catch (e: any) {
      issues.push({ mode: modeInfo.name, error: `instantiation error: ${e.message}` });
    }
  }
  
  if (issues.length > 0) {
    console.log('⚠️  MODES WITH ISSUES:\n');
    issues.forEach(i => {
      console.log(`  ❌ ${i.mode}: ${i.error}`);
    });
  } else {
    console.log('✅ All modes instantiate and run without errors.\n');
  }
  
  // List modes to manually check
  console.log('\n\n=== MODES TO MANUALLY VERIFY ===\n');
  console.log('These modes should be manually tested in the browser:\n');
  
  const manualCheck = okModes.filter(r => !r.mode.experimental);
  manualCheck.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.mode.name}`);
  });
}

// Mock browser APIs
(globalThis as any).Image = class MockImage {
  onload?: () => void;
  onerror?: () => void;
  src = '';
  width = 100;
  height = 100;
  constructor() {
    setTimeout(() => this.onerror?.(), 10);
  }
};

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        getContext: () => ({
          fillRect: () => {},
          fillText: () => {},
          measureText: () => ({ width: 100 }),
          font: '',
          fillStyle: '',
          textAlign: '',
          textBaseline: '',
        }),
        width: 100,
        height: 100,
      };
    }
    if (tag === 'video') {
      return {
        play: () => Promise.resolve(),
        srcObject: null,
        onloadedmetadata: null,
      };
    }
    return {};
  },
};

(globalThis as any).navigator = {
  mediaDevices: {
    getUserMedia: () => Promise.reject(new Error('Mock - no camera')),
  },
};

runAudit().catch(console.error);






