# EYESY Web - Code Audit Report

**Date:** January 2026  
**Codebase Stats:**
- 150 TypeScript files
- ~21,400 lines of code
- 126 visual modes

---

## 🔴 High Priority Issues

### 1. App.ts is Too Large (1,483 lines)
The main `App.ts` file handles too many responsibilities:
- UI setup and rendering
- Mode management
- Transition management
- Settings persistence
- Keyboard navigation
- Audio/microphone handling
- Webcam handling
- Animation loop

**Recommendation:** Extract into smaller modules:
- `src/managers/ModeManager.ts` - Mode loading, switching, transitions
- `src/managers/InputManager.ts` - Keyboard, mouse, touch controls
- `src/managers/MediaManager.ts` - Microphone, webcam, images
- `src/managers/SettingsManager.ts` - Settings UI and persistence

### 2. Duplicate Image Loading Boilerplate
Multiple image modes have nearly identical image loading code:
- `Circlescopeimage.ts`
- `Dancingcircleimage.ts`
- `Hcirclesimage.ts`
- `Spinningdiscs.ts`
- `Imagecircle.ts`
- `Basicimage.ts`
- `Marchingfourimage.ts`
- `Slideshowgridagalpha.ts`

**Recommendation:** Create a base class `ImageMode` that handles:
```typescript
export abstract class ImageMode implements Mode {
  protected images: HTMLImageElement[] = [];
  
  async setup(canvas: Canvas, eyesy: EYESY): Promise<void> {
    this.images = await loadImages(eyesy.mode_root, this.getImagePattern());
    this.onImagesLoaded(canvas, eyesy);
  }
  
  abstract getImagePattern(): string;
  abstract onImagesLoaded(canvas: Canvas, eyesy: EYESY): void;
}
```

### 3. `audio_trig` and `midi_note_new` Not in EYESY Interface
Multiple modes use `(eyesy as any).audio_trig` because these properties aren't properly typed:
- `Isometricwave.ts`
- `Isometricwaverunner.ts`
- `Fontrecedes.ts`
- `Bomreckiestranslfos.ts`
- `Mode10print.ts`
- `Magnifycloudlfo.ts`
- `Webcam.ts`

**Recommendation:** Add to `EYESY` interface:
```typescript
interface EYESY {
  audio_trig: boolean;  // Audio-triggered event
  midi_note_new: boolean;  // New MIDI note detected
  // ... existing properties
}
```

---

## 🟡 Medium Priority Issues

### 4. Console Logging in Production Code
Found 30+ `console.log/warn/error` statements outside of test files. Some are appropriate for error handling, but many are debug statements.

**Recommendation:**
- Keep `console.error` for actual errors
- Remove or conditionalize `console.log` statements:
```typescript
const DEBUG = import.meta.env.DEV;
if (DEBUG) console.log('Debug message');
```

### 5. Magic Numbers in UI Code
CSS values like `1000` (z-index), `1400px`, `300px` are hardcoded.

**Recommendation:** Create a constants file:
```typescript
// src/constants/ui.ts
export const UI = {
  SIDEBAR_WIDTH: 300,
  MAX_CONTENT_WIDTH: 1400,
  MODAL_Z_INDEX: 1000,
  COLORS: {
    BACKGROUND: '#2a2a2a',
    SURFACE: '#3a3a3a',
    TEXT_PRIMARY: '#fff',
    TEXT_DISABLED: '#888',
    ACCENT: '#4a9eff',
    ERROR: '#ff6b6b',
  }
};
```

### 6. TransitionManager.ts is Complex (1,033 lines)
Contains 7+ transition types with rendering logic mixed together.

**Recommendation:** Extract transition renderers:
```typescript
// src/transitions/FadeTransition.ts
// src/transitions/SlideTransition.ts
// src/transitions/MorphTransition.ts
// etc.
```

### 7. Inline Styles in UI Components
`Controls.ts`, `ModeSelector.ts`, `ModeBrowser.ts` have extensive inline CSS.

**Recommendation:** Consider CSS-in-JS library or separate CSS files for maintainability.

---

## 🟢 Low Priority / Nice to Have

### 8. Webcamgrid.ts is Incomplete
Has TODO comments and stub implementation:
```typescript
// TODO: Port setup logic from Python
// TODO: Port draw logic from Python
```

### 9. Test Coverage
- 1,280 tests passing
- Consider adding integration tests for transitions
- Consider adding visual regression tests

### 10. Bundle Size
Current bundle: 780 KB (182 KB gzipped)
- Consider code-splitting for modes
- Consider lazy-loading image/webcam modes

---

## ✅ Good Practices Found

1. **Consistent Mode Interface** - All 126 modes implement the same `Mode` interface
2. **Type Safety** - TypeScript used throughout
3. **Separation of Concerns** - Canvas abstraction, EYESY API, Mode interface
4. **Settings Persistence** - IndexedDB for user preferences
5. **Error Handling** - Global error handlers with user-friendly messages
6. **Comprehensive Tests** - 1,280 tests across 4 test files

---

## Action Items

### Phase 1: Quick Wins
- [ ] Add `audio_trig` and `midi_note_new` to EYESY interface
- [ ] Remove debug `console.log` statements
- [ ] Create UI constants file

### Phase 2: Refactoring
- [ ] Extract App.ts into smaller modules
- [ ] Create ImageMode base class
- [ ] Extract transition renderers

### Phase 3: Polish
- [ ] Complete Webcamgrid mode
- [ ] Add visual regression tests
- [ ] Optimize bundle with code-splitting

