# libxml2-wasm (vendored)

Source: https://github.com/jameslan/libxml2-wasm, npm package `libxml2-wasm` version 0.7.2.

Files here are the unmodified `lib/*.mjs` ES modules from that package
(excluding the Node-only `nodejs.mjs`, source maps, and type declarations),
vendored so the viewer has no build step and no external/CDN dependency.
The libxml2 WebAssembly binary is embedded in `libxml2raw.mjs`.
The wrapper is licensed under MIT (see `LICENSE`, copyright James Lan);
libxml2 itself is licensed under MIT (see `LICENSE.libxml2`).

Used by `validator-worker.mjs` to validate DocLang markup against
`schema/doclang.xsd` — the same engine lxml uses in the `doclang` Python package.

To upgrade: download `https://registry.npmjs.org/libxml2-wasm/-/libxml2-wasm-<version>.tgz`,
replace the `.mjs` files (minus `nodejs.mjs`), `LICENSE`, and `LICENSE.libxml2`
with the new package's contents, and update the version above.
