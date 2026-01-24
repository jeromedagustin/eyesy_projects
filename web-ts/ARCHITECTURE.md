# EYESY Web - TypeScript/Vite Architecture

## Overview
Native TypeScript rewrite of EYESY modes using modern web technologies.

## Tech Stack
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type safety and better DX
- **WebGL** - High-performance GPU-accelerated rendering (ready for 3D)
- **Web Audio API** - Audio analysis and reactivity
- **Modern ES Modules** - Clean, maintainable code

## Project Structure
```
web-ts/
├── src/
│   ├── core/
│   │   ├── EYESY.ts          # Main EYESY API (knobs, audio, colors)
│   │   ├── Canvas.ts         # Canvas wrapper (replaces pygame.Surface)
│   │   └── AudioAnalyzer.ts  # Web Audio API wrapper
│   ├── modes/
│   │   ├── base/
│   │   │   └── Mode.ts       # Base mode interface
│   │   └── scopes/
│   │       ├── ClassicHorizontal.ts
│   │       └── ...
│   ├── ui/
│   │   ├── Controls.tsx      # React controls (or vanilla)
│   │   └── ModeSelector.tsx
│   └── App.tsx               # Main app
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## API Design (Similar to Python)

### EYESY API
```typescript
interface EYESY {
  // Knobs (0.0 to 1.0)
  knob1: number;
  knob2: number;
  knob3: number;
  knob4: number; // Foreground color
  knob5: number; // Background color
  
  // Audio
  audio_in: Int16Array; // -32768 to 32768
  audio_in_r: Int16Array;
  
  // Display
  xres: number;
  yres: number;
  
  // State
  trig: boolean;
  auto_clear: boolean;
  
  // Colors
  color_picker(knob: number): [number, number, number]; // RGB
  color_picker_lfo(knob: number): [number, number, number];
  color_picker_bg(knob: number): [number, number, number];
}
```

### Canvas API (pygame-like)
```typescript
class Canvas {
  fill(color: [number, number, number]): void;
  circle(center: [number, number], radius: number, color: [number, number, number], width?: number): void;
  line(start: [number, number], end: [number, number], color: [number, number, number], width?: number): void;
  rect(x: number, y: number, w: number, h: number, color: [number, number, number], width?: number): void;
  polygon(points: [number, number][], color: [number, number, number], width?: number): void;
}
```

### Mode Interface
```typescript
interface Mode {
  setup(canvas: Canvas, eyesy: EYESY): void;
  draw(canvas: Canvas, eyesy: EYESY): void;
}
```

## Benefits Over Pyodide
1. **Performance**: Native JS, no Python runtime overhead
2. **GPU Acceleration**: WebGL provides hardware-accelerated rendering
3. **Type Safety**: TypeScript catches errors at compile time
4. **Debugging**: Standard browser dev tools
5. **Bundle Size**: Much smaller (no Pyodide ~10MB)
6. **Hot Reload**: Vite HMR for instant feedback
7. **Deployment**: Standard static hosting (Vercel, Netlify, etc.)
8. **3D Ready**: WebGL foundation enables future 3D mode capabilities

## Migration Strategy
1. Port core API first (EYESY, Canvas)
2. Port simple modes (Classic Horizontal, etc.)
3. Add audio reactivity
4. Port complex modes
5. Add image loading support

## Rendering Architecture

### WebGL Implementation
The Canvas class uses WebGL for all rendering operations:
- **Shaders**: Custom GLSL shaders for circles, lines, polygons, and fills
- **Batching**: Efficient buffer management for geometry
- **Performance**: GPU-accelerated drawing for smooth 60fps animations
- **Future-Proof**: WebGL foundation enables 3D mode extensions

### API Compatibility
The Canvas API maintains the same interface as the original Canvas 2D implementation, ensuring all existing modes work without modification. The WebGL implementation is transparent to mode code.

## Current Status

1. ✅ Initialize Vite + TypeScript project
2. ✅ Create core EYESY API
3. ✅ Create WebGL Canvas wrapper
4. ✅ Port 130+ modes (all factory modes)
5. ✅ Web Audio API for real audio input
6. ✅ Mock Audio simulation for testing
7. ✅ Full UI controls (knobs, triggers, settings)
8. ✅ Image loading support
9. ✅ Webcam support with centralized service
10. ✅ Mobile UI with touch gestures
11. ✅ Settings persistence (IndexedDB)
12. ✅ Mode transitions with multiple types and configurable duration
13. ✅ Favorites system
14. ✅ Seizure safety filter
15. ✅ Post-processing effects system (30+ effects)
16. ✅ Random trigger mode
17. ✅ 3D mode support with Three.js
18. ✅ Comprehensive test suite (1,179 tests)

## Future Enhancements

- Extend WebGL for 3D mode capabilities
- Additional transition effects
- MIDI input support
- Audio file playback
- Performance optimizations

