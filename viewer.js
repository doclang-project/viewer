/* DocLang Archive Viewer — archive format: github.com/doclang-project/doclang spec.md#doclang-archive-format */

const SUPPORTED_FILE_EXTENSIONS = [".dclx", ".dclg"];
const OPEN_FILE_HINT = `Open a DocLang file (${SUPPORTED_FILE_EXTENSIONS.join(", ")})`;
const VIRTUAL_TEXT_TAG_HINT = "DocLang virtual <text>; wrapping tags not included in source";
const FRAGMENT_LINK_LABEL_CROSS_PAGE = "cross-page content";
const FRAGMENT_LINK_LABEL_SAME_PAGE = "fragmented content";
const FRAGMENT_NAV_HINT_PREV = "Previous fragment";
const FRAGMENT_NAV_HINT_NEXT = "Next fragment";
const DOCLANG_NS = "https://www.doclang.ai/ns/v0";
const PAGE_IMAGE_RE = /^(\d+)\.(png|jpe?g|webp)$/i;
const NO_MARKUP = "(No markup to be shown.)";
const NO_IMAGE = "(No page image available.)";
const FILE_THUMB_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
const PICTURE_UNAVAILABLE_ALT = "Picture asset not available";
const INVALID_PICTURE_SRC = "data:image/png;base64,NOT_A_VALID_IMAGE";
const LONG_EMBEDDED_URI_PREVIEW_LENGTH = 30;
const HEAD_TAGS = new Set([
  "label", "thread", "xref", "href", "layer", "location", "caption", "description", "summary", "custom",
]);
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
  "text", "heading", "field_heading", "footnote", "page_header", "page_footer", "list", "code", "formula", "picture", "group",
  "field_region", "field_item",
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

function isTruncatableEmbeddedImageUri(value) {
  if (!value || value.length <= LONG_EMBEDDED_URI_PREVIEW_LENGTH) return false;
  return /^(data:image\/|blob:)/i.test(value);
}

function formatCompactByteSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEmbeddedUriSizeLabel(value) {
  if (/^blob:/i.test(value)) {
    return value.length >= 1024 ? `${Math.round(value.length / 1024)} KB URL` : `${value.length} char URL`;
  }
  const comma = value.indexOf(",");
  if (comma === -1) return "embedded data";
  const header = value.slice(0, comma);
  const payload = value.slice(comma + 1).replace(/\s/g, "");
  const mime = /^data:([^;,]+)/i.exec(header)?.[1] ?? "";
  const shortMime = mime.startsWith("image/") ? mime.slice(6) : (mime || "data");
  const bytes = Math.floor(payload.replace(/=+$/, "").length * 3 / 4);
  return `${shortMime} · ${formatCompactByteSize(bytes)}`;
}

function createEmbeddedUriContinuationPanel(value, depth) {
  const { line, content } = createMarkupLineRow(depth);
  line.className = "markup-line markup-embedded-uri-panel";
  const body = document.createElement("div");
  body.className = "markup-embedded-uri-panel-body";
  body.textContent = value;
  body.addEventListener("click", (e) => e.stopPropagation());
  content.appendChild(body);
  return line;
}

function createTruncatableMarkupAttrValue(value) {
  const wrapper = document.createElement("span");
  wrapper.className = "xml-attr-value xml-attr-value-truncatable";
  wrapper.dataset.fullValue = value;

  const text = document.createElement("span");
  text.className = "xml-attr-value-text";
  text.textContent = value.slice(0, LONG_EMBEDDED_URI_PREVIEW_LENGTH);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "xml-attr-value-chip";
  const sizeLabel = formatEmbeddedUriSizeLabel(value);
  toggle.dataset.collapsedLabel = sizeLabel;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", `Show full value (${sizeLabel})`);

  const label = document.createElement("span");
  label.className = "xml-attr-value-chip-label";
  label.textContent = sizeLabel;
  toggle.appendChild(label);

  wrapper.append(text, toggle);
  return wrapper;
}

function appendMarkupAttrValue(line, value) {
  if (isTruncatableEmbeddedImageUri(value)) {
    line.appendChild(createTruncatableMarkupAttrValue(value));
  } else {
    line.appendChild(xmlSpan("xml-attr-value", value));
  }
}

function toggleTruncatableMarkupAttrValue(toggle) {
  const wrapper = toggle.closest(".xml-attr-value-truncatable");
  if (!wrapper) return;

  const markupLine = wrapper.closest(".markup-line");
  const fullValue = wrapper.dataset.fullValue ?? "";
  const label = toggle.querySelector(".xml-attr-value-chip-label");
  const collapsedLabel = toggle.dataset.collapsedLabel ?? label?.textContent ?? "";
  const expanded = toggle.getAttribute("aria-expanded") === "true";

  if (expanded) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", `Show full value (${collapsedLabel})`);
    if (label) label.textContent = collapsedLabel;
    markupLine?.nextElementSibling?.classList.contains("markup-embedded-uri-panel")
      && markupLine.nextElementSibling.remove();
    return;
  }

  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Hide full value");
  if (label) label.textContent = "hide";
  if (!markupLine || markupLine.nextElementSibling?.classList.contains("markup-embedded-uri-panel")) {
    return;
  }
  const depth = Number(markupLine.style.getPropertyValue("--markup-depth") || 0);
  markupLine.insertAdjacentElement("afterend", createEmbeddedUriContinuationPanel(fullValue, depth));
}

function appendMarkupAttributes(line, attributes) {
  for (const { name, value } of attributes) {
    line.appendChild(document.createTextNode(" "));
    line.appendChild(xmlSpan("xml-attr-name", name));
    line.appendChild(xmlSpan("xml-bracket", '="'));
    appendMarkupAttrValue(line, value);
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
const OVERLAY_BADGE_FONT_SIZE = 11 * 1.5 * 0.8;
const OVERLAY_BADGE_PAD_X = 3;
const OVERLAY_BADGE_PAD_Y = 2;
const OVERLAY_BADGE_RADIUS_SCREEN_PX = 3;
const PAGE_ZOOM_DEFAULT = 100;
const PAGE_PAN_DRAG_THRESHOLD = 5;
const PAGE_VIEW_BORDER_PX = 2;
const LAYOUT_STORAGE_KEY = "doclang-viewer-pane-layout";
const PANE_MIN_RATIO = 0.12;
const PANE_KEYS = ["file", "page", "markup", "reading"];
const DEFAULT_PANE_RATIOS = [1, 1, 1, 1];
const DEFAULT_USER_PANE_VISIBLE = { file: false, page: true, markup: true, reading: true };
const LAYOUT_STACK_BREAKPOINT_PX = 1200;

/** @type {{ pageImages: Map<number, string>, assetUrls: Map<string, string>, currentPage: number, pageCount: number, segments: Element[][], defaultResolution: { width: number, height: number }, elementIds: Map<Element, string>, idToElement: Map<string, Element>, hasPageView: boolean, markupOnly: boolean, docRoot: Element, threadPagesById: Map<string, Set<number>>, elementPageByEl: Map<Element, number>, threadNavByElement: Map<Element, { prev: Element | null, next: Element | null }>, pendingSelectElement: Element | null, readingOrder: Element[], readingOrderDisplayNumbers: Map<Element, number>, pageViewOverlay: { boxes: object[], readingOrderSteps: { order: number, box: object, elementId: string }[] } | null } | null} */
let state = null;
let fileCatalog = [];
let activeFileIndex = -1;
let filePaneUserToggled = false;
/** @type {ResizeObserver | null} */
let pagePaneResizeObserver = null;
/** @type {string | null} */
let selectedElementId = null;
let showAllBboxes = true;
let showLayoutBadges = true;
let showCaptionLinks = false;
let showPictureContents = false;
let showTableContents = false;
let showFragmentLinks = false;
let showXrefLinks = false;
let showReadingOrder = false;
let showReadingOrderArrows = true;
let readingOrderGlobalNumbering = false;
let showReadingFurniture = true;
let showReadingBackground = true;
let pageSettingsOpen = false;
let readingSettingsOpen = false;
let pageZoomPercent = PAGE_ZOOM_DEFAULT;
/** @type {{ pointerId: number, startX: number, startY: number, scrollLeft: number, scrollTop: number, moved: boolean } | null} */
let pagePanDrag = null;
let pagePanSuppressClick = false;
/** @type {{ paneW: number, paneH: number, imgW: number, imgH: number, fitScale: number } | null} */
let pageLayoutCache = null;
/** @type {{ file: boolean, page: boolean, markup: boolean, reading: boolean }} */
let userPaneVisible = { ...DEFAULT_USER_PANE_VISIBLE };
/** @type {number[]} */
let paneRatios = [...DEFAULT_PANE_RATIOS];
/** @type {number | null} */
let filePaneWidthPx = null;
let toolbarOptionsOpen = false;
/** @type {{ physicalSplitterIndex: number, leftKey: string, rightKey: string, startX: number, leftStart: number, rightStart: number, pointerId: number } | null} */
let paneDrag = null;
/** @type {MediaQueryList | null} */
let layoutStackQuery = null;
const els = {
  openFileBtn: document.getElementById("open-file-btn"),
  emptyStateFileTypes: document.getElementById("empty-state-file-types"),
  docLabel: document.getElementById("doc-label"),
  filePane: document.getElementById("file-pane"),
  filePaneCloseAll: document.getElementById("btn-file-pane-close-all"),
  pageNav: document.getElementById("page-nav"),
  pageIndicator: document.getElementById("page-indicator"),
  pageNumberInput: document.getElementById("page-number-input"),
  pageCountIndicator: document.getElementById("page-count-indicator"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  showAllBboxes: document.getElementById("show-all-bboxes"),
  showLayoutBadges: document.getElementById("show-layout-badges"),
  showLayoutBadgesLabel: document.getElementById("show-layout-badges-label"),
  settingsToggle: document.getElementById("btn-settings-toggle"),
  readingSettingsToggle: document.getElementById("btn-reading-settings-toggle"),
  pageSettingsLayer: document.getElementById("page-settings-layer"),
  pageSettingsScrim: document.getElementById("page-settings-scrim"),
  pageSettingsClose: document.getElementById("btn-page-settings-close"),
  readingSettingsLayer: document.getElementById("reading-settings-layer"),
  readingSettingsScrim: document.getElementById("reading-settings-scrim"),
  readingSettingsClose: document.getElementById("btn-reading-settings-close"),
  showReadingFurniture: document.getElementById("show-reading-furniture"),
  showReadingFurnitureLabel: document.getElementById("show-reading-furniture-label"),
  showReadingBackground: document.getElementById("show-reading-background"),
  showReadingBackgroundLabel: document.getElementById("show-reading-background-label"),
  showCaptionLinks: document.getElementById("show-caption-links"),
  showCaptionLinksLabel: document.getElementById("show-caption-links-label"),
  showPictureContents: document.getElementById("show-picture-contents"),
  showPictureContentsLabel: document.getElementById("show-picture-contents-label"),
  showTableContents: document.getElementById("show-table-contents"),
  showTableContentsLabel: document.getElementById("show-table-contents-label"),
  showFragmentLinks: document.getElementById("show-fragment-links"),
  showFragmentLinksLabel: document.getElementById("show-fragment-links-label"),
  showXrefLinks: document.getElementById("show-xref-links"),
  showXrefLinksLabel: document.getElementById("show-xref-links-label"),
  showReadingOrder: document.getElementById("show-reading-order"),
  showReadingOrderLabel: document.getElementById("show-reading-order-label"),
  readingOrderArrows: document.getElementById("reading-order-arrows"),
  readingOrderArrowsLabel: document.getElementById("reading-order-arrows-label"),
  readingOrderGlobal: document.getElementById("reading-order-global"),
  readingOrderGlobalLabel: document.getElementById("reading-order-global-label"),
  pageZoom: document.getElementById("page-zoom"),
  pageZoomLabel: document.getElementById("page-zoom-label"),
  pageZoomReset: document.getElementById("page-zoom-reset"),
  main: document.getElementById("main"),
  emptyState: document.getElementById("empty-state"),
  markupPane: document.getElementById("markup-pane"),
  renderedPane: document.getElementById("rendered-pane"),
  pagePane: document.getElementById("page-pane"),
  paneFile: document.querySelector(".pane-file"),
  panePageView: document.querySelector(".pane-page-view"),
  paneMarkup: document.querySelector(".pane-markup"),
  paneReading: document.querySelector(".pane-reading"),
  splitters: [
    document.getElementById("splitter-0"),
    document.getElementById("splitter-1"),
    document.getElementById("splitter-2"),
  ],
  toolbarOptionsBtn: document.getElementById("btn-toolbar-options"),
  toolbarOptionsPanel: document.getElementById("toolbar-options-panel"),
  toggleFilePane: document.getElementById("toggle-file-pane"),
  toggleFilePaneLabel: document.getElementById("toggle-file-pane-label"),
  togglePagePane: document.getElementById("toggle-page-pane"),
  toggleMarkupPane: document.getElementById("toggle-markup-pane"),
  toggleReadingPane: document.getElementById("toggle-reading-pane"),
  togglePagePaneLabel: document.getElementById("toggle-page-pane-label"),
  resetPaneLayoutBtn: document.getElementById("btn-reset-pane-layout"),
};

document.getElementById("btn-demo")?.addEventListener("click", loadDemo);
document.getElementById("demo-empty-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  loadDemo();
});
document.getElementById("home-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  resetViewer();
});
document.getElementById("input-archive")?.addEventListener("change", async (e) => {
  const files = [...e.target.files].filter((f) => isArchiveFile(f) || isMarkupFile(f));
  if (!files.length) return;
  await addFilesToCatalog(files, { replace: true });
  e.target.value = "";
});
els.btnPrev?.addEventListener("click", () => goToPage(state.currentPage - 1));
els.btnNext?.addEventListener("click", () => goToPage(state.currentPage + 1));
els.pageNumberInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    commitPageNumberInput();
    els.pageNumberInput?.blur();
  } else if (e.key === "Escape") {
    e.preventDefault();
    resetPageNumberInput();
    els.pageNumberInput?.blur();
  }
});
els.pageNumberInput?.addEventListener("blur", resetPageNumberInput);
els.pageNumberInput?.addEventListener("focus", (e) => {
  e.target.select();
});
els.showAllBboxes?.addEventListener("change", () => {
  showAllBboxes = els.showAllBboxes.checked;
  syncLayoutSubtoggles();
  const img = els.pagePane?.querySelector(".page-view img");
  if (img) syncOverlayBadges(img);
  applyBboxVisibility();
});
els.showLayoutBadges?.addEventListener("change", () => {
  showLayoutBadges = els.showLayoutBadges.checked;
  const img = els.pagePane?.querySelector(".page-view img");
  if (img) syncOverlayBadges(img);
  applyBboxVisibility();
});
els.showCaptionLinks?.addEventListener("change", () => {
  showCaptionLinks = els.showCaptionLinks.checked;
  applyBboxVisibility();
});
els.showPictureContents?.addEventListener("change", () => {
  showPictureContents = els.showPictureContents.checked;
  applyBboxVisibility();
});
els.showTableContents?.addEventListener("change", () => {
  showTableContents = els.showTableContents.checked;
  applyBboxVisibility();
});
els.showFragmentLinks?.addEventListener("change", () => {
  showFragmentLinks = els.showFragmentLinks.checked;
  applyBboxVisibility();
});
els.showXrefLinks?.addEventListener("change", () => {
  showXrefLinks = els.showXrefLinks.checked;
  applyBboxVisibility();
});
els.showReadingOrder?.addEventListener("change", () => {
  showReadingOrder = els.showReadingOrder.checked;
  syncLayoutSubtoggles();
  const img = els.pagePane?.querySelector(".page-view img");
  if (img) syncOverlayBadges(img);
  applyBboxVisibility();
});
els.readingOrderArrows?.addEventListener("change", () => {
  showReadingOrderArrows = els.readingOrderArrows.checked;
  applyBboxVisibility();
});
els.readingOrderGlobal?.addEventListener("change", () => {
  readingOrderGlobalNumbering = els.readingOrderGlobal.checked;
  if (state) renderPage(state.currentPage);
});
els.settingsToggle?.addEventListener("click", () => setPageSettingsOpen(!pageSettingsOpen));
els.readingSettingsToggle?.addEventListener("click", () => setReadingSettingsOpen(!readingSettingsOpen));
els.pageSettingsClose?.addEventListener("click", () => setPageSettingsOpen(false));
els.pageSettingsScrim?.addEventListener("click", () => setPageSettingsOpen(false));
els.readingSettingsClose?.addEventListener("click", () => setReadingSettingsOpen(false));
els.readingSettingsScrim?.addEventListener("click", () => setReadingSettingsOpen(false));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (toolbarOptionsOpen) setToolbarOptionsOpen(false);
  else if (pageSettingsOpen) setPageSettingsOpen(false);
  else if (readingSettingsOpen) setReadingSettingsOpen(false);
});
els.showReadingFurniture?.addEventListener("change", () => {
  showReadingFurniture = els.showReadingFurniture.checked;
  syncReadingLayerVisibility();
});
els.showReadingBackground?.addEventListener("change", () => {
  showReadingBackground = els.showReadingBackground.checked;
  syncReadingLayerVisibility();
});
loadLayoutPrefs();
initToolbarOptions();
initPaneSplitters();
initLayoutStackListener();
initFileTypeHints();
initCursorHints();
initBboxHints();
initDragDrop();
initFilePaneCloseAll();
initPageWheelNav();
initPageViewControls();
if (document.getElementById("btn-demo")) loadDemo();

async function loadDemo() {
  try {
    const res = await fetch(DEMO_ARCHIVE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const label = DEMO_ARCHIVE_URL.split("/").pop() || "demo.dclx";
    await addArchiveBufferToCatalog(await res.arrayBuffer(), label, { replace: true });
  } catch (err) {
    alert(
      `Failed to load demo: ${err.message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`,
    );
  }
}

async function loadFromFileList(fileList) {
  if (!fileList?.length) return;
  const files = [...fileList];
  if (files.some((f) => f.name === "document.xml")) {
    await appendFolderArchive(files);
    return;
  }
  const supported = files.filter((f) => isArchiveFile(f) || isMarkupFile(f));
  if (supported.length) await addFilesToCatalog(supported, { replace: false });
}

function createFileCatalogEntry(file) {
  return {
    id: crypto.randomUUID(),
    label: file.name,
    kind: isMarkupFile(file) ? "markup" : "archive",
    source: file,
    currentPage: 1,
    pageZoom: PAGE_ZOOM_DEFAULT,
    snapshot: null,
    thumbnailUrl: null,
  };
}

function pageImageMimeFromExt(ext) {
  const normalized = ext.toLowerCase().replace("jpeg", "jpg");
  if (normalized === "png") return "image/png";
  if (normalized === "webp") return "image/webp";
  return "image/jpeg";
}

function createPageImageObjectUrl(data, ext) {
  return URL.createObjectURL(new Blob([data], { type: pageImageMimeFromExt(ext) }));
}

function createFirstPageImageUrlFromFiles(files) {
  let bestPage = Infinity;
  /** @type {File | null} */
  let bestFile = null;
  for (const f of files) {
    const relPath = f.webkitRelativePath || f.name;
    const parts = relPath.split("/");
    if (parts.length < 2 || parts[parts.length - 2] !== "pages") continue;
    const m = PAGE_IMAGE_RE.exec(f.name);
    if (!m) continue;
    const pageNum = Number(m[1]);
    if (pageNum < bestPage) {
      bestPage = pageNum;
      bestFile = f;
    }
  }
  return bestFile ? URL.createObjectURL(bestFile) : null;
}

async function createFirstPageImageUrlFromZip(source) {
  const buffer = source instanceof File ? await source.arrayBuffer() : source;
  const entries = await unzip(buffer);
  let bestPage = Infinity;
  /** @type {{ name: string, data: Uint8Array } | null} */
  let bestEntry = null;
  for (const e of entries) {
    const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
    if (!m) continue;
    const pageNum = Number(m[1]);
    if (pageNum < bestPage) {
      bestPage = pageNum;
      bestEntry = e;
    }
  }
  if (!bestEntry) return null;
  const ext = bestEntry.name.split(".").pop() ?? "png";
  return createPageImageObjectUrl(bestEntry.data, ext);
}

async function resolveCatalogEntryThumbnail(entry) {
  if (entry.thumbnailUrl) return entry.thumbnailUrl;
  if (entry.kind === "markup") return null;
  try {
    if (entry.kind === "folder") {
      entry.thumbnailUrl = createFirstPageImageUrlFromFiles(entry.source);
    } else if (entry.kind === "archive") {
      entry.thumbnailUrl = await createFirstPageImageUrlFromZip(entry.source);
    }
  } catch {
    entry.thumbnailUrl = null;
  }
  return entry.thumbnailUrl;
}

function enrichCatalogEntryThumbnail(entry) {
  resolveCatalogEntryThumbnail(entry).then((url) => {
    if (!fileCatalog.includes(entry)) {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return;
    }
    if (url) renderFileView();
  });
}

function revokeCatalogEntry(entry) {
  if (entry?.thumbnailUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(entry.thumbnailUrl);
  }
  if (entry) entry.thumbnailUrl = null;
}

function createFileViewThumbnail(entry) {
  const thumb = document.createElement("span");
  thumb.className = "file-view-thumb";
  thumb.setAttribute("aria-hidden", "true");
  if (entry.thumbnailUrl) {
    const img = document.createElement("img");
    img.src = entry.thumbnailUrl;
    img.alt = "";
    thumb.appendChild(img);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "file-view-thumb-placeholder";
    placeholder.innerHTML = FILE_THUMB_PLACEHOLDER_SVG;
    thumb.appendChild(placeholder);
  }
  return thumb;
}

async function addFilesToCatalog(files, { replace = false } = {}) {
  if (replace) {
    clearFileCatalog();
    filePaneUserToggled = false;
  }
  const startIndex = fileCatalog.length;
  for (const file of files) {
    const entry = createFileCatalogEntry(file);
    fileCatalog.push(entry);
    enrichCatalogEntryThumbnail(entry);
  }
  if (!fileCatalog.length) return;
  await switchToFile(replace ? 0 : startIndex);
}

async function appendFolderArchive(files) {
  if (!files.some((f) => f.name === "document.xml")) {
    alert("Archive must contain document.xml at its root.");
    return;
  }
  const rootName = (files[0].webkitRelativePath || files[0].name).split("/")[0] || "archive";
  const entry = {
    id: crypto.randomUUID(),
    label: rootName,
    kind: "folder",
    source: files,
    currentPage: 1,
    pageZoom: PAGE_ZOOM_DEFAULT,
    snapshot: null,
    thumbnailUrl: null,
  };
  fileCatalog.push(entry);
  enrichCatalogEntryThumbnail(entry);
  await switchToFile(fileCatalog.length - 1);
}

async function addArchiveBufferToCatalog(buffer, label, { replace = false } = {}) {
  if (replace) {
    clearFileCatalog();
    filePaneUserToggled = false;
  }
  const entry = {
    id: crypto.randomUUID(),
    label,
    kind: "archive",
    source: buffer,
    currentPage: 1,
    pageZoom: PAGE_ZOOM_DEFAULT,
    snapshot: null,
    thumbnailUrl: null,
  };
  fileCatalog.push(entry);
  enrichCatalogEntryThumbnail(entry);
  await switchToFile(replace ? 0 : fileCatalog.length - 1);
}

async function extractArchiveFromFiles(files) {
  const markupFile = files.find((f) => f.name === "document.xml");
  if (!markupFile) throw new Error("Archive must contain document.xml at its root.");
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
  return { markupXml, pageImages, assetUrls };
}

async function parseCatalogEntry(entry) {
  try {
    if (entry.kind === "markup") {
      const text = entry.source instanceof File
        ? await entry.source.text()
        : new TextDecoder().decode(entry.source);
      return buildDocumentState(text, new Map(), entry.label, new Map(), { markupOnly: true });
    }
    if (entry.kind === "archive") {
      const buffer = entry.source instanceof File
        ? await entry.source.arrayBuffer()
        : entry.source;
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromZipBuffer(buffer);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
    }
    if (entry.kind === "folder") {
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromFiles(entry.source);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
    }
  } catch (err) {
    alert(`Failed to read ${entry.label}: ${err.message}`);
  }
  return null;
}

function persistActiveFileViewState() {
  if (activeFileIndex < 0 || !state) return;
  const entry = fileCatalog[activeFileIndex];
  entry.currentPage = state.currentPage;
  entry.pageZoom = pageZoomPercent;
}

function releaseActiveDocument() {
  if (activeFileIndex >= 0) {
    const entry = fileCatalog[activeFileIndex];
    if (entry?.snapshot) {
      revokeDocumentState(entry.snapshot);
      entry.snapshot = null;
    }
  }
  if (state) revokeDocumentState(state);
  state = null;
  selectedElementId = null;
  pagePanDrag = null;
  pagePanSuppressClick = false;
}

function clearFileCatalog() {
  releaseActiveDocument();
  for (const entry of fileCatalog) revokeCatalogEntry(entry);
  fileCatalog = [];
  activeFileIndex = -1;
}

async function switchToFile(index) {
  if (index < 0 || index >= fileCatalog.length) return;

  persistActiveFileViewState();
  releaseActiveDocument();

  activeFileIndex = index;
  const entry = fileCatalog[index];
  const docState = await parseCatalogEntry(entry);
  if (!docState) {
    revokeCatalogEntry(entry);
    fileCatalog.splice(index, 1);
    activeFileIndex = -1;
    if (fileCatalog.length) {
      await switchToFile(Math.min(index, fileCatalog.length - 1));
    } else {
      resetViewer();
    }
    return;
  }

  entry.snapshot = docState;
  docState.currentPage = entry.currentPage ?? 1;
  activateDocument(docState, entry);
}

function defaultFilePaneVisible() {
  return fileCatalog.length > 1;
}

function syncFilePaneDefault() {
  if (!filePaneUserToggled) {
    const wasVisible = userPaneVisible.file;
    const shouldBeVisible = defaultFilePaneVisible();
    userPaneVisible.file = shouldBeVisible;
    if (!wasVisible && shouldBeVisible) {
      paneRatios = [...DEFAULT_PANE_RATIOS];
      filePaneWidthPx = null;
    }
  }
}

async function closeCatalogFile(index) {
  if (index < 0 || index >= fileCatalog.length) return;

  const wasActive = index === activeFileIndex;
  const entry = fileCatalog[index];

  if (wasActive) {
    releaseActiveDocument();
    activeFileIndex = -1;
  }

  revokeCatalogEntry(entry);
  fileCatalog.splice(index, 1);

  if (!fileCatalog.length) {
    resetViewer();
    return;
  }

  if (wasActive) {
    await switchToFile(Math.min(index, fileCatalog.length - 1));
    return;
  }

  if (index < activeFileIndex) {
    activeFileIndex -= 1;
  }
  updateFileView();
}

function renderFileView() {
  if (!els.filePane) return;
  els.filePane.replaceChildren();
  if (!fileCatalog.length) return;

  const list = document.createElement("ul");
  list.className = "file-view-list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Open files");

  fileCatalog.forEach((entry, index) => {
    const item = document.createElement("li");
    const card = document.createElement("div");
    card.className = "file-view-item";
    card.title = entry.label;
    card.tabIndex = 0;
    card.setAttribute("role", "option");
    if (index === activeFileIndex) {
      card.classList.add("is-active");
      card.setAttribute("aria-selected", "true");
    } else {
      card.setAttribute("aria-selected", "false");
    }

    const thumbWrap = document.createElement("div");
    thumbWrap.className = "file-view-thumb-wrap";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "file-view-close";
    closeBtn.setAttribute("aria-label", `Close ${entry.label}`);
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeCatalogFile(index);
    });

    thumbWrap.append(createFileViewThumbnail(entry), closeBtn);

    const label = document.createElement("span");
    label.className = "file-view-label";
    label.textContent = entry.label;

    card.append(thumbWrap, label);
    card.addEventListener("click", (e) => {
      if (e.target.closest(".file-view-close")) return;
      switchToFile(index);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        switchToFile(index);
      }
    });

    item.appendChild(card);
    list.appendChild(item);
  });

  els.filePane.appendChild(list);
}

function updateFileView() {
  syncFilePaneDefault();
  syncFilePaneCloseAllButton();
  renderFileView();
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function syncFilePaneCloseAllButton() {
  if (!els.filePaneCloseAll) return;
  els.filePaneCloseAll.hidden = fileCatalog.length === 0;
}

function initFilePaneCloseAll() {
  els.filePaneCloseAll?.addEventListener("click", () => {
    if (!fileCatalog.length) return;
    const count = fileCatalog.length;
    const message = count === 1
      ? `Remove "${fileCatalog[0].label}" from the viewer?`
      : `Remove all ${count} open files from the viewer?`;
    if (confirm(message)) resetViewer();
  });
}

function initPageWheelNav() {
  if (!els.pagePane) return;

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
      const pane = pageViewScrollPane();
      if (!pane) return;
      const scrollable = pane.scrollHeight > pane.clientHeight || pane.scrollWidth > pane.clientWidth;
      if (scrollable) {
        onScrollPaneWheel(e, pane);
        return;
      }
      e.preventDefault();
      const dir = wheelDir(e);
      if (dir) tryFlipPage(dir);
    },
    { passive: false },
  );

  for (const pane of [els.markupPane, els.renderedPane]) {
    if (!pane) continue;
    pane.addEventListener("wheel", (e) => onScrollPaneWheel(e, pane), { passive: false });
  }

  els.pagePane.tabIndex = 0;
  els.pagePane.setAttribute("role", "region");
  els.pagePane.setAttribute("aria-label", "Original page");

  els.pagePane.addEventListener("pointerdown", (e) => {
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

function pageViewScrollPane() {
  if (!els.pagePane) return null;
  return els.pagePane.querySelector(".page-view-port") ?? els.pagePane;
}

function isPagePaneScrollable() {
  const pane = pageViewScrollPane();
  if (!pane) return false;
  return pane.scrollWidth > pane.clientWidth || pane.scrollHeight > pane.clientHeight;
}

function canStartPagePan(event) {
  if (!(event.target instanceof Element)) return false;
  if (!event.target.closest(".page-view")) return false;
  return isPagePaneScrollable();
}

function updatePagePanePanCursor() {
  if (!els.pagePane) return;
  els.pagePane.classList.toggle("can-pan", isPagePaneScrollable() && !pagePanDrag);
}

function initPageViewControls() {
  if (!els.pagePane) return;

  els.pageZoom?.addEventListener("input", () => {
    pageZoomPercent = Math.max(PAGE_ZOOM_DEFAULT, Number(els.pageZoom.value));
    if (Number(els.pageZoom.value) < PAGE_ZOOM_DEFAULT) {
      els.pageZoom.value = String(pageZoomPercent);
    }
    els.pageZoom.setAttribute("aria-valuenow", String(pageZoomPercent));
    updatePageZoomResetButton();
    refreshPageViewLayout();
  });

  els.pageZoomReset?.addEventListener("click", () => {
    if (pageZoomPercent === PAGE_ZOOM_DEFAULT) return;
    resetPageZoom();
  });

  els.pagePane.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !canStartPagePan(e)) return;
    const scrollPane = pageViewScrollPane();
    if (!scrollPane) return;
    pagePanDrag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollPane.scrollLeft,
      scrollTop: scrollPane.scrollTop,
      moved: false,
    };
  });

  els.pagePane.addEventListener("pointermove", (e) => {
    if (!pagePanDrag || e.pointerId !== pagePanDrag.pointerId) return;
    const dx = e.clientX - pagePanDrag.startX;
    const dy = e.clientY - pagePanDrag.startY;
    if (!pagePanDrag.moved && Math.hypot(dx, dy) >= PAGE_PAN_DRAG_THRESHOLD) {
      pagePanDrag.moved = true;
      els.pagePane.classList.add("is-panning");
      els.pagePane.classList.remove("can-pan");
      els.pagePane.setPointerCapture(e.pointerId);
    }
    if (!pagePanDrag.moved) return;
    const scrollPane = pageViewScrollPane();
    if (!scrollPane) return;
    scrollPane.scrollLeft = pagePanDrag.scrollLeft + pagePanDrag.startX - e.clientX;
    scrollPane.scrollTop = pagePanDrag.scrollTop + pagePanDrag.startY - e.clientY;
    e.preventDefault();
  });

  function endPagePan(e) {
    if (!pagePanDrag || e.pointerId !== pagePanDrag.pointerId) return;
    if (pagePanDrag.moved) pagePanSuppressClick = true;
    pagePanDrag = null;
    els.pagePane.classList.remove("is-panning");
    if (els.pagePane.hasPointerCapture(e.pointerId)) {
      els.pagePane.releasePointerCapture(e.pointerId);
    }
    updatePagePanePanCursor();
  }

  els.pagePane.addEventListener("pointerup", endPagePan);
  els.pagePane.addEventListener("pointercancel", endPagePan);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function headTextPreview(el, maxLen = 72) {
  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return "—";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function virtualTextHeadLocations(el) {
  const parent = el.parentElement;
  if (!parent) return [];
  const nodes = [...parent.childNodes];
  const idx = nodes.indexOf(el);
  if (idx < 0) return [];
  return parseElementHeadAt(nodes, idx + 1)?.locs ?? [];
}

function elementHeadLocations(el) {
  const own = headLocations(el);
  return own.length === 4 ? own : virtualTextHeadLocations(el);
}

function firstHeadChild(el, tag) {
  return childElements(el).find((child) => localName(child) === tag) ?? null;
}

const ELEMENT_LAYERS = new Set(["body", "background", "furniture"]);

function layerFromHeadNodes(nodes, startIdx) {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "layer") {
      const value = node.getAttribute("value") ?? "body";
      return ELEMENT_LAYERS.has(value) ? value : "body";
    }
    if (tag === "location") break;
    if (HEAD_TAGS.has(tag)) {
      i += 1;
      continue;
    }
    break;
  }
  return "body";
}

function elementLayer(el) {
  const layerEl = firstHeadChild(el, "layer");
  if (layerEl) {
    const value = layerEl.getAttribute("value") ?? "body";
    return ELEMENT_LAYERS.has(value) ? value : "body";
  }
  if (headLocations(el).length === 4) return "body";
  const parent = el.parentElement;
  if (!parent) return "body";
  const nodes = [...parent.childNodes];
  const idx = nodes.indexOf(el);
  if (idx < 0) return "body";
  return layerFromHeadNodes(nodes, idx + 1);
}

function layerClassForValue(layer) {
  if (layer === "furniture") return "layer-furniture";
  if (layer === "background") return "layer-background";
  return "";
}

function applyElementLayerAttr(sourceEl, domEl) {
  domEl.setAttribute("data-doclang-layer", elementLayer(sourceEl));
}

function syncReadingLayerCheckboxes() {
  if (els.showReadingFurniture) els.showReadingFurniture.checked = showReadingFurniture;
  if (els.showReadingBackground) els.showReadingBackground.checked = showReadingBackground;
}

/** @returns {{ key: string, value: string, isDefault: boolean }[]} */
function collectElementHeadInfo(el, defaultResolution) {
  const labelEl = firstHeadChild(el, "label");
  const threadEl = firstHeadChild(el, "thread");
  const xrefEl = firstHeadChild(el, "xref");
  const hrefEl = firstHeadChild(el, "href");
  const layerEl = firstHeadChild(el, "layer");
  const captionEl = firstHeadChild(el, "caption");
  const descriptionEl = firstHeadChild(el, "description");
  const summaryEl = firstHeadChild(el, "summary");
  const customEl = firstHeadChild(el, "custom");
  const locs = elementHeadLocations(el);
  const rows = [{ key: "element", value: elementLabel(el), isDefault: false }];

  rows.push({
    key: "label",
    value: labelEl?.getAttribute("value") ?? "undefined",
    isDefault: !labelEl?.hasAttribute("value"),
  });

  if (threadEl) {
    rows.push({
      key: "thread_id",
      value: threadEl.getAttribute("thread_id") ?? "—",
      isDefault: false,
    });
  } else {
    rows.push({ key: "thread", value: "—", isDefault: true });
  }

  if (xrefEl) {
    rows.push({
      key: "xref",
      value: `thread_id ${xrefEl.getAttribute("thread_id") ?? "—"}`,
      isDefault: false,
    });
  } else {
    rows.push({ key: "xref", value: "—", isDefault: true });
  }

  if (hrefEl) {
    rows.push({
      key: "href",
      value: hrefEl.getAttribute("uri") ?? "—",
      isDefault: false,
    });
  } else {
    rows.push({ key: "href", value: "—", isDefault: true });
  }

  rows.push({
    key: "layer",
    value: layerEl?.getAttribute("value") ?? "body",
    isDefault: !layerEl?.hasAttribute("value"),
  });

  const cornerLabels = ["x_min", "y_min", "x_max", "y_max"];
  if (locs.length === 4) {
    for (let idx = 0; idx < 4; idx += 1) {
      const loc = locs[idx];
      const axisDefault = idx % 2 === 0 ? defaultResolution.width : defaultResolution.height;
      const resolution = locationResolution(loc, axisDefault);
      const value = loc.getAttribute("value") ?? "0";
      rows.push({
        key: cornerLabels[idx],
        value: `${value} @ ${resolution}`,
        isDefault: false,
      });
    }
  } else {
    for (const key of cornerLabels) {
      rows.push({ key, value: "—", isDefault: false });
    }
  }

  rows.push({
    key: "caption",
    value: captionEl ? headTextPreview(captionEl) : "—",
    isDefault: !captionEl,
  });
  rows.push({
    key: "description",
    value: descriptionEl ? headTextPreview(descriptionEl) : "—",
    isDefault: !descriptionEl,
  });
  rows.push({
    key: "summary",
    value: summaryEl ? headTextPreview(summaryEl) : "—",
    isDefault: !summaryEl,
  });
  rows.push({
    key: "custom",
    value: customEl ? headTextPreview(customEl) : "—",
    isDefault: !customEl,
  });

  return rows;
}

function elementHeadTooltipHtml(el, defaultResolution) {
  const rows = collectElementHeadInfo(el, defaultResolution);
  const body = rows
    .map(({ key, value, isDefault }) => {
      const rendered = escapeHtml(value);
      const suffix = isDefault ? ' <span class="head-default">(default)</span>' : "";
      return `<tr><th scope="row">${escapeHtml(key)}</th><td>${rendered}${suffix}</td></tr>`;
    })
    .join("");
  return `<table class="head-tooltip"><tbody>${body}</tbody></table>`;
}

const cursorHintEl = document.getElementById("cursor-hint");
const CURSOR_HINT_OFFSET = 10;
const CURSOR_HINT_MARGIN = 8;

function hideCursorHint() {
  cursorHintEl.hidden = true;
  cursorHintEl.classList.remove("cursor-hint-detail");
  cursorHintEl.replaceChildren();
}

function showCursorHint(content, clientX, clientY, { detail = false } = {}) {
  cursorHintEl.replaceChildren();
  if (typeof content === "string") {
    cursorHintEl.textContent = content;
  } else {
    cursorHintEl.appendChild(content);
  }
  cursorHintEl.classList.toggle("cursor-hint-detail", detail);
  cursorHintEl.hidden = false;

  let left = clientX + CURSOR_HINT_OFFSET;
  let top = clientY + CURSOR_HINT_OFFSET;
  const rect = cursorHintEl.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - CURSOR_HINT_MARGIN) {
    left = clientX - rect.width - CURSOR_HINT_OFFSET;
  }
  if (top + rect.height > window.innerHeight - CURSOR_HINT_MARGIN) {
    top = clientY - rect.height - CURSOR_HINT_OFFSET;
  }
  cursorHintEl.style.left = `${Math.max(CURSOR_HINT_MARGIN, left)}px`;
  cursorHintEl.style.top = `${Math.max(CURSOR_HINT_MARGIN, top)}px`;
}

function showCursorHintHtml(html, clientX, clientY) {
  cursorHintEl.innerHTML = html;
  cursorHintEl.classList.add("cursor-hint-detail");
  cursorHintEl.hidden = false;

  let left = clientX + CURSOR_HINT_OFFSET;
  let top = clientY + CURSOR_HINT_OFFSET;
  const rect = cursorHintEl.getBoundingClientRect();
  if (left + rect.width > window.innerWidth - CURSOR_HINT_MARGIN) {
    left = clientX - rect.width - CURSOR_HINT_OFFSET;
  }
  if (top + rect.height > window.innerHeight - CURSOR_HINT_MARGIN) {
    top = clientY - rect.height - CURSOR_HINT_OFFSET;
  }
  cursorHintEl.style.left = `${Math.max(CURSOR_HINT_MARGIN, left)}px`;
  cursorHintEl.style.top = `${Math.max(CURSOR_HINT_MARGIN, top)}px`;
}

function initFileTypeHints() {
  if (!els.emptyStateFileTypes) return;
  const markup = SUPPORTED_FILE_EXTENSIONS.map((ext) => `<code>${ext}</code>`).join(", ");
  els.emptyStateFileTypes.innerHTML = markup;
}

function initCursorHints() {
  els.markupPane?.addEventListener("mousemove", (e) => {
    if (!e.target.closest(".markup-ghost-tag-part")) {
      hideCursorHint();
      return;
    }
    showCursorHint(VIRTUAL_TEXT_TAG_HINT, e.clientX, e.clientY);
  });
  els.markupPane?.addEventListener("mouseleave", hideCursorHint);

  els.openFileBtn?.addEventListener("mousemove", (e) => {
    showCursorHint(OPEN_FILE_HINT, e.clientX, e.clientY);
  });
  els.openFileBtn?.addEventListener("mouseleave", hideCursorHint);
}

function initBboxHints() {
  if (!els.pagePane) return;

  els.pagePane.addEventListener("mousemove", (e) => {
    if (pagePanDrag?.moved || els.pagePane.classList.contains("is-panning")) {
      hideCursorHint();
      return;
    }
    const navBtn = e.target.closest(".fragment-nav-btn:not(.fragment-nav-btn-disabled)");
    if (navBtn) {
      const hint = navBtn.getAttribute("data-nav") === "prev"
        ? FRAGMENT_NAV_HINT_PREV
        : FRAGMENT_NAV_HINT_NEXT;
      showCursorHint(hint, e.clientX, e.clientY);
      return;
    }
    const badge = e.target.closest(".element-badge[data-element-id]");
    if (!badge || !state?.idToElement) {
      hideCursorHint();
      return;
    }
    const elementId = badge.getAttribute("data-element-id");
    const xmlEl = state.idToElement.get(elementId);
    if (!xmlEl) {
      hideCursorHint();
      return;
    }
    showCursorHintHtml(elementHeadTooltipHtml(xmlEl, state.defaultResolution), e.clientX, e.clientY);
  });
  els.pagePane.addEventListener("mouseleave", hideCursorHint);
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
  if (files.some((f) => f.name === "document.xml")) {
    await appendFolderArchive(files);
    return;
  }
  const supported = files.filter((f) => isArchiveFile(f) || isMarkupFile(f));
  if (supported.length) await addFilesToCatalog(supported, { replace: false });
}

function buildDocumentState(markupXml, pageImages, label, assetUrls, { markupOnly }) {
  const doc = new DOMParser().parseFromString(markupXml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    alert(`Invalid XML in ${label}`);
    return null;
  }
  const root = doc.documentElement;
  if (localName(root) !== "doclang") {
    alert(`${label}: root element must be <doclang>`);
    return null;
  }

  const head = childElements(root).find((el) => localName(el) === "head") ?? null;
  const defaultResolution = readDefaultResolution(head);
  const segments = markupOnly
    ? [childElements(root).filter((el) => localName(el) !== "head")]
    : splitIntoSegments(root);
  const hasPageView = !markupOnly && pageImages.size > 0;
  const maxImagePage = hasPageView ? Math.max(...pageImages.keys()) : 0;
  const pageCount = markupOnly ? 1 : Math.max(segments.length, maxImagePage, 1);
  const readingOrder = computeReadingOrder(root);
  const elementPageByEl = buildElementPageMap(segments);

  return {
    pageImages,
    assetUrls,
    currentPage: 1,
    pageCount,
    segments,
    defaultResolution,
    hasPageView,
    markupOnly,
    docRoot: root,
    threadPagesById: buildThreadPagesById(root, elementPageByEl),
    elementPageByEl,
    threadNavByElement: buildThreadNavByElement(root),
    pendingSelectElement: null,
    readingOrder,
    readingOrderDisplayNumbers: computeReadingOrderDisplayNumbers(readingOrder),
    pageViewOverlay: null,
  };
}

function activateDocument(docState, entry) {
  state = docState;
  resetPageLayoutCache();
  closeAllSettings();

  pageZoomPercent = entry.pageZoom ?? PAGE_ZOOM_DEFAULT;
  if (els.pageZoom) {
    els.pageZoom.value = String(pageZoomPercent);
    els.pageZoom.setAttribute("aria-valuenow", String(pageZoomPercent));
  }
  updatePageZoomResetButton();
  const port = pageViewScrollPane();
  if (port) {
    port.scrollLeft = 0;
    port.scrollTop = 0;
  }

  setDocLabel(entry.label);
  setDocumentOpen(true, { markupOnly: state.markupOnly });
  setPageViewVisible(state.hasPageView);
  renderPage(state.currentPage);
  updateFileView();
}

function setDocLabel(label) {
  if (!els.docLabel) return;
  if (label) {
    els.docLabel.textContent = label;
    els.docLabel.hidden = false;
  } else {
    els.docLabel.textContent = "";
    els.docLabel.hidden = true;
  }
}

function setDocumentOpen(open, { markupOnly = false } = {}) {
  document.body.classList.toggle("viewer-loaded", open);
  document.body.classList.toggle("markup-only", open && markupOnly);
  if (els.pageNav) els.pageNav.hidden = !open || markupOnly;
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function applyReadingLayerClasses(root) {
  root.classList.toggle("show-reading-furniture", showReadingFurniture);
  root.classList.toggle("show-reading-background", showReadingBackground);
}

function syncReadingLayerVisibility() {
  const root = els.renderedPane?.querySelector(".rendered-doc");
  if (root) applyReadingLayerClasses(root);
}

function closeAllSettings() {
  setPageSettingsOpen(false);
  setReadingSettingsOpen(false);
}

function resetPageZoom() {
  pageZoomPercent = PAGE_ZOOM_DEFAULT;
  if (els.pageZoom) {
    els.pageZoom.value = String(PAGE_ZOOM_DEFAULT);
    els.pageZoom.setAttribute("aria-valuenow", String(PAGE_ZOOM_DEFAULT));
  }
  updatePageZoomResetButton();
  const port = pageViewScrollPane();
  if (port) {
    port.scrollLeft = 0;
    port.scrollTop = 0;
  }
  refreshPageViewLayout();
}

function updatePageZoomResetButton() {
  if (!els.pageZoomReset) return;
  els.pageZoomReset.textContent = `${pageZoomPercent}%`;
  els.pageZoomReset.disabled = pageZoomPercent === PAGE_ZOOM_DEFAULT;
}

function resetViewer() {
  clearFileCatalog();
  filePaneUserToggled = false;
  selectedElementId = null;
  pagePanDrag = null;
  pagePanSuppressClick = false;
  showReadingFurniture = true;
  showReadingBackground = true;
  syncReadingLayerCheckboxes();
  resetPageZoom();
  setDocLabel(null);
  setDocumentOpen(false);
  document.body.classList.remove("has-page-view");
  closeAllSettings();
  setToolbarOptionsOpen(false);
  if (els.markupPane) els.markupPane.innerHTML = "";
  if (els.renderedPane) els.renderedPane.innerHTML = "";
  if (els.pagePane) els.pagePane.innerHTML = "";
  setPageIndicator(1, 1);
  if (els.btnPrev) els.btnPrev.disabled = true;
  if (els.btnNext) els.btnNext.disabled = true;
  if (els.filePane) els.filePane.replaceChildren();
  updateFileView();
  applyPaneLayout();
}

function setPageViewVisible(visible) {
  document.body.classList.toggle("has-page-view", visible);
  syncPagePaneControls();
  syncToolbarPaneCheckboxes();
  if (!visible) setPageSettingsOpen(false);
  applyPaneLayout();
  syncLayoutSubtoggles();
}

function syncPagePaneControls() {
  const pageVisible = isPaneVisible("page");
  if (els.settingsToggle) els.settingsToggle.hidden = !pageVisible;
  if (els.pageZoomLabel) els.pageZoomLabel.hidden = !pageVisible;
  if (pageVisible) updatePageZoomResetButton();
  if (els.pagePane) els.pagePane.tabIndex = pageVisible ? 0 : -1;
}

function setPageSettingsOpen(open) {
  pageSettingsOpen = open;
  if (els.pageSettingsLayer) els.pageSettingsLayer.hidden = !open;
  if (els.settingsToggle) els.settingsToggle.setAttribute("aria-expanded", String(open));
}

function setReadingSettingsOpen(open) {
  readingSettingsOpen = open;
  if (els.readingSettingsLayer) els.readingSettingsLayer.hidden = !open;
  if (els.readingSettingsToggle) els.readingSettingsToggle.setAttribute("aria-expanded", String(open));
}

function syncLayoutSubtoggles() {
  const layoutEnabled = Boolean(state?.hasPageView && showAllBboxes);
  for (const label of [
    els.showLayoutBadgesLabel,
    els.showPictureContentsLabel,
    els.showTableContentsLabel,
    els.showFragmentLinksLabel,
    els.showCaptionLinksLabel,
    els.showXrefLinksLabel,
    els.showReadingOrderLabel,
  ]) {
    if (!label) continue;
    label.classList.toggle("settings-option-disabled", !layoutEnabled);
    const input = label.querySelector("input");
    if (input) input.disabled = !layoutEnabled;
  }

  const readingOrderEnabled = layoutEnabled && showReadingOrder;
  for (const label of [els.readingOrderArrowsLabel, els.readingOrderGlobalLabel]) {
    if (!label) continue;
    label.classList.toggle("settings-option-disabled", !readingOrderEnabled);
    const input = label.querySelector("input");
    if (input) input.disabled = !readingOrderEnabled;
  }
}

function paneDef(key) {
  const defs = {
    file: { key: "file", el: els.paneFile, canShow: () => fileCatalog.length > 0 },
    page: { key: "page", el: els.panePageView, canShow: () => Boolean(state?.hasPageView) },
    markup: { key: "markup", el: els.paneMarkup, canShow: () => Boolean(state) },
    reading: { key: "reading", el: els.paneReading, canShow: () => Boolean(state) },
  };
  return defs[key];
}

function isPaneAvailable(key) {
  const def = paneDef(key);
  return def?.canShow() ?? false;
}

function isPaneVisible(key) {
  if (!isPaneAvailable(key)) return false;
  return Boolean(userPaneVisible[key]);
}

function visiblePaneKeys() {
  return PANE_KEYS.filter((key) => isPaneVisible(key));
}

function paneMinRatio(key) {
  return PANE_MIN_RATIO;
}

function filePaneFitWidthPx() {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:var(--file-pane-fit-width);";
  document.documentElement.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return Math.ceil(px) || 108;
}

function resolvedFilePaneWidthPx() {
  const fit = filePaneFitWidthPx();
  return Math.max(fit, filePaneWidthPx ?? fit);
}

function contentPaneFrWeights(keys) {
  const contentKeys = keys.filter((key) => key !== "file");
  const weights = contentKeys.map((key) => paneRatios[paneRatioIndex(key)]);
  const sum = weights.reduce((a, b) => a + b, 0) || contentKeys.length;
  return weights.map((weight) => weight / sum);
}

function paneRatioIndex(key) {
  return PANE_KEYS.indexOf(key);
}

function normalizePaneRatios() {
  const sum = paneRatios.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    paneRatios = [...DEFAULT_PANE_RATIOS];
    return;
  }
  paneRatios = paneRatios.map((r) => r / sum);
}

function visiblePaneRatios(keys) {
  const weights = keys.map((key) => paneRatios[paneRatioIndex(key)]);
  const sum = weights.reduce((a, b) => a + b, 0) || keys.length;
  return weights.map((w) => w / sum);
}

function loadLayoutPrefs() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.visible && typeof data.visible === "object") {
      for (const key of PANE_KEYS) {
        if (typeof data.visible[key] === "boolean") userPaneVisible[key] = data.visible[key];
      }
      if (typeof data.visible.file === "boolean") filePaneUserToggled = true;
    }
    if (Array.isArray(data?.ratios)) {
      const valid = data.ratios.every((n) => typeof n === "number" && n > 0);
      if (valid && data.ratios.length === 4) {
        paneRatios = [...data.ratios];
        normalizePaneRatios();
      } else if (valid && data.ratios.length === 3) {
        paneRatios = [1, ...data.ratios];
        normalizePaneRatios();
      }
    }
    if (typeof data?.filePaneWidthPx === "number" && data.filePaneWidthPx > 0) {
      filePaneWidthPx = data.filePaneWidthPx;
    }
  } catch {
    /* ignore invalid stored layout */
  }
}

function saveLayoutPrefs() {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ visible: userPaneVisible, ratios: paneRatios, filePaneWidthPx }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function resetPaneLayout() {
  filePaneUserToggled = false;
  userPaneVisible = {
    file: defaultFilePaneVisible(),
    page: true,
    markup: true,
    reading: true,
  };
  paneRatios = [...DEFAULT_PANE_RATIOS];
  filePaneWidthPx = null;
  setReadingSettingsOpen(false);
  syncPagePaneControls();
  syncToolbarPaneCheckboxes();
  saveLayoutPrefs();
  applyPaneLayout();
}

function isLayoutStacked() {
  return Boolean(layoutStackQuery?.matches);
}

function initLayoutStackListener() {
  if (!els.main) return;
  layoutStackQuery = window.matchMedia(`(max-width: ${LAYOUT_STACK_BREAKPOINT_PX}px)`);
  const onChange = () => applyPaneLayout();
  layoutStackQuery.addEventListener("change", onChange);
  onChange();
}

function setToolbarOptionsOpen(open) {
  toolbarOptionsOpen = open;
  if (els.toolbarOptionsPanel) els.toolbarOptionsPanel.hidden = !open;
  if (els.toolbarOptionsBtn) els.toolbarOptionsBtn.setAttribute("aria-expanded", String(open));
}

function syncToolbarPaneCheckboxes() {
  if (els.toggleFilePane) {
    const available = isPaneAvailable("file");
    els.toggleFilePane.checked = available && userPaneVisible.file;
    els.toggleFilePane.disabled = !available;
  }
  if (els.toggleFilePaneLabel) {
    els.toggleFilePaneLabel.classList.toggle("toolbar-options-item-disabled", !isPaneAvailable("file"));
  }
  if (els.togglePagePane) {
    const available = isPaneAvailable("page");
    els.togglePagePane.checked = available && userPaneVisible.page;
    els.togglePagePane.disabled = !available;
  }
  if (els.togglePagePaneLabel) {
    els.togglePagePaneLabel.classList.toggle("toolbar-options-item-disabled", !isPaneAvailable("page"));
  }
  if (els.toggleMarkupPane) {
    els.toggleMarkupPane.checked = userPaneVisible.markup;
    els.toggleMarkupPane.disabled = !state;
  }
  if (els.toggleReadingPane) {
    els.toggleReadingPane.checked = userPaneVisible.reading;
    els.toggleReadingPane.disabled = !state;
  }
  for (const label of [
    els.toggleFilePaneLabel,
    els.togglePagePaneLabel,
    document.getElementById("toggle-markup-pane-label"),
    document.getElementById("toggle-reading-pane-label"),
  ]) {
    if (!label) continue;
    const input = label.querySelector("input");
    label.classList.toggle("toolbar-options-item-disabled", Boolean(input?.disabled));
  }
  if (els.resetPaneLayoutBtn) els.resetPaneLayoutBtn.disabled = !state;
}

function paneKeysAdjacent(leftKey, rightKey) {
  const leftIdx = PANE_KEYS.indexOf(leftKey);
  const rightIdx = PANE_KEYS.indexOf(rightKey);
  return leftIdx >= 0 && rightIdx === leftIdx + 1;
}

function onlyHiddenPanesBetween(leftKey, rightKey) {
  const leftIdx = PANE_KEYS.indexOf(leftKey);
  const rightIdx = PANE_KEYS.indexOf(rightKey);
  if (leftIdx < 0 || rightIdx <= leftIdx) return false;
  for (let i = leftIdx + 1; i < rightIdx; i++) {
    if (isPaneVisible(PANE_KEYS[i])) return false;
  }
  return true;
}

function shouldShowSplitterBetween(leftKey, rightKey) {
  if (!isPaneVisible(leftKey) || !isPaneVisible(rightKey)) return false;
  if (paneKeysAdjacent(leftKey, rightKey)) return true;
  return onlyHiddenPanesBetween(leftKey, rightKey);
}

function splitterForLayoutGap(leftKey, rightKey) {
  if (!shouldShowSplitterBetween(leftKey, rightKey)) return null;
  const leftIdx = PANE_KEYS.indexOf(leftKey);
  if (leftIdx < 0) return null;
  return els.splitters[leftIdx] ?? null;
}

function visiblePaneNeighborAfter(key) {
  const idx = PANE_KEYS.indexOf(key);
  if (idx < 0) return null;
  for (let i = idx + 1; i < PANE_KEYS.length; i++) {
    const neighbor = PANE_KEYS[i];
    if (isPaneVisible(neighbor)) return neighbor;
  }
  return null;
}

function visiblePaneNeighborBefore(key) {
  const idx = PANE_KEYS.indexOf(key);
  if (idx < 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const neighbor = PANE_KEYS[i];
    if (isPaneVisible(neighbor)) return neighbor;
  }
  return null;
}

function resolvedPhysicalSplitterKeys(physicalSplitterIndex) {
  const leftPhysical = PANE_KEYS[physicalSplitterIndex];
  const rightPhysical = PANE_KEYS[physicalSplitterIndex + 1];
  if (!leftPhysical || !rightPhysical) return null;

  const leftKey = isPaneVisible(leftPhysical) ? leftPhysical : visiblePaneNeighborBefore(rightPhysical);
  const rightKey = isPaneVisible(rightPhysical) ? rightPhysical : visiblePaneNeighborAfter(leftPhysical);
  if (!leftKey || !rightKey || leftKey === rightKey) return null;
  if (!shouldShowSplitterBetween(leftKey, rightKey)) return null;

  const canonical = splitterForLayoutGap(leftKey, rightKey);
  if (!canonical || canonical !== els.splitters[physicalSplitterIndex]) return null;
  return { leftKey, rightKey };
}

function resetPaneGridStyles() {
  for (const key of PANE_KEYS) {
    const el = paneDef(key)?.el;
    if (el) {
      el.style.gridColumn = "";
      el.style.gridRow = "";
    }
  }
  for (const splitter of els.splitters) {
    if (!splitter) continue;
    splitter.style.gridColumn = "";
    splitter.style.gridRow = "";
    splitter.hidden = true;
  }
}

function setUserPaneVisible(key, visible) {
  userPaneVisible[key] = visible;
  if (key === "file") filePaneUserToggled = true;
  if (key === "page") syncPagePaneControls();
  if (key === "reading" && !visible) setReadingSettingsOpen(false);
  syncToolbarPaneCheckboxes();
  saveLayoutPrefs();
  applyPaneLayout();
}

function applyPaneLayout() {
  if (!els.main) return;

  const stacked = document.body.classList.contains("viewer-loaded") && isLayoutStacked();
  els.main.classList.toggle("layout-stacked", stacked);

  for (const key of PANE_KEYS) {
    const def = paneDef(key);
    if (!def?.el) continue;
    def.el.hidden = !isPaneVisible(key);
    def.el.classList.remove("pane-layout-last");
  }

  if (!document.body.classList.contains("viewer-loaded")) {
    resetPaneGridStyles();
    els.main.style.gridTemplateColumns = "";
    els.main.style.gridTemplateRows = "";
    return;
  }

  let keys = visiblePaneKeys();
  if (!keys.length) {
    userPaneVisible.markup = true;
    keys = visiblePaneKeys();
  }

  const lastKey = keys[keys.length - 1];
  paneDef(lastKey)?.el?.classList.add("pane-layout-last");

  resetPaneGridStyles();

  if (stacked) {
    els.main.style.gridTemplateRows = "";
    els.main.style.gridTemplateColumns = "1fr";
    let row = 1;
    for (const key of keys) {
      const def = paneDef(key);
      if (!def?.el) continue;
      def.el.style.gridRow = String(row++);
    }
    refreshPageViewLayout();
    if (els.readingSettingsToggle) {
      els.readingSettingsToggle.hidden = !state || !isPaneVisible("reading");
    }
    return;
  }

  const contentFr = contentPaneFrWeights(keys);
  const cols = [];
  let contentFrIndex = 0;
  keys.forEach((key, index) => {
    if (key === "file") {
      cols.push(`${resolvedFilePaneWidthPx()}px`);
    } else {
      cols.push(`minmax(0, ${contentFr[contentFrIndex++].toFixed(6)}fr)`);
    }
    if (index < keys.length - 1 && shouldShowSplitterBetween(keys[index], keys[index + 1])) {
      cols.push("1px");
    }
  });
  els.main.style.gridTemplateColumns = cols.join(" ");
  els.main.style.gridTemplateRows = "minmax(0, 1fr)";

  let col = 1;
  keys.forEach((key, index) => {
    const def = paneDef(key);
    if (!def?.el) return;
    def.el.style.gridColumn = String(col);
    col += 1;
    if (index < keys.length - 1) {
      const leftKey = keys[index];
      const rightKey = keys[index + 1];
      if (!shouldShowSplitterBetween(leftKey, rightKey)) return;
      const splitter = splitterForLayoutGap(leftKey, rightKey);
      if (splitter) {
        splitter.hidden = false;
        splitter.style.gridColumn = String(col);
        col += 1;
      }
    }
  });

  refreshPageViewLayout();
  if (els.readingSettingsToggle) {
    els.readingSettingsToggle.hidden = !state || !isPaneVisible("reading");
  }
}

function initToolbarOptions() {
  if (!els.toolbarOptionsBtn || !els.toolbarOptionsPanel) return;

  els.toolbarOptionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setToolbarOptionsOpen(!toolbarOptionsOpen);
  });

  document.addEventListener("click", (e) => {
    if (!toolbarOptionsOpen) return;
    if (e.target instanceof Node && els.toolbarOptionsPanel.contains(e.target)) return;
    if (e.target instanceof Node && els.toolbarOptionsBtn.contains(e.target)) return;
    setToolbarOptionsOpen(false);
  });

  const onToggle = (key, input) => {
    input?.addEventListener("change", () => {
      if (!state) return;
      const nextKeys = PANE_KEYS.filter((k) => (k === key ? input.checked : userPaneVisible[k] && isPaneAvailable(k)));
      if (!nextKeys.length) {
        input.checked = true;
        return;
      }
      setUserPaneVisible(key, input.checked);
    });
  };

  onToggle("file", els.toggleFilePane);
  onToggle("page", els.togglePagePane);
  onToggle("markup", els.toggleMarkupPane);
  onToggle("reading", els.toggleReadingPane);
  els.resetPaneLayoutBtn?.addEventListener("click", () => {
    if (!state) return;
    resetPaneLayout();
  });
  syncToolbarPaneCheckboxes();
}

function initPaneSplitters() {
  for (const [index, splitter] of els.splitters.entries()) {
    if (!splitter) continue;
    splitter.addEventListener("pointerdown", (e) => startPaneDrag(e, index));
  }
  window.addEventListener("pointermove", onPaneDragMove);
  window.addEventListener("pointerup", endPaneDrag);
  window.addEventListener("pointercancel", endPaneDrag);
}

function startPaneDrag(e, physicalSplitterIndex) {
  if (e.button !== 0 || isLayoutStacked() || !document.body.classList.contains("viewer-loaded")) return;

  const resolved = resolvedPhysicalSplitterKeys(physicalSplitterIndex);
  if (!resolved) return;

  const { leftKey, rightKey } = resolved;

  const leftIndex = paneRatioIndex(leftKey);
  const rightIndex = paneRatioIndex(rightKey);
  const dragState = {
    physicalSplitterIndex,
    leftKey,
    rightKey,
    startX: e.clientX,
    leftStart: paneRatios[leftIndex],
    rightStart: paneRatios[rightIndex],
    pointerId: e.pointerId,
  };
  if (leftKey === "file") {
    dragState.leftStartPx = resolvedFilePaneWidthPx();
  } else if (rightKey === "file") {
    dragState.rightStartPx = resolvedFilePaneWidthPx();
  }
  paneDrag = dragState;

  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  e.currentTarget.classList.add("is-dragging");
  document.body.classList.add("pane-drag-active");
}

function contentPaneAvailableWidthPx() {
  if (!els.main) return 1;
  const rect = els.main.getBoundingClientRect();
  const keys = visiblePaneKeys();
  let reserved = 0;
  if (keys.includes("file")) reserved += resolvedFilePaneWidthPx();
  for (let i = 0; i < keys.length - 1; i++) {
    if (shouldShowSplitterBetween(keys[i], keys[i + 1])) reserved += 1;
  }
  return Math.max(rect.width - reserved, 1);
}

function onPaneDragMove(e) {
  if (!paneDrag || e.pointerId !== paneDrag.pointerId || !els.main) return;

  if (paneDrag.leftKey === "file" && typeof paneDrag.leftStartPx === "number") {
    filePaneWidthPx = Math.max(filePaneFitWidthPx(), paneDrag.leftStartPx + (e.clientX - paneDrag.startX));
    applyPaneLayout();
    return;
  }
  if (paneDrag.rightKey === "file" && typeof paneDrag.rightStartPx === "number") {
    filePaneWidthPx = Math.max(filePaneFitWidthPx(), paneDrag.rightStartPx - (e.clientX - paneDrag.startX));
    applyPaneLayout();
    return;
  }

  const keys = visiblePaneKeys();
  const contentFr = contentPaneFrWeights(keys);
  const contentKeys = keys.filter((key) => key !== "file");
  const leftContentIndex = contentKeys.indexOf(paneDrag.leftKey);
  const pairFrTotal = contentFr[leftContentIndex] + contentFr[leftContentIndex + 1];
  const pairPixels = Math.max(contentPaneAvailableWidthPx() * pairFrTotal, 1);
  const deltaRatio = ((e.clientX - paneDrag.startX) / pairPixels) * pairFrTotal;

  const leftIndex = paneRatioIndex(paneDrag.leftKey);
  const rightIndex = paneRatioIndex(paneDrag.rightKey);
  const pairStoredTotal = paneDrag.leftStart + paneDrag.rightStart;
  let nextLeft = paneDrag.leftStart + deltaRatio * pairStoredTotal;
  const leftMin = paneMinRatio(paneDrag.leftKey);
  const rightMin = paneMinRatio(paneDrag.rightKey);
  nextLeft = Math.min(Math.max(nextLeft, leftMin), pairStoredTotal - rightMin);
  paneRatios[leftIndex] = nextLeft;
  paneRatios[rightIndex] = pairStoredTotal - nextLeft;
  normalizePaneRatios();
  applyPaneLayout();
}

function endPaneDrag(e) {
  if (!paneDrag || e.pointerId !== paneDrag.pointerId) return;
  const splitter = els.splitters[paneDrag.physicalSplitterIndex];
  splitter?.classList.remove("is-dragging");
  if (splitter?.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
  paneDrag = null;
  document.body.classList.remove("pane-drag-active");
  saveLayoutPrefs();
}

function goToPage(n) {
  if (!state) return;
  setPageSettingsOpen(false);
  const page = Math.min(Math.max(1, n), state.pageCount);
  state.currentPage = page;
  renderPage(page);
}

function resetPageNumberInput() {
  if (!els.pageNumberInput) return;
  els.pageNumberInput.value = state ? String(state.currentPage) : "1";
}

function commitPageNumberInput() {
  if (!state || !els.pageNumberInput) return;
  const n = Number.parseInt(els.pageNumberInput.value.trim(), 10);
  if (!Number.isFinite(n)) {
    resetPageNumberInput();
    return;
  }
  goToPage(n);
}

function setPageIndicator(pageNum, pageCount) {
  if (!els.pageIndicator) return;
  if (els.pageCountIndicator) els.pageCountIndicator.textContent = `\u00A0of ${pageCount}`;
  if (els.pageNumberInput) {
    const digits = Math.max(1, String(pageCount).length);
    els.pageNumberInput.style.setProperty("--page-num-digits", String(digits));
    els.pageNumberInput.disabled = !state;
    if (document.activeElement !== els.pageNumberInput) {
      els.pageNumberInput.value = String(pageNum);
    }
  }
}

function renderPage(pageNum) {
  if (!state) return;
  const { segments, pageImages, pageCount, defaultResolution } = state;
  const idx = pageNum - 1;
  const segment = segments[idx] ?? [];
  selectedElementId = null;

  setPageIndicator(pageNum, pageCount);
  if (els.btnPrev) els.btnPrev.disabled = pageNum <= 1;
  if (els.btnNext) els.btnNext.disabled = pageNum >= pageCount;

  if (!els.markupPane || !els.renderedPane || !els.pagePane) return;

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
      const port = document.createElement("div");
      port.className = "page-view-port";
      const wrap = document.createElement("div");
      wrap.className = "page-view";
      const img = document.createElement("img");
      img.alt = `Page ${pageNum}`;

      const onImageReady = () => {
        if (img.dataset.layoutGeneration === String(pageNum)) return;
        img.dataset.layoutGeneration = String(pageNum);

        applyPageImageSize(img, els.pagePane);

        const boxes = collectBoundingBoxes(segment, defaultResolution, elementIds);
        const existing = wrap.querySelector("svg.overlay");
        if (existing) existing.remove();
        const readingOrderSteps = collectReadingOrderSteps(
          segment,
          elementIds,
          boxes,
          state.readingOrder,
          readingOrderGlobalNumbering,
          state.readingOrderDisplayNumbers,
        );
        state.pageViewOverlay = { boxes, readingOrderSteps };
        if (boxes.length) {
          wrap.appendChild(
            buildOverlay(
              img,
              boxes,
              collectCaptionLinks(segment, elementIds, boxes),
              collectXrefLinks(segment, elementIds, boxes),
              readingOrderSteps,
              collectFragmentLinks(segment, elementIds, boxes, pageNum, state.threadPagesById),
              collectFragmentNavItems(segment, elementIds, boxes),
              defaultResolution,
            ),
          );
        }
        syncPageViewChrome(img);
        const pending = state.pendingSelectElement;
        if (pending) {
          state.pendingSelectElement = null;
          const id = findElementIdOnPage(pending);
          if (id) selectElement(id);
        }
      };

      img.addEventListener("load", onImageReady, { once: true });
      wrap.appendChild(img);
      port.appendChild(wrap);
      els.pagePane.appendChild(port);
      img.src = imageUrl;
      if (img.complete) onImageReady();

      if (!pagePaneResizeObserver) {
        pagePaneResizeObserver = new ResizeObserver(() => {
          refreshPageViewLayout();
        });
        pagePaneResizeObserver.observe(els.pagePane);
      }
    } else {
      els.pagePane.innerHTML = `<div class="placeholder">${NO_IMAGE}</div>`;
    }
  }
}

function pageZoomFactor() {
  return pageZoomPercent / PAGE_ZOOM_DEFAULT;
}

function overlayUserLength(baseUserPx) {
  return baseUserPx / pageZoomFactor();
}

function computePageFitScale(img, pane) {
  return getCachedFitScale(img, pane);
}

function resetPageLayoutCache() {
  pageLayoutCache = null;
}

function paneContentSize(pane) {
  const style = getComputedStyle(pane);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  return {
    w: pane.clientWidth - padX,
    h: pane.clientHeight - padY,
  };
}

function getCachedFitScale(img, pane) {
  const { w: paneW, h: paneH } = paneContentSize(pane);
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  if (
    pageLayoutCache &&
    pageLayoutCache.paneW === paneW &&
    pageLayoutCache.paneH === paneH &&
    pageLayoutCache.imgW === imgW &&
    pageLayoutCache.imgH === imgH
  ) {
    return pageLayoutCache.fitScale;
  }
  const fitScale =
    paneW > 0 && paneH > 0 && imgW > 0 && imgH > 0
      ? Math.min(
          (paneW - PAGE_VIEW_BORDER_PX) / imgW,
          (paneH - PAGE_VIEW_BORDER_PX) / imgH,
        )
      : 1;
  pageLayoutCache = { paneW, paneH, imgW, imgH, fitScale };
  return fitScale;
}

function applyPageImageSize(img, pane = els.pagePane) {
  if (!img?.naturalWidth || !img.naturalHeight) return false;
  pageZoomPercent = Math.max(PAGE_ZOOM_DEFAULT, pageZoomPercent);
  const fitScale = getCachedFitScale(img, pane);
  const scale = fitScale * (pageZoomPercent / PAGE_ZOOM_DEFAULT);
  const w = Math.floor(img.naturalWidth * scale);
  const h = Math.floor(img.naturalHeight * scale);
  const nextW = `${w}px`;
  const nextH = `${h}px`;
  const unchanged = img.style.width === nextW && img.style.height === nextH;
  if (!unchanged) {
    img.style.width = nextW;
    img.style.height = nextH;
    img.style.maxWidth = "none";
    img.style.maxHeight = "none";
  }
  img.dataset.layoutReady = "1";
  return !unchanged;
}

function syncPageViewChrome(img) {
  syncOverlayBadges(img);
  updatePagePanePanCursor();
  applyBboxVisibility();
}

function applyPageLayout(img, pane = els.pagePane) {
  applyPageImageSize(img, pane);
  syncPageViewChrome(img);
}

let pageLayoutFrame = 0;

function refreshPageViewLayout() {
  if (!els.pagePane) return;
  cancelAnimationFrame(pageLayoutFrame);
  pageLayoutFrame = requestAnimationFrame(() => {
    pageLayoutFrame = 0;
    const img = els.pagePane?.querySelector(".page-view img");
    if (img?.naturalWidth) applyPageLayout(img);
  });
}

function overlayBadgeLayout(svg, text, fontSizeUser) {
  const padXUser = overlayUserLength(OVERLAY_BADGE_PAD_X);
  const padYUser = overlayUserLength(OVERLAY_BADGE_PAD_Y);
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
  probe.setAttribute("class", "overlay-badge-label");
  probe.setAttribute("font-size", String(fontSizeUser));
  probe.setAttribute("font-weight", "700");
  probe.setAttribute("text-anchor", "start");
  probe.setAttribute("dominant-baseline", "text-before-edge");
  probe.setAttribute("visibility", "hidden");
  probe.textContent = String(text);
  svg.appendChild(probe);

  let width;
  let height;
  try {
    const bbox = probe.getBBox();
    width = bbox.width + padXUser * 2;
    height = bbox.height + padYUser * 2;
  } catch {
    const label = String(text);
    width = overlayUserLength(label.length * OVERLAY_BADGE_FONT_SIZE * 0.55 + OVERLAY_BADGE_PAD_X * 2);
    height = overlayUserLength(OVERLAY_BADGE_FONT_SIZE * 1.1 + OVERLAY_BADGE_PAD_Y * 2);
  }
  probe.remove();
  return { width, height };
}

function appendOverlayBadge(svg, anchorX, anchorY, text, { extraClass, elementId }) {
  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE);
  const { width, height } = overlayBadgeLayout(svg, text, fontSize);
  const radius = overlayUserLength(OVERLAY_BADGE_RADIUS_SCREEN_PX);

  const badge = document.createElementNS("http://www.w3.org/2000/svg", "g");
  badge.setAttribute("class", `overlay-badge ${extraClass}`);
  badge.setAttribute("data-element-id", elementId);

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("class", "overlay-badge-bg");
  bg.setAttribute("x", String(anchorX - width / 2));
  bg.setAttribute("y", String(anchorY - height / 2));
  bg.setAttribute("width", String(width));
  bg.setAttribute("height", String(height));
  bg.setAttribute("rx", String(radius));
  bg.setAttribute("ry", String(radius));
  badge.appendChild(bg);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("class", "overlay-badge-label");
  label.setAttribute("x", String(anchorX));
  label.setAttribute("y", String(anchorY));
  label.setAttribute("font-size", String(fontSize));
  label.textContent = String(text);
  badge.appendChild(label);

  svg.appendChild(badge);
  return badge;
}

function syncOverlayBadges(img) {
  const svg = img.parentElement?.querySelector("svg.overlay");
  const meta = state?.pageViewOverlay;
  if (!svg || !img.naturalWidth || !meta) return;

  svg.querySelectorAll(".element-badge, .reading-order-badge").forEach((badge) => badge.remove());

  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE);
  const badgeGap = overlayUserLength(2);
  const readingOrderByElementId = new Map();
  if (showAllBboxes && showReadingOrder) {
    for (const step of meta.readingOrderSteps ?? []) {
      readingOrderByElementId.set(step.elementId, step);
    }
  }

  const boxes = sortedOverlayBoxes(meta.boxes ?? []);

  for (const b of boxes) {
    const { x, y } = boxPixelRect(b, img);
    let tagLayout = { width: 0 };
    if (showAllBboxes && showLayoutBadges) {
      tagLayout = overlayBadgeLayout(svg, b.tag, fontSize);
      appendOverlayBadge(svg, x, y, b.tag, {
        extraClass: `element-badge ${kindClassForTag(b.kind)}`,
        elementId: b.elementId,
      });
    }

    const step = readingOrderByElementId.get(b.elementId);
    if (step) {
      const orderText = String(step.order);
      const orderLayout = overlayBadgeLayout(svg, orderText, fontSize);
      const orderAnchorX = showAllBboxes && showLayoutBadges
        ? x + tagLayout.width / 2 + badgeGap + orderLayout.width / 2
        : x;
      appendOverlayBadge(svg, orderAnchorX, y, orderText, {
        extraClass: "reading-order-badge",
        elementId: b.elementId,
      });
    }
  }
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

/** @returns {{ kind: string, tag: string, elementId: string, layer: string, x0: number, y0: number, x1: number, y1: number, resW: number, resH: number }[]} */
function collectBoundingBoxes(segment, defaultResolution, elementIds) {
  /** @type {{ kind: string, tag: string, elementId: string, layer: string, x0: number, y0: number, x1: number, y1: number, resW: number, resH: number }[]} */
  const boxes = [];
  walkElements(segment, (el) => {
    const locs = headLocations(el);
    if (locs.length !== 4) return;
    const elementId = elementIds.get(el);
    if (!elementId) return;
    pushBoundingBox(
      boxes,
      locs,
      defaultResolution,
      localName(el),
      elementLabel(el),
      elementId,
      elementLayer(el),
    );
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

/** @returns {{ captionBox: object, hostBox: object, captionElementId: string, hostElementId: string }[]} */
function collectCaptionLinks(segment, elementIds, boxes) {
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {{ captionBox: object, hostBox: object, captionElementId: string, hostElementId: string }[]} */
  const links = [];
  walkElements(segment, (el) => {
    if (localName(el) !== "caption") return;
    const captionId = elementIds.get(el);
    const captionBox = captionId ? boxById.get(captionId) : null;
    if (!captionBox) return;
    const host = el.parentElement;
    if (!host || headLocations(host).length !== 4) return;
    const hostId = elementIds.get(host);
    const hostBox = hostId ? boxById.get(hostId) : null;
    if (!hostBox) return;
    links.push({
      captionBox,
      hostBox,
      captionElementId: captionId,
      hostElementId: hostId,
    });
  });
  return links;
}

/** @returns {{ fromBox: object, toBox: object, fromElementId: string, toElementId: string }[]} */
function collectXrefLinks(segment, elementIds, boxes) {
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {Map<string, { elementId: string, box: object }[]>} */
  const threadsById = new Map();

  walkElements(segment, (el) => {
    const elementId = elementIds.get(el);
    const box = elementId ? boxById.get(elementId) : null;
    if (!box) return;
    for (const thread of childElements(el)) {
      if (localName(thread) !== "thread") continue;
      const threadId = thread.getAttribute("thread_id");
      if (!threadId) continue;
      if (!threadsById.has(threadId)) threadsById.set(threadId, []);
      threadsById.get(threadId).push({ elementId, box });
    }
  });

  /** @type {{ fromBox: object, toBox: object, fromElementId: string, toElementId: string }[]} */
  const links = [];
  walkElements(segment, (el) => {
    const xrefs = childElements(el).filter((c) => localName(c) === "xref");
    if (!xrefs.length) return;

    const from = findNearestLocatedBox(el, elementIds, boxById);
    if (!from) return;

    for (const xref of xrefs) {
      const threadId = xref.getAttribute("thread_id");
      if (!threadId) continue;
      for (const { elementId: toId, box: toBox } of threadsById.get(threadId) ?? []) {
        if (toId === from.elementId) continue;
        links.push({
          fromBox: from.box,
          toBox,
          fromElementId: from.elementId,
          toElementId: toId,
        });
      }
    }
  });
  return links;
}

/** @returns {{ fromBox: object, toBox: object | null, fromElementId: string, toElementId: string | null, threadId: string, targetCorner?: "tl" | "br" }[]} */
function collectFragmentLinks(segment, elementIds, boxes, pageNum, threadPagesById) {
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {Map<string, { elementId: string, box: object }[]>} */
  const onPage = new Map();

  walkElements(segment, (el) => {
    const thread = firstHeadChild(el, "thread");
    const threadId = thread?.getAttribute("thread_id");
    if (!threadId) return;
    const elementId = elementIds.get(el);
    const box = elementId ? boxById.get(elementId) : null;
    if (!box) return;
    if (!onPage.has(threadId)) onPage.set(threadId, []);
    onPage.get(threadId).push({ elementId, box });
  });

  const segmentEls = new Set();
  walkElements(segment, (el) => segmentEls.add(el));

  /** @type {{ fromBox: object, toBox: object | null, fromElementId: string, toElementId: string | null, threadId: string, targetCorner?: "tl" | "br" }[]} */
  const links = [];

  for (const [threadId, members] of onPage) {
    if (members.length >= 2) {
      for (let i = 0; i < members.length - 1; i += 1) {
        links.push({
          fromBox: members[i].box,
          toBox: members[i + 1].box,
          fromElementId: members[i].elementId,
          toElementId: members[i + 1].elementId,
          threadId,
        });
      }
      continue;
    }

    if (members.length !== 1) continue;
    const threadPages = threadPagesById.get(threadId);
    if (!threadPages) continue;
    const hasPrevious = [...threadPages].some((p) => p < pageNum);
    const hasFollowing = [...threadPages].some((p) => p > pageNum);
    if (!hasPrevious && !hasFollowing) continue;

    const base = {
      fromBox: members[0].box,
      toBox: null,
      fromElementId: members[0].elementId,
      toElementId: null,
      threadId,
    };
    if (hasPrevious) links.push({ ...base, targetCorner: "tl" });
    if (hasFollowing) links.push({ ...base, targetCorner: "br" });
  }

  return links;
}

function isReadingOrderUnit(el) {
  const tag = localName(el);
  if (tag === "caption") return true;
  if (HEAD_TAGS.has(tag) || tag === "location" || tag === "h_thread" || tag === "page_break") return false;
  if (tag === "nl" || CELL_SPAN_TAGS.has(tag)) return false;
  if (RENDER_FORMAT_TAGS.has(tag) || tag === "src" || tag === "checkbox") return false;
  return true;
}

/** @returns {Map<string, Element[]>} */
function buildThreadsById(docRoot) {
  const map = new Map();
  const roots = childElements(docRoot).filter((el) => localName(el) !== "head");
  walkElements(roots, (el) => {
    for (const child of childElements(el)) {
      if (localName(child) !== "thread") continue;
      const threadId = child.getAttribute("thread_id");
      if (!threadId) continue;
      if (!map.has(threadId)) map.set(threadId, []);
      map.get(threadId).push(el);
    }
  });
  return map;
}

/** @returns {Map<Element, number>} */
function buildElementPageMap(segments) {
  const elementPage = new Map();
  segments.forEach((segment, idx) => {
    const pageNum = idx + 1;
    walkElements(segment, (el) => elementPage.set(el, pageNum));
  });
  return elementPage;
}

/** @returns {Map<string, Set<number>>} */
function buildThreadPagesById(docRoot, elementPageByEl) {
  /** @type {Map<string, Set<number>>} */
  const threadPagesById = new Map();
  for (const [threadId, elements] of buildThreadsById(docRoot)) {
    const pages = new Set();
    for (const el of elements) {
      const page = elementPageByEl.get(el);
      if (page) pages.add(page);
    }
    if (pages.size) threadPagesById.set(threadId, pages);
  }
  return threadPagesById;
}

/** @returns {Map<Element, { prev: Element | null, next: Element | null }>} */
function buildThreadNavByElement(docRoot) {
  /** @type {Map<Element, { prev: Element | null, next: Element | null }>} */
  const nav = new Map();
  for (const [, elements] of buildThreadsById(docRoot)) {
    for (let i = 0; i < elements.length; i += 1) {
      nav.set(elements[i], {
        prev: i > 0 ? elements[i - 1] : null,
        next: i < elements.length - 1 ? elements[i + 1] : null,
      });
    }
  }
  return nav;
}

/** @returns {{ elementId: string, box: object, hasPrev: boolean, hasNext: boolean }[]} */
function collectFragmentNavItems(segment, elementIds, boxes) {
  if (!state?.threadNavByElement) return [];
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {{ elementId: string, box: object, hasPrev: boolean, hasNext: boolean }[]} */
  const items = [];
  walkElements(segment, (el) => {
    const nav = state.threadNavByElement.get(el);
    if (!nav || (!nav.prev && !nav.next)) return;
    const elementId = elementIds.get(el);
    const box = elementId ? boxById.get(elementId) : null;
    if (!box) return;
    items.push({
      elementId,
      box,
      hasPrev: nav.prev !== null,
      hasNext: nav.next !== null,
    });
  });
  return items;
}

function findElementIdOnPage(el) {
  if (!state?.elementIds) return null;
  for (const [node, id] of state.elementIds) {
    if (node === el) return id;
  }
  return null;
}

function navigateThreadFragment(elementId, direction) {
  const el = state?.idToElement?.get(elementId);
  if (!el) return;
  const nav = state?.threadNavByElement?.get(el);
  if (!nav) return;
  const target = direction === "prev" ? nav.prev : nav.next;
  if (!target) return;
  const page = state.elementPageByEl.get(target);
  if (!page) return;
  if (page === state.currentPage) {
    const id = findElementIdOnPage(target);
    if (id) selectElement(id);
    return;
  }
  state.pendingSelectElement = target;
  goToPage(page);
}

/** @returns {Element[]} */
function computeReadingOrder(docRoot) {
  const bodyChildren = childElements(docRoot).filter((el) => localName(el) !== "head");
  const threadsById = buildThreadsById(docRoot);
  const consumedViaXref = new Set();
  /** @type {Element[]} */
  const order = [];

  function record(el) {
    if (!isReadingOrderUnit(el)) return;
    order.push(el);
  }

  function consumeThread(threadId) {
    for (const target of threadsById.get(threadId) ?? []) {
      if (consumedViaXref.has(target)) continue;
      consumedViaXref.add(target);
      visitElement(target);
    }
  }

  function walkChildren(parent) {
    for (const child of parent.childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = localName(child);
      if (tag === "xref") {
        const threadId = child.getAttribute("thread_id");
        if (threadId) consumeThread(threadId);
        continue;
      }
      if (tag === "page_break") continue;
      visitElement(child);
    }
  }

  function visitElement(el) {
    record(el);
    walkChildren(el);
  }

  for (const el of bodyChildren) {
    if (localName(el) === "page_break") continue;
    if (consumedViaXref.has(el)) continue;
    visitElement(el);
  }

  return order;
}

function hasVirtualTextLocations(el) {
  const parent = el.parentElement;
  if (!parent) return false;
  const nodes = [...parent.childNodes];
  const idx = nodes.indexOf(el);
  if (idx < 0) return false;
  return parseElementHeadAt(nodes, idx + 1) !== null;
}

function isVirtualTextOverlayUnit(el) {
  if (headLocations(el).length === 4) return false;
  if (!hasVirtualTextLocations(el)) return false;
  const tag = localName(el);
  if (tag === "ldiv" && localName(el.parentElement) === "list") return true;
  if (isCellToken(tag) && tag !== "nl" && !CELL_SPAN_TAGS.has(tag)) {
    return OTSL_CONTAINER_TAGS.has(localName(el.parentElement));
  }
  return false;
}

function isPictureContentElement(el) {
  if (!el) return false;
  const tag = localName(el);
  if (tag === "picture" || tag === "caption") return false;
  let node = el.parentElement;
  while (node) {
    if (localName(node) === "picture") return true;
    node = node.parentElement;
  }
  return false;
}

function isTableContentElement(el) {
  if (!el) return false;
  const tag = localName(el);
  if (OTSL_CONTAINER_TAGS.has(tag) || tag === "caption") return false;
  let node = el.parentElement;
  while (node) {
    if (OTSL_CONTAINER_TAGS.has(localName(node))) return true;
    node = node.parentElement;
  }
  return false;
}

function isPictureOrTableContentElement(el) {
  return isPictureContentElement(el) || isTableContentElement(el);
}

function isReadingOrderOverlayUnit(el) {
  if (!isReadingOrderUnit(el)) return false;
  if (isPictureOrTableContentElement(el)) return false;
  if (headLocations(el).length === 4) return true;
  return isVirtualTextOverlayUnit(el);
}

/** @returns {Map<Element, number>} */
function computeReadingOrderDisplayNumbers(readingOrder) {
  const numbers = new Map();
  let n = 0;
  for (const el of readingOrder) {
    if (!isReadingOrderOverlayUnit(el)) continue;
    n += 1;
    numbers.set(el, n);
  }
  return numbers;
}

/** @returns {{ order: number, box: object, elementId: string }[]} */
function collectReadingOrderSteps(
  segment,
  elementIds,
  boxes,
  readingOrder,
  globalNumbering = true,
  displayNumbers = null,
) {
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {{ order: number, box: object, elementId: string }[]} */
  const steps = [];
  let pageOrder = 0;

  readingOrder.forEach((el) => {
    if (isPictureOrTableContentElement(el)) return;
    const elementId = elementIds.get(el);
    if (!elementId) return;
    const box = boxById.get(elementId);
    if (!box) return;
    pageOrder += 1;
    steps.push({
      order: globalNumbering ? (displayNumbers?.get(el) ?? pageOrder) : pageOrder,
      box,
      elementId,
    });
  });

  return steps;
}

function pushBoundingBox(boxes, locs, defaultResolution, kind, tag, elementId, layer = "body") {
  const [x0el, y0el, x1el, y1el] = locs;
  const resW = locationResolution(x0el, defaultResolution.width);
  const resH = locationResolution(y0el, defaultResolution.height);
  boxes.push({
    kind,
    tag,
    elementId,
    layer,
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
      if (elementId) {
        pushBoundingBox(boxes, head.locs, defaultResolution, "text", "text", elementId, elementLayer(node));
      }
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
      if (elementId) {
        pushBoundingBox(boxes, head.locs, defaultResolution, "text", "text", elementId, elementLayer(node));
      }
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

/** @returns {{ elementId: string, box: object } | null} */
function findNearestLocatedBox(el, elementIds, boxById) {
  let node = el;
  while (node) {
    const elementId = elementIds.get(node);
    const box = elementId ? boxById.get(elementId) : null;
    if (box) return { elementId, box };
    if (localName(node) === "doclang") break;
    node = node.parentElement;
  }
  return null;
}

function locationResolution(el, axisDefault) {
  const r = parseInt(el.getAttribute("resolution") ?? String(axisDefault), 10);
  return Number.isFinite(r) && r > 0 ? r : axisDefault;
}

function headingLevel(el) {
  return Math.min(Math.max(parseInt(el.getAttribute("level") ?? "1", 10) || 1, 1), 6);
}

function elementLabel(el) {
  if (isVirtualTextOverlayUnit(el)) return "text";
  const tag = localName(el);
  if (tag === "heading" || tag === "field_heading") return `${tag}[${headingLevel(el)}]`;
  const level = el.getAttribute("level");
  if (level) return `${tag}[${level}]`;
  const cls = el.getAttribute("class");
  if (cls) return `${tag}.${cls}`;
  return tag;
}

function elementKindKey(kind) {
  if (kind.startsWith("field_") || kind === "key" || kind === "value" || kind === "hint") return "field";
  if (kind === "tabular") return "table";
  const known = new Set([
    "text", "heading", "list", "ldiv", "table", "index", "formula", "code", "picture",
    "group", "footnote", "page_header", "page_footer", "caption",
  ]);
  return known.has(kind) ? kind : "default";
}

function kindClassForTag(tag) {
  return `kind-${elementKindKey(tag)}`;
}

function bboxClassForKind(kind) {
  return elementKindKey(kind);
}

function boxPixelRect(b, img) {
  const x = (b.x0 / b.resW) * img.naturalWidth;
  const y = (b.y0 / b.resH) * img.naturalHeight;
  const w = ((b.x1 - b.x0) / b.resW) * img.naturalWidth;
  const h = ((b.y1 - b.y0) / b.resH) * img.naturalHeight;
  return { x, y, w, h, area: w * h };
}

function overlayBoxPaintPriority(box) {
  if (box.kind === "text") return 0;
  if (box.kind === "list" || box.kind === "table" || box.kind === "index" || box.kind === "tabular") {
    return 2;
  }
  return 1;
}

function overlayLayerPriority(layer) {
  if (layer === "background") return 0;
  if (layer === "furniture") return 1;
  return 2;
}

function compareOverlayBoxPaintOrder(a, b) {
  const byLayer = overlayLayerPriority(a.layer ?? "body") - overlayLayerPriority(b.layer ?? "body");
  if (byLayer !== 0) return byLayer;
  const byPriority = overlayBoxPaintPriority(a) - overlayBoxPaintPriority(b);
  if (byPriority !== 0) return byPriority;
  if (selectedElementId) {
    const aSelected = a.elementId === selectedElementId;
    const bSelected = b.elementId === selectedElementId;
    if (aSelected !== bSelected) return aSelected ? 1 : -1;
  }
  return 0;
}

function sortedOverlayBoxes(boxes) {
  return [...boxes].sort(compareOverlayBoxPaintOrder);
}

function anchorOnRect(rect, targetX, targetY) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const scale = Math.min(
    dx !== 0 ? rect.w / 2 / Math.abs(dx) : Infinity,
    dy !== 0 ? rect.h / 2 / Math.abs(dy) : Infinity,
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function ensureArrowMarker(defs, markerId) {
  if (defs.querySelector(`#${markerId}`)) return;
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 6 6");
  marker.setAttribute("refX", "6");
  marker.setAttribute("refY", "3");
  marker.setAttribute("markerWidth", "5");
  marker.setAttribute("markerHeight", "5");
  marker.setAttribute("orient", "auto");
  const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrowPath.setAttribute("d", "M0,0 L6,3 L0,6 Z");
  arrowPath.setAttribute("fill", "currentColor");
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
}

function alignDashedLineToEnd(line, start, end) {
  const dash = 6;
  const gap = 4;
  const period = dash + gap;
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  if (!len) return;
  line.setAttribute("stroke-dasharray", `${dash} ${gap}`);
  const offset = len % period;
  if (offset > 0.01) line.setAttribute("stroke-dashoffset", String(offset));
}

function ensureLayerHatchPatterns(defs) {
  if (defs.querySelector("#layer-hatch")) return;

  const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
  pattern.setAttribute("id", "layer-hatch");
  pattern.setAttribute("width", "16");
  pattern.setAttribute("height", "16");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("patternTransform", "rotate(45 8 8)");
  const stripe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  stripe.setAttribute("class", "layer-hatch-stripe");
  stripe.setAttribute("x", "10");
  stripe.setAttribute("y", "-4");
  stripe.setAttribute("width", "6");
  stripe.setAttribute("height", "24");
  pattern.appendChild(stripe);
  defs.appendChild(pattern);
}

function ensureOverlayDefs(svg) {
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

function appendOverlayLinks(svg, img, links, { markerId, linkClass, fromIdAttr, toIdAttr }) {
  if (!links.length) return;

  const defs = ensureOverlayDefs(svg);
  ensureArrowMarker(defs, markerId);

  for (const link of links) {
    const from = boxPixelRect(link.fromBox ?? link.captionBox, img);
    const to = boxPixelRect(link.toBox ?? link.hostBox, img);
    const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
    const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
    const start = anchorOnRect(from, toCenter.x, toCenter.y);
    const end = anchorOnRect(to, fromCenter.x, fromCenter.y);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", linkClass);
    line.setAttribute("x1", String(start.x));
    line.setAttribute("y1", String(start.y));
    line.setAttribute("x2", String(end.x));
    line.setAttribute("y2", String(end.y));
    line.setAttribute("marker-end", `url(#${markerId})`);
    line.setAttribute(fromIdAttr, link.fromElementId ?? link.captionElementId);
    line.setAttribute(toIdAttr, link.toElementId ?? link.hostElementId);
    svg.appendChild(line);
  }
}

function appendCaptionLinks(svg, img, captionLinks) {
  appendOverlayLinks(svg, img, captionLinks, {
    markerId: "caption-arrowhead",
    linkClass: "caption-link",
    fromIdAttr: "data-caption-id",
    toIdAttr: "data-host-id",
  });
}

function appendXrefLinks(svg, img, xrefLinks) {
  appendOverlayLinks(svg, img, xrefLinks, {
    markerId: "xref-arrowhead",
    linkClass: "xref-link",
    fromIdAttr: "data-xref-from-id",
    toIdAttr: "data-xref-to-id",
  });
}

function docPointToPixel(xDoc, yDoc, resW, resH, img) {
  return {
    x: (xDoc / resW) * img.naturalWidth,
    y: (yDoc / resH) * img.naturalHeight,
  };
}

function pageCornerTarget(img, defaultResolution, corner) {
  const { width: resW, height: resH } = defaultResolution;
  const inset = overlayUserLength(5);
  const tl = docPointToPixel(0, 0, resW, resH, img);
  const br = docPointToPixel(resW, resH, resW, resH, img);
  if (corner === "tl") {
    return {
      x: Math.min(tl.x + inset, br.x - inset),
      y: Math.min(tl.y + inset, br.y - inset),
    };
  }
  return {
    x: Math.max(br.x - inset, tl.x + inset),
    y: Math.max(br.y - inset, tl.y + inset),
  };
}

function elementThreadId(el) {
  return firstHeadChild(el, "thread")?.getAttribute("thread_id") ?? null;
}

/** @returns {Set<string>} */
function fragmentPeerElementIds(elementId) {
  const peers = new Set();
  if (!elementId || !state?.elementIds || !state.idToElement) return peers;
  const el = state.idToElement.get(elementId);
  const threadId = el ? elementThreadId(el) : null;
  if (!threadId) return peers;
  for (const [node, id] of state.elementIds) {
    if (elementThreadId(node) === threadId) peers.add(id);
  }
  return peers;
}

function isFragmentLinkRelevant(linkEl, peerIds) {
  const fromId = linkEl.getAttribute("data-fragment-from-id");
  const toId = linkEl.getAttribute("data-fragment-to-id");
  if (fromId && peerIds.has(fromId)) return true;
  if (toId && peerIds.has(toId)) return true;
  return false;
}

function appendFragmentLinks(svg, img, links, defaultResolution) {
  if (!links.length) return;

  const defs = ensureOverlayDefs(svg);
  ensureArrowMarker(defs, "fragment-arrowhead");
  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE);

  for (const link of links) {
    const fromRect = boxPixelRect(link.fromBox, img);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "fragment-link");
    group.setAttribute("data-thread-id", link.threadId);
    group.setAttribute("data-fragment-from-id", link.fromElementId);
    if (link.toElementId) group.setAttribute("data-fragment-to-id", link.toElementId);

    let labelAt;
    if (link.toBox) {
      const toRect = boxPixelRect(link.toBox, img);
      const fromCenter = { x: fromRect.x + fromRect.w / 2, y: fromRect.y + fromRect.h / 2 };
      const toCenter = { x: toRect.x + toRect.w / 2, y: toRect.y + toRect.h / 2 };
      const start = anchorOnRect(fromRect, toCenter.x, toCenter.y);
      const end = anchorOnRect(toRect, fromCenter.x, fromCenter.y);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "fragment-link-path fragment-link-path-dashed");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("marker-end", "url(#fragment-arrowhead)");
      alignDashedLineToEnd(line, start, end);
      group.appendChild(line);
      labelAt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    } else {
      const corner = link.targetCorner ?? "br";
      const cornerPoint = pageCornerTarget(img, defaultResolution, corner);
      const elementAnchor = anchorOnRect(fromRect, cornerPoint.x, cornerPoint.y);
      const incoming = corner === "tl";
      const start = incoming ? cornerPoint : elementAnchor;
      const end = incoming ? elementAnchor : cornerPoint;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "fragment-link-path fragment-link-path-dashed");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("marker-end", "url(#fragment-arrowhead)");
      alignDashedLineToEnd(line, start, end);
      group.appendChild(line);
      labelAt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    }

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "fragment-link-label");
    text.setAttribute("x", String(labelAt.x));
    text.setAttribute("y", String(labelAt.y));
    text.setAttribute("font-size", String(fontSize));
    text.textContent = link.toBox ? FRAGMENT_LINK_LABEL_SAME_PAGE : FRAGMENT_LINK_LABEL_CROSS_PAGE;
    group.appendChild(text);

    svg.appendChild(group);
  }
}

function appendFragmentNavButtons(svg, img, items) {
  if (!items.length) return;

  const btnSize = overlayUserLength(13 * 1.5);
  const gap = overlayUserLength(2);
  const inset = overlayUserLength(3);
  const fontSize = overlayUserLength(10 * 1.5);
  const radius = overlayUserLength(2 * 1.5);

  for (const item of items) {
    const { x, y, w, h } = boxPixelRect(item.box, img);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "fragment-nav");
    group.setAttribute("data-element-id", item.elementId);

    const rowY = y + h - inset - btnSize;
    const nextX = x + w - inset - btnSize;
    const prevX = nextX - gap - btnSize;

    appendFragmentNavButton(group, prevX, rowY, btnSize, radius, fontSize, "prev", "‹", item.hasPrev);
    appendFragmentNavButton(group, nextX, rowY, btnSize, radius, fontSize, "next", "›", item.hasNext);

    svg.appendChild(group);
  }
}

function appendFragmentNavButton(group, x, y, size, radius, fontSize, direction, label, enabled) {
  const btn = document.createElementNS("http://www.w3.org/2000/svg", "g");
  btn.setAttribute("class", `fragment-nav-btn fragment-nav-btn-${direction}${enabled ? "" : " fragment-nav-btn-disabled"}`);
  btn.setAttribute("data-nav", direction);
  if (enabled) {
    btn.setAttribute("role", "button");
    btn.setAttribute(
      "aria-label",
      direction === "prev" ? FRAGMENT_NAV_HINT_PREV : FRAGMENT_NAV_HINT_NEXT,
    );
  }

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("class", "fragment-nav-btn-bg");
  bg.setAttribute("x", String(x));
  bg.setAttribute("y", String(y));
  bg.setAttribute("width", String(size));
  bg.setAttribute("height", String(size));
  bg.setAttribute("rx", String(radius));
  bg.setAttribute("ry", String(radius));
  btn.appendChild(bg);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("class", "fragment-nav-btn-label");
  text.setAttribute("x", String(x + size / 2));
  text.setAttribute("y", String(y + size / 2));
  text.setAttribute("font-size", String(fontSize));
  text.textContent = label;
  btn.appendChild(text);

  group.appendChild(btn);
}

function appendReadingOrderOverlay(svg, img, steps) {
  if (!steps.length) return;

  if (steps.length >= 2) {
    const defs = ensureOverlayDefs(svg);
    ensureArrowMarker(defs, "reading-order-arrowhead");

    for (let i = 0; i < steps.length - 1; i += 1) {
      const from = boxPixelRect(steps[i].box, img);
      const to = boxPixelRect(steps[i + 1].box, img);
      const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
      const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
      const start = anchorOnRect(from, toCenter.x, toCenter.y);
      const end = anchorOnRect(to, fromCenter.x, fromCenter.y);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "reading-order-step");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("marker-end", "url(#reading-order-arrowhead)");
      svg.appendChild(line);
    }
  }
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

function buildOverlay(img, boxes, captionLinks = [], xrefLinks = [], readingOrderSteps = [], fragmentLinks = [], fragmentNavItems = [], defaultResolution = { width: 512, height: 512 }) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("overlay");
  svg.setAttribute("viewBox", `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
  svg.setAttribute("overflow", "hidden");

  appendCaptionLinks(svg, img, captionLinks);
  appendXrefLinks(svg, img, xrefLinks);
  appendFragmentLinks(svg, img, fragmentLinks, defaultResolution);
  appendReadingOrderOverlay(svg, img, readingOrderSteps);

  const defs = ensureOverlayDefs(svg);
  ensureLayerHatchPatterns(defs);

  for (const b of sortedOverlayBoxes(boxes)) {
    const { x, y, w, h } = boxPixelRect(b, img);
    const cls = bboxClassForKind(b.kind);
    const kindClass = kindClassForTag(b.kind);
    const layerClass = layerClassForValue(b.layer ?? "body");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute(
      "class",
      `bbox bbox-${cls} ${kindClass}${layerClass ? ` ${layerClass}` : ""}`,
    );
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(Math.max(w, 1)));
    rect.setAttribute("height", String(Math.max(h, 1)));
    rect.setAttribute("data-element-id", b.elementId);
    svg.appendChild(rect);
  }

  appendFragmentNavButtons(svg, img, fragmentNavItems);

  svg.addEventListener("click", (e) => {
    if (pagePanSuppressClick) {
      pagePanSuppressClick = false;
      return;
    }
    const navBtn = e.target.closest(".fragment-nav-btn:not(.fragment-nav-btn-disabled)");
    if (navBtn) {
      e.stopPropagation();
      const navGroup = navBtn.closest(".fragment-nav");
      const elementId = navGroup?.getAttribute("data-element-id");
      const direction = navBtn.getAttribute("data-nav");
      if (elementId && direction) navigateThreadFragment(elementId, direction);
      return;
    }
    const badge = e.target.closest(".overlay-badge[data-element-id]");
    if (badge) {
      const elementId = resolveSelectionElementId(badge.getAttribute("data-element-id"));
      if (elementId) selectElement(elementId);
      return;
    }
    const coords = imageCoordsFromEvent(svg, e);
    if (!coords) return;
    const hit = hitTestBoxes(boxes, img, coords.x, coords.y);
    if (hit) selectElement(hit.elementId);
    else clearSelection();
  });

  svg.addEventListener("mousemove", (e) => {
    const coords = imageCoordsFromEvent(svg, e);
    svg.style.cursor = coords && hitTestBoxes(boxes, img, coords.x, coords.y) ? "pointer" : "";
  });
  svg.addEventListener("mouseleave", () => {
    svg.style.cursor = "";
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

function isPictureContentOverlayElement(elementId) {
  return isPictureContentElement(state?.idToElement?.get(elementId) ?? null);
}

function isTableContentOverlayElement(elementId) {
  return isTableContentElement(state?.idToElement?.get(elementId) ?? null);
}

function isContentsOptionHidden(elementId, clickVisible) {
  if (clickVisible) return false;
  if (!showPictureContents && isPictureContentOverlayElement(elementId)) return true;
  if (!showTableContents && isTableContentOverlayElement(elementId)) return true;
  return false;
}

function applyBboxVisibility() {
  if (!state?.hasPageView || !els.pagePane) return;

  const peerIds = selectedElementId ? fragmentPeerElementIds(selectedElementId) : new Set();

  for (const el of els.pagePane.querySelectorAll(".bbox")) {
    el.classList.remove("related");
    const elementId = el.getAttribute("data-element-id");
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    if (showAllBboxes) {
      if (isContentsOptionHidden(elementId, clickVisible)) {
        el.classList.add("bbox-hidden");
      } else {
        el.classList.remove("bbox-hidden");
        if (peerIds.has(elementId)) {
          el.classList.add("related");
        }
      }
      continue;
    }
    if (elementId === selectedElementId) {
      el.classList.remove("bbox-hidden");
    } else if (peerIds.has(elementId)) {
      el.classList.remove("bbox-hidden");
      el.classList.add("related");
    } else {
      el.classList.add("bbox-hidden");
    }
  }

  for (const el of els.pagePane.querySelectorAll(".element-badge")) {
    const elementId = el.getAttribute("data-element-id");
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    if (!showAllBboxes || !showLayoutBadges) {
      el.classList.add("bbox-hidden");
      continue;
    }
    if (isContentsOptionHidden(elementId, clickVisible)) {
      el.classList.add("bbox-hidden");
    } else {
      el.classList.remove("bbox-hidden");
    }
  }

  for (const el of els.pagePane.querySelectorAll(".caption-link")) {
    if (!showAllBboxes || !showCaptionLinks) {
      el.classList.add("bbox-hidden");
      continue;
    }
    el.classList.remove("bbox-hidden");
  }

  for (const el of els.pagePane.querySelectorAll(".xref-link")) {
    if (!showAllBboxes || !showXrefLinks) {
      el.classList.add("bbox-hidden");
      continue;
    }
    el.classList.remove("bbox-hidden");
  }

  for (const el of els.pagePane.querySelectorAll(".fragment-link")) {
    const clickVisible = Boolean(selectedElementId && isFragmentLinkRelevant(el, peerIds));
    const optionVisible = showAllBboxes && showFragmentLinks;
    el.classList.toggle("bbox-hidden", !(clickVisible || optionVisible));
  }

  for (const el of els.pagePane.querySelectorAll(".fragment-nav")) {
    const elementId = el.getAttribute("data-element-id");
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    const optionVisible = showAllBboxes && showFragmentLinks;
    el.classList.toggle("bbox-hidden", !(clickVisible || optionVisible));
  }

  for (const el of els.pagePane.querySelectorAll(".reading-order-badge")) {
    const elementId = el.getAttribute("data-element-id");
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    if (!showAllBboxes || !showReadingOrder) {
      el.classList.add("bbox-hidden");
      continue;
    }
    if (
      isPictureContentOverlayElement(elementId)
      || isTableContentOverlayElement(elementId)
      || isContentsOptionHidden(elementId, clickVisible)
    ) {
      el.classList.add("bbox-hidden");
      continue;
    }
    el.classList.remove("bbox-hidden");
  }

  for (const el of els.pagePane.querySelectorAll(".reading-order-step")) {
    if (!showAllBboxes || !showReadingOrder || !showReadingOrderArrows) {
      el.classList.add("bbox-hidden");
      continue;
    }
    el.classList.remove("bbox-hidden");
  }
}

function findMarkupElementForSelection(elementId) {
  if (!els.markupPane) return null;
  return (
    els.markupPane.querySelector(`.markup-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.markupPane.querySelector(`[data-element-id="${elementId}"]`)
  );
}

function findRenderedElementForSelection(elementId) {
  if (!els.renderedPane) return null;
  const direct =
    els.renderedPane.querySelector(`.rendered-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.renderedPane.querySelector(`.rendered-el[data-element-id="${elementId}"]`);
  if (direct) return direct;

  const xmlEl = state?.idToElement?.get(elementId);
  const threadId = xmlEl ? elementThreadId(xmlEl) : null;
  if (!threadId) return null;

  const merged = els.renderedPane.querySelector(
    `.rendered-fragment-merged[data-thread-id="${threadId}"]`,
  );
  if (!merged) return null;

  const primaryId = merged.getAttribute("data-element-id");
  if (!primaryId || primaryId === elementId) return merged;
  return fragmentPeerElementIds(primaryId).has(elementId) ? merged : null;
}

function revealRenderedSelectionContext(renderedEl) {
  const pictureContents = renderedEl.closest(".rendered-picture-contents");
  if (pictureContents && !pictureContents.open) {
    pictureContents.open = true;
  }
  revealReadingLayerForSelection(renderedEl);
}

function revealReadingLayerForSelection(renderedEl) {
  const layer = renderedEl.getAttribute("data-doclang-layer");
  if (!layer || layer === "body") return;
  let changed = false;
  if (layer === "furniture" && !showReadingFurniture) {
    showReadingFurniture = true;
    changed = true;
  } else if (layer === "background" && !showReadingBackground) {
    showReadingBackground = true;
    changed = true;
  }
  if (!changed) return;
  syncReadingLayerCheckboxes();
  syncReadingLayerVisibility();
}

function applySelection() {
  els.markupPane?.querySelectorAll(".markup-el.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  els.renderedPane?.querySelectorAll(".rendered-el.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  if (!els.pagePane) return;
  els.pagePane.querySelectorAll(".bbox.selected, .overlay-badge.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  if (!selectedElementId) {
    const img = els.pagePane.querySelector(".page-view img");
    if (img) syncOverlayBadges(img);
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
    revealRenderedSelectionContext(renderedEl);
    renderedEl.classList.add("selected");
    renderedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  if (state?.hasPageView) {
    for (const el of els.pagePane.querySelectorAll(`[data-element-id="${selectedElementId}"]`)) {
      el.classList.add("selected");
    }
  }

  const img = els.pagePane.querySelector(".page-view img");
  if (img) syncOverlayBadges(img);
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
    const attrToggle = e.target.closest(".xml-attr-value-chip");
    if (attrToggle) {
      e.stopPropagation();
      toggleTruncatableMarkupAttrValue(attrToggle);
      return;
    }
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

function isVirtualTextSkippableNode(node) {
  if (isWhitespaceOnlyText(node)) return true;
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const tag = localName(node);
  return tag === "location" || HEAD_TAGS.has(tag);
}

function shouldWrapVirtualText(contentNodes) {
  if (!sliceHasMarkupContent(contentNodes)) return false;

  for (const node of contentNodes) {
    if (isVirtualTextSkippableNode(node)) continue;
    if (isTextLikeNode(node)) return true;
    if (node.nodeType === Node.ELEMENT_NODE && !isSemanticElement(node)) return true;
  }
  return false;
}

function appendRenderedSliceContent(container, hostEl, contentNodes, elementIds) {
  if (!sliceHasMarkupContent(contentNodes)) return;
  if (shouldWrapVirtualText(contentNodes)) {
    container.appendChild(renderVirtualTextBlock(hostEl, contentNodes, elementIds));
    return;
  }
  for (const node of contentNodes) {
    if (isVirtualTextSkippableNode(node)) continue;
    if (node.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(node))) {
      const rendered = renderBlockElement(node, elementIds, { inline: false });
      if (rendered) container.appendChild(rendered);
    } else {
      appendRenderedNode(container, node, elementIds, { inline: true });
    }
  }
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
  const tag = localName(el);
  const block = document.createElement("div");
  block.className = "markup-el";
  const elementId = elementIds.get(el);
  if (elementId) block.setAttribute("data-element-id", elementId);

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

/** @returns {Map<string, Element[]>} */
function collectIntraPageThreads(segment) {
  /** @type {Map<string, Element[]>} */
  const byThread = new Map();
  for (const el of segment) {
    if (el.nodeType !== Node.ELEMENT_NODE) continue;
    if (localName(el) === "page_break") continue;
    const threadId = elementThreadId(el);
    if (!threadId) continue;
    if (!byThread.has(threadId)) byThread.set(threadId, []);
    byThread.get(threadId).push(el);
  }
  for (const [threadId, members] of byThread) {
    if (members.length < 2) byThread.delete(threadId);
  }
  return byThread;
}

function findLastTextNode(node) {
  if (isTextLikeNode(node)) return node;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
    const found = findLastTextNode(node.childNodes[i]);
    if (found) return found;
  }
  return null;
}

function trimParentTrailingForFragmentJoin(parent) {
  const lastText = findLastTextNode(parent);
  if (!lastText) return;
  let value = lastText.textContent ?? "";
  value = value.replace(/\s+$/u, "");
  if (value.endsWith("-")) value = value.slice(0, -1);
  if (!value) {
    lastText.parentNode?.removeChild(lastText);
    trimParentTrailingForFragmentJoin(parent);
    return;
  }
  lastText.textContent = value;
}

function appendMergedTextFragments(parent, fragments, elementIds) {
  for (let i = 0; i < fragments.length; i += 1) {
    if (i > 0) trimParentTrailingForFragmentJoin(parent);
    appendRenderedBody(parent, fragments[i], elementIds, {
      inline: true,
      trimLeading: i > 0,
    });
  }
}

function renderMergedIntraPageFragments(fragments, elementIds) {
  const first = fragments[0];
  const tag = localName(first);
  const firstId = elementIds.get(first);
  const threadId = elementThreadId(first);

  let node;
  if (tag === "text") {
    node = document.createElement("p");
    appendMergedTextFragments(node, fragments, elementIds);
  } else if (tag === "list") {
    const listClass = first.getAttribute("class") ?? "unordered";
    node = document.createElement(listClass === "ordered" ? "ol" : "ul");
    for (const el of fragments) {
      appendListItemsFromElement(node, el, elementIds);
    }
  } else {
    node = document.createElement("div");
    node.className = "rendered-fragment-merged-body";
    for (const el of fragments) {
      appendRenderedBodyBlocks(node, el, elementIds);
    }
  }

  const wrap = wrapRendered(first, node, firstId, "rendered-fragment-merged");
  if (threadId) wrap.setAttribute("data-thread-id", threadId);
  return wrap;
}

function buildRenderedView(segment, elementIds) {
  const intraPageThreads = collectIntraPageThreads(segment);
  const skipElements = new Set();
  /** @type {Map<Element, Element[]>} */
  const mergeGroups = new Map();

  for (const [, members] of intraPageThreads) {
    mergeGroups.set(members[0], members);
    for (let i = 1; i < members.length; i += 1) {
      skipElements.add(members[i]);
    }
  }

  const root = document.createElement("article");
  root.className = "rendered-doc";
  for (const el of segment) {
    if (el.nodeType !== Node.ELEMENT_NODE) continue;
    if (localName(el) === "page_break") continue;
    if (skipElements.has(el)) continue;

    const mergeGroup = mergeGroups.get(el);
    const rendered = mergeGroup
      ? renderMergedIntraPageFragments(mergeGroup, elementIds)
      : renderBlockElement(el, elementIds, { inline: false });
    if (rendered) root.appendChild(rendered);
  }
  root.addEventListener("click", (e) => {
    const elementId = resolveRenderedClickTarget(e.target);
    if (elementId) selectElement(elementId);
  });
  applyReadingLayerClasses(root);
  return root;
}

function wrapRendered(el, node, elementId, extraClass) {
  const tag = localName(el);
  const wrap = document.createElement("div");
  wrap.className = `rendered-el rendered-${tag}${extraClass ? ` ${extraClass}` : ""}`;
  if (elementId) wrap.setAttribute("data-element-id", elementId);
  applyElementLayerAttr(el, wrap);
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
      const h = document.createElement(`h${headingLevel(el)}`);
      appendRenderedBody(h, el, elementIds, { inline: true });
      return wrapRendered(el, h, elementId);
    }
    case "field_heading": {
      const h = document.createElement(`h${headingLevel(el)}`);
      h.className = "rendered-field-heading";
      appendRenderedBody(h, el, elementIds, { inline: true });
      return wrapRendered(el, h, elementId);
    }
    case "footnote": {
      const aside = document.createElement("aside");
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
      const figure = document.createElement("figure");
      figure.className = "rendered-group";
      appendRenderedBodyBlocks(figure, el, elementIds);
      const captionEl = readCaptionElement(el);
      if (captionEl) {
        figure.appendChild(renderEmbeddedCaption(captionEl, elementIds, "figcaption"));
      }
      return wrapRendered(el, figure, elementId);
    }
    case "field_region": {
      const div = document.createElement("div");
      div.className = "rendered-field-region";
      appendRenderedBodyBlocks(div, el, elementIds);
      return wrapRendered(el, div, elementId);
    }
    case "field_item": {
      const div = document.createElement("div");
      div.className = "rendered-field-item";
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

function renderEmbeddedCaption(captionEl, elementIds, tagName) {
  const node = document.createElement(tagName);
  node.classList.add("rendered-el", "rendered-caption");
  const elementId = elementIds.get(captionEl);
  if (elementId) node.setAttribute("data-element-id", elementId);
  appendRenderedBody(node, captionEl, elementIds, { inline: true });
  return node;
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

function renderMarkerElement(el, elementIds, ctx) {
  const marker = document.createElement("span");
  marker.className = "rendered-marker rendered-el";
  const elementId = elementIds.get(el);
  if (elementId) marker.setAttribute("data-element-id", elementId);
  appendRenderedBody(marker, el, elementIds, ctx);
  return marker;
}

function renderCheckboxElement(el, elementIds) {
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.disabled = true;
  cb.checked = (el.getAttribute("class") ?? "unselected") === "selected";
  cb.className = "rendered-checkbox";

  const wrap = document.createElement("span");
  wrap.className = "rendered-checkbox-wrap rendered-el";
  const elementId = elementIds.get(el);
  if (elementId) wrap.setAttribute("data-element-id", elementId);
  applyElementLayerAttr(el, wrap);
  wrap.appendChild(cb);
  return wrap;
}

function renderFieldKeyElement(el, elementIds, ctx) {
  const node = document.createElement("span");
  node.className = "rendered-field-key rendered-el";
  const elementId = elementIds.get(el);
  if (elementId) node.setAttribute("data-element-id", elementId);
  applyElementLayerAttr(el, node);
  appendRenderedBody(node, el, elementIds, { ...ctx, inline: true });
  return node;
}

function renderFieldValueElement(el, elementIds, ctx) {
  const valueClass = el.getAttribute("class") ?? "read_only";
  const node = document.createElement("span");
  node.className = `rendered-field-value rendered-field-value-${valueClass} rendered-el`;
  const elementId = elementIds.get(el);
  if (elementId) node.setAttribute("data-element-id", elementId);
  applyElementLayerAttr(el, node);
  appendRenderedBody(node, el, elementIds, { ...ctx, inline: true });
  if (
    valueClass === "fillable"
    && !node.textContent.trim()
    && !node.querySelector(".rendered-checkbox-wrap, img, .rendered-marker")
  ) {
    const slot = document.createElement("span");
    slot.className = "rendered-field-fillable-slot";
    slot.setAttribute("aria-hidden", "true");
    node.appendChild(slot);
  }
  return node;
}

function renderFieldHintElement(el, elementIds, ctx) {
  const node = document.createElement("span");
  node.className = "rendered-field-hint rendered-el";
  const elementId = elementIds.get(el);
  if (elementId) node.setAttribute("data-element-id", elementId);
  applyElementLayerAttr(el, node);
  appendRenderedBody(node, el, elementIds, { ...ctx, inline: true });
  return node;
}

function appendRenderedNode(parent, node, elementIds, ctx) {
  if (isTextLikeNode(node)) {
    let text = node.textContent;
    if (!text || !text.trim()) return;
    if (ctx.trimLeading) {
      text = text.replace(/^\s+/u, "");
      ctx.trimLeading = false;
      if (!text) return;
    }
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

  if (tag === "marker") {
    parent.appendChild(renderMarkerElement(node, elementIds, ctx));
    return;
  }

  if (tag === "checkbox") {
    parent.appendChild(renderCheckboxElement(node, elementIds));
    return;
  }

  if (tag === "key") {
    parent.appendChild(renderFieldKeyElement(node, elementIds, ctx));
    return;
  }

  if (tag === "value") {
    parent.appendChild(renderFieldValueElement(node, elementIds, ctx));
    return;
  }

  if (tag === "hint") {
    parent.appendChild(renderFieldHintElement(node, elementIds, ctx));
    return;
  }

  if (tag === "ldiv") return;
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

function markPictureUnavailable(img) {
  img.classList.add("rendered-picture-unavailable");
  img.alt = "\u00A0";
  img.setAttribute("aria-label", PICTURE_UNAVAILABLE_ALT);
}

function appendPictureFigureImage(figure, uri, captionEl, elementIds) {
  const img = document.createElement("img");
  figure.appendChild(img);

  if (uri) {
    img.alt = "";
    img.src = resolveArchiveUri(uri);
    img.addEventListener("error", () => markPictureUnavailable(img), { once: true });
  } else {
    markPictureUnavailable(img);
    img.src = INVALID_PICTURE_SRC;
  }

  if (captionEl) {
    figure.appendChild(renderEmbeddedCaption(captionEl, elementIds, "figcaption"));
  }
}

function renderPicture(el, elementIds) {
  const figure = document.createElement("figure");
  const captionEl = readCaptionElement(el);
  const srcEl = childElements(el).find((c) => localName(c) === "src") ?? null;
  const uri = srcEl?.getAttribute("uri")?.trim() || null;

  appendPictureFigureImage(figure, uri, captionEl, elementIds);

  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node);
    if (tag === "src") {
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
  applyElementLayerAttr(hostEl, wrap);
  wrap.appendChild(inner);
  return wrap;
}

function appendListItemsFromElement(list, el, elementIds) {
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
        li.appendChild(renderMarkerElement(child, elementIds, { inline: true }));
      } else if (childTag === "checkbox") {
        li.appendChild(renderCheckboxElement(child, elementIds));
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
    appendRenderedSliceContent(li, ldiv, contentNodes, elementIds);

    list.appendChild(li);
  }
}

function renderList(el, elementIds) {
  const listClass = el.getAttribute("class") ?? "unordered";
  const list = document.createElement(listClass === "ordered" ? "ol" : "ul");
  appendListItemsFromElement(list, el, elementIds);
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
  appendRenderedSliceContent(container, cellToken, nodes, elementIds);
}

function renderOtslContainer(el, elementIds) {
  const table = document.createElement("table");
  table.className = "rendered-table";

  const captionEl = readCaptionElement(el);
  if (captionEl) {
    table.appendChild(renderEmbeddedCaption(captionEl, elementIds, "caption"));
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

function revokeDocumentState(docState) {
  if (!docState) return;
  for (const url of docState.pageImages.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  for (const url of docState.assetUrls.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
}

function revokeArchiveUrls() {
  revokeDocumentState(state);
}

async function extractArchiveFromZipBuffer(buffer) {
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
  return { markupXml, pageImages, assetUrls };
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
