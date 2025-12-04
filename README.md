# EYESY Projects

This repository contains organized examples and custom modes for the [EYESY visual synthesizer](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/).

## Folder Structure

```
eyesy-projects/
├── examples/          # Original EYESY factory modes organized by type
│   ├── scopes/       # Audio-reactive scope modes (78 modes)
│   ├── triggers/     # Trigger-based pattern modes (29 modes)
│   ├── utilities/    # Utility modes (1 mode)
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

### Triggers (T -)
Pattern-based modes that respond to trigger events (button presses or MIDI notes). These create visual patterns that can be triggered on demand.

Examples:
- `T - Basic Image` - Display images on trigger
- `T - Ball of Mirrors` - Mirror ball effect
- `T - Font Patterns` - Text-based patterns

### Utilities (U -)
Utility modes for system functions and tools.

Examples:
- `U - Timer` - Timer utility

## Getting Started

### Creating a Custom Mode

1. Create a new folder in the `custom/` directory
2. Create a `main.py` file with at least two functions:
   - `setup(screen, eyesy)` - Called when mode is loaded
   - `draw(screen, eyesy)` - Called once per frame

See `custom/template_mode/` for a basic template.

### Testing Modes Locally

You can test modes without the EYESY hardware using the `eyesim` simulator:

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

### Key Functions
- `eyesy.color_picker(knob)` - Get color from knob value
- `eyesy.color_picker_lfo(knob)` - Get color with LFO animation
- `eyesy.color_picker_bg(knob)` - Set background color

## License

The example modes are from the [EYESY_Modes_OSv3](https://github.com/critterandguitari/EYESY_Modes_OSv3) repository. Custom modes in this repository are your own work.

