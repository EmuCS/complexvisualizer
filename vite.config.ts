import { defineConfig } from 'vite';

export default defineConfig({
  // Fixes the base URL pathing for GitHub Pages
  base: '/complexvisualizer/',
  
  build: {
    // Tells Vite to compile index.html directly from the root folder
    outDir: 'dist',
    assetsDir: 'assets',
    rolldownOptions: {
      external: ['node:module'],
      output: {
        globals: {
          'node:module': 'Object',
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['node:module']
  }
});