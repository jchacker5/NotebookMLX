# Performance Monitoring and Optimization Guide

This document provides comprehensive guidelines for monitoring, measuring, and optimizing performance in the NotebookMLX application across all layers - frontend, backend, and ML workloads.

## Table of Contents

1. [Performance Monitoring Strategy](#performance-monitoring-strategy)
2. [Frontend Performance](#frontend-performance)
3. [Backend Performance](#backend-performance)
4. [ML Model Performance](#ml-model-performance)
5. [Database Performance](#database-performance)
6. [System Resource Monitoring](#system-resource-monitoring)
7. [Performance Testing](#performance-testing)
8. [Optimization Techniques](#optimization-techniques)

## Performance Monitoring Strategy

### Key Performance Indicators (KPIs)

**User Experience Metrics:**
- Time to First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

**Application Performance Metrics:**
- API Response Time: < 200ms (90th percentile)
- PDF Processing Time: < 30s for 10MB files
- Chat Response Time: < 3s
- Podcast Generation Time: < 5min for 20min content
- Memory Usage: < 2GB during normal operation
- CPU Usage: < 80% sustained load

**System Health Metrics:**
- Error Rate: < 1%
- Uptime: > 99.9%
- Database Query Time: < 50ms (95th percentile)
- File Upload Success Rate: > 99%

### Monitoring Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend Monitoring                  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Web Vitals  │  Performance API  │  User Timing │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           │
                    Performance Data
                           │
┌─────────────────────────────────────────────────────┐
│               Backend Monitoring                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Prometheus  │  FastAPI Metrics │  Custom Timers│ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           │
                    Metrics Collection
                           │
┌─────────────────────────────────────────────────────┐
│                 System Monitoring                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │    Grafana    │     Loki      │   AlertManager │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Frontend Performance

### Performance Monitoring Implementation

**Web Vitals Tracking:**
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface PerformanceMetric {
  name: string
  value: number
  delta: number
  id: string
  navigationType: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  
  constructor() {
    this.initializeWebVitals()
    this.setupPerformanceObserver()
  }
  
  private initializeWebVitals() {
    getCLS((metric) => this.reportMetric('CLS', metric))
    getFID((metric) => this.reportMetric('FID', metric))
    getFCP((metric) => this.reportMetric('FCP', metric))
    getLCP((metric) => this.reportMetric('LCP', metric))
    getTTFB((metric) => this.reportMetric('TTFB', metric))
  }
  
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Long task observer
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            this.reportLongTask(entry)
          }
        })
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.reportNavigationTiming(entry as PerformanceNavigationTiming)
        })
      })
      navObserver.observe({ entryTypes: ['navigation'] })
    }
  }
  
  private reportMetric(name: string, metric: any) {
    const perfMetric: PerformanceMetric = {
      name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'unknown'
    }
    
    this.metrics.push(perfMetric)
    this.sendToAnalytics(perfMetric)
    
    // Log performance issues
    if (this.isPerformanceIssue(name, metric.value)) {
      console.warn(`Performance issue detected: ${name} = ${metric.value}`)
    }
  }
  
  private isPerformanceIssue(name: string, value: number): boolean {
    const thresholds = {
      'CLS': 0.1,
      'FID': 100,
      'FCP': 1500,
      'LCP': 2500,
      'TTFB': 800
    }
    
    return value > (thresholds[name as keyof typeof thresholds] || Infinity)
  }
  
  private reportLongTask(entry: PerformanceEntry) {
    console.warn(`Long task detected: ${entry.duration}ms`, entry)
    this.sendToAnalytics({
      name: 'LongTask',
      value: entry.duration,
      delta: 0,
      id: entry.name,
      navigationType: 'unknown'
    })
  }
  
  private reportNavigationTiming(entry: PerformanceNavigationTiming) {
    const timing = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstPaint: 0, // Will be filled by paint timing API
    }
    
    this.sendToAnalytics({
      name: 'NavigationTiming',
      value: timing.domContentLoaded,
      delta: 0,
      id: 'navigation',
      navigationType: entry.type
    })
  }
  
  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to your analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      }).catch(console.error)
    }
  }
  
  // Custom timing for application-specific operations
  startTiming(name: string): string {
    const id = `${name}-${Date.now()}-${Math.random()}`
    performance.mark(`${id}-start`)
    return id
  }
  
  endTiming(id: string, name: string) {
    performance.mark(`${id}-end`)
    performance.measure(name, `${id}-start`, `${id}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    if (measure) {
      this.sendToAnalytics({
        name: `Custom-${name}`,
        value: measure.duration,
        delta: 0,
        id,
        navigationType: 'custom'
      })
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

**React Performance Monitoring Hook:**
```typescript
// src/hooks/usePerformanceMonitoring.ts
import { useEffect, useRef } from 'react'
import { performanceMonitor } from '@/utils/performance'

export function usePerformanceMonitoring(componentName: string) {
  const renderCount = useRef(0)
  const mountTime = useRef<number>()
  
  useEffect(() => {
    mountTime.current = performance.now()
    const timingId = performanceMonitor.startTiming(`${componentName}-mount`)
    
    return () => {
      if (mountTime.current) {
        performanceMonitor.endTiming(timingId, `${componentName}-mount`)
      }
    }
  }, [componentName])
  
  useEffect(() => {
    renderCount.current += 1
    
    // Log excessive re-renders
    if (renderCount.current > 10) {
      console.warn(`${componentName} has rendered ${renderCount.current} times`)
    }
  })
  
  const measureOperation = (operationName: string, operation: () => Promise<any> | any) => {
    const timingId = performanceMonitor.startTiming(`${componentName}-${operationName}`)
    
    try {
      const result = operation()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTiming(timingId, `${componentName}-${operationName}`)
        })
      } else {
        performanceMonitor.endTiming(timingId, `${componentName}-${operationName}`)
        return result
      }
    } catch (error) {
      performanceMonitor.endTiming(timingId, `${componentName}-${operationName}`)
      throw error
    }
  }
  
  return { measureOperation, renderCount: renderCount.current }
}
```

### Bundle Size Optimization

**Webpack Bundle Analyzer Integration:**
```typescript
// vite.config.ts additions
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    // ... existing plugins
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Critical chunks for initial load
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          
          // Feature-based chunks (lazy loaded)
          'studio-heavy': ['d3', 'wavesurfer.js'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-icons'
          ]
        }
      }
    },
    // Optimize for performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
```

**Code Splitting Strategy:**
```typescript
// src/components/LazyComponents.tsx
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

// Lazy load heavy components
const StudioPanel = lazy(() => import('./StudioPanel'))
const MindMapStudio = lazy(() => import('./studio/MindMapStudio'))
const VideoStudio = lazy(() => import('./studio/VideoStudio'))

// Loading component with performance monitoring
function ComponentLoader({ name }: { name: string }) {
  useEffect(() => {
    const timingId = performanceMonitor.startTiming(`lazy-load-${name}`)
    return () => performanceMonitor.endTiming(timingId, `lazy-load-${name}`)
  }, [name])
  
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      <span className="ml-2">Loading {name}...</span>
    </div>
  )
}

// Wrapper with error boundary and loading states
export function LazyStudioPanel() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ComponentLoader name="Studio" />}>
        <StudioPanel />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Backend Performance

### FastAPI Performance Monitoring

**Prometheus Metrics Integration:**
```python
# backend/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps
from typing import Callable

# Define metrics
REQUEST_COUNT = Counter(
    'notebookmlx_requests_total',
    'Total number of requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'notebookmlx_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'notebookmlx_active_requests',
    'Number of active requests'
)

ML_TASK_DURATION = Histogram(
    'notebookmlx_ml_task_duration_seconds',
    'ML task duration in seconds',
    ['task_type', 'model']
)

DATABASE_QUERY_DURATION = Histogram(
    'notebookmlx_database_query_duration_seconds',
    'Database query duration in seconds',
    ['operation']
)

MEMORY_USAGE = Gauge(
    'notebookmlx_memory_usage_bytes',
    'Memory usage in bytes'
)

def monitor_endpoint(func: Callable) -> Callable:
    """Decorator to monitor endpoint performance."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        ACTIVE_REQUESTS.inc()
        
        try:
            result = await func(*args, **kwargs)
            status = '200'
            return result
        except Exception as e:
            status = '500'
            raise
        finally:
            duration = time.time() - start_time
            ACTIVE_REQUESTS.dec()
            
            # Extract endpoint info from function
            endpoint = getattr(func, '__name__', 'unknown')
            method = 'GET'  # Default, should be extracted from request
            
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).inc()
            
            REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
    
    return wrapper

def monitor_ml_task(task_type: str, model: str):
    """Decorator to monitor ML task performance."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                ML_TASK_DURATION.labels(
                    task_type=task_type,
                    model=model
                ).observe(duration)
        return wrapper
    return decorator
```

**Performance Middleware:**
```python
# backend/middleware/performance.py
import time
import psutil
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from monitoring.metrics import (
    REQUEST_COUNT, REQUEST_DURATION, ACTIVE_REQUESTS, MEMORY_USAGE
)
import logging

logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, sample_rate: float = 1.0):
        super().__init__(app)
        self.sample_rate = sample_rate
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        ACTIVE_REQUESTS.inc()
        
        # Update memory usage periodically
        if hash(request.url.path) % 100 == 0:  # Sample 1% of requests
            memory_usage = psutil.Process().memory_info().rss
            MEMORY_USAGE.set(memory_usage)
        
        try:
            response = await call_next(request)
            status_code = str(response.status_code)
        except Exception as e:
            logger.error(f"Request failed: {e}")
            status_code = "500"
            response = Response(status_code=500)
        
        # Record metrics
        duration = time.time() - start_time
        ACTIVE_REQUESTS.dec()
        
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        # Add performance headers
        response.headers["X-Response-Time"] = str(duration)
        
        # Log slow requests
        if duration > 1.0:  # Log requests > 1 second
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {duration:.2f}s"
            )
        
        return response
```

### Database Performance Optimization

**Query Performance Monitoring:**
```python
# backend/utils/database.py
import time
import logging
from sqlalchemy import event, create_engine
from sqlalchemy.engine import Engine
from monitoring.metrics import DATABASE_QUERY_DURATION

logger = logging.getLogger(__name__)

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop(-1)
    
    # Extract operation type from SQL
    operation = statement.strip().split()[0].upper() if statement else 'UNKNOWN'
    
    DATABASE_QUERY_DURATION.labels(operation=operation).observe(total)
    
    # Log slow queries
    if total > 0.1:  # Log queries > 100ms
        logger.warning(f"Slow query ({total:.3f}s): {statement[:100]}...")

class DatabasePerformanceMonitor:
    def __init__(self, db_session):
        self.db_session = db_session
        self.query_count = 0
        self.total_time = 0
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.total_time = time.time() - self.start_time
        if self.total_time > 0.5:  # Log if total DB time > 500ms
            logger.warning(
                f"Database operations took {self.total_time:.3f}s "
                f"({self.query_count} queries)"
            )

# Usage in endpoints
async def get_sources_with_monitoring(db: Session = Depends(get_db)):
    with DatabasePerformanceMonitor(db) as monitor:
        sources = db.query(SourceModel).all()
        monitor.query_count = 1
        return sources
```

## ML Model Performance

### Model Inference Monitoring

**MLX Performance Tracking:**
```python
# backend/ml/performance_monitor.py
import time
import psutil
import mlx.core as mx
from typing import Dict, Any, Optional
from dataclasses import dataclass
from monitoring.metrics import ML_TASK_DURATION
import logging

logger = logging.getLogger(__name__)

@dataclass
class ModelPerformanceMetrics:
    inference_time: float
    memory_usage_mb: float
    tokens_per_second: Optional[float]
    model_name: str
    input_tokens: int
    output_tokens: int

class MLPerformanceMonitor:
    def __init__(self, model_name: str, task_type: str):
        self.model_name = model_name
        self.task_type = task_type
        self.start_time = None
        self.start_memory = None
        self.input_tokens = 0
        self.output_tokens = 0
    
    def __enter__(self):
        self.start_time = time.time()
        self.start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is None:
            return
        
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        inference_time = end_time - self.start_time
        memory_usage = end_memory - self.start_memory
        
        # Calculate tokens per second
        tokens_per_second = None
        if self.output_tokens > 0 and inference_time > 0:
            tokens_per_second = self.output_tokens / inference_time
        
        # Record metrics
        ML_TASK_DURATION.labels(
            task_type=self.task_type,
            model=self.model_name
        ).observe(inference_time)
        
        # Create performance report
        metrics = ModelPerformanceMetrics(
            inference_time=inference_time,
            memory_usage_mb=memory_usage,
            tokens_per_second=tokens_per_second,
            model_name=self.model_name,
            input_tokens=self.input_tokens,
            output_tokens=self.output_tokens
        )
        
        # Log performance
        self._log_performance(metrics)
        
        return metrics
    
    def set_token_counts(self, input_tokens: int, output_tokens: int):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
    
    def _log_performance(self, metrics: ModelPerformanceMetrics):
        logger.info(
            f"Model {metrics.model_name} inference: "
            f"{metrics.inference_time:.2f}s, "
            f"{metrics.memory_usage_mb:.1f}MB, "
            f"{metrics.tokens_per_second:.1f} tokens/s" 
            if metrics.tokens_per_second else ""
        )
        
        # Alert on performance issues
        if metrics.inference_time > 10:  # Alert if inference > 10s
            logger.warning(
                f"Slow inference detected: {metrics.model_name} "
                f"took {metrics.inference_time:.2f}s"
            )

# Enhanced model wrapper with monitoring
class MonitoredModel:
    def __init__(self, model, model_name: str):
        self.model = model
        self.model_name = model_name
        self.total_inferences = 0
        self.total_inference_time = 0
    
    async def generate(self, prompt: str, **kwargs) -> str:
        with MLPerformanceMonitor(self.model_name, "generation") as monitor:
            # Estimate input tokens (rough approximation)
            input_tokens = len(prompt.split()) * 1.3  # Rough token estimate
            
            start_time = time.time()
            result = await self.model.generate(prompt, **kwargs)
            inference_time = time.time() - start_time
            
            # Estimate output tokens
            output_tokens = len(result.split()) * 1.3
            
            monitor.set_token_counts(int(input_tokens), int(output_tokens))
            
            # Update running statistics
            self.total_inferences += 1
            self.total_inference_time += inference_time
            
        return result
    
    def get_average_inference_time(self) -> float:
        if self.total_inferences == 0:
            return 0
        return self.total_inference_time / self.total_inferences
```

### GPU/CPU Utilization Monitoring

```python
# backend/ml/resource_monitor.py
import time
import threading
import psutil
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ResourceMonitor:
    def __init__(self, interval: float = 1.0):
        self.interval = interval
        self.monitoring = False
        self.thread = None
        self.cpu_history: List[float] = []
        self.memory_history: List[float] = []
        self.max_history_size = 300  # 5 minutes at 1s intervals
    
    def start(self):
        if self.monitoring:
            return
        
        self.monitoring = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        logger.info("Resource monitoring started")
    
    def stop(self):
        self.monitoring = False
        if self.thread:
            self.thread.join()
        logger.info("Resource monitoring stopped")
    
    def _monitor_loop(self):
        while self.monitoring:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=None)
                self.cpu_history.append(cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                self.memory_history.append(memory_percent)
                
                # Trim history
                if len(self.cpu_history) > self.max_history_size:
                    self.cpu_history.pop(0)
                if len(self.memory_history) > self.max_history_size:
                    self.memory_history.pop(0)
                
                # Alert on high usage
                if cpu_percent > 90:
                    logger.warning(f"High CPU usage: {cpu_percent:.1f}%")
                if memory_percent > 90:
                    logger.warning(f"High memory usage: {memory_percent:.1f}%")
                
                time.sleep(self.interval)
                
            except Exception as e:
                logger.error(f"Resource monitoring error: {e}")
                time.sleep(self.interval)
    
    def get_current_stats(self) -> Dict[str, float]:
        return {
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage_percent': psutil.disk_usage('/').percent,
            'cpu_avg_5min': sum(self.cpu_history[-300:]) / len(self.cpu_history[-300:]) if self.cpu_history else 0,
            'memory_avg_5min': sum(self.memory_history[-300:]) / len(self.memory_history[-300:]) if self.memory_history else 0,
        }

# Global resource monitor instance
resource_monitor = ResourceMonitor()

# Start monitoring on application startup
def start_resource_monitoring():
    resource_monitor.start()

def stop_resource_monitoring():
    resource_monitor.stop()
```

## Performance Testing

### Load Testing with K6

**API Load Tests:**
```javascript
// k6/performance-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Ramp up
    { duration: '5m', target: 10 },    // Steady state
    { duration: '2m', target: 50 },    // Load test
    { duration: '5m', target: 50 },    // Steady high load
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],     // Error rate under 1%
    errors: ['rate<0.01'],
  },
}

const BASE_URL = 'http://localhost:8000'

export default function() {
  // Test health endpoint
  let response = http.get(`${BASE_URL}/healthz`)
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1)

  sleep(1)

  // Test chat endpoint (requires sources)
  const chatPayload = {
    message: 'What are the main findings?',
    source_ids: ['test-source-id']
  }

  response = http.post(`${BASE_URL}/api/chat`, JSON.stringify(chatPayload), {
    headers: { 'Content-Type': 'application/json' },
  })

  check(response, {
    'chat status is 200': (r) => r.status === 200,
    'chat response time < 3000ms': (r) => r.timings.duration < 3000,
    'chat response has content': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.response && body.response.length > 0
      } catch {
        return false
      }
    },
  }) || errorRate.add(1)

  sleep(2)
}

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-summary.json': JSON.stringify(data),
  }
}
```

**Frontend Performance Tests:**
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should meet Web Vitals thresholds', async ({ page }) => {
    // Navigate and wait for load
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Measure Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          const vitals = {}
          
          getCLS((metric) => vitals.cls = metric.value)
          getFID((metric) => vitals.fid = metric.value)
          getFCP((metric) => vitals.fcp = metric.value)
          getLCP((metric) => vitals.lcp = metric.value)
          getTTFB((metric) => vitals.ttfb = metric.value)
          
          // Wait for metrics to be collected
          setTimeout(() => resolve(vitals), 3000)
        })
      })
    })

    // Assert thresholds
    expect(webVitals.cls).toBeLessThan(0.1)      // Good CLS
    expect(webVitals.fid).toBeLessThan(100)      // Good FID
    expect(webVitals.fcp).toBeLessThan(1500)     // Good FCP
    expect(webVitals.lcp).toBeLessThan(2500)     // Good LCP
    expect(webVitals.ttfb).toBeLessThan(800)     // Good TTFB
  })

  test('should handle large file upload efficiently', async ({ page }) => {
    const startTime = Date.now()
    
    // Mock large file upload
    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'large-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(10 * 1024 * 1024) // 10MB
    })

    // Wait for upload completion
    await page.waitForSelector('[data-testid="upload-complete"]', { timeout: 30000 })
    
    const uploadTime = Date.now() - startTime
    expect(uploadTime).toBeLessThan(30000) // Should complete within 30 seconds
  })

  test('should maintain responsive UI during processing', async ({ page }) => {
    await page.goto('/')
    
    // Start heavy operation
    await page.click('[data-testid="generate-podcast"]')
    
    // Verify UI remains responsive
    const responseTime = await page.evaluate(async () => {
      const start = performance.now()
      
      // Simulate user interaction
      const button = document.querySelector('button')
      if (button) {
        button.click()
      }
      
      // Measure response time
      await new Promise(resolve => requestAnimationFrame(resolve))
      return performance.now() - start
    })
    
    expect(responseTime).toBeLessThan(100) // Should respond within 100ms
  })
})
```

## Optimization Techniques

### Frontend Optimizations

**Component Optimization:**
```typescript
// Memoization strategies
import { memo, useMemo, useCallback } from 'react'

const ExpensiveComponent = memo(({ data, onAction }) => {
  // Expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    }))
  }, [data])

  // Stable callback references
  const handleAction = useCallback((id: string) => {
    onAction(id)
  }, [onAction])

  return (
    <div>
      {processedData.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          onAction={handleAction}
        />
      ))}
    </div>
  )
})

// Virtualization for large lists
import { FixedSizeList as List } from 'react-window'

function VirtualizedSourceList({ sources }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <SourceItem source={sources[index]} />
    </div>
  )

  return (
    <List
      height={400}
      itemCount={sources.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

**Image and Asset Optimization:**
```typescript
// Lazy loading images
function OptimizedImage({ src, alt, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className="relative">
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
```

### Backend Optimizations

**Async Processing:**
```python
# Background task processing
import asyncio
from concurrent.futures import ThreadPoolExecutor
import queue

class TaskQueue:
    def __init__(self, max_workers: int = 4):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.tasks = queue.Queue()
        self.results = {}
    
    async def enqueue_task(self, task_id: str, func, *args, **kwargs):
        """Enqueue a task for background processing."""
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(self.executor, func, *args, **kwargs)
        
        self.results[task_id] = {
            'status': 'processing',
            'future': future
        }
        
        # Set up completion callback
        future.add_done_callback(
            lambda f: self._task_completed(task_id, f)
        )
        
        return task_id
    
    def _task_completed(self, task_id: str, future):
        """Handle task completion."""
        try:
            result = future.result()
            self.results[task_id] = {
                'status': 'completed',
                'result': result
            }
        except Exception as e:
            self.results[task_id] = {
                'status': 'failed',
                'error': str(e)
            }
    
    def get_task_status(self, task_id: str):
        """Get task status and result."""
        return self.results.get(task_id, {'status': 'not_found'})

# Global task queue
task_queue = TaskQueue()
```

**Caching Strategies:**
```python
# Redis-based caching
import redis
import json
import hashlib
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expiration: int = 3600):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key_data = f"{func.__name__}:{args}:{kwargs}"
            cache_key = hashlib.sha256(key_data.encode()).hexdigest()
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            redis_client.setex(
                cache_key, 
                expiration, 
                json.dumps(result, default=str)
            )
            
            return result
        return wrapper
    return decorator

# Usage
@cache_result(expiration=1800)  # 30 minutes
async def process_document(content: str) -> dict:
    # Expensive processing...
    return {"processed": True, "content": content}
```

**Database Optimization:**
```python
# Query optimization with eager loading
from sqlalchemy.orm import joinedload, selectinload

async def get_sources_optimized(db: Session):
    """Optimized query with eager loading."""
    return db.query(SourceModel)\
        .options(
            joinedload(SourceModel.metadata),
            selectinload(SourceModel.chunks)
        )\
        .filter(SourceModel.status == 'completed')\
        .all()

# Connection pooling
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

This comprehensive performance monitoring and optimization guide provides the foundation for maintaining high-performance operation of NotebookMLX across all components. Regular monitoring and optimization based on these metrics will ensure the application scales effectively and provides excellent user experience.