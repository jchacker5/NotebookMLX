# 🚀 NotebookMLX - Quick Installation Guide

Transform your PDFs into podcasts, chat with your documents, and create mind maps - all locally on your Mac using Apple's MLX framework.

*Enhanced by jchacker5*

## 🎯 One-Click Installation

```bash
cd /Users/gijoe/Documents/NotebookMLX/notebook-mlx-app
./install.sh
```

This will:
- ✅ Check all requirements
- 📦 Install dependencies  
- 🔧 Build the complete app
- 📱 Create a macOS installer (DMG)
- 🎉 Ready to use!

## 📋 Requirements

- **macOS**: 10.15+ (Catalina or newer)
- **Processor**: Apple Silicon (M1/M2/M3) recommended for best performance
- **Memory**: 16GB RAM recommended
- **Storage**: 15GB free space (5GB for app + 10GB for AI models)
- **Internet**: Required for initial model downloads

## 🎛️ Manual Installation (Advanced)

If you prefer step-by-step control:

### 1. Install Dependencies
```bash
# Install Node.js dependencies
pnpm install
cd frontend && pnpm install && cd ..

# Python dependencies  
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Build the App
```bash
pnpm run dist:mac
```

### 3. Install
Double-click `dist/NotebookMLX-1.0.0.dmg` and drag to Applications.

## 🖱️ How to Use After Installation

### First Launch
1. Open **NotebookMLX** from Applications
2. Wait for AI models to download (one-time, ~10 minutes)
3. Upload your first PDF or document

### Core Features
- **📄 Upload Sources**: Drag PDFs into the left panel
- **💬 Chat**: Ask questions about your documents  
- **🎧 Generate Podcasts**: Convert to conversational audio
- **🧠 Mind Maps**: Visualize key concepts
- **🎤 Custom Voices**: Train your own voice for TTS
- **🎥 Create Videos**: Turn podcasts into videos

## 🔧 Troubleshooting

### App Won't Open
```bash
# Allow app to run (first time only)
sudo xattr -rd com.apple.quarantine /Applications/NotebookMLX.app
```

### Python Issues
```bash
# Rebuild Python environment
rm -rf python-dist/
pnpm run prepare:python
pnpm run dist:mac
```

### Models Not Downloading
- Check internet connection
- Ensure 10GB+ free disk space
- Models are cached in `~/Library/Application Support/NotebookMLX/`

### Performance Issues
- Close other memory-intensive apps
- Use smaller/quantized models in settings
- Ensure you're on Apple Silicon for best performance

## 📊 What Gets Downloaded

On first launch, the app downloads these AI models:

| Model | Size | Purpose |
|-------|------|---------|
| Qwen2.5-1.5B | ~1GB | PDF processing |
| Qwen2.5-14B | ~8GB | Podcast generation |
| Qwen2.5-7B | ~4GB | Text enhancement |
| Kokoro-82M | ~200MB | Voice synthesis |
| F5-TTS | ~500MB | Custom voice cloning |

**Total**: ~14GB (downloaded once, cached locally)

## 🎨 Features Overview

### 📱 **NotebookLM-Style Interface**
- Three-panel layout: Sources | Chat/Content | Studio
- Drag & drop file uploads
- Real-time processing status

### 🎧 **Advanced Podcast Generation**
- Multiple voice options (male/female speakers)
- Custom voice cloning with your own voice
- Dramatic enhancement for natural dialogue
- Export as high-quality WAV/MP3

### 💬 **Intelligent Chat**
- Context-aware Q&A with your documents
- Citation linking back to sources
- Supports PDF, TXT, MD, and more

### 🧠 **Interactive Mind Maps**
- D3.js-powered visualizations
- Extract and visualize key concepts
- Export as SVG for presentations

### 🎤 **Voice Studio**
- Record voice samples directly in-app
- Train custom voice models
- Real-time voice synthesis testing

### 🎥 **Video Generation**
- Convert podcasts to engaging videos
- Animated waveforms and captions
- Customizable themes and export options

## 🔐 Privacy & Security

- **100% Local Processing**: No data leaves your Mac
- **No Internet Required**: After initial setup
- **No Accounts**: No sign-up or login required
- **Your Data**: Stored locally in `~/Library/Application Support/NotebookMLX/`

## 🆚 vs. NotebookLM

| Feature | NotebookLM | NotebookMLX |
|---------|------------|-------------|
| **Processing** | Cloud | Local |
| **Privacy** | Google servers | Your Mac only |
| **Internet** | Always required | Only for setup |
| **Custom Voices** | ❌ | ✅ Voice cloning |
| **Video Export** | ❌ | ✅ Full video generation |
| **Costs** | Usage limits | Free forever |
| **Speed** | Network dependent | Apple Silicon optimized |

## 🚀 Quick Start Workflow

1. **Launch** NotebookMLX
2. **Upload** a PDF by dragging it to the Sources panel
3. **Select** the document (it'll highlight in blue)
4. **Choose your workflow**:
   - **Chat**: Ask "What are the main points?"
   - **Podcast**: Go to Studio → Podcast → Generate
   - **Mind Map**: Go to Studio → Mind Map → Generate
   - **Video**: Generate podcast first, then Studio → Video

## 🔄 Updates

The app checks for updates automatically. When available:
- Notification appears in-app
- Download and install like any Mac app
- Your data and custom voices are preserved

## 💡 Tips for Best Results

### 📄 **Document Prep**
- Use text-based PDFs (not scanned images)
- Longer documents = better podcast conversations
- Multiple related documents work great together

### 🎧 **Podcast Quality**
- Enable "Enhance dialogue" for natural flow
- Try different voice combinations
- Custom voices work best with 5-10 minutes of clear speech

### 🧠 **Mind Maps**
- Work best with academic or technical content
- Combine multiple sources for richer maps
- Export SVG for use in presentations

## 🆘 Getting Help

1. **Built-in Help**: Check the app's Help menu
2. **Documentation**: See `README.md` for full details
3. **Issues**: Create issues on GitHub
4. **Community**: Join discussions for tips and tricks

---

**🎉 Ready to transform how you interact with documents?**

Run `./install.sh` and start exploring!