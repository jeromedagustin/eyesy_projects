/**
 * VHS Distortion Effect - Simulates VHS tape artifacts
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class VHSDistortionEffect implements Effect {
  name = 'vhsDistortion';
  enabled = false;
  intensity = 0.0; // 0.0 = no distortion, 1.0 = maximum distortion

  private defaultIntensity = 0.0;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private time = 0.0;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createVHSDistortionMaterial(width, height);
  }

  private createVHSDistortionMaterial(width: number, height: number): void {
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

      void main() {
        vec2 uv = vUv;
        
        // Horizontal wave distortion (tape tracking errors)
        float wave = sin(uv.y * 20.0 + time * 2.0) * intensity * 0.01;
        uv.x += wave;
        
        // Vertical jitter (tape flutter)
        float jitter = (fract(sin(uv.y * 100.0 + time * 5.0) * 43758.5453) - 0.5) * intensity * 0.005;
        uv.y += jitter;
        
        // Sample with distortion
        vec4 color = texture2D(tDiffuse, uv);
        
        // Add noise (tape noise)
        float noise = (fract(sin(dot(uv + time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * intensity * 0.1;
        color.rgb += noise;
        
        // Color bleeding (chroma shift)
        float chromaShift = intensity * 0.003;
        float r = texture2D(tDiffuse, uv + vec2(chromaShift, 0.0)).r;
        float g = color.g;
        float b = texture2D(tDiffuse, uv - vec2(chromaShift, 0.0)).b;
        
        // Mix original with distorted
        vec3 distorted = vec3(r, g, b) + noise;
        color.rgb = mix(color.rgb, distorted, intensity);
        
        // Add horizontal lines (tape damage)
        float line = step(0.99, fract(uv.y * resolution.y * 0.5 + time * 0.5));
        color.rgb *= 1.0 - line * intensity * 0.3;
        
        gl_FragColor = color;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        time: { value: this.time },
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
      // Update time for animation
      this.time += 0.016; // Approximate frame time
      if (this.time > 1000.0) this.time = 0.0;

      // Update shader uniforms
      this.material.uniforms.tDiffuse.value = inputTexture;
      this.material.uniforms.intensity.value = this.intensity;
      this.material.uniforms.resolution.value.set(width, height);
      this.material.uniforms.time.value = this.time;

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
      console.error('[VHSDistortionEffect] Error applying VHS distortion:', error);
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


