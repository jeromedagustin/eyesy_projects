import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { getNoise } from '../utils';

/**
 * N - Noise Flow
 * Flow field visualization using Perlin/Simplex noise
 * 
 * Knob1 - Noise scale (0 = large features, 1 = small features)
 * Knob2 - Flow speed/animation speed
 * Knob3 - Number of particles/flow lines
 * Knob4 - Foreground color
 * Knob5 - Background color
 * 
 * Works standalone, but reacts to audio/MIDI when available
 */
export class NoiseFlow extends BaseAnimatedMode {
  private particles: Array<{ x: number; y: number; vx: number; vy: number }> = [];

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    this.particles = [];
    
    // Initialize particles
    const numParticles = Math.floor(20 + eyesy.knob3 * 80);
    for (let i = 0; i < numParticles; i++) {
      this.particles.push({
        x: Math.random() * eyesy.xres,
        y: Math.random() * eyesy.yres,
        vx: 0,
        vy: 0
      });
    }
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);

    const color = eyesy.color_picker(eyesy.knob4);

    // Knob1: Noise scale (affects feature size)
    // Audio can affect noise scale
    let noiseScale = 0.3 + eyesy.knob1 * 2.0;
    noiseScale *= (1.0 + audioLevel * 0.3);

    // Knob2: Flow speed
    // Audio can boost flow speed
    let flowSpeed = 0.5 + eyesy.knob2 * 2.0;
    flowSpeed *= (1.0 + audioLevel * 0.5);

    // Knob3: Number of particles (update if changed)
    // Audio can add more particles
    let numParticles = Math.floor(20 + eyesy.knob3 * 80);
    numParticles += Math.floor(audioLevel * 30);
    if (this.particles.length !== numParticles) {
      this.particles = [];
      for (let i = 0; i < numParticles; i++) {
        this.particles.push({
          x: Math.random() * eyesy.xres,
          y: Math.random() * eyesy.yres,
          vx: 0,
          vy: 0
        });
      }
    }

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Get noise value at particle position
      const noiseX = getNoise(p.x, p.y, this.time, noiseScale);
      const noiseY = getNoise(p.x + 100, p.y + 100, this.time, noiseScale);

      // Convert noise to angle (0 to 2π)
      // MIDI trigger can add rotation
      const triggerRotation = eyesy.trig ? Math.PI * 0.5 : 0.0;
      const angle = noiseX * Math.PI * 2 + triggerRotation;
      const strength = noiseY * flowSpeed * (1.0 + audioLevel * 0.5);

      // Update velocity based on noise
      p.vx = Math.cos(angle) * strength;
      p.vy = Math.sin(angle) * strength;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x += eyesy.xres;
      if (p.x >= eyesy.xres) p.x -= eyesy.xres;
      if (p.y < 0) p.y += eyesy.yres;
      if (p.y >= eyesy.yres) p.y -= eyesy.yres;

      // Draw particle
      canvas.circle([Math.floor(p.x), Math.floor(p.y)], 2, color, 0);
    }
  }
}

