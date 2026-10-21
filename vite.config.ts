import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Listen on the LAN too, so the app can be opened from a phone on the same Wi-Fi.
  server: { host: true },
  preview: { host: true },
  // The Firebase SDK alone is ~600 kB minified (~180 kB gzipped); that's fine for this app.
  build: { chunkSizeWarningLimit: 1000 },
})
