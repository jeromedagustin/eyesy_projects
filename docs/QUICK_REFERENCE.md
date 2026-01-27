# EYESY Quick Reference

## Essential Functions

```python
def setup(screen, eyesy):
    # Initialize once when mode loads
    pass

def draw(screen, eyesy):
    # Called every frame - draw here!
    pass
```

## Common Patterns

### Basic Drawing
```python
# Set background
eyesy.color_picker_bg(eyesy.knob5)

# Get color
color = eyesy.color_picker(eyesy.knob4)

# Draw circle
pygame.draw.circle(screen, color, (x, y), radius)

# Draw line
pygame.draw.line(screen, color, (x1, y1), (x2, y2), width)
```

### Audio Input
```python
# Loop through audio samples
for i in range(len(eyesy.audio_in)):
    # Normalize: -1.0 to 1.0
    audio_val = eyesy.audio_in[i] / 32768.0
    
    # Use for visualization
    y = int(audio_val * eyesy.yres * 0.5 + eyesy.yres // 2)
```

### Trigger
```python
if eyesy.trig:
    # Do something when triggered
    pass
```

## Knob Conventions
- **Knob 1-3**: Mode-specific parameters
- **Knob 4**: Foreground color (`eyesy.color_picker(eyesy.knob4)`)
- **Knob 5**: Background color (`eyesy.color_picker_bg(eyesy.knob5)`)

## Screen Dimensions
- `eyesy.xres` - Width
- `eyesy.yres` - Height
- Center: `(eyesy.xres // 2, eyesy.yres // 2)`

## Color Functions
- `eyesy.color_picker(knob)` - Static color
- `eyesy.color_picker_lfo(knob)` - Animated color with LFO
- `eyesy.color_picker_bg(knob)` - Set background

## File Paths
- `eyesy.mode_root` - Path to mode folder
- Load images: `eyesy.mode_root + '/Images/image.png'`

# ## Shift Button (COMMENTED OUT - Experimental)
# ```python
# # Check for shift button support
# if hasattr(eyesy, 'shift') and eyesy.shift:
#     # Shift+knob feature active
#     pass
# ```
#
# **Note**: `eyesy.shift` is experimental and only available in the test runner. Not part of official EYESY OS v3 API.












