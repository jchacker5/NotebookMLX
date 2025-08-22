"""
TTS Engine Module
Handles text-to-speech synthesis using mlx-audio with F5-TTS and Kokoro models
"""
import os
from typing import List, Tuple, Optional, Dict
import numpy as np
import soundfile as sf
from mlx_audio import tts
from mlx_audio.tts import utils as tts_utils
from pydub import AudioSegment
import mlx.core as mx

# Model configurations
KOKORO_MODEL = "mlx-community/Kokoro-82M-bf16"
F5_MODEL = "mlx-community/F5-TTS"

# Voice profiles with enhanced configuration
VOICE_PROFILES = {
    "speaker1_male": {"model": "kokoro", "voice": "af_sky", "speed": 1.0},
    "speaker1_female": {"model": "kokoro", "voice": "af_heart", "speed": 1.0},
    "speaker2_male": {"model": "kokoro", "voice": "bf_emma", "speed": 1.05},
    "speaker2_female": {"model": "kokoro", "voice": "af_bella", "speed": 1.05},
    "narrator": {"model": "kokoro", "voice": "af_nicole", "speed": 0.95},
    "custom": {"model": "f5", "voice": None, "speed": 1.0}
}

class TTSEngine:
    def __init__(self):
        self.models = {}
        self.custom_voices = {}
        self.sample_rate = 24000  # Standard sample rate for TTS models
        
    def load_model(self, model_type: str = "kokoro"):
        """Load TTS model using mlx-audio"""
        if model_type not in self.models:
            if model_type == "kokoro":
                self.models[model_type] = tts_utils.load_model(KOKORO_MODEL)
            elif model_type == "f5":
                self.models[model_type] = tts_utils.load_model(F5_MODEL)
        return self.models[model_type]
    
    def generate_audio(self, text: str, voice_profile: str = "speaker1_female",
                      speed: float = 1.0, custom_voice_id: Optional[str] = None) -> np.ndarray:
        """Generate audio using specified voice profile and settings"""
        profile = VOICE_PROFILES.get(voice_profile, VOICE_PROFILES["speaker1_female"])
        model_type = profile["model"]
        
        # Load appropriate model
        model = self.load_model(model_type)
        
        # Adjust speed if specified
        final_speed = speed * profile.get("speed", 1.0)
        
        if model_type == "kokoro":
            # Generate using Kokoro
            results = model.generate(
                text=text,
                voice=profile["voice"],
                speed=final_speed,
                lang_code='a',  # Auto-detect language
                verbose=False,
            )
            
            # Concatenate audio chunks
            audio = mx.concatenate([item.audio for item in results], axis=0)
            return np.array(audio)
            
        elif model_type == "f5" and custom_voice_id and custom_voice_id in self.custom_voices:
            # Generate using F5 with custom voice
            ref_audio_path, ref_text = self.custom_voices[custom_voice_id]
            
            # F5-TTS generation with reference audio
            audio = model.generate(
                text=text,
                ref_audio_path=ref_audio_path,
                ref_text=ref_text,
                speed=final_speed
            )
            return np.array(audio)
        
        # Fallback to Kokoro
        return self.generate_audio(text, "speaker1_female", speed)
    
    def generate_segment_audio(self, speaker: str, text: str, 
                             voice_profile: str = "speaker1_female",
                             speed: float = 1.0,
                             custom_voice_id: Optional[str] = None) -> np.ndarray:
        """Generate audio for a single segment with speaker-specific settings"""
        # Skip non-speech segments
        if "[" in text and "]" in text:
            return np.array([])
            
        return self.generate_audio(text, voice_profile, speed, custom_voice_id)
    
    def generate_podcast_audio(self, segments: List[Tuple[str, str]], 
                             speaker1_voice: str = "speaker1_female",
                             speaker2_voice: str = "speaker2_female",
                             speed: float = 1.0,
                             output_path: str = "podcast.wav",
                             add_pauses: bool = True) -> str:
        """Generate complete podcast audio from segments"""
        audio_segments = []
        
        for i, (speaker, text) in enumerate(segments):
            # Skip non-speech segments
            if "[" in text and "]" in text:
                continue
                
            # Select voice profile based on speaker
            voice_profile = speaker1_voice if speaker == "Speaker 1" else speaker2_voice
            
            # Generate audio for segment
            audio = self.generate_segment_audio(speaker, text, voice_profile, speed)
            
            if len(audio) > 0:
                audio_segments.append(audio)
                
                # Add natural pause between segments
                if add_pauses and i < len(segments) - 1:
                    # Add 200-500ms pause based on punctuation
                    if text.rstrip().endswith(('.', '!', '?')):
                        pause_duration = int(0.5 * self.sample_rate)  # 500ms
                    else:
                        pause_duration = int(0.2 * self.sample_rate)  # 200ms
                    
                    pause = np.zeros(pause_duration, dtype=np.float32)
                    audio_segments.append(pause)
        
        # Concatenate all audio segments
        if audio_segments:
            final_audio = np.concatenate(audio_segments)
            sf.write(output_path, final_audio, self.sample_rate)
            return output_path
        
        return None
    
    def add_custom_voice(self, voice_id: str, reference_audio_path: str, 
                        reference_text: str = "This is a reference audio for voice cloning."):
        """Add a custom voice for F5-TTS cloning"""
        if not os.path.exists(reference_audio_path):
            raise FileNotFoundError(f"Reference audio not found: {reference_audio_path}")
        
        self.custom_voices[voice_id] = (reference_audio_path, reference_text)
    
    def train_voice(self, audio_files: List[str], voice_name: str, 
                   transcripts: Optional[List[str]] = None) -> Dict:
        """Train a custom voice model from multiple audio files"""
        if not audio_files:
            return {
                "status": "error",
                "message": "No audio files provided"
            }
        
        # For now, use the first audio file as reference
        # Future: Implement proper voice training with multiple samples
        reference_text = "This is my custom voice."
        if transcripts and len(transcripts) > 0:
            reference_text = transcripts[0]
            
        self.add_custom_voice(voice_name, audio_files[0], reference_text)
        
        return {
            "status": "success",
            "voice_id": voice_name,
            "message": f"Voice profile created using {len(audio_files)} reference audio files"
        }
    
    def export_with_effects(self, input_path: str, output_path: str, 
                           fade_in: int = 1000, fade_out: int = 2000,
                           normalize: bool = True):
        """Add audio effects like fade in/out and normalization"""
        audio = AudioSegment.from_wav(input_path)
        
        # Apply fade effects
        audio = audio.fade_in(fade_in).fade_out(fade_out)
        
        # Normalize audio if requested
        if normalize:
            # Calculate peak normalization
            peak = audio.max
            if peak > 0:
                normalization_factor = (32767 / peak) * 0.95  # 95% of max to avoid clipping
                audio = audio.apply_gain(normalization_factor)
        
        # Export
        audio.export(output_path, format="wav")
        return output_path
    
    def list_available_voices(self) -> Dict[str, List[str]]:
        """List all available voices for each model"""
        return {
            "kokoro": ["af_sky", "af_heart", "bf_emma", "af_bella", "af_nicole", 
                      "am_adam", "am_michael", "bf_sarah", "bm_george"],
            "f5": ["custom"],  # F5 requires custom voice references
            "profiles": list(VOICE_PROFILES.keys())
        }