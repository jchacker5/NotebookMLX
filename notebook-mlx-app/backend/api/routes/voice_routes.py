"""
Voice training and management API routes
"""
import os
import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
import tempfile
import shutil

from ...ml.tts_engine import TTSEngine

router = APIRouter(prefix="/api/voice", tags=["voice"])

class VoiceTrainingRequest(BaseModel):
    voice_name: str
    transcripts: Optional[List[str]] = None

class VoiceListResponse(BaseModel):
    voices: List[dict]

tts_engine = TTSEngine()

@router.post("/train")
async def train_voice(
    voice_name: str = Form(...),
    transcripts: Optional[str] = Form(None),
    audio_files: List[UploadFile] = File(...)
):
    """Train a new voice model from uploaded audio samples"""
    
    if len(audio_files) < 3:
        raise HTTPException(status_code=400, detail="At least 3 audio files required for training")
    
    # Create temporary directory for uploaded files
    temp_dir = tempfile.mkdtemp()
    temp_files = []
    
    try:
        # Save uploaded files to temporary directory
        for i, audio_file in enumerate(audio_files):
            if not audio_file.content_type.startswith('audio/'):
                raise HTTPException(status_code=400, detail=f"File {audio_file.filename} is not an audio file")
            
            temp_path = os.path.join(temp_dir, f"sample_{i}.wav")
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(audio_file.file, buffer)
            temp_files.append(temp_path)
        
        # Parse transcripts if provided
        transcript_list = None
        if transcripts:
            try:
                transcript_list = json.loads(transcripts)
            except json.JSONDecodeError:
                # If not JSON, split by newlines
                transcript_list = transcripts.split('\n')
        
        # Train the voice
        result = tts_engine.train_voice(
            audio_files=temp_files,
            voice_name=voice_name,
            transcripts=transcript_list
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice training failed: {str(e)}")
    
    finally:
        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)

@router.get("/list", response_model=VoiceListResponse)
async def list_voices():
    """List all available voices (built-in and custom)"""
    
    voices = []
    
    # Add built-in voice profiles
    builtin_voices = tts_engine.list_available_voices()
    for profile_name in builtin_voices["profiles"]:
        if profile_name != "custom":
            voices.append({
                "id": profile_name,
                "name": profile_name.replace("_", " ").title(),
                "type": "builtin",
                "model": "kokoro",
                "created_at": None
            })
    
    # Add custom trained voices
    voices_dir = "data/voices"
    if os.path.exists(voices_dir):
        for voice_folder in os.listdir(voices_dir):
            voice_path = os.path.join(voices_dir, voice_folder)
            metadata_path = os.path.join(voice_path, "metadata.json")
            
            if os.path.isdir(voice_path) and os.path.exists(metadata_path):
                try:
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                    
                    voices.append({
                        "id": voice_folder,
                        "name": metadata.get("name", voice_folder),
                        "type": "custom",
                        "model": metadata.get("model_type", "f5-tts"),
                        "sample_count": metadata.get("sample_count", 0),
                        "total_duration": metadata.get("total_duration", 0),
                        "created_at": metadata.get("created_at")
                    })
                except Exception:
                    continue
    
    return VoiceListResponse(voices=voices)

@router.delete("/delete/{voice_id}")
async def delete_voice(voice_id: str):
    """Delete a custom trained voice"""
    
    voice_path = os.path.join("data/voices", voice_id)
    
    if not os.path.exists(voice_path):
        raise HTTPException(status_code=404, detail="Voice not found")
    
    try:
        shutil.rmtree(voice_path)
        
        # Remove from custom voices in memory
        if voice_id in tts_engine.custom_voices:
            del tts_engine.custom_voices[voice_id]
        
        return {"status": "success", "message": f"Voice {voice_id} deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete voice: {str(e)}")

@router.get("/download/{voice_id}")
async def download_voice(voice_id: str):
    """Download a custom voice model"""
    
    voice_path = os.path.join("data/voices", voice_id)
    metadata_path = os.path.join(voice_path, "metadata.json")
    
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Voice not found")
    
    try:
        # Create a zip file containing all voice data
        import zipfile
        import tempfile
        
        temp_zip = tempfile.mktemp(suffix='.zip')
        
        with zipfile.ZipFile(temp_zip, 'w') as zip_file:
            for root, dirs, files in os.walk(voice_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, voice_path)
                    zip_file.write(file_path, arcname)
        
        return FileResponse(
            temp_zip,
            media_type='application/zip',
            filename=f"{voice_id}_voice_model.zip"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download voice: {str(e)}")

@router.post("/generate")
async def generate_voice_sample(
    voice_id: str = Form(...),
    text: str = Form(...),
    speed: float = Form(1.0)
):
    """Generate a voice sample using a trained voice"""
    
    try:
        # Generate audio using the specified voice
        if voice_id in tts_engine.custom_voices:
            audio = tts_engine.generate_audio(
                text=text,
                voice_profile="custom",
                speed=speed,
                custom_voice_id=voice_id
            )
        else:
            # Use built-in voice
            audio = tts_engine.generate_audio(
                text=text,
                voice_profile=voice_id,
                speed=speed
            )
        
        # Save to temporary file
        import tempfile
        import soundfile as sf
        
        temp_file = tempfile.mktemp(suffix='.wav')
        sf.write(temp_file, audio, tts_engine.sample_rate)
        
        return FileResponse(
            temp_file,
            media_type='audio/wav',
            filename=f"voice_sample_{voice_id}.wav"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate voice sample: {str(e)}")

@router.get("/info/{voice_id}")
async def get_voice_info(voice_id: str):
    """Get detailed information about a specific voice"""
    
    voice_path = os.path.join("data/voices", voice_id)
    metadata_path = os.path.join(voice_path, "metadata.json")
    
    if not os.path.exists(metadata_path):
        # Check if it's a built-in voice
        builtin_voices = tts_engine.list_available_voices()
        if voice_id in builtin_voices["profiles"]:
            return {
                "id": voice_id,
                "name": voice_id.replace("_", " ").title(),
                "type": "builtin",
                "model": "kokoro",
                "description": "Built-in voice profile"
            }
        
        raise HTTPException(status_code=404, detail="Voice not found")
    
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        return metadata
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get voice info: {str(e)}")