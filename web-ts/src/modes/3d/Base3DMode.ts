/**
 * Base class for 3D modes using Three.js
 * Provides 3D scene setup with perspective camera
 */
import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';
import { AudioReactivity } from '../utils/AudioReactivity';
import * as THREE from 'three';

/**
 * Base class for 3D modes that use Three.js 3D rendering
 * Handles camera setup, scene management, and audio reactivity
 */
export abstract class Base3DMode implements Mode {
  protected time: number = 0.0;
  protected audioReactivity: AudioReactivity;
  protected scene: THREE.Scene | null = null;
  protected camera: THREE.PerspectiveCamera | null = null;
  protected renderer: THREE.WebGLRenderer | null = null;
  protected objects: THREE.Object3D[] = [];
  private canvas: Canvas | null = null;
  private previousCamera: THREE.Camera | null = null;

  constructor() {
    this.audioReactivity = new AudioReactivity();
  }

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.audioReactivity.reset();
    this.canvas = canvas;
    
    // Get the Three.js scene and renderer from canvas
    this.scene = canvas.getScene();
    this.renderer = canvas.getRenderer();
    
    // Create perspective camera for 3D rendering
    const aspect = eyesy.xres / eyesy.yres;
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      aspect,
      0.1, // Near plane
      1000 // Far plane
    );
    this.camera.position.z = 5;
    
    // Clear any existing objects
    this.clearObjects();
    
    // Call mode-specific setup
    this.onSetup(canvas, eyesy);
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Restore previous camera if it was set (from previous frame)
    if (this.previousCamera !== null && this.canvas) {
      this.canvas.setCustomCamera(null);
      this.previousCamera = null;
    }
    
    // Update time
    if (eyesy.deltaTime < 0) {
      this.time = eyesy.time;
    } else {
      this.time += eyesy.deltaTime;
    }
    
    // Update audio reactivity
    const audioLevel = this.audioReactivity.update(eyesy);
    
    // Update camera based on resolution
    if (this.camera) {
      const aspect = eyesy.xres / eyesy.yres;
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
    
    // Set background color
    eyesy.color_picker_bg(eyesy.knob5);
    const bgColor = eyesy.bg_color;
    if (this.scene) {
      this.scene.background = new THREE.Color(
        bgColor[0] / 255,
        bgColor[1] / 255,
        bgColor[2] / 255
      );
    }
    
    // Set custom camera for 3D rendering (Canvas.flush() will use it)
    // Store previous camera so we can restore it next frame
    if (this.camera && this.canvas) {
      this.previousCamera = this.canvas.setCustomCamera(this.camera);
    }
    
    // Call mode-specific draw
    this.onDraw3D(canvas, eyesy, audioLevel);
    
    // Note: Canvas.flush() will render with the custom camera
    // Camera will be restored at the start of the next draw() call
  }

  dispose(): void {
    // Restore camera if still set
    if (this.canvas && this.previousCamera !== null) {
      this.canvas.setCustomCamera(null);
      this.previousCamera = null;
    }
    
    this.clearObjects();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
  }

  dispose(): void {
    this.clearObjects();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  protected clearObjects(): void {
    if (this.scene) {
      // Remove all objects we created
      this.objects.forEach(obj => {
        this.scene!.remove(obj);
        // Dispose of geometries and materials
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      this.objects = [];
    }
  }

  protected addObject(obj: THREE.Object3D): void {
    if (this.scene) {
      this.scene.add(obj);
      this.objects.push(obj);
    }
  }

  /**
   * Override this method for mode-specific setup
   */
  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Override in subclasses
  }

  /**
   * Override this method for mode-specific 3D drawing
   * @param audioLevel The current smoothed audio level (0.0 to 1.0)
   */
  protected abstract onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void;
}

