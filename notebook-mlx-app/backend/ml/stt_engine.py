"""
STT Engine Module
Handles speech-to-text transcription using MLX Whisper
"""
import os
from typing import Optional, Dict, List, Tuple
import numpy as np
import soundfile as sf
from mlx_whisper import transcribe as whisper_transcribe
import mlx.core as mx

# Model configurations
WHISPER_MODELS = {
    "tiny": "mlx-community/whisper-tiny",
    "base": "mlx-community/whisper-base", 
    "small": "mlx-community/whisper-small",
    "medium": "mlx-community/whisper-medium",
    "large": "mlx-community/whisper-large-v3",
    "large-v3-turbo": "mlx-community/whisper-large-v3-turbo"
}

DEFAULT_MODEL = "base"

class STTEngine:
    def __init__(self, model_size: str = DEFAULT_MODEL):
        self.model_size = model_size
        self.model_path = WHISPER_MODELS.get(model_size, WHISPER_MODELS[DEFAULT_MODEL])
        
    def transcribe_audio(self, audio_path: str, 
                        language: Optional[str] = None,
                        task: str = "transcribe",
                        verbose: bool = False) -> Dict:
        """Transcribe audio file to text using MLX Whisper"""
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Transcribe using MLX Whisper
        result = whisper_transcribe(
            audio_path,
            path_or_hf_repo=self.model_path,
            language=language,
            task=task,  # "transcribe" or "translate"
            verbose=verbose,
            fp16=True  # Use half precision for faster inference
        )
        
        return result
    
    def transcribe_with_timestamps(self, audio_path: str,
                                 language: Optional[str] = None) -> List[Dict]:
        """Transcribe audio with word-level timestamps"""
        result = self.transcribe_audio(audio_path, language=language)
        
        # Extract segments with timestamps
        segments = []
        if "segments" in result:
            for segment in result["segments"]:
                segments.append({
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"],
                    "words": segment.get("words", [])
                })
        
        return segments
    
    def transcribe_for_diarization(self, audio_path: str) -> Tuple[str, List[Dict]]:
        """Transcribe audio and prepare for speaker diarization"""
        # Get transcription with timestamps
        segments = self.transcribe_with_timestamps(audio_path)
        
        # Combine all text
        full_text = " ".join([seg["text"] for seg in segments])
        
        # Prepare segments for diarization
        diarization_segments = []
        for seg in segments:
            diarization_segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"],
                "speaker": None  # To be filled by diarization
            })
        
        return full_text, diarization_segments
    
    def transcribe_streaming(self, audio_stream: np.ndarray,
                           sample_rate: int = 16000,
                           chunk_length: int = 30) -> List[str]:
        """Transcribe audio stream in chunks (for real-time processing)"""
        # This is a placeholder for streaming functionality
        # Real implementation would process audio chunks as they arrive
        transcriptions = []
        
        # Process in chunks
        chunk_samples = chunk_length * sample_rate
        for i in range(0, len(audio_stream), chunk_samples):
            chunk = audio_stream[i:i + chunk_samples]
            
            # Save chunk temporarily
            temp_path = f"/tmp/whisper_chunk_{i}.wav"
            sf.write(temp_path, chunk, sample_rate)
            
            # Transcribe chunk
            result = self.transcribe_audio(temp_path)
            transcriptions.append(result["text"])
            
            # Clean up
            os.remove(temp_path)
        
        return transcriptions
    
    def detect_language(self, audio_path: str) -> str:
        """Detect the language of the audio"""
        # Transcribe a short segment to detect language
        result = whisper_transcribe(
            audio_path,
            path_or_hf_repo=self.model_path,
            language=None,  # Auto-detect
            fp16=True
        )
        
        return result.get("language", "unknown")
    
    def benchmark_models(self, audio_path: str) -> Dict[str, Dict]:
        """Benchmark different Whisper model sizes"""
        import time
        
        results = {}
        original_model = self.model_size
        
        for model_size in ["tiny", "base", "small"]:
            self.model_size = model_size
            self.model_path = WHISPER_MODELS[model_size]
            
            start_time = time.time()
            result = self.transcribe_audio(audio_path)
            end_time = time.time()
            
            results[model_size] = {
                "transcription": result["text"],
                "time": end_time - start_time,
                "model": self.model_path
            }
        
        # Restore original model
        self.model_size = original_model
        self.model_path = WHISPER_MODELS[original_model]
        
        return results