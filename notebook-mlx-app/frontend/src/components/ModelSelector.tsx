import { useState, useEffect } from 'react'
import { Settings, Download, RefreshCw, CheckCircle, AlertCircle, Cpu, Cloud } from 'lucide-react'

interface Model {
  id: string
  name: string
  provider: 'ollama' | 'mlx'
  size: string
  description: string
  isInstalled: boolean
  isDownloading?: boolean
  downloadProgress?: number
  capabilities: string[]
  memoryRequirement: string
}

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  modelType: 'transcript' | 'rewriter' | 'tts' | 'pdf_processor'
}

export function ModelSelector({ selectedModel, onModelChange, modelType }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'ollama' | 'mlx'>('all')

  useEffect(() => {
    loadAvailableModels()
  }, [modelType])

  const loadAvailableModels = async () => {
    setIsRefreshing(true)
    
    // Simulate loading models from both Ollama and MLX
    const availableModels: Model[] = getModelsForType(modelType)
    
    // In real implementation, this would query:
    // - Ollama API for installed models
    // - MLX community models
    // - Local MLX models
    
    setModels(availableModels)
    setIsRefreshing(false)
  }

  const getModelsForType = (type: string): Model[] => {
    const baseModels = {
      transcript: [
        {
          id: 'ollama:llama3.2:3b',
          name: 'Llama 3.2 3B',
          provider: 'ollama' as const,
          size: '3B',
          description: 'Fast and efficient for transcript generation',
          isInstalled: true,
          capabilities: ['conversation', 'reasoning'],
          memoryRequirement: '4GB'
        },
        {
          id: 'ollama:qwen2.5:7b',
          name: 'Qwen 2.5 7B',
          provider: 'ollama' as const,
          size: '7B',
          description: 'Excellent for detailed transcripts and analysis',
          isInstalled: false,
          capabilities: ['conversation', 'analysis', 'coding'],
          memoryRequirement: '8GB'
        },
        {
          id: 'mlx-community/Qwen2.5-14B-Instruct-4bit',
          name: 'Qwen 2.5 14B (4-bit)',
          provider: 'mlx' as const,
          size: '14B',
          description: 'High-quality MLX optimized model for Apple Silicon',
          isInstalled: true,
          capabilities: ['conversation', 'reasoning', 'analysis'],
          memoryRequirement: '10GB'
        },
        {
          id: 'mlx-community/Qwen3-8B-4bit',
          name: 'Qwen 3 8B (4-bit)',
          provider: 'mlx' as const,
          size: '8B',
          description: 'Latest Qwen model optimized for MLX',
          isInstalled: false,
          capabilities: ['conversation', 'reasoning', 'multimodal'],
          memoryRequirement: '6GB'
        }
      ],
      rewriter: [
        {
          id: 'ollama:llama3.2:1b',
          name: 'Llama 3.2 1B',
          provider: 'ollama' as const,
          size: '1B',
          description: 'Lightweight model for style improvements',
          isInstalled: true,
          capabilities: ['writing', 'editing'],
          memoryRequirement: '2GB'
        },
        {
          id: 'mlx-community/Qwen2.5-7B-Instruct-4bit',
          name: 'Qwen 2.5 7B (4-bit)',
          provider: 'mlx' as const,
          size: '7B',
          description: 'Excellent for dramatic rewriting',
          isInstalled: true,
          capabilities: ['writing', 'creativity', 'editing'],
          memoryRequirement: '6GB'
        }
      ],
      tts: [
        {
          id: 'mlx-community/Kokoro-82M-bf16',
          name: 'Kokoro TTS',
          provider: 'mlx' as const,
          size: '82M',
          description: 'High-quality text-to-speech with multiple voices',
          isInstalled: true,
          capabilities: ['tts', 'multi-voice'],
          memoryRequirement: '1GB'
        },
        {
          id: 'mlx-community/F5-TTS',
          name: 'F5-TTS',
          provider: 'mlx' as const,
          size: '300M',
          description: 'Advanced TTS with voice cloning capabilities',
          isInstalled: false,
          capabilities: ['tts', 'voice-cloning'],
          memoryRequirement: '2GB'
        }
      ],
      pdf_processor: [
        {
          id: 'ollama:llama3.2:1b',
          name: 'Llama 3.2 1B',
          provider: 'ollama' as const,
          size: '1B',
          description: 'Fast PDF text processing and cleaning',
          isInstalled: true,
          capabilities: ['text-processing'],
          memoryRequirement: '2GB'
        },
        {
          id: 'mlx-community/Qwen2.5-1.5B-Instruct-4bit',
          name: 'Qwen 2.5 1.5B (4-bit)',
          provider: 'mlx' as const,
          size: '1.5B',
          description: 'Optimized for PDF preprocessing',
          isInstalled: true,
          capabilities: ['text-processing', 'cleaning'],
          memoryRequirement: '2GB'
        }
      ]
    }

    return baseModels[type as keyof typeof baseModels] || []
  }

  const downloadModel = async (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, isDownloading: true, downloadProgress: 0 }
        : model
    ))

    // Simulate download progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setModels(prev => prev.map(model => 
        model.id === modelId 
          ? { ...model, downloadProgress: progress }
          : model
      ))
    }

    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, isDownloading: false, isInstalled: true, downloadProgress: 100 }
        : model
    ))
  }

  const filteredModels = models.filter(model => 
    filter === 'all' || model.provider === filter
  )

  const getProviderIcon = (provider: 'ollama' | 'mlx') => {
    return provider === 'ollama' ? <Cloud className="h-4 w-4" /> : <Cpu className="h-4 w-4" />
  }

  const getProviderColor = (provider: 'ollama' | 'mlx') => {
    return provider === 'ollama' ? 'text-blue-600' : 'text-green-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            Model Selection - {modelType.replace('_', ' ').toUpperCase()}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {/* Provider Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'ollama' | 'mlx')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Providers</option>
            <option value="ollama">Ollama</option>
            <option value="mlx">MLX</option>
          </select>
          
          <button
            onClick={loadAvailableModels}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Model List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => model.isInstalled && onModelChange(model.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`flex items-center space-x-1 ${getProviderColor(model.provider)}`}>
                    {getProviderIcon(model.provider)}
                    <span className="text-xs font-medium uppercase">
                      {model.provider}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {model.size}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {model.memoryRequirement}
                  </span>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1">{model.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="ml-4 flex flex-col items-end space-y-2">
                {model.isInstalled ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Installed</span>
                  </div>
                ) : model.isDownloading ? (
                  <div className="text-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${model.downloadProgress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {model.downloadProgress}%
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadModel(model.id)
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                  >
                    <Download className="h-3 w-3" />
                    <span>Install</span>
                  </button>
                )}
                
                {selectedModel === model.id && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Selected</span>
                  </div>
                )}
              </div>
            </div>
            
            {!model.isInstalled && !model.isDownloading && (
              <div className="mt-2 flex items-center space-x-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Model needs to be downloaded</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No models available for {modelType}</p>
          <button
            onClick={loadAvailableModels}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Refresh models
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Cloud className="h-4 w-4 text-blue-600" />
              <span>Ollama: Local models via API</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="h-4 w-4 text-green-600" />
              <span>MLX: Apple Silicon optimized</span>
            </div>
          </div>
          <span>{filteredModels.filter(m => m.isInstalled).length} installed</span>
        </div>
      </div>
    </div>
  )
}