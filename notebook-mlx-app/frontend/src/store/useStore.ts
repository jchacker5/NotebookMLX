import { create } from 'zustand'

interface Source {
  id: string
  filename: string
  type: string
  uploadedAt: Date
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: Date
}

interface Citation {
  sourceId: string
  filename: string
  relevance: number
}

interface AppState {
  // Sources
  sources: Source[]
  selectedSources: string[]
  addSource: (source: Source) => void
  removeSource: (id: string) => void
  toggleSourceSelection: (id: string) => void
  selectAllSources: () => void
  deselectAllSources: () => void

  // Chat
  messages: Message[]
  isLoading: boolean
  addMessage: (message: Message) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void

  // Studio
  podcastTask: any
  mindmapData: any
  setPodcastTask: (task: any) => void
  setMindmapData: (data: any) => void

  // Voices
  customVoices: any[]
  addCustomVoice: (voice: any) => void
}

export const useStore = create<AppState>((set) => ({
  // Sources
  sources: [],
  selectedSources: [],
  addSource: (source) =>
    set((state) => ({ sources: [...state.sources, source] })),
  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
      selectedSources: state.selectedSources.filter((sid) => sid !== id),
    })),
  toggleSourceSelection: (id) =>
    set((state) => ({
      selectedSources: state.selectedSources.includes(id)
        ? state.selectedSources.filter((sid) => sid !== id)
        : [...state.selectedSources, id],
    })),
  selectAllSources: () =>
    set((state) => ({ selectedSources: state.sources.map((s) => s.id) })),
  deselectAllSources: () => set({ selectedSources: [] }),

  // Chat
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Studio
  podcastTask: null,
  mindmapData: null,
  setPodcastTask: (task) => set({ podcastTask: task }),
  setMindmapData: (data) => set({ mindmapData: data }),

  // Voices
  customVoices: [],
  addCustomVoice: (voice) =>
    set((state) => ({ customVoices: [...state.customVoices, voice] })),
}))