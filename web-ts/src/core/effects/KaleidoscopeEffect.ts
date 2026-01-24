/**
 * Kaleidoscope Effect - Radial symmetry pattern
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class KaleidoscopeEffect implements Effect {
  name = 'kaleidoscope';
  enabled = false;
  intensity = 0.0; // 0.0 = no effect, 1.0 = full kaleidoscope

  private defaultIntensity = 0.0;
  segments: number = 6; // Number of segments (slices)

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createKaleidoscopeMaterial(width, height);
  }

  private createKaleidoscopeMaterial(width: number, height: number): void {
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
      uniform float segments;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 coord = vUv - center;
        
        float angle = atan(coord.y, coord.x);
        float radius = length(coord);
        
        // Normalize angle to 0-2PI
        angle = angle + 3.14159; // Shift to 0-2PI range
        
        // Mirror into one segment
        float segmentAngle = 6.28318 / segments; // 2 * PI / segments
        float segmentIndex = floor(angle / segmentAngle);
        float localAngle = mod(angle, segmentAngle);
        
        // Mirror if in second half of segment
        if (localAngle > segmentAngle * 0.5) {
          localAngle = segmentAngle - localAngle;
        }
        
        // Convert back to absolute angle
        float mirroredAngle = localAngle;
        
        // Convert back to UV coordinates
        vec2 mirroredCoord = vec2(cos(mirroredAngle - 3.14159), sin(mirroredAngle - 3.14159)) * radius;
        vec2 mirroredUv = center + mirroredCoord;
        
        // Clamp to valid range
        mirroredUv = clamp(mirroredUv, 0.0, 1.0);
        
        vec4 original = texture2D(tDiffuse, vUv);
        vec4 kaleidoscope = texture2D(tDiffuse, mirroredUv);
        
        gl_FragColor = mix(original, kaleidoscope, intensity);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        segments: { value: this.segments },
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
      console.warn('[KaleidoscopeEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.segments.value = Math.max(3, Math.floor(this.intensity * 12) + 3);

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

