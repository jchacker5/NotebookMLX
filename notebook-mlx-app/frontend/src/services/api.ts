import axios from 'axios'

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI
const api = axios.create({
  baseURL: isElectron && location.protocol === 'file:' ? 'http://127.0.0.1:8000/api' : '/api',
  timeout: 30000,
})

// Add request-id and friendly errors
api.interceptors.request.use((config) => {
  (config.headers as any)['X-Request-ID'] = `${Date.now()}-${Math.random()}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ERR_NETWORK') {
      err.message = 'Network error. Are you offline or is the backend down?'
    }
    return Promise.reject(err)
  },
)

// Types
export interface Source {
  source_id: string
  filename: string
  status: string
}

export interface ChatResponse {
  response: string
  citations: Array<{
    sourceId: string
    filename: string
    relevance: number
  }>
}

export interface PodcastTask {
  task_id: string
  status: string
  message?: string
  audio_path?: string
  error?: string
}

export interface VoiceTrainingResponse {
  status: string
  voice_id: string
  message: string
}

// API Functions
export async function uploadSource(file: File, signal?: AbortSignal): Promise<Source> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/upload-source', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal,
  })
  
  return response.data
}

export async function chatWithSources(
  message: string,
  sourceIds: string[],
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const response = await api.post(
    '/chat',
    { message, source_ids: sourceIds },
    { signal },
  )
  
  return response.data
}

export async function generatePodcast(
  sourceIds: string[],
  options: {
    speaker1: string
    speaker2: string
    enhanceDrama: boolean
  },
  signal?: AbortSignal,
): Promise<PodcastTask> {
  const response = await api.post(
    '/generate-podcast',
    {
      source_ids: sourceIds,
      speaker1_voice: options.speaker1,
      speaker2_voice: options.speaker2,
      enhance_drama: options.enhanceDrama,
    },
    { signal },
  )
  
  return response.data
}

export async function getTaskStatus(taskId: string, signal?: AbortSignal): Promise<PodcastTask> {
  const response = await api.get(`/task/${taskId}`, { signal })
  return response.data
}

export async function generateMindMap(sourceIds: string[], signal?: AbortSignal): Promise<any> {
  const response = await api.post('/generate-mindmap', { source_ids: sourceIds }, { signal })
  
  return response.data
}

export async function synthesizeVoice(
  text: string,
  voiceId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await api.post(
    '/synthesize-voice',
    { text, voice_id: voiceId },
    { responseType: 'blob', signal },
  )
  
  return response.data
}

export async function trainVoice(
  audioFiles: File[],
  voiceName: string,
  signal?: AbortSignal,
): Promise<VoiceTrainingResponse> {
  const formData = new FormData()
  audioFiles.forEach(file => formData.append('audio_files', file))
  formData.append('voice_name', voiceName)
  
  const response = await api.post('/train-voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    signal,
  })
  
  return response.data
}

export async function downloadFile(fileType: string, fileId: string, signal?: AbortSignal): Promise<Blob> {
  const response = await api.get(`/download/${fileType}/${fileId}`, { responseType: 'blob', signal })
  
  return response.data
}

// Optional: chunked upload for large files
export async function uploadSourceChunked(
  file: File,
  opts?: { chunkSize?: number; onProgress?: (p: number) => void; signal?: AbortSignal },
): Promise<Source> {
  const chunkSize = opts?.chunkSize ?? 5 * 1024 * 1024
  const totalChunks = Math.ceil(file.size / chunkSize)
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const blob = file.slice(start, end)
    const form = new FormData()
    form.append('file_id', fileId)
    form.append('chunk_index', String(i))
    form.append('total_chunks', String(totalChunks))
    form.append('filename', file.name)
    form.append('chunk', blob, `${file.name}.part`)
    await api.post('/upload-chunk', form, { signal: opts?.signal })
    opts?.onProgress?.(((i + 1) / totalChunks) * 100)
  }
  const mergeForm = new FormData()
  mergeForm.append('file_id', fileId)
  mergeForm.append('filename', file.name)
  const res = await api.post('/merge-chunks', mergeForm, { signal: opts?.signal })
  return res.data
}

// Export chat to PDF
export async function exportChatPdf(
  title: string,
  messages: Array<{ role: string; content: string }>,
  coverDataUrl?: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await api.post(
    '/export/chat-pdf',
    { title, messages, cover_data_url: coverDataUrl },
    { responseType: 'blob', signal },
  )
  return res.data
}

export async function exportChatHtml(
  title: string,
  messages: Array<{ role: string; content: string }>,
  signal?: AbortSignal,
): Promise<Blob> {
  const res = await api.post(
    '/export/chat-html',
    { title, messages },
    { responseType: 'blob', signal },
  )
  return res.data
}
