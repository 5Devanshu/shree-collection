import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fallback to index.html for SPA routing
    middlewareMode: true,
  },
  preview: {
    // For production preview
    middlewareMode: true,
  },
})
