#!/bin/bash

echo "🚀 Fast M1 Mac Build for NotebookMLX"
echo "=================================="

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/ python-dist/

# Build frontend
echo "🔧 Building frontend..."
cd frontend && npm run build && cd ..

# Prepare Python (reuse if exists)
echo "🐍 Preparing Python distribution..."
if [ ! -d "python-dist" ]; then
    node scripts/prepare-python.js
else
    echo "✅ Using existing Python distribution"
fi

# Build just the .app (no DMG for speed)
echo "📱 Building macOS app (ARM64 only)..."
npx electron-builder --mac --arm64 --dir

echo ""
echo "🎉 Build Complete!"
echo ""

# Find the app
APP_PATH="dist/mac-arm64/NotebookMLX.app"

if [ -d "$APP_PATH" ]; then
    echo "✅ Your app is ready at:"
    echo "📁 $(pwd)/$APP_PATH"
    echo ""
    
    # Ask if user wants to open it
    read -p "🚀 Open NotebookMLX now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🎯 Opening NotebookMLX..."
        open "$APP_PATH"
    else
        echo "💡 To run later: open \"$(pwd)/$APP_PATH\""
    fi
else
    echo "❌ Build failed - app not found"
    exit 1
fi

echo ""
echo "🎉 Ready to use NotebookMLX on your M1 Mac!"