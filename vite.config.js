import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Menambahkan alias agar resolusi path lebih pasti
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      // Memastikan entry point terdefinisi dengan jelas
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
