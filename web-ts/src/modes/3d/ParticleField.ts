/**
 * 3D - Particle Field
 * A field of 3D particles that react to audio
 * 
 * Knob1 - Particle speed
 * Knob2 - Particle count (density)
 * Knob3 - Particle size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

export class ParticleField extends Base3DMode {
  private particles: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particlePositions: Float32Array | null = null;
  private particleVelocities: Float32Array | null = null;
  private particleCount: number = 1000;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Will be initialized in first draw based on knob2
    if (this.camera) {
      this.camera.position.z = 10;
      this.camera.lookAt(0, 0, 0);
    }
  }

  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.scene || !this.camera) return;

    // Knob2: Particle count (500 to 5000)
    const newParticleCount = Math.floor(500 + eyesy.knob2 * 4500);
    
    // Recreate particles if count changed
    if (!this.particles || this.particleCount !== newParticleCount) {
      this.particleCount = newParticleCount;
      this.createParticles();
    }

    if (!this.particles || !this.particlePositions || !this.particleVelocities) return;

    // Knob1: Particle speed (0.5 to 5.0)
    const baseSpeed = 0.5 + eyesy.knob1 * 4.5;
    const speed = baseSpeed * (1.0 + audioLevel * 0.5);
    
    // Knob3: Particle size (0.02 to 0.1)
    const size = 0.02 + eyesy.knob3 * 0.08;
    if (this.particles.material instanceof THREE.PointsMaterial) {
      this.particles.material.size = size;
    }

    // Update color
    const color = eyesy.color_picker(eyesy.knob4);
    if (this.particles.material instanceof THREE.PointsMaterial) {
      this.particles.material.color.setRGB(
        color[0] / 255,
        color[1] / 255,
        color[2] / 255
      );
    }

    // Update particle positions
    const positions = this.particlePositions;
    const velocities = this.particleVelocities;
    const deltaTime = eyesy.deltaTime;
    const bounds = 5.0;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Update position
      positions[i3] += velocities[i3] * speed * deltaTime;
      positions[i3 + 1] += velocities[i3 + 1] * speed * deltaTime;
      positions[i3 + 2] += velocities[i3 + 2] * speed * deltaTime;
      
      // Wrap around bounds
      if (Math.abs(positions[i3]) > bounds) velocities[i3] *= -1;
      if (Math.abs(positions[i3 + 1]) > bounds) velocities[i3 + 1] *= -1;
      if (Math.abs(positions[i3 + 2]) > bounds) velocities[i3 + 2] *= -1;
      
      // Audio reactivity: add turbulence
      if (audioLevel > 0.1) {
        positions[i3] += (Math.random() - 0.5) * audioLevel * 0.1;
        positions[i3 + 1] += (Math.random() - 0.5) * audioLevel * 0.1;
        positions[i3 + 2] += (Math.random() - 0.5) * audioLevel * 0.1;
      }
    }

    // Update geometry
    if (this.particleGeometry) {
      this.particleGeometry.attributes.position.needsUpdate = true;
    }

    // Rotate camera slightly for visual interest
    const angle = this.time * 0.1;
    this.camera.position.x = Math.sin(angle) * 2;
    this.camera.position.y = Math.cos(angle) * 2;
    this.camera.lookAt(0, 0, 0);
  }

  private createParticles(): void {
    // Remove old particles
    if (this.particles) {
      this.clearObjects();
    }

    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);

    // Initialize positions and velocities
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in a sphere
      const radius = Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      this.particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      this.particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      this.particlePositions[i3 + 2] = radius * Math.cos(phi);
      
      // Random velocity
      this.particleVelocities[i3] = (Math.random() - 0.5) * 2;
      this.particleVelocities[i3 + 1] = (Math.random() - 0.5) * 2;
      this.particleVelocities[i3 + 2] = (Math.random() - 0.5) * 2;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
    });

    // Create points
    this.particles = new THREE.Points(this.particleGeometry, material);
    this.addObject(this.particles);
  }
}

