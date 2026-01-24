/**
 * Chroma Key Effect - Green screen / blue screen removal
 * Removes a specific color range from the video
 */
import { Effect } from '../EffectManager';
import { Canvas } from '../Canvas';
import * as THREE from 'three';

export interface ChromaKeyOptions {
  keyColor: [number, number, number]; // RGB color to remove (0-255)
  threshold: number; // Color matching threshold (0.0-1.0)
  smoothing: number; // Edge smoothing (0.0-1.0)
}

export class ChromaKeyEffect implements Effect {
  name = 'chromaKey';
  enabled = false;
  intensity = 0.0;

  private defaultIntensity = 0.0;
  private options: ChromaKeyOptions = {
    keyColor: [0, 255, 0], // Green by default
    threshold: 0.4,
    smoothing: 0.1,
  };

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number, options?: Partial<ChromaKeyOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.createChromaKeyMaterial(width, height);
  }

  private createChromaKeyMaterial(width: number, height: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform vec3 keyColor;
      uniform float threshold;
      uniform float smoothing;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        // Normalize key color to 0-1 range
        vec3 keyColorNorm = keyColor / 255.0;
        
        // Calculate color difference
        float diff = distance(color.rgb, keyColorNorm);
        
        // Apply threshold and smoothing
        float alpha = smoothstep(threshold - smoothing, threshold + smoothing, diff);
        
        // Apply intensity
        alpha = mix(1.0, alpha, intensity);
        
        gl_FragColor = vec4(color.rgb, color.a * alpha);
      }
    `;

    const keyColorNorm = [
      this.options.keyColor[0] / 255.0,
      this.options.keyColor[1] / 255.0,
      this.options.keyColor[2] / 255.0,
    ];

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        keyColor: { value: new THREE.Vector3(...keyColorNorm) },
        threshold: { value: this.options.threshold },
        smoothing: { value: this.options.smoothing },
        intensity: { value: this.intensity },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
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

  setOptions(options: Partial<ChromaKeyOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.material) {
      const keyColorNorm = [
        this.options.keyColor[0] / 255.0,
        this.options.keyColor[1] / 255.0,
        this.options.keyColor[2] / 255.0,
      ];
      this.material.uniforms.keyColor.value.set(...keyColorNorm);
      this.material.uniforms.threshold.value = this.options.threshold;
      this.material.uniforms.smoothing.value = this.options.smoothing;
    }
  }

  apply(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture | null, width: number, height: number): THREE.Texture | null {
    if (!inputTexture || !this.material || !this.scene || !this.camera || !this.renderTarget) {
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    // Update shader uniforms
    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.intensity.value = this.intensity;

    // Render to render target
    const oldRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene!, this.camera!);
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

