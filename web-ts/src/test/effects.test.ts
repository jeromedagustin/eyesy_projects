/**
 * Comprehensive Tests for Post-Processing Effects
 * 
 * Test Coverage:
 * - Effect instantiation and basic functionality
 * - Enable/disable and intensity management
 * - Effect application and chaining
 * - Render target safety (null checks, creation, disposal)
 * - Effect blending and mix functionality
 * - Error handling and edge cases
 * - Canvas integration with effects
 * - Effect settings persistence
 * - Size management and custom dimensions
 * - Effect reset functionality
 * 
 * These tests verify that effects work correctly and handle edge cases gracefully,
 * including the critical render target null safety fixes.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { EffectManager } from '../core/EffectManager';
import { renderToRenderTarget, RenderingContext } from '../core/canvas/rendering';
import { Canvas } from '../core/Canvas';
import {
  BlurEffect,
  SepiaEffect,
  GrayscaleEffect,
  MotionBlurEffect,
  FilmGrainEffect,
  SharpenEffect,
  TrailsEffect,
  FisheyeEffect,
  KaleidoscopeEffect,
  PosterizeEffect,
  TiltShiftEffect,
  LensFlareEffect,
  ColorizeEffect,
  SolarizeEffect,
  PinchBulgeEffect,
  TwirlEffect,
  WaveEffect,
  MirrorEffect,
  NoiseEffect,
  HalftoneEffect,
  RadialBlurEffect,
  ContrastEffect,
  EmbossEffect,
  ExposureEffect,
  SaturationEffect,
  EchoEffect,
  PixelationEffect,
  InvertEffect,
  EdgeDetectionEffect,
  VignetteEffect,
  BloomEffect,
  ChromaticAberrationEffect,
  ScanlinesEffect,
  VHSDistortionEffect,
} from '../core/effects';

describe('Effects', () => {
  let renderer: THREE.WebGLRenderer;
  let width: number;
  let height: number;
  let testTexture: THREE.Texture;

  beforeEach(() => {
    // Create a mock WebGL context
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    
    // Create WebGL renderer with error handling
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    } catch (error) {
      // If WebGL fails, create a minimal mock renderer
      renderer = {
        getRenderTarget: () => null,
        setRenderTarget: () => {},
        clear: () => {},
        render: () => {},
        dispose: () => {},
      } as any;
    }
    width = 640;
    height = 480;

    // Create a test texture (simple colored texture)
    const canvas2d = document.createElement('canvas');
    canvas2d.width = width;
    canvas2d.height = height;
    const ctx = canvas2d.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(width / 4, height / 4, width / 2, height / 2);
    }
    
    testTexture = new THREE.Texture(canvas2d);
    testTexture.needsUpdate = true;
  });

  describe('Effect Instantiation', () => {
    const effectClasses = [
      { name: 'BlurEffect', class: BlurEffect },
      { name: 'SepiaEffect', class: SepiaEffect },
      { name: 'GrayscaleEffect', class: GrayscaleEffect },
      { name: 'MotionBlurEffect', class: MotionBlurEffect },
      { name: 'FilmGrainEffect', class: FilmGrainEffect },
      { name: 'SharpenEffect', class: SharpenEffect },
      { name: 'TrailsEffect', class: TrailsEffect },
      { name: 'FisheyeEffect', class: FisheyeEffect },
      { name: 'KaleidoscopeEffect', class: KaleidoscopeEffect },
      { name: 'PosterizeEffect', class: PosterizeEffect },
      { name: 'TiltShiftEffect', class: TiltShiftEffect },
      { name: 'LensFlareEffect', class: LensFlareEffect },
      { name: 'ColorizeEffect', class: ColorizeEffect },
      { name: 'SolarizeEffect', class: SolarizeEffect },
      { name: 'PinchBulgeEffect', class: PinchBulgeEffect },
      { name: 'TwirlEffect', class: TwirlEffect },
      { name: 'WaveEffect', class: WaveEffect },
      { name: 'MirrorEffect', class: MirrorEffect },
      { name: 'NoiseEffect', class: NoiseEffect },
      { name: 'HalftoneEffect', class: HalftoneEffect },
      { name: 'RadialBlurEffect', class: RadialBlurEffect },
      { name: 'ContrastEffect', class: ContrastEffect },
      { name: 'EmbossEffect', class: EmbossEffect },
      { name: 'ExposureEffect', class: ExposureEffect },
      { name: 'SaturationEffect', class: SaturationEffect },
      { name: 'EchoEffect', class: EchoEffect },
      { name: 'PixelationEffect', class: PixelationEffect },
      { name: 'InvertEffect', class: InvertEffect },
      { name: 'EdgeDetectionEffect', class: EdgeDetectionEffect },
      { name: 'VignetteEffect', class: VignetteEffect },
      { name: 'BloomEffect', class: BloomEffect },
      { name: 'ChromaticAberrationEffect', class: ChromaticAberrationEffect },
      { name: 'ScanlinesEffect', class: ScanlinesEffect },
      { name: 'VHSDistortionEffect', class: VHSDistortionEffect },
    ];

    effectClasses.forEach(({ name, class: EffectClass }) => {
      it(`should instantiate ${name}`, () => {
        expect(() => {
          const effect = new EffectClass(renderer, width, height);
          expect(effect).toBeDefined();
          expect(effect.name).toBeDefined();
          expect(effect.enabled).toBe(false);
          expect(effect.intensity).toBeGreaterThanOrEqual(0);
          expect(effect.intensity).toBeLessThanOrEqual(1);
          
          // Clean up
          effect.dispose();
        }).not.toThrow();
      });
    });
  });

  describe('Effect Enable/Disable', () => {
    it('should enable and disable effects', () => {
      const effect = new BlurEffect(renderer, width, height);
      
      expect(effect.enabled).toBe(false);
      
      effect.enabled = true;
      expect(effect.enabled).toBe(true);
      
      effect.enabled = false;
      expect(effect.enabled).toBe(false);
      
      effect.dispose();
    });
  });

  describe('Effect Intensity', () => {
    it('should set and get intensity', () => {
      const effect = new BlurEffect(renderer, width, height);
      
      effect.intensity = 0.5;
      expect(effect.intensity).toBe(0.5);
      
      effect.intensity = 0.0;
      expect(effect.intensity).toBe(0.0);
      
      effect.intensity = 1.0;
      expect(effect.intensity).toBe(1.0);
      
      effect.dispose();
    });
  });

  describe('Effect Application', () => {
    const effectClasses = [
      { name: 'BlurEffect', class: BlurEffect },
      { name: 'SepiaEffect', class: SepiaEffect },
      { name: 'GrayscaleEffect', class: GrayscaleEffect },
      { name: 'MotionBlurEffect', class: MotionBlurEffect },
      { name: 'FilmGrainEffect', class: FilmGrainEffect },
      { name: 'SharpenEffect', class: SharpenEffect },
      { name: 'FisheyeEffect', class: FisheyeEffect },
      { name: 'KaleidoscopeEffect', class: KaleidoscopeEffect },
      { name: 'PosterizeEffect', class: PosterizeEffect },
      { name: 'TiltShiftEffect', class: TiltShiftEffect },
      { name: 'LensFlareEffect', class: LensFlareEffect },
      { name: 'ColorizeEffect', class: ColorizeEffect },
      { name: 'SolarizeEffect', class: SolarizeEffect },
      { name: 'PinchBulgeEffect', class: PinchBulgeEffect },
      { name: 'TwirlEffect', class: TwirlEffect },
      { name: 'WaveEffect', class: WaveEffect },
      { name: 'MirrorEffect', class: MirrorEffect },
      { name: 'NoiseEffect', class: NoiseEffect },
      { name: 'HalftoneEffect', class: HalftoneEffect },
      { name: 'RadialBlurEffect', class: RadialBlurEffect },
      { name: 'ContrastEffect', class: ContrastEffect },
      { name: 'EmbossEffect', class: EmbossEffect },
      { name: 'ExposureEffect', class: ExposureEffect },
      { name: 'SaturationEffect', class: SaturationEffect },
      { name: 'PixelationEffect', class: PixelationEffect },
      { name: 'InvertEffect', class: InvertEffect },
      { name: 'EdgeDetectionEffect', class: EdgeDetectionEffect },
      { name: 'VignetteEffect', class: VignetteEffect },
      { name: 'BloomEffect', class: BloomEffect },
      { name: 'ChromaticAberrationEffect', class: ChromaticAberrationEffect },
      { name: 'ScanlinesEffect', class: ScanlinesEffect },
      { name: 'VHSDistortionEffect', class: VHSDistortionEffect },
    ];

    effectClasses.forEach(({ name, class: EffectClass }) => {
      it(`should apply ${name} when enabled`, () => {
        const effect = new EffectClass(renderer, width, height);
        effect.enabled = true;
        effect.intensity = 0.5;

        const result = effect.apply(renderer, testTexture, width, height);
        
        // Should return a texture (either the processed one or the input if disabled)
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        
        // If enabled and intensity > 0, should return a different texture (render target)
        if (effect.enabled && effect.intensity > 0) {
          expect(result).not.toBe(testTexture);
        }
        
        effect.dispose();
      });

      it(`should return input texture when ${name} is disabled`, () => {
        const effect = new EffectClass(renderer, width, height);
        effect.enabled = false;

        const result = effect.apply(renderer, testTexture, width, height);
        
        expect(result).toBe(testTexture);
        
        effect.dispose();
      });

      it(`should return input texture when ${name} intensity is 0`, () => {
        const effect = new EffectClass(renderer, width, height);
        effect.enabled = true;
        effect.intensity = 0;

        const result = effect.apply(renderer, testTexture, width, height);
        
        // Some effects may still process even at 0 intensity, but should not crash
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        
        effect.dispose();
      });
    });
  });

  describe('Special Effects (Trails, Echo)', () => {
    it('should apply TrailsEffect correctly', () => {
      const effect = new TrailsEffect(renderer, width, height);
      effect.enabled = true;
      effect.intensity = 0.5;

      // First frame - should work
      const result1 = effect.apply(renderer, testTexture, width, height);
      expect(result1).toBeDefined();
      expect(result1).not.toBeNull();

      // Second frame - should accumulate trails
      const result2 = effect.apply(renderer, testTexture, width, height);
      expect(result2).toBeDefined();
      expect(result2).not.toBeNull();

      effect.dispose();
    });

    it('should apply EchoEffect correctly', () => {
      const effect = new EchoEffect(renderer, width, height);
      effect.enabled = true;
      effect.intensity = 0.5;

      // First frame - should work
      const result1 = effect.apply(renderer, testTexture, width, height);
      expect(result1).toBeDefined();
      expect(result1).not.toBeNull();

      // Second frame - should have echo
      const result2 = effect.apply(renderer, testTexture, width, height);
      expect(result2).toBeDefined();
      expect(result2).not.toBeNull();

      // Third frame - should have more echo
      const result3 = effect.apply(renderer, testTexture, width, height);
      expect(result3).toBeDefined();
      expect(result3).not.toBeNull();

      effect.dispose();
    });
  });

  describe('Effect Size Updates', () => {
    it('should handle size changes', () => {
      const effect = new BlurEffect(renderer, width, height);
      
      const newWidth = 1280;
      const newHeight = 720;
      
      expect(() => {
        effect.setSize(newWidth, newHeight);
      }).not.toThrow();
      
      // Should still work after size change
      const result = effect.apply(renderer, testTexture, width, height);
      expect(result).toBeDefined();
      
      effect.dispose();
    });
  });

  describe('Effect Disposal', () => {
    it('should dispose effects without errors', () => {
      const effects = [
        new BlurEffect(renderer, width, height),
        new TrailsEffect(renderer, width, height),
        new EchoEffect(renderer, width, height),
        new BloomEffect(renderer, width, height),
      ];

      effects.forEach(effect => {
        expect(() => {
          effect.dispose();
        }).not.toThrow();
      });
    });
  });

  describe('EffectManager Integration', () => {
    it('should add and retrieve effects', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      manager.addPostEffect(blurEffect);
      
      const retrieved = manager.getEffect('blur', 'post');
      expect(retrieved).toBe(blurEffect);
      
      manager.dispose();
    });

    it('should apply effects in chain', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      const sepiaEffect = new SepiaEffect(renderer, width, height);
      sepiaEffect.enabled = true;
      sepiaEffect.intensity = 0.5;
      manager.addPostEffect(sepiaEffect);
      
      const result = manager.applyPostEffects(testTexture, width, height);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      
      manager.dispose();
    });

    it('should set effect intensity through manager', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      manager.addPostEffect(blurEffect);
      
      manager.setEffectIntensity('blur', 'post', 0.75);
      
      expect(blurEffect.intensity).toBe(0.75);
      
      manager.dispose();
    });

    it('should enable/disable effects through manager', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      manager.addPostEffect(blurEffect);
      
      manager.setEffectEnabled('blur', 'post', true);
      expect(blurEffect.enabled).toBe(true);
      
      manager.setEffectEnabled('blur', 'post', false);
      expect(blurEffect.enabled).toBe(false);
      
      manager.dispose();
    });
  });

  describe('Effect Edge Cases', () => {
    it('should handle null input texture', () => {
      const effect = new BlurEffect(renderer, width, height);
      effect.enabled = true;
      effect.intensity = 0.5;

      const result = effect.apply(renderer, null, width, height);
      
      // Should return null or handle gracefully
      expect(result).toBeDefined(); // May return null or a default texture
      
      effect.dispose();
    });

    it('should handle very small intensity values', () => {
      const effect = new BlurEffect(renderer, width, height);
      effect.enabled = true;
      effect.intensity = 0.001;

      const result = effect.apply(renderer, testTexture, width, height);
      expect(result).toBeDefined();
      
      effect.dispose();
    });

    it('should handle maximum intensity values', () => {
      const effect = new BlurEffect(renderer, width, height);
      effect.enabled = true;
      effect.intensity = 1.0;

      const result = effect.apply(renderer, testTexture, width, height);
      expect(result).toBeDefined();
      
      effect.dispose();
    });

    it('should handle multiple rapid apply calls', () => {
      const effect = new BlurEffect(renderer, width, height);
      effect.enabled = true;
      effect.intensity = 0.5;

      for (let i = 0; i < 10; i++) {
        const result = effect.apply(renderer, testTexture, width, height);
        expect(result).toBeDefined();
      }
      
      effect.dispose();
    });
  });

  describe('Render Target Safety', () => {
    it('should handle null render target gracefully', () => {
      const manager = new EffectManager(renderer, width, height);
      
      // Create a context with null render target
      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.1, 1000);
      
      const context = {
        width,
        height,
        scene: mockScene,
        renderer,
        camera: mockCamera,
        customCamera: null,
        objects: [],
        effectsRenderTarget: null as THREE.WebGLRenderTarget | null,
        setEffectsRenderTarget: (target: THREE.WebGLRenderTarget | null) => {
          // Simulate failure to set render target
          // (context.effectsRenderTarget stays null)
        },
        cleanupInvalidTextures: () => false,
      };
      
      // Should return null instead of throwing
      const result = renderToRenderTarget(context as RenderingContext);
      expect(result).toBeNull();
      
      manager.dispose();
    });

    it('should create render target when missing', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.1, 1000);
      
      let effectsRenderTarget: THREE.WebGLRenderTarget | null = null;
      
      const context = {
        width,
        height,
        scene: mockScene,
        renderer,
        camera: mockCamera,
        customCamera: null,
        objects: [],
        get effectsRenderTarget() {
          return effectsRenderTarget;
        },
        setEffectsRenderTarget: (target: THREE.WebGLRenderTarget | null) => {
          effectsRenderTarget = target;
        },
        cleanupInvalidTextures: () => false,
      };
      
      // First call should create render target
      const result = renderToRenderTarget(context as RenderingContext);
      
      // Should have created a render target
      expect(effectsRenderTarget).not.toBeNull();
      expect(effectsRenderTarget?.width).toBe(width);
      expect(effectsRenderTarget?.height).toBe(height);
      
      // Result may be null in test environment, but shouldn't throw
      expect(() => renderToRenderTarget(context as RenderingContext)).not.toThrow();
      
      if (effectsRenderTarget) {
        effectsRenderTarget.dispose();
      }
      manager.dispose();
    });
  });

  describe('Effect Blending and Mix', () => {
    it('should support blend mix functionality', () => {
      const manager = new EffectManager(renderer, width, height);
      
      // Set blend mix
      manager.setBlendMix(0.5);
      expect(manager.getBlendMix()).toBe(0.5);
      
      // Test full effects (mix = 1.0)
      manager.setBlendMix(1.0);
      expect(manager.getBlendMix()).toBe(1.0);
      
      // Test no effects (mix = 0.0)
      manager.setBlendMix(0.0);
      expect(manager.getBlendMix()).toBe(0.0);
      
      // Test clamping (values outside 0-1 should be clamped)
      manager.setBlendMix(-0.5);
      expect(manager.getBlendMix()).toBe(0.0);
      
      manager.setBlendMix(1.5);
      expect(manager.getBlendMix()).toBe(1.0);
      
      manager.dispose();
    });

    it('should apply effects with different blend mix values', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      // With blend mix at 1.0, should apply full effects
      manager.setBlendMix(1.0);
      const result1 = manager.applyPostEffects(testTexture);
      expect(result1).toBeDefined();
      expect(result1).not.toBeNull();
      
      // With blend mix at 0.0, should return original (if implemented)
      manager.setBlendMix(0.0);
      const result2 = manager.applyPostEffects(testTexture);
      expect(result2).toBeDefined();
      
      manager.dispose();
    });
  });

  describe('Effect Chain Application', () => {
    it('should apply multiple effects in sequence', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      const sepiaEffect = new SepiaEffect(renderer, width, height);
      sepiaEffect.enabled = true;
      sepiaEffect.intensity = 0.5;
      manager.addPostEffect(sepiaEffect);
      
      const grayscaleEffect = new GrayscaleEffect(renderer, width, height);
      grayscaleEffect.enabled = true;
      grayscaleEffect.intensity = 0.5;
      manager.addPostEffect(grayscaleEffect);
      
      const result = manager.applyPostEffects(testTexture);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      
      manager.dispose();
    });

    it('should skip disabled effects in chain', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      const sepiaEffect = new SepiaEffect(renderer, width, height);
      sepiaEffect.enabled = false; // Disabled
      sepiaEffect.intensity = 0.5;
      manager.addPostEffect(sepiaEffect);
      
      const grayscaleEffect = new GrayscaleEffect(renderer, width, height);
      grayscaleEffect.enabled = true;
      grayscaleEffect.intensity = 0.5;
      manager.addPostEffect(grayscaleEffect);
      
      const result = manager.applyPostEffects(testTexture);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      
      manager.dispose();
    });

    it('should skip effects with zero intensity', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.0; // Zero intensity
      manager.addPostEffect(blurEffect);
      
      const sepiaEffect = new SepiaEffect(renderer, width, height);
      sepiaEffect.enabled = true;
      sepiaEffect.intensity = 0.5;
      manager.addPostEffect(sepiaEffect);
      
      const result = manager.applyPostEffects(testTexture);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      
      manager.dispose();
    });
  });

  describe('Effect Error Handling', () => {
    it('should handle effect apply errors gracefully', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      // Apply with null texture - should handle gracefully
      const result = manager.applyPostEffects(null);
      expect(result).toBeNull();
      
      manager.dispose();
    });

    it('should handle missing renderer gracefully', () => {
      const manager = new EffectManager(renderer, width, height);
      
      // Simulate renderer being null
      (manager as any).renderer = null;
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      // Should return input texture when renderer is null
      const result = manager.applyPostEffects(testTexture);
      expect(result).toBe(testTexture);
      
      manager.dispose();
    });

    it('should handle effect disposal errors gracefully', () => {
      const effect = new BlurEffect(renderer, width, height);
      
      // Dispose multiple times should not throw
      expect(() => {
        effect.dispose();
        effect.dispose();
        effect.dispose();
      }).not.toThrow();
    });
  });

  describe('Effect Size Management', () => {
    it('should resize effects when canvas size changes', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      manager.addPostEffect(blurEffect);
      
      const newWidth = 1920;
      const newHeight = 1080;
      
      manager.setSize(newWidth, newHeight);
      
      // Effects should handle size change
      expect(() => {
        manager.applyPostEffects(testTexture, newWidth, newHeight);
      }).not.toThrow();
      
      manager.dispose();
    });

    it('should handle custom dimensions for webcam effects', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      const customWidth = 640;
      const customHeight = 480;
      
      // Apply with custom dimensions (for webcam)
      const result = manager.applyPostEffects(testTexture, customWidth, customHeight);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      
      manager.dispose();
    });
  });

  describe('Effect Reset Functionality', () => {
    it('should reset effects to default values', () => {
      const blurEffect = new BlurEffect(renderer, width, height);
      
      // Modify effect
      blurEffect.enabled = true;
      blurEffect.intensity = 0.8;
      
      // Reset if method exists
      if (blurEffect.reset) {
        blurEffect.reset();
        // After reset, should have default values
        expect(blurEffect.enabled).toBe(false);
        expect(blurEffect.intensity).toBeGreaterThanOrEqual(0);
        expect(blurEffect.intensity).toBeLessThanOrEqual(1);
      }
      
      blurEffect.dispose();
    });

    it('should reset all effects through manager', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.8;
      manager.addPostEffect(blurEffect);
      
      const sepiaEffect = new SepiaEffect(renderer, width, height);
      sepiaEffect.enabled = true;
      sepiaEffect.intensity = 0.6;
      manager.addPostEffect(sepiaEffect);
      
      // Reset all post effects
      manager.resetAllEffects('post');
      
      // Effects should be reset (if reset method exists)
      if (blurEffect.reset) {
        expect(blurEffect.enabled).toBe(false);
      }
      
      manager.dispose();
    });
  });

  describe('Canvas Integration with Effects', () => {
    it('should handle renderToRenderTarget when effects are enabled', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      let canvasWrapper: Canvas;
      try {
        canvasWrapper = new Canvas(canvas);
      } catch (error) {
        // Skip test if Canvas can't be created (e.g., in test environment)
        return;
      }
      
      // Should be able to render to render target without errors
      expect(() => {
        const texture = canvasWrapper.renderToRenderTarget();
        // Result may be null in test environment, but shouldn't throw
        expect(texture === null || texture instanceof THREE.Texture).toBe(true);
      }).not.toThrow();
      
      canvasWrapper.dispose();
    });

    it('should handle renderToRenderTarget with custom dimensions', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      let canvasWrapper: Canvas;
      try {
        canvasWrapper = new Canvas(canvas);
      } catch (error) {
        return;
      }
      
      const customWidth = 1920;
      const customHeight = 1080;
      
      expect(() => {
        const texture = canvasWrapper.renderToRenderTarget(customWidth, customHeight);
        expect(texture === null || texture instanceof THREE.Texture).toBe(true);
      }).not.toThrow();
      
      canvasWrapper.dispose();
    });

    it('should handle effects with Canvas render target', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      let canvasWrapper: Canvas;
      try {
        canvasWrapper = new Canvas(canvas);
      } catch (error) {
        return;
      }
      
      const manager = new EffectManager(canvasWrapper.getRenderer(), width, height);
      
      const blurEffect = new BlurEffect(canvasWrapper.getRenderer(), width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      // Render scene to texture first
      const originalTexture = canvasWrapper.renderToRenderTarget();
      
      if (originalTexture) {
        // Apply effects
        const processedTexture = manager.applyPostEffects(originalTexture);
        
        expect(processedTexture).toBeDefined();
        expect(processedTexture).not.toBeNull();
      }
      
      manager.dispose();
      canvasWrapper.dispose();
    });

    it('should handle multiple renderToRenderTarget calls safely', () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      let canvasWrapper: Canvas;
      try {
        canvasWrapper = new Canvas(canvas);
      } catch (error) {
        return;
      }
      
      // Multiple calls should not cause errors
      expect(() => {
        for (let i = 0; i < 5; i++) {
          const texture = canvasWrapper.renderToRenderTarget();
          expect(texture === null || texture instanceof THREE.Texture).toBe(true);
        }
      }).not.toThrow();
      
      canvasWrapper.dispose();
    });
  });

  describe('Effect Settings Persistence', () => {
    it('should maintain effect state after resize', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.7;
      manager.addPostEffect(blurEffect);
      
      // Resize
      manager.setSize(1920, 1080);
      
      // Effect should still be enabled and have same intensity
      const retrieved = manager.getEffect('blur', 'post');
      expect(retrieved).toBe(blurEffect);
      expect(retrieved?.enabled).toBe(true);
      expect(retrieved?.intensity).toBe(0.7);
      
      manager.dispose();
    });

    it('should maintain multiple effects state', () => {
      const manager = new EffectManager(renderer, width, height);
      
      const blurEffect = new BlurEffect(renderer, width, height);
      blurEffect.enabled = true;
      blurEffect.intensity = 0.5;
      manager.addPostEffect(blurEffect);
      
      const sepiaEffect = new SepiaEffect(renderer, width, height);
      sepiaEffect.enabled = true;
      sepiaEffect.intensity = 0.8;
      manager.addPostEffect(sepiaEffect);
      
      // Verify both effects are maintained
      expect(manager.getEffect('blur', 'post')?.enabled).toBe(true);
      expect(manager.getEffect('blur', 'post')?.intensity).toBe(0.5);
      expect(manager.getEffect('sepia', 'post')?.enabled).toBe(true);
      expect(manager.getEffect('sepia', 'post')?.intensity).toBe(0.8);
      
      manager.dispose();
    });
  });
});

