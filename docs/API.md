# API Documentation

## Overview

NotebookMLX provides a comprehensive REST API for PDF processing, chat interactions, podcast generation, and multimedia content creation. The API follows RESTful conventions and returns JSON responses with appropriate HTTP status codes.

## Base URL

- **Development**: `http://localhost:8000/api`
- **Production (Electron)**: `http://127.0.0.1:8000/api`

## Authentication

Currently, the API does not require authentication for local usage. All endpoints are accessible directly.

## Rate Limiting

- Export endpoints: 60 requests per minute per IP
- Other endpoints: No explicit rate limiting (subject to system resources)

## Common Headers

All requests should include:
```
Content-Type: application/json
X-Request-ID: <unique-request-id>
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error
- `503` - Service Unavailable (ML models disabled)

Error responses follow this format:
```json
{
  "error": "Error description",
  "details": "Additional error details",
  "request_id": "unique-request-id"
}
```

## Data Types

### Source
```typescript
interface Source {
  source_id: string
  filename: string
  status: 'processing' | 'completed' | 'error'
  content_hash?: string
  uploaded_at: string
  metadata?: {
    size: number
    type: string
    page_count?: number
  }
}
```

### Chat Message
```typescript
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  citations?: Citation[]
}

interface Citation {
  sourceId: string
  filename: string
  relevance: number
}
```

### Podcast Task
```typescript
interface PodcastTask {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  progress?: number
  audio_path?: string
  transcript?: string
  error?: string
  created_at: string
  completed_at?: string
}
```

### Voice Training
```typescript
interface VoiceTrainingResponse {
  status: 'success' | 'error'
  voice_id: string
  message: string
  training_time?: number
}
```

## Endpoints

### Health & Monitoring

#### GET /
Health banner endpoint.

**Response:**
```json
{
  "message": "NotebookMLX API is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

#### GET /healthz
Detailed health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "ml_models": "available"
  }
}
```

#### GET /metrics
Prometheus metrics endpoint.

**Response:** Prometheus format metrics

### Source Management

#### POST /api/upload-source
Upload and process a PDF or text file.

**Parameters:**
- `file` (form-data): PDF or text file to upload

**Response:**
```json
{
  "source_id": "uuid-string",
  "filename": "document.pdf",
  "status": "processing",
  "content_hash": "sha256-hash"
}
```

**Example:**
```bash
curl -X POST \
  -F "file=@document.pdf" \
  http://localhost:8000/api/upload-source
```

#### POST /api/upload-chunk
Upload file chunks for large files (≥8MB).

**Parameters:**
- `file_id` (form): Unique identifier for the file
- `chunk_index` (form): Zero-based chunk index
- `total_chunks` (form): Total number of chunks
- `filename` (form): Original filename
- `chunk` (form-data): File chunk data

**Response:**
```json
{
  "message": "Chunk uploaded successfully",
  "chunk_index": 0,
  "total_chunks": 5
}
```

#### POST /api/merge-chunks
Merge uploaded chunks into a complete file.

**Parameters:**
- `file_id` (form): File identifier
- `filename` (form): Original filename

**Response:**
```json
{
  "source_id": "uuid-string",
  "filename": "large-document.pdf",
  "status": "processing"
}
```

### Chat & Interaction

#### POST /api/chat
Chat with uploaded sources.

**Request Body:**
```json
{
  "message": "What are the key findings?",
  "source_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "response": "Based on the documents, the key findings are...",
  "citations": [
    {
      "sourceId": "uuid1",
      "filename": "research.pdf",
      "relevance": 0.95
    }
  ]
}
```

### Podcast Generation

#### POST /api/generate-podcast
Generate a podcast from sources.

**Request Body:**
```json
{
  "source_ids": ["uuid1", "uuid2"],
  "speaker1_voice": "default_male",
  "speaker2_voice": "default_female",
  "enhance_drama": true
}
```

**Response:**
```json
{
  "task_id": "task-uuid",
  "status": "pending",
  "message": "Podcast generation started"
}
```

#### GET /api/task/{task_id}
Get task status and results.

**Response:**
```json
{
  "task_id": "task-uuid",
  "status": "completed",
  "progress": 100,
  "audio_path": "/path/to/audio.wav",
  "transcript": "Generated transcript content..."
}
```

### Mind Map Generation

#### POST /api/generate-mindmap
Generate a mind map from sources.

**Request Body:**
```json
{
  "source_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "node1",
      "label": "Main Topic",
      "x": 0,
      "y": 0,
      "type": "root"
    }
  ],
  "edges": [
    {
      "source": "node1",
      "target": "node2",
      "label": "relationship"
    }
  ]
}
```

### Voice Synthesis & Training

#### POST /api/synthesize-voice
Convert text to speech using a trained voice.

**Request Body:**
```json
{
  "text": "Hello, this is a test of voice synthesis.",
  "voice_id": "custom_voice_1"
}
```

**Response:** Binary audio data (WAV format)

#### POST /api/train-voice
Train a custom voice from audio samples.

**Parameters:**
- `audio_files` (form-data): Multiple audio files for training
- `voice_name` (form): Name for the trained voice

**Response:**
```json
{
  "status": "success",
  "voice_id": "custom_voice_uuid",
  "message": "Voice training completed",
  "training_time": 120
}
```

### Export Functions

#### POST /api/export/chat-pdf
Export chat conversation as PDF.

**Request Body:**
```json
{
  "title": "Research Discussion",
  "messages": [
    {
      "role": "user",
      "content": "What are the main findings?"
    },
    {
      "role": "assistant", 
      "content": "The main findings include..."
    }
  ],
  "cover_data_url": "data:image/png;base64,..."
}
```

**Response:** Binary PDF data

#### POST /api/export/chat-html
Export chat conversation as HTML.

**Request Body:**
```json
{
  "title": "Research Discussion",
  "messages": [/* same as PDF */]
}
```

**Response:** HTML file data

#### POST /api/export/chat-md
Export chat conversation as Markdown.

**Request Body:**
```json
{
  "title": "Research Discussion", 
  "messages": [/* same as PDF */]
}
```

**Response:** Markdown file data

#### GET /api/export/podcast/{task_id}.zip
Export complete podcast package as ZIP.

**Response:** ZIP file containing:
- Audio files (if generated)
- Transcript JSON
- Metadata
- Timing information
- Cover image (if available)

#### GET /api/export/podcast/{task_id}/segments.json
Export podcast segments with timing data.

**Response:**
```json
{
  "segments": [
    {
      "index": 0,
      "speaker": "speaker1",
      "text": "Welcome to today's discussion...",
      "start_time": 0.0,
      "end_time": 5.2,
      "audio_path": "segment_0.wav"
    }
  ],
  "metadata": {
    "total_duration": 300.5,
    "speaker1_voice": "default_male",
    "speaker2_voice": "default_female"
  }
}
```

### File Downloads

#### GET /api/download/{file_type}/{file_id}
Download generated files.

**Parameters:**
- `file_type`: Type of file (`audio`, `video`, `transcript`, `mindmap`)
- `file_id`: Unique file identifier

**Response:** Binary file data with appropriate Content-Type

## Error Codes

| Code | Description |
|------|-------------|
| `SOURCE_NOT_FOUND` | Requested source ID does not exist |
| `TASK_NOT_FOUND` | Requested task ID does not exist |
| `INVALID_FILE_TYPE` | Unsupported file format |
| `FILE_TOO_LARGE` | File exceeds size limits |
| `ML_SERVICE_UNAVAILABLE` | ML models are disabled or unavailable |
| `VOICE_NOT_FOUND` | Requested voice ID does not exist |
| `TRAINING_FAILED` | Voice training process failed |
| `GENERATION_FAILED` | Content generation process failed |

## Rate Limits

- **Export endpoints**: 60 requests per minute per IP
- **Upload endpoints**: No explicit limit (governed by file size limits)
- **Generation endpoints**: Limited by `GEN_CONCURRENCY` setting

## File Size Limits

- **Single upload**: 200MB (configurable via `BACKEND_MAX_UPLOAD_MB`)
- **Chunk size**: 16MB (configurable via `BACKEND_MAX_CHUNK_MB`)  
- **Total chunked upload**: 400MB (configurable via `BACKEND_MAX_TOTAL_MB`)

## WebSocket Support

Currently not implemented. All interactions use HTTP requests with polling for long-running tasks.

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000
})

// Upload a file
async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/upload-source', formData)
  return response.data
}

// Chat with sources
async function chat(message: string, sourceIds: string[]) {
  const response = await api.post('/chat', {
    message,
    source_ids: sourceIds
  })
  return response.data
}

// Generate podcast
async function generatePodcast(sourceIds: string[]) {
  const response = await api.post('/generate-podcast', {
    source_ids: sourceIds,
    speaker1_voice: 'default_male',
    speaker2_voice: 'default_female',
    enhance_drama: true
  })
  return response.data
}
```

### Python

```python
import requests
import time

api_base = "http://localhost:8000/api"

def upload_file(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{api_base}/upload-source", files=files)
        return response.json()

def chat_with_sources(message, source_ids):
    data = {
        "message": message,
        "source_ids": source_ids
    }
    response = requests.post(f"{api_base}/chat", json=data)
    return response.json()

def generate_podcast_and_wait(source_ids):
    # Start generation
    data = {
        "source_ids": source_ids,
        "speaker1_voice": "default_male", 
        "speaker2_voice": "default_female",
        "enhance_drama": True
    }
    response = requests.post(f"{api_base}/generate-podcast", json=data)
    task = response.json()
    
    # Poll for completion
    while task['status'] in ['pending', 'processing']:
        time.sleep(5)
        response = requests.get(f"{api_base}/task/{task['task_id']}")
        task = response.json()
    
    return task
```

## Troubleshooting

### Common Issues

1. **503 Service Unavailable on TTS endpoints**
   - ML models are disabled (`DISABLE_ML_IMPORTS=1`)
   - MLX not available on the system

2. **File upload failures**
   - Check file size limits
   - Ensure proper Content-Type headers
   - For large files, use chunked upload

3. **Task stuck in 'processing' status**
   - Check backend logs for ML model errors
   - Verify sufficient system memory
   - Monitor CPU/GPU usage

4. **Chat responses without citations**
   - Ensure sources have completed processing
   - Check that source_ids are valid
   - Verify source content was successfully extracted

### Debugging

Enable detailed logging by setting environment variables:
```bash
BACKEND_LOG_LEVEL=DEBUG
BACKEND_DATA_DIR=/path/to/data
```

Check logs at: `${BACKEND_DATA_DIR}/app.log`