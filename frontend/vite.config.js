import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../build', // Outputs to root/build directory
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          vendor: ['axios', 'moment', 'socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})