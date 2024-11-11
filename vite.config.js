
import {defineConfig} from 'vite'

export default defineConfig({
  root: 'web',
  build: {
    outDir: '../dist',
    manifest: true,
  },
  server: {
    open: 'index.html',
    port: 3000
  },
  resolve: {
    alias: {
      '@': '/web/js',
    }
  }
})
