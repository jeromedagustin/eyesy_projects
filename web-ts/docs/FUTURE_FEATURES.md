# EYESY Web - Future Features Roadmap

## Overview
This document outlines planned features, enhancements, and improvements for the EYESY Web application.

**Last Updated:** January 2025

**Recent Major Updates:**
- ✅ Post-processing effects system fully implemented (30+ effects)
- ✅ Webcam integration with centralized service
- ✅ Advanced effects UI with real-time controls
- ✅ Mode transitions with multiple types and configurable duration
- ✅ Mock Audio simulation for testing scope modes
- ✅ Random Trigger mode for automatic triggering
- ✅ 3D mode support with Three.js
- ✅ Comprehensive transition test suite

---

## ✅ Recently Implemented Features

### Mobile & Responsive Design
- ✅ **Landscape/Portrait Mode Optimization** - Canvas automatically resizes and optimizes layout based on orientation
- ✅ **Portrait Rotation** - Option to rotate animation 90° in portrait mode for larger display
- ✅ **Mobile Navigation** - Header navigation arrows and footer mode browser in portrait mode
- ✅ **Left-Handed Layout** - Controls panel can be positioned on left or right side
- ✅ **Responsive Canvas Sizing** - Smart aspect ratio handling with space maximization
- ✅ **Safe Area Support** - Proper handling of device safe areas (iOS home indicator, etc.)

### User Experience
- ✅ **Pause/Resume Animation** - Pause button with keyboard shortcut (P)
- ✅ **Auto-Pause on Tab Hidden** - Automatically pauses when browser tab is hidden to save CPU/GPU resources, resumes when visible
- ✅ **Screenshot Capture** - Save current animation frame as PNG (keyboard shortcut: S)
- ✅ **Mode Browser** - Grid-based mode selection with search and filtering
- ✅ **Dynamic Parameter Names** - Mode-specific parameter descriptions displayed in controls
- ✅ **Mode Transitions** - Smooth transitions between modes with multiple transition types
- ✅ **Settings Persistence** - All user preferences saved to IndexedDB (knobs, UI settings, per-mode preferences)

### Advanced Features
- ✅ **Webcam Integration** - Centralized WebcamService for shared camera access across modes
- ✅ **Webcam UI Controls** - Enable/disable webcam, device selection, permission management
- ✅ **Post-Processing Effects System** - Full effects pipeline with 10+ effects (bloom, chromatic aberration, scanlines, VHS, blur, pixelation, invert, edge detection, vignette, color grading)
- ✅ **Effects UI** - Complete UI controls for all effects with intensity sliders and real-time updates
- ✅ **FPS Control** - User-adjustable target FPS for animation speed control

---

## 🎯 High Priority Features

### 1. Mobile & Touch Support
**Status:** ✅ Partially Implemented  
**Priority:** High  
**See:** [MOBILE_CONTROLS.md](./MOBILE_CONTROLS.md)

**Implemented:**
- ✅ Responsive canvas sizing
- ✅ Orientation handling (landscape/portrait)
- ✅ Mobile-friendly control panel
- ✅ Touch-friendly navigation

**Remaining:**
- [ ] Gesture-based knob controls (pinch, swipe)
- [ ] Touch-specific interactions (long-press, multi-touch)
- [ ] Haptic feedback for controls

### 2. MIDI Input Support
**Status:** Not Started  
**Priority:** High  

Connect hardware MIDI controllers:
- Web MIDI API integration
- MIDI learn for knob mapping
- MIDI CC to knob routing
- MIDI note triggers
- MIDI clock sync

```typescript
interface MIDIMapping {
  channel: number;
  cc: number;
  target: 'knob1' | 'knob2' | ... | 'trigger';
}
```

### 3. Audio File Input
**Status:** Not Started  
**Priority:** High  

Play audio files as input source:
- Drag & drop audio files
- Audio file browser
- Play/pause/seek controls
- Loop mode
- Sync visualizations to beat

### 4. Recording & Export
**Status:** ✅ Partially Implemented  
**Priority:** High  

**Implemented:**
- ✅ Screenshot capture (PNG) - Direct WebGL pixel reading with proper image flipping

**Remaining:**
- [ ] WebM/MP4 video recording
- [ ] GIF export
- [ ] Resolution options (720p, 1080p, 4K)
- [ ] Frame rate control
- [ ] Recording duration limits

```typescript
interface RecordingOptions {
  format: 'webm' | 'mp4' | 'gif';
  resolution: '720p' | '1080p' | '4K';
  frameRate: 30 | 60;
  duration?: number; // seconds
}
```

---

## 🎨 Visual Enhancements

### 5. Custom Color Palettes
**Status:** Not Started  
**Priority:** Medium  

User-defined color schemes:
- Color palette editor (visual picker)
- Import/export palettes (JSON, image-based)
- Per-mode palette selection
- Popular palettes (Synthwave, Neon, Pastel, Cyberpunk, etc.)
- Gradient palette support
- Color harmony tools (complementary, triadic, analogous)
- Palette preview thumbnails

### 6. Blend Modes
**Status:** Not Started  
**Priority:** Medium  

WebGL blend mode options:
- Add (screen)
- Multiply
- Overlay
- Soft light
- Difference
- Exclusion
- Color dodge/burn
- Hard light
- Per-layer blend modes
- Blend mode preview

### 7. Post-Processing Effects
**Status:** ✅ Implemented  
**Priority:** Medium  

**Implemented:**
- ✅ **Effect System Architecture** - Pre/post effects pipeline with EffectManager
- ✅ **Bloom/Glow** - Multi-pass bloom effect with threshold extraction and Gaussian blur
- ✅ **Chromatic Aberration** - RGB channel separation for retro/vintage look
- ✅ **Scanlines (CRT Effect)** - Horizontal scanlines with flicker animation
- ✅ **VHS Distortion** - Wave distortion, jitter, noise, color bleeding, and damage lines
- ✅ **Color Grading** - Brightness, contrast, saturation, and hue adjustment
- ✅ **Blur** - Gaussian blur post-processing
- ✅ **Pixelation** - Pixel art effect with resolution reduction
- ✅ **Invert** - Color inversion/negative effect
- ✅ **Edge Detection** - Sobel edge detection for outline effect
- ✅ **Vignette** - Edge darkening effect
- ✅ **Effects UI** - Full UI controls with enable/disable and intensity sliders
- ✅ **Effects Persistence** - Settings saved to IndexedDB

**Remaining Ideas:**
- [ ] Effect presets (save/load effect combinations)
- [ ] Effect order adjustment (drag to reorder)
- [ ] Per-mode effect settings
- [ ] Real-time effect preview thumbnails
- [ ] Performance mode (disable expensive effects on low-end devices)

### 8. 3D Mode Support
**Status:** Planning  
**Priority:** Medium  

Enable true 3D visualizations:
- 3D camera controls (orbit, pan, zoom, dolly)
- Depth-based effects (depth of field, fog, atmospheric scattering)
- 3D particle systems
- Import 3D models (.obj, .gltf, .fbx)
- 3D primitives library (spheres, cubes, torus, etc.)
- Lighting system (directional, point, spot, ambient lights)
- Shadows and reflections
- Post-processing for 3D (SSAO, motion blur)

---

## 🔧 Technical Improvements

### 9. Performance Mode
**Status:** Not Started  
**Priority:** Medium  

Optimize for lower-end devices:
- Reduced resolution rendering (0.5x, 0.75x scale options)
- Frame rate limiting (30fps, 24fps, 15fps options) - ✅ Basic FPS control implemented
- Simplified shader effects (disable expensive effects automatically)
- Memory usage optimization
- Texture compression (ASTC, ETC2)
- Adaptive quality (auto-adjust based on FPS)
- GPU/CPU usage monitoring and display
- Performance profiling tools

### 10. Preset System
**Status:** Not Started  
**Priority:** Medium  

Save and share configurations:
- Save mode + knob settings as preset
- Include effects configuration in presets
- Preset browser with search and tags
- Import/export presets (JSON)
- Community preset sharing
- Preset categories (music genres, moods, visual styles)
- Preset preview thumbnails
- Quick preset switching (keyboard shortcuts)
- Preset versioning
- Favorite presets

```typescript
interface Preset {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  modeId: string;
  knobs: number[];
  colors?: ColorPalette;
  effects?: PostEffects;
  thumbnail?: string; // Base64 or URL
  author?: string;
  createdAt: number;
  updatedAt: number;
  version?: string;
}
```

### 11. Mode Sequencer
**Status:** Not Started  
**Priority:** Low  

Automatic mode switching:
- Create playlists of modes
- Timed transitions (duration per mode)
- Beat-synced switching (switch on beat detection)
- Randomization options (random order, weighted random)
- Loop playlists
- Crossfade between modes
- Sequence editor (timeline view)
- Save/load sequences
- Sequence templates

### 12. Web Workers
**Status:** Not Started  
**Priority:** Low  

Move heavy computation off main thread:
- Audio analysis in worker (FFT, beat detection, frequency analysis)
- Image processing in worker (effects preprocessing)
- Improved frame rate consistency
- Parallel effect processing
- Background mode loading
- OffscreenCanvas for rendering

---

## 🎛️ UI/UX Improvements

### 13. Fullscreen Mode
**Status:** ✅ Partially Implemented  
**Priority:** High  

**Implemented:**
- ✅ Fullscreen API integration
- ✅ Keyboard shortcuts for control

**Remaining:**
- [ ] Hide all controls in fullscreen
- [ ] Cursor auto-hide
- [ ] Picture-in-picture support
- [ ] Fullscreen-specific layout optimizations

### 14. Split View
**Status:** Not Started  
**Priority:** Low  

Compare modes side-by-side:
- Dual canvas rendering
- A/B comparison
- Blend between two modes

### 15. Accessibility & Safety
**Status:** ✅ Partially Implemented  
**Priority:** Medium  

**Implemented:**
- ✅ **Seizure-Safe Mode Auto-Enable** - Automatically enables seizure-safe mode for high/medium risk modes
- ✅ **Per-Mode Seizure Risk Levels** - Modes marked with `seizureRisk: 'high' | 'medium' | 'low'`
- ✅ **Seizure-Safe Mode Persistence** - User preferences for seizure-safe mode saved per-mode
- ✅ **Seizure Safety Filter** - WCAG 2.3.1 compliant filtering (flash detection, red flash prevention, speed limiting)
- ✅ **System Prefers-Reduced-Motion Detection** - Respects user's motion preferences
- ✅ **Keyboard Shortcuts** - Keyboard shortcuts for common actions

**Remaining:**
- [ ] Keyboard-only navigation
- [ ] Screen reader support (ARIA labels)
- [ ] High contrast mode
- [ ] Focus indicators
- [ ] Tab order optimization

---

## 🌐 Connectivity Features

### 16. NDI/Spout Output
**Status:** Research  
**Priority:** Low  

Stream to VJ software:
- NDI output (via native app bridge)
- Syphon support (macOS)
- Spout support (Windows)

### 17. OSC Support
**Status:** Not Started  
**Priority:** Low  

Open Sound Control for remote control:
- Receive OSC messages
- Send OSC (for feedback)
- TouchOSC templates
- Lemur integration

### 18. Real-Time Collaboration
**Status:** Not Started  
**Priority:** Low  

Multiple users controlling same session:
- WebSocket sync
- Room-based sessions (create/join rooms)
- Shared cursor/knob control
- Chat integration
- Session recording/playback
- Permission levels (viewer, controller, admin)

---

## 💡 New Feature Ideas

### Advanced Audio Analysis
**Status:** Not Started  
**Priority:** Medium  

Enhanced audio processing:
- Beat detection and BPM calculation
- Frequency band isolation (bass, mid, treble, sub-bass)
- Harmonic analysis
- Onset detection (note/chord detection)
- Tempo tracking
- Audio visualization modes (spectrum, waveform, waterfall, spectrogram)
- Key detection
- Rhythm pattern recognition

### Multi-Layer Compositing
**Status:** Not Started  
**Priority:** Low  

Layer-based composition:
- Multiple mode layers
- Per-layer opacity and blend modes
- Layer masks
- Layer effects (per-layer post-processing)
- Timeline-based layer animation
- Layer grouping
- Layer transform controls (position, scale, rotation)

### Shader Editor
**Status:** Not Started  
**Priority:** Low  

Custom shader creation:
- Visual shader node editor
- GLSL code editor with syntax highlighting
- Shader library and sharing
- Real-time shader preview
- Shader parameters exposed as knobs
- Shader templates
- Shader debugging tools

### Video Input Support
**Status:** Not Started  
**Priority:** Low  

Video file playback:
- Drag & drop video files
- Video file browser
- Play/pause/seek controls
- Loop mode
- Multiple video sources
- Video effects (slow motion, reverse, loop segments)
- Video chroma key support
- Video frame extraction

### Advanced Webcam Features
**Status:** ✅ Partially Implemented  
**Priority:** Medium  

**Implemented:**
- ✅ Basic webcam access
- ✅ Device selection
- ✅ Centralized WebcamService

**Remaining:**
- [ ] Multiple webcam inputs
- [ ] Webcam effects (mirror, flip, rotate)
- [ ] Webcam recording
- [ ] Background removal (advanced chroma key)
- [ ] Face detection/tracking
- [ ] Motion detection
- [ ] Webcam filters (sepia, black & white, etc.)
- [ ] Webcam resolution options

### Export & Sharing
**Status:** ✅ Partially Implemented  
**Priority:** High  

**Implemented:**
- ✅ Screenshot capture (PNG)

**Remaining:**
- [ ] Video recording (WebM/MP4)
- [ ] GIF export with optimization
- [ ] Social media sharing (Twitter, Instagram, etc.)
- [ ] Direct upload to cloud storage
- [ ] Export presets with animations
- [ ] Batch export (multiple frames)
- [ ] Export with audio (video + audio track)

### Performance Analytics
**Status:** ✅ Partially Implemented  
**Priority:** Low  

**Implemented:**
- ✅ Real-time FPS display

**Remaining:**
- [ ] GPU/CPU usage graphs
- [ ] Memory usage tracking
- [ ] Frame time analysis
- [ ] Performance warnings
- [ ] Auto-optimization suggestions
- [ ] Performance history logging

### AI-Powered Features
**Status:** Research  
**Priority:** Low  

Intelligent features:
- Mode suggestions based on audio characteristics
- Auto-adjust effects based on content
- Style transfer between modes
- Beat-synced parameter automation
- Content-aware effect application

---

## 📱 Platform Expansion

### 19. Progressive Web App (PWA)
**Status:** Partial  
**Priority:** High  

Full offline support:
- Service worker for caching
- Install prompt
- Offline mode indicator
- Background sync for presets

### 20. Electron Desktop App
**Status:** Not Started  
**Priority:** Low  

Native desktop experience:
- System tray integration
- Global hotkeys
- Native MIDI access
- Direct audio device access

### 21. React Native Mobile App
**Status:** Not Started  
**Priority:** Low  

Native mobile app:
- iOS and Android
- Native performance
- Device sensors (accelerometer, gyroscope)
- Background audio

---

## 💡 New Considerations & Learnings

### Mobile Experience Insights
Based on recent mobile optimizations, we've learned:

1. **Portrait Mode Challenges:**
   - Canvas aspect ratio (16:9) doesn't match portrait screens well
   - Solution: Added rotation option to maximize space usage
   - Consider: Alternative aspect ratios for portrait-specific modes

2. **Landscape Mode Optimization:**
   - Header navigation works better than dropdown for mode switching
   - Controls panel should be always visible (not overlay)
   - Canvas should maximize horizontal space

3. **Safe Area Handling:**
   - iOS home indicator requires `env(safe-area-inset-bottom)` padding
   - Footer positioning must account for safe areas
   - Fixed positioning needs `transform: translateZ(0)` for proper rendering

### Performance Considerations
1. **WebGL Texture Management:**
   - Need strict validation before `texSubImage2D` calls
   - Texture cleanup is critical for memory management
   - Screenshot capture requires direct pixel reading (WebGL limitation)

2. **Canvas Resizing:**
   - Dynamic resizing based on container size works well
   - ResizeObserver is more reliable than window resize events
   - Aspect ratio maintenance prevents stretching artifacts

### User Experience Patterns
1. **Settings Persistence:**
   - Per-mode settings (like seizure-safe mode) are valuable
   - IndexedDB works well for persistent storage
   - Debounced saves prevent excessive writes

2. **Mode Switching:**
   - Transitions improve perceived performance
   - Background loading prevents UI blocking
   - Mode browser with current mode highlighting improves discoverability

3. **Accessibility First:**
   - Auto-enabling seizure-safe mode for risky modes is important
   - Warning dialogs help users make informed decisions
   - Per-mode preferences respect user autonomy

### Technical Debt & Future Improvements
1. **Mode Metadata:**
   - Consider adding more metadata to modes (difficulty, category tags, etc.)
   - Seizure risk levels should be expanded to more modes
   - Parameter descriptions could be more comprehensive

2. **Canvas Architecture:**
   - Consider abstracting canvas operations further
   - WebGL context management could be more robust
   - Screenshot system could support multiple formats

3. **Mobile Gestures:**
   - Current touch support is basic
   - Gesture library integration would enhance mobile experience
   - Multi-touch support for complex interactions

---

## 🗓️ Proposed Timeline

### Q1 2026
- [x] Mobile responsive design
- [x] Portrait rotation option
- [x] Screenshot capture
- [x] Pause/resume functionality
- [x] Seizure-safe mode auto-enable
- [ ] Fullscreen improvements
- [ ] Gesture-based controls

### Q2 2026
- [ ] MIDI input support
- [ ] Audio file input
- [ ] Video recording
- [ ] GIF export

### Q3 2026
- [ ] Preset system
- [ ] Custom color palettes
- [x] Post-processing effects ✅
- [ ] Enhanced accessibility
- [ ] Effect presets and ordering

### Q4 2026
- [ ] Mode sequencer
- [ ] 3D mode support
- [ ] PWA offline mode
- [ ] Performance optimizations

---

## Contributing

Want to help implement a feature? Check the issues labeled `enhancement` in the repository. Features are prioritized based on:

1. User demand
2. Implementation complexity
3. Impact on existing functionality
4. Maintainability

To propose a new feature, open an issue with the `feature-request` label.

