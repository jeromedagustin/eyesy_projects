#!/usr/bin/env python3
"""
Test suite for EYESY modes
Tests that each mode can be loaded, initialized, and drawn without errors
"""

import os
import sys
import importlib.util
import traceback
from pathlib import Path
from typing import List, Tuple, Optional

# Set environment variable before importing pygame to suppress window
if 'SDL_VIDEODRIVER' not in os.environ:
    os.environ['SDL_VIDEODRIVER'] = 'dummy'

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import the EYESY simulator
from tools.eyesy_runner import EYESYSimulator

# Try to import pygame
try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    print("Warning: pygame not available. Tests will be limited.")


class ModeTester:
    """Test framework for EYESY modes"""
    
    def __init__(self):
        self.results = []
        self.simulator = None
        self.screen = None
        
    def setup_test_environment(self):
        """Initialize pygame and create test screen"""
        if not HAS_PYGAME:
            return False
        
        try:
            pygame.init()
            # Set video mode (required for some pygame operations like convert_alpha)
            # Use a small hidden window or set environment variable to suppress window
            os.environ['SDL_VIDEODRIVER'] = 'dummy'  # Use dummy video driver for headless testing
            try:
                pygame.display.set_mode((1280, 720), pygame.HIDDEN)
            except:
                # If dummy driver doesn't work, try with a small visible window
                os.environ.pop('SDL_VIDEODRIVER', None)
                pygame.display.set_mode((1280, 720))
            self.screen = pygame.Surface((1280, 720))
            self.simulator = EYESYSimulator(1280, 720)
            return True
        except Exception as e:
            print(f"Failed to setup test environment: {e}")
            return False
    
    def find_all_modes(self) -> List[Path]:
        """Find all mode directories"""
        modes = []
        examples_dir = project_root / "examples"
        
        # Search in scopes, triggers, utilities, and mixed subdirectories
        for subdir in ["scopes", "triggers", "utilities", "mixed"]:
            subdir_path = examples_dir / subdir
            if subdir_path.exists():
                for mode_dir in subdir_path.iterdir():
                    if mode_dir.is_dir() and (mode_dir / "main.py").exists():
                        modes.append(mode_dir)
        
        return sorted(modes)
    
    def load_mode(self, mode_path: Path) -> Tuple[Optional[object], Optional[str]]:
        """Load a mode module and return (module, error)"""
        main_py = mode_path / "main.py"
        if not main_py.exists():
            return None, f"main.py not found in {mode_path}"
        
        try:
            spec = importlib.util.spec_from_file_location("main", str(main_py))
            if spec is None or spec.loader is None:
                return None, "Failed to create module spec"
            
            module = importlib.util.module_from_spec(spec)
            
            # Set mode_root before loading
            if self.simulator:
                self.simulator.set_mode_root(str(mode_path))
                # Set mode name
                self.simulator.mode = mode_path.name
            
            spec.loader.exec_module(module)
            return module, None
        except Exception as e:
            return None, f"Failed to load module: {str(e)}\n{traceback.format_exc()}"
    
    def test_mode_has_required_functions(self, module) -> Tuple[bool, str]:
        """Test that mode has setup() and draw() functions"""
        if not hasattr(module, 'setup'):
            return False, "Missing setup() function"
        if not hasattr(module, 'draw'):
            return False, "Missing draw() function"
        if not callable(module.setup):
            return False, "setup is not callable"
        if not callable(module.draw):
            return False, "draw is not callable"
        return True, "OK"
    
    def test_setup_function(self, module) -> Tuple[bool, str]:
        """Test that setup() can be called without errors"""
        if not self.screen or not self.simulator:
            return False, "Test environment not initialized"
        
        try:
            module.setup(self.screen, self.simulator)
            return True, "OK"
        except Exception as e:
            return False, f"setup() failed: {str(e)}\n{traceback.format_exc()}"
    
    def test_draw_function(self, module, iterations: int = 5) -> Tuple[bool, str]:
        """Test that draw() can be called multiple times without errors"""
        if not self.screen or not self.simulator:
            return False, "Test environment not initialized"
        
        errors = []
        
        # Test with different knob values
        test_cases = [
            {"name": "default", "knobs": [0.5, 0.5, 0.5, 0.5, 0.5]},
            {"name": "min", "knobs": [0.0, 0.0, 0.0, 0.0, 0.0]},
            {"name": "max", "knobs": [1.0, 1.0, 1.0, 1.0, 1.0]},
            {"name": "mixed", "knobs": [0.25, 0.75, 0.1, 0.9, 0.5]},
        ]
        
        for test_case in test_cases:
            # Set knob values
            for i, knob_val in enumerate(test_case["knobs"], 1):
                setattr(self.simulator, f"knob{i}", knob_val)
            
            # Test multiple draw calls
            for i in range(iterations):
                try:
                    # Reset trigger state
                    self.simulator.trig = False
                    self.simulator.midi_note_new = False
                    
                    # Update audio
                    self.simulator.update_audio()
                    
                    # Call draw
                    module.draw(self.screen, self.simulator)
                except Exception as e:
                    error_msg = f"draw() failed (test_case={test_case['name']}, iteration={i}): {str(e)}"
                    errors.append(error_msg)
                    # Don't break, continue testing other cases
        
        if errors:
            return False, "\n".join(errors[:5])  # Limit error output
        return True, "OK"
    
    def test_mode(self, mode_path: Path) -> dict:
        """Run all tests on a mode"""
        mode_name = mode_path.name
        result = {
            "mode": mode_name,
            "path": str(mode_path),
            "loaded": False,
            "has_functions": False,
            "setup_works": False,
            "draw_works": False,
            "errors": []
        }
        
        # Load mode
        module, error = self.load_mode(mode_path)
        if error:
            result["errors"].append(f"Load error: {error}")
            return result
        
        result["loaded"] = True
        
        # Test required functions exist
        has_funcs, error = self.test_mode_has_required_functions(module)
        result["has_functions"] = has_funcs
        if error and not has_funcs:
            result["errors"].append(f"Function check: {error}")
            return result
        
        # Test setup()
        setup_ok, error = self.test_setup_function(module)
        result["setup_works"] = setup_ok
        if error and not setup_ok:
            result["errors"].append(f"Setup error: {error}")
            # Continue testing even if setup fails
        
        # Test draw()
        draw_ok, error = self.test_draw_function(module)
        result["draw_works"] = draw_ok
        if error and not draw_ok:
            result["errors"].append(f"Draw error: {error}")
        
        return result
    
    def run_all_tests(self) -> List[dict]:
        """Run tests on all modes"""
        if not self.setup_test_environment():
            print("ERROR: Failed to setup test environment")
            return []
        
        modes = self.find_all_modes()
        print(f"Found {len(modes)} modes to test\n")
        
        results = []
        for i, mode_path in enumerate(modes, 1):
            mode_name = mode_path.name
            print(f"[{i}/{len(modes)}] Testing: {mode_name}...", end=" ", flush=True)
            
            result = self.test_mode(mode_path)
            results.append(result)
            
            # Print status
            if result["loaded"] and result["has_functions"] and result["setup_works"] and result["draw_works"]:
                print("✓ PASS")
            else:
                print("✗ FAIL")
                if result["errors"]:
                    print(f"   Errors: {len(result['errors'])}")
        
        return results
    
    def print_summary(self, results: List[dict]):
        """Print test summary"""
        total = len(results)
        passed = sum(1 for r in results if r["loaded"] and r["has_functions"] and r["setup_works"] and r["draw_works"])
        failed = total - passed
        
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total modes: {total}")
        print(f"Passed: {passed} ✓")
        print(f"Failed: {failed} ✗")
        print("="*70)
        
        if failed > 0:
            print("\nFAILED MODES:")
            print("-"*70)
            for result in results:
                if not (result["loaded"] and result["has_functions"] and result["setup_works"] and result["draw_works"]):
                    print(f"\n{result['mode']}")
                    print(f"  Path: {result['path']}")
                    for error in result["errors"]:
                        # Print first few lines of error
                        error_lines = error.split('\n')[:3]
                        print(f"  Error: {error_lines[0]}")
                        if len(error_lines) > 1:
                            for line in error_lines[1:]:
                                print(f"         {line}")
        
        print("\n" + "="*70)


def main():
    """Main test runner"""
    print("EYESY Mode Test Suite")
    print("="*70)
    
    tester = ModeTester()
    results = tester.run_all_tests()
    tester.print_summary(results)
    
    # Exit with error code if any tests failed
    passed = sum(1 for r in results if r["loaded"] and r["has_functions"] and r["setup_works"] and r["draw_works"])
    failed = len(results) - passed
    
    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()






