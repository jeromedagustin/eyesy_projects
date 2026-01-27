/**
 * Math Utility Functions
 * Common mathematical operations used across multiple modes
 */

/**
 * Convert polar coordinates to cartesian
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param radius Radius from center
 * @param angle Angle in radians
 * @returns [x, y] coordinates
 */
export function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number): [number, number] {
  return [
    centerX + Math.cos(angle) * radius,
    centerY + Math.sin(angle) * radius
  ];
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another
 */
export function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}



