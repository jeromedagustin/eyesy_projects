/**
 * Wave Effect - Sine wave distortion
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class WaveEffect implements Effect {
  name = 'wave';
  enabled = false;
  intensity = 0.0; // 0.0 = no wave, 1.0 = maximum wave

  private defaultIntensity = 0.0;
  private defaultFrequency = 10.0;
  private defaultSpeed = 1.0;
  frequency: number = 10.0; // Wave frequency
  speed: number = 1.0; // Wave animation speed
  private time = 0;

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createWaveMaterial(width, height);
  }

  private createWaveMaterial(width: number, height: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float intensity;
      uniform float frequency;
      uniform float time;
      varying vec2 vUv;

      void main() {
        vec2 coord = vUv;
        
        // Apply wave distortion
        float waveX = sin(coord.y * frequency + time) * intensity * 0.02;
        float waveY = cos(coord.x * frequency + time) * intensity * 0.02;
        
        coord += vec2(waveX, waveY);
        
        // Clamp to valid range
        coord = clamp(coord, 0.0, 1.0);
        
        gl_FragColor = texture2D(tDiffuse, coord);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        frequency: { value: this.frequency },
        time: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
  }

  apply(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture | null, width: number, height: number): THREE.Texture | null {
    if (!inputTexture || !this.material || !this.scene || !this.camera || !this.renderTarget) {
      console.warn('[WaveEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.time += 0.01 * this.speed;

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.frequency.value = this.frequency;
    this.material.uniforms.time.value = this.time;

    const oldRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(oldRenderTarget);

    return this.renderTarget.texture;
  }

  setSize(width: number, height: number): void {
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
    if (this.material) {
      this.material.uniforms.resolution.value.set(width, height);
    }
  }


  reset(): void {
    this.enabled = false;
    this.intensity = this.defaultIntensity;
    this.frequency = this.defaultFrequency;
    this.speed = this.defaultSpeed;
    this.time = 0;
  }

  dispose(): void {
    this.material?.dispose();
    this.renderTarget?.dispose();
    this.scene?.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}

