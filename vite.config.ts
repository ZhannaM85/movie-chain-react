import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages is served under /movie-chain-react/, but local dev should use /
 * so `npm run dev` works at http://localhost:5173/ without path mismatches
 * (assets, HMR, and CSS pipeline).
 */
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/movie-chain-react/' : '/',
  plugins: [react(), tailwindcss()],
}))
