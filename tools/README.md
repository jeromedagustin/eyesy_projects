# EYESY Script Runner

A custom application to run and test EYESY mode scripts locally on your computer without needing the EYESY hardware.

## Installation

1. Install required dependencies:
```bash
pip install -r tools/requirements.txt
```

Or install manually:
```bash
pip install pygame numpy pyaudio
```

**Note on pyaudio**: On some systems, you may need to install system dependencies first:
- **macOS**: `brew install portaudio` then `pip install pyaudio`
- **Linux**: `sudo apt-get install portaudio19-dev python3-pyaudio` (or equivalent)
- **Windows**: Usually works directly with `pip install pyaudio`

MIDI support is built into pygame, so no additional installation is needed for MIDI devices.

## Usage

### Basic Usage

Run the script with a mode path:
```bash
python tools/eyesy_runner.py examples/scopes/S\ -\ Classic\ Horizontal
```

Or run without arguments to open a file browser:
```bash
python tools/eyesy_runner.py
```

### Controls

**Knob Controls:**
- `Q`/`A` - Adjust Knob 1
- `W`/`S` - Adjust Knob 2
- `E`/`D` - Adjust Knob 3
- `R`/`F` - Adjust Color (Knob 4)
- `T`/`G` - Adjust Background Color (Knob 5)

**Shift Mode:**
- Hold `SHIFT` (Left or Right) + Knob controls for shift+knob features (if mode supports it)
- Shift state is shown in the control panel overlay

**Other Controls:**
- `SPACE` - Toggle Trigger
- `M` - Toggle Microphone Input (uses real audio from your mic)
- `I` - Toggle MIDI Input (uses connected USB/MIDI devices)
- `U` - Toggle Auto-Trigger (MIDI simulation)
- `C` - Toggle Auto Clear (persist mode vs clear each frame)
- `H` - Hide/Show Control Panel
- `L` - Reload Current Mode
- `←/→` or `ENTER/BACKSPACE` - Switch Between Modes
- `ESC` - Exit

**Mouse:**
- Left Click - Trigger (hold to keep triggered)
- Mouse Wheel - Fine knob adjustment (scroll over different screen regions to adjust different knobs)

## Features

- **Full EYESY API Simulation**: All EYESY functions and variables are simulated
- **Interactive Controls**: Adjust knobs in real-time using keyboard
- **Real Audio Input**: Use your microphone for actual audio-reactive testing (press `M`)
- **MIDI Support**: Connect USB/MIDI devices to trigger modes and control knobs (press `I`)
- **Audio Simulation**: Generates synthetic audio waveforms when microphone is disabled
- **Visual Feedback**: On-screen control panel shows current knob values and input status
- **Hot Reload**: Press `L` to reload the mode without restarting

## How It Works

The runner:
1. Loads the `main.py` file from the selected mode directory
2. Creates a simulated EYESY environment with:
   - Pygame screen (1280x720 default)
   - Simulated knobs, buttons, and triggers
   - Synthetic audio input
   - All EYESY API functions
3. Calls `setup()` once when loaded
4. Calls `draw()` every frame (60 FPS)

## Testing Your Modes

This tool is perfect for:
- Developing new EYESY modes locally
- Testing modes before deploying to hardware
- Debugging visual issues
- Experimenting with different knob values

## Audio and MIDI Input

### Microphone Input
- Press `M` to toggle microphone input
- Uses your system's default microphone
- Real-time audio capture for testing audio-reactive modes
- Falls back to simulated audio if microphone is unavailable or disabled

### MIDI Input
- Press `I` to toggle MIDI input
- Automatically detects and connects to the first available MIDI input device
- Supports:
  - MIDI Note On/Off messages (triggers modes and sets `eyesy.midi_notes[]`)
  - MIDI Control Change messages (maps to knobs: CC21-25 → Knob1-5)
  - Real-time knob control via MIDI CC
- Works with USB-MIDI devices, MIDI interfaces, and virtual MIDI ports

## Limitations

- Some hardware-specific features may not be available
- Performance may differ from actual EYESY hardware
- Microphone input requires `pyaudio` library (may need system dependencies)

## Troubleshooting

**Mode won't load:**
- Make sure the folder contains a `main.py` file
- Check that `main.py` has both `setup()` and `draw()` functions

**No visuals:**
- Check that the mode is drawing to the `screen` surface
- Try adjusting knobs to see if colors change
- Press `H` to show controls and verify knob values

**Performance issues:**
- Reduce the FPS in the code (change `self.fps = 60` to a lower value)
- Check for expensive operations in the mode's `draw()` function

