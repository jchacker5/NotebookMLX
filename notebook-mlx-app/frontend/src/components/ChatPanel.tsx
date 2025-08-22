import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Download } from 'lucide-react'
import { useStore } from '../store/useStore'
import { chatWithSources } from '../services/api'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { ExportModal } from './ExportModal'

export function ChatPanel() {
  const [input, setInput] = useState('')
  const [showExport, setShowExport] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, selectedSources, addMessage, isLoading, setLoading } = useStore()

  const chatMutation = useMutation({
    mutationFn: (message: string) => chatWithSources(message, selectedSources),
    onMutate: (message) => {
      setLoading(true)
      addMessage({
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      })
    },
    onSuccess: (data) => {
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        citations: data.citations,
        timestamp: new Date(),
      })
      setLoading(false)
    },
    onError: () => {
      setLoading(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && selectedSources.length > 0) {
      chatMutation.mutate(input)
      setInput('')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="text-sm text-muted-foreground">Chat</div>
        <button
          onClick={() => setShowExport(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-secondary hover:bg-secondary/80"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Start a conversation</p>
            <p className="text-sm">Select sources from the left panel and ask questions</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
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
                  
                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.citations.map((citation, idx) => (
                          <span
                            key={idx}
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
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-secondary rounded-lg p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        {selectedSources.length === 0 && (
          <p className="text-sm text-muted-foreground mb-2 text-center">
            Select at least one source to start chatting
          </p>
        )}
        
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your sources..."
            disabled={selectedSources.length === 0 || isLoading}
            className="flex-1 px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={selectedSources.length === 0 || isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
}
