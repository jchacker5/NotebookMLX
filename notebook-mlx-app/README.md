# NotebookMLX - Local AI Assistant

A powerful desktop application that brings NotebookLM-like features to your local machine using Apple's MLX framework. Transform PDFs into podcasts, chat with your sources, create mind maps, and generate videos - all running locally on Apple Silicon.

*Forked and enhanced by jchacker5*

![NotebookMLX Interface](docs/screenshot.png)

## Features

### 🎧 **Podcast Generation**
- Convert PDFs and documents into engaging conversational podcasts
- Multiple voice options using MLX-Audio and Kokoro models
- Dramatic enhancement for natural-sounding dialogue
- Custom voice cloning and fine-tuning

### 💬 **Chat with Sources**
- Upload PDFs, text files, and documents
- Ask questions and get answers with citations
- Context-aware responses using Qwen models
- Real-time conversation interface

### 🧠 **Mind Maps**
- Extract key concepts from your sources
- Interactive D3.js visualizations
- Export mind maps as SVG
- Visual knowledge exploration

### 🎤 **Voice Studio**
- Record your own voice samples
- Train custom voice models for personalized TTS
- Multiple built-in voice profiles
- Real-time voice synthesis testing

### 🎥 **Video Generation**
- Convert podcasts to engaging videos
- Animated waveforms and visualizations
- Automatic captions from transcripts
- Customizable themes and styles

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Electron for cross-platform compatibility
- **Backend**: Python FastAPI with MLX models
- **AI Models**: 
  - Qwen2.5 series for text processing and chat
  - F5-TTS-MLX and Kokoro for speech synthesis
  - MLX-Audio for voice processing
- **Database**: SQLite for local storage
- **Visualization**: D3.js for mind maps

## Requirements

- **macOS**: Apple Silicon (M1/M2/M3) recommended
- **Python**: 3.8 or higher
- **Node.js**: 18 or higher
- **Storage**: 10GB+ for model downloads
- **Memory**: 16GB+ RAM recommended

## Installation

### 1. Clone the Repository
```bash
cd /Users/gijoe/Documents/NotebookMLX
git clone <your-repo-url> notebook-mlx-app  # If hosting on Git
cd notebook-mlx-app
```

### 2. Install Python Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
```

### 3. Install Node Dependencies
```bash
# Install main app dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Download ML Models
The models will be automatically downloaded on first use, but you can pre-download them:

```bash
cd backend
python -c "
from ml.pdf_processor import PDFProcessor
from ml.transcript_generator import TranscriptGenerator
from ml.rewriter import Rewriter
from ml.tts_engine import TTSEngine

# This will trigger model downloads
PDFProcessor().load_model()
TranscriptGenerator().load_model()
Rewriter().load_model()
print('Models downloaded successfully!')
"
```

### 5. Run the Application
```bash
# Start all services (backend, frontend, and Electron)
npm start

# Or start components individually:
# Backend only:
npm run start:backend

# Frontend only:
npm run start:frontend

# Electron only (after frontend is running):
npm run electron
```

## Usage

### Getting Started

1. **Launch the app** - Run `npm start` and the Electron app will open
2. **Upload sources** - Drag and drop PDFs or text files into the Sources panel
3. **Select sources** - Click on sources to select them for processing
4. **Choose your workflow**:
   - **Chat**: Ask questions about your sources
   - **Studio**: Generate podcasts, mind maps, or videos

### Podcast Generation Workflow

1. Select your source documents
2. Go to Studio → Podcast tab
3. Choose voice settings for Speaker 1 and Speaker 2
4. Click "Generate Podcast"
5. Wait for processing (transcript → enhancement → audio)
6. Play and download your podcast

### Custom Voice Training

1. Go to Studio → Voice tab
2. Record 5-10 minutes of clear speech samples
3. Or upload existing audio files
4. Enter a name for your voice profile
5. Click "Train Voice Model"
6. Test your custom voice with the synthesis tool

### Mind Map Creation

1. Select source documents
2. Go to Studio → Mind Map tab
3. Click "Generate Mind Map"
4. Explore the interactive visualization
5. Download as SVG for external use

## Project Structure

```
notebook-mlx-app/
├── electron/           # Electron main process
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── store/         # State management
├── backend/           # Python FastAPI backend
│   ├── ml/               # ML model modules
│   ├── api/              # API routes
│   └── utils/            # Utilities
├── data/              # Local data storage
└── models/            # Downloaded ML models
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Model configurations
DEFAULT_PDF_MODEL=mlx-community/Qwen2.5-1.5B-Instruct-4bit
DEFAULT_TRANSCRIPT_MODEL=mlx-community/Qwen2.5-14B-Instruct-4bit
DEFAULT_REWRITE_MODEL=mlx-community/Qwen2.5-7B-Instruct-4bit

# API settings
API_HOST=localhost
API_PORT=8000

# Storage paths
DATA_PATH=./data
MODELS_PATH=./models
```

### Model Selection
You can configure different models by editing the model constants in the respective ML modules:

- `backend/ml/pdf_processor.py` - PDF processing model
- `backend/ml/transcript_generator.py` - Transcript generation model  
- `backend/ml/rewriter.py` - Text enhancement model
- `backend/ml/tts_engine.py` - TTS models

## Development

### Running in Development Mode
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Electron (after frontend starts)
npm run electron
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Package Electron app
npm run dist
```

## Performance Tips

1. **Memory Management**: Close unused models when switching tasks
2. **Model Quantization**: Use 4-bit quantized models for faster inference
3. **Batch Processing**: Process multiple sources together when possible
4. **Storage**: Regularly clean up generated files in the `data/` directory

## Troubleshooting

### Common Issues

**Models not downloading:**
- Check internet connection
- Verify sufficient disk space
- Try manually downloading models

**Audio generation fails:**
- Ensure sufficient memory (16GB+ recommended)
- Check audio output device settings
- Verify TTS model installation

**Slow performance:**
- Use quantized models (4-bit versions)
- Close other memory-intensive applications
- Ensure you're running on Apple Silicon

**Electron app won't start:**
- Verify Node.js version (18+)
- Check if ports 3000 and 8000 are available
- Try `npm run start:frontend` then `npm run electron`

### Getting Help

1. Check the [troubleshooting guide](docs/troubleshooting.md)
2. Search existing [GitHub issues](issues)
3. Create a new issue with:
   - Your system configuration
   - Error messages and logs
   - Steps to reproduce

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Original NotebookMLX**: Inspiration from the original NotebookMLX project
- **NotebookLlama**: Meta's NotebookLlama project concept
- **MLX**: Apple's excellent ML framework for Apple Silicon
- **MLX-Audio**: Prince Canuma's MLX audio processing library
- **Qwen**: Alibaba's powerful language models
- **F5-TTS**: High-quality text-to-speech synthesis

## Roadmap

- [ ] Support for more document formats (DOCX, EPUB)
- [ ] Real-time collaboration features
- [ ] Advanced video generation with avatars
- [ ] Integration with external knowledge bases
- [ ] Mobile companion app
- [ ] Cloud sync capabilities (optional)

---

**Note**: This is a local-first application. All processing happens on your device, ensuring privacy and data security.