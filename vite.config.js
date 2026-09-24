import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: imprescindible para que la app funcione al desplegarse
  // en GitHub Pages (repo.github.io/nombre-repo/...) sin backend.
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
