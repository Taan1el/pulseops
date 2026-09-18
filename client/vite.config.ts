/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run build:pages` builds with --mode pages: static assets are served
// from /pulseops/ on GitHub Pages, and vite preview --mode pages needs the
// same base to serve that build locally without every asset 404ing.
export default defineConfig(({ mode }) => {
  const isPagesBuild = mode === 'pages'
  // loadEnv reads .env, .env.local and .env.[mode].local for this run and
  // merges in any variable already set in the shell, so VITE_API_TARGET can
  // come from either a local .env file or an exported env var.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: isPagesBuild ? '/pulseops/' : '/',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
