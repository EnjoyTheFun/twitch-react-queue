/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/twitch-react-queue/' : '/',
  plugins: [react({
    babel: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '19'
        }]
      ]
    }
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'tmi.js'],
    exclude: []
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          videojs: ['video.js', 'videojs-youtube'],
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/modals', '@mantine/notifications'],
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true
  },
  test: {
    globals: true,
    environment: 'jsdom',
  }
}))
