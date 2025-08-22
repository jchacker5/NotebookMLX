import { useState, lazy, Suspense } from 'react'
import { Settings, Play, Sparkles, Cpu, MessageSquare, FileVideo, BrainCircuit, Loader2, Download } from 'lucide-react'
import { ModelSelector } from './ModelSelector'

// Lazy load heavy studio components to reduce initial bundle size
const PodcastStudio = lazy(() => import('./studio/PodcastStudio').then(module => ({ default: module.PodcastStudio })))
const MindMapStudio = lazy(() => import('./studio/MindMapStudio').then(module => ({ default: module.MindMapStudio })))
const VideoStudio = lazy(() => import('./studio/VideoStudio').then(module => ({ default: module.VideoStudio })))
const VoiceStudio = lazy(() => import('./studio/VoiceStudio').then(module => ({ default: module.VoiceStudio })))

// Loading fallback component
const StudioLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading studio...</span>
    </div>
  </div>
)

type StudioTab = 'podcast' | 'mindmap' | 'video' | 'voice' | 'downloads' | 'settings'

interface StudioOption {
  id: StudioTab
  title: string
  description: string
  icon: React.ReactNode
  badgeText?: string
  color: string
}

export function StudioPanel() {
  const [activeTab, setActiveTab] = useState<StudioTab>('podcast')
  const [selectedModels, setSelectedModels] = useState({
    transcript: 'mlx-community/Qwen2.5-14B-Instruct-4bit',
    rewriter: 'mlx-community/Qwen2.5-7B-Instruct-4bit',
    tts: 'mlx-community/Kokoro-82M-bf16',
    pdf_processor: 'mlx-community/Qwen2.5-1.5B-Instruct-4bit'
  })

  const studioOptions: StudioOption[] = [
    {
      id: 'podcast',
      title: 'Audio overview',
      description: 'A conversational overview of your sources',
      icon: <Play className="h-5 w-5" />,
      badgeText: 'New',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'downloads',
      title: 'Downloads',
      description: 'Export audio, video and bundles',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-gray-50 border-gray-200 text-gray-800'
    },
    {
      id: 'mindmap',
      title: 'Study guide',
      description: 'Interactive mind map of key concepts',
      icon: <BrainCircuit className="h-5 w-5" />,
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      id: 'video',
      title: 'Video overview', 
      description: 'Generate video presentation from sources',
      icon: <FileVideo className="h-5 w-5" />,
      badgeText: 'Beta',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      id: 'voice',
      title: 'Voice training',
      description: 'Train custom voices for personalized audio',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    }
  ]

  const renderStudioContent = () => {
    switch (activeTab) {
      case 'podcast':
        return (
          <Suspense fallback={<StudioLoading />}>
            <PodcastStudio selectedModels={selectedModels} />
          </Suspense>
        )
      case 'mindmap':
        return (
          <Suspense fallback={<StudioLoading />}>
            <MindMapStudio selectedModel={selectedModels.transcript} />
          </Suspense>
        )
      case 'video':
        return (
          <Suspense fallback={<StudioLoading />}>
            <VideoStudio selectedModels={selectedModels} />
          </Suspense>
        )
      case 'voice':
        return (
          <Suspense fallback={<StudioLoading />}>
            <VoiceStudio selectedModel={selectedModels.tts} />
          </Suspense>
        )
      case 'downloads':
        return <DownloadsPanel />
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Model Settings</h2>
                <p className="text-gray-600">Configure local MLX and Ollama models for each studio feature</p>
              </div>
            </div>
            
            <div className="grid gap-6">
              <ModelSelector
                selectedModel={selectedModels.transcript}
                onModelChange={(model) => setSelectedModels(prev => ({ ...prev, transcript: model }))}
                modelType="transcript"
              />
              
              <ModelSelector
                selectedModel={selectedModels.rewriter}
                onModelChange={(model) => setSelectedModels(prev => ({ ...prev, rewriter: model }))}
                modelType="rewriter"
              />
              
              <ModelSelector
                selectedModel={selectedModels.tts}
                onModelChange={(model) => setSelectedModels(prev => ({ ...prev, tts: model }))}
                modelType="tts"
              />
              
              <ModelSelector
                selectedModel={selectedModels.pdf_processor}
                onModelChange={(model) => setSelectedModels(prev => ({ ...prev, pdf_processor: model }))}
                modelType="pdf_processor"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (activeTab === 'settings') {
    return (
      <div className="h-full flex flex-col">
        {/* Header with back button */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('podcast')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <span>←</span>
            <span>Back to Studio</span>
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {renderStudioContent()}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Studio Header - NotebookLM style */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Notebook Guide</h2>
              <p className="text-gray-600">Choose a format to bring your sources to life</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <Cpu className="h-4 w-4" />
              <span>Local models</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Model Settings"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Studio Options Grid - NotebookLM style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {studioOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveTab(option.id)}
              className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                activeTab === option.id
                  ? option.color + ' border-current shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  activeTab === option.id ? 'bg-white/50' : 'bg-gray-100'
                }`}>
                  {option.icon}
                </div>
                {option.badgeText && (
                  <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">
                    {option.badgeText}
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderStudioContent()}
      </div>
    </div>
  )
}

function DownloadsPanel() {
  const { podcastTask } = require('../store/useStore').useStore.getState()
  const taskId = podcastTask?.task_id
  const audioHref = taskId ? `/api/download/podcasts/${taskId}.wav` : undefined
  const videoHref = taskId ? `/api/download/videos/${taskId}.mp4` : undefined
  const zipHref = taskId ? `/api/export/podcast/${taskId}.zip` : undefined
  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">Downloads</h3>
      <div className="space-y-3">
        <a className={`block p-3 border rounded ${!audioHref ? 'opacity-50 pointer-events-none' : 'hover:bg-black/5'}`} href={audioHref} download>
          Podcast audio (WAV)
        </a>
        <a className={`block p-3 border rounded ${!videoHref ? 'opacity-50 pointer-events-none' : 'hover:bg-black/5'}`} href={videoHref} download>
          Video (MP4)
        </a>
        <a className={`block p-3 border rounded ${!zipHref ? 'opacity-50 pointer-events-none' : 'hover:bg-black/5'}`} href={zipHref} download>
          Podcast export bundle (ZIP)
        </a>
      </div>
      {!taskId && (
        <p className="text-sm text-muted-foreground mt-4">No podcast task found yet. Generate a podcast to enable downloads.</p>
      )}
    </div>
  )
}
