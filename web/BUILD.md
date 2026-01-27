# Building Web Modes

This document explains how to build and bundle EYESY modes for web deployment.

## Quick Start

```bash
# From project root
python tools/build_web_modes.py
```

This will:
1. Scan `examples/` and `custom/` directories
2. Validate all modes (check for `setup()` and `draw()` functions)
3. Copy Python mode files to `web/modes/`
4. Copy assets (images) to `web/assets/`
5. Generate `web/modes/manifest.json`

## Build Process

### 1. Mode Scanning

The build script scans:
- `examples/scopes/` - Audio-reactive scope modes
- `examples/triggers/` - Trigger-based pattern modes
- `examples/utilities/` - Utility modes
- `examples/mixed/` - Mixed or experimental modes
- `custom/` - Custom user modes

### 2. Validation

Each mode is validated to ensure:
- `main.py` exists
- `setup(screen, eyesy)` function exists
- `draw(screen, eyesy)` function exists
- Python syntax is valid

Modes that fail validation are skipped with a warning.

### 3. File Naming

Mode files are renamed to safe IDs:
- Spaces → dashes
- Special characters removed
- Lowercase
- Example: `S - Classic Horizontal` → `s---classic-horizontal.py`

### 4. Asset Copying

If a mode has an `Images/` directory:
- All `.png` images are copied to `web/assets/{mode-id}/`
- Font files (`.ttf`) are also copied
- Other assets (`.jpg`, etc.) are copied

### 5. Manifest Generation

A `manifest.json` file is generated with:
- List of all modes
- Mode metadata (name, category, path)
- Asset information
- Category descriptions

## Output Structure

```
web/
├── modes/
│   ├── manifest.json          # Mode registry
│   ├── s---classic-horizontal.py
│   ├── t---basic-image.py
│   └── ...
└── assets/
    ├── s---circle-scope---image/
    │   └── *.png
    ├── t---basic-image/
    │   └── *.png
    └── ...
```

## Adding New Modes

1. **Add mode to repository:**
   ```bash
   # Add to examples/ or custom/
   cp -r new_mode examples/scopes/
   ```

2. **Run build script:**
   ```bash
   python tools/build_web_modes.py
   ```

3. **Mode is now available:**
   - Appears in web app mode selector
   - Can be loaded and run
   - Assets are automatically copied

## Troubleshooting

### Mode Not Appearing

- Check that `main.py` exists
- Verify `setup()` and `draw()` functions exist
- Check for Python syntax errors
- Run build script to see validation errors

### Assets Not Loading

- Ensure images are in `Images/` directory (capital I)
- Check that images are `.png` format
- Verify build script copied assets to `web/assets/`
- Check browser console for 404 errors

### Build Errors

- Ensure you're running from project root
- Check that `examples/` and `custom/` directories exist
- Verify Python 3.6+ is installed
- Check file permissions

## Manual Mode Addition

If you need to manually add a mode:

1. Copy `main.py` to `web/modes/{mode-id}.py`
2. Copy assets to `web/assets/{mode-id}/`
3. Add entry to `web/modes/manifest.json`:

```json
{
  "id": "my-mode",
  "name": "My Mode",
  "category": "custom",
  "source": "custom",
  "path": "modes/my-mode.py",
  "has_assets": true,
  "assets_path": "assets/my-mode"
}
```

## CI/CD Integration

To build modes in CI/CD:

```yaml
# Example GitHub Actions
- name: Build Web Modes
  run: python tools/build_web_modes.py
```

The build script exits with code 0 on success, 1 on failure.

