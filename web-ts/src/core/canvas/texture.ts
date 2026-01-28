/**
 * Texture operations helper for Canvas
 * Handles blit operations for images and textures
 */
import * as THREE from 'three';
import { isValidTexture } from './utils';

export interface TextureContext {
  width: number;
  height: number;
  foregroundGroup: THREE.Group;
  objects: THREE.Object3D[];
}

/**
 * Convert screen coordinates to Three.js coordinates
 */
function toThreeCoords(x: number, y: number, width: number, height: number): [number, number] {
  return [x - width / 2, -(y - height / 2)];
}

/**
 * Draw an image (blit) to the canvas
 */
export function blit(
  context: TextureContext,
  image: HTMLImageElement | ImageBitmap,
  x: number,
  y: number,
  width?: number,
  height?: number,
  alpha: number = 1.0,
  rotation: number = 0
): void {
  const targetWidth = width ?? image.width;
  const targetHeight = height ?? image.height;

  const [xPos, yPos] = toThreeCoords(x, y, context.width, context.height);

  // Validate image dimensions
  let imageWidth = 0;
  let imageHeight = 0;
  
  if (image instanceof HTMLImageElement) {
    imageWidth = image.naturalWidth || image.width || 0;
    imageHeight = image.naturalHeight || image.height || 0;
    if (!image.complete || imageWidth === 0 || imageHeight === 0) {
      console.warn('blit: Image not loaded or has invalid dimensions');
      return;
    }
  } else if (image instanceof ImageBitmap) {
    imageWidth = image.width;
    imageHeight = image.height;
    if (imageWidth === 0 || imageHeight === 0) {
      console.warn('blit: ImageBitmap has invalid dimensions');
      return;
    }
  } else {
    console.warn('blit: Invalid image type');
    return;
  }
  
  try {
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.flipY = false; // Match pygame's coordinate system

    // Validate texture before using it
    if (!isValidTexture(texture)) {
      console.warn('blit: Created texture is invalid, skipping');
      texture.dispose();
      return;
    }

    // Create plane geometry for the image
    const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: alpha,
      side: THREE.DoubleSide,
    });

    // Validate material was created successfully and has valid texture
    if (!material || !material.map || !isValidTexture(material.map)) {
      console.warn('blit: Material creation failed or has invalid texture');
      geometry.dispose();
      texture.dispose();
      if (material) material.dispose();
      return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply rotation if needed
    if (rotation !== 0) {
      mesh.rotation.z = (rotation * Math.PI) / 180;
    }
    
    mesh.position.set(xPos, yPos, 0);
    
    // Add to foreground group so it can be rotated/zoomed
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  } catch (error) {
    console.warn('blit: Error creating texture or mesh:', error);
  }
}

/**
 * Draw an image from a texture (for pre-loaded images)
 */
export function blitTexture(
  context: TextureContext,
  texture: THREE.Texture,
  x: number,
  y: number,
  width?: number,
  height?: number,
  alpha: number = 1.0,
  rotation: number = 0
): void {
  // Validate texture
  if (!texture || !texture.image) {
    console.warn('blitTexture: Invalid texture provided');
    return;
  }

  const targetWidth = width ?? texture.image?.width ?? 100;
  const targetHeight = height ?? texture.image?.height ?? 100;

  // Validate dimensions
  if (targetWidth <= 0 || targetHeight <= 0) {
    console.warn('blitTexture: Invalid dimensions', targetWidth, targetHeight);
    return;
  }

  const [xPos, yPos] = toThreeCoords(x, y, context.width, context.height);

  try {
    // Validate texture before cloning
    if (!isValidTexture(texture)) {
      console.warn('[Canvas] blitTexture: Invalid texture provided', {
        textureId: texture.uuid,
        imageType: texture.image?.constructor?.name,
        imageExists: !!texture.image,
      });
      return;
    }

    // Clone texture to avoid modifying the original
    let textureClone: THREE.Texture;
    try {
      textureClone = texture.clone();
    } catch (cloneError) {
      console.warn('blitTexture: Failed to clone texture:', cloneError);
      return;
    }
    
    // Validate cloned texture
    if (!isValidTexture(textureClone)) {
      console.warn('[Canvas] blitTexture: Cloned texture is invalid', {
        originalTextureId: texture.uuid,
        clonedTextureId: textureClone.uuid,
        imageType: textureClone.image?.constructor?.name,
      });
      textureClone.dispose();
      return;
    }
    
    textureClone.needsUpdate = true;
    textureClone.flipY = false;

    // Create plane geometry for the image
    const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
    const material = new THREE.MeshBasicMaterial({
      map: textureClone,
      transparent: true,
      opacity: alpha,
      side: THREE.DoubleSide,
    });

    // Validate material was created successfully and has valid texture
    if (!material || !material.map || !isValidTexture(material.map)) {
      console.warn('blitTexture: Material creation failed or has invalid texture');
      geometry.dispose();
      textureClone.dispose();
      if (material) material.dispose();
      return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply rotation if needed
    if (rotation !== 0) {
      mesh.rotation.z = (rotation * Math.PI) / 180;
    }
    
    mesh.position.set(xPos, yPos, 0);
    
    // Add to foreground group so it can be rotated/zoomed
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  } catch (error) {
    console.warn('blitTexture: Error creating texture mesh:', error);
  }
}

/**
 * Draw text using a pre-rendered texture (from FontRenderer)
 */
export function blitText(
  context: TextureContext,
  texture: THREE.Texture,
  x: number,
  y: number,
  centerX: boolean = false,
  centerY: boolean = false,
  alpha: number = 1.0
): void {
  // Validate texture
  if (!texture || !texture.image) {
    console.warn('blitText: Invalid texture provided');
    return;
  }

  const width = texture.image?.width ?? 100;
  const height = texture.image?.height ?? 100;

  // Validate dimensions
  if (width <= 0 || height <= 0) {
    console.warn('blitText: Invalid dimensions', width, height);
    return;
  }

  // Adjust position if centering
  const finalX = centerX ? x - width / 2 : x;
  const finalY = centerY ? y - height / 2 : y;

  const [xPos, yPos] = toThreeCoords(finalX, finalY, context.width, context.height);

  try {
    // Validate texture before cloning
    if (!isValidTexture(texture)) {
      console.warn('blitText: Invalid texture provided');
      return;
    }

    // Clone texture to avoid modifying the original
    let textureClone: THREE.Texture;
    try {
      textureClone = texture.clone();
    } catch (cloneError) {
      console.warn('blitText: Failed to clone texture:', cloneError);
      return;
    }
    
    // Validate cloned texture
    if (!isValidTexture(textureClone)) {
      console.warn('blitText: Cloned texture is invalid');
      textureClone.dispose();
      return;
    }
    
    // Validate texture one more time before setting needsUpdate
    if (!isValidTexture(textureClone)) {
      console.warn('blitText: Texture clone is invalid after cloning');
      textureClone.dispose();
      return;
    }

    textureClone.needsUpdate = true;
    // Don't override flipY - use the value from the original texture (FontRenderer sets it correctly)

    // Create plane geometry for the text
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: textureClone,
      transparent: true,
      opacity: alpha,
      side: THREE.DoubleSide,
    });

    // Validate material was created successfully
    if (!material || !material.map || !isValidTexture(material.map)) {
      console.warn('blitText: Material creation failed or has invalid texture');
      geometry.dispose();
      textureClone.dispose();
      if (material) material.dispose();
      return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xPos, yPos, 0);
    
    // Add to foreground group so it can be rotated/zoomed
    context.foregroundGroup.add(mesh);
    context.objects.push(mesh);
  } catch (error) {
    console.warn('blitText: Error creating texture mesh:', error);
  }
}

/**
 * Draw the previous frame as a texture (for trails/feedback effects)
 */
export function blitLastFrame(
  context: TextureContext,
  lastFrameTexture: THREE.Texture | null,
  x: number = 0,
  y: number = 0,
  width?: number,
  height?: number,
  alpha: number = 1.0,
  flipX: boolean = false
): void {
  if (!lastFrameTexture) {
    return; // No previous frame to blit
  }

  const targetWidth = width ?? context.width;
  const targetHeight = height ?? context.height;
  
  const [xPos, yPos] = toThreeCoords(x, y, context.width, context.height);
  
  // Create a plane geometry for the texture
  const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
  
  // Use the texture directly (it's read-only from the render target)
  const material = new THREE.MeshBasicMaterial({
    map: lastFrameTexture,
    transparent: true,
    opacity: alpha,
    side: THREE.DoubleSide,
  });
  
  // Apply horizontal flip if requested
  if (flipX) {
    material.map!.repeat.x = -1;
    material.map!.offset.x = 1;
  } else {
    // Reset to normal if not flipping
    material.map!.repeat.x = 1;
    material.map!.offset.x = 0;
  }
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(xPos, yPos, -0.5); // Behind current frame but in front of background
  
  // Add to foreground group so it can be rotated/zoomed
  context.foregroundGroup.add(mesh);
  context.objects.push(mesh);
}
