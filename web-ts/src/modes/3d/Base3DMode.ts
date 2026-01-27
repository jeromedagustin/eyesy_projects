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
  private lookAtPoint: THREE.Vector3 = new THREE.Vector3(0, 0, 0); // Default look-at point
  private baseCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 5); // Base camera position from setup
  private baseCameraDistance: number = 5.0; // Base distance from look-at point
  private setupTime: number = 0; // Time when mode was set up (for transition detection)
  private isInTransition: boolean = false; // Whether we're currently transitioning

  constructor() {
    this.audioReactivity = new AudioReactivity();
  }

  setup(canvas: Canvas, eyesy: EYESY): void {
    this.time = 0.0;
    this.audioReactivity.reset();
    this.canvas = canvas;
    this.setupTime = eyesy.time || performance.now() / 1000;
    this.isInTransition = true; // Assume we're transitioning when mode is set up
    
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
    this.lookAtPoint.set(0, 0, 0);
    
    // Clear any existing objects
    this.clearObjects();
    
    // Call mode-specific setup
    this.onSetup(canvas, eyesy);
    
    // Store base camera position and distance after setup
    // (mode may have changed camera position in onSetup)
    if (this.camera) {
      this.baseCameraPosition.copy(this.camera.position);
      this.baseCameraDistance = this.camera.position.distanceTo(this.lookAtPoint);
      
      // Ensure base distance is valid
      if (!isFinite(this.baseCameraDistance) || this.baseCameraDistance < 0.1) {
        // Fallback to default if invalid
        this.baseCameraDistance = 5.0;
        this.baseCameraPosition.set(0, 0, 5);
        this.camera.position.copy(this.baseCameraPosition);
        this.camera.lookAt(this.lookAtPoint);
      }
    }
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Force auto_clear to true for 3D modes (Paint Mode not supported)
    if (!eyesy.auto_clear) {
      eyesy.auto_clear = true;
    }
    
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
    // Note: Paint Mode (auto_clear = false) is not supported for 3D modes
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
    
    // Call mode-specific draw (mode may set camera position)
    this.onDraw3D(canvas, eyesy, audioLevel);
    
    // Apply rotation and zoom AFTER mode's draw()
    // Always apply the logic to ensure consistent camera positioning, even at defaults
    if (this.camera && this.baseCameraDistance > 0.001) {
      const currentPosition = this.camera.position.clone();
      
      // Check if we're in a transition (first 0.6 seconds after setup)
      const timeSinceSetup = this.time - (this.setupTime || 0);
      const transitionDuration = 0.6; // Match transition duration
      const inTransition = this.isInTransition && timeSinceSetup < transitionDuration;
      
      // If transition is complete, mark it as done
      if (this.isInTransition && timeSinceSetup >= transitionDuration) {
        this.isInTransition = false;
      }
      
      // During transition, smoothly interpolate zoom/rotation to defaults
      // This prevents jarring jumps when switching between 3D modes with different zoom levels
      let effectiveKnob6 = eyesy.knob6 !== undefined ? eyesy.knob6 : 0.0;
      let effectiveKnob7 = eyesy.knob7 !== undefined ? eyesy.knob7 : 0.5;
      
      if (inTransition) {
        const transitionProgress = Math.min(1.0, timeSinceSetup / transitionDuration);
        // Smooth easing function (ease-out cubic)
        const easedProgress = 1.0 - Math.pow(1.0 - transitionProgress, 3);
        
        // Interpolate zoom to default (0.5 = 1.0x zoom)
        if (eyesy.knob7 !== undefined) {
          effectiveKnob7 = 0.5 + (eyesy.knob7 - 0.5) * (1.0 - easedProgress);
        }
        
        // Interpolate rotation to default (0.0 = no rotation)
        if (eyesy.knob6 !== undefined) {
          effectiveKnob6 = eyesy.knob6 * (1.0 - easedProgress);
        }
      }
      
      // Calculate zoom scale
      // Inverted: lower knob value = zoom in (camera closer), higher knob value = zoom out (camera farther)
      // Default knob7 = 0.5 should give zoomScale = 1.0
      // Use a more reasonable range: 0.5x to 2.0x with smooth exponential curve
      let zoomScale = 1.0;
      if (effectiveKnob7 !== undefined) {
        // Invert the knob value for intuitive control
        const invertedKnob = 1.0 - effectiveKnob7;
        
        // Use exponential curve for smoother control
        // Map 0.0-1.0 to 0.5-2.0 zoom range, with 0.5 = 1.0 (default)
        // Exponential: more control in the middle range, less extreme at edges
        const normalized = invertedKnob; // 0.0 to 1.0
        
        // Exponential curve: ln(0.5) = -0.693, ln(2.0) = 0.693
        // Map normalized (0.0 to 1.0) to expValue (-0.693 to 0.693)
        const expValue = (normalized - 0.5) * 2 * 0.693; // -0.693 to 0.693
        zoomScale = Math.exp(expValue); // e^(-0.693) = 0.5, e^(0) = 1.0, e^(0.693) = 2.0
        
        // Clamp to reasonable bounds (shouldn't be needed with correct calculation, but safety check)
        zoomScale = Math.max(0.5, Math.min(2.0, zoomScale));
      }
      
      // Check if we need to apply rotation
      const hasRotation = effectiveKnob6 !== undefined && Math.abs(effectiveKnob6) > 0.001;
      
      // At default zoom (1.0) with no rotation, use mode's camera position directly
      // This avoids unnecessary calculations and floating point errors
      if (Math.abs(zoomScale - 1.0) < 0.001 && !hasRotation) {
        // Just ensure camera looks at look-at point
        // Mode's camera position is already set correctly in onDraw3D()
        this.camera.lookAt(this.lookAtPoint);
      } else {
        // Calculate what the base position would be with rotation/zoom applied
        let transformedBasePosition = this.baseCameraPosition.clone();
        let transformedBaseDistance = this.baseCameraDistance * zoomScale;
        
        // Clamp distance to reasonable bounds (avoid going too close or too far)
        // Use a minimum that's a percentage of base distance to prevent going inside geometry
        // With new zoom range (0.5x to 2.0x), we can use tighter, more reasonable bounds
        const minDistance = Math.max(0.3, this.baseCameraDistance * 0.3); // At least 0.3, or 30% of base distance
        const maxDistance = Math.min(200, this.baseCameraDistance * 3); // At most 200, or 3x base distance
        transformedBaseDistance = Math.max(minDistance, Math.min(maxDistance, transformedBaseDistance));
      
      // Apply rotation to base position
      if (hasRotation) {
        const rotationDegrees = effectiveKnob6! * 360;
        const rotationRadians = (rotationDegrees * Math.PI) / 180;
        
        // Get direction from look-at point to base camera position
        const baseDirection = new THREE.Vector3().subVectors(this.baseCameraPosition, this.lookAtPoint);
        const baseDirLength = baseDirection.length();
        
        if (baseDirLength > 0.001) {
          const normalizedBaseDir = baseDirection.normalize();
          
          // Convert to spherical coordinates (Y-up)
          const theta = Math.atan2(normalizedBaseDir.x, normalizedBaseDir.z);
          const phi = Math.acos(Math.max(-1, Math.min(1, normalizedBaseDir.y)));
          
          // Apply rotation to azimuth
          const newTheta = theta + rotationRadians;
          
          // Convert back to cartesian
          const sinPhi = Math.sin(phi);
          transformedBasePosition = new THREE.Vector3(
            Math.sin(newTheta) * sinPhi * transformedBaseDistance,
            Math.cos(phi) * transformedBaseDistance,
            Math.cos(newTheta) * sinPhi * transformedBaseDistance
          ).add(this.lookAtPoint);
        }
      } else {
        // No rotation, just apply zoom
        const baseDirection = new THREE.Vector3().subVectors(this.baseCameraPosition, this.lookAtPoint);
        const baseDirLength = baseDirection.length();
        
        if (baseDirLength > 0.001) {
          const normalizedBaseDir = baseDirection.normalize();
          transformedBasePosition = normalizedBaseDir.multiplyScalar(transformedBaseDistance).add(this.lookAtPoint);
        }
      }
      
      // Calculate the offset from base that the mode applied
      // This preserves the mode's relative camera movement
      const baseOffset = new THREE.Vector3().subVectors(currentPosition, this.baseCameraPosition);
      
      // Apply the offset to the transformed base position
      // Scale the offset by the zoom factor to maintain relative positioning
      const scaledOffset = baseOffset.multiplyScalar(zoomScale);
      let finalPosition = transformedBasePosition.clone().add(scaledOffset);
      
        // Ensure final distance is within bounds
        const finalDistance = finalPosition.distanceTo(this.lookAtPoint);
        const safeMinDistance = Math.max(0.3, this.baseCameraDistance * 0.3);
        const safeMaxDistance = Math.min(200, this.baseCameraDistance * 3);
        
        if (finalDistance < safeMinDistance || finalDistance > safeMaxDistance || !isFinite(finalDistance)) {
          // Clamp to bounds while preserving direction
          const direction = new THREE.Vector3().subVectors(finalPosition, this.lookAtPoint);
          const dirLength = direction.length();
          
          if (dirLength > 0.001 && isFinite(dirLength)) {
            const normalizedDir = direction.normalize();
            const clampedDistance = Math.max(safeMinDistance, Math.min(safeMaxDistance, finalDistance));
            finalPosition = normalizedDir.multiplyScalar(clampedDistance).add(this.lookAtPoint);
          } else {
            // Fallback: use transformed base position if direction is invalid
            finalPosition = transformedBasePosition.clone();
          }
        }
        
        // Validate final position before setting
        if (finalPosition && 
            isFinite(finalPosition.x) && isFinite(finalPosition.y) && isFinite(finalPosition.z) &&
            finalPosition.distanceTo(this.lookAtPoint) >= safeMinDistance) {
          this.camera.position.copy(finalPosition);
          this.camera.lookAt(this.lookAtPoint);
        } else {
          // Safety fallback: reset to base position if something went wrong
          this.camera.position.copy(this.baseCameraPosition);
          this.camera.lookAt(this.lookAtPoint);
        }
      }
    } else if (this.camera) {
      // At default settings, just ensure camera looks at look-at point
      // (mode's camera position is already set correctly)
      this.camera.lookAt(this.lookAtPoint);
    }
    
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

