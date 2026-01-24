/**
 * Three.js Canvas wrapper - pygame-like API for drawing
 * Uses Three.js for WebGL management and rendering, ready for 3D extension
 */
import * as THREE from 'three';

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

  /**
   * Validate that a texture is safe to use with WebGL
   * Returns false and logs details if invalid
   */
  private isValidTexture(texture: THREE.Texture | null | undefined, logDetails = false): boolean {
    if (!texture) {
      if (logDetails) console.log('[Canvas] isValidTexture: texture is null/undefined');
      return false;
    }
    
    // Check if texture is disposed (check for uuid which should always exist)
    if ((texture as any).uuid === undefined) {
      if (logDetails) console.log('[Canvas] isValidTexture: texture has no uuid (disposed?)', texture);
      return false;
    }
    
    // Check if texture has an image
    if (!texture.image) {
      if (logDetails) console.log('[Canvas] isValidTexture: texture has no image', { textureId: texture.uuid });
      return false;
    }
    
    // Validate canvas dimensions
    if (texture.image instanceof HTMLCanvasElement) {
      if (!Number.isFinite(texture.image.width) || !Number.isFinite(texture.image.height)) return false;
      if (texture.image.width === 0 || texture.image.height === 0) return false;
      // Ensure canvas has valid context
      const ctx = texture.image.getContext('2d');
      if (!ctx) return false;
      // Check if canvas is actually valid (not corrupted)
      try {
        const testData = ctx.getImageData(0, 0, 1, 1);
        if (!testData) return false;
      } catch (e) {
        return false;
      }
    }
    
    // Validate image element
    if (texture.image instanceof HTMLImageElement) {
      if (!texture.image.complete) return false;
      if (!Number.isFinite(texture.image.naturalWidth) || !Number.isFinite(texture.image.naturalHeight)) return false;
      if (texture.image.naturalWidth === 0 || texture.image.naturalHeight === 0) return false;
    }
    
    // Validate ImageBitmap
    if (texture.image instanceof ImageBitmap) {
      if (!Number.isFinite(texture.image.width) || !Number.isFinite(texture.image.height)) return false;
      if (texture.image.width === 0 || texture.image.height === 0) return false;
      // Check if ImageBitmap is closed
      if ((texture.image as any).closed) return false;
    }
    
    // Reject any image type that's not one of the supported types
    // WebGL only supports HTMLImageElement, HTMLCanvasElement, ImageBitmap, HTMLVideoElement
    // BUT: Render target textures are special - they don't have a standard image property
    // Check if this is a render target texture by checking if it's from a WebGLRenderTarget
    const isRenderTargetTexture = (texture as any).isRenderTargetTexture === true ||
                                   (texture.image && texture.image.constructor?.name === 'WebGLRenderTarget') ||
                                   // Render target textures often don't have an image property at all
                                   (!texture.image && texture.source && (texture.source as any).data);
    
    // For render target textures, we just need to check they have valid dimensions
    if (isRenderTargetTexture) {
      // Render target textures are valid if they have width/height properties
      const rtWidth = (texture as any).image?.width || (texture.source as any)?.data?.width || 0;
      const rtHeight = (texture as any).image?.height || (texture.source as any)?.data?.height || 0;
      if (rtWidth > 0 && rtHeight > 0 && rtWidth <= 16384 && rtHeight <= 16384) {
        return true; // Render target texture is valid
      }
      if (logDetails) {
        console.warn('[Canvas] isValidTexture: Render target texture has invalid dimensions', {
          width: rtWidth,
          height: rtHeight,
          textureId: texture.uuid
        });
      }
      return false;
    }
    
    if (!(texture.image instanceof HTMLCanvasElement) &&
        !(texture.image instanceof HTMLImageElement) &&
        !(texture.image instanceof ImageBitmap) &&
        !(texture.image instanceof HTMLVideoElement)) {
      if (logDetails) {
        console.warn('[Canvas] isValidTexture: Unsupported image type', {
          type: texture.image?.constructor?.name,
          textureId: texture.uuid,
          hasImage: !!texture.image
        });
      }
      return false;
    }
    
    // Additional check: ensure texture dimensions are reasonable for WebGL
    let texWidth = 0;
    let texHeight = 0;
    
    if (texture.image instanceof HTMLCanvasElement) {
      texWidth = texture.image.width;
      texHeight = texture.image.height;
    } else if (texture.image instanceof HTMLImageElement) {
      texWidth = texture.image.naturalWidth;
      texHeight = texture.image.naturalHeight;
    } else if (texture.image instanceof ImageBitmap) {
      texWidth = texture.image.width;
      texHeight = texture.image.height;
    } else if (texture.image instanceof HTMLVideoElement) {
      texWidth = texture.image.videoWidth;
      texHeight = texture.image.videoHeight;
    }
    
    // Validate reasonable texture dimensions (WebGL has limits, typically 16384)
    if (texWidth > 16384 || texHeight > 16384) {
      if (logDetails) {
        console.warn('isValidTexture: Texture dimensions exceed WebGL limits', texWidth, texHeight);
      }
      return false;
    }
    
    // Ensure dimensions are positive integers
    if (!Number.isInteger(texWidth) || !Number.isInteger(texHeight) || texWidth <= 0 || texHeight <= 0) {
      if (logDetails) {
        console.warn('isValidTexture: Invalid texture dimensions', texWidth, texHeight);
      }
      return false;
    }
    
    // Validate texture format and type are valid WebGL constants
    // Three.js uses these internally, but we should check they're reasonable
    if (texture.format !== undefined && texture.format !== null) {
      const validFormats = [
        THREE.RGBAFormat,
        THREE.RGBFormat,
        THREE.AlphaFormat,
        THREE.LuminanceFormat,
        THREE.LuminanceAlphaFormat,
        THREE.RedFormat,
        THREE.RGFormat,
        THREE.RGBAIntegerFormat,
        THREE.RGBIntegerFormat,
        THREE.RedIntegerFormat,
        THREE.RGIntegerFormat,
        THREE.DepthFormat,
        THREE.DepthStencilFormat,
      ];
      if (!validFormats.includes(texture.format)) {
        if (logDetails) {
          console.warn('isValidTexture: Invalid texture format', texture.format, texture.uuid);
        }
        return false;
      }
    }
    
    if (texture.type !== undefined && texture.type !== null) {
      const validTypes = [
        THREE.UnsignedByteType,
        THREE.ByteType,
        THREE.ShortType,
        THREE.UnsignedShortType,
        THREE.IntType,
        THREE.UnsignedIntType,
        THREE.FloatType,
        THREE.HalfFloatType,
        THREE.UnsignedShort4444Type,
        THREE.UnsignedShort5551Type,
        THREE.UnsignedShort565Type,
        THREE.UnsignedInt248Type,
      ];
      if (!validTypes.includes(texture.type)) {
        if (logDetails) {
          console.warn('isValidTexture: Invalid texture type', texture.type, texture.uuid);
        }
        return false;
      }
    }
    
    return true;
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
    // Remove old background if it exists
    if (this.backgroundObject) {
      this.scene.remove(this.backgroundObject);
      if (this.backgroundObject instanceof THREE.Mesh) {
        this.backgroundObject.geometry.dispose();
        if (this.backgroundObject.material instanceof THREE.Material) {
          this.backgroundObject.material.dispose();
        }
      }
    }
    
    // Clear foreground objects (but keep background separate)
    this.clearObjects();
    
    // Create a full-screen plane for background (fixed, no rotation/zoom)
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, -1); // Behind foreground objects
    // Background is added directly to scene, not to foregroundGroup
    this.scene.add(plane);
    this.backgroundObject = plane;
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
    // Convert screen coordinates to Three.js coordinates
    const x = center[0] - this.width / 2;
    const y = -(center[1] - this.height / 2); // Flip Y axis

    if (width > 0) {
      // Draw as outline (ring)
      // Ensure inner radius is valid (at least 1 pixel smaller)
      const innerRadius = Math.max(1, radius - width);
      
      const shape = new THREE.Shape();
      shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    } else {
      // Draw as filled circle
      // Use fewer segments for smaller circles to improve performance
      const segments = Math.max(8, Math.min(64, Math.floor(radius / 2)));
      const geometry = new THREE.CircleGeometry(radius, segments);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    }
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
    // Convert screen coordinates to Three.js coordinates
    const x1 = start[0] - this.width / 2;
    const y1 = -(start[1] - this.height / 2);
    const x2 = end[0] - this.width / 2;
    const y2 = -(end[1] - this.height / 2);

    const points = [
      new THREE.Vector3(x1, y1, 0),
      new THREE.Vector3(x2, y2, 0),
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      linewidth: width,
    });
    const line = new THREE.Line(geometry, material);
      this.foregroundGroup.add(line);
    this.objects.push(line);
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
    if (points.length < 2) return;

    // Convert screen coordinates to Three.js coordinates
    const threePoints = points.map(([x, y]) => {
      return new THREE.Vector3(
        x - this.width / 2,
        -(y - this.height / 2),
        0
      );
    });

    if (closed && points.length > 2) {
      threePoints.push(threePoints[0]); // Close the loop
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(threePoints);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      linewidth: width,
    });
    const line = new THREE.Line(geometry, material);
      this.foregroundGroup.add(line);
    this.objects.push(line);
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
    if (width > 0) {
      // Draw as outline using lines
      const halfWidth = width / 2;
      this.line([x + halfWidth, y], [x + w - halfWidth, y], color, width);
      this.line([x + w, y + halfWidth], [x + w, y + h - halfWidth], color, width);
      this.line([x + w - halfWidth, y + h], [x + halfWidth, y + h], color, width);
      this.line([x, y + h - halfWidth], [x, y + halfWidth], color, width);
    } else {
      // Draw as filled rectangle
      const rectPoints: [number, number][] = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ];
      this.polygon(rectPoints, color, 0);
    }
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
    // Convert screen coordinates to Three.js coordinates
    const x = center[0] - this.width / 2;
    const y = -(center[1] - this.height / 2);

    if (width > 0) {
      // Draw as outline (ring)
      const shape = new THREE.Shape();
      shape.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.ellipse(0, 0, radiusX - width, radiusY - width, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    } else {
      // Draw as filled ellipse
      const shape = new THREE.Shape();
      shape.ellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false);
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    }
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
    // Convert screen coordinates to Three.js coordinates
    const x = center[0] - this.width / 2;
    const y = -(center[1] - this.height / 2);

    // Create arc shape
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, radiusX, radiusY, startAngle, endAngle, false);
    
    if (width > 0) {
      // Draw as outline - create a ring
      const innerRadiusX = Math.max(0, radiusX - width);
      const innerRadiusY = Math.max(0, radiusY - width);
      const hole = new THREE.Path();
      hole.ellipse(0, 0, innerRadiusX, innerRadiusY, startAngle, endAngle, true);
      shape.holes.push(hole);
    }
    
    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    this.foregroundGroup.add(mesh);
    this.objects.push(mesh);
  }

  /**
   * Draw a polygon
   */
  polygon(
    points: [number, number][],
    color: [number, number, number],
    width = 0
  ): void {
    if (points.length === 0) return;

    if (width > 0) {
      // Draw as outline
      this.lines(points, color, width, true);
    } else {
      // Draw as filled polygon
      const shape = new THREE.Shape();
      
      // Convert screen coordinates to Three.js coordinates
      const firstPoint = points[0];
      const x0 = firstPoint[0] - this.width / 2;
      const y0 = -(firstPoint[1] - this.height / 2);
      shape.moveTo(x0, y0);
      
      for (let i = 1; i < points.length; i++) {
        const x = points[i][0] - this.width / 2;
        const y = -(points[i][1] - this.height / 2);
        shape.lineTo(x, y);
      }
      shape.lineTo(x0, y0); // Close the shape
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    }
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
    if (points.length < 3) return; // Need at least 3 points for quadratic bezier

    // Convert screen coordinates to Three.js coordinates
    const threePoints = points.map(([x, y]) => {
      return new THREE.Vector3(
        x - this.width / 2,
        -(y - this.height / 2),
        0
      );
    });

    let curve: THREE.Curve<THREE.Vector3>;
    if (points.length === 3) {
      // Quadratic bezier (3 control points)
      curve = new THREE.QuadraticBezierCurve3(
        threePoints[0],
        threePoints[1],
        threePoints[2]
      );
    } else if (points.length === 4) {
      // Cubic bezier (4 control points)
      curve = new THREE.CubicBezierCurve3(
        threePoints[0],
        threePoints[1],
        threePoints[2],
        threePoints[3]
      );
    } else {
      // For more points, use quadratic segments
      const curvePoints: THREE.Vector3[] = [];
      for (let i = 0; i < points.length - 2; i += 2) {
        if (i + 2 < points.length) {
          const seg = new THREE.QuadraticBezierCurve3(
            threePoints[i],
            threePoints[i + 1],
            threePoints[i + 2]
          );
          const segPoints = seg.getPoints(segments / (points.length - 2));
          curvePoints.push(...segPoints);
        }
      }
      // Create a curve from the points
      const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const curveMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
        linewidth: width,
      });
      const line = new THREE.Line(curveGeometry, curveMaterial);
      this.foregroundGroup.add(line);
      this.objects.push(line);
      return;
    }

    // Sample points from the curve
    const curvePoints = curve.getPoints(segments);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255),
      linewidth: width,
    });
    const line = new THREE.Line(geometry, material);
    this.foregroundGroup.add(line);
    this.objects.push(line);
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
        if ('material' in obj) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => {
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
            });
          } else if (obj.material instanceof THREE.MeshBasicMaterial) {
            // Dispose texture if present
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
   * Capture the current frame to a texture (for feedback/trails effects)
   * This should be called at the end of draw(), after all drawing is complete
   */
  public captureFrame(): void {
    if (!this.renderTarget) {
      this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height);
    }
    
    // Clean up any meshes with invalid textures before rendering
    // Run cleanup multiple times to catch any textures that become invalid
    let cleanupCount = 0;
    while (this.cleanupInvalidTextures() && cleanupCount < 3) {
      cleanupCount++;
    }
    
    // Render the current scene to the render target
    try {
      this.renderer.setRenderTarget(this.renderTarget);
      
      // Final validation pass before render
      const hadInvalid = this.cleanupInvalidTextures();
      if (hadInvalid) {
        console.log('[Canvas] captureFrame: Found and cleaned invalid textures before render');
      }
      
      // Log scene state before render with detailed texture info
      let meshCount = 0;
      let textureCount = 0;
      const textureDetails: any[] = [];
      this.foregroundGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          meshCount++;
          const mat = obj.material;
          if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
            textureCount++;
            const tex = mat.map;
            const detail: any = {
              meshId: obj.uuid,
              textureId: tex.uuid,
              imageType: tex.image?.constructor?.name || 'null',
              imageExists: !!tex.image,
              isValid: this.isValidTexture(tex),
            };
            
            if (tex.image instanceof HTMLCanvasElement) {
              detail.canvasWidth = tex.image.width;
              detail.canvasHeight = tex.image.height;
              detail.canvasContext = !!tex.image.getContext('2d');
              try {
                const ctx = tex.image.getContext('2d');
                if (ctx) {
                  const testData = ctx.getImageData(0, 0, 1, 1);
                  detail.canvasReadable = !!testData;
                }
              } catch (e) {
                detail.canvasReadable = false;
                detail.canvasError = String(e);
              }
            } else if (tex.image instanceof HTMLImageElement) {
              detail.naturalWidth = tex.image.naturalWidth;
              detail.naturalHeight = tex.image.naturalHeight;
              detail.complete = tex.image.complete;
              detail.width = tex.image.width;
              detail.height = tex.image.height;
            } else if (tex.image instanceof ImageBitmap) {
              detail.bitmapWidth = tex.image.width;
              detail.bitmapHeight = tex.image.height;
              detail.bitmapClosed = (tex.image as any).closed;
            }
            
            detail.textureFormat = tex.format;
            detail.textureType = tex.type;
            detail.needsUpdate = tex.needsUpdate;
            detail.flipY = tex.flipY;
            
            textureDetails.push(detail);
            
            if (!this.isValidTexture(tex, true)) {
              console.error('[Canvas] captureFrame: Found invalid texture in mesh before render!', detail);
              // Remove the invalid texture immediately
              try {
                tex.dispose();
              } catch (e) {
                // Already disposed
              }
              mat.map = null;
              textureCount--; // Adjust count since we removed it
            } else {
              // Even if texture is valid, ensure needsUpdate is set correctly
              // If texture image changed, Three.js needs to know
              if (tex.needsUpdate === undefined || tex.needsUpdate === false) {
                // Check if image dimensions match texture dimensions
                // If they don't match, we need to update
                let imageWidth = 0;
                let imageHeight = 0;
                if (tex.image instanceof HTMLCanvasElement) {
                  imageWidth = tex.image.width;
                  imageHeight = tex.image.height;
                } else if (tex.image instanceof HTMLImageElement) {
                  imageWidth = tex.image.naturalWidth;
                  imageHeight = tex.image.naturalHeight;
                } else if (tex.image instanceof ImageBitmap) {
                  imageWidth = tex.image.width;
                  imageHeight = tex.image.height;
                }
                
                // If dimensions don't match, mark for update
                if (imageWidth > 0 && imageHeight > 0 && 
                    (tex.image.width !== imageWidth || tex.image.height !== imageHeight)) {
                  tex.needsUpdate = true;
                }
              }
            }
          }
        }
      });
      
      if (textureCount > 0) {
        console.log(`[Canvas] captureFrame: Rendering scene with ${meshCount} meshes, ${textureCount} textures`);
        console.log('[Canvas] captureFrame: Texture details:', textureDetails);
      } else {
        console.log(`[Canvas] captureFrame: Rendering scene with ${meshCount} meshes, ${textureCount} textures`);
      }
      
      // Final safety check: ensure all textures are valid before render
      // This prevents WebGL errors during texture upload
      let hasInvalidTextures = false;
      this.foregroundGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material;
          if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
            if (!this.isValidTexture(mat.map)) {
              console.error('[Canvas] captureFrame: Found invalid texture right before render, removing', {
                meshId: obj.uuid,
                textureId: mat.map.uuid
              });
              try {
                mat.map.dispose();
              } catch (e) {
                // Already disposed
              }
              mat.map = null;
              hasInvalidTextures = true;
            }
          }
        }
      });
      
      if (hasInvalidTextures) {
        console.warn('[Canvas] captureFrame: Removed invalid textures, retrying render');
      }
      
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (renderError) {
        console.error('[Canvas] captureFrame: WebGL render error:', renderError);
        // Try to identify which texture caused the issue
        this.foregroundGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const mat = obj.material;
            if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
              const tex = mat.map;
              console.error('[Canvas] captureFrame: Texture that may have caused error:', {
                meshId: obj.uuid,
                textureId: tex.uuid,
                imageType: tex.image?.constructor?.name,
                imageExists: !!tex.image,
                format: tex.format,
                type: tex.type,
                needsUpdate: tex.needsUpdate
              });
            }
          }
        });
        throw renderError;
      }
      this.renderer.setRenderTarget(null);
      
      // Validate the captured texture before storing
      // Render target textures are always valid if the render target exists and has valid dimensions
      if (this.renderTarget && this.renderTarget.texture) {
        // For render targets, check if the render target itself is valid
        const isValid = this.renderTarget.width > 0 && 
                        this.renderTarget.height > 0 &&
                        this.renderTarget.width <= 16384 &&
                        this.renderTarget.height <= 16384;
        
        if (isValid) {
          // Store reference to the render target's texture for next frame
          // We'll clone it when we use it in blitLastFrame to avoid modifying the original
          this.lastFrameTexture = this.renderTarget.texture;
        } else {
          console.warn('captureFrame: Render target has invalid dimensions', {
            width: this.renderTarget.width,
            height: this.renderTarget.height
          });
          this.lastFrameTexture = null;
        }
      } else {
        console.warn('captureFrame: No render target or texture available');
        this.lastFrameTexture = null;
      }
    } catch (error) {
      console.error('[Canvas] captureFrame: Error during render:', error);
      console.error('[Canvas] captureFrame: Error details:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Log scene state when error occurs
      let meshCount = 0;
      let invalidTextureCount = 0;
      this.foregroundGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          meshCount++;
          const mat = obj.material;
          if (mat instanceof THREE.MeshBasicMaterial && mat.map) {
            if (!this.isValidTexture(mat.map)) {
              invalidTextureCount++;
              console.error('[Canvas] captureFrame: Invalid texture found in error state:', {
                meshId: obj.uuid,
                textureId: mat.map.uuid,
                imageType: mat.map.image?.constructor?.name,
              });
            }
          }
        }
      });
      console.error(`[Canvas] captureFrame: Scene state at error: ${meshCount} meshes, ${invalidTextureCount} invalid textures`);
      
      this.renderer.setRenderTarget(null);
      this.lastFrameTexture = null;
      // Run cleanup again after error to remove any problematic textures
      this.cleanupInvalidTextures();
    }
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
    if (!this.isValidTexture(this.lastFrameTexture)) {
      return null;
    }
    // Clone the texture to avoid modifying the original
    try {
      const cloned = this.lastFrameTexture!.clone();
      if (this.isValidTexture(cloned)) {
        cloned.needsUpdate = true;
        return cloned;
      } else {
        cloned.dispose();
        return null;
      }
    } catch (error) {
      console.warn('getLastFrameTexture: Failed to clone texture:', error);
      return null;
    }
  }

  /**
   * Draw the previous frame as a texture (for trails/feedback effects)
   * @param x X position to draw at
   * @param y Y position to draw at
   * @param width Width to scale to (default: same as canvas width)
   * @param height Height to scale to (default: same as canvas height)
   * @param alpha Opacity (0.0 to 1.0, default: 1.0)
   * @param flipX Whether to flip horizontally (default: false)
   */
  public blitLastFrame(
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number,
    alpha: number = 1.0,
    flipX: boolean = false
  ): void {
    if (!this.lastFrameTexture) {
      return; // No previous frame to blit
    }

    const targetWidth = width ?? this.width;
    const targetHeight = height ?? this.height;
    
    // Convert screen coordinates to Three.js coordinates
    const xPos = x - this.width / 2;
    const yPos = -(y - this.height / 2);
    
    // Create a plane geometry for the texture
    const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
    
    // Use the texture directly (it's read-only from the render target)
    const material = new THREE.MeshBasicMaterial({
      map: this.lastFrameTexture,
      transparent: true,
      opacity: alpha,
      side: THREE.DoubleSide,
    });
    
    // Apply horizontal flip if requested
    if (flipX) {
      material.map!.repeat.x = -1;
      material.map!.offset.x = 1;
    } else {
      // Reset to normal if not flipping
      material.map!.repeat.x = 1;
      material.map!.offset.x = 0;
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xPos, yPos, -0.5); // Behind current frame but in front of background
    
    // Add to foreground group so it can be rotated/zoomed
    this.foregroundGroup.add(mesh);
    this.objects.push(mesh);
  }

  /**
   * Draw an image (blit) to the canvas
   * @param image HTMLImageElement or ImageBitmap to draw
   * @param x X position (top-left corner)
   * @param y Y position (top-left corner)
   * @param width Optional width (defaults to image width)
   * @param height Optional height (defaults to image height)
   * @param alpha Optional opacity (0.0 to 1.0, default: 1.0)
   * @param rotation Optional rotation in degrees (default: 0)
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
    const targetWidth = width ?? image.width;
    const targetHeight = height ?? image.height;

    // Convert screen coordinates to Three.js coordinates
    const xPos = x - this.width / 2;
    const yPos = -(y - this.height / 2);

    // Create texture from image
    // Validate image dimensions
    let imageWidth = 0;
    let imageHeight = 0;
    
    if (image instanceof HTMLImageElement) {
      imageWidth = image.naturalWidth || image.width || 0;
      imageHeight = image.naturalHeight || image.height || 0;
      if (!image.complete || imageWidth === 0 || imageHeight === 0) {
        console.warn('blit: Image not loaded or has invalid dimensions');
        return;
      }
    } else if (image instanceof ImageBitmap) {
      imageWidth = image.width;
      imageHeight = image.height;
      if (imageWidth === 0 || imageHeight === 0) {
        console.warn('blit: ImageBitmap has invalid dimensions');
        return;
      }
    } else {
      console.warn('blit: Invalid image type');
      return;
    }
    
    try {
      const texture = new THREE.Texture(image);
      texture.needsUpdate = true;
      texture.flipY = false; // Match pygame's coordinate system

      // Validate texture before using it
      if (!this.isValidTexture(texture)) {
        console.warn('blit: Created texture is invalid, skipping');
        texture.dispose();
        return;
      }

      // Create plane geometry for the image
      const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: alpha,
        side: THREE.DoubleSide,
      });

      // Validate material was created successfully and has valid texture
      if (!material || !material.map || !this.isValidTexture(material.map)) {
        console.warn('blit: Material creation failed or has invalid texture');
        geometry.dispose();
        texture.dispose();
        if (material) material.dispose();
        return;
      }

      const mesh = new THREE.Mesh(geometry, material);
      
      // Apply rotation if needed
      if (rotation !== 0) {
        mesh.rotation.z = (rotation * Math.PI) / 180;
      }
      
      mesh.position.set(xPos, yPos, 0);
      
      // Add to foreground group so it can be rotated/zoomed
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    } catch (error) {
      console.warn('blit: Error creating texture or mesh:', error);
      // Clean up on error
    }
  }

  /**
   * Draw an image from a texture (for pre-loaded images)
   * @param texture Three.js texture
   * @param x X position (top-left corner)
   * @param y Y position (top-left corner)
   * @param width Optional width (defaults to texture width)
   * @param height Optional height (defaults to texture height)
   * @param alpha Optional opacity (0.0 to 1.0, default: 1.0)
   * @param rotation Optional rotation in degrees (default: 0)
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
    // Validate texture
    if (!texture || !texture.image) {
      console.warn('blitTexture: Invalid texture provided');
      return;
    }

    const targetWidth = width ?? texture.image?.width ?? 100;
    const targetHeight = height ?? texture.image?.height ?? 100;

    // Validate dimensions
    if (targetWidth <= 0 || targetHeight <= 0) {
      console.warn('blitTexture: Invalid dimensions', targetWidth, targetHeight);
      return;
    }

    // Convert screen coordinates to Three.js coordinates
    const xPos = x - this.width / 2;
    const yPos = -(y - this.height / 2);

    try {
      // Validate texture before cloning
      if (!this.isValidTexture(texture)) {
        console.warn('[Canvas] blitTexture: Invalid texture provided', {
          textureId: texture.uuid,
          imageType: texture.image?.constructor?.name,
          imageExists: !!texture.image,
          imageWidth: texture.image instanceof HTMLCanvasElement ? texture.image.width : 
                     texture.image instanceof HTMLImageElement ? texture.image.naturalWidth :
                     texture.image instanceof ImageBitmap ? texture.image.width : 'N/A',
          imageHeight: texture.image instanceof HTMLCanvasElement ? texture.image.height : 
                      texture.image instanceof HTMLImageElement ? texture.image.naturalHeight :
                      texture.image instanceof ImageBitmap ? texture.image.height : 'N/A',
        });
        return;
      }

      // Clone texture to avoid modifying the original
      let textureClone: THREE.Texture;
      try {
        textureClone = texture.clone();
      } catch (cloneError) {
        console.warn('blitTexture: Failed to clone texture:', cloneError);
        return;
      }
      
      // Validate cloned texture
      if (!this.isValidTexture(textureClone)) {
        console.warn('[Canvas] blitTexture: Cloned texture is invalid', {
          originalTextureId: texture.uuid,
          clonedTextureId: textureClone.uuid,
          imageType: textureClone.image?.constructor?.name,
        });
        textureClone.dispose();
        return;
      }
      
      textureClone.needsUpdate = true;
      textureClone.flipY = false;

      // Create plane geometry for the image
      const geometry = new THREE.PlaneGeometry(targetWidth, targetHeight);
      const material = new THREE.MeshBasicMaterial({
        map: textureClone,
        transparent: true,
        opacity: alpha,
        side: THREE.DoubleSide,
      });

      // Validate material was created successfully and has valid texture
      if (!material || !material.map || !this.isValidTexture(material.map)) {
        console.warn('blitTexture: Material creation failed or has invalid texture');
        geometry.dispose();
        textureClone.dispose();
        if (material) material.dispose();
        return;
      }

      const mesh = new THREE.Mesh(geometry, material);
      
      // Apply rotation if needed
      if (rotation !== 0) {
        mesh.rotation.z = (rotation * Math.PI) / 180;
      }
      
      mesh.position.set(xPos, yPos, 0);
      
      // Add to foreground group so it can be rotated/zoomed
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    } catch (error) {
      console.warn('blitTexture: Error creating texture mesh:', error);
      // Clean up on error - geometry and material will be disposed when mesh is removed
    }
  }

  /**
   * Draw text using a pre-rendered texture (from FontRenderer)
   * @param texture Three.js texture containing rendered text
   * @param x X position (top-left corner, or center if centerX is true)
   * @param y Y position (top-left corner, or center if centerY is true)
   * @param centerX If true, x is the center X position (default: false)
   * @param centerY If true, y is the center Y position (default: false)
   * @param alpha Optional opacity (0.0 to 1.0, default: 1.0)
   */
  public blitText(
    texture: THREE.Texture,
    x: number,
    y: number,
    centerX: boolean = false,
    centerY: boolean = false,
    alpha: number = 1.0
  ): void {
    // Validate texture
    if (!texture || !texture.image) {
      console.warn('blitText: Invalid texture provided');
      return;
    }

    const width = texture.image?.width ?? 100;
    const height = texture.image?.height ?? 100;

    // Validate dimensions
    if (width <= 0 || height <= 0) {
      console.warn('blitText: Invalid dimensions', width, height);
      return;
    }

    // Adjust position if centering
    const finalX = centerX ? x - width / 2 : x;
    const finalY = centerY ? y - height / 2 : y;

    // Convert screen coordinates to Three.js coordinates
    const xPos = finalX - this.width / 2;
    const yPos = -(finalY - this.height / 2);

    try {
      // Validate texture before cloning
      if (!this.isValidTexture(texture)) {
        console.warn('blitText: Invalid texture provided');
        return;
      }

      // Clone texture to avoid modifying the original
      let textureClone: THREE.Texture;
      try {
        textureClone = texture.clone();
      } catch (cloneError) {
        console.warn('blitText: Failed to clone texture:', cloneError);
        return;
      }
      
      // Validate cloned texture
      if (!this.isValidTexture(textureClone)) {
        console.warn('blitText: Cloned texture is invalid');
        textureClone.dispose();
        return;
      }
      
      // Validate texture one more time before setting needsUpdate
      if (!this.isValidTexture(textureClone)) {
        console.warn('blitText: Texture clone is invalid after cloning');
        textureClone.dispose();
        return;
      }

      textureClone.needsUpdate = true;
      textureClone.flipY = false;

      // Create plane geometry for the text
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        map: textureClone,
        transparent: true,
        opacity: alpha,
        side: THREE.DoubleSide,
      });

      // Validate material was created successfully
      if (!material || !material.map || !this.isValidTexture(material.map)) {
        console.warn('blitText: Material creation failed or has invalid texture');
        geometry.dispose();
        textureClone.dispose();
        if (material) material.dispose();
        return;
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(xPos, yPos, 0);
      
      // Add to foreground group so it can be rotated/zoomed
      this.foregroundGroup.add(mesh);
      this.objects.push(mesh);
    } catch (error) {
      console.warn('blitText: Error creating texture mesh:', error);
      // Clean up on error - geometry and material will be disposed when mesh is removed
    }
  }

  /**
   * Force a render (useful for end of frame)
   * This should be called once per frame after all draw calls are complete
   */
  public flush(): void {
    // Clean up invalid textures before rendering (single pass is usually sufficient)
    this.cleanupInvalidTextures();
    
    try {
      const activeCamera = this.getActiveCamera();
      this.renderer.render(this.scene, activeCamera);
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Canvas] flush: Error during render:', error);
      }
      // Run cleanup again after error to remove any problematic textures
      this.cleanupInvalidTextures();
      // Continue - don't crash the app
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  /**
   * Get the underlying WebGL renderer (for effects system)
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
   * Get the renderer (for 3D modes that need direct access)
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the current rendered frame as a texture (for post-effects)
   * Renders the current scene to a texture and returns it
   */
  getCurrentFrameTexture(): THREE.Texture | null {
    if (!this.renderTarget) {
      this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
    }

    // Ensure render target is the right size
    if (this.renderTarget.width !== this.width || this.renderTarget.height !== this.height) {
      this.renderTarget.setSize(this.width, this.height);
    }

    // Render current scene to render target
    const oldRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear(); // Clear to ensure we get a clean capture
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(oldRenderTarget);

    // Mark texture as updated
    const texture = this.renderTarget.texture;
    texture.needsUpdate = true;
    texture.flipY = false; // Render targets don't need flipping

    // Return the texture (don't clone - caller should handle disposal)
    return texture;
  }

  /**
   * Render scene to a render target (for effects processing)
   * This allows us to capture the frame before rendering to screen
   * @param targetWidth Optional width for render target (defaults to canvas width)
   * @param targetHeight Optional height for render target (defaults to canvas height)
   */
  renderToRenderTarget(targetWidth?: number, targetHeight?: number): THREE.Texture | null {
    const width = targetWidth ?? this.width;
    const height = targetHeight ?? this.height;
    
    if (!this.effectsRenderTarget) {
      this.effectsRenderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
    } else if (this.effectsRenderTarget.width !== width || this.effectsRenderTarget.height !== height) {
      // Resize render target if dimensions don't match
      this.effectsRenderTarget.setSize(width, height);
    }

    // Temporarily adjust camera for render target size if different
    const oldLeft = this.camera.left;
    const oldRight = this.camera.right;
    const oldTop = this.camera.top;
    const oldBottom = this.camera.bottom;
    
    if (width !== this.width || height !== this.height) {
      this.camera.left = -width / 2;
      this.camera.right = width / 2;
      this.camera.top = height / 2;
      this.camera.bottom = -height / 2;
      this.camera.updateProjectionMatrix();
    }

    // Render current scene to render target
    const oldRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.effectsRenderTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(oldRenderTarget);

    // Restore camera if we changed it
    if (width !== this.width || height !== this.height) {
      this.camera.left = oldLeft;
      this.camera.right = oldRight;
      this.camera.top = oldTop;
      this.camera.bottom = oldBottom;
      this.camera.updateProjectionMatrix();
    }

    const texture = this.effectsRenderTarget.texture;
    if (!texture) {
      console.warn('[Canvas] renderToRenderTarget: No texture from render target');
      return null;
    }
    
    texture.needsUpdate = true;
    texture.flipY = false;
    return texture;
  }

  /**
   * Render a texture to the canvas (for post-effects)
   * Clears the scene and draws the texture as a fullscreen quad
   */
  renderTexture(texture: THREE.Texture): void {
    if (!this.isValidTexture(texture)) {
      console.warn('[Canvas] renderTexture: Invalid texture provided');
      return;
    }

    // Clear existing objects
    this.clear();

    // Create a fullscreen quad with the texture
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    
    this.scene.add(mesh);
    this.objects.push(mesh);
  }

  /**
   * Render a texture directly to the screen (bypasses scene)
   * Used for rendering post-processed effects
   */
  renderTextureToScreen(texture: THREE.Texture): void {
    // For render target textures, we need to be more lenient with validation
    // Render target textures have the render target as their image, not a standard image element
    if (!texture) {
      console.warn('[Canvas] renderTextureToScreen: Texture is null');
      return;
    }
    
    // Render target textures are valid if they exist and have a uuid
    if (!texture.uuid) {
      console.warn('[Canvas] renderTextureToScreen: Texture has no uuid (disposed?)');
      return;
    }

    // Ensure texture is updated and properly configured
    texture.needsUpdate = true;
    texture.flipY = false;

    // Create a fullscreen quad with the texture
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    
    // Create a temporary scene for rendering (don't modify main scene)
    const tempScene = new THREE.Scene();
    tempScene.add(mesh);
    
    // Render directly to screen (no render target)
    const oldRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(null);
    this.renderer.clearColor();
    this.renderer.clear(true, true, true);
    this.renderer.render(tempScene, this.camera);
    this.renderer.setRenderTarget(oldRenderTarget);
    
    // Clean up temporary geometry and material
    geometry.dispose();
    material.dispose();
  }

  /**
   * Capture the current canvas as a data URL (for screenshots)
   * For WebGL, we need to read pixels from the WebGL context
   * @returns Data URL string of the canvas image
   */
  captureScreenshot(): string {
    const canvas = this.renderer.domElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Ensure the canvas has been rendered
    // Force a render to make sure we capture the current state
    this.renderer.render(this.scene, this.camera);
    
    // For WebGL, we need to read pixels from the WebGL context
    // Create a temporary 2D canvas to convert WebGL pixels to image data
    const gl = this.renderer.getContext();
    if (!gl) {
      throw new Error('WebGL context not found');
    }
    
    // Create a 2D canvas to hold the image data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create 2D canvas context');
    }
    
    // Read pixels from WebGL canvas
    const pixels = new Uint8Array(this.width * this.height * 4);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    // WebGL reads from bottom-left, but canvas expects top-left
    // So we need to flip the image vertically
    const imageData = ctx.createImageData(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const srcIndex = ((this.height - 1 - y) * this.width + x) * 4;
        const dstIndex = (y * this.width + x) * 4;
        imageData.data[dstIndex] = pixels[srcIndex];     // R
        imageData.data[dstIndex + 1] = pixels[srcIndex + 1]; // G
        imageData.data[dstIndex + 2] = pixels[srcIndex + 2]; // B
        imageData.data[dstIndex + 3] = pixels[srcIndex + 3]; // A
      }
    }
    
    // Put the image data on the 2D canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Return as data URL
    return tempCanvas.toDataURL('image/png');
  }
}
