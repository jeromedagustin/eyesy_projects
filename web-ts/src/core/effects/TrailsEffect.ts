/**
 * Trails Effect - Motion trails / feedback effect
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class TrailsEffect implements Effect {
  name = 'trails';
  enabled = false;
  intensity = 0.0; // 0.0 = no trails, 1.0 = long trails (decay rate)
  fadeSpeed: number = 0.95; // How fast trails fade (0.0-1.0, higher = slower fade)

  private defaultIntensity = 0.0;
  private defaultFadeSpeed = 0.95;

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private feedbackTexture: THREE.Texture | null = null;
  private feedbackRenderTarget: THREE.WebGLRenderTarget | null = null;
  private copyMaterial: THREE.ShaderMaterial | null = null;
  private copyScene: THREE.Scene | null = null;
  private copyMesh: THREE.Mesh | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.createTrailsMaterial(width, height);
  }

  private createTrailsMaterial(width: number, height: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform sampler2D tFeedback;
      uniform float fadeSpeed;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        vec4 current = texture2D(tDiffuse, vUv);
        vec4 feedback = texture2D(tFeedback, vUv);
        
        // Blend current frame with faded feedback
        // Higher intensity = more feedback blending
        vec4 fadedFeedback = feedback * fadeSpeed;
        vec4 result = mix(current, fadedFeedback, intensity);
        
        gl_FragColor = result;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tFeedback: { value: null },
        fadeSpeed: { value: this.fadeSpeed },
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

    this.feedbackRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    this.feedbackTexture = this.feedbackRenderTarget.texture;
    
    // Create copy material for feedback buffer
    this.copyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
        }
      `,
    });
    
    this.copyScene = new THREE.Scene();
    this.copyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.copyMaterial);
    this.copyScene.add(this.copyMesh);
  }

  apply(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture | null, width: number, height: number): THREE.Texture | null {
    if (!inputTexture || !this.material || !this.scene || !this.camera || !this.renderTarget || !this.feedbackRenderTarget) {
      console.warn('[TrailsEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    // Update fade speed based on intensity (higher intensity = slower fade = longer trails)
    const fadeSpeed = 0.9 + (this.intensity * 0.09); // Map intensity to fade speed (0.9 to 0.99)

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.tFeedback.value = this.feedbackTexture;
    this.material.uniforms.fadeSpeed.value = fadeSpeed;
    this.material.uniforms.intensity.value = this.intensity;

    const oldRenderTarget = renderer.getRenderTarget();
    
    // Render to main render target (blend current with feedback)
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    
    // Copy result to feedback buffer for next frame (use the output, not input)
    if (this.copyMaterial && this.copyScene) {
      this.copyMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
      renderer.setRenderTarget(this.feedbackRenderTarget);
      renderer.clear();
      renderer.render(this.copyScene, this.camera);
    }
    
    renderer.setRenderTarget(oldRenderTarget);

    return this.renderTarget.texture;
  }

  setSize(width: number, height: number): void {
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
    if (this.feedbackRenderTarget) {
      this.feedbackRenderTarget.setSize(width, height);
    }
  }

  reset(): void {
    this.enabled = false;
    this.intensity = this.defaultIntensity;
    this.fadeSpeed = this.defaultFadeSpeed;
    // Clear feedback buffer by resetting it
    if (this.feedbackRenderTarget && this.renderer) {
      const oldRenderTarget = this.renderer.getRenderTarget();
      this.renderer.setRenderTarget(this.feedbackRenderTarget);
      this.renderer.clear();
      if (oldRenderTarget) {
        this.renderer.setRenderTarget(oldRenderTarget);
      }
    }
  }

  dispose(): void {
    this.material?.dispose();
    this.renderTarget?.dispose();
    this.feedbackRenderTarget?.dispose();
    this.copyMaterial?.dispose();
    if (this.copyMesh) {
      this.copyMesh.geometry.dispose();
    }
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

