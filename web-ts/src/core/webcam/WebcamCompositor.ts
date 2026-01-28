/**
 * Webcam Compositor - Handles creative layering of webcam feed with animations
 * Supports background/foreground positioning, blend modes, opacity, and more
 */
import * as THREE from 'three';
import { WebcamService, WebcamFrame } from '../WebcamService';
import { EffectManager, Effect } from '../EffectManager';

export type WebcamBlendMode = 
  | 'normal'      // Standard alpha blending
  | 'multiply'    // Darken (multiply colors)
  | 'screen'      // Lighten (inverse multiply)
  | 'overlay'     // Mix of multiply and screen
  | 'add'         // Add colors (brighten)
  | 'subtract'    // Subtract colors (darken)
  | 'difference'  // Absolute difference
  | 'exclusion'   // Similar to difference but softer
  | 'soft-light'  // Soft light blend
  | 'hard-light'  // Hard light blend
  | 'color-dodge' // Brighten based on source
  | 'color-burn'  // Darken based on source
  | 'darken'      // Take darker of two colors
  | 'lighten'     // Take lighter of two colors
  | 'vivid-light' // Vivid light blend
  | 'linear-light' // Linear light blend
  | 'pin-light'   // Pin light blend
  | 'hue'         // Preserve hue from blend, saturation and luminosity from base
  | 'saturation'  // Preserve saturation from blend, hue and luminosity from base
  | 'color'       // Preserve hue and saturation from blend, luminosity from base
  | 'luminosity'; // Preserve luminosity from blend, hue and saturation from base

export type WebcamLayerPosition = 'background' | 'foreground';

export interface WebcamCompositorOptions {
  enabled: boolean;
  position: WebcamLayerPosition; // 'background' = behind animation, 'foreground' = on top
  opacity: number; // 0.0 to 1.0
  blendMode: WebcamBlendMode;
  chromaKeyEnabled: boolean;
  chromaKeyColor: [number, number, number]; // RGB color to key out (0-255)
  chromaKeyTolerance: number; // 0.0 to 1.0
  chromaKeySmoothness: number; // 0.0 to 1.0
  scale: number; // 0.1 to 2.0 (1.0 = full screen)
  positionX: number; // -1.0 to 1.0 (0 = center)
  positionY: number; // -1.0 to 1.0 (0 = center)
  rotation: number; // 0 to 360 degrees
  mirror: boolean; // Mirror horizontally
}

export class WebcamCompositor {
  private webcamService: WebcamService;
  private options: WebcamCompositorOptions;
  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;
  
  // Shader materials for blend modes and chroma key
  private webcamMaterial: THREE.ShaderMaterial | null = null;
  private webcamMesh: THREE.Mesh | null = null;
  private webcamGeometry: THREE.PlaneGeometry | null = null;
  
  // Effect management for webcam feed
  private effectManager: EffectManager | null = null;
  private webcamEffectRenderTarget: THREE.WebGLRenderTarget | null = null;

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.webcamService = WebcamService.getInstance();
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    
    this.options = {
      enabled: false,
      position: 'background',
      opacity: 1.0,
      blendMode: 'normal',
      chromaKeyEnabled: false,
      chromaKeyColor: [0, 255, 0], // Green by default
      chromaKeyTolerance: 0.3,
      chromaKeySmoothness: 0.1,
      scale: 1.0,
      positionX: 0.0,
      positionY: 0.0,
      rotation: 0.0,
      mirror: false,
    };
    
    // Create render target for webcam effects
    this.webcamEffectRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
  }
  
  /**
   * Set the effect manager for applying post-effects to webcam feed
   */
  setEffectManager(effectManager: EffectManager | null): void {
    this.effectManager = effectManager;
  }

  /**
   * Update compositor options
   */
  setOptions(options: Partial<WebcamCompositorOptions>): void {
    const positionChanged = options.position !== undefined && options.position !== this.options.position;
    const oldPosition = this.options.position;
    this.options = { ...this.options, ...options };
    
    // If position changed, remove mesh from scene so it can be re-added at correct time
    // This ensures the mesh is only rendered when it should be (background before animation, foreground after)
    if (positionChanged && this.webcamMesh) {
      // We need to remove it from whatever scene it's in
      // The scene reference is passed to render(), so we'll handle removal there
      // For now, just update the transform
      this.updateMeshTransform();
    }
    
    this.updateMaterial();
    
    // If scale changed, need to recreate geometry
    if (options.scale !== undefined && this.webcamGeometry) {
      this.webcamGeometry.dispose();
      this.webcamGeometry = new THREE.PlaneGeometry(
        this.width * this.options.scale,
        this.height * this.options.scale
      );
      if (this.webcamMesh) {
        this.webcamMesh.geometry = this.webcamGeometry;
        // Update transform to apply mirror if needed
        this.updateMeshTransform();
      }
    }
    
    // If mirror, position, or rotation changed, update transform
    if ((options.mirror !== undefined || options.positionX !== undefined || 
         options.positionY !== undefined || options.rotation !== undefined) && this.webcamMesh) {
      this.updateMeshTransform();
    }
  }

  /**
   * Get current options
   */
  getOptions(): WebcamCompositorOptions {
    return { ...this.options };
  }

  /**
   * Render webcam layer to a render target or directly to scene
   * @param scene The Three.js scene to render to
   * @param renderTarget Optional render target (not used currently)
   * @param animationWidth Optional animation frame width (eyesy.xres) - if provided, webcam will match this size
   * @param animationHeight Optional animation frame height (eyesy.yres) - if provided, webcam will match this size
   * @param backgroundTexture Optional texture of the current scene (for blend modes)
   */
  render(
    scene: THREE.Scene,
    renderTarget: THREE.WebGLRenderTarget | null = null,
    animationWidth?: number,
    animationHeight?: number,
    backgroundTexture?: THREE.Texture | null
  ): void {
    if (!this.options.enabled) {
      // Remove mesh from scene if disabled
      if (this.webcamMesh && scene.children.includes(this.webcamMesh)) {
        scene.remove(this.webcamMesh);
      }
      return;
    }

    const frame = this.webcamService.getFrame();
    if (!frame) {
      // Remove mesh from scene if no frame available
      if (this.webcamMesh && scene.children.includes(this.webcamMesh)) {
        scene.remove(this.webcamMesh);
      }
      // Debug: Log when no frame is available
      if (this.options.enabled && this.options.blendMode !== 'normal') {
        console.warn('[WebcamCompositor] No webcam frame available for blend mode:', this.options.blendMode);
      }
      return;
    }
    
    // Debug: Log webcam frame info for blend modes
    if (this.options.enabled && this.options.blendMode !== 'normal') {
    }
    
    // IMPORTANT: Always remove mesh from scene first, then re-add it
    // This ensures position changes (z-depth) take effect immediately
    // and prevents the mesh from being rendered at the wrong time
    if (this.webcamMesh && scene.children.includes(this.webcamMesh)) {
      scene.remove(this.webcamMesh);
    }

    // Use animation frame size if provided (prioritize animation size over full canvas)
    const targetWidth = animationWidth !== undefined ? animationWidth : this.width;
    const targetHeight = animationHeight !== undefined ? animationHeight : this.height;

    // Update size if it changed
    const sizeChanged = targetWidth !== this.width || targetHeight !== this.height;
    if (sizeChanged) {
      this.width = targetWidth;
      this.height = targetHeight;
      // Recreate geometry with new size if mesh already exists
      if (this.webcamGeometry && this.webcamMesh) {
        this.webcamGeometry.dispose();
        this.webcamGeometry = new THREE.PlaneGeometry(
          this.width * this.options.scale,
          this.height * this.options.scale
        );
        this.webcamMesh.geometry = this.webcamGeometry;
        // Update mesh transform in case position/scale changed
        this.updateMeshTransform();
      }
    }

    // Get webcam texture (raw or processed with effects)
    let webcamTexture = frame.texture;
    frame.texture.needsUpdate = true; // Ensure raw texture is updated
    
    // Apply post-effects to webcam feed if effect manager is available
    if (this.effectManager) {
      // Get all enabled post-effects
      const allPostEffects = this.effectManager.getEffects('post');
      const enabledEffects = allPostEffects.filter(e => e.enabled && e.intensity > 0);
      
      if (enabledEffects.length > 0) {
        // Ensure input texture is ready
        webcamTexture.needsUpdate = true;
        
        // Apply effects to webcam texture
        const processedTexture = this.effectManager.applyPostEffects(
          webcamTexture,
          targetWidth,
          targetHeight
        );
        
        if (processedTexture && processedTexture !== webcamTexture) {
          webcamTexture = processedTexture;
          // Mark processed texture as updated
          if (processedTexture.needsUpdate !== undefined) {
            processedTexture.needsUpdate = true;
          }
        }
      }
    }
    
    // Create or update webcam mesh
    if (!this.webcamMesh || !this.webcamMaterial) {
      // Create mesh with processed texture (if effects were applied)
      // We'll pass the processed texture to createWebcamMesh
      this.createWebcamMesh(frame, webcamTexture);
    } else {
      // Update texture (use processed texture if effects were applied)
      this.webcamMaterial.uniforms.webcamTexture.value = webcamTexture;
      webcamTexture.needsUpdate = true;
    }

    // Update background texture for blend modes
    if (this.webcamMaterial) {
      if (backgroundTexture) {
        // Ensure texture is properly configured
        backgroundTexture.flipY = false; // WebGL render targets don't need flipping
        this.webcamMaterial.uniforms.backgroundTexture.value = backgroundTexture;
        backgroundTexture.needsUpdate = true;
        
        // Debug: Log when background texture is set for non-normal blend modes
        if (this.options.blendMode !== 'normal') {
        }
      } else {
        // If no background texture provided, create a solid color texture
        // For background position, this should be the background color (not transparent)
        // For foreground position with no texture, use black as fallback
        // We'll create a white/neutral texture that will work for opacity blending
        if (!this.webcamMaterial.uniforms.backgroundTexture.value || 
            this.webcamMaterial.uniforms.backgroundTexture.value.image?.width === 1) {
          // Create a default solid color texture (white) for proper opacity blending
          // The actual background color will be handled by the scene's background
          const defaultData = new Uint8Array([255, 255, 255, 255]); // White, fully opaque
          const defaultTexture = new THREE.DataTexture(defaultData, 1, 1, THREE.RGBAFormat);
          defaultTexture.needsUpdate = true;
          this.webcamMaterial.uniforms.backgroundTexture.value = defaultTexture;
          
          // Warn if blend mode is not normal and no background texture is provided
          if (this.options.blendMode !== 'normal') {
            console.warn('[WebcamCompositor] Blend mode', this.options.blendMode, 'requires a background texture but none was provided. Using default white texture.');
          }
        }
      }
    }

    // Update uniforms (ensure opacity and other settings are current)
    this.updateMaterialUniforms();

    // Add to scene if not already added
    if (this.webcamMesh && !scene.children.includes(this.webcamMesh)) {
      scene.add(this.webcamMesh);
      // Debug: Log when webcam mesh is added
      if (this.options.blendMode !== 'normal') {
      }
    }
  }

  /**
   * Remove webcam from scene
   */
  removeFromScene(scene: THREE.Scene): void {
    if (this.webcamMesh && scene.children.includes(this.webcamMesh)) {
      scene.remove(this.webcamMesh);
    }
  }
  
  /**
   * Get the webcam mesh (for temporarily removing from scene to capture background)
   */
  getMesh(): THREE.Mesh | null {
    return this.webcamMesh;
  }

  /**
   * Create webcam mesh with shader material
   * @param frame The webcam frame (for reference)
   * @param texture The texture to use (may be processed with effects)
   */
  private createWebcamMesh(frame: WebcamFrame, texture?: THREE.Texture): void {
    // Dispose old geometry if exists
    if (this.webcamGeometry) {
      this.webcamGeometry.dispose();
    }
    if (this.webcamMaterial) {
      this.webcamMaterial.dispose();
    }

    // Create geometry (mirror is handled via mesh scale, not geometry)
    this.webcamGeometry = new THREE.PlaneGeometry(
      this.width * this.options.scale,
      this.height * this.options.scale
    );

    // Create shader material with blend mode and chroma key support
    const shader = this.createWebcamShader();
    this.webcamMaterial = new THREE.ShaderMaterial({
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Don't write to depth buffer for proper transparency
      depthTest: true, // Enable depth testing for proper z-ordering
    });

    // Set initial texture (use provided texture or fall back to frame texture)
    const initialTexture = texture || frame.texture;
    this.webcamMaterial.uniforms.webcamTexture.value = initialTexture;
    initialTexture.needsUpdate = true;

    // Create mesh
    this.webcamMesh = new THREE.Mesh(this.webcamGeometry, this.webcamMaterial);
    this.updateMeshTransform();
  }

  /**
   * Update material uniforms
   */
  private updateMaterialUniforms(): void {
    if (!this.webcamMaterial) return;

    const blendModeValue = this.getBlendModeValue();
    this.webcamMaterial.uniforms.opacity.value = this.options.opacity;
    this.webcamMaterial.uniforms.blendMode.value = blendModeValue;
    
    // Debug: Log opacity updates (only when opacity changes significantly)
    // Removed verbose logging - opacity is updated every frame
    this.webcamMaterial.uniforms.chromaKeyEnabled.value = this.options.chromaKeyEnabled ? 1.0 : 0.0;
    this.webcamMaterial.uniforms.chromaKeyColor.value = new THREE.Vector3(
      this.options.chromaKeyColor[0] / 255.0,
      this.options.chromaKeyColor[1] / 255.0,
      this.options.chromaKeyColor[2] / 255.0
    );
    this.webcamMaterial.uniforms.chromaKeyTolerance.value = this.options.chromaKeyTolerance;
    this.webcamMaterial.uniforms.chromaKeySmoothness.value = this.options.chromaKeySmoothness;
    
    // Debug: Log blend mode updates
    if (this.options.blendMode !== 'normal') {
    }
    
    // Opacity is handled in the shader, don't set it on material (would cause double opacity)
    // The shader outputs: gl_FragColor = vec4(finalColor, webcamColor.a * opacity)
    
    // Set blend mode using WebGL blend equations
    this.updateWebGLBlendMode();
  }

  /**
   * Update WebGL blend mode based on selected blend mode
   */
  private updateWebGLBlendMode(): void {
    if (!this.webcamMaterial) return;

    // For most blend modes, we need to use shader-based blending
    // But for basic opacity, we can use WebGL blending
    switch (this.options.blendMode) {
      case 'normal':
        // Standard alpha blending
        this.webcamMaterial.blending = THREE.NormalBlending;
        break;
      case 'multiply':
        this.webcamMaterial.blending = THREE.MultiplyBlending;
        break;
      case 'add':
        this.webcamMaterial.blending = THREE.AdditiveBlending;
        break;
      case 'subtract':
        // Three.js doesn't have subtract blending, use custom
        this.webcamMaterial.blending = THREE.CustomBlending;
        this.webcamMaterial.blendEquation = THREE.SubtractEquation;
        this.webcamMaterial.blendSrc = THREE.SrcAlphaFactor;
        this.webcamMaterial.blendDst = THREE.OneMinusSrcAlphaFactor;
        break;
      default:
        // For other blend modes, use normal blending (shader will handle it)
        this.webcamMaterial.blending = THREE.NormalBlending;
        break;
    }
  }

  /**
   * Update mesh transform (position, rotation)
   */
  private updateMeshTransform(): void {
    if (!this.webcamMesh) return;

    const x = (this.options.positionX * this.width) / 2;
    const y = -(this.options.positionY * this.height) / 2; // Flip Y for Three.js
    // Position webcam mesh:
    // - Background: z = -0.9 (slightly in front of background plane at z = -1, but still behind animation)
    // - Foreground: z = 1 (in front of animation)
    this.webcamMesh.position.set(x, y, this.options.position === 'background' ? -0.9 : 1);
    this.webcamMesh.rotation.z = (this.options.rotation * Math.PI) / 180;
    
    // Apply mirror transform via scale (negative X scale flips horizontally)
    const scaleX = this.options.mirror ? -1 : 1;
    this.webcamMesh.scale.set(scaleX, 1, 1);
  }

  /**
   * Update material when options change
   */
  private updateMaterial(): void {
    if (this.webcamMesh && this.webcamMaterial) {
      this.updateMaterialUniforms();
      this.updateMeshTransform();
    }
  }

  /**
   * Get blend mode as numeric value for shader
   */
  private getBlendModeValue(): number {
    const modes: { [key in WebcamBlendMode]: number } = {
      'normal': 0,
      'multiply': 1,
      'screen': 2,
      'overlay': 3,
      'add': 4,
      'subtract': 5,
      'difference': 6,
      'exclusion': 7,
      'soft-light': 8,
      'hard-light': 9,
      'color-dodge': 10,
      'color-burn': 11,
      'darken': 12,
      'lighten': 13,
      'vivid-light': 14,
      'linear-light': 15,
      'pin-light': 16,
      'hue': 17,
      'saturation': 18,
      'color': 19,
      'luminosity': 20,
    };
    return modes[this.options.blendMode] || 0;
  }

  /**
   * Create shader for webcam with blend modes and chroma key
   */
  private createWebcamShader(): {
    uniforms: { [uniform: string]: THREE.IUniform };
    vertexShader: string;
    fragmentShader: string;
  } {
    return {
      uniforms: {
        webcamTexture: { value: null },
        backgroundTexture: { value: null },
        opacity: { value: 1.0 },
        blendMode: { value: 0 },
        chromaKeyEnabled: { value: 0.0 },
        chromaKeyColor: { value: new THREE.Vector3(0, 1, 0) },
        chromaKeyTolerance: { value: 0.3 },
        chromaKeySmoothness: { value: 0.1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D webcamTexture;
        uniform sampler2D backgroundTexture;
        uniform float opacity;
        uniform float blendMode;
        uniform float chromaKeyEnabled;
        uniform vec3 chromaKeyColor;
        uniform float chromaKeyTolerance;
        uniform float chromaKeySmoothness;
        varying vec2 vUv;

        // Blend mode functions
        vec3 blendMultiply(vec3 base, vec3 blend) {
          return base * blend;
        }

        vec3 blendScreen(vec3 base, vec3 blend) {
          return 1.0 - (1.0 - base) * (1.0 - blend);
        }

        vec3 blendOverlay(vec3 base, vec3 blend) {
          // Standard overlay: multiply if base < 0.5, screen if base >= 0.5
          // Clamp blend values to prevent overflow
          vec3 clampedBlend = clamp(blend, 0.0, 1.0);
          vec3 result1 = blendMultiply(base, clamp(clampedBlend * 2.0, 0.0, 1.0));
          vec3 result2 = blendScreen(base, clamp(clampedBlend * 2.0 - 1.0, -1.0, 1.0));
          // Use step for hard edge (standard overlay behavior)
          return clamp(mix(result1, result2, step(0.5, base)), 0.0, 1.0);
        }

        vec3 blendAdd(vec3 base, vec3 blend) {
          return min(base + blend, 1.0);
        }

        vec3 blendSubtract(vec3 base, vec3 blend) {
          return max(base - blend, 0.0);
        }

        vec3 blendDifference(vec3 base, vec3 blend) {
          return abs(base - blend);
        }

        vec3 blendExclusion(vec3 base, vec3 blend) {
          return base + blend - 2.0 * base * blend;
        }

        vec3 blendSoftLight(vec3 base, vec3 blend) {
          vec3 result1 = 2.0 * base * blend + base * base * (1.0 - 2.0 * blend);
          vec3 result2 = sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
          return mix(result1, result2, step(0.5, blend));
        }

        vec3 blendHardLight(vec3 base, vec3 blend) {
          return blendOverlay(blend, base);
        }

        vec3 blendColorDodge(vec3 base, vec3 blend) {
          return base / (1.0 - blend + 0.0001);
        }

        vec3 blendColorBurn(vec3 base, vec3 blend) {
          return 1.0 - (1.0 - base) / (blend + 0.0001);
        }

        vec3 blendDarken(vec3 base, vec3 blend) {
          return min(base, blend);
        }

        vec3 blendLighten(vec3 base, vec3 blend) {
          return max(base, blend);
        }

        vec3 blendVividLight(vec3 base, vec3 blend) {
          // Clamp blend values to prevent overflow
          vec3 clampedBlend = clamp(blend, 0.0, 1.0);
          vec3 result1 = blendColorDodge(base, clamp(clampedBlend * 2.0, 0.0, 1.0));
          vec3 result2 = blendColorBurn(base, clamp((clampedBlend - 0.5) * 2.0, 0.0, 1.0));
          return clamp(mix(result1, result2, step(0.5, clampedBlend)), 0.0, 1.0);
        }

        vec3 blendLinearLight(vec3 base, vec3 blend) {
          // Clamp blend values to prevent overflow
          vec3 clampedBlend = clamp(blend, 0.0, 1.0);
          vec3 result1 = blendAdd(base, clamp(clampedBlend * 2.0 - 1.0, -1.0, 1.0));
          vec3 result2 = blendSubtract(base, clamp((1.0 - clampedBlend) * 2.0, 0.0, 2.0));
          return clamp(mix(result2, result1, step(0.5, clampedBlend)), 0.0, 1.0);
        }

        vec3 blendPinLight(vec3 base, vec3 blend) {
          // Clamp blend values to prevent overflow
          vec3 clampedBlend = clamp(blend, 0.0, 1.0);
          vec3 result1 = blendDarken(base, clamp(clampedBlend * 2.0, 0.0, 1.0));
          vec3 result2 = blendLighten(base, clamp((clampedBlend - 0.5) * 2.0, -1.0, 1.0));
          return clamp(mix(result1, result2, step(0.5, clampedBlend)), 0.0, 1.0);
        }

        // RGB to HSL conversion
        vec3 rgbToHsl(vec3 c) {
          // Clamp input to valid range
          c = clamp(c, 0.0, 1.0);
          float maxVal = max(max(c.r, c.g), c.b);
          float minVal = min(min(c.r, c.g), c.b);
          float delta = maxVal - minVal;
          float l = (maxVal + minVal) / 2.0;
          float h = 0.0;
          float s = 0.0;
          
          // Avoid division by zero
          if (delta > 0.0001) {
            s = l < 0.5 ? delta / (maxVal + minVal + 0.0001) : delta / (2.0 - maxVal - minVal + 0.0001);
            s = clamp(s, 0.0, 1.0);
            
            if (abs(maxVal - c.r) < 0.0001) {
              float temp = (c.g - c.b) / (delta + 0.0001);
              h = mod(temp + (c.g < c.b ? 6.0 : 0.0), 6.0) / 6.0;
            } else if (abs(maxVal - c.g) < 0.0001) {
              h = ((c.b - c.r) / (delta + 0.0001) + 2.0) / 6.0;
            } else {
              h = ((c.r - c.g) / (delta + 0.0001) + 4.0) / 6.0;
            }
            h = mod(h, 1.0);
          }
          return vec3(h, s, clamp(l, 0.0, 1.0));
        }

        // HSL to RGB conversion
        vec3 hslToRgb(vec3 hsl) {
          // Clamp input to valid range
          float h = mod(hsl.x, 1.0);
          float s = clamp(hsl.y, 0.0, 1.0);
          float l = clamp(hsl.z, 0.0, 1.0);
          
          float c = (1.0 - abs(2.0 * l - 1.0)) * s;
          float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
          float m = l - c / 2.0;
          
          vec3 rgb = vec3(0.0);
          float h6 = h * 6.0;
          if (h6 < 1.0) {
            rgb = vec3(c, x, 0.0);
          } else if (h6 < 2.0) {
            rgb = vec3(x, c, 0.0);
          } else if (h6 < 3.0) {
            rgb = vec3(0.0, c, x);
          } else if (h6 < 4.0) {
            rgb = vec3(0.0, x, c);
          } else if (h6 < 5.0) {
            rgb = vec3(x, 0.0, c);
          } else {
            rgb = vec3(c, 0.0, x);
          }
          return clamp(rgb + m, 0.0, 1.0);
        }

        vec3 blendHue(vec3 base, vec3 blend) {
          vec3 baseHsl = rgbToHsl(base);
          vec3 blendHsl = rgbToHsl(blend);
          return hslToRgb(vec3(blendHsl.x, baseHsl.y, baseHsl.z));
        }

        vec3 blendSaturation(vec3 base, vec3 blend) {
          vec3 baseHsl = rgbToHsl(base);
          vec3 blendHsl = rgbToHsl(blend);
          return hslToRgb(vec3(baseHsl.x, blendHsl.y, baseHsl.z));
        }

        vec3 blendColor(vec3 base, vec3 blend) {
          vec3 baseHsl = rgbToHsl(base);
          vec3 blendHsl = rgbToHsl(blend);
          return hslToRgb(vec3(blendHsl.x, blendHsl.y, baseHsl.z));
        }

        vec3 blendLuminosity(vec3 base, vec3 blend) {
          vec3 baseHsl = rgbToHsl(base);
          vec3 blendHsl = rgbToHsl(blend);
          return hslToRgb(vec3(baseHsl.x, baseHsl.y, blendHsl.z));
        }

        vec3 applyBlendMode(vec3 base, vec3 blend, float mode) {
          if (mode < 0.5) return blend; // normal
          else if (mode < 1.5) return blendMultiply(base, blend);
          else if (mode < 2.5) return blendScreen(base, blend);
          else if (mode < 3.5) return blendOverlay(base, blend);
          else if (mode < 4.5) return blendAdd(base, blend);
          else if (mode < 5.5) return blendSubtract(base, blend);
          else if (mode < 6.5) return blendDifference(base, blend);
          else if (mode < 7.5) return blendExclusion(base, blend);
          else if (mode < 8.5) return blendSoftLight(base, blend);
          else if (mode < 9.5) return blendHardLight(base, blend);
          else if (mode < 10.5) return blendColorDodge(base, blend);
          else if (mode < 11.5) return blendColorBurn(base, blend);
          else if (mode < 12.5) return blendDarken(base, blend);
          else if (mode < 13.5) return blendLighten(base, blend);
          else if (mode < 14.5) return blendVividLight(base, blend);
          else if (mode < 15.5) return blendLinearLight(base, blend);
          else if (mode < 16.5) return blendPinLight(base, blend);
          else if (mode < 17.5) return blendHue(base, blend);
          else if (mode < 18.5) return blendSaturation(base, blend);
          else if (mode < 19.5) return blendColor(base, blend);
          else return blendLuminosity(base, blend);
        }

        void main() {
          vec4 webcamColor = texture2D(webcamTexture, vUv);
          
          // Chroma key (green screen removal)
          if (chromaKeyEnabled > 0.5) {
            vec3 diff = abs(webcamColor.rgb - chromaKeyColor);
            float dist = length(diff);
            float alpha = smoothstep(
              chromaKeyTolerance - chromaKeySmoothness,
              chromaKeyTolerance + chromaKeySmoothness,
              dist
            );
            webcamColor.a *= alpha;
          }

          // Sample background texture for blending
          vec4 bgColor = texture2D(backgroundTexture, vUv);
          
          // Calculate effective opacity: combine webcam alpha with user opacity
          // This allows the webcam to fade out smoothly as opacity decreases
          float effectiveOpacity = webcamColor.a * opacity;
          
          // Apply blend mode
          vec3 finalColor;
          if (blendMode < 0.5) {
            // Normal blend: mix between background and webcam based on effective opacity
            // When opacity = 0: show only background (webcam invisible)
            // When opacity = 1: show webcam fully (if webcam alpha allows)
            finalColor = mix(bgColor.rgb, webcamColor.rgb, effectiveOpacity);
          } else {
            // Apply blend mode between background and webcam
            // base = background, blend = webcam (webcam is the layer being blended on top)
            // For blend modes, we need to apply the blend at full strength
            // Use the webcam color directly (not pre-multiplied by alpha) for blend calculations
            // This ensures blend modes work correctly even with transparent webcam areas
            vec3 webcamRgb = webcamColor.rgb;
            vec3 blended = applyBlendMode(bgColor.rgb, webcamRgb, blendMode);
            // Clamp blended result to valid range
            blended = clamp(blended, 0.0, 1.0);
            
            // For blend modes, the result should show the blended webcam
            // When opacity is 0, show original background (animation)
            // When opacity is 1, show full blend mode result (webcam blended with animation)
            // Use a stronger mix to make blend modes more visible
            float blendStrength = min(effectiveOpacity * 1.5, 1.0);
            finalColor = mix(bgColor.rgb, blended, blendStrength);
          }
          
          // Combine alpha channels
          // For blend modes, we want the result to be visible, so use maximum alpha
          // This ensures the blended webcam is visible even when animation has transparency
          float finalAlpha = max(bgColor.a, effectiveOpacity);
          // Ensure minimum alpha for blend modes so they're always visible
          if (blendMode >= 0.5) {
            finalAlpha = max(finalAlpha, 0.1); // Minimum alpha for blend modes
          }
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
    };
  }

  /**
   * Resize compositor
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    if (this.webcamGeometry) {
      this.webcamGeometry.dispose();
      this.webcamGeometry = new THREE.PlaneGeometry(
        width * this.options.scale,
        height * this.options.scale
      );
      if (this.webcamMesh) {
        this.webcamMesh.geometry = this.webcamGeometry;
      }
    }
    
    // Resize effect render target
    if (this.webcamEffectRenderTarget) {
      this.webcamEffectRenderTarget.setSize(width, height);
    }
    
    this.updateMeshTransform();
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.webcamGeometry) {
      this.webcamGeometry.dispose();
    }
    if (this.webcamMaterial) {
      this.webcamMaterial.dispose();
    }
    if (this.webcamEffectRenderTarget) {
      this.webcamEffectRenderTarget.dispose();
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.webcamGeometry) {
      this.webcamGeometry.dispose();
      this.webcamGeometry = null;
    }
    if (this.webcamMaterial) {
      this.webcamMaterial.dispose();
      this.webcamMaterial = null;
    }
    this.webcamMesh = null;
  }
}


