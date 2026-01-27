/**
 * Mode Runner
 * Loads and executes EYESY Python modes
 */

class ModeRunner {
    constructor(pyodideLoader, pygameBridge, eyesyAPI, canvas) {
        this.loader = pyodideLoader;
        this.bridge = pygameBridge;
        this.eyesy = eyesyAPI;
        this.canvas = canvas;
        this.setupFunc = null;
        this.drawFunc = null;
        this.running = false;
        this.animationFrameId = null;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        this.lastFrameTime = 0;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 10;
    }

    /**
     * Load a mode from Python code
     * @param {string} modeCode - Python code for the mode
     * @param {string} modeName - Name of the mode
     * @param {string} modePath - Path to mode folder (for assets)
     */
    async loadMode(modeCode, modeName, modePath) {
        try {
            // Set mode root
            this.eyesy.setModeRoot(modePath);
            this.eyesy.mode = modeName;

            // Always recreate screen to ensure it's fresh for this mode
            const screenCode = `
import sys
screen = set_mode((${this.canvas.width}, ${this.canvas.height}))
if screen is None:
    raise Exception('set_mode returned None')
# Store screen in globals to ensure it persists
sys.modules['__main__'].screen = screen
            `;
            this.loader.runPython(screenCode);
            
            // Verify screen was created
            let screen = this.loader.getPythonObject('screen');
            if (!screen) {
                throw new Error('Failed to create screen object');
            }
            console.log('Screen created successfully:', screen);

            // Inject EYESY API (only if not already injected)
            try {
                this.loader.getPythonObject('eyesy');
            } catch (e) {
                // EYESY not injected yet, inject it
                this.eyesy.injectIntoPyodide(this.loader);
            }

            // Update EYESY properties in Python
            this.eyesy.updateProperties(this.loader);

            // Load mode code
            this.loader.runPython(modeCode);

            // Get setup and draw functions
            try {
                this.setupFunc = this.loader.getPythonObject('setup');
                this.drawFunc = this.loader.getPythonObject('draw');
            } catch (error) {
                throw new Error(`Mode must have setup() and draw() functions: ${error.message}`);
            }

            // Call setup (reuse screen variable)
            screen = this.loader.getPythonObject('screen');
            this.setupFunc(screen, this.loader.getPythonObject('eyesy'));

            console.log(`Mode loaded: ${modeName}`);
            return true;
        } catch (error) {
            console.error(`Failed to load mode: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * Load a mode from a file
     * @param {string} filePath - Path to Python file
     * @param {string} modeName - Name of the mode
     */
    async loadModeFromFile(filePath, modeName) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load mode file: ${response.statusText}`);
            }
            const modeCode = await response.text();
            const modePath = filePath.substring(0, filePath.lastIndexOf('/'));
            return await this.loadMode(modeCode, modeName, modePath);
        } catch (error) {
            console.error(`Failed to load mode from file: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * Start running the mode
     */
    start() {
        if (this.running) {
            return;
        }

        if (!this.drawFunc) {
            throw new Error('No mode loaded. Call loadMode() first.');
        }

        this.running = true;
        this.lastFrameTime = performance.now();
        this.animate();
    }

    /**
     * Stop running the mode
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.running) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameTime) {
            this.draw();
            this.lastFrameTime = currentTime - (deltaTime % this.frameTime);
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Draw a single frame
     */
    draw() {
        try {
            // Verify screen exists before proceeding
            let screen;
            try {
                screen = this.loader.getPythonObject('screen');
                if (!screen) {
                    throw new Error('Screen object is None');
                }
            } catch (e) {
                console.error('Screen object not found, recreating...', e);
                // Recreate screen
                const screenCode = `
screen = set_mode((${this.canvas.width}, ${this.canvas.height}))
                `;
                this.loader.runPython(screenCode);
                screen = this.loader.getPythonObject('screen');
            }

            // Update EYESY properties
            this.eyesy.updateProperties(this.loader);

            // Clear canvas if auto_clear is enabled
            if (this.eyesy.auto_clear) {
                this.bridge.clear();
                const bgColor = this.eyesy.bg_color;
                this.bridge.ctx.fillStyle = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
                this.bridge.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Get eyesy object
            const eyesy = this.loader.getPythonObject('eyesy');
            if (!eyesy) {
                throw new Error('EYESY object is None');
            }

            // Call draw function
            this.drawFunc(screen, eyesy);

            // Reset error counter on successful draw
            this.consecutiveErrors = 0;

            // Note: Drawing is done directly to canvas via the pygame bridge
            // The bridge methods draw directly to the canvas context
        } catch (error) {
            this.consecutiveErrors++;
            
            // Stop the loop on critical errors or too many consecutive errors
            const isCriticalError = error.message && (
                error.message.includes('NoneType') || 
                error.message.includes('None') ||
                error.message.includes('not found')
            );
            
            if (isCriticalError || this.consecutiveErrors >= this.maxConsecutiveErrors) {
                console.error(`Critical error in draw() (${this.consecutiveErrors} consecutive), stopping animation: ${error.message}`, error);
                this.stop();
                // Try to show error to user
                if (typeof showError === 'function') {
                    showError(`Drawing error: ${error.message}. Animation stopped after ${this.consecutiveErrors} errors.`);
                }
            } else {
                // Log error but continue (might be transient)
                if (this.consecutiveErrors <= 3) {
                    console.warn(`Error in draw() (${this.consecutiveErrors}/${this.maxConsecutiveErrors}): ${error.message}`);
                }
            }
        }
    }

    /**
     * Set frame rate
     */
    setFPS(fps) {
        this.fps = fps;
        this.frameTime = 1000 / fps;
    }
}

