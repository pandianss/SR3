import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL .env vars into `env` (including non-VITE_-prefixed ones like
  // INTERNAL_TOKEN) so the proxy can inject them as request headers without
  // ever exposing them to browser JavaScript.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          // Inject the shared secret so the backend can verify the caller.
          // The browser never sees this header — it is added by the proxy layer.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.INTERNAL_TOKEN) {
                proxyReq.setHeader('X-Internal-Token', env.INTERNAL_TOKEN)
              }
            })
          }
        }
      }
    }
  }
})
