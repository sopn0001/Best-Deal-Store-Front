import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/products':   'http://localhost:5001',
      '/categories': 'http://localhost:5001',
      '/orders':     'http://localhost:3002',
    },
  },
});
