# EYESY API Reference

Based on [EYESY OS v3 Documentation](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/#52-eyesys-api)

## Required Functions

Every EYESY mode must implement these two functions:

### `setup(screen, eyesy)`
Called once when the mode is loaded. Use for initialization.

**Parameters:**
- `screen` - Pygame surface for drawing
- `eyesy` - EYESY object with API access

### `draw(screen, eyesy)`
Called once per frame (typically 30 or 60 FPS). This is where you render visuals.

**Parameters:**
- `screen` - Pygame surface for drawing
- `eyesy` - EYESY object with API access

## EYESY Object Variables

### Hardware Controls
- `eyesy.knob1` - Knob 1 value (0.0 to 1.0)
- `eyesy.knob2` - Knob 2 value (0.0 to 1.0)
- `eyesy.knob3` - Knob 3 value (0.0 to 1.0)
- `eyesy.knob4` - Knob 4 value (0.0 to 1.0)
- `eyesy.knob5` - Knob 5 value (0.0 to 1.0)
- `eyesy.button1` - Button 1 state (boolean)
- `eyesy.button2` - Button 2 state (boolean)
- `eyesy.button3` - Button 3 state (boolean)
- `eyesy.button4` - Button 4 state (boolean)

### Audio Input
- `eyesy.audio_in[]` - Array of audio samples (typically 100-200 samples)
  - Values range from -32768 to 32768
  - Use `eyesy.audio_in[i] / 32768.0` to normalize to -1.0 to 1.0

### Trigger
- `eyesy.trig` - Trigger state (boolean)
  - True when trigger button is pressed or MIDI note received
  - Useful for trigger-based modes

### Display
- `eyesy.xres` - Screen width in pixels
- `eyesy.yres` - Screen height in pixels

### Settings
- `eyesy.auto_clear` - Auto clear setting (boolean)
  - `True` = Auto clear is OFF (persist mode)
  - `False` = Auto clear is ON (clear each frame)

# ### Shift Button (COMMENTED OUT - Experimental/Not in Official API)
# - `eyesy.shift` - Shift button state (boolean) - **Experimental/Not in Official API**
#   - `True` when shift button is pressed
#   - **Note**: This is not part of the official EYESY OS v3 API. It works in the test runner but may not be available on actual hardware.
#   - The official API uses Shift for system shortcuts (e.g., Shift+Knob1 adjusts audio input gain)
#   - Use `hasattr(eyesy, 'shift')` to check for availability before using

### File Paths
- `eyesy.mode_root` - Path to the current mode's folder
  - Use this to load images: `eyesy.mode_root + '/Images/image.png'`

## EYESY Object Functions

### Color Functions

#### `eyesy.color_picker(knob)`
Translates a knob value (0-1) into an RGB color tuple.

**Parameters:**
- `knob` - Knob value (typically `eyesy.knob4`)

**Returns:**
- `(r, g, b)` - Tuple of three integers (0-255)

**Example:**
```python
color = eyesy.color_picker(eyesy.knob4)
pygame.draw.circle(screen, color, (x, y), radius)
```

#### `eyesy.color_picker_lfo(knob, max_rate=0.1)`
Similar to `color_picker()` but with a built-in LFO for automatic color animation.

**Parameters:**
- `knob` - Knob value (typically `eyesy.knob4`)
- `max_rate` - Optional maximum LFO rate (default: 0.1)

**Behavior:**
- First half of knob rotation (0.0 to 0.5): Static color selection
- Second half of knob rotation (0.5 to 1.0): LFO rate control

**Returns:**
- `(r, g, b)` - Tuple of three integers (0-255)

**Example:**
```python
color = eyesy.color_picker_lfo(eyesy.knob4)
# Or with custom LFO rate:
color = eyesy.color_picker_lfo(eyesy.knob4, 1.1)
```

#### `eyesy.color_picker_bg(knob)`
Sets the background color based on a knob value.

**Parameters:**
- `knob` - Knob value (typically `eyesy.knob5`)

**Example:**
```python
eyesy.color_picker_bg(eyesy.knob5)
```

## Common Patterns

### Audio-Reactive Scope
```python
def draw(screen, eyesy):
    eyesy.color_picker_bg(eyesy.knob5)
    color = eyesy.color_picker(eyesy.knob4)
    
    for i in range(len(eyesy.audio_in)):
        x = int((i / len(eyesy.audio_in)) * eyesy.xres)
        y = int((eyesy.audio_in[i] / 32768.0) * eyesy.yres * 0.5 + eyesy.yres // 2)
        pygame.draw.circle(screen, color, (x, y), 2)
```

### Trigger-Based Pattern
```python
def draw(screen, eyesy):
    eyesy.color_picker_bg(eyesy.knob5)
    
    if eyesy.trig:
        # Draw something when triggered
        color = eyesy.color_picker(eyesy.knob4)
        pygame.draw.circle(screen, color, (eyesy.xres//2, eyesy.yres//2), 50)
```

### Loading Images
```python
def setup(screen, eyesy):
    global images
    images = []
    for filepath in sorted(glob.glob(eyesy.mode_root + '/Images/*.png')):
        img = pygame.image.load(filepath)
        images.append(img)
```

## Notes

- The `draw()` function is called for every video frame, so keep it efficient
- Audio input array size may vary, always check `len(eyesy.audio_in)` before indexing
- Scene changes may temporarily override knob values
- Use `eyesy.mode_root` to access mode-specific assets like images

# ## Shift Button Usage (COMMENTED OUT)
#
# The Shift button on EYESY is primarily used for system-level shortcuts (see [EYESY OS v3 Documentation](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/#24-shift--button-shortcuts)):
# - **Shift + Mode Forward/Backward** - Select foreground color palette
# - **Shift + Scene Forward/Backward** - Select background color palette
# - **Shift + Save** - Update current scene
# - **Shift + Screenshot/Trigger** - Control knob sequencer
# - **Shift + OSD** - Open on-screen menu
# - **Shift + Knob 1** - Adjust audio input gain (system function)
#
# For mode-specific shift+knob features, use `hasattr(eyesy, 'shift')` to check availability:
# ```python
# if hasattr(eyesy, 'shift') and eyesy.shift:
#     # Shift-specific feature
#     pass
# ```

