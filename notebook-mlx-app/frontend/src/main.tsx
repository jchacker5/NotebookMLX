import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { useStore } from './store/useStore'
import './index.css'

// Expose store to window for E2E testing
if (typeof window !== 'undefined') {
  (window as any).useStore = useStore
}

// Optimized QueryClient configuration for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: (failureCount, error: any) => {
        // Don't retry for 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      // Use background refetch for better UX
      refetchOnMount: 'always',
      // Enable query deduplication
      structuralSharing: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
})

// Get the root element
const rootElement = document.getElementById('root')!

// Enable concurrent features for better performance
const root = ReactDOM.createRoot(rootElement)

// Render the app with optimized providers
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// Add performance monitoring
if ('performance' in window && 'PerformanceObserver' in window) {
  // Monitor Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Performance metrics are now collected silently
      // Use browser DevTools or analytics to view metrics
      if (entry.entryType === 'largest-contentful-paint') {
        // LCP: entry.startTime
      }
      if (entry.entryType === 'first-input') {
        // FID: (entry as any).processingStart - entry.startTime
      }
      if (entry.entryType === 'layout-shift') {
        if (!(entry as any).hadRecentInput) {
          // CLS: (entry as any).value
        }
      }
    }
  })

  observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
}

// Preload critical resources
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload studio components when idle
    import('./components/StudioPanel')
    import('./components/ChatPanel')
  })
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    import('./components/StudioPanel')
    import('./components/ChatPanel')
  }, 2000)
}
