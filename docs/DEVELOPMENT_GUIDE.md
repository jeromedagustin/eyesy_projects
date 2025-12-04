# EYESY Development Guide

## Development Workflow

### 1. Local Development with eyesim

The easiest way to develop modes is using the `eyesim` simulator on your computer:

```bash
# Install eyesim
pip install eyesim

# Test a mode
eyesim custom/your_mode_folder

# Test with audio input
eyesim custom/your_mode_folder path/to/audio.wav
```

### 2. Using the EYESY Editor

For testing on actual hardware:

1. **Connect EYESY to WiFi**
   - Go to EYESY's WiFi menu
   - Note the IP address displayed

2. **Access the Editor**
   - Open browser: `http://<EYESY_IP_ADDRESS>`
   - Use the file browser to navigate
   - Use the code editor to edit `main.py` files
   - Check the console for errors

3. **Upload Your Mode**
   - Create a folder in the `Modes` directory
   - Upload your `main.py` file
   - Upload any assets (images, etc.) to subfolders

### 3. Direct SD Card Editing

You can also edit files directly on the microSD card:

1. Power down EYESY
2. Eject the microSD card
3. Mount it on your computer
4. Edit files in the `Modes` folder
5. Safely eject and reinsert into EYESY

## Mode Structure

Each mode should be in its own folder with this structure:

```
mode_name/
├── main.py          # Required: Your mode code
└── Images/          # Optional: Image assets
    ├── image1.png
    └── image2.png
```

## Best Practices

### Performance
- Keep `draw()` function efficient - it runs every frame
- Pre-load images in `setup()`, not `draw()`
- Use appropriate image sizes (EYESY resolution is typically 1280x720)
- Avoid creating new objects in `draw()` - reuse variables

### Knob Assignments
- **Knob 4**: Foreground color (use `eyesy.color_picker(eyesy.knob4)`)
- **Knob 5**: Background color (use `eyesy.color_picker_bg(eyesy.knob5)`)
- **Knobs 1-3**: Mode-specific parameters
- Document knob assignments in comments at the top of `main.py`

### Code Organization
- Add comments explaining what each knob does
- Use descriptive variable names
- Break complex drawing into helper functions
- Test with different audio inputs

### Audio Input
- Always check array bounds: `if len(eyesy.audio_in) > 0`
- Normalize audio values: `audio_in[i] / 32768.0`
- The audio array size may vary (typically 100-200 samples)

## Debugging Tips

### Console Output
- Use `print()` statements for debugging
- View output in EYESY Editor's console or via SSH
- Remove debug prints before finalizing

### Common Issues
- **Mode not appearing**: Check that `main.py` exists and has `setup()` and `draw()` functions
- **No visuals**: Ensure you're drawing to `screen` surface
- **Performance issues**: Check for expensive operations in `draw()`
- **Images not loading**: Verify path uses `eyesy.mode_root`

## Example Mode Categories

### Scope Modes (Audio-Reactive)
- Respond to audio input in real-time
- Visualize waveforms and frequencies
- Use `eyesy.audio_in[]` array

### Trigger Modes (Event-Based)
- Respond to button presses or MIDI notes
- Use `eyesy.trig` boolean
- Create patterns that persist or animate

### Hybrid Modes
- Combine audio reactivity with triggers
- Use both `eyesy.audio_in[]` and `eyesy.trig`

## Resources

- Study existing modes in `examples/` folder
- Reference the [EYESY API Documentation](API_REFERENCE.md)
- Check the [official EYESY docs](https://critterandguitari.github.io/cg-docs/EYESY/ey_os_3/)

