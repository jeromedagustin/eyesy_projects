/**
 * Three.js Canvas wrapper - pygame-like API for drawing
 * Uses Three.js for WebGL management and rendering, ready for 3D extension
 */
import * as THREE from 'three';
import { ObjectPool } from './canvas/pooling';
import { isValidTexture } from './canvas/utils';
import * as DrawingHelpers from './canvas/drawing';
import * as TextureHelpers from './canvas/texture';
import * as RenderingHelpers from './canvas/rendering';
import * as FrameCaptureHelpers from './canvas/frameCapture';

export class Canvas {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private customCamera: THREE.Camera | null = null; // For 3D modes
  private width: number;
  private height: number;
  private objects: THREE.Object3D[] = [];
  private backgroundObject: THREE.Object3D | null = null;
  private foregroundGroup: THREE.Group;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private lastFrameTexture: THREE.Texture | null = null;
  private effectsRenderTarget: THREE.WebGLRenderTarget | null = null;
  private screenMesh: THREE.Mesh | null = null; // Reusable fullscreen quad for texture rendering
  private screenMaterial: THREE.MeshBasicMaterial | null = null; // Reusable material

  // Object pools for performance optimization
  private pool: ObjectPool = new ObjectPool();

  /**
   * Get or create a circle geometry from pool (delegates to ObjectPool)
   */
  private getCircleGeometry(radius: number, segments: number): THREE.CircleGeometry {
    return this.pool.getCircleGeometry(radius, segments);
  }

  /**
   * Return a circle geometry to the pool (delegates to ObjectPool)
   */
  private returnCircleGeometry(geometry: THREE.CircleGeometry, radius: number, segments: number): void {
    this.pool.returnCircleGeometry(geometry, radius, segments);
  }

  /**
   * Get or create a material from pool (delegates to ObjectPool)
   */
  private getMeshMaterial(color: [number, number, number]): THREE.MeshBasicMaterial {
    return this.pool.getMeshMaterial(color);
  }

  /**
   * Get or create a line material from pool (delegates to ObjectPool)
   */
  private getLineMaterial(color: [number, number, number], width: number): THREE.LineBasicMaterial {
    return this.pool.getLineMaterial(color, width);
  }

  /**
   * Validate that a texture is safe to use with WebGL
   * Returns false and logs details if invalid
   */
  private isValidTexture(texture: THREE.Texture | null | undefined, logDetails = false): boolean {
    return isValidTexture(texture, logDetails);
  }

  constructor(canvas: HTMLCanvasElement) {
    this.width = canvas.width;
    this.height = canvas.height;

    // Create Three.js WebGL renderer (uses WebGL under the hood)
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    
    // Set up WebGL error handling
    const gl = this.renderer.getContext();
    if (gl) {
      // Enable WebGL debug info if available
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        // WebGL debug extension available
      }
      
      // Override getError to catch issues early (but don't call it too often as it's slow)
      const originalGetError = gl.getError;
      gl.getError = function() {
        const error = originalGetError.call(gl);
        if (error !== gl.NO_ERROR) {
          // Log but don't spam - errors will be caught in render try-catch
        }
        return error;
      };
    }

    // Create 2D orthographic camera (pixel-perfect)
    this.camera = new THREE.OrthographicCamera(
      -this.width / 2,  // left
      this.width / 2,   // right
      this.height / 2,  // top
      -this.height / 2, // bottom
      0.1,              // near
      1000              // far
    );
    this.camera.position.z = 100;
    this.camera.lookAt(0, 0, 0);

    // Create scene
    this.scene = new THREE.Scene();
    
    // Create a group for foreground objects (can be rotated/zoomed)
    this.foregroundGroup = new THREE.Group();
    this.scene.add(this.foregroundGroup);
  }

  /**
   * Fill entire canvas with color
   */
  fill(color: [number, number, number]): void {
    DrawingHelpers.fill(
      this.getDrawingContext(),
      this.scene,
      this.backgroundObject,
      (obj) => { this.backgroundObject = obj; },
      () => this.clearObjects(),
      color
    );
  }

  /**
   * Draw a circle
   */
  circle(
    center: [number, number],
    radius: number,
    color: [number, number, number],
    width = 0
  ): void {
    DrawingHelpers.circle(this.getDrawingContext(), center, radius, color, width);
  }

  /**
   * Draw a line
   */
  line(
    start: [number, number],
    end: [number, number],
    color: [number, number, number],
    width = 1
  ): void {
    DrawingHelpers.line(this.getDrawingContext(), start, end, color, width);
  }

  /**
   * Draw multiple connected lines (polyline)
   */
  lines(
    points: [number, number][],
    color: [number, number, number],
    width = 1,
    closed = false
  ): void {
    DrawingHelpers.lines(this.getDrawingContext(), points, color, width, closed);
  }

  /**
   * Draw a rectangle
   */
  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number],
    width = 0
  ): void {
    DrawingHelpers.rect(this.getDrawingContext(), x, y, w, h, color, width);
  }

  /**
   * Draw an ellipse
   */
  ellipse(
    center: [number, number],
    radiusX: number,
    radiusY: number,
    color: [number, number, number],
    width = 0
  ): void {
    DrawingHelpers.ellipse(this.getDrawingContext(), center, radiusX, radiusY, color, width);
  }

  /**
   * Draw an arc (portion of a circle/ellipse)
   */
  arc(
    center: [number, number],
    radiusX: number,
    radiusY: number,
    startAngle: number,
    endAngle: number,
    color: [number, number, number],
    width = 1
  ): void {
    DrawingHelpers.arc(this.getDrawingContext(), center, radiusX, radiusY, startAngle, endAngle, color, width);
  }

  /**
   * Draw a polygon
   */
  polygon(
    points: [number, number][],
    color: [number, number, number],
    width = 0
  ): void {
    DrawingHelpers.polygon(this.getDrawingContext(), points, color, width);
  }

  /**
   * Draw a bezier curve (quadratic or cubic)
   * @param points Control points (3 for quadratic, 4 for cubic)
   * @param color Line color
   * @param width Line width
   * @param segments Number of segments for smooth curve (default: 20)
   */
  bezier(
    points: [number, number][],
    color: [number, number, number],
    width: number = 1,
    segments: number = 20
  ): void {
    DrawingHelpers.bezier(this.getDrawingContext(), points, color, width, segments);
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.clearObjects();
    this.renderer.clear();
  }

  /**
   * Clear all objects from scene
   */
  private clearObjects(): void {
    // Clean up invalid textures first
    this.cleanupInvalidTextures();
    
    this.objects.forEach(obj => {
      try {
        this.foregroundGroup.remove(obj);
        
        // Dispose geometry
        if ('geometry' in obj && obj.geometry instanceof THREE.BufferGeometry) {
          try {
            obj.geometry.dispose();
          } catch (e) {
            // Geometry may already be disposed
          }
        }
        
        // Dispose material(s) and their textures
        // NOTE: Pooled materials should NOT be disposed here - they're reused
        if ('material' in obj) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => {
            // Check if this is a pooled material
            const isPooled = this.pool.isPooledMaterial(mat);
            
            if (!isPooled) {
                // Only dispose non-pooled materials
                if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
                  try {
                    mat.map.dispose();
                  } catch (e) {
                    // Texture may already be disposed
                  }
                }
                if (mat instanceof THREE.Material) {
                  try {
                    mat.dispose();
                  } catch (e) {
                    // Material may already be disposed
                  }
                }
              }
            });
          } else if (obj.material instanceof THREE.MeshBasicMaterial) {
            // Check if this is a pooled material - don't dispose pooled materials
            const isPooled = this.pool.isPooledMaterial(obj.material);
            
            if (!isPooled) {
              // Only dispose non-pooled materials
              if (obj.material.map) {
                try {
                  obj.material.map.dispose();
                } catch (e) {
                  // Texture may already be disposed
                }
              }
              try {
                obj.material.dispose();
              } catch (e) {
                // Material may already be disposed
              }
            }
          } else if (obj.material instanceof THREE.LineBasicMaterial) {
            // Check if this is a pooled line material - don't dispose pooled materials
            const isPooled = this.pool.isPooledMaterial(obj.material);
            
            if (!isPooled) {
              try {
                obj.material.dispose();
              } catch (e) {
                // Material may already be disposed
              }
            }
          } else if (obj.material instanceof THREE.Material) {
            try {
              obj.material.dispose();
            } catch (e) {
              // Material may already be disposed
            }
          }
        }
      } catch (error) {
        console.warn('clearObjects: Error disposing object:', error);
      }
    });
    this.objects = [];
    
    // Final cleanup pass
    this.cleanupInvalidTextures();
  }

  /**
   * Dispose of resources (call when done with canvas)
   */
  public dispose(): void {
    this.clearObjects();
    
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    
    if (this.effectsRenderTarget) {
      this.effectsRenderTarget.dispose();
      this.effectsRenderTarget = null;
    }
    
    // Note: lastFrameTexture is owned by renderTarget, so it will be disposed with it
    this.lastFrameTexture = null;
    
    if (this.backgroundObject) {
      this.scene.remove(this.backgroundObject);
      if (this.backgroundObject instanceof THREE.Mesh) {
        this.backgroundObject.geometry.dispose();
        if (this.backgroundObject.material instanceof THREE.Material) {
          this.backgroundObject.material.dispose();
        }
      }
      this.backgroundObject = null;
    }
    
    // Dispose object pools
    this.pool.dispose();
    
    this.renderer.dispose();
  }

  /**
   * Set rotation of the foreground objects (web-only feature)
   * Background remains fixed
   * @param rotationDegrees Rotation in degrees (0-360)
   */
  setRotation(rotationDegrees: number): void {
    // Rotate only the foreground group around the center
    // Convert degrees to radians
    const rotationRadians = (rotationDegrees * Math.PI) / 180;
    this.foregroundGroup.rotation.z = rotationRadians;
  }

  /**
   * Set zoom level (web-only feature)
   * Only foreground objects zoom, background remains fixed
   * @param zoomLevel 0.5 = default (1.0x), 0.0 = zoom out (0.1x), 1.0 = zoom in (5.0x)
   */
  /**
   * Resize the canvas and update renderer/camera
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    // Update camera to match new size
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
    
    // Resize render targets
    if (this.renderTarget) {
      this.renderTarget.setSize(width, height);
    }
    if (this.effectsRenderTarget) {
      this.effectsRenderTarget.setSize(width, height);
    }
    
    // Update canvas element size
    if (this.renderer.domElement) {
      this.renderer.domElement.width = width;
      this.renderer.domElement.height = height;
    }
  }

  setZoom(zoomLevel: number): void {
    // Map 0.0-1.0 to 0.1-5.0 zoom range, with 0.5 = 1.0 (default)
    // Use exponential mapping for more intuitive control
    let scale: number;
    if (zoomLevel <= 0.5) {
      // 0.0 to 0.5 maps to 0.1 to 1.0 (zoom out)
      const t = zoomLevel / 0.5; // 0 to 1
      scale = 0.1 + (t * 0.9); // 0.1 to 1.0
    } else {
      // 0.5 to 1.0 maps to 1.0 to 5.0 (zoom in)
      const t = (zoomLevel - 0.5) / 0.5; // 0 to 1
      scale = 1.0 + (t * 4.0); // 1.0 to 5.0
    }
    // Scale only the foreground group, not the camera
    this.foregroundGroup.scale.set(scale, scale, 1);
  }

  /**
   * Set position offset (web-only feature)
   * Translates the foreground group
   * @param xOffset 0.5 = center (0), 0.0 = left (-max), 1.0 = right (+max)
   * @param yOffset 0.5 = center (0), 0.0 = top (-max), 1.0 = bottom (+max)
   */
  setPosition(xOffset: number, yOffset: number): void {
    // Map 0.0-1.0 to -max to +max, with 0.5 = 0 (center)
    // Use screen dimensions for max offset (allow up to 50% of screen size)
    const maxX = this.width * 0.5;
    const maxY = this.height * 0.5;
    
    // Convert 0.0-1.0 to -max to +max, with 0.5 = 0
    const x = (xOffset - 0.5) * 2 * maxX; // -maxX to +maxX
    const y = -(yOffset - 0.5) * 2 * maxY; // -maxY to +maxY (flip Y for Three.js)
    
    this.foregroundGroup.position.set(x, y, 0);
  }

  /**
   * Capture the current frame to a texture (for feedback/trails effects)
   */
  public captureFrame(): void {
    FrameCaptureHelpers.captureFrame(this.getFrameCaptureContext());
  }

  /**
   * Remove meshes with invalid textures from the scene
   * Returns true if any invalid textures were found and removed
   */
  private cleanupInvalidTextures(): boolean {
    const meshesToRemove: THREE.Mesh[] = [];
    let foundInvalid = false;
    
    // Check foreground group
    this.foregroundGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material;
        if (material instanceof THREE.MeshBasicMaterial && material.map) {
          if (!this.isValidTexture(material.map)) {
            console.warn('[Canvas] cleanupInvalidTextures: Found mesh with invalid texture, removing', {
              meshId: object.uuid,
              textureId: material.map.uuid,
              imageType: material.map.image?.constructor?.name,
              imageExists: !!material.map.image,
              imageWidth: material.map.image instanceof HTMLCanvasElement ? material.map.image.width : 
                         material.map.image instanceof HTMLImageElement ? material.map.image.naturalWidth :
                         material.map.image instanceof ImageBitmap ? material.map.image.width : 'N/A',
              imageHeight: material.map.image instanceof HTMLCanvasElement ? material.map.image.height : 
                          material.map.image instanceof HTMLImageElement ? material.map.image.naturalHeight :
                          material.map.image instanceof ImageBitmap ? material.map.image.height : 'N/A',
            });
            meshesToRemove.push(object);
            foundInvalid = true;
            // Clear the invalid texture from material to prevent WebGL error
            try {
              material.map.dispose();
            } catch (e) {
              console.warn('[Canvas] cleanupInvalidTextures: Error disposing texture:', e);
            }
            material.map = null;
          }
        }
      }
    });
    
    // Check background object
    if (this.backgroundObject instanceof THREE.Mesh) {
      const material = this.backgroundObject.material;
      if (material instanceof THREE.MeshBasicMaterial && material.map) {
        if (!this.isValidTexture(material.map)) {
          console.warn('cleanupInvalidTextures: Background has invalid texture, clearing');
          foundInvalid = true;
          // Clear the invalid texture from material to prevent WebGL error
          try {
            material.map.dispose();
          } catch (e) {
            // Texture may already be disposed
          }
          material.map = null;
        }
      }
    }
    
    // Remove invalid meshes
    meshesToRemove.forEach(mesh => {
      try {
        // Dispose resources
        if (mesh.geometry) {
          try {
            mesh.geometry.dispose();
          } catch (e) {
            // Geometry may already be disposed
          }
        }
        if (mesh.material) {
          if (mesh.material instanceof THREE.MeshBasicMaterial && mesh.material.map) {
            try {
              mesh.material.map.dispose();
            } catch (e) {
              // Texture may already be disposed
            }
          }
          try {
            mesh.material.dispose();
          } catch (e) {
            // Material may already be disposed
          }
        }
        // Remove from scene
        mesh.removeFromParent();
        // Remove from objects array
        const index = this.objects.indexOf(mesh);
        if (index > -1) {
          this.objects.splice(index, 1);
        }
      } catch (error) {
        console.warn('cleanupInvalidTextures: Error disposing mesh:', error);
      }
    });
    
    return foundInvalid;
  }

  /**
   * Get the last captured frame texture (for transitions)
   */
  public getLastFrameTexture(): THREE.Texture | null {
    return FrameCaptureHelpers.getLastFrameTexture(this.getFrameCaptureContext());
  }

  /**
   * Draw the previous frame as a texture (for trails/feedback effects)
   */
  public blitLastFrame(
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number,
    alpha: number = 1.0,
    flipX: boolean = false
  ): void {
    TextureHelpers.blitLastFrame(
      this.getTextureContext(),
      this.lastFrameTexture,
      x,
      y,
      width,
      height,
      alpha,
      flipX
    );
  }

  /**
   * Draw an image (blit) to the canvas
   */
  public blit(
    image: HTMLImageElement | ImageBitmap,
    x: number,
    y: number,
    width?: number,
    height?: number,
    alpha: number = 1.0,
    rotation: number = 0
  ): void {
    TextureHelpers.blit(this.getTextureContext(), image, x, y, width, height, alpha, rotation);
  }

  /**
   * Draw an image from a texture (for pre-loaded images)
   */
  public blitTexture(
    texture: THREE.Texture,
    x: number,
    y: number,
    width?: number,
    height?: number,
    alpha: number = 1.0,
    rotation: number = 0
  ): void {
    TextureHelpers.blitTexture(this.getTextureContext(), texture, x, y, width, height, alpha, rotation);
  }

  /**
   * Draw text using a pre-rendered texture (from FontRenderer)
   */
  public blitText(
    texture: THREE.Texture,
    x: number,
    y: number,
    centerX: boolean = false,
    centerY: boolean = false,
    alpha: number = 1.0
  ): void {
    TextureHelpers.blitText(this.getTextureContext(), texture, x, y, centerX, centerY, alpha);
  }

  /**
   * Force a render (useful for end of frame)
   * This should be called once per frame after all draw calls are complete
   */
  public flush(): void {
    RenderingHelpers.flush(this.getRenderingContext());
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  /**
   * Get the underlying WebGL renderer (for effects system and 3D modes)
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the underlying Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the current camera
   */
  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }

  /**
   * Set a custom camera for rendering (for 3D modes)
   * Returns the previous custom camera so it can be restored
   */
  setCustomCamera(customCamera: THREE.Camera | null): THREE.Camera | null {
    const previousCamera = this.customCamera;
    this.customCamera = customCamera;
    return previousCamera;
  }

  /**
   * Get the active camera (custom camera if set, otherwise default)
   */
  private getActiveCamera(): THREE.Camera {
    return this.customCamera || this.camera;
  }

  /**
   * Get the current rendered frame as a texture (for post-effects)
   * Renders the current scene to a texture and returns it
   */
  getCurrentFrameTexture(): THREE.Texture | null {
    return FrameCaptureHelpers.getCurrentFrameTexture(this.getFrameCaptureContext());
  }

  /**
   * Render scene to a render target (for effects processing)
   */
  renderToRenderTarget(targetWidth?: number, targetHeight?: number): THREE.Texture | null {
    return RenderingHelpers.renderToRenderTarget(this.getRenderingContext(), targetWidth, targetHeight);
  }

  /**
   * Render a texture to the canvas (for post-effects)
   */
  renderTexture(texture: THREE.Texture): void {
    RenderingHelpers.renderTexture(this.getRenderingContext(), () => this.clear(), texture);
  }

  /**
   * Render a texture directly to the screen (bypasses scene)
   */
  renderTextureToScreen(texture: THREE.Texture): void {
    RenderingHelpers.renderTextureToScreen(this.getRenderingContext(), texture);
  }

  /**
   * Blend two textures together and render to screen
   */
  renderBlendedTextures(originalTexture: THREE.Texture, processedTexture: THREE.Texture, mix: number): void {
    RenderingHelpers.renderBlendedTextures(this.getRenderingContext(), originalTexture, processedTexture, mix);
  }

  /**
   * Capture the current canvas as a data URL (for screenshots)
   */
  captureScreenshot(): string {
    return RenderingHelpers.captureScreenshot(this.getRenderingContext());
  }

  /**
   * Get drawing context for drawing helpers
   */
  private getDrawingContext(): DrawingHelpers.DrawingContext {
    return {
      width: this.width,
      height: this.height,
      foregroundGroup: this.foregroundGroup,
      objects: this.objects,
      pool: this.pool,
    };
  }

  /**
   * Get texture context for texture helpers
   */
  private getTextureContext(): TextureHelpers.TextureContext {
    return {
      width: this.width,
      height: this.height,
      foregroundGroup: this.foregroundGroup,
      objects: this.objects,
    };
  }

  /**
   * Get rendering context for rendering helpers
   */
  private getRenderingContext(): RenderingHelpers.RenderingContext {
    return {
      width: this.width,
      height: this.height,
      scene: this.scene,
      renderer: this.renderer,
      camera: this.camera,
      customCamera: this.customCamera,
      objects: this.objects,
      effectsRenderTarget: this.effectsRenderTarget,
      setEffectsRenderTarget: (target: THREE.WebGLRenderTarget | null) => {
        this.effectsRenderTarget = target;
      },
      cleanupInvalidTextures: () => this.cleanupInvalidTextures(),
    };
  }

  /**
   * Get frame capture context for frame capture helpers
   */
  private getFrameCaptureContext(): FrameCaptureHelpers.FrameCaptureContext {
    return {
      width: this.width,
      height: this.height,
      scene: this.scene,
      renderer: this.renderer,
      camera: this.camera,
      foregroundGroup: this.foregroundGroup,
      renderTarget: this.renderTarget,
      setRenderTarget: (target: THREE.WebGLRenderTarget | null) => {
        this.renderTarget = target;
      },
      lastFrameTexture: this.lastFrameTexture,
      setLastFrameTexture: (texture: THREE.Texture | null) => {
        this.lastFrameTexture = texture;
      },
      cleanupInvalidTextures: () => this.cleanupInvalidTextures(),
      isValidTexture: (texture: THREE.Texture | null | undefined, logDetails?: boolean) => 
        this.isValidTexture(texture, logDetails),
    };
  }
}
