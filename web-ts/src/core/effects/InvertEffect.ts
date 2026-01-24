/**
 * Invert Effect - Inverts colors (negative effect)
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class InvertEffect implements Effect {
  name = 'invert';
  enabled = false;
  intensity = 1.0; // 0.0 = no inversion, 1.0 = full inversion

  private defaultIntensity = 1.0;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createInvertMaterial(width, height);
  }

  private createInvertMaterial(width: number, height: number): void {
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
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        // Invert RGB channels
        vec3 inverted = vec3(1.0) - color.rgb;
        // Mix between original and inverted based on intensity
        vec3 final = mix(color.rgb, inverted, intensity);
        gl_FragColor = vec4(final, color.a);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
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
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    try {
      // Update shader uniforms
      this.material.uniforms.tDiffuse.value = inputTexture;
      this.material.uniforms.intensity.value = this.intensity;

      // Render to render target
      const oldRenderTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear();
      renderer.render(this.scene, this.camera);
      renderer.setRenderTarget(oldRenderTarget);

      // Ensure texture is marked as updated
      const texture = this.renderTarget.texture;
      texture.needsUpdate = true;
      
      return texture;
    } catch (error) {
      console.error('[InvertEffect] Error applying invert:', error);
      return inputTexture;
    }
  }

  setSize(width: number, height: number): void {
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
  }


  reset(): void {
    this.enabled = false;
    this.intensity = this.defaultIntensity;
  }


  dispose(): void {
    if (this.material) {
      this.material.dispose();
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
  }
}


