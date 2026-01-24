/**
 * Echo Effect - Multiple delayed frames overlay
 */
import { Effect } from '../EffectManager';
import * as THREE from 'three';

export class EchoEffect implements Effect {
  name = 'echo';
  enabled = false;
  intensity = 0.0; // 0.0 = no echo, 1.0 = strong echo

  private defaultIntensity = 0.0;
  delay: number = 0.1; // Delay between echoes (0.0-1.0)
  count: number = 3; // Number of echo frames

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private historyRenderTargets: THREE.WebGLRenderTarget[] = [];
  private maxHistory: number = 10;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.createEchoMaterial(width, height);
  }

  private createEchoMaterial(width: number, height: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform sampler2D tEcho1;
      uniform sampler2D tEcho2;
      uniform sampler2D tEcho3;
      uniform float intensity;
      uniform float echoAlpha1;
      uniform float echoAlpha2;
      uniform float echoAlpha3;
      varying vec2 vUv;

      void main() {
        vec4 current = texture2D(tDiffuse, vUv);
        vec4 echo1 = texture2D(tEcho1, vUv);
        vec4 echo2 = texture2D(tEcho2, vUv);
        vec4 echo3 = texture2D(tEcho3, vUv);
        
        vec4 result = current;
        result += echo1 * echoAlpha1 * intensity;
        result += echo2 * echoAlpha2 * intensity;
        result += echo3 * echoAlpha3 * intensity;
        
        gl_FragColor = result;
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tEcho1: { value: null },
        tEcho2: { value: null },
        tEcho3: { value: null },
        intensity: { value: this.intensity },
        echoAlpha1: { value: 0.5 },
        echoAlpha2: { value: 0.3 },
        echoAlpha3: { value: 0.1 },
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
      console.warn('[EchoEffect] Cannot apply: missing dependencies');
      return inputTexture;
    }

    if (!this.enabled || this.intensity <= 0) {
      return inputTexture;
    }

    const oldRenderTarget = renderer.getRenderTarget();
    
    // Copy current frame to history render target
    const copyMaterial = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: inputTexture } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
        }
      `,
    });
    
    const copyScene = new THREE.Scene();
    const copyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMaterial);
    copyScene.add(copyMesh);
    
    // Create or reuse history render target
    let historyRT = this.historyRenderTargets.shift();
    if (!historyRT || historyRT.width !== width || historyRT.height !== height) {
      if (historyRT) historyRT.dispose();
      historyRT = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
    }
    
    renderer.setRenderTarget(historyRT);
    renderer.clear();
    renderer.render(copyScene, this.camera);
    
    // Store in history
    this.historyRenderTargets.push(historyRT);
    if (this.historyRenderTargets.length > this.maxHistory) {
      const old = this.historyRenderTargets.shift();
      if (old) old.dispose();
    }
    
    // Get echo frames (use frames from history)
    const echo1Tex = this.historyRenderTargets.length > 0 ? 
      this.historyRenderTargets[Math.min(0, this.historyRenderTargets.length - 1)].texture : inputTexture;
    const echo2Tex = this.historyRenderTargets.length > 1 ? 
      this.historyRenderTargets[Math.min(1, this.historyRenderTargets.length - 1)].texture : inputTexture;
    const echo3Tex = this.historyRenderTargets.length > 2 ? 
      this.historyRenderTargets[Math.min(2, this.historyRenderTargets.length - 1)].texture : inputTexture;

    this.material.uniforms.tDiffuse.value = inputTexture;
    this.material.uniforms.tEcho1.value = echo1Tex;
    this.material.uniforms.tEcho2.value = echo2Tex;
    this.material.uniforms.tEcho3.value = echo3Tex;
    this.material.uniforms.intensity.value = this.intensity;

    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(oldRenderTarget);
    
    // Clean up temporary material
    copyMaterial.dispose();
    copyMesh.geometry.dispose();

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
    this.delay = this.defaultDelay;
    this.count = this.defaultCount;
    // Clear history
    this.historyRenderTargets.forEach(rt => rt.dispose());
    this.historyRenderTargets = [];
  }

  dispose(): void {
    this.material?.dispose();
    this.renderTarget?.dispose();
    this.historyRenderTargets.forEach(rt => rt.dispose());
    this.historyRenderTargets = [];
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

