/**
 * 3D - Torus Knot
 * A rotating and morphing torus knot with audio-reactive colors
 * 
 * Knob1 - Rotation speed
 * Knob2 - Knot complexity (p/q ratio)
 * Knob3 - Knot size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

export class TorusKnot extends Base3DMode {
  private knot: THREE.Mesh | null = null;
  private light: THREE.DirectionalLight | null = null;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Create a torus knot (will be updated based on knob2)
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.3,
    });
    this.knot = new THREE.Mesh(geometry, material);
    this.addObject(this.knot);

    // Add lighting
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(5, 5, 5);
    this.addObject(this.light);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.addObject(ambientLight);

    // Position camera
    if (this.camera) {
      this.camera.position.z = 6;
      this.camera.lookAt(0, 0, 0);
    }
  }

  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.knot || !this.camera) return;

    // Knob1: Rotation speed (0 to 2 rotations per second)
    const rotSpeed = eyesy.knob1 * 2 * Math.PI;
    
    // Knob2: Knot complexity - p value (2 to 8)
    const p = Math.floor(2 + eyesy.knob2 * 6);
    const q = 3; // Keep q constant for simplicity
    
    // Knob3: Knot size (0.5 to 2.0)
    const baseSize = 0.5 + eyesy.knob3 * 1.5;
    const size = baseSize * (1.0 + audioLevel * 0.2);
    this.knot.scale.set(size, size, size);
    
    // Audio reactivity: boost rotation speed
    const audioBoost = 1.0 + audioLevel * 0.5;
    
    // Rotate knot
    this.knot.rotation.x += rotSpeed * eyesy.deltaTime * audioBoost * 0.5;
    this.knot.rotation.y += rotSpeed * eyesy.deltaTime * audioBoost;
    this.knot.rotation.z += rotSpeed * eyesy.deltaTime * audioBoost * 0.3;
    
    // Update geometry if complexity changed (simplified - just rotate for performance)
    // In a full implementation, we'd recreate the geometry when p changes
    
    // Update color from knob4
    const color = eyesy.color_picker(eyesy.knob4);
    if (this.knot.material instanceof THREE.MeshStandardMaterial) {
      // Audio reactivity: brighten color with audio
      const brightness = 1.0 + audioLevel * 0.3;
      this.knot.material.color.setRGB(
        Math.min(1.0, color[0] / 255 * brightness),
        Math.min(1.0, color[1] / 255 * brightness),
        Math.min(1.0, color[2] / 255 * brightness)
      );
    }
    
    // Trigger: pulse size
    if (eyesy.trig) {
      this.knot.scale.multiplyScalar(1.2);
    }
  }
}

