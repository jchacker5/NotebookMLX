// Performance utilities for NotebookMLX

export interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
}

// Core Web Vitals measurement
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.metrics.lcp = lastEntry.startTime
          this.reportMetric('LCP', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
            this.reportMetric('FID', entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cls = clsValue
          this.reportMetric('CLS', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime
              this.reportMetric('FCP', entry.startTime)
            }
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (e) {
        console.warn('FCP observer not supported')
      }
    }

    // Time to First Byte
    this.measureTTFB()
  }

  private measureTTFB() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as any
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart
        this.reportMetric('TTFB', navigation.responseStart - navigation.requestStart)
      }
    }
  }

  private reportMetric(name: string, value: number) {
    console.log(`${name}: ${Math.round(value)}ms`)
    
    // Send to analytics if available
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(value)
      })
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Resource hints utility
export function addResourceHints() {
  const head = document.head

  // Preconnect to external domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ]

  preconnectDomains.forEach(domain => {
    if (!head.querySelector(`link[href="${domain}"]`)) {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      if (domain.includes('gstatic')) {
        link.crossOrigin = 'anonymous'
      }
      head.appendChild(link)
    }
  })
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    })
  }
}

// Bundle size analysis
export function logBundleInfo() {
  if ('performance' in window) {
    const resources = performance.getEntriesByType('resource')
    const jsResources = resources.filter((resource: any) => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    )
    
    console.log('JS Bundle Analysis:')
    jsResources.forEach((resource: any) => {
      console.log(`${resource.name}: ${Math.round(resource.transferSize / 1024)}KB`)
    })
  }
}

// Image optimization helper
export function optimizeImages() {
  const images = document.querySelectorAll('img')
  
  images.forEach(img => {
    // Add loading="lazy" for images below the fold
    if (!img.hasAttribute('loading')) {
      const rect = img.getBoundingClientRect()
      if (rect.top > window.innerHeight) {
        img.loading = 'lazy'
      }
    }
    
    // Add decoding="async" for better performance
    if (!img.hasAttribute('decoding')) {
      img.decoding = 'async'
    }
  })
}

// Debounce utility for performance-sensitive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// Throttle utility for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Virtual scrolling helper
export function createVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex),
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  const monitor = new PerformanceMonitor()
  
  // Add resource hints
  addResourceHints()
  
  // Log bundle info after load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logBundleInfo()
      monitorMemoryUsage()
      optimizeImages()
    }, 1000)
  })
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    monitor.disconnect()
  })
  
  return monitor
}