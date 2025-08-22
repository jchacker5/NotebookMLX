import { useState, useEffect } from 'react'
import { SourcesPanel } from './components/SourcesPanel'
import { ChatPanel } from './components/ChatPanel'
import { StudioPanel } from './components/StudioPanel'
import { NotebooksPage } from './components/NotebooksPage'

function App() {
  const [activePanel] = useState<'chat' | 'studio'>('chat')
  const [currentView, setCurrentView] = useState<'notebooks' | 'notebook'>('notebooks')
  const [currentNotebookId, setCurrentNotebookId] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're viewing a specific notebook
    const path = window.location.pathname
    if (path.startsWith('/notebook/')) {
      const id = path.split('/notebook/')[1]
      setCurrentNotebookId(id)
      setCurrentView('notebook')
    }
  }, [])

  if (currentView === 'notebooks') {
    return <NotebooksPage />
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sources Panel - Left */}
      <div className="w-80 border-r border-border">
        <SourcesPanel />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'chat' ? (
            <ChatPanel />
          ) : (
            <StudioPanel />
          )}
        </div>
      </div>
    </div>
  )
}

export default App