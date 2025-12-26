import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Externalize dependencies that are loaded via CDN in index.html
      external: ['three', '@google/genai']
    }
  }
});