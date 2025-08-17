import { useState } from 'react'
import { SourcesPanel } from './components/SourcesPanel'
import { ChatPanel } from './components/ChatPanel'
import { StudioPanel } from './components/StudioPanel'

function App() {
  const [activePanel, setActivePanel] = useState<'chat' | 'studio'>('chat')

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sources Panel - Left */}
      <div className="w-80 border-r border-border">
        <SourcesPanel />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-6">
          <h1 className="text-xl font-semibold">NotebookMLX</h1>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setActivePanel('chat')}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                activePanel === 'chat'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActivePanel('studio')}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                activePanel === 'studio'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              Studio
            </button>
          </div>
        </header>

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