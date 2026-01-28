/**
 * UI setup - button setup and event handlers
 */
import { MobileUI } from '../../ui/MobileUI';
import { ModeInfo } from '../../ui/ModeSelector';
import { ModeBrowser } from '../../ui/ModeBrowser';
import { Controls } from '../../ui/Controls';
import { EYESYImpl } from '../../core/EYESY';
import { Canvas } from '../../core/Canvas';
import { RewindManager } from '../../core/RewindManager';
import { WebcamService } from '../../core/WebcamService';
import { WebcamCompositor } from '../../core/webcam/WebcamCompositor';
import { modes } from '../../modes/index';

export interface UISetupContext {
  // State getters
  getIsPaused(): boolean;
  getWasManuallyPaused(): boolean;
  getUseMicrophone(): boolean;
  getMicrophoneAudio(): any; // MicrophoneAudio
  getWebcamService(): WebcamService;
  getWebcamCompositor(): WebcamCompositor | null;
  getWebcamPermissionGranted(): boolean;
  getHasUploadedImages(): boolean;
  getCurrentModeIndex(): number;
  getSortedModes(): ModeInfo[];
  getNavigationModes(): ModeInfo[];
  getEyesy(): EYESYImpl;
  getCanvas(): HTMLCanvasElement;
  getCanvasWrapper(): Canvas;
  getControls(): Controls;
  getModeBrowser(): ModeBrowser | null;
  getRewindManager(): RewindManager;
  getLastFrameTime(): number;
  getUploadedImages(): HTMLImageElement[];
  
  // State setters
  setIsPaused(paused: boolean): void;
  setWasManuallyPaused(manual: boolean): void;
  setUseMicrophone(use: boolean): void;
  setHasUploadedImages(has: boolean): void;
  setCurrentModeIndex(index: number): void;
  setLastFrameTime(time: number): void;
  setUploadedImages(images: HTMLImageElement[]): void;
  setMobileUI(ui: MobileUI | null): void;
  
  // Methods
  updateStatus(message: string): void;
  updatePauseButton(): void;
  navigateMode(direction: 1 | -1): void;
  loadMode(modeInfo: ModeInfo): Promise<void>;
  updateModeSelector(): void;
  updateRewindUI(): void;
  debouncedSaveSettings(): void;
  toggleCurrentModeFavorite(): void;
  updateWebcamButtonState(): void;
}

export class UISetup {
  private context: UISetupContext;

  constructor(context: UISetupContext) {
    this.context = context;
  }

  setupPauseButton(): void {
    const pauseBtn = document.getElementById('pause-btn');
    const pauseIcon = document.getElementById('pause-icon');
    const pauseText = document.getElementById('pause-text');
    
    if (!pauseBtn || !pauseIcon || !pauseText) {
      console.warn('Pause button elements not found', { pauseBtn, pauseIcon, pauseText });
      return;
    }
    
    pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePause();
    });
    
    // Update button state
    this.context.updatePauseButton();
  }
  
  setupScreenshotButton(): void {
    const screenshotBtn = document.getElementById('screenshot-btn');
    
    if (!screenshotBtn) {
      console.warn('Screenshot button not found');
      return;
    }
    
    screenshotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.captureScreenshot();
    });
  }
  
  captureScreenshot(): void {
    try {
      const ctx = this.context;
      // Capture the current canvas as a data URL
      const dataURL = ctx.getCanvasWrapper().captureScreenshot();
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `eyesy-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const modeName = ctx.getSortedModes()[ctx.getCurrentModeIndex()]?.name || 'Unknown';
      ctx.updateStatus(`Screenshot saved: ${modeName}`);
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      this.context.updateStatus('Error capturing screenshot');
    }
  }
  
  togglePause(): void {
    const ctx = this.context;
    const wasPaused = ctx.getIsPaused();
    ctx.setIsPaused(!wasPaused);
    // Track manual pause state: true if user manually paused, false if user manually resumed
    ctx.setWasManuallyPaused(ctx.getIsPaused());
    
    ctx.updatePauseButton();
    
    if (ctx.getIsPaused()) {
      ctx.updateStatus('Animation paused');
    } else {
      ctx.updateStatus('Animation resumed');
      // Reset last frame time to avoid large delta jump
      ctx.setLastFrameTime(performance.now());
    }
  }
  
  setupMicrophoneButton(): void {
    const ctx = this.context;
    const micBtn = document.querySelector('#mic-btn') as HTMLElement;
    const micIcon = document.querySelector('#mic-icon') as HTMLElement;
    const micText = document.querySelector('#mic-text') as HTMLElement;

    micBtn.addEventListener('click', async () => {
      try {
        if (ctx.getUseMicrophone() && ctx.getMicrophoneAudio().active) {
          // Stop microphone
          ctx.getMicrophoneAudio().stop();
          ctx.setUseMicrophone(false);
          micBtn.style.background = '#666';
          micIcon.textContent = '🎤';
          micText.textContent = 'Enable Mic';
          // Disable mic gain slider
          ctx.getControls().setMicGainEnabled(false);
          ctx.updateStatus('Microphone disabled');
          ctx.debouncedSaveSettings();
          
          // Update mode selector to disable scope modes
          ctx.updateModeSelector();
          
          // If current mode is a scope mode, switch to first enabled non-scope mode
          const currentMode = ctx.getSortedModes()[ctx.getCurrentModeIndex()];
          if (currentMode && currentMode.category === 'scopes') {
            const modesToUse = ctx.getNavigationModes().length > 0 ? ctx.getNavigationModes() : ctx.getSortedModes();
            const firstEnabledIndex = modesToUse.findIndex(m => !m.disabled);
            if (firstEnabledIndex >= 0) {
              ctx.setCurrentModeIndex(firstEnabledIndex);
              await ctx.loadMode(modesToUse[firstEnabledIndex]);
            }
          }
        } else {
          // Start microphone
          await ctx.getMicrophoneAudio().start();
          ctx.setUseMicrophone(true);
          micBtn.style.background = '#e74c3c';
          micIcon.textContent = '🔴';
          micText.textContent = 'Disable Mic';
          // Enable mic gain slider and set initial value
          ctx.getControls().setMicGainEnabled(true);
          ctx.getControls().updateMicGain(ctx.getMicrophoneAudio().getGain());
          // Update checkbox to match
          ctx.getControls().updateMicrophoneEnabled(true);
          ctx.updateStatus('Microphone enabled - speak or make noise!');
          ctx.debouncedSaveSettings();
          
          // Update mode selector to enable scope modes
          ctx.updateModeSelector();
        }
      } catch (error) {
        console.error('Microphone error:', error);
        ctx.updateStatus('Microphone access denied. Please allow microphone access.');
        ctx.setUseMicrophone(false);
        micBtn.style.background = '#666';
        micIcon.textContent = '🎤';
        micText.textContent = 'Enable Mic';
        // Disable mic gain slider
        ctx.getControls().setMicGainEnabled(false);
        // Update checkbox to match
        ctx.getControls().updateMicrophoneEnabled(false);
        ctx.debouncedSaveSettings();
        
        // Update mode selector to disable scope modes
        ctx.updateModeSelector();
        
        // If current mode is a scope mode, switch to first enabled non-scope mode
        const currentMode = ctx.getSortedModes()[ctx.getCurrentModeIndex()];
        if (currentMode && currentMode.category === 'scopes') {
          const modesToUse = ctx.getNavigationModes().length > 0 ? ctx.getNavigationModes() : ctx.getSortedModes();
          const firstEnabledIndex = modesToUse.findIndex(m => !m.disabled);
          if (firstEnabledIndex >= 0) {
            ctx.setCurrentModeIndex(firstEnabledIndex);
            await ctx.loadMode(modesToUse[firstEnabledIndex]);
          }
        }
      }
    });
  }

  setupWebcamButton(): void {
    const ctx = this.context;
    const webcamBtn = document.querySelector('#webcam-btn') as HTMLElement;
    if (!webcamBtn) return;

    // Initial state
    ctx.updateWebcamButtonState();

    // Update button state periodically to stay in sync
    setInterval(() => {
      ctx.updateWebcamButtonState();
    }, 100); // Check every 100ms

    webcamBtn.addEventListener('click', async () => {
      try {
        const isCurrentlyActive = ctx.getWebcamService().getActive();
        const newState = !isCurrentlyActive;
        
        // Toggle checkbox to trigger the same callback (this ensures both stay in sync)
        const checkbox = document.getElementById('webcam-enabled') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = newState;
          // Trigger change event to call the callback
          checkbox.dispatchEvent(new Event('change'));
        } else {
          // Fallback: directly toggle webcam service if checkbox not found
          if (newState) {
            await ctx.getWebcamService().start();
            // Update device list
            const devices = await ctx.getWebcamService().getDevices();
            ctx.getControls().updateWebcamDevices(
              devices.map(d => ({ id: d.deviceId, label: d.label })),
              undefined
            );
            
            // Enable webcam compositor if current mode supports it
            if (ctx.getWebcamCompositor()) {
              const currentModeInfo = ctx.getCurrentModeIndex() >= 0 && ctx.getSortedModes()[ctx.getCurrentModeIndex()]
                ? ctx.getSortedModes()[ctx.getCurrentModeIndex()]
                : null;
              const supportsWebcam = currentModeInfo?.supportsWebcam !== false;
              if (supportsWebcam) {
                ctx.getWebcamCompositor()!.setOptions({ enabled: true });
              }
            }
          } else {
            ctx.getWebcamService().stop();
            if (ctx.getWebcamCompositor()) {
              ctx.getWebcamCompositor()!.setOptions({ enabled: false });
            }
          }
          ctx.updateWebcamButtonState();
          ctx.debouncedSaveSettings();
        }
      } catch (error) {
        console.error('Webcam error:', error);
        ctx.updateStatus('Failed to access webcam');
        ctx.updateWebcamButtonState();
      }
    });
  }

  /**
   * Setup visibility change listener to auto-pause when tab is hidden
   */
  setupVisibilityPause(): void {
    const ctx = this.context;
    // Use Page Visibility API to detect when tab becomes hidden/visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab is now hidden - pause if not already paused
        if (!ctx.getIsPaused()) {
          ctx.setIsPaused(true);
          ctx.setWasManuallyPaused(false); // This is an auto-pause
          ctx.updatePauseButton();
        }
      } else {
        // Tab is now visible - resume only if we auto-paused (not if user manually paused)
        if (ctx.getIsPaused() && !ctx.getWasManuallyPaused()) {
          ctx.setIsPaused(false);
          ctx.updatePauseButton();
          // Reset last frame time to avoid large delta jump
          ctx.setLastFrameTime(performance.now());
        }
      }
    });
  }

  setupImagesButton(): void {
    const ctx = this.context;
    // Use event delegation so this keeps working even when the controls panel re-renders.
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.('#images-btn') as HTMLButtonElement | null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const imageUpload = document.getElementById('image-upload') as HTMLInputElement | null;
      imageUpload?.click();
    });

    document.addEventListener('change', async (e) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.id !== 'image-upload') return;

      const files = (target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      ctx.updateStatus(`Loading ${files.length} image(s)...`);

      const loadPromises: Promise<HTMLImageElement>[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        loadPromises.push(this.loadImageFile(file));
      }

      try {
        const newImages = await Promise.all(loadPromises);
        const uploadedImages = ctx.getUploadedImages();
        uploadedImages.push(...newImages);
        ctx.setUploadedImages(uploadedImages);
        ctx.setHasUploadedImages(uploadedImages.length > 0);

        // Update button
        const imagesBtn = document.getElementById('images-btn') as HTMLButtonElement | null;
        const imagesIcon = document.getElementById('images-icon');
        const imagesText = document.getElementById('images-text');
        if (imagesBtn) imagesBtn.style.background = '#27ae60';
        if (imagesIcon) imagesIcon.textContent = '✅';
        if (imagesText) imagesText.textContent = `Images (${uploadedImages.length})`;
        
        ctx.updateStatus(`Loaded ${newImages.length} image(s). Total: ${uploadedImages.length}`);
        ctx.updateModeSelector();
        ctx.debouncedSaveSettings();
      } catch (error) {
        console.error('Error loading images:', error);
        ctx.updateStatus('Error loading some images. Please try again.');
      }

      // Reset file input
      (target as HTMLInputElement).value = '';
    });
  }

  private loadImageFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Scale down large images to max 1024px
          const maxSize = 1024;
          if (img.width > maxSize || img.height > maxSize) {
            const canvas = document.createElement('canvas');
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const scaledImg = new Image();
              scaledImg.onload = () => resolve(scaledImg);
              scaledImg.onerror = reject;
              scaledImg.src = canvas.toDataURL('image/png');
              return;
            }
          }
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Setup mobile UI components and touch gestures
   */
  setupMobileUI(): void {
    const ctx = this.context;
    const appContainer = document.querySelector('.app-container') as HTMLElement;
    if (!appContainer) return;
    
    const mobileUI = new MobileUI(appContainer, {
      onPrevMode: () => {
        ctx.navigateMode(-1);
      },
      onNextMode: () => {
        ctx.navigateMode(1);
      },
      onTrigger: () => {
        // Single tap trigger (momentary)
        ctx.getEyesy().trig = true;
        setTimeout(() => {
          ctx.getEyesy().trig = false;
        }, 100);
      },
      onToggleTrigger: () => {
        // Long press toggle
        ctx.getEyesy().trig = !ctx.getEyesy().trig;
      },
      onToggleControls: () => {
        // Optional callback when controls panel toggles
      },
      onZoomChange: (delta: number) => {
        // Pinch to zoom
        const newZoom = Math.max(0, Math.min(1, ctx.getEyesy().knob7 + delta));
        ctx.getEyesy().knob7 = newZoom;
        ctx.getCanvasWrapper().setZoom(newZoom);
        ctx.getControls().setKnobValue(7, newZoom);
        ctx.debouncedSaveSettings();
      },
      onRotationChange: (delta: number) => {
        // Two-finger rotate
        const newRotation = (ctx.getEyesy().knob6 + delta + 1) % 1;
        ctx.getEyesy().knob6 = newRotation;
        ctx.getCanvasWrapper().setRotation(newRotation * 360);
        ctx.getControls().setKnobValue(6, newRotation);
        ctx.debouncedSaveSettings();
      },
      onOpenBrowser: () => {
        // Open mode browser when mode name is clicked
        if (ctx.getModeBrowser()) {
          // Set current mode so browser can scroll to it
          if (ctx.getCurrentModeIndex() >= 0 && ctx.getSortedModes()[ctx.getCurrentModeIndex()]) {
            ctx.getModeBrowser()!.setCurrentMode(ctx.getSortedModes()[ctx.getCurrentModeIndex()].id);
          }
          ctx.getModeBrowser()!.toggle();
        }
      },
      onToggleFavorite: () => {
        ctx.toggleCurrentModeFavorite();
      }
    });
    
    ctx.setMobileUI(mobileUI);
    
    // Setup touch gestures on canvas
    mobileUI.setupCanvasTouch(ctx.getCanvas());
    
    // Update mobile UI with current mode name
    if (ctx.getSortedModes().length > 0 && ctx.getCurrentModeIndex() >= 0) {
      mobileUI.setModeName(ctx.getSortedModes()[ctx.getCurrentModeIndex()]?.name || '');
    }
  }

  setupKeyboardNavigation(): void {
    const ctx = this.context;
    // Helper to check if a mode is an image mode
    const isImageMode = (mode: ModeInfo): boolean => {
      const nameLower = mode.name.toLowerCase();
      return nameLower.startsWith('image -') || nameLower.includes('slideshow');
    };

    // Sort modes: non-experimental first, then experimental
    // This will be updated by updateModeSelector, but we need it here for initial setup
    const sortedModes = [...modes].map(mode => {
      if (mode.id === 'u---webcam' && !ctx.getWebcamPermissionGranted()) {
        return { ...mode, disabled: true };
      }
      // Mark image modes as disabled if no images uploaded
      if (isImageMode(mode) && !ctx.getHasUploadedImages()) {
        return { ...mode, disabled: true };
      }
      return mode;
    }).sort((a, b) => {
      if (a.experimental === b.experimental) return 0;
      return a.experimental ? 1 : -1; // Experimental modes go to bottom
    });

    document.addEventListener('keydown', (e) => {
      // Handle spacebar for trigger - allow it even in some inputs
      if (e.key === ' ' || e.key === 'Spacebar') {
        const target = e.target as HTMLElement;
        // Only block spacebar if typing in a text/search input or textarea
        if ((target instanceof HTMLInputElement && (target.type === 'text' || target.type === 'search')) ||
            target instanceof HTMLTextAreaElement ||
            (target.isContentEditable && target.tagName !== 'BODY')) {
          // Allow spacebar to work normally in text inputs
          return;
        }
        // For all other cases, trigger animation (momentary pulse)
        e.preventDefault();
        e.stopPropagation();
        ctx.getEyesy().trig = true; // Set trigger, will be cleared after frame
        return;
      }
      
      // Don't intercept other keys if typing in an input
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || 
          target instanceof HTMLSelectElement || 
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable) {
        return;
      }

      // Use navigationModes for arrow key navigation (simpler ordering)
      const modesToUse = ctx.getNavigationModes().length > 0 ? ctx.getNavigationModes() : ctx.getSortedModes();

      // Helper to find next enabled mode
      const findNextEnabledMode = (startIndex: number, direction: 1 | -1): number => {
        let attempts = 0;
        let index = startIndex;
        while (attempts < modesToUse.length) {
          index = (index + direction + modesToUse.length) % modesToUse.length;
          if (!modesToUse[index].disabled) {
            return index;
          }
          attempts++;
        }
        return startIndex; // Fallback to current if all disabled
      };

      // Arrow keys to navigate modes
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        // Fast forward (if not navigating modes)
        if (e.shiftKey && ctx.getRewindManager().canFastForward()) {
          e.preventDefault();
          ctx.getRewindManager().fastForward(ctx.getEyesy());
          // Update UI controls
          ctx.getControls().updateKnobValue(1, ctx.getEyesy().knob1);
          ctx.getControls().updateKnobValue(2, ctx.getEyesy().knob2);
          ctx.getControls().updateKnobValue(3, ctx.getEyesy().knob3);
          ctx.getControls().updateKnobValue(4, ctx.getEyesy().knob4);
          ctx.getControls().updateKnobValue(5, ctx.getEyesy().knob5);
          if (ctx.getEyesy().knob6 !== undefined) {
            ctx.getControls().updateKnobValue(6, ctx.getEyesy().knob6);
          }
          if (ctx.getEyesy().knob7 !== undefined) {
            ctx.getControls().updateKnobValue(7, ctx.getEyesy().knob7);
          }
          ctx.updateRewindUI();
          return;
        }
        e.preventDefault();
        // Ensure we have modes and currentModeIndex is valid
        if (modesToUse.length === 0) return;
        if (ctx.getCurrentModeIndex() < 0 || ctx.getCurrentModeIndex() >= modesToUse.length) {
          ctx.setCurrentModeIndex(findNextEnabledMode(-1, 1));
        } else {
          ctx.setCurrentModeIndex(findNextEnabledMode(ctx.getCurrentModeIndex(), 1));
        }
        ctx.loadMode(modesToUse[ctx.getCurrentModeIndex()]);
        ctx.updateStatus(`Mode ${ctx.getCurrentModeIndex() + 1}/${modesToUse.length}: ${modesToUse[ctx.getCurrentModeIndex()].name}`);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Ensure we have modes and currentModeIndex is valid
        if (modesToUse.length === 0) return;
        if (ctx.getCurrentModeIndex() < 0 || ctx.getCurrentModeIndex() >= modesToUse.length) {
          ctx.setCurrentModeIndex(findNextEnabledMode(modesToUse.length, -1));
        } else {
          ctx.setCurrentModeIndex(findNextEnabledMode(ctx.getCurrentModeIndex(), -1));
        }
        ctx.loadMode(modesToUse[ctx.getCurrentModeIndex()]);
        ctx.updateStatus(`Mode ${ctx.getCurrentModeIndex() + 1}/${modesToUse.length}: ${modesToUse[ctx.getCurrentModeIndex()].name}`);
      } else if (e.key === 'Home') {
        e.preventDefault();
        ctx.setCurrentModeIndex(findNextEnabledMode(-1, 1));
        ctx.loadMode(ctx.getSortedModes()[ctx.getCurrentModeIndex()]);
        ctx.updateStatus(`Mode ${ctx.getCurrentModeIndex() + 1}/${ctx.getSortedModes().length}: ${ctx.getSortedModes()[ctx.getCurrentModeIndex()].name}`);
      } else if (e.key === 'End') {
        e.preventDefault();
        ctx.setCurrentModeIndex(findNextEnabledMode(ctx.getSortedModes().length, -1));
        ctx.loadMode(ctx.getSortedModes()[ctx.getCurrentModeIndex()]);
        ctx.updateStatus(`Mode ${ctx.getCurrentModeIndex() + 1}/${ctx.getSortedModes().length}: ${ctx.getSortedModes()[ctx.getCurrentModeIndex()].name}`);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        ctx.getModeBrowser()?.toggle();
      } else if (e.key === 'p' || e.key === 'P') {
        // P key for pause/resume
        e.preventDefault();
        this.togglePause();
      } else if (e.key === 's' || e.key === 'S') {
        // S key for screenshot
        e.preventDefault();
        this.captureScreenshot();
      }
      // Note: Spacebar is handled earlier in the function (before other key handlers)
    });
  }
}
