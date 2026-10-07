import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: la app funciona servida desde cualquier carpeta
  // (y luego empaquetada en Tauri) sin backend.
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
