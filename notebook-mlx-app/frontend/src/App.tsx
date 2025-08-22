import { useState, useEffect } from 'react'
import { SourcesPanel } from './components/SourcesPanel'
import { ChatPanel } from './components/ChatPanel'
import { StudioPanel } from './components/StudioPanel'
import { NotebooksPage } from './components/NotebooksPage'
import { Header } from './components/Header'
import { Breadcrumb } from './components/Breadcrumb'

function App() {
  const [activePanel] = useState<'chat' | 'studio'>('chat')
  const [currentView, setCurrentView] = useState<'notebooks' | 'notebook'>('notebooks')
  const [currentNotebookTitle, setCurrentNotebookTitle] = useState<string>('')

  useEffect(() => {
    // Check if we're viewing a specific notebook
    const path = window.location.pathname
    if (path.startsWith('/notebook/')) {
      setCurrentView('notebook')
      // In a real app, fetch the notebook title here
      setCurrentNotebookTitle('Machine Learning Research')
    }
  }, [])

  const handleBackToNotebooks = () => {
    setCurrentView('notebooks')
    window.history.pushState({}, '', '/')
  }

  if (currentView === 'notebooks') {
    return <NotebooksPage />
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <Header 
        title={currentNotebookTitle}
        showBack={true}
        onBack={handleBackToNotebooks}
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
    </div>
  )
}

export default App