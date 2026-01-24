/**
 * 3D - Geometric Shapes
 * Multiple 3D geometric shapes that rotate and react to audio
 * 
 * Knob1 - Rotation speed
 * Knob2 - Number of shapes (3 to 12)
 * Knob3 - Shape size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

export class Geometric3D extends Base3DMode {
  private shapes: THREE.Mesh[] = [];
  private light: THREE.DirectionalLight | null = null;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Add lighting
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(5, 5, 5);
    this.addObject(this.light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.addObject(ambientLight);

    if (this.camera) {
      this.camera.position.z = 8;
      this.camera.lookAt(0, 0, 0);
    }
  }

  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.scene || !this.camera) return;

    // Knob2: Number of shapes (3 to 12)
    const numShapes = Math.floor(3 + eyesy.knob2 * 9);
    
    // Create or update shapes
    while (this.shapes.length < numShapes) {
      this.createShape(this.shapes.length);
    }
    while (this.shapes.length > numShapes) {
      const shape = this.shapes.pop();
      if (shape) {
        this.scene.remove(shape);
        if (shape.geometry) shape.geometry.dispose();
        if (shape.material instanceof THREE.Material) shape.material.dispose();
      }
    }

    // Knob1: Rotation speed (0 to 2 rotations per second)
    const rotSpeed = eyesy.knob1 * 2 * Math.PI;
    const audioBoost = 1.0 + audioLevel * 0.5;
    
    // Knob3: Shape size (0.3 to 1.0)
    const baseSize = 0.3 + eyesy.knob3 * 0.7;
    
    // Update color
    const color = eyesy.color_picker(eyesy.knob4);

    // Update each shape
    this.shapes.forEach((shape, index) => {
      // Position in a circle
      const angle = (index / this.shapes.length) * Math.PI * 2;
      const radius = 2.0;
      shape.position.x = Math.cos(angle) * radius;
      shape.position.y = Math.sin(angle) * radius;
      shape.position.z = (Math.random() - 0.5) * 2;
      
      // Rotate
      shape.rotation.x += rotSpeed * eyesy.deltaTime * audioBoost;
      shape.rotation.y += rotSpeed * eyesy.deltaTime * audioBoost * 0.7;
      
      // Size with audio reactivity
      const size = baseSize * (1.0 + audioLevel * 0.3);
      shape.scale.set(size, size, size);
      
      // Color with audio brightness
      if (shape.material instanceof THREE.MeshStandardMaterial) {
        const brightness = 1.0 + audioLevel * 0.2;
        shape.material.color.setRGB(
          Math.min(1.0, color[0] / 255 * brightness),
          Math.min(1.0, color[1] / 255 * brightness),
          Math.min(1.0, color[2] / 255 * brightness)
        );
      }
      
      // Trigger: pulse
      if (eyesy.trig) {
        shape.scale.multiplyScalar(1.3);
      }
    });
  }

  private createShape(index: number): void {
    let geometry: THREE.BufferGeometry;
    
    // Vary shape types
    const shapeType = index % 4;
    switch (shapeType) {
      case 0:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 1:
        geometry = new THREE.TetrahedronGeometry(1);
        break;
      case 2:
        geometry = new THREE.OctahedronGeometry(1);
        break;
      case 3:
        geometry = new THREE.IcosahedronGeometry(1);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.shapes.push(mesh);
    this.addObject(mesh);
  }
}

