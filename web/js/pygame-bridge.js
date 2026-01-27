/**
 * pygame Bridge
 * Provides pygame API using HTML5 Canvas
 * This allows Python code using pygame to work in the browser
 */

class PygameBridge {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.screen = null; // Will be a Surface-like object
        this.images = new Map(); // Cache loaded images
    }

    /**
     * Initialize pygame bridge in Pyodide
     * @param {PyodideLoader} loader - Pyodide loader instance
     */
    async initialize(loader) {
        const bridge = this;

        // Create a Surface class that mimics pygame.Surface
        const surfaceCode = `
class Surface:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self._id = f"surface_{id(self)}"
        # Register this surface with the bridge
        js.bridge.registerSurface(self._id, self.width, self.height)
    
    def get_width(self):
        return self.width
    
    def get_height(self):
        return self.height
    
    def get_size(self):
        return (self.width, self.height)
    
    def copy(self):
        new_surface = Surface(self.width, self.height)
        js.bridge.copySurface(self._id, new_surface._id)
        return new_surface
    
    def fill(self, color):
        js.bridge.fillSurface(self._id, color)
    
    def blit(self, source, dest, area=None):
        if hasattr(source, '_id'):
            js.bridge.blitSurface(self._id, source._id, dest, area)
    
    def set_alpha(self, alpha):
        js.bridge.setSurfaceAlpha(self._id, alpha)

class Screen:
    def __init__(self, width, height):
        # Main screen draws directly to canvas
        self._id = "main_screen"
        self.width = width
        self.height = height
        # Create a dummy surface for compatibility
        self.surface = Surface(width, height)
        self.surface._id = "main_screen"
    
    def get_width(self):
        return self.width
    
    def get_height(self):
        return self.height
    
    def get_size(self):
        return (self.width, self.height)
    
    def fill(self, color):
        # Fill canvas directly for main screen
        js.bridge.fillCanvas(color)
    
    def blit(self, source, dest, area=None):
        self.surface.blit(source, dest, area)
    
    def copy(self):
        return self.surface.copy()
    
    def set_alpha(self, alpha):
        self.surface.set_alpha(alpha)

# Drawing functions
class Draw:
    @staticmethod
    def circle(surface, color, center, radius, width=0):
        x, y = center
        surface_id = getattr(surface, '_id', 'main_screen')
        js.bridge.drawCircle(surface_id, color, x, y, radius, width)
    
    @staticmethod
    def line(surface, color, start_pos, end_pos, width=1):
        x1, y1 = start_pos
        x2, y2 = end_pos
        surface_id = getattr(surface, '_id', 'main_screen')
        js.bridge.drawLine(surface_id, color, x1, y1, x2, y2, width)
    
    @staticmethod
    def rect(surface, color, rect, width=0):
        x, y, w, h = rect
        js.bridge.drawRect(surface._id, color, x, y, w, h, width)
    
    @staticmethod
    def polygon(surface, color, points, width=0):
        js.bridge.drawPolygon(surface._id, color, points, width)
    
    @staticmethod
    def arc(surface, color, rect, start_angle, stop_angle, width=1):
        x, y, w, h = rect
        js.bridge.drawArc(surface._id, color, x, y, w, h, start_angle, stop_angle, width)
    
    @staticmethod
    def ellipse(surface, color, rect, width=0):
        x, y, w, h = rect
        js.bridge.drawEllipse(surface._id, color, x, y, w, h, width)

# Image loading (handles async promise from JavaScript)
async def image_load_async(filepath):
    # Load image via JavaScript (returns a promise)
    try:
        img_id = await js.bridge.loadImage(filepath)
        if img_id:
            img = Surface(1, 1)  # Placeholder, will be set by bridge
            img._id = img_id
            img.width = js.bridge.getImageWidth(img_id)
            img.height = js.bridge.getImageHeight(img_id)
            return img
    except Exception as e:
        print(f"Error loading image {filepath}: {e}")
    return None

# Synchronous wrapper (for now, returns None - images will need to be pre-loaded)
def image_load(filepath):
    # For now, return None - proper async image loading will be implemented
    # This allows the module to import without errors
    print(f"Warning: Image loading for {filepath} not yet fully implemented")
    return None

# Transform functions
class Transform:
    @staticmethod
    def scale(surface, size):
        width, height = size
        new_surface = Surface(width, height)
        js.bridge.scaleSurface(surface._id, new_surface._id, width, height)
        return new_surface

# Initialize pygame module
class PygameModule:
    def __init__(self):
        self.draw = Draw()
        self.transform = Transform()
        # Add image module
        self.image = type('ImageModule', (), {
            'load': image_load
        })()
        # Add Color class
        self.Color = lambda r, g, b, a=255: [r, g, b, a] if a != 255 else [r, g, b]
    
    def image_load(self, filepath):
        return image_load(filepath)

# Create pygame instance
_pygame_instance = PygameModule()

# Make pygame available as an importable module
import sys
from types import ModuleType

pygame_module = ModuleType('pygame')
pygame_module.draw = _pygame_instance.draw
pygame_module.transform = _pygame_instance.transform
pygame_module.image = _pygame_instance.image
pygame_module.Color = _pygame_instance.Color
pygame_module.image.load = image_load

# Add to sys.modules so 'import pygame' works
sys.modules['pygame'] = pygame_module

# Also create pygame.locals for 'from pygame.locals import *'
pygame_locals = ModuleType('pygame.locals')
sys.modules['pygame.locals'] = pygame_locals

# Make pygame available as a global variable too
pygame = pygame_module
        `;

        // Inject bridge methods into JavaScript namespace
        const bridgeObj = {
            registerSurface: (id, width, height) => bridge.registerSurface(id, width, height),
            fillSurface: (id, color) => bridge.fillSurface(id, color),
            copySurface: (srcId, dstId) => bridge.copySurface(srcId, dstId),
            blitSurface: (dstId, srcId, dest, area) => bridge.blitSurface(dstId, srcId, dest, area),
            setSurfaceAlpha: (id, alpha) => bridge.setSurfaceAlpha(id, alpha),
            drawCircle: (id, color, x, y, radius, width) => bridge.drawCircle(id, color, x, y, radius, width),
            drawLine: (id, color, x1, y1, x2, y2, width) => bridge.drawLine(id, color, x1, y1, x2, y2, width),
            drawRect: (id, color, x, y, w, h, width) => bridge.drawRect(id, color, x, y, w, h, width),
            drawPolygon: (id, color, points, width) => bridge.drawPolygon(id, color, points, width),
            drawArc: (id, color, x, y, w, h, startAngle, stopAngle, width) => bridge.drawArc(id, color, x, y, w, h, startAngle, stopAngle, width),
            drawEllipse: (id, color, x, y, w, h, width) => bridge.drawEllipse(id, color, x, y, w, h, width),
            loadImage: (filepath) => bridge.loadImage(filepath),
            getImageWidth: (id) => bridge.getImageWidth(id),
            getImageHeight: (id) => bridge.getImageHeight(id),
            scaleSurface: (srcId, dstId, width, height) => bridge.scaleSurface(srcId, dstId, width, height),
            fillCanvas: (color) => bridge.fillCanvas(color),
        };
        const bridgePy = loader.pyodide.toPy(bridgeObj);
        loader.setPythonObject('bridge', bridgePy);

        // Make bridge accessible via js.bridge for Python code
        loader.runPython(`
import js
# Set bridge in js namespace so Python code can access js.bridge
setattr(js, 'bridge', bridge)
        `);

        // Run Python code to create pygame module
        loader.runPython(surfaceCode);

        // Create Screen class and set_mode function
        loader.runPython(`
def set_mode(size):
    width, height = size
    screen = Screen(width, height)
    return screen
        `);
    }

    // Surface management
    surfaces = new Map();

    registerSurface(id, width, height) {
        this.surfaces.set(id, {
            width,
            height,
            imageData: this.ctx.createImageData(width, height),
        });
    }

    fillSurface(id, color) {
        const surface = this.surfaces.get(id);
        if (!surface) return;

        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        const data = surface.imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = r;     // R
            data[i + 1] = g; // G
            data[i + 2] = b; // B
            data[i + 3] = 255; // A
        }
    }

    copySurface(srcId, dstId) {
        const src = this.surfaces.get(srcId);
        if (!src) return;

        const dst = this.surfaces.get(dstId);
        if (!dst) return;

        // Copy image data
        dst.imageData = new ImageData(
            new Uint8ClampedArray(src.imageData.data),
            src.width,
            src.height
        );
    }

    blitSurface(dstId, srcId, dest, area) {
        // Implementation for blitting (copying one surface to another)
        // For now, we'll render to canvas directly
        const src = this.surfaces.get(srcId);
        if (!src) return;

        const [x, y] = dest || [0, 0];
        
        // Create temporary canvas to blit
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = src.width;
        tempCanvas.height = src.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(src.imageData, 0, 0);
        
        this.ctx.drawImage(tempCanvas, x, y);
    }

    setSurfaceAlpha(id, alpha) {
        // Set alpha for surface (for transparency)
        const surface = this.surfaces.get(id);
        if (surface) {
            surface.alpha = alpha;
        }
    }

    // Drawing functions - draw directly to canvas for main screen
    drawCircle(id, color, x, y, radius, width) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        
        // If this is the main screen, draw directly to canvas
        if (id === 'main_screen' || !this.surfaces.has(id)) {
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.lineWidth = width || 0;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            
            if (width > 0) {
                this.ctx.stroke();
            } else {
                this.ctx.fill();
            }
        } else {
            // Draw to off-screen surface (for blitting later)
            const surface = this.surfaces.get(id);
            // For now, we'll draw to canvas anyway
            // In a full implementation, we'd draw to an off-screen canvas
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.lineWidth = width || 0;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            
            if (width > 0) {
                this.ctx.stroke();
            } else {
                this.ctx.fill();
            }
        }
    }

    drawLine(id, color, x1, y1, x2, y2, width) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.lineWidth = width || 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRect(id, color, x, y, w, h, width) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.lineWidth = width || 0;
        
        if (width > 0) {
            this.ctx.strokeRect(x, y, w, h);
        } else {
            this.ctx.fillRect(x, y, w, h);
        }
    }

    drawPolygon(id, color, points, width) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.lineWidth = width || 0;
        
        this.ctx.beginPath();
        if (points.length > 0) {
            const [x, y] = points[0];
            this.ctx.moveTo(x, y);
            for (let i = 1; i < points.length; i++) {
                const [x, y] = points[i];
                this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
        }
        
        if (width > 0) {
            this.ctx.stroke();
        } else {
            this.ctx.fill();
        }
    }

    drawArc(id, color, x, y, w, h, startAngle, stopAngle, width) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.lineWidth = width || 1;
        
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, startAngle, stopAngle);
        this.ctx.stroke();
    }

    drawEllipse(id, color, x, y, w, h, width) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.lineWidth = width || 0;
        
        this.ctx.beginPath();
        this.ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
        
        if (width > 0) {
            this.ctx.stroke();
        } else {
            this.ctx.fill();
        }
    }

    // Image loading - returns a Promise that Pyodide can handle
    async loadImage(filepath) {
        // Check cache
        if (this.images.has(filepath)) {
            return this.images.get(filepath).id;
        }

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Allow CORS if needed
            img.src = filepath;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error(`Failed to load image: ${filepath}`));
            });

            const id = `img_${Date.now()}_${Math.random()}`;
            this.images.set(filepath, { id, img, width: img.width, height: img.height });
            return id;
        } catch (error) {
            console.error(`Failed to load image: ${filepath}`, error);
            return null;
        }
    }

    getImageWidth(id) {
        for (const [path, data] of this.images.entries()) {
            if (data.id === id) {
                return data.width;
            }
        }
        return 0;
    }

    getImageHeight(id) {
        for (const [path, data] of this.images.entries()) {
            if (data.id === id) {
                return data.height;
            }
        }
        return 0;
    }

    scaleSurface(srcId, dstId, width, height) {
        // Scale surface (for transform.scale)
        // This is a simplified implementation
        const src = this.surfaces.get(srcId);
        if (!src) return;

        const dst = this.surfaces.get(dstId);
        if (!dst) return;

        // For now, just copy (proper scaling would require canvas operations)
        dst.imageData = new ImageData(
            new Uint8ClampedArray(src.imageData.data),
            width,
            height
        );
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Fill canvas with color
     */
    fillCanvas(color) {
        const [r, g, b] = Array.isArray(color) ? color : [color, color, color];
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get main screen surface (the canvas)
     */
    getScreen() {
        return this.screen;
    }

    /**
     * Set main screen surface
     */
    setScreen(screen) {
        this.screen = screen;
    }
}

