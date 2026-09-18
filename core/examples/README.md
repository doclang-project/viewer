# DocLang Viewer — component examples

Isolated examples for the larger content-rendering components. Each page loads the demo archive via the `src` attribute — no build step required.

## Individual panes

| Example | Component | Description |
|---------|-----------|-------------|
| [markup-pane.html](markup-pane.html) | `<doclang-markup-pane>` | Formatted DocLang XML source view, page-by-page |
| [reading-pane.html](reading-pane.html) | `<doclang-reading-pane>` | Rendered reading view with layers toggle |
| [page-img-pane.html](page-img-pane.html) | `<doclang-page-img-pane>` | Original page image with bounding-box overlay (requires a `.dclx` archive with images) |

## Composed

| Example | Description |
|---------|-------------|
| [all-panes.html](all-panes.html) | All three panes side-by-side, with page navigation and element selection cross-linked via vanilla JS |

## Running locally

These pages fetch the demo archive over HTTP, so they need to be served rather than opened as `file://`:

```bash
# from the repo root
python3 -m http.server 8080
```

Then open <http://localhost:8080/core/examples/>.
