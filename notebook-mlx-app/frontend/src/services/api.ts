import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

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
export async function uploadSource(file: File): Promise<Source> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/upload-source', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

export async function chatWithSources(
  message: string,
  sourceIds: string[]
): Promise<ChatResponse> {
  const response = await api.post('/chat', {
    message,
    source_ids: sourceIds,
  })
  
  return response.data
}

export async function generatePodcast(
  sourceIds: string[],
  options: {
    speaker1: string
    speaker2: string
    enhanceDrama: boolean
  }
): Promise<PodcastTask> {
  const response = await api.post('/generate-podcast', {
    source_ids: sourceIds,
    speaker1_voice: options.speaker1,
    speaker2_voice: options.speaker2,
    enhance_drama: options.enhanceDrama,
  })
  
  return response.data
}

export async function getTaskStatus(taskId: string): Promise<PodcastTask> {
  const response = await api.get(`/task/${taskId}`)
  return response.data
}

export async function generateMindMap(sourceIds: string[]): Promise<any> {
  const response = await api.post('/generate-mindmap', {
    source_ids: sourceIds,
  })
  
  return response.data
}

export async function synthesizeVoice(
  text: string,
  voiceId: string
): Promise<Blob> {
  const response = await api.post('/synthesize-voice', {
    text,
    voice_id: voiceId,
  }, {
    responseType: 'blob',
  })
  
  return response.data
}

export async function trainVoice(
  audioFiles: File[],
  voiceName: string
): Promise<VoiceTrainingResponse> {
  const formData = new FormData()
  audioFiles.forEach(file => formData.append('audio_files', file))
  formData.append('voice_name', voiceName)
  
  const response = await api.post('/train-voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

export async function downloadFile(fileType: string, fileId: string): Promise<Blob> {
  const response = await api.get(`/download/${fileType}/${fileId}`, {
    responseType: 'blob',
  })
  
  return response.data
}