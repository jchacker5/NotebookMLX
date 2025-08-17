"""
File management utilities
"""
import os
import shutil
from pathlib import Path
from typing import Optional
import aiofiles
from fastapi import UploadFile

class FileManager:
    def __init__(self, base_path: str = "data"):
        self.base_path = Path(base_path)
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure all required directories exist"""
        directories = [
            "uploads",
            "processed",
            "podcasts",
            "tts",
            "voices",
            "mindmaps",
            "videos"
        ]
        
        for dir_name in directories:
            dir_path = self.base_path / dir_name
            dir_path.mkdir(parents=True, exist_ok=True)
    
    async def save_upload(self, file: UploadFile, file_id: str) -> str:
        """Save an uploaded file"""
        # Determine file extension
        ext = Path(file.filename).suffix
        
        # Create file path
        file_path = self.base_path / "uploads" / f"{file_id}{ext}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return str(file_path)
    
    def get_file_path(self, category: str, file_id: str, extension: str = "") -> Path:
        """Get the path for a file"""
        return self.base_path / category / f"{file_id}{extension}"
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False
    
    def move_file(self, source: str, destination: str) -> bool:
        """Move a file from source to destination"""
        try:
            shutil.move(source, destination)
            return True
        except Exception:
            return False
    
    def cleanup_old_files(self, category: str, days: int = 7):
        """Clean up files older than specified days"""
        import time
        
        dir_path = self.base_path / category
        now = time.time()
        cutoff = now - (days * 86400)  # Convert days to seconds
        
        for file_path in dir_path.iterdir():
            if file_path.is_file():
                if file_path.stat().st_mtime < cutoff:
                    file_path.unlink()
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """Get file size in bytes"""
        try:
            return os.path.getsize(file_path)
        except Exception:
            return None
    
    def list_files(self, category: str) -> list:
        """List all files in a category"""
        dir_path = self.base_path / category
        if not dir_path.exists():
            return []
        
        files = []
        for file_path in dir_path.iterdir():
            if file_path.is_file():
                files.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "size": file_path.stat().st_size,
                    "modified": file_path.stat().st_mtime
                })
        
        return sorted(files, key=lambda x: x["modified"], reverse=True)