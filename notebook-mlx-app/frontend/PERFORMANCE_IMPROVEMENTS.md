# Performance Optimization for NotebookMLX Frontend

## Current Performance Issues

### 1. Bundle Size and Code Splitting

**Problem**: Large initial bundle size affecting load times

**Current State Analysis**:
- React, ReactDOM, and all components loaded upfront
- D3.js loaded even when mind map studio not used
- WaveSurfer.js loaded for all users
- No lazy loading of studio components

**Solutions**:

#### Implement Route-Based Code Splitting
```typescript
// src/App.tsx - Enhanced with lazy loading
import { lazy, Suspense } from 'react'

// Lazy load heavy components
const StudioPanel = lazy(() => import('./components/StudioPanel'))
const PodcastStudio = lazy(() => import('./components/studio/PodcastStudio'))
const MindMapStudio = lazy(() => import('./components/studio/MindMapStudio'))
const VideoStudio = lazy(() => import('./components/studio/VideoStudio'))
const VoiceTraining = lazy(() => import('./components/VoiceTraining'))

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    <span className="ml-3 text-sm text-muted-foreground">Loading...</span>
  </div>
)

function App() {
  // ... existing state

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* ... header and breadcrumb */}
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-border">
          <SourcesPanel />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {activePanel === 'chat' ? (
              <ChatPanel />
            ) : (
              <Suspense fallback={<LoadingSpinner />}>
                <StudioPanel />
              </Suspense>
            )}
          </div>
          {/* ... panel toggles */}
        </div>
      </div>
    </div>
  )
}
```

#### Dynamic Imports for Heavy Libraries
```typescript
// src/components/studio/PodcastStudio.tsx
import { useEffect, useRef, useState } from 'react'

export function PodcastStudio() {
  const [WaveSurfer, setWaveSurfer] = useState<any>(null)
  const [isWaveSurferLoading, setIsWaveSurferLoading] = useState(false)

  // Dynamically import WaveSurfer only when needed
  const loadWaveSurfer = async () => {
    if (WaveSurfer || isWaveSurferLoading) return
    
    setIsWaveSurferLoading(true)
    try {
      const module = await import('wavesurfer.js')
      setWaveSurfer(module.default)
    } catch (error) {
      console.error('Failed to load WaveSurfer:', error)
    } finally {
      setIsWaveSurferLoading(false)
    }
  }

  // Load WaveSurfer when audio is ready
  useEffect(() => {
    if (podcastTask?.status === 'completed' && podcastTask.audio_path) {
      loadWaveSurfer()
    }
  }, [podcastTask])

  // ... rest of component
}
```

### 2. Component Memoization and Re-render Optimization

**Problem**: Unnecessary re-renders in chat messages and source lists

**Solutions**:

#### Memoized Message Component
```typescript
// src/components/ChatMessage.tsx
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: Citation[]
    timestamp: Date
  }
}

export const ChatMessage = memo(({ message }: ChatMessageProps) => {
  return (
    <div
      className={`flex gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary'
        }`}
      >
        <ReactMarkdown className="prose prose-sm dark:prose-invert">
          {message.content}
        </ReactMarkdown>
        
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium mb-1">Sources:</p>
            <div className="flex flex-wrap gap-1">
              {message.citations.map((citation, idx) => (
                <span
                  key={`${citation.sourceId}-${idx}`}
                  className="text-xs bg-background/20 px-2 py-0.5 rounded"
                >
                  {citation.filename}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.citations?.length === nextProps.message.citations?.length
  )
})

ChatMessage.displayName = 'ChatMessage'
```

#### Optimized Source List
```typescript
// src/components/SourceItem.tsx
import { memo, useCallback } from 'react'

interface SourceItemProps {
  source: Source
  isSelected: boolean
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export const SourceItem = memo(({ source, isSelected, onToggle, onRemove }: SourceItemProps) => {
  const handleToggle = useCallback(() => {
    onToggle(source.id)
  }, [source.id, onToggle])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(source.id)
  }, [source.id, onRemove])

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary/20 border border-primary'
          : 'hover:bg-secondary border border-transparent'
      }`}
      onClick={handleToggle}
    >
      {source.type === 'pdf' ? (
        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      ) : (
        <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{source.filename}</p>
        <p className="text-xs text-muted-foreground">
          {source.uploadedAt.toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={handleRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${source.filename}`}
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </button>
    </div>
  )
})

SourceItem.displayName = 'SourceItem'
```

### 3. Virtual Scrolling for Large Lists

**Problem**: Performance degrades with many chat messages or sources

**Solution**:

```typescript
// src/components/VirtualizedMessageList.tsx
import { FixedSizeList as List } from 'react-window'
import { memo, useMemo } from 'react'

interface VirtualizedMessageListProps {
  messages: Message[]
  height: number
}

const ITEM_HEIGHT = 120 // Estimated message height

export const VirtualizedMessageList = memo(({ messages, height }: VirtualizedMessageListProps) => {
  const itemData = useMemo(() => ({ messages }), [messages])

  const MessageItem = memo(({ index, style, data }: any) => {
    const message = data.messages[index]
    
    return (
      <div style={style}>
        <div className="px-6 py-2">
          <ChatMessage message={message} />
        </div>
      </div>
    )
  })

  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={ITEM_HEIGHT}
      itemData={itemData}
      className="scrollbar-thin scrollbar-thumb-gray-300"
    >
      {MessageItem}
    </List>
  )
})

VirtualizedMessageList.displayName = 'VirtualizedMessageList'
```

### 4. Image and Asset Optimization

**Solution**:

```typescript
// src/components/OptimizedImage.tsx
import { useState, useCallback } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
}

export function OptimizedImage({ src, alt, className, fallback }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (hasError && fallback) {
    return <img src={fallback} alt={alt} className={className} />
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
    </div>
  )
}
```

### 5. Audio Processing Optimization

**Problem**: Audio files can cause memory leaks and performance issues

**Solution**:

```typescript
// src/hooks/useAudioManager.ts
import { useCallback, useEffect, useRef } from 'react'

export function useAudioManager() {
  const audioContext = useRef<AudioContext | null>(null)
  const audioBuffers = useRef<Map<string, AudioBuffer>>(new Map())
  const activeAudio = useRef<HTMLAudioElement | null>(null)

  const createAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContext.current
  }, [])

  const loadAudio = useCallback(async (url: string): Promise<AudioBuffer> => {
    const context = createAudioContext()
    
    // Check cache first
    if (audioBuffers.current.has(url)) {
      return audioBuffers.current.get(url)!
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await context.decodeAudioData(arrayBuffer)
      
      // Cache the buffer
      audioBuffers.current.set(url, audioBuffer)
      
      return audioBuffer
    } catch (error) {
      console.error('Failed to load audio:', error)
      throw error
    }
  }, [createAudioContext])

  const playAudio = useCallback(async (url: string) => {
    // Stop any currently playing audio
    if (activeAudio.current) {
      activeAudio.current.pause()
      activeAudio.current.currentTime = 0
    }

    const audio = new Audio(url)
    activeAudio.current = audio
    
    try {
      await audio.play()
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (activeAudio.current) {
      activeAudio.current.pause()
      activeAudio.current.currentTime = 0
      activeAudio.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      audioContext.current?.close()
      audioBuffers.current.clear()
    }
  }, [stopAudio])

  return {
    loadAudio,
    playAudio,
    stopAudio
  }
}
```

### 6. Bundle Analysis and Optimization

**Build Configuration Updates**:

```typescript
// vite.config.ts - Enhanced build configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'audio-vendor': ['wavesurfer.js'],
          'visualization-vendor': ['d3'],
          
          // Feature chunks
          'studio': [
            './src/components/studio/PodcastStudio.tsx',
            './src/components/studio/MindMapStudio.tsx',
            './src/components/studio/VideoStudio.tsx'
          ],
          'voice': [
            './src/components/VoiceTraining.tsx',
            './src/services/localVoiceService.ts'
          ]
        }
      }
    },
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@tanstack/react-query']
  }
})
```

## Performance Monitoring

### Web Vitals Tracking
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function trackWebVitals() {
  getCLS(console.log)
  getFID(console.log)
  getFCP(console.log)
  getLCP(console.log)
  getTTFB(console.log)
}

// Call in main.tsx
trackWebVitals()
```

## Implementation Priority

1. **High Impact**: Code splitting for studio components, memoization of chat messages
2. **Medium Impact**: Virtual scrolling, audio optimization  
3. **Low Impact**: Image optimization, bundle analysis tooling

## Expected Performance Gains

- **Initial Load Time**: 40-60% reduction through code splitting
- **Runtime Performance**: 30-50% fewer re-renders with memoization
- **Memory Usage**: 50-70% reduction with proper audio cleanup
- **Bundle Size**: 30-40% smaller with proper chunking