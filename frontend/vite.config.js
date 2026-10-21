import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxy: moi request /api/** se duoc chuyen tiep sang Spring Boot backend
// (chay o localhost:8080), tranh loi CORS khi phat trien local.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
