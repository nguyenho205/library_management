import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
const proxiedBackendPaths = ['/api', '/anhbia', '/biasach', '/swagger-ui', '/v3/api-docs']

// Dev server proxy: moi request /api/** se duoc chuyen tiep sang Spring Boot backend
// (chay o localhost:8080), tranh loi CORS khi phat trien local.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(proxiedBackendPaths.map((path) => [path, {
      target: apiProxyTarget,
      changeOrigin: true,
    }])),
  },
})
