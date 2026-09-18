import { defineConfig } from 'vite';
import path from 'path';
import { readFileSync } from 'fs';
import dts from 'vite-plugin-dts';

const src = path.resolve(import.meta.dirname, 'src');

/**
 * Derive library entry points from src/index.ts re-exports.
 *
 * Every `export { ... } from './some/path'` in index.ts becomes an entry.
 * The entry key is the relative path without the leading `./`; the value is
 * the absolute path to the `.ts` file.
 *
 * Adding a new export to index.ts is all that's needed to expose a new entry.
 */
function entriesFromBarrel(): Record<string, string> {
  const barrel = readFileSync(path.join(src, 'index.ts'), 'utf8');
  const entries: Record<string, string> = {
    index: path.join(src, 'index.ts'),
  };
  for (const m of barrel.matchAll(/from\s+'(\.\/[^']+)'/g)) {
    const rel = m[1]!.slice(2); // strip leading './', e.g. 'components/viewer/viewer'
    const parts = rel.split('/');
    const last = parts[parts.length - 1]!;
    const parent = parts[parts.length - 2];
    // Collapse 'components/viewer/viewer' → 'components/viewer' when the file
    // name matches the parent folder name (conventional component main file).
    const key = last === parent ? parts.slice(0, -1).join('/') : rel;
    entries[key] = path.join(src, `${rel}.ts`);
  }
  return entries;
}

/**
 * ESM library build — tree-shakeable, per-component entry points.
 * Output: core/dist/
 *
 *   import '@doclang/viewer-core';                       // all components
 *   import '@doclang/viewer-core/components/viewer';    // just the viewer shell
 */
export default defineConfig({
  esbuild: {
    useDefineForClassFields: false,
  },
  plugins: [
    dts({
      include: ['src'],
      outDir: path.resolve(import.meta.dirname, 'dist'),
    }),
  ],
  build: {
    lib: {
      entry: entriesFromBarrel(),
      formats: ['es'],
    },
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      // Lit is an external peer dependency — bundler consumers supply their
      // own copy, avoiding duplicate-lit issues at runtime.
      external: [/^lit/, /^@lit/],
      output: {
        // Preserve the entry directory structure in dist/
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
