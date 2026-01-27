#!/usr/bin/env python3
"""
Build Script for Web Modes
Scans examples/ and custom/ directories, validates modes, and bundles them for web deployment.
"""

import os
import sys
import json
import shutil
import ast
from pathlib import Path
from typing import List, Dict, Optional

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Directories
EXAMPLES_DIR = project_root / "examples"
CUSTOM_DIR = project_root / "custom"
WEB_MODES_DIR = project_root / "web" / "modes"
WEB_ASSETS_DIR = project_root / "web" / "assets"
WEB_MANIFEST = project_root / "web" / "modes" / "manifest.json"


class ModeValidator:
    """Validates EYESY mode Python files"""
    
    @staticmethod
    def validate_mode(mode_path: Path) -> tuple[bool, Optional[str]]:
        """
        Validate a mode has required functions.
        Returns (is_valid, error_message)
        """
        main_py = mode_path / "main.py"
        
        if not main_py.exists():
            return False, "main.py not found"
        
        try:
            with open(main_py, 'r', encoding='utf-8') as f:
                code = f.read()
            
            # Parse AST to check for setup and draw functions
            tree = ast.parse(code)
            
            functions = {node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)}
            
            if 'setup' not in functions:
                return False, "Missing setup() function"
            
            if 'draw' not in functions:
                return False, "Missing draw() function"
            
            return True, None
            
        except SyntaxError as e:
            return False, f"Syntax error: {e}"
        except Exception as e:
            return False, f"Error validating mode: {e}"


class ModeBuilder:
    """Builds web-ready modes"""
    
    def __init__(self):
        self.modes = []
        self.validator = ModeValidator()
    
    def scan_modes(self) -> List[Dict]:
        """Scan for all available modes"""
        modes = []
        
        # Scan examples directory
        if EXAMPLES_DIR.exists():
            for category in ["scopes", "triggers", "utilities", "mixed"]:
                category_dir = EXAMPLES_DIR / category
                if category_dir.exists():
                    for mode_folder in sorted(category_dir.iterdir()):
                        if mode_folder.is_dir():
                            mode_info = self.process_mode_folder(mode_folder, category, "examples")
                            if mode_info:
                                modes.append(mode_info)
        
        # Scan custom directory
        if CUSTOM_DIR.exists():
            for mode_folder in sorted(CUSTOM_DIR.iterdir()):
                if mode_folder.is_dir():
                    mode_info = self.process_mode_folder(mode_folder, "custom", "custom")
                    if mode_info:
                        modes.append(mode_info)
        
        return modes
    
    def process_mode_folder(self, mode_folder: Path, category: str, source: str) -> Optional[Dict]:
        """Process a single mode folder"""
        main_py = mode_folder / "main.py"
        
        if not main_py.exists():
            return None
        
        # Validate mode
        is_valid, error = self.validator.validate_mode(mode_folder)
        if not is_valid:
            print(f"⚠️  Skipping {mode_folder.name}: {error}")
            return None
        
        # Extract mode name
        mode_name = mode_folder.name
        
        # Check for assets
        images_dir = mode_folder / "Images"
        has_images = images_dir.exists() and any(images_dir.glob("*.png"))
        
        # Create mode info
        mode_info = {
            "id": self.sanitize_id(mode_name),
            "name": mode_name,
            "category": category,
            "source": source,
            "path": f"modes/{self.sanitize_id(mode_name)}.py",
            "has_assets": has_images,
            "assets_path": f"assets/{self.sanitize_id(mode_name)}" if has_images else None
        }
        
        return mode_info
    
    def sanitize_id(self, name: str) -> str:
        """Convert mode name to safe ID"""
        # Replace spaces and special chars with underscores
        id_str = name.lower().replace(" ", "-").replace("_", "-")
        # Remove special characters
        id_str = "".join(c if c.isalnum() or c == "-" else "" for c in id_str)
        return id_str
    
    def copy_mode_file(self, source: Path, mode_id: str) -> bool:
        """Copy mode Python file to web/modes/"""
        try:
            dest = WEB_MODES_DIR / f"{mode_id}.py"
            
            # Read source file
            with open(source, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Write to destination
            WEB_MODES_DIR.mkdir(parents=True, exist_ok=True)
            with open(dest, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return True
        except Exception as e:
            print(f"❌ Error copying {source}: {e}")
            return False
    
    def copy_assets(self, source_dir: Path, mode_id: str) -> bool:
        """Copy mode assets (images) to web/assets/"""
        images_dir = source_dir / "Images"
        
        if not images_dir.exists():
            return True  # No assets to copy
        
        try:
            dest_dir = WEB_ASSETS_DIR / mode_id
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy all image files
            for img_file in images_dir.glob("*.png"):
                shutil.copy2(img_file, dest_dir / img_file.name)
            
            # Copy other assets (fonts, etc.)
            for asset_file in images_dir.glob("*"):
                if asset_file.suffix in ['.ttf', '.jpg', '.jpeg']:
                    shutil.copy2(asset_file, dest_dir / asset_file.name)
            
            return True
        except Exception as e:
            print(f"❌ Error copying assets for {mode_id}: {e}")
            return False
    
    def build(self) -> bool:
        """Build all modes"""
        print("🔍 Scanning for modes...")
        modes = self.scan_modes()
        
        if not modes:
            print("❌ No valid modes found!")
            return False
        
        print(f"✅ Found {len(modes)} valid modes")
        
        # Create output directories
        WEB_MODES_DIR.mkdir(parents=True, exist_ok=True)
        WEB_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Process each mode
        successful = 0
        failed = 0
        
        for mode in modes:
            mode_id = mode["id"]
            mode_name = mode["name"]
            
            # Find source directory
            if mode["source"] == "examples":
                source_dir = EXAMPLES_DIR / mode["category"] / mode_name
            else:
                source_dir = CUSTOM_DIR / mode_name
            
            source_file = source_dir / "main.py"
            
            if not source_file.exists():
                print(f"⚠️  Skipping {mode_name}: main.py not found")
                failed += 1
                continue
            
            print(f"📦 Building {mode_name}...")
            
            # Copy mode file
            if self.copy_mode_file(source_file, mode_id):
                # Copy assets if present
                if mode["has_assets"]:
                    self.copy_assets(source_dir, mode_id)
                
                successful += 1
                print(f"   ✅ {mode_name}")
            else:
                failed += 1
                print(f"   ❌ {mode_name}")
        
        # Generate manifest
        print("\n📝 Generating manifest...")
        self.generate_manifest(modes)
        
        print(f"\n✅ Build complete!")
        print(f"   Successful: {successful}")
        print(f"   Failed: {failed}")
        print(f"   Total: {len(modes)}")
        
        return failed == 0
    
    def generate_manifest(self, modes: List[Dict]):
        """Generate mode manifest JSON"""
        manifest = {
            "modes": modes,
            "categories": {
                "scopes": "Audio-reactive scope modes",
                "triggers": "Trigger-based pattern modes",
                "utilities": "Utility modes",
                "mixed": "Mixed or experimental modes",
                "custom": "Custom user modes"
            },
            "version": "1.0.0",
            "build_date": str(Path(__file__).stat().st_mtime)
        }
        
        with open(WEB_MANIFEST, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"   ✅ Manifest saved to {WEB_MANIFEST}")


def main():
    """Main entry point"""
    print("=" * 60)
    print("EYESY Web Mode Builder")
    print("=" * 60)
    print()
    
    builder = ModeBuilder()
    success = builder.build()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

