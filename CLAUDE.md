# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NotebookMLX is a MLX (Apple Silicon) implementation of NotebookLlama that converts PDFs into conversational podcasts using open-source models. The pipeline consists of:

1. PDF preprocessing using Qwen2.5-1.5B-Instruct
2. Transcript generation using Qwen2.5-14B-Instruct  
3. Dramatic rewriting using Qwen2.5-7B-Instruct
4. Text-to-speech synthesis using F5-TTS-MLX

## Commands

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Required for audio processing
brew install ffmpeg  # macOS
```

### Running the Pipeline
The project uses Jupyter notebooks for each step:
```bash
# Start Jupyter
jupyter notebook

# Then run notebooks in order:
# 1. Step-1-PDF-Pre-Processing-Logic.ipynb
# 2. Step-2-Transcript-Writer.ipynb  
# 3. Step-3-Re-Writer.ipynb
# 4. Step-4-TTS-Workflow.ipynb
```

## Architecture

### Key Components

**PDF Processing Pipeline (Step 1)**
- Extracts text from PDFs using PyPDF2
- Chunks text by word boundaries (1000 words default)
- Uses Qwen2.5-1.5B model to clean and preprocess text chunks
- Outputs to `resources/clean_extracted_text.txt`

**Transcript Generation (Step 2)**
- Loads cleaned text and generates podcast dialogue
- Uses Qwen2.5-14B model with creative temperature (1.0)
- Creates conversational format with Speaker 1 (teacher) and Speaker 2 (curious learner)
- Saves output as pickle file

**Dramatic Rewriting (Step 3)**
- Takes generated transcript and enhances dramatic elements
- Uses Qwen2.5-7B model to improve naturalness
- Maintains speaker personalities while adding engagement

**TTS Synthesis (Step 4)**
- Processes transcript into audio segments
- Uses F5-TTS-MLX with voice cloning from reference audio
- Supports both F5-TTS and Kokoro models
- Combines segments into final podcast audio

### File Structure
- `resources/`: Contains PDFs, extracted text, audio files, and intermediate outputs
- `zh_CN/`: Chinese language version of notebooks
- Each step outputs to `resources/` for the next step to consume

### Model Selection
Models are configurable in each notebook:
- Step 1: `DEFAULT_MODEL = "mlx-community/Qwen2.5-1.5B-Instruct-4bit"`
- Step 2: `MODEL = "mlx-community/Qwen2.5-14B-Instruct-4bit"`
- Step 3: `MODEL = "mlx-community/Qwen2.5-7B-Instruct-4bit"`
- Step 4: F5-TTS-MLX or Kokoro models

## Key Technical Details

- PDF extraction limited to 100,000 characters by default
- Text chunking uses word boundaries to preserve meaning
- System prompts are crucial for output quality - each step has carefully crafted prompts
- TTS requires reference audio files for voice cloning
- Audio processing uses pydub for segment combination