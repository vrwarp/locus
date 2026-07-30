import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// A static host serves the build from wherever it happens to sit. On GitHub
// Pages for a project repository that is `/<repo>/`, not `/`, so every asset URL
// has to carry the prefix. Empty, missing or `/` all mean "served at the root".
const toBase = (raw: string | undefined): string => {
  const trimmed = (raw || '').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'https://api.planningcenteronline.com'

  return {
    base: toBase(env.VITE_BASE_PATH),
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
      exclude: ['e2e/**', 'node_modules/**'],
    },
  } as any
})
