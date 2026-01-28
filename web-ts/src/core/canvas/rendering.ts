/**
 * Rendering operations helper for Canvas
 * Handles rendering to screen, render targets, and texture blending
 */
import * as THREE from 'three';
import { isValidTexture } from './utils';

export interface RenderingContext {
  width: number;
  height: number;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  customCamera: THREE.Camera | null;
  objects: THREE.Object3D[];
  effectsRenderTarget: THREE.WebGLRenderTarget | null;
  setEffectsRenderTarget: (target: THREE.WebGLRenderTarget | null) => void;
  cleanupInvalidTextures: () => boolean;
}

/**
 * Get the active camera (custom camera if set, otherwise default)
 */
function getActiveCamera(context: RenderingContext): THREE.Camera {
  return context.customCamera || context.camera;
}

/**
 * Force a render (useful for end of frame)
 */
export function flush(context: RenderingContext): void {
  // Clean up invalid textures before rendering
  context.cleanupInvalidTextures();
  
  try {
    const activeCamera = getActiveCamera(context);
    context.renderer.render(context.scene, activeCamera);
  } catch (error) {
    // Only log errors in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.error('[Canvas] flush: Error during render:', error);
    }
    // Run cleanup again after error
    context.cleanupInvalidTextures();
  }
}

/**
 * Render scene to a render target (for effects processing)
 */
export function renderToRenderTarget(
  context: RenderingContext,
  targetWidth?: number,
  targetHeight?: number
): THREE.Texture | null {
  const width = targetWidth ?? context.width;
  const height = targetHeight ?? context.height;
  
  // Get current render target (may be null on first call)
  let currentRenderTarget = context.effectsRenderTarget;
  
  if (!currentRenderTarget) {
    const newTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    context.setEffectsRenderTarget(newTarget);
    // Use the target we just created (context.effectsRenderTarget is a snapshot, so use newTarget directly)
    currentRenderTarget = newTarget;
    if (!currentRenderTarget) {
      console.error('[Canvas] renderToRenderTarget: Failed to set render target');
      return null;
    }
  } else if (currentRenderTarget.width !== width || currentRenderTarget.height !== height) {
    // Resize render target if dimensions don't match
    context.effectsRenderTarget.setSize(width, height);
  }

  const activeCamera = getActiveCamera(context);
  
  // Temporarily adjust camera for render target size if different
  let oldLeft: number | undefined;
  let oldRight: number | undefined;
  let oldTop: number | undefined;
  let oldBottom: number | undefined;
  let oldAspect: number | undefined;
  
  if (activeCamera === context.camera && activeCamera instanceof THREE.OrthographicCamera) {
    oldLeft = context.camera.left;
    oldRight = context.camera.right;
    oldTop = context.camera.top;
    oldBottom = context.camera.bottom;
    
    if (width !== context.width || height !== context.height) {
      context.camera.left = -width / 2;
      context.camera.right = width / 2;
      context.camera.top = height / 2;
      context.camera.bottom = -height / 2;
      context.camera.updateProjectionMatrix();
    }
  } else if (activeCamera instanceof THREE.PerspectiveCamera) {
    oldAspect = activeCamera.aspect;
    if (width !== context.width || height !== context.height) {
      const aspect = width / height;
      activeCamera.aspect = aspect;
      activeCamera.updateProjectionMatrix();
    }
  }

  // Render current scene to render target using the active camera
  // Safety check: ensure render target exists before rendering
  if (!currentRenderTarget) {
    console.warn('[Canvas] renderToRenderTarget: Render target is null, cannot render');
    return null;
  }
  
  // CRITICAL: Ensure no render target is active before we start
  // This prevents feedback loops when the scene might reference textures from render targets
  const oldRenderTarget = context.renderer.getRenderTarget();
  if (oldRenderTarget === currentRenderTarget) {
    // Already rendering to this target - this would cause a feedback loop
    console.warn('[Canvas] renderToRenderTarget: Attempted to render to already active render target');
    context.renderer.setRenderTarget(null);
  }
  
  context.renderer.setRenderTarget(currentRenderTarget);
  context.renderer.clear();
  context.renderer.render(context.scene, activeCamera);
  
  // CRITICAL: Unbind render target immediately after rendering
  // This prevents feedback loops when the texture is used later
  context.renderer.setRenderTarget(oldRenderTarget);

  // Restore camera if we changed it
  if (activeCamera === context.camera && activeCamera instanceof THREE.OrthographicCamera && 
      oldLeft !== undefined && oldRight !== undefined && oldTop !== undefined && oldBottom !== undefined) {
    if (width !== context.width || height !== context.height) {
      context.camera.left = oldLeft;
      context.camera.right = oldRight;
      context.camera.top = oldTop;
      context.camera.bottom = oldBottom;
      context.camera.updateProjectionMatrix();
    }
  } else if (activeCamera instanceof THREE.PerspectiveCamera && oldAspect !== undefined) {
    if (width !== context.width || height !== context.height) {
      activeCamera.aspect = oldAspect;
      activeCamera.updateProjectionMatrix();
    }
  }

  // Safety check: ensure render target exists before accessing texture
  if (!currentRenderTarget) {
    console.warn('[Canvas] renderToRenderTarget: Render target is null');
    return null;
  }
  
  // CRITICAL: Ensure render target is fully unbound before accessing its texture
  // This prevents WebGL feedback loop errors
  const activeRenderTarget = context.renderer.getRenderTarget();
  if (activeRenderTarget === currentRenderTarget) {
    context.renderer.setRenderTarget(null);
  }
  
  const texture = currentRenderTarget.texture;
  if (!texture) {
    console.warn('[Canvas] renderToRenderTarget: No texture from render target');
    return null;
  }
  
  texture.needsUpdate = true;
  texture.flipY = false;
  return texture;
}

/**
 * Render a texture to the canvas (for post-effects)
 */
export function renderTexture(
  context: RenderingContext,
  clear: () => void,
  texture: THREE.Texture
): void {
  if (!isValidTexture(texture)) {
    console.warn('[Canvas] renderTexture: Invalid texture provided');
    return;
  }

  // Clear existing objects
  clear();

  // Create a fullscreen quad with the texture
  const geometry = new THREE.PlaneGeometry(context.width, context.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  
  context.scene.add(mesh);
  context.objects.push(mesh);
}

/**
 * Render a texture directly to the screen (bypasses scene)
 */
export function renderTextureToScreen(
  context: RenderingContext,
  texture: THREE.Texture
): void {
  if (!texture) {
    console.warn('[Canvas] renderTextureToScreen: Texture is null');
    return;
  }
  
  if (!texture.uuid) {
    console.warn('[Canvas] renderTextureToScreen: Texture has no uuid (disposed?)');
    return;
  }

  // CRITICAL: Ensure no render target is active before using texture
  // This prevents WebGL feedback loop errors (GL_INVALID_OPERATION)
  const currentRenderTarget = context.renderer.getRenderTarget();
  if (currentRenderTarget) {
    // Check if texture is from the active render target - this would cause a feedback loop
    if (currentRenderTarget.texture === texture) {
      console.warn('[Canvas] renderTextureToScreen: Texture is from active render target, unbinding first');
    }
    context.renderer.setRenderTarget(null);
  }

  texture.needsUpdate = true;
  texture.flipY = false;

  // Create a fullscreen quad with the texture
  const geometry = new THREE.PlaneGeometry(context.width, context.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  
  // Create a temporary scene for rendering
  const tempScene = new THREE.Scene();
  tempScene.add(mesh);
  
  // Render directly to screen
  const oldRenderTarget = context.renderer.getRenderTarget();
  context.renderer.setRenderTarget(null);
  context.renderer.clearColor();
  context.renderer.clear(true, true, true);
  context.renderer.render(tempScene, context.camera);
  context.renderer.setRenderTarget(oldRenderTarget);
  
  // Clean up temporary geometry and material
  geometry.dispose();
  material.dispose();
}

/**
 * Blend two textures together and render to screen
 */
export function renderBlendedTextures(
  context: RenderingContext,
  originalTexture: THREE.Texture,
  processedTexture: THREE.Texture,
  mix: number
): void {
  if (!originalTexture || !processedTexture) {
    console.warn('[Canvas] renderBlendedTextures: Missing textures');
    return;
  }

  // CRITICAL: Ensure no render target is active before using textures
  // This prevents WebGL feedback loop errors (GL_INVALID_OPERATION)
  const currentRenderTarget = context.renderer.getRenderTarget();
  if (currentRenderTarget) {
    // Check if either texture is from the active render target - this would cause a feedback loop
    if (currentRenderTarget.texture === originalTexture || currentRenderTarget.texture === processedTexture) {
      console.warn('[Canvas] renderBlendedTextures: Texture is from active render target, unbinding first');
    }
    context.renderer.setRenderTarget(null);
  }

  // Ensure textures are updated
  originalTexture.needsUpdate = true;
  originalTexture.flipY = false;
  processedTexture.needsUpdate = true;
  processedTexture.flipY = false;

  // Create shader material for blending
  const blendMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tOriginal: { value: originalTexture },
      tProcessed: { value: processedTexture },
      mixAmount: { value: mix },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tOriginal;
      uniform sampler2D tProcessed;
      uniform float mixAmount;
      varying vec2 vUv;
      void main() {
        vec4 original = texture2D(tOriginal, vUv);
        vec4 processed = texture2D(tProcessed, vUv);
        gl_FragColor = mix(original, processed, mixAmount);
      }
    `,
  });

  // Create fullscreen quad
  const geometry = new THREE.PlaneGeometry(context.width, context.height);
  const mesh = new THREE.Mesh(geometry, blendMaterial);
  mesh.position.set(0, 0, 0);
  
  // Create temporary scene
  const tempScene = new THREE.Scene();
  tempScene.add(mesh);
  
  // Render to screen
  const oldRenderTarget = context.renderer.getRenderTarget();
  context.renderer.setRenderTarget(null);
  context.renderer.clearColor();
  context.renderer.clear(true, true, true);
  context.renderer.render(tempScene, context.camera);
  context.renderer.setRenderTarget(oldRenderTarget);
  
  // Clean up
  geometry.dispose();
  blendMaterial.dispose();
}

/**
 * Capture the current canvas as a data URL (for screenshots)
 */
export function captureScreenshot(
  context: RenderingContext
): string {
  const canvas = context.renderer.domElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }
  
  // Force a render to make sure we capture the current state
  context.renderer.render(context.scene, context.camera);
  
  // For WebGL, we need to read pixels from the WebGL context
  const gl = context.renderer.getContext();
  if (!gl) {
    throw new Error('WebGL context not found');
  }
  
  // Create a 2D canvas to hold the image data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = context.width;
  tempCanvas.height = context.height;
  // Use willReadFrequently: true since we're using putImageData (which internally uses getImageData)
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not create 2D canvas context');
  }
  
  // Read pixels from WebGL canvas
  const pixels = new Uint8Array(context.width * context.height * 4);
  gl.readPixels(0, 0, context.width, context.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  
  // WebGL reads from bottom-left, but canvas expects top-left
  // So we need to flip the image vertically
  const imageData = ctx.createImageData(context.width, context.height);
  for (let y = 0; y < context.height; y++) {
    for (let x = 0; x < context.width; x++) {
      const srcIndex = ((context.height - 1 - y) * context.width + x) * 4;
      const dstIndex = (y * context.width + x) * 4;
      imageData.data[dstIndex] = pixels[srcIndex];     // R
      imageData.data[dstIndex + 1] = pixels[srcIndex + 1]; // G
      imageData.data[dstIndex + 2] = pixels[srcIndex + 2]; // B
      imageData.data[dstIndex + 3] = pixels[srcIndex + 3]; // A
    }
  }
  
  // Put the image data on the 2D canvas
  ctx.putImageData(imageData, 0, 0);
  
  // Return as data URL
  return tempCanvas.toDataURL('image/png');
}
