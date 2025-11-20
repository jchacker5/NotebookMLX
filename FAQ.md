# NotebookMLX - Frequently Asked Questions

Welcome to the NotebookMLX FAQ! Find answers to the most common questions about installation, features, troubleshooting, and more.

**Quick Links:**
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Features & Usage](#features--usage)
- [Troubleshooting](#troubleshooting)
- [Models & Performance](#models--performance)
- [Privacy & Data](#privacy--data)
- [Limitations](#limitations)

---

## System Requirements

### What hardware do I need to run NotebookMLX?

**Minimum Requirements:**
- **Computer**: Mac with macOS 10.15 (Catalina) or newer
- **Processor**: Apple Silicon (M1/M2/M3) **strongly recommended** for optimal performance
  - Intel Macs are technically supported but will be significantly slower
- **Memory (RAM)**: 8GB minimum, **16GB or more recommended**
- **Storage**: 15GB free disk space
  - 5GB for the application
  - 10GB for AI models (downloaded on first launch)
- **Internet**: Required for initial setup and model downloads (optional afterward)

### Which macOS versions are supported?

NotebookMLX supports macOS 10.15 (Catalina) and newer, including:
- macOS 10.15 Catalina
- macOS 11 Big Sur
- macOS 12 Monterey
- macOS 13 Ventura
- macOS 14 Sonoma
- macOS 15 Sequoia

### Will it work on my Intel Mac?

Yes, but with **significantly reduced performance**. NotebookMLX uses Apple's MLX framework, which is optimized for Apple Silicon chips. On Intel Macs:
- Model processing will be 5-10x slower
- Podcast generation may take 30+ minutes instead of 5-10 minutes
- Higher memory usage
- Battery drain on laptops

**Recommendation**: For the best experience, use an Apple Silicon Mac (M1 or newer).

### How much RAM do I really need?

- **8GB RAM**: Works but may struggle with large PDFs or long podcasts. Expect slower performance.
- **16GB RAM**: **Recommended** for smooth operation with most documents.
- **32GB+ RAM**: Ideal for heavy users processing multiple large documents simultaneously.

### How much storage space is required?

**Total: ~15GB minimum**

Breakdown:
- Application files: ~500MB
- Python backend and dependencies: ~1GB
- MLX models (downloaded on first launch): ~10-14GB
  - Qwen2.5-1.5B: ~1GB (PDF processing)
  - Qwen2.5-14B: ~8GB (podcast transcript generation)
  - Qwen2.5-7B: ~4GB (dialogue enhancement)
  - Kokoro-82M: ~200MB (text-to-speech)
  - F5-TTS: ~500MB (voice cloning)
- User data (PDFs, generated podcasts): Variable, can grow significantly

**Tip**: Plan for 20-30GB total if you'll be processing many documents and generating podcasts regularly.

### Do I need an internet connection?

**During Setup:**
- ✅ **Required** for downloading the application
- ✅ **Required** for initial AI model downloads (~10GB)

**After Setup:**
- ❌ **Not required** for core features (PDF processing, podcast generation, chat)
- ✅ **Optional** for web research features or model updates

**Bottom Line**: Internet is needed for installation, but NotebookMLX runs 100% locally afterward.

---

## Installation & Setup

### How do I install NotebookMLX?

**Quick Installation (Recommended):**

1. **Download the DMG file** from the [releases page](https://github.com/jchacker5/NotebookMLX/releases)
2. **Open the DMG** and drag NotebookMLX to your Applications folder
3. **Launch NotebookMLX** from Applications
4. **Wait for models to download** (10-20 minutes on first launch)
5. **Start using** the app!

**Advanced Installation (Build from source):**

```bash
# Clone repository
git clone https://github.com/jchacker5/NotebookMLX.git
cd NotebookMLX/notebook-mlx-app

# Run installation script
./install.sh

# Or build manually
pnpm install
cd frontend && pnpm install && cd ..
cd backend && pip install -r requirements.txt && cd ..
pnpm run dist:mac
```

See [INSTALL.md](/home/user/NotebookMLX/notebook-mlx-app/INSTALL.md) for detailed instructions.

### What is the first-time setup process?

1. **Launch the app** - Double-click NotebookMLX in Applications
2. **Model downloads begin automatically** - You'll see progress indicators
3. **Wait 10-20 minutes** for models to download (varies by internet speed)
4. **Verify installation** - The app should show "Ready" status when complete
5. **Upload your first document** - Drag a PDF to the Sources panel
6. **Start exploring!**

### How long does model downloading take?

**Expected Download Times** (will vary based on your internet speed):

| Model | Size | Time on 100 Mbps | Time on 50 Mbps | Time on 20 Mbps |
|-------|------|------------------|-----------------|-----------------|
| Qwen2.5-1.5B | ~1GB | 1-2 min | 3-4 min | 7-10 min |
| Qwen2.5-14B | ~8GB | 10-12 min | 20-25 min | 50-60 min |
| Qwen2.5-7B | ~4GB | 5-6 min | 10-12 min | 25-30 min |
| Kokoro-82M | ~200MB | 15-30 sec | 30-60 sec | 2-3 min |
| F5-TTS | ~500MB | 45-60 sec | 1-2 min | 4-6 min |

**Total**: 10-20 minutes on fast internet, up to 90 minutes on slower connections.

**Tip**: Models are downloaded once and cached. Subsequent launches are instant!

### How do I know installation succeeded?

**Successful Installation Signs:**
1. ✅ NotebookMLX app launches without errors
2. ✅ You see the three-panel interface (Sources | Chat | Studio)
3. ✅ Backend status shows "Connected" (usually in green)
4. ✅ You can upload a PDF and see it process to "Completed" status
5. ✅ No error messages about missing models

**If Something's Wrong:**
- ❌ App crashes immediately → See [TROUBLESHOOTING.md](/home/user/NotebookMLX/TROUBLESHOOTING.md)
- ❌ "Backend not responding" → Backend may not have started
- ❌ "Model not found" errors → Models didn't download completely

### Where are models downloaded?

Models are stored locally in:
```
~/Library/Application Support/NotebookMLX/models/
```

Or if running from source:
```
~/.cache/huggingface/hub/
```

**These directories can grow to 10-15GB**, so ensure you have adequate storage.

---

## Features & Usage

### What can NotebookMLX do?

NotebookMLX is a **local alternative to NotebookLM** that runs entirely on your Mac. Core features:

1. **📄 Document Processing**
   - Upload PDFs, TXT, or Markdown files
   - Intelligent text extraction and preprocessing
   - Supports encrypted PDFs (with password)

2. **💬 Interactive Chat**
   - Ask questions about your uploaded documents
   - Get answers with source citations
   - Context-aware conversations
   - Export chat history (PDF, HTML, Markdown, JSON)

3. **🎧 Audio Overview (Podcast Generation)**
   - Convert documents into conversational podcasts
   - Two-speaker dialogue format (teacher + learner)
   - Custom voice selection
   - Dramatic enhancement for natural flow
   - Export as WAV or MP3

4. **🧠 Study Guide (Mind Maps)**
   - Visual concept maps from your documents
   - Interactive D3.js visualizations
   - Hierarchical topic organization
   - Export as SVG or interactive HTML

5. **🎥 Video Overview**
   - Turn podcasts into engaging videos
   - Animated waveforms and visualizations
   - Synchronized captions and transcripts

6. **🎤 Voice Training**
   - Train custom voices with your own audio samples
   - Use trained voices in podcast generation
   - Requires 2-10 minutes of clear audio

### How do I generate a podcast?

**Step-by-Step Podcast Generation:**

1. **Upload Document(s)**
   - Click "Add Source" in Sources panel
   - Select PDF, TXT, or MD file (max 200MB)
   - Wait for processing to complete (status: "Completed")

2. **Navigate to Studio**
   - Click the "Studio" tab at the top
   - Select "Audio Overview" (podcast generation)

3. **Select Your Document(s)**
   - Check the box next to the document(s) you want to discuss
   - Selected sources appear highlighted in blue

4. **Configure Speakers**
   - Choose voices for Speaker 1 (expert/teacher)
   - Choose voices for Speaker 2 (learner/curious questioner)
   - Options: Built-in voices or custom trained voices

5. **Optional Settings**
   - Enable "Dramatic Enhancement" for more engaging dialogue
   - Set target duration (if desired)

6. **Generate**
   - Click "Generate Podcast"
   - Wait 10-30 minutes depending on document length and system specs
   - Progress bar shows current stage (Transcript → Enhancement → Audio)

7. **Listen & Export**
   - Play generated podcast in-app
   - Export as ZIP (includes audio, transcript, metadata)
   - Share or archive your podcast

### What file formats are supported?

**Supported Input Formats:**
- **PDF** (.pdf) - Best support, including encrypted PDFs
- **Plain Text** (.txt) - Full support
- **Markdown** (.md) - Full support

**Coming Soon (not yet implemented):**
- DOCX (Microsoft Word)
- EPUB (eBooks)
- HTML (web pages)

**Not Supported:**
- Images (JPEG, PNG) - unless embedded in PDFs
- Scanned PDFs without OCR
- Audio files (MP3, WAV)
- Video files

### What are the file size limits?

**Upload Limits:**
- **Maximum file size**: 200MB per file
- **Files ≥8MB**: Use automatic chunked upload (slower but more reliable)
- **Files <8MB**: Direct upload (faster)

**Content Limits:**
- **Maximum extracted text**: 100,000 characters per document
- Very large documents are automatically chunked into sections

**Practical Limits:**
- **Most academic papers**: 1-20MB ✅ Works great
- **Books (100+ pages)**: 5-50MB ✅ Works well
- **Very large reports**: 50-200MB ⚠️ May be slow
- **Over 200MB**: ❌ Not supported, split into smaller files

### How long does podcast generation take?

**Typical Generation Times** (on Apple Silicon M1/M2):

| Document Size | Processing Time | Stages |
|---------------|-----------------|--------|
| Short paper (5-10 pages) | 5-10 minutes | Transcript (2-3 min) → Enhancement (1-2 min) → TTS (2-5 min) |
| Medium paper (20-30 pages) | 15-25 minutes | Transcript (5-8 min) → Enhancement (2-4 min) → TTS (8-13 min) |
| Long paper (50+ pages) | 30-60 minutes | Transcript (10-20 min) → Enhancement (5-10 min) → TTS (15-30 min) |
| Book chapter | 20-40 minutes | Varies based on length and complexity |

**Factors Affecting Speed:**
- **Document length**: Longer = slower
- **System specs**: More RAM = faster
- **Model selection**: Larger models = better quality but slower
- **Concurrent tasks**: Running other apps slows things down

**On Intel Macs**: Expect 3-5x longer generation times.

### Can I train custom voices?

**Yes!** NotebookMLX includes voice training capabilities.

**Requirements:**
- 2-10 minutes of clear audio samples (WAV format recommended)
- Minimal background noise
- Consistent speaking pace and tone
- Natural speech (avoid reading in monotone)

**Training Process:**
1. Go to **Voice Studio** in the app
2. Click **"Train New Voice"**
3. Upload 3-10 audio files (or record directly)
4. Provide voice name and description
5. Choose quality setting:
   - **Fast**: 2-5 minutes training time, good quality
   - **Balanced**: 5-10 minutes, better quality (**recommended**)
   - **High**: 10-20 minutes, best quality
6. Wait for training to complete
7. Test your new voice!

**Tips for Best Results:**
- Record in a quiet room
- Use a quality microphone (built-in Mac mic works, but external is better)
- Include varied sentences and expressions
- Speak naturally, not robotically
- Include emotions (excitement, curiosity, seriousness)

### What are mind maps and how do I use them?

**Mind Maps** are visual representations of the key concepts in your documents.

**How to Generate a Mind Map:**
1. Upload and select your document(s)
2. Go to **Studio** → **Mind Map**
3. Click **"Generate Mind Map"**
4. Wait 1-5 minutes for processing
5. Interact with the generated visualization

**Mind Map Features:**
- **Interactive nodes**: Click to explore topics
- **Hierarchical structure**: Central concept with branching subtopics
- **Source linking**: See which documents contributed to each concept
- **Zoom and pan**: Navigate large maps easily
- **Export**: Save as SVG (for presentations) or interactive HTML

**Best Use Cases:**
- Academic research papers (great for literature reviews)
- Technical documentation
- Complex reports with multiple themes
- Study materials and textbooks

---

## Troubleshooting

### App won't start / crashes on launch

**Common Causes & Fixes:**

**1. Security Gatekeeper Blocking App**
```bash
# Allow the app to run (macOS security)
sudo xattr -rd com.apple.quarantine /Applications/NotebookMLX.app
```

**2. Missing Dependencies**
- Ensure you have Python 3.11+ installed
- Verify Node.js 20+ is installed
- Run: `which python3` and `which node` to check

**3. Corrupted Installation**
- Delete NotebookMLX from Applications
- Clear cache: `rm -rf ~/Library/Application Support/NotebookMLX/`
- Reinstall from DMG

**4. Check Console Logs**
```bash
# View crash logs
open ~/Library/Logs/DiagnosticReports/
# Look for NotebookMLX crash reports
```

See [TROUBLESHOOTING.md](/home/user/NotebookMLX/TROUBLESHOOTING.md) for detailed diagnostics.

### "Backend not responding" error

**This means the FastAPI backend server didn't start properly.**

**Quick Fixes:**

1. **Restart the app** - Often resolves temporary issues
2. **Check port availability** - Port 8000 must be free
   ```bash
   lsof -i :8000
   # If something else is using port 8000, kill it:
   sudo kill -9 $(lsof -ti :8000)
   ```
3. **Check backend logs** - Look for error messages
   ```bash
   # If running from source:
   cd notebook-mlx-app/backend
   python main.py
   # Check for error messages
   ```
4. **Verify Python dependencies**
   ```bash
   cd notebook-mlx-app/backend
   pip install -r requirements.txt
   ```

### Upload fails / "File too large"

**Solutions:**

1. **File size limit is 200MB** - Split larger files or compress PDFs
2. **Check disk space** - Ensure you have at least 500MB free
3. **Try a different file** - Isolate whether the issue is file-specific
4. **Check file format** - Only PDF, TXT, MD are supported
5. **Disable antivirus temporarily** - Sometimes interferes with uploads

### Podcast generation stuck or failed

**Diagnostic Steps:**

1. **Check system resources**
   ```bash
   # Monitor memory usage
   top
   # Look for python processes consuming high CPU/memory
   ```

2. **Verify models are downloaded**
   - Check `~/Library/Application Support/NotebookMLX/models/`
   - Should contain Qwen2.5-1.5B, Qwen2.5-14B, Qwen2.5-7B

3. **Reduce load**
   - Close other memory-intensive applications
   - Try generating podcast with a smaller document first

4. **Check logs**
   ```bash
   # Application logs location
   ~/Library/Application Support/NotebookMLX/logs/app.log
   # Look for error messages
   ```

5. **Restart generation**
   - Cancel stuck generation
   - Wait 1-2 minutes
   - Try again with same or different settings

### Voice training errors

**Common Issues:**

**"Audio file format not supported"**
- Use WAV format (recommended) or MP3
- Convert with: `ffmpeg -i input.mp4 -acodec pcm_s16le -ar 22050 output.wav`

**"Audio quality too low"**
- Ensure minimum 16kHz sample rate
- Use lossless formats (WAV, FLAC) not compressed (MP3 below 128kbps)

**"Insufficient audio samples"**
- Provide at least 2 minutes of total audio
- 5-10 minutes recommended for best results

**"Training failed"**
- Check available RAM (need 4GB+ free)
- Reduce quality setting (use "Fast" instead of "High")
- Try with fewer audio samples

### Performance issues / slow generation

**Optimization Tips:**

1. **Close other apps** - Free up RAM and CPU
2. **Use smaller models** - Configure in settings (if available)
3. **Process smaller documents first** - Test with 5-10 page PDFs
4. **Upgrade hardware** - 16GB+ RAM makes a big difference
5. **Check Activity Monitor**
   - Look for memory pressure (should be green)
   - CPU usage should be high during generation (this is normal)
6. **Ensure SSD not full** - Keep at least 10GB free space

**Expected Behavior:**
- High CPU usage (80-100%) during generation = Normal ✅
- High memory usage (10-12GB) = Normal ✅
- Fans spinning loudly = Normal ✅
- System responsive to other tasks = Normal ✅

**Warning Signs:**
- Memory pressure red = Issue ⚠️
- Constant disk swapping = Need more RAM ⚠️
- System freezing/beach ball = Problem ❌

---

## Models & Performance

### Which models does NotebookMLX use?

**Default Model Configuration:**

| Task | Model | Size | Purpose |
|------|-------|------|---------|
| **PDF Processing** | Qwen2.5-1.5B-Instruct-4bit | ~1GB | Extract and preprocess text from PDFs |
| **Transcript Generation** | Qwen2.5-14B-Instruct-4bit | ~8GB | Create conversational podcast scripts |
| **Dialogue Enhancement** | Qwen2.5-7B-Instruct-4bit | ~4GB | Make conversations more natural and engaging |
| **Text-to-Speech** | Kokoro-82M | ~200MB | Convert text to speech (primary TTS) |
| **Voice Cloning** | F5-TTS-MLX | ~500MB | Train and use custom voices |

**All models run locally** using Apple's MLX framework, optimized for Apple Silicon.

### Can I use different models?

**Currently**: Model selection is configured in the backend settings. User-selectable models in the UI are planned for future releases.

**For Advanced Users** (modify backend configuration):

Edit `notebook-mlx-app/backend/.env`:
```env
# Example: Use smaller models for faster processing
PDF_MODEL=mlx-community/Qwen2.5-1.5B-Instruct-4bit
TRANSCRIPT_MODEL=mlx-community/Qwen2.5-7B-Instruct-4bit  # Smaller than default
REWRITER_MODEL=mlx-community/Qwen2.5-3B-Instruct-4bit
```

**Future**: The roadmap includes:
- Model selection in UI (Ollama + MLX models)
- Quality vs. speed presets
- Memory-optimized model variants

### Why is generation slow on my machine?

**Common Reasons:**

1. **Intel Mac instead of Apple Silicon**
   - MLX is optimized for M1/M2/M3 chips
   - Intel Macs run 5-10x slower
   - **Solution**: Upgrade to Apple Silicon or use a cloud service

2. **Insufficient RAM**
   - 8GB RAM causes memory swapping (very slow)
   - **Solution**: Upgrade to 16GB+ or close other apps

3. **Large Document**
   - 50+ page PDFs take 30-60 minutes
   - **Solution**: Process smaller sections or be patient

4. **Disk Space Low**
   - Less than 10GB free causes slowdowns
   - **Solution**: Free up disk space

5. **Background Apps**
   - Other apps competing for resources
   - **Solution**: Close Chrome, Slack, Photoshop, etc.

6. **Thermal Throttling**
   - Mac overheating and slowing down
   - **Solution**: Ensure good ventilation, use cooling pad

### What's the difference between Ollama and MLX models?

| Feature | MLX Models | Ollama Models |
|---------|-----------|---------------|
| **Optimization** | Apple Silicon only | Cross-platform |
| **Performance** | Fastest on M1/M2/M3 | Slower but more compatible |
| **Memory Usage** | Optimized for low memory | Higher memory usage |
| **Installation** | Built-in to NotebookMLX | Requires separate Ollama install |
| **Model Selection** | Fixed models | User can download any Ollama model |
| **Best For** | Default choice for Apple Silicon | Advanced users, custom models |

**Recommendation**: Stick with MLX models unless you have specific Ollama models you want to use.

### How do I update models?

**Automatic Updates** (Planned):
- Future versions will check for model updates
- Opt-in automatic downloads

**Manual Update** (Current):
1. Delete cached models:
   ```bash
   rm -rf ~/Library/Application Support/NotebookMLX/models/
   ```
2. Restart NotebookMLX
3. Models will re-download automatically

**Note**: Updated models from Hugging Face are infrequent. Only update if you're experiencing issues or a new version is explicitly recommended.

---

## Privacy & Data

### Is my data sent to the cloud?

**No. Absolutely not.** 🔒

NotebookMLX is designed as a **100% local-first application**:
- All processing happens on your Mac
- No data is sent to external servers
- No tracking or analytics
- No user accounts or authentication
- No internet required after initial setup

**The only internet usage:**
- Initial model downloads from Hugging Face (one-time)
- Optional: Future feature for web research (explicitly opt-in)
- Optional: App updates (you control when to update)

### Where are my files stored?

**Application Data Location:**
```
~/Library/Application Support/NotebookMLX/
```

**Directory Structure:**
```
NotebookMLX/
├── models/          # AI models (~10-14GB)
├── data/
│   ├── uploads/     # Your uploaded PDFs
│   ├── processed/   # Extracted text from PDFs
│   ├── podcasts/    # Generated podcast audio files
│   ├── voices/      # Custom trained voice models
│   └── database/    # SQLite database (metadata, chat history)
└── logs/            # Application logs
```

**Uploaded PDFs**: Stored in `data/uploads/` with original filenames
**Generated Podcasts**: Stored in `data/podcasts/` as WAV files
**Database**: SQLite file containing metadata, chat history, source tracking

**Total Storage Used**: Can grow significantly with usage. Plan for:
- 10-14GB models (one-time)
- 100MB-1GB per podcast generated
- Your uploaded PDF sizes

### How do I backup my data?

**Backup Entire NotebookMLX Data:**
```bash
# Create backup
tar -czf notebookmlx-backup-$(date +%Y%m%d).tar.gz \
  ~/Library/Application\ Support/NotebookMLX/data/

# Restore from backup
tar -xzf notebookmlx-backup-YYYYMMDD.tar.gz -C ~/Library/Application\ Support/NotebookMLX/
```

**Selective Backup:**

**Just Podcasts:**
```bash
cp -r ~/Library/Application\ Support/NotebookMLX/data/podcasts/ ~/Desktop/podcast-backup/
```

**Just Custom Voices:**
```bash
cp -r ~/Library/Application\ Support/NotebookMLX/data/voices/ ~/Desktop/voice-backup/
```

**Database Only:**
```bash
cp ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db ~/Desktop/backup-db.db
```

**Recommended Backup Strategy:**
- Weekly: Backup podcasts and custom voices
- Monthly: Full data backup
- Before major updates: Full backup

### How do I delete my data?

**Delete All NotebookMLX Data:**
```bash
# WARNING: This deletes everything including models (will re-download on next launch)
rm -rf ~/Library/Application\ Support/NotebookMLX/
```

**Delete Just User Data (Keep Models):**
```bash
# Keeps models but removes your uploads, podcasts, database
rm -rf ~/Library/Application\ Support/NotebookMLX/data/uploads/
rm -rf ~/Library/Application\ Support/NotebookMLX/data/podcasts/
rm -rf ~/Library/Application\ Support/NotebookMLX/data/processed/
rm ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db
```

**Delete Specific Items:**
- **Individual PDFs**: Click trash icon in Sources panel
- **Generated Podcasts**: Delete from file system or Studio interface
- **Chat History**: Click "Clear Chat" button
- **Custom Voices**: Delete from Voice Studio

**Complete Uninstall:**
1. Delete app: Move NotebookMLX to Trash
2. Delete data: `rm -rf ~/Library/Application\ Support/NotebookMLX/`
3. Delete preferences: `rm -rf ~/Library/Preferences/com.notebookmlx.*`
4. Empty Trash

---

## Limitations

### What are the known limitations?

**Platform Limitations:**
- **macOS only** - No Windows or Linux support (MLX is macOS-specific)
- **Apple Silicon recommended** - Works on Intel Macs but much slower
- **No iOS/iPadOS version** - Desktop only

**Performance Limitations:**
- **Memory intensive** - Requires 8GB+ RAM (16GB recommended)
- **Time intensive** - Podcast generation takes 10-60 minutes
- **Single-threaded podcast generation** - Can't generate multiple podcasts simultaneously
- **Storage intensive** - Models + data can exceed 20GB

**Feature Limitations:**
- **Limited model selection** - User can't change models via UI yet
- **No cloud sync** - Data stays on your Mac (by design for privacy)
- **No collaboration features** - Single-user application
- **No mobile companion** - Can't access from phone/tablet

**Content Limitations:**
- **Text-based PDFs only** - Scanned PDFs without OCR not supported
- **English optimized** - Other languages may have reduced quality
- **200MB file limit** - Very large documents must be split
- **100,000 character limit** per document

### What file types are supported vs. unsupported?

**✅ Fully Supported:**
- PDF (.pdf) - Including encrypted PDFs (with password)
- Plain Text (.txt)
- Markdown (.md)

**⚠️ Partial/Experimental Support:**
- Encrypted PDFs - Works with password but may have extraction issues

**❌ Not Supported:**
- Microsoft Word (.docx, .doc)
- Excel (.xlsx, .xls)
- PowerPoint (.pptx, .ppt)
- EPUB (.epub)
- HTML (.html)
- RTF (.rtf)
- Scanned PDFs (image-only PDFs without text layer)
- Images (JPEG, PNG, GIF)
- Audio files (MP3, WAV, FLAC)
- Video files (MP4, MOV, AVI)

**Workaround for Unsupported Formats:**
- Convert DOCX → PDF (use Preview, Pages, or Word export)
- Convert scanned PDFs → text PDF using OCR tools (Adobe Acrobat, Preview OCR)
- Extract text from HTML → TXT file

### What are the maximum file sizes?

**Upload Limits:**
| Item | Limit | Notes |
|------|-------|-------|
| **Single file upload** | 200MB | Hard limit, enforced by backend |
| **Total extracted text** | 100,000 characters | ~40-60 pages depending on formatting |
| **Number of sources** | Unlimited | Limited by disk space and memory |
| **Podcast audio output** | No limit | But very long podcasts may fail |
| **Custom voice training** | 10 audio files | Each up to 50MB |

**Practical Recommendations:**
- **Sweet spot**: 1-30 page PDFs (~1-10MB) for best performance
- **Acceptable**: 30-100 pages (~10-50MB) works well but slower
- **Challenging**: 100+ pages (~50-200MB) may be slow or fail
- **Not recommended**: Over 200MB - split into multiple files

### Is there Windows or Linux support?

**Short Answer**: Not currently.

**Why Not?**
- NotebookMLX uses **Apple's MLX framework**, which only runs on macOS
- MLX is optimized for Apple Silicon (M1/M2/M3 chips)
- Porting would require completely different ML backend

**Alternatives for Windows/Linux Users:**
1. **Use a Mac** (via remote desktop, virtual machine, or dual boot)
2. **Wait for future versions** - Cross-platform support is a long-term goal
3. **Use NotebookLM** (Google's cloud version) instead
4. **Explore other open-source alternatives** (LM Studio, Ollama, etc.)

**Future Roadmap** (No ETA):
- Cross-platform support using Ollama or other backends
- Web-based version (server runs on Mac, access from any device)

---

## Need More Help?

**Documentation:**
- 📖 [User Guide](/home/user/NotebookMLX/docs/USER_GUIDE.md) - Comprehensive feature documentation
- 🔧 [Troubleshooting Guide](/home/user/NotebookMLX/TROUBLESHOOTING.md) - Detailed diagnostic procedures
- 💬 [Support](/home/user/NotebookMLX/SUPPORT.md) - How to get help and report issues
- 📦 [Installation Guide](/home/user/NotebookMLX/notebook-mlx-app/INSTALL.md) - Setup instructions

**Community:**
- 🐛 [Report bugs](https://github.com/jchacker5/NotebookMLX/issues) on GitHub
- 💡 [Request features](https://github.com/jchacker5/NotebookMLX/issues) on GitHub
- 📚 [Browse documentation](/home/user/NotebookMLX/docs/) for detailed guides

**Still have questions?** Check [SUPPORT.md](/home/user/NotebookMLX/SUPPORT.md) for more ways to get help!

---

*Last Updated: 2025-11-20*
