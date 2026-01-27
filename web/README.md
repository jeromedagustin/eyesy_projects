# EYESY Web Application (Pyodide) - Legacy

**Note:** This is the legacy Pyodide-based implementation. The current web version uses a TypeScript rewrite with WebGL rendering. See [`../web-ts/README.md`](../web-ts/README.md) for the current implementation.

This directory contains a web-based implementation of EYESY modes using Pyodide (Python in WebAssembly). Modes run entirely client-side in the browser.

## Structure

```
web/
├── index.html              # Main application page
├── js/
│   ├── pyodide-loader.js   # Pyodide initialization and loading
│   ├── pygame-bridge.js    # pygame API bridge to HTML5 Canvas
│   ├── eyesy-api.js        # EYESY API implementation
│   ├── mode-runner.js      # Mode loading and execution
│   └── controls.js         # UI controls (knobs, buttons)
├── modes/                  # Python mode files (bundled at build time)
│   └── template_mode.py
├── assets/                 # Mode assets (images, etc.)
└── build/                  # Build output (generated)
```

## Setup

1. Install dependencies (if using a build tool):
   ```bash
   npm install  # if using npm
   ```

2. Serve the application:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx serve .
   ```

3. Open in browser:
   ```
   http://localhost:8000
   ```

## How It Works

1. **Pyodide Loader**: Initializes Pyodide and loads Python runtime
2. **pygame Bridge**: Provides pygame API using HTML5 Canvas
3. **EYESY API**: Implements EYESY hardware API (knobs, audio, colors)
4. **Mode Runner**: Loads and executes Python mode files
5. **Controls**: UI for adjusting knobs and triggers

## Building Modes

Use the build script to bundle Python modes:

```bash
# From project root
python tools/build_web_modes.py
```

This will:
- Scan `examples/` and `custom/` directories
- Validate all modes (check for `setup()` and `draw()` functions)
- Copy Python mode files to `web/modes/`
- Copy assets (images) to `web/assets/`
- Generate `web/modes/manifest.json`

**Result:** 130+ modes are now available in the web application!

See `BUILD.md` for detailed build documentation.

## Development

- Modes are loaded dynamically from `web/modes/` directory
- Mode list is loaded from `web/modes/manifest.json`
- Each mode must have `setup(screen, eyesy)` and `draw(screen, eyesy)` functions
- pygame API is bridged to Canvas, so most pygame drawing functions work
- Audio is simulated (can be extended to use Web Audio API)

### Adding New Modes

1. Add mode to `examples/` or `custom/` directory
2. Run build script: `python tools/build_web_modes.py`
3. Mode appears in web app automatically

### Testing

Run the test suite:

```bash
# Start server
python -m http.server 8000

# Open test page
http://localhost:8000/test/test-runner.html
```

## Browser Compatibility

- Modern browsers with WebAssembly support
- Chrome, Firefox, Safari, Edge (recent versions)
- Pyodide requires ~10MB download (cached after first load)

