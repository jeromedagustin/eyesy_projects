/**
 * Color Grading Effect - Adjust brightness, contrast, saturation, hue
 */
import { Effect } from '../EffectManager';
import { Canvas } from '../Canvas';
import * as THREE from 'three';

export interface ColorGradingOptions {
  brightness: number; // -1.0 to 1.0
  contrast: number; // -1.0 to 1.0
  saturation: number; // -1.0 to 1.0
  hue: number; // -180 to 180 degrees
}

export class ColorGradingEffect implements Effect {
  name = 'colorGrading';
  enabled = false;
  intensity = 1.0;

  private defaultIntensity = 1.0;
  private options: ColorGradingOptions = {
    brightness: 0.0,
    contrast: 0.0,
    saturation: 0.0,
    hue: 0.0,
  };

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number, options?: Partial<ColorGradingOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.createColorGradingMaterial(width, height);
  }

  private createColorGradingMaterial(width: number, height: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float brightness;
      uniform float contrast;
      uniform float saturation;
      uniform float hue;
      uniform float intensity;
      varying vec2 vUv;

      // RGB to HSV conversion
      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      // HSV to RGB conversion
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec3 rgb = color.rgb;
        
        // Apply brightness
        rgb += brightness;
        
        // Apply contrast
        rgb = (rgb - 0.5) * (1.0 + contrast) + 0.5;
        
        // Convert to HSV for saturation and hue adjustment
        vec3 hsv = rgb2hsv(rgb);
        
        // Apply saturation
        hsv.y = clamp(hsv.y * (1.0 + saturation), 0.0, 1.0);
        
        // Apply hue shift (hue is in degrees, convert to 0-1 range)
        hsv.x = mod(hsv.x + hue / 360.0, 1.0);
        
        // Convert back to RGB
        rgb = hsv2rgb(hsv);
        
        // Apply intensity (mix with original)
        rgb = mix(color.rgb, rgb, intensity);
        
        gl_FragColor = vec4(rgb, color.a);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        brightness: { value: this.options.brightness },
        contrast: { value: this.options.contrast },
        saturation: { value: this.options.saturation },
        hue: { value: this.options.hue },
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

  setOptions(options: Partial<ColorGradingOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.material) {
      this.material.uniforms.brightness.value = this.options.brightness;
      this.material.uniforms.contrast.value = this.options.contrast;
      this.material.uniforms.saturation.value = this.options.saturation;
      this.material.uniforms.hue.value = this.options.hue;
    }
  }

  apply(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture | null, width: number, height: number): THREE.Texture | null {
    if (!inputTexture || !this.material || !this.scene || !this.camera || !this.renderTarget) {
      console.warn('[ColorGradingEffect] Cannot apply: missing dependencies', {
        hasInput: !!inputTexture,
        hasMaterial: !!this.material,
        hasScene: !!this.scene,
        hasCamera: !!this.camera,
        hasRenderTarget: !!this.renderTarget
      });
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    try {
      // Update shader uniforms
      this.material.uniforms.tDiffuse.value = inputTexture;
      this.material.uniforms.intensity.value = this.intensity;

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
      console.error('[ColorGradingEffect] Error applying color grading:', error);
      return inputTexture;
    }
  }

  setSize(width: number, height: number): void {
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
  }


  reset(): void {
    this.enabled = false;
    this.intensity = this.defaultIntensity;
    this.options = {
      brightness: 0.0,
      contrast: 0.0,
      saturation: 0.0,
      hue: 0.0,
    };
    // Update material uniforms
    if (this.material) {
      this.material.uniforms.brightness.value = this.options.brightness;
      this.material.uniforms.contrast.value = this.options.contrast;
      this.material.uniforms.saturation.value = this.options.saturation;
      this.material.uniforms.hue.value = this.options.hue;
    }
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

