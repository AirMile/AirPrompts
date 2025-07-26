import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - only in build mode
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  server: {
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Increase chunk size warning limit slightly
    chunkSizeWarningLimit: 600,
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Rollup options for advanced chunking
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          
          // UI libraries
          if (id.includes('@dnd-kit') || 
              id.includes('lucide-react') ||
              id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          
          // Markdown libraries
          if (id.includes('@uiw/react-md-editor') || 
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('rehype')) {
            return 'markdown-vendor';
          }
          
          // State & data management
          if (id.includes('@tanstack/react-query') || 
              id.includes('zustand') ||
              id.includes('immer')) {
            return 'data-vendor';
          }
          
          // Utilities
          if (id.includes('date-fns') || 
              id.includes('lodash') ||
              id.includes('uuid')) {
            return 'utils-vendor';
          }
        },
        
        // Asset naming for better caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/${facadeModuleId}/[name].[hash].js`;
        },
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
      
      // External dependencies that should not be bundled
      external: [],
      
      // Tree shaking options
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096,
    
    // Report compressed size
    reportCompressedSize: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'zustand',
      'lucide-react',
      '@dnd-kit/core',
      '@dnd-kit/sortable'
    ],
    exclude: [
      '@uiw/react-md-editor' // Exclude heavy markdown editor from pre-bundling
    ]
  },
  
  // Enable caching
  cacheDir: 'node_modules/.vite',
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})
