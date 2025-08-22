import { useState } from 'react'
import { Settings, Globe, Clock, MessageSquare, Play, Loader2 } from 'lucide-react'

interface AudioOverviewSettings {
  language: string
  length: 'short' | 'medium' | 'long' | 'custom'
  customLength: number // in minutes
  guidingPrompt: string
  voiceStyle: 'conversational' | 'professional' | 'educational' | 'casual'
  includeQuestions: boolean
  focusAreas: string[]
}

interface AudioOverviewCustomizerProps {
  onGenerate: (settings: AudioOverviewSettings) => void
  isGenerating: boolean
}

export function AudioOverviewCustomizer({ onGenerate, isGenerating }: AudioOverviewCustomizerProps) {
  const [settings, setSettings] = useState<AudioOverviewSettings>({
    language: 'en',
    length: 'medium',
    customLength: 10,
    guidingPrompt: '',
    voiceStyle: 'conversational',
    includeQuestions: true,
    focusAreas: []
  })

  const [isExpanded, setIsExpanded] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
  ]

  const lengthOptions = [
    { value: 'short', label: 'Short (~5 min)', minutes: 5 },
    { value: 'medium', label: 'Medium (~10 min)', minutes: 10 },
    { value: 'long', label: 'Long (~20 min)', minutes: 20 },
    { value: 'custom', label: 'Custom length', minutes: settings.customLength }
  ]

  const voiceStyles = [
    { value: 'conversational', label: 'Conversational', description: 'Natural, engaging dialogue' },
    { value: 'professional', label: 'Professional', description: 'Formal, business-like tone' },
    { value: 'educational', label: 'Educational', description: 'Teaching-focused approach' },
    { value: 'casual', label: 'Casual', description: 'Relaxed, informal style' }
  ]

  const suggestedPrompts = [
    'Focus on practical applications and real-world examples',
    'Explain complex concepts in simple terms',
    'Highlight the most important key takeaways',
    'Include historical context and background',
    'Emphasize recent developments and future implications',
    'Compare and contrast different approaches',
    'Provide actionable insights for implementation'
  ]

  const focusAreaOptions = [
    'Key Findings', 'Methodology', 'Results', 'Implications', 
    'Future Research', 'Practical Applications', 'Limitations',
    'Background Context', 'Related Work', 'Conclusions'
  ]

  const handleGenerate = () => {
    onGenerate(settings)
  }

  const estimatedDuration = () => {
    if (settings.length === 'custom') {
      return settings.customLength
    }
    return lengthOptions.find(opt => opt.value === settings.length)?.minutes || 10
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Audio Overview Settings</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          {isExpanded ? 'Hide Advanced' : 'Show Advanced'}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-1" />
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            {settings.language !== 'en' && (
              <p className="text-xs text-amber-600 mt-1">
                Note: Length adjustment currently only available for English
              </p>
            )}
          </div>

          {/* Length Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Overview Length
            </label>
            <select
              value={settings.length}
              onChange={(e) => setSettings(prev => ({ ...prev, length: e.target.value as any }))}
              disabled={settings.language !== 'en'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {lengthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {settings.length === 'custom' && settings.language === 'en' && (
              <div className="mt-2">
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={settings.customLength}
                  onChange={(e) => setSettings(prev => ({ ...prev, customLength: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter minutes (3-60)"
                />
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Estimated duration: ~{estimatedDuration()} minutes
            </p>
          </div>
        </div>

        {/* Guiding Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Guiding Prompt (Optional)
          </label>
          <textarea
            value={settings.guidingPrompt}
            onChange={(e) => setSettings(prev => ({ ...prev, guidingPrompt: e.target.value }))}
            placeholder="Provide specific instructions for what to focus on in the audio overview..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Suggested Prompts */}
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Suggested prompts:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setSettings(prev => ({ ...prev, guidingPrompt: prompt }))}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  "{prompt.substring(0, 30)}..."
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Voice Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {voiceStyles.map(style => (
                  <button
                    key={style.value}
                    onClick={() => setSettings(prev => ({ ...prev, voiceStyle: style.value as any }))}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      settings.voiceStyle === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Areas (Select up to 3)
              </label>
              <div className="flex flex-wrap gap-2">
                {focusAreaOptions.map(area => (
                  <button
                    key={area}
                    onClick={() => {
                      const isSelected = settings.focusAreas.includes(area)
                      if (isSelected) {
                        setSettings(prev => ({
                          ...prev,
                          focusAreas: prev.focusAreas.filter(a => a !== area)
                        }))
                      } else if (settings.focusAreas.length < 3) {
                        setSettings(prev => ({
                          ...prev,
                          focusAreas: [...prev.focusAreas, area]
                        }))
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      settings.focusAreas.includes(area)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={!settings.focusAreas.includes(area) && settings.focusAreas.length >= 3}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeQuestions}
                  onChange={(e) => setSettings(prev => ({ ...prev, includeQuestions: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Q&A segments</span>
              </label>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center px-4 py-3 bg-[rgb(11,40,212)] text-white rounded-lg hover:bg-[rgb(9,32,180)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Audio Overview...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Generate Audio Overview
              </>
            )}
          </button>

          {isGenerating && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center text-sm text-gray-600">
                <div className="animate-pulse mr-2">🚀</div>
                95% faster loading with optimized buffering
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}