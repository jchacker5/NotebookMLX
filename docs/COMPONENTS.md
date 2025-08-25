# Component Documentation

This document provides comprehensive documentation for all React components in the NotebookMLX frontend application, including prop interfaces, usage examples, and best practices.

## Component Architecture

The NotebookMLX frontend follows a component-based architecture with the following organization:

```
src/components/
├── Layout Components (Header, Breadcrumb)
├── Panel Components (SourcesPanel, ChatPanel, StudioPanel)
├── Modal Components (ExportModal, NewSourceModal)
├── Studio Components (PodcastStudio, MindMapStudio, etc.)
├── Input Components (VoiceSelector, ModelSelector)
├── Display Components (Toast, VideoOverview)
├── UI Components (Tabs, ErrorBoundary)
└── Utility Components
```

## Component Guidelines

### TypeScript Standards
- All components must have proper TypeScript interfaces for props
- Use discriminated unions for variant props
- Prefer type imports: `import type { ComponentProps } from './types'`
- Export both component and props interface

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when appropriate
- Follow the single responsibility principle

### Styling Guidelines
- Use Tailwind CSS classes consistently
- Support dark mode with CSS variables
- Provide responsive design support
- Use semantic HTML elements

## Core Components

### Header

Main application header with navigation and actions.

**Location:** `src/components/Header.tsx`

**Props Interface:**
```typescript
interface HeaderProps extends BaseComponentProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  showExport?: boolean
  onExport?: () => void
  actions?: ReactNode
}
```

**Usage Example:**
```tsx
import { Header } from '@/components/Header'

function MyPage() {
  return (
    <Header
      title="Machine Learning Research"
      showBack={true}
      onBack={() => navigate('/notebooks')}
      showExport={true}
      onExport={() => setShowExportModal(true)}
      actions={
        <button className="btn-secondary">
          Settings
        </button>
      }
    />
  )
}
```

**Features:**
- Responsive design with mobile-first approach
- Accessibility support with proper ARIA labels
- Keyboard navigation support
- Icon integration with lucide-react

**Styling:**
- Uses semantic header element
- Supports light/dark theme
- Consistent spacing with design system
- Proper focus indicators

### Breadcrumb

Navigation breadcrumb component for hierarchical navigation.

**Location:** `src/components/Breadcrumb.tsx`

**Props Interface:**
```typescript
interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
}

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  active?: boolean
}
```

**Usage Example:**
```tsx
import { Breadcrumb } from '@/components/Breadcrumb'
import { ChevronRight } from 'lucide-react'

function MyPage() {
  const breadcrumbItems = [
    { label: 'Notebooks', onClick: () => navigate('/notebooks') },
    { label: 'Machine Learning', onClick: () => navigate('/notebook/123') },
    { label: 'Analysis', active: true }
  ]

  return (
    <Breadcrumb
      items={breadcrumbItems}
      separator={<ChevronRight className="h-4 w-4" />}
    />
  )
}
```

### SourcesPanel

Panel for managing document sources and selections.

**Location:** `src/components/SourcesPanel.tsx`

**Props Interface:**
```typescript
interface SourcesPanelProps extends BaseComponentProps {
  sources?: Source[]
  selectedSources?: string[]
  onSourceSelect?: CallbackProp<string[]>
  onAddSource?: () => void
  onRemoveSource?: CallbackProp<string>
  onRefresh?: () => void
}
```

**Usage Example:**
```tsx
import { SourcesPanel } from '@/components/SourcesPanel'
import { useStore } from '@/store/useStore'

function MyApp() {
  const { sources, selectedSources, toggleSourceSelection } = useStore()

  return (
    <SourcesPanel
      sources={sources}
      selectedSources={selectedSources}
      onSourceSelect={(sourceIds) => {
        // Handle multiple source selection
        sourceIds.forEach(id => toggleSourceSelection(id))
      }}
      onAddSource={() => setShowUploadModal(true)}
      onRemoveSource={(sourceId) => removeSource(sourceId)}
      onRefresh={() => refreshSources()}
    />
  )
}
```

**Features:**
- Drag and drop file upload
- Multiple source selection
- File type filtering
- Search and filtering capabilities
- Real-time status updates

### ChatPanel

Main chat interface for interacting with sources.

**Location:** `src/components/ChatPanel.tsx`

**Props Interface:**
```typescript
interface ChatPanelProps extends BaseComponentProps {
  messages?: ChatMessage[]
  loading?: boolean
  onSendMessage?: CallbackProp<string>
  onClearChat?: () => void
  onExportChat?: () => void
  selectedSources?: string[]
}
```

**Usage Example:**
```tsx
import { ChatPanel } from '@/components/ChatPanel'
import { useChatHook } from '@/hooks/useChat'

function MyApp() {
  const { messages, sendMessage, loading, clearMessages } = useChatHook()
  const { selectedSources } = useStore()

  return (
    <ChatPanel
      messages={messages}
      loading={loading}
      onSendMessage={sendMessage}
      onClearChat={clearMessages}
      onExportChat={() => setShowExportModal(true)}
      selectedSources={selectedSources}
    />
  )
}
```

**Features:**
- Real-time message streaming
- Citation display and linking
- Markdown message rendering
- Message history management
- Export functionality

### ExportModal

Unified modal for exporting content in various formats.

**Location:** `src/components/ExportModal.tsx`

**Props Interface:**
```typescript
interface ExportModalProps extends BaseComponentProps {
  onClose: () => void
  exportTypes?: ExportType[]
  messages?: ChatMessage[]
  podcastTasks?: PodcastTask[]
}
```

**Usage Example:**
```tsx
import { ExportModal } from '@/components/ExportModal'

function MyApp() {
  const [showExport, setShowExport] = useState(false)
  const { messages } = useChatHook()
  const { podcastTasks } = useStore()

  return (
    <>
      <button onClick={() => setShowExport(true)}>
        Export
      </button>
      
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          messages={messages}
          podcastTasks={podcastTasks}
          exportTypes={[
            { id: 'pdf', label: 'PDF Document', extension: 'pdf', mimeType: 'application/pdf' },
            { id: 'html', label: 'HTML Page', extension: 'html', mimeType: 'text/html' },
            { id: 'markdown', label: 'Markdown', extension: 'md', mimeType: 'text/markdown' }
          ]}
        />
      )}
    </>
  )
}
```

## Studio Components

### PodcastStudio

Component for generating and managing podcast creation.

**Location:** `src/components/studio/PodcastStudio.tsx`

**Props Interface:**
```typescript
interface PodcastStudioProps extends BaseComponentProps {
  sources?: Source[]
  selectedSources?: string[]
  voices?: Voice[]
  currentTask?: PodcastTask
  onGenerate?: (config: PodcastGenerationConfig) => void
  onCancel?: CallbackProp<string>
  onExport?: CallbackProp<string>
}
```

**Usage Example:**
```tsx
import { PodcastStudio } from '@/components/studio/PodcastStudio'

function StudioPanel() {
  const { sources, selectedSources, voices, podcastTask } = useStore()

  const handleGenerate = (config: PodcastGenerationConfig) => {
    generatePodcast(selectedSources, config)
  }

  return (
    <PodcastStudio
      sources={sources}
      selectedSources={selectedSources}
      voices={voices}
      currentTask={podcastTask}
      onGenerate={handleGenerate}
      onCancel={(taskId) => cancelPodcastGeneration(taskId)}
      onExport={(taskId) => exportPodcast(taskId)}
    />
  )
}
```

### MindMapStudio

Component for generating and visualizing mind maps.

**Location:** `src/components/studio/MindMapStudio.tsx`

**Props Interface:**
```typescript
interface MindMapStudioProps extends BaseComponentProps {
  data?: MindMapData
  onGenerate?: () => void
  onExport?: () => void
  onNodeSelect?: CallbackProp<string>
  onNodeEdit?: CallbackProp<{ id: string; label: string }>
}
```

**Usage Example:**
```tsx
import { MindMapStudio } from '@/components/studio/MindMapStudio'

function StudioPanel() {
  const { mindmapData } = useStore()

  return (
    <MindMapStudio
      data={mindmapData}
      onGenerate={() => generateMindMap(selectedSources)}
      onExport={() => exportMindMap()}
      onNodeSelect={(nodeId) => highlightNode(nodeId)}
      onNodeEdit={({ id, label }) => updateNodeLabel(id, label)}
    />
  )
}
```

## Input Components

### VoiceSelector

Component for selecting and managing voice options.

**Location:** `src/components/VoiceSelector.tsx`

**Props Interface:**
```typescript
interface VoiceSelectorProps extends BaseComponentProps, DisableableProps {
  voices?: Voice[]
  selectedVoice?: string
  onVoiceSelect?: CallbackProp<string>
  onPlaySample?: CallbackProp<string>
  typeFilter?: Voice['type'][]
}
```

**Usage Example:**
```tsx
import { VoiceSelector } from '@/components/VoiceSelector'

function PodcastSettings() {
  const { voices } = useStore()
  const [selectedVoice, setSelectedVoice] = useState<string>()

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Speaker 1 Voice</label>
      <VoiceSelector
        voices={voices}
        selectedVoice={selectedVoice}
        onVoiceSelect={setSelectedVoice}
        onPlaySample={(voiceId) => playVoiceSample(voiceId)}
        typeFilter={['built-in', 'custom']}
      />
    </div>
  )
}
```

### ModelSelector

Component for selecting ML models.

**Location:** `src/components/ModelSelector.tsx`

**Props Interface:**
```typescript
interface ModelSelectorProps extends BaseComponentProps, DisableableProps {
  models?: ModelInfo[]
  selectedModel?: string
  onModelSelect?: CallbackProp<string>
  categoryFilter?: string[]
}
```

**Usage Example:**
```tsx
import { ModelSelector } from '@/components/ModelSelector'

function ModelSettings() {
  const [selectedModel, setSelectedModel] = useState<string>()

  const models = [
    {
      id: 'qwen-1.5b',
      name: 'Qwen2.5-1.5B-Instruct',
      category: 'text-generation',
      size: '1.5B',
      memory: '2GB',
      available: true
    }
  ]

  return (
    <ModelSelector
      models={models}
      selectedModel={selectedModel}
      onModelSelect={setSelectedModel}
      categoryFilter={['text-generation', 'embedding']}
    />
  )
}
```

## Display Components

### Toast

Notification component for user feedback.

**Location:** `src/components/Toast.tsx`

**Props Interface:**
```typescript
interface ToastProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}
```

**Usage Example:**
```tsx
import { Toast } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

function MyApp() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          action={toast.action}
        />
      ))}
    </div>
  )
}
```

### ErrorBoundary

Error boundary component for handling React errors gracefully.

**Location:** `src/components/ErrorBoundary.tsx`

**Props Interface:**
```typescript
interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: any) => void
}

interface ErrorFallbackProps {
  error: Error
  retry: () => void
}
```

**Usage Example:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App error:', error, errorInfo)
        // Send to error reporting service
      }}
      fallback={({ error, retry }) => (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
          <button onClick={retry}>Try again</button>
        </div>
      )}
    >
      <MainApp />
    </ErrorBoundary>
  )
}
```

## UI Components

### Tabs

Reusable tabs component for organizing content.

**Location:** `src/components/ui/Tabs.tsx`

**Props Interface:**
```typescript
interface TabsProps extends BaseComponentProps {
  items: TabItem[]
  activeTab: string
  onTabChange: CallbackProp<string>
  orientation?: 'horizontal' | 'vertical'
}

interface TabItem {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
  badge?: string | number
}
```

**Usage Example:**
```tsx
import { Tabs } from '@/components/ui/Tabs'

function MyComponent() {
  const [activeTab, setActiveTab] = useState('tab1')

  const tabItems = [
    {
      id: 'tab1',
      label: 'Overview',
      content: <OverviewContent />,
      badge: '3'
    },
    {
      id: 'tab2',
      label: 'Settings',
      content: <SettingsContent />
    }
  ]

  return (
    <Tabs
      items={tabItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      orientation="horizontal"
    />
  )
}
```

## Hooks and State Management

### Component State Patterns

**Local State:**
```tsx
// Simple local state
const [isOpen, setIsOpen] = useState(false)

// Complex local state with useReducer
const [state, dispatch] = useReducer(componentReducer, initialState)
```

**Global State with Zustand:**
```tsx
// Access global state
const { sources, addSource, removeSource } = useStore()

// Subscribe to specific state slices
const sources = useStore(state => state.sources)
```

**API State with React Query:**
```tsx
// Fetch data with caching
const { data: sources, isLoading, error } = useQuery({
  queryKey: ['sources'],
  queryFn: fetchSources
})

// Mutations with optimistic updates
const uploadMutation = useMutation({
  mutationFn: uploadSource,
  onSuccess: (newSource) => {
    queryClient.setQueryData(['sources'], old => [...old, newSource])
  }
})
```

## Testing Guidelines

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../Header'

describe('Header Component', () => {
  it('renders title correctly', () => {
    render(<Header title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = jest.fn()
    render(<Header title="Test" showBack onBack={onBack} />)
    
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('supports custom test IDs', () => {
    render(<Header title="Test" testId="custom-header" />)
    expect(screen.getByTestId('custom-header')).toBeInTheDocument()
  })
})
```

### Accessibility Testing

```tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Header title="Test Title" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## Performance Guidelines

### Component Optimization

**React.memo for Pure Components:**
```tsx
import React from 'react'

interface PureComponentProps {
  data: string[]
  onSelect: (item: string) => void
}

export const PureComponent = React.memo<PureComponentProps>(({ data, onSelect }) => {
  return (
    <div>
      {data.map(item => (
        <button key={item} onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
    </div>
  )
})
```

**useCallback for Event Handlers:**
```tsx
const handleSubmit = useCallback((formData: FormData) => {
  // Handle form submission
  onSubmit(formData)
}, [onSubmit])
```

**useMemo for Expensive Calculations:**
```tsx
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0)
}, [data])
```

### Bundle Optimization

**Lazy Loading Components:**
```tsx
import { lazy, Suspense } from 'react'

const LazyStudioPanel = lazy(() => import('./StudioPanel'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyStudioPanel />
    </Suspense>
  )
}
```

## Best Practices Summary

### Code Organization
- Group related components in directories
- Use index files for clean imports
- Separate concerns (logic, presentation, state)
- Create reusable utility functions

### TypeScript Usage
- Define strict prop interfaces
- Use discriminated unions for variants
- Leverage generic types where appropriate
- Prefer type imports for better tree-shaking

### Performance
- Use React.memo judiciously
- Optimize re-renders with useCallback/useMemo
- Implement lazy loading for large components
- Monitor bundle size and performance metrics

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Support keyboard navigation
- Test with screen readers

### Error Handling
- Implement error boundaries
- Provide meaningful error messages
- Handle loading and error states
- Use TypeScript for better error prevention

This documentation should be updated as components evolve and new patterns emerge. Each component should have comprehensive tests and follow the established patterns for consistency across the application.