import { ArrowLeft, Settings, HelpCircle, User, Download } from 'lucide-react'

interface HeaderProps {
  title: string
  onBack?: () => void
  showBack?: boolean
  onExport?: () => void
}

export function Header({ title, onBack, showBack = false, onExport }: HeaderProps) {
  const handleHelpClick = () => {
    // Open user guide in a new tab
    // In production, this could point to hosted documentation
    window.open('https://github.com/jchacker5/NotebookMLX/blob/main/docs/USER_GUIDE.md', '_blank')
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <h1 className="text-lg font-medium text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center space-x-2">
        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-2"
            data-testid="header-export-button"
          >
            <Download className="h-4 w-4 text-gray-700" />
            <span>Export</span>
          </button>
        )}
        <button
          onClick={handleHelpClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Open User Guide"
        >
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="h-5 w-5 text-gray-600" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <User className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </header>
  )
}
