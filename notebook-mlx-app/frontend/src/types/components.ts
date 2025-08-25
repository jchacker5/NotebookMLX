/**
 * Component Type Definitions for NotebookMLX Frontend
 * 
 * This file contains TypeScript interfaces for component props, state, and events
 * used throughout the React application.
 */

import { ReactNode, ComponentType } from 'react'
import { ChatMessage, Source, PodcastTask, MindMapData, Voice } from './api'

// ===== COMMON COMPONENT TYPES =====

/**
 * Common props available to all components
 */
export interface BaseComponentProps {
  /** Optional CSS class name */
  className?: string
  /** Optional test ID for testing */
  testId?: string
  /** Component children */
  children?: ReactNode
}

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  /** Whether the component is disabled */
  disabled?: boolean
}

/**
 * Props for components with loading states
 */
export interface LoadingProps {
  /** Whether the component is in loading state */
  loading?: boolean
  /** Custom loading text */
  loadingText?: string
}

/**
 * Generic callback prop
 */
export type CallbackProp<T = void> = (value: T) => void

// ===== LAYOUT COMPONENTS =====

/**
 * Header component props
 */
export interface HeaderProps extends BaseComponentProps {
  /** Page title */
  title: string
  /** Show back button */
  showBack?: boolean
  /** Back button click handler */
  onBack?: () => void
  /** Show export button */
  showExport?: boolean
  /** Export button click handler */
  onExport?: () => void
  /** Additional header actions */
  actions?: ReactNode
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Item label */
  label: string
  /** Optional click handler */
  onClick?: () => void
  /** Whether item is active */
  active?: boolean
}

/**
 * Breadcrumb component props
 */
export interface BreadcrumbProps extends BaseComponentProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[]
  /** Custom separator */
  separator?: ReactNode
}

/**
 * Tab item configuration
 */
export interface TabItem {
  /** Tab identifier */
  id: string
  /** Tab label */
  label: string
  /** Tab content */
  content: ReactNode
  /** Whether tab is disabled */
  disabled?: boolean
  /** Badge content for tab */
  badge?: string | number
}

/**
 * Tabs component props
 */
export interface TabsProps extends BaseComponentProps {
  /** Tab items */
  items: TabItem[]
  /** Active tab ID */
  activeTab: string
  /** Tab change handler */
  onTabChange: CallbackProp<string>
  /** Tab orientation */
  orientation?: 'horizontal' | 'vertical'
}

// ===== MODAL COMPONENTS =====

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  /** Whether modal is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Close on overlay click */
  closeOnOverlayClick?: boolean
  /** Close on escape key */
  closeOnEscape?: boolean
}

/**
 * Export modal props
 */
export interface ExportModalProps extends BaseComponentProps {
  /** Close handler */
  onClose: () => void
  /** Available export types */
  exportTypes?: ExportType[]
  /** Current chat messages */
  messages?: ChatMessage[]
  /** Available podcast tasks */
  podcastTasks?: PodcastTask[]
}

/**
 * Export type configuration
 */
export interface ExportType {
  /** Export type ID */
  id: string
  /** Display label */
  label: string
  /** File extension */
  extension: string
  /** MIME type */
  mimeType: string
  /** Export description */
  description?: string
  /** Whether type is available */
  available?: boolean
}

/**
 * New source modal props
 */
export interface NewSourceModalProps extends BaseComponentProps {
  /** Whether modal is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** File upload handler */
  onUpload: (files: File[]) => void
  /** Accepted file types */
  acceptedTypes?: string[]
  /** Maximum file size in bytes */
  maxFileSize?: number
  /** Allow multiple files */
  multiple?: boolean
}

// ===== PANEL COMPONENTS =====

/**
 * Sources panel props
 */
export interface SourcesPanelProps extends BaseComponentProps {
  /** Available sources */
  sources?: Source[]
  /** Selected source IDs */
  selectedSources?: string[]
  /** Source selection handler */
  onSourceSelect?: CallbackProp<string[]>
  /** Add source handler */
  onAddSource?: () => void
  /** Remove source handler */
  onRemoveSource?: CallbackProp<string>
  /** Refresh sources handler */
  onRefresh?: () => void
}

/**
 * Chat panel props
 */
export interface ChatPanelProps extends BaseComponentProps {
  /** Chat messages */
  messages?: ChatMessage[]
  /** Whether chat is loading */
  loading?: boolean
  /** Send message handler */
  onSendMessage?: CallbackProp<string>
  /** Clear chat handler */
  onClearChat?: () => void
  /** Export chat handler */
  onExportChat?: () => void
  /** Selected sources for context */
  selectedSources?: string[]
}

/**
 * Studio panel props
 */
export interface StudioPanelProps extends BaseComponentProps {
  /** Active studio type */
  activeStudio?: StudioType
  /** Studio type change handler */
  onStudioChange?: CallbackProp<StudioType>
  /** Available sources */
  sources?: Source[]
  /** Selected sources */
  selectedSources?: string[]
}

/**
 * Studio type
 */
export type StudioType = 'podcast' | 'mindmap' | 'video' | 'voice'

// ===== STUDIO COMPONENTS =====

/**
 * Podcast studio props
 */
export interface PodcastStudioProps extends BaseComponentProps {
  /** Available sources */
  sources?: Source[]
  /** Selected sources */
  selectedSources?: string[]
  /** Available voices */
  voices?: Voice[]
  /** Current podcast task */
  currentTask?: PodcastTask
  /** Generate podcast handler */
  onGenerate?: (config: PodcastGenerationConfig) => void
  /** Cancel generation handler */
  onCancel?: CallbackProp<string>
  /** Export podcast handler */
  onExport?: CallbackProp<string>
}

/**
 * Podcast generation configuration
 */
export interface PodcastGenerationConfig {
  /** Speaker 1 voice ID */
  speaker1Voice: string
  /** Speaker 2 voice ID */
  speaker2Voice: string
  /** Enable dramatic enhancement */
  enhanceDrama: boolean
  /** Target duration in minutes */
  targetDuration?: number
  /** Conversation style */
  style?: 'educational' | 'conversational' | 'debate' | 'interview'
}

/**
 * Mind map studio props
 */
export interface MindMapStudioProps extends BaseComponentProps {
  /** Mind map data */
  data?: MindMapData
  /** Generate mind map handler */
  onGenerate?: () => void
  /** Export mind map handler */
  onExport?: () => void
  /** Node selection handler */
  onNodeSelect?: CallbackProp<string>
  /** Node edit handler */
  onNodeEdit?: CallbackProp<{ id: string; label: string }>
}

/**
 * Video studio props
 */
export interface VideoStudioProps extends BaseComponentProps {
  /** Available podcast tasks */
  podcastTasks?: PodcastTask[]
  /** Generate video handler */
  onGenerate?: (config: VideoGenerationConfig) => void
  /** Current video generation task */
  currentTask?: any
}

/**
 * Video generation configuration
 */
export interface VideoGenerationConfig {
  /** Source podcast task ID */
  podcastTaskId: string
  /** Video template */
  template: 'simple' | 'waveform' | 'transcript' | 'custom'
  /** Background settings */
  background?: {
    /** Background color */
    color?: string
    /** Background image */
    image?: string
    /** Background video */
    video?: string
  }
  /** Text overlay settings */
  textOverlay?: {
    /** Show transcript */
    showTranscript?: boolean
    /** Font size */
    fontSize?: number
    /** Font color */
    fontColor?: string
  }
}

/**
 * Voice studio props
 */
export interface VoiceStudioProps extends BaseComponentProps {
  /** Available custom voices */
  voices?: Voice[]
  /** Voice training handler */
  onTrainVoice?: (config: VoiceTrainingConfig) => void
  /** Voice deletion handler */
  onDeleteVoice?: CallbackProp<string>
  /** Voice testing handler */
  onTestVoice?: (voiceId: string, text: string) => void
  /** Current training task */
  currentTraining?: any
}

/**
 * Voice training configuration
 */
export interface VoiceTrainingConfig {
  /** Voice name */
  name: string
  /** Training audio files */
  audioFiles: File[]
  /** Voice description */
  description?: string
  /** Training quality */
  quality: 'fast' | 'balanced' | 'high'
  /** Language code */
  language?: string
}

// ===== INPUT COMPONENTS =====

/**
 * Voice selector props
 */
export interface VoiceSelectorProps extends BaseComponentProps, DisableableProps {
  /** Available voices */
  voices?: Voice[]
  /** Selected voice ID */
  selectedVoice?: string
  /** Voice selection handler */
  onVoiceSelect?: CallbackProp<string>
  /** Play voice sample handler */
  onPlaySample?: CallbackProp<string>
  /** Voice type filter */
  typeFilter?: Voice['type'][]
}

/**
 * Model selector props
 */
export interface ModelSelectorProps extends BaseComponentProps, DisableableProps {
  /** Available models */
  models?: ModelInfo[]
  /** Selected model ID */
  selectedModel?: string
  /** Model selection handler */
  onModelSelect?: CallbackProp<string>
  /** Model category filter */
  categoryFilter?: string[]
}

/**
 * Model information
 */
export interface ModelInfo {
  /** Model ID */
  id: string
  /** Display name */
  name: string
  /** Model description */
  description?: string
  /** Model category */
  category: string
  /** Model size in parameters */
  size?: string
  /** Memory requirements */
  memory?: string
  /** Whether model is available */
  available: boolean
  /** Download progress for unavailable models */
  downloadProgress?: number
}

/**
 * File dropzone props
 */
export interface FileDropzoneProps extends BaseComponentProps, DisableableProps {
  /** File drop handler */
  onDrop: (files: File[]) => void
  /** Accepted file types */
  accept?: string[]
  /** Maximum file size */
  maxSize?: number
  /** Allow multiple files */
  multiple?: boolean
  /** Current upload progress */
  uploadProgress?: number
  /** Drop zone text */
  text?: string
  /** Subtext */
  subtext?: string
}

// ===== DISPLAY COMPONENTS =====

/**
 * Toast notification props
 */
export interface ToastProps extends BaseComponentProps {
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info'
  /** Toast title */
  title: string
  /** Toast message */
  message?: string
  /** Auto close duration (0 = no auto close) */
  duration?: number
  /** Close handler */
  onClose?: () => void
  /** Action button */
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Progress bar props
 */
export interface ProgressBarProps extends BaseComponentProps {
  /** Progress value (0-100) */
  value: number
  /** Maximum value */
  max?: number
  /** Show percentage text */
  showPercentage?: boolean
  /** Progress bar size */
  size?: 'sm' | 'md' | 'lg'
  /** Progress bar color scheme */
  color?: 'primary' | 'success' | 'warning' | 'error'
  /** Custom label */
  label?: string
}

/**
 * Audio waveform props
 */
export interface AudioWaveformProps extends BaseComponentProps {
  /** Audio URL */
  audioUrl?: string
  /** Audio blob */
  audioBlob?: Blob
  /** Waveform height */
  height?: number
  /** Waveform color */
  color?: string
  /** Progress color */
  progressColor?: string
  /** Show controls */
  showControls?: boolean
  /** Playback state change handler */
  onPlayStateChange?: CallbackProp<boolean>
  /** Current time change handler */
  onTimeChange?: CallbackProp<number>
}

/**
 * Video overview props
 */
export interface VideoOverviewProps extends BaseComponentProps {
  /** Video URL */
  videoUrl?: string
  /** Video blob */
  videoBlob?: Blob
  /** Video title */
  title?: string
  /** Video description */
  description?: string
  /** Video duration */
  duration?: number
  /** Download handler */
  onDownload?: () => void
  /** Share handler */
  onShare?: () => void
}

// ===== ERROR BOUNDARY =====

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps extends BaseComponentProps {
  /** Custom fallback component */
  fallback?: ComponentType<ErrorFallbackProps>
  /** Error handler */
  onError?: (error: Error, errorInfo: any) => void
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  /** Error object */
  error: Error
  /** Retry handler */
  retry: () => void
}

// ===== HOOK RETURN TYPES =====

/**
 * Chat hook return type
 */
export interface UseChatReturn {
  /** Chat messages */
  messages: ChatMessage[]
  /** Send message function */
  sendMessage: (message: string) => Promise<void>
  /** Clear messages function */
  clearMessages: () => void
  /** Loading state */
  loading: boolean
  /** Error state */
  error: string | null
}

/**
 * Upload hook return type
 */
export interface UseUploadReturn {
  /** Upload function */
  upload: (files: File[]) => Promise<Source[]>
  /** Upload progress */
  progress: number
  /** Upload status */
  status: 'idle' | 'uploading' | 'completed' | 'error'
  /** Error message */
  error: string | null
  /** Cancel upload function */
  cancel: () => void
}

/**
 * Task polling hook return type
 */
export interface UseTaskPollingReturn<T = any> {
  /** Current task data */
  task: T | null
  /** Loading state */
  loading: boolean
  /** Error state */
  error: string | null
  /** Start polling function */
  startPolling: (taskId: string) => void
  /** Stop polling function */
  stopPolling: () => void
  /** Refresh task function */
  refresh: () => void
}