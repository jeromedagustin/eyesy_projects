/**
 * 3D - Wave Plane
 * A 3D plane that waves based on audio and time
 * 
 * Knob1 - Wave speed
 * Knob2 - Wave amplitude (height)
 * Knob3 - Wave frequency (density)
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

export class WavePlane extends Base3DMode {
  private plane: THREE.Mesh | null = null;
  private planeGeometry: THREE.PlaneGeometry | null = null;
  private light: THREE.DirectionalLight | null = null;
  private positions: Float32Array | null = null;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Create a plane with many segments for wave effect
    const segments = 50;
    this.planeGeometry = new THREE.PlaneGeometry(8, 8, segments, segments);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    
    this.plane = new THREE.Mesh(this.planeGeometry, material);
    this.plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.addObject(this.plane);

    // Get position attribute
    const positionAttribute = this.planeGeometry.getAttribute('position') as THREE.BufferAttribute;
    this.positions = positionAttribute.array as Float32Array;

    // Add lighting
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(5, 10, 5);
    this.addObject(this.light);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.addObject(ambientLight);

    // Position camera
    if (this.camera) {
      this.camera.position.set(0, 8, 8);
      this.camera.lookAt(0, 0, 0);
    }
  }

  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.plane || !this.planeGeometry || !this.positions || !this.camera) return;

    // Knob1: Wave speed (0.5 to 3.0)
    const waveSpeed = 0.5 + eyesy.knob1 * 2.5;
    const speed = waveSpeed * (1.0 + audioLevel * 0.5);
    
    // Knob2: Wave amplitude (0.1 to 1.5)
    const baseAmplitude = 0.1 + eyesy.knob2 * 1.4;
    const amplitude = baseAmplitude * (1.0 + audioLevel * 0.5);
    
    // Knob3: Wave frequency (1 to 5)
    const frequency = 1 + eyesy.knob3 * 4;
    
    // Update vertex positions to create wave effect
    const positionAttribute = this.planeGeometry.getAttribute('position') as THREE.BufferAttribute;
    const segments = 50;
    const time = this.time * speed;
    
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const index = (i * (segments + 1) + j) * 3;
        
        const x = (j / segments - 0.5) * 8;
        const z = (i / segments - 0.5) * 8;
        
        // Create wave pattern using multiple sine waves
        const wave1 = Math.sin((x * frequency + time) * 0.5) * amplitude;
        const wave2 = Math.sin((z * frequency + time * 0.7) * 0.5) * amplitude;
        const wave3 = Math.sin((Math.sqrt(x * x + z * z) * frequency + time * 1.2) * 0.3) * amplitude * 0.5;
        
        // Audio reactivity: add extra wave based on audio
        const audioWave = audioLevel * amplitude * 0.5 * Math.sin(time * 2);
        
        const y = wave1 + wave2 + wave3 + audioWave;
        
        this.positions[index] = x;
        this.positions[index + 1] = y;
        this.positions[index + 2] = z;
      }
    }
    
    // Mark position attribute as needing update
    positionAttribute.needsUpdate = true;
    this.planeGeometry.computeVertexNormals(); // Recalculate normals for lighting
    
    // Update color from knob4
    const color = eyesy.color_picker(eyesy.knob4);
    if (this.plane.material instanceof THREE.MeshStandardMaterial) {
      // Audio reactivity: brighten color with audio
      const brightness = 1.0 + audioLevel * 0.2;
      this.plane.material.color.setRGB(
        Math.min(1.0, color[0] / 255 * brightness),
        Math.min(1.0, color[1] / 255 * brightness),
        Math.min(1.0, color[2] / 255 * brightness)
      );
    }
    
    // Rotate camera slightly for visual interest
    const angle = this.time * 0.1;
    this.camera.position.x = Math.sin(angle) * 2;
    this.camera.position.z = 8 + Math.cos(angle) * 2;
    this.camera.lookAt(0, 0, 0);
    
    // Trigger: pulse amplitude
    if (eyesy.trig) {
      // Temporarily increase amplitude
      const tempAmplitude = amplitude * 1.5;
      for (let i = 0; i < this.positions.length; i += 3) {
        this.positions[i + 1] *= 1.5;
      }
      positionAttribute.needsUpdate = true;
    }
  }
}

