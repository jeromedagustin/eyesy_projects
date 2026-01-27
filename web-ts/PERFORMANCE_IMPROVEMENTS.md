# Performance Improvements for EYESY Web

This document outlines specific improvements to enhance animation smoothness and application runtime performance.

## High Priority Improvements

### 1. **Object Pooling for Canvas Drawing**
**Problem**: Creating new Three.js geometries/materials every frame causes garbage collection pauses.

**Solution**: Implement object pooling for frequently created objects:
- Circle geometries (reuse with different radii)
- Line geometries
- Materials (reuse with color changes)
- Buffer geometries for particle systems

**Impact**: Reduces GC pauses, smoother 60fps animation
**Files**: `web-ts/src/core/Canvas.ts`

### 2. **Optimize Animation Loop FPS Throttling**
**Problem**: Current FPS throttling uses `requestAnimationFrame` recursion which can cause frame skipping.

**Solution**: Use a more efficient throttling mechanism:
```typescript
// Instead of skipping frames, use a time accumulator
private frameTimeAccumulator = 0;
const targetFrameTime = 1000 / this.targetFPS;
this.frameTimeAccumulator += deltaTime;
if (this.frameTimeAccumulator >= targetFrameTime) {
  // Render frame
  this.frameTimeAccumulator -= targetFrameTime;
}
```

**Impact**: More consistent frame timing, better frame pacing
**Files**: `web-ts/src/App.ts` (animate method)

### 3. **Lazy Load Mode Classes**
**Problem**: All mode classes are imported at startup, increasing initial bundle size and load time.

**Solution**: Use dynamic imports for modes:
```typescript
// Instead of: import { ModeName } from './modes/...'
// Use: const ModeClass = await import('./modes/...').then(m => m.ModeName)
```

**Impact**: Faster initial load, smaller initial bundle
**Files**: `web-ts/src/modes/index.ts`, `web-ts/src/App.ts`

### 4. **Optimize Audio Processing**
**Problem**: Audio conversion happens every frame in the main thread.

**Solution**: 
- Use Web Audio API's `ScriptProcessorNode` or `AudioWorklet` for off-thread processing
- Batch audio updates (update every 2-3 frames instead of every frame)
- Cache audio analysis results

**Impact**: Reduces main thread blocking, smoother animation
**Files**: `web-ts/src/core/MicrophoneAudio.ts`, `web-ts/src/core/EYESY.ts`

### 5. **Reduce DOM Updates**
**Problem**: Frequent DOM updates in animation loop (FPS counter, knob values) cause layout thrashing.

**Solution**:
- Batch DOM updates (update UI every 5-10 frames instead of every frame)
- Use `requestAnimationFrame` for UI updates separate from rendering
- Use CSS transforms instead of style changes where possible

**Impact**: Reduces layout/paint work, smoother rendering
**Files**: `web-ts/src/App.ts`, `web-ts/src/ui/Controls.ts`

## Medium Priority Improvements

### 6. **WebGL Render Target Caching**
**Problem**: Effect manager creates/disposes render targets frequently.

**Solution**: 
- Cache render targets and reuse them
- Only recreate when size changes
- Use render target pools for common sizes

**Impact**: Reduces WebGL state changes, faster effect rendering
**Files**: `web-ts/src/core/EffectManager.ts`

### 7. **Optimize Three.js Scene Management**
**Problem**: Adding/removing objects from scene every frame causes overhead.

**Solution**:
- Use object visibility instead of add/remove
- Batch scene updates
- Use instanced rendering for repeated objects

**Impact**: Faster scene updates, smoother rendering
**Files**: `web-ts/src/core/Canvas.ts`

### 8. **Debounce/Throttle UI Updates**
**Problem**: Controls panel updates trigger expensive re-renders.

**Solution**:
- Debounce knob value updates (50-100ms)
- Throttle slider updates
- Use `requestIdleCallback` for non-critical UI updates

**Impact**: Reduces UI jank, smoother controls
**Files**: `web-ts/src/ui/Controls.ts`

### 9. **Memory Leak Prevention**
**Problem**: Event listeners and Three.js objects may not be properly disposed.

**Solution**:
- Audit all `addEventListener` calls for proper cleanup
- Ensure all Three.js objects call `dispose()` when done
- Use WeakMap/WeakSet for temporary references
- Add memory profiling in dev mode

**Impact**: Prevents memory leaks, stable long-term performance
**Files**: All files with event listeners and Three.js usage

### 10. **Optimize RewindManager**
**Problem**: Frame capture uses `readPixels` which is expensive.

**Solution**:
- Reduce capture frequency (already every 2nd frame, could be every 4th)
- Use lower resolution for history frames
- Compress frame data (store as ImageData with compression)
- Limit history size more aggressively

**Impact**: Reduces GPU readback overhead
**Files**: `web-ts/src/core/RewindManager.ts`

## Low Priority / Future Improvements

### 11. **Web Workers for Heavy Computation**
**Problem**: Some modes do heavy math calculations on main thread.

**Solution**: 
- Move noise generation to Web Worker
- Process audio analysis in Worker
- Use OffscreenCanvas for pre-rendering

**Impact**: Frees main thread for rendering
**Files**: New worker files, mode refactoring

### 12. **Code Splitting**
**Problem**: Large bundle size affects initial load.

**Solution**:
- Split effects into separate chunks
- Lazy load UI components
- Use dynamic imports for large dependencies

**Impact**: Faster initial page load
**Files**: `web-ts/vite.config.ts`, build configuration

### 13. **Texture Compression**
**Problem**: Large textures consume GPU memory.

**Solution**:
- Use compressed texture formats (DXT, ETC, ASTC)
- Resize large images on load
- Use texture atlases for small images

**Impact**: Lower GPU memory usage, faster texture uploads
**Files**: `web-ts/src/core/ImageLoader.ts`

### 14. **Reduce Console Logging**
**Problem**: Console.log calls in production affect performance.

**Solution**:
- Use conditional logging (dev mode only)
- Replace with performance marks/measures
- Use a logging service that batches logs

**Impact**: Slight performance improvement
**Files**: All files with console.log

### 15. **Optimize Random Number Generation**
**Problem**: `Math.random()` is called frequently and can be slow.

**Solution**:
- Use a fast PRNG (like xorshift) for non-crypto randomness
- Pre-generate random numbers in batches
- Cache random values where possible

**Impact**: Faster random number generation
**Files**: Modes using Math.random frequently

## Measurement & Monitoring

### Performance Profiling
- Add performance marks/measures around critical sections
- Track frame times, GC pauses, memory usage
- Create performance dashboard in dev mode

### Metrics to Track
- Frame time (target: <16.67ms for 60fps)
- GC pause frequency and duration
- Memory usage over time
- Mode switch time
- Effect rendering time

## Implementation Priority

1. **Start with**: Object pooling (#1), FPS throttling (#2), DOM update batching (#5)
2. **Then**: Audio optimization (#4), lazy loading (#3)
3. **Finally**: Web Workers (#11), advanced optimizations

## Testing

After implementing improvements:
- Run performance tests: `npm test -- performance`
- Profile with Chrome DevTools Performance tab
- Monitor memory usage over extended sessions
- Test on lower-end devices
