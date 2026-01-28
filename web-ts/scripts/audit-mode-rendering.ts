/**
 * Audit script to verify all modes render something on load
 * Tests each mode and checks if it actually produces visual output
 */

import { modes, ModeInfo } from '../src/modes/index.js';
import { EYESYImpl } from '../src/core/EYESY.js';
import { Canvas } from '../src/core/Canvas.js';
import * as THREE from 'three';

// Note: This script requires a browser-like environment with WebGL support
// Run with: npm run audit:mode-rendering
// Or in browser: import and call runAudit()

interface RenderingAuditResult {
  mode: ModeInfo;
  status: 'pass' | 'fail' | 'error' | 'needs-audio' | 'needs-images' | 'needs-webcam' | 'trigger-only';
  error?: string;
  objectCount: number;
  hasContent: boolean;
  issues: string[];
}

// Modes that require specific conditions to render
const TRIGGER_ONLY_MODES = new Set([
  't---ball-of-mirrors',
  't---ball-of-mirrors---trails',
  't---marching-four',
  't---midi',
  't---font-patterns',
  't---font-recedes',
  't---image--circle',
  't---tiles',
]);

const IMAGE_MODES = new Set([
  't---basic-image',
  't---image--circle',
  't---marching-four---image',
  's---circle-scope---image',
  's---dancing-circle---image',
  's---h-circles---image',
  's---spinning-discs',
]);

const WEBCAM_MODES = new Set([
  'u---webcam',
  'u---webcam-reactive',
]);

const AUDIO_DEPENDENT_MODES = new Set([
  's---classic-horizontal',
  's---classic-vertical',
  's---oscilloscope',
  's---waveform',
]);

async function auditMode(modeInfo: ModeInfo): Promise<RenderingAuditResult> {
  const result: RenderingAuditResult = {
    mode: modeInfo,
    status: 'pass',
    objectCount: 0,
    hasContent: false,
    issues: [],
  };

  // Check if mode requires special conditions
  if (WEBCAM_MODES.has(modeInfo.id)) {
    result.status = 'needs-webcam';
    result.issues.push('Requires webcam permission');
    return result;
  }

  if (IMAGE_MODES.has(modeInfo.id)) {
    result.status = 'needs-images';
    result.issues.push('Requires uploaded images');
    return result;
  }

  if (TRIGGER_ONLY_MODES.has(modeInfo.id)) {
    result.status = 'trigger-only';
    result.issues.push('Only draws when triggered');
    return result;
  }

  try {
    // Create real canvas and EYESY instances
    const canvasElement = document.createElement('canvas');
    canvasElement.width = 1280;
    canvasElement.height = 720;
    
    let canvas: Canvas;
    try {
      canvas = new Canvas(canvasElement);
    } catch (error: any) {
      // If Canvas creation fails (e.g., no WebGL), mark as error
      result.status = 'error';
      result.error = `Canvas creation failed: ${error.message}`;
      result.issues.push('WebGL not available or initialization failed');
      return result;
    }
    
    const eyesy = new EYESYImpl(1280, 720);
    
    // Set default values
    eyesy.knob1 = 0.5;
    eyesy.knob2 = 0.5;
    eyesy.knob3 = 0.5;
    eyesy.knob4 = 0.5;
    eyesy.knob5 = 0.5;
    eyesy.knob6 = 0.0;
    eyesy.knob7 = 0.5;
    eyesy.knob8 = 0.5;
    eyesy.auto_clear = true;
    eyesy.trig = false;
    
    // Generate mock audio data (sine wave)
    const audioData = new Float32Array(200);
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.sin(i * 0.1) * 10000; // Simulate audio input
    }
    eyesy.updateAudio(audioData);
    
    // Create mode instance
    const ModeClass = modeInfo.mode;
    const modeInstance = new ModeClass();
    
    // Run setup
    try {
      const setupResult = modeInstance.setup(canvas, eyesy);
      if (setupResult instanceof Promise) {
        await setupResult;
      }
    } catch (error: any) {
      result.status = 'error';
      result.error = `Setup failed: ${error.message}`;
      return result;
    }
    
    // Get scene reference
    const scene = canvas.getScene();
    
    // Clear canvas and get initial object count
    canvas.clear();
    canvas.flush(); // Ensure clear is processed
    const initialObjectCount = scene.children.length;
    
    // Run draw multiple times with different settings
    let totalObjectsAdded = 0;
    let maxObjects = 0;
    
    for (let i = 0; i < 5; i++) {
      // Vary knob values
      eyesy.knob1 = 0.2 + (i * 0.2);
      eyesy.knob2 = 0.3 + (i * 0.15);
      eyesy.knob3 = 0.4 + (i * 0.1);
      eyesy.trig = i % 2 === 0;
      eyesy.updateTime(0.016);
      
      // Clear before each draw
      canvas.clear();
      
      try {
        modeInstance.draw(canvas, eyesy);
      } catch (error: any) {
        result.status = 'error';
        result.error = `Draw failed: ${error.message}`;
        return result;
      }
      
      // Flush to ensure objects are added to scene
      canvas.flush();
      
      // Count objects in scene
      const currentObjectCount = scene.children.length;
      maxObjects = Math.max(maxObjects, currentObjectCount);
      
      // Check if any objects were added
      if (currentObjectCount > initialObjectCount) {
        totalObjectsAdded += (currentObjectCount - initialObjectCount);
      }
    }
    
    result.objectCount = maxObjects;
    result.hasContent = maxObjects > initialObjectCount;
    
    // Determine status
    if (!result.hasContent) {
      // Check if it's audio-dependent
      if (AUDIO_DEPENDENT_MODES.has(modeInfo.id)) {
        result.status = 'needs-audio';
        result.issues.push('Needs audio input to render');
      } else {
        result.status = 'fail';
        result.issues.push('No objects rendered to scene');
      }
    } else {
      result.status = 'pass';
    }
    
    // Clean up
    canvas.dispose();
    
  } catch (error: any) {
    result.status = 'error';
    result.error = `Unexpected error: ${error.message}`;
    if (error.stack) {
      result.issues.push(error.stack.split('\n')[0]);
    }
  }
  
  return result;
}

async function runAudit() {
  console.log('='.repeat(80));
  console.log('MODE RENDERING AUDIT');
  console.log('Verifying all modes render something on load');
  console.log('='.repeat(80));
  console.log();
  
  const results: RenderingAuditResult[] = [];
  const totalModes = modes.length;
  
  console.log(`Testing ${totalModes} modes...\n`);
  
  for (let i = 0; i < modes.length; i++) {
    const modeInfo = modes[i];
    process.stdout.write(`[${i + 1}/${totalModes}] ${modeInfo.name}... `);
    
    const result = await auditMode(modeInfo);
    results.push(result);
    
    // Print status
    const statusSymbols: Record<string, string> = {
      'pass': '✓',
      'fail': '✗',
      'error': '⚠',
      'needs-audio': '🎵',
      'needs-images': '🖼️',
      'needs-webcam': '📹',
      'trigger-only': '🎯',
    };
    
    const symbol = statusSymbols[result.status] || '?';
    const statusText = result.status.toUpperCase();
    
    if (result.status === 'pass') {
      console.log(`${symbol} PASS (${result.objectCount} objects)`);
    } else if (result.status === 'fail') {
      console.log(`${symbol} FAIL - ${result.issues.join(', ')}`);
    } else if (result.status === 'error') {
      console.log(`${symbol} ERROR - ${result.error}`);
    } else {
      console.log(`${symbol} ${statusText} - ${result.issues.join(', ')}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.status === 'error').length;
  const needsAudio = results.filter(r => r.status === 'needs-audio').length;
  const needsImages = results.filter(r => r.status === 'needs-images').length;
  const needsWebcam = results.filter(r => r.status === 'needs-webcam').length;
  const triggerOnly = results.filter(r => r.status === 'trigger-only').length;
  
  console.log(`Total modes: ${totalModes}`);
  console.log(`  ✓ Passing (render content): ${passed}`);
  console.log(`  ✗ Failing (no content): ${failed}`);
  console.log(`  ⚠ Errors: ${errors}`);
  console.log(`  🎵 Needs audio: ${needsAudio}`);
  console.log(`  🖼️  Needs images: ${needsImages}`);
  console.log(`  📹 Needs webcam: ${needsWebcam}`);
  console.log(`  🎯 Trigger-only: ${triggerOnly}`);
  console.log();
  
  // Detailed reports
  if (failed > 0) {
    console.log('='.repeat(80));
    console.log('FAILING MODES (No content rendered)');
    console.log('='.repeat(80));
    console.log();
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  ✗ ${r.mode.name} (${r.mode.id})`);
        console.log(`    Issues: ${r.issues.join(', ')}`);
        console.log(`    Objects in scene: ${r.objectCount}`);
        console.log();
      });
  }
  
  if (errors > 0) {
    console.log('='.repeat(80));
    console.log('ERROR MODES');
    console.log('='.repeat(80));
    console.log();
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`  ⚠ ${r.mode.name} (${r.mode.id})`);
        console.log(`    Error: ${r.error}`);
        if (r.issues.length > 0) {
          console.log(`    Details: ${r.issues.join(', ')}`);
        }
        console.log();
      });
  }
  
  // Modes that need special conditions
  if (needsAudio > 0) {
    console.log('='.repeat(80));
    console.log('AUDIO-DEPENDENT MODES');
    console.log('='.repeat(80));
    console.log('These modes need audio input to show meaningful visualization:\n');
    results
      .filter(r => r.status === 'needs-audio')
      .forEach(r => {
        console.log(`  🎵 ${r.mode.name}`);
      });
    console.log();
  }
  
  if (needsImages > 0) {
    console.log('='.repeat(80));
    console.log('IMAGE MODES');
    console.log('='.repeat(80));
    console.log('These modes require uploaded images:\n');
    results
      .filter(r => r.status === 'needs-images')
      .forEach(r => {
        console.log(`  🖼️  ${r.mode.name}`);
      });
    console.log();
  }
  
  if (needsWebcam > 0) {
    console.log('='.repeat(80));
    console.log('WEBCAM MODES');
    console.log('='.repeat(80));
    console.log('These modes require webcam permission:\n');
    results
      .filter(r => r.status === 'needs-webcam')
      .forEach(r => {
        console.log(`  📹 ${r.mode.name}`);
      });
    console.log();
  }
  
  if (triggerOnly > 0) {
    console.log('='.repeat(80));
    console.log('TRIGGER-ONLY MODES');
    console.log('='.repeat(80));
    console.log('These modes only draw when triggered:\n');
    results
      .filter(r => r.status === 'trigger-only')
      .forEach(r => {
        console.log(`  🎯 ${r.mode.name}`);
      });
    console.log();
  }
  
  // Success report
  if (passed > 0) {
    console.log('='.repeat(80));
    console.log('PASSING MODES');
    console.log('='.repeat(80));
    console.log(`These ${passed} modes successfully render content:\n`);
    
    // Group by category
    const byCategory = new Map<string, RenderingAuditResult[]>();
    results
      .filter(r => r.status === 'pass')
      .forEach(r => {
        const category = r.mode.category || 'unknown';
        if (!byCategory.has(category)) {
          byCategory.set(category, []);
        }
        byCategory.get(category)!.push(r);
      });
    
    for (const [category, modes] of byCategory.entries()) {
      console.log(`  ${category.toUpperCase()}: ${modes.length} modes`);
      modes.forEach(r => {
        console.log(`    ✓ ${r.mode.name} (${r.objectCount} objects)`);
      });
      console.log();
    }
  }
  
  console.log('='.repeat(80));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(80));
  
  // Exit with error code if there are failures
  if (failed > 0 || errors > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Check if we're in a browser environment with WebGL support
function hasWebGLSupport(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch (e) {
    return false;
  }
}

// Mock browser APIs for Node.js environment (if needed)
if (typeof document === 'undefined') {
  console.warn('⚠️  Running in Node.js environment - WebGL may not be available');
  console.warn('   For best results, run this script in a browser environment');
  console.warn('   Or use: npm run test:validate-modes for test-based validation\n');
  
  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 1280,
          height: 720,
          getContext: (type: string) => {
            if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
              // Return null to indicate WebGL is not available
              return null;
            }
            return {
              fillRect: () => {},
              clearRect: () => {},
              getImageData: () => ({ data: new Uint8ClampedArray(4) }),
              putImageData: () => {},
              drawImage: () => {},
              fillText: () => {},
              measureText: () => ({ width: 100 }),
              font: '',
              fillStyle: '',
              textAlign: '',
              textBaseline: '',
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high',
              createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
            };
          },
          toDataURL: () => 'data:image/png;base64,',
        };
      }
      return {};
    },
  };
  
  (global as any).Image = class MockImage {
    onload?: () => void;
    onerror?: () => void;
    src = '';
    width = 100;
    height = 100;
    constructor() {
      setTimeout(() => this.onerror?.(), 10);
    }
  };
  
  (global as any).navigator = {
    mediaDevices: {
      getUserMedia: () => Promise.reject(new Error('Mock - no camera')),
    },
  };
}

runAudit().catch((error) => {
  console.error('Audit failed:', error);
  process.exit(1);
});
