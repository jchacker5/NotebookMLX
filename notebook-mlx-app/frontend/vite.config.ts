import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React ecosystem
          'react-vendor': ['react', 'react-dom', '@tanstack/react-query'],
          // UI libraries chunk
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-icons', '@radix-ui/react-tabs'],
          // Heavy studio components (lazy loaded)
          'studio-d3': ['d3'],
          'studio-audio': ['wavesurfer.js'],
          // Utilities
          'utils': ['axios', 'clsx', 'class-variance-authority']
        }
      }
    },
    // Enable tree shaking
    treeshake: true,
    // Optimize source maps for production
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Increase chunk size warning limit for large ML app
    chunkSizeWarningLimit: 1000
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'zustand'
    ],
    exclude: [
      'd3',
      'wavesurfer.js',
      'framer-motion'
    ]
  },
  // Enable esbuild optimizations
  esbuild: {
    drop: ['console', 'debugger']
  }
})