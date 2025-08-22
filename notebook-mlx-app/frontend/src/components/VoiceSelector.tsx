import { useState } from 'react'
import { Volume2, Play, Pause } from 'lucide-react'

interface VoiceOption {
  id: string
  name: string
  description: string
  gender: 'male' | 'female'
  accent: string
  preview?: string
}

interface VoiceSelectorProps {
  selectedVoice: string
  onVoiceChange: (voiceId: string) => void
  speaker: 'speaker1' | 'speaker2'
}

export function VoiceSelector({ selectedVoice, onVoiceChange, speaker }: VoiceSelectorProps) {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)

  const voiceOptions: VoiceOption[] = [
    {
      id: 'speaker1_female',
      name: 'Sarah',
      description: 'Clear, professional female voice',
      gender: 'female',
      accent: 'American',
      preview: 'Hello, I\'m Sarah. I\'ll be your guide through this content.'
    },
    {
      id: 'speaker1_male', 
      name: 'David',
      description: 'Warm, authoritative male voice',
      gender: 'male',
      accent: 'American',
      preview: 'Hi there, I\'m David. Let me walk you through these insights.'
    },
    {
      id: 'speaker2_female',
      name: 'Emma',
      description: 'Enthusiastic, curious female voice',
      gender: 'female',
      accent: 'British',
      preview: 'Oh wow, that\'s fascinating! Tell me more about that.'
    },
    {
      id: 'speaker2_male',
      name: 'Alex',
      description: 'Engaging, inquisitive male voice',
      gender: 'male', 
      accent: 'Canadian',
      preview: 'That\'s really interesting! Can you explain how that works?'
    },
    {
      id: 'narrator',
      name: 'Morgan',
      description: 'Neutral, documentary-style narrator',
      gender: 'female',
      accent: 'Neutral',
      preview: 'In today\'s discussion, we\'ll explore the key concepts and their implications.'
    }
  ]

  const handlePreview = async (voiceId: string, text: string) => {
    if (playingPreview === voiceId) {
      // Stop playing
      setPlayingPreview(null)
      return
    }

    setPlayingPreview(voiceId)
    
    try {
      // In a real implementation, this would call the TTS API
      // For now, we'll simulate audio playback
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (error) {
      console.error('Preview failed:', error)
    } finally {
      setPlayingPreview(null)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {speaker === 'speaker1' ? 'Host Voice' : 'Guest Voice'}
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {voiceOptions.map((voice) => (
          <div
            key={voice.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedVoice === voice.id
                ? 'border-[rgb(11,40,212)] bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onVoiceChange(voice.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{voice.name}</h4>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                    {voice.gender} • {voice.accent}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{voice.description}</p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview(voice.id, voice.preview || 'Hello, this is a voice preview.')
                }}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={playingPreview !== null}
              >
                {playingPreview === voice.id ? (
                  <Pause className="h-4 w-4 text-gray-600" />
                ) : (
                  <Play className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Volume2 className="h-4 w-4" />
          <span>Click the play button to preview each voice</span>
        </div>
      </div>
    </div>
  )
}