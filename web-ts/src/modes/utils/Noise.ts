/**
 * Noise Utility Functions
 * Provides shared noise generation for noise-based modes
 * 
 * This eliminates code duplication across noise modes that all use
 * the same noise calculation logic.
 */

/**
 * Simple 2D noise function (pseudo-random, hash-based)
 * Returns a value between 0 and 1
 * 
 * @param x X coordinate
 * @param y Y coordinate  
 * @param time Time parameter for animation
 * @returns Noise value between 0.0 and 1.0
 */
export function noise2D(x: number, y: number, time: number = 0): number {
  // Simple hash-based noise (similar to Perlin noise but simpler)
  const n = Math.sin(x * 12.9898 + y * 78.233 + time * 0.1) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Get noise value at a point with scaling
 * Normalizes coordinates and applies scale factor
 * 
 * @param x X coordinate
 * @param y Y coordinate
 * @param time Time parameter for animation
 * @param scale Scale factor (larger = smaller features)
 * @returns Noise value between 0.0 and 1.0
 */
export function getNoise(x: number, y: number, time: number, scale: number = 1.0): number {
  const nx = (x / 1000.0) * scale;
  const ny = (y / 1000.0) * scale;
  const nt = time * 0.1;
  return noise2D(nx, ny, nt);
}

/**
 * 3D noise function (x, y, time)
 * Useful for animated noise patterns
 * 
 * @param x X coordinate
 * @param y Y coordinate
 * @param time Time parameter
 * @param scale Scale factor
 * @returns Noise value between 0.0 and 1.0
 */
export function noise3D(x: number, y: number, time: number, scale: number = 1.0): number {
  const nx = (x / 1000.0) * scale;
  const ny = (y / 1000.0) * scale;
  const nt = (time / 100.0) * scale;
  return noise2D(nx, ny, nt);
}


