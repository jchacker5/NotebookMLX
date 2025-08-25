/**
 * API Type Definitions for NotebookMLX Frontend
 * 
 * This file contains all TypeScript interfaces and types used for API communication
 * between the frontend and backend services.
 */

// ===== CORE DATA TYPES =====

/**
 * Source document uploaded to the system
 */
export interface Source {
  /** Unique identifier for the source */
  source_id: string
  /** Original filename */
  filename: string
  /** Processing status */
  status: 'processing' | 'completed' | 'error'
  /** SHA256 hash of file content for caching */
  content_hash?: string
  /** Upload timestamp */
  uploaded_at: string
  /** File metadata */
  metadata?: {
    /** File size in bytes */
    size: number
    /** MIME type */
    type: string
    /** Number of pages (for PDFs) */
    page_count?: number
    /** Processing duration in seconds */
    processing_time?: number
  }
}

/**
 * Chat message in conversation
 */
export interface ChatMessage {
  /** Message ID */
  id: string
  /** Message role */
  role: 'user' | 'assistant'
  /** Message content (Markdown supported) */
  content: string
  /** Message timestamp */
  timestamp: string
  /** Source citations for assistant messages */
  citations?: Citation[]
  /** Processing metadata */
  metadata?: {
    /** Response generation time in ms */
    generation_time?: number
    /** Model used for generation */
    model?: string
    /** Token usage statistics */
    tokens?: {
      input: number
      output: number
    }
  }
}

/**
 * Citation linking response to source material
 */
export interface Citation {
  /** Source document ID */
  sourceId: string
  /** Source filename for display */
  filename: string
  /** Relevance score (0-1) */
  relevance: number
  /** Page number (for PDFs) */
  page?: number
  /** Text excerpt */
  excerpt?: string
}

/**
 * Long-running task for podcast generation
 */
export interface PodcastTask {
  /** Unique task identifier */
  task_id: string
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Progress percentage (0-100) */
  progress?: number
  /** Human-readable status message */
  message?: string
  /** Generated audio file path */
  audio_path?: string
  /** Generated transcript */
  transcript?: string
  /** Error message if failed */
  error?: string
  /** Task creation timestamp */
  created_at: string
  /** Task completion timestamp */
  completed_at?: string
  /** Processing metadata */
  metadata?: {
    /** Total segments generated */
    total_segments?: number
    /** Audio duration in seconds */
    duration?: number
    /** Voice models used */
    voices?: {
      speaker1: string
      speaker2: string
    }
  }
}

/**
 * Mind map graph data structure
 */
export interface MindMapData {
  /** Graph nodes */
  nodes: MindMapNode[]
  /** Graph edges */
  edges: MindMapEdge[]
  /** Layout metadata */
  layout?: {
    width: number
    height: number
    center?: { x: number; y: number }
  }
}

/**
 * Mind map node
 */
export interface MindMapNode {
  /** Unique node ID */
  id: string
  /** Display label */
  label: string
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
  /** Node type for styling */
  type: 'root' | 'topic' | 'subtopic' | 'detail'
  /** Node size */
  size?: number
  /** Associated source IDs */
  sources?: string[]
  /** Additional metadata */
  metadata?: {
    /** Importance score */
    importance?: number
    /** Related keywords */
    keywords?: string[]
  }
}

/**
 * Mind map edge connecting nodes
 */
export interface MindMapEdge {
  /** Source node ID */
  source: string
  /** Target node ID */
  target: string
  /** Edge label */
  label?: string
  /** Edge weight/strength */
  weight?: number
  /** Edge type */
  type?: 'hierarchy' | 'association' | 'reference'
}

/**
 * Custom voice configuration
 */
export interface Voice {
  /** Unique voice identifier */
  voice_id: string
  /** Display name */
  name: string
  /** Voice type */
  type: 'built-in' | 'custom' | 'cloned'
  /** Voice language */
  language: string
  /** Voice gender */
  gender?: 'male' | 'female' | 'neutral'
  /** Training status for custom voices */
  status?: 'training' | 'ready' | 'error'
  /** Creation timestamp */
  created_at?: string
  /** Voice sample metadata */
  metadata?: {
    /** Sample audio duration */
    sample_duration?: number
    /** Training quality score */
    quality_score?: number
    /** Compatible models */
    models?: string[]
  }
}

// ===== API REQUEST/RESPONSE TYPES =====

/**
 * Chat request payload
 */
export interface ChatRequest {
  /** User message */
  message: string
  /** Source IDs to include in context */
  source_ids: string[]
  /** Optional chat settings */
  options?: {
    /** Maximum response length */
    max_tokens?: number
    /** Response creativity (0-1) */
    temperature?: number
    /** Include citations */
    include_citations?: boolean
  }
}

/**
 * Chat response from API
 */
export interface ChatResponse {
  /** Generated response text */
  response: string
  /** Source citations */
  citations: Citation[]
  /** Response metadata */
  metadata?: {
    /** Generation time in ms */
    generation_time: number
    /** Model used */
    model: string
    /** Token usage */
    tokens: {
      input: number
      output: number
    }
  }
}

/**
 * Podcast generation request
 */
export interface PodcastRequest {
  /** Source document IDs */
  source_ids: string[]
  /** Speaker 1 voice ID */
  speaker1_voice: string
  /** Speaker 2 voice ID */
  speaker2_voice: string
  /** Enable dramatic enhancement */
  enhance_drama: boolean
  /** Optional generation settings */
  options?: {
    /** Target duration in minutes */
    target_duration?: number
    /** Conversation style */
    style?: 'educational' | 'conversational' | 'debate' | 'interview'
    /** Audio quality settings */
    audio_quality?: 'standard' | 'high' | 'ultra'
  }
}

/**
 * Voice training request
 */
export interface VoiceTrainingRequest {
  /** Voice name */
  voice_name: string
  /** Training audio files */
  audio_files: File[]
  /** Training options */
  options?: {
    /** Target quality level */
    quality: 'fast' | 'balanced' | 'high'
    /** Voice description */
    description?: string
    /** Language code */
    language?: string
  }
}

/**
 * Voice training response
 */
export interface VoiceTrainingResponse {
  /** Training status */
  status: 'success' | 'error' | 'processing'
  /** Generated voice ID */
  voice_id: string
  /** Status message */
  message: string
  /** Training duration in seconds */
  training_time?: number
  /** Quality metrics */
  quality_metrics?: {
    /** Overall quality score (0-1) */
    overall_score: number
    /** Clarity score */
    clarity: number
    /** Naturalness score */
    naturalness: number
  }
}

/**
 * Export request for chat content
 */
export interface ExportChatRequest {
  /** Document title */
  title: string
  /** Chat messages to export */
  messages: ChatMessage[]
  /** Optional cover image */
  cover_data_url?: string
  /** Export options */
  options?: {
    /** Include timestamps */
    include_timestamps?: boolean
    /** Include citations */
    include_citations?: boolean
    /** Custom filename */
    filename?: string
  }
}

/**
 * File upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * Upload options for large files
 */
export interface ChunkedUploadOptions {
  /** Chunk size in bytes */
  chunkSize?: number
  /** Progress callback */
  onProgress?: UploadProgressCallback
  /** Abort signal */
  signal?: AbortSignal
}

// ===== ERROR TYPES =====

/**
 * API error response
 */
export interface ApiError {
  /** Error code */
  error: string
  /** Error details */
  details?: string
  /** Request ID for debugging */
  request_id?: string
  /** HTTP status code */
  status_code?: number
}

/**
 * Specific error codes
 */
export type ApiErrorCode = 
  | 'SOURCE_NOT_FOUND'
  | 'TASK_NOT_FOUND'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'ML_SERVICE_UNAVAILABLE'
  | 'VOICE_NOT_FOUND'
  | 'TRAINING_FAILED'
  | 'GENERATION_FAILED'
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_SOURCES'
  | 'INVALID_PARAMETERS'

// ===== UTILITY TYPES =====

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T
  /** Success status */
  success: boolean
  /** Response metadata */
  metadata?: {
    /** Request ID */
    request_id: string
    /** Response time in ms */
    response_time: number
    /** API version */
    api_version: string
  }
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = any> {
  /** Items for current page */
  items: T[]
  /** Total item count */
  total: number
  /** Current page (0-indexed) */
  page: number
  /** Items per page */
  page_size: number
  /** Total page count */
  total_pages: number
  /** Next page URL */
  next_page?: string
  /** Previous page URL */
  prev_page?: string
}

/**
 * File metadata for uploads
 */
export interface FileMetadata {
  /** Original filename */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type */
  type: string
  /** Last modified timestamp */
  lastModified: number
  /** File hash (calculated client-side) */
  hash?: string
}

/**
 * System health status
 */
export interface HealthStatus {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unhealthy'
  /** Timestamp of check */
  timestamp: string
  /** Service statuses */
  services: {
    /** Database connectivity */
    database: 'connected' | 'disconnected'
    /** ML model availability */
    ml_models: 'available' | 'unavailable' | 'loading'
    /** Storage system */
    storage: 'available' | 'full' | 'error'
  }
  /** System metrics */
  metrics?: {
    /** Memory usage percentage */
    memory_usage: number
    /** CPU usage percentage */
    cpu_usage: number
    /** Disk usage percentage */
    disk_usage: number
    /** Active tasks count */
    active_tasks: number
  }
}

// ===== EVENT TYPES =====

/**
 * WebSocket event types (for future implementation)
 */
export type WSEventType = 
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'voice_training_progress'
  | 'voice_training_completed'
  | 'system_status'

/**
 * WebSocket event payload
 */
export interface WSEvent<T = any> {
  /** Event type */
  type: WSEventType
  /** Event payload */
  payload: T
  /** Event timestamp */
  timestamp: string
  /** Event ID */
  event_id: string
}

/**
 * Task progress event
 */
export interface TaskProgressEvent {
  /** Task ID */
  task_id: string
  /** Progress percentage */
  progress: number
  /** Status message */
  message?: string
  /** Current step */
  step?: string
  /** Estimated completion time */
  eta?: string
}