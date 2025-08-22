"""
FastAPI Backend Server for NotebookMLX App
"""
import os
import uuid
import asyncio
from typing import List, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

DISABLE_ML = os.getenv("DISABLE_ML_IMPORTS", "0") == "1"
if not DISABLE_ML:
    try:
        from ml.pdf_processor import PDFProcessor
        from ml.transcript_generator import TranscriptGenerator
        from ml.rewriter import Rewriter
        # from ml.tts_engine import TTSEngine  # Temporarily disabled due to import issues
    except Exception:
        # Fallback to lightweight stubs when ML deps are unavailable
        DISABLE_ML = True

if DISABLE_ML:
    class PDFProcessor:  # type: ignore
        def process_pdf(self, file_path: str) -> str:
            raise RuntimeError("PDF processing disabled in test/CI mode")

    class TranscriptGenerator:  # type: ignore
        def generate_transcript(self, input_text: str, max_tokens: int = 1024, temperature: float = 0.7) -> str:
            return "Speaker 1: Test transcript (stub)\nSpeaker 2: Acknowledged."

        def parse_transcript(self, transcript: str):
            return [("Speaker 1", "Test transcript (stub)"), ("Speaker 2", "Acknowledged.")]

    class Rewriter:  # type: ignore
        def enhance_transcript(self, segments):
            return segments

    # Stub TTS engine placeholder
from utils.database import Database
from utils.file_manager import FileManager

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="NotebookMLX API", version="1.0.0")

# CORS configuration (dev: localhost; desktop: null/app scheme)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,null,app://.")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
allow_credentials = os.getenv("ALLOW_CREDENTIALS", "true").lower() == "true"
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
db = Database()
file_manager = FileManager()
pdf_processor = PDFProcessor()
transcript_generator = TranscriptGenerator()
rewriter = Rewriter()
# tts_engine = TTSEngine()  # Temporarily disabled
tts_engine = None  # Placeholder

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    source_ids: List[str]
    
class ChatResponse(BaseModel):
    response: str
    citations: List[dict]
    
class PodcastRequest(BaseModel):
    source_ids: List[str]
    speaker1_voice: str = "speaker1_female"
    speaker2_voice: str = "speaker2_male"
    enhance_drama: bool = True
    
class MindMapRequest(BaseModel):
    source_ids: List[str]
    
class VoiceSynthRequest(BaseModel):
    text: str
    voice_id: str
    
class TrainVoiceResponse(BaseModel):
    status: str
    voice_id: str
    message: str

# Routes
@app.get("/")
async def root():
    return {"message": "NotebookMLX API is running"}

@app.post("/api/upload-source")
async def upload_source(file: UploadFile = File(...)):
    """Upload and process a source file"""
    try:
        # Save uploaded file
        source_id = str(uuid.uuid4())
        file_path = await file_manager.save_upload(file, source_id)
        
        # Process based on file type
        if file.filename.endswith('.pdf'):
            # Process PDF
            processed_text = pdf_processor.process_pdf(file_path)
            
            # Save to database
            db.add_source({
                "id": source_id,
                "filename": file.filename,
                "type": "pdf",
                "path": file_path,
                "processed_text": processed_text,
                "created_at": datetime.now()
            })
        else:
            # For text files, just read content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            db.add_source({
                "id": source_id,
                "filename": file.filename,
                "type": "text",
                "path": file_path,
                "processed_text": content,
                "created_at": datetime.now()
            })
        
        return {
            "source_id": source_id,
            "filename": file.filename,
            "status": "processed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_sources(request: ChatRequest):
    """Chat with uploaded sources"""
    try:
        # Get source texts
        sources = db.get_sources(request.source_ids)
        if not sources:
            raise HTTPException(status_code=404, detail="Sources not found")
        
        # Combine source texts
        context = "\n\n".join([s["processed_text"] for s in sources])
        
        # Generate response using transcript generator (reusing the model)
        # In production, you'd want a dedicated chat model
        response_text = transcript_generator.generate_transcript(
            f"Context: {context}\n\nQuestion: {request.message}\n\nProvide a detailed answer:",
            max_tokens=1024,
            temperature=0.7
        )
        
        # Extract citations (simplified - in production, implement proper citation extraction)
        citations = [
            {"source_id": s["id"], "filename": s["filename"], "relevance": 0.8}
            for s in sources[:2]
        ]
        
        return ChatResponse(response=response_text, citations=citations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-podcast")
async def generate_podcast(request: PodcastRequest, background_tasks: BackgroundTasks):
    """Generate a podcast from sources"""
    try:
        # Get source texts
        sources = db.get_sources(request.source_ids)
        if not sources:
            raise HTTPException(status_code=404, detail="Sources not found")
        
        # Combine source texts
        combined_text = "\n\n".join([s["processed_text"] for s in sources])
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Start generation in background
        background_tasks.add_task(
            generate_podcast_task,
            task_id,
            combined_text,
            request.speaker1_voice,
            request.speaker2_voice,
            request.enhance_drama
        )
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Podcast generation started"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_podcast_task(task_id: str, text: str, voice1: str, voice2: str, enhance: bool):
    """Background task for podcast generation"""
    try:
        # Add task to database first
        db.add_task({
            "id": task_id,
            "type": "podcast_generation",
            "status": "generating_transcript"
        })
        
        # Generate transcript
        transcript = transcript_generator.generate_transcript(text)
        segments = transcript_generator.parse_transcript(transcript)
        
        # Enhance if requested
        if enhance:
            db.update_task(task_id, {"status": "enhancing_transcript"})
            segments = rewriter.enhance_transcript(segments)
        
        # Generate audio
        db.update_task(task_id, {"status": "generating_audio"})
        audio_path = tts_engine.generate_podcast_audio(
            segments,
            speaker1_voice=voice1,
            speaker2_voice=voice2,
            output_path=f"data/podcasts/{task_id}.wav"
        )
        
        # Update task as completed
        db.update_task(task_id, {
            "status": "completed",
            "audio_path": audio_path,
            "transcript": segments
        })
        
    except Exception as e:
        db.update_task(task_id, {"status": "failed", "error": str(e)})

@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a background task"""
    task = db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/api/generate-mindmap")
async def generate_mindmap(request: MindMapRequest):
    """Generate a mind map from sources"""
    try:
        # Get source texts
        sources = db.get_sources(request.source_ids)
        if not sources:
            raise HTTPException(status_code=404, detail="Sources not found")
        
        # Extract key concepts (simplified version)
        combined_text = "\n\n".join([s["processed_text"] for s in sources])
        
        # Use the model to extract concepts
        concepts_prompt = f"Extract the main concepts and their relationships from this text as a mind map structure:\n\n{combined_text[:2000]}"
        
        # Generate mind map data (in production, use a dedicated concept extraction model)
        mindmap_text = transcript_generator.generate_transcript(
            concepts_prompt,
            max_tokens=1024,
            temperature=0.5
        )
        
        # Parse into mind map structure (simplified)
        mindmap_data = {
            "name": "Main Topic",
            "children": [
                {"name": "Concept 1", "children": []},
                {"name": "Concept 2", "children": []},
                {"name": "Concept 3", "children": []}
            ]
        }
        
        return mindmap_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/synthesize-voice")
async def synthesize_voice(request: VoiceSynthRequest):
    """Synthesize speech from text"""
    try:
        # Generate audio
        audio_path = f"data/tts/{uuid.uuid4()}.wav"
        audio = tts_engine.generate_segment_audio(
            "User",
            request.text,
            voice_profile=request.voice_id
        )
        
        # Save audio
        import soundfile as sf
        sf.write(audio_path, audio, 24000)
        
        return FileResponse(audio_path, media_type="audio/wav")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train-voice", response_model=TrainVoiceResponse)
async def train_voice(
    voice_name: str,
    audio_files: List[UploadFile] = File(...)
):
    """Train a custom voice model"""
    try:
        # Save audio files
        audio_paths = []
        for audio_file in audio_files:
            path = await file_manager.save_upload(audio_file, f"voice_{voice_name}")
            audio_paths.append(path)
        
        # Train voice (simplified - just using first file as reference)
        result = tts_engine.train_voice(audio_paths, voice_name)
        
        return TrainVoiceResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{file_type}/{file_id}")
async def download_file(file_type: str, file_id: str):
    """Download generated files"""
    file_path = f"data/{file_type}/{file_id}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

if __name__ == "__main__":
    # Create necessary directories
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/podcasts", exist_ok=True)
    os.makedirs("data/tts", exist_ok=True)
    os.makedirs("data/voices", exist_ok=True)
    
    # Run the server (configurable via .env)
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
