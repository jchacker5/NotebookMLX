import React, { useState, useRef } from 'react'
import { Video, Download, Loader2 } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function VideoStudio() {
  const [videoSettings, setVideoSettings] = useState({
    style: 'waveform',
    showCaptions: true,
    backgroundColor: '#1a1a1a',
    waveformColor: '#3b82f6',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { podcastTask } = useStore()

  const generateVideo = async () => {
    if (!podcastTask?.audio_path) return

    setIsGenerating(true)
    
    try {
      // In a real implementation, this would call a video generation API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate generated video
      setGeneratedVideo(`/api/download/videos/${podcastTask.task_id}.mp4`)
    } catch (error) {
      console.error('Video generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const previewVideo = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    
    // Clear canvas
    ctx.fillStyle = videoSettings.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw sample waveform
    ctx.strokeStyle = videoSettings.waveformColor
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const centerY = canvas.height / 2
    const amplitude = 40
    
    for (let x = 0; x < canvas.width; x += 2) {
      const y = centerY + Math.sin(x * 0.02) * amplitude * Math.random()
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.stroke()
    
    // Draw sample caption
    if (videoSettings.showCaptions) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Sample podcast caption text appears here', canvas.width / 2, canvas.height - 40)
    }
  }

  // Update preview when settings change
  React.useEffect(() => {
    previewVideo()
  }, [videoSettings])

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Video Generator</h3>
        <p className="text-muted-foreground">
          Convert your podcast audio into an engaging video with visualizations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Settings Panel */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Video Style</label>
            <select
              value={videoSettings.style}
              onChange={(e) => setVideoSettings({ ...videoSettings, style: e.target.value })}
              className="w-full px-3 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="waveform">Animated Waveform</option>
              <option value="spectrum">Audio Spectrum</option>
              <option value="minimal">Minimal Text</option>
              <option value="avatar">Simple Avatar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <input
              type="color"
              value={videoSettings.backgroundColor}
              onChange={(e) => setVideoSettings({ ...videoSettings, backgroundColor: e.target.value })}
              className="w-full h-10 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Waveform Color</label>
            <input
              type="color"
              value={videoSettings.waveformColor}
              onChange={(e) => setVideoSettings({ ...videoSettings, waveformColor: e.target.value })}
              className="w-full h-10 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={videoSettings.showCaptions}
              onChange={(e) => setVideoSettings({ ...videoSettings, showCaptions: e.target.checked })}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm">Show captions from transcript</span>
          </label>

          <button
            onClick={generateVideo}
            disabled={!podcastTask?.audio_path || isGenerating}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Video...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Generate Video</span>
              </>
            )}
          </button>

          {generatedVideo && (
            <a
              href={generatedVideo}
              download
              className="w-full py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4</span>
            </a>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <h4 className="font-medium">Preview</h4>
          
          <div className="bg-secondary rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={225}
              className="w-full h-auto border border-border rounded"
            />
          </div>

          {!podcastTask?.audio_path && (
            <p className="text-sm text-muted-foreground text-center">
              Generate a podcast first to create a video
            </p>
          )}

          {generatedVideo && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Generated Video</h5>
              <video
                src={generatedVideo}
                controls
                className="w-full rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}