/**
 * Tilt-Shift Effect - Miniature/fake depth of field effect
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class TiltShiftEffect implements Effect {
  name = 'tiltShift';
  enabled = false;
  intensity = 0.0; // 0.0 = no blur, 1.0 = maximum blur

  private defaultIntensity = 0.0;
  private defaultFocusPosition = 0.5;
  private defaultFocusWidth = 0.3;
  focusPosition: number = 0.5; // 0.0 = top, 1.0 = bottom (where focus is)
  focusWidth: number = 0.3; // Width of in-focus area (0.0-1.0)

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createTiltShiftMaterial(width, height);
  }

  private createTiltShiftMaterial(width: number, height: number): void {
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
      uniform float focusPosition;
      uniform float focusWidth;
      varying vec2 vUv;

      void main() {
        // Calculate distance from focus line
        float distFromFocus = abs(vUv.y - focusPosition);
        float focusFactor = smoothstep(focusWidth * 0.5, focusWidth, distFromFocus);
        
        // Apply blur based on distance from focus
        float blurAmount = focusFactor * intensity * 0.05;
        
        vec4 color = vec4(0.0);
        float totalWeight = 0.0;
        int samples = 10;
        
        // Fixed loop - GLSL requires constant loop bounds
        for (int i = -10; i <= 10; i++) {
          if (i >= -samples && i <= samples) {
            float offset = float(i) * blurAmount;
            vec2 sampleUv = vUv + vec2(0.0, offset);
            
            // Clamp UV coordinates
            sampleUv = clamp(sampleUv, vec2(0.0), vec2(1.0));
            
            float weight = 1.0 - abs(float(i)) / float(samples);
            color += texture2D(tDiffuse, sampleUv) * weight;
            totalWeight += weight;
          }
        }
        
        if (totalWeight > 0.0) {
          color /= totalWeight;
        } else {
          color = texture2D(tDiffuse, vUv);
        }
        
        gl_FragColor = color;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        intensity: { value: this.intensity },
        focusPosition: { value: this.focusPosition },
        focusWidth: { value: this.focusWidth },
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
      console.warn('[TiltShiftEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.resolution.value.set(width, height);
    this.material.uniforms.intensity.value = this.intensity;
    this.material.uniforms.focusPosition.value = this.focusPosition;
    this.material.uniforms.focusWidth.value = this.focusWidth;

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
    this.focusPosition = this.defaultFocusPosition;
    this.focusWidth = this.defaultFocusWidth;
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

