import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic' // Use classic runtime to avoid implicit imports from react/jsx-runtime
    })
  ],
  optimizeDeps: {
    // Prevent Vite from trying to pre-bundle these dependencies
    exclude: ['react', 'react-dom', 'three', '@google/genai', 'lucide-react']
  },
  build: {
    rollupOptions: {
      // Externalize dependencies that are loaded via CDN in index.html.
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'three',
        '@google/genai',
        'lucide-react',
        /^three\/.*/ // Match three/addons imports
      ]
    }
  }
});
