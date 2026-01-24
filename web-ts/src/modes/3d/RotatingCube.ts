/**
 * 3D - Rotating Cube
 * A simple rotating 3D cube with audio-reactive colors
 * 
 * Knob1 - Rotation speed (X axis)
 * Knob2 - Rotation speed (Y axis)
 * Knob3 - Cube size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

export class RotatingCube extends Base3DMode {
  private cube: THREE.Mesh | null = null;
  private light: THREE.DirectionalLight | null = null;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Create a cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4,
    });
    this.cube = new THREE.Mesh(geometry, material);
    this.addObject(this.cube);

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
    if (!this.cube || !this.camera) return;

    // Knob1: Rotation speed on X axis (0 to 2 rotations per second)
    const rotSpeedX = eyesy.knob1 * 2 * Math.PI;
    
    // Knob2: Rotation speed on Y axis (0 to 2 rotations per second)
    const rotSpeedY = eyesy.knob2 * 2 * Math.PI;
    
    // Knob3: Cube size (0.5 to 2.0)
    const size = 0.5 + eyesy.knob3 * 1.5;
    this.cube.scale.set(size, size, size);
    
    // Audio reactivity: boost rotation speed
    const audioBoost = 1.0 + audioLevel * 0.5;
    
    // Rotate cube
    this.cube.rotation.x += rotSpeedX * eyesy.deltaTime * audioBoost;
    this.cube.rotation.y += rotSpeedY * eyesy.deltaTime * audioBoost;
    
    // Update color from knob4
    const color = eyesy.color_picker(eyesy.knob4);
    if (this.cube.material instanceof THREE.MeshStandardMaterial) {
      // Audio reactivity: brighten color with audio
      const brightness = 1.0 + audioLevel * 0.3;
      this.cube.material.color.setRGB(
        Math.min(1.0, color[0] / 255 * brightness),
        Math.min(1.0, color[1] / 255 * brightness),
        Math.min(1.0, color[2] / 255 * brightness)
      );
    }
    
    // Trigger: pulse size
    if (eyesy.trig) {
      this.cube.scale.multiplyScalar(1.2);
    }
  }
}

