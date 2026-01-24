import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { WebcamService } from '../../core/WebcamService';
import * as THREE from 'three';

/**
 * U - Webcam
 * Ported from Python version
 * 
 * Knob1 - Controls the size of the webcam image (0.1 to 1.0 of screen)
 * Knob2 - Controls how reactive the webcam is to audio/MIDI data (position, scale, rotation)
 * Knob3 - Adds distortion effects to the video (pixelation, waves, etc.)
 * Knob4 - Changes the colors of the video (color effects/masking)
 * Knob5 - Controls background color
 * Trigger - Applies color effects and distortion
 * 
 * Uses Web API getUserMedia() for camera access
 */
export class Webcam implements Mode {
  private webcamService: WebcamService;
  private unsubscribe: (() => void) | null = null;
  private currentFrame: { texture: THREE.Texture; video: HTMLVideoElement; width: number; height: number } | null = null;
  private prevAudioReactivity = 0.0;
  private distortionTime = 0.0;
  private triggers = 0;
  private staticFallback: HTMLImageElement | null = null;

  async setup(_canvas: Canvas, eyesy: EYESY): Promise<void> {
    // Get webcam service instance
    this.webcamService = WebcamService.getInstance();
    
    // Try to start webcam if not already active
    try {
      if (this.webcamService.isAvailable() && !this.webcamService.getActive()) {
        await this.webcamService.start();
      }
    } catch (error) {
      console.warn('Webcam: Failed to start webcam service:', error);
    }
    
    // Subscribe to webcam frame updates
    this.unsubscribe = this.webcamService.subscribe((frame) => {
      this.currentFrame = frame;
    });
    
    // Set up static fallback image
    try {
      // Try to load a fallback image if camera fails
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.src = `${eyesy.mode_root}/no_camera.png`;
      fallbackImg.onload = () => {
        this.staticFallback = fallbackImg;
      };
      fallbackImg.onerror = () => {
        // Create a gray placeholder if image doesn't exist
        this.createPlaceholderImage();
      };
    } catch (error) {
      this.createPlaceholderImage();
    }
  }

  private createPlaceholderImage(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No Camera', canvas.width / 2, canvas.height / 2);
      const img = new Image();
      img.src = canvas.toDataURL();
      this.staticFallback = img;
    }
  }


  draw(canvas: Canvas, eyesy: EYESY): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Get the current frame directly from service (more reliable than subscription)
    // This ensures we get the latest frame every draw call
    const frame = this.webcamService.getFrame();
    
    // Get the current frame (either from webcam service or static fallback)
    let frameTexture: THREE.Texture | null = null;
    let frameWidth = 640;
    let frameHeight = 480;

    if (frame && frame.texture) {
      // Use webcam frame - ensure texture is updated
      frameTexture = frame.texture;
      frameTexture.needsUpdate = true; // Force update every frame for video
      frameWidth = frame.width;
      frameHeight = frame.height;
    } else if (this.staticFallback) {
      // Use static fallback
      const fallbackTexture = new THREE.Texture(this.staticFallback);
      fallbackTexture.needsUpdate = true;
      fallbackTexture.flipY = false;
      frameTexture = fallbackTexture;
      frameWidth = this.staticFallback.width;
      frameHeight = this.staticFallback.height;
    } else {
      // No frame available, skip drawing
      return;
    }

    if (!frameTexture) {
      return;
    }

    // Knob 4: Color effects/masking
    // For now, we'll apply color tinting (full color manipulation would require shaders)
    // Color from knob4 can be used for overlays or effects in future
    const _colorTint = eyesy.color_picker_lfo(eyesy.knob4);
    
    // Knob 1: Base size of the webcam image (0.1 to 1.0 of screen)
    const baseSizeScale = 0.1 + eyesy.knob1 * 0.9;
    
    // Knob 2: Audio/MIDI reactivity
    const reactivity = eyesy.knob2;
    
    // Calculate audio reactivity
    let audioReactivity = 0.0;
    if (eyesy.audio_in.length > 0) {
      const audioSum = eyesy.audio_in.slice(0, Math.min(100, eyesy.audio_in.length))
        .reduce((sum, sample) => sum + Math.abs(sample), 0);
      const audioAvg = audioSum / (32768.0 * Math.min(100, eyesy.audio_in.length));
      // Smooth the reactivity with a simple low-pass filter
      audioReactivity = (audioAvg * 0.7 + this.prevAudioReactivity * 0.3) * reactivity;
      this.prevAudioReactivity = audioReactivity;
    }

    // Handle trigger
    const audioTrigger = eyesy.audio_trig || eyesy.trig || eyesy.midi_note_new;
    if (audioTrigger) {
      this.triggers += 1;
    }

    // Apply audio reactivity to scale and position
    const reactiveScale = baseSizeScale * (1.0 + audioReactivity * 0.5);
    const reactiveRotation = audioReactivity * 360 * reactivity;
    
    // Center position with audio-reactive offset
    const centerX = eyesy.xres / 2;
    const centerY = eyesy.yres / 2;
    
    // Audio affects position (bounce effect)
    const offsetX = Math.floor(audioReactivity * eyesy.xres * 0.1 * Math.sin(eyesy.time * 2));
    const offsetY = Math.floor(audioReactivity * eyesy.yres * 0.1 * Math.cos(eyesy.time * 2));
    
    // Knob 3: Distortion effects
    const distortionAmount = eyesy.knob3;
    this.distortionTime += 0.05 * (eyesy.deltaTime * 60); // Frame-rate independent
    
    // Calculate final scale
    const finalScale = reactiveScale * (eyesy.xres / frameWidth);
    
    // Apply distortion if knob 3 is turned up
    let finalWidth = frameWidth * finalScale;
    let finalHeight = frameHeight * finalScale;
    let finalRotation = reactiveRotation;
    
    if (distortionAmount > 0.05) {
      if (distortionAmount < 0.5) {
        // Pixelation distortion (0.05 to 0.5)
        const pixelSize = Math.max(1, Math.floor(1 + (distortionAmount * 0.45) * 20));
        finalWidth = Math.max(1, Math.floor(finalWidth / pixelSize)) * pixelSize;
        finalHeight = Math.max(1, Math.floor(finalHeight / pixelSize)) * pixelSize;
      } else {
        // Wave/ripple distortion (0.5 to 1.0)
        const waveAmount = (distortionAmount - 0.5) * 2.0;
        const waveRotation = waveAmount * 5 * Math.sin(this.distortionTime * 0.5);
        finalRotation += waveRotation;
        const waveScale = 1.0 + waveAmount * 0.1 * Math.sin(this.distortionTime);
        finalWidth = Math.floor(finalWidth * waveScale);
        finalHeight = Math.floor(finalHeight * waveScale);
      }
    }
    
    // Calculate centered position with audio-reactive offset
    const x = Math.floor(centerX - finalWidth / 2 + offsetX);
    const y = Math.floor(centerY - finalHeight / 2 + offsetY);
    
    // Draw the webcam feed with transformations
    // Note: Color tinting would require shader manipulation, so we'll draw as-is for now
    canvas.blitTexture(frameTexture, x, y, finalWidth, finalHeight, 1.0, finalRotation);
  }

  dispose(): void {
    // Unsubscribe from webcam service
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // Note: We don't stop the webcam service here because other modes might be using it
    // The service will be cleaned up when the app closes
  }
}
