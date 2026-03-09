import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Memberitahu Vite untuk menggunakan target ES modern
    // Ini memperbaiki peringatan "import.meta is not available"
    target: 'esnext'
  },
  optimizeDeps: {
    // Memastikan fitur modern didukung saat pengembangan
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
