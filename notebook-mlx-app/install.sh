#!/bin/bash

# NotebookMLX Installation Script
# This script builds and installs NotebookMLX on macOS

set -e

echo "🚀 NotebookMLX Installation Script"
echo "=================================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only"
    exit 1
fi

# Check for required tools
echo "🔍 Checking requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION found. Please upgrade to Node.js 18+"
    exit 1
fi
echo "✅ Node.js $NODE_VERSION"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+ from https://python.org"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm globally by running: npm install -g pnpm"
    exit 1
fi
echo "✅ pnpm $(pnpm -v)"

echo ""
echo "📦 Installing dependencies..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
pnpm install

echo "Installing frontend dependencies..."
cd frontend && pnpm install && cd ..

echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo ""
echo "🔧 Building application..."

# Build the frontend
echo "Building frontend..."
pnpm run build:frontend

# Prepare Python distribution
echo "Preparing Python distribution..."
pnpm run prepare:python

# Create app icon (basic SVG version)
echo "Creating app icon..."
node scripts/create-icon.js

echo ""
echo "📱 Building macOS app..."

# Build the macOS app
pnpm run dist:mac

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "Your app has been built and is available at:"
echo "📁 $(pwd)/dist/NotebookMLX-1.0.0.dmg"
echo ""
echo "To install:"
echo "1. Double-click the DMG file"
echo "2. Drag NotebookMLX to your Applications folder"
echo "3. Launch NotebookMLX from Applications or Spotlight"
echo ""
echo "📝 Note: On first launch, the app will download AI models (~5-10GB)"
echo "   This only happens once and enables offline functionality"
echo ""

# Ask if user wants to open the dist folder
read -p "🔍 Open the dist folder now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open dist/
fi

echo ""
echo "🚀 Ready to use! Enjoy NotebookMLX!"
