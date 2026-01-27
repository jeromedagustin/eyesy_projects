# Web Deployment Options for EYESY Animations

This document outlines various approaches for running EYESY animations in a web browser. **Note: This document describes the decision-making process. The actual implementation uses the TypeScript rewrite approach (see below).**

## Current Implementation

The web version (`web-ts/`) uses a **native TypeScript rewrite** approach:

- ✅ **TypeScript classes** - All modes rewritten as TypeScript classes
- ✅ **WebGL rendering** - GPU-accelerated via Three.js
- ✅ **130+ modes ported** - All factory modes available
- ✅ **Full EYESY API** - Complete API compatibility
- ✅ **Client-side only** - No server required
- ✅ **Static deployment** - Builds to static files

See [`web-ts/README.md`](../web-ts/README.md) for current implementation details.

## Overview

EYESY modes are Python scripts that:
- Use pygame for rendering (drawing to a Surface)
- Require `setup()` and `draw()` functions
- Access the EYESY API (knobs, audio, triggers, color pickers)
- Run at 30-60 FPS typically

## Architecture Decision: Hardcoded Modes

**Important:** The web application uses **hardcoded example modes** rather than allowing users to submit arbitrary code. This means:

- ✅ **No code verification needed** - All modes are pre-approved and safe
- ✅ **Pre-optimization possible** - Modes can be optimized/bundled at build time
- ✅ **Simpler security model** - No need for sandboxing or AST parsing
- ✅ **Better performance** - Can use aggressive optimizations since code is known
- ✅ **Smaller bundle sizes** - Can tree-shake and minify known code
- ✅ **Easier deployment** - Modes are part of the application bundle

Users select from a curated list of example modes rather than uploading code.

## Approach Categories

### 1. Client-Side Execution Approaches ⭐ **RECOMMENDED FOR HARDCODED MODES**

These approaches run code directly in the browser. **Best for scalability and performance with hardcoded modes.**

#### 1.1 Pyodide (Python in WebAssembly) ⭐ **TOP RECOMMENDATION**
**How it works:**
- Use Pyodide to run Python in browser via WebAssembly
- Replace pygame with a JavaScript/Canvas bridge
- Implement EYESY API in JavaScript
- Run Python code directly in browser
- **With hardcoded modes:** Pre-bundle all modes with Pyodide at build time

**Pros:**
- ✅ Runs entirely client-side (no server load)
- ✅ No network latency
- ✅ True Python execution
- ✅ Can pre-bundle all modes with Pyodide for faster loading
- ✅ No security concerns (modes are hardcoded)
- ✅ Unlimited scalability (no server costs)
- ✅ Single download, then all modes available
- ✅ Can optimize bundle size (tree-shake unused Pyodide features)

**Cons:**
- ❌ pygame doesn't work natively (needs replacement)
- ❌ Large initial download (~10MB+ for Pyodide, but cached after first load)
- ❌ Performance may be slower than native Python (but acceptable for 30-60 FPS)
- ❌ Need to implement pygame-to-Canvas bridge
- ❌ Some Python libraries may not work

**Implementation complexity:** High  
**Performance:** Medium-High (WebAssembly overhead, but good enough)  
**Best for:** Production apps with hardcoded modes, unlimited scalability

**Required work:**
- Implement pygame Surface → HTML5 Canvas bridge
- Implement all pygame drawing functions (draw.circle, draw.line, etc.)
- Port EYESY API to JavaScript
- Build-time bundler to package all modes with Pyodide

**Why this is best for hardcoded modes:**
- All modes can be pre-bundled into a single optimized package
- Users download once, then can switch between all modes instantly
- No server rendering costs
- Can handle unlimited concurrent users

---

#### 1.2 JavaScript Transpilation
**How it works:**
- Python server renders frames to video stream
- Uses FFmpeg or similar to encode as H.264/H.265
- Streams via HLS, WebRTC, or MPEG-DASH
- Browser plays video stream

**Pros:**
- ✅ Better compression than individual frames
- ✅ Lower bandwidth than frame-by-frame
- ✅ Can buffer frames for smoother playback
- ✅ Standard video streaming protocols

**Cons:**
- ❌ Encoding overhead adds latency
- ❌ Still server resource intensive
- ❌ Complex setup (requires video encoding pipeline)
- ❌ Not real-time interactive (pre-rendered or delayed)

**Implementation complexity:** Medium-High  
**Performance:** Medium  
**Best for:** Pre-recorded animations, non-interactive demos

---

#### 1.3 Canvas API Rewrite ⭐ **IMPLEMENTED**
**How it works:**
- Manually rewrite pygame calls to WebGL/Three.js API
- Create TypeScript version of EYESY API
- Rewrite all modes in TypeScript
- **With hardcoded modes:** All modes are TypeScript from the start

**Pros:**
- ✅ Native browser performance (fastest)
- ✅ Full control over implementation
- ✅ No transpilation complexity
- ✅ Can optimize for web
- ✅ Smallest bundle size
- ✅ Best performance
- ✅ GPU-accelerated rendering (WebGL)
- ✅ Type safety with TypeScript

**Cons:**
- ❌ Requires rewriting all modes (significant upfront work) - **DONE: 130+ modes ported**
- ❌ Not Python anymore (different language)
- ❌ Loses Python ecosystem
- ❌ Maintenance of two codebases (Python for EYESY, TS for web)

**Implementation complexity:** Medium (but requires mode rewrites)  
**Performance:** Very High  
**Best for:** Long-term web-native platform, maximum performance

**Why this works for hardcoded modes:**
- Only need to rewrite modes once - **COMPLETED**
- Can optimize each mode for web specifically
- No runtime overhead
- Best possible performance

**Status:** ✅ **IMPLEMENTED** - See `web-ts/` directory

---

### 2. Server-Side Rendering (SSR) Approaches

These approaches run Python on the server and stream results to the browser. **Less ideal for hardcoded modes due to server costs and scalability limits.**

#### 2.1 Frame-by-Frame Image Streaming (WebSocket/SSE)
**How it works:**
- Python server runs the EYESY mode using headless pygame
- Each frame is captured as PNG/JPEG
- Frames are sent to browser via WebSocket or Server-Sent Events
- Browser displays frames in sequence using `<img>` or `<canvas>`

**Pros:**
- ✅ Full Python compatibility (no code changes needed)
- ✅ Works with all pygame features
- ✅ Easy to implement
- ✅ No security concerns (modes are pre-approved)
- ✅ Can pre-optimize modes at build time

**Cons:**
- ❌ High bandwidth usage (each frame is an image)
- ❌ Latency issues (network round-trip per frame)
- ❌ Server resource intensive (one process per user)
- ❌ Frame rate limited by network/server speed
- ❌ Not scalable for many concurrent users
- ❌ Ongoing server costs

**Implementation complexity:** Low-Medium  
**Performance:** Low-Medium (depends on server/network)  
**Best for:** Prototypes, low-traffic sites, demos, quick proof-of-concept

---

#### 2.2 Video Streaming (HLS/WebRTC/MPEG-DASH)
**How it works:**
- Python server renders frames to video stream
- Uses FFmpeg or similar to encode as H.264/H.265
- Streams via HLS, WebRTC, or MPEG-DASH
- Browser plays video stream

**Pros:**
- ✅ Better compression than individual frames
- ✅ Lower bandwidth than frame-by-frame
- ✅ Can buffer frames for smoother playback
- ✅ Standard video streaming protocols

**Cons:**
- ❌ Encoding overhead adds latency
- ❌ Still server resource intensive
- ❌ Complex setup (requires video encoding pipeline)
- ❌ Not real-time interactive (pre-rendered or delayed)
- ❌ Ongoing server costs

**Implementation complexity:** Medium-High  
**Performance:** Medium  
**Best for:** Pre-recorded animations, non-interactive demos

---

#### 2.3 Canvas Data Streaming (WebSocket Binary)
**How it works:**
- Python server renders to pygame Surface
- Extract raw pixel data (RGB array)
- Compress and send via WebSocket as binary
- Browser reconstructs image on HTML5 Canvas

**Pros:**
- ✅ Better compression than PNG/JPEG per frame
- ✅ Can use delta compression (only send changed pixels)
- ✅ Lower latency than video encoding
- ✅ Full Python compatibility

**Cons:**
- ❌ Still requires server per user
- ❌ Bandwidth can be high (raw pixel data)
- ❌ Network latency affects frame rate
- ❌ Server resource intensive
- ❌ Ongoing server costs

**Implementation complexity:** Medium  
**Performance:** Medium  
**Best for:** Interactive demos with moderate user count (<100 concurrent)

---

### 3. Hybrid Approaches

#### 3.1 Static Analysis + Client Execution
**How it works:**
- Server analyzes Python code (AST parsing)
- Verifies it's safe to run (no file system, network access)
- Transforms pygame calls to Canvas operations
- Generates JavaScript/WebAssembly code
- Client executes generated code

**Pros:**
- ✅ Client-side execution (no server load)
- ✅ Can optimize during transformation (at build time)
- ✅ No security concerns (modes are hardcoded)
- ✅ Can pre-generate optimized code for all modes

**Cons:**
- ❌ Complex implementation (AST parsing, code generation)
- ❌ Limited to supported pygame subset
- ❌ Requires ongoing maintenance
- ✅ Can do all transformation at build time (no runtime overhead)

**Implementation complexity:** Very High  
**Performance:** High (after transformation)  
**Best for:** Production code playgrounds

---

#### 3.2 WebGL/WebGPU Rendering
**How it works:**
- Server or client translates pygame calls to WebGL/WebGPU
- Use GPU for rendering (faster than Canvas 2D)
- Can run Python via Pyodide or transpile to JS

**Pros:**
- ✅ High performance (GPU acceleration)
- ✅ Can handle complex graphics
- ✅ Modern web technology

**Cons:**
- ❌ Complex implementation (3D graphics programming)
- ❌ pygame is 2D-focused, WebGL is 3D
- ❌ Need to implement 2D rendering on 3D API
- ❌ Browser compatibility (WebGPU is newer)

**Implementation complexity:** Very High  
**Performance:** Very High  
**Best for:** High-performance visualizations

---

### 4. Specialized Solutions

**Note:** These approaches are generally not recommended for production due to high resource usage and poor scalability.

#### 4.1 Headless Browser Automation (Playwright/Selenium)
**How it works:**
- Run Python code in headless browser with Playwright
- Use pygame-web or similar pygame port
- Capture frames and stream to users
- Or embed iframe with rendered content

**Pros:**
- ✅ Can use existing pygame-web projects
- ✅ Isolated execution environment
- ✅ Can capture screenshots/video

**Cons:**
- ❌ Very resource intensive (full browser per user)
- ❌ High latency
- ❌ Not scalable
- ❌ Complex setup

**Implementation complexity:** Medium  
**Performance:** Low  
**Best for:** Development/testing, not production

---

#### 4.2 Docker Container Per Session
**How it works:**
- Each user gets isolated Docker container
- Container runs Python + pygame
- Stream frames via WebSocket
- Destroy container after session

**Pros:**
- ✅ Complete isolation (security)
- ✅ Full Python/pygame compatibility
- ✅ Can limit resources per container

**Cons:**
- ❌ Very resource intensive
- ❌ Container startup overhead
- ❌ Complex orchestration
- ❌ Expensive to scale

**Implementation complexity:** High  
**Performance:** Medium (with overhead)  
**Best for:** Enterprise solutions with budget

---

## Recommended Approaches by Use Case

### ⭐ For Production (IMPLEMENTED)
**Best Choice: TypeScript Rewrite + WebGL (1.3)** ✅ **CURRENT IMPLEMENTATION**
- ✅ Client-side execution (no server costs)
- ✅ Unlimited scalability
- ✅ All modes bundled at build time
- ✅ Single download, all modes available
- ✅ Excellent performance (60 FPS on modern hardware)
- ✅ GPU-accelerated rendering
- ✅ Type-safe codebase
- ✅ Smallest bundle size (no Python runtime)

**Why this is best for hardcoded modes:**
- All modes bundled once, users download once
- No ongoing server costs
- Can handle unlimited concurrent users
- Best possible performance
- **Status:** ✅ Fully implemented in `web-ts/` directory

### Alternative: Pyodide + Canvas Bridge (1.1)
- ✅ Client-side execution (no server costs)
- ✅ Unlimited scalability
- ✅ Pre-bundle all modes at build time
- ✅ Single download, all modes available
- ✅ Good performance (30-60 FPS achievable)
- ⚠️ Requires pygame-to-Canvas bridge implementation
- ⚠️ ~10MB initial download (but cached)
- **Status:** Not implemented (TypeScript approach chosen instead)

### For Maximum Performance
**Best Choice: JavaScript Transpilation (1.2)**
- ✅ Native browser performance (fastest)
- ✅ Smallest bundle size
- ✅ Best user experience
- ⚠️ Very high implementation complexity
- ⚠️ Requires transpiler maintenance

**Alternative: Canvas API Rewrite (1.3)**
- ✅ Maximum performance
- ✅ Full control
- ⚠️ Requires rewriting all modes
- ⚠️ Two codebases to maintain

### For Quick Prototyping / MVP
**Best Choice: Frame-by-Frame Image Streaming (2.1)**
- ✅ Quick to implement (few hours)
- ✅ Works with existing code (no changes)
- ✅ Good for demos and testing
- ❌ Not scalable
- ❌ High server costs
- ❌ Latency issues

**Use this to:**
- Validate the concept quickly
- Test with real modes
- Build a demo
- Then migrate to client-side approach

## Mode Bundling Strategy

Since modes are hardcoded, you can optimize them at build time:

### Build-Time Optimizations

1. **Pre-processing**: 
   - Validate all modes have `setup()` and `draw()` functions
   - Check for common issues (missing imports, etc.)
   - Extract metadata (mode name, category, description)

2. **Code Optimization**:
   - For client-side approaches: Pre-transpile/convert modes
   - For Pyodide: Pre-bundle Python code with Pyodide
   - For JavaScript: Pre-transpile all modes to JS
   - Tree-shake unused code
   - Minify generated code

3. **Asset Bundling**:
   - Include mode images/assets in application bundle
   - Optimize images (compress, resize if needed)
   - Create asset manifest for fast loading

4. **Mode Registry**:
   - Create JSON manifest of all available modes
   - Include metadata (name, category, knob descriptions)
   - Enable fast mode switching

### Adding New Modes

To add a new mode to the application:
1. Add mode folder to `examples/` or `custom/` directory
2. Run build script to validate and bundle the mode
3. Mode becomes available in the web application
4. No runtime code validation needed (already verified at build time)

## Implementation Considerations

### Required Components

1. **Mode Registry** (Build-time)
   - Scan `examples/` and `custom/` directories
   - Validate each mode has `setup()` and `draw()` functions
   - Extract mode metadata
   - Generate mode manifest JSON

2. **Mode Bundler** (Build-time)
   - Bundle modes based on chosen approach:
     - For client-side: Convert to JS/WebAssembly
     - For server-side: Package for server deployment
   - Include assets (images, etc.)
   - Optimize code and assets

3. **EYESY API Implementation**
   - Knob values (0.0-1.0)
   - Audio input simulation
   - Color picker functions
   - Trigger simulation
   - Resolution handling

3. **Rendering Bridge**
   - pygame Surface → Web display
   - Frame capture/encoding
   - Canvas/WebGL rendering

4. **Control Interface**
   - Knob controls (sliders/inputs)
   - Trigger button
   - Audio input (optional)
   - Settings (auto_clear, etc.)

### Performance Targets

- **Frame Rate**: 30 FPS minimum (60 FPS ideal)
- **Latency**: <100ms for interactive controls
- **Bandwidth**: <5 Mbps per user (for streaming approaches)
- **Server Resources**: <500MB RAM per user (for server-side)

## Mode Structure in Web Application

### Mode Registry Format

The application will include a mode registry (JSON) that lists all available modes:

```json
{
  "modes": [
    {
      "id": "s-classic-horizontal",
      "name": "S - Classic Horizontal",
      "category": "scopes",
      "path": "examples/scopes/S - Classic Horizontal",
      "description": "Classic horizontal waveform display",
      "knobs": {
        "knob1": "Line thickness",
        "knob2": "Amplitude",
        "knob3": "Smoothing",
        "knob4": "Foreground color",
        "knob5": "Background color"
      }
    },
    {
      "id": "t-basic-image",
      "name": "T - Basic Image",
      "category": "triggers",
      "path": "examples/triggers/T - Basic Image",
      "description": "Display images on trigger",
      "knobs": {
        "knob1": "Image scale",
        "knob2": "Rotation speed",
        "knob3": "Opacity",
        "knob4": "Foreground color",
        "knob5": "Background color"
      }
    }
  ],
  "categories": {
    "scopes": "Audio-reactive scope modes",
    "triggers": "Trigger-based pattern modes",
    "utilities": "Utility modes",
    "custom": "Custom user modes"
  }
}
```

### Application Structure

```
web-app/
├── public/
│   └── modes/              # Bundled mode files
│       ├── s-classic-horizontal.py
│       ├── t-basic-image.py
│       └── assets/          # Mode images/assets
├── src/
│   ├── modes/
│   │   ├── manifest.json   # Mode registry
│   │   └── registry.ts     # TypeScript types for modes
│   ├── api/
│   │   └── eyesy-api.ts    # EYESY API implementation
│   └── components/
│       ├── ModeSelector.tsx # Mode selection UI
│       └── AnimationViewer.tsx # Main animation display
└── tools/
    ├── build_scanner.py    # Scan and validate modes
    ├── bundle_pyodide.py   # Bundle for Pyodide
    └── transpile_modes.py  # Transpile to JavaScript
```

## Build Process Example

With hardcoded modes, the build process might look like:

```bash
# 1. Scan and validate all modes
python tools/build_scanner.py --scan examples/ custom/

# 2. Generate mode manifest
python tools/build_scanner.py --manifest > src/modes/manifest.json

# 3. Bundle modes based on approach
# For Pyodide:
python tools/bundle_pyodide.py --output dist/modes/

# For JavaScript transpilation:
python tools/transpile_modes.py --output src/modes/

# 4. Build web application
npm run build  # or similar
```

### Adding a New Mode

1. **Add mode to repository:**
   ```bash
   # Add mode to examples/ or custom/ directory
   cp -r new_mode examples/scopes/
   ```

2. **Run build script:**
   ```bash
   # Build script automatically:
   # - Validates the mode
   # - Adds it to manifest.json
   # - Bundles it for the web app
   npm run build:modes
   ```

3. **Mode is now available:**
   - Appears in mode selector
   - Can be selected and run
   - No code changes needed in web app

## Next Steps

1. **Choose an approach** based on your requirements (Pyodide recommended for scalability)
2. **Create build pipeline** to bundle hardcoded modes
3. **Build a proof-of-concept** for the chosen approach
4. **Test with real EYESY modes** to validate compatibility
5. **Optimize** based on performance metrics
6. **Deploy** and iterate based on user feedback

## References

- [Pyodide Documentation](https://pyodide.org/)
- [pygame-web](https://github.com/pygame-web/pygame-web) (pygame port to web)
- [Transcrypt](https://www.transcrypt.org/) (Python to JavaScript compiler)
- [WebAssembly](https://webassembly.org/)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

