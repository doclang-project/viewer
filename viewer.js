/* DocLang Archive Viewer — archive format: github.com/doclang-project/doclang spec.md#doclang-archive-format */

const SUPPORTED_FILE_EXTENSIONS = [".dclx", ".dclg"];
const OPEN_FILE_HINT = `Open a DocLang file (${SUPPORTED_FILE_EXTENSIONS.join(", ")})`;
const VIRTUAL_TEXT_TAG_HINT = "DocLang virtual <text>; wrapping tags not included in source";
const DOCLANG_NS = "https://www.doclang.ai/ns/v0";
const PAGE_IMAGE_RE = /^(\d+)\.(png|jpe?g|webp)$/i;
const NO_MARKUP = "(No markup to be shown.)";
const NO_IMAGE = "(No page image available.)";
const HEAD_TAGS = new Set(["label", "thread", "xref", "href", "layer", "location", "caption", "custom"]);
const SEMANTIC_TAGS = new Set([
  "text", "heading", "footnote", "page_header", "page_footer", "field_region", "list", "table", "index",
  "formula", "code", "picture", "marker", "group", "field_heading", "field_item", "key", "value", "hint",
  "caption", "page_break",
]);
const CELL_TOKENS = new Set(["fcel", "ecel", "ched", "rhed", "corn", "srow", "lcel", "ucel", "xcel", "nl"]);
const CELL_CONTENT_TAGS = new Set(["fcel", "ecel", "ched", "rhed", "corn", "srow"]);
const CELL_SPAN_TAGS = new Set(["lcel", "ucel", "xcel"]);
const OTSL_CONTAINER_TAGS = new Set(["table", "index", "tabular"]);
const RENDER_BLOCK_TAGS = new Set([
  "text", "heading", "footnote", "page_header", "page_footer", "list", "code", "formula", "picture", "group",
  "table", "index", "tabular",
]);
const RENDER_FORMAT_TAGS = new Set([
  "bold", "italic", "underline", "strikethrough", "superscript", "subscript", "handwriting", "rtl", "content",
]);
const FORMAT_HTML_TAG = {
  bold: "strong",
  italic: "em",
  underline: "u",
  strikethrough: "s",
  superscript: "sup",
  subscript: "sub",
};

function isTextLikeNode(node) {
  return node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE;
}

function isWhitespaceOnlyText(node) {
  return isTextLikeNode(node) && !node.textContent.trim();
}

function markupAttributes(el) {
  return [...el.attributes]
    .filter((a) => a.name !== "xmlns" || a.value !== DOCLANG_NS)
    .map((a) => ({ name: a.name, value: a.value }));
}

function xmlSpan(className, text, { ghost = false } = {}) {
  const span = document.createElement("span");
  span.className = ghost ? `${className} markup-ghost-tag-part` : className;
  span.textContent = text;
  return span;
}

function createMarkupLineRow(depth, { foldToggle = false } = {}) {
  const line = createMarkupLine();
  line.style.setProperty("--markup-depth", String(depth));

  const row = document.createElement("span");
  row.className = "markup-line-content";

  const gutter = document.createElement("span");
  gutter.className = "markup-gutter";
  gutter.setAttribute("aria-hidden", "true");
  if (foldToggle) gutter.appendChild(createMarkupFoldToggle());
  row.appendChild(gutter);

  const body = document.createElement("span");
  body.className = "markup-line-body";
  row.appendChild(body);

  line.appendChild(row);
  return { line, content: body };
}

function appendMarkupAttributes(line, attributes) {
  for (const { name, value } of attributes) {
    line.appendChild(document.createTextNode(" "));
    line.appendChild(xmlSpan("xml-attr-name", name));
    line.appendChild(xmlSpan("xml-bracket", '="'));
    line.appendChild(xmlSpan("xml-attr-value", value));
    line.appendChild(xmlSpan("xml-bracket", '"'));
  }
}

function appendMarkupTextContent(line, text) {
  const cdataMatch = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(text);
  if (cdataMatch) {
    line.appendChild(xmlSpan("xml-cdata-delimiter", "<![CDATA["));
    line.appendChild(xmlSpan("xml-cdata", cdataMatch[1]));
    line.appendChild(xmlSpan("xml-cdata-delimiter", "]]>"));
    return;
  }
  line.appendChild(xmlSpan("xml-text", text));
}

function createMarkupLine() {
  const line = document.createElement("div");
  line.className = "markup-line";
  return line;
}

function appendOpenTagContent(line, tag, attributes, ghost = false) {
  line.appendChild(xmlSpan("xml-bracket", "<", { ghost }));
  line.appendChild(xmlSpan("xml-tag", tag, { ghost }));
  appendMarkupAttributes(line, attributes);
  line.appendChild(xmlSpan("xml-bracket", ">", { ghost }));
}

function createMarkupFoldToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "markup-fold-toggle";
  btn.setAttribute("aria-expanded", "true");
  btn.setAttribute("aria-label", "Collapse");
  return btn;
}

function appendMarkupFoldableOpen(parent, depth, tag, attributes, tagHint) {
  const ghost = Boolean(tagHint);
  const { line, content } = createMarkupLineRow(depth, { foldToggle: true });
  line.classList.add("markup-line-open");
  appendOpenTagContent(content, tag, attributes, ghost);

  const suffix = document.createElement("span");
  suffix.className = "markup-fold-suffix";
  suffix.appendChild(xmlSpan("xml-bracket", "...", { ghost }));
  suffix.appendChild(xmlSpan("xml-bracket", "</", { ghost }));
  suffix.appendChild(xmlSpan("xml-tag", tag, { ghost }));
  suffix.appendChild(xmlSpan("xml-bracket", ">", { ghost }));
  content.appendChild(suffix);
  parent.appendChild(line);
}

function appendMarkupCloseTag(parent, depth, tag, tagHint) {
  const ghost = Boolean(tagHint);
  const { line, content } = createMarkupLineRow(depth);
  content.appendChild(xmlSpan("xml-bracket", "</", { ghost }));
  content.appendChild(xmlSpan("xml-tag", tag, { ghost }));
  content.appendChild(xmlSpan("xml-bracket", ">", { ghost }));
  parent.appendChild(line);
}

function appendMarkupSelfClosingTag(parent, depth, tag, attributes) {
  const { line, content } = createMarkupLineRow(depth);
  content.appendChild(xmlSpan("xml-bracket", "<"));
  content.appendChild(xmlSpan("xml-tag", tag));
  appendMarkupAttributes(content, attributes);
  content.appendChild(xmlSpan("xml-bracket", "/>"));
  parent.appendChild(line);
}

function appendMarkupInlineElement(parent, depth, tag, attributes, text) {
  const { line, content } = createMarkupLineRow(depth);
  appendOpenTagContent(content, tag, attributes);
  appendMarkupTextContent(content, text);
  content.appendChild(xmlSpan("xml-bracket", "</"));
  content.appendChild(xmlSpan("xml-tag", tag));
  content.appendChild(xmlSpan("xml-bracket", ">"));
  parent.appendChild(line);
}

function appendMarkupTextLine(parent, depth, text) {
  const { line, content } = createMarkupLineRow(depth);
  appendMarkupTextContent(content, text);
  parent.appendChild(line);
}

function formatMarkupTextNode(node) {
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `<![CDATA[${node.textContent ?? ""}]]>`;
  }
  return node.textContent.trim();
}

function serializeMarkupTextNodes(nodes) {
  return [...nodes]
    .filter((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n))
    .map(formatMarkupTextNode)
    .join("");
}
const PAGE_WHEEL_COOLDOWN_MS = 200;
const PAGE_WHEEL_PIXEL_THRESHOLD = 4;
const PAGE_WHEEL_GESTURE_MS = 100;

/** @type {{ pageImages: Map<number, string>, assetUrls: Map<string, string>, currentPage: number, pageCount: number, segments: Element[][], defaultResolution: { width: number, height: number }, elementIds: Map<Element, string>, idToElement: Map<string, Element>, hasPageView: boolean, markupOnly: boolean } | null} */
let state = null;
/** @type {ResizeObserver | null} */
let pagePaneResizeObserver = null;
/** @type {string | null} */
let selectedElementId = null;
let showAllBboxes = true;

const els = {
  openFileBtn: document.getElementById("open-file-btn"),
  emptyStateFileTypes: document.getElementById("empty-state-file-types"),
  docLabel: document.getElementById("doc-label"),
  pageNav: document.getElementById("page-nav"),
  pageIndicator: document.getElementById("page-indicator"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  showAllBboxes: document.getElementById("show-all-bboxes"),
  showAllBboxesLabel: document.getElementById("show-all-bboxes-label"),
  main: document.getElementById("main"),
  emptyState: document.getElementById("empty-state"),
  markupPane: document.getElementById("markup-pane"),
  renderedPane: document.getElementById("rendered-pane"),
  pagePane: document.getElementById("page-pane"),
};

document.getElementById("btn-demo").addEventListener("click", loadDemo);
document.getElementById("demo-empty-link").addEventListener("click", (e) => {
  e.preventDefault();
  loadDemo();
});
document.getElementById("home-link").addEventListener("click", (e) => {
  e.preventDefault();
  resetViewer();
});
document.getElementById("input-archive").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (isMarkupFile(file)) loadFromMarkup(file);
  else loadFromArchive(file);
  e.target.value = "";
});
els.btnPrev.addEventListener("click", () => goToPage(state.currentPage - 1));
els.btnNext.addEventListener("click", () => goToPage(state.currentPage + 1));
els.showAllBboxes.addEventListener("change", () => {
  showAllBboxes = els.showAllBboxes.checked;
  applyBboxVisibility();
});
initFileTypeHints();
initCursorHints();
initDragDrop();
initPageWheelNav();
loadDemo();

async function loadDemo() {
  try {
    const res = await fetch(DEMO_ARCHIVE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const label = DEMO_ARCHIVE_URL.split("/").pop() || "demo.dclx";
    await openArchiveFromZipBuffer(await res.arrayBuffer(), label);
  } catch (err) {
    alert(
      `Failed to load demo: ${err.message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`,
    );
  }
}

async function loadFromFileList(fileList) {
  if (!fileList?.length) return;
  await loadFromDroppedFiles([...fileList]);
}

async function loadFromDroppedFiles(files) {
  const markupFile = files.find((f) => f.name === "document.xml");
  if (!markupFile) {
    alert("Archive must contain document.xml at its root.");
    return;
  }
  const markupXml = await markupFile.text();
  const pageImages = new Map();
  const assetUrls = new Map();
  for (const f of files) {
    const relPath = f.webkitRelativePath || f.name;
    const parts = relPath.split("/");
    if (parts.length >= 2 && parts[parts.length - 2] === "pages") {
      const m = PAGE_IMAGE_RE.exec(f.name);
      if (m) pageImages.set(Number(m[1]), URL.createObjectURL(f));
    }
    const assetPath = archiveRelativeAssetPath(relPath);
    if (assetPath) assetUrls.set(assetPath, URL.createObjectURL(f));
  }
  const rootName = (files[0].webkitRelativePath || files[0].name).split("/")[0] || "archive";
  openArchive(markupXml, pageImages, rootName, assetUrls);
}

async function loadFromArchive(file) {
  if (!file) return;
  try {
    await openArchiveFromZipBuffer(await file.arrayBuffer(), file.name);
  } catch (err) {
    alert(`Failed to read archive: ${err.message}`);
  }
}

async function loadFromMarkup(file) {
  if (!file) return;
  try {
    openMarkupDocument(await file.text(), file.name);
  } catch (err) {
    alert(`Failed to read markup: ${err.message}`);
  }
}

async function openArchiveFromZipBuffer(buffer, label) {
  const entries = await unzip(buffer);
  const markupEntry = findArchiveEntry(entries, "document.xml");
  if (!markupEntry) {
    throw new Error("Archive must contain document.xml");
  }
  const markupXml = new TextDecoder().decode(markupEntry.data);
  const pageImages = new Map();
  const assetUrls = new Map();
  for (const e of entries) {
    const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
    if (m) {
      const ext = m[2].toLowerCase().replace("jpeg", "jpg");
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      pageImages.set(Number(m[1]), URL.createObjectURL(new Blob([e.data], { type: mime })));
      continue;
    }
    if (e.name.startsWith("assets/") && !e.name.endsWith("/")) {
      assetUrls.set(
        e.name,
        URL.createObjectURL(new Blob([e.data], { type: mimeFromAssetPath(e.name) })),
      );
    }
  }
  openArchive(markupXml, pageImages, label, assetUrls);
}

function initPageWheelNav() {
  let pixelAccum = 0;
  let pixelGestureUntil = 0;
  let lastFlipAt = 0;

  function wheelDir(e) {
    if (e.deltaMode === 1) {
      return e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    }
    if (e.deltaMode === 2) {
      return Math.sign(e.deltaY);
    }
    const now = performance.now();
    if (now > pixelGestureUntil) pixelAccum = 0;
    pixelGestureUntil = now + PAGE_WHEEL_GESTURE_MS;
    pixelAccum += e.deltaY;
    if (Math.abs(pixelAccum) >= PAGE_WHEEL_PIXEL_THRESHOLD) {
      const dir = pixelAccum > 0 ? 1 : -1;
      pixelAccum = 0;
      return dir;
    }
    return 0;
  }

  function tryFlipPage(dir) {
    if (!dir || !state) return false;
    const now = performance.now();
    if (now - lastFlipAt < PAGE_WHEEL_COOLDOWN_MS) return false;
    const before = state.currentPage;
    goToPage(state.currentPage + dir);
    if (state.currentPage !== before) {
      lastFlipAt = now;
      return true;
    }
    return false;
  }

  function isScrollAtTop(pane) {
    return pane.scrollTop <= 0;
  }

  function isScrollAtBottom(pane) {
    return pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1;
  }

  function onScrollPaneWheel(e, pane) {
    if (!state || state.markupOnly || state.pageCount <= 1) return;
    const dir = wheelDir(e);
    if (!dir) return;

    const atTop = isScrollAtTop(pane);
    const atBottom = isScrollAtBottom(pane);
    const wantPrev = dir < 0 && atTop;
    const wantNext = dir > 0 && atBottom;
    if (!wantPrev && !wantNext) return;

    e.preventDefault();
    if (!tryFlipPage(dir)) return;

    requestAnimationFrame(() => {
      pane.scrollTop = dir > 0 ? 0 : pane.scrollHeight;
    });
  }

  els.pagePane.addEventListener(
    "wheel",
    (e) => {
      if (!state?.hasPageView) return;
      e.preventDefault();
      const dir = wheelDir(e);
      if (dir) tryFlipPage(dir);
    },
    { passive: false },
  );

  for (const pane of [els.markupPane, els.renderedPane]) {
    pane.addEventListener("wheel", (e) => onScrollPaneWheel(e, pane), { passive: false });
  }

  els.pagePane.tabIndex = 0;
  els.pagePane.setAttribute("role", "region");
  els.pagePane.setAttribute("aria-label", "Original page");

  els.pagePane.addEventListener("pointerdown", () => {
    if (state?.hasPageView) els.pagePane.focus({ preventScroll: true });
  });

  els.pagePane.addEventListener("keydown", (e) => {
    if (!state?.hasPageView) return;

    let dir = 0;
    switch (e.key) {
      case "ArrowDown":
      case "PageDown":
      case "ArrowRight":
        dir = 1;
        break;
      case "ArrowUp":
      case "PageUp":
      case "ArrowLeft":
        dir = -1;
        break;
      default:
        return;
    }

    e.preventDefault();
    tryFlipPage(dir);
  });
}

function initFileTypeHints() {
  const markup = SUPPORTED_FILE_EXTENSIONS.map((ext) => `<code>${ext}</code>`).join(", ");
  els.emptyStateFileTypes.innerHTML = markup;
}

function initCursorHints() {
  const hint = document.getElementById("cursor-hint");
  const offset = 10;
  const margin = 8;

  function hideHint() {
    hint.hidden = true;
  }

  function showHint(text, clientX, clientY) {
    hint.textContent = text;
    hint.hidden = false;
    let left = clientX + offset;
    let top = clientY + offset;
    const rect = hint.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - margin) {
      left = clientX - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = clientY - rect.height - offset;
    }
    hint.style.left = `${Math.max(margin, left)}px`;
    hint.style.top = `${Math.max(margin, top)}px`;
  }

  els.markupPane.addEventListener("mousemove", (e) => {
    if (!e.target.closest(".markup-ghost-tag-part")) {
      hideHint();
      return;
    }
    showHint(VIRTUAL_TEXT_TAG_HINT, e.clientX, e.clientY);
  });
  els.markupPane.addEventListener("mouseleave", hideHint);

  els.openFileBtn.addEventListener("mousemove", (e) => {
    showHint(OPEN_FILE_HINT, e.clientX, e.clientY);
  });
  els.openFileBtn.addEventListener("mouseleave", hideHint);
}

function initDragDrop() {
  document.body.addEventListener("dragenter", (e) => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    e.preventDefault();
    document.body.classList.add("drag-over");
  });

  document.body.addEventListener("dragover", (e) => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });

  document.body.addEventListener("dragleave", (e) => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    if (e.relatedTarget && document.body.contains(e.relatedTarget)) return;
    document.body.classList.remove("drag-over");
  });

  document.body.addEventListener("drop", async (e) => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    e.preventDefault();
    document.body.classList.remove("drag-over");
    await loadFromDrop(e.dataTransfer);
  });
}

function hasArchiveTransfer(dataTransfer) {
  return [...dataTransfer.types].includes("Files");
}

function isArchiveFile(file) {
  return /\.dclx$/i.test(file.name) || /\.zip$/i.test(file.name);
}

function isMarkupFile(file) {
  return /\.(?:dclg(?:\.xml)?|xml)$/i.test(file.name);
}

async function loadFromDrop(dataTransfer) {
  const files = [...dataTransfer.files];
  if (files.length === 1 && isArchiveFile(files[0])) {
    await loadFromArchive(files[0]);
    return;
  }
  if (files.length === 1 && isMarkupFile(files[0])) {
    await loadFromMarkup(files[0]);
    return;
  }

  if (files.length) {
    await loadFromDroppedFiles(files);
  }
}

function openMarkupDocument(markupXml, label) {
  openDocument(markupXml, new Map(), label, new Map(), { markupOnly: true });
}

function openArchive(markupXml, pageImages, label, assetUrls = new Map()) {
  openDocument(markupXml, pageImages, label, assetUrls, { markupOnly: false });
}

function openDocument(markupXml, pageImages, label, assetUrls, { markupOnly }) {
  revokeArchiveUrls();
  const doc = new DOMParser().parseFromString(markupXml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    alert("Invalid XML");
    return;
  }
  const root = doc.documentElement;
  if (localName(root) !== "doclang") {
    alert("Root element must be <doclang>");
    return;
  }

  const head = childElements(root).find((el) => localName(el) === "head") ?? null;
  const defaultResolution = readDefaultResolution(head);
  const segments = markupOnly
    ? [childElements(root).filter((el) => localName(el) !== "head")]
    : splitIntoSegments(root);
  const hasPageView = !markupOnly && pageImages.size > 0;
  const maxImagePage = hasPageView ? Math.max(...pageImages.keys()) : 0;
  const pageCount = markupOnly ? 1 : Math.max(segments.length, maxImagePage, 1);

  state = {
    pageImages,
    assetUrls,
    currentPage: 1,
    pageCount,
    segments,
    defaultResolution,
    hasPageView,
    markupOnly,
  };

  setPageViewVisible(hasPageView);

  setDocLabel(label);
  setDocumentOpen(true, { markupOnly });
  renderPage(1);
}

function setDocumentOpen(open, { markupOnly = false } = {}) {
  document.body.classList.toggle("viewer-loaded", open);
  document.body.classList.toggle("markup-only", open && markupOnly);
  els.pageNav.hidden = !open || markupOnly;
}

function setDocLabel(label) {
  if (label) {
    els.docLabel.textContent = label;
    els.docLabel.hidden = false;
  } else {
    els.docLabel.textContent = "";
    els.docLabel.hidden = true;
  }
}

function resetViewer() {
  if (state) revokeArchiveUrls();
  state = null;
  selectedElementId = null;
  setDocLabel(null);
  setDocumentOpen(false);
  document.body.classList.remove("has-page-view");
  els.markupPane.innerHTML = "";
  els.renderedPane.innerHTML = "";
  els.pagePane.innerHTML = "";
  els.pageIndicator.textContent = "Page 1 of 1";
  els.btnPrev.disabled = true;
  els.btnNext.disabled = true;
}

function setPageViewVisible(visible) {
  document.body.classList.toggle("has-page-view", visible);
  if (els.showAllBboxesLabel) els.showAllBboxesLabel.hidden = !visible;
  els.pagePane.tabIndex = visible ? 0 : -1;
}

function goToPage(n) {
  if (!state) return;
  const page = Math.min(Math.max(1, n), state.pageCount);
  state.currentPage = page;
  renderPage(page);
}

function renderPage(pageNum) {
  if (!state) return;
  const { segments, pageImages, pageCount, defaultResolution } = state;
  const idx = pageNum - 1;
  const segment = segments[idx] ?? [];
  selectedElementId = null;

  els.pageIndicator.textContent = `Page ${pageNum} of ${pageCount}`;
  els.btnPrev.disabled = pageNum <= 1;
  els.btnNext.disabled = pageNum >= pageCount;

  els.markupPane.innerHTML = "";
  const elementIds = assignElementIds(segment);
  state.elementIds = elementIds;
  state.idToElement = invertElementIds(elementIds);

  if (segmentHasMarkup(segment)) {
    els.markupPane.appendChild(buildMarkupView(segment, elementIds));
    els.renderedPane.innerHTML = "";
    els.renderedPane.appendChild(buildRenderedView(segment, elementIds));
  } else {
    els.markupPane.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    els.renderedPane.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
  }

  els.pagePane.innerHTML = "";
  if (state.hasPageView) {
    const imageUrl = pageImages.get(pageNum);
    if (imageUrl) {
      const wrap = document.createElement("div");
      wrap.className = "page-view";
      const img = document.createElement("img");
      img.alt = `Page ${pageNum}`;

      const onImageReady = () => {
        fitPageImage(img, els.pagePane);
        const boxes = collectBoundingBoxes(segment, defaultResolution, elementIds);
        const existing = wrap.querySelector("svg.overlay");
        if (existing) existing.remove();
        if (boxes.length) {
          wrap.appendChild(buildOverlay(img, boxes));
          applyBboxVisibility();
        }
      };

      img.addEventListener("load", onImageReady);
      wrap.appendChild(img);
      img.src = imageUrl;
      if (img.complete) onImageReady();

      if (!pagePaneResizeObserver) {
        pagePaneResizeObserver = new ResizeObserver(() => {
          const img = els.pagePane.querySelector(".page-view img");
          if (img?.naturalWidth) fitPageImage(img, els.pagePane);
        });
        pagePaneResizeObserver.observe(els.pagePane);
      }

      els.pagePane.appendChild(wrap);
    } else {
      els.pagePane.innerHTML = `<div class="placeholder">${NO_IMAGE}</div>`;
    }
  }
}

function fitPageImage(img, pane) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  const style = getComputedStyle(pane);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const maxW = pane.clientWidth - padX;
  const maxH = pane.clientHeight - padY;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  img.style.width = `${Math.round(img.naturalWidth * scale)}px`;
  img.style.height = `${Math.round(img.naturalHeight * scale)}px`;
}

function splitIntoSegments(root) {
  const body = childElements(root).filter((el) => localName(el) !== "head");
  /** @type {Element[][]} */
  const segments = [[]];
  for (const el of body) {
    if (localName(el) === "page_break") {
      segments.push([]);
    } else {
      segments[segments.length - 1].push(el);
    }
  }
  return segments.length ? segments : [[]];
}

function segmentHasMarkup(segment) {
  return segment.some((el) => el.nodeType === Node.ELEMENT_NODE);
}

function readDefaultResolution(head) {
  const fallback = { width: 512, height: 512 };
  if (!head) return fallback;
  const dr = childElements(head).find((el) => localName(el) === "default_resolution");
  if (!dr) return fallback;
  const w = parseInt(dr.getAttribute("width") ?? "512", 10);
  const h = parseInt(dr.getAttribute("height") ?? "512", 10);
  return {
    width: Number.isFinite(w) && w > 0 ? w : 512,
    height: Number.isFinite(h) && h > 0 ? h : 512,
  };
}

/** @returns {Map<Element, string>} */
function assignElementIds(segment) {
  const ids = new Map();
  let counter = 0;
  walkElements(segment, (el) => {
    ids.set(el, `el-${counter++}`);
  });
  return ids;
}

/** @returns {Map<string, Element>} */
function invertElementIds(elementIds) {
  const idToElement = new Map();
  for (const [el, id] of elementIds) idToElement.set(id, el);
  return idToElement;
}

function isSemanticElement(el) {
  return SEMANTIC_TAGS.has(localName(el));
}

function isVirtualTextHost(el) {
  const tag = localName(el);
  return tag === "ldiv" || CELL_CONTENT_TAGS.has(tag);
}

function xmlContains(target, ancestor) {
  let node = target;
  while (node) {
    if (node === ancestor) return true;
    node = node.parentNode;
  }
  return false;
}

function findListVirtualTextHost(list, target) {
  const nodes = [...list.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
      i += 1;
      continue;
    }
    const ldiv = node;
    i += 1;
    const end = skipUntilListItemBoundary(nodes, i);
    if (target === ldiv || nodes.slice(i, end).some((n) => xmlContains(target, n))) {
      return ldiv;
    }
    i = end;
  }
  return null;
}

function findTableVirtualTextHost(container, target) {
  const nodes = [...container.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "nl" || CELL_SPAN_TAGS.has(tag) || !isCellToken(tag)) {
      i += 1;
      continue;
    }
    const cell = node;
    i += 1;
    const end = skipUntilCellBoundary(nodes, i);
    if (target === cell || nodes.slice(i, end).some((n) => xmlContains(target, n))) {
      return cell;
    }
    i = end;
  }
  return null;
}

function isListOrOtslContainer(el) {
  const tag = localName(el);
  return tag === "list" || OTSL_CONTAINER_TAGS.has(tag);
}

function findVirtualTextHost(xmlEl) {
  let node = xmlEl;
  while (node) {
    const parent = node.parentElement;
    if (!parent) return null;
    const tag = localName(parent);
    if (tag === "list") {
      const host = findListVirtualTextHost(parent, xmlEl);
      if (host) return host;
    }
    if (OTSL_CONTAINER_TAGS.has(tag)) {
      const host = findTableVirtualTextHost(parent, xmlEl);
      if (host) return host;
    }
    node = parent;
  }
  return null;
}

function resolveSelectionElement(xmlEl) {
  if (!xmlEl) return null;
  if (isSemanticElement(xmlEl) || isVirtualTextHost(xmlEl)) return xmlEl;

  let node = xmlEl.parentElement;
  while (node) {
    const tag = localName(node);
    if (tag === "doclang") break;
    if (isSemanticElement(node) && !isListOrOtslContainer(node)) return node;
    node = node.parentElement;
  }

  const virtualHost = findVirtualTextHost(xmlEl);
  if (virtualHost) return virtualHost;

  node = xmlEl.parentElement;
  while (node) {
    const tag = localName(node);
    if (tag === "doclang") break;
    if (isSemanticElement(node) || isVirtualTextHost(node)) return node;
    node = node.parentElement;
  }

  return null;
}

function resolveSelectionElementId(rawElementId) {
  if (!rawElementId || !state?.idToElement || !state.elementIds) return null;
  const xmlEl = state.idToElement.get(rawElementId);
  if (!xmlEl) return null;
  const resolved = resolveSelectionElement(xmlEl);
  return resolved ? state.elementIds.get(resolved) ?? null : null;
}

function resolveMarkupClickTarget(eventTarget) {
  if (!state) return null;

  const ghostText = eventTarget.closest(".markup-el-virtual-text");
  if (ghostText?.hasAttribute("data-element-id")) {
    return ghostText.getAttribute("data-element-id");
  }

  const markupEl = eventTarget.closest(".markup-el[data-element-id]");
  if (!markupEl) return null;
  return resolveSelectionElementId(markupEl.getAttribute("data-element-id"));
}

function resolveRenderedClickTarget(eventTarget) {
  const ghostText = eventTarget.closest(".rendered-el-virtual-text");
  if (ghostText?.hasAttribute("data-element-id")) {
    return ghostText.getAttribute("data-element-id");
  }

  const renderedEl = eventTarget.closest(".rendered-el[data-element-id]");
  if (!renderedEl) return null;
  return resolveSelectionElementId(renderedEl.getAttribute("data-element-id"));
}

/** @returns {{ kind: string, tag: string, elementId: string, x0: number, y0: number, x1: number, y1: number, resW: number, resH: number }[]} */
function collectBoundingBoxes(segment, defaultResolution, elementIds) {
  /** @type {{ kind: string, tag: string, elementId: string, x0: number, y0: number, x1: number, y1: number, resW: number, resH: number }[]} */
  const boxes = [];
  walkElements(segment, (el) => {
    const locs = headLocations(el);
    if (locs.length !== 4) return;
    const elementId = elementIds.get(el);
    if (!elementId) return;
    pushBoundingBox(boxes, locs, defaultResolution, localName(el), elementLabel(el), elementId);
  });
  walkElements(segment, (el) => {
    const tag = localName(el);
    if (tag === "list") collectListVirtualTextBoxes(el, defaultResolution, boxes, elementIds);
    else if (tag === "table" || tag === "index" || tag === "tabular") {
      collectTableVirtualTextBoxes(el, defaultResolution, boxes, elementIds);
    }
  });
  return boxes;
}

function pushBoundingBox(boxes, locs, defaultResolution, kind, tag, elementId) {
  const [x0el, y0el, x1el, y1el] = locs;
  const resW = locationResolution(x0el, defaultResolution.width);
  const resH = locationResolution(y0el, defaultResolution.height);
  boxes.push({
    kind,
    tag,
    elementId,
    x0: parseInt(x0el.getAttribute("value") ?? "0", 10),
    y0: parseInt(y0el.getAttribute("value") ?? "0", 10),
    x1: parseInt(x1el.getAttribute("value") ?? "0", 10),
    y1: parseInt(y1el.getAttribute("value") ?? "0", 10),
    resW,
    resH,
  });
}

function collectListVirtualTextBoxes(list, defaultResolution, boxes, elementIds) {
  const nodes = [...list.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
      i += 1;
      continue;
    }
    i += 1;
    const head = parseElementHeadAt(nodes, i);
    if (head) {
      const elementId = elementIds.get(node);
      if (elementId) pushBoundingBox(boxes, head.locs, defaultResolution, "text", "text", elementId);
      i = head.nextIndex;
    }
    i = skipUntilListItemBoundary(nodes, i);
  }
}

function collectTableVirtualTextBoxes(container, defaultResolution, boxes, elementIds) {
  const nodes = [...container.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (!isCellToken(tag)) {
      i += 1;
      continue;
    }
    if (tag === "nl") {
      i += 1;
      continue;
    }
    i += 1;
    const head = parseElementHeadAt(nodes, i);
    if (head) {
      const elementId = elementIds.get(node);
      if (elementId) pushBoundingBox(boxes, head.locs, defaultResolution, "text", "text", elementId);
      i = head.nextIndex;
    }
    i = skipUntilCellBoundary(nodes, i);
  }
}

function skipContainerLevelHead(nodes, startIdx) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "ldiv" || isCellToken(tag)) break;
    if (HEAD_TAGS.has(tag) || tag === "location") {
      i += 1;
      continue;
    }
    break;
  }
  return i;
}

function skipUntilListItemBoundary(nodes, startIdx) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && localName(node) === "ldiv") break;
    i += 1;
  }
  return i;
}

function skipUntilCellBoundary(nodes, startIdx) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && isCellToken(localName(node))) break;
    i += 1;
  }
  return i;
}

function isCellToken(tag) {
  return CELL_TOKENS.has(tag);
}

/** @returns {{ locs: Element[], nextIndex: number } | null} */
function parseElementHeadAt(nodes, startIdx) {
  const locs = [];
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "location") {
      locs.push(node);
      i += 1;
      if (locs.length === 4) return { locs, nextIndex: i };
      continue;
    }
    if (locs.length) break;
    if (HEAD_TAGS.has(tag)) {
      i += 1;
      continue;
    }
    break;
  }
  return locs.length === 4 ? { locs, nextIndex: i } : null;
}

function walkElements(nodes, fn) {
  for (const node of nodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    fn(node);
    walkElements(childElements(node), fn);
  }
}

function headLocations(el) {
  return parseElementHeadAt([...el.childNodes], 0)?.locs ?? [];
}

function locationResolution(el, axisDefault) {
  const r = parseInt(el.getAttribute("resolution") ?? String(axisDefault), 10);
  return Number.isFinite(r) && r > 0 ? r : axisDefault;
}

function elementLabel(el) {
  const tag = localName(el);
  const level = el.getAttribute("level");
  if (level) return `${tag}[${level}]`;
  const cls = el.getAttribute("class");
  if (cls) return `${tag}.${cls}`;
  return tag;
}

function bboxClassForKind(kind) {
  if (kind.startsWith("field_") || kind === "key" || kind === "value") return "field";
  const known = new Set([
    "text", "heading", "list", "ldiv", "table", "index", "formula", "code", "picture",
    "group", "footnote", "page_header", "page_footer", "caption",
  ]);
  return known.has(kind) ? kind : "default";
}

function boxPixelRect(b, img) {
  const x = (b.x0 / b.resW) * img.naturalWidth;
  const y = (b.y0 / b.resH) * img.naturalHeight;
  const w = ((b.x1 - b.x0) / b.resW) * img.naturalWidth;
  const h = ((b.y1 - b.y0) / b.resH) * img.naturalHeight;
  return { x, y, w, h, area: w * h };
}

function imageCoordsFromEvent(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM()?.inverse();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm);
  return { x: p.x, y: p.y };
}

function hitTestBoxes(boxes, img, x, y) {
  let best = null;
  let bestArea = Infinity;
  for (const b of boxes) {
    const { x: bx, y: by, w, h, area } = boxPixelRect(b, img);
    if (x >= bx && x <= bx + w && y >= by && y <= by + h && area < bestArea) {
      best = b;
      bestArea = area;
    }
  }
  return best;
}

function buildOverlay(img, boxes) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("overlay");
  svg.setAttribute("viewBox", `0 0 ${img.naturalWidth} ${img.naturalHeight}`);

  for (const b of boxes) {
    const { x, y, w, h } = boxPixelRect(b, img);
    const cls = bboxClassForKind(b.kind);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", `bbox bbox-${cls}`);
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(Math.max(w, 1)));
    rect.setAttribute("height", String(Math.max(h, 1)));
    rect.setAttribute("data-element-id", b.elementId);
    svg.appendChild(rect);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", `bbox-label bbox-label-${cls}`);
    text.setAttribute("x", String(x + 4));
    text.setAttribute("y", String(y + 14));
    text.setAttribute("data-element-id", b.elementId);
    text.textContent = b.tag;
    svg.appendChild(text);
  }

  svg.addEventListener("click", (e) => {
    const hitTarget = e.target.closest("[data-element-id]");
    if (hitTarget) {
      const elementId = resolveSelectionElementId(hitTarget.getAttribute("data-element-id"));
      if (elementId) selectElement(elementId);
      return;
    }
    const coords = imageCoordsFromEvent(svg, e);
    if (!coords) return;
    const hit = hitTestBoxes(boxes, img, coords.x, coords.y);
    if (hit) selectElement(hit.elementId);
    else clearSelection();
  });

  return svg;
}

function selectElement(elementId) {
  if (!elementId) return;
  selectedElementId = elementId;
  applySelection();
}

function clearSelection() {
  selectedElementId = null;
  applySelection();
}

function applyBboxVisibility() {
  if (!state?.hasPageView) return;

  for (const el of els.pagePane.querySelectorAll(".bbox, .bbox-label")) {
    if (showAllBboxes) {
      el.classList.remove("bbox-hidden");
      continue;
    }
    const elementId = el.getAttribute("data-element-id");
    el.classList.toggle("bbox-hidden", elementId !== selectedElementId);
  }
}

function findMarkupElementForSelection(elementId) {
  return (
    els.markupPane.querySelector(`.markup-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.markupPane.querySelector(`[data-element-id="${elementId}"]`)
  );
}

function findRenderedElementForSelection(elementId) {
  return (
    els.renderedPane.querySelector(`.rendered-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.renderedPane.querySelector(`[data-element-id="${elementId}"]`)
  );
}

function applySelection() {
  els.markupPane.querySelectorAll(".markup-el.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  els.renderedPane.querySelectorAll(".rendered-el.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  els.pagePane.querySelectorAll(".bbox.selected, .bbox-label.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  if (!selectedElementId) {
    applyBboxVisibility();
    return;
  }

  const markupEl = findMarkupElementForSelection(selectedElementId);
  if (markupEl) {
    markupEl.classList.add("selected");
    markupEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  const renderedEl = findRenderedElementForSelection(selectedElementId);
  if (renderedEl) {
    renderedEl.classList.add("selected");
    renderedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  if (state?.hasPageView) {
    for (const el of els.pagePane.querySelectorAll(`[data-element-id="${selectedElementId}"]`)) {
      el.classList.add("selected");
    }
  }

  applyBboxVisibility();
}

function buildMarkupView(segment, elementIds) {
  const root = document.createElement("div");
  root.className = "markup";
  for (const el of segment) {
    if (el.nodeType === Node.ELEMENT_NODE) {
      root.appendChild(buildMarkupElement(el, 0, elementIds));
    }
  }
  root.addEventListener("click", (e) => {
    const toggle = e.target.closest(".markup-fold-toggle");
    if (toggle) {
      e.stopPropagation();
      const block = toggle.closest(".markup-el-foldable");
      if (block) {
        const collapsed = block.classList.toggle("markup-collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
        toggle.setAttribute("aria-label", collapsed ? "Expand" : "Collapse");
      }
      return;
    }
    const elementId = resolveMarkupClickTarget(e.target);
    if (elementId) selectElement(elementId);
  });
  return root;
}

function sliceHasMarkupContent(nodes) {
  for (const node of nodes) {
    if (isTextLikeNode(node) && !isWhitespaceOnlyText(node)) return true;
    if (node.nodeType === Node.ELEMENT_NODE) return true;
  }
  return false;
}

function shouldWrapVirtualText(contentNodes) {
  if (!sliceHasMarkupContent(contentNodes)) return false;
  if (contentNodes.some((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n))) return true;

  let i = 0;
  while (i < contentNodes.length && isWhitespaceOnlyText(contentNodes[i])) i += 1;
  while (i < contentNodes.length) {
    const node = contentNodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) break;
    const tag = localName(node);
    if (tag === "location") {
      i += 1;
      continue;
    }
    if (HEAD_TAGS.has(tag)) {
      i += 1;
      continue;
    }
    break;
  }
  while (i < contentNodes.length && isWhitespaceOnlyText(contentNodes[i])) i += 1;
  if (i < contentNodes.length && contentNodes[i].nodeType === Node.ELEMENT_NODE && localName(contentNodes[i]) === "text") {
    i += 1;
    while (i < contentNodes.length && isWhitespaceOnlyText(contentNodes[i])) i += 1;
    if (i >= contentNodes.length) return false;
  }
  return true;
}

function appendMarkupNodesFromSlice(parent, depth, nodes, elementIds) {
  for (const child of nodes) {
    if (isTextLikeNode(child)) {
      const text = formatMarkupTextNode(child);
      if (text) appendMarkupTextLine(parent, depth, text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      parent.appendChild(buildMarkupElement(child, depth, elementIds));
    }
  }
}

function appendMarkupVirtualText(parent, depth, hostEl, contentNodes, elementIds) {
  if (!shouldWrapVirtualText(contentNodes)) {
    appendMarkupNodesFromSlice(parent, depth, contentNodes, elementIds);
    return;
  }

  const block = document.createElement("div");
  block.className = "markup-el markup-el-virtual-text";
  const elementId = elementIds.get(hostEl);
  if (elementId) block.setAttribute("data-element-id", elementId);

  appendMarkupFoldableOpen(block, depth, "text", [], VIRTUAL_TEXT_TAG_HINT);
  block.classList.add("markup-el-foldable");

  const foldBody = document.createElement("div");
  foldBody.className = "markup-fold-body";
  const children = document.createElement("div");
  children.className = "markup-children";
  appendMarkupNodesFromSlice(children, depth + 1, contentNodes, elementIds);
  foldBody.appendChild(children);
  appendMarkupCloseTag(foldBody, depth, "text", VIRTUAL_TEXT_TAG_HINT);
  block.appendChild(foldBody);
  parent.appendChild(block);
}

function buildMarkupFoldableElement(el, depth, elementIds, buildBody) {
  const block = document.createElement("div");
  block.className = "markup-el";
  const elementId = elementIds.get(el);
  if (elementId) block.setAttribute("data-element-id", elementId);

  const tag = localName(el);
  const attributes = markupAttributes(el);
  appendMarkupFoldableOpen(block, depth, tag, attributes);
  block.classList.add("markup-el-foldable");

  const foldBody = document.createElement("div");
  foldBody.className = "markup-fold-body";
  const children = document.createElement("div");
  children.className = "markup-children";
  buildBody(children, depth + 1);
  foldBody.appendChild(children);
  appendMarkupCloseTag(foldBody, depth, tag);
  block.appendChild(foldBody);
  return block;
}

function buildMarkupList(el, depth, elementIds) {
  return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
    const nodes = [...el.childNodes];
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && localName(node) === "ldiv") break;
      if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) {
        i += 1;
        continue;
      }
      if (isTextLikeNode(node)) break;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = localName(node);
        if (HEAD_TAGS.has(tag) || tag === "location") {
          children.appendChild(buildMarkupElement(node, childDepth, elementIds));
          i += 1;
          continue;
        }
      }
      break;
    }
    while (i < nodes.length) {
      const node = nodes[i];
      if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
        appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
        i += 1;
        continue;
      }
      const ldiv = node;
      children.appendChild(buildMarkupElement(ldiv, childDepth, elementIds));
      i += 1;
      const end = skipUntilListItemBoundary(nodes, i);
      appendMarkupVirtualText(children, childDepth, ldiv, nodes.slice(i, end), elementIds);
      i = end;
    }
  });
}

function buildMarkupOtslContainer(el, depth, elementIds) {
  return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
    const nodes = [...el.childNodes];
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && isCellToken(localName(node))) break;
      if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) {
        i += 1;
        continue;
      }
      if (isTextLikeNode(node)) break;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = localName(node);
        if (HEAD_TAGS.has(tag) || tag === "location" || tag === "h_thread") {
          children.appendChild(buildMarkupElement(node, childDepth, elementIds));
          i += 1;
          continue;
        }
      }
      break;
    }
    while (i < nodes.length) {
      const node = nodes[i];
      if (node.nodeType !== Node.ELEMENT_NODE) {
        appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
        i += 1;
        continue;
      }
      const tag = localName(node);
      if (tag === "nl") {
        appendMarkupSelfClosingTag(children, childDepth, "nl", []);
        i += 1;
        continue;
      }
      if (!isCellToken(tag)) {
        appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
        i += 1;
        continue;
      }
      const cell = node;
      children.appendChild(buildMarkupElement(cell, childDepth, elementIds));
      i += 1;
      if (CELL_SPAN_TAGS.has(tag)) continue;
      const end = skipUntilCellBoundary(nodes, i);
      appendMarkupVirtualText(children, childDepth, cell, nodes.slice(i, end), elementIds);
      i = end;
    }
  });
}

function buildMarkupElement(el, depth, elementIds) {
  const tag = localName(el);
  if (tag === "list") return buildMarkupList(el, depth, elementIds);
  if (OTSL_CONTAINER_TAGS.has(tag)) return buildMarkupOtslContainer(el, depth, elementIds);

  const block = document.createElement("div");
  block.className = "markup-el";
  const elementId = elementIds.get(el);
  if (elementId) block.setAttribute("data-element-id", elementId);

  const attributes = markupAttributes(el);

  if (!el.childNodes.length) {
    appendMarkupSelfClosingTag(block, depth, tag, attributes);
    return block;
  }

  const meaningfulText = [...el.childNodes].filter((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n));
  const textOnly = meaningfulText.length > 0 && meaningfulText.every(isTextLikeNode) && !childElements(el).length;
  if (textOnly) {
    const text = serializeMarkupTextNodes(el.childNodes);
    if (text) {
      appendMarkupInlineElement(block, depth, tag, attributes, text);
      return block;
    }
  }

  appendMarkupFoldableOpen(block, depth, tag, attributes);
  block.classList.add("markup-el-foldable");

  const foldBody = document.createElement("div");
  foldBody.className = "markup-fold-body";
  const children = document.createElement("div");
  children.className = "markup-children";
  for (const child of el.childNodes) {
    if (isTextLikeNode(child)) {
      const text = formatMarkupTextNode(child);
      if (text) appendMarkupTextLine(children, depth + 1, text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      children.appendChild(buildMarkupElement(child, depth + 1, elementIds));
    }
  }
  foldBody.appendChild(children);
  appendMarkupCloseTag(foldBody, depth, tag);
  block.appendChild(foldBody);
  return block;
}

function buildRenderedView(segment, elementIds) {
  const root = document.createElement("article");
  root.className = "rendered-doc";
  for (const el of segment) {
    if (el.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = localName(el);
    if (tag === "page_break") continue;
    const rendered = renderBlockElement(el, elementIds, { inline: false });
    if (rendered) root.appendChild(rendered);
  }
  root.addEventListener("click", (e) => {
    const elementId = resolveRenderedClickTarget(e.target);
    if (elementId) selectElement(elementId);
  });
  return root;
}

function wrapRendered(el, node, elementId, extraClass) {
  const wrap = document.createElement("div");
  wrap.className = `rendered-el rendered-${localName(el)}${extraClass ? ` ${extraClass}` : ""}`;
  if (elementId) wrap.setAttribute("data-element-id", elementId);
  wrap.appendChild(node);
  return wrap;
}

function renderBlockElement(el, elementIds, ctx) {
  const tag = localName(el);
  const elementId = elementIds.get(el);

  switch (tag) {
    case "text": {
      const p = document.createElement("p");
      appendRenderedBody(p, el, elementIds, { inline: true });
      return wrapRendered(el, p, elementId);
    }
    case "heading": {
      const level = Math.min(Math.max(parseInt(el.getAttribute("level") ?? "1", 10) || 1, 1), 6);
      const h = document.createElement(`h${level}`);
      appendRenderedBody(h, el, elementIds, { inline: true });
      return wrapRendered(el, h, elementId);
    }
    case "footnote": {
      const aside = document.createElement("aside");
      aside.className = "rendered-footnote";
      appendRenderedBody(aside, el, elementIds, { inline: false });
      return wrapRendered(el, aside, elementId);
    }
    case "page_header": {
      const header = document.createElement("header");
      header.className = "rendered-page-header";
      appendRenderedBody(header, el, elementIds, { inline: true });
      return wrapRendered(el, header, elementId);
    }
    case "page_footer": {
      const footer = document.createElement("footer");
      footer.className = "rendered-page-footer";
      appendRenderedBody(footer, el, elementIds, { inline: true });
      return wrapRendered(el, footer, elementId);
    }
    case "list":
      return renderList(el, elementIds);
    case "table":
    case "index":
    case "tabular":
      return renderOtslContainer(el, elementIds);
    case "code":
      return renderCode(el, elementIds, ctx);
    case "formula":
      return renderFormula(el, elementIds, ctx);
    case "picture":
      return renderPicture(el, elementIds);
    case "group": {
      const div = document.createElement("div");
      div.className = "rendered-group";
      appendRenderedBodyBlocks(div, el, elementIds);
      return wrapRendered(el, div, elementId);
    }
    default:
      return renderUnsupported(el, elementIds);
  }
}

function renderUnsupported(el, elementIds) {
  const stub = document.createElement("div");
  stub.className = "rendered-unsupported";
  stub.textContent = `<${localName(el)}> — not yet rendered`;
  return wrapRendered(el, stub, elementIds.get(el));
}

function skipElementHeadNodes(nodes, startIdx) {
  let i = startIdx;
  while (i < nodes.length && isWhitespaceOnlyText(nodes[i])) i += 1;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && HEAD_TAGS.has(localName(node))) {
      i += 1;
      while (i < nodes.length && isWhitespaceOnlyText(nodes[i])) i += 1;
      continue;
    }
    break;
  }
  return i;
}

function readCaptionElement(el) {
  return childElements(el).find((c) => localName(c) === "caption") ?? null;
}

function appendRenderedBody(parent, el, elementIds, ctx) {
  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  while (i < nodes.length) {
    appendRenderedNode(parent, nodes[i], elementIds, ctx);
    i += 1;
  }
}

function appendRenderedBodyBlocks(parent, el, elementIds) {
  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
      const rendered = renderBlockElement(node, elementIds, { inline: false });
      if (rendered) parent.appendChild(rendered);
    } else {
      appendRenderedNode(parent, node, elementIds, { inline: false });
    }
    i += 1;
  }
}

function appendRenderedNode(parent, node, elementIds, ctx) {
  if (isTextLikeNode(node)) {
    const text = node.textContent;
    if (!text || !text.trim()) return;
    parent.appendChild(document.createTextNode(text));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tag = localName(node);
  if (HEAD_TAGS.has(tag)) return;

  if (RENDER_FORMAT_TAGS.has(tag)) {
    parent.appendChild(renderFormatElement(node, elementIds, ctx));
    return;
  }

  if (tag === "code" || tag === "formula") {
    const rendered = renderBlockElement(node, elementIds, { inline: true });
    if (rendered) parent.appendChild(rendered);
    return;
  }

  if (RENDER_BLOCK_TAGS.has(tag)) {
    const rendered = renderBlockElement(node, elementIds, ctx);
    if (rendered) parent.appendChild(rendered);
    return;
  }

  if (tag === "marker" || tag === "checkbox" || tag === "ldiv") return;
  if (isCellToken(tag) || tag === "src" || tag === "tabular") return;

  appendRenderedBody(parent, node, elementIds, ctx);
}

function renderFormatElement(el, elementIds, ctx) {
  const tag = localName(el);
  if (tag === "content") {
    const span = document.createElement("span");
    span.textContent = el.textContent ?? "";
    return span;
  }

  let node;
  if (tag === "handwriting") {
    node = document.createElement("span");
    node.className = "rendered-handwriting";
  } else if (tag === "rtl") {
    node = document.createElement("bdi");
    node.setAttribute("dir", "rtl");
  } else {
    node = document.createElement(FORMAT_HTML_TAG[tag] ?? "span");
  }

  appendRenderedBody(node, el, elementIds, ctx);
  return node;
}

function renderCode(el, elementIds, ctx) {
  const labelEl = childElements(el).find((c) => localName(c) === "label");
  const labelValue = labelEl?.getAttribute("value");

  const code = document.createElement("code");
  appendRenderedBody(code, el, elementIds, { inline: ctx.inline });

  if (ctx.inline) {
    code.classList.add("rendered-el");
    const id = elementIds.get(el);
    if (id) code.setAttribute("data-element-id", id);
    return code;
  }

  const pre = document.createElement("pre");
  if (labelValue && labelValue !== "undefined") {
    const label = document.createElement("span");
    label.className = "rendered-code-label";
    label.textContent = labelValue;
    pre.appendChild(label);
  }
  pre.appendChild(code);
  return wrapRendered(el, pre, elementIds.get(el));
}

function renderFormula(el, elementIds, ctx) {
  const span = document.createElement("span");
  span.className = ctx.inline ? "rendered-formula-inline" : "rendered-formula";
  appendRenderedBody(span, el, elementIds, { inline: true });
  if (ctx.inline) {
    span.classList.add("rendered-el");
    const id = elementIds.get(el);
    if (id) span.setAttribute("data-element-id", id);
    return span;
  }
  return wrapRendered(el, span, elementIds.get(el));
}

function renderPicture(el, elementIds) {
  const figure = document.createElement("figure");
  const captionEl = readCaptionElement(el);
  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  let imgAppended = false;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "src") {
      const uri = node.getAttribute("uri");
      if (uri) {
        const img = document.createElement("img");
        img.src = resolveArchiveUri(uri);
        img.alt = captionEl?.textContent?.trim() ?? "";
        figure.appendChild(img);
        imgAppended = true;
        if (captionEl) {
          const figcaption = document.createElement("figcaption");
          appendRenderedBody(figcaption, captionEl, elementIds, { inline: true });
          figure.appendChild(figcaption);
        }
      }
      i += 1;
      continue;
    }
    if (tag === "tabular") {
      const rendered = renderOtslContainer(node, elementIds);
      if (rendered) figure.appendChild(rendered);
      i += 1;
      continue;
    }
    break;
  }

  if (captionEl && !imgAppended) {
    const figcaption = document.createElement("figcaption");
    appendRenderedBody(figcaption, captionEl, elementIds, { inline: true });
    figure.appendChild(figcaption);
  }

  const bodyInner = document.createElement("div");
  bodyInner.className = "rendered-picture-contents-body";
  appendPictureBodyContent(bodyInner, nodes, i, elementIds);
  if (bodyInner.textContent.trim()) {
    const details = document.createElement("details");
    details.className = "rendered-picture-contents";
    const summary = document.createElement("summary");
    summary.textContent = "Picture contents";
    details.appendChild(summary);
    details.appendChild(bodyInner);
    figure.appendChild(details);
  }

  return wrapRendered(el, figure, elementIds.get(el));
}

function appendPictureBodyContent(container, nodes, startIdx, elementIds) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
      const rendered = renderBlockElement(node, elementIds, { inline: false });
      if (rendered) container.appendChild(rendered);
    } else {
      appendRenderedNode(container, node, elementIds, { inline: false });
    }
    i += 1;
  }
}

function renderVirtualTextBlock(hostEl, contentNodes, elementIds) {
  const hasBlock = contentNodes.some(
    (n) => n.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(n)),
  );
  const inner = document.createElement(hasBlock ? "div" : "p");
  for (const node of contentNodes) {
    if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
      const rendered = renderBlockElement(node, elementIds, { inline: false });
      if (rendered) inner.appendChild(rendered);
    } else {
      appendRenderedNode(inner, node, elementIds, { inline: true });
    }
  }
  const wrap = document.createElement("div");
  wrap.className = "rendered-el rendered-text rendered-el-virtual-text";
  const elementId = elementIds.get(hostEl);
  if (elementId) wrap.setAttribute("data-element-id", elementId);
  wrap.appendChild(inner);
  return wrap;
}

function renderList(el, elementIds) {
  const listClass = el.getAttribute("class") ?? "unordered";
  const list = document.createElement(listClass === "ordered" ? "ol" : "ul");
  const nodes = [...el.childNodes];
  let i = skipContainerLevelHead(nodes, 0);

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node) !== "ldiv") {
      i += 1;
      continue;
    }

    const ldiv = node;
    i += 1;
    const li = document.createElement("li");

    for (const child of childElements(ldiv)) {
      const childTag = localName(child);
      if (childTag === "marker") {
        const marker = document.createElement("span");
        marker.className = "rendered-marker";
        appendRenderedBody(marker, child, elementIds, { inline: true });
        li.appendChild(marker);
      } else if (childTag === "checkbox") {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.disabled = true;
        cb.checked = child.getAttribute("class") === "selected";
        li.appendChild(cb);
      }
    }

    const contentStart = i;
    const head = parseElementHeadAt(nodes, i);
    if (head) i = head.nextIndex;

    while (i < nodes.length) {
      const contentNode = nodes[i];
      if (contentNode.nodeType === Node.ELEMENT_NODE && localName(contentNode) === "ldiv") break;
      i += 1;
    }

    const contentNodes = nodes.slice(contentStart, i);
    if (shouldWrapVirtualText(contentNodes)) {
      li.appendChild(renderVirtualTextBlock(ldiv, contentNodes, elementIds));
    } else if (sliceHasMarkupContent(contentNodes)) {
      for (const contentNode of contentNodes) {
        if (contentNode.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(contentNode))) {
          li.appendChild(renderBlockElement(contentNode, elementIds, { inline: false }));
        } else {
          appendRenderedNode(li, contentNode, elementIds, { inline: true });
        }
      }
    }

    list.appendChild(li);
  }

  return wrapRendered(el, list, elementIds.get(el));
}

function isHeaderCellKind(kind) {
  return kind === "ched" || kind === "rhed" || kind === "corn" || kind === "srow";
}

function skipOtslContainerHead(nodes, startIdx) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (isCellToken(tag)) break;
    if (HEAD_TAGS.has(tag) || tag === "h_thread" || tag === "location") {
      i += 1;
      continue;
    }
    break;
  }
  return i;
}

/** @returns {{ kind: string, token: Element, contentNodes: Node[] }[][]} */
function parseOtslRows(container) {
  const nodes = [...container.childNodes];
  let i = skipOtslContainerHead(nodes, 0);
  /** @type {{ kind: string, token: Element, contentNodes: Node[] }[][]} */
  const rows = [];
  /** @type {{ kind: string, token: Element, contentNodes: Node[] }[]} */
  let currentRow = [];

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "nl") {
      rows.push(currentRow);
      currentRow = [];
      i += 1;
      continue;
    }
    if (!isCellToken(tag)) {
      i += 1;
      continue;
    }

    if (CELL_SPAN_TAGS.has(tag)) {
      currentRow.push({ kind: tag, token: node, contentNodes: [] });
      i += 1;
      continue;
    }

    i += 1;
    const head = parseElementHeadAt(nodes, i);
    if (head) i = head.nextIndex;
    const contentStart = i;
    i = skipUntilCellBoundary(nodes, i);
    currentRow.push({ kind: tag, token: node, contentNodes: nodes.slice(contentStart, i) });
  }

  if (currentRow.length) rows.push(currentRow);
  return rows;
}

function findVerticalCellOrigin(grid, row, col) {
  for (let r = row - 1; r >= 0; r -= 1) {
    const cell = grid[r]?.[col];
    if (!cell || cell.covered) continue;
    return { cell, row: r, col };
  }
  return null;
}

function findHorizontalCellOrigin(grid, row, col) {
  for (let c = col - 1; c >= 0; c -= 1) {
    const cell = grid[row]?.[c];
    if (!cell || cell.covered) continue;
    return { cell, row, col: c };
  }
  return null;
}

function nextFreeColumn(grid, row, col) {
  let c = col;
  while (grid[row]?.[c]?.covered) c += 1;
  return c;
}

/** @returns {{ kind: string, token: Element, contentNodes: Node[], colspan: number, rowspan: number, covered?: boolean }[][]} */
function buildOtslGrid(rows) {
  /** @type {{ kind: string, token: Element, contentNodes: Node[], colspan: number, rowspan: number, covered?: boolean }[][]} */
  const grid = [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    if (!grid[rowIdx]) grid[rowIdx] = [];
    let col = 0;

    for (const parsed of rows[rowIdx]) {
      col = nextFreeColumn(grid, rowIdx, col);

      if (parsed.kind === "lcel") {
        const origin = findHorizontalCellOrigin(grid, rowIdx, col);
        if (origin) origin.cell.colspan += 1;
        grid[rowIdx][col] = { kind: "lcel", token: parsed.token, contentNodes: [], colspan: 0, rowspan: 0, covered: true };
        col += 1;
        continue;
      }

      if (parsed.kind === "ucel") {
        const origin = findVerticalCellOrigin(grid, rowIdx, col);
        if (origin) origin.cell.rowspan += 1;
        grid[rowIdx][col] = { kind: "ucel", token: parsed.token, contentNodes: [], colspan: 0, rowspan: 0, covered: true };
        col += 1;
        continue;
      }

      if (parsed.kind === "xcel") {
        const vOrigin = findVerticalCellOrigin(grid, rowIdx, col);
        const hOrigin = findHorizontalCellOrigin(grid, rowIdx, col);
        if (vOrigin && hOrigin && vOrigin.cell === hOrigin.cell) {
          vOrigin.cell.rowspan += 1;
          vOrigin.cell.colspan += 1;
        } else {
          if (vOrigin) vOrigin.cell.rowspan += 1;
          if (hOrigin) hOrigin.cell.colspan += 1;
        }
        grid[rowIdx][col] = { kind: "xcel", token: parsed.token, contentNodes: [], colspan: 0, rowspan: 0, covered: true };
        col += 1;
        continue;
      }

      grid[rowIdx][col] = {
        kind: parsed.kind,
        token: parsed.token,
        contentNodes: parsed.contentNodes,
        colspan: 1,
        rowspan: 1,
        covered: false,
      };
      col += 1;
    }
  }

  return grid;
}

function appendTableCellContent(container, nodes, elementIds, cellToken) {
  if (shouldWrapVirtualText(nodes)) {
    container.appendChild(renderVirtualTextBlock(cellToken, nodes, elementIds));
    return;
  }
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
      const rendered = renderBlockElement(node, elementIds, { inline: false });
      if (rendered) container.appendChild(rendered);
    } else {
      appendRenderedNode(container, node, elementIds, { inline: true });
    }
  }
}

function renderOtslContainer(el, elementIds) {
  const table = document.createElement("table");
  table.className = "rendered-table";

  const captionEl = readCaptionElement(el);
  if (captionEl) {
    const caption = document.createElement("caption");
    appendRenderedBody(caption, captionEl, elementIds, { inline: true });
    table.appendChild(caption);
  }

  const grid = buildOtslGrid(parseOtslRows(el));
  const tbody = document.createElement("tbody");

  for (const row of grid) {
    const tr = document.createElement("tr");
    for (const cell of row) {
      if (!cell || cell.covered) continue;
      const cellTag = isHeaderCellKind(cell.kind) ? "th" : "td";
      const td = document.createElement(cellTag);
      if (cell.colspan > 1) td.colSpan = cell.colspan;
      if (cell.rowspan > 1) td.rowSpan = cell.rowspan;
      appendTableCellContent(td, cell.contentNodes, elementIds, cell.token);
      tr.appendChild(td);
    }
    if (tr.childNodes.length) tbody.appendChild(tr);
  }

  if (tbody.childNodes.length) table.appendChild(tbody);
  return wrapRendered(el, table, elementIds.get(el));
}

function serializeSegment(segment) {
  return segment.map((el) => serializeElement(el, 0)).join("\n");
}

function serializeElement(el, depth) {
  const pad = "  ".repeat(depth);
  const tag = localName(el);
  const attrs = [...el.attributes]
    .filter((a) => a.name !== "xmlns" || a.value !== DOCLANG_NS)
    .map((a) => `${a.name}="${a.value}"`)
    .join(" ");
  const attrStr = attrs ? ` ${attrs}` : "";

  if (!el.childNodes.length) return `${pad}<${tag}${attrStr}/>`;

  const meaningfulText = [...el.childNodes].filter((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n));
  const textOnly = meaningfulText.length > 0 && meaningfulText.every(isTextLikeNode) && !childElements(el).length;
  if (textOnly) {
    const text = serializeMarkupTextNodes(el.childNodes);
    if (text) {
      return `${pad}<${tag}${attrStr}>${text}</${tag}>`;
    }
  }

  const parts = [`${pad}<${tag}${attrStr}>`];
  for (const child of el.childNodes) {
    if (isTextLikeNode(child)) {
      const text = formatMarkupTextNode(child);
      if (text) parts.push("  ".repeat(depth + 1) + text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      parts.push(serializeElement(child, depth + 1));
    }
  }
  parts.push(`${pad}</${tag}>`);
  return parts.join("\n");
}

function childElements(el) {
  return [...el.children];
}

function localName(el) {
  return el.localName || el.tagName.replace(/^.*:/, "");
}

function normalizeArchivePath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function archiveRelativeAssetPath(path) {
  const norm = normalizeArchivePath(path);
  const idx = norm.indexOf("assets/");
  return idx === -1 ? null : norm.slice(idx);
}

function mimeFromAssetPath(path) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function resolveArchiveUri(uri) {
  if (!uri || /^(data:|https?:|blob:|\/\/)/i.test(uri)) return uri;
  return state?.assetUrls?.get(normalizeArchivePath(uri)) ?? uri;
}

function revokeArchiveUrls() {
  if (!state) return;
  for (const url of state.pageImages.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  for (const url of state.assetUrls.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
}

async function unzip(buffer) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("ZIP decompression requires a browser with DecompressionStream support");
  }

  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  /** @type {{ name: string, data: Uint8Array }[]} */
  const entries = [];
  let offset = centralDirOffset;

  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory");
    }

    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const rawName = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const name = normalizeZipEntryName(rawName);

    offset += 46 + nameLength + extraLength + commentLength;

    if (!name || name.endsWith("/") || isIgnoredArchiveEntry(name)) continue;

    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
    const data = await decompressZipEntry(compressed, compression, uncompressedSize);
    entries.push({ name, data });
  }

  return entries;
}

function findEndOfCentralDirectory(bytes) {
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      return i;
    }
  }
  throw new Error("Invalid ZIP archive");
}

async function decompressZipEntry(data, method, uncompressedSize) {
  if (method === 0) return data;
  if (method === 8) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const out = new Uint8Array(await new Response(stream).arrayBuffer());
    if (uncompressedSize && out.length !== uncompressedSize) {
      return out.slice(0, uncompressedSize);
    }
    return out;
  }
  throw new Error(`Unsupported ZIP compression method ${method}`);
}

function normalizeZipEntryName(name) {
  return name.replace(/\\/g, "/").replace(/^\.\//, "");
}

/** Match archive root files by exact name; skip macOS metadata entries. */
function findArchiveEntry(entries, fileName) {
  return entries.find((e) => e.name === fileName);
}

function isIgnoredArchiveEntry(name) {
  if (name === ".DS_Store" || name.endsWith("/.DS_Store")) return true;
  return name.split("/").some((part) => part.startsWith("._") || part === "__MACOSX");
}
