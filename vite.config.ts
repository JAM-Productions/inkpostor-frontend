import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vendors that change on their own schedule, split out so an app-only deploy
// doesn't invalidate them in the browser cache.
function manualChunks(id: string): string | undefined {
  if (id.includes('src/i18n/locales')) return 'locales'
  if (!id.includes('node_modules')) return undefined
  if (id.includes('socket.io') || id.includes('engine.io')) return 'socket'
  if (id.includes('i18next')) return 'i18n'
  if (
    id.includes('node_modules/react-dom') ||
    id.includes('node_modules/react/') ||
    id.includes('node_modules/scheduler')
  ) {
    return 'react'
  }
  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    exclude: ['e2e/**', ...configDefaults.exclude],
  }
})
