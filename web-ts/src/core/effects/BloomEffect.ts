/**
 * Bloom/Glow Effect - Adds a glowing halo around bright areas
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class BloomEffect implements Effect {
  name = 'bloom';
  enabled = false;
  intensity = 0.0; // 0.0 = no bloom, 1.0 = maximum bloom

  private defaultIntensity = 0.0;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private thresholdMaterial: THREE.ShaderMaterial;
  private blurMaterial: THREE.ShaderMaterial;
  private compositeMaterial: THREE.ShaderMaterial;
  private thresholdRenderTarget: THREE.WebGLRenderTarget;
  private blurRenderTarget: THREE.WebGLRenderTarget;
  private finalRenderTarget: THREE.WebGLRenderTarget;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createBloomMaterials(width, height);
  }

  private createBloomMaterials(width: number, height: number): void {
    // Create render targets
    this.thresholdRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    this.blurRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    this.finalRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // Threshold shader - extracts bright areas
    const thresholdVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const thresholdFragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float threshold;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        if (brightness > threshold) {
          gl_FragColor = color;
        } else {
          gl_FragColor = vec4(0.0);
        }
      }
    `;

    this.thresholdMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        threshold: { value: 0.7 },
      },
      vertexShader: thresholdVertexShader,
      fragmentShader: thresholdFragmentShader,
    });

    // Blur shader - blurs the bright areas
    const blurVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const blurFragmentShader = `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform vec2 direction;
      varying vec2 vUv;

      void main() {
        vec4 color = vec4(0.0);
        vec2 pixelSize = 1.0 / resolution;
        vec2 offset = direction * pixelSize;
        
        // 9-tap Gaussian blur
        color += texture2D(tDiffuse, vUv - offset * 4.0) * 0.05;
        color += texture2D(tDiffuse, vUv - offset * 3.0) * 0.09;
        color += texture2D(tDiffuse, vUv - offset * 2.0) * 0.12;
        color += texture2D(tDiffuse, vUv - offset) * 0.15;
        color += texture2D(tDiffuse, vUv) * 0.18;
        color += texture2D(tDiffuse, vUv + offset) * 0.15;
        color += texture2D(tDiffuse, vUv + offset * 2.0) * 0.12;
        color += texture2D(tDiffuse, vUv + offset * 3.0) * 0.09;
        color += texture2D(tDiffuse, vUv + offset * 4.0) * 0.05;
        
        gl_FragColor = color;
      }
    `;

    this.blurMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        direction: { value: new THREE.Vector2(1.0, 0.0) },
      },
      vertexShader: blurVertexShader,
      fragmentShader: blurFragmentShader,
    });

    // Composite shader - combines original with bloom
    const compositeVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const compositeFragmentShader = `
      uniform sampler2D tDiffuse;
      uniform sampler2D tBloom;
      uniform float intensity;
      varying vec2 vUv;

      void main() {
        vec4 original = texture2D(tDiffuse, vUv);
        vec4 bloom = texture2D(tBloom, vUv);
        vec4 final = original + bloom * intensity;
        gl_FragColor = final;
      }
    `;

    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        intensity: { value: this.intensity },
      },
      vertexShader: compositeVertexShader,
      fragmentShader: compositeFragmentShader,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  apply(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture | null, width: number, height: number): THREE.Texture | null {
    if (!inputTexture || !this.thresholdMaterial || !this.blurMaterial || !this.compositeMaterial) {
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    try {
      const oldRenderTarget = renderer.getRenderTarget();

      // Step 1: Extract bright areas (threshold)
      const thresholdGeometry = new THREE.PlaneGeometry(2, 2);
      const thresholdMesh = new THREE.Mesh(thresholdGeometry, this.thresholdMaterial);
      const thresholdScene = new THREE.Scene();
      thresholdScene.add(thresholdMesh);
      
      this.thresholdMaterial.uniforms.tDiffuse.value = inputTexture;
      renderer.setRenderTarget(this.thresholdRenderTarget);
      renderer.clear();
      renderer.render(thresholdScene, this.camera);

      // Step 2: Blur horizontally
      this.blurMaterial.uniforms.tDiffuse.value = this.thresholdRenderTarget.texture;
      this.blurMaterial.uniforms.resolution.value.set(width, height);
      this.blurMaterial.uniforms.direction.value.set(1.0, 0.0);
      
      const blurHGeometry = new THREE.PlaneGeometry(2, 2);
      const blurHMesh = new THREE.Mesh(blurHGeometry, this.blurMaterial);
      const blurHScene = new THREE.Scene();
      blurHScene.add(blurHMesh);
      
      renderer.setRenderTarget(this.blurRenderTarget);
      renderer.clear();
      renderer.render(blurHScene, this.camera);

      // Step 3: Blur vertically
      this.blurMaterial.uniforms.tDiffuse.value = this.blurRenderTarget.texture;
      this.blurMaterial.uniforms.direction.value.set(0.0, 1.0);
      
      const blurVGeometry = new THREE.PlaneGeometry(2, 2);
      const blurVMesh = new THREE.Mesh(blurVGeometry, this.blurMaterial);
      const blurVScene = new THREE.Scene();
      blurVScene.add(blurVMesh);
      
      renderer.setRenderTarget(this.blurRenderTarget);
      renderer.clear();
      renderer.render(blurVScene, this.camera);

      // Step 4: Composite original with bloom
      this.compositeMaterial.uniforms.tDiffuse.value = inputTexture;
      this.compositeMaterial.uniforms.tBloom.value = this.blurRenderTarget.texture;
      this.compositeMaterial.uniforms.intensity.value = this.intensity;
      
      const compositeGeometry = new THREE.PlaneGeometry(2, 2);
      const compositeMesh = new THREE.Mesh(compositeGeometry, this.compositeMaterial);
      const compositeScene = new THREE.Scene();
      compositeScene.add(compositeMesh);
      
      renderer.setRenderTarget(this.finalRenderTarget);
      renderer.clear();
      renderer.render(compositeScene, this.camera);

      renderer.setRenderTarget(oldRenderTarget);

      // Clean up geometries
      thresholdGeometry.dispose();
      blurHGeometry.dispose();
      blurVGeometry.dispose();
      compositeGeometry.dispose();

      // Ensure texture is marked as updated
      const texture = this.finalRenderTarget.texture;
      texture.needsUpdate = true;
      
      return texture;
    } catch (error) {
      console.error('[BloomEffect] Error applying bloom:', error);
      return inputTexture;
    }
  }

  setSize(width: number, height: number): void {
    if (this.thresholdRenderTarget) {
      this.thresholdRenderTarget.setSize(width, height);
    }
    if (this.blurRenderTarget) {
      this.blurRenderTarget.setSize(width, height);
    }
    if (this.finalRenderTarget) {
      this.finalRenderTarget.setSize(width, height);
    }
    if (this.blurMaterial) {
      this.blurMaterial.uniforms.resolution.value.set(width, height);
    }
  }


  reset(): void {
    this.enabled = false;
    this.intensity = this.defaultIntensity;
  }


  dispose(): void {
    if (this.thresholdMaterial) {
      this.thresholdMaterial.dispose();
    }
    if (this.blurMaterial) {
      this.blurMaterial.dispose();
    }
    if (this.compositeMaterial) {
      this.compositeMaterial.dispose();
    }
    if (this.thresholdRenderTarget) {
      this.thresholdRenderTarget.dispose();
    }
    if (this.blurRenderTarget) {
      this.blurRenderTarget.dispose();
    }
    if (this.finalRenderTarget) {
      this.finalRenderTarget.dispose();
    }
  }
}


