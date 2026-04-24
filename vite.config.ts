import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Hosted at https://shirubasoft.github.io/clt-vs-pj/ in production; root in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/clt-vs-pj/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
