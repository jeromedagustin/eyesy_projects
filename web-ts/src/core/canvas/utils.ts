/**
 * Canvas utility functions
 */
import * as THREE from 'three';

/**
 * Validate that a texture is safe to use with WebGL
 * Returns false and logs details if invalid
 */
export function isValidTexture(texture: THREE.Texture | null | undefined, logDetails = false): boolean {
  if (!texture) {
    return false;
  }
  
  // Check if texture is disposed (check for uuid which should always exist)
  if ((texture as any).uuid === undefined) {
    return false;
  }
  
  // Check if texture has an image
  if (!texture.image) {
    return false;
  }
  
  // Validate canvas dimensions
  if (texture.image instanceof HTMLCanvasElement) {
    if (!Number.isFinite(texture.image.width) || !Number.isFinite(texture.image.height)) return false;
    if (texture.image.width === 0 || texture.image.height === 0) return false;
    // Ensure canvas has valid context
    // Use willReadFrequently: true since we're calling getImageData
    const ctx = texture.image.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    // Check if canvas is actually valid (not corrupted)
    try {
      const testData = ctx.getImageData(0, 0, 1, 1);
      if (!testData) return false;
    } catch (e) {
      return false;
    }
  }
  
  // Validate image element
  if (texture.image instanceof HTMLImageElement) {
    if (!texture.image.complete) return false;
    if (!Number.isFinite(texture.image.naturalWidth) || !Number.isFinite(texture.image.naturalHeight)) return false;
    if (texture.image.naturalWidth === 0 || texture.image.naturalHeight === 0) return false;
  }
  
  // Validate ImageBitmap
  if (texture.image instanceof ImageBitmap) {
    if (!Number.isFinite(texture.image.width) || !Number.isFinite(texture.image.height)) return false;
    if (texture.image.width === 0 || texture.image.height === 0) return false;
    // Check if ImageBitmap is closed
    if ((texture.image as any).closed) return false;
  }
  
  // Reject any image type that's not one of the supported types
  // WebGL only supports HTMLImageElement, HTMLCanvasElement, ImageBitmap, HTMLVideoElement
  // BUT: Render target textures are special - they don't have a standard image property
  // Check if this is a render target texture by checking if it's from a WebGLRenderTarget
  const isRenderTargetTexture = (texture as any).isRenderTargetTexture === true ||
                                 (texture.image && texture.image.constructor?.name === 'WebGLRenderTarget') ||
                                 // Render target textures often don't have an image property at all
                                 (!texture.image && texture.source && (texture.source as any).data);
  
  // For render target textures, we just need to check they have valid dimensions
  if (isRenderTargetTexture) {
    // Render target textures are valid if they have width/height properties
    const rtWidth = (texture as any).image?.width || (texture.source as any)?.data?.width || 0;
    const rtHeight = (texture as any).image?.height || (texture.source as any)?.data?.height || 0;
    if (rtWidth > 0 && rtHeight > 0 && rtWidth <= 16384 && rtHeight <= 16384) {
      return true; // Render target texture is valid
    }
    if (logDetails) {
      console.warn('[Canvas] isValidTexture: Render target texture has invalid dimensions', {
        width: rtWidth,
        height: rtHeight,
        textureId: texture.uuid
      });
    }
    return false;
  }
  
  if (!(texture.image instanceof HTMLCanvasElement) &&
      !(texture.image instanceof HTMLImageElement) &&
      !(texture.image instanceof ImageBitmap) &&
      !(texture.image instanceof HTMLVideoElement)) {
    if (logDetails) {
      console.warn('[Canvas] isValidTexture: Unsupported image type', {
        type: texture.image?.constructor?.name,
        textureId: texture.uuid,
        hasImage: !!texture.image
      });
    }
    return false;
  }
  
  // Additional check: ensure texture dimensions are reasonable for WebGL
  let texWidth = 0;
  let texHeight = 0;
  
  if (texture.image instanceof HTMLCanvasElement) {
    texWidth = texture.image.width;
    texHeight = texture.image.height;
  } else if (texture.image instanceof HTMLImageElement) {
    texWidth = texture.image.naturalWidth;
    texHeight = texture.image.naturalHeight;
  } else if (texture.image instanceof ImageBitmap) {
    texWidth = texture.image.width;
    texHeight = texture.image.height;
  } else if (texture.image instanceof HTMLVideoElement) {
    texWidth = texture.image.videoWidth;
    texHeight = texture.image.videoHeight;
  }
  
  // Validate reasonable texture dimensions (WebGL has limits, typically 16384)
  if (texWidth > 16384 || texHeight > 16384) {
    if (logDetails) {
      console.warn('isValidTexture: Texture dimensions exceed WebGL limits', texWidth, texHeight);
    }
    return false;
  }
  
  // Ensure dimensions are positive integers
  if (!Number.isInteger(texWidth) || !Number.isInteger(texHeight) || texWidth <= 0 || texHeight <= 0) {
    if (logDetails) {
      console.warn('isValidTexture: Invalid texture dimensions', texWidth, texHeight);
    }
    return false;
  }
  
  // Validate texture format and type are valid WebGL constants
  // Three.js uses these internally, but we should check they're reasonable
  if (texture.format !== undefined && texture.format !== null) {
    const validFormats = [
      THREE.RGBAFormat,
      THREE.RGBFormat,
      THREE.AlphaFormat,
      THREE.LuminanceFormat,
      THREE.LuminanceAlphaFormat,
      THREE.RedFormat,
      THREE.RGFormat,
      THREE.RGBAIntegerFormat,
      THREE.RGBIntegerFormat,
      THREE.RedIntegerFormat,
      THREE.RGIntegerFormat,
      THREE.DepthFormat,
      THREE.DepthStencilFormat,
    ];
    if (!validFormats.includes(texture.format)) {
      if (logDetails) {
        console.warn('isValidTexture: Invalid texture format', texture.format, texture.uuid);
      }
      return false;
    }
  }
  
  if (texture.type !== undefined && texture.type !== null) {
    const validTypes = [
      THREE.UnsignedByteType,
      THREE.ByteType,
      THREE.ShortType,
      THREE.UnsignedShortType,
      THREE.IntType,
      THREE.UnsignedIntType,
      THREE.FloatType,
      THREE.HalfFloatType,
      THREE.UnsignedShort4444Type,
      THREE.UnsignedShort5551Type,
      THREE.UnsignedShort565Type,
      THREE.UnsignedInt248Type,
    ];
    if (!validTypes.includes(texture.type)) {
      if (logDetails) {
        console.warn('isValidTexture: Invalid texture type', texture.type, texture.uuid);
      }
      return false;
    }
  }
  
  return true;
}
