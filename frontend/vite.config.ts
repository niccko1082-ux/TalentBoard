import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, requests to /api are proxied to the Spring Boot backend so the
// browser talks to a single origin (no CORS needed while developing).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
