import {defineConfig} from 'vite'

const ASSETS_URL = process.env.ASSETS_URL || ''
const ASSETS_PORT = process.env.ASSETS_PORT || 3000

export default defineConfig(({mode}) => {
  const isDev = mode === 'development'

  return {
    base: ASSETS_URL,
    root: 'web',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: isDev,
      rollupOptions: {
        input: {
          main: 'web/index.html',
          faviconPng: 'web/favicon.png',
          faviconIco: 'web/favicon.ico',
        },
      }
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
      middlewareMode: false,
      fs: {
        strict: false,
        allow: ['..']
      }
    },
    resolve: {
      alias: {
        '@': '/web/js',
      }
    }
  }
})
