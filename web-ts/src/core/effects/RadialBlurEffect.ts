/**
 * Radial Blur Effect - Circular blur from center
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class RadialBlurEffect implements Effect {
  name = 'radialBlur';
  enabled = false;
  intensity = 0.0; // 0.0 = no blur, 1.0 = maximum blur

  private defaultIntensity = 0.0;
  private defaultCenterX = 0.5;
  private defaultCenterY = 0.5;
  centerX: number = 0.5; // Center X (0.0-1.0)
  centerY: number = 0.5; // Center Y (0.0-1.0)

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createRadialBlurMaterial(width, height);
  }

  private createRadialBlurMaterial(width: number, height: number): void {
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
      uniform vec2 center;
      varying vec2 vUv;

      void main() {
        vec2 coord = vUv - center;
        float dist = length(coord);
        vec2 dir = normalize(coord);
        
        vec4 color = vec4(0.0);
        float totalWeight = 0.0;
        int samples = 10;
        
        for (int i = 0; i < 20; i++) {
          if (i >= samples) break;
          
          float t = float(i) / float(samples - 1);
          vec2 offset = dir * dist * intensity * t * 0.1;
          vec2 sampleUv = vUv + offset;
          
          if (sampleUv.x >= 0.0 && sampleUv.x <= 1.0 && sampleUv.y >= 0.0 && sampleUv.y <= 1.0) {
            float weight = 1.0 - t;
            color += texture2D(tDiffuse, sampleUv) * weight;
            totalWeight += weight;
          }
        }
        
        if (totalWeight > 0.0) {
          color /= totalWeight;
        } else {
          color = texture2D(tDiffuse, vUv);
        }
        
        gl_FragColor = color;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        center: { value: new THREE.Vector2(this.centerX, this.centerY) },
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
      console.warn('[RadialBlurEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.center.value.set(this.centerX, this.centerY);

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
    this.centerX = this.defaultCenterX;
    this.centerY = this.defaultCenterY;
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

