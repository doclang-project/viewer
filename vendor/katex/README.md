# KaTeX (vendored)

Source: https://github.com/KaTeX/KaTeX, npm package `katex` version 0.18.7.
Fonts source: https://github.com/KaTeX/katex-fonts (bundled in the same npm package).

Files here are the unmodified `dist/katex.min.js`, `dist/katex.min.css`, and
`dist/fonts/*` from that package, vendored so the viewer has no build step
and no external/CDN dependency. Licensed under MIT (see `LICENSE`),
copyright Khan Academy and contributors.

To upgrade: download `https://registry.npmjs.org/katex/-/katex-<version>.tgz`,
replace `katex.min.js`, `katex.min.css`, `fonts/`, and `LICENSE` with the new
package's `dist/` contents, and update the version above.
