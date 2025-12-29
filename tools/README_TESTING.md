# EYESY Mode Testing

This directory contains testing tools for EYESY modes.

## Test Suite

The `test_modes.py` script automatically tests all EYESY modes to ensure they:
- Can be loaded without syntax errors
- Have the required `setup()` and `draw()` functions
- Can execute `setup()` without errors
- Can execute `draw()` multiple times with different knob values without errors

### Running Tests

```bash
# Run all tests
python tools/test_modes.py

# Or make it executable and run directly
chmod +x tools/test_modes.py
./tools/test_modes.py
```

### Test Output

The test suite will:
1. Find all modes in `examples/scopes/`, `examples/triggers/`, `examples/utilities/`, and `examples/mixed/`
2. Test each mode sequentially
3. Print a summary showing:
   - Total number of modes tested
   - Number of modes that passed
   - Number of modes that failed
   - Detailed error messages for failed modes

### Example Output

```
EYESY Mode Test Suite
======================================================================
Found 124 modes to test

[1/124] Testing: S - 0 Arrival Scope... ✓ PASS
[2/124] Testing: S - 0 Joy Division... ✓ PASS
...

TEST SUMMARY
======================================================================
Total modes: 124
Passed: 112 ✓
Failed: 12 ✗
======================================================================
```

### What Gets Tested

For each mode, the test suite:

1. **Load Test**: Attempts to import the mode's `main.py` file
2. **Function Check**: Verifies `setup()` and `draw()` functions exist and are callable
3. **Setup Test**: Calls `setup(screen, eyesy)` once
4. **Draw Test**: Calls `draw(screen, eyesy)` multiple times with different knob configurations:
   - Default (all knobs at 0.5)
   - Minimum (all knobs at 0.0)
   - Maximum (all knobs at 1.0)
   - Mixed (various knob values)

### Common Issues Found

The test suite helps identify:

- **Syntax Errors**: Python 2 vs Python 3 compatibility issues
- **Type Errors**: Float values used where integers are required
- **Missing Variables**: Variables not initialized before use
- **Import Errors**: Missing dependencies or incorrect imports
- **Logic Errors**: Code that crashes with certain knob values

### Known Limitations

Some modes may fail tests for expected reasons:

- **Webcam Modes**: Require OpenCV and camera hardware
- **Image Modes**: May require specific image files or pygame display initialization
- **Hardware-Specific**: Some modes may require actual EYESY hardware features

### Fixing Failed Modes

When a mode fails, the test output will show:
- The specific error message
- Which test failed (load, setup, or draw)
- The traceback (for debugging)

Common fixes:
- Add `int()` conversions for float values used in Pygame functions
- Initialize variables before use
- Fix Python 2/3 syntax differences (e.g., `print` statements)
- Add error handling for missing resources

### Continuous Integration

The test suite exits with:
- **Exit code 0**: All tests passed
- **Exit code 1**: One or more tests failed

This makes it suitable for CI/CD pipelines:

```bash
python tools/test_modes.py && echo "All tests passed!" || echo "Some tests failed"
```

## Test Runner

The `eyesy_runner.py` script provides interactive testing with:
- Real-time visual output
- Keyboard controls for knobs
- Microphone input support
- MIDI input support
- Screenshot capture
- Hot reloading

See the main README for usage instructions.
