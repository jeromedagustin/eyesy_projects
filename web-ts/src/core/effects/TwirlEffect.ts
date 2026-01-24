/**
 * Twirl Effect - Spiral distortion
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class TwirlEffect implements Effect {
  name = 'twirl';
  enabled = false;
  intensity = 0.0; // 0.0 = no twirl, 1.0 = maximum twirl

  private defaultIntensity = 0.0;
  private defaultCenterX = 0.5;
  private defaultCenterY = 0.5;
  private defaultRadius = 0.5;
  centerX: number = 0.5; // Center X (0.0-1.0)
  centerY: number = 0.5; // Center Y (0.0-1.0)
  radius: number = 0.5; // Twirl radius

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createTwirlMaterial(width, height);
  }

  private createTwirlMaterial(width: number, height: number): void {
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
      uniform vec2 center;
      uniform float radius;
      varying vec2 vUv;

      void main() {
        vec2 coord = vUv - center;
        float dist = length(coord);
        
        if (dist < radius) {
          float angle = atan(coord.y, coord.x);
          float amount = (radius - dist) / radius;
          angle += amount * amount * intensity * 6.28318; // 2 * PI
          
          coord = vec2(cos(angle), sin(angle)) * dist;
        }
        
        vec2 twirledUv = center + coord;
        
        // Clamp to valid range
        if (twirledUv.x < 0.0 || twirledUv.x > 1.0 || 
            twirledUv.y < 0.0 || twirledUv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
          gl_FragColor = texture2D(tDiffuse, twirledUv);
        }
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        center: { value: new THREE.Vector2(this.centerX, this.centerY) },
        radius: { value: this.radius },
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
      console.warn('[TwirlEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.center.value.set(this.centerX, this.centerY);
    this.material.uniforms.radius.value = this.radius;

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
    this.centerX = this.defaultCenterX;
    this.centerY = this.defaultCenterY;
    this.radius = this.defaultRadius;
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

