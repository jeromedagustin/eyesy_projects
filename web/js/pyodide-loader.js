/**
 * Pyodide Loader
 * Handles loading and initializing Pyodide runtime
 */

class PyodideLoader {
    constructor() {
        this.pyodide = null;
        this.loaded = false;
        this.loading = false;
        this.onLoadCallbacks = [];
    }

    /**
     * Load Pyodide from CDN
     * @param {Function} onProgress - Progress callback (optional)
     * @returns {Promise} Resolves when Pyodide is loaded
     */
    async load(onProgress = null) {
        if (this.loaded) {
            return this.pyodide;
        }

        if (this.loading) {
            // Already loading, wait for it
            return new Promise((resolve) => {
                this.onLoadCallbacks.push(resolve);
            });
        }

        this.loading = true;

        try {
            // Load Pyodide from CDN
            if (onProgress) onProgress({ status: 'Loading Pyodide...', progress: 0.1 });

            // Use Pyodide from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            if (onProgress) onProgress({ status: 'Initializing Pyodide...', progress: 0.3 });

            // Initialize Pyodide
            this.pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            });

            if (onProgress) onProgress({ status: 'Installing packages...', progress: 0.5 });

            // Install required packages (math is built-in, but we might need others)
            // Note: pygame is not available, we'll use our bridge instead
            await this.pyodide.loadPackage(['micropip']);

            if (onProgress) onProgress({ status: 'Setting up environment...', progress: 0.8 });

            // Set up Python environment
            this.setupEnvironment();

            if (onProgress) onProgress({ status: 'Ready!', progress: 1.0 });

            this.loaded = true;
            this.loading = false;

            // Resolve all waiting callbacks
            this.onLoadCallbacks.forEach(callback => callback(this.pyodide));
            this.onLoadCallbacks = [];

            return this.pyodide;
        } catch (error) {
            this.loading = false;
            console.error('Failed to load Pyodide:', error);
            throw error;
        }
    }

    /**
     * Set up Python environment with necessary modules
     */
    setupEnvironment() {
        // Inject math module (already available in Pyodide)
        // We'll inject our pygame bridge and eyesy API later
        this.pyodide.runPython(`
import sys
import math
# pygame and eyesy will be injected by the bridge
        `);
    }

    /**
     * Check if Pyodide is loaded
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Get Pyodide instance (returns null if not loaded)
     */
    getPyodide() {
        return this.pyodide;
    }

    /**
     * Run Python code
     * @param {string} code - Python code to execute
     * @returns {*} Result of Python code
     */
    runPython(code) {
        if (!this.loaded) {
            throw new Error('Pyodide not loaded yet. Call load() first.');
        }
        return this.pyodide.runPython(code);
    }

    /**
     * Get a Python object from JavaScript
     * @param {string} name - Name of Python object
     * @returns {*} Python object proxy
     */
    getPythonObject(name) {
        if (!this.loaded) {
            throw new Error('Pyodide not loaded yet. Call load() first.');
        }
        return this.pyodide.globals.get(name);
    }

    /**
     * Set a JavaScript object in Python namespace
     * @param {string} name - Name in Python namespace
     * @param {*} value - JavaScript value
     */
    setPythonObject(name, value) {
        if (!this.loaded) {
            throw new Error('Pyodide not loaded yet. Call load() first.');
        }
        this.pyodide.globals.set(name, value);
    }
}

