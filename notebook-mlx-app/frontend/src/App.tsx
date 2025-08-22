import { useState, useEffect, Suspense, lazy, memo, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load heavy components for better initial bundle size
const SourcesPanel = lazy(() => import('./components/SourcesPanel').then(module => ({ default: module.SourcesPanel })))
const ChatPanel = lazy(() => import('./components/ChatPanel').then(module => ({ default: module.ChatPanel })))
const StudioPanel = lazy(() => import('./components/StudioPanel').then(module => ({ default: module.StudioPanel })))
const NotebooksPage = lazy(() => import('./components/NotebooksPage').then(module => ({ default: module.NotebooksPage })))
const ExportModal = lazy(() => import('./components/ExportModal').then(module => ({ default: module.ExportModal })))

// Keep lightweight components as regular imports
import { Header } from './components/Header'
import { Breadcrumb } from './components/Breadcrumb'

// Loading fallback component
const PageLoading = memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
))
PageLoading.displayName = 'PageLoading'

const App = memo(() => {
  const [activePanel, setActivePanel] = useState<'chat' | 'studio'>('chat')
  const [currentView, setCurrentView] = useState<'notebooks' | 'notebook'>('notebooks')
  const [currentNotebookTitle, setCurrentNotebookTitle] = useState<string>('')
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    // Check if we're viewing a specific notebook
    const path = window.location.pathname
    if (path.startsWith('/notebook/')) {
      setCurrentView('notebook')
      // In a real app, fetch the notebook title here
      setCurrentNotebookTitle('Machine Learning Research')
    }
  }, [])

  const handleBackToNotebooks = useCallback(() => {
    setCurrentView('notebooks')
    window.history.pushState({}, '', '/')
  }, [])

  const handleSetActivePanel = useCallback((panel: 'chat' | 'studio') => {
    setActivePanel(panel)
  }, [])

  const handleShowExport = useCallback(() => {
    setShowExport(true)
  }, [])

  const handleCloseExport = useCallback(() => {
    setShowExport(false)
  }, [])

  if (currentView === 'notebooks') {
    return (
      <Suspense fallback={<PageLoading />}>
        <NotebooksPage />
      </Suspense>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <Header 
        title={currentNotebookTitle}
        showBack={true}
        onBack={handleBackToNotebooks}
        onExport={handleShowExport}
      />
      
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Notebooks', onClick: handleBackToNotebooks },
          { label: currentNotebookTitle }
        ]}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sources Panel - Left (narrower per design review) */}
        <div className="w-72 border-r border-border">
          <Suspense fallback={<PageLoading />}>
            <SourcesPanel />
          </Suspense>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<PageLoading />}>
              {activePanel === 'chat' ? (
                <ChatPanel />
              ) : (
                <StudioPanel />
              )}
            </Suspense>
          </div>
          <div className="border-t border-border p-2 flex items-center gap-2">
            <button
              onClick={() => handleSetActivePanel('chat')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${activePanel === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            >
              Chat
            </button>
            <button
              onClick={() => handleSetActivePanel('studio')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${activePanel === 'studio' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            >
              Studio
            </button>
          </div>
        </div>
      </div>
      {showExport && (
        <Suspense fallback={<PageLoading />}>
          <ExportModal onClose={handleCloseExport} />
        </Suspense>
      )}
    </div>
  )
})
App.displayName = 'App'

export default App
