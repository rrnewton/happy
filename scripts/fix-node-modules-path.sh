#!/bin/bash
#
# fix-node-modules-path.sh
#
# Cloudflare Pages doesn't serve files from directories named "node_modules".
# This script renames the node_modules directory in dist/assets to _modules
# and updates all references in the JavaScript bundles.
#
# Run this script after `expo export --platform web` or `bun web:build`.

set -e

DIST_DIR="${1:-dist}"

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: dist directory not found at $DIST_DIR"
    exit 1
fi

NODE_MODULES_PATH="$DIST_DIR/assets/node_modules"
MODULES_PATH="$DIST_DIR/assets/_modules"

# Check if node_modules exists in assets
if [ ! -d "$NODE_MODULES_PATH" ]; then
    echo "No node_modules found in $DIST_DIR/assets - nothing to do"
    exit 0
fi

echo "Fixing node_modules path in dist..."

# Step 1: Rename node_modules to _modules
if [ -d "$MODULES_PATH" ]; then
    echo "Removing existing _modules directory..."
    rm -rf "$MODULES_PATH"
fi

echo "Renaming node_modules to _modules..."
mv "$NODE_MODULES_PATH" "$MODULES_PATH"

# Step 2: Replace references in all JS files
echo "Updating references in JavaScript bundles..."
JS_FILES=$(find "$DIST_DIR" -name "*.js" -type f 2>/dev/null)

REPLACED_COUNT=0
for js_file in $JS_FILES; do
    # Check if file contains node_modules references
    if grep -q "assets/node_modules" "$js_file" 2>/dev/null; then
        # Replace all occurrences of assets/node_modules with assets/_modules
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS requires -i ''
            sed -i '' 's|assets/node_modules|assets/_modules|g' "$js_file"
        else
            # Linux
            sed -i 's|assets/node_modules|assets/_modules|g' "$js_file"
        fi
        REPLACED_COUNT=$((REPLACED_COUNT + 1))
        echo "  Updated: $(basename "$js_file")"
    fi
done

echo ""
echo "Done! Fixed $REPLACED_COUNT JavaScript file(s)"
echo ""

# Verify the changes
echo "Verification:"
echo "  - node_modules directory: $([ -d "$NODE_MODULES_PATH" ] && echo "EXISTS (ERROR)" || echo "removed")"
echo "  - _modules directory: $([ -d "$MODULES_PATH" ] && echo "exists" || echo "MISSING (ERROR)")"

# Count remaining node_modules references
REMAINING=$(grep -r "assets/node_modules" "$DIST_DIR"/*.js "$DIST_DIR"/_expo/static/js/web/*.js 2>/dev/null | wc -l | tr -d ' ')
echo "  - Remaining 'assets/node_modules' references: $REMAINING"

if [ "$REMAINING" -gt 0 ]; then
    echo ""
    echo "Warning: Some references may not have been replaced"
    exit 1
fi

echo ""
echo "Successfully fixed node_modules path for Cloudflare Pages deployment"
