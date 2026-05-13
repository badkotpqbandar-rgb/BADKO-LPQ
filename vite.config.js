import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Memperbesar batas peringatan chunk menjadi 2MB (2000kb)
    // Default bawaan Vite adalah 500kb
    chunkSizeWarningLimit: 2000, 
  }
})
