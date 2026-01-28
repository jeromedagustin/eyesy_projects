/**
 * Object pooling for Canvas - reuses Three.js geometries and materials
 * to reduce garbage collection pauses
 */
import * as THREE from 'three';

export class ObjectPool {
  private circleGeometryPool: Map<string, THREE.CircleGeometry[]> = new Map();
  private lineMaterialPool: Map<string, THREE.LineBasicMaterial> = new Map();
  private meshMaterialPool: Map<string, THREE.MeshBasicMaterial> = new Map();
  private maxPoolSize = 10;

  /**
   * Get or create a circle geometry from pool
   */
  getCircleGeometry(radius: number, segments: number): THREE.CircleGeometry {
    const key = `${radius.toFixed(1)}_${segments}`;
    let pool = this.circleGeometryPool.get(key);
    if (!pool) {
      pool = [];
      this.circleGeometryPool.set(key, pool);
    }
    
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    return new THREE.CircleGeometry(radius, segments);
  }

  /**
   * Return a circle geometry to the pool
   */
  returnCircleGeometry(geometry: THREE.CircleGeometry, radius: number, segments: number): void {
    const key = `${radius.toFixed(1)}_${segments}`;
    let pool = this.circleGeometryPool.get(key);
    if (!pool) {
      pool = [];
      this.circleGeometryPool.set(key, pool);
    }
    
    if (pool.length < this.maxPoolSize) {
      pool.push(geometry);
    } else {
      geometry.dispose();
    }
  }

  /**
   * Get or create a material from pool
   */
  getMeshMaterial(color: [number, number, number]): THREE.MeshBasicMaterial {
    const key = `${color[0]},${color[1]},${color[2]}`;
    let material = this.meshMaterialPool.get(key);
    
    if (!material) {
      material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        side: THREE.DoubleSide,
      });
      this.meshMaterialPool.set(key, material);
    } else {
      // Update color if it changed
      material.color.setRGB(color[0] / 255, color[1] / 255, color[2] / 255);
    }
    
    return material;
  }

  /**
   * Get or create a line material from pool
   */
  getLineMaterial(color: [number, number, number], width: number): THREE.LineBasicMaterial {
    // WebGL only supports line width of 1.0 - clamp to prevent GL_INVALID_VALUE errors
    // Note: linewidth property in THREE.LineBasicMaterial is ignored in WebGL,
    // but we still set it for consistency and to avoid errors
    const clampedWidth = Math.max(0.1, Math.min(1.0, width));
    const key = `${color[0]},${color[1]},${color[2]}_${clampedWidth}`;
    let material = this.lineMaterialPool.get(key);
    
    if (!material) {
      material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        linewidth: clampedWidth, // Clamped to 1.0 max for WebGL compatibility
      });
      this.lineMaterialPool.set(key, material);
    } else {
      // Update color if it changed
      material.color.setRGB(color[0] / 255, color[1] / 255, color[2] / 255);
    }
    
    return material;
  }

  /**
   * Check if a material is pooled (should not be disposed)
   */
  isPooledMaterial(material: THREE.Material): boolean {
    if (material instanceof THREE.MeshBasicMaterial) {
      const color = material.color;
      const colorKey = `${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}`;
      return this.meshMaterialPool.has(colorKey);
    }
    if (material instanceof THREE.LineBasicMaterial) {
      const color = material.color;
      const colorKey = `${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}_${material.linewidth}`;
      return this.lineMaterialPool.has(colorKey);
    }
    return false;
  }

  /**
   * Dispose all pooled resources
   */
  dispose(): void {
    // Dispose all geometries
    this.circleGeometryPool.forEach(pool => {
      pool.forEach(geom => geom.dispose());
    });
    this.circleGeometryPool.clear();

    // Materials are shared, so we dispose them here
    this.meshMaterialPool.forEach(mat => mat.dispose());
    this.meshMaterialPool.clear();
    
    this.lineMaterialPool.forEach(mat => mat.dispose());
    this.lineMaterialPool.clear();
  }
}
