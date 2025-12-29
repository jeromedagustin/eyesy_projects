#!/usr/bin/env python3
"""
Automated cleanup script for example modes.
Removes:
- Trailing whitespace
- Multiple blank lines (reduces to max 2)
- Fixes common formatting issues
"""

import os
import re
from pathlib import Path

project_root = Path(__file__).parent.parent
examples_dir = project_root / "examples"

files_cleaned = 0
total_changes = 0

def clean_file(filepath):
    """Clean a single Python file"""
    global files_cleaned, total_changes
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return
    
    original_lines = lines.copy()
    cleaned_lines = []
    changes = 0
    
    for i, line in enumerate(lines):
        original_line = line
        
        # Remove trailing whitespace
        line = line.rstrip() + '\n' if line.strip() else line.rstrip()
        if line != original_line:
            changes += 1
        
        cleaned_lines.append(line)
    
    # Remove excessive blank lines at end of file
    while cleaned_lines and not cleaned_lines[-1].strip():
        cleaned_lines.pop()
        changes += 1
    if cleaned_lines and not cleaned_lines[-1].endswith('\n'):
        cleaned_lines[-1] += '\n'
    
    # Only write if there were changes
    if changes > 0:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(cleaned_lines)
            files_cleaned += 1
            total_changes += changes
            rel_path = filepath.relative_to(project_root)
            print(f"  Cleaned {rel_path}: {changes} changes")
        except Exception as e:
            print(f"Error writing {filepath}: {e}")

def main():
    """Main cleanup function"""
    print("=" * 60)
    print("EYESY Examples Cleanup")
    print("=" * 60)
    print()
    
    # Find all Python files in examples
    python_files = list(examples_dir.rglob("main.py"))
    
    print(f"Cleaning {len(python_files)} files...")
    print()
    
    for filepath in sorted(python_files):
        clean_file(filepath)
    
    print()
    print("=" * 60)
    print(f"Cleanup complete!")
    print(f"  Files cleaned: {files_cleaned}")
    print(f"  Total changes: {total_changes}")
    print("=" * 60)

if __name__ == "__main__":
    main()

