# DocLang Viewer API

How a deployment configures the viewer, and how a host (a page that opens or embeds the viewer) works with it: `config.js`, URL parameters, and messages.

**API version 1.** Changes are additive where we can make them so: new messages, fields, parameters or values. The viewer ignores message types and fields it doesn't know, and hosts should do the same. A change a host could break on raises the version, which the viewer sends in `ready`, and is noted in the release notes. Parts marked *experimental* may still change without that.

- [Features](#features)
- [`config.js`](#configjs)
- [URL parameters](#url-parameters)
- [Messages](#messages)
  - [Opening the viewer with a file](#opening-the-viewer-with-a-file)
  - [Embedding the viewer](#embedding-the-viewer)
  - [Showing a document while it is written](#showing-a-document-while-it-is-written)

## Features

A deployment decides which features the viewer has. Each is in one of four modes:

| | the user can switch it | the user cannot |
|---|---|---|
| **on** | `on` (starts on) | `always` |
| **off** | `off` (starts off) | `never` (the feature is not there) |

| feature | what | built-in |
|---|---|---|
| `editing` | visual and source editing (inspector, bbox handles, add/remove, drag to reorder, the Raw view, save) | `on` |
| `editing.ocr` | "Read from page" with Granite-Docling in the browser (downloads about 1.2 GB on first use); only while editing is on | `always` |
| `tokens` | tokens in the DocLang source, token tracing, and the Tokens overlays | `off` |
| `demo` | the first [sample](#configjs) opens when the viewer opens without a file (not when it opens with one); `never` also drops the sample cards from the start screen | `on` |

`editing`, `tokens` and `demo` have a switch in Settings when they are `on` or `off`; the user's choice is remembered (per deployment path). `editing.ocr` has no switch of its own, so for it `on` means `always` and `off` means `never`. A child like `editing.ocr` is not there when its parent isn't.

`config.js` sets a feature's mode for a deployment, the URL for a single visit (see below).

## `config.js`

A deployment overrides what it needs by replacing [`config.js`](config.js), which the viewer loads before itself:

```js
window.DOCLANG_CONFIG = {
  features: { tokens: "always", "editing.ocr": "never" },
  samples: [{ title: "Report", subtitle: "Twelve pages", file: "samples/report.dclx", thumb: "samples/report.jpg" }],
};
```

| key | |
|---|---|
| `features` | modes of the [features](#features), by name; those left out keep their built-in mode |
| `samples` | the start screen's sample cards, in place of the built-in ones ([`demo-data.js`](demo-data.js)): `{title, subtitle, file, thumb}` each, `file` the archive the card opens, `thumb` a small picture for the card (both URLs, relative to the viewer) |

## URL parameters

They hold for the visit they are on: what the user has chosen and saved is left as it is.

| parameter | values | |
|---|---|---|
| `source` | `opener`, `embed` | the viewer was opened by a host, or is embedded in one: see [Messages](#messages). No sample opens. |
| `panes` | from `files`, `original`, `doclang`, `preview`, comma-separated | the panes to show, e.g. `panes=doclang,preview` |
| `reading` | `paged`, `flowing` | the Preview's layout |
| `header` | `hide` | leaves out the header, for a host that brings its own |
| a feature's name | `on`, `off`, `always`, `never` | the feature's mode, e.g. `tokens=on`, or `editing=never` for a read-only link |

A feature's parameter cannot change an `always` from `config.js` except to `never`, nor bring back a `never`. `on`/`off` leave the user's remembered choice as it is; switching the feature in Settings drops its parameter from the address, so a reload keeps the user's choice.

```html
<iframe src="https://doclang.ai/viewer/?source=embed&panes=original,doclang,preview&header=hide&editing=never&tokens=on"></iframe>
```

## Messages

A host and the viewer talk with `postMessage`. Every message is an object whose `type` starts with `doclang-viewer:`. The viewer only accepts messages from its host: the window that opened it (`?source=opener`) or the page that embeds it (`?source=embed`).

They start with a handshake: the host posts `ping`, repeating it (every quarter second, say) until the viewer answers `ready`. The viewer answers again after each load, e.g. after `reset`, so a host that keeps the viewer shakes hands again when its frame loads.

| message | from | |
|---|---|---|
| `{type: "doclang-viewer:ping"}` | host | Are you there? |
| `{type: "doclang-viewer:ready", api}` | viewer | Yes. `api`: the API version, `1`. |
| `{type: "doclang-viewer:open", name, buffer}` | host | Opens a file: `buffer` an `ArrayBuffer`, `name` its file name (`.dclx`, `.dclg` or `.xml`). |
| `{type: "doclang-viewer:show", name, markup, pages, tokens, complete}` | host | Shows DocLang `markup` (a string) with its page images, also while it is written: see [below](#showing-a-document-while-it-is-written). |
| `{type: "doclang-viewer:configure", theme, style, accept, samples}` | host | Fits the viewer into the host: see [Embedding the viewer](#embedding-the-viewer). Fields left out stay as they were. |
| `{type: "doclang-viewer:close"}` | host | Closes what is open and goes back to the start screen, as the header's home link does. A `show` posted after it opens that document again, so the host stops showing it first. |
| `{type: "doclang-viewer:reset"}` | host | Clears the viewer's saved settings and reloads it as it was opened, as **Reset all settings** in Settings does. Embedded on another site, the viewer's settings are its own there: browsers keep them apart from the viewer opened on its own. |
| `{type: "doclang-viewer:file", name, buffer}` | viewer | A file the user dropped or opened in the viewer, of a type the host takes (`accept`). |
| `{type: "doclang-viewer:sample", id}` | viewer | The user picked one of the host's samples. |

### Opening the viewer with a file

A tool that produces DocLang in the browser, such as the [docling-serve](https://github.com/docling-project/docling-serve) UI, can open the viewer with a document already loaded; the file never needs a public URL:

```js
const viewer = window.open("https://doclang.ai/viewer/?source=opener", "_blank");
const origin = "https://doclang.ai";
const ping = setInterval(() => viewer.postMessage({ type: "doclang-viewer:ping" }, origin), 250);
window.addEventListener("message", (event) => {
  if (event.source !== viewer || event.data?.type !== "doclang-viewer:ready") return;
  clearInterval(ping);
  viewer.postMessage({ type: "doclang-viewer:open", name: "report.dclx", buffer }, origin, [buffer]);
});
```

### Embedding the viewer

A page can embed the viewer in an `<iframe>` with `?source=embed`, shake hands the same way, and show its own documents in it, e.g. a conversion it runs. Embedded, the viewer stays hidden until the host's first message after `ready` (or for a moment and a half, if none comes), so its own look and samples don't flash before the host's `configure`.

`configure` fits the viewer into the host, for this visit:

| field | |
|---|---|
| `theme` | `"light"` or `"dark"`, over the user's choice |
| `style` | *experimental*: the viewer's colours, e.g. `{"--bg": "#f3ede2"}`. Supported: `--bg` (background), `--panel` (panes), `--placeholder-bg` (empty areas), `--markup-bg` (the DocLang pane), `--border`, `--text`, `--muted` (secondary text), `--accent`. Values that could load something are ignored. |
| `accept` | extensions of files the host takes itself, e.g. `[".png", ".pdf"]`: the start screen and the file dialog offer them next to the viewer's own, and a file of one of them the user drops or opens goes to the host as `file` |
| `samples` | the host's samples, as cards on the start screen in place of the viewer's: `{id, title, subtitle, thumb}` each, `thumb` an image URL (http(s) or `data:`) or a Blob. A click posts `sample` with its `id`; the host shows the sample itself, e.g. converts it and shows it with `show`. |

### Showing a document while it is written

`show` shows `markup` with its page images, `pages`, as `{[pageNo]: Blob | ArrayBuffer}`; `name` names it (by default `document.dclg`). Posting `show` again with the same `name` replaces the document, so a host can show it while a model is still writing it, posting what is written so far each time. `complete: true` says it is done.

Until it is complete, `markup` can be cut off anywhere, as written: the viewer closes what is still open (a host can also send it closed itself), and

- the previews show pulsing dots where it is being written;
- the views follow its end: the page being written becomes the current page, and the DocLang pane keeps its last written line in view (scrolled away, it stays);
- it shows its tokens and traces itself as it grows, whether the `tokens` feature is on or off; once complete, its tokens show as the feature says. A shown document has no trace playback, also once complete: it was traced as it was written;
- it is validated only once it is complete.

`tokens` (optional, *experimental*) are the tokens the model generated, in order, `[text, id, special]` each: the token's text as decoded, its id in the model's vocabulary, and (optional) `true` for a special token. The token views show them in place of the viewer's own tokenizer; markup the model did not write (e.g. page breaks the host adds) is tokenized by the viewer.

```js
viewer.postMessage({ type: "doclang-viewer:show", name: "report.dclg", markup, pages: { 1: pageImage },
  tokens: [["<heading>", 100312, false], ["Doc", 9532, false]], complete: false }, origin);
```
