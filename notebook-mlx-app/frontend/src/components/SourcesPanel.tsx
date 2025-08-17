import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, FileText, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { uploadSource } from '../services/api'
import { useMutation } from '@tanstack/react-query'

export function SourcesPanel() {
  const { sources, selectedSources, addSource, removeSource, toggleSourceSelection } = useStore()

  const uploadMutation = useMutation({
    mutationFn: uploadSource,
    onSuccess: (data) => {
      addSource({
        id: data.source_id,
        filename: data.filename,
        type: data.filename.endsWith('.pdf') ? 'pdf' : 'text',
        uploadedAt: new Date(),
      })
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file)
    })
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
  })

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-4">Sources</h2>
        
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop files here' : 'Drag & drop files or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF, TXT, MD</p>
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sources.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">No sources uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSources.includes(source.id)
                    ? 'bg-primary/20 border border-primary'
                    : 'hover:bg-secondary border border-transparent'
                }`}
                onClick={() => toggleSourceSelection(source.id)}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSource(source.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <div className="p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">Uploading and processing...</p>
        </div>
      )}
    </div>
  )
}