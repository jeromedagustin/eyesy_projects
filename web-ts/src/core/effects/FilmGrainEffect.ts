/**
 * Film Grain Effect - Adds film grain texture
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class FilmGrainEffect implements Effect {
  name = 'filmGrain';
  enabled = false;
  intensity = 0.0; // 0.0 = no grain, 1.0 = heavy grain

  private defaultIntensity = 0.0;
  private time = 0;

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createFilmGrainMaterial(width, height);
  }

  private createFilmGrainMaterial(width: number, height: number): void {
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
      uniform float time;
      varying vec2 vUv;

      // Random function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        // Generate grain pattern
        vec2 grainUv = vUv * resolution * 0.5;
        grainUv += vec2(time * 0.1); // Animate grain
        float grain = random(grainUv);
        
        // Apply grain
        float grainAmount = intensity * 0.1;
        vec3 grainColor = color.rgb + (grain - 0.5) * grainAmount;
        
        gl_FragColor = vec4(grainColor, color.a);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
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
      console.warn('[FilmGrainEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.time += 0.01;

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
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


