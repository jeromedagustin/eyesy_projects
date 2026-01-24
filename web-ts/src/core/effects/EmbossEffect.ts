/**
 * Emboss Effect - 3D embossed look
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class EmbossEffect implements Effect {
  name = 'emboss';
  enabled = false;
  intensity = 0.0; // 0.0 = no emboss, 1.0 = maximum emboss

  private defaultIntensity = 0.0;

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createEmbossMaterial(width, height);
  }

  private createEmbossMaterial(width: number, height: number): void {
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
        
        // Sample neighboring pixels
        float c00 = dot(texture2D(tDiffuse, vUv + texel * vec2(-1, -1)).rgb, vec3(0.299, 0.587, 0.114));
        float c10 = dot(texture2D(tDiffuse, vUv + texel * vec2( 0, -1)).rgb, vec3(0.299, 0.587, 0.114));
        float c20 = dot(texture2D(tDiffuse, vUv + texel * vec2( 1, -1)).rgb, vec3(0.299, 0.587, 0.114));
        float c01 = dot(texture2D(tDiffuse, vUv + texel * vec2(-1,  0)).rgb, vec3(0.299, 0.587, 0.114));
        float c11 = dot(texture2D(tDiffuse, vUv).rgb, vec3(0.299, 0.587, 0.114));
        float c21 = dot(texture2D(tDiffuse, vUv + texel * vec2( 1,  0)).rgb, vec3(0.299, 0.587, 0.114));
        float c02 = dot(texture2D(tDiffuse, vUv + texel * vec2(-1,  1)).rgb, vec3(0.299, 0.587, 0.114));
        float c12 = dot(texture2D(tDiffuse, vUv + texel * vec2( 0,  1)).rgb, vec3(0.299, 0.587, 0.114));
        float c22 = dot(texture2D(tDiffuse, vUv + texel * vec2( 1,  1)).rgb, vec3(0.299, 0.587, 0.114));

        // Emboss kernel
        float emboss = -c00 - c10 - c20 + c02 + c12 + c22;
        emboss = emboss * 0.5 + 0.5; // Normalize to 0-1
        
        vec4 original = texture2D(tDiffuse, vUv);
        vec3 embossed = vec3(emboss);
        
        gl_FragColor = vec4(mix(original.rgb, embossed, intensity), original.a);
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
      console.warn('[EmbossEffect] Cannot apply: missing dependencies');
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


