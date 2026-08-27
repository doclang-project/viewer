import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  esbuild: {
    useDefineForClassFields: false,
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/main.ts'),
      formats: ['iife'],
      name: 'DocLangViewer',
      fileName: () => 'viewer.js',
    },
    outDir: path.resolve(import.meta.dirname, '..'),
    emptyOutDir: false,
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Unwrap the IIFE wrapper — the original viewer.js runs top-level code
        // so the bundle is already self-contained without an export surface.
        extend: true,
      },
    },
  },
});
