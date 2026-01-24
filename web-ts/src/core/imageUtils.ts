/**
 * Image loading utilities for EYESY modes
 * Provides pygame-like image loading API
 */
import { ImageLoader, LoadedImage as ILoadedImage, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, MAX_IMAGE_AREA } from './ImageLoader';
import { ModeCache } from './ModeCache';

// Re-export LoadedImage type for consumers
export type LoadedImage = ILoadedImage;

// Global image loader instance
const imageLoader = new ImageLoader();

/**
 * Set the ModeCache for the global image loader
 * This enables IndexedDB caching for improved load times
 */
export function setImageLoaderCache(cache: ModeCache): void {
  imageLoader.setModeCache(cache);
}

/**
 * Load images from a mode's Images/ folder
 * Mimics Python's glob.glob(eyesy.mode_root + '/Images/*.png')
 * 
 * In web environment, we need explicit image paths or a manifest.
 * This function tries to load numbered images (image0.png, image1.png, etc.)
 * or can accept explicit image paths.
 * 
 * @param modeRoot Path to mode folder (from eyesy.mode_root)
 * @param pattern Optional glob pattern (default: 'Images/*.png')
 * @returns Promise that resolves to array of LoadedImage objects
 */
export async function loadImages(
  modeRoot: string,
  pattern: string = 'Images/*.png'
): Promise<LoadedImage[]> {
  return imageLoader.loadImagesByPattern(pattern, modeRoot);
}

/**
 * Load a single image from a path
 * @param path Full path to image file
 * @returns Promise that resolves to LoadedImage
 */
export async function loadImage(path: string): Promise<LoadedImage> {
  return imageLoader.loadImage(path);
}

/**
 * Get a cached image by URL (if already loaded)
 * @param url Image URL
 * @returns LoadedImage if cached, undefined otherwise
 */
export function getCachedImage(url: string): LoadedImage | undefined {
  return imageLoader.getCachedImage(url);
}

/**
 * Dispose of all cached images (cleanup)
 */
export function disposeImages(): void {
  imageLoader.dispose();
}

/**
 * Convert a LoadedImage texture to an HTMLImageElement for use with canvas.blit()
 * Note: This creates a new image element from the texture's image source
 */
export function textureToImage(loadedImage: LoadedImage): HTMLImageElement {
  const img = new Image();
  if (loadedImage.texture.image) {
    img.src = (loadedImage.texture.image as HTMLImageElement).src;
  }
  return img;
}

/**
 * Helper to construct image paths from mode_root
 * @param modeRoot Mode root path (from eyesy.mode_root)
 * @param imageName Image filename (e.g., 'image0.png')
 * @returns Full path to image
 */
export function getImagePath(modeRoot: string, imageName: string): string {
  const basePath = modeRoot.endsWith('/') ? modeRoot : `${modeRoot}/`;
  return `${basePath}Images/${imageName}`;
}

/**
 * Check if an image size is within limits
 * @param width Image width
 * @param height Image height
 * @returns true if within limits, false otherwise
 */
export function isImageSizeValid(width: number, height: number): boolean {
  return width <= MAX_IMAGE_WIDTH && height <= MAX_IMAGE_HEIGHT && (width * height) <= MAX_IMAGE_AREA;
}

/**
 * Calculate scaled dimensions to fit within max size limits
 * @param width Original width
 * @param height Original height
 * @returns Scaled dimensions { width, height }
 */
export function calculateScaledDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_IMAGE_WIDTH && height <= MAX_IMAGE_HEIGHT) {
    return { width, height };
  }
  
  const scaleX = MAX_IMAGE_WIDTH / width;
  const scaleY = MAX_IMAGE_HEIGHT / height;
  const scale = Math.min(scaleX, scaleY);
  
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
  };
}

// Export max size constants for reference
export { MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, MAX_IMAGE_AREA };

