/**
 * Effect Manager - Pre and post-processing effects system
 * Applies effects before and after mode drawing
 */
import { Canvas } from './Canvas';
import * as THREE from 'three';

export interface Effect {
  name: string;
  enabled: boolean;
  intensity: number; // 0.0 to 1.0
  apply(renderer: THREE.WebGLRenderer, inputTexture: THREE.Texture | null, width: number, height: number): THREE.Texture | null;
  dispose?(): void;
  setSize?(width: number, height: number): void;
  reset?(): void; // Reset effect to default values
}

export type EffectType = 'pre' | 'post';

export class EffectManager {
  private preEffects: Effect[] = [];
  private postEffects: Effect[] = [];
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private renderTarget2: THREE.WebGLRenderTarget | null = null; // For ping-pong rendering
  private width: number;
  private height: number;
  private renderer: THREE.WebGLRenderer | null = null;
  private blendMix: number = 1.0; // 0.0 = original, 1.0 = full effects

  constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    this.createRenderTargets();
  }

  /**
   * Create render targets for effect processing
   */
  private createRenderTargets(): void {
    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    this.renderTarget2 = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
  }

  /**
   * Resize render targets
   */
  setSize(width: number, height: number): void {
    if (this.width === width && this.height === height) {
      return; // No change needed
    }

    this.width = width;
    this.height = height;

    // Dispose old targets
    if (this.renderTarget) {
      this.renderTarget.dispose();
    }
    if (this.renderTarget2) {
      this.renderTarget2.dispose();
    }

    // Create new targets
    this.createRenderTargets();

    // Notify all effects of size change
    [...this.preEffects, ...this.postEffects].forEach(effect => {
      if (effect.setSize) {
        effect.setSize(width, height);
      }
    });
  }

  /**
   * Add a pre-processing effect (applied before mode drawing)
   */
  addPreEffect(effect: Effect): void {
    this.preEffects.push(effect);
  }

  /**
   * Add a post-processing effect (applied after mode drawing)
   */
  addPostEffect(effect: Effect): void {
    this.postEffects.push(effect);
  }

  /**
   * Remove an effect by name
   */
  removeEffect(name: string, type: EffectType): void {
    const effects = type === 'pre' ? this.preEffects : this.postEffects;
    const index = effects.findIndex(e => e.name === name);
    if (index >= 0) {
      const effect = effects[index];
      if (effect.dispose) {
        effect.dispose();
      }
      effects.splice(index, 1);
    }
  }

  /**
   * Get an effect by name
   */
  getEffect(name: string, type: EffectType): Effect | undefined {
    const effects = type === 'pre' ? this.preEffects : this.postEffects;
    return effects.find(e => e.name === name);
  }

  /**
   * Enable/disable an effect
   */
  setEffectEnabled(name: string, type: EffectType, enabled: boolean): void {
    const effect = this.getEffect(name, type);
    if (effect) {
      effect.enabled = enabled;
    }
  }

  /**
   * Set effect intensity
   */
  setEffectIntensity(name: string, type: EffectType, intensity: number): void {
    const effect = this.getEffect(name, type);
    if (effect) {
      effect.intensity = Math.max(0, Math.min(1, intensity));
    }
  }

  /**
   * Set overall blend mix (0.0 = original, 1.0 = full effects)
   */
  setBlendMix(mix: number): void {
    this.blendMix = Math.max(0, Math.min(1, mix));
  }

  /**
   * Get overall blend mix
   */
  getBlendMix(): number {
    return this.blendMix;
  }

  /**
   * Apply pre-effects to a texture (before mode drawing)
   * Returns processed texture or null if no effects
   */
  applyPreEffects(inputTexture: THREE.Texture | null): THREE.Texture | null {
    if (!inputTexture || !this.renderer || this.preEffects.length === 0) {
      return inputTexture;
    }

    let currentTexture = inputTexture;

    // Apply each enabled pre-effect
    for (const effect of this.preEffects) {
      if (!effect.enabled || effect.intensity <= 0) {
        continue;
      }

      // Apply effect
      const result = effect.apply(this.renderer, currentTexture, this.width, this.height);
      
      if (result && result !== currentTexture) {
        currentTexture = result;
      }
    }

    return currentTexture;
  }

  /**
   * Apply post-effects to the final rendered frame
   * This is called after mode drawing is complete
   * @param inputTexture The input texture to process
   * @param customWidth Optional custom width (for webcam effects)
   * @param customHeight Optional custom height (for webcam effects)
   */
  applyPostEffects(
    inputTexture: THREE.Texture | null,
    customWidth?: number,
    customHeight?: number
  ): THREE.Texture | null {
    if (!inputTexture || !this.renderer) {
      return inputTexture;
    }

    // Early exit if no enabled effects
    const hasEnabledEffects = this.postEffects.some(e => e.enabled && e.intensity > 0);
    if (!hasEnabledEffects) {
      return inputTexture;
    }

    // Use custom dimensions if provided (for webcam), otherwise use default
    const effectWidth = customWidth !== undefined ? customWidth : this.width;
    const effectHeight = customHeight !== undefined ? customHeight : this.height;

    let currentTexture = inputTexture;

    // Apply each enabled post-effect
    for (const effect of this.postEffects) {
      if (!effect.enabled || effect.intensity <= 0) {
        continue;
      }

      // Apply effect with custom dimensions if provided
      const result = effect.apply(this.renderer, currentTexture, effectWidth, effectHeight);
      
      if (result && result !== currentTexture) {
        currentTexture = result;
      }
    }

    return currentTexture;
  }

  /**
   * Get all effects of a type
   */
  getEffects(type: EffectType): Effect[] {
    return type === 'pre' ? [...this.preEffects] : [...this.postEffects];
  }

  /**
   * Get all post-effects (convenience method)
   */
  getPostEffects(): Effect[] {
    return [...this.postEffects];
  }

  /**
   * Get all pre-effects (convenience method)
   */
  getPreEffects(): Effect[] {
    return [...this.preEffects];
  }

  /**
   * Reset a specific effect to default values
   */
  resetEffect(name: string, type: EffectType): void {
    const effect = this.getEffect(name, type);
    if (effect && effect.reset) {
      effect.reset();
    }
  }

  /**
   * Reset all effects of a type to default values
   */
  resetAllEffects(type: EffectType): void {
    const effects = type === 'pre' ? this.preEffects : this.postEffects;
    effects.forEach(effect => {
      if (effect.reset) {
        effect.reset();
      }
    });
  }

  /**
   * Clear all effects
   */
  clearEffects(type?: EffectType): void {
    if (type === 'pre') {
      this.preEffects.forEach(e => e.dispose?.());
      this.preEffects = [];
    } else if (type === 'post') {
      this.postEffects.forEach(e => e.dispose?.());
      this.postEffects = [];
    } else {
      this.preEffects.forEach(e => e.dispose?.());
      this.postEffects.forEach(e => e.dispose?.());
      this.preEffects = [];
      this.postEffects = [];
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearEffects();
    
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    
    if (this.renderTarget2) {
      this.renderTarget2.dispose();
      this.renderTarget2 = null;
    }
  }
}

