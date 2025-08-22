"""
Local MLX-based Voice Training System
Runs entirely on-device using Apple's MLX framework for M1/M2 MacBooks
"""
import os
import json
import numpy as np
import soundfile as sf
from typing import List, Dict, Optional, Tuple
import mlx.core as mx
import mlx.nn as nn
import mlx.optimizers as optim
from pathlib import Path
import tempfile
import shutil
from datetime import datetime

class MLXVoiceEncoder(nn.Module):
    """MLX-based voice encoder for feature extraction"""
    
    def __init__(self, input_dim: int = 80, hidden_dim: int = 256, output_dim: int = 128):
        super().__init__()
        self.conv1 = nn.Conv1d(input_dim, hidden_dim, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(hidden_dim, hidden_dim, kernel_size=3, padding=1)
        self.conv3 = nn.Conv1d(hidden_dim, output_dim, kernel_size=3, padding=1)
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim)
        self.norm3 = nn.LayerNorm(output_dim)
        
    def __call__(self, x):
        # x shape: (batch, time, features)
        x = mx.transpose(x, [0, 2, 1])  # (batch, features, time)
        
        x = mx.relu(self.norm1(mx.transpose(self.conv1(x), [0, 2, 1])))
        x = mx.transpose(x, [0, 2, 1])
        
        x = mx.relu(self.norm2(mx.transpose(self.conv2(x), [0, 2, 1])))
        x = mx.transpose(x, [0, 2, 1])
        
        x = self.norm3(mx.transpose(self.conv3(x), [0, 2, 1]))
        x = mx.transpose(x, [0, 2, 1])  # (batch, time, output_dim)
        
        # Global average pooling
        return mx.mean(x, axis=1)  # (batch, output_dim)

class LocalVoiceTrainer:
    """Local MLX-based voice training system"""
    
    def __init__(self, data_dir: str = "data/voices"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.sample_rate = 24000
        self.n_mels = 80
        self.hop_length = 512
        self.win_length = 2048
        
        # Initialize MLX voice encoder
        self.voice_encoder = MLXVoiceEncoder()
        self.optimizer = optim.Adam(learning_rate=0.001)
        
        # Load existing voices
        self.trained_voices = self._load_existing_voices()
        
    def _load_existing_voices(self) -> Dict:
        """Load existing trained voices from disk"""
        voices = {}
        
        for voice_dir in self.data_dir.iterdir():
            if voice_dir.is_dir():
                metadata_file = voice_dir / "metadata.json"
                if metadata_file.exists():
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                        voices[voice_dir.name] = metadata
                    except Exception as e:
                        print(f"Error loading voice {voice_dir.name}: {e}")
        
        return voices
    
    def _extract_mel_features(self, audio: np.ndarray) -> mx.array:
        """Extract mel spectrogram features using MLX"""
        # Convert to MLX array
        audio_mx = mx.array(audio, dtype=mx.float32)
        
        # Simple mel spectrogram extraction (in production, use proper STFT)
        # For now, simulate mel features
        n_frames = len(audio) // self.hop_length
        mel_features = mx.random.normal((n_frames, self.n_mels))
        
        return mel_features
    
    def _preprocess_audio(self, audio_path: str) -> Tuple[np.ndarray, mx.array]:
        """Preprocess audio file for training"""
        # Load audio
        audio, sr = sf.read(audio_path)
        
        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        
        # Resample to target sample rate if needed
        if sr != self.sample_rate:
            # Simple resampling (in production, use proper resampling)
            audio = audio[::int(sr / self.sample_rate)]
        
        # Normalize audio
        audio = audio / np.max(np.abs(audio))
        
        # Extract mel features
        mel_features = self._extract_mel_features(audio)
        
        return audio, mel_features
    
    def _train_voice_embedding(self, samples: List[mx.array], voice_name: str) -> mx.array:
        """Train a voice embedding using contrastive learning"""
        print(f"Training voice embedding for {voice_name}...")
        
        # Stack all samples
        all_features = mx.stack(samples, axis=0)
        
        # Training loop
        n_epochs = 50
        batch_size = min(8, len(samples))
        
        for epoch in range(n_epochs):
            # Random batch
            indices = mx.random.choice(len(samples), batch_size, replace=True)
            batch = all_features[indices]
            
            # Forward pass
            def loss_fn(model):
                embeddings = model(batch)
                
                # Contrastive loss - samples from same voice should be similar
                center = mx.mean(embeddings, axis=0, keepdims=True)
                distances = mx.sum((embeddings - center) ** 2, axis=1)
                return mx.mean(distances)
            
            # Backward pass
            loss, grads = mx.value_and_grad(loss_fn)(self.voice_encoder)
            self.optimizer.update(self.voice_encoder, grads)
            
            if epoch % 10 == 0:
                print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
        
        # Generate final embedding
        final_embedding = mx.mean(self.voice_encoder(all_features), axis=0)
        return final_embedding
    
    def train_voice(self, audio_files: List[str], voice_name: str, 
                   transcripts: Optional[List[str]] = None) -> Dict:
        """Train a new voice model locally using MLX"""
        
        if len(audio_files) < 3:
            return {
                "status": "error",
                "message": "At least 3 audio samples required for training"
            }
        
        voice_id = voice_name.lower().replace(" ", "_")
        voice_dir = self.data_dir / voice_id
        voice_dir.mkdir(exist_ok=True)
        
        try:
            print(f"Processing {len(audio_files)} audio samples...")
            
            # Process all audio samples
            processed_samples = []
            mel_features = []
            
            for i, audio_file in enumerate(audio_files):
                if not os.path.exists(audio_file):
                    continue
                
                print(f"Processing sample {i+1}/{len(audio_files)}")
                audio, mel_feat = self._preprocess_audio(audio_file)
                
                # Save processed audio
                sample_path = voice_dir / f"sample_{i}.wav"
                sf.write(sample_path, audio, self.sample_rate)
                
                processed_samples.append({
                    "path": str(sample_path),
                    "duration": len(audio) / self.sample_rate,
                    "transcript": transcripts[i] if transcripts and i < len(transcripts) else ""
                })
                
                mel_features.append(mel_feat)
            
            if len(mel_features) < 3:
                return {
                    "status": "error",
                    "message": "Not enough valid audio samples"
                }
            
            # Train voice embedding
            voice_embedding = self._train_voice_embedding(mel_features, voice_name)
            
            # Save voice embedding
            embedding_path = voice_dir / "embedding.npy"
            np.save(embedding_path, np.array(voice_embedding))
            
            # Create reference audio (concatenate all samples)
            reference_audio = []
            reference_text = []
            
            for sample in processed_samples:
                audio, _ = sf.read(sample["path"])
                reference_audio.append(audio)
                if sample["transcript"]:
                    reference_text.append(sample["transcript"])
            
            # Save reference audio
            combined_audio = np.concatenate(reference_audio)
            reference_path = voice_dir / "reference.wav"
            sf.write(reference_path, combined_audio, self.sample_rate)
            
            # Save metadata
            metadata = {
                "id": voice_id,
                "name": voice_name,
                "created_at": datetime.now().isoformat(),
                "sample_count": len(processed_samples),
                "total_duration": sum(s["duration"] for s in processed_samples),
                "reference_audio": str(reference_path),
                "reference_text": " ".join(reference_text) or "This is my custom voice.",
                "embedding_path": str(embedding_path),
                "model_type": "mlx-local",
                "training_samples": processed_samples,
                "embedding_dim": int(voice_embedding.shape[0])
            }
            
            metadata_path = voice_dir / "metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Update internal registry
            self.trained_voices[voice_id] = metadata
            
            print(f"Voice '{voice_name}' trained successfully!")
            
            return {
                "status": "success",
                "voice_id": voice_id,
                "voice_name": voice_name,
                "voice_dir": str(voice_dir),
                "sample_count": len(processed_samples),
                "total_duration": sum(s["duration"] for s in processed_samples),
                "embedding_dim": int(voice_embedding.shape[0]),
                "message": f"Voice '{voice_name}' successfully trained with {len(processed_samples)} samples"
            }
            
        except Exception as e:
            print(f"Training failed: {e}")
            # Clean up on failure
            if voice_dir.exists():
                shutil.rmtree(voice_dir)
            
            return {
                "status": "error",
                "message": f"Voice training failed: {str(e)}"
            }
    
    def get_voice_embedding(self, voice_id: str) -> Optional[mx.array]:
        """Get voice embedding for a trained voice"""
        if voice_id not in self.trained_voices:
            return None
        
        embedding_path = Path(self.trained_voices[voice_id]["embedding_path"])
        if not embedding_path.exists():
            return None
        
        embedding = np.load(embedding_path)
        return mx.array(embedding)
    
    def list_voices(self) -> List[Dict]:
        """List all locally trained voices"""
        voices = []
        
        for voice_id, metadata in self.trained_voices.items():
            voices.append({
                "id": voice_id,
                "name": metadata["name"],
                "type": "local_mlx",
                "sample_count": metadata["sample_count"],
                "total_duration": metadata["total_duration"],
                "created_at": metadata["created_at"],
                "embedding_dim": metadata.get("embedding_dim", 128)
            })
        
        return voices
    
    def delete_voice(self, voice_id: str) -> bool:
        """Delete a trained voice"""
        if voice_id not in self.trained_voices:
            return False
        
        voice_dir = self.data_dir / voice_id
        if voice_dir.exists():
            shutil.rmtree(voice_dir)
        
        del self.trained_voices[voice_id]
        return True
    
    def export_voice(self, voice_id: str, export_path: str) -> bool:
        """Export a trained voice to a file"""
        if voice_id not in self.trained_voices:
            return False
        
        voice_dir = self.data_dir / voice_id
        if not voice_dir.exists():
            return False
        
        try:
            shutil.make_archive(export_path.replace('.zip', ''), 'zip', voice_dir)
            return True
        except Exception:
            return False
    
    def generate_voice_sample(self, voice_id: str, text: str, output_path: str) -> bool:
        """Generate a voice sample using trained voice (placeholder for F5-TTS integration)"""
        if voice_id not in self.trained_voices:
            return False
        
        try:
            # Get voice embedding
            embedding = self.get_voice_embedding(voice_id)
            if embedding is None:
                return False
            
            # Get reference audio
            metadata = self.trained_voices[voice_id]
            reference_path = metadata["reference_audio"]
            reference_text = metadata["reference_text"]
            
            # In a real implementation, this would use F5-TTS with the voice embedding
            # For now, we'll copy the reference audio as a placeholder
            print(f"Generating voice sample for '{voice_id}' with text: '{text}'")
            print(f"Using embedding dimension: {embedding.shape[0]}")
            print(f"Reference: {reference_path}")
            
            # Placeholder: copy reference audio
            shutil.copy(reference_path, output_path)
            
            return True
            
        except Exception as e:
            print(f"Voice generation failed: {e}")
            return False

# Global instance for local voice training
local_voice_trainer = LocalVoiceTrainer()