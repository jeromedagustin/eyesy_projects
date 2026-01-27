/**
 * 3D - Rotating Sphere
 * A simple rotating 3D sphere with audio-reactive colors and size
 * 
 * Knob1 - Rotation speed (X axis)
 * Knob2 - Rotation speed (Y axis)
 * Knob3 - Sphere size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

export class RotatingSphere extends Base3DMode {
  private sphere: THREE.Mesh | null = null;
  private light: THREE.DirectionalLight | null = null;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Create a sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4,
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.addObject(this.sphere);

    // Add lighting
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(5, 5, 5);
    this.addObject(this.light);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.addObject(ambientLight);

    // Position camera
    if (this.camera) {
      this.camera.position.z = 5;
      this.camera.lookAt(0, 0, 0);
    }
  }

  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.sphere || !this.camera) return;

    // Knob1: Rotation speed on X axis (0 to 2 rotations per second)
    const rotSpeedX = eyesy.knob1 * 2 * Math.PI;
    
    // Knob2: Rotation speed on Y axis (0 to 2 rotations per second)
    const rotSpeedY = eyesy.knob2 * 2 * Math.PI;
    
    // Knob3: Sphere size (0.5 to 2.0)
    const baseSize = 0.5 + eyesy.knob3 * 1.5;
    const size = baseSize * (1.0 + audioLevel * 0.3);
    this.sphere.scale.set(size, size, size);
    
    // Audio reactivity: boost rotation speed
    const audioBoost = 1.0 + audioLevel * 0.5;
    
    // Rotate sphere
    this.sphere.rotation.x += rotSpeedX * eyesy.deltaTime * audioBoost;
    this.sphere.rotation.y += rotSpeedY * eyesy.deltaTime * audioBoost;
    
    // Update color from knob4
    const color = eyesy.color_picker(eyesy.knob4);
    if (this.sphere.material instanceof THREE.MeshStandardMaterial) {
      // Audio reactivity: brighten color with audio
      const brightness = 1.0 + audioLevel * 0.3;
      this.sphere.material.color.setRGB(
        Math.min(1.0, color[0] / 255 * brightness),
        Math.min(1.0, color[1] / 255 * brightness),
        Math.min(1.0, color[2] / 255 * brightness)
      );
    }
    
    // Trigger: pulse size
    if (eyesy.trig) {
      this.sphere.scale.multiplyScalar(1.2);
    }
  }
}

