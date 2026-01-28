import { BaseAnimatedMode } from '../base/BaseAnimatedMode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { WebcamService } from '../../core/WebcamService';
import * as THREE from 'three';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: [number, number, number];
  life: number;
  maxLife: number;
}

/**
 * Webcam Reactive Test Mode
 * Uses webcam motion detection as trigger/audio signal for visual reactivity
 * 
 * Knob1 - Motion sensitivity
 * Knob2 - Particle count / density
 * Knob3 - Particle size
 * Knob4 - Foreground color
 * Knob5 - Background color
 */
export class WebcamReactive extends BaseAnimatedMode {
  private webcamService: WebcamService;
  private unsubscribe: (() => void) | null = null;
  private currentFrame: { texture: THREE.Texture; video: HTMLVideoElement; width: number; height: number } | null = null;
  private previousFrameData: ImageData | null = null;
  private motionLevel = 0.0;
  private smoothedMotionLevel = 0.0;
  private particles: Particle[] = [];
  private lastTriggerState = false;
  private canvas2D: HTMLCanvasElement | null = null;
  private ctx2D: CanvasRenderingContext2D | null = null;

  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Get webcam service instance
    this.webcamService = WebcamService.getInstance();
    
    // Create 2D canvas for frame analysis
    this.canvas2D = document.createElement('canvas');
    this.canvas2D.width = 160; // Low res for performance
    this.canvas2D.height = 120;
    // Use willReadFrequently: true to optimize frequent getImageData calls
    this.ctx2D = this.canvas2D.getContext('2d', { willReadFrequently: true });
    
    // Try to start webcam if not already active (async, but don't wait)
    if (this.webcamService.isAvailable() && !this.webcamService.getActive()) {
      this.webcamService.start().catch((error) => {
        console.warn('WebcamReactive: Failed to start webcam service:', error);
      });
    }
    
    // Subscribe to webcam frame updates
    this.unsubscribe = this.webcamService.subscribe((frame) => {
      this.currentFrame = frame;
      this.analyzeMotion();
    });
    
    this.motionLevel = 0.0;
    this.smoothedMotionLevel = 0.0;
    this.particles = [];
    this.lastTriggerState = false;
    
    // Create initial particles so something is visible
    const initialCount = 20;
    for (let i = 0; i < initialCount; i++) {
      this.createParticles(eyesy, 1, 10, 0.1);
    }
  }

  protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    eyesy.color_picker_bg(eyesy.knob5);
    
    // Calculate parameters
    const motionSensitivity = eyesy.knob1 * 2.0 + 0.5; // 0.5-2.5x sensitivity
    const particleCount = Math.floor(eyesy.knob2 * 100 + 10); // 10-110 particles
    const baseSize = eyesy.knob3 * 20 + 5; // 5-25px
    
    // Smooth motion level
    this.smoothedMotionLevel = this.smoothedMotionLevel * 0.85 + this.motionLevel * 0.15;
    
    // Scale motion by sensitivity
    const scaledMotion = Math.min(1.0, this.smoothedMotionLevel * motionSensitivity);
    
    // Use motion as trigger (when motion exceeds threshold)
    const motionTrigger = scaledMotion > 0.2 && !this.lastTriggerState;
    this.lastTriggerState = scaledMotion > 0.2;
    
    // Create particles on motion trigger
    if (motionTrigger) {
      this.createParticles(eyesy, Math.min(particleCount, 20), baseSize, scaledMotion);
    }
    
    // Maintain minimum particle count (always have some particles visible)
    const minParticles = Math.floor(particleCount * 0.3); // At least 30% of target
    while (this.particles.length < minParticles) {
      this.createParticles(eyesy, Math.min(5, minParticles - this.particles.length), baseSize, Math.max(0.1, scaledMotion));
    }
    
    // Add more particles if motion is high
    if (scaledMotion > 0.1 && this.particles.length < particleCount) {
      const additionalCount = Math.floor((particleCount - this.particles.length) * scaledMotion);
      if (additionalCount > 0) {
        this.createParticles(eyesy, Math.min(additionalCount, 10), baseSize, scaledMotion);
      }
    }
    
    // Update and render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update physics
      particle.x += particle.vx * eyesy.deltaTime * 60;
      particle.y += particle.vy * eyesy.deltaTime * 60;
      
      // Apply motion-reactive forces
      const motionForce = scaledMotion * 50;
      particle.vx += (Math.random() - 0.5) * motionForce * eyesy.deltaTime;
      particle.vy += (Math.random() - 0.5) * motionForce * eyesy.deltaTime;
      
      // Friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // Bounce off walls
      if (particle.x < 0 || particle.x > eyesy.xres) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(eyesy.xres, particle.x));
      }
      if (particle.y < 0 || particle.y > eyesy.yres) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(eyesy.yres, particle.y));
      }
      
      // Update life
      particle.life -= eyesy.deltaTime * 60;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Render particle
      const lifeRatio = particle.life / particle.maxLife;
      const size = particle.size * lifeRatio;
      const color: [number, number, number] = [
        Math.floor(particle.color[0] * lifeRatio),
        Math.floor(particle.color[1] * lifeRatio),
        Math.floor(particle.color[2] * lifeRatio)
      ];
      
      canvas.circle([particle.x, particle.y], size, color, 0);
    }
    
    // Draw motion level indicator (optional debug visualization)
    if (scaledMotion > 0.01) {
      const indicatorWidth = scaledMotion * eyesy.xres * 0.3;
      const indicatorColor = eyesy.color_picker(eyesy.knob4);
      canvas.rect([eyesy.xres / 2 - indicatorWidth / 2, eyesy.yres - 10], [indicatorWidth, 4], indicatorColor, 0);
    }
  }

  private analyzeMotion(): void {
    if (!this.currentFrame || !this.ctx2D || !this.canvas2D) {
      this.motionLevel = 0.0;
      return;
    }
    
    try {
      // Check if video is ready
      if (this.currentFrame.video.readyState < 2) {
        // Video not ready yet
        this.motionLevel = 0.0;
        return;
      }
      
      // Draw current frame to 2D canvas for analysis
      this.ctx2D.drawImage(this.currentFrame.video, 0, 0, this.canvas2D.width, this.canvas2D.height);
      
      // Get image data
      const currentFrameData = this.ctx2D.getImageData(0, 0, this.canvas2D.width, this.canvas2D.height);
      
      if (this.previousFrameData && this.previousFrameData.data.length === currentFrameData.data.length) {
        // Compare frames to detect motion
        let totalDiff = 0;
        const pixelCount = currentFrameData.data.length / 4;
        
        // Sample pixels for performance (every 4th pixel)
        for (let i = 0; i < currentFrameData.data.length; i += 16) {
          const r = currentFrameData.data[i];
          const g = currentFrameData.data[i + 1];
          const b = currentFrameData.data[i + 2];
          
          const prevR = this.previousFrameData.data[i];
          const prevG = this.previousFrameData.data[i + 1];
          const prevB = this.previousFrameData.data[i + 2];
          
          // Calculate difference (Euclidean distance in RGB space)
          const diff = Math.sqrt(
            Math.pow(r - prevR, 2) +
            Math.pow(g - prevG, 2) +
            Math.pow(b - prevB, 2)
          );
          
          totalDiff += diff;
        }
        
        // Normalize motion level (0.0 to 1.0)
        // Adjust normalization for sampled pixels
        const sampledPixelCount = pixelCount / 4;
        const maxPossibleDiff = 255 * Math.sqrt(3) * sampledPixelCount;
        this.motionLevel = Math.min(1.0, totalDiff / maxPossibleDiff);
      } else {
        // First frame or size mismatch - no motion yet
        this.motionLevel = 0.0;
      }
      
      // Store current frame as previous for next comparison
      this.previousFrameData = currentFrameData;
    } catch (error) {
      // Silently handle errors (webcam might not be ready)
      this.motionLevel = 0.0;
    }
  }

  private createParticles(eyesy: EYESY, count: number, baseSize: number, motionLevel: number): void {
    const color = eyesy.color_picker(eyesy.knob4);
    
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        x: Math.random() * eyesy.xres,
        y: Math.random() * eyesy.yres,
        vx: (Math.random() - 0.5) * 200 * motionLevel,
        vy: (Math.random() - 0.5) * 200 * motionLevel,
        size: baseSize * (0.5 + Math.random() * 0.5),
        color: [color[0], color[1], color[2]],
        life: 2.0 + Math.random() * 3.0, // 2-5 seconds
        maxLife: 2.0 + Math.random() * 3.0
      };
      this.particles.push(particle);
    }
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.currentFrame = null;
    this.previousFrameData = null;
  }
}

