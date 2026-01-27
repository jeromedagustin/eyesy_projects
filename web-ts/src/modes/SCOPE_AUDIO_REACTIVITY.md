# Scope Mode Audio Reactivity Improvements

## Problem Identified

When switching between scope modes, audio reactivity was inconsistent because:

1. **Inconsistent Normalization**: Different modes used different divisors:
   - Some used `/32768` (correct, gives -1.0 to 1.0)
   - Some used `/100` (legacy, gives -327.68 to 327.67)
   - Some used `/15000`, `/900`, etc.
   - This meant the same audio input produced vastly different visual responses

2. **Inconsistent Indexing**: Different methods for accessing audio samples:
   - Direct access: `audio_in[i]` (can cause out-of-bounds)
   - Clamped: `Math.min(i, audio_in.length - 1)`
   - Modulo: `i % audio_in.length`
   - Wrapped negative indices: `((j - i) % audioLen + audioLen) % audioLen`
   - This caused different parts of the audio spectrum to be used

3. **No Microphone Check**: Most scope modes didn't check `eyesy.mic_enabled`, so they might try to react even when mic is off (though audio_in should be empty/zero)

4. **No Bounds Checking**: Some modes accessed `audio_in[i]` without checking array length

## Solution: AudioScope Utility

Created `web-ts/src/modes/utils/AudioScope.ts` to provide:

- **Consistent Normalization**: All methods normalize to -1.0 to 1.0 by default (using `/32768`)
- **Microphone State Checking**: Automatically returns 0 when mic is disabled
- **Proper Index Handling**: 
  - `getSample()` - wraps indices (like Python's negative indexing)
  - `getSampleClamped()` - clamps indices to valid range
- **Helper Methods**: 
  - `getAmplitude()` - average amplitude for a range
  - `getPeak()` - peak value for a range
  - `mapToScreen()` - common pattern for mapping audio to screen coordinates
  - `getAllSamples()` - get full normalized audio buffer

## Migration Status

### ✅ Updated Modes (Examples)
- `ClassicHorizontal` - Uses `AudioScope.getSample()`
- `ClassicVertical` - Uses `AudioScope.getSampleClamped()`
- `CircleScope` - Uses `AudioScope.getSampleClamped()` with proper scaling
- `Oscilloscope` - Uses `AudioScope.getSampleClamped()`
- `TwoScopes` - Uses `AudioScope.getSampleClamped()`

### ⏳ Remaining Modes (90+ scope modes)
All other scope modes should be migrated to use `AudioScope` for consistency.

## Usage Examples

### Basic Sample Access
```typescript
import { AudioScope } from '../utils';

// Wrap index (like Python negative indexing)
const audioVal = AudioScope.getSample(eyesy, i);

// Clamp index to valid range
const audioVal = AudioScope.getSampleClamped(eyesy, i);

// Custom normalization (if needed for legacy compatibility)
const audioVal = AudioScope.getSample(eyesy, i, 100.0); // Uses /100 instead of /32768
```

### Mapping to Screen
```typescript
// Map audio value to screen coordinate
const audioVal = AudioScope.getSample(eyesy, i);
const y = AudioScope.mapToScreen(audioVal, eyesy.yres, 0.5, 0.5);
// Center at 50% of screen, scale to 50% of screen height
```

### Getting Amplitude
```typescript
// Get overall amplitude
const amplitude = AudioScope.getAmplitude(eyesy);

// Get amplitude for low frequencies (first 20% of samples)
const lowFreqCount = Math.floor(eyesy.audio_in.length * 0.2);
const lowFreqAmp = AudioScope.getAmplitude(eyesy, 0, lowFreqCount);
```

## Benefits

1. **Consistent Reactivity**: All scope modes now respond to the same audio input in a predictable way
2. **Microphone Awareness**: Modes automatically respect microphone state
3. **Type Safety**: Utility methods ensure correct usage
4. **Easier Maintenance**: Audio handling logic in one place
5. **Better User Experience**: Switching between modes feels consistent

## Migration Pattern

**Before:**
```typescript
const audioIndex = Math.min(i, eyesy.audio_in.length - 1);
const audioVal = (eyesy.audio_in[audioIndex] || 0) / 32768;
```

**After:**
```typescript
import { AudioScope } from '../utils';
const audioVal = AudioScope.getSampleClamped(eyesy, i);
```

The `AudioScope` utility automatically:
- Checks microphone state
- Handles bounds checking
- Normalizes consistently
- Returns 0 when mic is disabled

## Next Steps

1. Migrate remaining scope modes to use `AudioScope`
2. Consider adding smoothing options for less jittery visuals
3. Add frequency-domain helpers if needed (FFT-based reactivity)



