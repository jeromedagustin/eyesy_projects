/**
 * Sharpen Effect - Image sharpening
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class SharpenEffect implements Effect {
  name = 'sharpen';
  enabled = false;
  intensity = 0.0; // 0.0 = no sharpening, 1.0 = maximum sharpening

  private defaultIntensity = 0.0;

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createSharpenMaterial(width, height);
  }

  private createSharpenMaterial(width: number, height: number): void {
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
      varying vec2 vUv;

      void main() {
        vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
        
        // Sharpen kernel
        vec4 c00 = texture2D(tDiffuse, vUv + texel * vec2(-1, -1));
        vec4 c10 = texture2D(tDiffuse, vUv + texel * vec2( 0, -1));
        vec4 c20 = texture2D(tDiffuse, vUv + texel * vec2( 1, -1));
        vec4 c01 = texture2D(tDiffuse, vUv + texel * vec2(-1,  0));
        vec4 c11 = texture2D(tDiffuse, vUv); // Center
        vec4 c21 = texture2D(tDiffuse, vUv + texel * vec2( 1,  0));
        vec4 c02 = texture2D(tDiffuse, vUv + texel * vec2(-1,  1));
        vec4 c12 = texture2D(tDiffuse, vUv + texel * vec2( 0,  1));
        vec4 c22 = texture2D(tDiffuse, vUv + texel * vec2( 1,  1));

        // Unsharp mask kernel
        vec4 sharpened = c11 * 9.0 - (c00 + c10 + c20 + c01 + c21 + c02 + c12 + c22);
        
        // Mix with original based on intensity
        vec4 original = texture2D(tDiffuse, vUv);
        vec4 result = mix(original, sharpened, intensity * 0.1);
        
        gl_FragColor = result;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
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
      console.warn('[SharpenEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;

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


