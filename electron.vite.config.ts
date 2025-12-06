import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
console.log(__dirname)

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(join(__dirname, 'src/renderer', 'index.html')),
          crop: resolve(join(__dirname, 'src/renderer', 'crop.html'))
        }
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue(), ui()]
  }
})
