/**
 * Test setup - creates mock canvas and EYESY objects
 */
import { EYESYImpl } from '../core/EYESY';
import { Canvas } from '../core/Canvas';
import * as THREE from 'three';

// Mock WebGL context for Three.js in jsdom
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(contextType: any, ...args: any[]): any {
  if (contextType === '2d') {
    // Mock 2D context for font rendering
    return {
      canvas: this,
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
      fillStyle: '',
      imageSmoothingEnabled: true,
      measureText: (text: string) => ({
        width: text.length * 10,
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 2
      }),
      fillText: () => {},
      clearRect: () => {},
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      arc: () => {},
      rect: () => {},
      clip: () => {},
      setTransform: () => {},
      transform: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      createLinearGradient: () => ({} as CanvasGradient),
      createRadialGradient: () => ({} as CanvasGradient),
      createPattern: () => ({} as CanvasPattern),
      isPointInPath: () => false,
      isPointInStroke: () => false,
    };
  }
  if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
    // Create a comprehensive mock WebGL context for Three.js
    const mockBuffer = {} as WebGLBuffer;
    const mockProgram = {} as WebGLProgram;
    const mockShader = {} as WebGLShader;
    const mockTexture = {} as WebGLTexture;
    const mockFramebuffer = {} as WebGLFramebuffer;
    const mockRenderbuffer = {} as WebGLRenderbuffer;
    
    const mockContext = {
      // Constants
      BLEND: 0x0BE2,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      ARRAY_BUFFER: 0x8892,
      STATIC_DRAW: 0x88E4,
      DYNAMIC_DRAW: 0x88E8,
      TRIANGLE_STRIP: 0x0005,
      TRIANGLE_FAN: 0x0006,
      VERTEX_SHADER: 0x8B31,
      FRAGMENT_SHADER: 0x8B30,
      LINK_STATUS: 0x8B82,
      COMPILE_STATUS: 0x8B81,
      COLOR_BUFFER_BIT: 0x00004000,
      TEXTURE_2D: 0x0DE1,
      FRAMEBUFFER: 0x8D40,
      RENDERBUFFER: 0x8D41,
      
      // State
      canvas: this,
      
      // Methods
      viewport: () => {},
      enable: () => {},
      disable: () => {},
      blendFunc: () => {},
      clearColor: () => {},
      clear: () => {},
      getParameter: (param: number) => {
        // Return proper values for parameters Three.js needs
        if (param === 0x1F00) { // VERSION
          return 'WebGL 2.0';
        }
        if (param === 0x1F01) { // VENDOR
          return 'Mock Vendor';
        }
        if (param === 0x1F02) { // RENDERER
          return 'Mock Renderer';
        }
        if (param === 0x84E8) { // MAX_TEXTURE_SIZE
          return 4096;
        }
        if (param === 0x84E2) { // MAX_VIEWPORT_DIMS
          return [4096, 4096];
        }
        if (param === 0x8B4C) { // MAX_VERTEX_ATTRIBS
          return 16;
        }
        if (param === 0x8872) { // MAX_VERTEX_UNIFORM_VECTORS
          return 1024;
        }
        if (param === 0x8DFD) { // MAX_FRAGMENT_UNIFORM_VECTORS
          return 1024;
        }
        if (param === 0x8872) { // MAX_VARYING_VECTORS
          return 30;
        }
        return null;
      },
      
      // Buffer methods
      createBuffer: () => mockBuffer,
      bindBuffer: () => {},
      bufferData: () => {},
      deleteBuffer: () => {},
      
      // Program methods
      createProgram: () => mockProgram,
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true,
      getProgramInfoLog: () => '',
      deleteProgram: () => {},
      useProgram: () => {},
      
      // Shader methods
      createShader: () => mockShader,
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => true,
      getShaderInfoLog: () => '',
      deleteShader: () => {},
      
      // Uniform and attribute methods
      getUniformLocation: () => ({} as WebGLUniformLocation),
      uniform1f: () => {},
      uniform2f: () => {},
      uniform3f: () => {},
      uniform4f: () => {},
      getAttribLocation: () => 0,
      enableVertexAttribArray: () => {},
      disableVertexAttribArray: () => {},
      vertexAttribPointer: () => {},
      
      // Texture methods
      createTexture: () => mockTexture,
      bindTexture: () => {},
      texImage2D: () => {},
      deleteTexture: () => {},
      
      // Framebuffer methods
      createFramebuffer: () => mockFramebuffer,
      bindFramebuffer: () => {},
      framebufferTexture2D: () => {},
      deleteFramebuffer: () => {},
      
      // Renderbuffer methods
      createRenderbuffer: () => mockRenderbuffer,
      bindRenderbuffer: () => {},
      renderbufferStorage: () => {},
      deleteRenderbuffer: () => {},
      
      // Draw methods
      drawArrays: () => {},
      drawElements: () => {},
      
      // Additional methods Three.js might need
      pixelStorei: () => {},
      activeTexture: () => {},
      generateMipmap: () => {},
      texParameteri: () => {},
      texParameterf: () => {},
      getExtension: (name: string) => {
        // Return mock objects for common extensions Three.js might request
        if (name === 'WEBGL_lose_context') {
          return {
            loseContext: () => {},
            restoreContext: () => {},
          };
        }
        return null;
      },
      getSupportedExtensions: () => ['WEBGL_lose_context'],
      isContextLost: () => false,
      getShaderPrecisionFormat: () => ({
        rangeMin: 127,
        rangeMax: 127,
        precision: 23,
      }),
      HIGH_FLOAT: 0x8DF0,
      checkFramebufferStatus: () => 0x8CD5, // FRAMEBUFFER_COMPLETE
      scissor: () => {},
      colorMask: () => {},
      depthMask: () => {},
      stencilMask: () => {},
      cullFace: () => {},
      frontFace: () => {},
      lineWidth: () => {},
      polygonOffset: () => {},
      hint: () => {},
    } as any as WebGLRenderingContext;
    
    return mockContext;
  }
  // Fall back to original for other context types
  if (originalGetContext) {
    return originalGetContext.call(this, contextType, ...args);
  }
  return null;
};

// Mock ImageBitmap for jsdom environment
if (typeof ImageBitmap === 'undefined') {
  (global as any).ImageBitmap = class MockImageBitmap {
    width: number;
    height: number;
    constructor(width: number = 1280, height: number = 720) {
      this.width = width;
      this.height = height;
    }
    close(): void {}
  };
}

// Create a mock canvas element
export function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  return canvas;
}

// Create a mock EYESY instance
export function createMockEYESY(): EYESYImpl {
  const canvas = createMockCanvas();
  const eyesy = new EYESYImpl(canvas.width, canvas.height);
  
  // Initialize with default values
  eyesy.knob1 = 0.5;
  eyesy.knob2 = 0.5;
  eyesy.knob3 = 0.5;
  eyesy.knob4 = 0.5;
  eyesy.knob5 = 0.5;
  eyesy.knob6 = 0.0; // Web-only: Rotation (0°)
  eyesy.knob7 = 0.5; // Web-only: Zoom (default/1.0x)
  eyesy.knob8 = 0.5; // Web-only: Animation Speed (normal/1.0x)
  eyesy.midi_notes = new Array(128).fill(false);
  eyesy.midi_note_new = false;
  eyesy.trig = false;
  eyesy.auto_clear = true;
  
  // Generate mock audio data
  const audioData = new Float32Array(200);
  for (let i = 0; i < audioData.length; i++) {
    audioData[i] = Math.sin(i * 0.1) * 0.5;
  }
  eyesy.updateAudio(audioData);
  
  return eyesy;
}

// Create a mock Canvas wrapper
export function createMockCanvasWrapper(): Canvas {
  const canvas = createMockCanvas();
  let lastFrameTexture: THREE.Texture | null = null;
  
  try {
    return new Canvas(canvas);
  } catch (error) {
    // If Three.js fails to initialize (e.g., in test environment),
    // create a minimal mock that implements the Canvas interface
    const mockTexture = new THREE.CanvasTexture(canvas);
    return {
      fill: () => {},
      circle: () => {},
      line: () => {},
      lines: () => {},
      rect: () => {},
      polygon: () => {},
      ellipse: () => {},
      arc: () => {},
      bezier: () => {},
      setRotation: () => {},
      setZoom: () => {},
      setCustomCamera: () => null,
      clear: () => {},
      captureFrame: () => {
        // Store a mock texture
        lastFrameTexture = mockTexture;
      },
      getLastFrameTexture: () => {
        return lastFrameTexture;
      },
      blitLastFrame: () => {},
      blit: () => {},
      blitTexture: () => {},
      blitText: () => {},
      flush: () => {},
      getWidth: () => 1280,
      getHeight: () => 720,
      getScene: () => {
        // Return a proper mock scene for 3D modes
        return {
          add: () => {},
          remove: () => {},
          background: null,
        } as any;
      },
      getRenderer: () => {
        // Return a minimal mock renderer for 3D modes
        return {
          getContext: () => ({} as any),
          setSize: () => {},
          render: () => {},
          setClearColor: () => {},
        } as any;
      },
    } as any as Canvas;
  }
}

