# Security Hardening for NotebookMLX Frontend

## Critical Security Issues and Solutions

### 1. Input Validation and XSS Prevention

**Current Vulnerabilities**:
- User inputs not sanitized before processing
- ReactMarkdown component potentially vulnerable to XSS
- File names and metadata not validated

**Solutions**:

#### Input Sanitization Utility
```typescript
// src/lib/security.ts
import DOMPurify from 'dompurify'

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return ''
  
  // Basic sanitization
  let sanitized = input.trim()
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"'&]/g, (match) => {
    const entityMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return entityMap[match] || match
  })
  
  return sanitized
}

export const sanitizeMarkdown = (markdown: string): string => {
  return DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['class'],
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta']
  })
}

export const validateFileName = (fileName: string): boolean => {
  // Reject dangerous file names
  const dangerousPatterns = [
    /\.\./,           // Directory traversal
    /[<>:"|?*]/,      // Windows illegal characters
    /^\./,            // Hidden files
    /\.exe$|\.bat$|\.cmd$|\.scr$|\.js$/i  // Executable extensions
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(fileName))
}
```

#### Secure ChatPanel Implementation
```typescript
// Enhanced ChatPanel with input validation
export function ChatPanel() {
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Clear previous errors
    setInputError('')
    
    // Validate input length
    if (value.length > 2000) {
      setInputError('Message too long (max 2000 characters)')
      return
    }
    
    // Sanitize input
    const sanitized = sanitizeInput(value, 2000)
    setInput(sanitized)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) {
      setInputError('Please enter a message')
      return
    }
    
    if (selectedSources.length === 0) {
      setInputError('Please select at least one source')
      return
    }
    
    // Additional validation
    const sanitizedInput = sanitizeInput(input.trim())
    if (sanitizedInput !== input.trim()) {
      setInputError('Message contains invalid characters')
      return
    }
    
    chatMutation.mutate(sanitizedInput)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages with sanitized content */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.map((message) => (
          <div key={message.id}>
            <ReactMarkdown 
              className="prose prose-sm dark:prose-invert"
              components={{
                // Override dangerous components
                script: () => null,
                iframe: () => null,
                link: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!href?.startsWith('http')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    {children}
                  </a>
                )
              }}
            >
              {sanitizeMarkdown(message.content)}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {/* Secure input form */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        {inputError && (
          <div className="text-red-500 text-sm mb-2" role="alert">
            {inputError}
          </div>
        )}
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about your sources..."
            disabled={selectedSources.length === 0 || isLoading}
            maxLength={2000}
            className="flex-1 px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            aria-label="Chat message input"
            aria-invalid={!!inputError}
            aria-describedby={inputError ? "input-error" : undefined}
          />
          <button
            type="submit"
            disabled={selectedSources.length === 0 || isLoading || !input.trim() || !!inputError}
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
    </div>
  )
}
```

### 2. File Upload Security Enhancement

```typescript
// src/lib/fileValidation.ts
export interface FileValidationResult {
  isValid: boolean
  error?: string
  sanitizedName?: string
}

export const validateFile = (file: File): FileValidationResult => {
  // Size validation
  const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // File name validation
  if (!validateFileName(file.name)) {
    return {
      isValid: false,
      error: 'Invalid file name or potentially dangerous file'
    }
  }

  // MIME type validation
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not allowed. Only PDF, TXT, and MD files are supported'
    }
  }

  // Additional PDF validation
  if (file.type === 'application/pdf') {
    const result = validatePDFFile(file)
    if (!result.isValid) {
      return result
    }
  }

  return {
    isValid: true,
    sanitizedName: sanitizeFileName(file.name)
  }
}

const validatePDFFile = (file: File): FileValidationResult => {
  // Check if file actually starts with PDF signature
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer.slice(0, 4))
      const header = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')
      
      // PDF signature: %PDF (25 50 44 46)
      if (header.startsWith('25504446')) {
        resolve({ isValid: true })
      } else {
        resolve({ 
          isValid: false, 
          error: 'File does not appear to be a valid PDF' 
        })
      }
    }
    reader.readAsArrayBuffer(file.slice(0, 4))
  })
}

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars
    .replace(/_{2,}/g, '_')            // Collapse multiple underscores
    .substring(0, 255)                 // Limit length
}
```

### 3. Secure LocalStorage Usage

```typescript
// src/lib/secureStorage.ts
export class SecureStorage {
  private static encrypt(data: string): string {
    // In a real implementation, use Web Crypto API
    // For now, just base64 encode (NOT secure, demonstration only)
    return btoa(data)
  }

  private static decrypt(data: string): string {
    try {
      return atob(data)
    } catch {
      return ''
    }
  }

  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      const encrypted = this.encrypt(serialized)
      localStorage.setItem(`nlx_${key}`, encrypted)
    } catch (error) {
      console.error('Failed to store data:', error)
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const encrypted = localStorage.getItem(`nlx_${key}`)
      if (!encrypted) return defaultValue
      
      const decrypted = this.decrypt(encrypted)
      if (!decrypted) return defaultValue
      
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to retrieve data:', error)
      return defaultValue
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(`nlx_${key}`)
  }

  static clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('nlx_'))
    keys.forEach(key => localStorage.removeItem(key))
  }
}
```

### 4. Content Security Policy (CSP) Headers

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  media-src 'self' blob:;
  connect-src 'self' ws: wss:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

### 5. URL Validation and Safe Navigation

```typescript
// src/lib/urlValidation.ts
export const isValidURL = (url: string): boolean => {
  try {
    const parsedURL = new URL(url)
    // Only allow HTTP and HTTPS
    return ['http:', 'https:'].includes(parsedURL.protocol)
  } catch {
    return false
  }
}

export const sanitizeURL = (url: string): string | null => {
  if (!isValidURL(url)) return null
  
  const parsedURL = new URL(url)
  
  // Remove potentially dangerous query parameters
  const dangerousParams = ['javascript', 'script', 'onload', 'onerror']
  dangerousParams.forEach(param => {
    parsedURL.searchParams.delete(param)
  })
  
  return parsedURL.toString()
}
```

## Implementation Steps

1. **Install security dependencies**:
   ```bash
   npm install dompurify @types/dompurify
   ```

2. **Update components** with input validation
3. **Implement file validation** in upload components  
4. **Add CSP headers** to index.html
5. **Replace localStorage** usage with SecureStorage
6. **Add security tests** with automated scanning tools

## Security Testing

- Use tools like OWASP ZAP for automated security scanning
- Implement Content Security Policy reporting
- Regular dependency updates and vulnerability scanning
- Penetration testing for file upload and input handling