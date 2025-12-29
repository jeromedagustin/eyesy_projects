# EYESY Projects

This repository contains organized examples and custom modes for the [EYESY visual synthesizer](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/).

## Folder Structure

```
eyesy-projects/
├── examples/          # Original EYESY factory modes organized by type
│   ├── scopes/       # Audio-reactive scope modes (78 modes)
│   ├── triggers/     # Trigger-based pattern modes (29 modes)
│   ├── utilities/    # Utility modes (Timer, Webcam, Webcam Grid)
│   └── mixed/        # Mixed or experimental modes
├── custom/           # Your custom EYESY modes go here
├── docs/             # Documentation and notes
└── tools/            # Helper scripts and utilities
```

## Mode Categories

### Scopes (S -)
Audio-reactive modes that respond to audio input in real-time. These modes visualize audio waveforms and frequencies.

Examples:
- `S - Classic Horizontal` - Classic horizontal waveform display
- `S - Circle Scope` - Circular audio visualization
- `S - Bezier H Scope` - Bezier curve horizontal scope
- `S - Surf Waves` - Realistic ocean waves with 2D/3D modes

### Triggers (T -)
Pattern-based modes that respond to trigger events (button presses or MIDI notes). These create visual patterns that can be triggered on demand.

Examples:
- `T - Basic Image` - Display images on trigger
- `T - Ball of Mirrors` - Mirror ball effect
- `T - Font Patterns` - Text-based patterns

### Utilities (U -)
Utility modes for system functions and tools.

Examples:
- `U - Timer` - Timer utility with countdown and motivational phrases
- `U - Webcam` - Live webcam feed with color keying and effects
- `U - Webcam Grid` - Grid-based webcam visualization

## Getting Started

### Creating a Custom Mode

1. Create a new folder in the `custom/` directory
2. Create a `main.py` file with at least two functions:
   - `setup(screen, eyesy)` - Called when mode is loaded
   - `draw(screen, eyesy)` - Called once per frame

See `custom/template_mode/` for a basic template.

### Testing Modes Locally

You can test modes without the EYESY hardware using either:

**Option 1: Custom Script Runner (Recommended)**
```bash
# Install dependencies
pip install -r tools/requirements.txt

# Run a mode
python tools/eyesy_runner.py custom/your_mode_folder

# Or run without arguments to browse for a mode
python tools/eyesy_runner.py
```

See `tools/README.md` for full documentation and controls.

**Option 2: Automated Test Suite**
```bash
# Test all modes automatically
python tools/test_modes.py
```

The test suite verifies that all modes can be loaded, initialized, and drawn without errors. See `tools/README_TESTING.md` for details.

**Option 3: eyesim Simulator**
```bash
pip install eyesim
eyesim custom/your_mode_folder
```

Or with audio input:
```bash
eyesim custom/your_mode_folder path/to/audio.wav
```

### Deploying to EYESY

1. Connect your EYESY to WiFi
2. Find the EYESY's IP address in the WiFi menu
3. Access the EYESY Editor at `http://<EYESY_IP_ADDRESS>`
4. Upload your mode folder to the EYESY's `Modes` directory

## Resources

- [EYESY OS v3 Documentation](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/)
- [EYESY API Reference](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/#52-eyesys-api)
- [Original EYESY Modes Repository](https://github.com/critterandguitari/EYESY_Modes_OSv3)

## EYESY API Quick Reference

### Key Variables
- `eyesy.knob1` through `eyesy.knob5` - Knob values (0.0 to 1.0)
- `eyesy.audio_in[]` - Audio input array
- `eyesy.trig` - Trigger state (boolean)
- `eyesy.xres`, `eyesy.yres` - Screen resolution
- `eyesy.auto_clear` - Auto clear setting
# - `eyesy.shift` - Shift button state (boolean, experimental - COMMENTED OUT, not in official API)

### Key Functions
- `eyesy.color_picker(knob)` - Get color from knob value
- `eyesy.color_picker_lfo(knob)` - Get color with LFO animation
- `eyesy.color_picker_bg(knob)` - Set background color

# ### Shift+Knob Features (COMMENTED OUT - Experimental)
# The test runner supports shift+knob combinations for extended control. Hold SHIFT while adjusting knobs to access additional parameters. This feature works in the test runner but may not be available on actual EYESY hardware (not in official API). Always use `hasattr(eyesy, 'shift')` to check availability.

## License

The example modes are from the [EYESY_Modes_OSv3](https://github.com/critterandguitari/EYESY_Modes_OSv3) repository. Custom modes in this repository are your own work.

