import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/register': 'http://localhost:8000',
      '/login': 'http://localhost:8000',
      '/orders': 'http://localhost:8000',
      '/portfolio': 'http://localhost:8000',
      '/import': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
      // add other API routes as needed
    }
  }
})