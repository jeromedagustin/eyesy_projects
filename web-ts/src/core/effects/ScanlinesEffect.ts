/**
 * Scanlines Effect - CRT monitor scanline effect
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class ScanlinesEffect implements Effect {
  name = 'scanlines';
  enabled = false;
  intensity = 0.0; // 0.0 = no scanlines, 1.0 = strong scanlines

  private defaultIntensity = 0.0;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private time = 0.0;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createScanlinesMaterial(width, height);
  }

  private createScanlinesMaterial(width: number, height: number): void {
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
        vec4 color = texture2D(tDiffuse, vUv);
        
        // Create scanlines (alternating dark lines)
        float scanline = sin(vUv.y * resolution.y * 3.14159) * 0.5 + 0.5;
        scanline = pow(scanline, 10.0); // Make lines sharper
        
        // Add slight flicker for CRT effect
        float flicker = sin(time * 10.0) * 0.02 + 1.0;
        
        // Apply scanlines
        float scanlineIntensity = mix(1.0, scanline * 0.7 + 0.3, intensity);
        color.rgb *= scanlineIntensity * flicker;
        
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
      // Update time for flicker animation
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
      console.error('[ScanlinesEffect] Error applying scanlines:', error);
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


