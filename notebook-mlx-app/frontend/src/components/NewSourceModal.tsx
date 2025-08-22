import { useState, useRef } from 'react'
import { X, Upload, Link, Mic, FileText, Youtube, Globe, Loader2 } from 'lucide-react'

interface NewSourceModalProps {
  onClose: () => void
  onSuccess: () => void
}

type SourceType = 'file' | 'link' | 'audio' | 'text'

export function NewSourceModal({ onClose, onSuccess }: NewSourceModalProps) {
  const [selectedType, setSelectedType] = useState<SourceType>('file')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    files: [] as File[],
    url: '',
    text: ''
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }))
    }
  }

  const [error, setError] = useState<string>('')

  const handleSubmit = async () => {
    setIsUploading(true)
    setError('')
    
    try {
      // Validate input
      if (!formData.title.trim()) {
        throw new Error('Please enter a notebook title')
      }

      if (selectedType === 'file' && formData.files.length === 0) {
        throw new Error('Please select at least one file')
      }

      if (selectedType === 'link' && !formData.url.trim()) {
        throw new Error('Please enter a valid URL')
      }

      if (selectedType === 'text' && !formData.text.trim()) {
        throw new Error('Please enter some text')
      }

      // Validate file types and sizes
      if (selectedType === 'file') {
        for (const file of formData.files) {
          if (file.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error(`File ${file.name} is too large (max 50MB)`)
          }
          
          const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx']
          const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
          if (!allowedTypes.includes(fileExt)) {
            throw new Error(`File ${file.name} has an unsupported format`)
          }
        }
      }

      // Validate URL format
      if (selectedType === 'link' && formData.url) {
        try {
          new URL(formData.url)
        } catch {
          throw new Error('Please enter a valid URL (e.g., https://example.com)')
        }
      }

      // TODO: Implement actual upload logic with API calls
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onSuccess()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed unexpectedly'
      setError(errorMessage)
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const sourceTypes = [
    { id: 'file', label: 'Upload files', icon: Upload, description: 'PDFs, docs, slides, and more' },
    { id: 'link', label: 'Add link', icon: Link, description: 'Websites, YouTube videos, and more' },
    { id: 'audio', label: 'Record audio', icon: Mic, description: 'Record or upload audio files' },
    { id: 'text', label: 'Paste text', icon: FileText, description: 'Add text directly' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Add sources</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Notebook Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notebook title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a title for your notebook"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Source Type Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {sourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as SourceType)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <type.icon className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>

          {/* File Upload */}
          {selectedType === 'file' && (
            <div>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Supported: PDF, DOC, DOCX, TXT, PPT, PPTX (max 50MB each)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {formData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index)
                          }))
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link Input */}
          {selectedType === 'link' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Websites
                </div>
                <div className="flex items-center">
                  <Youtube className="h-4 w-4 mr-1" />
                  YouTube
                </div>
              </div>
            </div>
          )}

          {/* Audio Recording */}
          {selectedType === 'audio' && (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Click to start recording</p>
              <button className="px-4 py-2 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">
                Start Recording
              </button>
            </div>
          )}

          {/* Text Input */}
          {selectedType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste or type your text
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your text here..."
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading || !formData.title}
            className="px-4 py-2 h-10 bg-[rgb(11,40,212)] text-white rounded-lg hover:bg-[rgb(9,32,180)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create notebook'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}