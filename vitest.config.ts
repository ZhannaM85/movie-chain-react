/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    env: {
      VITE_TMDB_API_KEY: 'test-api-key',
      VITE_KINOPOISK_API_KEY: '',
      TZ: 'UTC',
    },
  },
})

