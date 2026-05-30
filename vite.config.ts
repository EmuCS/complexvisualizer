import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Attaches project bundles seamlessly to your custom GitHub subfolder
  base: '/complexvisualizer/',
  
  // Forces Vite to track index.html as the primary application index anchor
  root: '.',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
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