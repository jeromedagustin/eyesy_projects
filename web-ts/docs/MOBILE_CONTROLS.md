# EYESY Web - Mobile Controls Strategy

## Overview

This document outlines the strategy for implementing touch-friendly controls on mobile devices (phones and tablets).

---

## Current State

The current desktop UI has:
- Fixed 300px sidebar with sliders
- Dropdown mode selector
- Small buttons and checkboxes
- Keyboard shortcuts for navigation

**Issues on Mobile:**
- Sidebar takes too much screen space
- Sliders are too small for finger control
- Text is too small to read
- No touch gesture support
- Orientation changes not handled

---

## Target Devices

| Device | Screen Size | Orientation | Primary Use |
|--------|-------------|-------------|-------------|
| Phone | 320-428px | Portrait | Quick demo, mic input |
| Tablet | 768-1024px | Landscape | Performance, control |
| Large Tablet | 1024px+ | Landscape | Full experience |

---

## Mobile UI Layouts

### Phone (Portrait)

```
┌─────────────────────────┐
│  ≡  EYESY    🎤  📷  🖼️ │  ← Compact header
├─────────────────────────┤
│                         │
│                         │
│                         │
│       CANVAS            │  ← Full-width canvas
│       (16:9)            │
│                         │
│                         │
│                         │
├─────────────────────────┤
│  ◀  Mode Name      ▶    │  ← Swipe/tap to change modes
├─────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐     │
│  │K1 │ │K2 │ │K3 │     │  ← Circular knob controls
│  └───┘ └───┘ └───┘     │
│  ┌───┐ ┌───┐ ┌───┐     │
│  │K4 │ │K5 │ │TRG│     │  ← Color knobs + trigger
│  └───┘ └───┘ └───┘     │
└─────────────────────────┘
```

### Phone (Landscape)

```
┌───────────────────────────────────────┐
│ ≡                                📷 🎤│
├──────────────────────────────┬────────┤
│                              │ ┌──┐   │
│                              │ │K1│   │
│          CANVAS              │ └──┘   │
│          (16:9)              │ ┌──┐   │
│                              │ │K2│   │
│                              │ └──┘   │
│                              │ ┌──┐   │
│                              │ │K3│   │
├──────────────────────────────┤ └──┘   │
│ ◀  Mode Name              ▶  │  TRG   │
└──────────────────────────────┴────────┘
```

### Tablet (Landscape)

```
┌────────────────────────────────────────────────────────┐
│  ≡  EYESY Web           Mode Name  ▼    🎤  📷  🖼️  ⚙️ │
├────────────────────────────────────────────┬───────────┤
│                                            │  Knob 1   │
│                                            │  ═══●═══  │
│                                            │           │
│                                            │  Knob 2   │
│                                            │  ═══●═══  │
│              CANVAS                        │           │
│              (16:9)                        │  Knob 3   │
│                                            │  ═══●═══  │
│                                            │           │
│                                            │  Color    │
│                                            │  ═══●═══  │
│                                            │           │
│                                            │  BG Color │
│                                            │  ═══●═══  │
│                                            │           │
│                                            │  [TRIGGER]│
└────────────────────────────────────────────┴───────────┘
```

---

## Touch Controls

### 1. Circular Knobs (Phone)

Replace linear sliders with circular touch knobs:

```
     ╭─────╮
    ╱   ●   ╲     ← Knob indicator
   │    ↻    │    ← Rotary gesture area
    ╲       ╱
     ╰─────╯
       K1
```

**Behavior:**
- Touch and drag in circular motion to adjust
- Tap to show value
- Double-tap to reset to default
- Haptic feedback on value change

**Implementation:**
```typescript
class CircularKnob {
  private center: { x: number, y: number };
  private radius: number;
  private value: number = 0.5;
  
  onTouchMove(touch: Touch) {
    const angle = Math.atan2(
      touch.clientY - this.center.y,
      touch.clientX - this.center.x
    );
    // Convert angle to 0-1 value
    this.value = (angle + Math.PI) / (2 * Math.PI);
  }
}
```

### 2. Swipe Mode Navigation

- **Swipe left/right** on canvas: Change modes
- **Swipe up** on canvas: Open mode browser
- **Swipe down** on canvas: Minimize controls

```typescript
class SwipeDetector {
  private startX: number;
  private startY: number;
  private threshold = 50; // pixels
  
  onTouchStart(e: TouchEvent) {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
  }
  
  onTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - this.startX;
    const deltaY = e.changedTouches[0].clientY - this.startY;
    
    if (Math.abs(deltaX) > this.threshold) {
      if (deltaX > 0) this.emit('swipe-right');
      else this.emit('swipe-left');
    }
  }
}
```

### 3. Pinch to Zoom

- **Pinch in/out**: Adjust zoom (knob 7)
- **Two-finger rotate**: Adjust rotation (knob 6)

```typescript
onPinch(scale: number) {
  eyesy.knob7 = Math.max(0, Math.min(1, eyesy.knob7 * scale));
}

onRotate(angle: number) {
  eyesy.knob6 = (eyesy.knob6 + angle / 360) % 1;
}
```

### 4. Tap Trigger

- **Single tap** on canvas: Fire trigger
- **Long press** on canvas: Toggle trigger hold

### 5. Double-Tap Reset

- **Double-tap** any control: Reset to default value
- **Double-tap** canvas: Toggle fullscreen

---

## Collapsible Control Panel

### States

1. **Hidden** - Only floating buttons visible
2. **Minimal** - Mode selector + basic knobs
3. **Expanded** - All controls visible

### Transition

```
Hidden    →    Minimal    →    Expanded
 (tap)         (swipe up)     (swipe up)
            ←             ←
        (swipe down)  (swipe down)
```

### Floating Controls (Hidden State)

```
                    ┌─┐
                    │≡│  ← Hamburger menu
                    └─┘
                    ┌─┐
                    │⚙│  ← Quick settings
                    └─┘
┌───────────────────────┐
│       CANVAS          │
│      (fullscreen)     │
└───────────────────────┘
                    ┌─┐
                    │T│  ← Trigger button
                    └─┘
```

---

## Quick Actions Menu

Long-press hamburger for quick actions:

```
┌─────────────────────┐
│  ⏹️ Screenshot      │
│  🎬 Record          │
│  🔀 Random Mode     │
│  🔄 Reset Knobs     │
│  📱 Fullscreen      │
│  ⚙️ Settings        │
└─────────────────────┘
```

---

## Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  PHONE_PORTRAIT: 480,
  PHONE_LANDSCAPE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
};

function getLayout(): 'phone-portrait' | 'phone-landscape' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  
  if (width < BREAKPOINTS.PHONE_PORTRAIT || (isPortrait && width < BREAKPOINTS.PHONE_LANDSCAPE)) {
    return isPortrait ? 'phone-portrait' : 'phone-landscape';
  }
  if (width < BREAKPOINTS.TABLET) {
    return 'tablet';
  }
  return 'desktop';
}
```

---

## Mobile-Specific Features

### 1. Device Sensors

Use device sensors as input:
- **Accelerometer**: Map tilt to knobs
- **Gyroscope**: Map rotation to knobs
- **Light sensor**: Map ambient light to brightness

```typescript
window.addEventListener('devicemotion', (e) => {
  if (e.accelerationIncludingGravity) {
    // Map device tilt to knob values
    eyesy.knob1 = mapRange(e.accelerationIncludingGravity.x, -10, 10, 0, 1);
    eyesy.knob2 = mapRange(e.accelerationIncludingGravity.y, -10, 10, 0, 1);
  }
});
```

### 2. Vibration Feedback

Use haptic feedback for:
- Trigger activation
- Knob value changes
- Mode changes
- Error states

```typescript
function vibrateOnTrigger() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50); // 50ms vibration
  }
}
```

### 3. Wake Lock

Prevent screen from sleeping during performance:

```typescript
let wakeLock: WakeLockSentinel | null = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.log('Wake Lock not supported');
  }
}
```

### 4. Picture-in-Picture

Allow canvas to float over other apps:

```typescript
async function enterPiP() {
  const video = document.createElement('video');
  const stream = canvas.captureStream(30);
  video.srcObject = stream;
  await video.requestPictureInPicture();
}
```

---

## Implementation Phases

### Phase 1: Basic Touch Support
- [ ] Touch-friendly slider sizing
- [ ] Tap trigger
- [ ] Responsive canvas
- [ ] Basic media queries

### Phase 2: Mobile Layout
- [ ] Phone portrait layout
- [ ] Phone landscape layout
- [ ] Collapsible control panel
- [ ] Mode swipe navigation

### Phase 3: Advanced Gestures
- [ ] Circular knob controls
- [ ] Pinch zoom/rotate
- [ ] Multi-touch support
- [ ] Gesture feedback

### Phase 4: Mobile Features
- [ ] Device sensor input
- [ ] Haptic feedback
- [ ] Wake lock
- [ ] Fullscreen API

### Phase 5: Polish
- [ ] Smooth animations
- [ ] Performance optimization
- [ ] Accessibility (touch targets 44px+)
- [ ] Testing on various devices

---

## Testing Devices

### Minimum Support
- iPhone 12 / iOS 14+
- Samsung Galaxy S20 / Android 10+
- iPad Air / iPadOS 14+

### Testing Matrix
| Device | OS | Browser | Priority |
|--------|-------|---------|----------|
| iPhone 14 | iOS 17 | Safari | High |
| iPhone SE | iOS 16 | Safari | Medium |
| Pixel 7 | Android 14 | Chrome | High |
| Galaxy S23 | Android 13 | Samsung Internet | Medium |
| iPad Pro | iPadOS 17 | Safari | High |
| Galaxy Tab | Android 13 | Chrome | Medium |

---

## Resources

- [Touch Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Pointer Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [Device Motion MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)
- [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Mobile Touch Guidelines](https://www.nngroup.com/articles/touch-target-size/)

