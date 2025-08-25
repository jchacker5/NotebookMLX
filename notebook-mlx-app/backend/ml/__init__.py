"""
MLX Machine Learning Module with Enhanced Platform Detection and Memory Management
"""
import os
import platform
import logging
import psutil
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class MLXPlatformManager:
    """Manages MLX platform compatibility and resource allocation"""
    
    def __init__(self):
        self.is_apple_silicon = self._detect_apple_silicon()
        self.mlx_available = self._check_mlx_availability()
        self.memory_limit = self._calculate_memory_limit()
        self.recommended_models = self._get_recommended_models()
    
    def _detect_apple_silicon(self) -> bool:
        """Detect if running on Apple Silicon"""
        try:
            if platform.system() != 'Darwin':
                return False
            
            # Check for Apple Silicon
            import subprocess
            result = subprocess.run(['uname', '-m'], capture_output=True, text=True)
            arch = result.stdout.strip()
            
            # arm64 indicates Apple Silicon
            if arch == 'arm64':
                return True
            
            # Check for Rosetta (x86_64 on Apple Silicon)
            if arch == 'x86_64':
                result = subprocess.run(['sysctl', '-n', 'sysctl.proc_translated'], 
                                      capture_output=True, text=True)
                if result.returncode == 0 and result.stdout.strip() == '1':
                    logger.warning("Running under Rosetta - MLX performance may be degraded")
                    return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Could not detect Apple Silicon: {e}")
            return False
    
    def _check_mlx_availability(self) -> bool:
        """Check if MLX is available and functional"""
        if not self.is_apple_silicon:
            logger.warning("MLX requires Apple Silicon - running in compatibility mode")
            return False
        
        try:
            import mlx.core as mx
            # Test basic MLX functionality
            test_array = mx.array([1, 2, 3])
            _ = mx.sum(test_array)
            return True
        except ImportError:
            logger.error("MLX not installed - install with: pip install mlx")
            return False
        except Exception as e:
            logger.error(f"MLX not functional: {e}")
            return False
    
    def _calculate_memory_limit(self) -> int:
        """Calculate safe memory limit for models"""
        try:
            total_memory = psutil.virtual_memory().total
            # Reserve 20% for system, use 60% for ML models
            safe_limit = int(total_memory * 0.6)
            logger.info(f"Setting model memory limit to {safe_limit / (1024**3):.1f}GB")
            return safe_limit
        except Exception:
            # Default to 8GB limit
            return 8 * 1024**3
    
    def _get_recommended_models(self) -> Dict[str, str]:
        """Get recommended models based on available memory"""
        memory_gb = self.memory_limit / (1024**3)
        
        if memory_gb >= 32:
            return {
                "pdf_processor": "mlx-community/Qwen3-32B-4bit",
                "transcript_generator": "mlx-community/Qwen3-72B-4bit",
                "rewriter": "mlx-community/Qwen3-32B-4bit"
            }
        elif memory_gb >= 16:
            return {
                "pdf_processor": "mlx-community/Qwen3-8B-4bit",
                "transcript_generator": "mlx-community/Qwen3-32B-4bit",
                "rewriter": "mlx-community/Qwen3-8B-4bit"
            }
        else:
            return {
                "pdf_processor": "mlx-community/Qwen3-8B-4bit",
                "transcript_generator": "mlx-community/Qwen3-8B-4bit",
                "rewriter": "mlx-community/Qwen3-8B-4bit"
            }
    
    def get_model_config(self, model_type: str) -> Dict[str, Any]:
        """Get optimized model configuration"""
        base_config = {
            "quantization": "4bit" if self.memory_limit < 16 * 1024**3 else "8bit",
            "max_tokens": 4096 if self.memory_limit < 8 * 1024**3 else 8192,
            "batch_size": 1,  # Conservative for stability
        }
        
        if model_type in self.recommended_models:
            base_config["model_name"] = self.recommended_models[model_type]
        
        return base_config
    
    def monitor_memory_usage(self) -> Dict[str, float]:
        """Monitor current memory usage"""
        try:
            memory = psutil.virtual_memory()
            return {
                "total_gb": memory.total / (1024**3),
                "available_gb": memory.available / (1024**3),
                "used_gb": memory.used / (1024**3),
                "percent_used": memory.percent,
                "within_limit": memory.used < self.memory_limit
            }
        except Exception as e:
            logger.error(f"Memory monitoring failed: {e}")
            return {}

# Global instance
mlx_platform = MLXPlatformManager()

def get_platform_manager() -> MLXPlatformManager:
    """Get the global platform manager instance"""
    return mlx_platform

def is_mlx_compatible() -> bool:
    """Check if current platform supports MLX"""
    return mlx_platform.mlx_available

def get_recommended_model(model_type: str) -> str:
    """Get recommended model for current platform"""
    return mlx_platform.recommended_models.get(model_type, "mlx-community/Qwen3-8B-4bit")