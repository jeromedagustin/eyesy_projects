/**
 * Main EYESY Application
 */
import { EYESYImpl } from './core/EYESY';
import { Canvas } from './core/Canvas';
import { Mode } from './modes/base/Mode';
import { Controls } from './ui/Controls';
import { ModeSelector, ModeInfo } from './ui/ModeSelector';
import { ModeBrowser } from './ui/ModeBrowser';
import { MobileUI } from './ui/MobileUI';
import { TouchManager, requestWakeLock } from './ui/TouchManager';
import { modes } from './modes/index';
import { MicrophoneAudio } from './core/MicrophoneAudio';
import { TransitionManager } from './core/TransitionManager';
import { SettingsStorage, AppSettings } from './core/SettingsStorage';
import { ModeGrouper } from './core/ModeGrouper';
import { SeizureSafetyFilter } from './core/SeizureSafetyFilter';
import { ModeCache } from './core/ModeCache';
import { ImageLoader } from './core/ImageLoader';
import { WebcamService } from './core/WebcamService';
import { WebcamCompositor } from './core/WebcamCompositor';
import * as THREE from 'three';
import { EffectManager } from './core/EffectManager';
import { RewindManager } from './core/RewindManager';
import { 
  BlurEffect, 
  ColorGradingEffect, 
  PixelationEffect, 
  InvertEffect, 
  EdgeDetectionEffect,
  VignetteEffect,
  BloomEffect,
  ChromaticAberrationEffect,
  ScanlinesEffect,
  VHSDistortionEffect,
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
  EchoEffect
} from './core/effects';
import { WebcamService } from './core/WebcamService';
import { EffectManager } from './core/EffectManager';

// Import mobile styles
import './styles/mobile.css';

export class App {
  private canvas: HTMLCanvasElement;
  private canvasContainer: HTMLElement | null = null;
  private canvasWrapper: Canvas;
  private eyesy: EYESYImpl;
  private currentMode: Mode | null = null;
  private controls: Controls;
  private modeSelector: ModeSelector;
  private modeBrowser: ModeBrowser;
  private mobileUI: MobileUI | null = null;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private fps = 0;
  private fpsCounter = 0;
  private fpsTime = 0;
  private isPaused = false;
  private wasManuallyPaused = false; // Track if user manually paused (vs auto-paused by visibility)
  private reversePlaybackEnabled = false; // Simple flag for reverse playback
  private microphoneAudio: MicrophoneAudio;
  private useMicrophone = false;
  private wakeLock: WakeLockSentinel | null = null;
  private webcamPermissionGranted = false;
  private uploadedImages: HTMLImageElement[] = [];
  private hasUploadedImages = false;
  private transitionManager: TransitionManager;
  private previousModeInfo: ModeInfo | null = null;
  private pendingModeInfo: ModeInfo | null = null;
  private pendingMode: Mode | null = null;
  private randomSequenceEnabled = false;
  private randomColorEnabled = false;
  private randomSequenceTime = 0;
  private randomColorTime = 0;
  private randomSequenceFrequency = 0.5; // 0.0 = slow, 1.0 = fast
  private saveSettingsTimeout: number | null = null;
  private randomColorFrequency = 0.5; // 0.0 = slow, 1.0 = fast
  private knob1Locked = false;
  private knob2Locked = false;
  private knob3Locked = false;
  private knob4Locked = false;
  private knob5Locked = false;
  private randomTriggerEnabled = true; // Enabled by default
  private randomTriggerTime = 0;
  private randomTriggerFrequency = 0.5; // 0.0 = slow, 1.0 = fast (default: 0.5 for moderate frequency)
  private lastRandomTriggerTime = 0; // Track when last trigger fired
  private randomTriggerJustFired = false; // Track if trigger just fired this frame
  private mockAudioEnabled = false; // Disabled by default
  private mockAudioFrequency = 0.5; // 0.0 = simple 4/4 beat, 1.0 = random patterns
  private mockAudioIntensityRandomness = 0.0; // 0.0 = consistent intensity, 1.0 = highly random intensity
  private mockAudioTime = 0.0; // Time accumulator for mock audio generation
  private transitionsEnabled = false;
  private transitionDuration = 1.0; // seconds (increased for smoother transitions)
  private transitionType: string | null = null; // null = auto
  private leftHanded = false; // Controls panel on left (true) or right (false, default)
  private portraitRotate = false; // Rotate animation 90° in portrait mode
  private favorites: string[] = []; // Array of favorite mode IDs
  private showOnlyFavorites = false; // Show only favorites in browser/navigation
  private settingsStorage: SettingsStorage;
  private seizureSafetyFilter: SeizureSafetyFilter;
  private modeCache: ModeCache;
  private initializationError: Error | null = null;
  private targetFPS = 60; // Target FPS (1-60, 0 = unlimited)
  private lastFrameTimeForFPS = 0; // Track frame timing for FPS throttling
  private webcamService: WebcamService;
  private webcamCompositor: WebcamCompositor | null = null;
  private effectManager: EffectManager | null = null;
  private webcamEffectManager: EffectManager | null = null;
  private rewindManager: RewindManager;

  constructor() {
    this.settingsStorage = new SettingsStorage();
    
    // Add global error handlers
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      if (!this.initializationError) {
        // Only show error screen if not already showing one
        this.showErrorLoadingScreen(event.error || new Error(event.message || 'Unknown error'));
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (!this.initializationError) {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason || 'Unhandled promise rejection'));
        this.showErrorLoadingScreen(error);
      }
    });
    
    this.initializeApp();
  }

  private async initializeApp() {
    try {
      // Setup UI first (needed for loading screen)
      this.setupUI();
      
      // Show loading screen
      this.showLoadingScreen('Initializing...');
      
      // Initialize settings storage
      await this.settingsStorage.init();
      
      // Initialize mode cache for asset caching
      this.modeCache = new ModeCache();
      await this.modeCache.init();
      
      // Set cache on global ImageLoader instance
      const { setImageLoaderCache } = await import('./core/imageUtils');
      setImageLoaderCache(this.modeCache);
      
      // Initialize webcam service (singleton)
      this.webcamService = WebcamService.getInstance();
      
      // Initialize components (need to be created before loading settings)
      this.microphoneAudio = new MicrophoneAudio(200);
      this.seizureSafetyFilter = new SeizureSafetyFilter();
      this.setupCanvas();
      this.setupEYESY();
      
      // Initialize rewind manager (after canvas is set up)
      this.rewindManager = new RewindManager(60, 2); // 60 frames max, capture every 2nd frame (30fps history at 60fps)
      this.rewindManager.initialize(this.canvas);
      
      // Initialize webcam compositor (after canvas is set up)
      this.webcamCompositor = new WebcamCompositor(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      
      // Initialize effect manager (after canvas is set up)
      this.effectManager = new EffectManager(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      
      // Initialize webcam effect manager (separate from animation effects)
      this.webcamEffectManager = new EffectManager(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      
      // Add popular webcam effects (all disabled by default)
      const webcamBlurEffect = new BlurEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamBlurEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamBlurEffect);
      
      const webcamGrayscaleEffect = new GrayscaleEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamGrayscaleEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamGrayscaleEffect);
      
      const webcamSepiaEffect = new SepiaEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamSepiaEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamSepiaEffect);
      
      const webcamInvertEffect = new InvertEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamInvertEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamInvertEffect);
      
      const webcamPixelationEffect = new PixelationEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamPixelationEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamPixelationEffect);
      
      const webcamVignetteEffect = new VignetteEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamVignetteEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamVignetteEffect);
      
      const webcamBloomEffect = new BloomEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamBloomEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamBloomEffect);
      
      const webcamSharpenEffect = new SharpenEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamSharpenEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamSharpenEffect);
      
      const webcamFisheyeEffect = new FisheyeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamFisheyeEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamFisheyeEffect);
      
      const webcamKaleidoscopeEffect = new KaleidoscopeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamKaleidoscopeEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamKaleidoscopeEffect);
      
      const webcamPosterizeEffect = new PosterizeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamPosterizeEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamPosterizeEffect);
      
      const webcamSaturationEffect = new SaturationEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamSaturationEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamSaturationEffect);
      
      const webcamContrastEffect = new ContrastEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamContrastEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamContrastEffect);
      
      const webcamExposureEffect = new ExposureEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      webcamExposureEffect.enabled = false;
      this.webcamEffectManager.addPostEffect(webcamExposureEffect);
      
      // Set webcam effect manager on compositor
      this.webcamCompositor.setEffectManager(this.webcamEffectManager);

      // Add default effects
      const blurEffect = new BlurEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      blurEffect.enabled = false;
      this.effectManager.addPostEffect(blurEffect);

      const colorGradingEffect = new ColorGradingEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      colorGradingEffect.enabled = false;
      this.effectManager.addPostEffect(colorGradingEffect);

      // Add pixelation effect
      const pixelationEffect = new PixelationEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      pixelationEffect.enabled = false;
      this.effectManager.addPostEffect(pixelationEffect);

      // Add invert effect
      const invertEffect = new InvertEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      invertEffect.enabled = false;
      this.effectManager.addPostEffect(invertEffect);

      // Add edge detection effect
      const edgeDetectionEffect = new EdgeDetectionEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      edgeDetectionEffect.enabled = false;
      this.effectManager.addPostEffect(edgeDetectionEffect);

      // Add vignette effect
      const vignetteEffect = new VignetteEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      vignetteEffect.enabled = false;
      this.effectManager.addPostEffect(vignetteEffect);

      // Add bloom effect
      const bloomEffect = new BloomEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      bloomEffect.enabled = false;
      this.effectManager.addPostEffect(bloomEffect);

      // Add chromatic aberration effect
      const chromaticAberrationEffect = new ChromaticAberrationEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      chromaticAberrationEffect.enabled = false;
      this.effectManager.addPostEffect(chromaticAberrationEffect);

      // Add scanlines effect
      const scanlinesEffect = new ScanlinesEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      scanlinesEffect.enabled = false;
      this.effectManager.addPostEffect(scanlinesEffect);

      // Add VHS distortion effect
      const vhsDistortionEffect = new VHSDistortionEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      vhsDistortionEffect.enabled = false;
      this.effectManager.addPostEffect(vhsDistortionEffect);

      // Add Sepia effect
      const sepiaEffect = new SepiaEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      sepiaEffect.enabled = false;
      this.effectManager.addPostEffect(sepiaEffect);

      // Add Grayscale effect
      const grayscaleEffect = new GrayscaleEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      grayscaleEffect.enabled = false;
      this.effectManager.addPostEffect(grayscaleEffect);

      // Add Motion Blur effect
      const motionBlurEffect = new MotionBlurEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      motionBlurEffect.enabled = false;
      this.effectManager.addPostEffect(motionBlurEffect);

      // Add Film Grain effect
      const filmGrainEffect = new FilmGrainEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      filmGrainEffect.enabled = false;
      this.effectManager.addPostEffect(filmGrainEffect);

      // Add Sharpen effect
      const sharpenEffect = new SharpenEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      sharpenEffect.enabled = false;
      this.effectManager.addPostEffect(sharpenEffect);

      // Add Trails effect
      const trailsEffect = new TrailsEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      trailsEffect.enabled = false;
      this.effectManager.addPostEffect(trailsEffect);

      // Add Fisheye effect
      const fisheyeEffect = new FisheyeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      fisheyeEffect.enabled = false;
      this.effectManager.addPostEffect(fisheyeEffect);

      // Add Kaleidoscope effect
      const kaleidoscopeEffect = new KaleidoscopeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      kaleidoscopeEffect.enabled = false;
      this.effectManager.addPostEffect(kaleidoscopeEffect);

      // Add Posterize effect
      const posterizeEffect = new PosterizeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      posterizeEffect.enabled = false;
      this.effectManager.addPostEffect(posterizeEffect);

      // Add Tilt-Shift effect
      const tiltShiftEffect = new TiltShiftEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      tiltShiftEffect.enabled = false;
      this.effectManager.addPostEffect(tiltShiftEffect);

      // Add Lens Flare effect
      const lensFlareEffect = new LensFlareEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      lensFlareEffect.enabled = false;
      this.effectManager.addPostEffect(lensFlareEffect);

      // Add Colorize effect
      const colorizeEffect = new ColorizeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      colorizeEffect.enabled = false;
      this.effectManager.addPostEffect(colorizeEffect);

      // Add Solarize effect
      const solarizeEffect = new SolarizeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      solarizeEffect.enabled = false;
      this.effectManager.addPostEffect(solarizeEffect);

      // Add Pinch/Bulge effect
      const pinchBulgeEffect = new PinchBulgeEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      pinchBulgeEffect.enabled = false;
      this.effectManager.addPostEffect(pinchBulgeEffect);

      // Add Twirl effect
      const twirlEffect = new TwirlEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      twirlEffect.enabled = false;
      this.effectManager.addPostEffect(twirlEffect);

      // Add Wave effect
      const waveEffect = new WaveEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      waveEffect.enabled = false;
      this.effectManager.addPostEffect(waveEffect);

      // Add Mirror effect
      const mirrorEffect = new MirrorEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      mirrorEffect.enabled = false;
      this.effectManager.addPostEffect(mirrorEffect);

      // Add Noise effect
      const noiseEffect = new NoiseEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      noiseEffect.enabled = false;
      this.effectManager.addPostEffect(noiseEffect);

      // Add Halftone effect
      const halftoneEffect = new HalftoneEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      halftoneEffect.enabled = false;
      this.effectManager.addPostEffect(halftoneEffect);

      // Add Radial Blur effect
      const radialBlurEffect = new RadialBlurEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      radialBlurEffect.enabled = false;
      this.effectManager.addPostEffect(radialBlurEffect);

      // Add Contrast effect
      const contrastEffect = new ContrastEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      contrastEffect.enabled = false;
      this.effectManager.addPostEffect(contrastEffect);

      // Add Emboss effect
      const embossEffect = new EmbossEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      embossEffect.enabled = false;
      this.effectManager.addPostEffect(embossEffect);

      // Add Exposure effect
      const exposureEffect = new ExposureEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      exposureEffect.enabled = false;
      this.effectManager.addPostEffect(exposureEffect);

      // Add Saturation effect
      const saturationEffect = new SaturationEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      saturationEffect.enabled = false;
      this.effectManager.addPostEffect(saturationEffect);

      // Add Echo effect
      const echoEffect = new EchoEffect(
        this.canvasWrapper.getRenderer(),
        this.canvas.width,
        this.canvas.height
      );
      echoEffect.enabled = false;
      this.effectManager.addPostEffect(echoEffect);
      
      // Connect effect manager to webcam compositor so webcam can have effects applied
      if (this.webcamCompositor) {
        this.webcamCompositor.setEffectManager(this.effectManager);
      }
      
      // Load saved settings (after components are initialized)
      await this.loadSettings();
      
      // Continue initialization with loaded settings
      this.transitionManager = new TransitionManager(this.canvasWrapper);
      this.transitionManager.setDuration(this.transitionDuration);
      this.setupControls();
      
      // Apply loaded settings to UI (after controls are set up)
      const loadedSettings = await this.settingsStorage.loadSettings();
      if (loadedSettings) {
        this.applyLoadedSettingsToUI(loadedSettings);
      }
      
      // Apply left-handed layout after UI is fully set up
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.applyLeftHandedLayout(this.leftHanded);
        this.applyPortraitRotate(this.portraitRotate);
      });
      
      await this.setupModeSelector();
      // Update mode selector after initialization to apply favorites filter if enabled
      this.updateModeSelector();
      // Load first mode after updateModeSelector() to ensure correct ordering
      await this.loadFirstMode();
      this.setupPauseButton();
      this.setupScreenshotButton();
      this.setupMicrophoneButton();
      this.setupWebcamButton();
      this.setupImagesButton();
      this.setupMobileUI();
      this.setupVisibilityPause();
      
      // Update FAB position after mobile UI is set up
      if (this.mobileUI) {
        this.mobileUI.updateFABPosition(this.leftHanded);
      }
      
      // Request wake lock on touch devices to prevent screen sleep
      if (TouchManager.isTouchDevice()) {
        this.wakeLock = await requestWakeLock();
      }
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      // Animation is started by completeModeSwitch after first mode is loaded
      // Only start animation if not already running (safety check)
      if (this.animationId === null) {
        this.startAnimation();
      }
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.initializationError = error as Error;
      this.showErrorLoadingScreen(error as Error);
    }
  }

  private setupUI() {
    const app = document.querySelector('#app')!;
    app.innerHTML = `
      <div id="loading-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #000;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
      ">
        <div style="
          text-align: center;
          max-width: 600px;
          padding: 2rem;
        ">
          <div id="loading-spinner" style="
            width: 60px;
            height: 60px;
            border: 4px solid rgba(74, 158, 255, 0.3);
            border-top-color: #4a9eff;
            border-radius: 50%;
            margin: 0 auto 2rem;
            animation: spin 1s linear infinite;
          "></div>
          <h2 id="loading-title" style="
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #4a9eff;
          ">Loading EYESY</h2>
          <p id="loading-message" style="
            font-size: 1rem;
            color: #aaa;
            margin-bottom: 2rem;
          ">Initializing application...</p>
          <div id="error-message" style="
            display: none;
            background: rgba(231, 76, 60, 0.2);
            border: 1px solid rgba(231, 76, 60, 0.5);
            border-radius: 4px;
            padding: 1rem;
            margin-bottom: 2rem;
            color: #e74c3c;
          "></div>
          <button id="reload-btn" style="
            display: none;
            padding: 0.75rem 2rem;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1rem;
          ">Reload Application</button>
        </div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="app-container">
        <div class="app-header">
          <div class="header-content">
            <div class="header-info">
              <button
                id="prev-mode-header-btn"
                class="btn btn-secondary header-mode-nav header-mode-nav-btn"
                aria-label="Previous mode"
                title="Previous mode"
              >◀</button>
              <div class="header-info-text">
                <div class="header-topline">
                  <h1 class="header-title">EYESY Web</h1>
                  <div class="header-status" id="status">Ready</div>
                </div>
                <div class="header-subline">
                  <button
                    id="header-favorite-btn"
                    class="header-mode-nav header-favorite-btn"
                    aria-label="Toggle favorite"
                    title="Toggle favorite"
                  >🤍</button>
                  <div id="header-mode-name" class="header-mode-name"></div>
                </div>
              </div>
              <button
                id="next-mode-header-btn"
                class="btn btn-secondary header-mode-nav header-mode-nav-btn"
                aria-label="Next mode"
                title="Next mode"
              >▶</button>
            </div>
            <div class="header-actions">
              <button id="mic-btn" class="btn btn-secondary" title="Enable microphone" aria-label="Enable microphone">
                <span id="mic-icon" class="btn-icon">🎤</span>
                <span id="mic-text">Enable Mic</span>
              </button>
              <button id="webcam-btn" class="btn btn-secondary" title="Enable webcam" aria-label="Enable webcam">
                <span id="webcam-icon" class="btn-icon">📷</span>
                <span id="webcam-text">Enable Webcam</span>
              </button>
              <button id="browser-btn" class="btn btn-primary" title="Browse modes (B)" aria-label="Browse modes">
                <span class="btn-icon">🧭</span>
                <span>Browse Modes (B)</span>
              </button>
              <button id="pause-btn" class="btn btn-secondary" title="Pause animation (P)" aria-label="Pause">
                <span id="pause-icon" class="btn-icon">⏸</span>
                <span id="pause-text">Pause</span>
              </button>
              <button id="screenshot-btn" class="btn btn-secondary" title="Save screenshot (S)" aria-label="Screenshot">
                <span class="btn-icon">📸</span>
                <span>Screenshot</span>
              </button>
              <button
                id="auto-clear-btn"
                class="btn btn-secondary"
                title="Toggle auto clear (C)"
                aria-label="Toggle auto clear"
              >
                <span id="auto-clear-icon" class="btn-icon">🔄</span>
                <span id="auto-clear-text">Auto Clear</span>
              </button>
            </div>
          </div>
        </div>
        <div id="mode-selector-container"></div>
        <div class="app-main" style="display: flex; flex: 1; overflow: hidden; min-height: 0;">
          <div class="canvas-container" style="flex: 1; display: flex; align-items: center; justify-content: center; background: #000; min-width: 0; min-height: 0; position: relative; overflow: hidden;">
            <canvas id="canvas" style="max-width: 100%; max-height: 100%; touch-action: none;"></canvas>
            <button id="settings-button" style="
              position: absolute;
              bottom: 1rem;
              right: 1rem;
              width: 48px;
              height: 48px;
              background: #666;
              color: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              font-size: 1.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              transition: all 0.2s ease;
            " title="Toggle Controls Panel" onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(102, 102, 102, 0.5)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.3)';">
              ⚙️
            </button>
          </div>
          <div id="controls-container" class="controls-panel" style="display: flex; flex-direction: column; min-width: 0; overflow: hidden;"></div>
        </div>
        <div id="mode-browser-container"></div>
        <div class="keyboard-hints" style="
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.8);
          padding: 0.75rem 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          color: #aaa;
          z-index: 100;
        ">
          <div id="transition-indicator" style="
            display: none;
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            background: rgba(74, 158, 255, 0.2);
            border: 1px solid rgba(74, 158, 255, 0.5);
            border-radius: 4px;
            color: #4a9eff;
            font-weight: bold;
            font-size: 0.9rem;
          "></div>
          <div>← → Arrow keys: Navigate modes</div>
          <div>B: Browse modes | Space: Trigger</div>
          <div style="margin-top: 0.5rem; color: #666; font-size: 0.8rem;">Touch: Tap=Trigger | Swipe=Navigate</div>
        </div>
      </div>
    `;
  }

  private setupCanvas() {
    this.canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
    this.canvasContainer = document.querySelector<HTMLElement>('.canvas-container');
    
    // Set initial size
    this.canvas.width = 1280;
    this.canvas.height = 720;
    
    this.canvasWrapper = new Canvas(this.canvas);
    
    // Resize to fit available space after wrapper is created
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this.resizeCanvas();
    });
    
    // Set up resize handler to update canvas size dynamically
    this.setupCanvasResize();
  }
  
  private resizeCanvas() {
    if (!this.canvasContainer || !this.canvas || !this.canvasWrapper) return;
    
    // Update UI controls visibility based on screen size
    if (this.controls) {
      this.controls.updatePortraitRotateVisibility(TouchManager.isMobileScreen());
    }
    
    // Get the actual available space in the container
    const containerRect = this.canvasContainer.getBoundingClientRect();
    const availableWidth = containerRect.width;
    const availableHeight = containerRect.height;
    
    // Skip if container has no size yet
    if (availableWidth <= 0 || availableHeight <= 0) {
      return;
    }
    
    // In portrait mode, use more of the available space
    const isPortrait = window.innerHeight > window.innerWidth;
    
    let newWidth: number;
    let newHeight: number;
    
    // Check if portrait rotate is enabled
    const isRotated = isPortrait && this.portraitRotate;
    
    if (isPortrait && isRotated) {
      // Portrait rotate mode is intended to use *more* of the screen by treating
      // the device's vertical space as the landscape width.
      //
      // Because the canvas element is rotated 90deg in CSS:
      // - Rotated visual width  == canvas.height
      // - Rotated visual height == canvas.width
      //
      // So we choose a landscape-sized (canvas.width x canvas.height) that fits:
      // - canvas.height <= availableWidth
      // - canvas.width  <= maxVisualHeight
      const baseAspect = 1280 / 720; // 16:9
      
      const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height || 40;
      const navHeight = document.querySelector('.mode-nav-mobile')?.getBoundingClientRect().height || 50;
      const maxVisualHeight = Math.min(availableHeight, window.innerHeight - headerHeight - navHeight);
      const maxVisualWidth = Math.min(availableWidth, window.innerWidth);
      
      // Start by using all available vertical space as "landscape width"
      let landscapeWidth = Math.floor(maxVisualHeight);
      let landscapeHeight = Math.floor(landscapeWidth / baseAspect);
      
      // If the required landscape height would exceed the portrait width, fit to width instead
      if (landscapeHeight > maxVisualWidth) {
        landscapeHeight = Math.floor(maxVisualWidth);
        landscapeWidth = Math.floor(landscapeHeight * baseAspect);
      }
      
      newWidth = landscapeWidth;   // canvas.width  -> rotated height
      newHeight = landscapeHeight; // canvas.height -> rotated width
    } else if (isPortrait) {
      // In portrait (not rotated): use full width, but maintain aspect ratio
      // Only extend height if there's extra space, don't force stretching
      const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height || 40;
      const navHeight = document.querySelector('.mode-nav-mobile')?.getBoundingClientRect().height || 50;
      const maxHeight = window.innerHeight - headerHeight - navHeight;
      
      // Start with full width
      newWidth = Math.floor(availableWidth);
      
      // Calculate height based on 16:9 aspect ratio
      const baseAspect = 1280 / 720; // 16:9
      newHeight = Math.floor(newWidth / baseAspect);
      
      // Only extend height if there's significantly more space available
      // This prevents stretching while still using extra vertical space when available
      const availableHeightForCanvas = Math.min(maxHeight, availableHeight);
      
      // If the calculated height is much smaller than available, allow some extension
      // But cap it to avoid excessive stretching (max 20% taller than 16:9)
      const maxAllowedHeight = Math.floor(newHeight * 1.2); // Max 20% taller
      const minHeightForExtension = newHeight * 1.1; // Only extend if 10%+ more space
      
      if (availableHeightForCanvas > minHeightForExtension && availableHeightForCanvas > newHeight) {
        // There's extra space - use it, but cap to prevent too much stretching
        newHeight = Math.min(Math.floor(availableHeightForCanvas), maxAllowedHeight);
      }
      // Otherwise, stick with the 16:9 aspect ratio
    } else {
      // In landscape or desktop: maintain 16:9 aspect ratio
      const targetWidth = Math.floor(availableWidth);
      const targetHeight = Math.floor(availableWidth * (9 / 16));
      
      if (targetHeight <= availableHeight) {
        newWidth = targetWidth;
        newHeight = targetHeight;
      } else {
        // Height is the constraint
        newHeight = Math.floor(availableHeight);
        newWidth = Math.floor(availableHeight * (16 / 9));
      }
    }
    
    // Ensure minimum size
    newWidth = Math.max(320, newWidth);
    newHeight = Math.max(180, newHeight);
    
    // Update canvas resolution
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    
    // Update canvas wrapper size
    this.canvasWrapper.setSize(newWidth, newHeight);
    
    // Update EYESY resolution if it exists
    if (this.eyesy) {
      this.eyesy.xres = newWidth;
      this.eyesy.yres = newHeight;
    }
    
    // Update effect manager size
    if (this.effectManager) {
      this.effectManager.setSize(newWidth, newHeight);
    }
  }
  
  private setupCanvasResize() {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // Wait a bit for orientation change to complete
      setTimeout(() => {
        this.resizeCanvas();
        // Reapply portrait rotate if enabled
        if (this.portraitRotate) {
          this.applyPortraitRotate(this.portraitRotate);
        }
      }, 200);
    });
    
    // Also listen for layout changes that might affect canvas container size
    if (this.canvasContainer) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(this.canvasContainer);
    }
  }

  private setupEYESY() {
    this.eyesy = new EYESYImpl(this.canvas.width, this.canvas.height);
  }

  private setupControls() {
    const container = document.querySelector('#controls-container') as HTMLElement;
    this.controls = new Controls(container, this.eyesy);

    // Initial check for mobile-specific controls
    this.controls.updatePortraitRotateVisibility(TouchManager.isMobileScreen());

    // Initially disable mic gain slider (mic not active)
    this.controls.setMicGainEnabled(false);

    this.controls.setOnKnobChange((knob, value) => {
      switch (knob) {
        case 1: this.eyesy.knob1 = value; break;
        case 2: this.eyesy.knob2 = value; break;
        case 3: this.eyesy.knob3 = value; break;
        case 4: this.eyesy.knob4 = value; break;
        case 5: 
          this.eyesy.knob5 = value;
          // Update background color immediately when knob5 changes
          this.eyesy.color_picker_bg(value);
          if (this.canvasContainer) {
            const [r, g, b] = this.eyesy.bg_color;
            this.canvasContainer.style.background = `rgb(${r}, ${g}, ${b})`;
          }
          break;
        case 6: 
          this.eyesy.knob6 = value;
          // Apply rotation immediately
          const rotationDegrees = value * 360;
          this.canvasWrapper.setRotation(rotationDegrees);
          break;
        case 7: 
          this.eyesy.knob7 = value;
          // Apply zoom immediately
          this.canvasWrapper.setZoom(value);
          break;
        case 8:
          this.eyesy.knob8 = value;
          // Speed is applied in the animation loop via deltaTime multiplier
          break;
        case 9:
          this.eyesy.knob9 = value;
          // Apply X position immediately
          if (this.eyesy.knob10 !== undefined) {
            this.canvasWrapper.setPosition(value, this.eyesy.knob10);
          }
          break;
        case 10:
          this.eyesy.knob10 = value;
          // Apply Y position immediately
          if (this.eyesy.knob9 !== undefined) {
            this.canvasWrapper.setPosition(this.eyesy.knob9, value);
          }
          break;
      }
      // Save settings when knobs change (debounced)
      this.debouncedSaveSettings();
    });

    // Trigger: Set to true when pressed, will be cleared after frame
    this.controls.setOnTrigger(() => {
      this.eyesy.trig = true;
    });

    this.controls.setOnAutoClearChange((value) => {
      this.eyesy.auto_clear = value;
      this.controls.updateAutoClear(value);
      this.debouncedSaveSettings();
    });

    this.controls.setOnMicGainChange((value) => {
      this.microphoneAudio.setGain(value);
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomSequenceChange((enabled) => {
      this.randomSequenceEnabled = enabled;
      this.randomSequenceTime = 0;
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomSequenceFrequencyChange((frequency) => {
      this.randomSequenceFrequency = frequency;
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomColorFrequencyChange((frequency) => {
      this.randomColorFrequency = frequency;
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomTriggerChange((enabled) => {
      this.randomTriggerEnabled = enabled;
      this.randomTriggerTime = 0;
      // Reset trigger state when disabling
      if (!enabled) {
        this.eyesy.trig = false;
      }
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomTriggerFrequencyChange((frequency) => {
      this.randomTriggerFrequency = frequency;
      this.debouncedSaveSettings();
    });

    this.controls.setOnMockAudioChange((enabled) => {
      this.mockAudioEnabled = enabled;
      this.mockAudioTime = 0.0; // Reset time when toggled
      // Update mode selector to enable/disable scope modes based on mock audio state
      this.updateModeSelector();
      this.debouncedSaveSettings();
    });

    this.controls.setOnMockAudioFrequencyChange((frequency) => {
      this.mockAudioFrequency = frequency;
      this.debouncedSaveSettings();
    });

    this.controls.setOnMockAudioIntensityRandomnessChange((randomness) => {
      this.mockAudioIntensityRandomness = randomness;
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomColorChange((enabled) => {
      this.randomColorEnabled = enabled;
      this.randomColorTime = 0;
      this.debouncedSaveSettings();
    });

    // Knob lock toggles
    this.controls.setOnKnobLockToggle((knob, locked) => {
      switch (knob) {
        case 1: this.knob1Locked = locked; break;
        case 2: this.knob2Locked = locked; break;
        case 3: this.knob3Locked = locked; break;
        case 4: this.knob4Locked = locked; break;
        case 5: this.knob5Locked = locked; break;
      }
      this.debouncedSaveSettings();
    });

    // Transition controls
    this.controls.setOnTransitionEnabledChange((enabled) => {
      this.transitionsEnabled = enabled;
      this.debouncedSaveSettings();
    });

    this.controls.setOnTransitionDurationChange((duration) => {
      this.transitionDuration = duration;
      this.transitionManager.setDuration(duration);
      this.debouncedSaveSettings();
    });

    this.controls.setOnTransitionTypeChange((type) => {
      this.transitionType = type === 'auto' ? null : type;
      this.debouncedSaveSettings();
    });

    // Left-handed mode
    this.controls.setOnLeftHandedChange((leftHanded) => {
      this.leftHanded = leftHanded;
      this.applyLeftHandedLayout(leftHanded);
      this.debouncedSaveSettings();
    });

    // Portrait rotate mode
    this.controls.setOnPortraitRotateChange((portraitRotate) => {
      this.portraitRotate = portraitRotate;
      this.applyPortraitRotate(portraitRotate);
      this.debouncedSaveSettings();
    });

    // Seizure-safe mode
    this.controls.setOnSeizureSafeChange(async (enabled) => {
      // Save per-mode setting
      const settings = await this.settingsStorage.loadSettings();
      const currentModeId = this.sortedModes[this.currentModeIndex]?.id;
      if (currentModeId) {
        const seizureSafeMode = settings?.seizureSafeMode || {};
        seizureSafeMode[currentModeId] = enabled;
        await this.settingsStorage.saveSettings({ seizureSafeMode });
      }
      
      // Enable/disable the filter
      this.seizureSafetyFilter.setEnabled(enabled);
    });

    // Font settings
    this.controls.setOnFontFamilyChange((fontFamily) => {
      this.eyesy.font_family = fontFamily;
      this.debouncedSaveSettings();
    });

    this.controls.setOnFontTextChange((fontText) => {
      this.eyesy.font_text = fontText;
      this.debouncedSaveSettings();
    });

    // Target FPS
    this.controls.setOnTargetFPSChange((targetFPS) => {
      this.targetFPS = targetFPS;
      this.lastFrameTimeForFPS = performance.now(); // Reset timing when FPS changes
      this.debouncedSaveSettings();
    });

    // Settings button to toggle controls panel
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        // On mobile, use MobileUI's toggleControls method
        if (TouchManager.isMobileScreen() && this.mobileUI) {
          this.mobileUI.toggleControls();
        } else {
          // On desktop, use the standard toggle
          this.toggleControlsPanel();
        }
      });
    }

    // Rewind controls
    this.controls.setOnRewind(() => {
      const success = this.rewindManager.rewind(this.eyesy);
      if (success) {
        // Update UI controls to reflect new knob values
        this.controls.updateKnobValue(1, this.eyesy.knob1);
        this.controls.updateKnobValue(2, this.eyesy.knob2);
        this.controls.updateKnobValue(3, this.eyesy.knob3);
        this.controls.updateKnobValue(4, this.eyesy.knob4);
        this.controls.updateKnobValue(5, this.eyesy.knob5);
        if (this.eyesy.knob6 !== undefined) {
          this.controls.updateKnobValue(6, this.eyesy.knob6);
        }
        if (this.eyesy.knob7 !== undefined) {
          this.controls.updateKnobValue(7, this.eyesy.knob7);
        }
        // Update rewind UI state
        this.updateRewindUI();
      }
    });

    this.controls.setOnFastForward(() => {
      const success = this.rewindManager.fastForward(this.eyesy);
      if (success) {
        // Update UI controls to reflect new knob values
        this.controls.updateKnobValue(1, this.eyesy.knob1);
        this.controls.updateKnobValue(2, this.eyesy.knob2);
        this.controls.updateKnobValue(3, this.eyesy.knob3);
        this.controls.updateKnobValue(4, this.eyesy.knob4);
        this.controls.updateKnobValue(5, this.eyesy.knob5);
        if (this.eyesy.knob6 !== undefined) {
          this.controls.updateKnobValue(6, this.eyesy.knob6);
        }
        if (this.eyesy.knob7 !== undefined) {
          this.controls.updateKnobValue(7, this.eyesy.knob7);
        }
        // Update rewind UI state
        this.updateRewindUI();
      }
    });

    // Reverse playback toggle - simple flag-based approach
    this.controls.setOnReversePlaybackChange((enabled) => {
      
      this.reversePlaybackEnabled = enabled;
      
      
      // Update UI
      this.controls.updateReversePlaybackState(enabled);
      this.updateRewindUI();
    });

    // Update rewind UI periodically
    this.updateRewindUI();
    setInterval(() => {
      this.updateRewindUI();
    }, 100); // Update every 100ms

    // Webcam controls
    this.controls.setOnWebcamEnableChange(async (enabled) => {
      try {
        if (enabled) {
          await this.webcamService.start();
          // Update device list
          const devices = await this.webcamService.getDevices();
          this.controls.updateWebcamDevices(
            devices.map(d => ({ id: d.deviceId, label: d.label })),
            undefined
          );
          
          // Enable webcam compositor if current mode supports it
          if (this.webcamCompositor) {
            const currentModeInfo = this.currentModeIndex >= 0 && this.sortedModes[this.currentModeIndex]
              ? this.sortedModes[this.currentModeIndex]
              : null;
            const supportsWebcam = currentModeInfo?.supportsWebcam !== false; // Default to true
            if (supportsWebcam) {
              this.webcamCompositor.setOptions({ enabled: true });
            }
          }
        } else {
          this.webcamService.stop();
          // Disable webcam compositor
          if (this.webcamCompositor) {
            this.webcamCompositor.setOptions({ enabled: false });
          }
        }
        this.debouncedSaveSettings();
        
        // Update header button state
        this.updateWebcamButtonState();
      } catch (error) {
        console.error('Webcam error:', error);
        this.updateStatus('Failed to access webcam');
        // Reset checkbox
        const checkbox = document.getElementById('webcam-enabled') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = false;
        }
        // Disable compositor on error
        if (this.webcamCompositor) {
          this.webcamCompositor.setOptions({ enabled: false });
        }
        // Update header button state
        this.updateWebcamButtonState();
      }
    });

    this.controls.setOnWebcamDeviceChange(async (deviceId) => {
      try {
        if (deviceId) {
          await this.webcamService.switchDevice(deviceId);
        }
        this.debouncedSaveSettings();
      } catch (error) {
        console.error('Failed to switch webcam device:', error);
        this.updateStatus('Failed to switch camera');
      }
    });

    // Webcam compositor controls
    this.controls.setOnWebcamCompositorChange((options) => {
      if (this.webcamCompositor) {
        this.webcamCompositor.setOptions(options);
      }
      this.debouncedSaveSettings();
    });

    // Effects controls
    this.controls.setOnEffectEnabledChange((effectName, enabled) => {
      if (!this.effectManager) return;
      
      const effect = this.effectManager.getEffect(effectName, 'post');
      if (effect) {
        effect.enabled = enabled;
        this.debouncedSaveSettings();
      }
    });

    this.controls.setOnEffectIntensityChange((effectName, intensity) => {
      if (!this.effectManager) return;

      const effect = this.effectManager.getEffect(effectName, 'post');
      if (effect) {
        effect.intensity = intensity;
        this.debouncedSaveSettings();
      }
    });

    // Webcam effects controls
    this.controls.setOnWebcamEffectEnabledChange((effectName, enabled) => {
      if (!this.webcamEffectManager) return;
      
      // Effect names match UI names (already camelCase)
      const effect = this.webcamEffectManager.getEffect(effectName, 'post');
      if (effect) {
        effect.enabled = enabled;
        this.debouncedSaveSettings();
      }
    });

    this.controls.setOnWebcamEffectIntensityChange((effectName, intensity) => {
      if (!this.webcamEffectManager) return;
      
      // Map UI effect names to actual effect names
      const effectNameMap: { [key: string]: string } = {
        'blur': 'blur',
        'grayscale': 'grayscale',
        'sepia': 'sepia',
        'invert': 'invert',
        'pixelation': 'pixelation',
        'vignette': 'vignette',
        'bloom': 'bloom',
        'sharpen': 'sharpen',
        'fisheye': 'fisheye',
        'kaleidoscope': 'kaleidoscope',
        'posterize': 'posterize',
        'saturation': 'saturation',
        'contrast': 'contrast',
        'exposure': 'exposure'
      };
      
      const actualEffectName = effectNameMap[effectName] || effectName;
      this.webcamEffectManager.setEffectIntensity(actualEffectName, 'post', intensity);
      this.debouncedSaveSettings();
    });

    this.controls.setOnEffectReset((effectName) => {
      if (!this.effectManager) return;
      
      // Map UI effect names (kebab-case) to actual effect names (camelCase)
      const effectNameMap: { [key: string]: string } = {
        'color-grading': 'colorGrading',
        'edge-detection': 'edgeDetection',
        'vhs-distortion': 'vhsDistortion',
        'chromatic-aberration': 'chromaticAberration',
        'motion-blur': 'motionBlur',
        'radial-blur': 'radialBlur',
        'tilt-shift': 'tiltShift',
        'pinch-bulge': 'pinchBulge',
        'film-grain': 'filmGrain',
        'lens-flare': 'lensFlare',
      };
      
      const actualEffectName = effectNameMap[effectName] || effectName;
      this.effectManager.resetEffect(actualEffectName, 'post');
      
      // Update UI to reflect reset values (use original effectName for UI element IDs)
      const effect = this.effectManager.getEffect(actualEffectName, 'post');
      if (effect) {
        const enabledCheckbox = document.getElementById(`effect-${effectName}-enabled`) as HTMLInputElement;
        const intensitySlider = document.getElementById(`effect-${effectName}-intensity`) as HTMLInputElement;
        const intensityValue = document.getElementById(`effect-${effectName}-intensity-value`);
        
        if (enabledCheckbox) {
          enabledCheckbox.checked = effect.enabled;
        }
        if (intensitySlider && intensityValue) {
          intensitySlider.value = effect.intensity.toString();
          intensityValue.textContent = effect.intensity.toFixed(2);
        }
      }
      
      this.debouncedSaveSettings();
    });

    this.controls.setOnResetAllEffects(() => {
      if (!this.effectManager) return;
      
      this.effectManager.resetAllEffects('post');
      
      // Reset blend mix to 1.0 (full effects)
      this.effectManager.setBlendMix(1.0);
      const blendMixSlider = document.getElementById('effects-blend-mix') as HTMLInputElement;
      const blendMixValue = document.getElementById('effects-blend-mix-value');
      const blendMixQuickSlider = document.getElementById('effects-blend-mix-quick') as HTMLInputElement;
      const blendMixQuickValue = document.getElementById('effects-blend-mix-value-quick');
      if (blendMixSlider) blendMixSlider.value = '1.0';
      if (blendMixValue) blendMixValue.textContent = '100%';
      if (blendMixQuickSlider) blendMixQuickSlider.value = '1.0';
      if (blendMixQuickValue) blendMixQuickValue.textContent = '100%';
      
      // Update all UI elements
      this.effectManager.getPostEffects().forEach(effect => {
        const kebabName = effect.name.replace(/([A-Z])/g, '-$1').toLowerCase();
        const enabledCheckbox = document.getElementById(`effect-${kebabName}-enabled`) as HTMLInputElement;
        const intensitySlider = document.getElementById(`effect-${kebabName}-intensity`) as HTMLInputElement;
        const intensityValue = document.getElementById(`effect-${kebabName}-intensity-value`);
        
        if (enabledCheckbox) {
          enabledCheckbox.checked = effect.enabled;
        }
        if (intensitySlider && intensityValue) {
          intensitySlider.value = effect.intensity.toString();
          intensityValue.textContent = effect.intensity.toFixed(2);
        }
      });
      
      // Also reset Color Grading options if it exists
      const colorGradingEffect = this.effectManager.getEffect('colorGrading', 'post') as any;
      if (colorGradingEffect && colorGradingEffect.setOptions) {
        colorGradingEffect.setOptions({
          brightness: 0.0,
          contrast: 0.0,
          saturation: 0.0,
          hue: 0.0,
        });
        // Update color grading UI sliders
        const brightnessSlider = document.getElementById('color-grading-brightness') as HTMLInputElement;
        const contrastSlider = document.getElementById('color-grading-contrast') as HTMLInputElement;
        const saturationSlider = document.getElementById('color-grading-saturation') as HTMLInputElement;
        const hueSlider = document.getElementById('color-grading-hue') as HTMLInputElement;
        if (brightnessSlider) brightnessSlider.value = '0';
        if (contrastSlider) contrastSlider.value = '0';
        if (saturationSlider) saturationSlider.value = '0';
        if (hueSlider) hueSlider.value = '0';
      }
      
      this.debouncedSaveSettings();
    });

    this.controls.setOnRandomizeEffects(() => {
      if (!this.effectManager) return;
      
      // Randomize all post-effects
      const effects = this.effectManager.getPostEffects();
      effects.forEach(effect => {
        // Randomly enable/disable (70% chance to enable)
        const shouldEnable = Math.random() < 0.7;
        effect.enabled = shouldEnable;
        
        // Random intensity between 0.2 and 1.0 if enabled
        if (shouldEnable) {
          effect.intensity = 0.2 + Math.random() * 0.8;
        } else {
          effect.intensity = 0;
        }
        
        // Special handling for Color Grading
        if (effect.name === 'colorGrading' && shouldEnable) {
          const colorGradingEffect = effect as any;
          if (colorGradingEffect.setOptions) {
            colorGradingEffect.setOptions({
              brightness: (Math.random() - 0.5) * 0.4, // -0.2 to 0.2
              contrast: (Math.random() - 0.5) * 0.4,   // -0.2 to 0.2
              saturation: (Math.random() - 0.5) * 0.6, // -0.3 to 0.3
              hue: (Math.random() - 0.5) * 0.4,        // -0.2 to 0.2
            });
          }
        }
        
        // Update UI elements
        const kebabName = effect.name.replace(/([A-Z])/g, '-$1').toLowerCase();
        const enabledCheckbox = document.getElementById(`effect-${kebabName}-enabled`) as HTMLInputElement;
        const intensitySlider = document.getElementById(`effect-${kebabName}-intensity`) as HTMLInputElement;
        const intensityValue = document.getElementById(`effect-${kebabName}-intensity-value`);
        const intensityValueContainer = intensityValue?.parentElement as HTMLElement;
        const resetBtn = document.querySelector(`button.effect-reset-btn[data-effect="${kebabName}"]`) as HTMLElement;
        
        if (enabledCheckbox) {
          enabledCheckbox.checked = effect.enabled;
          enabledCheckbox.dispatchEvent(new Event('change'));
        }
        if (intensitySlider && intensityValue) {
          intensitySlider.value = effect.intensity.toString();
          intensityValue.textContent = effect.intensity.toFixed(2);
        }
        
        // Update visibility based on enabled state
        if (!effect.enabled) {
          if (intensitySlider) intensitySlider.style.display = 'none';
          if (intensityValueContainer) intensityValueContainer.style.display = 'none';
          if (resetBtn) resetBtn.style.display = 'none';
        } else {
          if (intensitySlider) intensitySlider.style.display = 'block';
          if (intensityValueContainer) intensityValueContainer.style.display = 'flex';
          if (resetBtn) resetBtn.style.display = 'inline-block';
        }
        
        // Update Color Grading UI sliders if applicable
        if (effect.name === 'colorGrading' && shouldEnable) {
          const colorGradingEffect = effect as any;
          if (colorGradingEffect.setOptions) {
            const options = colorGradingEffect.getOptions?.() || {};
            const brightnessSlider = document.getElementById('color-grading-brightness') as HTMLInputElement;
            const contrastSlider = document.getElementById('color-grading-contrast') as HTMLInputElement;
            const saturationSlider = document.getElementById('color-grading-saturation') as HTMLInputElement;
            const hueSlider = document.getElementById('color-grading-hue') as HTMLInputElement;
            if (brightnessSlider) brightnessSlider.value = (options.brightness || 0).toString();
            if (contrastSlider) contrastSlider.value = (options.contrast || 0).toString();
            if (saturationSlider) saturationSlider.value = (options.saturation || 0).toString();
            if (hueSlider) hueSlider.value = (options.hue || 0).toString();
          }
        }
      });
      
      this.debouncedSaveSettings();
    });

    this.controls.setOnEffectsBlendMixChange((value) => {
      if (this.effectManager) {
        this.effectManager.setBlendMix(value);
        this.debouncedSaveSettings();
      }
    });

    this.controls.setOnResetAllToDefault(() => {
      this.resetAllToDefault();
    });

    // Color Grading parameters
    this.controls.setOnColorGradingBrightnessChange((brightness) => {
      if (!this.effectManager) return;
      
      const effect = this.effectManager.getEffect('colorGrading', 'post') as any;
      if (effect && effect.setOptions) {
        effect.setOptions({ brightness });
        this.debouncedSaveSettings();
      }
    });

    this.controls.setOnColorGradingContrastChange((contrast) => {
      if (!this.effectManager) return;
      
      const effect = this.effectManager.getEffect('colorGrading', 'post') as any;
      if (effect && effect.setOptions) {
        effect.setOptions({ contrast });
        this.debouncedSaveSettings();
      }
    });

    this.controls.setOnColorGradingSaturationChange((saturation) => {
      if (!this.effectManager) return;
      
      const effect = this.effectManager.getEffect('colorGrading', 'post') as any;
      if (effect && effect.setOptions) {
        effect.setOptions({ saturation });
        this.debouncedSaveSettings();
      }
    });

    this.controls.setOnColorGradingHueChange((hue) => {
      if (!this.effectManager) return;
      
      const effect = this.effectManager.getEffect('colorGrading', 'post') as any;
      if (effect && effect.setOptions) {
        effect.setOptions({ hue }); // Hue is already in degrees (-180 to 180)
        this.debouncedSaveSettings();
      }
    });

    // Initialize webcam device list
    this.updateWebcamDeviceList();
  }

  private async updateWebcamDeviceList() {
    try {
      const devices = await this.webcamService.getDevices();
      this.controls.updateWebcamDevices(
        devices.map(d => ({ id: d.deviceId, label: d.label })),
        undefined
      );
    } catch (error) {
      console.warn('Failed to enumerate webcam devices:', error);
    }
  }

  private applyPortraitRotate(portraitRotate: boolean) {
    try {
      const canvasContainer = document.querySelector('.canvas-container') as HTMLElement;
      const canvas = this.canvas;
      
      if (!canvasContainer || !canvas) {
        // If elements don't exist yet, try again on next frame
        requestAnimationFrame(() => {
          this.applyPortraitRotate(portraitRotate);
        });
        return;
      }

      // Only apply in portrait mode
      const isPortrait = window.innerWidth < window.innerHeight;
      if (!isPortrait) {
        // Remove rotation if not in portrait
        canvasContainer.classList.remove('portrait-rotate');
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
        return;
      }

      if (portraitRotate) {
        canvasContainer.classList.add('portrait-rotate');
        // Let CSS handle the transform - don't set inline styles
      } else {
        canvasContainer.classList.remove('portrait-rotate');
        // Remove any inline transform
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
      }

      // Trigger canvas resize to recalculate dimensions
      this.resizeCanvas();
    } catch (error) {
      console.error('Error applying portrait rotate:', error);
    }
  }

  private toggleControlsPanel(): void {
    const controlsContainer = document.querySelector('#controls-container') as HTMLElement;
    if (!controlsContainer) return;
    
    // Check if controls are currently visible by checking width
    const currentWidth = controlsContainer.offsetWidth;
    const isVisible = currentWidth > 50; // Threshold to account for minimal width
    
    if (isVisible) {
      // Hide controls panel - collapse it completely to maximize canvas space
      controlsContainer.style.flex = '0 0 0';
      controlsContainer.style.width = '0';
      controlsContainer.style.minWidth = '0';
      controlsContainer.style.maxWidth = '0';
      controlsContainer.style.overflow = 'hidden';
      controlsContainer.style.opacity = '0';
      controlsContainer.style.pointerEvents = 'none';
      controlsContainer.setAttribute('data-collapsed', 'true');
    } else {
      // Show controls panel - restore default flex behavior
      controlsContainer.style.flex = '';
      controlsContainer.style.width = '';
      controlsContainer.style.minWidth = '';
      controlsContainer.style.maxWidth = '';
      controlsContainer.style.overflow = '';
      controlsContainer.style.opacity = '1';
      controlsContainer.style.pointerEvents = 'auto';
      controlsContainer.removeAttribute('data-collapsed');
    }
    
    // Trigger canvas resize to take advantage of the new space
    // Use requestAnimationFrame to ensure layout has updated
    requestAnimationFrame(() => {
      this.resizeCanvas();
    });
  }

  private applyLeftHandedLayout(leftHanded: boolean) {
    try {
      const appMain = document.querySelector('.app-main') as HTMLElement;
      const controlsContainer = document.querySelector('#controls-container') as HTMLElement;
      
      if (!appMain || !controlsContainer) {
        // If elements don't exist yet, try again on next frame
        requestAnimationFrame(() => {
          this.applyLeftHandedLayout(leftHanded);
        });
        return;
      }

      if (leftHanded) {
        // Left-handed: controls on left, canvas on right
        appMain.style.flexDirection = 'row-reverse';
        appMain.classList.add('left-handed-layout');
        appMain.classList.remove('right-handed-layout');
        controlsContainer.classList.add('left-handed');
        controlsContainer.classList.remove('right-handed');
      } else {
        // Right-handed (default): canvas on left, controls on right
        appMain.style.flexDirection = 'row';
        appMain.classList.add('right-handed-layout');
        appMain.classList.remove('left-handed-layout');
        controlsContainer.classList.add('right-handed');
        controlsContainer.classList.remove('left-handed');
      }

      // Update FAB position for mobile
      this.mobileUI?.updateFABPosition(leftHanded);
    } catch (error) {
      console.warn('Failed to apply left-handed layout:', error);
      // Don't throw - layout is non-critical
    }
  }

  private async setupModeSelector() {
    // Group modes by similarity for better transitions (web-only feature)
    // Mark webcam and image modes as disabled based on permission/upload state
    const isImageMode = (mode: ModeInfo): boolean => {
      const nameLower = mode.name.toLowerCase();
      return nameLower.startsWith('image -') || nameLower.includes('slideshow');
    };

    // Helper to check if a mode is a scope mode
    const isScopeMode = (mode: ModeInfo): boolean => {
      return mode.category === 'scopes';
    };

    // Check if microphone is enabled
    const micEnabled = this.useMicrophone && this.microphoneAudio?.active;
    
    // Check if mock audio is enabled (allows scope modes to work without real mic)
    const audioAvailable = micEnabled || (this.mockAudioEnabled && !this.useMicrophone);
    
    const processedModes = [...modes].map(mode => {
      // Mark webcam mode as disabled if permission not granted
      if (mode.id === 'u---webcam' && !this.webcamPermissionGranted) {
        return { ...mode, disabled: true };
      }
      // Mark image modes as disabled if no images uploaded
      if (isImageMode(mode) && !this.hasUploadedImages) {
        return { ...mode, disabled: true };
      }
      // Mark scope modes as disabled if neither microphone nor mock audio is enabled
      if (isScopeMode(mode) && !audioAvailable) {
        return { ...mode, disabled: true };
      }
      return mode;
    });

    // Use intelligent grouping for web version
    this.sortedModes = ModeGrouper.groupModes(processedModes);

    const container = document.querySelector('#mode-selector-container') as HTMLElement;
    this.modeSelector = new ModeSelector(container);
    this.modeSelector.setModes(this.sortedModes);
    this.modeSelector.setOnModeSelect((modeInfo) => {
      // Check if mode is disabled
      if (modeInfo.disabled) {
        const nameLower = modeInfo.name.toLowerCase();
        if (nameLower.startsWith('image -') || nameLower.includes('slideshow')) {
          this.updateStatus(`Cannot load ${modeInfo.name}: No images uploaded. Click "Upload Images" button first.`);
        } else if (nameLower.startsWith('webcam')) {
          this.updateStatus(`Cannot load ${modeInfo.name}: Webcam permission required. Click "Enable Webcam" button first.`);
        } else if (modeInfo.category === 'scopes') {
          this.updateStatus(`Cannot load ${modeInfo.name}: Microphone required. Click "Enable Mic" button first.`);
        } else {
          this.updateStatus(`Cannot load ${modeInfo.name}: This mode is currently disabled.`);
        }
        return;
      }
      this.loadMode(modeInfo);
    });

    // Setup mode browser
    const browserContainer = document.querySelector('#mode-browser-container') as HTMLElement;
    this.modeBrowser = new ModeBrowser(browserContainer);
    this.modeBrowser.setModes(this.sortedModes);
    this.modeBrowser.setFavorites(this.favorites);
    this.modeBrowser.setOnFavoriteToggle((modeId, isFavorite) => {
      if (isFavorite) {
        if (!this.favorites.includes(modeId)) {
          this.favorites.push(modeId);
        }
      } else {
        this.favorites = this.favorites.filter(id => id !== modeId);
      }
      this.modeBrowser.setFavorites(this.favorites);
      this.updateModeSelector();
      this.debouncedSaveSettings();
    });
    this.modeBrowser.setOnModeSelect((modeInfo) => {
      // Re-check if mode should be disabled (in case state changed since mode list was created)
      const micEnabled = this.useMicrophone && this.microphoneAudio?.active;
      const audioAvailable = micEnabled || (this.mockAudioEnabled && !this.useMicrophone);
      const isImageMode = (mode: ModeInfo): boolean => {
        const nameLower = mode.name.toLowerCase();
        return nameLower.startsWith('image -') || nameLower.includes('slideshow');
      };
      const isScopeMode = (mode: ModeInfo): boolean => {
        return mode.category === 'scopes';
      };
      
      // Check current disabled state
      let shouldBeDisabled = false;
      if (modeInfo.id === 'u---webcam' && !this.webcamPermissionGranted) {
        shouldBeDisabled = true;
      } else if (isImageMode(modeInfo) && !this.hasUploadedImages) {
        shouldBeDisabled = true;
      } else if (isScopeMode(modeInfo) && !audioAvailable) {
        shouldBeDisabled = true;
      }
      
      if (shouldBeDisabled) {
        const nameLower = modeInfo.name.toLowerCase();
        if (nameLower.startsWith('image -') || nameLower.includes('slideshow')) {
          this.updateStatus(`Cannot load ${modeInfo.name}: No images uploaded. Click "Upload Images" button first.`);
        } else if (nameLower.startsWith('webcam')) {
          this.updateStatus(`Cannot load ${modeInfo.name}: Webcam permission required. Click "Enable Webcam" button first.`);
        } else if (modeInfo.category === 'scopes') {
          this.updateStatus(`Cannot load ${modeInfo.name}: Microphone or Mock Audio required. Click "Enable Mic" or enable "Mock Audio" first.`);
        } else {
          this.updateStatus(`Cannot load ${modeInfo.name}: This mode is currently disabled.`);
        }
        return;
      }
      this.loadMode(modeInfo);
    });

    // Show only favorites (now handled by ModeBrowser)
    this.modeBrowser.setOnShowOnlyFavoritesChange((showOnlyFavorites) => {
      this.showOnlyFavorites = showOnlyFavorites;
      this.updateModeSelector();
      this.debouncedSaveSettings();
    });

    // Handle enable feature prompt (when user clicks disabled mode 3 times)
    this.modeBrowser.setOnEnableFeaturePrompt((mode, reason) => {
      this.promptEnableFeature(mode, reason);
    });

    // Apply saved showOnlyFavorites setting to the browser
    this.modeBrowser.setShowOnlyFavorites(this.showOnlyFavorites);

    // Browser button
    const browserBtn = document.getElementById('browser-btn');
    if (browserBtn) {
      browserBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.modeBrowser) {
          this.modeBrowser.toggle();
        } else {
          console.error('ModeBrowser not initialized');
        }
      });
    } else {
      console.warn('Browse Modes button not found');
    }

    // Header mode navigation buttons (for landscape mode)
    const prevModeHeaderBtn = document.getElementById('prev-mode-header-btn');
    const nextModeHeaderBtn = document.getElementById('next-mode-header-btn');
    
    if (prevModeHeaderBtn) {
      prevModeHeaderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.navigateMode(-1);
      });
    }
    
    if (nextModeHeaderBtn) {
      nextModeHeaderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.navigateMode(1);
      });
    }
    
    // Make header mode name clickable to open browser (in landscape)
    const headerModeName = document.getElementById('header-mode-name');
    if (headerModeName) {
      headerModeName.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.modeBrowser) {
          // Set current mode so browser can scroll to it
          if (this.currentModeIndex >= 0 && this.sortedModes[this.currentModeIndex]) {
            this.modeBrowser.setCurrentMode(this.sortedModes[this.currentModeIndex].id);
          }
          this.modeBrowser.toggle();
        }
      });
    }

    // Header favorite button
    const headerFavoriteBtn = document.getElementById('header-favorite-btn');
    if (headerFavoriteBtn) {
      headerFavoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleCurrentModeFavorite();
      });
    }

    // Add keyboard navigation
    this.setupKeyboardNavigation();
  }
  
  /**
   * Load the first enabled mode on startup
   * Called after updateModeSelector() to ensure correct ordering
   * Prefers continuously animating modes (lfo, time, noise, geometric, pattern) over trigger-based modes
   */
  private async loadFirstMode(): Promise<void> {
    if (this.sortedModes.length > 0 && this.currentModeIndex < 0) {
      // Prefer continuously animating modes over trigger-based modes
      const continuousCategories = ['lfo', 'time', 'noise', 'geometric', 'pattern'];
      
      // Known trigger-based mode IDs/names to skip (even if in continuous categories)
      const triggerBasedModeIds = ['l---bom-reckies-trans'];
      const triggerBasedKeywords = ['bom', 'reckies', 'trigger', 'midi grid'];
      
      // Helper to check if a mode is trigger-based
      const isTriggerBased = (mode: ModeInfo): boolean => {
        if (triggerBasedModeIds.includes(mode.id)) return true;
        const nameLower = mode.name.toLowerCase();
        return triggerBasedKeywords.some(keyword => nameLower.includes(keyword));
      };
      
      // First, try to find "L - LFO Circles" specifically (best default)
      let firstEnabledIndex = -1;
      for (let i = 0; i < this.sortedModes.length; i++) {
        const mode = this.sortedModes[i];
        if (!mode.disabled && mode.id === 'l---lfo-circles') {
          firstEnabledIndex = i;
          break;
        }
      }
      
      // If not found, look for any continuously animating mode that's not trigger-based
      if (firstEnabledIndex === -1) {
        for (let i = 0; i < this.sortedModes.length; i++) {
          const mode = this.sortedModes[i];
          if (!mode.disabled && 
              continuousCategories.includes(mode.category) &&
              !isTriggerBased(mode)) {
            firstEnabledIndex = i;
            break;
          }
        }
      }
      
      // If no continuous mode found, fall back to any enabled mode that's not trigger-based
      if (firstEnabledIndex === -1) {
        for (let i = 0; i < this.sortedModes.length; i++) {
          const mode = this.sortedModes[i];
          if (!mode.disabled && !isTriggerBased(mode)) {
            firstEnabledIndex = i;
            break;
          }
        }
      }
      
      // Last resort: any enabled mode
      if (firstEnabledIndex === -1) {
        for (let i = 0; i < this.sortedModes.length; i++) {
          if (!this.sortedModes[i].disabled) {
            firstEnabledIndex = i;
            break;
          }
        }
      }
      
      if (firstEnabledIndex >= 0) {
        this.currentModeIndex = firstEnabledIndex;
        await this.loadMode(this.sortedModes[firstEnabledIndex]);
        // Update navigation buttons after first mode loads
        this.updateNavigationButtons();
      }
    }
  }

  private setupPauseButton(): void {
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
    this.updatePauseButton();
  }
  
  private setupScreenshotButton(): void {
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
  
  private captureScreenshot(): void {
    try {
      // Capture the current canvas as a data URL
      const dataURL = this.canvasWrapper.captureScreenshot();
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `eyesy-screenshot-${Date.now()}.png`;
      link.href = dataURL;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const modeName = this.sortedModes[this.currentModeIndex]?.name || 'Unknown';
      this.updateStatus(`Screenshot saved: ${modeName}`);
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      this.updateStatus('Error capturing screenshot');
    }
  }
  
  private togglePause(): void {
    const wasPaused = this.isPaused;
    this.isPaused = !this.isPaused;
    // Track manual pause state: true if user manually paused, false if user manually resumed
    this.wasManuallyPaused = this.isPaused;
    
    this.updatePauseButton();
    
    if (this.isPaused) {
      this.updateStatus('Animation paused');
    } else {
      this.updateStatus('Animation resumed');
      // Reset last frame time to avoid large delta jump
      this.lastFrameTime = performance.now();
    }
  }
  
  private updatePauseButton(): void {
    const pauseBtn = document.getElementById('pause-btn');
    const pauseIcon = document.getElementById('pause-icon');
    const pauseText = document.getElementById('pause-text');
    
    if (!pauseBtn || !pauseIcon || !pauseText) return;
    
    if (this.isPaused) {
      pauseIcon.textContent = '▶';
      pauseText.textContent = 'Resume';
      pauseBtn.title = 'Resume animation (P)';
      pauseBtn.style.background = '#4a7c59'; // Green when paused
    } else {
      pauseIcon.textContent = '⏸';
      pauseText.textContent = 'Pause';
      pauseBtn.title = 'Pause animation (P)';
      pauseBtn.style.background = '#666'; // Gray when playing
    }
  }

  private setupMicrophoneButton(): void {
    const micBtn = document.querySelector('#mic-btn') as HTMLElement;
    const micIcon = document.querySelector('#mic-icon') as HTMLElement;
    const micText = document.querySelector('#mic-text') as HTMLElement;

    micBtn.addEventListener('click', async () => {
      try {
        if (this.useMicrophone && this.microphoneAudio.active) {
          // Stop microphone
          this.microphoneAudio.stop();
          this.useMicrophone = false;
          micBtn.style.background = '#666';
          micIcon.textContent = '🎤';
          micText.textContent = 'Enable Mic';
          // Disable mic gain slider
          this.controls.setMicGainEnabled(false);
          this.updateStatus('Microphone disabled');
          this.debouncedSaveSettings();
          
          // Update mode selector to disable scope modes
          this.updateModeSelector();
          
          // If current mode is a scope mode, switch to first enabled non-scope mode
          const currentMode = this.sortedModes[this.currentModeIndex];
          if (currentMode && currentMode.category === 'scopes') {
            const modesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
            const firstEnabledIndex = modesToUse.findIndex(m => !m.disabled);
            if (firstEnabledIndex >= 0) {
              this.currentModeIndex = firstEnabledIndex;
              await this.loadMode(modesToUse[firstEnabledIndex]);
            }
          }
        } else {
          // Start microphone
          await this.microphoneAudio.start();
          this.useMicrophone = true;
          micBtn.style.background = '#e74c3c';
          micIcon.textContent = '🔴';
          micText.textContent = 'Disable Mic';
          // Enable mic gain slider and set initial value
          this.controls.setMicGainEnabled(true);
          this.controls.updateMicGain(this.microphoneAudio.getGain());
          this.updateStatus('Microphone enabled - speak or make noise!');
          this.debouncedSaveSettings();
          
          // Update mode selector to enable scope modes
          this.updateModeSelector();
        }
      } catch (error) {
        console.error('Microphone error:', error);
        this.updateStatus('Microphone access denied. Please allow microphone access.');
        this.useMicrophone = false;
        micBtn.style.background = '#666';
        micIcon.textContent = '🎤';
        micText.textContent = 'Enable Mic';
        // Disable mic gain slider
        this.controls.setMicGainEnabled(false);
        this.debouncedSaveSettings();
        
        // Update mode selector to disable scope modes
        this.updateModeSelector();
        
        // If current mode is a scope mode, switch to first enabled non-scope mode
        const currentMode = this.sortedModes[this.currentModeIndex];
        if (currentMode && currentMode.category === 'scopes') {
          const modesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
          const firstEnabledIndex = modesToUse.findIndex(m => !m.disabled);
          if (firstEnabledIndex >= 0) {
            this.currentModeIndex = firstEnabledIndex;
            await this.loadMode(modesToUse[firstEnabledIndex]);
          }
        }
      }
    });
  }

  /**
   * Update webcam button state in header
   */
  private updateWebcamButtonState(): void {
    const webcamBtn = document.querySelector('#webcam-btn') as HTMLElement;
    const webcamIcon = document.querySelector('#webcam-icon') as HTMLElement;
    const webcamText = document.querySelector('#webcam-text') as HTMLElement;
    
    if (!webcamBtn || !webcamIcon || !webcamText) return;
    
    const isActive = this.webcamService.getActive();
    if (isActive) {
      webcamBtn.style.background = '#4a7c59';
      webcamIcon.textContent = '📷';
      webcamText.textContent = 'Disable Webcam';
    } else {
      webcamBtn.style.background = '#666';
      webcamIcon.textContent = '📷';
      webcamText.textContent = 'Enable Webcam';
    }
    
    // Sync with checkbox
    const checkbox = document.getElementById('webcam-enabled') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = isActive;
    }
  }

  private setupWebcamButton(): void {
    const webcamBtn = document.querySelector('#webcam-btn') as HTMLElement;
    if (!webcamBtn) return;

    // Initial state
    this.updateWebcamButtonState();

    // Update button state periodically to stay in sync
    setInterval(() => {
      this.updateWebcamButtonState();
    }, 100); // Check every 100ms

    webcamBtn.addEventListener('click', async () => {
      try {
        const isCurrentlyActive = this.webcamService.getActive();
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
            await this.webcamService.start();
            // Update device list
            const devices = await this.webcamService.getDevices();
            this.controls.updateWebcamDevices(
              devices.map(d => ({ id: d.deviceId, label: d.label })),
              undefined
            );
            
            // Enable webcam compositor if current mode supports it
            if (this.webcamCompositor) {
              const currentModeInfo = this.currentModeIndex >= 0 && this.sortedModes[this.currentModeIndex]
                ? this.sortedModes[this.currentModeIndex]
                : null;
              const supportsWebcam = currentModeInfo?.supportsWebcam !== false;
              if (supportsWebcam) {
                this.webcamCompositor.setOptions({ enabled: true });
              }
            }
          } else {
            this.webcamService.stop();
            if (this.webcamCompositor) {
              this.webcamCompositor.setOptions({ enabled: false });
            }
          }
          this.updateWebcamButtonState();
          this.debouncedSaveSettings();
        }
      } catch (error) {
        console.error('Webcam error:', error);
        this.updateStatus('Failed to access webcam');
        this.updateWebcamButtonState();
      }
    });
  }

  /**
   * Setup visibility change listener to auto-pause when tab is hidden
   */
  private setupVisibilityPause(): void {
    // Use Page Visibility API to detect when tab becomes hidden/visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab is now hidden - pause if not already paused
        if (!this.isPaused) {
          this.isPaused = true;
          this.wasManuallyPaused = false; // This is an auto-pause
          this.updatePauseButton();
        }
      } else {
        // Tab is now visible - resume only if we auto-paused (not if user manually paused)
        if (this.isPaused && !this.wasManuallyPaused) {
          this.isPaused = false;
          this.updatePauseButton();
          // Reset last frame time to avoid large delta jump
          this.lastFrameTime = performance.now();
        }
      }
    });
  }

  private setupImagesButton(): void {
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

      this.updateStatus(`Loading ${files.length} image(s)...`);

      const loadPromises: Promise<HTMLImageElement>[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        loadPromises.push(this.loadImageFile(file));
      }

      try {
        const newImages = await Promise.all(loadPromises);
        this.uploadedImages.push(...newImages);
        this.hasUploadedImages = this.uploadedImages.length > 0;

        // Update button
        const imagesBtn = document.getElementById('images-btn') as HTMLButtonElement | null;
        const imagesIcon = document.getElementById('images-icon');
        const imagesText = document.getElementById('images-text');
        if (imagesBtn) imagesBtn.style.background = '#27ae60';
        if (imagesIcon) imagesIcon.textContent = '✅';
        if (imagesText) imagesText.textContent = `Images (${this.uploadedImages.length})`;
        
        this.updateStatus(`Loaded ${newImages.length} image(s). Total: ${this.uploadedImages.length}`);
        this.updateModeSelector();
        this.debouncedSaveSettings();
      } catch (error) {
        console.error('Error loading images:', error);
        this.updateStatus('Error loading some images. Please try again.');
      }

      // Reset file input
      (target as HTMLInputElement).value = '';
    });
  }

  // FX button removed (Effects Panel is opened from Controls)

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
            const ctx = canvas.getContext('2d');
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
   * Get uploaded images for use by image modes
   */
  getUploadedImages(): HTMLImageElement[] {
    return this.uploadedImages;
  }

  /**
   * Setup mobile UI components and touch gestures
   */
  private setupMobileUI(): void {
    const appContainer = document.querySelector('.app-container') as HTMLElement;
    if (!appContainer) return;
    
    this.mobileUI = new MobileUI(appContainer, {
      onPrevMode: () => {
        this.navigateMode(-1);
      },
      onNextMode: () => {
        this.navigateMode(1);
      },
      onTrigger: () => {
        // Single tap trigger (momentary)
        this.eyesy.trig = true;
        setTimeout(() => {
          this.eyesy.trig = false;
        }, 100);
      },
      onToggleTrigger: () => {
        // Long press toggle
        this.eyesy.trig = !this.eyesy.trig;
      },
      onToggleControls: () => {
        // Optional callback when controls panel toggles
      },
      onZoomChange: (delta: number) => {
        // Pinch to zoom
        const newZoom = Math.max(0, Math.min(1, this.eyesy.knob7 + delta));
        this.eyesy.knob7 = newZoom;
        this.canvasWrapper.setZoom(newZoom);
        this.controls.setKnobValue(7, newZoom);
        this.debouncedSaveSettings();
      },
      onRotationChange: (delta: number) => {
        // Two-finger rotate
        const newRotation = (this.eyesy.knob6 + delta + 1) % 1;
        this.eyesy.knob6 = newRotation;
        this.canvasWrapper.setRotation(newRotation * 360);
        this.controls.setKnobValue(6, newRotation);
        this.debouncedSaveSettings();
      },
      onOpenBrowser: () => {
        // Open mode browser when mode name is clicked
        if (this.modeBrowser) {
          // Set current mode so browser can scroll to it
          if (this.currentModeIndex >= 0 && this.sortedModes[this.currentModeIndex]) {
            this.modeBrowser.setCurrentMode(this.sortedModes[this.currentModeIndex].id);
          }
          this.modeBrowser.toggle();
        }
      },
      onToggleFavorite: () => {
        this.toggleCurrentModeFavorite();
      }
    });
    
    // Setup touch gestures on canvas
    this.mobileUI.setupCanvasTouch(this.canvas);
    
    // Update mobile UI with current mode name
    if (this.sortedModes.length > 0 && this.currentModeIndex >= 0) {
      this.mobileUI.setModeName(this.sortedModes[this.currentModeIndex]?.name || '');
    }
  }

  /**
   * Create a simpler navigation order for arrow keys
   * Groups by category, then sorts alphabetically within each category
   */
  private createNavigationOrder(modes: ModeInfo[]): ModeInfo[] {
    // Category priority order (lower = earlier in navigation)
    const categoryOrder: Record<string, number> = {
      'scopes': 1,
      'triggers': 2,
      'lfo': 3,
      'time': 4,
      'noise': 5,
      'geometric': 6,
      'pattern': 7,
      '3d': 8,
      'utilities': 9,
      'font': 10,
    };
    
    // Sort modes: by category priority, then alphabetically within category
    const sorted = [...modes].sort((a, b) => {
      const aCategory = categoryOrder[a.category] || 99;
      const bCategory = categoryOrder[b.category] || 99;
      
      if (aCategory !== bCategory) {
        return aCategory - bCategory;
      }
      
      // Within same category, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return sorted;
  }

  /**
   * Navigate to next/previous mode
   */
  private navigateMode(direction: 1 | -1): void {
    // Use navigationModes for arrow navigation (simpler ordering)
    const modesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
    
    if (modesToUse.length === 0) return;
    
    // Don't navigate if transition is active or mode is loading
    // But allow navigation if transitions are disabled or transition has been active too long (recovery mechanism)
    const transitionActive = this.transitionManager.isActive();
    const transitionStartTime = this.transitionManager.getStartTime();
    const maxTransitionTime = 10.0; // 10 seconds max
    const transitionStuck = transitionActive && transitionStartTime > 0 && 
      (performance.now() - transitionStartTime) / 1000 > maxTransitionTime;
    
    // If transitions are disabled, ignore transition state
    if (this.transitionsEnabled) {
      if ((transitionActive && !transitionStuck) || (this.pendingModeInfo !== null && !transitionStuck)) {
        return;
      }
      
      // If transition is stuck, cancel it
      if (transitionStuck) {
        console.warn('Transition appears stuck, canceling to allow navigation');
        this.transitionManager.cancel();
        this.pendingModeInfo = null;
        this.pendingMode = null;
      }
    } else {
      // Transitions disabled - only block if mode is actively loading
      if (this.pendingModeInfo !== null) {
        // Check if mode loading is stuck (more than 5 seconds)
        // This shouldn't happen, but just in case
        return;
      }
    }
    
    // Find current mode index in navigation order
    let currentIndex = this.currentModeIndex;
    if (currentIndex < 0 || currentIndex >= modesToUse.length) {
      // Find by ID if index is invalid
      const currentModeId = this.previousModeInfo?.id;
      if (currentModeId) {
        currentIndex = modesToUse.findIndex(m => m.id === currentModeId);
        if (currentIndex === -1) {
          currentIndex = 0;
        }
      } else {
        currentIndex = 0;
      }
    }
    
    // Find next enabled mode
    let attempts = 0;
    let newIndex = currentIndex;
    while (attempts < modesToUse.length) {
      newIndex = (newIndex + direction + modesToUse.length) % modesToUse.length;
      if (!modesToUse[newIndex].disabled) {
        break;
      }
      attempts++;
    }
    
    if (newIndex !== currentIndex) {
      this.currentModeIndex = newIndex;
      this.loadMode(modesToUse[newIndex]);
    }
  }

  /**
   * Update navigation button states (enable/disable based on current state)
   */
  private updateNavigationButtons(): void {
    const prevModeHeaderBtn = document.getElementById('prev-mode-header-btn') as HTMLButtonElement;
    const nextModeHeaderBtn = document.getElementById('next-mode-header-btn') as HTMLButtonElement;
    
    // Check if navigation should be disabled
    const isTransitionActive = this.transitionManager.isActive();
    const isModeLoading = this.pendingModeInfo !== null;
    const canNavigate = !isTransitionActive && !isModeLoading;
    
    // Check if there are enabled modes in each direction
    let canGoPrev = false;
    let canGoNext = false;
    
    if (canNavigate && this.sortedModes.length > 0 && this.currentModeIndex >= 0) {
      // Check previous direction
      let attempts = 0;
      let checkIndex = this.currentModeIndex;
      while (attempts < this.sortedModes.length) {
        checkIndex = (checkIndex - 1 + this.sortedModes.length) % this.sortedModes.length;
        if (!this.sortedModes[checkIndex].disabled) {
          canGoPrev = true;
          break;
        }
        attempts++;
      }
      
      // Check next direction
      attempts = 0;
      checkIndex = this.currentModeIndex;
      while (attempts < this.sortedModes.length) {
        checkIndex = (checkIndex + 1) % this.sortedModes.length;
        if (!this.sortedModes[checkIndex].disabled) {
          canGoNext = true;
          break;
        }
        attempts++;
      }
    }
    
    // Update previous button
    if (prevModeHeaderBtn) {
      const shouldDisable = !canNavigate || !canGoPrev;
      prevModeHeaderBtn.disabled = shouldDisable;
      prevModeHeaderBtn.style.opacity = shouldDisable ? '0.5' : '1';
      prevModeHeaderBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
    
    // Update next button
    if (nextModeHeaderBtn) {
      const shouldDisable = !canNavigate || !canGoNext;
      nextModeHeaderBtn.disabled = shouldDisable;
      nextModeHeaderBtn.style.opacity = shouldDisable ? '0.5' : '1';
      nextModeHeaderBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
    
    // Also update mobile navigation buttons if they exist
    const prevModeBtn = document.getElementById('prev-mode-btn') as HTMLButtonElement;
    const nextModeBtn = document.getElementById('next-mode-btn') as HTMLButtonElement;
    
    if (prevModeBtn) {
      const shouldDisable = !canNavigate || !canGoPrev;
      prevModeBtn.disabled = shouldDisable;
      prevModeBtn.style.opacity = shouldDisable ? '0.5' : '1';
      prevModeBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
    
    if (nextModeBtn) {
      const shouldDisable = !canNavigate || !canGoNext;
      nextModeBtn.disabled = shouldDisable;
      nextModeBtn.style.opacity = shouldDisable ? '0.5' : '1';
      nextModeBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
  }

  private updateModeSelector(): void {
    // Helper to check if a mode is an image mode
    const isImageMode = (mode: ModeInfo): boolean => {
      const nameLower = mode.name.toLowerCase();
      return nameLower.startsWith('image -') || nameLower.includes('slideshow');
    };

    // Helper to check if a mode is a scope mode
    const isScopeMode = (mode: ModeInfo): boolean => {
      return mode.category === 'scopes';
    };

    // Check if microphone is enabled
    const micEnabled = this.useMicrophone && this.microphoneAudio?.active;
    
    // Check if mock audio is enabled (allows scope modes to work without real mic)
    const audioAvailable = micEnabled || (this.mockAudioEnabled && !this.useMicrophone);

    // Process modes with current permission states
    let processedModes = [...modes].map(mode => {
      // Mark webcam mode as disabled if permission not granted
      if (mode.id === 'u---webcam' && !this.webcamPermissionGranted) {
        return { ...mode, disabled: true };
      }
      // Mark image modes as disabled if no images uploaded
      if (isImageMode(mode) && !this.hasUploadedImages) {
        return { ...mode, disabled: true };
      }
      // Mark scope modes as disabled if neither microphone nor mock audio is enabled
      if (isScopeMode(mode) && !audioAvailable) {
        return { ...mode, disabled: true };
      }
      return { ...mode, disabled: false };
    });

    // Filter by favorites if enabled
    if (this.showOnlyFavorites && this.favorites.length > 0) {
      // Always include the current mode in the list, even if not favorited
      // This ensures navigation works correctly
      const currentModeId = this.previousModeInfo?.id;
      processedModes = processedModes.filter(mode => 
        this.favorites.includes(mode.id) || mode.id === currentModeId
      );
    }

    // Use intelligent grouping for browser/dropdown (same as setupModeSelector)
    this.sortedModes = ModeGrouper.groupModes(processedModes);

    // Create simpler navigation order for arrow keys: by category, then alphabetical
    this.navigationModes = this.createNavigationOrder(processedModes);

    // Update both mode selector and browser (if they exist)
    if (this.modeSelector) {
      this.modeSelector.setModes(this.sortedModes);
    }
    if (this.modeBrowser) {
      this.modeBrowser.setModes(this.sortedModes);
      this.modeBrowser.setFavorites(this.favorites);
    }
    
    // Update navigation buttons after mode list changes
    this.updateNavigationButtons();
  }

  private currentModeIndex = -1;
  private sortedModes: ModeInfo[] = []; // For browser/dropdown (grouped by similarity)
  private navigationModes: ModeInfo[] = []; // For arrow navigation (simpler ordering)

  private setupKeyboardNavigation() {
    // Helper to check if a mode is an image mode
    const isImageMode = (mode: ModeInfo): boolean => {
      const nameLower = mode.name.toLowerCase();
      return nameLower.startsWith('image -') || nameLower.includes('slideshow');
    };

    // Sort modes: non-experimental first, then experimental
    // This will be updated by updateModeSelector, but we need it here for initial setup
    this.sortedModes = [...modes].map(mode => {
      if (mode.id === 'u---webcam' && !this.webcamPermissionGranted) {
        return { ...mode, disabled: true };
      }
      // Mark image modes as disabled if no images uploaded
      if (isImageMode(mode) && !this.hasUploadedImages) {
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
        this.eyesy.trig = true; // Set trigger, will be cleared after frame
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
      const modesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;

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
        if (e.shiftKey && this.rewindManager.canFastForward()) {
          e.preventDefault();
          this.rewindManager.fastForward(this.eyesy);
          // Update UI controls
          this.controls.updateKnobValue(1, this.eyesy.knob1);
          this.controls.updateKnobValue(2, this.eyesy.knob2);
          this.controls.updateKnobValue(3, this.eyesy.knob3);
          this.controls.updateKnobValue(4, this.eyesy.knob4);
          this.controls.updateKnobValue(5, this.eyesy.knob5);
          if (this.eyesy.knob6 !== undefined) {
            this.controls.updateKnobValue(6, this.eyesy.knob6);
          }
          if (this.eyesy.knob7 !== undefined) {
            this.controls.updateKnobValue(7, this.eyesy.knob7);
          }
          this.updateRewindUI();
          return;
        }
        e.preventDefault();
        // Ensure we have modes and currentModeIndex is valid
        if (modesToUse.length === 0) return;
        if (this.currentModeIndex < 0 || this.currentModeIndex >= modesToUse.length) {
          this.currentModeIndex = findNextEnabledMode(-1, 1);
        } else {
          this.currentModeIndex = findNextEnabledMode(this.currentModeIndex, 1);
        }
        this.loadMode(modesToUse[this.currentModeIndex]);
        this.updateStatus(`Mode ${this.currentModeIndex + 1}/${modesToUse.length}: ${modesToUse[this.currentModeIndex].name}`);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Ensure we have modes and currentModeIndex is valid
        if (modesToUse.length === 0) return;
        if (this.currentModeIndex < 0 || this.currentModeIndex >= modesToUse.length) {
          this.currentModeIndex = findNextEnabledMode(modesToUse.length, -1);
        } else {
          this.currentModeIndex = findNextEnabledMode(this.currentModeIndex, -1);
        }
        this.loadMode(modesToUse[this.currentModeIndex]);
        this.updateStatus(`Mode ${this.currentModeIndex + 1}/${modesToUse.length}: ${modesToUse[this.currentModeIndex].name}`);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.currentModeIndex = findNextEnabledMode(-1, 1);
        this.loadMode(this.sortedModes[this.currentModeIndex]);
        this.updateStatus(`Mode ${this.currentModeIndex + 1}/${this.sortedModes.length}: ${this.sortedModes[this.currentModeIndex].name}`);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.currentModeIndex = findNextEnabledMode(this.sortedModes.length, -1);
        this.loadMode(this.sortedModes[this.currentModeIndex]);
        this.updateStatus(`Mode ${this.currentModeIndex + 1}/${this.sortedModes.length}: ${this.sortedModes[this.currentModeIndex].name}`);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        this.modeBrowser.toggle();
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

  private async loadMode(modeInfo: ModeInfo) {
    try {
      // Check if mode is disabled
      if (modeInfo.disabled) {
        this.updateStatus(`Cannot load ${modeInfo.name}: Webcam permission required. Click "Enable Webcam" button first.`);
        return;
      }

      // If already loading this mode, ignore
      if (this.pendingModeInfo?.id === modeInfo.id) {
        return;
      }

      // If a transition is already active, cancel it and start new one
      // This prevents getting stuck if a transition is hanging
      if (this.transitionManager.isActive()) {
        this.transitionManager.cancel();
        // Clear pending state
        this.pendingModeInfo = null;
        this.pendingMode = null;
      }

      // Store previous mode info for transition
      const fromModeInfo = this.previousModeInfo;
      this.pendingModeInfo = modeInfo;

      // Disable navigation buttons while loading
      this.updateNavigationButtons();

      // Update header mode name immediately for better UX
      this.updateHeaderModeName(modeInfo.name);

      // If this is the first mode load (no previous mode), load immediately without transition
      if (!fromModeInfo || !this.currentMode) {
        await this.completeModeSwitch(modeInfo);
        return;
      }

      // Check if transitions are enabled
      if (!this.transitionsEnabled) {
        this.completeModeSwitch(modeInfo);
        return;
      }

      // IMPORTANT: Capture the old mode's frame BEFORE starting transition
      // This ensures we have a valid texture of the current mode
      // We need to capture it while the old mode is still being drawn
      // So we'll do this in the animation loop before starting transition

      // Determine transition type (use manual selection if set, otherwise auto)
      const transitionType = this.transitionType 
        ? (this.transitionType as any) 
        : undefined;

      // Don't start transition yet - wait for animation loop to capture frame first
      // Set a flag to capture frame in the next animation frame
      (this as any)._pendingTransition = {
        modeInfo,
        fromModeInfo,
        transitionType
      };
      

      // Load new mode in background (async setup)
      this.loadModeInBackground(modeInfo);
    } catch (error) {
      console.error('Failed to load mode:', error);
      this.updateStatus(`Error loading mode: ${error}`);
      this.pendingModeInfo = null;
      // Re-enable navigation buttons on error
      this.updateNavigationButtons();
      // Ensure animation continues even if mode load fails
      if (this.animationId === null) {
        this.startAnimation();
      }
    }
  }

  /**
   * Load mode in background (for async setup during transition)
   */
  private async loadModeInBackground(modeInfo: ModeInfo): Promise<void> {
    try {
      // Update current mode index in navigation order (for arrow keys)
      // The mode should always be in navigationModes because updateModeSelector ensures
      // the current mode is included even when favorites filter is active
      const modesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
      this.currentModeIndex = modesToUse.findIndex(m => m.id === modeInfo.id);
      
      if (this.currentModeIndex === -1) {
        // Mode not found - this shouldn't happen if updateModeSelector is working correctly
        // But as a fallback, trigger updateModeSelector to ensure current mode is included
        console.warn(`Mode ${modeInfo.id} not found in navigationModes, updating mode selector`);
        this.updateModeSelector();
        const updatedModesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
        this.currentModeIndex = updatedModesToUse.findIndex(m => m.id === modeInfo.id);
        
        // If still not found, use index 0 as last resort
        if (this.currentModeIndex === -1) {
          this.currentModeIndex = 0;
        }
      }

      // Ensure foreground and background colors are different for visibility
      this.ensureColorContrast();

      // Set mode_root path for image/font loading
      this.eyesy.mode_root = `/modes/${modeInfo.id}`;

      // Create new mode instance
      const ModeClass = modeInfo.mode;
      const newMode = new ModeClass();

      // Call setup (may be async) with timeout to prevent hanging
      try {
        const setupPromise = newMode.setup(this.canvasWrapper, this.eyesy);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Mode setup timed out after 10 seconds')), 10000)
        );
        await Promise.race([setupPromise, timeoutPromise]);
      } catch (setupError) {
        console.error(`Mode setup failed for ${modeInfo.name}:`, setupError);
        throw setupError;
      }

      // Store the new mode (will be activated when transition completes)
      this.pendingMode = newMode;
    } catch (error) {
      console.error('Failed to load mode in background:', error);
      this.transitionManager.cancel();
      this.pendingModeInfo = null;
      this.pendingMode = null;
      // Re-enable navigation buttons on error
      this.updateNavigationButtons();
      // Ensure animation continues even if mode load fails
      if (this.animationId === null) {
        this.startAnimation();
      }
      // Update status to show error
      this.updateStatus(`Error loading mode: ${error}`);
    }
  }

  /**
   * Complete the mode switch (called when transition finishes)
   */
  private async completeModeSwitch(modeInfo: ModeInfo): Promise<void> {
    try {
      // Ensure transition is cleared (should already be inactive by the time we get here)
      if (this.transitionManager.isActive()) {
        console.warn('completeModeSwitch called while transition is still active - canceling transition');
        this.transitionManager.cancel();
      }
      
      // Keep the current mode visible - don't stop animation or dispose yet
      // We'll do that after the new mode is fully ready
      const oldMode = this.currentMode;
      
      // Update current mode index in navigation order (for arrow keys)
      // The mode should always be in navigationModes because updateModeSelector ensures
      // the current mode is included even when favorites filter is active
      const modesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
      this.currentModeIndex = modesToUse.findIndex(m => m.id === modeInfo.id);
      
      if (this.currentModeIndex === -1) {
        // Mode not found - this shouldn't happen if updateModeSelector is working correctly
        // But as a fallback, trigger updateModeSelector to ensure current mode is included
        console.warn(`Mode ${modeInfo.id} not found in navigationModes, updating mode selector`);
        this.updateModeSelector();
        const updatedModesToUse = this.navigationModes.length > 0 ? this.navigationModes : this.sortedModes;
        this.currentModeIndex = updatedModesToUse.findIndex(m => m.id === modeInfo.id);
        
        // If still not found, use index 0 as last resort
        if (this.currentModeIndex === -1) {
          this.currentModeIndex = 0;
        }
      }

      // Ensure foreground and background colors are different for visibility
      this.ensureColorContrast();

      // Set mode_root path (needed for mode setup)
      this.eyesy.mode_root = `/modes/${modeInfo.id}`;

      // Load the new mode while keeping the old one visible
      // Use pending mode if available (from background loading), otherwise create new
      const hasPendingMode = this.pendingMode && this.pendingModeInfo?.id === modeInfo.id;
      let newMode: Mode;
      
      if (hasPendingMode) {
        newMode = this.pendingMode;
        this.pendingMode = null;
      } else {
        // Create new mode instance
        const ModeClass = modeInfo.mode;
        newMode = new ModeClass();

        // Call setup with timeout to prevent hanging
        // The old mode continues to animate during this time
        try {
          const setupPromise = newMode.setup(this.canvasWrapper, this.eyesy);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Mode setup timed out after 10 seconds')), 10000)
          );
          await Promise.race([setupPromise, timeoutPromise]);
        } catch (setupError) {
          console.error(`Mode setup failed for ${modeInfo.name}:`, setupError);
          throw setupError;
        }
      }
      
      // Now that the new mode is fully ready, we can switch to it
      // Stop animation temporarily to make the switch
      if (this.animationId !== null) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      // Dispose old mode if it exists (now that new mode is ready)
      if (oldMode && typeof oldMode.dispose === 'function') {
        try {
          oldMode.dispose();
        } catch (error) {
          console.warn('completeModeSwitch: Error disposing old mode:', error);
        }
      }

      // Ensure custom camera is cleared (for 3D modes)
      this.canvasWrapper.setCustomCamera(null);

      // Clear canvas and ensure all textures are cleaned up
      this.canvasWrapper.clear();
      
      // Give WebGL a moment to clean up before continuing
      await new Promise(resolve => setTimeout(resolve, 0));
      
      this.canvasWrapper.flush();
      
      // Now switch to the new mode
      this.currentMode = newMode;
      
      // Update background color immediately when mode loads
      this.eyesy.color_picker_bg(this.eyesy.knob5);
      if (this.canvasContainer) {
        const [r, g, b] = this.eyesy.bg_color;
        this.canvasContainer.style.background = `rgb(${r}, ${g}, ${b})`;
      }

      // Update previous mode info
      this.previousModeInfo = modeInfo;
      this.pendingModeInfo = null;
      
      // Re-enable navigation buttons after mode switch completes
      this.updateNavigationButtons();

      // Update UI
      this.controls.updateModeName(modeInfo.name);
      
      // Sync auto-clear button state with current setting
      this.controls.updateAutoClear(this.eyesy.auto_clear);
      
      // Disable Auto Clear button for 3D modes (Paint Mode not supported)
      const is3DMode = modeInfo.category === '3d';
      this.controls.setAutoClearEnabled(!is3DMode);
      
      // Update webcam compositor support based on current mode
      this.updateWebcamCompositorForMode(modeInfo);
      this.modeSelector.setSelectedMode(modeInfo.id); // Sync dropdown with current mode
      this.mobileUI?.setModeName(modeInfo.name); // Update mobile UI
      this.modeBrowser.setCurrentMode(modeInfo.id); // Update browser with current mode
      this.updateHeaderModeName(modeInfo.name); // Update header mode name
      this.updateFavoriteButtons(); // Update favorite button states
      this.updateStatus(`Loaded (${this.currentModeIndex + 1}/${this.sortedModes.length})`);

      // Show/hide font settings based on mode type
      const isFontMode = modeInfo.name.toLowerCase().includes('font');
      this.controls.showFontSettings(isFontMode);

      // Update knob descriptions
      const { getKnobDescriptions } = await import('./core/KnobDescriptions');
      const knobDescs = modeInfo.knobDescriptions || getKnobDescriptions(modeInfo.id);
      this.controls.updateKnobDescriptions(knobDescs);

      // Update seizure-safe warning based on mode risk
      this.controls.updateSeizureSafeWarning(modeInfo.seizureRisk);

      // Auto-enable seizure-safe mode for high/medium risk modes
      await this.autoEnableSeizureSafeMode(modeInfo);

      // Restart animation
      this.startAnimation();
    } catch (error) {
      console.error('Failed to complete mode switch:', error);
      this.updateStatus(`Error loading mode: ${error}`);
      // Ensure all state is cleared on error
      this.pendingModeInfo = null;
      this.pendingMode = null;
      // Ensure transition is cleared
      if (this.transitionManager.isActive()) {
        this.transitionManager.cancel();
      }
      // Re-enable navigation buttons on error
      this.updateNavigationButtons();
      if (this.animationId === null) {
        this.startAnimation();
      }
    }
  }

  /**
   * Automatically enable seizure-safe mode for high/medium risk modes
   */
  private async autoEnableSeizureSafeMode(modeInfo: ModeInfo): Promise<void> {
    try {
      // Only auto-enable for high or medium risk modes
      if (modeInfo.seizureRisk !== 'high' && modeInfo.seizureRisk !== 'medium') {
        // For low-risk modes, check if user has a saved preference
        const settings = await this.settingsStorage.loadSettings();
        const seizureSafeMode = settings?.seizureSafeMode || {};
        if (seizureSafeMode[modeInfo.id] !== undefined) {
          // User has a preference for this mode, use it
          const enabled = seizureSafeMode[modeInfo.id];
          this.seizureSafetyFilter.setEnabled(enabled);
          this.controls.updateSeizureSafeMode(enabled);
        }
        return;
      }

      // Check if user has explicitly disabled it for this mode
      const settings = await this.settingsStorage.loadSettings();
      const seizureSafeMode = settings?.seizureSafeMode || {};
      
      // If user has explicitly set it to false for this mode, respect that
      if (seizureSafeMode[modeInfo.id] === false) {
        this.seizureSafetyFilter.setEnabled(false);
        this.controls.updateSeizureSafeMode(false);
        return;
      }

      // Auto-enable seizure-safe mode for high/medium risk modes
      // Only if it's not already explicitly set to true (to avoid unnecessary updates)
      if (seizureSafeMode[modeInfo.id] !== true) {
        seizureSafeMode[modeInfo.id] = true;
        await this.settingsStorage.saveSettings({ seizureSafeMode });
      }
      
      // Enable the filter and update UI
      this.seizureSafetyFilter.setEnabled(true);
      this.controls.updateSeizureSafeMode(true);
    } catch (error) {
      console.error('Error auto-enabling seizure-safe mode:', error);
    }
  }

  private promptEnableFeature(mode: ModeInfo, reason: string): void {
    let featureName = '';
    let actionText = '';
    let buttonId = '';
    
    switch (reason) {
      case 'microphone':
        featureName = 'Microphone';
        actionText = 'Enable Microphone';
        buttonId = 'mic-btn';
        break;
      case 'webcam':
        featureName = 'Webcam';
        actionText = 'Enable Webcam';
        buttonId = 'webcam-btn';
        break;
      case 'images':
        featureName = 'Images';
        actionText = 'Upload Images';
        buttonId = 'images-btn';
        break;
      default:
        featureName = 'Required Permission';
        actionText = 'Enable Required Feature';
        break;
    }
    
    // Create modal dialog
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
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #2a2a2a;
      border: 2px solid #4a9eff;
      border-radius: 8px;
      padding: 2rem;
      max-width: 500px;
      color: #ccc;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    const title = document.createElement('div');
    title.style.cssText = 'font-size: 1.2rem; font-weight: bold; color: #4a9eff; margin-bottom: 1rem;';
    title.textContent = `Enable ${featureName}`;
    
    const message = document.createElement('div');
    message.style.cssText = 'font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; color: #aaa;';
    message.innerHTML = `
      The mode <strong style="color: #fff;">${mode.name}</strong> requires ${featureName.toLowerCase()} to be enabled.<br><br>
      Click the button below to enable it, or click "Cancel" to dismiss.
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 1rem; justify-content: flex-end;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 0.75rem 1.5rem;
      background: #444;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    `;
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
    
    const enableBtn = document.createElement('button');
    enableBtn.textContent = actionText;
    enableBtn.style.cssText = `
      padding: 0.75rem 1.5rem;
      background: #4a9eff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
    `;
    enableBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
      
      // Trigger the appropriate button click
      if (buttonId) {
        const button = document.getElementById(buttonId) as HTMLElement;
        if (button) {
          button.click();
        }
      }
    });
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(enableBtn);
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    
    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
    
    // Close on ESC key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(dialog);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(dialog);
  }

  private updateStatus(message: string) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }
  
  private updateHeaderModeName(name: string) {
    const modeNameEl = document.getElementById('header-mode-name');
    if (modeNameEl) {
      modeNameEl.textContent = name;
    }
  }

  /**
   * Update favorite button states for current mode
   */
  private updateFavoriteButtons() {
    // Use previousModeInfo which contains the actual current mode
    let currentModeId: string | null = null;
    
    if (this.previousModeInfo) {
      currentModeId = this.previousModeInfo.id;
    } else if (this.currentModeIndex >= 0 && this.currentModeIndex < this.sortedModes.length) {
      // Fallback to index if previousModeInfo not available
      currentModeId = this.sortedModes[this.currentModeIndex].id;
    }
    
    if (!currentModeId) {
      return;
    }
    
    const isFavorite = this.favorites.includes(currentModeId);
    
    // Update header favorite button
    const headerFavoriteBtn = document.getElementById('header-favorite-btn');
    if (headerFavoriteBtn) {
      headerFavoriteBtn.textContent = isFavorite ? '❤️' : '🤍';
      headerFavoriteBtn.setAttribute('title', isFavorite ? 'Remove from favorites' : 'Add to favorites');
      headerFavoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    }
    
    // Update mobile favorite button
    if (this.mobileUI) {
      this.mobileUI.setFavoriteState(isFavorite);
    }
  }

  /**
   * Toggle favorite status of current mode
   */
  private toggleCurrentModeFavorite() {
    // Use previousModeInfo which contains the actual current mode, not the index
    // This is more reliable when sortedModes changes due to filtering
    if (!this.previousModeInfo) {
      // Fallback to index if previousModeInfo not available
      if (this.currentModeIndex < 0 || this.currentModeIndex >= this.sortedModes.length) {
        return;
      }
      const currentModeId = this.sortedModes[this.currentModeIndex].id;
      this.toggleFavoriteForModeId(currentModeId);
      return;
    }
    
    const currentModeId = this.previousModeInfo.id;
    this.toggleFavoriteForModeId(currentModeId);
  }

  /**
   * Toggle favorite for a specific mode ID
   */
  private toggleFavoriteForModeId(modeId: string) {
    const isFavorite = this.favorites.includes(modeId);
    
    if (isFavorite) {
      this.favorites = this.favorites.filter(id => id !== modeId);
    } else {
      if (!this.favorites.includes(modeId)) {
        this.favorites.push(modeId);
      }
    }
    
    // Update UI
    this.updateFavoriteButtons();
    if (this.modeBrowser) {
      this.modeBrowser.setFavorites(this.favorites);
    }
    
    // Update mode selector if favorites filter is active
    if (this.showOnlyFavorites) {
      this.updateModeSelector();
    }
    
    // Save settings
    this.debouncedSaveSettings();
  }

  /**
   * Update transition indicator in bottom left corner
   */
  private updateTransitionIndicator(): void {
    const indicator = document.getElementById('transition-indicator');
    if (indicator) {
      const transitionName = this.transitionManager.getTransitionTypeName();
      const progress = this.transitionManager.getState().progress;
      const progressPercent = Math.round(progress * 100);
      
      indicator.textContent = `Transition: ${transitionName} (${progressPercent}%)`;
      indicator.style.display = 'block';
    }
  }

  /**
   * Hide transition indicator
   */
  private hideTransitionIndicator(): void {
    const indicator = document.getElementById('transition-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Show loading screen
   */
  private showLoadingScreen(message: string = 'Loading...'): void {
    const overlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const spinner = document.getElementById('loading-spinner');
    const title = document.getElementById('loading-title');
    const errorMessage = document.getElementById('error-message');
    const reloadBtn = document.getElementById('reload-btn');
    
    if (overlay) {
      overlay.style.display = 'flex';
    }
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    if (spinner) {
      spinner.style.display = 'block';
    }
    if (title) {
      title.textContent = 'Loading EYESY';
      title.style.color = '#4a9eff';
    }
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
    if (reloadBtn) {
      reloadBtn.style.display = 'none';
    }
  }

  /**
   * Hide loading screen
   */
  private hideLoadingScreen(): void {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show error loading screen with reload option
   */
  private showErrorLoadingScreen(error: Error): void {
    const overlay = document.getElementById('loading-overlay');
    const spinner = document.getElementById('loading-spinner');
    const title = document.getElementById('loading-title');
    const message = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const reloadBtn = document.getElementById('reload-btn');
    const errorHint = document.getElementById('error-hint');

    if (overlay) {
      overlay.style.display = 'flex';
    }
    if (spinner) {
      spinner.style.display = 'none';
    }
    if (title) {
      title.textContent = 'Application Error';
      title.style.color = '#e74c3c';
    }
    if (message) {
      message.textContent = 'The application failed to initialize.';
      message.style.color = '#aaa';
    }
    if (errorMessage) {
      errorMessage.style.display = 'block';
      errorMessage.textContent = `Error: ${error.message || 'Unknown error occurred'}`;
    }
    if (reloadBtn) {
      reloadBtn.style.display = 'block';
      reloadBtn.onclick = () => {
        window.location.reload();
      };
    }
    if (errorHint) {
      errorHint.style.display = 'block';
    }
  }

  /**
   * Ensure foreground and background colors are different for visibility
   */
  private ensureColorContrast(): void {
    const fgColor = this.eyesy.color_picker(this.eyesy.knob4);
    const bgColor = this.eyesy.color_picker(this.eyesy.knob5);
    
    // Calculate color distance (Euclidean distance in RGB space)
    const colorDistance = Math.sqrt(
      Math.pow(fgColor[0] - bgColor[0], 2) +
      Math.pow(fgColor[1] - bgColor[1], 2) +
      Math.pow(fgColor[2] - bgColor[2], 2)
    );
    
    // If colors are too similar (distance < 50), adjust them
    // Set contrasting defaults: bright foreground, dark background
    if (colorDistance < 50) {
      // Set foreground to a bright color (red/yellow range)
      this.eyesy.knob4 = 0.0; // Red
      // Set background to a dark/complementary color (blue range)
      this.eyesy.knob5 = 0.66; // Blue
      
      // Update background color immediately
      this.eyesy.color_picker_bg(this.eyesy.knob5);
      
      // Update UI controls to reflect the change
      this.controls.updateKnobValue(4, this.eyesy.knob4);
      this.controls.updateKnobValue(5, this.eyesy.knob5);
    }
  }

  private generateAudioData(): Float32Array {
    const data = new Float32Array(200);
    
    if (this.mockAudioEnabled && !this.useMicrophone) {
      // Generate mock audio with varying pattern complexity
      // mockAudioTime is updated in the animation loop
      
      // Pattern complexity: 0.0 = simple 4/4 beat, 1.0 = random
      const complexity = this.mockAudioFrequency;
      
      // Base intensity (increased to ensure values are above noise threshold)
      // Noise threshold is 0.03, so we need values well above that
      const baseIntensity = 1.0;
      
      // Determine pattern type based on complexity
      let beatPattern: number;
      let freqVariation: number;
      let rhythmVariation: number;
      
      if (complexity < 0.3) {
        // Simple 4/4 beat pattern
        const beatTime = this.mockAudioTime * 2.0; // 2 beats per second (120 BPM)
        const beatPhase = (beatTime % 1.0) * 4.0; // 4 beats per measure
        // Strong beat on 1, weaker on 2, 3, 4
        if (beatPhase < 1.0) {
          beatPattern = 1.0; // Strong downbeat
        } else if (beatPhase < 2.0) {
          beatPattern = 0.3; // Weak beat
        } else if (beatPhase < 3.0) {
          beatPattern = 0.6; // Medium beat
        } else {
          beatPattern = 0.3; // Weak beat
        }
        freqVariation = 0.1; // Minimal frequency variation
        rhythmVariation = 0.0; // No rhythm variation
      } else if (complexity < 0.7) {
        // More complex patterns (polyrhythms, syncopation)
        const blend = (complexity - 0.3) / 0.4; // 0 to 1 within this range
        
        // Mix of 4/4 and 3/4 time
        const beatTime4 = this.mockAudioTime * 2.0;
        const beatTime3 = this.mockAudioTime * 1.5;
        const pattern4 = Math.sin(beatTime4 * Math.PI * 2) * 0.5 + 0.5;
        const pattern3 = Math.sin(beatTime3 * Math.PI * 2) * 0.5 + 0.5;
        beatPattern = pattern4 * (1.0 - blend * 0.5) + pattern3 * (blend * 0.5);
        
        // Add syncopation
        const syncopation = Math.sin(this.mockAudioTime * 3.0) * 0.3 * blend;
        beatPattern = Math.max(0.2, Math.min(1.0, beatPattern + syncopation));
        
        freqVariation = 0.1 + blend * 0.3; // Moderate frequency variation
        rhythmVariation = blend * 0.4; // Some rhythm variation
      } else {
        // Random patterns
        const randomness = (complexity - 0.7) / 0.3; // 0 to 1 within this range
        
        // Random beat pattern with some structure
        const structured = Math.sin(this.mockAudioTime * 2.0) * 0.5 + 0.5;
        const random = Math.random();
        beatPattern = structured * (1.0 - randomness) + random * randomness;
        beatPattern = Math.max(0.2, Math.min(1.0, beatPattern));
        
        freqVariation = 0.4 + randomness * 0.3; // High frequency variation
        rhythmVariation = 0.4 + randomness * 0.4; // High rhythm variation
      }
      
      // Frequency components with variation
      const baseFreq1 = 60 + freqVariation * 40; // 60-100 Hz (bass)
      const baseFreq2 = 200 + freqVariation * 100; // 200-300 Hz (mid)
      const baseFreq3 = 800 + freqVariation * 400; // 800-1200 Hz (treble)
      
      // Apply rhythm variation to frequencies
      const freq1 = baseFreq1 + Math.sin(this.mockAudioTime * (1.0 + rhythmVariation * 2.0)) * 20;
      const freq2 = baseFreq2 + Math.sin(this.mockAudioTime * (1.5 + rhythmVariation * 3.0)) * 50;
      const freq3 = baseFreq3 + Math.sin(this.mockAudioTime * (2.0 + rhythmVariation * 4.0)) * 200;
      
      // Amplitude modulation
      const ampMod = 0.7 + Math.sin(this.mockAudioTime * 0.5) * 0.3;
      
      // Intensity randomness: adds variation to the base intensity
      // 0.0 = consistent intensity, 1.0 = highly random intensity
      const intensityRandomness = this.mockAudioIntensityRandomness;
      
      for (let i = 0; i < data.length; i++) {
        // Time offset for each sample (simulates audio buffer)
        const t = this.mockAudioTime + (i / data.length) * 0.01;
        
        // Apply intensity randomness: vary the intensity per sample
        // Use per-sample random variation when intensityRandomness > 0
        const randomIntensityVariation = intensityRandomness > 0 
          ? 1.0 + (Math.random() - 0.5) * intensityRandomness * 0.8 // ±40% variation at max
          : 1.0;
        const effectiveIntensity = baseIntensity * randomIntensityVariation;
        
        // Combine multiple frequencies with harmonics, modulated by beat pattern
        // Scale beatPattern to ensure minimum amplitude (map 0.2-1.0 to 0.3-1.0)
        const scaledBeatPattern = 0.3 + (beatPattern - 0.2) * (1.0 - 0.3) / (1.0 - 0.2);
        const effectiveBeatPattern = Math.max(0.3, Math.min(1.0, scaledBeatPattern));
        
        const sample = 
          Math.sin(t * freq1 * Math.PI * 2) * 0.4 * effectiveIntensity * effectiveBeatPattern +
          Math.sin(t * freq2 * Math.PI * 2) * 0.3 * effectiveIntensity * effectiveBeatPattern +
          Math.sin(t * freq3 * Math.PI * 2) * 0.2 * effectiveIntensity * effectiveBeatPattern +
          Math.sin(t * freq1 * Math.PI * 4) * 0.05 * effectiveIntensity * effectiveBeatPattern + // Harmonic
          Math.sin(t * freq2 * Math.PI * 3) * 0.05 * effectiveIntensity * effectiveBeatPattern; // Harmonic
        
        // Add noise based on complexity (more random = more noise)
        const noiseAmount = complexity * 0.1;
        const noise = (Math.random() - 0.5) * noiseAmount;
        
        // Combine sample with amplitude modulation and noise
        // Ensure ampMod doesn't go too low (minimum 0.6 instead of 0.4)
        const effectiveAmpMod = Math.max(0.6, ampMod);
        let finalSample = sample * effectiveAmpMod + noise;
        
        // Ensure minimum amplitude to avoid noise threshold filtering (0.03)
        // Target: at least 0.15 amplitude (well above 0.03 threshold)
        const targetMinAmp = 0.15;
        const currentAmp = Math.abs(finalSample);
        if (currentAmp < targetMinAmp) {
          // Scale up to ensure meaningful signal
          // Preserve the sign and scale to target minimum
          finalSample = Math.sign(finalSample) * targetMinAmp;
        }
        
        // Clamp to valid range
        data[i] = Math.max(-1.0, Math.min(1.0, finalSample));
      }
    } else {
      // Simple fallback when mock audio is disabled
    const time = Date.now() * 0.001;
    for (let i = 0; i < data.length; i++) {
      const t = time + (i / data.length) * 0.01;
      data[i] = Math.sin(t * 220) * 0.5 + Math.sin(t * 440) * 0.25;
    }
    }
    
    return data;
  }

  private startAnimation() {
    this.lastFrameTime = performance.now();
    this.lastFrameTimeForFPS = performance.now();
    this.fpsTime = performance.now();
    this.animate();
  }

  private animate = () => {
    // If paused, just continue the loop without updating anything
    if (this.isPaused) {
      this.animationId = requestAnimationFrame(this.animate);
      return;
    }
    
    const currentTime = performance.now();

    // FPS throttling: skip frame if not enough time has passed
    if (this.targetFPS > 0 && this.targetFPS <= 60) {
      const minFrameTime = 1000 / this.targetFPS; // Minimum milliseconds per frame
      const timeSinceLastFrame = currentTime - this.lastFrameTimeForFPS;
      if (timeSinceLastFrame < minFrameTime) {
        // Not enough time has passed, skip this frame
        this.animationId = requestAnimationFrame(this.animate);
        return;
      }
      this.lastFrameTimeForFPS = currentTime;
    } else {
      // Unlimited FPS (targetFPS = 0), update timing normally
      this.lastFrameTimeForFPS = currentTime;
    }
    
    // Update lastFrameTime only when not paused
    const deltaTime = currentTime - this.lastFrameTime;
    
    // Calculate animation speed multiplier from knob8
    // 0.0 = 0.01x (very slow), 0.5 = 1.0x (normal), 1.0 = 3.0x (fastest)
    let speedMultiplier = 1.0;
    if (this.eyesy.knob8 !== undefined) {
      const value = this.eyesy.knob8;
      if (value <= 0.5) {
        // Use exponential curve for smoother slow-motion control
        // 0.0 = 0.01x, 0.5 = 1.0x
        const t = value / 0.5;
        // Exponential interpolation: 0.01 * (100^t) gives us 0.01 to 1.0
        speedMultiplier = 0.01 * Math.pow(100, t); // 0.01x to 1.0x
      } else {
        const t = (value - 0.5) / 0.5;
        speedMultiplier = 1.0 + (t * 2.0); // 1.0x to 3.0x
      }
    }
    
    const deltaSeconds = (deltaTime / 1000) * speedMultiplier;
    
    // Apply seizure safety filter to delta time
    const filteredDeltaSeconds = this.seizureSafetyFilter.filterDeltaTime(deltaSeconds);

    // Update FPS counter
    this.fpsCounter++;
    if (currentTime - this.fpsTime >= 1000) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTime = currentTime;
      this.controls.updateFPS(this.fps);
    }

    // Random sequence mode (Knobs 1-3)
    if (this.randomSequenceEnabled) {
      this.randomSequenceTime += deltaSeconds;
      // Frequency controls how often values change
      // 0.0 = very slow (5-7 seconds), 1.0 = very fast (0.5-1.5 seconds)
      const minInterval = 0.5 + (1.0 - this.randomSequenceFrequency) * 4.5; // 0.5 to 5.0 seconds
      const maxInterval = 1.5 + (1.0 - this.randomSequenceFrequency) * 5.5; // 1.5 to 7.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.randomSequenceTime >= interval) {
        if (!this.knob1Locked) {
          this.eyesy.knob1 = Math.random();
          this.controls.updateKnobValue(1, this.eyesy.knob1);
        }
        if (!this.knob2Locked) {
          this.eyesy.knob2 = Math.random();
          this.controls.updateKnobValue(2, this.eyesy.knob2);
        }
        if (!this.knob3Locked) {
          this.eyesy.knob3 = Math.random();
          this.controls.updateKnobValue(3, this.eyesy.knob3);
        }
        this.randomSequenceTime = 0;
      }
    }

    // Random color mode (Knobs 4-5)
    if (this.randomColorEnabled) {
      this.randomColorTime += deltaSeconds;
      // Frequency controls how often colors change
      // 0.0 = very slow (3-5 seconds), 1.0 = very fast (0.5-1.5 seconds)
      const minInterval = 0.5 + (1.0 - this.randomColorFrequency) * 2.5; // 0.5 to 3.0 seconds
      const maxInterval = 1.5 + (1.0 - this.randomColorFrequency) * 3.5; // 1.5 to 5.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.randomColorTime >= interval) {
        // Generate random colors ensuring they're never equal
        // Minimum color distance threshold for visibility (RGB distance)
        const minColorDistance = 30;
        let attempts = 0;
        const maxAttempts = 20; // Prevent infinite loops
        
        // Generate new values for unlocked knobs
        if (!this.knob4Locked) {
          this.eyesy.knob4 = Math.random();
        }
        if (!this.knob5Locked) {
          this.eyesy.knob5 = Math.random();
        }
        
        // Check if colors are too similar and adjust if needed
        let fgColor = this.eyesy.color_picker(this.eyesy.knob4);
        let bgColor = this.eyesy.color_picker(this.eyesy.knob5);
        let colorDistance = Math.sqrt(
          Math.pow(fgColor[0] - bgColor[0], 2) +
          Math.pow(fgColor[1] - bgColor[1], 2) +
          Math.pow(fgColor[2] - bgColor[2], 2)
        );
        
        // If colors are too similar, adjust the unlocked knob(s) to be different
        while (colorDistance < minColorDistance && attempts < maxAttempts) {
          attempts++;
          
          // If both knobs are locked, we can't change them (shouldn't happen in random mode)
          if (this.knob4Locked && this.knob5Locked) {
            break;
          }
          
          // Adjust the unlocked knob(s) to create contrast
          if (this.knob4Locked && !this.knob5Locked) {
            // Knob4 is locked, adjust knob5 to be different
            // Try opposite hue on color wheel for maximum contrast
            const lockedHue = (this.eyesy.knob4 / 0.85) * 360;
            const oppositeHue = (lockedHue + 180) % 360;
            this.eyesy.knob5 = (oppositeHue / 360) * 0.85;
          } else if (this.knob5Locked && !this.knob4Locked) {
            // Knob5 is locked, adjust knob4 to be different
            const lockedHue = (this.eyesy.knob5 / 0.85) * 360;
            const oppositeHue = (lockedHue + 180) % 360;
            this.eyesy.knob4 = (oppositeHue / 360) * 0.85;
          } else {
            // Both unlocked - try random again, or set to contrasting colors
            if (attempts < 10) {
              // Try a few more random attempts
              this.eyesy.knob4 = Math.random();
              this.eyesy.knob5 = Math.random();
            } else {
              // Force contrasting colors after too many attempts
              this.eyesy.knob4 = 0.0; // Red
              this.eyesy.knob5 = 0.66; // Blue
            }
          }
          
          // Recalculate color distance
          fgColor = this.eyesy.color_picker(this.eyesy.knob4);
          bgColor = this.eyesy.color_picker(this.eyesy.knob5);
          colorDistance = Math.sqrt(
            Math.pow(fgColor[0] - bgColor[0], 2) +
            Math.pow(fgColor[1] - bgColor[1], 2) +
            Math.pow(fgColor[2] - bgColor[2], 2)
          );
        }
        
        // Update UI controls
        if (!this.knob4Locked) {
          this.controls.updateKnobValue(4, this.eyesy.knob4);
        }
        if (!this.knob5Locked) {
          this.controls.updateKnobValue(5, this.eyesy.knob5);
        }
        this.randomColorTime = 0;
      }
    }

    // Random trigger mode
    this.randomTriggerJustFired = false;
    if (this.randomTriggerEnabled) {
      this.randomTriggerTime += deltaSeconds;
      // Frequency controls how often trigger fires
      // 0.0 = very slow (3-5 seconds), 1.0 = very fast (0.1-0.5 seconds)
      const minInterval = 0.1 + (1.0 - this.randomTriggerFrequency) * 2.9; // 0.1 to 3.0 seconds
      const maxInterval = 0.5 + (1.0 - this.randomTriggerFrequency) * 4.5; // 0.5 to 5.0 seconds
      const interval = minInterval + Math.random() * (maxInterval - minInterval);
      
      if (this.randomTriggerTime >= interval) {
        // Always trigger (positive pulse) - don't randomly turn off
        this.eyesy.trig = true;
        this.randomTriggerTime = 0;
        this.lastRandomTriggerTime = 0; // Reset time since last trigger
        this.randomTriggerJustFired = true;
      } else {
        // Update time since last trigger
        this.lastRandomTriggerTime += deltaSeconds;
      }
      
      // Update visual indicator
      const timeSinceLastTrigger = this.lastRandomTriggerTime;
      this.controls.updateRandomTriggerActivity(this.randomTriggerJustFired, timeSinceLastTrigger);
    } else {
      // Reset indicator when disabled
      this.controls.updateRandomTriggerActivity(false, 999);
    }

    // Clear trigger after modes have had a chance to see it (creates momentary pulse)
    const triggerWasSet = this.eyesy.trig;
    
    // Update time-based animations with speed-adjusted delta (filtered for seizure-safe mode)
    // If reverse playback is enabled, reverse the time direction
    const timeBefore = this.eyesy.time;
    let timeDelta = filteredDeltaSeconds;
    
    if (this.reversePlaybackEnabled) {
      // Reverse playback: subtract from time
      timeDelta = -filteredDeltaSeconds;
    }
    
    this.eyesy.deltaTime = timeDelta;
    this.eyesy.updateTime(timeDelta);
    const timeAfter = this.eyesy.time;
    
    // Log reverse playback state periodically (every ~60 frames at 60fps = ~1 second)
    if (this.fpsCounter % 60 === 0) {
      if (this.reversePlaybackEnabled) {
      } else if (this.fpsCounter === 0) {
        // Log once when inactive to confirm it's being checked
      }
    }
    
    // Note: Don't clear trigger here - it needs to be visible to modes when they draw
    // The trigger will be cleared AFTER the mode's draw() is called

    // Update mock audio time (for smooth animation)
    if (this.mockAudioEnabled && !this.useMicrophone) {
      this.mockAudioTime += deltaSeconds;
    }

    // Update microphone enabled state first
    const micEnabled = this.useMicrophone && this.microphoneAudio.active;
    
    // Determine if we should use mock audio
    // Use mock audio when: mock audio is enabled AND mic is disabled
    const useMockAudio = this.mockAudioEnabled && !micEnabled;
    
    // Set mic_enabled to true if either real mic OR mock audio is active
    // This allows AudioScope utility to process the audio
    this.eyesy.mic_enabled = micEnabled || useMockAudio;
    
    // Update audio
    let audioData: Float32Array;
    if (micEnabled) {
      // Use real microphone audio
      audioData = this.microphoneAudio.getAudioData();
    } else if (useMockAudio) {
      // Use mock audio for scope modes
      audioData = this.generateAudioData();
    } else {
      // No audio (empty/zero)
      audioData = new Float32Array(200);
    }
    
    // Apply microphone gain as a multiplier (like Python version)
    // The gain node amplifies the signal, but we also apply gain in conversion
    // to match Python behavior where gain is applied to integer samples
    const micGain = micEnabled 
      ? this.microphoneAudio.getGain() 
      : 1.0;
    // Pass micEnabled flag - when mock audio is active, treat it as if mic is enabled for reactivity
    // This allows scope modes to react to mock audio
    const effectiveMicEnabled = micEnabled || useMockAudio;
    this.eyesy.updateAudio(audioData, micGain, effectiveMicEnabled);

    // Update microphone level indicator if microphone is active
    if (this.useMicrophone && this.microphoneAudio.active) {
      const audioLevel = this.microphoneAudio.getAudioLevel();
      this.controls.updateMicLevel(audioLevel);
    }

    // Update mock audio level indicator if mock audio is active
    if (useMockAudio && audioData) {
      // Calculate RMS (Root Mean Square) level from mock audio data
      let sumSquares = 0.0;
      for (let i = 0; i < audioData.length; i++) {
        sumSquares += audioData[i] * audioData[i];
      }
      const rms = Math.sqrt(sumSquares / audioData.length);
      // Normalize to 0-1 range (audioData is already normalized -1 to 1)
      const audioLevel = Math.min(1.0, rms * 2.0); // Scale factor for better visibility
      this.controls.updateMockAudioLevel(audioLevel);
    } else {
      // Hide mock audio level when mock audio is not active
      const levelContainer = document.getElementById('mock-audio-level-container');
      if (levelContainer) {
        levelContainer.style.display = 'none';
      }
    }

    // Update canvas container background color to match animation background
    if (this.canvasContainer) {
      const [r, g, b] = this.eyesy.bg_color;
      this.canvasContainer.style.background = `rgb(${r}, ${g}, ${b})`;
    }

    // IMPORTANT: Capture frame for transition BEFORE clearing canvas
    // If a transition is about to start (pendingModeInfo exists but transition not active yet),
    // we need to capture the current frame before it gets cleared
    if (this.pendingModeInfo && !this.transitionManager.isActive() && this.currentMode) {
      // Transition was just requested - capture current frame NOW before it gets cleared
      // The current mode should already be drawn from the previous frame or we need to draw it
      // Actually, the current mode should be visible from the last frame's rendering
      // So we can capture the last frame texture if available
      const lastFrame = this.canvasWrapper.getLastFrameTexture();
      if (lastFrame) {
        // Store it temporarily - transition will pick it up when it starts
        (this as any)._pendingFromFrame = lastFrame;
      } else {
        // No last frame available - draw current mode and capture
        try {
          this.currentMode.draw(this.canvasWrapper, this.eyesy);
          this.canvasWrapper.flush();
          this.canvasWrapper.captureFrame();
          const fromTexture = this.canvasWrapper.getLastFrameTexture();
          if (fromTexture) {
            (this as any)._pendingFromFrame = fromTexture;
          }
        } catch (error) {
          console.error('Error capturing frame before transition:', error);
        }
      }
    }

    // Clear if needed
    if (this.eyesy.auto_clear) {
      this.canvasWrapper.clear();
      this.canvasWrapper.fill(this.eyesy.bg_color);
    }

    // Check if transition is active
    if (this.transitionManager.isActive()) {
      // On first frame of transition, use the frame we captured before transition started
      if (!this.transitionManager.hasFromFrame()) {
        // Check if we have a pending frame from before transition started
        const pendingFrame = (this as any)._pendingFromFrame;
        if (pendingFrame) {
          this.transitionManager.setFromFrame(pendingFrame);
          (this as any)._pendingFromFrame = null;
        } else {
          console.warn('Transition: No pre-captured frame available, transition may not work correctly');
        }
      }
      
      // Update transition progress (only progress if new mode is ready)
      const newModeReady = this.pendingMode !== null;
      const transitionStillActive = this.transitionManager.update(deltaSeconds, newModeReady);
      
      // Update transition indicator
      this.updateTransitionIndicator();
      
      // DON'T clear canvas yet - transition needs to render on top
      // We'll clear after transition completes
      
      // Draw new mode to a separate render target first (don't draw to main canvas yet)
      let newFrameTexture: THREE.Texture | null = null;
      if (this.pendingMode) {
        try {
          // Draw new mode to a clean render target
          this.pendingMode.draw(this.canvasWrapper, this.eyesy);
          this.canvasWrapper.flush();
          
          // Capture the new mode's frame
          this.canvasWrapper.captureFrame();
          newFrameTexture = this.canvasWrapper.getLastFrameTexture();
        } catch (error) {
          console.error('Error drawing pending mode during transition:', error);
        }
      }
      
      // Clear the canvas before rendering transition
      // This ensures we have a clean slate for the transition
      this.canvasWrapper.clear();
      this.canvasWrapper.fill(this.eyesy.bg_color);
      
      // Render transition effect (blends old and new frames)
      // Always render the transition if we have a from frame
      // If new mode isn't ready yet, pass null and transition will just fade out old frame
      const transitionState = this.transitionManager.getState();
      const hasFromFrame = this.transitionManager.hasFromFrame();
      const elapsed = this.transitionManager.getStartTime() > 0 
        ? ((performance.now() - this.transitionManager.getStartTime()) / 1000).toFixed(3)
        : '0.000';
      
      
      // Only render if we have a from frame - otherwise there's nothing to fade from
      if (hasFromFrame) {
        // Render the transition (this will blit the old and new frames with proper alpha)
        this.transitionManager.render(this.canvasWrapper, newFrameTexture);
        
        // IMPORTANT: Flush after rendering transition to ensure it's visible
        this.canvasWrapper.flush();
      } else {
        console.warn('Skipping transition render - no from frame available');
        // If no from frame, just show the new mode (if available)
        if (this.pendingMode) {
          this.pendingMode.draw(this.canvasWrapper, this.eyesy);
          this.canvasWrapper.flush();
        }
      }
      
      // If transition completed, finish the mode switch
      // Only complete if new mode is ready
      if (!transitionStillActive && this.pendingModeInfo) {
        // If mode isn't ready yet, wait a bit more or proceed anyway
        if (this.pendingMode) {
        this.hideTransitionIndicator();
          const modeToLoad = this.pendingModeInfo;
          // Don't clear pendingModeInfo here - let completeModeSwitch handle it
          // This ensures the pending mode check works correctly (pendingMode is checked against pendingModeInfo.id)
          this.completeModeSwitch(modeToLoad).catch((error) => {
            console.error('Error completing mode switch:', error);
            // Ensure transition is cleared even if completeModeSwitch fails
            this.transitionManager.cancel();
            this.updateNavigationButtons();
            if (this.animationId === null) {
              this.startAnimation();
            }
          });
          // Buttons will be updated in completeModeSwitch
        } else {
          // Transition completed but mode not ready - proceed anyway to avoid blocking
          console.warn('Transition completed but mode not ready, completing switch anyway');
          this.hideTransitionIndicator();
          const modeToLoad = this.pendingModeInfo;
          this.completeModeSwitch(modeToLoad).catch((error) => {
            console.error('Error completing mode switch:', error);
            this.transitionManager.cancel();
            this.updateNavigationButtons();
            if (this.animationId === null) {
              this.startAnimation();
            }
          });
        }
      }
    } else {
      // Hide transition indicator when not active
      this.hideTransitionIndicator();
      
      // Reverse playback is handled by negating time delta (above)
      // No need to restore state from history - just reverse time direction
      
      // Normal drawing mode
      // Check if current mode is the explicit Webcam mode - if so, don't layer (it handles its own rendering)
      const isWebcamMode = this.currentModeIndex >= 0 && this.sortedModes[this.currentModeIndex]
        ? this.sortedModes[this.currentModeIndex].id === 'u---webcam'
        : false;
      
      // For webcam in background position with blend modes, we need to draw animation first
      // then capture it for blending. Check if we need to do this.
      const webcamOptions = this.webcamCompositor?.getOptions();
      const needsAnimationForBlend = webcamOptions?.enabled && 
                                      webcamOptions?.position === 'background' && 
                                      webcamOptions?.blendMode !== 'normal' &&
                                      this.webcamService.getActive() && 
                                      !isWebcamMode;
      
      let animationTextureForBlend: THREE.Texture | null = null;
      let shouldSkipAnimationDraw = false;
      
      if (needsAnimationForBlend) {
        // Draw animation first to a render target so we can use it for webcam blend modes
        if (this.currentMode) {
          this.currentMode.draw(this.canvasWrapper, this.eyesy);
          // Flush to ensure objects are actually in the scene before capturing
          this.canvasWrapper.flush();
        }
        
        // Capture the animation frame by rendering to a render target
        // Use animation size (eyesy.xres/yres) for the render target
        animationTextureForBlend = this.canvasWrapper.renderToRenderTarget(this.eyesy.xres, this.eyesy.yres);
        
        if (!animationTextureForBlend) {
          console.warn('[App] Failed to capture animation frame for blend mode');
        } else {
        }
        
        // Clear the scene - we'll render webcam with blended animation, then animation on top
        // For background position with blend modes:
        // - Webcam blends with animation texture (webcam modified by animation via blend mode)
        // - Animation is drawn on top so it's visible
        // - The webcam shows through in areas where animation has transparency or via blend mode effects
        this.canvasWrapper.clear();
        shouldSkipAnimationDraw = false; // Draw animation on top so it's visible
      }

      // Render webcam layer if enabled and positioned as background
      if (this.webcamCompositor && this.webcamService.getActive() && !isWebcamMode) {
        const options = this.webcamCompositor.getOptions();
        if (options.enabled && options.position === 'background') {
          let bgTexture: THREE.Texture | null = null;
          
          if (options.blendMode !== 'normal' && animationTextureForBlend) {
            // Use the captured animation frame for blend modes
            bgTexture = animationTextureForBlend;
          } else {
            // For normal blend mode, just use background color texture for opacity support
            const bgColor = this.eyesy.bg_color;
            const bgColorData = new Uint8Array([
              Math.round(bgColor[0]),
              Math.round(bgColor[1]),
              Math.round(bgColor[2]),
              255 // Full alpha
            ]);
            bgTexture = new THREE.DataTexture(bgColorData, 1, 1, THREE.RGBAFormat);
            bgTexture.needsUpdate = true;
          }
          
          this.webcamCompositor.render(
            this.canvasWrapper.getScene(),
            null,
            this.eyesy.xres,
            this.eyesy.yres,
            bgTexture
          );
        }
      }

      // Apply web-only transforms (rotation, zoom, and position) before drawing
      if (this.eyesy.knob6 !== undefined) {
        const rotationDegrees = this.eyesy.knob6 * 360;
        this.canvasWrapper.setRotation(rotationDegrees);
      }
      if (this.eyesy.knob7 !== undefined) {
        this.canvasWrapper.setZoom(this.eyesy.knob7);
      }
      if (this.eyesy.knob9 !== undefined && this.eyesy.knob10 !== undefined) {
        this.canvasWrapper.setPosition(this.eyesy.knob9, this.eyesy.knob10);
      }

      // Draw current mode (skip if already drawn for blend mode)
      if (this.currentMode && !shouldSkipAnimationDraw) {
        try {
          this.currentMode.draw(this.canvasWrapper, this.eyesy);
        } catch (error) {
          console.error('Error in mode draw:', error);
          // Continue animation even if draw fails
        }
      }
      
      // IMPORTANT: Check if we need to start a transition
      // This happens AFTER drawing the current mode, so we can capture its frame
      const pendingTransition = (this as any)._pendingTransition;
      if (pendingTransition && !this.transitionManager.isActive() && this.currentMode) {
        try {
          // Flush to ensure current mode is fully rendered
          this.canvasWrapper.flush();
          
          // Capture the current frame NOW (while current mode is visible)
          this.canvasWrapper.captureFrame();
          const fromTexture = this.canvasWrapper.getLastFrameTexture();
          
          if (fromTexture) {
            
            // IMPORTANT: Set duration before starting transition
            this.transitionManager.setDuration(this.transitionDuration);
            
            // Start the transition
            this.transitionManager.startTransition(
              pendingTransition.fromModeInfo.id,
              pendingTransition.modeInfo.id,
              pendingTransition.fromModeInfo.category,
              pendingTransition.modeInfo.category,
              pendingTransition.fromModeInfo.name,
              pendingTransition.modeInfo.name,
              pendingTransition.transitionType
            );
            
            // Set the from frame immediately
            this.transitionManager.setFromFrame(fromTexture);
            
            // Clear the pending transition flag
            (this as any)._pendingTransition = null;
          } else {
            console.warn('Failed to capture frame for transition - getLastFrameTexture returned null');
            // Still start transition, but it won't have a from frame
            this.transitionManager.startTransition(
              pendingTransition.fromModeInfo.id,
              pendingTransition.modeInfo.id,
              pendingTransition.fromModeInfo.category,
              pendingTransition.modeInfo.category,
              pendingTransition.fromModeInfo.name,
              pendingTransition.modeInfo.name,
              pendingTransition.transitionType
            );
            (this as any)._pendingTransition = null;
          }
        } catch (error) {
          console.error('Error starting transition:', error);
          (this as any)._pendingTransition = null;
        }
      }
      
      // Clear trigger AFTER modes have had a chance to see it (creates momentary pulse)
      if (triggerWasSet) {
        this.eyesy.trig = false;
      }

      // Render webcam layer if enabled and positioned as foreground
      // Only render if webcam service is active and compositor is enabled
      // Check if current mode is the explicit Webcam mode - if so, don't layer (it handles its own rendering)
      if (this.webcamCompositor && this.webcamService.getActive() && !isWebcamMode) {
        const options = this.webcamCompositor.getOptions();
        if (options.enabled && options.position === 'foreground') {
          // IMPORTANT: Capture the current scene (animation) BEFORE adding webcam mesh
          // This ensures the background texture contains only the animation, not the webcam
          // Temporarily remove webcam mesh from scene if it exists
          const webcamMesh = this.webcamCompositor.getMesh();
          const wasInScene = webcamMesh && this.canvasWrapper.getScene().children.includes(webcamMesh);
          if (wasInScene && webcamMesh) {
            this.canvasWrapper.getScene().remove(webcamMesh);
          }
          
          // Capture the current scene (animation) as a texture for blend modes
          // Use getCurrentFrameTexture which captures the current scene state
          const backgroundTexture = this.canvasWrapper.getCurrentFrameTexture();
          
          // Use animation frame size (eyesy.xres/yres) instead of full canvas size
          this.webcamCompositor.render(
            this.canvasWrapper.getScene(),
            null,
            this.eyesy.xres,
            this.eyesy.yres,
            backgroundTexture
          );
          // Note: render() will add the mesh back to the scene if it wasn't already there
        }
      }
    }

    // Apply post-effects if enabled
    if (this.effectManager) {
      const allPostEffects = this.effectManager.getEffects('post');
      const enabledEffects = allPostEffects.filter(e => e.enabled && e.intensity > 0);
      const blendMix = this.effectManager.getBlendMix();
      
      if (enabledEffects.length > 0) {
        // Render scene to render target first (captures current frame before rendering to screen)
        const originalTexture = this.canvasWrapper.renderToRenderTarget();
        if (originalTexture) {
          // Apply effects to the frame texture
          const processedTexture = this.effectManager.applyPostEffects(originalTexture);
          if (processedTexture && processedTexture !== originalTexture) {
            // Effects modified the texture - blend with original if mix < 1.0
            if (blendMix < 1.0) {
              // Blend original and processed textures
              this.canvasWrapper.renderBlendedTextures(originalTexture, processedTexture, blendMix);
            } else {
              // Full effects - render processed texture directly
              this.canvasWrapper.renderTextureToScreen(processedTexture);
            }
          } else {
            // Effects didn't modify texture - render normally as fallback
            this.canvasWrapper.flush();
          }
        } else {
          // Failed to capture frame - render normally as fallback
          this.canvasWrapper.flush();
        }
      } else {
        // No effects enabled - render normally
        this.canvasWrapper.flush();
      }
    } else {
      // No effect manager - render normally
      this.canvasWrapper.flush();
    }

    // Capture frame at end (for transitions and feedback effects)
    this.canvasWrapper.captureFrame();

    // Note: Reverse playback is now handled BEFORE drawing (above) so the mode draws with restored state

    // Capture frame for rewind history (if not rewinding and not in transition)
    // RewindManager already has internal frame skipping via captureInterval
    // Note: captureFrame handles reverse playback internally (allows capture if history not full)
    if (!this.transitionManager.isActive() && !this.rewindManager.isCurrentlyRewinding()) {
      const currentModeId = this.currentModeIndex >= 0 && this.sortedModes[this.currentModeIndex] 
        ? this.sortedModes[this.currentModeIndex].id 
        : null;
      this.rewindManager.captureFrame(this.eyesy, currentModeId);
    }

    this.lastFrameTime = currentTime;
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Update webcam compositor based on current mode support
   */
  private updateWebcamCompositorForMode(modeInfo: ModeInfo): void {
    if (!this.webcamCompositor || !this.webcamService.getActive()) {
      // If webcam service is not active, disable compositor and enable checkbox
      if (this.webcamCompositor) {
        this.webcamCompositor.setOptions({ enabled: false });
      }
      const checkbox = document.getElementById('webcam-enabled') as HTMLInputElement;
      if (checkbox) {
        checkbox.disabled = false;
        checkbox.title = 'Enable webcam layering with animation';
      }
      return;
    }

    const supportsWebcam = modeInfo.supportsWebcam !== false; // Default to true
    
    // Update compositor enabled state
    const currentOptions = this.webcamCompositor.getOptions();
    this.webcamCompositor.setOptions({
      ...currentOptions,
      enabled: supportsWebcam && this.webcamService.getActive(),
    });

    // Update UI checkbox state
    const checkbox = document.getElementById('webcam-enabled') as HTMLInputElement;
    if (checkbox) {
      checkbox.disabled = !supportsWebcam;
      if (!supportsWebcam) {
        checkbox.title = `Webcam layering not supported for ${modeInfo.name}`;
      } else {
        checkbox.title = 'Enable webcam layering with animation';
      }
    }
  }

  private updateRewindUI(): void {
    const canRewind = this.rewindManager.canRewind();
    const canFastForward = this.rewindManager.canFastForward();
    const currentIndex = this.rewindManager.getCurrentIndex();
    const totalFrames = this.rewindManager.getHistorySize();
    this.controls.updateRewindState(canRewind, canFastForward, currentIndex, totalFrames, this.reversePlaybackEnabled);
  }

  /**
   * Reset all settings to default (except current mode)
   */
  private resetAllToDefault(): void {
    // Reset knobs to defaults
    this.eyesy.knob1 = 0.0;
    this.eyesy.knob2 = 0.0;
    this.eyesy.knob3 = 0.0;
    this.eyesy.knob4 = 0.0;
    this.eyesy.knob5 = 0.0;
    this.eyesy.knob6 = 0.0; // Rotation: 0°
    this.eyesy.knob7 = 0.5; // Zoom: 1.0x
    this.eyesy.knob8 = 0.45; // Speed: ~0.63x default
    this.eyesy.knob9 = 0.5; // X Position: center (0px)
    this.eyesy.knob10 = 0.5; // Y Position: center (0px)
    
    // Reset feature toggles
    this.eyesy.auto_clear = true;
    this.randomSequenceEnabled = false;
    this.randomSequenceFrequency = 0.1;
    this.randomColorEnabled = false;
    this.randomColorFrequency = 0.1;
    this.randomTriggerEnabled = false;
    this.randomTriggerFrequency = 0.5;
    this.mockAudioEnabled = false;
    this.mockAudioFrequency = 0.5;
    this.mockAudioIntensityRandomness = 0.0;
    
    // Reset microphone settings
    this.micGain = 1.0;
    this.useMicrophone = false;
    
    // Reset webcam compositor settings
    if (this.webcamCompositor) {
      this.webcamCompositor.setOptions({
        enabled: false,
        position: 'background',
        opacity: 1.0,
        blendMode: 'normal',
        chromaKeyEnabled: false,
        chromaKeyColor: [0, 255, 0], // Green
        chromaKeyTolerance: 0.3,
        chromaKeySmoothness: 0.1,
        scale: 1.0,
        positionX: 0.0,
        positionY: 0.0,
        rotation: 0.0,
        mirror: false,
      });
    }
    
    // Reset all effects
    if (this.effectManager) {
      this.effectManager.resetAllEffects('post');
      
      // Reset Color Grading options
      const colorGradingEffect = this.effectManager.getEffect('colorGrading', 'post') as any;
      if (colorGradingEffect && colorGradingEffect.setOptions) {
        colorGradingEffect.setOptions({
          brightness: 0.0,
          contrast: 0.0,
          saturation: 0.0,
          hue: 0.0,
        });
      }
    }
    
    // Reset performance settings
    this.targetFPS = 0; // Unlimited
    
    // Reset reverse playback
    this.reversePlaybackEnabled = false;
    
    // Reset font settings
    this.eyesy.font_family = 'Arial, sans-serif';
    this.eyesy.font_text = '';
    
    // Update UI - update all knobs individually
    for (let i = 1; i <= 8; i++) {
      const knobValue = (this.eyesy as any)[`knob${i}`];
      this.controls.updateKnobValue(i, knobValue);
      // Trigger input event to ensure callbacks are called
      const slider = document.getElementById(`knob${i}`) as HTMLInputElement;
      if (slider) {
        const inputEvent = new Event('input', { bubbles: true });
        slider.dispatchEvent(inputEvent);
      }
    }
    this.controls.updateAutoClear(this.eyesy.auto_clear);
    this.controls.updateRandomSequenceEnabled(this.randomSequenceEnabled);
    this.controls.updateRandomSequenceFrequency(this.randomSequenceFrequency);
    this.controls.updateRandomColorEnabled(this.randomColorEnabled);
    this.controls.updateRandomColorFrequency(this.randomColorFrequency);
    this.controls.updateRandomTriggerEnabled(this.randomTriggerEnabled);
    this.controls.updateRandomTriggerFrequency(this.randomTriggerFrequency);
    this.controls.updateMockAudioEnabled(this.mockAudioEnabled);
    this.controls.updateMockAudioFrequency(this.mockAudioFrequency);
    this.controls.updateMockAudioIntensityRandomness(this.mockAudioIntensityRandomness);
    this.controls.updateMicrophoneGain(this.micGain);
    this.controls.updateUseMicrophone(this.useMicrophone);
    this.controls.updateTargetFPS(this.targetFPS);
    this.controls.updateReversePlaybackState(this.reversePlaybackEnabled);
    
    // Update webcam UI
    if (this.webcamCompositor) {
      const options = this.webcamCompositor.getOptions();
      this.controls.updateWebcamEnabled(options.enabled);
      // Update webcam compositor UI elements
      const webcamPositionSelect = document.getElementById('webcam-position') as HTMLSelectElement;
      const webcamOpacitySlider = document.getElementById('webcam-opacity') as HTMLInputElement;
      const webcamOpacityValue = document.getElementById('webcam-opacity-value');
      const webcamBlendModeSelect = document.getElementById('webcam-blend-mode') as HTMLSelectElement;
      const webcamChromaKeyCheckbox = document.getElementById('webcam-chroma-key-enabled') as HTMLInputElement;
      const webcamScaleSlider = document.getElementById('webcam-scale') as HTMLInputElement;
      const webcamScaleValue = document.getElementById('webcam-scale-value');
      const webcamPositionXSlider = document.getElementById('webcam-position-x') as HTMLInputElement;
      const webcamPositionXValue = document.getElementById('webcam-position-x-value');
      const webcamPositionYSlider = document.getElementById('webcam-position-y') as HTMLInputElement;
      const webcamPositionYValue = document.getElementById('webcam-position-y-value');
      const webcamRotationSlider = document.getElementById('webcam-rotation') as HTMLInputElement;
      const webcamRotationValue = document.getElementById('webcam-rotation-value');
      const webcamMirrorCheckbox = document.getElementById('webcam-mirror') as HTMLInputElement;
      
      if (webcamPositionSelect) webcamPositionSelect.value = options.position;
      if (webcamOpacitySlider && webcamOpacityValue) {
        webcamOpacitySlider.value = (options.opacity * 100).toString();
        webcamOpacityValue.textContent = `${Math.round(options.opacity * 100)}%`;
      }
      if (webcamBlendModeSelect) webcamBlendModeSelect.value = options.blendMode;
      if (webcamChromaKeyCheckbox) webcamChromaKeyCheckbox.checked = options.chromaKeyEnabled;
      if (webcamScaleSlider && webcamScaleValue) {
        webcamScaleSlider.value = (options.scale * 100).toString();
        webcamScaleValue.textContent = `${Math.round(options.scale * 100)}%`;
      }
      if (webcamPositionXSlider && webcamPositionXValue) {
        webcamPositionXSlider.value = options.positionX.toString();
        webcamPositionXValue.textContent = options.positionX.toFixed(2);
      }
      if (webcamPositionYSlider && webcamPositionYValue) {
        webcamPositionYSlider.value = options.positionY.toString();
        webcamPositionYValue.textContent = options.positionY.toFixed(2);
      }
      if (webcamRotationSlider && webcamRotationValue) {
        webcamRotationSlider.value = options.rotation.toString();
        webcamRotationValue.textContent = `${Math.round(options.rotation)}°`;
      }
      if (webcamMirrorCheckbox) webcamMirrorCheckbox.checked = options.mirror;
    }
    
    // Update effects blend mix slider
    if (this.effectManager) {
      const blendMix = settings.effectsBlendMix !== undefined ? settings.effectsBlendMix : 1.0;
      this.effectManager.setBlendMix(blendMix);
      const blendMixSlider = document.getElementById('effects-blend-mix') as HTMLInputElement;
      const blendMixValue = document.getElementById('effects-blend-mix-value');
      const blendMixQuickSlider = document.getElementById('effects-blend-mix-quick') as HTMLInputElement;
      const blendMixQuickValue = document.getElementById('effects-blend-mix-value-quick');
      if (blendMixSlider) blendMixSlider.value = blendMix.toString();
      if (blendMixValue) blendMixValue.textContent = `${Math.round(blendMix * 100)}%`;
      if (blendMixQuickSlider) blendMixQuickSlider.value = blendMix.toString();
      if (blendMixQuickValue) blendMixQuickValue.textContent = `${Math.round(blendMix * 100)}%`;
    }
    
    // Update all effect UI elements
    if (this.effectManager) {
      this.effectManager.getPostEffects().forEach(effect => {
        const kebabName = effect.name.replace(/([A-Z])/g, '-$1').toLowerCase();
        const enabledCheckbox = document.getElementById(`effect-${kebabName}-enabled`) as HTMLInputElement;
        const intensitySlider = document.getElementById(`effect-${kebabName}-intensity`) as HTMLInputElement;
        const intensityValue = document.getElementById(`effect-${kebabName}-intensity-value`);
        const intensityValueContainer = intensityValue?.parentElement as HTMLElement;
        const resetBtn = document.querySelector(`button.effect-reset-btn[data-effect="${kebabName}"]`) as HTMLElement;
        
        if (enabledCheckbox) {
          enabledCheckbox.checked = effect.enabled;
          // Trigger change event to update slider visibility
          enabledCheckbox.dispatchEvent(new Event('change'));
        }
        if (intensitySlider && intensityValue) {
          intensitySlider.value = effect.intensity.toString();
          intensityValue.textContent = effect.intensity.toFixed(2);
        }
        
        // Explicitly hide/show controls based on enabled state
        if (!effect.enabled) {
          if (intensitySlider) {
            intensitySlider.style.display = 'none';
          }
          if (intensityValueContainer) {
            intensityValueContainer.style.display = 'none';
          }
          if (intensityValue) {
            intensityValue.style.display = 'none';
          }
          if (resetBtn) {
            resetBtn.style.display = 'none';
          }
        } else {
          if (intensitySlider) {
            intensitySlider.style.display = 'block';
          }
          if (intensityValueContainer) {
            intensityValueContainer.style.display = 'flex';
          }
          if (intensityValue) {
            intensityValue.style.display = 'inline';
          }
          if (resetBtn) {
            resetBtn.style.display = 'inline-block';
          }
        }
        
        // Update Color Grading sliders if it's the color grading effect
        if (effect.name === 'colorGrading') {
          const colorGradingEffect = effect as any;
          const brightnessSlider = document.getElementById('color-grading-brightness') as HTMLInputElement;
          const contrastSlider = document.getElementById('color-grading-contrast') as HTMLInputElement;
          const saturationSlider = document.getElementById('color-grading-saturation') as HTMLInputElement;
          const hueSlider = document.getElementById('color-grading-hue') as HTMLInputElement;
          
          if (brightnessSlider && colorGradingEffect.options) brightnessSlider.value = colorGradingEffect.options.brightness.toString();
          if (contrastSlider && colorGradingEffect.options) contrastSlider.value = colorGradingEffect.options.contrast.toString();
          if (saturationSlider && colorGradingEffect.options) saturationSlider.value = colorGradingEffect.options.saturation.toString();
          if (hueSlider && colorGradingEffect.options) hueSlider.value = colorGradingEffect.options.hue.toString();
        }
      });
    }
    
    // Update font UI elements
    const fontFamilySelect = document.getElementById('font-family') as HTMLSelectElement;
    const fontTextInput = document.getElementById('font-text') as HTMLInputElement;
    if (fontFamilySelect) fontFamilySelect.value = this.eyesy.font_family;
    if (fontTextInput) fontTextInput.value = this.eyesy.font_text;
    
    // Save settings
    this.debouncedSaveSettings();
    
    // Show confirmation
    this.updateStatus('All settings reset to default');
  }

  /**
   * Load settings from IndexedDB
   */
  private async loadSettings(): Promise<void> {
    try {
      const settings = await this.settingsStorage.loadSettings();
      if (settings) {
        // Load transition settings
        if (settings.transitionsEnabled !== undefined) {
          this.transitionsEnabled = settings.transitionsEnabled;
        }
        if (settings.transitionDuration !== undefined) {
          this.transitionDuration = settings.transitionDuration;
        }
        if (settings.transitionType !== undefined) {
          this.transitionType = settings.transitionType;
        }

        // Load knob values (will be applied after controls are set up)
        if (settings.knob1 !== undefined) this.eyesy.knob1 = settings.knob1;
        if (settings.knob2 !== undefined) this.eyesy.knob2 = settings.knob2;
        if (settings.knob3 !== undefined) this.eyesy.knob3 = settings.knob3;
        if (settings.knob4 !== undefined) this.eyesy.knob4 = settings.knob4;
        if (settings.knob5 !== undefined) this.eyesy.knob5 = settings.knob5;
        if (settings.knob6 !== undefined) this.eyesy.knob6 = settings.knob6;
        if (settings.knob7 !== undefined) this.eyesy.knob7 = settings.knob7;
        if (settings.knob8 !== undefined) this.eyesy.knob8 = settings.knob8;
        if (settings.knob9 !== undefined) this.eyesy.knob9 = settings.knob9;
        if (settings.knob10 !== undefined) this.eyesy.knob10 = settings.knob10;

        // Load feature toggles
        if (settings.autoClear !== undefined) {
          this.eyesy.auto_clear = settings.autoClear;
        }
        if (settings.randomSequenceEnabled !== undefined) {
          this.randomSequenceEnabled = settings.randomSequenceEnabled;
        }
        if (settings.randomSequenceFrequency !== undefined) {
          this.randomSequenceFrequency = settings.randomSequenceFrequency;
        }
        if (settings.randomColorEnabled !== undefined) {
          this.randomColorEnabled = settings.randomColorEnabled;
        }
        if (settings.randomColorFrequency !== undefined) {
          this.randomColorFrequency = settings.randomColorFrequency;
        }
        if (settings.randomTriggerEnabled !== undefined) {
          this.randomTriggerEnabled = settings.randomTriggerEnabled;
        }
        if (settings.randomTriggerFrequency !== undefined) {
          this.randomTriggerFrequency = settings.randomTriggerFrequency;
        }
        
        // Load knob lock states
        if (settings.knob1Locked !== undefined) {
          this.knob1Locked = settings.knob1Locked;
        }
        if (settings.knob2Locked !== undefined) {
          this.knob2Locked = settings.knob2Locked;
        }
        if (settings.knob3Locked !== undefined) {
          this.knob3Locked = settings.knob3Locked;
        }
        if (settings.knob4Locked !== undefined) {
          this.knob4Locked = settings.knob4Locked;
        }
        if (settings.knob5Locked !== undefined) {
          this.knob5Locked = settings.knob5Locked;
        }

        // Load UI settings
        if (settings.leftHanded !== undefined) {
          this.leftHanded = settings.leftHanded;
        }
        if (settings.portraitRotate !== undefined) {
          this.portraitRotate = settings.portraitRotate;
        }
        if (settings.favorites !== undefined) {
          this.favorites = settings.favorites;
        }
        if (settings.showOnlyFavorites !== undefined) {
          this.showOnlyFavorites = settings.showOnlyFavorites;
        }

        // Load font settings
        if (settings.fontFamily !== undefined) {
          this.eyesy.font_family = settings.fontFamily;
        }
        if (settings.fontText !== undefined) {
          this.eyesy.font_text = settings.fontText;
        }

        // Load microphone settings
        if (settings.micGain !== undefined && this.microphoneAudio) {
          this.microphoneAudio.setGain(settings.micGain);
        }
        if (settings.useMicrophone !== undefined) {
          this.useMicrophone = settings.useMicrophone;
        }

        // Load webcam permission state
        if (settings.webcamPermissionGranted !== undefined) {
          this.webcamPermissionGranted = settings.webcamPermissionGranted;
        }

        // Load target FPS
        if (settings.targetFPS !== undefined) {
          this.targetFPS = settings.targetFPS;
        }

        // Load effect settings
        if (settings.activeEffects && this.effectManager) {
          Object.entries(settings.activeEffects).forEach(([name, config]) => {
            const effect = this.effectManager!.getEffect(name, 'post');
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

        // Note: applyLoadedSettingsToUI is called after setupControls() in initializeApp()
        // to ensure controls are initialized before trying to update them
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      // Continue with defaults if loading fails
    }
  }

  /**
   * Apply loaded settings to UI controls
   */
  private applyLoadedSettingsToUI(settings: Partial<AppSettings>): void {
    // Update knob values in UI
    for (let i = 1; i <= 10; i++) {
      const knobValue = (settings as any)[`knob${i}`];
      if (knobValue !== undefined) {
        this.controls.updateKnobValue(i, knobValue);
      }
    }

    // Update transition settings
    this.controls.updateTransitionSettings(
      this.transitionsEnabled,
      this.transitionDuration,
      this.transitionType
    );

    // Update left-handed setting
    if (settings.leftHanded !== undefined) {
      this.controls.updateLeftHanded(settings.leftHanded);
    }

    // Update portrait rotate setting
    if (settings.portraitRotate !== undefined) {
      this.controls.updateCheckboxSetting('portrait-rotate', settings.portraitRotate);
      this.applyPortraitRotate(settings.portraitRotate);
    }
    
    // Update favorites settings (applied after modeBrowser is created in setupModeSelector)
    // Store the value here, it will be applied later
    if (settings.showOnlyFavorites !== undefined) {
      this.showOnlyFavorites = settings.showOnlyFavorites;
    }
    
    // Update knob lock states (ensure they're applied after controls are ready)
    if (settings.knob1Locked !== undefined) {
      this.knob1Locked = settings.knob1Locked;
      this.controls.updateKnobLock(1, this.knob1Locked);
    }
    if (settings.knob2Locked !== undefined) {
      this.knob2Locked = settings.knob2Locked;
      this.controls.updateKnobLock(2, this.knob2Locked);
    }
    if (settings.knob3Locked !== undefined) {
      this.knob3Locked = settings.knob3Locked;
      this.controls.updateKnobLock(3, this.knob3Locked);
    }
    if (settings.knob4Locked !== undefined) {
      this.knob4Locked = settings.knob4Locked;
      this.controls.updateKnobLock(4, this.knob4Locked);
    }
    if (settings.knob5Locked !== undefined) {
      this.knob5Locked = settings.knob5Locked;
      this.controls.updateKnobLock(5, this.knob5Locked);
    }
    
    // Update active effects UI
    if (settings.activeEffects && this.effectManager) {
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
          // Explicitly hide/show slider based on enabled state
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
    
    // Note: updateModeSelector() will be called after setupModeSelector() completes
    // to ensure modeSelector and modeBrowser are initialized

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
      // Initialize with current state if not in settings
      this.controls.updateAutoClear(this.eyesy.auto_clear);
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
      this.mockAudioEnabled = settings.mockAudioEnabled;
      this.controls.updateMockAudioEnabled(settings.mockAudioEnabled);
      if (settings.mockAudioFrequency !== undefined) {
        this.mockAudioFrequency = settings.mockAudioFrequency;
        this.controls.updateMockAudioFrequency(settings.mockAudioFrequency);
      }
      if (settings.mockAudioIntensityRandomness !== undefined) {
        this.mockAudioIntensityRandomness = settings.mockAudioIntensityRandomness;
        this.controls.updateMockAudioIntensityRandomness(settings.mockAudioIntensityRandomness);
      }
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
   * Debounced save settings (waits 500ms after last change)
   */
  private debouncedSaveSettings(): void {
    if (this.saveSettingsTimeout) {
      clearTimeout(this.saveSettingsTimeout);
    }
    this.saveSettingsTimeout = window.setTimeout(() => {
      this.saveSettings();
    }, 500);
  }

  /**
   * Get current effect settings for saving
   */
  private getEffectSettings(): { [effectName: string]: { enabled: boolean; intensity: number; [key: string]: any } } {
    const effectSettings: { [effectName: string]: { enabled: boolean; intensity: number; [key: string]: any } } = {};
    
    if (this.effectManager) {
      this.effectManager.getPostEffects().forEach(effect => {
        effectSettings[effect.name] = {
          enabled: effect.enabled,
          intensity: effect.intensity
        };
        
        // Save additional options for Color Grading
        if (effect.name === 'colorGrading' && (effect as any).options) {
          effectSettings[effect.name].options = (effect as any).options;
        }
      });
    }
    
    return effectSettings;
  }

  /**
   * Save current settings to IndexedDB
   */
  private async saveSettings(): Promise<void> {
    try {
      const settings: Partial<AppSettings> = {
        transitionsEnabled: this.transitionsEnabled,
        transitionDuration: this.transitionDuration,
        transitionType: this.transitionType,
        knob1: this.eyesy.knob1,
        knob2: this.eyesy.knob2,
        knob3: this.eyesy.knob3,
        knob4: this.eyesy.knob4,
        knob5: this.eyesy.knob5,
        knob6: this.eyesy.knob6 ?? 0,
        knob7: this.eyesy.knob7 ?? 0.5,
        knob8: this.eyesy.knob8 ?? 0.5,
        knob9: this.eyesy.knob9 ?? 0.5,
        knob10: this.eyesy.knob10 ?? 0.5,
        autoClear: this.eyesy.auto_clear,
        randomSequenceEnabled: this.randomSequenceEnabled,
        randomSequenceFrequency: this.randomSequenceFrequency,
        randomColorEnabled: this.randomColorEnabled,
        randomColorFrequency: this.randomColorFrequency,
        randomTriggerEnabled: this.randomTriggerEnabled,
        randomTriggerFrequency: this.randomTriggerFrequency,
        mockAudioEnabled: this.mockAudioEnabled,
        mockAudioFrequency: this.mockAudioFrequency,
        mockAudioIntensityRandomness: this.mockAudioIntensityRandomness,
        knob1Locked: this.knob1Locked,
        knob2Locked: this.knob2Locked,
        knob3Locked: this.knob3Locked,
        knob4Locked: this.knob4Locked,
        knob5Locked: this.knob5Locked,
        micGain: this.microphoneAudio?.getGain() ?? 5.0,
        useMicrophone: this.useMicrophone,
        webcamPermissionGranted: this.webcamPermissionGranted,
        leftHanded: this.leftHanded,
        portraitRotate: this.portraitRotate,
        favorites: this.favorites,
        showOnlyFavorites: this.showOnlyFavorites,
        targetFPS: this.targetFPS,
        activeEffects: this.effectManager ? this.getEffectSettings() : {},
        effectsBlendMix: this.effectManager?.getBlendMix() ?? 1.0,
      };
      await this.settingsStorage.saveSettings(settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
      // Don't throw - settings saving is non-critical
    }
  }
}

