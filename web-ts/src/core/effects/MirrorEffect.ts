/**
 * Mirror Effect - Horizontal/vertical mirroring
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class MirrorEffect implements Effect {
  name = 'mirror';
  enabled = false;
  intensity = 0.0; // 0.0 = no mirror, 1.0 = full mirror

  private defaultIntensity = 0.0;
  private defaultHorizontal = true;
  horizontal: boolean = true; // true = horizontal mirror, false = vertical mirror

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createMirrorMaterial(width, height);
  }

  private createMirrorMaterial(width: number, height: number): void {
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
      uniform bool horizontal;
      varying vec2 vUv;

      void main() {
        vec2 coord = vUv;
        
        if (horizontal) {
          // Horizontal mirror
          if (coord.x > 0.5) {
            coord.x = 1.0 - coord.x;
          }
        } else {
          // Vertical mirror
          if (coord.y > 0.5) {
            coord.y = 1.0 - coord.y;
          }
        }
        
        vec4 original = texture2D(tDiffuse, vUv);
        vec4 mirrored = texture2D(tDiffuse, coord);
        
        gl_FragColor = mix(original, mirrored, intensity);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        intensity: { value: this.intensity },
        horizontal: { value: this.horizontal },
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
      console.warn('[MirrorEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.horizontal.value = this.horizontal;

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
    this.horizontal = this.defaultHorizontal;
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

