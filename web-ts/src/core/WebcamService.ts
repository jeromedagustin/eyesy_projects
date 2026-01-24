/**
 * Webcam Service - Centralized webcam access for multiple modes
 * Manages camera stream lifecycle and provides video texture to modes
 */
import * as THREE from 'three';

export interface WebcamOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  deviceId?: string;
}

export interface WebcamFrame {
  texture: THREE.Texture;
  video: HTMLVideoElement;
  width: number;
  height: number;
}

export class WebcamService {
  private static instance: WebcamService | null = null;
  private video: HTMLVideoElement | null = null;
  private videoStream: MediaStream | null = null;
  private videoTexture: THREE.Texture | null = null;
  private isActive = false;
  private isInitialized = false;
  private subscribers: Set<(frame: WebcamFrame | null) => void> = new Set();
  private options: WebcamOptions = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): WebcamService {
    if (!WebcamService.instance) {
      WebcamService.instance = new WebcamService();
    }
    return WebcamService.instance;
  }

  /**
   * Check if webcam is available
   */
  isAvailable(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if webcam is currently active
   */
  getActive(): boolean {
    return this.isActive;
  }

  /**
   * Initialize and start webcam stream
   */
  async start(options?: WebcamOptions): Promise<void> {
    if (this.isActive) {
      return; // Already active
    }

    if (!this.isAvailable()) {
      throw new Error('getUserMedia not available');
    }

    // Merge options
    if (options) {
      this.options = { ...this.options, ...options };
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.options.width || 640 },
          height: { ideal: this.options.height || 480 },
          facingMode: this.options.facingMode || 'user',
        },
      };

      // Add deviceId if specified
      if (this.options.deviceId) {
        (constraints.video as MediaTrackConstraints).deviceId = { exact: this.options.deviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoStream = stream;

      // Create video element
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true; // Required for autoplay

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.video) {
          reject(new Error('Video element not created'));
          return;
        }

        this.video.onloadedmetadata = () => {
          if (this.video) {
            this.video.play()
              .then(() => {
                this.isInitialized = true;
                this.isActive = true;
                this.createTexture();
                this.notifySubscribers();
                resolve();
              })
              .catch(reject);
          }
        };

        this.video.onerror = reject;

        // Timeout after 5 seconds
        setTimeout(() => {
          reject(new Error('Camera initialization timeout'));
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to start webcam:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop webcam stream
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    this.cleanup();
    this.notifySubscribers();
  }

  /**
   * Get current webcam frame
   */
  getFrame(): WebcamFrame | null {
    if (!this.isActive || !this.video || !this.videoTexture) {
      return null;
    }

    // Ensure video is playing
    if (this.video.paused || this.video.ended) {
      this.video.play().catch(err => {
        console.warn('WebcamService: Failed to play video:', err);
      });
    }

    // Check if video has valid dimensions
    const width = this.video.videoWidth || 0;
    const height = this.video.videoHeight || 0;
    if (width === 0 || height === 0) {
      // Video not ready yet
      return null;
    }

    // Update texture every frame for video
    this.videoTexture.needsUpdate = true;

    return {
      texture: this.videoTexture,
      video: this.video,
      width: width,
      height: height,
    };
  }

  /**
   * Subscribe to webcam frame updates
   * Callback is called whenever the webcam state changes
   */
  subscribe(callback: (frame: WebcamFrame | null) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately notify with current frame
    callback(this.getFrame());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get list of available camera devices
   */
  async getDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Switch to a different camera device
   */
  async switchDevice(deviceId: string): Promise<void> {
    const wasActive = this.isActive;
    if (wasActive) {
      this.stop();
    }

    this.options.deviceId = deviceId;

    if (wasActive) {
      await this.start();
    }
  }

  /**
   * Create Three.js texture from video element
   */
  private createTexture(): void {
    if (!this.video) {
      return;
    }

    // Dispose old texture if it exists
    if (this.videoTexture) {
      this.videoTexture.dispose();
    }

    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    // Use RGBAFormat for better compatibility (RGBFormat is deprecated)
    this.videoTexture.format = THREE.RGBAFormat;
    // Video textures need flipY = true because video elements have origin at top-left
    // while WebGL has origin at bottom-left
    this.videoTexture.flipY = true;
    // Video textures need continuous updates
    this.videoTexture.needsUpdate = true;
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    const frame = this.getFrame();
    this.subscribers.forEach(callback => {
      try {
        callback(frame);
      } catch (error) {
        console.error('Error in webcam subscriber callback:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.isActive = false;
    this.isInitialized = false;

    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stop();
    this.subscribers.clear();
  }
}


