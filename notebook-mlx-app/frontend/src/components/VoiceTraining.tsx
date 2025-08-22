import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Upload, Trash2, Save, Download, Settings } from 'lucide-react'

interface VoiceSample {
  id: string
  name: string
  duration: number
  transcript: string
  audioBlob: Blob
  createdAt: Date
}

interface TrainedVoice {
  id: string
  name: string
  samples: VoiceSample[]
  modelPath?: string
  createdAt: Date
  lastUpdated: Date
}

export function VoiceTraining() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([])
  const [trainedVoices, setTrainedVoices] = useState<TrainedVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState<string>('')
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load saved voices from localStorage on component mount
  useEffect(() => {
    const savedVoices = localStorage.getItem('trainedVoices')
    if (savedVoices) {
      setTrainedVoices(JSON.parse(savedVoices))
    }
  }, [])

  // Sample sentences for voice training
  const trainingTexts = [
    "Hello, my name is [Your Name]. I'm excited to create podcasts with my own voice.",
    "Technology continues to evolve at an unprecedented pace, transforming how we work and live.",
    "In today's discussion, we'll explore the fascinating world of artificial intelligence and machine learning.",
    "The weather today is quite pleasant, with clear skies and a gentle breeze.",
    "Reading is one of life's greatest pleasures, opening doors to new worlds and ideas.",
    "I believe that continuous learning is essential for personal and professional growth.",
    "Music has the power to evoke emotions and bring people together across cultures.",
    "Innovation drives progress, challenging us to think differently and solve complex problems."
  ]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const newSample: VoiceSample = {
          id: Date.now().toString(),
          name: `Sample ${voiceSamples.length + 1}`,
          duration: recordingTime,
          transcript: '',
          audioBlob,
          createdAt: new Date()
        }
        setVoiceSamples(prev => [...prev, newSample])
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      const newSample: VoiceSample = {
        id: Date.now().toString(),
        name: file.name,
        duration: 0, // Will be calculated when audio loads
        transcript: '',
        audioBlob: file,
        createdAt: new Date()
      }
      setVoiceSamples(prev => [...prev, newSample])
    }
  }

  const playAudio = async (sample: VoiceSample) => {
    if (playingAudio === sample.id) {
      setPlayingAudio(null)
      return
    }

    const audio = new Audio(URL.createObjectURL(sample.audioBlob))
    setPlayingAudio(sample.id)
    
    audio.onended = () => setPlayingAudio(null)
    audio.onerror = () => setPlayingAudio(null)
    
    try {
      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingAudio(null)
    }
  }

  const trainVoice = async () => {
    if (voiceSamples.length < 3) {
      alert('Please record at least 3 voice samples for training.')
      return
    }

    if (!currentVoice.trim()) {
      alert('Please enter a name for your voice.')
      return
    }

    setIsTraining(true)
    setTrainingProgress(0)

    // Simulate training process
    const trainingSteps = [
      'Analyzing voice samples...',
      'Extracting voice features...',
      'Training neural network...',
      'Optimizing model parameters...',
      'Finalizing voice model...'
    ]

    for (let i = 0; i < trainingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTrainingProgress((i + 1) / trainingSteps.length * 100)
    }

    // Create trained voice
    const newTrainedVoice: TrainedVoice = {
      id: Date.now().toString(),
      name: currentVoice,
      samples: [...voiceSamples],
      modelPath: `/models/voice_${Date.now()}.mlx`, // Simulated path
      createdAt: new Date(),
      lastUpdated: new Date()
    }

    const updatedVoices = [...trainedVoices, newTrainedVoice]
    setTrainedVoices(updatedVoices)
    
    // Save to localStorage (in production, this would be saved to the device)
    localStorage.setItem('trainedVoices', JSON.stringify(updatedVoices))

    setIsTraining(false)
    setTrainingProgress(0)
    setVoiceSamples([])
    setCurrentVoice('')
    
    alert(`Voice "${newTrainedVoice.name}" has been successfully trained and saved!`)
  }

  const deleteSample = (sampleId: string) => {
    setVoiceSamples(prev => prev.filter(s => s.id !== sampleId))
  }

  const deleteTrainedVoice = (voiceId: string) => {
    const updatedVoices = trainedVoices.filter(v => v.id !== voiceId)
    setTrainedVoices(updatedVoices)
    localStorage.setItem('trainedVoices', JSON.stringify(updatedVoices))
  }

  const exportVoice = (voice: TrainedVoice) => {
    const voiceData = {
      ...voice,
      exportedAt: new Date()
    }
    
    const blob = new Blob([JSON.stringify(voiceData)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${voice.name}_voice_model.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Training Studio</h1>
        <p className="text-gray-600">Create and train your personalized voice for podcasts</p>
      </div>

      {/* Voice Recording Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Record Voice Samples</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Name
          </label>
          <input
            type="text"
            value={currentVoice}
            onChange={(e) => setCurrentVoice(e.target.value)}
            placeholder="Enter a name for your voice (e.g., 'My Podcast Voice')"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recording Controls */}
          <div className="space-y-4">
            <div className="text-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-semibold transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
              
              {isRecording && (
                <div className="mt-2 text-red-600 font-medium">
                  Recording: {formatTime(recordingTime)}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </button>
            </div>
          </div>

          {/* Training Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Training Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Record at least 5-10 samples for best results</li>
              <li>• Speak clearly and at normal pace</li>
              <li>• Use different emotions and tones</li>
              <li>• Record in a quiet environment</li>
              <li>• Each sample should be 10-30 seconds</li>
            </ul>
          </div>
        </div>

        {/* Sample Training Texts */}
        {voiceSamples.length < 8 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Suggested Training Texts</h3>
            <div className="grid gap-2">
              {trainingTexts.slice(voiceSamples.length, voiceSamples.length + 3).map((text, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  "{text}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Samples */}
      {voiceSamples.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Voice Samples ({voiceSamples.length})</h2>
            <button
              onClick={trainVoice}
              disabled={isTraining || voiceSamples.length < 3 || !currentVoice.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isTraining ? 'Training...' : 'Train Voice'}
            </button>
          </div>

          {isTraining && (
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">Training progress: {Math.round(trainingProgress)}%</p>
            </div>
          )}

          <div className="grid gap-3">
            {voiceSamples.map((sample) => (
              <div key={sample.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => playAudio(sample)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {playingAudio === sample.id ? (
                      <Pause className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Play className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium text-gray-900">{sample.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(sample.duration)} • {sample.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteSample(sample.id)}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trained Voices */}
      {trainedVoices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Your Trained Voices</h2>
          <div className="grid gap-4">
            {trainedVoices.map((voice) => (
              <div key={voice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{voice.name}</h3>
                  <p className="text-sm text-gray-500">
                    {voice.samples.length} samples • Created {voice.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportVoice(voice)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export Voice"
                  >
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteTrainedVoice(voice.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete Voice"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}