"""
FastAPI Backend Server for NotebookMLX App
"""
import os
import uuid
import asyncio
from typing import List, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
import hashlib
import logging
from logging.handlers import RotatingFileHandler
import json
import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import base64
import io
import tempfile
import zipfile
from collections import defaultdict, deque

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

# Structured logging
logger = logging.getLogger("notebookmlx")
logger.setLevel(logging.INFO)
log_dir = Path('data')
log_dir.mkdir(parents=True, exist_ok=True)
fh = RotatingFileHandler(log_dir / 'app.log', maxBytes=2_000_000, backupCount=3)
sh = logging.StreamHandler()
for h in (fh, sh):
    h.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(h)

# Prometheus metrics
REQ_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "path", "status"])
REQ_LATENCY = Histogram("http_request_duration_seconds", "Request latency", ["method", "path"])


@app.middleware("http")
async def add_observability(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.time()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    except Exception:
        status = 500
        raise
    finally:
        duration = time.time() - start
        REQ_COUNT.labels(request.method, request.url.path, str(status)).inc()
        REQ_LATENCY.labels(request.method, request.url.path).observe(duration)
        log = {
            "ts": datetime.utcnow().isoformat() + "Z",
            "level": "info",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": status,
            "duration_ms": int(duration * 1000),
        }
        logger.info(json.dumps(log))

# Initialize lightweight components first
data_dir = os.getenv("BACKEND_DATA_DIR", "data")
Path(data_dir).mkdir(parents=True, exist_ok=True)
db = Database(db_path=str(Path(data_dir) / "notebookmlx.db"))
file_manager = FileManager(base_path=data_dir)

# Lazy initialization of ML models to improve startup time
pdf_processor = None
transcript_generator = None
rewriter = None
tts_engine = None

def get_pdf_processor():
    """Lazy load PDF processor when needed"""
    global pdf_processor
    if pdf_processor is None:
        if DISABLE_ML:
            pdf_processor = PDFProcessor()  # Stub version
        else:
            pdf_processor = PDFProcessor()
    return pdf_processor

def get_transcript_generator():
    """Lazy load transcript generator when needed"""
    global transcript_generator
    if transcript_generator is None:
        if DISABLE_ML:
            transcript_generator = TranscriptGenerator()  # Stub version
        else:
            transcript_generator = TranscriptGenerator()
    return transcript_generator

def get_rewriter():
    """Lazy load rewriter when needed"""
    global rewriter
    if rewriter is None:
        if DISABLE_ML:
            rewriter = Rewriter()  # Stub version
        else:
            rewriter = Rewriter()
    return rewriter

def get_tts_engine():
    """Lazy load TTS engine when needed"""
    global tts_engine
    if tts_engine is None and not DISABLE_ML:
        try:
            from ml.tts_engine import TTSEngine
            tts_engine = TTSEngine()
        except Exception as e:
            logger.warning(f"TTS engine initialization failed: {e}")
            tts_engine = None
    return tts_engine

# Simple in-memory rate limiter (per-IP per key)
_rate_buckets = defaultdict(lambda: deque())
def check_rate_limit(request: Request, key: str, limit_per_min: int) -> None:
    # Identify client
    ip = request.client.host if request and request.client else 'local'
    bucket_key = f"{key}:{ip}"
    q = _rate_buckets[bucket_key]
    now = time.time()
    # Remove entries older than 60s
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= limit_per_min:
        raise HTTPException(status_code=429, detail="Too many requests, slow down")
    q.append(now)

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


class ChunkInitResponse(BaseModel):
    file_id: str
    filename: str
    total_chunks: int


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatExportRequest(BaseModel):
    title: str = "Chat Export"
    messages: List[ChatMessage]
    cover_data_url: Optional[str] = None

# Routes
@app.get("/")
async def root():
    return {"message": "NotebookMLX API is running"}


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/api/export/chat-pdf")
async def export_chat_pdf(payload: ChatExportRequest, request: Request):
    """Generate a PDF from chat messages and return it"""
    try:
        check_rate_limit(request, key='export', limit_per_min=int(os.getenv('EXPORT_RATE_LIMIT_PER_MIN', '60')))
        fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        c = canvas.Canvas(tmp_path, pagesize=letter)
        width, height = letter
        margin = 50
        y = height - margin
        c.setTitle(payload.title)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, y, payload.title)
        y -= 30
        # Optional cover image below title
        if payload.cover_data_url:
            try:
                header, b64 = payload.cover_data_url.split(',', 1)
                img_bytes = base64.b64decode(b64)
                img = ImageReader(io.BytesIO(img_bytes))
                iw, ih = img.getSize()
                max_w = width - 2 * margin
                max_h = height / 3
                scale = min(max_w / iw, max_h / ih)
                draw_w, draw_h = iw * scale, ih * scale
                c.drawImage(img, margin, y - draw_h, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
                y -= (draw_h + 20)
            except Exception:
                pass
        c.setFont("Helvetica", 11)
        for m in payload.messages:
            lines = [f"{m.role.capitalize()}: {line}" for line in m.content.split("\n")]
            for line in lines:
                if y < margin + 50:
                    c.showPage()
                    y = height - margin
                    c.setFont("Helvetica", 11)
                c.drawString(margin, y, line[:110])
                y -= 16
            y -= 8
        c.save()
        filename = f"chat_export_{uuid.uuid4().hex[:8]}.pdf"
        return FileResponse(tmp_path, filename=filename, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/chat-html")
async def export_chat_html(payload: ChatExportRequest, request: Request):
    try:
        check_rate_limit(request, key='export', limit_per_min=int(os.getenv('EXPORT_RATE_LIMIT_PER_MIN', '60')))
        html = ["<html><head><meta charset='utf-8'><title>{}</title></head><body>".format(payload.title)]
        html.append(f"<h1>{payload.title}</h1>")
        for m in payload.messages:
            role = (m.role or '').capitalize()
            content = (m.content or '').replace('\n', '<br/>')
            html.append(f"<p><strong>{role}:</strong> {content}</p>")
        html.append("</body></html>")
        content = "".join(html).encode('utf-8')
        fd, tmp_path = tempfile.mkstemp(suffix=".html")
        os.close(fd)
        with open(tmp_path, 'wb') as f:
            f.write(content)
        filename = f"chat_export_{uuid.uuid4().hex[:8]}.html"
        return FileResponse(tmp_path, filename=filename, media_type="text/html; charset=utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/chat-md")
async def export_chat_md(payload: ChatExportRequest, request: Request):
    try:
        check_rate_limit(request, key='export', limit_per_min=int(os.getenv('EXPORT_RATE_LIMIT_PER_MIN', '60')))
        lines = [f"# {payload.title}", ""]
        for m in payload.messages:
            role = (m.role or '').capitalize()
            content = (m.content or '')
            lines.append(f"**{role}:** {content}")
            lines.append("")
        content = "\n".join(lines).encode('utf-8')
        fd, tmp_path = tempfile.mkstemp(suffix=".md")
        os.close(fd)
        with open(tmp_path, 'wb') as f:
            f.write(content)
        filename = f"chat_export_{uuid.uuid4().hex[:8]}.md"
        return FileResponse(tmp_path, filename=filename, media_type="text/markdown; charset=utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export/podcast/{task_id}.zip")
async def export_podcast_zip(task_id: str, request: Request):
    """Export podcast transcript, metadata, and audio (if available) as a ZIP"""
    check_rate_limit(request, key='export', limit_per_min=int(os.getenv('EXPORT_RATE_LIMIT_PER_MIN', '60')))
    task = db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    try:
        fd, tmp_zip = tempfile.mkstemp(suffix=".zip")
        os.close(fd)
        with zipfile.ZipFile(tmp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            meta = {
                "id": task_id,
                "type": task.get("type"),
                "status": task.get("status"),
                "created_at": task.get("created_at"),
                "updated_at": task.get("updated_at"),
            }
            from io import BytesIO
            zf.writestr('metadata.json', json.dumps(meta, indent=2))
            data = task.get('data') or {}
            transcript = data.get('transcript')
            if transcript:
                zf.writestr('transcript.json', json.dumps(transcript, indent=2))
            audio_path = data.get('audio_path') or task.get('audio_path')
            if audio_path and os.path.exists(audio_path):
                zf.write(audio_path, arcname=os.path.join('audio', os.path.basename(audio_path)))

            # Add segments with timestamps if available
            if transcript and isinstance(transcript, list):
                seg_times = data.get('segment_times')
                segs = []
                for idx, seg in enumerate(transcript):
                    if isinstance(seg, (list, tuple)) and len(seg) == 2:
                        speaker, text = seg
                    elif isinstance(seg, dict):
                        speaker, text = seg.get('speaker', ''), seg.get('text', '')
                    else:
                        speaker, text = '', str(seg)
                    start = end = None
                    if isinstance(seg_times, list) and idx < len(seg_times):
                        try:
                            start = float(seg_times[idx].get('start'))
                            end = float(seg_times[idx].get('end'))
                        except Exception:
                            start = end = None
                    segs.append({
                        "index": idx,
                        "speaker": speaker,
                        "text": text,
                        "start": start,
                        "end": end,
                    })
                zf.writestr('segments.json', json.dumps(segs, indent=2))

            # Add model metadata when available
            model_meta = {}
            try:
                from ml.pdf_processor import DEFAULT_MODEL as PDF_PREPROCESS_MODEL
            except Exception:
                PDF_PREPROCESS_MODEL = None
            try:
                from ml.transcript_generator import DEFAULT_MODEL as TRANSCRIPT_MODEL
            except Exception:
                TRANSCRIPT_MODEL = None
            try:
                from ml.rewriter import DEFAULT_MODEL as REWRITER_MODEL
            except Exception:
                REWRITER_MODEL = None
            model_meta["pdf_preprocess_model"] = PDF_PREPROCESS_MODEL or getattr(get_pdf_processor(), 'model_name', None)
            model_meta["transcript_model"] = TRANSCRIPT_MODEL or getattr(get_transcript_generator(), 'model_name', None)
            model_meta["rewriter_model"] = REWRITER_MODEL or getattr(get_rewriter(), 'model_name', None)
            tts = get_tts_engine()
            model_meta["tts_model"] = getattr(tts, 'model_name', None) if tts is not None else None
            zf.writestr('model_metadata.json', json.dumps(model_meta, indent=2))

            # Optional: include a cover asset if present
            try:
                # Try app assets path
                backend_dir = Path(__file__).resolve().parent
                project_root = backend_dir.parent
                cover_svg = project_root / 'assets' / 'icon.svg'
                if cover_svg.exists():
                    zf.write(str(cover_svg), arcname='cover/icon.svg')
            except Exception:
                pass
        filename = f"podcast_{task_id}.zip"
        return FileResponse(tmp_zip, filename=filename, media_type="application/zip")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/export/podcast/{task_id}/segments.json")
async def export_podcast_segments(task_id: str, request: Request):
    """Return transcript + segment timings as JSON for developer workflows"""
    check_rate_limit(request, key='export', limit_per_min=int(os.getenv('EXPORT_RATE_LIMIT_PER_MIN', '60')))
    task = db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = task.get('data') or {}
    payload = {
        'task_id': task_id,
        'transcript': data.get('transcript'),
        'segment_times': data.get('segment_times'),
        'audio_path': data.get('audio_path') or task.get('audio_path'),
    }
    return JSONResponse(content=payload)

@app.post("/api/upload-source")
async def upload_source(file: UploadFile = File(...)):
    """Upload and process a source file"""
    try:
        # Save uploaded file
        source_id = str(uuid.uuid4())
        file_path = await file_manager.save_upload(file, source_id)
        # Enforce upload size limit
        max_mb = int(os.getenv('BACKEND_MAX_UPLOAD_MB', '200'))
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > max_mb:
            try:
                os.remove(file_path)
            except Exception:
                pass
            raise HTTPException(status_code=413, detail=f"File too large. Max {max_mb}MB")

        # Compute file hash for caching from saved file
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as rf:
            while True:
                chunk = rf.read(1024 * 1024)
                if not chunk:
                    break
                hasher.update(chunk)
        file_hash = hasher.hexdigest()

        # Validate extension
        allowed_exts = {'.pdf', '.txt', '.md'}
        ext = Path(file.filename).suffix.lower()
        if ext not in allowed_exts:
            try:
                os.remove(file_path)
            except Exception:
                pass
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {ext}")

        # Save uploaded file
        if ext == '.pdf':
            # Process PDF
            # Check cache first
            cache_path = file_manager.get_file_path("processed", file_hash + ".txt")
            if os.path.exists(cache_path):
                with open(cache_path, 'r', encoding='utf-8') as cf:
                    processed_text = cf.read()
            else:
                processed_text = get_pdf_processor().process_pdf(file_path)
                with open(cache_path, 'w', encoding='utf-8') as cf:
                    cf.write(processed_text)
            
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


@app.post("/api/upload-chunk")
async def upload_chunk(
    file_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    filename: str = Form(...),
    chunk: UploadFile = File(...),
):
    try:
        path = await file_manager.save_chunk(file_id, int(chunk_index), chunk)
        # Enforce per-chunk size limit
        max_chunk_mb = int(os.getenv('BACKEND_MAX_CHUNK_MB', '16'))
        if os.path.getsize(path) > max_chunk_mb * 1024 * 1024:
            try:
                os.remove(path)
            except Exception:
                pass
            raise HTTPException(status_code=413, detail=f"Chunk too large. Max {max_chunk_mb}MB")
        # Enforce total aggregated size
        max_total_mb = int(os.getenv('BACKEND_MAX_TOTAL_MB', '400'))
        total_bytes = file_manager.chunks_total_size(file_id)
        if total_bytes > max_total_mb * 1024 * 1024:
            try:
                os.remove(path)
            except Exception:
                pass
            raise HTTPException(status_code=413, detail=f"Upload too large in total. Max {max_total_mb}MB")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/merge-chunks")
async def merge_chunks(file_id: str = Form(...), filename: str = Form(...)):
    try:
        merged_path = file_manager.merge_chunks(file_id, filename)
        # Process merged file similar to upload_source without reusing UploadFile
        source_id = str(uuid.uuid4())
        # Compute hash
        hasher = hashlib.sha256()
        with open(merged_path, 'rb') as rf:
            while True:
                chunk = rf.read(1024 * 1024)
                if not chunk:
                    break
                hasher.update(chunk)
        file_hash = hasher.hexdigest()
        ext = Path(filename).suffix.lower()
        allowed_exts = {'.pdf', '.txt', '.md'}
        if ext not in allowed_exts:
            try:
                os.remove(merged_path)
            except Exception:
                pass
            raise HTTPException(status_code=415, detail=f"Unsupported file type: {ext}")
        if ext == '.pdf':
            cache_path = file_manager.get_file_path("processed", file_hash + ".txt")
            if os.path.exists(cache_path):
                with open(cache_path, 'r', encoding='utf-8') as cf:
                    processed_text = cf.read()
            else:
                processed_text = get_pdf_processor().process_pdf(merged_path)
                with open(cache_path, 'w', encoding='utf-8') as cf:
                    cf.write(processed_text)
            db.add_source({
                "id": source_id,
                "filename": filename,
                "type": "pdf",
                "path": merged_path,
                "processed_text": processed_text,
                "created_at": datetime.now()
            })
        else:
            with open(merged_path, 'r', encoding='utf-8') as f:
                content = f.read()
            db.add_source({
                "id": source_id,
                "filename": filename,
                "type": "text",
                "path": merged_path,
                "processed_text": content,
                "created_at": datetime.now()
            })
        return {"source_id": source_id, "filename": filename, "status": "processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_sources(request: ChatRequest):
    """Chat with uploaded sources"""
    try:
        if not request.source_ids:
            raise HTTPException(status_code=400, detail="source_ids cannot be empty")
        # Get source texts
        sources = db.get_sources(request.source_ids)
        if not sources:
            raise HTTPException(status_code=404, detail="Sources not found")
        
        # Combine source texts
        context = "\n\n".join([s["processed_text"] for s in sources])
        
        # Generate response using transcript generator (reusing the model)
        # In production, you'd want a dedicated chat model
        response_text = get_transcript_generator().generate_transcript(
            f"Context: {context}\n\nQuestion: {request.message}\n\nProvide a detailed answer:",
            max_tokens=1024,
            temperature=0.7
        )
        
        # Extract citations (simplified - in production, implement proper citation extraction)
        citations = [{"sourceId": s["id"], "filename": s["filename"], "relevance": 0.8} for s in sources[:2]]
        
        return ChatResponse(response=response_text, citations=citations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-podcast")
async def generate_podcast(request: PodcastRequest, background_tasks: BackgroundTasks):
    """Generate a podcast from sources"""
    try:
        if not request.source_ids:
            raise HTTPException(status_code=400, detail="source_ids cannot be empty")
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

_GEN_SEMAPHORE = asyncio.Semaphore(int(os.getenv("GEN_CONCURRENCY", "2")))


async def generate_podcast_task(task_id: str, text: str, voice1: str, voice2: str, enhance: bool):
    """Background task for podcast generation"""
    try:
        # Add task to database first
        db.add_task({
            "id": task_id,
            "type": "podcast_generation",
            "status": "generating_transcript"
        })
        
        async with _GEN_SEMAPHORE:
            # Generate transcript
            transcript = get_transcript_generator().generate_transcript(text)
            segments = get_transcript_generator().parse_transcript(transcript)
        
        # Enhance if requested
        if enhance:
            db.update_task(task_id, {"status": "enhancing_transcript"})
            segments = get_rewriter().enhance_transcript(segments)
        
        # Generate audio (if TTS available)
        tts = get_tts_engine()
        if tts is not None:
            db.update_task(task_id, {"status": "generating_audio"})
            audio_path, segment_times = tts.generate_podcast_audio(
                segments,
                speaker1_voice=voice1,
                speaker2_voice=voice2,
                output_path=f"data/podcasts/{task_id}.wav"
            )
            db.update_task(task_id, {
                "status": "completed",
                "audio_path": audio_path,
                "transcript": segments,
                "segment_times": segment_times
            })
        else:
            db.update_task(task_id, {
                "status": "completed",
                "transcript": segments,
                "message": "TTS not available in this build"
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
        if not request.source_ids:
            raise HTTPException(status_code=400, detail="source_ids cannot be empty")
        # Get source texts
        sources = db.get_sources(request.source_ids)
        if not sources:
            raise HTTPException(status_code=404, detail="Sources not found")
        
        # Extract key concepts (simplified version)
        combined_text = "\n\n".join([s["processed_text"] for s in sources])
        
        # Use the model to extract concepts
        concepts_prompt = f"Extract the main concepts and their relationships from this text as a mind map structure:\n\n{combined_text[:2000]}"
        
        # Generate mind map data (in production, use a dedicated concept extraction model)
        mindmap_text = get_transcript_generator().generate_transcript(
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
        tts = get_tts_engine()
        if tts is None:
            raise HTTPException(status_code=503, detail="TTS engine not available")
        # Generate audio
        audio_path = f"data/tts/{uuid.uuid4()}.wav"
        audio = tts.generate_segment_audio(
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
        tts = get_tts_engine()
        if tts is None:
            return TrainVoiceResponse(status="error", voice_id=voice_name, message="TTS engine not available")
        # Save audio files
        audio_paths = []
        for audio_file in audio_files:
            path = await file_manager.save_upload(audio_file, f"voice_{voice_name}")
            audio_paths.append(path)
        
        # Train voice (simplified - just using first file as reference)
        result = tts.train_voice(audio_paths, voice_name)
        
        return TrainVoiceResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download/{file_type}/{file_id}")
async def download_file(file_type: str, file_id: str):
    """Download generated files"""
    allowed_types = {"uploads", "processed", "podcasts", "tts", "voices", "mindmaps", "videos"}
    if file_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    # prevent path traversal
    if "/" in file_id or ".." in file_id or file_id.startswith(('.', '/')):
        raise HTTPException(status_code=400, detail="Invalid file id")
    # restrict characters
    import re
    if not re.match(r"^[\w\-\.@]+$", file_id):
        raise HTTPException(status_code=400, detail="Invalid file id")
    file_path = Path(file_manager.base_path) / file_type / file_id
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

if __name__ == "__main__":
    # Create necessary directories
    os.makedirs(os.path.join(data_dir, "uploads"), exist_ok=True)
    os.makedirs(os.path.join(data_dir, "podcasts"), exist_ok=True)
    os.makedirs(os.path.join(data_dir, "tts"), exist_ok=True)
    os.makedirs(os.path.join(data_dir, "voices"), exist_ok=True)
    
    # Run the server (configurable via .env)
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
