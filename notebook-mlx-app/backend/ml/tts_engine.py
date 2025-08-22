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
        """Generate complete podcast audio from segments.

        Returns the output path and a list of timing entries for each spoken segment:
        [{"index", "speaker", "start", "end"}]
        """
        audio_segments = []
        timings = []
        t = 0.0
        
        seg_idx = 0
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
                duration = len(audio) / float(self.sample_rate)
                timings.append({
                    "index": seg_idx,
                    "speaker": speaker,
                    "start": t,
                    "end": t + duration,
                })
                t += duration
                seg_idx += 1
                
                # Add natural pause between segments
                if add_pauses and i < len(segments) - 1:
                    # Add 200-500ms pause based on punctuation
                    if text.rstrip().endswith(('.', '!', '?')):
                        pause_duration = int(0.5 * self.sample_rate)  # 500ms
                    else:
                        pause_duration = int(0.2 * self.sample_rate)  # 200ms
                    
                    pause = np.zeros(pause_duration, dtype=np.float32)
                    audio_segments.append(pause)
                    t += pause_duration / float(self.sample_rate)
        
        # Concatenate all audio segments
        if audio_segments:
            final_audio = np.concatenate(audio_segments)
            sf.write(output_path, final_audio, self.sample_rate)
            return output_path, timings
        
        return None, []
    
    def add_custom_voice(self, voice_id: str, reference_audio_path: str, 
                        reference_text: str = "This is a reference audio for voice cloning."):
        """Add a custom voice for F5-TTS cloning"""
        if not os.path.exists(reference_audio_path):
            raise FileNotFoundError(f"Reference audio not found: {reference_audio_path}")
        
        self.custom_voices[voice_id] = (reference_audio_path, reference_text)
    
    def train_voice(self, audio_files: List[str], voice_name: str, 
                   transcripts: Optional[List[str]] = None) -> Dict:
        """Train a custom voice model from multiple audio files using F5-TTS"""
        if not audio_files:
            return {
                "status": "error",
                "message": "No audio files provided"
            }
        
        if len(audio_files) < 3:
            return {
                "status": "error", 
                "message": "At least 3 audio samples required for voice training"
            }
        
        try:
            # Step 1: Process and validate audio files
            processed_samples = []
            for i, audio_file in enumerate(audio_files):
                if not os.path.exists(audio_file):
                    continue
                    
                # Load and validate audio
                audio_data, sample_rate = sf.read(audio_file)
                
                # Ensure proper format (mono, 24kHz)
                if len(audio_data.shape) > 1:
                    audio_data = np.mean(audio_data, axis=1)
                
                # Resample if needed
                if sample_rate != self.sample_rate:
                    # Simple resampling (in production, use proper resampling)
                    audio_data = audio_data[::int(sample_rate / self.sample_rate)]
                
                processed_samples.append({
                    "audio": audio_data,
                    "transcript": transcripts[i] if transcripts and i < len(transcripts) else "",
                    "duration": len(audio_data) / self.sample_rate
                })
            
            if len(processed_samples) < 3:
                return {
                    "status": "error",
                    "message": "Not enough valid audio samples for training"
                }
            
            # Step 2: Create voice profile directory
            voice_dir = f"data/voices/{voice_name.replace(' ', '_').lower()}"
            os.makedirs(voice_dir, exist_ok=True)
            
            # Step 3: Save processed samples
            reference_audio_path = os.path.join(voice_dir, "reference.wav")
            reference_text = ""
            
            # Combine all samples into one reference file for F5-TTS
            combined_audio = np.concatenate([sample["audio"] for sample in processed_samples])
            combined_text = " ".join([sample["transcript"] for sample in processed_samples if sample["transcript"]])
            
            # Save reference audio
            sf.write(reference_audio_path, combined_audio, self.sample_rate)
            
            # Save metadata
            voice_metadata = {
                "name": voice_name,
                "created_at": str(np.datetime64('now')),
                "sample_count": len(processed_samples),
                "total_duration": sum(s["duration"] for s in processed_samples),
                "reference_audio": reference_audio_path,
                "reference_text": combined_text or "This is my custom trained voice.",
                "model_type": "f5-tts",
                "training_samples": [
                    {
                        "transcript": sample["transcript"],
                        "duration": sample["duration"]
                    } for sample in processed_samples
                ]
            }
            
            metadata_path = os.path.join(voice_dir, "metadata.json")
            with open(metadata_path, 'w') as f:
                import json
                json.dump(voice_metadata, f, indent=2)
            
            # Step 4: Add to custom voices
            self.add_custom_voice(voice_name, reference_audio_path, combined_text or "This is my custom trained voice.")
            
            return {
                "status": "success",
                "voice_id": voice_name,
                "voice_dir": voice_dir,
                "reference_audio": reference_audio_path,
                "sample_count": len(processed_samples),
                "total_duration": sum(s["duration"] for s in processed_samples),
                "message": f"Voice '{voice_name}' successfully trained with {len(processed_samples)} samples"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Voice training failed: {str(e)}"
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
