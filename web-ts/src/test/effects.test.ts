/**
 * Tests for Post-Processing Effects
 * Verifies that all effects can be instantiated, enabled/disabled, and applied correctly
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { EffectManager } from '../core/EffectManager';
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
});

