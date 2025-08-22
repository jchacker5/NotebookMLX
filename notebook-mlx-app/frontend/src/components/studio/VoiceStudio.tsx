import { useState, useRef } from 'react'
import { Mic, MicOff, Upload, Play, Save, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { trainVoice, synthesizeVoice } from '../../services/api'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'

interface VoiceStudioProps {
  selectedModel: string
}

export function VoiceStudio({ selectedModel }: VoiceStudioProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [voiceName, setVoiceName] = useState('')
  const [testText, setTestText] = useState('Hello! This is a test of my custom voice.')
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const { customVoices, addCustomVoice } = useStore()

  const trainMutation = useMutation({
    mutationFn: (files: File[]) => trainVoice(files, voiceName),
    onSuccess: (data) => {
      addCustomVoice({
        id: data.voice_id,
        name: voiceName,
        status: data.status,
      })
      setVoiceName('')
      setAudioFiles([])
    },
  })

  const synthMutation = useMutation({
    mutationFn: (voiceId: string) => synthesizeVoice(testText, voiceId),
    onSuccess: (blob) => {
      const audio = new Audio(URL.createObjectURL(blob))
      audio.play()
    },
  })

  const onDrop = (acceptedFiles: File[]) => {
    setAudioFiles([...audioFiles, ...acceptedFiles])
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
    },
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })
        setAudioFiles([...audioFiles, file])
        chunksRef.current = []
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Voice Training</h3>
            <p className="text-gray-600 mb-4">
              Train custom voices for personalized text-to-speech using local models
            </p>
            
            {/* Model Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center space-x-1">
                <span className="font-medium">TTS Model:</span>
                <span className="font-mono text-xs">{selectedModel.split('/').pop()}</span>
              </div>
            </div>
          </div>

      <div className="space-y-6">
        {/* Voice Name Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Voice Name</label>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="Enter a name for your voice profile"
            className="w-full px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Recording Section */}
        <div className="space-y-4">
          <h4 className="font-medium">Record Voice Samples</h4>
          <p className="text-sm text-muted-foreground">
            Record 5-10 minutes of clear speech for best results
          </p>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
              isRecording
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Start Recording</span>
              </>
            )}
          </button>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <h4 className="font-medium">Or Upload Audio Files</h4>
          
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop audio files here or click to browse
            </p>
          </div>
        </div>

        {/* Audio Files List */}
        {audioFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Audio Samples ({audioFiles.length})</h4>
            <div className="space-y-1">
              {audioFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span className="text-sm truncate">{file.name}</span>
                  <button
                    onClick={() => setAudioFiles(audioFiles.filter((_, i) => i !== idx))}
                    className="text-destructive hover:text-destructive/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Train Button */}
        <button
          onClick={() => trainMutation.mutate(audioFiles)}
          disabled={!voiceName || audioFiles.length === 0 || trainMutation.isPending}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {trainMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Training Voice...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Train Voice Model</span>
            </>
          )}
        </button>

        {/* Test Section */}
        {customVoices.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-border">
            <h4 className="font-medium">Test Your Voices</h4>
            
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to synthesize..."
              className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
            
            <div className="grid grid-cols-2 gap-2">
              {customVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => synthMutation.mutate(voice.id)}
                  disabled={synthMutation.isPending}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm">{voice.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  )
}