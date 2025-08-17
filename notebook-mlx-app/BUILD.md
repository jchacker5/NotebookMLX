# Building NotebookMLX for macOS

This guide will help you create a distributable macOS app that users can install by double-clicking.

## Quick Build (One-Click Installer)

```bash
# Navigate to app directory
cd /Users/gijoe/Documents/NotebookMLX/notebook-mlx-app

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && pip install -r requirements.txt && cd ..

# Build the complete app
npm run dist:mac
```

This creates:
- `dist/NotebookMLX-1.0.0.dmg` - Drag-and-drop installer
- `dist/NotebookMLX-1.0.0-mac.zip` - Zip distribution

## Step-by-Step Build Process

### 1. Prepare Dependencies

```bash
# Install Node.js dependencies
npm install
cd frontend && npm install && cd ..

# Install Python dependencies
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2. Create App Icon (Optional)

```bash
# Generate base icon
node scripts/create-icon.js

# Convert SVG to ICNS (requires external tool)
# Option A: Use online converter
open assets/icon.svg
# Upload to https://convertio.co/svg-icns/
# Download and save as assets/icon.icns

# Option B: Use local tools (if available)
# npm install -g svg2icns
# svg2icns assets/icon.svg assets/icon.icns
```

### 3. Build Frontend

```bash
npm run build:frontend
```

### 4. Prepare Python Distribution

```bash
npm run prepare:python
```

This creates a `python-dist/` folder with:
- Complete Python virtual environment
- All dependencies installed
- Backend code
- Launch scripts

### 5. Build macOS App

```bash
# Build app bundle (for testing)
npm run pack

# Build distributable DMG + ZIP
npm run dist:mac

# Build for both architectures
npm run dist
```

## Output Files

After building, you'll find in the `dist/` folder:

```
dist/
├── NotebookMLX-1.0.0.dmg              # macOS installer
├── NotebookMLX-1.0.0-mac.zip          # Zip distribution
├── NotebookMLX-1.0.0-arm64-mac.zip    # Apple Silicon specific
├── NotebookMLX-1.0.0-x64-mac.zip      # Intel Mac specific
└── mac/
    └── NotebookMLX.app                 # The actual app bundle
```

## Installation for End Users

### Option 1: DMG Installer (Recommended)
1. Double-click `NotebookMLX-1.0.0.dmg`
2. Drag NotebookMLX to Applications folder
3. Launch from Applications or Spotlight

### Option 2: Zip Distribution
1. Download and unzip `NotebookMLX-1.0.0-mac.zip`
2. Move `NotebookMLX.app` to Applications folder
3. Right-click → Open (first time only, to bypass Gatekeeper)

## What's Included in the App Bundle

The built app is completely self-contained:

```
NotebookMLX.app/
├── Contents/
│   ├── MacOS/
│   │   └── NotebookMLX              # Electron executable
│   ├── Resources/
│   │   ├── app/                     # Frontend & Electron code
│   │   ├── python-dist/             # Complete Python environment
│   │   │   ├── venv/                # Python virtual environment
│   │   │   ├── backend/             # Backend code
│   │   │   └── start-backend.sh     # Launch script
│   │   └── models/                  # Pre-downloaded ML models (optional)
│   └── Info.plist                  # App metadata
```

## First Launch Behavior

When users first launch the app:

1. **Python Backend**: Starts automatically in the background
2. **Model Download**: Downloads required models (5-10GB) on first use
3. **Data Directory**: Creates `~/Library/Application Support/NotebookMLX/` for user data

## Troubleshooting Build Issues

### Python Build Fails
```bash
# Ensure Python 3.8+ is installed
python3 --version

# Clear previous build
rm -rf python-dist/
npm run prepare:python
```

### Icon Missing
```bash
# Use default Electron icon if custom icon fails
# Remove icon references from package.json temporarily
```

### Code Signing (For Distribution)
```bash
# For public distribution, you need Apple Developer account
export CSC_IDENTITY_AUTO_DISCOVERY=false  # Disable for unsigned builds
npm run dist:mac
```

### Size Optimization
```bash
# Exclude large files from bundle
echo "models/" >> .electronignore
echo "*.wav" >> .electronignore
echo "*.mp4" >> .electronignore

# Models will download on demand instead
```

## Development vs Production

| Mode | Command | Python Source | Model Storage |
|------|---------|---------------|---------------|
| Development | `npm start` | Local backend/ | Local downloads |
| Production | `npm run dist:mac` | Bundled python-dist/ | Bundled in app |

## Customization

### App Metadata
Edit `package.json`:
```json
{
  "build": {
    "appId": "com.yourcompany.notebookmlx",
    "productName": "Your App Name",
    "mac": {
      "category": "public.app-category.productivity"
    }
  }
}
```

### Bundle Size Reduction
- Exclude large models from bundle (download on demand)
- Use quantized models (4-bit versions)
- Remove unused dependencies

### Performance
- Pre-warm models on app launch
- Implement model caching
- Use smaller models for faster startup

## Distribution Checklist

- [ ] App builds without errors
- [ ] Python backend starts correctly
- [ ] All features work in built app
- [ ] Models download automatically
- [ ] App can be installed via DMG
- [ ] First launch experience is smooth
- [ ] File associations work (optional)
- [ ] Update mechanism configured (optional)

## Next Steps

After building successfully:

1. **Test the built app** on a clean Mac
2. **Distribute the DMG** to users
3. **Set up auto-updates** (optional) using electron-updater
4. **Code sign** for official distribution (requires Apple Developer account)
5. **Submit to Mac App Store** (optional, requires approval process)