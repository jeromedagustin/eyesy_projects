/**
 * Edge Detection Effect - Sobel edge detection for outline effect
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class EdgeDetectionEffect implements Effect {
  name = 'edgeDetection';
  enabled = false;
  intensity = 0.0; // 0.0 = no edges, 1.0 = strong edges

  private defaultIntensity = 0.0;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createEdgeDetectionMaterial(width, height);
  }

  private createEdgeDetectionMaterial(width: number, height: number): void {
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
        
        // Sample surrounding pixels for Sobel edge detection
        vec4 tl = texture2D(tDiffuse, vUv + vec2(-pixelSize.x, -pixelSize.y));
        vec4 tm = texture2D(tDiffuse, vUv + vec2(0.0, -pixelSize.y));
        vec4 tr = texture2D(tDiffuse, vUv + vec2(pixelSize.x, -pixelSize.y));
        vec4 ml = texture2D(tDiffuse, vUv + vec2(-pixelSize.x, 0.0));
        vec4 mm = texture2D(tDiffuse, vUv);
        vec4 mr = texture2D(tDiffuse, vUv + vec2(pixelSize.x, 0.0));
        vec4 bl = texture2D(tDiffuse, vUv + vec2(-pixelSize.x, pixelSize.y));
        vec4 bm = texture2D(tDiffuse, vUv + vec2(0.0, pixelSize.y));
        vec4 br = texture2D(tDiffuse, vUv + vec2(pixelSize.x, pixelSize.y));
        
        // Sobel operators
        float gx = (-1.0 * tl.r + 1.0 * tr.r) +
                   (-2.0 * ml.r + 2.0 * mr.r) +
                   (-1.0 * bl.r + 1.0 * br.r);
        
        float gy = (-1.0 * tl.r + 1.0 * bl.r) +
                   (-2.0 * tm.r + 2.0 * bm.r) +
                   (-1.0 * tr.r + 1.0 * br.r);
        
        // Calculate edge magnitude
        float edge = sqrt(gx * gx + gy * gy);
        edge = clamp(edge * intensity * 5.0, 0.0, 1.0);
        
        // Mix original with edge detection
        vec4 original = mm;
        vec3 edgeColor = vec3(edge);
        vec3 final = mix(original.rgb, edgeColor, intensity);
        
        gl_FragColor = vec4(final, original.a);
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
      console.error('[EdgeDetectionEffect] Error applying edge detection:', error);
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


