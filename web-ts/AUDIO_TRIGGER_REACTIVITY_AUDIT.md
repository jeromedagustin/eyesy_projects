# Audio and Trigger Reactivity Audit

## Overview
This document tracks the audit and fixes for audio and trigger reactivity across all EYESY modes.

## Current State

### Utilities Available
1. **AudioScope** (`modes/utils/AudioScope.ts`)
   - Provides consistent audio input handling for scope modes
   - Handles microphone state checking
   - Applies noise threshold filtering
   - Methods: `getSample()`, `getSampleClamped()`, `getAmplitude()`, `getPeak()`, `mapToScreen()`

2. **AudioReactivity** (`modes/utils/AudioReactivity.ts`)
   - Provides smoothed audio level calculation
   - Handles microphone state checking
   - Uses RMS calculation for accuracy
   - Methods: `update()`, `reset()`, `getLevel()`

3. **BaseAnimatedMode** (`modes/base/BaseAnimatedMode.ts`)
   - Base class for animated modes
   - Includes built-in `AudioReactivity` instance
   - Handles time tracking and reverse playback

## Issues Found

### Category 1: Direct Audio Access (No Utility)
**Issue**: Modes directly access `eyesy.audio_in[i]` without:
- Checking `mic_enabled`
- Bounds checking
- Noise threshold filtering
- Consistent normalization

**Affected Modes** (Easiest to fix):
- Grid modes (many already partially fixed)
- Various scope modes not yet migrated
- Trigger modes that use audio

### Category 2: Missing Trigger Support
**Issue**: Modes don't respond to triggers when microphone is disabled
- Some scope modes have trigger support
- Many trigger-based modes only work on trigger
- Need consistent trigger handling

### Category 3: Inconsistent Audio Reactivity
**Issue**: Modes calculate audio reactivity differently
- Some use custom calculations
- Some don't check `mic_enabled`
- Inconsistent smoothing

### Category 4: No Audio/Trigger Reactivity
**Issue**: Modes that should be reactive aren't
- Some modes ignore audio completely
- Some modes ignore triggers

## Fix Priority

### Priority 1: Easy Fixes (Direct Audio Access → AudioScope)
These modes directly access `audio_in[i]` and can be easily migrated to `AudioScope`:

1. **Grid Modes** (already partially fixed, need completion)
2. **Simple Scope Modes** (direct array access)
3. **Trigger Modes with Audio** (simple audio usage)

### Priority 2: Medium Fixes (Add Trigger Support)
These modes need trigger support when mic is disabled:

1. **Scope Modes** (some already have it)
2. **Trigger Modes** (should work without mic)

### Priority 3: Hard Fixes (Refactor Audio Reactivity)
These modes need custom audio reactivity refactored:

1. **Complex Scope Modes** (custom audio calculations)
2. **Animated Modes** (should use AudioReactivity or BaseAnimatedMode)

## Fix Plan

### Phase 1: Migrate Simple Scope Modes to AudioScope
Target: Modes that directly access `audio_in[i]` with simple patterns

**Completed (12 modes):**
- ✅ FootballScope (with trigger support)
- ✅ BreathingCircles
- ✅ Bouncingbarslfo (with trigger support)
- ✅ Linebouncefourlfoalternate (with trigger support)
- ✅ Radiatingsquareuniformcolor
- ✅ Radiatingsquaresteppedcolor
- ✅ Gradientcloud
- ✅ Googlyeyes
- ✅ Circlerowlfo (with trigger support)
- ✅ Breezyfeatherlfo
- ✅ Hcirclesimage
- ✅ Circlescopeimage

**Remaining:**
- Circlerowlfo
- Breezyfeatherlfo
- Hcirclesimage
- Dancingcircleimage
- Circlescopeimage
- Spinningdiscs
- Fivelinesspin
- And many more...

### Phase 2: Add Trigger Support to Scope Modes
Target: Scope modes that don't have trigger support yet

**Completed:**
- ✅ FootballScope
- ✅ Bouncingbarslfo
- ✅ Linebouncefourlfoalternate

**Remaining:**
- Most scope modes need trigger support when mic is disabled

### Phase 3: Migrate Animated Modes to AudioReactivity
Target: Modes with custom audio reactivity calculations

**Status:** Many animated modes already use AudioReactivity via BaseAnimatedMode

### Phase 4: Add Audio Reactivity to Non-Reactive Modes
Target: Modes that should be reactive but aren't

