import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Loader2, Mic } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { generatePodcast, getTaskStatus } from '../../services/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import WaveSurfer from 'wavesurfer.js'

interface PodcastStudioProps {
  selectedModels: {
    transcript: string
    rewriter: string
    tts: string
    pdf_processor: string
  }
}

export function PodcastStudio({ selectedModels }: PodcastStudioProps) {
  const [voiceSettings, setVoiceSettings] = useState({
    speaker1: 'speaker1_female',
    speaker2: 'speaker2_male',
    enhanceDrama: true,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  
  const { selectedSources, podcastTask, setPodcastTask } = useStore()

  // Task status polling
  const { data: taskStatus } = useQuery({
    queryKey: ['task', podcastTask?.task_id],
    queryFn: () => getTaskStatus(podcastTask.task_id),
    enabled: !!podcastTask?.task_id && podcastTask.status !== 'completed',
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (taskStatus) {
      setPodcastTask(taskStatus)
    }
  }, [taskStatus, setPodcastTask])

  const generateMutation = useMutation({
    mutationFn: () => generatePodcast(selectedSources, voiceSettings),
    onSuccess: (data) => {
      setPodcastTask(data)
    },
  })

  // Initialize WaveSurfer when audio is ready
  useEffect(() => {
    if (podcastTask?.status === 'completed' && podcastTask.audio_path && waveformRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgb(59 130 246)',
        progressColor: 'rgb(147 197 253)',
        cursorColor: 'rgb(239 246 255)',
        barWidth: 2,
        barRadius: 3,
        height: 80,
      })

      wavesurferRef.current.load(`/api/download/podcasts/${podcastTask.task_id}.wav`)
      
      wavesurferRef.current.on('finish', () => {
        setIsPlaying(false)
      })

      return () => {
        wavesurferRef.current?.destroy()
      }
    }
  }, [podcastTask])

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause()
      setIsPlaying(!isPlaying)
    }
  }

  const getStatusMessage = () => {
    if (!podcastTask) return null
    
    switch (podcastTask.status) {
      case 'generating_transcript':
        return 'Generating podcast transcript...'
      case 'enhancing_transcript':
        return 'Enhancing dialogue for natural flow...'
      case 'generating_audio':
        return 'Converting to speech...'
      case 'completed':
        return 'Podcast ready!'
      case 'failed':
        return `Error: ${podcastTask.error || 'Generation failed'}`
      default:
        return 'Processing...'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Audio Overview</h3>
            <p className="text-gray-600 mb-4">
              Transform your sources into an engaging conversational podcast using local models
            </p>
            
            {/* Model Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-1">
                <span className="font-medium">Transcript:</span>
                <span className="font-mono text-xs">{selectedModels.transcript.split('/').pop()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">TTS:</span>
                <span className="font-mono text-xs">{selectedModels.tts.split('/').pop()}</span>
              </div>
            </div>
          </div>

        {/* Voice Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Speaker 1 Voice</label>
            <select
              value={voiceSettings.speaker1}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, speaker1: e.target.value })}
              className="w-full px-3 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="speaker1_female">Female (Heart)</option>
              <option value="speaker1_male">Male (Sky)</option>
              <option value="custom">Custom Voice</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Speaker 2 Voice</label>
            <select
              value={voiceSettings.speaker2}
              onChange={(e) => setVoiceSettings({ ...voiceSettings, speaker2: e.target.value })}
              className="w-full px-3 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="speaker2_female">Female (Bella)</option>
              <option value="speaker2_male">Male (Emma)</option>
              <option value="custom">Custom Voice</option>
            </select>
          </div>
        </div>

        {/* Enhancement Option */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={voiceSettings.enhanceDrama}
            onChange={(e) => setVoiceSettings({ ...voiceSettings, enhanceDrama: e.target.checked })}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Enhance dialogue for natural conversation flow</span>
        </label>

        {/* Generate Button */}
        <button
          onClick={() => generateMutation.mutate()}
          disabled={selectedSources.length === 0 || generateMutation.isPending || (podcastTask && podcastTask.status !== 'completed' && podcastTask.status !== 'failed')}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {generateMutation.isPending || (podcastTask && podcastTask.status !== 'completed' && podcastTask.status !== 'failed') ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{getStatusMessage()}</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Generate Podcast</span>
            </>
          )}
        </button>

        {/* Audio Player */}
        {podcastTask?.status === 'completed' && (
          <div className="space-y-4 p-4 bg-secondary rounded-lg">
            <div ref={waveformRef} className="w-full" />
            
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlayPause}
                className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              
              <a
                href={`/api/download/podcasts/${podcastTask.task_id}.wav`}
                download
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </a>
            </div>
          </div>
        )}

        {/* Error Message */}
        {podcastTask?.status === 'failed' && (
          <div className="p-4 bg-destructive/20 text-destructive rounded-lg">
            <p className="text-sm">{podcastTask.error || 'Podcast generation failed'}</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}