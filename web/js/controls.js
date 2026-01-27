/**
 * Controls UI
 * Provides knobs, buttons, and other controls for the EYESY interface
 */

class EYESYControls {
    constructor(eyesyAPI, modeRunner) {
        this.eyesy = eyesyAPI;
        this.runner = modeRunner;
        this.container = null;
    }

    /**
     * Create controls UI
     * @param {HTMLElement} container - Container element for controls
     */
    create(container) {
        this.container = container;
        container.innerHTML = '';

        // Create controls panel
        const panel = document.createElement('div');
        panel.className = 'controls-panel';
        panel.innerHTML = `
            <div class="controls-header">
                <h2>EYESY Controls</h2>
            </div>
            <div class="controls-content">
                <div class="knob-group">
                    <label>Knob 1: <span id="knob1-value">0.50</span></label>
                    <input type="range" id="knob1" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="knob-group">
                    <label>Knob 2: <span id="knob2-value">0.50</span></label>
                    <input type="range" id="knob2" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="knob-group">
                    <label>Knob 3: <span id="knob3-value">0.50</span></label>
                    <input type="range" id="knob3" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="knob-group">
                    <label>Color (Knob 4): <span id="knob4-value">0.50</span></label>
                    <input type="range" id="knob4" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="knob-group">
                    <label>BG Color (Knob 5): <span id="knob5-value">0.50</span></label>
                    <input type="range" id="knob5" min="0" max="1" step="0.01" value="0.5">
                </div>
                <div class="button-group">
                    <button id="trigger-btn" class="trigger-button">Trigger</button>
                    <label>
                        <input type="checkbox" id="auto-clear"> Auto Clear
                    </label>
                </div>
                <div class="info-group">
                    <div>FPS: <span id="fps-display">0</span></div>
                    <div>Mode: <span id="mode-display">None</span></div>
                </div>
            </div>
        `;

        container.appendChild(panel);

        // Set up event listeners
        this.setupEventListeners();

        // Start FPS counter
        this.startFPSCounter();
    }

    /**
     * Set up event listeners for controls
     */
    setupEventListeners() {
        // Knob controls
        for (let i = 1; i <= 5; i++) {
            const knob = document.getElementById(`knob${i}`);
            const valueDisplay = document.getElementById(`knob${i}-value`);

            knob.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.eyesy[`knob${i}`] = value;
                valueDisplay.textContent = value.toFixed(2);
            });
        }

        // Trigger button
        const triggerBtn = document.getElementById('trigger-btn');
        triggerBtn.addEventListener('mousedown', () => {
            this.eyesy.trig = true;
        });
        triggerBtn.addEventListener('mouseup', () => {
            this.eyesy.trig = false;
        });
        triggerBtn.addEventListener('mouseleave', () => {
            this.eyesy.trig = false;
        });

        // Auto clear checkbox
        const autoClear = document.getElementById('auto-clear');
        autoClear.checked = this.eyesy.auto_clear;
        autoClear.addEventListener('change', (e) => {
            this.eyesy.auto_clear = e.target.checked;
        });
    }

    /**
     * Start FPS counter
     */
    startFPSCounter() {
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 0;

        const updateFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            const delta = currentTime - lastTime;

            if (delta >= 1000) {
                fps = Math.round((frameCount * 1000) / delta);
                document.getElementById('fps-display').textContent = fps;
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(updateFPS);
        };

        updateFPS();
    }

    /**
     * Update mode display
     */
    updateModeDisplay(modeName) {
        const modeDisplay = document.getElementById('mode-display');
        if (modeDisplay) {
            modeDisplay.textContent = modeName || 'None';
        }
    }
}

