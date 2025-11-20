"""
Simple database module using SQLite
"""
import sqlite3
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
import threading

class Database:
    def __init__(self, db_path: str = "data/notebookmlx.db"):
        self.db_path = db_path
        self.local = threading.local()
        self._init_db()
    
    def _get_conn(self):
        """Get thread-local database connection"""
        if not hasattr(self.local, 'conn'):
            self.local.conn = sqlite3.connect(self.db_path)
            self.local.conn.row_factory = sqlite3.Row
        return self.local.conn
    
    def _init_db(self):
        """Initialize database tables"""
        conn = self._get_conn()
        cursor = conn.cursor()

        # Improve durability and concurrency
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")

        # Configure WAL checkpointing
        cursor.execute("PRAGMA wal_autocheckpoint=1000;")
        cursor.execute("PRAGMA journal_size_limit=67108864;")  # 64MB limit
        
        # Sources table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sources (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                type TEXT NOT NULL,
                path TEXT NOT NULL,
                processed_text TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Voices table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                path TEXT,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add indexes for performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sources_created
            ON sources(created_at DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tasks_status
            ON tasks(status, updated_at DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tasks_type
            ON tasks(type, created_at DESC)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_voices_created
            ON voices(created_at DESC)
        """)

        conn.commit()
        logger = logging.getLogger("notebookmlx")
        logger.info("Database initialized with indexes and WAL checkpointing")
    
    def add_source(self, source: Dict) -> str:
        """Add a new source to the database"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        metadata = source.get('metadata', {})
        cursor.execute("""
            INSERT INTO sources (id, filename, type, path, processed_text, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            source['id'],
            source['filename'],
            source['type'],
            source['path'],
            source.get('processed_text', ''),
            json.dumps(metadata)
        ))
        
        conn.commit()
        return source['id']
    
    def get_sources(self, source_ids: List[str]) -> List[Dict]:
        """Get sources by IDs"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        placeholders = ','.join(['?' for _ in source_ids])
        cursor.execute(f"""
            SELECT * FROM sources WHERE id IN ({placeholders})
        """, source_ids)
        
        sources = []
        for row in cursor.fetchall():
            source = dict(row)
            source['metadata'] = json.loads(source.get('metadata', '{}'))
            sources.append(source)
        
        return sources
    
    def get_all_sources(self) -> List[Dict]:
        """Get all sources"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM sources ORDER BY created_at DESC")
        
        sources = []
        for row in cursor.fetchall():
            source = dict(row)
            source['metadata'] = json.loads(source.get('metadata', '{}'))
            sources.append(source)
        
        return sources
    
    def add_task(self, task: Dict) -> str:
        """Add a new task"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO tasks (id, type, status, data)
            VALUES (?, ?, ?, ?)
        """, (
            task['id'],
            task['type'],
            task['status'],
            json.dumps(task.get('data', {}))
        ))
        
        conn.commit()
        return task['id']
    
    def update_task(self, task_id: str, updates: Dict):
        """Update task status and data"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Get current task
        cursor.execute("SELECT status, data FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        
        if row:
            current_status = row['status']
            current_data = json.loads(row['data'] or '{}')
            # Do not duplicate top-level status inside JSON by default
            json_updates = {k: v for k, v in updates.items() if k != 'status'}
            current_data.update(json_updates)
            
            cursor.execute("""
                UPDATE tasks 
                SET status = ?, data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (
                updates.get('status', current_status),
                json.dumps(current_data),
                task_id
            ))
            
            conn.commit()
    
    def get_task(self, task_id: str) -> Optional[Dict]:
        """Get task by ID"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        
        if row:
            task = dict(row)
            task['data'] = json.loads(task.get('data', '{}'))
            return task
        
        return None
    
    def add_voice(self, voice: Dict) -> str:
        """Add a custom voice profile"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO voices (id, name, type, path, metadata)
            VALUES (?, ?, ?, ?, ?)
        """, (
            voice['id'],
            voice['name'],
            voice['type'],
            voice.get('path', ''),
            json.dumps(voice.get('metadata', {}))
        ))
        
        conn.commit()
        return voice['id']
    
    def get_voices(self) -> List[Dict]:
        """Get all voice profiles"""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM voices ORDER BY created_at DESC")
        
        voices = []
        for row in cursor.fetchall():
            voice = dict(row)
            voice['metadata'] = json.loads(voice.get('metadata', '{}'))
            voices.append(voice)
        
        return voices
