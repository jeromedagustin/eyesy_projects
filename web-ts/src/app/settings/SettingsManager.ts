/**
 * Settings management - loading, saving, and applying settings
 */
import { AppSettings, SettingsStorage } from '../../core/SettingsStorage';
import { Controls } from '../../ui/Controls';
import { EffectManager } from '../../core/EffectManager';
import { EYESYImpl } from '../../core/EYESY';

export interface SettingsManagerContext {
  // State getters
  getTransitionsEnabled(): boolean;
  getTransitionDuration(): number;
  getTransitionType(): string | null;
  getEyesy(): EYESYImpl;
  getRandomSequenceEnabled(): boolean;
  getRandomSequenceFrequency(): number;
  getRandomColorEnabled(): boolean;
  getRandomColorFrequency(): number;
  getRandomTriggerEnabled(): boolean;
  getRandomTriggerFrequency(): number;
  getMockAudioEnabled(): boolean;
  getMockAudioFrequency(): number;
  getMockAudioIntensityRandomness(): number;
  getKnob1Locked(): boolean;
  getKnob2Locked(): boolean;
  getKnob3Locked(): boolean;
  getKnob4Locked(): boolean;
  getKnob5Locked(): boolean;
  getKnob6Locked(): boolean;
  getKnob7Locked(): boolean;
  getKnob9Locked(): boolean;
  getKnob10Locked(): boolean;
  getMicrophoneAudio(): any; // MicrophoneAudio
  getUseMicrophone(): boolean;
  getWebcamPermissionGranted(): boolean;
  getLeftHanded(): boolean;
  getPortraitRotate(): boolean;
  getFavorites(): string[];
  getShowOnlyFavorites(): boolean;
  getTargetFPS(): number;
  getEffectManager(): EffectManager | null;
  
  // State setters
  setTransitionsEnabled(enabled: boolean): void;
  setTransitionDuration(duration: number): void;
  setTransitionType(type: string | null): void;
  setRandomSequenceEnabled(enabled: boolean): void;
  setRandomSequenceFrequency(freq: number): void;
  setRandomColorEnabled(enabled: boolean): void;
  setRandomColorFrequency(freq: number): void;
  setRandomTriggerEnabled(enabled: boolean): void;
  setRandomTriggerFrequency(freq: number): void;
  setMockAudioEnabled(enabled: boolean): void;
  setMockAudioFrequency(freq: number): void;
  setMockAudioIntensityRandomness(val: number): void;
  setKnob1Locked(locked: boolean): void;
  setKnob2Locked(locked: boolean): void;
  setKnob3Locked(locked: boolean): void;
  setKnob4Locked(locked: boolean): void;
  setKnob5Locked(locked: boolean): void;
  setKnob6Locked(locked: boolean): void;
  setKnob7Locked(locked: boolean): void;
  setKnob9Locked(locked: boolean): void;
  setKnob10Locked(locked: boolean): void;
  setUseMicrophone(use: boolean): void;
  setWebcamPermissionGranted(granted: boolean): void;
  setLeftHanded(left: boolean): void;
  setPortraitRotate(rotate: boolean): void;
  setFavorites(favs: string[]): void;
  setShowOnlyFavorites(show: boolean): void;
  setTargetFPS(fps: number): void;
  
  // Methods
  applyPortraitRotate(rotate: boolean): void;
  getEffectSettings(): { [effectName: string]: { enabled: boolean; intensity: number; [key: string]: any } };
}

export class SettingsManager {
  private settingsStorage: SettingsStorage;
  private controls: Controls;
  private context: SettingsManagerContext;
  private saveSettingsTimeout: number | null = null;

  constructor(
    settingsStorage: SettingsStorage,
    controls: Controls,
    context: SettingsManagerContext
  ) {
    this.settingsStorage = settingsStorage;
    this.controls = controls;
    this.context = context;
  }

  /**
   * Load settings from storage and apply to state
   */
  async loadSettings(): Promise<Partial<AppSettings> | null> {
    try {
      const settings = await this.settingsStorage.loadSettings();
      if (settings) {
        const ctx = this.context;
        
        // Load transition settings
        if (settings.transitionsEnabled !== undefined) {
          ctx.setTransitionsEnabled(settings.transitionsEnabled);
        }
        if (settings.transitionDuration !== undefined) {
          ctx.setTransitionDuration(settings.transitionDuration);
        }
        if (settings.transitionType !== undefined) {
          ctx.setTransitionType(settings.transitionType);
        }

        // Load knob values
        if (settings.knob1 !== undefined) ctx.getEyesy().knob1 = settings.knob1;
        if (settings.knob2 !== undefined) ctx.getEyesy().knob2 = settings.knob2;
        if (settings.knob3 !== undefined) ctx.getEyesy().knob3 = settings.knob3;
        if (settings.knob4 !== undefined) ctx.getEyesy().knob4 = settings.knob4;
        if (settings.knob5 !== undefined) ctx.getEyesy().knob5 = settings.knob5;
        if (settings.knob6 !== undefined) ctx.getEyesy().knob6 = settings.knob6;
        if (settings.knob7 !== undefined) ctx.getEyesy().knob7 = settings.knob7;
        if (settings.knob8 !== undefined) ctx.getEyesy().knob8 = settings.knob8;
        if (settings.knob9 !== undefined) ctx.getEyesy().knob9 = settings.knob9;
        if (settings.knob10 !== undefined) ctx.getEyesy().knob10 = settings.knob10;

        // Load feature toggles
        if (settings.autoClear !== undefined) {
          ctx.getEyesy().auto_clear = settings.autoClear;
        }
        if (settings.randomSequenceEnabled !== undefined) {
          ctx.setRandomSequenceEnabled(settings.randomSequenceEnabled);
        }
        if (settings.randomSequenceFrequency !== undefined) {
          ctx.setRandomSequenceFrequency(settings.randomSequenceFrequency);
        }
        if (settings.randomColorEnabled !== undefined) {
          ctx.setRandomColorEnabled(settings.randomColorEnabled);
        }
        if (settings.randomColorFrequency !== undefined) {
          ctx.setRandomColorFrequency(settings.randomColorFrequency);
        }
        if (settings.randomTriggerEnabled !== undefined) {
          ctx.setRandomTriggerEnabled(settings.randomTriggerEnabled);
        }
        if (settings.randomTriggerFrequency !== undefined) {
          ctx.setRandomTriggerFrequency(settings.randomTriggerFrequency);
        }
        
        // Load knob lock states
        if (settings.knob1Locked !== undefined) {
          ctx.setKnob1Locked(settings.knob1Locked);
        }
        if (settings.knob2Locked !== undefined) {
          ctx.setKnob2Locked(settings.knob2Locked);
        }
        if (settings.knob3Locked !== undefined) {
          ctx.setKnob3Locked(settings.knob3Locked);
        }
        if (settings.knob4Locked !== undefined) {
          ctx.setKnob4Locked(settings.knob4Locked);
        }
        if (settings.knob5Locked !== undefined) {
          ctx.setKnob5Locked(settings.knob5Locked);
        }
        if (settings.knob6Locked !== undefined) {
          ctx.setKnob6Locked(settings.knob6Locked);
        }
        if (settings.knob7Locked !== undefined) {
          ctx.setKnob7Locked(settings.knob7Locked);
        }
        if (settings.knob9Locked !== undefined) {
          ctx.setKnob9Locked(settings.knob9Locked);
        }
        if (settings.knob10Locked !== undefined) {
          ctx.setKnob10Locked(settings.knob10Locked);
        }

        // Load UI settings
        if (settings.leftHanded !== undefined) {
          ctx.setLeftHanded(settings.leftHanded);
        }
        if (settings.portraitRotate !== undefined) {
          ctx.setPortraitRotate(settings.portraitRotate);
        }
        if (settings.favorites !== undefined) {
          ctx.setFavorites(settings.favorites);
        }
        if (settings.showOnlyFavorites !== undefined) {
          ctx.setShowOnlyFavorites(settings.showOnlyFavorites);
        }

        // Load font settings
        if (settings.fontFamily !== undefined) {
          ctx.getEyesy().font_family = settings.fontFamily;
        }
        if (settings.fontText !== undefined) {
          ctx.getEyesy().font_text = settings.fontText;
        }

        // Load microphone settings
        if (settings.micGain !== undefined && ctx.getMicrophoneAudio()) {
          ctx.getMicrophoneAudio().setGain(settings.micGain);
        }
        if (settings.useMicrophone !== undefined) {
          ctx.setUseMicrophone(settings.useMicrophone);
        }

        // Load webcam permission state
        if (settings.webcamPermissionGranted !== undefined) {
          ctx.setWebcamPermissionGranted(settings.webcamPermissionGranted);
        }

        // Load target FPS
        if (settings.targetFPS !== undefined) {
          ctx.setTargetFPS(settings.targetFPS);
        }

        // Load effect settings
        if (settings.activeEffects && ctx.getEffectManager()) {
          Object.entries(settings.activeEffects).forEach(([name, config]) => {
            const effect = ctx.getEffectManager()!.getEffect(name, 'post');
            if (effect) {
              effect.enabled = config.enabled;
              effect.intensity = config.intensity;
              
              // Load additional options for Color Grading
              if (name === 'colorGrading' && config.options && (effect as any).setOptions) {
                (effect as any).setOptions(config.options);
              }
            }
          });
        }

        return settings;
      }
      return null;
    } catch (error) {
      console.warn('Failed to load settings:', error);
      return null;
    }
  }

  /**
   * Apply loaded settings to UI controls
   */
  applyLoadedSettingsToUI(settings: Partial<AppSettings>): void {
    const ctx = this.context;
    
    // Update knob values in UI
    for (let i = 1; i <= 10; i++) {
      const knobValue = (settings as any)[`knob${i}`];
      if (knobValue !== undefined) {
        this.controls.updateKnobValue(i, knobValue);
      }
    }

    // Update transition settings
    this.controls.updateTransitionSettings(
      ctx.getTransitionsEnabled(),
      ctx.getTransitionDuration(),
      ctx.getTransitionType()
    );

    // Update left-handed setting
    if (settings.leftHanded !== undefined) {
      this.controls.updateLeftHanded(settings.leftHanded);
    }

    // Update portrait rotate setting
    if (settings.portraitRotate !== undefined) {
      this.controls.updateCheckboxSetting('portrait-rotate', settings.portraitRotate);
      ctx.applyPortraitRotate(settings.portraitRotate);
    }
    
    // Update favorites settings (applied after modeBrowser is created in setupModeSelector)
    if (settings.showOnlyFavorites !== undefined) {
      ctx.setShowOnlyFavorites(settings.showOnlyFavorites);
    }
    
    // Update knob lock states
    if (settings.knob1Locked !== undefined) {
      ctx.setKnob1Locked(settings.knob1Locked);
      this.controls.updateKnobLock(1, settings.knob1Locked);
    }
    if (settings.knob2Locked !== undefined) {
      ctx.setKnob2Locked(settings.knob2Locked);
      this.controls.updateKnobLock(2, settings.knob2Locked);
    }
    if (settings.knob3Locked !== undefined) {
      ctx.setKnob3Locked(settings.knob3Locked);
      this.controls.updateKnobLock(3, settings.knob3Locked);
    }
    if (settings.knob4Locked !== undefined) {
      ctx.setKnob4Locked(settings.knob4Locked);
      this.controls.updateKnobLock(4, settings.knob4Locked);
    }
    if (settings.knob5Locked !== undefined) {
      ctx.setKnob5Locked(settings.knob5Locked);
      this.controls.updateKnobLock(5, settings.knob5Locked);
    }
    if (settings.knob6Locked !== undefined) {
      ctx.setKnob6Locked(settings.knob6Locked);
      this.controls.updateKnobLock(6, settings.knob6Locked);
    }
    if (settings.knob7Locked !== undefined) {
      ctx.setKnob7Locked(settings.knob7Locked);
      this.controls.updateKnobLock(7, settings.knob7Locked);
    }
    if (settings.knob9Locked !== undefined) {
      ctx.setKnob9Locked(settings.knob9Locked);
      this.controls.updateKnobLock(9, settings.knob9Locked);
    }
    if (settings.knob10Locked !== undefined) {
      ctx.setKnob10Locked(settings.knob10Locked);
      this.controls.updateKnobLock(10, settings.knob10Locked);
    }
    
    // Update active effects UI
    if (settings.activeEffects && ctx.getEffectManager()) {
      Object.entries(settings.activeEffects).forEach(([name, config]) => {
        // Convert camelCase to kebab-case for UI element IDs
        const kebabName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
        
        // Update checkbox
        this.controls.updateCheckboxSetting(`effect-${kebabName}-enabled`, config.enabled);
        
        // Update intensity slider
        const intensitySlider = document.getElementById(`effect-${kebabName}-intensity`) as HTMLInputElement;
        const intensityValue = document.getElementById(`effect-${kebabName}-intensity-value`);
        const intensityValueContainer = intensityValue?.parentElement as HTMLElement;
        const resetBtn = document.querySelector(`button.effect-reset-btn[data-effect="${kebabName}"]`) as HTMLElement;
        
        if (intensitySlider) {
          intensitySlider.value = config.intensity.toString();
          intensitySlider.style.display = config.enabled ? 'block' : 'none';
          intensitySlider.style.visibility = config.enabled ? 'visible' : 'hidden';
        }
        if (intensityValue) {
          intensityValue.textContent = config.intensity.toFixed(2);
          intensityValue.style.display = config.enabled ? 'inline' : 'none';
          intensityValue.style.visibility = config.enabled ? 'visible' : 'hidden';
        }
        if (intensityValueContainer) {
          intensityValueContainer.style.display = config.enabled ? 'flex' : 'none';
          intensityValueContainer.style.visibility = config.enabled ? 'visible' : 'hidden';
        }
        if (resetBtn) {
          resetBtn.style.display = config.enabled ? 'inline-block' : 'none';
          resetBtn.style.visibility = config.enabled ? 'visible' : 'hidden';
        }
        
        // Update Color Grading specific sliders
        if (name === 'colorGrading' && config.options) {
          const brightnessSlider = document.getElementById('color-grading-brightness') as HTMLInputElement;
          const contrastSlider = document.getElementById('color-grading-contrast') as HTMLInputElement;
          const saturationSlider = document.getElementById('color-grading-saturation') as HTMLInputElement;
          const hueSlider = document.getElementById('color-grading-hue') as HTMLInputElement;
          
          const brightnessValue = document.getElementById('color-grading-brightness-value');
          const contrastValue = document.getElementById('color-grading-contrast-value');
          const saturationValue = document.getElementById('color-grading-saturation-value');
          const hueValue = document.getElementById('color-grading-hue-value');
          
          if (brightnessSlider) brightnessSlider.value = config.options.brightness.toString();
          if (brightnessValue) brightnessValue.textContent = config.options.brightness.toFixed(2);
          
          if (contrastSlider) contrastSlider.value = config.options.contrast.toString();
          if (contrastValue) contrastValue.textContent = config.options.contrast.toFixed(2);
          
          if (saturationSlider) saturationSlider.value = config.options.saturation.toString();
          if (saturationValue) saturationValue.textContent = config.options.saturation.toFixed(2);
          
          if (hueSlider) hueSlider.value = config.options.hue.toString();
          if (hueValue) hueValue.textContent = `${config.options.hue}°`;
        }
      });
    }

    // Update font settings
    if (settings.fontFamily !== undefined || settings.fontText !== undefined) {
      this.controls.updateFontSettings(
        settings.fontFamily || 'Arial, sans-serif',
        settings.fontText || ''
      );
    }

    // Update auto clear button
    if (settings.autoClear !== undefined) {
      this.controls.updateAutoClear(settings.autoClear);
    } else {
      this.controls.updateAutoClear(ctx.getEyesy().auto_clear);
    }
    
    if (settings.randomSequenceEnabled !== undefined) {
      this.controls.updateCheckboxSetting('random-sequence', settings.randomSequenceEnabled);
      if (settings.randomSequenceFrequency !== undefined) {
        this.controls.updateFrequencySlider('random-sequence-frequency', settings.randomSequenceFrequency);
      }
    }
    if (settings.randomColorEnabled !== undefined) {
      this.controls.updateCheckboxSetting('random-color', settings.randomColorEnabled);
      if (settings.randomColorFrequency !== undefined) {
        this.controls.updateFrequencySlider('random-color-frequency', settings.randomColorFrequency);
      }
    }
    if (settings.randomTriggerEnabled !== undefined) {
      this.controls.updateCheckboxSetting('random-trigger', settings.randomTriggerEnabled);
      if (settings.randomTriggerFrequency !== undefined) {
        this.controls.updateFrequencySlider('random-trigger-frequency', settings.randomTriggerFrequency);
      }
    }
    if (settings.mockAudioEnabled !== undefined) {
      ctx.setMockAudioEnabled(settings.mockAudioEnabled);
      this.controls.updateMockAudioEnabled(settings.mockAudioEnabled);
      if (settings.mockAudioFrequency !== undefined) {
        ctx.setMockAudioFrequency(settings.mockAudioFrequency);
        this.controls.updateMockAudioFrequency(settings.mockAudioFrequency);
      }
      if (settings.mockAudioIntensityRandomness !== undefined) {
        ctx.setMockAudioIntensityRandomness(settings.mockAudioIntensityRandomness);
        this.controls.updateMockAudioIntensityRandomness(settings.mockAudioIntensityRandomness);
      }
    }

    // Update microphone enabled state
    if (settings.useMicrophone !== undefined) {
      this.controls.updateMicrophoneEnabled(settings.useMicrophone);
    }

    // Update mic gain
    if (settings.micGain !== undefined) {
      this.controls.updateMicGain(settings.micGain);
    }

    // Update target FPS
    if (settings.targetFPS !== undefined) {
      this.controls.updateTargetFPS(settings.targetFPS);
    }
  }

  /**
   * Get current effect settings for saving
   */
  getEffectSettings(): { [effectName: string]: { enabled: boolean; intensity: number; [key: string]: any } } {
    return this.context.getEffectSettings();
  }

  /**
   * Save current settings to storage
   */
  async saveSettings(): Promise<void> {
    try {
      const ctx = this.context;
      const settings: Partial<AppSettings> = {
        transitionsEnabled: ctx.getTransitionsEnabled(),
        transitionDuration: ctx.getTransitionDuration(),
        transitionType: ctx.getTransitionType(),
        knob1: ctx.getEyesy().knob1,
        knob2: ctx.getEyesy().knob2,
        knob3: ctx.getEyesy().knob3,
        knob4: ctx.getEyesy().knob4,
        knob5: ctx.getEyesy().knob5,
        knob6: ctx.getEyesy().knob6 ?? 0,
        knob7: ctx.getEyesy().knob7 ?? 0.5,
        knob8: ctx.getEyesy().knob8 ?? 0.5,
        knob9: ctx.getEyesy().knob9 ?? 0.5,
        knob10: ctx.getEyesy().knob10 ?? 0.5,
        autoClear: ctx.getEyesy().auto_clear,
        randomSequenceEnabled: ctx.getRandomSequenceEnabled(),
        randomSequenceFrequency: ctx.getRandomSequenceFrequency(),
        randomColorEnabled: ctx.getRandomColorEnabled(),
        randomColorFrequency: ctx.getRandomColorFrequency(),
        randomTriggerEnabled: ctx.getRandomTriggerEnabled(),
        randomTriggerFrequency: ctx.getRandomTriggerFrequency(),
        mockAudioEnabled: ctx.getMockAudioEnabled(),
        mockAudioFrequency: ctx.getMockAudioFrequency(),
        mockAudioIntensityRandomness: ctx.getMockAudioIntensityRandomness(),
        knob1Locked: ctx.getKnob1Locked(),
        knob2Locked: ctx.getKnob2Locked(),
        knob3Locked: ctx.getKnob3Locked(),
        knob4Locked: ctx.getKnob4Locked(),
        knob5Locked: ctx.getKnob5Locked(),
        knob6Locked: ctx.getKnob6Locked(),
        knob7Locked: ctx.getKnob7Locked(),
        knob9Locked: ctx.getKnob9Locked(),
        knob10Locked: ctx.getKnob10Locked(),
        micGain: ctx.getMicrophoneAudio()?.getGain() ?? 5.0,
        useMicrophone: ctx.getUseMicrophone(),
        webcamPermissionGranted: ctx.getWebcamPermissionGranted(),
        leftHanded: ctx.getLeftHanded(),
        portraitRotate: ctx.getPortraitRotate(),
        favorites: ctx.getFavorites(),
        showOnlyFavorites: ctx.getShowOnlyFavorites(),
        targetFPS: ctx.getTargetFPS(),
        activeEffects: ctx.getEffectManager() ? this.getEffectSettings() : {},
        effectsBlendMix: ctx.getEffectManager()?.getBlendMix() ?? 1.0,
      };
      await this.settingsStorage.saveSettings(settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }

  /**
   * Debounced save settings (waits 500ms after last change)
   */
  debouncedSaveSettings(): void {
    if (this.saveSettingsTimeout) {
      clearTimeout(this.saveSettingsTimeout);
    }
    this.saveSettingsTimeout = window.setTimeout(() => {
      this.saveSettings();
    }, 500);
  }
}
