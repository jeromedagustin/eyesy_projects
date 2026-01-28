/**
 * Frame capture operations helper for Canvas
 * Handles capturing frames to textures for feedback/trails effects
 */
import * as THREE from 'three';
import { isValidTexture } from './utils';

export interface FrameCaptureContext {
  width: number;
  height: number;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  foregroundGroup: THREE.Group;
  renderTarget: THREE.WebGLRenderTarget | null;
  setRenderTarget: (target: THREE.WebGLRenderTarget | null) => void;
  lastFrameTexture: THREE.Texture | null;
  setLastFrameTexture: (texture: THREE.Texture | null) => void;
  cleanupInvalidTextures: () => boolean;
  isValidTexture: (texture: THREE.Texture | null | undefined, logDetails?: boolean) => boolean;
}

/**
 * Capture the current frame to a texture (for feedback/trails effects)
 */
export function captureFrame(context: FrameCaptureContext): void {
  // CRITICAL: Ensure no render target is active before creating/using frame capture render target
  // This prevents feedback loops
  const currentRenderTarget = context.renderer.getRenderTarget();
  if (currentRenderTarget) {
    context.renderer.setRenderTarget(null);
  }
  
  if (!context.renderTarget) {
    context.setRenderTarget(new THREE.WebGLRenderTarget(context.width, context.height));
  }
  
  // Double-check render target was created
  if (!context.renderTarget) {
    console.warn('[Canvas] captureFrame: Failed to create render target');
    return;
  }
  
  // Clean up any meshes with invalid textures before rendering
  let cleanupCount = 0;
  while (context.cleanupInvalidTextures() && cleanupCount < 3) {
    cleanupCount++;
  }
  
  // Render the current scene to the render target
  try {
    context.renderer.setRenderTarget(context.renderTarget!);
    
    // Final validation pass before render
    context.cleanupInvalidTextures();
    
      // Final safety check: ensure all textures are valid before render
      let hasInvalidTextures = false;
      context.foregroundGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material;
          if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
            if (!context.isValidTexture(mat.map)) {
              console.error('[Canvas] captureFrame: Found invalid texture right before render, removing', {
                meshId: obj.uuid,
                textureId: mat.map.uuid
              });
              try {
                mat.map.dispose();
              } catch (e) {
                // Already disposed
              }
              mat.map = null;
              hasInvalidTextures = true;
            }
          }
        }
      });
      
      if (hasInvalidTextures) {
        console.warn('[Canvas] captureFrame: Removed invalid textures, retrying render');
      }
    
    try {
      context.renderer.render(context.scene, context.camera);
    } catch (renderError) {
      console.error('[Canvas] captureFrame: WebGL render error:', renderError);
      throw renderError;
    }
    context.renderer.setRenderTarget(null);
    
    // Validate the captured texture before storing
    if (context.renderTarget && context.renderTarget.texture) {
      const isValid = context.renderTarget.width > 0 && 
                      context.renderTarget.height > 0 &&
                      context.renderTarget.width <= 16384 &&
                      context.renderTarget.height <= 16384;
      
      if (isValid) {
        context.setLastFrameTexture(context.renderTarget.texture);
      } else {
        console.warn('captureFrame: Render target has invalid dimensions', {
          width: context.renderTarget.width,
          height: context.renderTarget.height
        });
        context.setLastFrameTexture(null);
      }
    } else {
      console.warn('captureFrame: No render target or texture available');
      context.setLastFrameTexture(null);
    }
  } catch (error) {
    console.error('[Canvas] captureFrame: Error during render:', error);
    context.renderer.setRenderTarget(null);
    context.setLastFrameTexture(null);
    // Run cleanup again after error
    context.cleanupInvalidTextures();
  }
}

/**
 * Get the current rendered frame as a texture (for post-effects)
 */
export function getCurrentFrameTexture(
  context: FrameCaptureContext
): THREE.Texture | null {
  if (!context.renderTarget) {
    context.setRenderTarget(new THREE.WebGLRenderTarget(context.width, context.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    }));
  }

  // Ensure render target is the right size
  if (context.renderTarget!.width !== context.width || context.renderTarget!.height !== context.height) {
    context.renderTarget!.setSize(context.width, context.height);
  }

  // Render current scene to render target
  const oldRenderTarget = context.renderer.getRenderTarget();
  context.renderer.setRenderTarget(context.renderTarget!);
  context.renderer.clear(); // Clear to ensure we get a clean capture
  context.renderer.render(context.scene, context.camera);
  context.renderer.setRenderTarget(oldRenderTarget);

  // Mark texture as updated
  const texture = context.renderTarget!.texture;
  texture.needsUpdate = true;
  texture.flipY = false; // Render targets don't need flipping

  // Return the texture (don't clone - caller should handle disposal)
  return texture;
}

/**
 * Get the last captured frame texture (for transitions)
 */
export function getLastFrameTexture(
  context: FrameCaptureContext
): THREE.Texture | null {
  if (!context.isValidTexture(context.lastFrameTexture)) {
    return null;
  }
  // Clone the texture to avoid modifying the original
  try {
    const cloned = context.lastFrameTexture!.clone();
    if (context.isValidTexture(cloned)) {
      cloned.needsUpdate = true;
      return cloned;
    } else {
      cloned.dispose();
      return null;
    }
  } catch (error) {
    console.warn('getLastFrameTexture: Failed to clone texture:', error);
    return null;
  }
}
