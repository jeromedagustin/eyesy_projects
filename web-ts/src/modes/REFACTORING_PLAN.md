# Mode Codebase Refactoring Plan

## Overview
This document outlines the refactoring plan to reduce code duplication and improve maintainability across the EYESY modes codebase.

## Identified Duplications

### 1. Audio Reactivity Code (HIGH PRIORITY)
**Location**: Duplicated across 23+ modes
**Lines per mode**: ~20 lines
**Total duplication**: ~460 lines
**Solution**: ✅ Created `AudioReactivity` utility class

### 2. Noise Functions (HIGH PRIORITY)
**Location**: All noise-based modes (NoiseFlow, NoiseTerrain, NoisePlasma, NoiseClouds, NoiseWaves)
**Lines per mode**: ~10 lines
**Total duplication**: ~50 lines
**Solution**: ✅ Created `Noise` utility module

### 3. LFO Classes (MEDIUM PRIORITY)
**Location**: Magnifycloudlfo, Gridslidesquare modes
**Lines per mode**: ~30 lines
**Total duplication**: ~60 lines
**Solution**: ✅ Created shared `LFO` utility class

### 4. Time Tracking (MEDIUM PRIORITY)
**Location**: Most animated modes
**Lines per mode**: ~3 lines
**Total duplication**: ~70 lines
**Solution**: ✅ Created `BaseAnimatedMode` base class

### 5. Common Math Operations (LOW PRIORITY)
**Location**: Multiple modes
**Examples**: Polar coordinates, distance calculations, clamping
**Solution**: ✅ Created `MathUtils` utility module

## New Structure

```
web-ts/src/modes/
├── base/
│   ├── Mode.ts                    # Base interface
│   └── BaseAnimatedMode.ts        # Base class for animated modes (NEW)
├── utils/                         # Shared utilities (NEW)
│   ├── AudioReactivity.ts         # Audio level calculation & smoothing
│   ├── LFO.ts                     # Low-Frequency Oscillator
│   ├── Noise.ts                   # Noise generation functions
│   ├── MathUtils.ts               # Common math operations
│   └── index.ts                   # Utility exports
├── lfo/                           # LFO-based modes
├── time/                          # Time-based modes
├── noise/                         # Noise-based modes
├── geometric/                     # Geometric modes
├── pattern/                       # Pattern modes
├── scopes/                        # Scope modes
├── triggers/                      # Trigger modes
└── utilities/                     # Utility modes
```

## Migration Strategy

### Phase 1: Create Utilities ✅
- [x] Create `utils/` directory
- [x] Extract `AudioReactivity` class
- [x] Extract `Noise` functions
- [x] Extract `LFO` class
- [x] Create `MathUtils` module
- [x] Create `BaseAnimatedMode` base class

### Phase 2: Migrate Example Modes (IN PROGRESS)
- [x] Migrate `LFOCircles` to use `BaseAnimatedMode` and `AudioReactivity`
- [x] Migrate `NoiseFlow` to use `BaseAnimatedMode`, `AudioReactivity`, and `Noise`
- [x] Migrate `Magnifycloudlfo` to use shared `LFO` class
- [ ] Migrate remaining LFO modes
- [ ] Migrate remaining time-based modes
- [ ] Migrate remaining noise-based modes
- [ ] Migrate remaining geometric modes
- [ ] Migrate remaining pattern modes

### Phase 3: Update Legacy Modes
- [ ] Identify other duplicated patterns in scopes/triggers
- [ ] Extract additional utilities as needed
- [ ] Update legacy modes to use utilities where applicable

## Benefits

1. **Reduced Code Duplication**: ~600+ lines of duplicated code eliminated
2. **Easier Maintenance**: Bug fixes and improvements in one place
3. **Consistency**: All modes use the same audio reactivity logic
4. **Type Safety**: Shared utilities ensure consistent interfaces
5. **Easier Testing**: Utilities can be tested independently

## Usage Examples

### Using AudioReactivity
```typescript
import { AudioReactivity } from '../utils';

export class MyMode implements Mode {
  private audioReactivity = new AudioReactivity();
  
  setup() {
    this.audioReactivity.reset();
  }
  
  draw(canvas, eyesy) {
    const audioLevel = this.audioReactivity.update(eyesy);
    // Use audioLevel (0.0 to 1.0) for reactivity
  }
}
```

### Using BaseAnimatedMode
```typescript
import { BaseAnimatedMode } from '../base/BaseAnimatedMode';

export class MyMode extends BaseAnimatedMode {
  protected onDraw(canvas, eyesy, audioLevel) {
    // audioLevel is automatically provided
    // this.time is automatically updated
  }
}
```

### Using Noise Functions
```typescript
import { getNoise, noise3D } from '../utils';

const value = getNoise(x, y, time, scale);
const animated = noise3D(x, y, time, scale);
```

### Using LFO
```typescript
import { LFO } from '../utils';

const lfo = new LFO(0, 100, 10);
const value = lfo.update(deltaTime);
```

## Notes

- Modes can still implement `Mode` directly if they don't need animation/audio
- Utilities are optional - existing modes continue to work
- Migration can be done incrementally
- No breaking changes to the Mode interface



