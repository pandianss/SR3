import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [react()],

    // Capacitor serves the app via file:// — relative base is required so asset
    // paths don't break (default '/' would resolve to the filesystem root).
    base: './',

    // In production (Capacitor APK), the WebView has no proxy — API calls go
    // directly to the deployed backend via VITE_API_BASE_URL.
    // In development, Vite proxies /api → localhost:3001 as before.
    define: {
      // Exposes the API base to the app so fetch calls can be absolute in prod.
      __API_BASE__: JSON.stringify(
        isProd
          ? (env.VITE_API_BASE_URL || '')   // e.g. https://api.superrecall.in
          : ''                               // empty = relative /api (proxy handles it)
      ),
    },

    build: {
      // microLessons.js and PracticeQuiz (questionBank) are large content-data
      // chunks that load deferred — not code bloat, so suppress the warning.
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/firebase")) return "vendor-firebase";
            if (id.includes("node_modules/lucide-react")) return "vendor-ui";
          }
        }
      }
    },

    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
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
