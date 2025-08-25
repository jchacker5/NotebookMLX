import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'

interface VideoOverviewProps {
  title: string
  duration: string
  thumbnail?: string
  videoUrl?: string
}

export function VideoOverview({ title, duration, thumbnail, videoUrl }: VideoOverviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setTotalDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * totalDuration
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Video Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">Duration: {duration}</p>
      </div>

      {/* Video Player */}
      <div className="relative bg-black aspect-video">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={thumbnail}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div 
            className="w-full h-full bg-gray-900 flex items-center justify-center"
            style={{ 
              backgroundImage: thumbnail ? `url(${thumbnail})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
              <p className="text-white text-sm">Video Preview Coming Soon</p>
            </div>
          </div>
        )}

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleMute}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 text-white" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white" />
                  )}
                </button>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0
                      setCurrentTime(0)
                    }
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <RotateCcw className="h-5 w-5 text-white" />
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.requestFullscreen()
                    }
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Maximize className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Generated video overview</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            AI Generated
          </span>
        </div>
      </div>
    </div>
  )
}