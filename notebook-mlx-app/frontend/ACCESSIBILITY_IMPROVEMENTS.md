# Accessibility Improvements for NotebookMLX Frontend

## Critical Accessibility Issues and Solutions

### 1. Interactive Elements Missing ARIA Labels

**Problem**: Buttons, inputs, and interactive elements lack proper accessibility attributes.

**Solutions**:

#### Chat Input Enhancement
```tsx
// Before
<input
  type="text"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Ask a question about your sources..."
/>

// After
<input
  type="text"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Ask a question about your sources..."
  aria-label="Chat message input"
  aria-describedby="chat-help-text"
  aria-disabled={selectedSources.length === 0 || isLoading}
/>
<div id="chat-help-text" className="sr-only">
  Enter your question to chat with selected document sources
</div>
```

#### Button Accessibility
```tsx
// Before
<button onClick={togglePlayPause}>
  {isPlaying ? <Pause /> : <Play />}
</button>

// After
<button 
  onClick={togglePlayPause}
  aria-label={isPlaying ? "Pause audio" : "Play audio"}
  aria-pressed={isPlaying}
  type="button"
>
  {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
</button>
```

#### File Upload Accessibility
```tsx
// Before
<div {...getRootProps()}>
  <Upload className="w-8 h-8" />
  <p>Drag & drop files or click to upload</p>
</div>

// After
<div 
  {...getRootProps()}
  role="button"
  aria-label="Upload files area"
  aria-describedby="upload-instructions"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Trigger file selection
    }
  }}
>
  <Upload className="w-8 h-8" aria-hidden="true" />
  <p id="upload-instructions">
    Drag and drop PDF, TXT, or MD files here, or click to select files
  </p>
</div>
```

### 2. Form Validation and Error Announcements

```tsx
// Add live region for dynamic announcements
export function AccessibleLiveRegion() {
  return (
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="sr-only"
      id="live-region"
    />
  )
}

// Use in components for dynamic updates
const announceToScreenReader = (message: string) => {
  const liveRegion = document.getElementById('live-region')
  if (liveRegion) {
    liveRegion.textContent = message
  }
}
```

### 3. Keyboard Navigation Support

```tsx
// Enhanced modal with proper focus management
export function AccessibleModal({ onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement
    
    // Focus modal
    modalRef.current?.focus()

    // Trap focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      // Implement focus trap logic
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore previous focus
      previousFocusRef.current?.focus()
    }
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div 
        ref={modalRef}
        className="relative bg-white rounded-lg"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}
```

### 4. Screen Reader Only Content

```css
/* Add to index.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 5. Color Contrast and Visual Accessibility

**Current Issues**:
- Ensure all text meets WCAG AA contrast ratios (4.5:1)
- Add focus indicators for keyboard navigation
- Provide visual feedback for state changes

**Solutions**:
```css
/* Enhanced focus indicators */
button:focus-visible,
input:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  box-shadow: 0 0 0 2px hsl(var(--background));
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 20%;
    --muted-foreground: 0 0% 30%;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Priority

1. **High Priority**: Interactive element ARIA labels, keyboard navigation
2. **Medium Priority**: Form validation, error announcements  
3. **Low Priority**: Enhanced color contrast, reduced motion support

## Testing Recommendations

1. **Screen Reader Testing**: Test with NVDA, JAWS, and VoiceOver
2. **Keyboard Navigation**: Ensure all functionality available via keyboard
3. **Contrast Analysis**: Use tools like axe-core or Lighthouse
4. **Automated Testing**: Integrate @axe-core/react for continuous accessibility testing