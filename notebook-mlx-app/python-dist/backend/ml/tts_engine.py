"""
TTS Engine Module
Handles text-to-speech synthesis using F5-TTS-MLX and Kokoro models
"""
import os
from typing import List, Tuple, Optional, Dict
import soundfile as sf
import mlx.core as mx
from f5_tts_mlx.generate import generate as f5_generate, SAMPLE_RATE
from mlx_audio.tts.utils import load_model
from pydub import AudioSegment
import numpy as np

# Model configurations
F5_MODEL = "lucasnewman/f5-tts-mlx"
KOKORO_MODEL = "mlx-community/Kokoro-82M-bf16"

# Voice profiles
VOICE_PROFILES = {
    "speaker1_male": {"model": "kokoro", "voice": "af_sky"},
    "speaker1_female": {"model": "kokoro", "voice": "af_heart"},
    "speaker2_male": {"model": "kokoro", "voice": "bf_emma"},
    "speaker2_female": {"model": "kokoro", "voice": "af_bella"},
    "custom": {"model": "f5", "voice": None}  # For custom voice cloning
}

class TTSEngine:
    def __init__(self):
        self.kokoro_model = None
        self.f5_model_loaded = False
        self.custom_voices = {}
        
    def load_kokoro_model(self):
        """Load Kokoro model for TTS"""
        if self.kokoro_model is None:
            self.kokoro_model = load_model(KOKORO_MODEL)
    
    def generate_kokoro_audio(self, text: str, voice: str = "af_heart", speed: float = 1.0) -> np.ndarray:
        """Generate audio using Kokoro model"""
        self.load_kokoro_model()
        
        results = self.kokoro_model.generate(
            text=text,
            voice=voice,
            speed=speed,
            lang_code='a',
            verbose=False,
        )
        
        audio = mx.concatenate([item.audio for item in results], axis=0)
        return np.array(audio)
    
    def generate_f5_audio(self, text: str, reference_audio_path: Optional[str] = None, 
                         reference_text: Optional[str] = None) -> np.ndarray:
        """Generate audio using F5-TTS model"""
        output_path = "/tmp/f5_temp_audio.wav"
        
        f5_generate(
            generation_text=text,
            model_name=F5_MODEL,
            output_path=output_path,
            ref_audio_path=reference_audio_path,
            ref_text=reference_text
        )
        
        # Read the generated audio
        audio_data, _ = sf.read(output_path)
        os.remove(output_path)  # Clean up temp file
        
        return audio_data
    
    def generate_segment_audio(self, speaker: str, text: str, 
                             voice_profile: str = "speaker1_female",
                             custom_voice_id: Optional[str] = None) -> np.ndarray:
        """Generate audio for a single segment"""
        profile = VOICE_PROFILES.get(voice_profile, VOICE_PROFILES["speaker1_female"])
        
        if profile["model"] == "kokoro":
            return self.generate_kokoro_audio(text, profile["voice"])
        elif profile["model"] == "f5" and custom_voice_id:
            # Use custom voice if available
            if custom_voice_id in self.custom_voices:
                ref_audio, ref_text = self.custom_voices[custom_voice_id]
                return self.generate_f5_audio(text, ref_audio, ref_text)
        
        # Default to Kokoro if no custom voice
        return self.generate_kokoro_audio(text, "af_heart")
    
    def generate_podcast_audio(self, segments: List[Tuple[str, str]], 
                             speaker1_voice: str = "speaker1_female",
                             speaker2_voice: str = "speaker2_female",
                             output_path: str = "podcast.wav") -> str:
        """Generate complete podcast audio from segments"""
        audio_segments = []
        
        for speaker, text in segments:
            # Skip non-speech segments
            if "[" in text and "]" in text:
                continue
                
            # Select voice profile based on speaker
            voice_profile = speaker1_voice if speaker == "Speaker 1" else speaker2_voice
            
            # Generate audio for segment
            audio = self.generate_segment_audio(speaker, text, voice_profile)
            audio_segments.append(audio)
        
        # Concatenate all audio segments
        if audio_segments:
            final_audio = np.concatenate(audio_segments)
            sf.write(output_path, final_audio, SAMPLE_RATE)
            return output_path
        
        return None
    
    def add_custom_voice(self, voice_id: str, reference_audio_path: str, 
                        reference_text: str = "This is a reference audio for voice cloning."):
        """Add a custom voice for cloning"""
        self.custom_voices[voice_id] = (reference_audio_path, reference_text)
    
    def train_voice(self, audio_files: List[str], voice_name: str) -> Dict:
        """Train a custom voice model (placeholder for future implementation)"""
        # For now, we'll use the first audio file as reference
        if audio_files:
            self.add_custom_voice(voice_name, audio_files[0])
            return {
                "status": "success",
                "voice_id": voice_name,
                "message": "Voice profile created using reference audio"
            }
        return {
            "status": "error",
            "message": "No audio files provided"
        }
    
    def export_with_effects(self, input_path: str, output_path: str, 
                           fade_in: int = 1000, fade_out: int = 2000):
        """Add audio effects like fade in/out"""
        audio = AudioSegment.from_wav(input_path)
        
        # Apply fade effects
        audio = audio.fade_in(fade_in).fade_out(fade_out)
        
        # Export
        audio.export(output_path, format="wav")
        return output_path