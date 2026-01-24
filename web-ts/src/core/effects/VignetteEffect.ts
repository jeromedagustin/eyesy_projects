/**
 * Vignette Effect - Darkens edges of the image
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export interface VignetteOptions {
  radius: number; // 0.0 to 1.0 - how far from center the vignette starts
  darkness: number; // 0.0 to 1.0 - how dark the edges get
}

export class VignetteEffect implements Effect {
  name = 'vignette';
  enabled = false;
  intensity = 0.0;

  private defaultIntensity = 0.0;
  private options: VignetteOptions = {
    radius: 0.75,
    darkness: 0.5,
  };

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number, options?: Partial<VignetteOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.createVignetteMaterial(width, height);
  }

  private createVignetteMaterial(width: number, height: number): void {
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
      uniform float radius;
      uniform float darkness;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        // Calculate distance from center
        vec2 center = vec2(0.5, 0.5);
        vec2 coord = vUv;
        float dist = distance(coord, center);
        
        // Create vignette mask
        float vignette = smoothstep(radius, radius + 0.3, dist);
        vignette = 1.0 - (vignette * darkness * intensity);
        
        // Apply vignette
        color.rgb *= vignette;
        
        gl_FragColor = color;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        radius: { value: this.options.radius },
        darkness: { value: this.options.darkness },
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

  setOptions(options: Partial<VignetteOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.material) {
      this.material.uniforms.radius.value = this.options.radius;
      this.material.uniforms.darkness.value = this.options.darkness;
    }
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
      this.material.uniforms.resolution.value.set(width, height);

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
      console.error('[VignetteEffect] Error applying vignette:', error);
      return inputTexture;
    }
  }

  setSize(width: number, height: number): void {
    if (this.material) {
      this.material.uniforms.resolution.value.set(width, height);
    }
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


