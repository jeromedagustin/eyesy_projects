/**
 * Lens Flare Effect - Camera lens flare effect
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class LensFlareEffect implements Effect {
  name = 'lensFlare';
  enabled = false;
  intensity = 0.0; // 0.0 = no flare, 1.0 = maximum flare

  private defaultIntensity = 0.0;
  private defaultPositionX = 0.5;
  private defaultPositionY = 0.5;
  positionX: number = 0.5; // Flare position X (0.0-1.0)
  positionY: number = 0.5; // Flare position Y (0.0-1.0)

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createLensFlareMaterial(width, height);
  }

  private createLensFlareMaterial(width: number, height: number): void {
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
      uniform vec2 flarePosition;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        // Calculate distance from flare position
        vec2 flareUv = flarePosition;
        vec2 dir = vUv - flareUv;
        float dist = length(dir);
        
        // Create flare streaks
        float angle = atan(dir.y, dir.x);
        float flare = 0.0;
        
        // Main flare
        flare += 0.5 / (dist * 10.0 + 0.1);
        
        // Streaks
        for (int i = 0; i < 5; i++) {
          float streakAngle = float(i) * 0.785; // 45 degrees
          float streakDist = abs(cos(angle - streakAngle)) * dist;
          flare += 0.2 / (streakDist * 20.0 + 0.1);
        }
        
        // Add flare to bright areas
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 flareColor = vec3(1.0, 0.9, 0.7) * flare * intensity * brightness;
        
        gl_FragColor = vec4(color.rgb + flareColor, color.a);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        flarePosition: { value: new THREE.Vector2(this.positionX, this.positionY) },
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
      console.warn('[LensFlareEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.flarePosition.value.set(this.positionX, this.positionY);

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
    this.positionX = this.defaultPositionX;
    this.positionY = this.defaultPositionY;
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

