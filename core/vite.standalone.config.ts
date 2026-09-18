import { defineConfig } from 'vite';
import path from 'path';

/**
 * Standalone ESM bundle — single self-contained file with lit inlined.
 * Output: viewer.js at the repo root (tracked in git for CDN / script-tag use).
 *
 *   <!-- local -->
 *   <script type="module" src="viewer.js"></script>
 *
 *   <!-- jsDelivr raw -->
 *   <script type="module"
 *     src="https://cdn.jsdelivr.net/gh/org/repo@main/viewer.js">
 *   </script>
 *
 * The npm / bundler library build (core/dist/index.js etc.) is produced by the
 * main vite.config.ts with lit kept external for deduplication.
 */
export default defineConfig({
  esbuild: {
    useDefineForClassFields: false,
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'viewer.js',
    },
    outDir: path.resolve(import.meta.dirname, '..'),
    emptyOutDir: false,
    minify: true,
    sourcemap: true,
  },
});
