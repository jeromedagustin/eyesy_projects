/**
 * Blur Effect - Gaussian blur post-processing
 */
import { Effect } from '../EffectManager';
import { Canvas } from '../Canvas';
import * as THREE from 'three';

export class BlurEffect implements Effect {
  name = 'blur';
  enabled = false;
  intensity = 0.0; // 0.0 = no blur, 1.0 = maximum blur

  private defaultIntensity = 0.0;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.createBlurMaterial(width, height);
  }

  private createBlurMaterial(width: number, height: number): void {
    // Create a simple blur shader
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
        vec2 pixelSize = 1.0 / resolution;
        vec4 color = vec4(0.0);
        float total = 0.0;
        
        // Simple box blur (can be upgraded to Gaussian)
        int radius = int(intensity * 10.0);
        for (int x = -radius; x <= radius; x++) {
          for (int y = -radius; y <= radius; y++) {
            vec2 offset = vec2(float(x), float(y)) * pixelSize;
            color += texture2D(tDiffuse, vUv + offset);
            total += 1.0;
          }
        }
        
        gl_FragColor = color / total;
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
      console.warn('[BlurEffect] Cannot apply: missing dependencies', {
        hasInput: !!inputTexture,
        hasMaterial: !!this.material,
        hasScene: !!this.scene,
        hasCamera: !!this.camera,
        hasRenderTarget: !!this.renderTarget
      });
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
      
      // Return blurred texture
      return texture;
    } catch (error) {
      console.error('[BlurEffect] Error applying blur:', error);
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
      this.material = null;
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    this.scene = null;
    this.camera = null;
  }
}

