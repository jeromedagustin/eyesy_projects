# EYESY Mode Types Documentation

This document explains how each type of mode works in the EYESY visual synthesizer system.

## Table of Contents

1. [Overview](#overview)
2. [Base Mode Interface](#base-mode-interface)
3. [Mode Categories](#mode-categories)
   - [Scopes (S -)](#scopes-s--)
   - [Triggers (TR -)](#triggers-tr--)
   - [LFO-Based (L -)](#lfo-based-l--)
   - [Time-Based (T -)](#time-based-t--)
   - [Noise-Based (N -)](#noise-based-n--)
   - [Geometric (G -)](#geometric-g--)
   - [Pattern (PT -)](#pattern-pt--)
   - [3D (3D -)](#3d-3d--)
   - [Utilities (U -)](#utilities-u--)
4. [Common Utilities](#common-utilities)
5. [Best Practices](#best-practices)

---

## Overview

EYESY modes are categorized by their primary animation mechanism and input reactivity. Each mode type has distinct characteristics:

- **Scopes**: Audio-reactive visualizations that respond to microphone input
- **Triggers**: Event-driven modes that react to trigger signals (MIDI, manual, or random)
- **LFO-Based**: Use Low-Frequency Oscillators for smooth, cyclical animations
- **Time-Based**: Continuous animations driven by elapsed time
- **Noise-Based**: Use Perlin/Simplex noise for organic, flowing patterns
- **Geometric**: Mathematical patterns and geometric shapes
- **Pattern**: Repeating patterns and tessellations
- **3D**: Three-dimensional visualizations using Three.js
- **Utilities**: Special-purpose modes (Timer, Webcam, etc.)

---

## Base Mode Interface

All modes implement the `Mode` interface:

```typescript
interface Mode {
  setup(canvas: Canvas, eyesy: EYESY): void | Promise<void>;
  draw(canvas: Canvas, eyesy: EYESY): void;
  dispose?(): void;
}
```

### Methods

- **`setup(canvas, eyesy)`**: Called once when the mode is loaded. Initialize variables, load assets, set up state.
- **`draw(canvas, eyesy)`**: Called every frame (~60fps). This is where all drawing happens.
- **`dispose()`** (optional): Called when switching away from the mode. Clean up resources, restore state.

### Base Classes

For convenience, several base classes provide common functionality:

- **`BaseAnimatedMode`**: Provides time tracking and audio reactivity helpers
- **`Base3DMode`**: Provides 3D scene setup with perspective camera

---

## Mode Categories

### Scopes (S -)

**Category**: `'scopes'`  
**Prefix**: `S -`  
**Primary Input**: Audio (microphone or mock audio)

#### Characteristics

- **Audio-Reactive**: Respond to real-time audio input from microphone
- **Sample-Based**: Use individual audio samples from `eyesy.audio_in[]` array
- **Continuous**: Draw continuously, updating based on audio waveform
- **Normalization**: Audio values are typically normalized from -32768 to 32768 → -1.0 to 1.0

#### How They Work

1. **Audio Input**: Access audio samples via `eyesy.audio_in[]` array
2. **Normalization**: Use `AudioScope.getSample()` utility for consistent normalization
3. **Visual Mapping**: Map audio samples to visual positions (e.g., x-position → sample index, y-position → amplitude)
4. **Noise Filtering**: AudioScope utility filters out background noise below threshold

#### Common Patterns

```typescript
// Example: Classic Horizontal Scope
draw(canvas: Canvas, eyesy: EYESY): void {
  eyesy.color_picker_bg(eyesy.knob5);
  
  for (let i = 0; i < numSamples; i++) {
    // Get normalized audio sample
    const audioVal = AudioScope.getSample(eyesy, i);
    
    // Map to visual position
    const x = (i / numSamples) * eyesy.xres;
    const y = (audioVal * eyesy.yres * 0.5) + (eyesy.yres / 2);
    
    // Draw visualization
    canvas.line([x, centerY], [x, y], color, lineWidth);
  }
}
```

#### Key Features

- **AudioScope Utility**: Provides consistent audio handling with noise filtering
- **Mock Audio Support**: Can work with simulated audio when microphone is disabled
- **Sample Mapping**: Each audio sample typically maps to a visual element (line, circle, etc.)
- **Real-Time**: Updates every frame based on current audio input

#### Example Modes

- `S - Classic Horizontal`: Horizontal waveform display
- `S - Circle Scope`: Circular audio visualization
- `S - Grid Circles`: Grid of circles reacting to audio
- `S - Boids`: Particle system reacting to audio

---

### Triggers (TR -)

**Category**: `'triggers'`  
**Prefix**: `TR -`  
**Primary Input**: Trigger events (`eyesy.trig`)

#### Characteristics

- **Event-Driven**: React to discrete trigger events, not continuous input
- **State Changes**: Typically change state when `eyesy.trig` becomes `true`
- **Persistent Effects**: Changes persist until next trigger (or fade over time)
- **Manual or Random**: Can be triggered manually via button or automatically via random trigger

#### How They Work

1. **Trigger Detection**: Check `eyesy.trig` in `draw()` method
2. **State Update**: When trigger fires, update internal state (positions, colors, patterns)
3. **Visualization**: Draw current state (which may persist across frames)
4. **Reset**: Clear trigger flag after processing (or let App handle it)

#### Common Patterns

```typescript
// Example: Ball of Mirrors
draw(canvas: Canvas, eyesy: EYESY): void {
  eyesy.color_picker_bg(eyesy.knob5);
  
  // React to trigger
  if (eyesy.trig) {
    // Update state on trigger
    this.x = Math.random() * eyesy.xres;
    this.y = Math.random() * eyesy.yres;
    this.color = eyesy.color_picker(Math.random());
  }
  
  // Draw current state
  canvas.circle([this.x, this.y], this.size, this.color, 0);
  
  // Optional: Use frame feedback for trails
  canvas.blitLastFrame(...);
  canvas.captureFrame();
}
```

#### Key Features

- **Momentary Pulse**: `eyesy.trig` is `true` for one frame, then cleared
- **State Persistence**: Changes made on trigger persist until next trigger
- **Feedback Effects**: Many trigger modes use `canvas.blitLastFrame()` for trails/feedback
- **Random Trigger**: Can be automatically triggered via "Random Trigger" setting

#### Example Modes

- `TR - Ball of Mirrors`: Draws circles on trigger, uses frame feedback
- `TR - Bits H - Row Color`: Regenerates line positions on trigger
- `TR - Reckie`: Moves rectangle to new position on trigger
- `TR - Image Circle`: Changes image position on trigger

---

### LFO-Based (L -)

**Category**: `'lfo'`  
**Prefix**: `L -`  
**Primary Input**: Time + Low-Frequency Oscillators

#### Characteristics

- **Cyclical Animation**: Use sine/cosine waves for smooth, repeating motion
- **Low Frequency**: Oscillations typically 0.1-1.5 Hz (slow, visible cycles)
- **Continuous**: Animate continuously without external input
- **Audio Enhancement**: Can be enhanced by audio, but work standalone

#### How They Work

1. **Time Tracking**: Use `eyesy.time` or `eyesy.deltaTime` for animation
2. **LFO Calculation**: Calculate oscillation using `Math.sin()` or `Math.cos()`
3. **Parameter Modulation**: Use LFO to modulate size, position, color, etc.
4. **Audio Boost**: Optionally boost LFO speed/amplitude with audio input

#### Common Patterns

```typescript
// Example: LFO Circles (using BaseAnimatedMode)
protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
  eyesy.color_picker_bg(eyesy.knob5);
  
  // Calculate LFO speed (0.1 to 1.5 Hz)
  let lfoSpeed = 0.1 + eyesy.knob1 * 1.4;
  lfoSpeed *= (1.0 + audioLevel * 0.5); // Audio boost
  
  // Calculate LFO value (sine wave)
  const phase = this.time * lfoSpeed;
  const lfo = Math.sin(phase * Math.PI * 2); // -1 to 1
  
  // Apply LFO to parameter (e.g., radius)
  const baseRadius = 100;
  const radiusVariation = lfo * eyesy.knob2; // Amplitude control
  const radius = baseRadius * (1.0 + radiusVariation);
  
  // Draw with modulated parameter
  canvas.circle([centerX, centerY], radius, color, 2);
}
```

#### Key Features

- **BaseAnimatedMode**: Most LFO modes extend this for time/audio tracking
- **Smooth Cycles**: Sine/cosine waves provide smooth, continuous motion
- **Frequency Control**: Knob1 typically controls LFO speed (Hz)
- **Amplitude Control**: Knob2 typically controls LFO amplitude (variation amount)
- **Standalone**: Work without audio, but audio can enhance them

#### Example Modes

- `L - LFO Circles`: Oscillating concentric circles
- `L - LFO Waves`: Oscillating wave patterns
- `L - LFO Grid`: Grid elements pulsing with LFO
- `L - LFO Spiral`: Spiral pattern with LFO animation

---

### Time-Based (T -)

**Category**: `'time'`  
**Prefix**: `T -`  
**Primary Input**: Elapsed time

#### Characteristics

- **Continuous Animation**: Driven by elapsed time, not external input
- **Deterministic**: Same time = same state (unless random elements added)
- **Smooth Motion**: Use `eyesy.deltaTime` for frame-rate independent animation
- **Reversible**: Support reverse playback via `eyesy.deltaTime < 0`

#### How They Work

1. **Time Accumulation**: Track elapsed time using `eyesy.time` or accumulate `eyesy.deltaTime`
2. **Parameter Calculation**: Calculate animation parameters based on time
3. **Continuous Update**: Update positions, rotations, scales every frame
4. **Reverse Support**: Handle negative `deltaTime` for reverse playback

#### Common Patterns

```typescript
// Example: Rotating Patterns
draw(canvas: Canvas, eyesy: EYESY): void {
  // Update time (handle reverse playback)
  if (eyesy.deltaTime < 0) {
    this.time = eyesy.time; // Sync with global time
  } else {
    this.time += eyesy.deltaTime; // Accumulate
  }
  
  // Calculate rotation angle from time
  const rotationSpeed = 0.2 + eyesy.knob1 * 2.8;
  const angle = this.time * rotationSpeed;
  
  // Draw rotating pattern
  for (let i = 0; i < numElements; i++) {
    const elementAngle = angle + (i * (Math.PI * 2 / numElements));
    const x = centerX + Math.cos(elementAngle) * radius;
    const y = centerY + Math.sin(elementAngle) * radius;
    canvas.circle([x, y], size, color, 0);
  }
}
```

#### Key Features

- **Frame-Rate Independent**: Use `deltaTime` for consistent speed across frame rates
- **Reversible**: Check `deltaTime < 0` to support reverse playback
- **Audio Enhancement**: Can optionally boost speed/amplitude with audio
- **Standalone**: Work without any external input

#### Example Modes

- `T - Rotating Patterns`: Continuously rotating geometric patterns
- `T - Pulsing Shapes`: Shapes that pulse in and out
- `T - Oscillating Waves`: Wave patterns that oscillate
- `T - Morphing Shapes`: Shapes that morph over time
- `T - Time Tunnel`: Tunnel effect with time-based animation

---

### Noise-Based (N -)

**Category**: `'noise'`  
**Prefix**: `N -`  
**Primary Input**: Perlin/Simplex noise functions

#### Characteristics

- **Organic Patterns**: Use noise functions for natural, flowing patterns
- **Multi-Dimensional**: Noise functions take x, y, time, and scale parameters
- **Smooth Variation**: Noise provides smooth, continuous variation
- **Flow Fields**: Often used for particle flow or terrain generation

#### How They Work

1. **Noise Function**: Use `getNoise(x, y, time, scale)` utility function
2. **Parameter Mapping**: Map noise values to visual parameters (position, color, size)
3. **Time Evolution**: Pass `time` to noise for animated, evolving patterns
4. **Scale Control**: Adjust noise scale to control feature size

#### Common Patterns

```typescript
// Example: Noise Flow (using BaseAnimatedMode)
protected onDraw(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
  // Calculate noise scale
  let noiseScale = 0.3 + eyesy.knob1 * 2.0;
  
  // Update particles using noise
  for (const particle of this.particles) {
    // Get noise values at particle position
    const noiseX = getNoise(particle.x, particle.y, this.time, noiseScale);
    const noiseY = getNoise(particle.x + 100, particle.y + 100, this.time, noiseScale);
    
    // Convert noise to angle and strength
    const angle = noiseX * Math.PI * 2;
    const strength = noiseY * flowSpeed;
    
    // Update particle velocity
    particle.vx = Math.cos(angle) * strength;
    particle.vy = Math.sin(angle) * strength;
    
    // Update position and draw
    particle.x += particle.vx;
    particle.y += particle.vy;
    canvas.circle([particle.x, particle.y], 2, color, 0);
  }
}
```

#### Key Features

- **Noise Utility**: Use `getNoise()` from `modes/utils/Noise.ts`
- **Multi-Dimensional**: Noise functions support x, y, z (time), and scale
- **Smooth**: Provides smooth, continuous variation (unlike random)
- **Evolving**: Time parameter creates animated, evolving patterns

#### Example Modes

- `N - Noise Flow`: Particle flow field using noise
- `N - Noise Terrain`: 3D-like terrain visualization
- `N - Noise Plasma`: Plasma-like color patterns
- `N - Noise Clouds`: Cloud-like formations
- `N - Noise Waves`: Wave patterns from noise

---

### Geometric (G -)

**Category**: `'geometric'`  
**Prefix**: `G -`  
**Primary Input**: Mathematical patterns

#### Characteristics

- **Mathematical**: Based on geometric and mathematical principles
- **Pattern-Based**: Create repeating patterns
- **Precise**: Exact calculations, not random or noise-based
- **Symmetrical**: Often feature symmetry and tessellation

#### How They Work

1. **Pattern Generation**: Calculate positions using mathematical formulas
2. **Tessellation**: Create repeating patterns that tile the screen
3. **Transformation**: Apply rotations, scales, translations
4. **Symmetry**: Use symmetry operations (reflection, rotation)

#### Common Patterns

```typescript
// Example: Geometric Tiles
draw(canvas: Canvas, eyesy: EYESY): void {
  eyesy.color_picker_bg(eyesy.knob5);
  
  const tileSize = eyesy.knob1 * 100 + 20;
  const rotation = eyesy.time * eyesy.knob2;
  
  // Create grid of tiles
  for (let x = 0; x < eyesy.xres; x += tileSize) {
    for (let y = 0; y < eyesy.yres; y += tileSize) {
      // Calculate tile vertices
      const vertices = this.calculateTileVertices(x, y, tileSize, rotation);
      
      // Draw tile
      canvas.polygon(vertices, color, 0);
    }
  }
}
```

#### Key Features

- **Mathematical Precision**: Exact calculations, not approximations
- **Tessellation**: Patterns that repeat and tile seamlessly
- **Symmetry**: Often use reflection, rotation, or translation symmetry
- **Time-Based**: May use time for rotation or animation

#### Example Modes

- `G - Geometric Tiles`: Tiled geometric patterns
- `G - Sacred Geometry`: Sacred geometry patterns (flower of life, etc.)
- `G - Polygon Patterns`: Patterns using various polygons
- `G - Geometric Spiral`: Spiral-based geometric patterns
- `G - Geometric Lattice`: Lattice structures

---

### Pattern (PT -)

**Category**: `'pattern'`  
**Prefix**: `PT -`  
**Primary Input**: Repeating patterns

#### Characteristics

- **Repetitive**: Based on repeating pattern elements
- **Tessellation**: Patterns that tile across the screen
- **Weaving**: May feature interwoven or overlapping patterns
- **Symmetrical**: Often use symmetry operations

#### How They Work

1. **Pattern Definition**: Define base pattern element
2. **Repetition**: Repeat pattern across screen
3. **Weaving/Overlap**: May interweave or overlap pattern elements
4. **Animation**: Animate pattern over time (rotation, translation)

#### Common Patterns

```typescript
// Example: Pattern Tiles
draw(canvas: Canvas, eyesy: EYESY): void {
  eyesy.color_picker_bg(eyesy.knob5);
  
  const patternScale = eyesy.knob1;
  const rotationSpeed = eyesy.knob2;
  const angle = eyesy.time * rotationSpeed;
  
  // Create repeating pattern
  for (let x = 0; x < eyesy.xres; x += tileSize) {
    for (let y = 0; y < eyesy.yres; y += tileSize) {
      // Draw pattern element at position
      this.drawPatternElement(canvas, x, y, patternScale, angle, color);
    }
  }
}
```

#### Key Features

- **Repetition**: Patterns repeat across the screen
- **Tessellation**: Seamless tiling
- **Weaving**: May feature interwoven elements
- **Animation**: Patterns may rotate, translate, or morph

#### Example Modes

- `PT - Pattern Tiles`: Tiled repeating patterns
- `PT - Pattern Weave`: Interwoven pattern elements
- `PT - Pattern Mosaic`: Mosaic-like patterns
- `PT - Pattern Symmetry`: Symmetrical pattern arrangements

---

### 3D (3D -)

**Category**: `'3d'`  
**Prefix**: `3D -`  
**Primary Input**: Three.js 3D rendering

#### Characteristics

- **Three-Dimensional**: Use Three.js for 3D graphics
- **Perspective Camera**: Use perspective projection (not orthographic)
- **3D Objects**: Create and manipulate 3D meshes, geometries, materials
- **Lighting**: Use lights for 3D shading

#### How They Work

1. **Base Class**: Extend `Base3DMode` for 3D setup
2. **Scene Setup**: Create Three.js scene, camera, lights in `setup()`
3. **3D Objects**: Create meshes using Three.js geometries and materials
4. **Animation**: Update object positions, rotations, scales in `draw()`
5. **Rendering**: Canvas automatically renders with perspective camera

#### Common Patterns

```typescript
// Example: Rotating Cube (using Base3DMode)
export class RotatingCube extends Base3DMode {
  private cube: THREE.Mesh | null = null;
  
  protected onSetup(canvas: Canvas, eyesy: EYESY): void {
    // Create 3D geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.cube = new THREE.Mesh(geometry, material);
    this.addObject(this.cube);
    
    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    this.addObject(light);
  }
  
  protected onDraw3D(canvas: Canvas, eyesy: EYESY, audioLevel: number): void {
    if (!this.cube) return;
    
    // Rotate cube
    const rotSpeed = eyesy.knob1 * 2 * Math.PI;
    this.cube.rotation.x += rotSpeed * eyesy.deltaTime;
    this.cube.rotation.y += rotSpeed * eyesy.deltaTime;
    
    // Update color
    const color = eyesy.color_picker(eyesy.knob4);
    if (this.cube.material instanceof THREE.MeshStandardMaterial) {
      this.cube.material.color.setRGB(color[0]/255, color[1]/255, color[2]/255);
    }
  }
}
```

#### Key Features

- **Base3DMode**: Provides 3D scene, camera, and audio reactivity
- **Three.js**: Full access to Three.js 3D capabilities
- **Perspective Camera**: Automatic perspective projection
- **Resource Management**: Automatic cleanup of geometries and materials
- **Audio Reactive**: Can react to audio for enhanced effects

#### Example Modes

- `3D - Rotating Cube`: Simple rotating 3D cube
- `3D - Particle Field`: 3D particle system
- `3D - Geometric Shapes`: Multiple 3D geometric shapes

---

### Utilities (U -)

**Category**: `'utilities'`  
**Prefix**: `U -`  
**Primary Input**: Special-purpose functionality

#### Characteristics

- **Special Purpose**: Serve specific utility functions
- **Non-Visual**: May not create visual patterns (e.g., Timer)
- **Tools**: Provide tools or services to the system

#### How They Work

Utilities vary widely in purpose:

- **Timer**: Displays time/clock information
- **Webcam**: Displays live webcam feed
- **Webcam Grid**: Grid layout of webcam frames

#### Example Modes

- `U - Timer`: Displays time information
- `Webcam - Live Feed`: Displays webcam video feed

---

## Common Utilities

### AudioScope

Provides consistent audio input handling for scope modes:

```typescript
// Get normalized audio sample
const audioVal = AudioScope.getSample(eyesy, index);

// Get amplitude for range
const amplitude = AudioScope.getAmplitude(eyesy, startIndex, count);
```

**Features**:
- Consistent normalization (-32768 to 32768 → -1.0 to 1.0)
- Noise threshold filtering
- Bounds checking and wrapping
- Microphone state checking

### AudioReactivity

Provides smoothed audio level calculation:

```typescript
const audioReactivity = new AudioReactivity();

// In draw():
const audioLevel = audioReactivity.update(eyesy); // Returns 0.0 to 1.0
```

**Features**:
- RMS (Root Mean Square) calculation
- Smoothing with fast decay when no audio
- Threshold-based filtering
- Used by `BaseAnimatedMode` automatically

### LFO Utility

For custom LFO calculations:

```typescript
// Calculate LFO value
const lfoSpeed = 0.1 + knob1 * 1.4; // Hz
const phase = time * lfoSpeed;
const lfo = Math.sin(phase * Math.PI * 2); // -1 to 1
```

### Noise Utility

For noise-based patterns:

```typescript
import { getNoise } from '../utils';

// Get noise value (x, y, time, scale)
const noiseValue = getNoise(x, y, time, 0.5); // Returns 0.0 to 1.0
```

---

## Best Practices

### Performance

1. **Avoid Heavy Calculations in `draw()`**: Pre-calculate values in `setup()` when possible
2. **Reuse Objects**: Don't create new objects every frame
3. **Limit Particle Counts**: For particle systems, limit to reasonable counts
4. **Use `dispose()`**: Clean up resources when mode is unloaded

### Audio Reactivity

1. **Use AudioScope**: For scope modes, always use `AudioScope.getSample()` for consistency
2. **Check `mic_enabled`**: Always check if microphone is enabled before using audio
3. **Normalize Values**: Always normalize audio values from -32768 to 32768 → -1.0 to 1.0
4. **Handle No Audio**: Provide fallback behavior when no audio is available

### Time-Based Animation

1. **Use `deltaTime`**: Always use `eyesy.deltaTime` for frame-rate independent animation
2. **Support Reverse**: Check `deltaTime < 0` for reverse playback support
3. **Sync with Global Time**: Use `eyesy.time` when `deltaTime < 0` for reverse playback

### Trigger Handling

1. **Check Rising Edge**: Detect when trigger goes from `false` to `true`
2. **Update State**: Change state when trigger fires
3. **Persist State**: State changes persist until next trigger (or fade over time)

### Color Management

1. **Use Color Picker Functions**: Always use `eyesy.color_picker()` instead of hardcoded colors
2. **Background First**: Always set background color first with `eyesy.color_picker_bg()`
3. **LFO Colors**: Use `eyesy.color_picker_lfo()` for animated colors

### Resolution Independence

1. **Use `eyesy.xres` and `eyesy.yres`**: Never hardcode screen dimensions
2. **Calculate Ratios**: Use ratios and percentages for scalable layouts
3. **Center Calculations**: Use `eyesy.xres / 2` and `eyesy.yres / 2` for centering

---

## Summary

| Category | Prefix | Primary Input | Base Class | Key Feature |
|----------|--------|---------------|------------|-------------|
| Scopes | `S -` | Audio samples | `Mode` | Audio-reactive visualization |
| Triggers | `TR -` | Trigger events | `Mode` | Event-driven state changes |
| LFO | `L -` | Time + LFO | `BaseAnimatedMode` | Cyclical oscillations |
| Time | `T -` | Elapsed time | `Mode` | Continuous animation |
| Noise | `N -` | Noise functions | `BaseAnimatedMode` | Organic patterns |
| Geometric | `G -` | Math patterns | `Mode` | Geometric patterns |
| Pattern | `PT -` | Repeating patterns | `Mode` | Tessellation |
| 3D | `3D -` | Three.js | `Base3DMode` | 3D graphics |
| Utilities | `U -` | Special purpose | `Mode` | Utility functions |

Each mode type serves a specific purpose and uses different techniques to create visual effects. Understanding these categories helps when creating new modes or modifying existing ones.

