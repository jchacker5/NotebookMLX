import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [
    react({
      // Enable React fast refresh optimizations
      fastRefresh: true,
      // Enable JSX runtime optimization
      jsxRuntime: 'automatic'
    }),
    splitVendorChunkPlugin()
  ],
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
  preview: {
    port: 4173,
    host: '127.0.0.1',
    strictPort: true,
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        // Improved chunk splitting strategy
        manualChunks: (id) => {
          // React ecosystem - critical path
          if (id.includes('react') || id.includes('@tanstack/react-query')) {
            return 'react-vendor'
          }
          // UI library components - shared across routes
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-vendor'
          }
          // D3 visualization library - heavy, lazily loaded
          if (id.includes('d3')) {
            return 'studio-d3'
          }
          // Audio processing library - heavy, lazily loaded
          if (id.includes('wavesurfer.js')) {
            return 'studio-audio'
          }
          // Framer Motion - animation library
          if (id.includes('framer-motion')) {
            return 'animations'
          }
          // Markdown processing
          if (id.includes('react-markdown')) {
            return 'markdown'
          }
          // Utilities and smaller libraries
          if (id.includes('axios') || id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
            return 'utils'
          }
          // File handling
          if (id.includes('react-dropzone')) {
            return 'file-handling'
          }
          // Node modules that aren't explicitly chunked
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // Optimize asset file names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Enable comprehensive tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    // Optimize source maps for production
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Minification settings
    minify: 'esbuild',
    // Reduce chunk size warnings for intentionally large chunks
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize CSS
    cssMinify: true
  },
  // Optimize dependencies for faster dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'zustand',
      'axios',
      'clsx'
    ],
    exclude: [
      'd3',
      'wavesurfer.js',
      'framer-motion'
    ],
    // Force optimization of these dependencies
    force: true
  },
  // Enhanced esbuild optimizations
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },
  // Performance optimizations
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        // Enable preload for critical chunks
        if (filename.includes('react-vendor') || filename.includes('index')) {
          return { runtime: `new URL(${JSON.stringify(filename)}, import.meta.url).href` }
        }
      }
      return { relative: true }
    }
  }
})