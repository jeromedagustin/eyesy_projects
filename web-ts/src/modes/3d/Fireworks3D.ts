/**
 * 3D - Fireworks
 * Particle-based fireworks in 3D space (rockets + bursts) with audio/trigger reactivity.
 *
 * Knob1 - Launch rate
 * Knob2 - Spark budget (max particles)
 * Knob3 - Spread / floatiness (wide & floaty -> tight & heavy)
 * Knob4 - Base color
 * Knob5 - Background color
 */
import { Base3DMode } from './Base3DMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import * as THREE from 'three';

type HSL = { h: number; s: number; l: number };

export class Fireworks3D extends Base3DMode {
  private sparks: THREE.Points | null = null;
  private sparkGeometry: THREE.BufferGeometry | null = null;

  private sparkPositions: Float32Array | null = null;
  private sparkColors: Float32Array | null = null; // dynamic (fades)
  private sparkBaseColors: Float32Array | null = null; // per-spark base color
  private sparkVelocities: Float32Array | null = null;
  private sparkAges: Float32Array | null = null;
  private sparkLifetimes: Float32Array | null = null;
  private sparkActive: Uint8Array | null = null;

  private maxSparks = 6000;
  private nextSparkIndex = 0;
  private launchAccumulator = 0;

  private readonly rocketCount = 24;
  private rocketActive = new Uint8Array(this.rocketCount);
  private rocketPos = new Float32Array(this.rocketCount * 3);
  private rocketVel = new Float32Array(this.rocketCount * 3);
  private rocketAge = new Float32Array(this.rocketCount);
  private rocketFuse = new Float32Array(this.rocketCount);
  private rocketColor = new Float32Array(this.rocketCount * 3);
  private rocketTrailAccumulator = new Float32Array(this.rocketCount);

  // Reused temp objects to minimize allocations
  private tmpColor = new THREE.Color();
  private tmpHsl: HSL = { h: 0, s: 0, l: 0 };

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Camera: keep origin-centered, Base3DMode forces lookAt(0,0,0)
    if (this.camera) {
      this.camera.position.set(0, 2.5, 12);
      this.camera.lookAt(0, 0, 0);
    }

    this.launchAccumulator = 0;
    this.resetRockets();
    this.ensureSparkSystem(eyesy);
  }

  override dispose(): void {
    this.disposeSparkSystem();
    super.dispose();
  }

  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.scene || !this.camera) return;

    this.ensureSparkSystem(eyesy);
    if (
      !this.sparks ||
      !this.sparkGeometry ||
      !this.sparkPositions ||
      !this.sparkColors ||
      !this.sparkBaseColors ||
      !this.sparkVelocities ||
      !this.sparkAges ||
      !this.sparkLifetimes ||
      !this.sparkActive
    ) {
      return;
    }

    const dt = eyesy.deltaTime;
    if (!isFinite(dt) || dt === 0) {
      // Still allow trigger spawning even if dt is zero
      if (eyesy.trig || eyesy.audio_trig) {
        this.launchRocket(eyesy, audioLevel);
      }
      return;
    }

    // Controls
    const launchRate = 0.25 + eyesy.knob1 * 2.75; // rockets/sec
    const spread = 0.8 + eyesy.knob3 * 2.4; // explosion velocity scale
    const gravity = 3.0 - eyesy.knob3 * 1.8; // low knob3 = heavier
    const drag = 0.985 + eyesy.knob3 * 0.01; // high knob3 = slightly less drag
    const sparkleBoost = 1.0 + audioLevel * 0.35;

    // Launch logic (continuous + audio + triggers)
    const audioBoost = 1.0 + audioLevel * 1.5;
    this.launchAccumulator += Math.max(-0.5, Math.min(0.5, dt)) * launchRate * audioBoost;
    if (eyesy.trig || eyesy.audio_trig) {
      this.launchAccumulator += 1.5;
    }
    while (this.launchAccumulator >= 1.0) {
      this.launchRocket(eyesy, audioLevel);
      this.launchAccumulator -= 1.0;
    }

    // Update rockets (and spawn trails / bursts)
    for (let r = 0; r < this.rocketCount; r++) {
      if (this.rocketActive[r] === 0) continue;

      const r3 = r * 3;
      this.rocketAge[r] += dt;

      // Integrate rocket
      this.rocketVel[r3 + 1] -= gravity * 0.55 * dt;
      this.rocketPos[r3] += this.rocketVel[r3] * dt;
      this.rocketPos[r3 + 1] += this.rocketVel[r3 + 1] * dt;
      this.rocketPos[r3 + 2] += this.rocketVel[r3 + 2] * dt;

      // Trail
      this.rocketTrailAccumulator[r] += Math.abs(dt);
      while (this.rocketTrailAccumulator[r] >= 0.03) {
        this.rocketTrailAccumulator[r] -= 0.03;

        const trailSpeed = 0.3;
        const vx = (Math.random() - 0.5) * 0.4 - this.rocketVel[r3] * trailSpeed;
        const vy = (Math.random() - 0.5) * 0.4 - this.rocketVel[r3 + 1] * trailSpeed;
        const vz = (Math.random() - 0.5) * 0.4 - this.rocketVel[r3 + 2] * trailSpeed;

        // Slightly warmer trail
        const cr = this.rocketColor[r3];
        const cg = this.rocketColor[r3 + 1];
        const cb = this.rocketColor[r3 + 2];
        this.emitSpark(
          this.rocketPos[r3],
          this.rocketPos[r3 + 1],
          this.rocketPos[r3 + 2],
          vx,
          vy,
          vz,
          Math.max(0.25, 0.55 + Math.random() * 0.35),
          Math.min(1.0, cr * 1.1),
          Math.min(1.0, cg * 0.95),
          Math.min(1.0, cb * 0.85)
        );
      }

      // Explode at fuse time or when reaching apex
      const shouldExplode =
        this.rocketAge[r] >= this.rocketFuse[r] ||
        this.rocketVel[r3 + 1] <= 0.2 ||
        this.rocketPos[r3 + 1] > 4.5;

      if (shouldExplode) {
        this.explodeRocket(r, eyesy, audioLevel, spread);
      }
    }

    // Update sparks
    const positions = this.sparkPositions;
    const velocities = this.sparkVelocities;
    const ages = this.sparkAges;
    const lifetimes = this.sparkLifetimes;
    const baseColors = this.sparkBaseColors;
    const colors = this.sparkColors;
    const active = this.sparkActive;

    const dtClamped = Math.max(-0.05, Math.min(0.05, dt));
    const killBounds = 12.0;

    for (let i = 0; i < this.maxSparks; i++) {
      if (active[i] === 0) continue;

      const i3 = i * 3;
      ages[i] += dtClamped;

      const life = lifetimes[i];
      const t = life > 0 ? ages[i] / life : 1.0;
      if (!isFinite(t) || t >= 1.0) {
        active[i] = 0;
        positions[i3] = 9999;
        positions[i3 + 1] = 9999;
        positions[i3 + 2] = 9999;
        colors[i3] = 0;
        colors[i3 + 1] = 0;
        colors[i3 + 2] = 0;
        continue;
      }

      // Integrate
      velocities[i3] *= drag;
      velocities[i3 + 1] = velocities[i3 + 1] * drag - gravity * dtClamped;
      velocities[i3 + 2] *= drag;

      positions[i3] += velocities[i3] * dtClamped;
      positions[i3 + 1] += velocities[i3 + 1] * dtClamped;
      positions[i3 + 2] += velocities[i3 + 2] * dtClamped;

      // Bounds kill
      if (
        Math.abs(positions[i3]) > killBounds ||
        positions[i3 + 1] < -8 ||
        positions[i3 + 1] > killBounds ||
        Math.abs(positions[i3 + 2]) > killBounds
      ) {
        active[i] = 0;
        positions[i3] = 9999;
        positions[i3 + 1] = 9999;
        positions[i3 + 2] = 9999;
        colors[i3] = 0;
        colors[i3 + 1] = 0;
        colors[i3 + 2] = 0;
        continue;
      }

      // Fade with a little "sparkle" modulation
      const fade = Math.max(0.0, 1.0 - t);
      const sparkle = 0.75 + 0.25 * Math.sin((this.time * 16.0 + i * 0.17) * 2.0);
      const intensity = fade * sparkle * sparkleBoost;

      colors[i3] = baseColors[i3] * intensity;
      colors[i3 + 1] = baseColors[i3 + 1] * intensity;
      colors[i3 + 2] = baseColors[i3 + 2] * intensity;
    }

    // Update Three.js buffers
    (this.sparkGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.sparkGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    // Update point size from spark budget/spread (subtle)
    const size = 0.03 + eyesy.knob2 * 0.05;
    if (this.sparks.material instanceof THREE.PointsMaterial) {
      this.sparks.material.size = size;
      this.sparks.material.opacity = 0.95;
    }

    // Gentle camera orbit for depth
    const camAngle = this.time * 0.12;
    this.camera.position.x = Math.sin(camAngle) * 1.4;
    this.camera.position.y = 2.2 + Math.cos(camAngle * 0.9) * 0.6;
    this.camera.position.z = 12 + Math.cos(camAngle) * 0.8;
    this.camera.lookAt(0, 0, 0);
  }

  private ensureSparkSystem(eyesy: EYESY): void {
    // Knob2: spark budget (1500 to 12000)
    const desiredMax = Math.max(1500, Math.min(12000, Math.floor(1500 + eyesy.knob2 * 10500)));
    if (!this.sparks || this.maxSparks !== desiredMax) {
      this.maxSparks = desiredMax;
      this.createSparkSystem();
    }
  }

  private createSparkSystem(): void {
    if (!this.scene) return;
    // Be defensive in test/mocked environments
    if (typeof (this.scene as any).add !== 'function') return;

    this.disposeSparkSystem();

    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkBaseColors = new Float32Array(this.maxSparks * 3);
    this.sparkVelocities = new Float32Array(this.maxSparks * 3);
    this.sparkAges = new Float32Array(this.maxSparks);
    this.sparkLifetimes = new Float32Array(this.maxSparks);
    this.sparkActive = new Uint8Array(this.maxSparks);

    // Initialize off-screen
    for (let i = 0; i < this.maxSparks; i++) {
      const i3 = i * 3;
      this.sparkPositions[i3] = 9999;
      this.sparkPositions[i3 + 1] = 9999;
      this.sparkPositions[i3 + 2] = 9999;
      this.sparkColors[i3] = 0;
      this.sparkColors[i3 + 1] = 0;
      this.sparkColors[i3 + 2] = 0;
      this.sparkBaseColors[i3] = 0;
      this.sparkBaseColors[i3 + 1] = 0;
      this.sparkBaseColors[i3 + 2] = 0;
      this.sparkVelocities[i3] = 0;
      this.sparkVelocities[i3 + 1] = 0;
      this.sparkVelocities[i3 + 2] = 0;
      this.sparkAges[i] = 0;
      this.sparkLifetimes[i] = 0;
      this.sparkActive[i] = 0;
    }

    this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeometry.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.sparks = new THREE.Points(this.sparkGeometry, material);
    this.addObject(this.sparks);

    this.nextSparkIndex = 0;
  }

  private disposeSparkSystem(): void {
    if (this.sparks) {
      if (this.scene && typeof (this.scene as any).remove === 'function') {
        this.scene.remove(this.sparks);
      }
      // Remove from Base3DMode object tracking to avoid double-removal work
      this.objects = this.objects.filter(o => o !== this.sparks);

      const geom = (this.sparks.geometry as THREE.BufferGeometry) || null;
      const mat = this.sparks.material;
      if (geom) geom.dispose();
      if (Array.isArray(mat)) mat.forEach(m => m.dispose());
      else mat.dispose();
    }

    this.sparks = null;
    this.sparkGeometry = null;
    this.sparkPositions = null;
    this.sparkColors = null;
    this.sparkBaseColors = null;
    this.sparkVelocities = null;
    this.sparkAges = null;
    this.sparkLifetimes = null;
    this.sparkActive = null;
  }

  private resetRockets(): void {
    this.rocketActive.fill(0);
    this.rocketAge.fill(0);
    this.rocketFuse.fill(0);
    this.rocketTrailAccumulator.fill(0);
    for (let r = 0; r < this.rocketCount; r++) {
      const r3 = r * 3;
      this.rocketPos[r3] = 0;
      this.rocketPos[r3 + 1] = -9999;
      this.rocketPos[r3 + 2] = 0;
      this.rocketVel[r3] = 0;
      this.rocketVel[r3 + 1] = 0;
      this.rocketVel[r3 + 2] = 0;
      this.rocketColor[r3] = 1;
      this.rocketColor[r3 + 1] = 1;
      this.rocketColor[r3 + 2] = 1;
    }
  }

  private launchRocket(eyesy: EYESY, audioLevel: number): void {
    // Find free slot (or recycle the oldest)
    let slot = -1;
    for (let r = 0; r < this.rocketCount; r++) {
      if (this.rocketActive[r] === 0) {
        slot = r;
        break;
      }
    }
    if (slot === -1) {
      // Recycle the oldest rocket
      let oldest = 0;
      let maxAge = -Infinity;
      for (let r = 0; r < this.rocketCount; r++) {
        if (this.rocketAge[r] > maxAge) {
          maxAge = this.rocketAge[r];
          oldest = r;
        }
      }
      slot = oldest;
    }

    const r3 = slot * 3;
    this.rocketActive[slot] = 1;
    this.rocketAge[slot] = 0;
    this.rocketTrailAccumulator[slot] = 0;

    // Launch position near the "ground"
    const x = (Math.random() - 0.5) * 8.0;
    const y = -4.5 + Math.random() * 0.6;
    const z = (Math.random() - 0.5) * 6.0;
    this.rocketPos[r3] = x;
    this.rocketPos[r3 + 1] = y;
    this.rocketPos[r3 + 2] = z;

    // Velocity (upward biased)
    const up = 6.2 + Math.random() * 2.2 + audioLevel * 2.2;
    this.rocketVel[r3] = (Math.random() - 0.5) * 1.0;
    this.rocketVel[r3 + 1] = up;
    this.rocketVel[r3 + 2] = (Math.random() - 0.5) * 1.0;

    // Fuse time (seconds)
    this.rocketFuse[slot] = 0.75 + Math.random() * 0.9 + audioLevel * 0.25;

    // Color: base knob color with slight hue shift per rocket
    const [br, bg, bb] = eyesy.color_picker(eyesy.knob4);
    const base = this.tmpColor.setRGB(br / 255, bg / 255, bb / 255);
    base.getHSL(this.tmpHsl);
    const hueJitter = (Math.random() - 0.5) * 0.14; // +- ~50 degrees
    const satBoost = 0.65 + Math.random() * 0.35;
    const lightness = 0.55 + Math.random() * 0.25;
    this.tmpColor.setHSL((this.tmpHsl.h + hueJitter + 1) % 1, Math.min(1, this.tmpHsl.s * satBoost + 0.25), Math.min(0.9, lightness));

    this.rocketColor[r3] = this.tmpColor.r;
    this.rocketColor[r3 + 1] = this.tmpColor.g;
    this.rocketColor[r3 + 2] = this.tmpColor.b;
  }

  private explodeRocket(rocketIndex: number, eyesy: EYESY, audioLevel: number, spread: number): void {
    const r3 = rocketIndex * 3;
    const x = this.rocketPos[r3];
    const y = this.rocketPos[r3 + 1];
    const z = this.rocketPos[r3 + 2];

    const cr = this.rocketColor[r3];
    const cg = this.rocketColor[r3 + 1];
    const cb = this.rocketColor[r3 + 2];

    // Spark count per burst scales with knob2 and audio
    const baseCount = 80 + Math.floor(eyesy.knob2 * 220);
    const audioCount = Math.floor(audioLevel * 120);
    const count = Math.max(60, Math.min(420, baseCount + audioCount));

    // Explosion speed
    const speed = (2.2 + audioLevel * 1.6) * spread;

    for (let i = 0; i < count; i++) {
      // Random direction on sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);

      const dirx = Math.sin(phi) * Math.cos(theta);
      const diry = Math.cos(phi);
      const dirz = Math.sin(phi) * Math.sin(theta);

      const jitter = 0.6 + Math.random() * 0.55;
      const vx = dirx * speed * jitter;
      const vy = diry * speed * jitter + 0.8; // slight upward bias
      const vz = dirz * speed * jitter;

      const lifetime = 0.9 + Math.random() * 1.3;

      // Color: vary brightness slightly per spark
      const bright = 0.7 + Math.random() * 0.6;
      this.emitSpark(x, y, z, vx, vy, vz, lifetime, Math.min(1.0, cr * bright), Math.min(1.0, cg * bright), Math.min(1.0, cb * bright));
    }

    // "Flash" core (a few hot sparks)
    for (let i = 0; i < 18; i++) {
      const vx = (Math.random() - 0.5) * speed * 0.35;
      const vy = (Math.random() - 0.5) * speed * 0.35;
      const vz = (Math.random() - 0.5) * speed * 0.35;
      this.emitSpark(x, y, z, vx, vy, vz, 0.45 + Math.random() * 0.25, 1.0, 1.0, 1.0);
    }

    this.rocketActive[rocketIndex] = 0;
    this.rocketPos[r3 + 1] = -9999;
  }

  private emitSpark(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    lifetime: number,
    r: number,
    g: number,
    b: number
  ): void {
    if (
      !this.sparkPositions ||
      !this.sparkColors ||
      !this.sparkBaseColors ||
      !this.sparkVelocities ||
      !this.sparkAges ||
      !this.sparkLifetimes ||
      !this.sparkActive
    ) {
      return;
    }

    const idx = this.nextSparkIndex;
    this.nextSparkIndex = (this.nextSparkIndex + 1) % this.maxSparks;

    const i3 = idx * 3;
    this.sparkActive[idx] = 1;
    this.sparkAges[idx] = 0;
    this.sparkLifetimes[idx] = Math.max(0.15, lifetime);

    this.sparkPositions[i3] = x;
    this.sparkPositions[i3 + 1] = y;
    this.sparkPositions[i3 + 2] = z;

    this.sparkVelocities[i3] = vx;
    this.sparkVelocities[i3 + 1] = vy;
    this.sparkVelocities[i3 + 2] = vz;

    this.sparkBaseColors[i3] = r;
    this.sparkBaseColors[i3 + 1] = g;
    this.sparkBaseColors[i3 + 2] = b;

    this.sparkColors[i3] = r;
    this.sparkColors[i3 + 1] = g;
    this.sparkColors[i3 + 2] = b;
  }
}

