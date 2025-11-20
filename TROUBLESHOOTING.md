# NotebookMLX - Troubleshooting Guide

This guide provides step-by-step diagnostic and fix procedures for common NotebookMLX issues. Follow the Quick Diagnostics first, then refer to specific error sections as needed.

**Quick Navigation:**
- [Quick Diagnostics](#quick-diagnostics)
- [Common Errors](#common-errors)
- [Performance Issues](#performance-issues)
- [Installation Issues](#installation-issues)
- [Data Recovery](#data-recovery)
- [Advanced Troubleshooting](#advanced-troubleshooting)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Checklist

Run through this quick checklist before diving into specific issues:

**✅ System Requirements**
- [ ] macOS 10.15 or newer: `sw_vers`
- [ ] Apple Silicon (recommended): `sysctl machdep.cpu.brand_string`
- [ ] 8GB+ RAM: Check "About This Mac"
- [ ] 15GB+ free disk space: `df -h ~`

**✅ Application Status**
- [ ] NotebookMLX app launches without crashing
- [ ] Backend status shows "Connected" (green indicator)
- [ ] No error toasts or warnings on launch

**✅ Dependencies**
- [ ] Python 3.11+: `python3 --version`
- [ ] Node.js 20+: `node --version`
- [ ] FFmpeg installed: `ffmpeg -version`

**✅ Models Downloaded**
- [ ] Models directory exists: `ls ~/Library/Application\ Support/NotebookMLX/models/`
- [ ] Models downloaded (should see ~10-14GB of files)

**✅ Disk Space**
- [ ] At least 10GB free for operations
- [ ] Check with: `df -h ~/Library/Application\ Support/NotebookMLX/`

### Log File Locations

**Application Logs:**
```bash
~/Library/Application Support/NotebookMLX/logs/app.log
```

**Backend Logs (if running from source):**
```bash
notebook-mlx-app/backend/logs/backend.log
```

**System Crash Logs:**
```bash
~/Library/Logs/DiagnosticReports/
# Look for files starting with "NotebookMLX"
```

**View Recent Logs:**
```bash
# Last 50 lines of application log
tail -n 50 ~/Library/Application\ Support/NotebookMLX/logs/app.log

# Follow logs in real-time
tail -f ~/Library/Application\ Support/NotebookMLX/logs/app.log

# Search for errors
grep -i error ~/Library/Application\ Support/NotebookMLX/logs/app.log
```

### How to Check System Requirements

**Check macOS Version:**
```bash
sw_vers
# ProductName:    macOS
# ProductVersion: 14.0 (or higher)
```

**Check Processor Type:**
```bash
sysctl machdep.cpu.brand_string
# Apple M1/M2/M3 = Apple Silicon ✅
# Intel = Will be slower ⚠️
```

**Check Available RAM:**
```bash
sysctl hw.memsize | awk '{print $2/1024/1024/1024 " GB"}'
# Should show 8GB or more
```

**Check Free Disk Space:**
```bash
df -h ~
# Look at "Available" column - should have 15GB+ free
```

**Check Python Version:**
```bash
python3 --version
# Should be 3.11 or newer
```

**Check Node Version:**
```bash
node --version
# Should be v20 or newer
```

### Version Information

**Get NotebookMLX Version:**

Option 1: From the app
- Open NotebookMLX
- Go to Menu Bar → NotebookMLX → About NotebookMLX
- Version shown in dialog

Option 2: From package.json
```bash
cd notebook-mlx-app
grep version package.json
```

Option 3: From DMG filename
- Check your Downloads folder
- DMG filename includes version: `NotebookMLX-1.0.0.dmg`

---

## Common Errors

### "Backend not responding"

**Symptoms:**
- Red error banner at top of app
- Message: "Backend not responding" or "Failed to connect to backend"
- Cannot upload files or generate content

**Possible Causes:**
1. Backend server failed to start
2. Port 8000 is already in use
3. Backend crashed after starting
4. Firewall blocking localhost connections
5. Python dependencies missing or corrupted

**Step-by-Step Fix:**

**Step 1: Check if Backend is Running**
```bash
# Check if port 8000 is in use
lsof -i :8000
# If you see output, backend is attempting to run
# If no output, backend didn't start
```

**Step 2: Restart the Application**
1. Quit NotebookMLX completely (Cmd+Q)
2. Wait 5 seconds
3. Relaunch NotebookMLX
4. Check if backend connects (green status)

**Step 3: Check for Port Conflicts**
```bash
# Find what's using port 8000
lsof -i :8000

# If something else is using it, kill that process
sudo kill -9 $(lsof -ti :8000)

# Restart NotebookMLX
```

**Step 4: Check Backend Logs**
```bash
# View backend logs for errors
tail -n 100 ~/Library/Application\ Support/NotebookMLX/logs/app.log | grep -i error

# Common errors to look for:
# - "ModuleNotFoundError" = Missing Python dependency
# - "Permission denied" = File permissions issue
# - "Address already in use" = Port conflict
```

**Step 5: Restart Backend Manually (Advanced)**

If using source installation:
```bash
cd notebook-mlx-app/backend
python3 main.py
# Watch for error messages
# Backend should start on http://0.0.0.0:8000
```

**Step 6: Reinstall Backend Dependencies**
```bash
cd notebook-mlx-app/backend
pip3 install --upgrade -r requirements.txt
```

**Step 7: Check Firewall Settings**
```bash
# Check if firewall is blocking
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If firewall is on, allow NotebookMLX
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/NotebookMLX.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /Applications/NotebookMLX.app
```

**If Still Not Working:**
- See [Advanced Troubleshooting](#advanced-troubleshooting)
- Report issue: [SUPPORT.md](/home/user/NotebookMLX/SUPPORT.md)

---

### "File upload failed"

**Symptoms:**
- Upload progress bar fails partway through
- Error message: "Upload failed" or "File too large"
- File not appearing in Sources panel

**Diagnostic Steps:**

**Step 1: Check File Size**
```bash
# Check size of file you're trying to upload
ls -lh /path/to/your/file.pdf
# Must be under 200MB
```

If over 200MB:
```bash
# Compress PDF (may reduce quality)
# Using macOS Preview:
# 1. Open PDF in Preview
# 2. File → Export
# 3. Choose "Reduce File Size" in Quartz Filter

# Or split into multiple files using Preview:
# 1. Open PDF in Preview
# 2. Select pages in sidebar (e.g., pages 1-50)
# 3. File → Print Selected Pages → Save as PDF
```

**Step 2: Check File Type**
```bash
# Verify file type
file /path/to/your/file.pdf
# Should say "PDF document" or "ASCII text" or "Unicode text"
# If it says something else, format is not supported
```

Supported formats:
- PDF (.pdf) ✅
- Plain Text (.txt) ✅
- Markdown (.md) ✅

**Step 3: Check Disk Space**
```bash
# Check available space
df -h ~/Library/Application\ Support/NotebookMLX/
# Need at least 500MB free + (2x file size)
```

If low on space:
```bash
# Clear old uploads (CAUTION: deletes data)
rm -rf ~/Library/Application\ Support/NotebookMLX/data/uploads/*.pdf

# Or free up system disk space
# 1. Empty Trash
# 2. Delete large files from Downloads
# 3. Clear system cache: sudo rm -rf /Library/Caches/*
```

**Step 4: Verify Network (for Web Version)**

If using web version (not Electron app):
```bash
# Check connection to backend
curl http://localhost:8000/healthz
# Should return {"status": "ok"}
```

**Step 5: Check File Permissions**
```bash
# Verify file is readable
ls -l /path/to/your/file.pdf
# First column should have "r" for read permission
# Example: -rw-r--r--

# Fix permissions if needed
chmod 644 /path/to/your/file.pdf
```

**Step 6: Try Different File**

Test with a small, simple file:
```bash
# Create test file
echo "This is a test document." > ~/Desktop/test.txt

# Try uploading test.txt
# If this works, original file may be corrupted
```

**Step 7: Check Backend Upload Endpoint**

For advanced users:
```bash
# Test upload API directly
curl -X POST http://localhost:8000/api/upload-source \
  -F "file=@/path/to/test.pdf" \
  -F "notebook_id=test-123"
# Should return JSON with upload success
```

**If Still Failing:**
- Check logs: `tail -f ~/Library/Application\ Support/NotebookMLX/logs/app.log`
- Restart application
- Report with error details: [SUPPORT.md](/home/user/NotebookMLX/SUPPORT.md)

---

### "Podcast generation failed"

**Symptoms:**
- Generation starts but fails partway through
- Error message: "Generation failed" or "Model error"
- Progress bar gets stuck
- Generated audio file is empty or corrupted

**Diagnostic Steps:**

**Step 1: Check Logs for Specific Error**
```bash
# View recent errors
tail -n 200 ~/Library/Application\ Support/NotebookMLX/logs/app.log | grep -A 5 "ERROR"

# Common errors:
# "Out of memory" = Need more RAM
# "Model not found" = Models didn't download
# "CUDA/MLX error" = GPU/MLX framework issue
```

**Step 2: Verify Models are Downloaded**
```bash
# Check models directory
ls -lh ~/Library/Application\ Support/NotebookMLX/models/

# Should see:
# - mlx-community/Qwen2.5-1.5B-Instruct-4bit/ (~1GB)
# - mlx-community/Qwen2.5-14B-Instruct-4bit/ (~8GB)
# - mlx-community/Qwen2.5-7B-Instruct-4bit/ (~4GB)
# - Kokoro-82M/ (~200MB)
# - lucasnewman/f5-tts-mlx/ (~500MB)
```

If models are missing:
```bash
# Force re-download by removing models
rm -rf ~/Library/Application\ Support/NotebookMLX/models/

# Restart NotebookMLX - models will download automatically
```

**Step 3: Check Available RAM**
```bash
# Monitor memory during generation
# Open Activity Monitor (Applications → Utilities → Activity Monitor)
# Watch "Memory Pressure" graph
# - Green = OK
# - Yellow = Warning
# - Red = Out of memory (will cause failures)
```

If memory pressure is high:
1. Close other applications (Chrome, Slack, etc.)
2. Restart Mac to clear memory
3. Try generation again with smaller document

**Step 4: Check Disk Space**
```bash
# Podcast generation requires temp space
df -h ~/Library/Application\ Support/NotebookMLX/
# Need at least 5GB free during generation
```

**Step 5: Test with Smaller Document**

Create minimal test document:
```bash
# Create small test PDF
echo "This is a short test document for podcast generation.
It contains just enough text to create a brief conversation.
This helps isolate whether the issue is with document size or the generation pipeline itself." > ~/Desktop/test.txt

# Upload test.txt and try generating podcast
# If this works, original document may be too large/complex
```

**Step 6: Check MLX Framework**
```bash
# Verify MLX is working
python3 -c "import mlx.core as mx; print('MLX available'); print(mx.metal.device_info())"
# Should print device info
# If error, MLX framework issue (see Installation Issues below)
```

**Step 7: Retry Procedure**

1. **Cancel stuck generation** - Click "Cancel" or close Studio panel
2. **Wait 2 minutes** - Let backend clean up resources
3. **Restart NotebookMLX** - Quit and relaunch
4. **Clear cache** (optional):
   ```bash
   rm -rf ~/Library/Application\ Support/NotebookMLX/data/processed/*
   ```
5. **Try again** - Generate podcast with same settings

**If Specific Stage Fails:**

**Transcript Generation Fails:**
- Check Qwen2.5-14B model is downloaded
- Document may be too large - try shorter excerpts
- Check logs for prompt/token errors

**Enhancement Fails:**
- Check Qwen2.5-7B model is downloaded
- Transcript may be malformed - check intermediate files
- Try disabling "Dramatic Enhancement"

**TTS (Audio Synthesis) Fails:**
- Check Kokoro or F5-TTS models downloaded
- Voice file may be corrupted
- Check available disk space (need 2GB+)
- Try different voice selection

---

### "Model download stuck"

**Symptoms:**
- Download progress bar frozen
- "Downloading models..." message persists for hours
- App seems stuck on first launch

**Step 1: Check Internet Connection**
```bash
# Test connection to Hugging Face (model source)
ping huggingface.co

# Test download speed
curl -o /dev/null https://huggingface.co/
# Should complete quickly
```

**Step 2: Check Available Disk Space**
```bash
# Models require ~14GB total
df -h ~/Library/Application\ Support/
# Need at least 20GB free to be safe
```

**Step 3: Check Download Progress**
```bash
# Monitor models directory size in real-time
watch -n 5 'du -sh ~/Library/Application\ Support/NotebookMLX/models/'
# Size should gradually increase

# If size isn't increasing after 10 minutes, download is stuck
```

**Step 4: Check Network Logs**
```bash
# Look for download errors
tail -f ~/Library/Application\ Support/NotebookMLX/logs/app.log | grep -i download

# Common issues:
# "Connection timeout" = Network issue
# "403 Forbidden" = Hugging Face access issue
# "Disk full" = Out of space
```

**Step 5: Resume Download Procedure**

1. **Quit NotebookMLX**
2. **Check what's downloaded so far:**
   ```bash
   ls -lh ~/Library/Application\ Support/NotebookMLX/models/
   ```
3. **Remove incomplete downloads:**
   ```bash
   # CAUTION: This deletes all models, will re-download from scratch
   rm -rf ~/Library/Application\ Support/NotebookMLX/models/
   ```
4. **Restart NotebookMLX** - Downloads start again
5. **Monitor progress** - Check logs and disk usage

**Step 6: Manual Model Installation**

If automatic download keeps failing, download manually:

```bash
# Install Hugging Face CLI
pip3 install huggingface-hub

# Download models manually (example for one model)
huggingface-cli download mlx-community/Qwen2.5-1.5B-Instruct-4bit \
  --local-dir ~/Library/Application\ Support/NotebookMLX/models/mlx-community/Qwen2.5-1.5B-Instruct-4bit

# Repeat for each model:
# - mlx-community/Qwen2.5-14B-Instruct-4bit
# - mlx-community/Qwen2.5-7B-Instruct-4bit
# - Kokoro-82M
# - lucasnewman/f5-tts-mlx
```

**Step 7: Use Different Network**

If corporate firewall or VPN is blocking:
1. Try different WiFi network
2. Disable VPN temporarily
3. Use mobile hotspot
4. Contact IT if on corporate network

---

### "Voice training failed"

**Symptoms:**
- Voice training starts but fails to complete
- Error: "Audio file format not supported"
- Error: "Training failed"
- Progress bar freezes during training

**Step 1: Check Audio File Requirements**

**Required Audio Format:**
- Format: WAV (preferred), MP3, FLAC
- Sample Rate: ≥16kHz (22050Hz recommended)
- Channels: Mono or Stereo
- Bit Depth: 16-bit or 24-bit
- Duration: 2-10 minutes total across all samples

**Check Your Audio Files:**
```bash
# Install ffprobe (part of ffmpeg)
brew install ffmpeg

# Check audio file properties
ffprobe /path/to/your/audio.wav

# Look for:
# - Stream: Audio
# - Sample rate: Should be 16000+ Hz
# - Channels: 1 (mono) or 2 (stereo)
```

**Step 2: Convert Audio to Correct Format**

If audio format is wrong:
```bash
# Convert any audio file to WAV (22050Hz, mono, 16-bit)
ffmpeg -i input.mp3 -ar 22050 -ac 1 -sample_fmt s16 output.wav

# Convert multiple files
for file in *.mp3; do
    ffmpeg -i "$file" -ar 22050 -ac 1 -sample_fmt s16 "${file%.mp3}.wav"
done
```

**Step 3: Check Audio Quality**

**Minimum Requirements:**
- Clear speech (no excessive background noise)
- Consistent volume level
- Natural speaking pace
- Multiple sentences/phrases (not just one word)

**Test Audio Quality:**
```bash
# Play audio file to verify quality
afplay /path/to/audio.wav
# Listen for:
# - Clear voice (not muffled)
# - Minimal background noise
# - No clipping/distortion
# - Natural speaking rhythm
```

**Improve Audio Quality:**
```bash
# Normalize volume levels
ffmpeg -i input.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" normalized.wav

# Remove silence from beginning/end
ffmpeg -i input.wav -af "silenceremove=start_periods=1:stop_periods=1" trimmed.wav
```

**Step 4: Check Sample Requirements**

**Minimum Samples:**
- At least 1 audio file
- 2-10 minutes total duration recommended
- Multiple files with varied speech patterns work best

**Check Total Duration:**
```bash
# Check duration of audio file
ffprobe -i audio.wav -show_entries format=duration -v quiet -of csv="p=0"
# Should show seconds (e.g., 180.5 for 3 minutes)
```

If too short:
- Record more audio samples
- Combine multiple files
- Aim for 5-10 minutes total for best results

**Step 5: Check Available RAM**
```bash
# Voice training requires 4-8GB free RAM
# Check memory in Activity Monitor
# Close other apps if memory is low
```

**Step 6: Reduce Training Quality**

If training fails due to resource constraints:
1. Open Voice Studio
2. Select "Fast" quality instead of "High"
3. Use fewer audio samples (2-3 instead of 10)
4. Try shorter audio clips

**Step 7: Retry Training**
1. Delete failed voice attempt (if visible in Voice Studio)
2. Clear cache:
   ```bash
   rm -rf ~/Library/Application\ Support/NotebookMLX/data/voices/temp/
   ```
3. Restart NotebookMLX
4. Try training again with verified audio files

**Common Training Errors:**

**"Audio file too short"**
- Combine multiple short clips
- Record longer audio sample

**"Audio quality too low"**
- Use higher bitrate (at least 128kbps for MP3)
- Record with better microphone
- Reduce background noise

**"Out of memory during training"**
- Close other applications
- Use "Fast" quality setting
- Use fewer/shorter audio samples
- Restart Mac to clear memory

---

## Performance Issues

### Slow Podcast Generation

**Expected Generation Times** (on Apple Silicon M1/M2):

| Document Size | Expected Time |
|---------------|---------------|
| 5-10 pages | 5-10 minutes |
| 20-30 pages | 15-25 minutes |
| 50+ pages | 30-60 minutes |

**On Intel Macs:** Multiply above times by 3-5x.

**If Slower Than Expected:**

**Step 1: Check System Activity**
```bash
# Open Activity Monitor
# Look at:
# - CPU: Should be 80-100% during generation (this is normal)
# - Memory Pressure: Should be green or yellow (not red)
# - Disk Activity: Should have periodic writes
```

**Step 2: Identify Performance Bottleneck**

**CPU Bottleneck:**
- CPU at 100% = Normal, processing is CPU-bound
- No fix needed, just wait for completion

**Memory Bottleneck:**
- Memory Pressure red = Out of RAM
- Fix: Close other apps, restart Mac

**Disk Bottleneck:**
- Constant disk activity, slow progress
- Check: `iostat -w 5` (disk should not be 100% busy)
- Fix: Free up disk space, check disk health

**Step 3: Optimize System for Performance**

```bash
# Close memory-intensive apps
# Use Activity Monitor to quit:
# - Chrome (use Safari instead during generation)
# - Slack, Discord
# - Adobe apps (Photoshop, Lightroom)
# - Video editors
# - Virtual machines

# Disable spotlight indexing temporarily (advanced)
sudo mdutil -a -i off
# Re-enable after generation: sudo mdutil -a -i on
```

**Step 4: Use Smaller Documents**

If processing very large documents:
1. Split PDF into smaller sections
2. Generate podcasts for each section separately
3. Combine audio files afterward if needed

**Step 5: Check Thermal Throttling**

Mac may slow down if overheating:
```bash
# Check temperature (requires additional tools)
# Install smcFanControl or iStat Menus

# Signs of thermal throttling:
# - Fans running at max speed constantly
# - System becomes sluggish after 20+ minutes
# - Generation speed decreases over time
```

**Prevent Thermal Throttling:**
- Use Mac on hard, flat surface (not bed/couch)
- Ensure air vents are not blocked
- Use laptop cooling pad
- Generate podcasts in cooler room
- Take breaks between generations to let Mac cool

**Step 6: Verify Models are Correct Size**

```bash
# Check model sizes
du -sh ~/Library/Application\ Support/NotebookMLX/models/*/

# Should see:
# mlx-community/Qwen2.5-1.5B-Instruct-4bit/ ~1GB
# mlx-community/Qwen2.5-14B-Instruct-4bit/ ~8GB (largest/slowest)
# mlx-community/Qwen2.5-7B-Instruct-4bit/ ~4GB
```

If larger models downloaded (non-4bit versions):
- Delete models folder
- Restart app to download correct quantized models

### High Memory Usage

**Normal Memory Usage During Generation:**
- Idle: 2-4GB
- PDF Processing: 4-6GB
- Transcript Generation: 8-12GB
- TTS: 6-10GB

**If Memory Pressure is Red:**

**Step 1: Identify Memory Hogs**
```bash
# Sort processes by memory usage
ps aux --sort=-%mem | head -n 10

# Or use Activity Monitor (GUI)
# Sort by "Memory" column
```

**Step 2: Close Unnecessary Apps**

Priority to close (highest memory usage):
1. Chrome/Firefox (especially with many tabs)
2. Adobe Creative Cloud apps
3. Slack, Discord, Teams
4. IDEs (VSCode, Xcode)
5. Docker containers
6. Virtual machines

**Step 3: Restart Mac**

If memory is fragmented:
```bash
# Restart to clear all caches and free memory
sudo reboot
```

**Step 4: Adjust Memory Settings** (Advanced)

For developers running from source:
```python
# Edit notebook-mlx-app/backend/.env
GEN_CONCURRENCY=1  # Reduce concurrent generations
# Reduce max tokens if possible
```

**Step 5: Upgrade RAM**

If consistently hitting memory limits:
- 8GB → 16GB upgrade recommended
- 16GB → 32GB for heavy users

### Disk Space Warnings

**Disk Space Usage Breakdown:**
- Models: 10-14GB (one-time)
- Each podcast: 50-500MB
- Each uploaded PDF: Original size
- Database/logs: 10-100MB

**Step 1: Check Current Usage**
```bash
# Total NotebookMLX data size
du -sh ~/Library/Application\ Support/NotebookMLX/

# Breakdown by component
du -sh ~/Library/Application\ Support/NotebookMLX/models/      # Models (~14GB)
du -sh ~/Library/Application\ Support/NotebookMLX/data/podcasts/  # Podcasts
du -sh ~/Library/Application\ Support/NotebookMLX/data/uploads/   # PDFs
```

**Step 2: Clean Up Old Files**

**Safe to Delete:**
```bash
# Delete old uploaded PDFs (if you have backups)
rm ~/Library/Application\ Support/NotebookMLX/data/uploads/*.pdf

# Delete old podcasts (CAUTION: back up first if needed)
rm ~/Library/Application\ Support/NotebookMLX/data/podcasts/*.wav

# Delete processed text (can be regenerated)
rm -rf ~/Library/Application\ Support/NotebookMLX/data/processed/

# Delete temporary files
rm -rf ~/Library/Application\ Support/NotebookMLX/data/temp/
```

**DO NOT Delete:**
- `models/` directory - You'll have to re-download 10-14GB
- `data/notebookmlx.db` - Your database (unless you want to reset)
- `data/voices/` - Your custom trained voices

**Step 3: Archive Old Podcasts**
```bash
# Move podcasts to external drive or archive
mkdir ~/Desktop/NotebookMLX-Archive
cp -r ~/Library/Application\ Support/NotebookMLX/data/podcasts/ ~/Desktop/NotebookMLX-Archive/
# After verifying files copied:
rm -rf ~/Library/Application\ Support/NotebookMLX/data/podcasts/*.wav
```

**Step 4: Free Up System Disk Space**
```bash
# Empty Trash
# Clear system caches (requires admin)
sudo rm -rf /Library/Caches/*
sudo rm -rf ~/Library/Caches/*

# Clear downloads folder
# Delete large unused apps
```

---

## Installation Issues

### Dependencies Not Found

**Symptoms:**
- "Python not found"
- "Module not found" errors
- "npm: command not found"

**Step 1: Install Homebrew** (if not installed)
```bash
# Check if Homebrew is installed
brew --version

# If not, install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Step 2: Install Python**
```bash
# Install Python 3.11
brew install python@3.11

# Verify installation
python3 --version
# Should show Python 3.11.x

# If wrong version is default
echo 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Step 3: Install Node.js**
```bash
# Install Node.js 20
brew install node@20

# Verify
node --version  # Should show v20.x
npm --version   # Should show 10.x

# Enable pnpm
corepack enable
pnpm --version  # Should show version number
```

**Step 4: Install FFmpeg**
```bash
# Required for audio processing
brew install ffmpeg

# Verify
ffmpeg -version
```

**Step 5: Install Python Dependencies**
```bash
cd notebook-mlx-app/backend
pip3 install -r requirements.txt

# If errors occur, try upgrading pip first
pip3 install --upgrade pip
pip3 install -r requirements.txt
```

**Step 6: Install Node Dependencies**
```bash
cd notebook-mlx-app
pnpm install

cd frontend
pnpm install
```

### Permission Errors

**Symptoms:**
- "Permission denied" when running scripts
- "EACCES" errors during npm install
- Cannot write to directories

**Step 1: Fix Script Permissions**
```bash
# Make scripts executable
chmod +x notebook-mlx-app/install.sh
chmod +x notebook-mlx-app/build-m1.sh
```

**Step 2: Fix npm Global Permissions**
```bash
# Fix npm permissions (recommended approach)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

**Step 3: Fix Directory Ownership**
```bash
# If NotebookMLX data directory has wrong owner
sudo chown -R $(whoami) ~/Library/Application\ Support/NotebookMLX/

# If installation directory has issues
sudo chown -R $(whoami) ~/Documents/NotebookMLX/
```

**Step 4: macOS App Permissions**

If app can't access files:
1. Open System Settings → Privacy & Security
2. Go to "Files and Folders"
3. Find NotebookMLX
4. Grant permissions for:
   - Documents folder
   - Downloads folder
   - Removable Volumes (if uploading from USB)

### Python Version Issues

**Symptoms:**
- "Python 3.11 required but Python 3.9 found"
- ImportError with new Python features

**Step 1: Check Current Python Version**
```bash
python3 --version
python --version

# Check where Python is installed
which python3
```

**Step 2: Install Correct Python Version**
```bash
# Install Python 3.11 via Homebrew
brew install python@3.11

# Create symlink (if needed)
brew link python@3.11
```

**Step 3: Use Correct Python in Virtual Environment**
```bash
cd notebook-mlx-app/backend

# Create virtual environment with specific Python
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify correct version
python --version  # Should show 3.11.x

# Install dependencies
pip install -r requirements.txt
```

**Step 4: Update Shell Profile**
```bash
# Add to ~/.zshrc (macOS default shell)
echo 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
python3 --version
```

### Node.js Version Issues

**Symptoms:**
- "Node version 20.x required"
- npm install fails with version errors

**Step 1: Check Node Version**
```bash
node --version
npm --version
```

**Step 2: Upgrade Node.js**
```bash
# Install Node 20 via Homebrew
brew install node@20

# Or upgrade existing
brew upgrade node@20

# Link to make it default
brew link --overwrite node@20
```

**Step 3: Use NVM (Alternative)** Node Version Manager

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x
```

**Step 4: Clear npm Cache**
```bash
# If install issues persist
npm cache clean --force
pnpm store prune
rm -rf node_modules package-lock.json
pnpm install
```

---

## Data Recovery

### Recovering from Corrupted Database

**Symptoms:**
- "Database error"
- App won't start due to database issues
- Sources/chat history disappeared

**Step 1: Backup Current Database**
```bash
# Always backup before attempting recovery
cp ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db \
   ~/Desktop/notebookmlx-backup-$(date +%Y%m%d).db
```

**Step 2: Check Database Integrity**
```bash
# Check if database is corrupted
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db "PRAGMA integrity_check;"
# Should output "ok"
# If errors shown, database is corrupted
```

**Step 3: Attempt Repair**
```bash
# Dump database to SQL
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db .dump > /tmp/dump.sql

# Create new database from dump
mv ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db \
   ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db.corrupt
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db < /tmp/dump.sql

# Verify repair
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db "PRAGMA integrity_check;"
```

**Step 4: Start Fresh (if repair fails)**
```bash
# CAUTION: This deletes all chat history, source metadata
# Your uploaded PDFs and podcasts are NOT deleted

# Delete corrupted database
mv ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db \
   ~/Desktop/notebookmlx-old.db

# Restart NotebookMLX - new database will be created
```

**Step 5: Re-import Sources** (if started fresh)

After creating new database:
1. Original PDFs still in `data/uploads/`
2. Use "Add Source" to re-upload them
3. They will be re-processed (may take time)

### Restoring from Backup

**Step 1: Locate Backup**

Backups should be in:
- Time Machine backups
- Manual backups you created
- Cloud storage (if you backed up manually)

**Step 2: Quit NotebookMLX**

```bash
# Ensure app is fully quit
killall NotebookMLX
```

**Step 3: Restore Data Directory**

**Full Restore:**
```bash
# Restore entire data directory
mv ~/Library/Application\ Support/NotebookMLX/data \
   ~/Library/Application\ Support/NotebookMLX/data-old

cp -R /path/to/backup/data/ ~/Library/Application\ Support/NotebookMLX/data/
```

**Selective Restore:**
```bash
# Restore just database
cp /path/to/backup/notebookmlx.db ~/Library/Application\ Support/NotebookMLX/data/

# Restore just podcasts
cp -R /path/to/backup/podcasts/ ~/Library/Application\ Support/NotebookMLX/data/podcasts/

# Restore just custom voices
cp -R /path/to/backup/voices/ ~/Library/Application\ Support/NotebookMLX/data/voices/
```

**Step 4: Fix Permissions**
```bash
# Ensure correct ownership
chown -R $(whoami) ~/Library/Application\ Support/NotebookMLX/data/
chmod -R 755 ~/Library/Application\ Support/NotebookMLX/data/
```

**Step 5: Restart NotebookMLX**

Launch app and verify:
- Sources appear in Sources panel
- Chat history restored (if database restored)
- Podcasts playable
- Custom voices available

### Exporting Data Before Reinstall

**Complete Backup Before Reinstall:**

```bash
# Create backup directory
mkdir -p ~/Desktop/NotebookMLX-Backup-$(date +%Y%m%d)

# Backup all data (except models - those will re-download)
cp -R ~/Library/Application\ Support/NotebookMLX/data/ \
   ~/Desktop/NotebookMLX-Backup-$(date +%Y%m%d)/

# Create archive (compressed)
tar -czf ~/Desktop/NotebookMLX-Backup-$(date +%Y%m%d).tar.gz \
   -C ~/Library/Application\ Support/NotebookMLX/ data/

# Verify backup size
du -sh ~/Desktop/NotebookMLX-Backup-*.tar.gz
```

**Export Individual Items:**

**Export Chat History:**
- Use in-app Export feature (PDF, HTML, Markdown, JSON)
- Or copy database: `cp data/notebookmlx.db ~/Desktop/`

**Export Podcasts:**
```bash
cp -R ~/Library/Application\ Support/NotebookMLX/data/podcasts/ ~/Desktop/Podcasts-Backup/
```

**Export Custom Voices:**
```bash
cp -R ~/Library/Application\ Support/NotebookMLX/data/voices/ ~/Desktop/Voices-Backup/
```

**Export Sources (PDFs):**
```bash
cp -R ~/Library/Application\ Support/NotebookMLX/data/uploads/ ~/Desktop/Sources-Backup/
```

**After Reinstall - Restore:**
```bash
# Copy data back
cp -R ~/Desktop/NotebookMLX-Backup-*/data/* ~/Library/Application\ Support/NotebookMLX/data/
```

---

## Advanced Troubleshooting

### Checking SQLite Database Integrity

```bash
# Open database in SQLite
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db

# Check integrity
PRAGMA integrity_check;
# Should return: ok

# View tables
.tables

# Count records in main tables
SELECT COUNT(*) FROM sources;
SELECT COUNT(*) FROM chat_messages;
SELECT COUNT(*) FROM podcasts;

# Exit SQLite
.quit
```

**Common Database Issues:**

**"Database is locked"**
```bash
# Close all instances of NotebookMLX
killall NotebookMLX

# Check for lock file
ls ~/Library/Application\ Support/NotebookMLX/data/*.db-wal
# Delete lock files if present
rm ~/Library/Application\ Support/NotebookMLX/data/*.db-wal
rm ~/Library/Application\ Support/NotebookMLX/data/*.db-shm
```

**"Database disk image is malformed"**
```bash
# Attempt recovery (see Data Recovery section above)
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db .dump > dump.sql
# Create new database from dump
```

### Clearing Temporary Files

```bash
# Safe to delete - will be regenerated as needed
rm -rf ~/Library/Application\ Support/NotebookMLX/data/temp/
rm -rf ~/Library/Application\ Support/NotebookMLX/data/processed/temp/
rm -rf ~/Library/Application\ Support/NotebookMLX/data/uploads/chunks/

# Clear system temp files (macOS)
rm -rf /tmp/notebookmlx-*
```

### Resetting Application State

**Complete Reset** (keeps models, deletes all user data):

```bash
# WARNING: This deletes all your data - backup first!

# Keep models, delete everything else
rm -rf ~/Library/Application\ Support/NotebookMLX/data/
rm -rf ~/Library/Application\ Support/NotebookMLX/logs/
rm -rf ~/Library/Preferences/com.notebookmlx.*

# Restart NotebookMLX - fresh state
```

**Partial Reset** (keep some data):

```bash
# Reset just database (keeps files)
mv ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db \
   ~/Desktop/old-database.db

# Reset just chat history
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db \
  "DELETE FROM chat_messages;"

# Reset just sources metadata (keeps files)
sqlite3 ~/Library/Application\ Support/NotebookMLX/data/notebookmlx.db \
  "DELETE FROM sources;"
```

### Complete Uninstall and Reinstall

**Step 1: Backup Important Data**
```bash
# See "Exporting Data Before Reinstall" above
tar -czf ~/Desktop/NotebookMLX-Backup.tar.gz \
  ~/Library/Application\ Support/NotebookMLX/data/
```

**Step 2: Uninstall Completely**
```bash
# Delete application
rm -rf /Applications/NotebookMLX.app

# Delete all data (including models - will re-download)
rm -rf ~/Library/Application\ Support/NotebookMLX/

# Delete preferences
rm -rf ~/Library/Preferences/com.notebookmlx.*

# Delete caches
rm -rf ~/Library/Caches/com.notebookmlx.*

# Empty Trash
```

**Step 3: Clean Dependencies** (optional - only if rebuilding from source)
```bash
cd notebook-mlx-app

# Remove node modules
rm -rf node_modules frontend/node_modules package-lock.json

# Remove Python virtual environment
rm -rf backend/venv

# Remove built files
rm -rf dist python-dist frontend/dist
```

**Step 4: Reinstall**
- Download fresh DMG from releases
- Or rebuild from source: `./install.sh`

**Step 5: Restore Data** (optional)
```bash
# Extract backup
tar -xzf ~/Desktop/NotebookMLX-Backup.tar.gz \
  -C ~/Library/Application\ Support/NotebookMLX/
```

---

## Getting Help

### How to Collect Diagnostic Information

When reporting issues, include:

**1. System Information:**
```bash
# Create diagnostic report
cat > ~/Desktop/notebookmlx-diagnostics.txt << EOF
===== SYSTEM INFO =====
macOS Version: $(sw_vers -productVersion)
Processor: $(sysctl -n machdep.cpu.brand_string)
RAM: $(sysctl hw.memsize | awk '{print $2/1024/1024/1024 " GB"}')
Disk Space: $(df -h ~ | tail -1 | awk '{print $4 " available"}')

===== SOFTWARE VERSIONS =====
Python: $(python3 --version)
Node: $(node --version)
npm: $(npm --version)
pnpm: $(pnpm --version)
FFmpeg: $(ffmpeg -version | head -1)

===== NOTEBOOKMLX INFO =====
App Version: $(grep version notebook-mlx-app/package.json | head -1)
Backend Status: $(curl -s http://localhost:8000/healthz || echo "Not running")

===== MODELS =====
$(ls -lh ~/Library/Application\ Support/NotebookMLX/models/ 2>/dev/null || echo "No models found")

===== RECENT ERRORS =====
$(tail -50 ~/Library/Application\ Support/NotebookMLX/logs/app.log 2>/dev/null | grep -i error || echo "No recent errors")
EOF

echo "Diagnostic report saved to ~/Desktop/notebookmlx-diagnostics.txt"
```

**2. Error Logs:**
```bash
# Copy recent logs
tail -100 ~/Library/Application\ Support/NotebookMLX/logs/app.log > ~/Desktop/notebookmlx-logs.txt
```

**3. Screenshots:**
- Screenshot of error message
- Screenshot of console (if applicable)
- Screenshot of activity monitor during issue

### What to Include in Bug Reports

**Required Information:**
1. **Environment**
   - macOS version
   - Mac model (M1/M2/M3 or Intel)
   - RAM amount
   - NotebookMLX version

2. **Steps to Reproduce**
   - Exact sequence of actions that caused the issue
   - Example: "1. Upload 20MB PDF, 2. Click Generate Podcast, 3. Wait 10 minutes, 4. Error appears"

3. **Expected vs Actual Behavior**
   - What you expected to happen
   - What actually happened

4. **Error Messages**
   - Exact text of error messages
   - Screenshots of errors

5. **Logs**
   - Attach `notebookmlx-diagnostics.txt`
   - Attach `notebookmlx-logs.txt`
   - If crash occurred, attach crash report from Console.app

**Use This Template:**
```markdown
### Environment
- macOS Version:
- Mac Model:
- RAM:
- NotebookMLX Version:

### Steps to Reproduce
1.
2.
3.

### Expected Behavior


### Actual Behavior


### Error Messages
```
[Paste error messages or attach screenshots]
```

### Logs
[Attach diagnostic files]
```

### Where to Report Issues

**GitHub Issues** (preferred for bugs):
https://github.com/jchacker5/NotebookMLX/issues

**Steps:**
1. Search existing issues first
2. If not found, click "New Issue"
3. Use bug report template
4. Attach diagnostic files

See [SUPPORT.md](/home/user/NotebookMLX/SUPPORT.md) for complete reporting instructions and community support options.

---

**Last Updated: 2025-11-20**

**Still stuck?** See [SUPPORT.md](/home/user/NotebookMLX/SUPPORT.md) for additional help options.
