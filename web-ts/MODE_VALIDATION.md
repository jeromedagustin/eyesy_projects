# Mode Validation System

This project includes a validation system to identify modes that don't work correctly and mark them as "Experimental".

## How It Works

1. **Validation Test**: The `mode-validation.test.ts` test runs each mode and verifies it can:
   - Be instantiated
   - Call `setup()` without errors
   - Call `draw()` multiple times without errors

2. **Experimental Flag**: Modes that fail validation should be marked with `experimental: true` in the modes index.

3. **UI Behavior**: Experimental modes are:
   - Sorted to the bottom of mode lists
   - Marked with "(Experimental)" in the UI
   - Shown with a red border in the mode browser
   - Slightly dimmed to indicate they may not work correctly

## Running Validation Tests

```bash
npm run test:validate-modes
```

This will:
- Test all modes
- Report which modes passed/failed
- Show a summary at the end

## Marking Modes as Experimental

After running validation tests and identifying failing modes:

1. Open `src/modes/index.ts`
2. Find the mode definition
3. Add `experimental: true` to the mode object:

```typescript
{
  id: 's---problematic-mode',
  name: 'S - Problematic Mode',
  category: 'scopes',
  mode: ProblematicMode,
  experimental: true, // Add this line
}
```

## Current Status

Run `npm run test:validate-modes` to see the current validation status.

All modes are currently passing basic validation tests. However, if you notice a mode doesn't work correctly compared to the Python version, you can manually mark it as experimental.

## Future Improvements

- Visual comparison tests (screenshot comparison)
- Performance benchmarks
- Audio reactivity verification
- More comprehensive error detection

