import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'   // ← Import plugin Tailwind v4

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // ← Tambahkan di sini
  ],
})