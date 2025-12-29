#!/bin/bash
# Script to clear all __pycache__ directories
# Usage: ./clear_pycache.sh [path]
# If no path is provided, clears cache in current directory and subdirectories

if [ -z "$1" ]; then
    SEARCH_PATH="."
else
    SEARCH_PATH="$1"
fi

echo "Clearing __pycache__ directories in: $SEARCH_PATH"
find "$SEARCH_PATH" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find "$SEARCH_PATH" -type f -name "*.pyc" -delete 2>/dev/null
find "$SEARCH_PATH" -type f -name "*.pyo" -delete 2>/dev/null
echo "Done! All Python cache files cleared."

