/**
 * Image loading utility for EYESY modes
 * Loads images from mode Images/ folders and converts them to Three.js textures
 * Uses IndexedDB caching for improved load times
 */
import * as THREE from 'three';
import { ModeCache } from './ModeCache';

export interface LoadedImage {
  texture: THREE.Texture;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

// Maximum image dimensions (for performance and memory management)
// Images larger than this will be automatically scaled down
export const MAX_IMAGE_WIDTH = 2048;
export const MAX_IMAGE_HEIGHT = 2048;
export const MAX_IMAGE_AREA = MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT; // 4,194,304 pixels

export class ImageLoader {
  private imageCache: Map<string, LoadedImage> = new Map();
  private modeCache: ModeCache | null = null;

  /**
   * Set the ModeCache instance for persistent caching
   */
  setModeCache(cache: ModeCache): void {
    this.modeCache = cache;
  }

  /**
   * Load an image from a URL and convert it to a Three.js texture
   * @param url Image URL (can be a file path or HTTP URL)
   * @returns Promise that resolves to a LoadedImage
   */
  async loadImage(url: string): Promise<LoadedImage> {
    // Check in-memory cache first
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    // Check IndexedDB cache
    if (this.modeCache) {
      try {
        const cached = await this.modeCache.getCachedImage(url);
        if (cached) {
          // Convert blob to image
          const imageUrl = URL.createObjectURL(cached.blob);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          return new Promise((resolve, reject) => {
            img.onload = () => {
              this.createTextureFromImage(
                img,
                cached.width,
                cached.height,
                cached.width,
                cached.height,
                url,
                resolve
              );
              URL.revokeObjectURL(imageUrl);
            };
            img.onerror = () => {
              URL.revokeObjectURL(imageUrl);
              // Fall through to network fetch
              this.loadImageFromNetwork(url, resolve, reject);
            };
            img.src = imageUrl;
          });
        }
      } catch (error) {
        console.warn('Failed to load from IndexedDB cache, falling back to network:', error);
      }
    }

    // Load from network
    return new Promise((resolve, reject) => {
      this.loadImageFromNetwork(url, resolve, reject);
    });
  }

  /**
   * Load image from network and cache it
   * @private
   */
  private loadImageFromNetwork(
    url: string,
    resolve: (value: LoadedImage) => void,
    reject: (reason?: any) => void
  ): void {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Allow CORS for images

    img.onload = async () => {
        let finalWidth = img.width;
        let finalHeight = img.height;
        let finalImage: HTMLImageElement | ImageBitmap = img;

        // Check if image exceeds maximum dimensions
        const needsScaling = img.width > MAX_IMAGE_WIDTH || img.height > MAX_IMAGE_HEIGHT;
        
        if (needsScaling) {
          // Calculate scaling to fit within max dimensions while maintaining aspect ratio
          const scaleX = MAX_IMAGE_WIDTH / img.width;
          const scaleY = MAX_IMAGE_HEIGHT / img.height;
          const scale = Math.min(scaleX, scaleY);
          
          finalWidth = Math.floor(img.width * scale);
          finalHeight = Math.floor(img.height * scale);
          
          // Create a canvas to scale down the image
          const canvas = document.createElement('canvas');
          canvas.width = finalWidth;
          canvas.height = finalHeight;
          // Use willReadFrequently: true for better performance when reading canvas data
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (ctx) {
            // Use high-quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
            
            // Try to use ImageBitmap for better performance, fallback to Image
            if (typeof createImageBitmap !== 'undefined') {
              createImageBitmap(canvas)
                .then((bitmap) => {
                  this.createTextureFromImage(bitmap, finalWidth, finalHeight, img.width, img.height, url, resolve);
                })
                .catch(() => {
                  // Fallback: create Image from canvas data URL
                  const canvasImg = new Image();
                  canvasImg.onload = () => {
                    this.createTextureFromImage(canvasImg, finalWidth, finalHeight, img.width, img.height, url, resolve);
                  };
                  canvasImg.onerror = () => {
                    // Last resort: use original image (will be clipped by GPU)
                    console.warn(`Failed to scale image, using original: ${url}`);
                    this.createTextureFromImage(img, img.width, img.height, img.width, img.height, url, resolve);
                  };
                  canvasImg.src = canvas.toDataURL();
                });
            } else {
              // ImageBitmap not available, use Image from canvas
              const canvasImg = new Image();
              canvasImg.onload = () => {
                this.createTextureFromImage(canvasImg, finalWidth, finalHeight, img.width, img.height, url, resolve);
              };
              canvasImg.onerror = () => {
                // Last resort: use original image
                console.warn(`Failed to create scaled image, using original: ${url}`);
                this.createTextureFromImage(img, img.width, img.height, img.width, img.height, url, resolve);
              };
              canvasImg.src = canvas.toDataURL();
            }
            return; // Exit early, texture creation will happen in callback
          } else {
            // Fallback: use original image if canvas context fails
            console.warn(`Failed to get canvas context for image scaling, using original: ${url}`);
          }
        }

        // Create texture from (possibly scaled) image
        this.createTextureFromImage(finalImage, finalWidth, finalHeight, img.width, img.height, url, (loadedImage) => {
          // Cache in IndexedDB after successful load (async, don't block)
          if (this.modeCache) {
            this.cacheImageToIndexedDB(finalImage, finalWidth, finalHeight, url).catch((error) => {
              console.warn('Failed to cache image in IndexedDB:', error);
            });
          }
          resolve(loadedImage);
        });
      };

      img.onerror = (error) => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
  }

  /**
   * Load all PNG images from a directory
   * @param basePath Base path to the Images/ folder (e.g., from eyesy.mode_root)
   * @returns Promise that resolves to an array of LoadedImage objects
   */
  async loadImagesFromDirectory(basePath: string): Promise<LoadedImage[]> {
    // In a web environment, we need to know the image filenames
    // For now, we'll try common patterns or require explicit paths
    // This will be enhanced when we have a proper file system API
    
    // Try to load images by making requests to common paths
    // In a real implementation, we'd need a manifest or file listing
    const images: LoadedImage[] = [];
    
    // For now, return empty array - modes will need to explicitly load images
    // or we'll need a manifest system
    return images;
  }

  /**
   * Load images by pattern (e.g., from glob pattern)
   * In web environment, we need explicit URLs or a manifest
   * @param pattern Glob-like pattern (e.g., "Images/*.png")
   * @param basePath Base path for the pattern
   * @returns Promise that resolves to an array of LoadedImage objects
   */
  async loadImagesByPattern(pattern: string, basePath: string): Promise<LoadedImage[]> {
    // Extract the directory and extension from pattern
    // Pattern like "Images/*.png" -> directory "Images/", extension ".png"
    const match = pattern.match(/(.+)\/\*\.(\w+)/);
    if (!match) {
      console.warn(`Invalid image pattern: ${pattern}`);
      return [];
    }

    const [, dir, ext] = match;
    const fullDir = basePath.endsWith('/') ? basePath + dir : `${basePath}/${dir}`;
    
    // In a web environment without a file system API, we can't enumerate files
    // We'll need to either:
    // 1. Have a manifest file listing all images
    // 2. Try common image names (image0.png, image1.png, etc.)
    // 3. Require explicit image paths
    
    // For now, try loading numbered images (image0.png, image1.png, etc.)
    const images: LoadedImage[] = [];
    let index = 0;
    const maxAttempts = 20; // Try up to 20 images
    
    while (index < maxAttempts) {
      try {
        const imagePath = `${fullDir}/image${index}.${ext}`;
        const loadedImage = await this.loadImage(imagePath);
        images.push(loadedImage);
        index++;
      } catch (error) {
        // If loading fails, try next index
        // After 3 consecutive failures, stop trying
        if (index > 0 && images.length === 0) {
          break; // No images found at all
        }
        if (images.length > 0) {
          // Found some images, but this one doesn't exist - we're done
          break;
        }
        index++;
      }
    }
    
    return images;
  }

  /**
   * Create a Three.js texture from an image element
   * @private
   */
  private createTextureFromImage(
    image: HTMLImageElement | ImageBitmap,
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number,
    url: string,
    resolve: (value: LoadedImage) => void
  ): void {
    // Validate image dimensions
    if (width <= 0 || height <= 0) {
      console.warn(`ImageLoader: Invalid dimensions for ${url}: ${width}x${height}`);
      // Create a 1x1 fallback texture
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 1, 1);
      }
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.flipY = false;
      
      const loadedImage: LoadedImage = {
        texture,
        width: 1,
        height: 1,
        originalWidth,
        originalHeight,
      };
      
      this.imageCache.set(url, loadedImage);
      resolve(loadedImage);
      return;
    }
    
    // Validate image is loaded
    if (image instanceof HTMLImageElement) {
      if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
        console.warn(`ImageLoader: Image not fully loaded for ${url}, creating fallback`);
        // Create a 1x1 fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0)';
          ctx.fillRect(0, 0, 1, 1);
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.flipY = false;
        
        const loadedImage: LoadedImage = {
          texture,
          width: 1,
          height: 1,
          originalWidth,
          originalHeight,
        };
        
        this.imageCache.set(url, loadedImage);
        resolve(loadedImage);
        return;
      }
      
      // Additional validation: check if image data is actually valid
      if (!Number.isFinite(image.naturalWidth) || !Number.isFinite(image.naturalHeight)) {
        console.warn(`ImageLoader: Image has invalid dimensions for ${url}, creating fallback`);
        // Create fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0)';
          ctx.fillRect(0, 0, 1, 1);
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.flipY = false;
        
        const loadedImage: LoadedImage = {
          texture,
          width: 1,
          height: 1,
          originalWidth,
          originalHeight,
        };
        
        this.imageCache.set(url, loadedImage);
        resolve(loadedImage);
        return;
      }
    } else if (image instanceof ImageBitmap) {
      // Validate ImageBitmap
      if (!Number.isFinite(image.width) || !Number.isFinite(image.height) || 
          image.width === 0 || image.height === 0 || (image as any).closed) {
        console.warn(`ImageLoader: ImageBitmap is invalid for ${url}, creating fallback`);
        // Create fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0)';
          ctx.fillRect(0, 0, 1, 1);
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.flipY = false;
        
        const loadedImage: LoadedImage = {
          texture,
          width: 1,
          height: 1,
          originalWidth,
          originalHeight,
        };
        
        this.imageCache.set(url, loadedImage);
        resolve(loadedImage);
        return;
      }
    }
    
    // Create Three.js texture from image
    try {
      const texture = new THREE.Texture(image);
      texture.needsUpdate = true;
      texture.flipY = false; // Match pygame's coordinate system
      
      // Validate texture was created successfully
      if (!texture || !texture.image) {
        throw new Error('Texture creation failed');
      }

      const loadedImage: LoadedImage = {
        texture,
        width,
        height,
        originalWidth,
        originalHeight,
      };

      // Cache the loaded image
      this.imageCache.set(url, loadedImage);
      resolve(loadedImage);
    } catch (error) {
      console.warn(`ImageLoader: Error creating texture for ${url}, creating fallback:`, error);
      // Create fallback texture
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 1, 1);
      }
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      texture.flipY = false;
      
      const loadedImage: LoadedImage = {
        texture,
        width: 1,
        height: 1,
        originalWidth,
        originalHeight,
      };
      
      this.imageCache.set(url, loadedImage);
      resolve(loadedImage);
    }
  }

  /**
   * Dispose of all cached images
   */
  dispose(): void {
    this.imageCache.forEach((loadedImage) => {
      loadedImage.texture.dispose();
    });
    this.imageCache.clear();
  }

  /**
   * Get a cached image by URL
   */
  getCachedImage(url: string): LoadedImage | undefined {
    return this.imageCache.get(url);
  }

  /**
   * Cache an image to IndexedDB
   * @private
   */
  private async cacheImageToIndexedDB(
    image: HTMLImageElement | ImageBitmap,
    width: number,
    height: number,
    url: string
  ): Promise<void> {
    if (!this.modeCache) return;

    try {
      // Convert image to blob for caching
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(image, 0, 0, width, height);
      
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await this.modeCache!.cacheImage(url, blob, width, height);
              resolve();
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      });
    } catch (error) {
      throw new Error(`Failed to cache image: ${error}`);
    }
  }
}

