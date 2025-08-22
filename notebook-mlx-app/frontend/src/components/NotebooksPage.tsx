import { useState, useEffect } from 'react'
import { Plus, Search, Clock, Star, MoreVertical, FileText, Mic, Video } from 'lucide-react'
import { NewSourceModal } from './NewSourceModal'

interface Notebook {
  id: string
  title: string
  description: string
  sources: number
  lastModified: string
  isFeatured?: boolean
  type: 'pdf' | 'audio' | 'video'
}

export function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewSourceModal, setShowNewSourceModal] = useState(false)
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null)

  useEffect(() => {
    // Load notebooks from API
    fetchNotebooks()
  }, [])

  const fetchNotebooks = async () => {
    // Placeholder data
    setNotebooks([
      {
        id: '1',
        title: 'Machine Learning Research',
        description: 'Collection of papers on deep learning and neural networks',
        sources: 5,
        lastModified: '2 hours ago',
        isFeatured: true,
        type: 'pdf'
      },
      {
        id: '2',
        title: 'Podcast Interviews',
        description: 'Tech podcast episodes for analysis',
        sources: 3,
        lastModified: '1 day ago',
        type: 'audio'
      },
      {
        id: '3',
        title: 'Video Lectures',
        description: 'Computer science lecture series',
        sources: 8,
        lastModified: '3 days ago',
        type: 'video'
      }
    ])
  }

  const featuredNotebooks = notebooks.filter(n => n.isFeatured)
  const recentNotebooks = notebooks.filter(n => !n.isFeatured)
  const filteredNotebooks = recentNotebooks.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5" />
      case 'audio': return <Mic className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const handleCreateNotebook = () => {
    setShowNewSourceModal(true)
  }

  const handleOpenNotebook = (id: string) => {
    // Navigate to notebook detail view
    window.location.href = `/notebook/${id}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">NotebookMLX</h1>
            </div>
            <button
              onClick={handleCreateNotebook}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white h-10 bg-[rgb(11,40,212)] hover:bg-[rgb(9,32,180)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(11,40,212)] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New notebook
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Featured Notebooks */}
        {featuredNotebooks.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Featured notebooks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  onOpen={handleOpenNotebook}
                  getIcon={getIcon}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Notebooks */}
        <section>
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Recent notebooks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                onOpen={handleOpenNotebook}
                getIcon={getIcon}
              />
            ))}
          </div>
        </section>

        {/* Empty State */}
        {notebooks.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notebooks</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new notebook.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateNotebook}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white h-10 bg-[rgb(11,40,212)] hover:bg-[rgb(9,32,180)] transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New notebook
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Source Modal */}
      {showNewSourceModal && (
        <NewSourceModal
          onClose={() => setShowNewSourceModal(false)}
          onSuccess={() => {
            setShowNewSourceModal(false)
            fetchNotebooks()
          }}
        />
      )}
    </div>
  )
}

// Notebook Card Component
function NotebookCard({ 
  notebook, 
  onOpen, 
  getIcon 
}: { 
  notebook: Notebook
  onOpen: (id: string) => void
  getIcon: (type: string) => JSX.Element
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={() => onOpen(notebook.id)}
    >
      {notebook.isFeatured && (
        <Star className="absolute top-4 right-4 h-4 w-4 text-yellow-500 fill-current" />
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {getIcon(notebook.type)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{notebook.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{notebook.sources} sources</p>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2">{notebook.description}</p>
      <p className="text-xs text-gray-500 mt-4">{notebook.lastModified}</p>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-6 top-12 bg-white rounded-md shadow-lg py-1 z-10 min-w-[120px]">
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Rename
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Duplicate
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            Delete
          </button>
        </div>
      )}
    </div>
  )
}