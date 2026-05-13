import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Menaikkan batas peringatan ukuran file menjadi 1600 kB (1.6 MB)
    chunkSizeWarningLimit: 1600, 
    
    // (Opsional) Memisahkan library besar agar tidak menumpuk di 1 file
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('lucide')) return 'vendor-lucide';
            return 'vendor'; // Library lainnya
          }
        }
      }
    }
  }
})
