import { useMemo, useState } from 'react'
import { X, Download, FileText, Mic, Video } from 'lucide-react'
import { useStore } from '../store/useStore'
import { exportChatPdf, exportChatHtml } from '../services/api'
import { useToast } from './Toast'

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { messages, podcastTask } = useStore()
  const { notify } = useToast()
  const [title, setTitle] = useState('Chat Export')
  const [coverDataUrl, setCoverDataUrl] = useState<string | undefined>(undefined)
  const [mdFilename, setMdFilename] = useState('chat_export')
  const [includeCitations, setIncludeCitations] = useState(false)

  const chatForExport = useMemo(() => {
    return messages.map((m) => ({
      role: m.role,
      content:
        includeCitations && m.citations && m.citations.length > 0
          ? `${m.content}\n\nSources: ${m.citations.map((c) => c.filename).join(', ')}`
          : m.content,
    }))
  }, [messages, includeCitations])

  const handleExportChatPdf = async () => {
    const blob = await exportChatPdf(title || 'Chat Export', chatForExport, coverDataUrl)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'chat_export').replace(/\s+/g, '_').toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    notify('Chat PDF exported')
  }

  const handleExportChatHtml = async () => {
    const blob = await exportChatHtml(title || 'Chat Export', chatForExport)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'chat_export').replace(/\s+/g, '_').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
    notify('Chat HTML exported')
  }

  const audioHref = podcastTask?.task_id
    ? `/api/download/podcasts/${podcastTask.task_id}.wav`
    : undefined
  const videoHref = podcastTask?.task_id
    ? `/api/download/videos/${podcastTask.task_id}.mp4`
    : undefined
  const podcastZipHref = podcastTask?.task_id
    ? `/api/export/podcast/${podcastTask.task_id}.zip`
    : undefined

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Export</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chat Export"
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex items-center gap-2 mt-2">
              <input id="inc-cites" type="checkbox" checked={includeCitations} onChange={(e) => setIncludeCitations(e.target.checked)} />
              <label htmlFor="inc-cites" className="text-sm">Include citations</label>
            </div>
            <label className="block text-sm font-medium mt-2">Optional cover image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  const reader = new FileReader()
                  reader.onload = () => setCoverDataUrl(reader.result as string)
                  reader.readAsDataURL(f)
                }
              }}
            />
          </div>
          <button
            onClick={handleExportChatPdf}
            className="w-full flex items-center gap-3 p-3 border rounded hover:bg-black/5"
          >
            <FileText className="w-5 h-5" /> Export chat as PDF
          </button>
          <button
            onClick={handleExportChatHtml}
            className="w-full flex items-center gap-3 p-3 border rounded hover:bg-black/5"
          >
            <FileText className="w-5 h-5" /> Export chat as HTML
          </button>
          <button
            onClick={async () => {
              const blob = await (await import('../services/api')).exportChatMd(title || 'Chat Export', chatForExport)
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${(mdFilename || 'chat_export').replace(/\s+/g, '_').toLowerCase()}.md`
              a.click()
              URL.revokeObjectURL(url)
              notify('Chat Markdown exported')
            }}
            className="w-full flex items-center gap-3 p-3 border rounded hover:bg-black/5"
          >
            <FileText className="w-5 h-5" /> Export chat as Markdown
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm">Markdown filename</label>
            <input value={mdFilename} onChange={(e) => setMdFilename(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
          </div>
          <button
            onClick={() => {
              const payload = { title, messages: chatForExport }
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${(title || 'chat_export').replace(/\s+/g, '_').toLowerCase()}.json`
              a.click()
              URL.revokeObjectURL(url)
              notify('Chat JSON exported')
            }}
            className="w-full flex items-center gap-3 p-3 border rounded hover:bg-black/5"
          >
            <FileText className="w-5 h-5" /> Export chat as JSON
          </button>

          <div className="grid grid-cols-1 gap-3">
            <a
              className={`flex items-center gap-3 p-3 border rounded ${!audioHref ? 'opacity-50 pointer-events-none' : 'hover:bg-black/5'}`}
              href={audioHref}
              download
              onClick={() => notify('Audio download started')}
            >
              <Mic className="w-5 h-5" /> Download podcast audio (WAV)
            </a>
            <a
              className={`flex items-center gap-3 p-3 border rounded ${!videoHref ? 'opacity-50 pointer-events-none' : 'hover:bg-black/5'}`}
              href={videoHref}
              download
              onClick={() => notify('Video download started')}
            >
              <Video className="w-5 h-5" /> Download video (MP4)
            </a>
            <a
              className={`flex items-center gap-3 p-3 border rounded ${!podcastZipHref ? 'opacity-50 pointer-events-none' : 'hover:bg-black/5'}`}
              href={podcastZipHref}
              download
              onClick={() => notify('Podcast bundle download started')}
            >
              <Download className="w-5 h-5" /> Export podcast bundle (ZIP)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
