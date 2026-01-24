/**
 * Solarize Effect - Invert colors above a threshold
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class SolarizeEffect implements Effect {
  name = 'solarize';
  enabled = false;
  intensity = 0.0; // 0.0 = no effect, 1.0 = full solarize

  private defaultIntensity = 0.0;
  private defaultThreshold = 0.5;
  threshold: number = 0.5; // Threshold for inversion

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createSolarizeMaterial(width, height);
  }

  private createSolarizeMaterial(width: number, height: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float intensity;
      uniform float threshold;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        // Solarize: invert colors above threshold
        vec3 solarized = color.rgb;
        if (solarized.r > threshold) solarized.r = 1.0 - solarized.r;
        if (solarized.g > threshold) solarized.g = 1.0 - solarized.g;
        if (solarized.b > threshold) solarized.b = 1.0 - solarized.b;
        
        gl_FragColor = vec4(mix(color.rgb, solarized, intensity), color.a);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        intensity: { value: this.intensity },
        threshold: { value: this.threshold },
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
      console.warn('[SolarizeEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.threshold.value = this.threshold;

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
  }


  reset(): void {
    this.enabled = false;
    this.intensity = this.defaultIntensity;
    this.threshold = this.defaultThreshold;
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

