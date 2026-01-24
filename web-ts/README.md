# EYESY Web - TypeScript

Native TypeScript rewrite of EYESY visual synthesizer modes running entirely in the browser.

## Quick Start

```bash
cd web-ts
npm install
npm run dev
```

Open http://localhost:5173 (Vite default port)

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture.

## Features

- ✅ **Native TypeScript** - No Python runtime, runs entirely client-side
- ✅ **WebGL GPU-accelerated rendering** - Uses Three.js for high-performance graphics
- ✅ **130+ modes ported** - All factory modes available, organized by category (Scopes, Triggers, LFO, Time, Noise, Geometric, Pattern, 3D, Utilities)
- ✅ **Type-safe API** - Matches Python EYESY API exactly
- ✅ **Full UI** - Controls panel, mode browser, mobile support
- ✅ **Web Audio API** - Real microphone input with gain control
- ✅ **Webcam support** - Live camera feed for webcam modes
- ✅ **Image upload** - Upload custom images for image-based modes
- ✅ **Smooth transitions** - Animated transitions between modes (fade, slide, wipe, zoom, and more)
- ✅ **Mock Audio** - Simulate audio signals for testing scope modes without microphone
- ✅ **Random Trigger** - Automatically trigger modes at random intervals
- ✅ **3D Modes** - Three-dimensional visualizations using Three.js
- ✅ **Post-Processing Effects** - 30+ visual effects (bloom, blur, chromatic aberration, VHS, and more)
- ✅ **Settings persistence** - All settings saved to IndexedDB
- ✅ **Mobile optimized** - Touch gestures, responsive layout, portrait rotation
- ✅ **Seizure safety** - Built-in filter for photosensitive epilepsy
- ✅ **Favorites system** - Mark and filter favorite modes
- ✅ **Auto-pause on hidden** - Automatically pauses when tab is hidden to save resources
- ✅ **Hot module replacement** - Fast development with Vite
- ✅ **Easy deployment** - Static files, works on any hosting

## How It Works

### Mode System

Modes are TypeScript classes that implement the `Mode` interface:

```typescript
export class MyMode implements Mode {
  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    // Initialize - called once when mode loads
    // Can be async for loading images, fonts, etc.
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // Draw each frame - called 60 times per second
    const color = eyesy.color_picker(eyesy.knob4);
    canvas.circle([x, y], radius, color);
  }
  
  dispose?(): void {
    // Optional cleanup when mode unloads
  }
}
```

### Rendering Pipeline

1. **Canvas API** - Provides pygame-like drawing functions (circle, line, rect, etc.)
2. **WebGL Backend** - All drawing uses Three.js/WebGL for GPU acceleration
3. **Frame Capture** - Each frame is captured for transitions and feedback effects
4. **Animation Loop** - Runs at 60fps using `requestAnimationFrame`

### EYESY API

The web version implements the full EYESY API:

- **Knobs 1-5**: Standard EYESY knobs (0.0 to 1.0)
- **Knob 6**: Rotation (web-only, 0-360°)
- **Knob 7**: Zoom (web-only, 0.1x to 5.0x)
- **Knob 8**: Animation Speed (web-only, 0.01x to 3.0x)
- **Audio Input**: Web Audio API, mock audio simulation, or microphone input
- **Triggers**: Spacebar, touch, UI button, or random automatic triggers
- **Color Pickers**: `color_picker()`, `color_picker_lfo()`, `color_picker_bg()`
- **Transitions**: Configurable duration (0.1-6.0s) and type (fade, slide, wipe, zoom, etc.)

### Mode Loading

All modes are bundled at build time (not loaded dynamically):

1. Modes are TypeScript classes in `src/modes/`
2. All modes are exported from `src/modes/index.ts`
3. App loads modes from the index on startup
4. Modes are instantiated when selected
5. `setup()` is called (can be async)
6. `draw()` is called every frame

### Controls

- **Knobs 1-8**: Sliders for all parameters
- **Trigger Button**: Toggle trigger state
- **Auto Clear**: Toggle frame clearing
- **Microphone**: Enable/disable mic input with gain control
- **Mock Audio**: Simulate audio signals with configurable pattern complexity and intensity randomness
- **Random Trigger**: Automatically trigger modes at random intervals
- **Webcam**: Request camera permission with device selection
- **Images**: Upload images for image modes
- **Transitions**: Configure mode transition effects (duration, type, enable/disable)
- **Effects**: 30+ post-processing effects with intensity controls
- **Settings**: Left-handed layout, portrait rotate, favorites filter, auto-clear toggle

### Mobile Support

- **Touch Gestures**: Tap to trigger, swipe to navigate modes
- **Pinch to Zoom**: Two-finger pinch adjusts zoom
- **Two-Finger Rotate**: Rotate animation with two fingers
- **Responsive Layout**: Adapts to portrait/landscape
- **Portrait Rotation**: Optional 90° rotation in portrait mode
- **Wake Lock**: Prevents screen sleep during use

## Development

### Adding a New Mode

1. Create a new TypeScript file in `src/modes/[category]/`
2. Implement the `Mode` interface
3. Export the mode class
4. Add to `src/modes/index.ts`:

```typescript
import { MyMode } from './scopes/MyMode';

export const modes: ModeInfo[] = [
  // ... existing modes
  {
    id: 's-my-mode',
    name: 'S - My Mode',
    category: 'scopes',
    mode: MyMode,
    experimental: false,
  },
];
```

### Building

```bash
npm run build
```

Outputs to `dist/` directory - static files ready for deployment.

### Testing

```bash
npm test              # Run tests
npm run test:ui       # Test UI
npm run test:coverage # Coverage report
```

## Deployment

The build produces static files that can be deployed anywhere:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag `dist/` folder
- **GitHub Pages**: Push `dist/` to `gh-pages` branch
- **Any static host**: Upload `dist/` contents

No server required - runs entirely client-side!

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 15+)
- Modern browsers with WebGL support

## Performance

- **60 FPS** target on modern hardware
- **GPU-accelerated** rendering via WebGL
- **Efficient batching** of draw calls
- **Texture caching** for images
- **Settings persistence** via IndexedDB

## Differences from Python Version

### Web-Only Features

- **Knob 6**: Rotation (0-360°)
- **Knob 7**: Zoom (0.1x to 5.0x)
- **Knob 8**: Animation Speed (0.01x to 3.0x)
- **Transitions**: Smooth animated transitions between modes
- **Mobile UI**: Touch gestures and responsive layout
- **Settings Storage**: Persistent settings in browser

### API Compatibility

The web version maintains full API compatibility with the Python version. All standard EYESY functions work identically:

- `eyesy.color_picker(knob)` - Same color mapping
- `eyesy.audio_in[]` - Same audio format (-32768 to 32767)
- `eyesy.trig` - Same trigger behavior
- `canvas.circle()`, `canvas.line()`, etc. - Same drawing API

### Limitations

- **No file system access** - Images must be uploaded or bundled
- **No Python libraries** - All functionality is TypeScript/Web APIs
- **Browser security** - Some features require user permission (mic, webcam)

