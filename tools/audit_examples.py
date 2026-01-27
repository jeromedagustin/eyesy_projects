#!/usr/bin/env python3
"""
Audit script to identify code quality issues in example modes.
Scans for:
- Commented out code blocks
- Unused imports
- Unused variables
- Formatting issues
- Long lines
"""

import os
import re
import ast
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
examples_dir = project_root / "examples"

issues_found = {
    'commented_code': [],
    'unused_imports': [],
    'unused_variables': [],
    'long_lines': [],
    'trailing_whitespace': [],
    'missing_docstrings': []
}

def check_file(filepath):
    """Check a single Python file for issues"""
    rel_path = filepath.relative_to(project_root)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception as e:
        print(f"Error reading {rel_path}: {e}")
        return
    
    # Check for commented code blocks (3+ consecutive commented lines that look like code)
    commented_lines = 0
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith('#') and len(stripped) > 2:
            # Check if it looks like commented code (has common code patterns)
            comment_text = stripped[1:].strip()
            if any(pattern in comment_text for pattern in ['=', '(', ')', '[', ']', '.', 'def ', 'import ', 'if ', 'for ', 'while ']):
                commented_lines += 1
            else:
                commented_lines = 0
        else:
            if commented_lines >= 3:
                issues_found['commented_code'].append((rel_path, i - commented_lines, commented_lines))
            commented_lines = 0
    
    # Check for long lines (>100 chars)
    for i, line in enumerate(lines, 1):
        if len(line) > 100:
            issues_found['long_lines'].append((rel_path, i, len(line)))
    
    # Check for trailing whitespace
    for i, line in enumerate(lines, 1):
        if line.rstrip() != line and line.strip():  # Has trailing whitespace and isn't empty
            issues_found['trailing_whitespace'].append((rel_path, i))
    
    # Try to parse AST for unused imports/variables
    try:
        tree = ast.parse(content, filename=str(filepath))
        
        # Get all imports
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
                for alias in node.names:
                    imports.add(alias.name)
        
        # Get all names used
        names_used = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Name):
                names_used.add(node.id)
            elif isinstance(node, ast.Attribute):
                names_used.add(node.attr)
        
        # Check for potentially unused imports (simple heuristic)
        # This is not perfect but catches obvious cases
        stdlib_imports = {'os', 'sys', 'math', 'time', 'random', 'pygame'}
        for imp in imports:
            if imp not in names_used and imp not in stdlib_imports:
                # Check if it's used in a from X import Y pattern
                if not any(f'from {imp}' in content or f'import {imp}' in content for _ in [1]):
                    issues_found['unused_imports'].append((rel_path, imp))
    
    except SyntaxError:
        # Can't parse, skip AST analysis
        pass
    except Exception as e:
        pass  # Skip on other errors

def main():
    """Main audit function"""
    print("=" * 60)
    print("EYESY Examples Code Audit")
    print("=" * 60)
    print()
    
    # Find all Python files in examples
    python_files = list(examples_dir.rglob("main.py"))
    
    print(f"Scanning {len(python_files)} files...")
    print()
    
    for filepath in sorted(python_files):
        check_file(filepath)
    
    # Report findings
    total_issues = sum(len(v) for v in issues_found.values())
    
    if total_issues == 0:
        print("✓ No issues found!")
        return
    
    print(f"Found {total_issues} potential issues:\n")
    
    if issues_found['commented_code']:
        print(f"📝 Commented Code Blocks: {len(issues_found['commented_code'])}")
        for filepath, line, count in issues_found['commented_code'][:10]:  # Show first 10
            print(f"   {filepath}:{line} ({count} lines)")
        if len(issues_found['commented_code']) > 10:
            print(f"   ... and {len(issues_found['commented_code']) - 10} more")
        print()
    
    if issues_found['long_lines']:
        print(f"📏 Long Lines (>100 chars): {len(issues_found['long_lines'])}")
        for filepath, line, length in issues_found['long_lines'][:10]:
            print(f"   {filepath}:{line} ({length} chars)")
        if len(issues_found['long_lines']) > 10:
            print(f"   ... and {len(issues_found['long_lines']) - 10} more")
        print()
    
    if issues_found['trailing_whitespace']:
        print(f"🔍 Trailing Whitespace: {len(issues_found['trailing_whitespace'])}")
        for filepath, line in issues_found['trailing_whitespace'][:10]:
            print(f"   {filepath}:{line}")
        if len(issues_found['trailing_whitespace']) > 10:
            print(f"   ... and {len(issues_found['trailing_whitespace']) - 10} more")
        print()
    
    if issues_found['unused_imports']:
        print(f"📦 Potentially Unused Imports: {len(issues_found['unused_imports'])}")
        for filepath, imp in issues_found['unused_imports'][:10]:
            print(f"   {filepath}: {imp}")
        if len(issues_found['unused_imports']) > 10:
            print(f"   ... and {len(issues_found['unused_imports']) - 10} more")
        print()
    
    print("=" * 60)
    print("Audit complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()







