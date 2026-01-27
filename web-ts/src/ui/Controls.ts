/**
 * UI Controls for EYESY
 */
export class Controls {
  private container: HTMLElement;
  private _eyesy: any; // EYESY interface (reserved for future use)
  private onKnobChange?: (knob: number, value: number) => void;
  private onTrigger?: () => void;
  private onAutoClearChange?: (value: boolean) => void;
  private onMicGainChange?: (value: number) => void;
  private onRandomSequenceChange?: (value: boolean) => void;
  private onRandomColorChange?: (value: boolean) => void;
  private onKnobLockToggle?: (knob: number, locked: boolean) => void;
  private onRandomSequenceFrequencyChange?: (value: number) => void;
  private onRandomColorFrequencyChange?: (value: number) => void;
  private onRandomTriggerChange?: (value: boolean) => void;
  private onRandomTriggerFrequencyChange?: (value: number) => void;
  private onMockAudioChange?: (value: boolean) => void;
  private onMockAudioFrequencyChange?: (value: number) => void;
  private onMockAudioIntensityRandomnessChange?: (value: number) => void;
  private onRandomModeChange?: (value: boolean) => void;
  private onRandomModeFrequencyChange?: (value: number) => void;
  private onLockModeChange?: (value: boolean) => void;
  private onTransitionEnabledChange?: (value: boolean) => void;
  private onTransitionDurationChange?: (value: number) => void;
  private onTransitionTypeChange?: (value: string) => void;
  private onLeftHandedChange?: (value: boolean) => void;
  private onPortraitRotateChange?: (value: boolean) => void;
  private onFontFamilyChange?: (value: string) => void;
  private onFontTextChange?: (value: string) => void;
  private onSeizureSafeChange?: (value: boolean) => void;
  private onTargetFPSChange?: (value: number) => void;
  private onRewind?: () => void;
  private onFastForward?: () => void;
  private onRewindJump?: (index: number) => void;
  private onReversePlaybackChange?: (enabled: boolean) => void;
  private onWebcamEnableChange?: (value: boolean) => void;
  private onWebcamDeviceChange?: (deviceId: string) => void;
  private onWebcamCompositorChange?: (options: {
    enabled?: boolean;
    position?: 'background' | 'foreground';
    opacity?: number;
    blendMode?: string;
    chromaKeyEnabled?: boolean;
    chromaKeyColor?: [number, number, number];
    chromaKeyTolerance?: number;
    chromaKeySmoothness?: number;
    scale?: number;
    positionX?: number;
    positionY?: number;
    rotation?: number;
    mirror?: boolean;
  }) => void;
  private onEffectEnabledChange?: (effectName: string, enabled: boolean) => void;
  private onEffectIntensityChange?: (effectName: string, intensity: number) => void;
  private onWebcamEffectEnabledChange?: (effectName: string, enabled: boolean) => void;
  private onWebcamEffectIntensityChange?: (effectName: string, intensity: number) => void;
  private onEffectsBlendMixChange?: (value: number) => void;
  private onColorGradingBrightnessChange?: (value: number) => void;
  private onColorGradingContrastChange?: (value: number) => void;
  private onColorGradingSaturationChange?: (value: number) => void;
  private onColorGradingHueChange?: (value: number) => void;

  constructor(container: HTMLElement, eyesy: any) {
    this.container = container;
    this._eyesy = eyesy;
    this.render();
  }

  setOnKnobChange(callback: (knob: number, value: number) => void) {
    this.onKnobChange = callback;
  }

  setOnTrigger(callback: () => void) {
    this.onTrigger = callback;
  }

  setOnAutoClearChange(callback: (value: boolean) => void) {
    this.onAutoClearChange = callback;
  }

  setOnMicGainChange(callback: (value: number) => void) {
    this.onMicGainChange = callback;
  }

  setOnRandomSequenceChange(callback: (value: boolean) => void) {
    this.onRandomSequenceChange = callback;
  }

  setOnRandomColorChange(callback: (value: boolean) => void) {
    this.onRandomColorChange = callback;
  }

  setOnKnobLockToggle(callback: (knob: number, locked: boolean) => void) {
    this.onKnobLockToggle = callback;
  }

  setOnRandomSequenceFrequencyChange(callback: (value: number) => void) {
    this.onRandomSequenceFrequencyChange = callback;
  }

  setOnRandomColorFrequencyChange(callback: (value: number) => void) {
    this.onRandomColorFrequencyChange = callback;
  }

  setOnRandomTriggerChange(callback: (value: boolean) => void) {
    this.onRandomTriggerChange = callback;
  }

  setOnRandomTriggerFrequencyChange(callback: (value: number) => void) {
    this.onRandomTriggerFrequencyChange = callback;
  }

  setOnMockAudioChange(callback: (value: boolean) => void) {
    this.onMockAudioChange = callback;
  }

  setOnMockAudioFrequencyChange(callback: (value: number) => void) {
    this.onMockAudioFrequencyChange = callback;
  }

  setOnMockAudioIntensityRandomnessChange(callback: (value: number) => void) {
    this.onMockAudioIntensityRandomnessChange = callback;
  }

  setOnTransitionEnabledChange(callback: (value: boolean) => void) {
    this.onTransitionEnabledChange = callback;
  }

  setOnTransitionDurationChange(callback: (value: number) => void) {
    this.onTransitionDurationChange = callback;
  }

  setOnTransitionTypeChange(callback: (value: string) => void) {
    this.onTransitionTypeChange = callback;
  }

  setOnLeftHandedChange(callback: (value: boolean) => void) {
    this.onLeftHandedChange = callback;
  }

  setOnPortraitRotateChange(callback: (value: boolean) => void) {
    this.onPortraitRotateChange = callback;
  }


  setOnFontFamilyChange(callback: (value: string) => void) {
    this.onFontFamilyChange = callback;
  }

  setOnFontTextChange(callback: (value: string) => void) {
    this.onFontTextChange = callback;
  }

  setOnSeizureSafeChange(callback: (value: boolean) => void) {
    this.onSeizureSafeChange = callback;
  }

  setOnTargetFPSChange(callback: (value: number) => void) {
    this.onTargetFPSChange = callback;
  }

  setOnRewind(callback: () => void) {
    this.onRewind = callback;
  }

  setOnFastForward(callback: () => void) {
    this.onFastForward = callback;
  }

  setOnRewindJump(callback: (index: number) => void) {
    this.onRewindJump = callback;
  }

  setOnReversePlaybackChange(callback: (enabled: boolean) => void) {
    this.onReversePlaybackChange = callback;
  }

  /**
   * Update reverse playback checkbox state
   */
  updateReversePlaybackState(enabled: boolean): void {
    const checkbox = document.getElementById('reverse-playback') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = enabled;
    }
  }

  /**
   * Update rewind controls state
   */
  updateRewindState(canRewind: boolean, canFastForward: boolean, currentIndex: number, totalFrames: number, isReversePlayback: boolean = false): void {
    const rewindBtn = document.getElementById('rewind-btn') as HTMLButtonElement;
    const fastForwardBtn = document.getElementById('fast-forward-btn') as HTMLButtonElement;
    const rewindInfo = document.getElementById('rewind-info');

    if (rewindBtn) {
      // In reverse playback, rewind button should stop reverse playback
      if (isReversePlayback) {
        rewindBtn.disabled = false;
        rewindBtn.style.opacity = '1';
        rewindBtn.title = 'Stop reverse playback (Left Arrow)';
      } else {
        rewindBtn.disabled = !canRewind && totalFrames === 0;
        rewindBtn.style.opacity = (canRewind || totalFrames > 0) ? '1' : '0.5';
        rewindBtn.title = canRewind ? 'Rewind animation (Left Arrow)' : 'Start reverse playback (Left Arrow)';
      }
    }
    if (fastForwardBtn) {
      // In reverse playback, fast forward stops reverse playback
      fastForwardBtn.disabled = false;
      fastForwardBtn.style.opacity = '1';
      fastForwardBtn.title = isReversePlayback ? 'Stop reverse playback (Right Arrow)' : 'Fast forward (Right Arrow)';
    }
    if (rewindInfo) {
      if (isReversePlayback) {
        rewindInfo.textContent = `⏪ ${currentIndex + 1}/${totalFrames}`;
      } else {
        rewindInfo.textContent = `${currentIndex + 1}/${totalFrames}`;
      }
    }
  }

  setOnWebcamEnableChange(callback: (value: boolean) => void) {
    this.onWebcamEnableChange = callback;
  }

  setOnWebcamDeviceChange(callback: (deviceId: string) => void) {
    this.onWebcamDeviceChange = callback;
  }

  setOnWebcamCompositorChange(callback: (options: {
    enabled?: boolean;
    position?: 'background' | 'foreground';
    opacity?: number;
    blendMode?: string;
    chromaKeyEnabled?: boolean;
    chromaKeyColor?: [number, number, number];
    chromaKeyTolerance?: number;
    chromaKeySmoothness?: number;
    scale?: number;
    positionX?: number;
    positionY?: number;
    rotation?: number;
    mirror?: boolean;
  }) => void) {
    this.onWebcamCompositorChange = callback;
  }

  setOnEffectEnabledChange(callback: (effectName: string, enabled: boolean) => void) {
    this.onEffectEnabledChange = callback;
  }

  setOnEffectIntensityChange(callback: (effectName: string, intensity: number) => void) {
    this.onEffectIntensityChange = callback;
  }

  setOnWebcamEffectEnabledChange(callback: (effectName: string, enabled: boolean) => void) {
    this.onWebcamEffectEnabledChange = callback;
  }

  setOnWebcamEffectIntensityChange(callback: (effectName: string, intensity: number) => void) {
    this.onWebcamEffectIntensityChange = callback;
  }

  setOnEffectReset(callback: (effectName: string) => void) {
    this.onEffectResetToDefault = callback;
  }

  setOnResetAllEffects(callback: () => void) {
    this.onResetAllEffectsToDefault = callback;
  }

  setOnRandomizeEffects(callback: () => void) {
    this.onRandomizeEffects = callback;
  }

  setOnEffectsBlendMixChange(callback: (value: number) => void) {
    this.onEffectsBlendMixChange = callback;
  }
  
  private onEffectResetToDefault?: (effectName: string) => void;
  private onResetAllEffectsToDefault?: () => void;
  private onRandomizeEffects?: () => void;
  
  onResetAllToDefault?: () => void;
  
  setOnResetAllToDefault(callback: () => void) {
    this.onResetAllToDefault = callback;
  }

  setOnColorGradingBrightnessChange(callback: (value: number) => void) {
    this.onColorGradingBrightnessChange = callback;
  }

  setOnColorGradingContrastChange(callback: (value: number) => void) {
    this.onColorGradingContrastChange = callback;
  }

  setOnColorGradingSaturationChange(callback: (value: number) => void) {
    this.onColorGradingSaturationChange = callback;
  }

  setOnColorGradingHueChange(callback: (value: number) => void) {
    this.onColorGradingHueChange = callback;
  }

  /**
   * Update webcam device list
   */
  updateWebcamEnabled(enabled: boolean): void {
    const webcamEnabled = document.getElementById('webcam-enabled') as HTMLInputElement;
    const webcamCompositorControls = document.getElementById('webcam-compositor-controls');
    
    if (webcamEnabled) {
      webcamEnabled.checked = enabled;
    }
    
    if (webcamCompositorControls) {
      webcamCompositorControls.style.display = enabled ? 'block' : 'none';
    }
  }

  updateWebcamDevices(devices: { id: string; label: string }[], currentDeviceId?: string) {
    const select = document.getElementById('webcam-device') as HTMLSelectElement;
    if (!select) return;

    // Clear existing options
    select.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Camera';
    select.appendChild(defaultOption);

    // Add device options
    devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.id;
      option.textContent = device.label || `Camera ${device.id.substring(0, 8)}`;
      if (device.id === currentDeviceId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  private render() {
    this.container.innerHTML = `
      <div class="controls-inner" style="
        width: 300px;
        background: #2a2a2a;
        border-left: 1px solid #3a3a3a;
        padding: 1rem;
        overflow-y: auto;
        height: 100%;
        max-height: 100vh;
        box-sizing: border-box;
      ">
        <!-- Mobile close header -->
        <div class="controls-header-mobile" style="
          display: none;
          justify-content: space-between;
          align-items: center;
          margin: -1rem -1rem 1rem -1rem;
          padding: 0.75rem 1rem;
          background: #1a1a1a;
          border-bottom: 1px solid #3a3a3a;
        ">
          <h2 style="font-size: 1rem; margin: 0; color: #fff;">Controls</h2>
          <button id="close-controls-btn" style="
            background: transparent;
            border: none;
            color: #aaa;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            line-height: 1;
          ">✕</button>
        </div>
        
        <!-- Desktop header -->
        <div class="controls-header-desktop" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-size: 1.2rem; margin: 0;">EYESY Controls</h2>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="lock-mode-btn" style="
              background: #3a3a3a;
              border: 1px solid #4a4a4a;
              color: #aaa;
              padding: 0.4rem 0.8rem;
              border-radius: 4px;
              font-size: 0.75rem;
              cursor: pointer;
              opacity: 0.8;
              transition: opacity 0.2s;
              display: none;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Lock current mode (prevent random mode switching)">🔒</button>
            <button id="reset-all-btn" style="
              background: #3a3a3a;
              border: 1px solid #4a4a4a;
              color: #aaa;
              padding: 0.4rem 0.8rem;
              border-radius: 4px;
              font-size: 0.75rem;
              cursor: pointer;
              opacity: 0.8;
              transition: opacity 0.2s;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Reset all settings to default (except current mode)">Reset All</button>
          </div>
        </div>
        
        <!-- Animation Parameters Section -->
        <div class="controls-section" style="margin-bottom: 2rem;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Animation Parameters</div>
          
        <div class="knob-group" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-size: 0.85rem; color: #ccc;">
              <span id="knob1-label">Parameter 1</span>: <span id="knob1-value">0.00</span>
            </label>
            <div style="display: flex; gap: 0.3rem;">
              <button class="lock-btn" data-knob="1" id="lock-btn-1" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Lock knob (prevents random changes)">🔓</button>
              <button class="reset-btn" data-knob="1" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (0.5)">↺</button>
            </div>
          </div>
          <input type="range" id="knob1" min="0" max="1" step="0.01" value="0.0" 
            style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
            title="Double-click to reset to default (0.5)">
          <div id="knob1-description" style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; min-height: 1rem;"></div>
        </div>

        <div class="knob-group" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-size: 0.85rem; color: #ccc;">
              <span id="knob2-label">Parameter 2</span>: <span id="knob2-value">0.00</span>
            </label>
            <div style="display: flex; gap: 0.3rem;">
              <button class="lock-btn" data-knob="2" id="lock-btn-2" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Lock knob (prevents random changes)">🔓</button>
              <button class="reset-btn" data-knob="2" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (0.5)">↺</button>
            </div>
          </div>
          <input type="range" id="knob2" min="0" max="1" step="0.01" value="0.0" 
            style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
            title="Double-click to reset to default (0.5)">
          <div id="knob2-description" style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; min-height: 1rem;"></div>
        </div>

        <div class="knob-group" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-size: 0.85rem; color: #ccc;">
              <span id="knob3-label">Parameter 3</span>: <span id="knob3-value">0.00</span>
            </label>
            <div style="display: flex; gap: 0.3rem;">
              <button class="lock-btn" data-knob="3" id="lock-btn-3" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Lock knob (prevents random changes)">🔓</button>
              <button class="reset-btn" data-knob="3" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (0.5)">↺</button>
            </div>
          </div>
          <input type="range" id="knob3" min="0" max="1" step="0.01" value="0.0" 
            style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
            title="Double-click to reset to default (0.5)">
          <div id="knob3-description" style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; min-height: 1rem;"></div>
        </div>

        <!-- Random Sequence (Parameters 1-3) -->
        <div style="margin-bottom: 1rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
            <input type="checkbox" id="random-sequence" style="cursor: pointer;">
            Random Sequence (Parameters 1-3)
          </label>
          <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
            Randomly animates animation parameters
          </div>
          <div id="random-sequence-frequency-container" style="margin-top: 0.5rem; margin-left: 1.5rem; display: none;">
            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem; color: #aaa;">
              Frequency: <span id="random-sequence-frequency-value">0.00</span>
            </label>
            <input type="range" id="random-sequence-frequency" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 2px; outline: none; -webkit-appearance: none;">
          </div>
        </div>
        </div>

        <!-- Animation Controls Section -->
        <div class="controls-section" style="margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Animation</div>
          
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="reverse-playback" style="cursor: pointer;">
              Reverse Playback
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Play animation in reverse continuously
            </div>
          </div>

          <div class="knob-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="font-size: 0.85rem; color: #ccc;">
                Speed: <span id="knob8-value">1.0x</span>
              </label>
              <button class="reset-btn" data-knob="8" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (1.0x)">↺</button>
            </div>
            <input type="range" id="knob8" min="0" max="1" step="0.01" value="0.45" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
              title="Double-click to reset to default (1.0x)">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Animation speed (middle = normal)
            </div>
          </div>
        </div>

        <!-- Colors Section -->
        <div class="controls-section" style="margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Colors</div>
          
        <div class="knob-group" style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-size: 0.85rem; color: #ccc;">
              Foreground Color: <span id="knob4-value">0.00</span>
            </label>
            <div style="display: flex; gap: 0.3rem;">
              <button class="lock-btn" data-knob="4" id="lock-btn-4" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Lock knob (prevents random changes)">🔓</button>
              <button class="reset-btn" data-knob="4" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (0.5)">↺</button>
            </div>
          </div>
          <input type="range" id="knob4" min="0" max="1" step="0.01" value="0.0" 
            style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
            title="Double-click to reset to default (0.5)">
        </div>

        <div class="knob-group" style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-size: 0.85rem; color: #ccc;">
              Background Color: <span id="knob5-value">0.00</span>
            </label>
            <div style="display: flex; gap: 0.3rem;">
              <button class="lock-btn" data-knob="5" id="lock-btn-5" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Lock knob (prevents random changes)">🔓</button>
              <button class="reset-btn" data-knob="5" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (0.5)">↺</button>
            </div>
          </div>
          <input type="range" id="knob5" min="0" max="1" step="0.01" value="0.0" 
            style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
            title="Double-click to reset to default (0.5)">
        </div>

        <!-- Random Color (Knobs 4-5) -->
        <div style="margin-bottom: 1rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
            <input type="checkbox" id="random-color" style="cursor: pointer;">
            Random Color (Knobs 4-5)
          </label>
          <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
            Randomly cycles foreground and background colors
          </div>
          <div id="random-color-frequency-container" style="margin-top: 0.5rem; margin-left: 1.5rem; display: none;">
            <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem; color: #aaa;">
              Frequency: <span id="random-color-frequency-value">0.00</span>
            </label>
            <input type="range" id="random-color-frequency" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 2px; outline: none; -webkit-appearance: none;">
          </div>
        </div>
        </div>

        <!-- Visual Transform Section -->
        <div class="controls-section" style="margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Visual Transform</div>
          <div class="knob-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="font-size: 0.85rem; color: #ccc;">
                Rotation: <span id="knob6-value">0°</span>
              </label>
              <button class="reset-btn" data-knob="6" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (0°)">↺</button>
            </div>
            <input type="range" id="knob6" min="0" max="1" step="0.01" value="0" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
              title="Double-click to reset to default (0°)">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Rotate animation (0-360°)
            </div>
          </div>

          <div class="knob-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="font-size: 0.85rem; color: #ccc;">
                Zoom: <span id="knob7-value">1.0x</span>
              </label>
              <button class="reset-btn" data-knob="7" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (1.0x)">↺</button>
            </div>
            <input type="range" id="knob7" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
              title="Double-click to reset to default (1.0x)">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Zoom in/out (middle = default)
            </div>
          </div>

          <div class="knob-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="font-size: 0.85rem; color: #ccc;">
                X Position: <span id="knob9-value">0px</span>
              </label>
              <button class="reset-btn" data-knob="9" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to center (0px)">↺</button>
            </div>
            <input type="range" id="knob9" min="0" max="1" step="0.01" value="0.5" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
              title="Double-click to reset to center (0px)">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Horizontal offset (middle = center)
            </div>
          </div>

          <div class="knob-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="font-size: 0.85rem; color: #ccc;">
                Y Position: <span id="knob10-value">0px</span>
              </label>
              <button class="reset-btn" data-knob="10" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to center (0px)">↺</button>
            </div>
            <input type="range" id="knob10" min="0" max="1" step="0.01" value="0.5" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
              title="Double-click to reset to center (0px)">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Vertical offset (middle = center)
            </div>
          </div>
        </div>

        <!-- Trigger Section -->
        <div class="controls-section" style="margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Trigger</div>
          
        <div style="margin-bottom: 1.5rem;">
          <button id="trigger-btn" style="
            width: 100%;
            padding: 0.75rem;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            margin-bottom: 1rem;
          ">Trigger</button>
          <div style="margin-top: 0.75rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="random-trigger" checked style="cursor: pointer;">
              Random Trigger
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Randomly triggers animations (mimics audio reactivity)
            </div>
            <div id="random-trigger-level-container" style="margin-top: 0.75rem; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-size: 0.75rem; color: #aaa;">Trigger Activity:</span>
                <span id="random-trigger-level-value" style="font-size: 0.75rem; color: #ff6b6b; font-weight: bold;">OFF</span>
              </div>
              <div style="width: 100%; height: 8px; background: #1a1a1a; border-radius: 4px; overflow: hidden; position: relative;">
                <div id="random-trigger-level-bar" style="
                  height: 100%;
                  width: 0%;
                  background: linear-gradient(to right, #ff6b6b, #ffd93d);
                  border-radius: 4px;
                  transition: width 0.1s ease-out;
                "></div>
              </div>
            </div>
            <div id="random-trigger-frequency-container" style="margin-top: 0.5rem; margin-left: 1.5rem; display: block;">
              <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem; color: #aaa;">
                Frequency: <span id="random-trigger-frequency-value">0.00</span>
              </label>
              <input type="range" id="random-trigger-frequency" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 2px; outline: none; -webkit-appearance: none;">
            </div>
          </div>
        </div>

        <!-- Audio Section -->
        <div id="mic-gain-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Audio</div>
          <div class="knob-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
              Mic Gain: <span id="mic-gain-value">5.00</span>
            </label>
            <input type="range" id="mic-gain" min="0" max="10" step="0.1" value="5.0" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Adjust microphone sensitivity (0-10)
              </div>
            </div>
            
            <div id="mock-audio-level-container" style="margin-top: 0.75rem; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-size: 0.75rem; color: #aaa;">Mock Audio Level:</span>
                <span id="mock-audio-level-value" style="font-size: 0.75rem; color: #4a9eff; font-weight: bold;">0%</span>
              </div>
              <div style="width: 100%; height: 8px; background: #1a1a1a; border-radius: 4px; overflow: hidden; position: relative;">
                <div id="mock-audio-level-bar" style="
                  height: 100%;
                  width: 0%;
                  background: linear-gradient(to right, #4a9eff, #00ff88);
                  border-radius: 4px;
                  transition: width 0.1s ease-out;
                "></div>
                <div style="
                  position: absolute;
                  left: 80%;
                  top: 0;
                  bottom: 0;
                  width: 1px;
                  background: rgba(255, 255, 255, 0.3);
                "></div>
              </div>
            </div>
          
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="mock-audio" style="cursor: pointer;">
              Mock Audio
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Simulate audio signals for scope modes (works when mic is disabled). Pattern controls complexity from simple 4/4 beat to random.
            </div>
            <div id="mock-audio-frequency-container" style="margin-top: 0.5rem; margin-left: 1.5rem; display: none;">
              <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem; color: #aaa;">
                Pattern: <span id="mock-audio-frequency-value">0.00</span>
              </label>
              <input type="range" id="mock-audio-frequency" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 2px; outline: none; -webkit-appearance: none;">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-bottom: 0.5rem;">
                0.0 = 4/4 beat, 0.5 = complex, 1.0 = random
              </div>
              <label style="display: block; margin-bottom: 0.25rem; font-size: 0.8rem; color: #aaa;">
                Intensity Randomness: <span id="mock-audio-intensity-randomness-value">0.00</span>
              </label>
              <input type="range" id="mock-audio-intensity-randomness" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 2px; outline: none; -webkit-appearance: none;">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                0.0 = consistent, 1.0 = highly random intensity
              </div>
            </div>
          </div>
          
            <div id="mic-level-container" style="margin-top: 0.75rem; display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-size: 0.75rem; color: #aaa;">Mic Level:</span>
                <span id="mic-level-value" style="font-size: 0.75rem; color: #4a9eff; font-weight: bold;">0%</span>
              </div>
              <div style="width: 100%; height: 8px; background: #1a1a1a; border-radius: 4px; overflow: hidden; position: relative;">
                <div id="mic-level-bar" style="
                  height: 100%;
                  width: 0%;
                  background: linear-gradient(to right, #4a9eff, #00ff88);
                  border-radius: 4px;
                  transition: width 0.1s ease-out;
                "></div>
                <div style="
                  position: absolute;
                  left: 80%;
                  top: 0;
                  bottom: 0;
                  width: 2px;
                  background: rgba(255, 200, 0, 0.5);
                  pointer-events: none;
                "></div>
              </div>
              <div style="font-size: 0.7rem; color: #666; margin-top: 0.25rem;">
                Aim for 50-80% for best results
              </div>
            </div>
          </div>
        </div>

        <!-- Images Section -->
        <div id="images-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Images</div>

          <button id="images-btn" style="
            width: 100%;
            padding: 0.75rem;
            background: #3a3a3a;
            color: #fff;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          " title="Upload images">
            <span id="images-icon">🖼️</span>
            <span id="images-text">Upload Images (0)</span>
          </button>
          <input type="file" id="image-upload" multiple accept="image/*" style="display: none;">

          <div style="font-size: 0.7rem; color: #888; margin-top: 0.5rem;">
            Used by image/slideshow modes.
          </div>
        </div>

        <!-- Transitions Section -->
        <div id="transition-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Transitions</div>
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="transition-enabled" checked style="cursor: pointer;">
              Enable Transitions
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Smooth transitions between modes
            </div>
          </div>
          <div id="transition-controls-container" style="margin-left: 1.5rem;">
            <div class="knob-group" style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
                Duration: <span id="transition-duration-value">1.00</span>s
              </label>
              <input type="range" id="transition-duration" min="0.1" max="6.0" step="0.1" value="1.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Transition duration (0.1-6.0 seconds)
              </div>
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
                Type: <span id="transition-type-display">Auto</span>
              </label>
              <select id="transition-type" style="
                width: 100%;
                padding: 0.5rem;
                background: #3a3a3a;
                color: #fff;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                font-size: 0.85rem;
                cursor: pointer;
              ">
                <option value="auto">Auto (Smart Selection)</option>
                <option value="fade">Fade</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="wipe-left">Wipe Left</option>
                <option value="wipe-right">Wipe Right</option>
                <option value="wipe-up">Wipe Up</option>
                <option value="wipe-down">Wipe Down</option>
                <option value="circle-expand">Circle Expand</option>
                <option value="circle-shrink">Circle Shrink</option>
                <option value="zoom-in">Zoom In</option>
                <option value="zoom-out">Zoom Out</option>
                <option value="morph">Morph</option>
                <option value="rotate-flip">Rotate & Flip</option>
                <option value="wave-distort">Wave Distort</option>
                <option value="spiral">Spiral</option>
                <option value="color-blend">Color Blend</option>
                <option value="particle-dissolve">Particle Dissolve</option>
                <option value="crossfade-zoom">Crossfade Zoom</option>
              </select>
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Select transition type (Auto uses smart selection)
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Section -->
        <div class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Performance</div>
          <div class="knob-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <label style="font-size: 0.85rem; color: #ccc;">
                Target FPS: <span id="target-fps-value">60</span>
              </label>
              <button id="reset-fps-btn" style="
                background: #3a3a3a;
                border: 1px solid #4a4a4a;
                color: #aaa;
                padding: 0.2rem 0.5rem;
                border-radius: 3px;
                font-size: 0.7rem;
                cursor: pointer;
                opacity: 0.6;
              " title="Reset to default (60 FPS)">↺</button>
            </div>
            <input type="range" id="target-fps" min="1" max="60" step="1" value="60" 
              style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
              title="Target frame rate (1-60 FPS)">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Limit frame rate to slow down animation (1-60 FPS)
            </div>
          </div>
        </div>

        <!-- Font Settings Section -->
        <div id="font-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a; display: none;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Font Mode Settings</div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
              Font Family:
            </label>
            <select id="font-family" style="
              width: 100%;
              padding: 0.5rem;
              background: #3a3a3a;
              color: #fff;
              border: 1px solid #4a4a4a;
              border-radius: 4px;
              font-size: 0.85rem;
              cursor: pointer;
            ">
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              <option value="Impact, sans-serif">Impact</option>
              <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
              <option value="'Lucida Console', monospace">Lucida Console</option>
              <option value="'Palatino Linotype', serif">Palatino Linotype</option>
            </select>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Select font for font modes
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
              Custom Text (optional):
            </label>
            <input type="text" id="font-text" placeholder="Leave empty to use default unicode characters" style="
              width: 100%;
              padding: 0.5rem;
              background: #3a3a3a;
              color: #fff;
              border: 1px solid #4a4a4a;
              border-radius: 4px;
              font-size: 0.85rem;
              box-sizing: border-box;
            ">
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Enter custom text to display. Leave empty to use default unicode characters.
            </div>
          </div>
        </div>

        <!-- Effects Section -->
        <div id="effects-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            ">✨ Post-Effects</div>
            <button id="effects-panel-toggle" style="
              padding: 0.4rem 0.8rem;
              background: #4a9eff;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 0.8rem;
              cursor: pointer;
              font-weight: 500;
            " title="Open Effects Panel">Effects Panel</button>
          </div>
          
          <!-- Quick Effects (Most Common) -->
          <div style="margin-bottom: 1rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                Quick Effects
              </div>
              <div style="display: flex; gap: 0.4rem;">
                <button id="random-effects-quick" style="
                  padding: 0.3rem 0.6rem;
                  background: #8b5cf6;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  font-size: 0.7rem;
                  cursor: pointer;
                  font-weight: 500;
                " title="Randomize All Effects">🎲 Random</button>
                <button id="reset-all-effects" style="
                  padding: 0.3rem 0.6rem;
                  background: #555;
                  color: white;
                  border: none;
                  border-radius: 3px;
                  font-size: 0.7rem;
                  cursor: pointer;
                  font-weight: 500;
                " title="Reset All Effects">Reset All</button>
              </div>
            </div>
            
            <!-- Effects Blend/Mix Control (Quick Access) -->
            <div style="padding: 0.6rem; background: #1a1a1a; border-radius: 4px; margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <label style="font-size: 0.8rem; color: #ccc; font-weight: 500;">Effects Mix</label>
                <span id="effects-blend-mix-value-quick" style="font-size: 0.8rem; color: #888;">100%</span>
              </div>
              <input type="range" id="effects-blend-mix-quick" min="0" max="1" step="0.01" value="1.0" 
                style="width: 100%; height: 5px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none; cursor: pointer;"
                title="Blend between original (0%) and full effects (100%)">
              <div style="display: flex; justify-content: space-between; margin-top: 0.2rem;">
                <span style="font-size: 0.65rem; color: #666;">Original</span>
                <span style="font-size: 0.65rem; color: #666;">Full Effects</span>
              </div>
            </div>
          
          <!-- Blur Effect -->
          <div style="margin-bottom: 0.5rem; padding: 0.6rem; background: #1a1a1a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                <input type="checkbox" id="effect-blur-enabled" style="cursor: pointer;">
                Blur
              </label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span id="effect-blur-intensity-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                <button class="effect-reset-btn" data-effect="blur" style="
                  padding: 0.2rem 0.4rem;
                  background: #444;
                  color: #aaa;
                  border: none;
                  border-radius: 2px;
                  font-size: 0.65rem;
                  cursor: pointer;
                  line-height: 1;
                " title="Reset to default">↺</button>
              </div>
            </div>
            <input type="range" id="effect-blur-intensity" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
          </div>

          <div style="margin-bottom: 0.5rem; padding: 0.6rem; background: #1a1a1a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                <input type="checkbox" id="effect-bloom-enabled" style="cursor: pointer;">
                Bloom
              </label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span id="effect-bloom-intensity-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                <button class="effect-reset-btn" data-effect="bloom" style="
                  padding: 0.2rem 0.4rem;
                  background: #444;
                  color: #aaa;
                  border: none;
                  border-radius: 2px;
                  font-size: 0.65rem;
                  cursor: pointer;
                  line-height: 1;
                " title="Reset to default">↺</button>
              </div>
            </div>
            <input type="range" id="effect-bloom-intensity" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
          </div>
          
          <div style="margin-bottom: 0.5rem; padding: 0.6rem; background: #1a1a1a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                <input type="checkbox" id="effect-vignette-enabled" style="cursor: pointer;">
                Vignette
              </label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span id="effect-vignette-intensity-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                <button class="effect-reset-btn" data-effect="vignette" style="
                  padding: 0.2rem 0.4rem;
                  background: #444;
                  color: #aaa;
                  border: none;
                  border-radius: 2px;
                  font-size: 0.65rem;
                  cursor: pointer;
                  line-height: 1;
                " title="Reset to default">↺</button>
              </div>
            </div>
            <input type="range" id="effect-vignette-intensity" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
          </div>
          
          <div style="margin-bottom: 0.5rem; padding: 0.6rem; background: #1a1a1a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                <input type="checkbox" id="effect-chromatic-aberration-enabled" style="cursor: pointer;">
                Chromatic Aberration
              </label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span id="effect-chromatic-aberration-intensity-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                <button class="effect-reset-btn" data-effect="chromatic-aberration" style="
                  padding: 0.2rem 0.4rem;
                  background: #444;
                  color: #aaa;
                  border: none;
                  border-radius: 2px;
                  font-size: 0.65rem;
                  cursor: pointer;
                  line-height: 1;
                " title="Reset to default">↺</button>
              </div>
            </div>
            <input type="range" id="effect-chromatic-aberration-intensity" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
          </div>
          
          <div style="margin-bottom: 0.5rem; padding: 0.6rem; background: #1a1a1a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                <input type="checkbox" id="effect-scanlines-enabled" style="cursor: pointer;">
                Scanlines
              </label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span id="effect-scanlines-intensity-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                <button class="effect-reset-btn" data-effect="scanlines" style="
                  padding: 0.2rem 0.4rem;
                  background: #444;
                  color: #aaa;
                  border: none;
                  border-radius: 2px;
                  font-size: 0.65rem;
                  cursor: pointer;
                  line-height: 1;
                " title="Reset to default">↺</button>
              </div>
            </div>
            <input type="range" id="effect-scanlines-intensity" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
          </div>
          
          <div style="margin-bottom: 0.5rem; padding: 0.6rem; background: #1a1a1a; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                <input type="checkbox" id="effect-vhs-distortion-enabled" style="cursor: pointer;">
                VHS Distortion
              </label>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span id="effect-vhs-distortion-intensity-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                <button class="effect-reset-btn" data-effect="vhs-distortion" style="
                  padding: 0.2rem 0.4rem;
                  background: #444;
                  color: #aaa;
                  border: none;
                  border-radius: 2px;
                  font-size: 0.65rem;
                  cursor: pointer;
                  line-height: 1;
                " title="Reset to default">↺</button>
              </div>
            </div>
            <input type="range" id="effect-vhs-distortion-intensity" min="0" max="1" step="0.01" value="0.0" 
              style="width: 100%; height: 4px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
          </div>
          </div>

          <!-- Effects Panel Sidebar (slides in from SAME side as controls) -->
          <div id="effects-panel-modal" style="
            display: none;
            visibility: hidden;
            position: fixed;
            top: 0;
            bottom: 0;
            right: 0;
            left: auto;
            width: 300px;
            max-width: 85vw;
            background: var(--bg-secondary);
            border-left: 1px solid var(--bg-surface);
            border-right: none;
            z-index: var(--z-overlay);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
          ">
            <div style="padding: 1rem; position: sticky; top: 0; background: var(--bg-primary); z-index: 10; border-bottom: 1px solid var(--bg-surface);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; gap: 0.5rem; align-items: center; flex: 1;">
                  <h2 style="
                    font-size: 1.2rem;
                    margin: 0;
                    color: #fff;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">Post-Effects</h2>
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="effects-tab" data-tab="post-effects" style="
                      padding: 0.4rem 0.8rem;
                      background: #4a9eff;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 0.8rem;
                      font-weight: 500;
                      line-height: 1;
                      transition: all 0.2s;
                    ">Effects Panel</button>
                    <button class="effects-tab" data-tab="webcam-effects" style="
                      padding: 0.4rem 0.8rem;
                      background: #3a3a3a;
                      color: #aaa;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 0.8rem;
                      font-weight: 500;
                      line-height: 1;
                      transition: all 0.2s;
                    ">Webcam Effects</button>
                  </div>
                </div>
                <button id="effects-panel-close-btn" style="
                  background: transparent;
                  border: none;
                  color: #aaa;
                  font-size: 1.5rem;
                  line-height: 1;
                  cursor: pointer;
                  padding: 0.25rem 0.5rem;
                  opacity: 0.85;
                " title="Close Effects Panel" aria-label="Close Effects Panel">✕</button>
              </div>
              <input type="text" id="effects-search" placeholder="Search effects..." style="
                width: 100%;
                padding: 0.5rem 0.75rem;
                background: #2a2a2a;
                color: #fff;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                font-size: 0.85rem;
                box-sizing: border-box;
                margin-bottom: 1rem;
              ">
              <!-- Effects Blend/Mix Control -->
              <div style="padding: 0.75rem; background: #2a2a2a; border-radius: 4px; margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.85rem; color: #ccc; font-weight: 500;">Effects Mix</label>
                  <span id="effects-blend-mix-value" style="font-size: 0.85rem; color: #888;">100%</span>
                </div>
                <input type="range" id="effects-blend-mix" min="0" max="1" step="0.01" value="1.0" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none; cursor: pointer;"
                  title="Blend between original (0%) and full effects (100%)">
                <div style="display: flex; justify-content: space-between; margin-top: 0.25rem;">
                  <span style="font-size: 0.7rem; color: #666;">Original</span>
                  <span style="font-size: 0.7rem; color: #666;">Full Effects</span>
                </div>
              </div>
            </div>
            <div style="padding: 1rem 1rem 1rem 1rem;">
            <div id="post-effects-tab" class="tab-content">

          <!-- Color & Tone Effects -->
          <div style="margin-top: 0; padding-top: 0; border-top: none;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Color & Tone
            </div>

            <!-- Color Grading Effect -->
            <div style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-color-grading-enabled" style="cursor: pointer;">
                  Color Grading
            </label>
                <div class="effect-controls-container" style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-color-grading-intensity-value">1.00</span><button class="effect-reset-btn" data-effect="color-grading" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
            </div>
              <div class="effect-controls-container" style="display: none;">
                <input type="range" id="effect-color-grading-intensity" min="0" max="1" step="0.01" value="1.0" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none; margin-bottom: 0.5rem;"
                  title="Color grading intensity">
                
                <div style="margin-bottom: 0.5rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <label style="font-size: 0.8rem; color: #aaa;">Brightness:</label>
                    <span id="color-grading-brightness-value" style="font-size: 0.8rem; color: #888;">0.00</span>
            </div>
                  <input type="range" id="color-grading-brightness" min="-1" max="1" step="0.01" value="0" 
                    style="width: 100%; height: 5px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
                </div>
                
                <div style="margin-bottom: 0.5rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <label style="font-size: 0.8rem; color: #aaa;">Contrast:</label>
                    <span id="color-grading-contrast-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                  </div>
                  <input type="range" id="color-grading-contrast" min="-1" max="1" step="0.01" value="0" 
                    style="width: 100%; height: 5px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
                </div>
                
                <div style="margin-bottom: 0.5rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <label style="font-size: 0.8rem; color: #aaa;">Saturation:</label>
                    <span id="color-grading-saturation-value" style="font-size: 0.8rem; color: #888;">0.00</span>
                  </div>
                  <input type="range" id="color-grading-saturation" min="-1" max="1" step="0.01" value="0" 
                    style="width: 100%; height: 5px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
                </div>
                
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                    <label style="font-size: 0.8rem; color: #aaa;">Hue:</label>
                    <span id="color-grading-hue-value" style="font-size: 0.8rem; color: #888;">0°</span>
                  </div>
                  <input type="range" id="color-grading-hue" min="-180" max="180" step="1" value="0" 
                    style="width: 100%; height: 5px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;">
                </div>
                
                <div style="font-size: 0.7rem; color: #888; margin-top: 0.4rem;">
                  Adjust brightness, contrast, saturation, and hue
                </div>
              </div>
            </div>

            <!-- Sepia Effect -->
            <div style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-sepia-enabled" style="cursor: pointer;">
                  Sepia
            </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-sepia-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="sepia" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
            </div>
              <input type="range" id="effect-sepia-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Sepia intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Vintage brown tone effect
          </div>
            </div>

            <!-- Grayscale Effect -->
            <div data-effect-name="grayscale" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-grayscale-enabled" style="cursor: pointer;">
                  Grayscale
            </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-grayscale-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="grayscale" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
            </div>
              <input type="range" id="effect-grayscale-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Grayscale intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Convert to black and white
          </div>
        </div>

            <!-- Colorize Effect -->
            <div data-effect-name="colorize" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-colorize-enabled" style="cursor: pointer;">
                  Colorize
            </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span id="effect-colorize-intensity-value" style="font-size: 0.85rem; color: #888;">0.00</span>
                  <button class="effect-reset-btn" data-effect="colorize" style="
                    padding: 0.2rem 0.4rem;
                    background: #444;
                    color: #aaa;
                    border: none;
                    border-radius: 2px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    line-height: 1;
                  " title="Reset to default">↺</button>
            </div>
            </div>
              <input type="range" id="effect-colorize-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Colorize intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Tint image with a single color
          </div>
            </div>

            <!-- Solarize Effect -->
            <div data-effect-name="solarize" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-solarize-enabled" style="cursor: pointer;">
                  Solarize
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-solarize-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="solarize" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-solarize-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Solarize intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Invert colors above threshold
              </div>
            </div>

            <!-- Posterize Effect -->
            <div data-effect-name="posterize" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-posterize-enabled" style="cursor: pointer;">
                  Posterize
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-posterize-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="posterize" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-posterize-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Posterize intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Reduces color levels for posterized look
              </div>
            </div>

            <!-- Contrast Effect -->
            <div data-effect-name="contrast" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-contrast-enabled" style="cursor: pointer;">
                  Contrast
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-contrast-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="contrast" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-contrast-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Contrast intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Adjust image contrast
              </div>
            </div>

            <!-- Exposure Effect -->
            <div data-effect-name="exposure" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-exposure-enabled" style="cursor: pointer;">
                  Exposure
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-exposure-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="exposure" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-exposure-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Exposure intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Adjust image exposure (brightness)
              </div>
            </div>

            <!-- Saturation Effect -->
            <div data-effect-name="saturation" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-saturation-enabled" style="cursor: pointer;">
                  Saturation
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-saturation-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="saturation" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-saturation-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Saturation intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Adjust color saturation
              </div>
            </div>
          </div>

          <!-- Blur & Focus Effects -->
          <div data-effect-section style="margin-top: 1.25rem; padding-top: 1rem; border-top: 2px solid #4a4a4a;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Blur & Focus
            </div>

            <!-- Blur Effect -->
            <div data-effect-name="blur" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-blur-enabled" style="cursor: pointer;">
                  Blur
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span id="effect-blur-intensity-value" style="font-size: 0.85rem; color: #888;">0.00</span>
                  <button class="effect-reset-btn" data-effect="blur" style="
                    padding: 0.2rem 0.4rem;
                    background: #444;
                    color: #aaa;
                    border: none;
                    border-radius: 2px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    line-height: 1;
                  " title="Reset to default">↺</button>
                </div>
              </div>
              <input type="range" id="effect-blur-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Blur intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Gaussian blur post-processing effect
              </div>
            </div>

            <!-- Motion Blur Effect -->
            <div data-effect-name="motion blur" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-motion-blur-enabled" style="cursor: pointer;">
                  Motion Blur
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-motion-blur-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="motion-blur" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-motion-blur-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Motion blur intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Directional motion blur effect
              </div>
            </div>

            <!-- Radial Blur Effect -->
            <div data-effect-name="radial blur" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-radial-blur-enabled" style="cursor: pointer;">
                  Radial Blur
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-radial-blur-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="radial-blur" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-radial-blur-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Radial blur intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Circular blur from center point
              </div>
            </div>

            <!-- Tilt-Shift Effect -->
            <div data-effect-name="tilt shift" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-tilt-shift-enabled" style="cursor: pointer;">
                  Tilt-Shift
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-tilt-shift-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="tilt-shift" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-tilt-shift-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Tilt-shift intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Miniature/fake depth of field effect
              </div>
            </div>
          </div>

          <!-- Distortion Effects -->
          <div data-effect-section style="margin-top: 1.25rem; padding-top: 1rem; border-top: 2px solid #4a4a4a;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Distortion & Warp
            </div>

            <!-- Fisheye Effect -->
            <div data-effect-name="fisheye" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-fisheye-enabled" style="cursor: pointer;">
                  Fisheye
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-fisheye-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="fisheye" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-fisheye-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Fisheye intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Barrel distortion (fisheye lens effect)
              </div>
            </div>

            <!-- Pinch/Bulge Effect -->
            <div data-effect-name="pinch bulge" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-pinch-bulge-enabled" style="cursor: pointer;">
                  Pinch/Bulge
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-pinch-bulge-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="pinch-bulge" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-pinch-bulge-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Pinch/Bulge intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Radial distortion (pinch or bulge)
              </div>
            </div>

            <!-- Twirl Effect -->
            <div data-effect-name="twirl" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-twirl-enabled" style="cursor: pointer;">
                  Twirl
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-twirl-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="twirl" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-twirl-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none; display: none;"
                title="Twirl intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Spiral distortion effect
              </div>
            </div>

            <!-- Wave Effect -->
            <div data-effect-name="wave" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-wave-enabled" style="cursor: pointer;">
                  Wave
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-wave-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="wave" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-wave-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Wave intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Sine wave distortion
              </div>
            </div>

            <!-- Mirror Effect -->
            <div data-effect-name="mirror" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-mirror-enabled" style="cursor: pointer;">
                  Mirror
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-mirror-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="mirror" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-mirror-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Mirror intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Horizontal or vertical mirroring
              </div>
            </div>

            <!-- Kaleidoscope Effect -->
            <div data-effect-name="kaleidoscope" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-kaleidoscope-enabled" style="cursor: pointer;">
                  Kaleidoscope
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-kaleidoscope-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="kaleidoscope" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-kaleidoscope-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Kaleidoscope intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Radial symmetry pattern
              </div>
            </div>
          </div>

          <!-- Texture & Stylization Effects -->
          <div data-effect-section style="margin-top: 1.25rem; padding-top: 1rem; border-top: 2px solid #4a4a4a;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Texture & Stylization
            </div>

            <!-- Pixelation Effect -->
            <div data-effect-name="pixelation" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-pixelation-enabled" style="cursor: pointer;">
                  Pixelation
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span id="effect-pixelation-intensity-value" style="font-size: 0.85rem; color: #888;">0.00</span>
                  <button class="effect-reset-btn" data-effect="pixelation" style="
                    padding: 0.2rem 0.4rem;
                    background: #444;
                    color: #aaa;
                    border: none;
                    border-radius: 2px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    line-height: 1;
                  " title="Reset to default">↺</button>
                </div>
              </div>
              <input type="range" id="effect-pixelation-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Pixelation intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Pixel art effect - reduces image resolution
              </div>
            </div>

            <!-- Edge Detection Effect -->
            <div data-effect-name="edge-detection" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-edge-detection-enabled" style="cursor: pointer;">
                  Edge Detection
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span id="effect-edge-detection-intensity-value" style="font-size: 0.85rem; color: #888;">0.00</span>
                  <button class="effect-reset-btn" data-effect="edge-detection" style="
                    padding: 0.2rem 0.4rem;
                    background: #444;
                    color: #aaa;
                    border: none;
                    border-radius: 2px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    line-height: 1;
                  " title="Reset to default">↺</button>
                </div>
              </div>
              <input type="range" id="effect-edge-detection-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Edge detection intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Sobel edge detection for outline effect
              </div>
            </div>

            <!-- Film Grain Effect -->
            <div data-effect-name="film grain" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-film-grain-enabled" style="cursor: pointer;">
                  Film Grain
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-film-grain-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="film-grain" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-film-grain-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Film grain intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Adds film grain texture
              </div>
            </div>

            <!-- Noise Effect -->
            <div data-effect-name="noise" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-noise-enabled" style="cursor: pointer;">
                  Noise
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-noise-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="noise" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-noise-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Noise intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Random noise overlay
              </div>
            </div>

            <!-- Halftone Effect -->
            <div data-effect-name="halftone" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-halftone-enabled" style="cursor: pointer;">
                  Halftone
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-halftone-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="halftone" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-halftone-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Halftone intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Dot pattern (newspaper print effect)
              </div>
            </div>
          </div>

          <!-- Stylization Effects -->
          <div data-effect-section style="margin-top: 1.25rem; padding-top: 1rem; border-top: 2px solid #4a4a4a;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Stylization
            </div>

            <!-- Sharpen Effect -->
            <div data-effect-name="sharpen" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-sharpen-enabled" style="cursor: pointer;">
                  Sharpen
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-sharpen-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="sharpen" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-sharpen-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Sharpen intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Image sharpening
              </div>
            </div>

            <!-- Emboss Effect -->
            <div data-effect-name="emboss" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-emboss-enabled" style="cursor: pointer;">
                  Emboss
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-emboss-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="emboss" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-emboss-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Emboss intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                3D embossed look
              </div>
            </div>
          </div>

          <!-- Light Effects -->
          <div data-effect-section style="margin-top: 1.25rem; padding-top: 1rem; border-top: 2px solid #4a4a4a;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Light & Glow
            </div>

            <!-- Lens Flare Effect -->
            <div data-effect-name="lens flare" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-lens-flare-enabled" style="cursor: pointer;">
                  Lens Flare
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-lens-flare-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="lens-flare" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-lens-flare-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Lens flare intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Camera lens flare effect
              </div>
            </div>
          </div>

          <!-- Time Effects -->
          <div data-effect-section style="margin-top: 1.25rem; padding-top: 1rem; border-top: 2px solid #4a4a4a;">
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
              Time & Motion
            </div>

            <!-- Trails Effect -->
            <div data-effect-name="trails" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-trails-enabled" style="cursor: pointer;">
                  Trails
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-trails-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="trails" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-trails-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Trails intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Motion trails / feedback effect
              </div>
            </div>

            <!-- Echo Effect -->
            <div data-effect-name="echo" style="margin-bottom: 0.5rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
                  <input type="checkbox" id="effect-echo-enabled" style="cursor: pointer;">
                  Echo
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;"><span id="effect-echo-intensity-value">0.00</span><button class="effect-reset-btn" data-effect="echo" style="padding: 0.2rem 0.4rem; background: #444; color: #aaa; border: none; border-radius: 2px; font-size: 0.7rem; cursor: pointer; line-height: 1;" title="Reset to default">↺</button></div>
              </div>
              <input type="range" id="effect-echo-intensity" min="0" max="1" step="0.01" value="0.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Echo intensity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Multiple delayed frames overlay
              </div>
            </div>
            </div>
            <!-- End Post-Effects Tab -->
            
            <div id="webcam-effects-tab" class="tab-content" style="display: none;">
              <!-- Webcam Effects Content -->
              <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.75rem; font-weight: 600;">
                Webcam Effects
              </div>
              <div style="font-size: 0.7rem; color: #888; margin-bottom: 1rem;">
                Apply effects directly to the webcam feed
              </div>
              
              <!-- Quick Webcam Effects -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="blur" style="cursor: pointer;">
                  Blur
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="grayscale" style="cursor: pointer;">
                  Grayscale
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="sepia" style="cursor: pointer;">
                  Sepia
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="invert" style="cursor: pointer;">
                  Invert
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="pixelation" style="cursor: pointer;">
                  Pixelation
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="vignette" style="cursor: pointer;">
                  Vignette
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="bloom" style="cursor: pointer;">
                  Bloom
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="sharpen" style="cursor: pointer;">
                  Sharpen
                </label>
              </div>
              
              <!-- Webcam Effects Intensity -->
              <div id="webcam-effects-intensity-container" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #3a3a3a;">
                <div id="webcam-effects-intensity-sliders"></div>
              </div>
            </div>
            <!-- End Webcam Effects Tab -->
            </div>
            
            <!-- Bottom Buttons -->
            <div style="padding: 1rem; position: sticky; bottom: 0; background: #1a1a1a; z-index: 10; border-top: 1px solid #3a3a3a;">
              <div style="display: flex; gap: 0.75rem; flex-direction: column;">
                <button id="reset-effects-panel" style="
                  padding: 0.6rem 2rem;
                  background: #666;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 0.9rem;
                  font-weight: 500;
                  width: 100%;
                ">Reset Effects</button>
                <button id="random-effects-panel" style="
                  padding: 0.6rem 2rem;
                  background: #8b5cf6;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 0.9rem;
                  font-weight: 500;
                  width: 100%;
                ">🎲 Random Effects</button>
              </div>
            </div>
            </div>
          </div>
        <!-- Effects Panel Modal End -->

        <!-- Status Section -->
        <div class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">Status</div>
          <div style="font-size: 0.9rem; color: #aaa;">
            <div style="margin-bottom: 0.5rem;">FPS: <span id="fps" style="color: #4a9eff; font-weight: 600;">60</span></div>
            <div>Mode: <span id="mode-name" style="color: #4a9eff; font-weight: 600;">None</span></div>
          </div>
        </div>

        <!-- UI Settings Section -->
        <div id="ui-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">UI Settings</div>
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="left-handed" style="cursor: pointer;">
              Left-Handed Mode
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Controls panel on the left side
            </div>
          </div>
          <div id="portrait-rotate-container" style="margin-bottom: 1rem; display: none;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="portrait-rotate" style="cursor: pointer;">
              Rotate Animation in Portrait
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Rotate animation 90° in portrait mode for larger display
            </div>
          </div>
        </div>

        <!-- Seizure-Safe Section -->
        <div id="seizure-safe-section" class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">⚠️ Seizure-Safe Mode</div>
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="seizure-safe" style="cursor: pointer;">
              Enable Seizure-Safe Mode
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Limits flashing, prevents red flashes, and reduces animation speed to meet WCAG 2.3.1 guidelines
            </div>
            <div id="seizure-safe-warning" style="font-size: 0.75rem; color: #ffaa00; margin-top: 0.5rem; margin-left: 1.5rem; display: none;">
              ⚠️ This mode may contain rapid flashing or intense visual effects
            </div>
          </div>
        </div>

        <!-- Webcam Section -->
        <div class="controls-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a;">
          <div class="section-header" style="
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            font-weight: 600;
          ">📷 Webcam</div>
          <div style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc;">
              <input type="checkbox" id="webcam-enabled" style="cursor: pointer;">
              Enable Webcam
            </label>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem; margin-left: 1.5rem;">
              Allow modes to access webcam feed
            </div>
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
              Camera Device:
            </label>
            <select id="webcam-device" style="
              width: 100%;
              padding: 0.5rem;
              background: #3a3a3a;
              color: #fff;
              border: 1px solid #4a4a4a;
              border-radius: 4px;
              font-size: 0.85rem;
              cursor: pointer;
            ">
              <option value="">Default Camera</option>
            </select>
            <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
              Select which camera to use
            </div>
          </div>
          
          <!-- Webcam Compositor Controls -->
          <div id="webcam-compositor-controls" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #3a3a3a; display: none;">
            <div class="section-header" style="
              font-size: 0.8rem;
              color: #aaa;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 1rem;
              font-weight: 600;
            ">🎨 Compositing & Layering</div>
            
            <!-- Layer Position -->
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
                Layer Position:
              </label>
              <select id="webcam-layer-position" style="
                width: 100%;
                padding: 0.5rem;
                background: #3a3a3a;
                color: #fff;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                font-size: 0.85rem;
                cursor: pointer;
              ">
                <option value="background">Background (Behind Animation)</option>
                <option value="foreground">Foreground (On Top of Animation)</option>
              </select>
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Position webcam layer relative to animation
              </div>
            </div>
            
            <!-- Opacity -->
            <div style="margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="font-size: 0.85rem; color: #ccc;">Opacity:</label>
                <span id="webcam-opacity-value" style="font-size: 0.85rem; color: #4a9eff; font-weight: 600;">100%</span>
              </div>
              <input type="range" id="webcam-opacity" min="0" max="1" step="0.01" value="1.0" 
                style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                title="Webcam opacity">
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                Control webcam transparency (0-100%)
              </div>
            </div>
            
            <!-- Blend Mode -->
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #ccc;">
                Blend Mode:
              </label>
              <select id="webcam-blend-mode" style="
                width: 100%;
                padding: 0.5rem;
                background: #3a3a3a;
                color: #fff;
                border: 1px solid #4a4a4a;
                border-radius: 4px;
                font-size: 0.85rem;
                cursor: pointer;
              ">
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="soft-light">Soft Light</option>
                <option value="hard-light">Hard Light</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="vivid-light">Vivid Light</option>
                <option value="linear-light">Linear Light</option>
                <option value="pin-light">Pin Light</option>
                <option value="hue">Hue</option>
                <option value="saturation">Saturation</option>
                <option value="color">Color</option>
                <option value="luminosity">Luminosity</option>
              </select>
              <div style="font-size: 0.7rem; color: #888; margin-top: 0.2rem;">
                How webcam blends with animation
              </div>
            </div>
            
            <!-- Chroma Key (Green Screen) -->
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: #2a2a2a; border-radius: 4px;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #ccc; margin-bottom: 0.75rem;">
                <input type="checkbox" id="webcam-chroma-key-enabled" style="cursor: pointer;">
                Chroma Key (Green Screen)
              </label>
              <div style="font-size: 0.7rem; color: #888; margin-bottom: 0.75rem; margin-left: 1.5rem;">
                Remove specific color from webcam (e.g., green screen)
              </div>
              
              <!-- Chroma Key Color -->
              <div style="margin-bottom: 0.75rem; margin-left: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-size: 0.8rem; color: #aaa;">
                  Key Color:
                </label>
                <input type="color" id="webcam-chroma-key-color" value="#00ff00" style="
                  width: 100%;
                  height: 40px;
                  border: 1px solid #4a4a4a;
                  border-radius: 4px;
                  cursor: pointer;
                ">
              </div>
              
              <!-- Chroma Key Tolerance -->
              <div style="margin-bottom: 0.75rem; margin-left: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.8rem; color: #aaa;">Tolerance:</label>
                  <span id="webcam-chroma-key-tolerance-value" style="font-size: 0.8rem; color: #4a9eff; font-weight: 600;">0.30</span>
                </div>
                <input type="range" id="webcam-chroma-key-tolerance" min="0" max="1" step="0.01" value="0.3" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                  title="Chroma key tolerance">
              </div>
              
              <!-- Chroma Key Smoothness -->
              <div style="margin-left: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.8rem; color: #aaa;">Smoothness:</label>
                  <span id="webcam-chroma-key-smoothness-value" style="font-size: 0.8rem; color: #4a9eff; font-weight: 600;">0.10</span>
                </div>
                <input type="range" id="webcam-chroma-key-smoothness" min="0" max="1" step="0.01" value="0.1" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                  title="Chroma key smoothness">
              </div>
            </div>
            
            <!-- Transform Controls -->
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #3a3a3a;">
              <div class="section-header" style="
                font-size: 0.75rem;
                color: #aaa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 0.75rem;
                font-weight: 600;
              ">Transform</div>
              
              <!-- Scale -->
              <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.8rem; color: #aaa;">Scale:</label>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span id="webcam-scale-value" style="font-size: 0.8rem; color: #4a9eff; font-weight: 600;">100%</span>
                    <button class="webcam-transform-reset-btn" data-transform="scale" style="
                      background: #3a3a3a;
                      border: 1px solid #4a4a4a;
                      color: #aaa;
                      padding: 0.15rem 0.4rem;
                      border-radius: 3px;
                      font-size: 0.7rem;
                      cursor: pointer;
                      opacity: 0.8;
                      transition: opacity 0.2s;
                      line-height: 1;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Reset to default (1.0)">↺</button>
                  </div>
                </div>
                <input type="range" id="webcam-scale" min="0.1" max="2" step="0.01" value="1.0" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                  title="Webcam scale">
              </div>
              
              <!-- Position X -->
              <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.8rem; color: #aaa;">Position X:</label>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span id="webcam-position-x-value" style="font-size: 0.8rem; color: #4a9eff; font-weight: 600;">0.00</span>
                    <button class="webcam-transform-reset-btn" data-transform="positionX" style="
                      background: #3a3a3a;
                      border: 1px solid #4a4a4a;
                      color: #aaa;
                      padding: 0.15rem 0.4rem;
                      border-radius: 3px;
                      font-size: 0.7rem;
                      cursor: pointer;
                      opacity: 0.8;
                      transition: opacity 0.2s;
                      line-height: 1;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Reset to default (0.0)">↺</button>
                  </div>
                </div>
                <input type="range" id="webcam-position-x" min="-1" max="1" step="0.01" value="0.0" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                  title="Webcam horizontal position">
              </div>
              
              <!-- Position Y -->
              <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.8rem; color: #aaa;">Position Y:</label>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span id="webcam-position-y-value" style="font-size: 0.8rem; color: #4a9eff; font-weight: 600;">0.00</span>
                    <button class="webcam-transform-reset-btn" data-transform="positionY" style="
                      background: #3a3a3a;
                      border: 1px solid #4a4a4a;
                      color: #aaa;
                      padding: 0.15rem 0.4rem;
                      border-radius: 3px;
                      font-size: 0.7rem;
                      cursor: pointer;
                      opacity: 0.8;
                      transition: opacity 0.2s;
                      line-height: 1;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Reset to default (0.0)">↺</button>
                  </div>
                </div>
                <input type="range" id="webcam-position-y" min="-1" max="1" step="0.01" value="0.0" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                  title="Webcam vertical position">
              </div>
              
              <!-- Rotation -->
              <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <label style="font-size: 0.8rem; color: #aaa;">Rotation:</label>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span id="webcam-rotation-value" style="font-size: 0.8rem; color: #4a9eff; font-weight: 600;">0°</span>
                    <button class="webcam-transform-reset-btn" data-transform="rotation" style="
                      background: #3a3a3a;
                      border: 1px solid #4a4a4a;
                      color: #aaa;
                      padding: 0.15rem 0.4rem;
                      border-radius: 3px;
                      font-size: 0.7rem;
                      cursor: pointer;
                      opacity: 0.8;
                      transition: opacity 0.2s;
                      line-height: 1;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Reset to default (0°)">↺</button>
                  </div>
                </div>
                <input type="range" id="webcam-rotation" min="0" max="360" step="1" value="0" 
                  style="width: 100%; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none;"
                  title="Webcam rotation">
              </div>
              
              <!-- Mirror -->
              <div style="margin-top: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #aaa;">
                  <input type="checkbox" id="webcam-mirror" style="cursor: pointer;">
                  Mirror Horizontally
                </label>
                <button class="webcam-transform-reset-btn" data-transform="mirror" style="
                  background: #3a3a3a;
                  border: 1px solid #4a4a4a;
                  color: #aaa;
                  padding: 0.15rem 0.4rem;
                  border-radius: 3px;
                  font-size: 0.7rem;
                  cursor: pointer;
                  opacity: 0.8;
                  transition: opacity 0.2s;
                  line-height: 1;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Reset to default (off)">↺</button>
              </div>
            </div>
            
            <!-- Webcam Effects Section -->
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #3a3a3a;">
              <div class="section-header" style="
                font-size: 0.75rem;
                color: #aaa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 0.75rem;
                font-weight: 600;
              ">Webcam Effects</div>
              <div style="font-size: 0.7rem; color: #888; margin-bottom: 0.75rem;">
                Apply effects directly to the webcam feed
              </div>
              
              <!-- Quick Webcam Effects -->
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 0.75rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="blur" style="cursor: pointer;">
                  Blur
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="grayscale" style="cursor: pointer;">
                  Grayscale
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="sepia" style="cursor: pointer;">
                  Sepia
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="invert" style="cursor: pointer;">
                  Invert
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="pixelation" style="cursor: pointer;">
                  Pixelation
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="vignette" style="cursor: pointer;">
                  Vignette
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="bloom" style="cursor: pointer;">
                  Bloom
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="sharpen" style="cursor: pointer;">
                  Sharpen
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="fisheye" style="cursor: pointer;">
                  Fisheye
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="kaleidoscope" style="cursor: pointer;">
                  Kaleidoscope
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="posterize" style="cursor: pointer;">
                  Posterize
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="saturation" style="cursor: pointer;">
                  Saturation
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="contrast" style="cursor: pointer;">
                  Contrast
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #ccc; cursor: pointer;">
                  <input type="checkbox" class="webcam-effect-toggle" data-effect="exposure" style="cursor: pointer;">
                  Exposure
                </label>
              </div>
              
              <!-- Effect Intensity Sliders (shown when effect is enabled) -->
              <div id="webcam-effects-intensity-container" style="display: none; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #3a3a3a;">
                <div style="font-size: 0.75rem; color: #aaa; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  Effect Intensity
                </div>
                <div id="webcam-effects-intensity-sliders"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // FX no longer renders as a separate modal/sidebar. Any legacy FX markup is kept
    // inert in a <template> to avoid duplicate IDs, and the FX button simply scrolls
    // this controls panel to the effects section.

    // Add slider styling
    const style = document.createElement('style');
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: #4a9eff;
        border-radius: 50%;
        cursor: pointer;
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: #4a9eff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
    `;
    document.head.appendChild(style);

    // Setup event listeners
    this.setupListeners();
  }

  private setupListeners() {
    // Mobile controls header close button (✕)
    // Use an event-based close so it works even if other parts of the UI manage panel state.
    const closeControlsBtn = document.getElementById('close-controls-btn') as HTMLButtonElement | null;
    if (closeControlsBtn) {
      closeControlsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Preferred: tell MobileUI to close (keeps its internal `controlsOpen` in sync)
        window.dispatchEvent(new Event('eyesy:close-controls'));

        // Fallback: directly close the panel/backdrop in case MobileUI isn't active
        const controlsPanel = document.querySelector('#controls-container.controls-panel') as HTMLElement | null;
        controlsPanel?.classList.remove('open');
        document.querySelector('.controls-backdrop')?.classList.remove('visible');
      });
    }

    // Knob sliders
    for (let i = 1; i <= 5; i++) {
      const slider = document.getElementById(`knob${i}`) as HTMLInputElement;
      const valueSpan = document.getElementById(`knob${i}-value`)!;

      slider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        valueSpan.textContent = value.toFixed(2);
        if (this.onKnobChange) {
          this.onKnobChange(i, value);
        }
      });
    }

    // Knob 6 - Rotation (0-360 degrees)
    const knob6Slider = document.getElementById('knob6') as HTMLInputElement;
    const knob6Value = document.getElementById('knob6-value')!;
    knob6Slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      const degrees = Math.round(value * 360);
      knob6Value.textContent = `${degrees}°`;
      if (this.onKnobChange) {
        this.onKnobChange(6, value);
      }
    });

    // Knob 7 - Zoom (0.0-1.0, middle = 0.5 = 1.0x)
    const knob7Slider = document.getElementById('knob7') as HTMLInputElement;
    const knob7Value = document.getElementById('knob7-value')!;
    knob7Slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      // Calculate zoom level for display
      // For 2D modes: 0.0 = 0.1x, 0.5 = 1.0x, 1.0 = 5.0x (original range)
      // For 3D modes: Uses exponential curve 0.5x to 2.0x (calculated in Base3DMode)
      // Display uses 2D range for consistency in UI
      let zoomLevel: number;
      if (value <= 0.5) {
        const t = value / 0.5;
        zoomLevel = 0.1 + (t * 0.9); // 0.1x to 1.0x
      } else {
        const t = (value - 0.5) / 0.5;
        zoomLevel = 1.0 + (t * 4.0); // 1.0x to 5.0x
      }
      knob7Value.textContent = `${zoomLevel.toFixed(2)}x`;
      if (this.onKnobChange) {
        this.onKnobChange(7, value);
      }
    });

    // Knob 8 - Animation Speed (0.0-1.0, middle = 0.5 = 1.0x)
    const knob8Slider = document.getElementById('knob8') as HTMLInputElement;
    const knob8Value = document.getElementById('knob8-value')!;
    knob8Slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      // Calculate speed: 0.0 = 0.1x (slowest), 0.5 = 1.0x (normal), 1.0 = 3.0x (fastest)
      let speedLevel: number;
      if (value <= 0.5) {
        const t = value / 0.5;
        speedLevel = 0.1 + (t * 0.9); // 0.1x to 1.0x
      } else {
        const t = (value - 0.5) / 0.5;
        speedLevel = 1.0 + (t * 2.0); // 1.0x to 3.0x
      }
      knob8Value.textContent = `${speedLevel.toFixed(2)}x`;
      if (this.onKnobChange) {
        this.onKnobChange(8, value);
      }
    });

    // Knob 9 - X Position (0.0-1.0, middle = 0.5 = center/0px)
    const knob9Slider = document.getElementById('knob9') as HTMLInputElement;
    const knob9Value = document.getElementById('knob9-value')!;
    knob9Slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      // Calculate pixel offset: 0.0 = -max, 0.5 = 0, 1.0 = +max
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      const maxOffset = canvas ? canvas.width * 0.5 : 640; // 50% of canvas width
      const offset = (value - 0.5) * 2; // -1.0 to +1.0
      const pixelOffset = Math.round(offset * maxOffset);
      knob9Value.textContent = `${pixelOffset >= 0 ? '+' : ''}${pixelOffset}px`;
      if (this.onKnobChange) {
        this.onKnobChange(9, value);
      }
    });

    // Knob 10 - Y Position (0.0-1.0, middle = 0.5 = center/0px)
    const knob10Slider = document.getElementById('knob10') as HTMLInputElement;
    const knob10Value = document.getElementById('knob10-value')!;
    knob10Slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      // Calculate pixel offset: 0.0 = -max, 0.5 = 0, 1.0 = +max
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      const maxOffset = canvas ? canvas.height * 0.5 : 480; // 50% of canvas height
      const offset = (value - 0.5) * 2; // -1.0 to +1.0
      const pixelOffset = Math.round(offset * maxOffset);
      knob10Value.textContent = `${pixelOffset >= 0 ? '+' : ''}${pixelOffset}px`;
      if (this.onKnobChange) {
        this.onKnobChange(10, value);
      }
    });

    // Target FPS slider
    const targetFPSSlider = document.getElementById('target-fps') as HTMLInputElement;
    const targetFPSValue = document.getElementById('target-fps-value')!;
    const resetFPSBtn = document.getElementById('reset-fps-btn');
    
    targetFPSSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      targetFPSValue.textContent = value.toString();
      if (this.onTargetFPSChange) {
        this.onTargetFPSChange(value);
      }
    });

    // Reset FPS button
    if (resetFPSBtn) {
      resetFPSBtn.addEventListener('click', () => {
        targetFPSSlider.value = '60';
        targetFPSValue.textContent = '60';
        if (this.onTargetFPSChange) {
          this.onTargetFPSChange(60);
        }
      });
    }

    // Webcam enabled checkbox
    const webcamEnabled = document.getElementById('webcam-enabled') as HTMLInputElement;
    const webcamCompositorControls = document.getElementById('webcam-compositor-controls');
    
    // Function to toggle webcam controls visibility
    const toggleWebcamControls = (show: boolean) => {
      if (webcamCompositorControls) {
        webcamCompositorControls.style.display = show ? 'block' : 'none';
      }
    };
    
    // Initialize visibility based on checkbox state
    if (webcamEnabled && webcamCompositorControls) {
      toggleWebcamControls(webcamEnabled.checked);
    }
    
    if (webcamEnabled) {
      webcamEnabled.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        toggleWebcamControls(checked);
        if (this.onWebcamEnableChange) {
          this.onWebcamEnableChange(checked);
        }
      });
    }

    // Webcam compositor controls
    const webcamLayerPosition = document.getElementById('webcam-layer-position') as HTMLSelectElement;
    const webcamOpacity = document.getElementById('webcam-opacity') as HTMLInputElement;
    const webcamOpacityValue = document.getElementById('webcam-opacity-value');
    const webcamBlendMode = document.getElementById('webcam-blend-mode') as HTMLSelectElement;
    
    if (webcamLayerPosition) {
      webcamLayerPosition.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as 'background' | 'foreground';
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ position: value });
        }
      });
    }
    
    if (webcamOpacity && webcamOpacityValue) {
      webcamOpacity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        webcamOpacityValue.textContent = `${Math.round(value * 100)}%`;
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ opacity: value });
        }
      });
    }
    
    if (webcamBlendMode) {
      webcamBlendMode.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ blendMode: value });
        }
      });
    }
    
    // Webcam transform controls
    const webcamScale = document.getElementById('webcam-scale') as HTMLInputElement;
    const webcamScaleValue = document.getElementById('webcam-scale-value');
    const webcamPositionX = document.getElementById('webcam-position-x') as HTMLInputElement;
    const webcamPositionXValue = document.getElementById('webcam-position-x-value');
    const webcamPositionY = document.getElementById('webcam-position-y') as HTMLInputElement;
    const webcamPositionYValue = document.getElementById('webcam-position-y-value');
    const webcamRotation = document.getElementById('webcam-rotation') as HTMLInputElement;
    const webcamRotationValue = document.getElementById('webcam-rotation-value');
    const webcamMirror = document.getElementById('webcam-mirror') as HTMLInputElement;
    
    if (webcamScale && webcamScaleValue) {
      webcamScale.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        webcamScaleValue.textContent = `${Math.round(value * 100)}%`;
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ scale: value });
        }
      });
    }
    
    if (webcamPositionX && webcamPositionXValue) {
      webcamPositionX.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        webcamPositionXValue.textContent = value.toFixed(2);
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ positionX: value });
        }
      });
    }
    
    if (webcamPositionY && webcamPositionYValue) {
      webcamPositionY.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        webcamPositionYValue.textContent = value.toFixed(2);
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ positionY: value });
        }
      });
    }
    
    if (webcamRotation && webcamRotationValue) {
      webcamRotation.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        webcamRotationValue.textContent = `${Math.round(value)}°`;
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ rotation: value });
        }
      });
    }
    
    if (webcamMirror) {
      webcamMirror.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).checked;
        if (this.onWebcamCompositorChange) {
          this.onWebcamCompositorChange({ mirror: value });
        }
      });
    }
    
    // Webcam effects toggles
    const webcamEffectToggles = document.querySelectorAll('.webcam-effect-toggle');
    const webcamEffectsIntensityContainer = document.getElementById('webcam-effects-intensity-container');
    const webcamEffectsIntensitySliders = document.getElementById('webcam-effects-intensity-sliders');
    
    const updateWebcamEffectsIntensityUI = () => {
      if (!webcamEffectsIntensitySliders) return;
      
      const enabledEffects: string[] = [];
      webcamEffectToggles.forEach((toggle) => {
        const checkbox = toggle as HTMLInputElement;
        if (checkbox.checked) {
          enabledEffects.push(checkbox.dataset.effect || '');
        }
      });
      
      if (enabledEffects.length === 0) {
        if (webcamEffectsIntensityContainer) {
          webcamEffectsIntensityContainer.style.display = 'none';
        }
        return;
      }
      
      if (webcamEffectsIntensityContainer) {
        webcamEffectsIntensityContainer.style.display = 'block';
      }
      
      // Clear existing sliders
      webcamEffectsIntensitySliders.innerHTML = '';
      
      // Add intensity slider for each enabled effect
      enabledEffects.forEach(effectName => {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.marginBottom = '0.75rem';
        
        const label = document.createElement('label');
        label.style.cssText = 'display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 0.5rem; text-transform: capitalize;';
        label.textContent = `${effectName} Intensity:`;
        
        const sliderWrapper = document.createElement('div');
        sliderWrapper.style.display = 'flex';
        sliderWrapper.style.alignItems = 'center';
        sliderWrapper.style.gap = '0.5rem';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = '0.5';
        slider.dataset.effect = effectName;
        slider.className = 'webcam-effect-intensity';
        slider.style.cssText = 'flex: 1; height: 6px; background: #3a3a3a; border-radius: 3px; outline: none; -webkit-appearance: none; cursor: pointer;';
        
        const valueSpan = document.createElement('span');
        valueSpan.style.cssText = 'font-size: 0.8rem; color: #4a9eff; font-weight: 600; min-width: 3rem; text-align: right;';
        valueSpan.textContent = '50%';
        valueSpan.id = `webcam-effect-intensity-${effectName}-value`;
        
        slider.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          valueSpan.textContent = `${Math.round(value * 100)}%`;
          if (this.onWebcamEffectIntensityChange) {
            this.onWebcamEffectIntensityChange(effectName, value);
          }
        });
        
        sliderWrapper.appendChild(slider);
        sliderWrapper.appendChild(valueSpan);
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(sliderWrapper);
        webcamEffectsIntensitySliders.appendChild(sliderContainer);
      });
    };
    
    webcamEffectToggles.forEach((toggle) => {
      toggle.addEventListener('change', (e) => {
        const checkbox = e.target as HTMLInputElement;
        const effectName = checkbox.dataset.effect || '';
        const enabled = checkbox.checked;
        
        if (this.onWebcamEffectEnabledChange) {
          this.onWebcamEffectEnabledChange(effectName, enabled);
        }
        
        updateWebcamEffectsIntensityUI();
      });
    });
    
    // Webcam transform reset buttons
    const webcamTransformResetBtns = document.querySelectorAll('.webcam-transform-reset-btn');
    webcamTransformResetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const transformType = (btn as HTMLElement).dataset.transform;
        if (!transformType) return;
        
        const defaults: { [key: string]: number | boolean } = {
          scale: 1.0,
          positionX: 0.0,
          positionY: 0.0,
          rotation: 0,
          mirror: false
        };
        
        const defaultValue = defaults[transformType];
        if (defaultValue === undefined) return;
        
        // Update the UI element
        if (transformType === 'scale') {
          if (webcamScale && webcamScaleValue) {
            webcamScale.value = defaultValue.toString();
            webcamScaleValue.textContent = `${Math.round((defaultValue as number) * 100)}%`;
            // Trigger input event to update compositor
            webcamScale.dispatchEvent(new Event('input'));
          }
        } else if (transformType === 'positionX') {
          if (webcamPositionX && webcamPositionXValue) {
            webcamPositionX.value = defaultValue.toString();
            webcamPositionXValue.textContent = (defaultValue as number).toFixed(2);
            webcamPositionX.dispatchEvent(new Event('input'));
          }
        } else if (transformType === 'positionY') {
          if (webcamPositionY && webcamPositionYValue) {
            webcamPositionY.value = defaultValue.toString();
            webcamPositionYValue.textContent = (defaultValue as number).toFixed(2);
            webcamPositionY.dispatchEvent(new Event('input'));
          }
        } else if (transformType === 'rotation') {
          if (webcamRotation && webcamRotationValue) {
            webcamRotation.value = defaultValue.toString();
            webcamRotationValue.textContent = `${Math.round(defaultValue as number)}°`;
            webcamRotation.dispatchEvent(new Event('input'));
          }
        } else if (transformType === 'mirror') {
          if (webcamMirror) {
            webcamMirror.checked = defaultValue as boolean;
            webcamMirror.dispatchEvent(new Event('change'));
          }
        }
      });
    });

    // Webcam device selector
    const webcamDevice = document.getElementById('webcam-device') as HTMLSelectElement;
    if (webcamDevice) {
      webcamDevice.addEventListener('change', (e) => {
        if (this.onWebcamDeviceChange) {
          this.onWebcamDeviceChange((e.target as HTMLSelectElement).value);
        }
      });
    }

    // Rewind button
    const rewindBtn = document.getElementById('rewind-btn') as HTMLButtonElement;
    if (rewindBtn) {
      rewindBtn.addEventListener('click', () => {
        if (this.onRewind) {
          this.onRewind();
        }
      });
    }

    // Fast forward button
    const fastForwardBtn = document.getElementById('fast-forward-btn') as HTMLButtonElement;
    if (fastForwardBtn) {
      fastForwardBtn.addEventListener('click', () => {
        if (this.onFastForward) {
          this.onFastForward();
        }
      });
    }

    // Reverse playback checkbox
    const reversePlaybackCheckbox = document.getElementById('reverse-playback') as HTMLInputElement;
    if (reversePlaybackCheckbox) {
      reversePlaybackCheckbox.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (this.onReversePlaybackChange) {
          this.onReversePlaybackChange(checked);
        } else {
          console.error('[REVERSE] ERROR: onReversePlaybackChange callback is not set!');
        }
      });
    } else {
      console.error('[REVERSE] ERROR: Checkbox element not found!');
    }

    // Blur effect controls
    const blurEnabled = document.getElementById('effect-blur-enabled') as HTMLInputElement;
    const blurIntensity = document.getElementById('effect-blur-intensity') as HTMLInputElement;
    const blurIntensityValue = document.getElementById('effect-blur-intensity-value');
    const blurResetBtn = document.querySelector('button.effect-reset-btn[data-effect="blur"]') as HTMLElement;
    const blurIntensityValueContainer = blurIntensityValue?.parentElement as HTMLElement;
    
    const toggleBlurControls = (show: boolean) => {
      if (blurIntensityValueContainer) blurIntensityValueContainer.style.display = show ? 'flex' : 'none';
      if (blurIntensity) blurIntensity.style.display = show ? 'block' : 'none';
      if (blurIntensityValue) blurIntensityValue.style.display = show ? 'inline' : 'none';
      if (blurResetBtn) blurResetBtn.style.display = show ? 'inline-block' : 'none';
    };
    
    if (blurEnabled) {
      toggleBlurControls(blurEnabled.checked);
      blurEnabled.addEventListener('change', (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;
        toggleBlurControls(isEnabled);
        if (this.onEffectEnabledChange) {
          this.onEffectEnabledChange('blur', isEnabled);
        }
      });
    }
    if (blurIntensity && blurIntensityValue) {
      blurIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        blurIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('blur', value);
        }
      });
    }

    // Color Grading intensity slider (handled separately from setupColorGradingControl)
    const colorGradingIntensity = document.getElementById('effect-color-grading-intensity') as HTMLInputElement;
    const colorGradingIntensityValue = document.getElementById('effect-color-grading-intensity-value');
    if (colorGradingIntensity && colorGradingIntensityValue) {
      colorGradingIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        colorGradingIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('colorGrading', value);
        }
      });
    }

    // Color Grading parameters
    const brightnessSlider = document.getElementById('color-grading-brightness') as HTMLInputElement;
    const brightnessValue = document.getElementById('color-grading-brightness-value');
    if (brightnessSlider && brightnessValue) {
      brightnessSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        brightnessValue.textContent = value.toFixed(2);
        if (this.onColorGradingBrightnessChange) {
          this.onColorGradingBrightnessChange(value);
        }
      });
    }

    const contrastSlider = document.getElementById('color-grading-contrast') as HTMLInputElement;
    const contrastValue = document.getElementById('color-grading-contrast-value');
    if (contrastSlider && contrastValue) {
      contrastSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        contrastValue.textContent = value.toFixed(2);
        if (this.onColorGradingContrastChange) {
          this.onColorGradingContrastChange(value);
        }
      });
    }

    const saturationSlider = document.getElementById('color-grading-saturation') as HTMLInputElement;
    const saturationValue = document.getElementById('color-grading-saturation-value');
    if (saturationSlider && saturationValue) {
      saturationSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        saturationValue.textContent = value.toFixed(2);
        if (this.onColorGradingSaturationChange) {
          this.onColorGradingSaturationChange(value);
        }
      });
    }

    const hueSlider = document.getElementById('color-grading-hue') as HTMLInputElement;
    const hueValue = document.getElementById('color-grading-hue-value');
    if (hueSlider && hueValue) {
      hueSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        hueValue.textContent = `${value}°`;
        if (this.onColorGradingHueChange) {
          this.onColorGradingHueChange(value);
        }
      });
    }

    // Pixelation, Invert, and Edge Detection are now handled by setupEffectControl below

    // Vignette effect controls
    const vignetteEnabled = document.getElementById('effect-vignette-enabled') as HTMLInputElement;
    const vignetteIntensity = document.getElementById('effect-vignette-intensity') as HTMLInputElement;
    const vignetteIntensityValue = document.getElementById('effect-vignette-intensity-value');
    const vignetteResetBtn = document.querySelector('button.effect-reset-btn[data-effect="vignette"]') as HTMLElement;
    const vignetteIntensityValueContainer = vignetteIntensityValue?.parentElement as HTMLElement;
    
    const toggleVignetteControls = (show: boolean) => {
      if (vignetteIntensityValueContainer) vignetteIntensityValueContainer.style.display = show ? 'flex' : 'none';
      if (vignetteIntensity) vignetteIntensity.style.display = show ? 'block' : 'none';
      if (vignetteIntensityValue) vignetteIntensityValue.style.display = show ? 'inline' : 'none';
      if (vignetteResetBtn) vignetteResetBtn.style.display = show ? 'inline-block' : 'none';
    };
    
    if (vignetteEnabled) {
      toggleVignetteControls(vignetteEnabled.checked);
      vignetteEnabled.addEventListener('change', (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;
        toggleVignetteControls(isEnabled);
        if (this.onEffectEnabledChange) {
          this.onEffectEnabledChange('vignette', isEnabled);
        }
      });
    }
    if (vignetteIntensity && vignetteIntensityValue) {
      vignetteIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        vignetteIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('vignette', value);
        }
      });
    }

    // Bloom effect controls
    const bloomEnabled = document.getElementById('effect-bloom-enabled') as HTMLInputElement;
    const bloomIntensity = document.getElementById('effect-bloom-intensity') as HTMLInputElement;
    const bloomIntensityValue = document.getElementById('effect-bloom-intensity-value');
    const bloomResetBtn = document.querySelector('button.effect-reset-btn[data-effect="bloom"]') as HTMLElement;
    const bloomIntensityValueContainer = bloomIntensityValue?.parentElement as HTMLElement;
    
    const toggleBloomControls = (show: boolean) => {
      if (bloomIntensityValueContainer) bloomIntensityValueContainer.style.display = show ? 'flex' : 'none';
      if (bloomIntensity) bloomIntensity.style.display = show ? 'block' : 'none';
      if (bloomIntensityValue) bloomIntensityValue.style.display = show ? 'inline' : 'none';
      if (bloomResetBtn) bloomResetBtn.style.display = show ? 'inline-block' : 'none';
    };
    
    if (bloomEnabled) {
      toggleBloomControls(bloomEnabled.checked);
      bloomEnabled.addEventListener('change', (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;
        toggleBloomControls(isEnabled);
        if (this.onEffectEnabledChange) {
          this.onEffectEnabledChange('bloom', isEnabled);
        }
      });
    }
    if (bloomIntensity && bloomIntensityValue) {
      bloomIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        bloomIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('bloom', value);
        }
      });
    }

    // Chromatic Aberration effect controls
    const chromaticAberrationEnabled = document.getElementById('effect-chromatic-aberration-enabled') as HTMLInputElement;
    const chromaticAberrationIntensity = document.getElementById('effect-chromatic-aberration-intensity') as HTMLInputElement;
    const chromaticAberrationIntensityValue = document.getElementById('effect-chromatic-aberration-intensity-value');
    const chromaticAberrationResetBtn = document.querySelector('button.effect-reset-btn[data-effect="chromatic-aberration"]') as HTMLElement;
    const chromaticAberrationIntensityValueContainer = chromaticAberrationIntensityValue?.parentElement as HTMLElement;
    
    const toggleChromaticAberrationControls = (show: boolean) => {
      if (chromaticAberrationIntensityValueContainer) chromaticAberrationIntensityValueContainer.style.display = show ? 'flex' : 'none';
      if (chromaticAberrationIntensity) chromaticAberrationIntensity.style.display = show ? 'block' : 'none';
      if (chromaticAberrationIntensityValue) chromaticAberrationIntensityValue.style.display = show ? 'inline' : 'none';
      if (chromaticAberrationResetBtn) chromaticAberrationResetBtn.style.display = show ? 'inline-block' : 'none';
    };
    
    if (chromaticAberrationEnabled) {
      toggleChromaticAberrationControls(chromaticAberrationEnabled.checked);
      chromaticAberrationEnabled.addEventListener('change', (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;
        toggleChromaticAberrationControls(isEnabled);
        if (this.onEffectEnabledChange) {
          this.onEffectEnabledChange('chromaticAberration', isEnabled);
        }
      });
    }
    if (chromaticAberrationIntensity && chromaticAberrationIntensityValue) {
      chromaticAberrationIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        chromaticAberrationIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('chromaticAberration', value);
        }
      });
    }

    // Scanlines effect controls
    const scanlinesEnabled = document.getElementById('effect-scanlines-enabled') as HTMLInputElement;
    const scanlinesIntensity = document.getElementById('effect-scanlines-intensity') as HTMLInputElement;
    const scanlinesIntensityValue = document.getElementById('effect-scanlines-intensity-value');
    const scanlinesResetBtn = document.querySelector('button.effect-reset-btn[data-effect="scanlines"]') as HTMLElement;
    const scanlinesIntensityValueContainer = scanlinesIntensityValue?.parentElement as HTMLElement;
    
    const toggleScanlinesControls = (show: boolean) => {
      if (scanlinesIntensityValueContainer) scanlinesIntensityValueContainer.style.display = show ? 'flex' : 'none';
      if (scanlinesIntensity) scanlinesIntensity.style.display = show ? 'block' : 'none';
      if (scanlinesIntensityValue) scanlinesIntensityValue.style.display = show ? 'inline' : 'none';
      if (scanlinesResetBtn) scanlinesResetBtn.style.display = show ? 'inline-block' : 'none';
    };
    
    if (scanlinesEnabled) {
      toggleScanlinesControls(scanlinesEnabled.checked);
      scanlinesEnabled.addEventListener('change', (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;
        toggleScanlinesControls(isEnabled);
        if (this.onEffectEnabledChange) {
          this.onEffectEnabledChange('scanlines', isEnabled);
        }
      });
    }
    if (scanlinesIntensity && scanlinesIntensityValue) {
      scanlinesIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        scanlinesIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('scanlines', value);
        }
      });
    }

    // VHS Distortion effect controls
    const vhsDistortionEnabled = document.getElementById('effect-vhs-distortion-enabled') as HTMLInputElement;
    const vhsDistortionIntensity = document.getElementById('effect-vhs-distortion-intensity') as HTMLInputElement;
    const vhsDistortionIntensityValue = document.getElementById('effect-vhs-distortion-intensity-value');
    const vhsDistortionResetBtn = document.querySelector('button.effect-reset-btn[data-effect="vhs-distortion"]') as HTMLElement;
    const vhsDistortionIntensityValueContainer = vhsDistortionIntensityValue?.parentElement as HTMLElement;
    
    const toggleVHSDistortionControls = (show: boolean) => {
      if (vhsDistortionIntensityValueContainer) vhsDistortionIntensityValueContainer.style.display = show ? 'flex' : 'none';
      if (vhsDistortionIntensity) vhsDistortionIntensity.style.display = show ? 'block' : 'none';
      if (vhsDistortionIntensityValue) vhsDistortionIntensityValue.style.display = show ? 'inline' : 'none';
      if (vhsDistortionResetBtn) vhsDistortionResetBtn.style.display = show ? 'inline-block' : 'none';
    };
    
    if (vhsDistortionEnabled) {
      toggleVHSDistortionControls(vhsDistortionEnabled.checked);
      vhsDistortionEnabled.addEventListener('change', (e) => {
        const isEnabled = (e.target as HTMLInputElement).checked;
        toggleVHSDistortionControls(isEnabled);
        if (this.onEffectEnabledChange) {
          this.onEffectEnabledChange('vhsDistortion', isEnabled);
        }
      });
    }
    if (vhsDistortionIntensity && vhsDistortionIntensityValue) {
      vhsDistortionIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        vhsDistortionIntensityValue.textContent = value.toFixed(2);
        if (this.onEffectIntensityChange) {
          this.onEffectIntensityChange('vhsDistortion', value);
        }
      });
    }

    // Helper function to set up effect controls
    const setupEffectControl = (effectName: string) => {
      // Convert camelCase to kebab-case for UI element IDs
      const kebabName = effectName.replace(/([A-Z])/g, '-$1').toLowerCase();
      const enabled = document.getElementById(`effect-${kebabName}-enabled`) as HTMLInputElement;
      const intensity = document.getElementById(`effect-${kebabName}-intensity`) as HTMLInputElement;
      const intensityValue = document.getElementById(`effect-${kebabName}-intensity-value`);
      const resetBtn = document.querySelector(`button.effect-reset-btn[data-effect="${kebabName}"]`) as HTMLElement;
      
      // Find the checkbox's parent container (the effect card)
      const effectCard = enabled?.closest('div[style*="background"]') as HTMLElement;
      
      // Find all control elements that should be hidden/shown
      // The intensity value and reset button are in a div next to the checkbox
      const intensityValueContainer = intensityValue?.parentElement as HTMLElement;
      
      // The intensity slider is usually a direct child of the effect card
      // We'll hide it directly
      
      // Function to toggle visibility of intensity controls
      const toggleIntensityControls = (show: boolean) => {
        if (intensityValueContainer) {
          intensityValueContainer.style.display = show ? 'flex' : 'none';
          intensityValueContainer.style.visibility = show ? 'visible' : 'hidden';
        }
        if (intensity) {
          // Hide the slider when effect is disabled
          intensity.style.display = show ? 'block' : 'none';
          intensity.style.visibility = show ? 'visible' : 'hidden';
        }
        if (intensityValue) {
          intensityValue.style.display = show ? 'inline' : 'none';
          intensityValue.style.visibility = show ? 'visible' : 'hidden';
        }
        if (resetBtn) {
          resetBtn.style.display = show ? 'inline-block' : 'none';
          resetBtn.style.visibility = show ? 'visible' : 'hidden';
        }
      };
      
      // Initially hide controls if effect is disabled
      if (enabled) {
        // Set initial state immediately
        toggleIntensityControls(enabled.checked);
        
        enabled.addEventListener('change', (e) => {
          const isEnabled = (e.target as HTMLInputElement).checked;
          toggleIntensityControls(isEnabled);
          
          if (this.onEffectEnabledChange) {
            this.onEffectEnabledChange(effectName, isEnabled);
          }
        });
      } else {
        // If no enabled checkbox, show controls by default
        toggleIntensityControls(true);
      }
      
      // Also ensure slider is hidden if checkbox exists and is unchecked
      // This handles cases where setupEffectControl runs before checkbox state is set
      if (enabled && intensity && !enabled.checked) {
        // Hide immediately
        intensity.style.display = 'none';
        intensity.style.visibility = 'hidden';
        if (intensityValueContainer) {
          intensityValueContainer.style.display = 'none';
          intensityValueContainer.style.visibility = 'hidden';
        }
        if (intensityValue) {
          intensityValue.style.display = 'none';
          intensityValue.style.visibility = 'hidden';
        }
        if (resetBtn) {
          resetBtn.style.display = 'none';
          resetBtn.style.visibility = 'hidden';
        }
        // Also use setTimeout as backup to ensure DOM is ready
        setTimeout(() => {
          if (!enabled.checked && intensity) {
            intensity.style.display = 'none';
            intensity.style.visibility = 'hidden';
            if (intensityValueContainer) {
              intensityValueContainer.style.display = 'none';
              intensityValueContainer.style.visibility = 'hidden';
            }
            if (intensityValue) {
              intensityValue.style.display = 'none';
              intensityValue.style.visibility = 'hidden';
            }
            if (resetBtn) {
              resetBtn.style.display = 'none';
              resetBtn.style.visibility = 'hidden';
            }
          }
        }, 0);
      }
      
      if (intensity && intensityValue) {
        intensity.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          if (intensityValue) {
            intensityValue.textContent = value.toFixed(2);
          }
          if (this.onEffectIntensityChange) {
            this.onEffectIntensityChange(effectName, value);
          }
        });
      }
    };
    
    // Special handling for Color Grading (has additional controls)
    const setupColorGradingControl = () => {
      const enabled = document.getElementById('effect-color-grading-enabled') as HTMLInputElement;
      const intensityValueContainer = document.getElementById('effect-color-grading-intensity-value')?.parentElement as HTMLElement;
      
      // Find the Color Grading effect card and then find the controls container within it
      // The controls container is the div that contains all the sliders (brightness, contrast, etc.)
      const effectCard = enabled?.closest('div[style*="background"]') as HTMLElement;
      // Find the container that has the intensity slider inside it
      const intensitySlider = document.getElementById('effect-color-grading-intensity');
      const controlsContainer = intensitySlider?.closest('.effect-controls-container') as HTMLElement;
      
      const toggleControls = (show: boolean) => {
        if (intensityValueContainer) {
          intensityValueContainer.style.display = show ? 'flex' : 'none';
        }
        if (controlsContainer) {
          controlsContainer.style.display = show ? 'block' : 'none';
        }
      };
      
      if (enabled) {
        // Set initial state based on checkbox
        toggleControls(enabled.checked);
        
        enabled.addEventListener('change', (e) => {
          const isEnabled = (e.target as HTMLInputElement).checked;
          toggleControls(isEnabled);
          if (this.onEffectEnabledChange) {
            this.onEffectEnabledChange('colorGrading', isEnabled);
          }
        });
      } else {
        // If no checkbox found, show controls by default
        toggleControls(true);
      }
    };

    // Set up Color Grading (special case with multiple controls)
    setupColorGradingControl();
    
    // Set up all effects (using exact effect names from Effect classes)
    // Note: Some effects use camelCase names that get converted to kebab-case for UI IDs
    setupEffectControl('blur');
    setupEffectControl('bloom');
    setupEffectControl('vignette');
    setupEffectControl('chromaticAberration'); // camelCase -> chromatic-aberration
    setupEffectControl('scanlines');
    setupEffectControl('vhsDistortion'); // camelCase -> vhs-distortion
    setupEffectControl('pixelation');
    setupEffectControl('invert');
    setupEffectControl('edgeDetection'); // camelCase -> edge-detection
    setupEffectControl('sepia');
    setupEffectControl('grayscale');
    setupEffectControl('colorize');
    setupEffectControl('solarize');
    setupEffectControl('posterize');
    setupEffectControl('contrast');
    setupEffectControl('exposure');
    setupEffectControl('saturation');
    setupEffectControl('motionBlur'); // camelCase -> motion-blur
    setupEffectControl('radialBlur'); // camelCase -> radial-blur
    setupEffectControl('tiltShift'); // camelCase -> tilt-shift
    setupEffectControl('fisheye');
    setupEffectControl('pinchBulge'); // camelCase -> pinch-bulge
    setupEffectControl('twirl');
    setupEffectControl('wave');
    setupEffectControl('mirror');
    setupEffectControl('kaleidoscope');
    setupEffectControl('filmGrain'); // camelCase -> film-grain
    setupEffectControl('noise');
    setupEffectControl('halftone');
    setupEffectControl('sharpen');
    setupEffectControl('emboss');
    setupEffectControl('lensFlare'); // camelCase -> lens-flare
    setupEffectControl('trails');
    setupEffectControl('echo');

    // Ensure all effect sliders are hidden if their checkboxes are unchecked
    // This handles any timing issues or effects that might have been missed
    setTimeout(() => {
      document.querySelectorAll('input[type="checkbox"][id^="effect-"][id$="-enabled"]').forEach((checkbox) => {
        const enabled = checkbox as HTMLInputElement;
        if (!enabled.checked) {
          // Find the corresponding intensity slider
          const id = enabled.id;
          const effectName = id.replace('effect-', '').replace('-enabled', '');
          const intensity = document.getElementById(`effect-${effectName}-intensity`) as HTMLInputElement;
          const intensityValue = document.getElementById(`effect-${effectName}-intensity-value`);
          const intensityValueContainer = intensityValue?.parentElement as HTMLElement;
          const resetBtn = document.querySelector(`button.effect-reset-btn[data-effect="${effectName}"]`) as HTMLElement;
          
          if (intensity) {
            intensity.style.display = 'none';
            intensity.style.visibility = 'hidden';
          }
          if (intensityValueContainer) {
            intensityValueContainer.style.display = 'none';
            intensityValueContainer.style.visibility = 'hidden';
          }
          if (intensityValue) {
            intensityValue.style.display = 'none';
            intensityValue.style.visibility = 'hidden';
          }
          if (resetBtn) {
            resetBtn.style.display = 'none';
            resetBtn.style.visibility = 'hidden';
          }
        }
      });
    }, 100);

    // Effects Panel (separate UI, but opens from SAME side as controls)
    const effectsPanelToggle = document.getElementById('effects-panel-toggle');
    const effectsPanelModal = document.getElementById('effects-panel-modal');
    const effectsSearch = document.getElementById('effects-search') as HTMLInputElement | null;

    // Portal to <body> so it's not trapped by transforms on the controls panel
    if (effectsPanelModal && effectsPanelModal.parentElement !== document.body) {
      document.body.appendChild(effectsPanelModal);
    }

    const getIsLeftHanded = (): boolean => {
      const container = document.querySelector('#controls-container') as HTMLElement | null;
      return container?.classList.contains('left-handed') || false;
    };

    const applyEffectsPanelSide = () => {
      if (!effectsPanelModal) return;
      const isLeftHanded = getIsLeftHanded();

      if (isLeftHanded) {
        effectsPanelModal.style.left = '0';
        effectsPanelModal.style.right = 'auto';
        effectsPanelModal.style.borderRight = '2px solid #4a4a4a';
        effectsPanelModal.style.borderLeft = 'none';
        effectsPanelModal.style.boxShadow = '4px 0 20px rgba(0, 0, 0, 0.5)';
        if (!effectsPanelModal.classList.contains('open')) {
          effectsPanelModal.style.transform = 'translateX(-100%)';
        }
      } else {
        effectsPanelModal.style.left = 'auto';
        effectsPanelModal.style.right = '0';
        effectsPanelModal.style.borderLeft = '2px solid #4a4a4a';
        effectsPanelModal.style.borderRight = 'none';
        effectsPanelModal.style.boxShadow = '-4px 0 20px rgba(0, 0, 0, 0.5)';
        if (!effectsPanelModal.classList.contains('open')) {
          effectsPanelModal.style.transform = 'translateX(100%)';
        }
      }
    };

    const closeEffectsPanel = () => {
      if (!effectsPanelModal) return;
      effectsPanelModal.classList.remove('open');
      applyEffectsPanelSide(); // restores correct hidden transform for current side
      const backdrop = document.querySelector('.effects-panel-backdrop') as HTMLElement | null;
      backdrop?.classList.remove('visible');
      setTimeout(() => {
        effectsPanelModal.style.display = 'none';
        effectsPanelModal.style.visibility = 'hidden';
      }, 300);
    };

    const openEffectsPanel = () => {
      if (!effectsPanelModal) return;
      applyEffectsPanelSide();
      effectsPanelModal.style.display = 'block';
      effectsPanelModal.style.visibility = 'visible';
      // Backdrop (tap outside to close)
      let backdrop = document.querySelector('.effects-panel-backdrop') as HTMLElement | null;
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'effects-panel-backdrop';
        backdrop.addEventListener('click', () => closeEffectsPanel());
        document.body.appendChild(backdrop);
      }
      backdrop.classList.add('visible');
      // Trigger reflow
      effectsPanelModal.offsetHeight;
      effectsPanelModal.classList.add('open');
      effectsPanelModal.style.transform = 'translateX(0)';

      if (effectsSearch) {
        setTimeout(() => effectsSearch.focus(), 100);
      }
    };

    // Keep side in sync with left-handed mode
    const controlsContainer = document.querySelector('#controls-container') as HTMLElement | null;
    if (controlsContainer && effectsPanelModal) {
      const observer = new MutationObserver(() => applyEffectsPanelSide());
      observer.observe(controlsContainer, { attributes: true, attributeFilter: ['class'] });
    }

    // Toggle button inside Controls
    if (effectsPanelToggle) {
      effectsPanelToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!effectsPanelModal) return;
        const isOpen = effectsPanelModal.classList.contains('open');
        if (isOpen) closeEffectsPanel();
        else openEffectsPanel();
      });
    }

    // Close button inside the effects panel header
    const effectsPanelCloseBtn = document.getElementById('effects-panel-close-btn');
    if (effectsPanelCloseBtn) {
      effectsPanelCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeEffectsPanel();
      });
    }

    // ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && effectsPanelModal && effectsPanelModal.classList.contains('open')) {
        e.preventDefault();
        e.stopPropagation();
        closeEffectsPanel();
      }
    });

    // Backdrop click to close (same pattern as controls)
    if (effectsPanelModal) {
      effectsPanelModal.addEventListener('click', (e) => {
        if (e.target === effectsPanelModal) closeEffectsPanel();
      });
      // initialize hidden state on correct side
      effectsPanelModal.style.display = 'none';
      effectsPanelModal.style.visibility = 'hidden';
      effectsPanelModal.classList.remove('open');
      applyEffectsPanelSide();
    }

    // Reset Effects button in effects panel
    const resetEffectsPanelBtn = document.getElementById('reset-effects-panel');
    if (resetEffectsPanelBtn) {
      resetEffectsPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onResetAllEffectsToDefault) {
          this.onResetAllEffectsToDefault();
        }
      });
    }
    
    // Random Effects button in effects panel
    const randomEffectsPanelBtn = document.getElementById('random-effects-panel');
    if (randomEffectsPanelBtn) {
      randomEffectsPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onRandomizeEffects) {
          this.onRandomizeEffects();
        }
      });
    }
    
    // Effects Blend Mix slider
    const effectsBlendMixSlider = document.getElementById('effects-blend-mix') as HTMLInputElement;
    const effectsBlendMixValue = document.getElementById('effects-blend-mix-value');
    if (effectsBlendMixSlider && effectsBlendMixValue) {
      effectsBlendMixSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        const percent = Math.round(value * 100);
        effectsBlendMixValue.textContent = `${percent}%`;
        if (this.onEffectsBlendMixChange) {
          this.onEffectsBlendMixChange(value);
        }
      });
    }
    
    // Effects search functionality
    if (effectsSearch && effectsPanelModal) {
      effectsSearch.addEventListener('input', (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        const effectCards = effectsPanelModal.querySelectorAll('[data-effect-name]');
        
        effectCards.forEach((card) => {
          const effectName = (card as HTMLElement).getAttribute('data-effect-name') || '';
          const label = card.querySelector('label');
          const labelText = label?.textContent?.toLowerCase() || '';
          
          if (effectName.toLowerCase().includes(searchTerm) || labelText.includes(searchTerm)) {
            (card as HTMLElement).style.display = '';
          } else {
            (card as HTMLElement).style.display = 'none';
          }
        });
        
        // Also hide/show section headers if all effects in section are hidden
        const sections = effectsPanelModal.querySelectorAll('[data-effect-section]');
        sections.forEach((section) => {
          const visibleEffects = section.querySelectorAll('[data-effect-name][style*="display: none"]');
          const allEffects = section.querySelectorAll('[data-effect-name]');
          if (visibleEffects.length === allEffects.length && allEffects.length > 0) {
            (section as HTMLElement).style.display = 'none';
          } else {
            (section as HTMLElement).style.display = '';
          }
        });
      });
    }

    // Tab switching for effects panel
    const effectsTabs = document.querySelectorAll('.effects-tab');
    const postEffectsTabContent = document.getElementById('post-effects-tab');
    const webcamEffectsTabContent = document.getElementById('webcam-effects-tab');
    
    effectsTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).getAttribute('data-tab');
        
        // Update tab button styles
        effectsTabs.forEach((t) => {
          const isActive = (t as HTMLElement).getAttribute('data-tab') === tabName;
          if (isActive) {
            (t as HTMLElement).style.background = '#4a9eff';
            (t as HTMLElement).style.color = 'white';
          } else {
            (t as HTMLElement).style.background = '#3a3a3a';
            (t as HTMLElement).style.color = '#aaa';
          }
        });
        
        // Show/hide tab content
        if (tabName === 'post-effects' && postEffectsTabContent) {
          postEffectsTabContent.style.display = '';
          if (webcamEffectsTabContent) {
            webcamEffectsTabContent.style.display = 'none';
          }
        } else if (tabName === 'webcam-effects' && webcamEffectsTabContent) {
          webcamEffectsTabContent.style.display = '';
          if (postEffectsTabContent) {
            postEffectsTabContent.style.display = 'none';
          }
        }
      });
    });

    // Trigger button
    const triggerBtn = document.getElementById('trigger-btn');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onTrigger) {
          this.onTrigger();
        }
      });
      // Also support mousedown/mouseup for hold behavior
      triggerBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.onTrigger) {
          this.onTrigger();
        }
      });
    }

    // Auto clear button (in header)
    const autoClearBtn = document.getElementById('auto-clear-btn');
    if (autoClearBtn) {
      autoClearBtn.addEventListener('click', () => {
        // Don't allow toggling if button is disabled (3D modes)
        if (autoClearBtn.hasAttribute('disabled')) {
          return;
        }
        const currentState = autoClearBtn.classList.contains('active');
        const newState = !currentState;
        if (this.onAutoClearChange) {
          this.onAutoClearChange(newState);
        }
      });
    }

    // Microphone gain slider
    const micGainSlider = document.getElementById('mic-gain') as HTMLInputElement;
    const micGainValue = document.getElementById('mic-gain-value')!;
    micGainSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      micGainValue.textContent = value.toFixed(2);
      if (this.onMicGainChange) {
        this.onMicGainChange(value);
      }
    });

    // Random sequence checkbox
    const randomSequence = document.getElementById('random-sequence') as HTMLInputElement;
    const randomSequenceFreqContainer = document.getElementById('random-sequence-frequency-container');
    randomSequence.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      if (this.onRandomSequenceChange) {
        this.onRandomSequenceChange(enabled);
      }
      // Show/hide frequency slider
      if (randomSequenceFreqContainer) {
        randomSequenceFreqContainer.style.display = enabled ? 'block' : 'none';
      }
    });

    // Random sequence frequency slider
    const randomSequenceFreq = document.getElementById('random-sequence-frequency') as HTMLInputElement;
    const randomSequenceFreqValue = document.getElementById('random-sequence-frequency-value')!;
    randomSequenceFreq.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      randomSequenceFreqValue.textContent = value.toFixed(2);
      if (this.onRandomSequenceFrequencyChange) {
        this.onRandomSequenceFrequencyChange(value);
      }
    });

    // Random color checkbox
    const randomColor = document.getElementById('random-color') as HTMLInputElement;
    const randomColorFreqContainer = document.getElementById('random-color-frequency-container');
    randomColor.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      if (this.onRandomColorChange) {
        this.onRandomColorChange(enabled);
      }
      // Show/hide frequency slider
      if (randomColorFreqContainer) {
        randomColorFreqContainer.style.display = enabled ? 'block' : 'none';
      }
    });

    // Random color frequency slider
    const randomColorFreq = document.getElementById('random-color-frequency') as HTMLInputElement;
    const randomColorFreqValue = document.getElementById('random-color-frequency-value')!;
    randomColorFreq.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      randomColorFreqValue.textContent = value.toFixed(2);
      if (this.onRandomColorFrequencyChange) {
        this.onRandomColorFrequencyChange(value);
      }
    });

    // Random trigger checkbox
    const randomTrigger = document.getElementById('random-trigger') as HTMLInputElement;
    const randomTriggerFreqContainer = document.getElementById('random-trigger-frequency-container');
    const randomTriggerLevelContainer = document.getElementById('random-trigger-level-container');
    randomTrigger.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      if (this.onRandomTriggerChange) {
        this.onRandomTriggerChange(enabled);
      }
      // Show/hide frequency slider and level indicator
      if (randomTriggerFreqContainer) {
        randomTriggerFreqContainer.style.display = enabled ? 'block' : 'none';
      }
      if (randomTriggerLevelContainer) {
        randomTriggerLevelContainer.style.display = enabled ? 'block' : 'none';
      }
    });
    
    // Set initial state - show level indicator if checkbox is checked
    if (randomTrigger && randomTriggerLevelContainer) {
      randomTriggerLevelContainer.style.display = randomTrigger.checked ? 'block' : 'none';
    }

    // Random trigger frequency slider
    const randomTriggerFreq = document.getElementById('random-trigger-frequency') as HTMLInputElement;
    const randomTriggerFreqValue = document.getElementById('random-trigger-frequency-value')!;
    randomTriggerFreq.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      randomTriggerFreqValue.textContent = value.toFixed(2);
      if (this.onRandomTriggerFrequencyChange) {
        this.onRandomTriggerFrequencyChange(value);
      }
    });

    // Mock Audio checkbox
    const mockAudio = document.getElementById('mock-audio') as HTMLInputElement;
    const mockAudioFreqContainer = document.getElementById('mock-audio-frequency-container');
    const mockAudioLevelContainer = document.getElementById('mock-audio-level-container');
    
    // Set initial state - hide level container if checkbox is unchecked
    if (mockAudio && mockAudioLevelContainer) {
      mockAudioLevelContainer.style.display = mockAudio.checked ? 'block' : 'none';
    }
    
    mockAudio.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      if (this.onMockAudioChange) {
        this.onMockAudioChange(enabled);
      }
      if (mockAudioFreqContainer) {
        mockAudioFreqContainer.style.display = enabled ? 'block' : 'none';
      }
      if (mockAudioLevelContainer) {
        mockAudioLevelContainer.style.display = enabled ? 'block' : 'none';
      }
    });

    // Mock Audio frequency slider
    const mockAudioFreq = document.getElementById('mock-audio-frequency') as HTMLInputElement;
    const mockAudioFreqValue = document.getElementById('mock-audio-frequency-value')!;
    mockAudioFreq.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      mockAudioFreqValue.textContent = value.toFixed(2);
      if (this.onMockAudioFrequencyChange) {
        this.onMockAudioFrequencyChange(value);
      }
    });

    // Mock Audio intensity randomness slider
    const mockAudioIntensityRandomness = document.getElementById('mock-audio-intensity-randomness') as HTMLInputElement;
    const mockAudioIntensityRandomnessValue = document.getElementById('mock-audio-intensity-randomness-value')!;
    if (mockAudioIntensityRandomness && mockAudioIntensityRandomnessValue) {
      mockAudioIntensityRandomness.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        mockAudioIntensityRandomnessValue.textContent = value.toFixed(2);
        if (this.onMockAudioIntensityRandomnessChange) {
          this.onMockAudioIntensityRandomnessChange(value);
        }
      });
    }

    // Transition controls
    const transitionEnabled = document.getElementById('transition-enabled') as HTMLInputElement;
    const transitionControlsContainer = document.getElementById('transition-controls-container');
    
    // Initialize transition controls state (enabled by default)
    if (transitionControlsContainer && transitionEnabled) {
      const enabled = transitionEnabled.checked;
      transitionControlsContainer.style.opacity = enabled ? '1' : '0.5';
      const inputs = transitionControlsContainer.querySelectorAll('input, select');
      inputs.forEach((input: any) => {
        input.disabled = !enabled;
      });
    }
    
    transitionEnabled.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      if (this.onTransitionEnabledChange) {
        this.onTransitionEnabledChange(enabled);
      }
      // Show/hide transition controls
      if (transitionControlsContainer) {
        transitionControlsContainer.style.opacity = enabled ? '1' : '0.5';
        const inputs = transitionControlsContainer.querySelectorAll('input, select');
        inputs.forEach((input: any) => {
          input.disabled = !enabled;
        });
      }
    });

    // Transition duration slider
    const transitionDuration = document.getElementById('transition-duration') as HTMLInputElement;
    const transitionDurationValue = document.getElementById('transition-duration-value')!;
    transitionDuration.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      transitionDurationValue.textContent = value.toFixed(2);
      if (this.onTransitionDurationChange) {
        this.onTransitionDurationChange(value);
      }
    });

    // Transition type dropdown
    const transitionType = document.getElementById('transition-type') as HTMLSelectElement;
    const transitionTypeDisplay = document.getElementById('transition-type-display')!;
    transitionType.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      const displayText = value === 'auto' ? 'Auto' : transitionType.options[transitionType.selectedIndex].text;
      transitionTypeDisplay.textContent = displayText;
      if (this.onTransitionTypeChange) {
        this.onTransitionTypeChange(value);
      }
    });

    // Left-handed mode checkbox
    const leftHandedCheckbox = document.getElementById('left-handed') as HTMLInputElement;
    if (leftHandedCheckbox) {
      leftHandedCheckbox.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).checked;
        if (this.onLeftHandedChange) {
          this.onLeftHandedChange(value);
        }
      });
    }

    // Portrait rotate checkbox
    const portraitRotateCheckbox = document.getElementById('portrait-rotate') as HTMLInputElement;
    if (portraitRotateCheckbox) {
      portraitRotateCheckbox.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).checked;
        if (this.onPortraitRotateChange) {
          this.onPortraitRotateChange(value);
        }
      });
    }


    // Seizure-safe mode checkbox with warning dialog
    const seizureSafeCheckbox = document.getElementById('seizure-safe') as HTMLInputElement;
    if (seizureSafeCheckbox) {
      seizureSafeCheckbox.addEventListener('change', async (e) => {
        const value = (e.target as HTMLInputElement).checked;
        
        // Show warning dialog when enabling/disabling
        const confirmed = await this.showSeizureSafeWarning(value);
        
        if (confirmed) {
          if (this.onSeizureSafeChange) {
            this.onSeizureSafeChange(value);
          }
        } else {
          // User cancelled - revert checkbox
          seizureSafeCheckbox.checked = !value;
        }
      });
    }

    // Font family selector
    const fontFamilySelect = document.getElementById('font-family') as HTMLSelectElement;
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (this.onFontFamilyChange) {
          this.onFontFamilyChange(value);
        }
      });
    }

    // Font text input
    const fontTextInput = document.getElementById('font-text') as HTMLInputElement;
    if (fontTextInput) {
      // Use input event for real-time updates, but debounce it
      let textTimeout: number | null = null;
      fontTextInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        if (textTimeout) {
          clearTimeout(textTimeout);
        }
        textTimeout = window.setTimeout(() => {
          if (this.onFontTextChange) {
            this.onFontTextChange(value);
          }
        }, 300); // Debounce by 300ms
      });
    }

    // Add double-click to reset functionality for all knobs
    const defaultValues: { [key: number]: number } = {
      1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0,
      6: 0.0, // Rotation: 0°
      7: 0.5, // Zoom: 1.0x
      8: 0.5, // Speed: 1.0x
      9: 0.5, // X Position: center (0px)
      10: 0.5 // Y Position: center (0px)
    };

    // Double-click handlers for all knobs
    for (let i = 1; i <= 10; i++) {
      const slider = document.getElementById(`knob${i}`) as HTMLInputElement;
      if (slider) {
        let clickCount = 0;
        let clickTimer: number | null = null;
        
        slider.addEventListener('click', () => {
          clickCount++;
          if (clickTimer) {
            clearTimeout(clickTimer);
          }
          
          clickTimer = window.setTimeout(() => {
            clickCount = 0;
          }, 300);
          
          if (clickCount === 2) {
            // Double-click detected - reset to default
            const defaultValue = defaultValues[i];
            slider.value = defaultValue.toString();
            
            // Trigger input event to update display and callbacks
            const inputEvent = new Event('input', { bubbles: true });
            slider.dispatchEvent(inputEvent);
            
            clickCount = 0;
            if (clickTimer) {
              clearTimeout(clickTimer);
              clickTimer = null;
            }
          }
        });
      }
    }

    // Reset All button (main settings)
    const resetAllBtn = document.getElementById('reset-all-btn');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        if (this.onResetAllToDefault) {
          this.onResetAllToDefault();
        }
      });
    }

    // Reset All Effects button (Quick Effects section)
    const resetAllEffectsBtn = document.getElementById('reset-all-effects');
    if (resetAllEffectsBtn) {
      resetAllEffectsBtn.addEventListener('click', () => {
        if (this.onResetAllEffectsToDefault) {
          this.onResetAllEffectsToDefault();
        }
      });
    }

    // Reset button handlers
    document.querySelectorAll('.reset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const knobNum = parseInt((btn as HTMLElement).dataset.knob || '0');
        if (knobNum > 0 && knobNum <= 10) {
          const slider = document.getElementById(`knob${knobNum}`) as HTMLInputElement;
          if (slider) {
            const defaultValue = defaultValues[knobNum];
            slider.value = defaultValue.toString();
            
            // Trigger input event to update display and callbacks
            const inputEvent = new Event('input', { bubbles: true });
            slider.dispatchEvent(inputEvent);
          }
        }
      });
    });

    // Lock button event listeners (for knobs 1-5)
    document.querySelectorAll('.lock-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const knobNum = parseInt((btn as HTMLElement).dataset.knob || '0');
        if (knobNum >= 1 && knobNum <= 5) {
          const lockBtn = btn as HTMLButtonElement;
          const isLocked = lockBtn.textContent === '🔒';
          const newLocked = !isLocked;
          
          // Update button appearance
          lockBtn.textContent = newLocked ? '🔒' : '🔓';
          lockBtn.style.opacity = newLocked ? '1.0' : '0.6';
          lockBtn.style.color = newLocked ? '#ffaa00' : '#aaa';
          lockBtn.title = newLocked ? 'Unlock knob (allow random changes)' : 'Lock knob (prevents random changes)';
          
          // Call callback
          if (this.onKnobLockToggle) {
            this.onKnobLockToggle(knobNum, newLocked);
          }
        }
      });
    });

    // Effect reset button handlers
    document.querySelectorAll('.effect-reset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const effectName = (btn as HTMLElement).dataset.effect;
        if (effectName && this.onEffectResetToDefault) {
          this.onEffectResetToDefault(effectName);
        }
      });
    });
  }

  updateModeName(name: string) {
    const modeNameEl = document.getElementById('mode-name');
    if (modeNameEl) {
      modeNameEl.textContent = name;
    }
  }

  /**
   * Set a knob value programmatically (e.g., from touch gestures)
   */
  setKnobValue(knob: number, value: number) {
    const slider = document.getElementById(`knob${knob}`) as HTMLInputElement;
    const valueEl = document.getElementById(`knob${knob}-value`);
    
    if (slider) {
      slider.value = value.toString();
    }
    if (valueEl) {
      valueEl.textContent = value.toFixed(2);
    }
  }

  updateFPS(fps: number) {
    const fpsEl = document.getElementById('fps');
    if (fpsEl) {
      fpsEl.textContent = fps.toString();
    }
  }

  updateTargetFPS(targetFPS: number) {
    const targetFPSSlider = document.getElementById('target-fps') as HTMLInputElement;
    const targetFPSValue = document.getElementById('target-fps-value');
    if (targetFPSSlider) {
      targetFPSSlider.value = targetFPS.toString();
    }
    if (targetFPSValue) {
      targetFPSValue.textContent = targetFPS.toString();
    }
  }

  updateKnobValue(knob: number, value: number) {
    const slider = document.getElementById(`knob${knob}`) as HTMLInputElement;
    const valueSpan = document.getElementById(`knob${knob}-value`);
    if (slider) {
      slider.value = value.toString();
    }
    if (valueSpan) {
      if (knob === 6) {
        // Rotation: display as degrees
        const degrees = Math.round(value * 360);
        valueSpan.textContent = `${degrees}°`;
      } else if (knob === 7) {
        // Zoom: display as zoom level
        let zoomLevel: number;
        if (value <= 0.5) {
          const t = value / 0.5;
          zoomLevel = 0.1 + (t * 0.9); // 0.1x to 1.0x
        } else {
          const t = (value - 0.5) / 0.5;
          zoomLevel = 1.0 + (t * 4.0); // 1.0x to 5.0x
        }
        valueSpan.textContent = `${zoomLevel.toFixed(2)}x`;
      } else if (knob === 8) {
        // Speed: display as speed multiplier
        let speedLevel: number;
        if (value <= 0.5) {
          const t = value / 0.5;
          speedLevel = 0.1 + (t * 0.9);
        } else {
          const t = (value - 0.5) / 0.5;
          speedLevel = 1.0 + (t * 2.0);
        }
        valueSpan.textContent = `${speedLevel.toFixed(2)}x`;
      } else if (knob === 9) {
        // X Position: display as pixel offset
        // Get canvas dimensions for accurate display
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        const maxOffset = canvas ? canvas.width * 0.5 : 640; // 50% of canvas width
        const offset = (value - 0.5) * 2; // -1.0 to +1.0
        const pixelOffset = Math.round(offset * maxOffset);
        valueSpan.textContent = `${pixelOffset >= 0 ? '+' : ''}${pixelOffset}px`;
      } else if (knob === 10) {
        // Y Position: display as pixel offset
        // Get canvas dimensions for accurate display
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        const maxOffset = canvas ? canvas.height * 0.5 : 480; // 50% of canvas height
        const offset = (value - 0.5) * 2; // -1.0 to +1.0
        const pixelOffset = Math.round(offset * maxOffset);
        valueSpan.textContent = `${pixelOffset >= 0 ? '+' : ''}${pixelOffset}px`;
      } else {
        valueSpan.textContent = value.toFixed(2);
      }
    }
  }

  updateKnobValues() {
    // Update all knobs 1-8
    for (let i = 1; i <= 8; i++) {
      const slider = document.getElementById(`knob${i}`) as HTMLInputElement;
      if (slider) {
        const value = parseFloat(slider.value);
        this.updateKnobValue(i, value);
      }
    }
  }

  updateKnobLock(knob: number, locked: boolean) {
    const lockBtn = document.getElementById(`lock-btn-${knob}`) as HTMLButtonElement;
    if (lockBtn) {
      lockBtn.textContent = locked ? '🔒' : '🔓';
      lockBtn.style.opacity = locked ? '1.0' : '0.6';
      lockBtn.style.color = locked ? '#ffaa00' : '#aaa';
      lockBtn.title = locked ? 'Unlock knob (allow random changes)' : 'Lock knob (prevents random changes)';
    }
  }

  updateMicGain(gain: number) {
    const slider = document.getElementById('mic-gain') as HTMLInputElement;
    const valueSpan = document.getElementById('mic-gain-value');
    if (slider) {
      slider.value = gain.toString();
    }
    if (valueSpan) {
      valueSpan.textContent = gain.toFixed(2);
    }
  }

  setMicGainEnabled(enabled: boolean) {
    const slider = document.getElementById('mic-gain') as HTMLInputElement;
    const section = document.getElementById('mic-gain-section');
    const levelContainer = document.getElementById('mic-level-container');
    const label = slider?.parentElement?.querySelector('label');
    
    // Always show the mic gain slider - it should be visible even when mic is off
    // User can adjust it before enabling the mic
    if (slider) {
      slider.disabled = !enabled;
      // Visual feedback: slightly dim when disabled, but still visible
      slider.style.opacity = enabled ? '1' : '0.7';
      slider.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
    
    // Dim the label slightly when disabled
    if (label) {
      label.style.opacity = enabled ? '1' : '0.7';
    }
    
    // Show/hide the level indicator only when mic is enabled
    // Use both display and visibility to ensure it's properly shown
    if (levelContainer) {
      if (enabled) {
        levelContainer.style.display = 'block';
        levelContainer.style.visibility = 'visible';
      } else {
        levelContainer.style.display = 'none';
        levelContainer.style.visibility = 'hidden';
      }
    }
    
    // Keep section visible but slightly dimmed when disabled
    if (section) {
      section.style.opacity = enabled ? '1' : '0.8';
      section.style.pointerEvents = enabled ? 'auto' : 'auto'; // Still allow interaction
    }
  }

  updateLeftHanded(value: boolean) {
    const leftHandedCheckbox = document.getElementById('left-handed') as HTMLInputElement;
    if (leftHandedCheckbox) {
      leftHandedCheckbox.checked = value;
    }
  }

  showFontSettings(show: boolean) {
    const fontSection = document.getElementById('font-section');
    if (fontSection) {
      fontSection.style.display = show ? 'block' : 'none';
    }
  }

  updateFontSettings(fontFamily: string, fontText: string) {
    const fontFamilySelect = document.getElementById('font-family') as HTMLSelectElement;
    const fontTextInput = document.getElementById('font-text') as HTMLInputElement;
    
    if (fontFamilySelect && fontFamily) {
      fontFamilySelect.value = fontFamily;
    }
    
    if (fontTextInput) {
      fontTextInput.value = fontText || '';
    }
  }

  /**
   * Show warning dialog for seizure-safe mode toggle
   */
  private showSeizureSafeWarning(enabling: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: #2a2a2a;
        border: 2px solid #4a4a4a;
        border-radius: 8px;
        padding: 2rem;
        max-width: 500px;
        color: #ccc;
      `;
      
      const title = document.createElement('div');
      title.style.cssText = 'font-size: 1.2rem; font-weight: bold; color: #fff; margin-bottom: 1rem;';
      title.textContent = enabling 
        ? '⚠️ Enable Seizure-Safe Mode?' 
        : '⚠️ Disable Seizure-Safe Mode?';
      
      const message = document.createElement('div');
      message.style.cssText = 'font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; color: #aaa;';
      message.innerHTML = enabling
        ? `Seizure-Safe Mode will:<br>
           • Limit flashing to ≤3 flashes per second (WCAG 2.3.1)<br>
           • Prevent rapid red flashes<br>
           • Cap animation speed at 50%<br>
           • Reduce brightness and contrast<br><br>
           <strong style="color: #ffaa00;">This mode may reduce visual quality but helps prevent photosensitive epilepsy triggers.</strong>`
        : `Disabling Seizure-Safe Mode will restore full visual effects, which may include:<br>
           • Rapid flashing (>3 flashes/second)<br>
           • Intense red flashes<br>
           • Full-speed animations<br>
           • High contrast effects<br><br>
           <strong style="color: #ffaa00;">This may trigger photosensitive epilepsy in sensitive individuals.</strong>`;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 1rem; justify-content: flex-end;';
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        padding: 0.5rem 1.5rem;
        background: #3a3a3a;
        border: 1px solid #4a4a4a;
        color: #ccc;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
      `;
      cancelBtn.onmouseover = () => cancelBtn.style.background = '#4a4a4a';
      cancelBtn.onmouseout = () => cancelBtn.style.background = '#3a3a3a';
      cancelBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(false);
      };
      
      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = enabling ? 'Enable' : 'Disable';
      confirmBtn.style.cssText = `
        padding: 0.5rem 1.5rem;
        background: ${enabling ? '#4a7c59' : '#7c4a4a'};
        border: 1px solid ${enabling ? '#5a8c69' : '#8c5a5a'};
        color: #fff;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: bold;
      `;
      confirmBtn.onmouseover = () => confirmBtn.style.background = enabling ? '#5a8c69' : '#8c5a5a';
      confirmBtn.onmouseout = () => confirmBtn.style.background = enabling ? '#4a7c59' : '#7c4a4a';
      confirmBtn.onclick = () => {
        document.body.removeChild(dialog);
        resolve(true);
      };
      
      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(confirmBtn);
      
      content.appendChild(title);
      content.appendChild(message);
      content.appendChild(buttonContainer);
      dialog.appendChild(content);
      document.body.appendChild(dialog);
      
      // Close on escape key
      const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.body.removeChild(dialog);
          document.removeEventListener('keydown', escapeHandler);
          resolve(false);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    });
  }

  /**
   * Update seizure-safe mode warning based on current mode's risk level
   */
  updateSeizureSafeWarning(modeRisk?: 'low' | 'medium' | 'high') {
    const warning = document.getElementById('seizure-safe-warning');
    if (warning) {
      if (modeRisk === 'high' || modeRisk === 'medium') {
        warning.style.display = 'block';
        warning.textContent = modeRisk === 'high' 
          ? '⚠️ WARNING: This mode may contain rapid flashing or intense visual effects'
          : '⚠️ This mode may contain some flashing or intense visual effects';
      } else {
        warning.style.display = 'none';
      }
    }
  }

  /**
   * Update seizure-safe mode checkbox state
   */
  updateSeizureSafeMode(enabled: boolean) {
    const checkbox = document.getElementById('seizure-safe') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = enabled;
    }
  }

  /**
   * Update knob descriptions for the current mode
   */
  updateKnobDescriptions(descriptions?: { knob1?: string; knob2?: string; knob3?: string; knob4?: string; knob5?: string }): void {
    // Update knob labels
    const knob1Label = document.getElementById('knob1-label');
    const knob2Label = document.getElementById('knob2-label');
    const knob3Label = document.getElementById('knob3-label');
    
    // Update labels - use parameter name directly, remove "Knob" prefix
    if (knob1Label) {
      knob1Label.textContent = descriptions?.knob1 || 'Parameter 1';
    }
    if (knob2Label) {
      knob2Label.textContent = descriptions?.knob2 || 'Parameter 2';
    }
    if (knob3Label) {
      knob3Label.textContent = descriptions?.knob3 || 'Parameter 3';
    }
    
    // Update knob descriptions (show full description below if available)
    const knob1Desc = document.getElementById('knob1-description');
    const knob2Desc = document.getElementById('knob2-description');
    const knob3Desc = document.getElementById('knob3-description');
    
    // Hide description area since parameter name is now in the label
    if (knob1Desc) {
      knob1Desc.textContent = '';
    }
    if (knob2Desc) {
      knob2Desc.textContent = '';
    }
    if (knob3Desc) {
      knob3Desc.textContent = '';
    }
  }

  updateTransitionSettings(enabled: boolean, duration: number, type: string | null) {
    const enabledCheckbox = document.getElementById('transition-enabled') as HTMLInputElement;
    const durationSlider = document.getElementById('transition-duration') as HTMLInputElement;
    const durationValue = document.getElementById('transition-duration-value');
    const typeSelect = document.getElementById('transition-type') as HTMLSelectElement;
    const typeDisplay = document.getElementById('transition-type-display');
    const controlsContainer = document.getElementById('transition-controls-container');

    if (enabledCheckbox) {
      enabledCheckbox.checked = enabled;
    }
    if (durationSlider && durationValue) {
      durationSlider.value = duration.toString();
      durationValue.textContent = duration.toFixed(2);
    }
    if (typeSelect && typeDisplay) {
      const typeValue = type || 'auto';
      typeSelect.value = typeValue;
      const displayText = typeValue === 'auto' ? 'Auto' : typeSelect.options[typeSelect.selectedIndex].text;
      typeDisplay.textContent = displayText;
    }
    if (controlsContainer) {
      controlsContainer.style.opacity = enabled ? '1' : '0.5';
      const inputs = controlsContainer.querySelectorAll('input, select');
      inputs.forEach((input: any) => {
        input.disabled = !enabled;
      });
    }
  }

  updatePortraitRotateVisibility(isMobile: boolean) {
    const container = document.getElementById('portrait-rotate-container');
    if (container) {
      container.style.display = isMobile ? 'block' : 'none';
    }
  }

  updateCheckboxSetting(id: string, checked: boolean) {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = checked;
      // Trigger change event to update UI state
      const event = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(event);
    }
  }

  updateAutoClear(enabled: boolean) {
    const autoClearBtn = document.getElementById('auto-clear-btn');
    const autoClearIcon = document.getElementById('auto-clear-icon');
    const autoClearText = document.getElementById('auto-clear-text');
    
    if (autoClearBtn) {
      if (enabled) {
        autoClearBtn.classList.add('active');
        autoClearBtn.style.background = '#4a9eff';
        if (autoClearIcon) autoClearIcon.textContent = '🔄';
        if (autoClearText) autoClearText.textContent = 'Auto Clear';
      } else {
        autoClearBtn.classList.remove('active');
        autoClearBtn.style.background = '#666';
        if (autoClearIcon) autoClearIcon.textContent = '🎨';
        if (autoClearText) autoClearText.textContent = 'Paint';
      }
    }
  }

  setAutoClearEnabled(enabled: boolean) {
    const autoClearBtn = document.getElementById('auto-clear-btn');
    if (autoClearBtn) {
      if (enabled) {
        autoClearBtn.removeAttribute('disabled');
        autoClearBtn.style.opacity = '1';
        autoClearBtn.style.cursor = 'pointer';
        autoClearBtn.title = '';
      } else {
        autoClearBtn.setAttribute('disabled', 'true');
        autoClearBtn.style.opacity = '0.5';
        autoClearBtn.style.cursor = 'not-allowed';
        autoClearBtn.title = 'Paint Mode is not supported for 3D modes';
      }
    }
  }

  updateFrequencySlider(id: string, value: number) {
    const slider = document.getElementById(id) as HTMLInputElement;
    const valueSpan = document.getElementById(`${id}-value`);
    if (slider) {
      slider.value = value.toString();
    }
    if (valueSpan) {
      valueSpan.textContent = value.toFixed(2);
    }
  }

  updateMicLevel(level: number) {
    // level is 0.0 to 1.0
    const percentage = Math.round(level * 100);
    const levelBar = document.getElementById('mic-level-bar');
    const levelValue = document.getElementById('mic-level-value');
    const levelContainer = document.getElementById('mic-level-container');
    
    // Ensure the container is visible when updating (in case it was hidden)
    if (levelContainer) {
      levelContainer.style.display = 'block';
      levelContainer.style.visibility = 'visible';
    }
    
    if (levelBar) {
      levelBar.style.width = `${percentage}%`;
      
      // Change color based on level (green for good, yellow for high, red for clipping)
      if (percentage < 50) {
        levelBar.style.background = 'linear-gradient(to right, #4a9eff, #00ff88)';
      } else if (percentage < 80) {
        levelBar.style.background = 'linear-gradient(to right, #4a9eff, #ffd700)';
      } else {
        levelBar.style.background = 'linear-gradient(to right, #4a9eff, #ff4444)';
      }
    }
    
    if (levelValue) {
      levelValue.textContent = `${percentage}%`;
      
      // Change text color based on level
      if (percentage < 50) {
        levelValue.style.color = '#4a9eff';
      } else if (percentage < 80) {
        levelValue.style.color = '#ffd700';
      } else {
        levelValue.style.color = '#ff4444';
      }
    }
  }

  updateRandomTriggerActivity(isTriggering: boolean, timeSinceLastTrigger: number = 0) {
    // Update the visual indicator when random trigger fires
    const levelBar = document.getElementById('random-trigger-level-bar');
    const levelValue = document.getElementById('random-trigger-level-value');
    const levelContainer = document.getElementById('random-trigger-level-container');
    const randomTriggerCheckbox = document.getElementById('random-trigger') as HTMLInputElement;
    
    // Only show the container if random trigger is actually enabled
    const isEnabled = randomTriggerCheckbox?.checked ?? false;
    if (levelContainer) {
      if (isEnabled) {
        levelContainer.style.display = 'block';
        levelContainer.style.visibility = 'visible';
      } else {
        levelContainer.style.display = 'none';
        return; // Don't update values if disabled
      }
    }
    
    if (isTriggering) {
      // Trigger just fired - show full bar
      if (levelBar) {
        levelBar.style.width = '100%';
        levelBar.style.background = 'linear-gradient(to right, #ff6b6b, #ffd93d)';
      }
      if (levelValue) {
        levelValue.textContent = 'TRIGGER';
        levelValue.style.color = '#ffd93d';
      }
    } else {
      // Fade out based on time since last trigger
      // Fade over 0.5 seconds
      const fadeTime = 0.5;
      const fadeProgress = Math.min(1.0, timeSinceLastTrigger / fadeTime);
      const percentage = Math.round((1.0 - fadeProgress) * 100);
      
      if (levelBar) {
        levelBar.style.width = `${percentage}%`;
        // Change color as it fades
        if (percentage > 50) {
          levelBar.style.background = 'linear-gradient(to right, #ff6b6b, #ffd93d)';
        } else if (percentage > 20) {
          levelBar.style.background = 'linear-gradient(to right, #ff6b6b, #ff8c8c)';
        } else {
          levelBar.style.background = 'linear-gradient(to right, #ff6b6b, #ff6b6b)';
        }
      }
      if (levelValue) {
        if (percentage > 0) {
          levelValue.textContent = `${percentage}%`;
          levelValue.style.color = percentage > 50 ? '#ffd93d' : '#ff8c8c';
        } else {
          levelValue.textContent = 'OFF';
          levelValue.style.color = '#888';
        }
      }
    }
  }

  updateMockAudioLevel(level: number) {
    // level is 0.0 to 1.0
    const percentage = Math.round(level * 100);
    const levelBar = document.getElementById('mock-audio-level-bar');
    const levelValue = document.getElementById('mock-audio-level-value');
    const levelContainer = document.getElementById('mock-audio-level-container');
    const mockAudioCheckbox = document.getElementById('mock-audio') as HTMLInputElement;
    
    // Only show the container if mock audio is actually enabled
    const isEnabled = mockAudioCheckbox?.checked ?? false;
    if (levelContainer) {
      if (isEnabled) {
        levelContainer.style.display = 'block';
        levelContainer.style.visibility = 'visible';
      } else {
        levelContainer.style.display = 'none';
        return; // Don't update values if disabled
      }
    }
    
    if (levelBar) {
      levelBar.style.width = `${percentage}%`;
      
      // Change color based on level (green for good, yellow for high, red for clipping)
      if (percentage < 50) {
        levelBar.style.background = 'linear-gradient(to right, #4a9eff, #00ff88)';
      } else if (percentage < 80) {
        levelBar.style.background = 'linear-gradient(to right, #4a9eff, #ffd700)';
      } else {
        levelBar.style.background = 'linear-gradient(to right, #4a9eff, #ff4444)';
      }
    }
    
    if (levelValue) {
      levelValue.textContent = `${percentage}%`;
      
      // Change text color based on level
      if (percentage < 50) {
        levelValue.style.color = '#4a9eff';
      } else if (percentage < 80) {
        levelValue.style.color = '#ffd700';
      } else {
        levelValue.style.color = '#ff4444';
      }
    }
  }

  /**
   * Update random trigger checkbox state
   */
  updateRandomTriggerEnabled(enabled: boolean) {
    const checkbox = document.getElementById('random-trigger') as HTMLInputElement;
    const freqContainer = document.getElementById('random-trigger-frequency-container');
    const levelContainer = document.getElementById('random-trigger-level-container');
    if (checkbox) {
      checkbox.checked = enabled;
    }
    if (freqContainer) {
      freqContainer.style.display = enabled ? 'block' : 'none';
    }
    if (levelContainer) {
      levelContainer.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Update random trigger frequency slider
   */
  updateRandomTriggerFrequency(frequency: number) {
    this.updateFrequencySlider('random-trigger-frequency', frequency);
  }

  updateMockAudioEnabled(enabled: boolean) {
    const checkbox = document.getElementById('mock-audio') as HTMLInputElement;
    const freqContainer = document.getElementById('mock-audio-frequency-container');
    const levelContainer = document.getElementById('mock-audio-level-container');
    if (checkbox) {
      checkbox.checked = enabled;
    }
    if (freqContainer) {
      freqContainer.style.display = enabled ? 'block' : 'none';
    }
    if (levelContainer) {
      levelContainer.style.display = enabled ? 'block' : 'none';
    }
  }

  updateMockAudioFrequency(frequency: number) {
    this.updateFrequencySlider('mock-audio-frequency', frequency);
  }

  updateMockAudioIntensityRandomness(randomness: number) {
    this.updateFrequencySlider('mock-audio-intensity-randomness', randomness);
  }

  /**
   * Update random sequence checkbox state
   */
  updateRandomSequenceEnabled(enabled: boolean) {
    const checkbox = document.getElementById('random-sequence') as HTMLInputElement;
    const freqContainer = document.getElementById('random-sequence-frequency-container');
    if (checkbox) {
      checkbox.checked = enabled;
    }
    if (freqContainer) {
      freqContainer.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Update random sequence frequency slider
   */
  updateRandomSequenceFrequency(frequency: number) {
    this.updateFrequencySlider('random-sequence-frequency', frequency);
  }

  /**
   * Update random color checkbox state
   */
  updateRandomColorEnabled(enabled: boolean) {
    const checkbox = document.getElementById('random-color') as HTMLInputElement;
    const freqContainer = document.getElementById('random-color-frequency-container');
    if (checkbox) {
      checkbox.checked = enabled;
    }
    if (freqContainer) {
      freqContainer.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Update random color frequency slider
   */
  updateRandomColorFrequency(frequency: number) {
    this.updateFrequencySlider('random-color-frequency', frequency);
  }

  /**
   * Update microphone gain slider
   */
  updateMicrophoneGain(gain: number) {
    const slider = document.getElementById('mic-gain') as HTMLInputElement;
    const valueSpan = document.getElementById('mic-gain-value');
    if (slider) {
      slider.value = gain.toString();
    }
    if (valueSpan) {
      valueSpan.textContent = gain.toFixed(2);
    }
  }

  /**
   * Update use microphone button state
   */
  updateUseMicrophone(enabled: boolean) {
    const micBtn = document.getElementById('mic-btn');
    const micIcon = document.getElementById('mic-icon');
    const micText = document.getElementById('mic-text');
    
    if (micBtn) {
      micBtn.style.background = enabled ? '#4a9eff' : '#666';
    }
    if (micIcon) {
      micIcon.textContent = enabled ? '🎤' : '🎤';
    }
    if (micText) {
      micText.textContent = enabled ? 'Disable Mic' : 'Enable Mic';
    }
  }
}

