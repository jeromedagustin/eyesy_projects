# EYESY Web - Mode Audit Report

## Summary

Total modes: **126**

| Category | Count | Description |
|----------|-------|-------------|
| ✅ OK (shows by default) | 69 | Should display animation immediately |
| 🎯 Trigger-only | 30 | Only draw when triggered (expected) |
| 🎵 Audio-dependent | 19 | Need mic/audio input to show meaningful output |
| 🖼️ Image modes | 7 | Need uploaded images (now disabled until upload) |
| 📹 Webcam modes | 1 | Needs webcam permission (now disabled until granted) |

## Modes That Should Always Show Something

These 69 modes should display animations without requiring any special input:

### Scope Modes (Self-Animating)
1. S - 0 Joy Division
2. S - A ZACH Reactive
3. S - A Zach Spiral
4. S - AA Selector
5. S - Amp Color
6. S - Amp Color - 5gon Filled
7. S - Amp Color - 5gon Outlines
8. S - Amp Color - Circles
9. S - Amp Color - Rectangles
10. S - Aquarium
11. S - Arcway
12. S - Arcway Black
13. S - Bits Horizontal
14. S - Bits Vertical
15. S - Boids
16. S - Bouncing Bars LFO
17. S - Breezy Feather LFO
18. S - Circle Row - LFO
19. S - Circular Trigon Field
20. S - Concentric
21. S - Five Lines Spin
22. S - Folia Angles
23. S - Folia Curves
24. S - Googly Eyes
25. S - Gradient Cloud
26. S - Gradient Column
27. S - Gradient Friend
28. S - Grid Circles - Column Color
29. S - Grid Circles - Outlined
30. S - Grid Circles - Outlined Column Color
31. S - Grid Circles - Patchwork Color
32. S - Grid Circles - Uniform Color
33. S - Grid Polygons - Column Color
34. S - Grid Polygons - Patchwork Color
35. S - Grid Polygons - Uniform Color
36. S - Grid Slide Square - Filled Column Color
37. S - Grid Slide Square - Filled Patchwork Color
38. S - Grid Slide Square - Filled Uniform Color
39. S - Grid Slide Square - Unfilled Column Color
40. S - Grid Slide Square - Unfilled Patchwork Color
41. S - Grid Slide Square - Unfilled Uniform Color
42. S - Grid Triangles - Filled Column Color
43. S - Grid Triangles - Filled Patchwork Color
44. S - Grid Triangles - Filled Uniform Color
45. S - Grid Triangles - Unfilled Column Color
46. S - Grid Triangles - Unfilled Patchwork Color
47. S - Grid Triangles - Unfilled Uniform Color
48. S - Horiz 2xLFO
49. S - Horizontal + Trails
50. S - Line Bounce Four - LFO Alternate
51. S - Line Bounce Two - LFO Alternate
52. S - Line Traveller
53. S - Mess A Sketch
54. S - Mirror Grid
55. S - Mirror Grid - Inverse
56. S - Nested Ellipses - Filled
57. S - Nested Ellipses - Outlines
58. S - Oscilloscope
59. S - Perspective Lines
60. S - Radiating Square - Stepped Color
61. S - Radiating Square - Uniform Color
62. S - Rain
63. S - Snow
64. S - Sound Jaws - Stepped Color
65. S - Sound Jaws - Uniform Color
66. S - Spinning Discs
67. S - Square Shadows - Uniform Color
68. S - Surf Waves
69. U - Timer

## Trigger-Only Modes (30)

These modes are **intentionally blank** until triggered. This is expected behavior - they wait for `eyesy.trig` to be true:

- T - 10 Print
- T - Ball of Mirrors
- T - Ball of Mirrors - Trails
- T - Bezier Cousins - Trails
- T - Bits H - Row Color
- T - Bits H - Uniform Color
- T - Bits V - Column Color
- T - Bits V - Uniform Color
- T - BoM Reckies Trans LFOs
- T - Density Units
- T - Draws Hashmarks - Angled Stepped Color
- T - Draws Hashmarks - Angled Uniform Color
- T - Draws Hashmarks - Stepped Color
- T - Draws Hashmarks - Uniform Color
- Font - Patterns
- Font - Recedes
- T - Isometric Wave
- T - Isometric Wave Runner
- T - Line Rotate - Trails
- T - Magnify Cloud - LFO
- T - MIDI Grid
- T - MIDI Note Printer
- T - Migrating Circle Grids
- T - Origami Triangles
- T - Reckie
- T - Spiral Alley
- T - Tiles - Filled
- T - Tiles - Outlines
- T - Trigon Traveller
- T - Woven Feedback

**To see these modes:** Press space bar or enable "Random Trigger" in controls.

## Audio-Dependent Modes (19)

These modes need audio input to display meaningful visualization:

- S - 0 Arrival Scope
- S - Audio Printer
- S - Bezier H Scope
- S - Bezier V Scope
- S - Breathing Circles
- S - Circle Scope
- S - Circle Scope - Opposite Colors
- S - Classic Horizontal
- S - Classic Vertical
- S - Cone Scope
- S - Connected Scope
- S - Football Scope
- S - Left & Right Scopes
- S - Radial Scope - Rotate Stepped Color
- S - Radial Scope - Rotate Uniform Color
- S - Three Scopes
- S - Two Scopes
- S - X Scope
- S - Zoom Scope

**To see these modes:** Enable microphone or play audio.

## Image Modes (7) - Disabled Until Images Uploaded

- Image - Circle Scope
- Image - Dancing Circle
- Image - H Circles
- Image - Basic
- Image - Circle Overlay
- Image - Marching Four
- Image - Slideshow Grid

**To enable:** Click the "Upload Images" button in the header.

## Webcam Mode (1) - Disabled Until Permission Granted

- Webcam - Live Feed

**To enable:** Click the "Enable Webcam" button in the header.

## Known Issues to Fix

### Modes That May Appear "Empty" at First

1. **Rain / Snow**: Raindrops/snowflakes start above screen and take a moment to fall into view
2. **Joy Division**: Lines may be very subtle without audio input
3. **Concentric**: Circles are small without audio input (but still visible)

### Modes with Code Issues (Non-Critical)

These work in the browser but fail in the test environment:
- Font - Patterns (test mock issue)
- T - MIDI Grid (needs midi_notes array in mock)
- T - MIDI Note Printer (needs midi_notes array in mock)
- U - Timer (test mock issue)

## Recommendations

1. **For blank trigger modes**: Consider adding a subtle "waiting for trigger" indicator
2. **For audio-dependent modes**: Consider showing a placeholder or static pattern when no audio
3. **For Rain/Snow**: Initialize some drops on-screen for immediate visibility
4. **Add startup hint**: Show brief tooltip explaining mode categories on first use





