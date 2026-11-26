# DocLang Viewer

Browser-based viewer for DocLang markup and [archives](https://github.com/doclang-project/doclang/blob/main/spec.md#doclang-archive-format): a preview, the formatted DocLang, and—when opening an archive with page images—the original pages with linked selection and bounding-box overlays.

The preview is **Flowing** (the content in reading order) or **Paged** (each element in its place on the page). A page with nothing placed on it, e.g. from a model asked for some tasks only, flows inside the page in the Paged Preview, and its header says so (**No locations · flowing**).

Standalone `.dclg` or `.xml` files show the DocLang and the preview only. `.dclx` archives may also include page images and assets; layout and page-alignment rules are in the [DocLang specification](https://github.com/doclang-project/doclang) ([archive format section](https://github.com/doclang-project/doclang/blob/main/spec.md#doclang-archive-format)).

<img src="assets/viewer.png" alt="DocLang Viewer showing the original, DocLang and preview panes" width="1400" />

## Quick start

Serve this directory over HTTP so the samples can be fetched:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080/](http://localhost:8080/): the first sample opens on its own.

## Opening files

| Action | Description |
|--------|-------------|
| **Samples** | Cards on the start screen; a card opens its archive (requires HTTP) in place of the open files, and the first opens when the viewer opens without a file (**Open a sample on launch** in Settings). See below. |
| **Open** (⌘O / Ctrl+O) | Select a `.dclx` archive, or a standalone `.dclg` / `.xml` markup file; it opens next to the files already open. |
| **Drag and drop** | Drop any supported file onto the page. |
| **From another page** | A page that opens the viewer can hand it a file; see [Hosting the viewer](#hosting-the-viewer). |
| **In another page** | A page that embeds the viewer can show its own documents in it, also while it is still writing them; see [Hosting the viewer](#hosting-the-viewer). |

Supported types: `.dclx`, `.dclg`, `.xml`.

The start screen also offers **samples**, one card each; the first opens when the viewer starts without a file (the `demo` [feature](API.md#features)). The built-in ones are in [`demo-data.js`](demo-data.js); a deployment can offer its own (see [`config.js`](API.md#configjs)).

**Download** saves the open file, with any applied edits. When an archive carries its [original source](https://github.com/doclang-project/doclang/blob/main/spec.md#original-source-optional) (e.g. the PDF it was converted from), it also offers that **Original file**, under the name its source descriptor records.

## Hosting the viewer

A page can open the viewer with a file, or embed it and show its own documents in it, also while a model is still writing them; a deployment can choose the viewer's features and samples. See [API.md](API.md) for `config.js`, the URL parameters and the messages.

## Features per deployment

A deployment can switch the viewer's features (`editing`, `editing.ocr`, `tokens`, `demo`) on or off, with or without a switch for the user; see [Features](API.md#features).

For development only, `streaming.demo` (built-in `off`) adds **Stream demo** to Settings: it plays an opened file in as if a model were writing it, to see streaming without a model. It is not part of the API and may change or go; a public deployment sets it to `never`.

## Files

- `API.md` — the API for deployments and hosts
- `config.js` — per-deployment features and samples (see [API.md](API.md#configjs))
- `demo-data.js` — the built-in samples
- `index.html` — shell UI
- `viewer.js` — parsing, page alignment, bbox overlay
- `viewer.css` — layout and theme
- `vendor/katex/` — vendored [KaTeX](https://katex.org/) (MIT, see [`vendor/katex/LICENSE`](vendor/katex/LICENSE)), used to render `<formula>` LaTeX in the reading view
- `validator-worker.mjs` — XSD validation in a Web Worker, equivalent to `doclang validate --xsd-only -n`
- `schema/` — vendored DocLang XSDs from the [doclang](https://github.com/doclang-project/doclang) repo, one per minor version (`doclang-0.7.xsd` = v0.7.4, `doclang-0.8.xsd` = v0.8.1, `doclang-0.9.xsd` = v0.9.1, `doclang-0.10.xsd` = v0.10.1), indexed by `versions.json`. A document is validated against the schema of the `version` it declares, or the default (latest) one if it declares none. Refresh them with `scripts/vendor-schemas.sh` (add new release tags to its `TAGS` list).
- `vendor/libxml2-wasm/` — vendored [libxml2-wasm](https://github.com/jameslan/libxml2-wasm) (MIT, see [`vendor/libxml2-wasm/LICENSE`](vendor/libxml2-wasm/LICENSE)), libxml2 compiled to WebAssembly, used for validation
- `vendor/lucide/` — license of [Lucide](https://lucide.dev) (ISC, see [`vendor/lucide/LICENSE`](vendor/lucide/LICENSE)), whose undo / redo icons are inlined in `index.html` and image icon in `viewer.js`
