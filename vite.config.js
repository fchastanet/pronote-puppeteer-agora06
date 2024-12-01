import {defineConfig} from 'vite'
const ASSETS_URL = process.env.ASSETS_URL || ''
const ASSETS_PORT = process.env.ASSETS_PORT || 3000

export default defineConfig({
  base: ASSETS_URL,
  root: 'web',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    open: 'index.html',
    port: ASSETS_PORT,
    hmr: {
      host: 'localhost',
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  resolve: {
    alias: {
      '@': '/web/js',
    }
  }
})
