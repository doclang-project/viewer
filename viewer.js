/* DocLang Archive Viewer — archive format: github.com/doclang-project/doclang spec.md#doclang-archive-format */

const SUPPORTED_FILE_EXTENSIONS = [".dclx", ".dclg"];
const OPEN_FILE_HINT = `Open a DocLang file (${SUPPORTED_FILE_EXTENSIONS.join(", ")})`;
const RELOAD_FILE_HINT = "Re-read the active file from disk";
const RELOAD_FILE_UNAVAILABLE_HINT = "Reload is available for files opened from disk (file picker or drag-and-drop)";
const VIRTUAL_TEXT_TAG_HINT = "DocLang virtual <text>; wrapping tags not included in source";
const FORMULA_REWRITE_COPY = "Click to copy";
const FORMULA_REWRITE_COPIED = "Copied";
const FORMULA_REWRITE_HINT = "LaTeX rewritten for KaTeX:";
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
/** Allow small embedded raster data URIs only; remote/blob/other schemes are rejected. */
const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
const MAX_DATA_IMAGE_URI_LENGTH = 2 * 1024 * 1024; // 2 MiB
const ZIP_MAX_ENTRIES = 5000;
const ZIP_MAX_ENTRY_COMPRESSED_BYTES = 128 * 1024 * 1024; // 128 MiB
const ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES = 128 * 1024 * 1024; // 128 MiB
const ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES = 512 * 1024 * 1024; // 512 MiB
const ZIP_MAX_COMPRESSION_RATIO = 100; // uncompressed / compressed
const LONG_EMBEDDED_URI_PREVIEW_LENGTH = 30;
const HEAD_TAGS = new Set([
  "label", "thread", "xref", "href", "layer", "location", "caption", "description", "summary", "custom",
]);
const SEMANTIC_TAGS = new Set([
  "text", "heading", "footnote", "page_header", "page_footer", "field_region", "list", "table", "index",
  "formula", "code", "picture", "marker", "group", "field_heading", "field_item", "key", "value", "hint",
  "caption", "page_break", "track",
]);
const CELL_TOKENS = new Set(["fcel", "ecel", "ched", "rhed", "corn", "srow", "lcel", "ucel", "xcel", "nl"]);
const CELL_CONTENT_TAGS = new Set(["fcel", "ecel", "ched", "rhed", "corn", "srow"]);
const CELL_SPAN_TAGS = new Set(["lcel", "ucel", "xcel"]);
const OTSL_CONTAINER_TAGS = new Set(["table", "index", "tabular"]);
const TABLE_CONTENT_CONTAINER_TAGS = new Set(["table", "tabular"]);
const INDEX_CONTENT_CONTAINER_TAGS = new Set(["index"]);
const RENDER_BLOCK_TAGS = new Set([
  "text", "heading", "field_heading", "footnote", "page_header", "page_footer", "list", "code", "formula", "picture", "group",
  "field_region", "field_item",
  "table", "index", "tabular",
  "track",
]);
/** Whole-track media (PR doclang#175): archive dirs audio/ and video/, files named {N}.{ext} by track order. */
const TRACK_VIDEO_EXTS = ["mp4", "webm", "mkv", "mov", "m4v", "ogv"];
const TRACK_AUDIO_EXTS = ["mp3", "m4a", "ogg", "opus", "wav"];
/** Timestamp component elements inside a cue block, in order of magnitude. */
const TRACK_TS_TAGS = new Set(["hours", "minutes", "seconds", "msecs"]);
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
  // <content> has xml:space="preserve" semantics: its whitespace is significant.
  if (node.parentElement && localName(node.parentElement) === "content") return node.textContent;
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
/** Demo page size; overlay lengths are calibrated to match pre-fix sizing on these images. */
const OVERLAY_REF_IMAGE_WIDTH = 1224;
const OVERLAY_REF_IMAGE_HEIGHT = 1584;
const PAGE_ZOOM_DEFAULT = 100;
const PAGE_PAN_DRAG_THRESHOLD = 5;
const PAGE_VIEW_BORDER_PX = 2;
const LAYOUT_STORAGE_KEY = "doclang-viewer-pane-layout";
const OVERLAY_PREFS_STORAGE_KEY = "doclang-viewer-overlay-prefs";
const HOTKEYS_STORAGE_KEY = "doclang-viewer-hotkeys-enabled";
const READING_LAYOUT_MODE_STORAGE_KEY = "doclang-viewer-reading-layout-mode";
const PANE_MIN_RATIO = 0.12;
const PANE_KEYS = ["file", "page", "markup", "reading"];
const DEFAULT_PANE_RATIOS = [1, 1, 1, 1];
const DEFAULT_USER_PANE_VISIBLE = { file: false, page: true, markup: true, reading: true };
const LAYOUT_STACK_BREAKPOINT_PX = 1200;

const ARROW_STYLE_STORAGE_KEY = "doclang-viewer-arrow-styles";
/** Arrow-based overlay layers and the plumbing that maps each to its CSS + SVG marker. */
const ARROW_LAYERS = {
  readingOrder: { cssKey: "reading-order", colorVar: "--overlay-reading-order", markerId: "reading-order-arrowhead", defaultStyle: "solid" },
  fragment: { cssKey: "fragment", colorVar: "--overlay-fragment", markerId: "fragment-arrowhead", defaultStyle: "dashed" },
  xref: { cssKey: "xref", colorVar: "--kind-footnote", markerId: "xref-arrowhead", defaultStyle: "solid" },
  caption: { cssKey: "caption", colorVar: "--kind-caption", markerId: "caption-arrowhead", defaultStyle: "solid" },
  keyValue: { cssKey: "key-value", colorVar: "--overlay-key-value", markerId: "key-value-arrowhead", defaultStyle: "solid" },
};
const ARROW_STYLE_FIELD_DEFAULTS = { width: 1.5, head: 5 };
const ARROW_DASH_VALUES = { solid: "none", dashed: "6 4", dotted: "1.5 3.5" };
/** @type {Record<string, { color?: string, width?: number, head?: number, style?: string }>} */
let arrowStyles = loadArrowStyles();

/** @type {{ markupXml: string, pageImages: Map<number, string>, assetUrls: Map<string, string>, currentPage: number, pageCount: number, segments: Element[][], defaultResolution: { width: number, height: number }, elementIds: Map<Element, string>, idToElement: Map<string, Element>, hasPageView: boolean, markupOnly: boolean, docRoot: Element, threadPagesById: Map<string, Set<number>>, elementPageByEl: Map<Element, number>, threadNavByElement: Map<Element, { prev: Element | null, next: Element | null }>, pendingSelectElement: Element | null, readingOrder: Element[], readingOrderIndexByElement: Map<Element, number>, pageViewOverlay: { boxes: object[], readingOrderSteps: { box: object, elementId: string }[] } | null } | null} */
let state = null;
let fileCatalog = [];

const changeBanner = {
  root: document.getElementById("file-change-banner"),
  text: document.getElementById("file-change-text"),
  reload: document.getElementById("btn-file-reload"),
  dismiss: document.getElementById("btn-file-change-dismiss"),
};
/** The entry the banner currently refers to, and the version already dismissed. */
let changeBannerEntry = null;
let dismissedChange = null;
let activeFileIndex = -1;
let filePaneUserToggled = false;
/** @type {ResizeObserver | null} */
let pagePaneResizeObserver = null;
/** @type {ResizeObserver | null} */
let pagedPaneResizeObserver = null;
/** @type {string | null} */
let selectedElementId = null;
let showAllBboxes = true;
let showLayoutBadges = true;
let showCaptionLinks = false;
let showPictureContents = false;
let showTableContents = false;
let showIndexContents = false;
let showFragmentLinks = false;
let showXrefLinks = false;
let showKeyValueLinks = false;
let showReadingOrder = false;
let showReadingFurniture = true;
let showReadingBackground = true;
/** @type {"pageless" | "paged"} */
let readingLayoutMode = "pageless";
let showLayoutBody = true;
let showLayoutFurniture = true;
let showLayoutBackground = true;
/** Element types (tag names) offered in the Overlays → Types filter, in panel order. */
const OVERLAY_TYPE_FILTERS = [
  "text", "heading", "caption", "footnote", "page_header", "page_footer", "list", "table", "index",
  "formula", "code", "picture", "marker", "group", "field_region", "field_heading", "field_item",
  "key", "value", "hint",
];
/** Types whose nested contents get their own toggle in the Types panel. */
const OVERLAY_TYPES_WITH_CONTENTS = new Set(["picture", "table", "index"]);
/** @type {Set<string>} element types whose bboxes are filtered out of the page overlay */
let hiddenOverlayTypes = new Set();
/** Overlays-panel toggles that are persisted to the browser. Closures read/write the flags above. */
const OVERLAY_PREF_ACCESSORS = {
  showAllBboxes: { get: () => showAllBboxes, set: (v) => { showAllBboxes = v; }, el: () => els.showAllBboxes, def: true },
  showLayoutBadges: { get: () => showLayoutBadges, set: (v) => { showLayoutBadges = v; }, el: () => els.showLayoutBadges, def: true },
  showLayoutBody: { get: () => showLayoutBody, set: (v) => { showLayoutBody = v; }, el: () => els.showLayoutBody, def: true },
  showLayoutFurniture: { get: () => showLayoutFurniture, set: (v) => { showLayoutFurniture = v; }, el: () => els.showLayoutFurniture, def: true },
  showLayoutBackground: { get: () => showLayoutBackground, set: (v) => { showLayoutBackground = v; }, el: () => els.showLayoutBackground, def: true },
  showReadingOrder: { get: () => showReadingOrder, set: (v) => { showReadingOrder = v; }, el: () => els.showReadingOrder, def: false },
  showPictureContents: { get: () => showPictureContents, set: (v) => { showPictureContents = v; }, el: () => els.showPictureContents, def: false },
  showTableContents: { get: () => showTableContents, set: (v) => { showTableContents = v; }, el: () => els.showTableContents, def: false },
  showIndexContents: { get: () => showIndexContents, set: (v) => { showIndexContents = v; }, el: () => els.showIndexContents, def: false },
  showFragmentLinks: { get: () => showFragmentLinks, set: (v) => { showFragmentLinks = v; }, el: () => els.showFragmentLinks, def: false },
  showXrefLinks: { get: () => showXrefLinks, set: (v) => { showXrefLinks = v; }, el: () => els.showXrefLinks, def: false },
  showCaptionLinks: { get: () => showCaptionLinks, set: (v) => { showCaptionLinks = v; }, el: () => els.showCaptionLinks, def: false },
  showKeyValueLinks: { get: () => showKeyValueLinks, set: (v) => { showKeyValueLinks = v; }, el: () => els.showKeyValueLinks, def: false },
};
let pageSettingsOpen = false;
let readingSettingsOpen = false;
let helpOverlayOpen = false;
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
let hotkeysEnabled = false;
/** @type {{ physicalSplitterIndex: number, leftKey: string, rightKey: string, startX: number, leftStart: number, rightStart: number, pointerId: number } | null} */
let paneDrag = null;
/** @type {MediaQueryList | null} */
let layoutStackQuery = null;
// Generated before `els` so the per-type "contents" checkboxes it creates resolve below.
buildOverlayTypeControls(document.getElementById("arrow-fields-types"));
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
  layoutNav: document.getElementById("layout-nav"),
  btnBboxPrev: document.getElementById("btn-bbox-prev"),
  btnBboxNext: document.getElementById("btn-bbox-next"),
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
  helpOverlayLayer: document.getElementById("help-overlay-layer"),
  helpOverlayScrim: document.getElementById("help-overlay-scrim"),
  helpOverlayClose: document.getElementById("btn-help-overlay-close"),
  showReadingFurniture: document.getElementById("show-reading-furniture"),
  showReadingFurnitureLabel: document.getElementById("show-reading-furniture-label"),
  showReadingBackground: document.getElementById("show-reading-background"),
  showReadingBackgroundLabel: document.getElementById("show-reading-background-label"),
  showCaptionLinks: document.getElementById("show-caption-links"),
  showCaptionLinksLabel: document.getElementById("show-caption-links-label"),
  layoutLayersLabel: document.getElementById("layout-layers-label"),
  layoutTypesLabel: document.getElementById("layout-types-label"),
  layoutTypesFields: document.getElementById("arrow-fields-types"),
  showLayoutBody: document.getElementById("show-layout-body"),
  showLayoutBodyLabel: document.getElementById("show-layout-body-label"),
  showLayoutFurniture: document.getElementById("show-layout-furniture"),
  showLayoutFurnitureLabel: document.getElementById("show-layout-furniture-label"),
  showLayoutBackground: document.getElementById("show-layout-background"),
  showLayoutBackgroundLabel: document.getElementById("show-layout-background-label"),
  showPictureContents: document.getElementById("show-picture-contents"),
  showTableContents: document.getElementById("show-table-contents"),
  showIndexContents: document.getElementById("show-index-contents"),
  showFragmentLinks: document.getElementById("show-fragment-links"),
  showFragmentLinksLabel: document.getElementById("show-fragment-links-label"),
  showXrefLinks: document.getElementById("show-xref-links"),
  showXrefLinksLabel: document.getElementById("show-xref-links-label"),
  showKeyValueLinks: document.getElementById("show-key-value-links"),
  showKeyValueLinksLabel: document.getElementById("show-key-value-links-label"),
  showReadingOrder: document.getElementById("show-reading-order"),
  showReadingOrderLabel: document.getElementById("show-reading-order-label"),
  pageZoom: document.getElementById("page-zoom"),
  pageZoomLabel: document.getElementById("page-zoom-label"),
  pageZoomReset: document.getElementById("page-zoom-reset"),
  main: document.getElementById("main"),
  emptyState: document.getElementById("empty-state"),
  emptyStateLoading: document.getElementById("empty-state-loading"),
  emptyStatePrompt: document.getElementById("empty-state-prompt"),
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
  toolbarOptionsClose: document.getElementById("btn-toolbar-options-close"),
  toggleFilePane: document.getElementById("toggle-file-pane"),
  toggleFilePaneLabel: document.getElementById("toggle-file-pane-label"),
  togglePagePane: document.getElementById("toggle-page-pane"),
  toggleMarkupPane: document.getElementById("toggle-markup-pane"),
  toggleReadingPane: document.getElementById("toggle-reading-pane"),
  togglePagePaneLabel: document.getElementById("toggle-page-pane-label"),
  readingLayoutPagelessBtn: document.getElementById("btn-reading-layout-pageless"),
  readingLayoutPagedBtn: document.getElementById("btn-reading-layout-paged"),
  resetPaneLayoutBtn: document.getElementById("btn-reset-pane-layout"),
  toggleHotkeys: document.getElementById("toggle-hotkeys"),
  hotkeysInfoBtn: document.getElementById("btn-hotkeys-info"),
  pageSettingsPanel: document.getElementById("page-settings"),
  overlaysReset: document.getElementById("btn-overlays-reset"),
  validateBtn: document.getElementById("btn-validate"),
  editBtn: document.getElementById("btn-edit"),
  editApplyBtn: document.getElementById("btn-edit-apply"),
  editCancelBtn: document.getElementById("btn-edit-cancel"),
  saveBtn: document.getElementById("btn-save"),
  revertBtn: document.getElementById("btn-revert"),
  undoBtn: document.getElementById("btn-undo"),
  redoBtn: document.getElementById("btn-redo"),
  inspector: document.getElementById("inspector"),
  editError: document.getElementById("edit-error"),
  validationPanel: document.getElementById("validation-panel"),
  validationSummary: document.getElementById("validation-summary"),
  validationIssues: document.getElementById("validation-issues"),
  validationClose: document.getElementById("btn-validation-close"),
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
document.getElementById("input-archive")?.addEventListener("click", async (e) => {
  if (!window.showOpenFilePicker) return;
  e.preventDefault();
  try {
    const handles = await window.showOpenFilePicker({
      multiple: true,
      types: [{
        description: "Doclang documents",
        accept: {
          "application/zip": [".dclx", ".zip"],
          "application/xml": [".dclg", ".xml"],
        },
      }],
    });
    const files = await Promise.all(handles.map(async (handle) => {
      const file = await handle.getFile();
      fileHandles.set(file, handle);
      return file;
    }));
    await addFilesToCatalog(files.filter((f) => isArchiveFile(f) || isMarkupFile(f)), { replace: true });
  } catch (err) {
    if (err?.name !== "AbortError") alert(`Failed to open file: ${err.message}`);
  }
});
document.getElementById("input-archive")?.addEventListener("change", async (e) => {
  const files = [...e.target.files].filter((f) => isArchiveFile(f) || isMarkupFile(f));
  if (!files.length) return;
  await addFilesToCatalog(files, { replace: true });
  e.target.value = "";
});
els.btnPrev?.addEventListener("click", () => goToPage(state.currentPage - 1));
els.btnNext?.addEventListener("click", () => goToPage(state.currentPage + 1));
els.btnBboxPrev?.addEventListener("click", () => navigateBbox("prev"));
els.btnBboxNext?.addEventListener("click", () => navigateBbox("next"));
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
els.showLayoutBody?.addEventListener("change", () => {
  showLayoutBody = els.showLayoutBody.checked;
  applyBboxVisibility();
});
els.showLayoutFurniture?.addEventListener("change", () => {
  showLayoutFurniture = els.showLayoutFurniture.checked;
  applyBboxVisibility();
});
els.showLayoutBackground?.addEventListener("change", () => {
  showLayoutBackground = els.showLayoutBackground.checked;
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
els.showIndexContents?.addEventListener("change", () => {
  showIndexContents = els.showIndexContents.checked;
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
els.showKeyValueLinks?.addEventListener("change", () => {
  showKeyValueLinks = els.showKeyValueLinks.checked;
  applyBboxVisibility();
});
els.showReadingOrder?.addEventListener("change", () => {
  showReadingOrder = els.showReadingOrder.checked;
  syncLayoutSubtoggles();
  const img = els.pagePane?.querySelector(".page-view img");
  if (img) syncOverlayBadges(img);
  applyBboxVisibility();
});
els.settingsToggle?.addEventListener("click", () => setPageSettingsOpen(!pageSettingsOpen));
els.readingSettingsToggle?.addEventListener("click", () => setReadingSettingsOpen(!readingSettingsOpen));
els.pageSettingsClose?.addEventListener("click", () => setPageSettingsOpen(false));
els.pageSettingsScrim?.addEventListener("click", () => setPageSettingsOpen(false));
els.readingSettingsClose?.addEventListener("click", () => setReadingSettingsOpen(false));
els.readingSettingsScrim?.addEventListener("click", () => setReadingSettingsOpen(false));
els.helpOverlayClose?.addEventListener("click", () => setHelpOverlayOpen(false));
els.helpOverlayScrim?.addEventListener("click", () => setHelpOverlayOpen(false));
els.validateBtn?.addEventListener("click", onValidateClick);
els.editBtn?.addEventListener("click", startEditing);
els.editApplyBtn?.addEventListener("click", applyEdit);
els.editCancelBtn?.addEventListener("click", () => stopEditing({ render: true }));
els.saveBtn?.addEventListener("click", saveActiveFile);
els.revertBtn?.addEventListener("click", revertActiveFile);
els.undoBtn?.addEventListener("click", undoLastEdit);
els.redoBtn?.addEventListener("click", redoLastEdit);
window.addEventListener("beforeunload", (e) => {
  if (fileCatalog.some((entry) => entry.dirty)) e.preventDefault();
});
els.validationClose?.addEventListener("click", () => setValidationPanelOpen(false));
/** True when a keydown should be left alone because it's headed for a form control, not a shortcut. */
function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
/** True when a modifier is held that turns a plain key into a browser/OS shortcut (e.g. Cmd+R to reload). */
function hasShortcutModifier(e) {
  return e.ctrlKey || e.metaKey || e.altKey;
}
function setHelpOverlayOpen(open) {
  helpOverlayOpen = open;
  if (els.helpOverlayLayer) els.helpOverlayLayer.hidden = !open;
}
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (helpOverlayOpen) setHelpOverlayOpen(false);
  else if (toolbarOptionsOpen) setToolbarOptionsOpen(false);
  else if (pageSettingsOpen) setPageSettingsOpen(false);
  else if (readingSettingsOpen) setReadingSettingsOpen(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "?") return;
  if (!hotkeysEnabled) return;
  if (isTypingTarget(document.activeElement) || hasShortcutModifier(e)) return;
  e.preventDefault();
  setHelpOverlayOpen(true);
});
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key !== "j" && key !== "k") return;
  if (!hotkeysEnabled) return;
  if (isTypingTarget(document.activeElement) || hasShortcutModifier(e)) return;
  e.preventDefault();
  navigateFile(key === "j" ? "next" : "prev");
});
const OVERLAY_TOGGLE_SHORTCUT_KEYS = {
  d: "showLayoutBody",
  u: "showLayoutFurniture",
  g: "showLayoutBackground",
  r: "showReadingOrder",
  i: "showPictureContents",
  t: "showTableContents",
  f: "showFragmentLinks",
  x: "showXrefLinks",
  c: "showCaptionLinks",
  v: "showKeyValueLinks",
  b: "showLayoutBadges",
};
function toggleOverlayCheckbox(checkbox) {
  if (!checkbox || checkbox.disabled) return;
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
}
document.addEventListener("keydown", (e) => {
  if (!hotkeysEnabled) return;
  if (isTypingTarget(document.activeElement) || hasShortcutModifier(e)) return;
  if (!state?.hasPageView) return;
  const key = e.key.toLowerCase();
  if (key === "l") {
    e.preventDefault();
    toggleOverlayCheckbox(els.showAllBboxes);
    return;
  }
  const elsKey = OVERLAY_TOGGLE_SHORTCUT_KEYS[key];
  if (!elsKey) return;
  if (!showAllBboxes) return;
  e.preventDefault();
  toggleOverlayCheckbox(els[elsKey]);
});
els.showReadingFurniture?.addEventListener("change", () => {
  showReadingFurniture = els.showReadingFurniture.checked;
  syncReadingLayerVisibility();
});
els.showReadingBackground?.addEventListener("change", () => {
  showReadingBackground = els.showReadingBackground.checked;
  syncReadingLayerVisibility();
});
els.readingLayoutPagelessBtn?.addEventListener("click", () => setReadingLayoutMode("pageless"));
els.readingLayoutPagedBtn?.addEventListener("click", () => setReadingLayoutMode("paged"));
els.pageSettingsPanel?.addEventListener("change", (e) => {
  if (!(e.target instanceof HTMLInputElement) || e.target.type !== "checkbox") return;
  const group = e.target.dataset.selectAll;
  if (group) setSelectAllGroup(group, e.target.checked);
  syncSelectAllToggles();
  persistOverlayPrefs();
});
els.layoutTypesFields?.addEventListener("change", (e) => {
  const type = e.target instanceof HTMLInputElement ? e.target.dataset.overlayType : null;
  if (!type) return;
  if (e.target.checked) hiddenOverlayTypes.delete(type);
  else hiddenOverlayTypes.add(type);
  applyBboxVisibility();
});
loadLayoutPrefs();
loadOverlayPrefs();
loadHotkeysPref();
loadReadingLayoutMode();
syncReadingLayoutButtons();
syncOverlayPrefControls();
normalizePaneRatios();
initArrowStyleControls();
initToolbarOptions();
initPaneSplitters();
initLayoutStackListener();
initFileTypeHints();
initCursorHints();
initQuickHints();
initFormulaRewriteHints();
initBboxHints();
initDragDrop();
initFilePaneCloseAll();
initPageWheelNav();
initPageViewControls();
let demoLoadInProgress = false;
let suppressDemoLoad = false;
initFileHandling();
initOpenerHandoff();

function setDemoLoading(loading) {
  document.body.classList.toggle("demo-loading", loading);
  const btnDemo = document.getElementById("btn-demo");
  if (btnDemo) btnDemo.disabled = loading;
}

// A file-handling launch (see initFileHandling) or an opener handoff (see
// initOpenerHandoff) sets suppressDemoLoad synchronously, before this runs.
setTimeout(() => {
  if (!suppressDemoLoad && document.getElementById("btn-demo")) loadDemo();
}, 0);

async function loadDemo() {
  if (demoLoadInProgress) return;
  demoLoadInProgress = true;
  setDemoLoading(true);
  try {
    const urls = typeof DEMO_ARCHIVE_URLS !== "undefined" && DEMO_ARCHIVE_URLS.length
      ? DEMO_ARCHIVE_URLS
      : [DEMO_ARCHIVE_URL];
    const primary = await fetch(urls[0]);
    if (!primary.ok) throw new Error(`HTTP ${primary.status}`);
    const primaryBuffer = await primary.arrayBuffer();
    // A document may have arrived while the demo was downloading; don't replace it.
    if (suppressDemoLoad) return;
    await addArchiveBufferToCatalog(
      primaryBuffer,
      urls[0].split("/").pop() || "demo.dclx",
      { replace: true },
    );
    for (const url of urls.slice(1)) {
      if (suppressDemoLoad) return;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (suppressDemoLoad) return;
        await addArchiveBufferToCatalog(
          buffer,
          url.split("/").pop() || "demo.dclx",
          { replace: false, activate: false },
        );
      } catch (extraErr) {
        console.warn(`Skipped demo archive ${url}: ${extraErr.message}`);
      }
    }
  } catch (err) {
    alert(
      `Failed to load demo: ${err.message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`,
    );
  } finally {
    demoLoadInProgress = false;
    if (!document.body.classList.contains("viewer-loaded")) setDemoLoading(false);
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

/**
 * Receive files opened with the installed PWA (manifest `file_handlers`).
 *
 * The OS launch opens the handler's action URL (`?source=file-handler`), which
 * suppresses the demo up front: launchQueue delivers the files asynchronously,
 * often after the demo load would already have started.
 */
function initFileHandling() {
  if (!("launchQueue" in window)) return;
  if (new URLSearchParams(location.search).get("source") === "file-handler") suppressDemoLoad = true;
  window.launchQueue.setConsumer(async (launchParams) => {
    if (!launchParams.files?.length) return;
    suppressDemoLoad = true;
    const files = await Promise.all(launchParams.files.map(async (handle) => {
      const file = await handle.getFile();
      if (handle.kind === "file") fileHandles.set(file, handle);
      return file;
    }));
    await loadFromFileList(files);
  });
}

/**
 * Receive a document from the page that opened the viewer, e.g. the
 * docling-serve UI, which cannot pass its in-memory conversion result by URL.
 *
 * The opener opens the viewer with `?source=opener` and posts
 * `{type: "doclang-viewer:ping"}` until the viewer answers
 * `{type: "doclang-viewer:ready"}`; it then posts
 * `{type: "doclang-viewer:open", name, buffer}` with the file as an ArrayBuffer.
 * Only messages from `window.opener` are accepted.
 */
function initOpenerHandoff() {
  if (!window.opener || new URLSearchParams(location.search).get("source") !== "opener") return;
  suppressDemoLoad = true;
  window.addEventListener("message", async (event) => {
    if (event.source !== window.opener) return;
    const { type, name, buffer } = event.data ?? {};
    if (type === "doclang-viewer:ping") {
      window.opener.postMessage({ type: "doclang-viewer:ready" }, event.origin);
    } else if (type === "doclang-viewer:open" && buffer instanceof ArrayBuffer) {
      await loadFromFileList([new File([buffer], name || "document.dclx")]);
    }
  });
}

/** File System Access handles for files that came with one, keyed by their `File`. */
const fileHandles = new WeakMap();

function fileFingerprint(file) {
  return { name: file.name, size: file.size, lastModified: file.lastModified };
}

/**
 * The bytes are read up front: a `File` is only a reference to the file on disk
 * and becomes unreadable as soon as that file is modified or replaced.
 */
async function createFileCatalogEntry(file) {
  return {
    id: crypto.randomUUID(),
    label: file.name,
    kind: isMarkupFile(file) ? "markup" : "archive",
    source: await file.arrayBuffer(),
    fingerprint: fileFingerprint(file),
    handle: fileHandles.get(file) ?? null,
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
  const entries = await unzip(buffer, {
    shouldExtract: (name) => /^pages\/\d+\.(png|jpe?g|webp)$/i.test(name),
  });
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

/**
 * Archive path of the first image `<src>` in document order (a picture, a track
 * `<cover>` or `<frame>`, …) — the thumbnail fallback for documents without a
 * page image. Embedded data URIs and external URLs are skipped.
 */
function firstReferencedImagePath(markupXml) {
  const re = /<(?:\w+:)?src\b[^>]*?\buri\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const m of markupXml.matchAll(re)) {
    const uri = (m[1] ?? m[2]).trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(uri) || uri.startsWith("//")) continue;
    if (/\.(png|jpe?g|webp)$/i.test(uri)) return normalizeArchivePath(uri);
  }
  return null;
}

async function createFirstReferencedImageUrlFromFiles(files) {
  const markupFile = files.find((f) => f.name === "document.xml");
  if (!markupFile) return null;
  const path = firstReferencedImagePath(await markupFile.text());
  if (!path) return null;
  const file = files.find((f) => archiveRelativeAssetPath(f.webkitRelativePath || f.name) === path);
  return file ? URL.createObjectURL(file) : null;
}

async function createFirstReferencedImageUrlFromZip(source) {
  const buffer = source instanceof File ? await source.arrayBuffer() : source;
  const [markup] = await unzip(buffer, { shouldExtract: (name) => name === "document.xml" });
  if (!markup) return null;
  const path = firstReferencedImagePath(new TextDecoder().decode(markup.data));
  if (!path) return null;
  const [image] = await unzip(buffer, { shouldExtract: (name) => name === path });
  return image ? createPageImageObjectUrl(image.data, path.split(".").pop() ?? "png") : null;
}

async function resolveCatalogEntryThumbnail(entry) {
  if (entry.thumbnailUrl) return entry.thumbnailUrl;
  if (entry.kind === "markup") return null;
  try {
    if (entry.kind === "folder") {
      entry.thumbnailUrl = createFirstPageImageUrlFromFiles(entry.source)
        ?? await createFirstReferencedImageUrlFromFiles(entry.source);
    } else if (entry.kind === "archive") {
      entry.thumbnailUrl = await createFirstPageImageUrlFromZip(entry.source)
        ?? await createFirstReferencedImageUrlFromZip(entry.source);
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

function findCatalogIndexForFile(file) {
  return fileCatalog.findIndex((entry) => entry.fingerprint?.name === file.name);
}

async function addFilesToCatalog(files, { replace = false } = {}) {
  if (replace) {
    clearFileCatalog();
    filePaneUserToggled = false;
  }
  const startIndex = fileCatalog.length;
  let switchIndex = null;
  let refreshActive = false;
  for (const file of files) {
    const existingIndex = replace ? -1 : findCatalogIndexForFile(file);
    if (existingIndex !== -1) {
      const existing = fileCatalog[existingIndex];
      const { size, lastModified } = existing.fingerprint;
      if (size !== file.size || lastModified !== file.lastModified) {
        // Same file re-opened after it changed on disk: show the latest content.
        if (!(await refreshCatalogEntry(existing, file))) continue;
        if (existingIndex === activeFileIndex) refreshActive = true;
      }
      if (switchIndex === null) switchIndex = existingIndex;
      continue;
    }
    let entry;
    try {
      entry = await createFileCatalogEntry(file);
    } catch (err) {
      alert(`Failed to read ${file.name}: ${err.message}`);
      continue;
    }
    fileCatalog.push(entry);
    enrichCatalogEntryThumbnail(entry);
    if (switchIndex === null) switchIndex = fileCatalog.length - 1;
  }
  if (!fileCatalog.length) return;
  const target = replace ? 0 : switchIndex ?? startIndex;
  if (target === activeFileIndex && !refreshActive) return;
  await switchToFile(target);
}


function hideChangeBanner() {
  changeBannerEntry = null;
  if (changeBanner.root) changeBanner.root.hidden = true;
}

/** Look for edits to the active file on disk and offer to reload it. */
async function checkActiveFileChanged() {
  const entry = fileCatalog[activeFileIndex];
  if (!entry?.handle || !changeBanner.root) {
    hideChangeBanner();
    return;
  }
  let file;
  try {
    file = await entry.handle.getFile();
  } catch {
    return; // deleted, moved or permission lost: keep showing what we have
  }
  if (fileCatalog[activeFileIndex] !== entry) return;
  const { size, lastModified } = entry.fingerprint;
  if (file.size === size && file.lastModified === lastModified) {
    hideChangeBanner();
    return;
  }
  if (dismissedChange?.entry === entry && dismissedChange.lastModified === file.lastModified) return;
  fileHandles.set(file, entry.handle);
  changeBannerEntry = { entry, file };
  changeBanner.text.textContent = `${entry.label} changed on disk.`;
  changeBanner.root.hidden = false;
}

changeBanner.reload?.addEventListener("click", async () => {
  const pending = changeBannerEntry;
  if (!pending || fileCatalog[activeFileIndex] !== pending.entry) return hideChangeBanner();
  if (pending.entry.dirty && !confirm("Reloading discards your unsaved changes. Continue?")) return;
  hideChangeBanner();
  stopEditing({ render: false });
  pending.entry.dirty = false;
  pending.entry.savedSource = null;
  pending.entry.validation = null;
  if (await refreshCatalogEntry(pending.entry, pending.file)) await switchToFile(activeFileIndex);
});
/** The explicit reload needs a file handle (Chromium file picker / drop); without one the button stays disabled. */
function syncReloadFileButton() {
  const btn = document.getElementById("btn-reload-file");
  if (!btn) return;
  btn.setAttribute("aria-disabled", String(!fileCatalog[activeFileIndex]?.handle));
}

/** Re-read the active file from disk, keeping the rest of the open files untouched. */
async function reloadActiveFile() {
  const entry = fileCatalog[activeFileIndex];
  if (!entry?.handle) return;
  if (entry.dirty && !confirm("Reloading discards your unsaved changes. Continue?")) return;
  let file;
  try {
    file = await entry.handle.getFile();
  } catch (err) {
    alert(`Failed to reload ${entry.label}: ${err.message}`);
    return;
  }
  hideChangeBanner();
  stopEditing({ render: false });
  entry.dirty = false;
  entry.savedSource = null;
  entry.validation = null;
  fileHandles.set(file, entry.handle);
  if (await refreshCatalogEntry(entry, file)) await switchToFile(activeFileIndex);
}
document.getElementById("btn-reload-file")?.addEventListener("click", reloadActiveFile);

changeBanner.dismiss?.addEventListener("click", () => {
  if (changeBannerEntry) {
    dismissedChange = { entry: changeBannerEntry.entry, lastModified: changeBannerEntry.file.lastModified };
  }
  hideChangeBanner();
});
// Enter reloads without aiming, unless it is meant for a field or a focused control.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.defaultPrevented || e.isComposing || changeBanner.root.hidden) return;
  if (e.target instanceof Element && e.target.closest("input, textarea, select, button, a, [contenteditable]")) return;
  e.preventDefault();
  changeBanner.reload.click();
});
window.addEventListener("focus", checkActiveFileChanged);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkActiveFileChanged();
});

async function refreshCatalogEntry(entry, file) {
  let buffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    alert(`Failed to read ${file.name}: ${err.message}`);
    return false;
  }
  entry.source = buffer;
  entry.fingerprint = fileFingerprint(file);
  entry.altChoices = null;
  entry.handle = fileHandles.get(file) ?? entry.handle;
  if (dismissedChange?.entry === entry) hideChangeBanner();
  if (entry.snapshot && fileCatalog[activeFileIndex] !== entry) {
    revokeDocumentState(entry.snapshot);
  }
  entry.snapshot = null;
  revokeCatalogEntry(entry);
  enrichCatalogEntryThumbnail(entry);
  return true;
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

async function addArchiveBufferToCatalog(buffer, label, { replace = false, activate = true } = {}) {
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
  if (activate) await switchToFile(replace ? 0 : fileCatalog.length - 1);
  else updateFileView();
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
    if (assetPath) {
      assetUrls.set(assetPath, URL.createObjectURL(f));
    } else if (parts.length >= 2 && /^(?:audio|video)$/i.test(parts[parts.length - 2])) {
      assetUrls.set(`${parts[parts.length - 2].toLowerCase()}/${f.name}`, URL.createObjectURL(f));
    }
  }
  return { markupXml, pageImages, assetUrls };
}

async function parseCatalogEntry(entry) {
  try {
    if (entry.kind === "markup") {
      const text = entry.source instanceof File
        ? await entry.source.text()
        : new TextDecoder().decode(entry.source);
      return buildDocumentState(text, new Map(), entry.label, new Map(), { markupOnly: true, altChoices: entry.altChoices });
    }
    if (entry.kind === "archive") {
      const buffer = entry.source instanceof File
        ? await entry.source.arrayBuffer()
        : entry.source;
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromZipBuffer(buffer);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false, altChoices: entry.altChoices });
    }
    if (entry.kind === "folder") {
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromFiles(entry.source);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false, altChoices: entry.altChoices });
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
  if (!confirmDiscardEditor()) return;

  persistActiveFileViewState();
  releaseActiveDocument();
  hideChangeBanner();

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
  checkActiveFileChanged();
}

function navigateFile(direction) {
  if (!fileCatalog.length) return;
  const step = direction === "prev" ? -1 : 1;
  const nextIndex = activeFileIndex < 0
    ? (direction === "prev" ? fileCatalog.length - 1 : 0)
    : activeFileIndex + step;
  if (nextIndex < 0 || nextIndex >= fileCatalog.length || nextIndex === activeFileIndex) return;
  switchToFile(nextIndex);
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
      normalizePaneRatios();
      filePaneWidthPx = null;
    }
  }
}

async function closeCatalogFile(index) {
  if (index < 0 || index >= fileCatalog.length) return;

  const wasActive = index === activeFileIndex;
  const entry = fileCatalog[index];
  if (entry.dirty && !confirm(`${entry.label} has unsaved changes. Close it anyway?`)) return;
  if (wasActive) stopEditing({ render: false });

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

  let activeCard = null;
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
      activeCard = card;
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

    const dirtyDot = document.createElement("span");
    dirtyDot.className = "file-view-dirty";
    dirtyDot.title = "Unsaved changes";
    card.classList.toggle("is-dirty", !!entry.dirty);

    thumbWrap.append(createFileViewThumbnail(entry), closeBtn, dirtyDot);

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
  activeCard?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

function updateFileView() {
  syncReloadFileButton();
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

/**
 * True when DocLang or Preview is the pane the user is interacting with, so
 * up/down/page-up/page-down should scroll it instead of flipping pages. Neither pane
 * has a focusable container (unlike Original), so plain :focus never lands there
 * on click — the browser instead scrolls whichever of them the pointer is over, so we
 * key off :hover (which also matches while hovering a descendant); :focus-within is
 * kept as a fallback for keyboard-only navigation onto a link inside either pane.
 */
function isScrollablePaneFocused() {
  const active = document.activeElement;
  return Boolean(
    els.markupPane?.contains(active)
    || els.renderedPane?.contains(active)
    || els.markupPane?.matches(":hover")
    || els.renderedPane?.matches(":hover"),
  );
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

  // Scrolling past the end of the Preview flips the page, as in the Original pane. The DocLang pane does not: its
  // scroll position is something to work in, and a stray wheel at its top or bottom must not change the page.
  els.renderedPane?.addEventListener("wheel", (e) => onScrollPaneWheel(e, els.renderedPane), { passive: false });

  els.pagePane.tabIndex = 0;
  els.pagePane.setAttribute("role", "region");
  els.pagePane.setAttribute("aria-label", "Original");

  els.pagePane.addEventListener("pointerdown", (e) => {
    if (state?.hasPageView) els.pagePane.focus({ preventScroll: true });
  });

  document.addEventListener("keydown", (e) => {
    if (!state?.hasPageView) return;
    if (isTypingTarget(document.activeElement) || hasShortcutModifier(e)) return;

    if (hotkeysEnabled && (e.key === "n" || e.key === "N")) {
      e.preventDefault();
      navigateBbox("next");
      return;
    }
    if (hotkeysEnabled && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
      navigateBbox("prev");
      return;
    }

    let dir = 0;
    switch (e.key) {
      case "ArrowRight":
        dir = 1;
        break;
      case "ArrowLeft":
        dir = -1;
        break;
      case "ArrowDown":
      case "PageDown":
        if (isScrollablePaneFocused()) return;
        dir = 1;
        break;
      case "ArrowUp":
      case "PageUp":
        if (isScrollablePaneFocused()) return;
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

/** URI of an element's <href> head child, or null. */
function readHrefUri(el) {
  const hrefEl = childElements(el).find((c) => localName(c) === "href");
  return hrefEl?.getAttribute("uri")?.trim() || null;
}

/** Allow only http(s) / mailto targets for rendered links. */
function safeLinkUri(uri) {
  return uri && /^(https?:|mailto:)/i.test(uri) ? uri : null;
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

  // aria-disabled (not `disabled`) so the hint still shows on hover while inactive.
  const reloadBtn = document.getElementById("btn-reload-file");
  reloadBtn?.addEventListener("mousemove", (e) => {
    const available = reloadBtn.getAttribute("aria-disabled") !== "true";
    showCursorHint(available ? RELOAD_FILE_HINT : RELOAD_FILE_UNAVAILABLE_HINT, e.clientX, e.clientY);
  });
  reloadBtn?.addEventListener("mouseleave", hideCursorHint);
}

/** Controls whose `title` is shown as the quick cursor hint (the same one as on Open file) instead of the slow native tooltip. */
const QUICK_HINT_SELECTOR = 'button, label.file-btn, select, summary';

/**
 * Shows every control's `title` immediately, next to the cursor. The native tooltip appears only after a long
 * delay and cannot be styled, so a title is moved to `data-hint` the first time the pointer reaches its control
 * (and again whenever the code sets a new one), and displayed by the cursor hint.
 */
function initQuickHints() {
  let owner = null;
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest?.(QUICK_HINT_SELECTOR);
    const title = el?.getAttribute("title");
    if (title) {
      el.dataset.hint = title;
      el.removeAttribute("title");
    }
  }, true);
  document.addEventListener("mousemove", (e) => {
    const el = e.target.closest?.(QUICK_HINT_SELECTOR);
    if (el?.dataset.hint) {
      owner = el;
      showCursorHint(el.dataset.hint, e.clientX, e.clientY);
    } else if (owner) {
      owner = null;
      hideCursorHint();
    }
  });
  document.addEventListener("mousedown", () => {
    if (!owner) return;
    owner = null;
    hideCursorHint();
  }, true);
}

function initFormulaRewriteHints() {
  els.renderedPane?.addEventListener("mousemove", (e) => {
    const badge = e.target.closest?.(".formula-rewrite-badge");
    if (!badge) {
      hideCursorHint();
      return;
    }
    const wrap = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = FORMULA_REWRITE_HINT;
    title.className = "formula-rewrite-title";
    const pre = document.createElement("pre");
    pre.className = "formula-rewrite-latex";
    pre.textContent = badge.dataset.latex ?? "";
    const copy = document.createElement("div");
    copy.className = "formula-rewrite-copy";
    copy.textContent = badge.classList.contains("copied") ? FORMULA_REWRITE_COPIED : FORMULA_REWRITE_COPY;
    wrap.append(title, pre, copy);
    showCursorHint(wrap, e.clientX, e.clientY, { detail: true });
  });
  // Capture phase: copying must not also select the formula underneath.
  els.renderedPane?.addEventListener("click", (e) => {
    const badge = e.target.closest?.(".formula-rewrite-badge");
    if (!badge) return;
    e.stopPropagation();
    navigator.clipboard?.writeText(badge.dataset.latex ?? "").then(() => {
      badge.classList.add("copied");
      const live = cursorHintEl.querySelector(".formula-rewrite-copy");
      if (live) live.textContent = FORMULA_REWRITE_COPIED;
      setTimeout(() => badge.classList.remove("copied"), 1500);
    }, () => {});
  }, true);
  els.renderedPane?.addEventListener("mouseleave", hideCursorHint);
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
  await attachDroppedHandles(dataTransfer, files);
  if (files.some((f) => f.name === "document.xml")) {
    await appendFolderArchive(files);
    return;
  }
  const supported = files.filter((f) => isArchiveFile(f) || isMarkupFile(f));
  if (supported.length) await addFilesToCatalog(supported, { replace: false });
}

/** Chromium exposes a handle per dropped file, which lets us notice later edits. */
async function attachDroppedHandles(dataTransfer, files) {
  const items = [...dataTransfer.items].filter((item) => item.kind === "file");
  if (!items.length || !items[0].getAsFileSystemHandle) return;
  // Handles must be requested synchronously within the drop event.
  const pending = items.map((item) => item.getAsFileSystemHandle().catch(() => null));
  const handles = await Promise.all(pending);
  handles.forEach((handle, i) => {
    if (handle?.kind === "file" && files[i]?.name === handle.name) fileHandles.set(files[i], handle);
  });
}

/**
 * Alternative representations: a host element may carry
 * `<custom><docling__alt_repr><docling__alt_opt>…</docling__alt_opt>…</docling__alt_repr></custom>`,
 * where each option holds replacement elements (as CDATA or as child elements).
 * `choices` maps an alt_repr index (document order) to the chosen option index. A chosen
 * option replaces its host in the document: the host is moved into an inert `<custom>`
 * wrapper (skipped by rendering) and the option's elements follow it as siblings. The
 * source view hides that bookkeeping and shows the document as it was written.
 * @returns {{ options: Map<Element, { host: number, opt: number, active: boolean }>, inactive: Map<Element, { host: number, replacement: Element[] }>, replacements: Set<Element> }}
 */
function applyAlternatives(doc, choices) {
  const options = new Map();
  const inactive = new Map();
  const replacements = new Set();
  const reprs = [...doc.getElementsByTagName("*")].filter((el) => localName(el) === "docling__alt_repr");
  reprs.forEach((repr, hostIdx) => {
    const opts = childElements(repr).filter((el) => localName(el) === "docling__alt_opt");
    const chosen = choices?.get(hostIdx);
    opts.forEach((opt, optIdx) => options.set(opt, { host: hostIdx, opt: optIdx, active: chosen === optIdx }));

    const host = repr.parentElement?.parentElement;
    if (chosen === undefined || !opts[chosen] || !host?.parentNode) return;
    const replacement = parseAlternativeElements(doc, opts[chosen]);
    if (!replacement.length) return;
    const wrapper = doc.createElementNS(host.namespaceURI, "custom");
    host.parentNode.insertBefore(wrapper, host);
    wrapper.appendChild(host);
    let anchor = wrapper;
    for (const el of replacement) {
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
      anchor = el;
      replacements.add(el);
    }
    inactive.set(wrapper, { host: hostIdx, replacement });
  });
  return { options, inactive, replacements };
}

function parseAlternativeElements(doc, opt) {
  const kids = childElements(opt);
  if (kids.length) return kids.map((k) => doc.importNode(k, true));
  const text = opt.textContent?.trim();
  if (!text) return [];
  const ns = doc.documentElement.namespaceURI;
  const frag = new DOMParser().parseFromString(`<r${ns ? ` xmlns="${ns}"` : ""}>${text}</r>`, "application/xml");
  if (frag.querySelector("parsererror")) return [];
  return childElements(frag.documentElement).map((k) => doc.importNode(k, true));
}

/**
 * Make `optIdx` of alternative set `hostIdx` effective. Choosing the option that is already
 * effective, or passing `optIdx` null, restores the original host.
 */
async function chooseAlternative(hostIdx, optIdx) {
  const entry = fileCatalog[activeFileIndex];
  if (!entry) return;
  const choices = entry.altChoices ?? new Map();
  if (optIdx === null || choices.get(hostIdx) === optIdx) choices.delete(hostIdx);
  else choices.set(hostIdx, optIdx);
  entry.altChoices = choices.size ? choices : null;
  const scroll = els.markupPane?.scrollTop ?? 0;
  await switchToFile(activeFileIndex);
  if (els.markupPane) els.markupPane.scrollTop = scroll;
}

function buildDocumentState(markupXml, pageImages, label, assetUrls, { markupOnly, altChoices = null }) {
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

  const alt = applyAlternatives(doc, altChoices);

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
    markupXml,
    altOptions: alt.options,
    altInactive: alt.inactive,
    altReplacements: alt.replacements,
    pageImages,
    assetUrls,
    trackMedia: buildTrackMedia(root, assetUrls),
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
    readingOrderIndexByElement: new Map(readingOrder.map((el, i) => [el, i])),
    pageViewOverlay: null,
  };
}

/**
 * Enumerate <track> elements in document order and map each to its whole-track
 * media, following PR doclang#175: media lives at video/{N}.{ext} / audio/{N}.{ext}
 * where N is the 1-based position of the <track> in the document.
 * @returns {Map<Element, { videoUrl: string | null, audioUrl: string | null, vttUrl: string | null }>}
 */
function buildTrackMedia(root, assetUrls) {
  const media = new Map();
  let ordinal = 0;
  walkElements(childElements(root), (el) => {
    if (localName(el) !== "track") return;
    ordinal += 1;
    const videoUrl = findTrackAsset(assetUrls, "video", ordinal, TRACK_VIDEO_EXTS);
    // Captions overlay a video surface only; skip the blob for audio-only tracks.
    const vtt = videoUrl ? trackCuesToWebVTT(parseTrackCues(el)) : null;
    media.set(el, {
      videoUrl,
      audioUrl: findTrackAsset(assetUrls, "audio", ordinal, TRACK_AUDIO_EXTS),
      vttUrl: vtt ? URL.createObjectURL(new Blob([vtt], { type: "text/vtt" })) : null,
    });
  });
  return media;
}

/** @returns {string | null} */
function findTrackAsset(assetUrls, dir, ordinal, preferredExts) {
  for (const ext of preferredExts) {
    const url = assetUrls.get(`${dir}/${ordinal}.${ext}`);
    if (url) return url;
  }
  const prefix = `${dir}/${ordinal}.`;
  for (const [key, url] of assetUrls) {
    if (key.startsWith(prefix)) return url;
  }
  return null;
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

  stopEditing({ render: false });
  setDocLabel(entry.label);
  setDocumentOpen(true, { markupOnly: state.markupOnly });
  setPageViewVisible(state.hasPageView);
  syncReadingLayoutButtons();
  renderPage(state.currentPage);
  updateFileView();
  syncValidationForActiveDocument();
  syncEditUi();
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

// --- Editing: raw source -> Apply (re-parse, refresh views) -> Save (write file) ---

/** @type {HTMLTextAreaElement | null} */
let markupEditor = null;

function editableEntry() {
  const entry = fileCatalog[activeFileIndex];
  return entry && state && (entry.kind === "markup" || entry.kind === "archive") ? entry : null;
}

function setEditError(message) {
  if (!els.editError) return;
  els.editError.textContent = message ?? "";
  els.editError.hidden = !message;
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "e" || e.defaultPrevented || e.repeat || !hotkeysEnabled) return;
  if (isTypingTarget(document.activeElement) || hasShortcutModifier(e)) return;
  if (markupEditor || !editableEntry()) return;
  e.preventDefault();
  startEditing();
});

function syncEditUi() {
  const entry = editableEntry();
  const editing = !!markupEditor;
  if (els.editBtn) els.editBtn.hidden = !entry || editing;
  if (els.editApplyBtn) els.editApplyBtn.hidden = !editing;
  if (els.editCancelBtn) els.editCancelBtn.hidden = !editing;
  if (els.saveBtn) {
    els.saveBtn.hidden = !entry?.dirty || editing;
  }
  if (els.revertBtn) els.revertBtn.hidden = !entry?.dirty || editing;
  if (els.undoBtn) els.undoBtn.hidden = !entry?.undoStack?.length || editing;
  if (els.redoBtn) els.redoBtn.hidden = !entry?.redoStack?.length || editing;
  els.filePane?.querySelectorAll(".file-view-item")[activeFileIndex]?.classList.toggle("is-dirty", !!entry?.dirty);
  if (!editing) setEditError(null);
}

function startEditing() {
  if (markupEditor || !editableEntry() || !els.markupPane) return;
  markupEditor = document.createElement("textarea");
  markupEditor.className = "markup-editor";
  markupEditor.spellcheck = false;
  markupEditor.value = state.markupXml;
  markupEditor.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      stopEditing({ render: true });
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      applyEdit();
    }
  });
  els.markupPane.classList.add("editing");
  els.markupPane.replaceChildren(markupEditor);
  markupEditor.focus();
  markupEditor.setSelectionRange(0, 0); // setting the value parks the caret (and the scroll) at the end
  markupEditor.scrollTop = 0;
  syncEditUi();
}

function stopEditing({ render }) {
  if (!markupEditor) return;
  markupEditor = null;
  els.markupPane?.classList.remove("editing");
  if (render && state) renderPage(state.currentPage);
  syncEditUi();
}

/** True unless the user keeps unapplied editor text they would otherwise lose. */
function confirmDiscardEditor() {
  if (!markupEditor || !state || markupEditor.value === state.markupXml) return true;
  return confirm("Discard the unapplied edits in the editor?");
}

/** Re-parses the editor text and, when it is well-formed, rebuilds every derived view from it. */
async function applyEdit() {
  const entry = editableEntry();
  if (!markupEditor || !entry) return;
  const text = markupEditor.value;
  if (text === state.markupXml) return stopEditing({ render: true });

  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    setEditError(`Not well-formed XML: ${parseError.textContent.trim().split("\n")[0]}`);
    return;
  }
  if (localName(doc.documentElement) !== "doclang") {
    setEditError("The root element must be <doclang>.");
    return;
  }

  markupEditor = null; // the discard prompt in switchToFile must not fire for applied text
  els.markupPane?.classList.remove("editing");
  if (!(await commitMarkupText(text))) {
    markupEditor = null;
    startEditing();
    markupEditor.value = text;
  }
}

/**
 * Stores `text` as the active document's new source and rebuilds every view from it.
 * @param {string} text
 * @param {{ record?: boolean, reselect?: string | null }} [opts] record: push the previous text on the undo stack
 * @returns {Promise<boolean>} false when the source could not be written
 */
async function commitMarkupText(text, { record = true, reselect = null } = {}) {
  const entry = editableEntry();
  if (!entry) return false;
  const previousText = state.markupXml;
  const bytes = new TextEncoder().encode(text);
  const previousSource = entry.source;
  try {
    entry.source = entry.kind === "archive"
      ? await replaceArchiveDocument(entry.source instanceof File ? await entry.source.arrayBuffer() : entry.source, bytes)
      : bytes.buffer;
  } catch (err) {
    entry.source = previousSource;
    setEditError(`Could not apply: ${err.message}`);
    return false;
  }
  if (!entry.dirty) entry.savedSource = previousSource;
  entry.dirty = true;
  entry.validation = null;
  if (record) {
    (entry.undoStack ??= []).push(previousText);
    entry.redoStack = [];
  }
  await switchToFile(activeFileIndex);
  if (reselect && state?.idToElement?.has(reselect)) selectElement(reselect);
  return true;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Writes the applied bytes back through the file's handle, or downloads them when there is none. */
async function saveActiveFile() {
  const entry = editableEntry();
  if (!entry?.dirty) return;
  const buffer = entry.source instanceof File ? await entry.source.arrayBuffer() : entry.source;
  const handle = entry.handle;
  try {
    if (handle?.createWritable) {
      const opts = { mode: "readwrite" };
      if ((await handle.queryPermission?.(opts)) !== "granted" && (await handle.requestPermission?.(opts)) !== "granted") {
        throw new Error("Write permission was not granted.");
      }
      const writable = await handle.createWritable();
      try {
        await writable.write(buffer);
      } finally {
        await writable.close();
      }
      entry.fingerprint = fileFingerprint(await handle.getFile());
    } else {
      downloadBlob(new Blob([buffer]), entry.label);
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
    alert(`Failed to save ${entry.label}: ${err.message}`);
    return;
  }
  entry.dirty = false;
  entry.savedSource = null;
  syncEditUi();
}

/** Drops every applied change and goes back to the last saved (or opened) bytes. */
async function revertActiveFile() {
  const entry = editableEntry();
  if (!entry?.dirty || !entry.savedSource) return;
  if (!confirm(`Revert ${entry.label} to its last saved version? Your unsaved changes will be lost.`)) return;
  entry.source = entry.savedSource;
  entry.savedSource = null;
  entry.dirty = false;
  entry.undoStack = [];
  entry.redoStack = [];
  entry.validation = null;
  markupEditor = null;
  els.markupPane?.classList.remove("editing");
  await switchToFile(activeFileIndex);
}

// --- Visual editing: select an element, then change it from the inspector or the page overlay ---

/** Block types that share one content model in the schema, so any of them can become another. */
const TEXT_BLOCK_TYPES = ["text", "heading", "footnote", "page_header", "page_footer"];
const TEXT_EDITABLE_TYPES = new Set([...TEXT_BLOCK_TYPES, "code", "formula"]);
const BBOX_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function serializeDocument() {
  let xml = new XMLSerializer().serializeToString(state.docRoot.ownerDocument);
  const decl = state.markupXml.match(/^\s*<\?xml[^>]*\?>/)?.[0];
  if (decl && !xml.startsWith("<?xml")) xml = `${decl.trim()}\n${xml}`;
  if (/\n\s*$/.test(state.markupXml) && !xml.endsWith("\n")) xml += "\n";
  return xml;
}

/** Applies `mutate` to the selected element's DOM node, then commits the serialized result. */
async function editSelectedElement(mutate) {
  const id = selectedElementId;
  const el = id ? state?.idToElement?.get(id) : null;
  if (!el || !editableEntry()) return;
  mutate(el);
  const text = serializeDocument();
  if (text === state.markupXml) return;
  setEditError(null);
  await commitMarkupText(text, { reselect: id });
}

function isWhitespaceText(node) {
  return node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim();
}

/** Index just past the element's leading head children (layer, location, label, ...). */
function headEndIndex(el) {
  const nodes = [...el.childNodes];
  let end = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.nodeType === Node.ELEMENT_NODE && HEAD_TAGS.has(localName(node))) end = i + 1;
    else if (!isWhitespaceText(node)) break;
  }
  return end;
}

function bodyNodes(el) {
  return [...el.childNodes].slice(headEndIndex(el));
}

/** Plain text of an element, or null when it holds inline elements that a text box would flatten. */
function plainTextOf(el) {
  const body = bodyNodes(el);
  if (body.some((n) => n.nodeType === Node.ELEMENT_NODE)) return null;
  return body.map((n) => n.nodeValue ?? "").join("").trim();
}

function setPlainText(el, text) {
  const first = [...el.childNodes][0];
  const last = el.lastChild;
  const childIndent = first?.nodeType === Node.TEXT_NODE ? first.nodeValue.match(/\n([ \t]*)$/)?.[1] : null;
  const closeIndent = last?.nodeType === Node.TEXT_NODE ? last.nodeValue.match(/\n([ \t]*)$/)?.[1] : null;
  for (const node of bodyNodes(el)) node.remove();
  const clean = text.trim();
  const multiline = clean.includes("\n");
  el.appendChild(el.ownerDocument.createTextNode(
    childIndent != null && !multiline ? `\n${childIndent}${clean}\n${closeIndent ?? ""}` : clean,
  ));
}

function insertHeadChild(el, child) {
  const ref = firstHeadChild(el, "location");
  if (!ref) {
    el.insertBefore(child, el.firstChild);
    return;
  }
  const ws = ref.previousSibling && isWhitespaceText(ref.previousSibling) ? ref.previousSibling : null;
  el.insertBefore(child, ref);
  if (ws) el.insertBefore(ws.cloneNode(), ref);
}

function setElementLayer(el, value) {
  const layerEl = firstHeadChild(el, "layer");
  if (value === "body") {
    if (!layerEl) return;
    const prev = layerEl.previousSibling;
    if (prev && isWhitespaceText(prev)) prev.remove();
    layerEl.remove();
    return;
  }
  if (layerEl) {
    layerEl.setAttribute("value", value);
    return;
  }
  const created = el.ownerDocument.createElementNS(el.namespaceURI, "layer");
  created.setAttribute("value", value);
  insertHeadChild(el, created);
}

/** Renames an element in place (same attributes and children) and fixes the attributes the new type owns. */
function retypeElement(el, tag) {
  if (localName(el) === tag) return;
  const next = el.ownerDocument.createElementNS(el.namespaceURI, tag);
  for (const attr of [...el.attributes]) next.setAttribute(attr.name, attr.value);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  if (tag === "heading") {
    if (!next.hasAttribute("level")) next.setAttribute("level", "1");
  } else {
    next.removeAttribute("level");
  }
}

function setElementLocations(el, [x0, y0, x1, y1]) {
  headLocations(el).forEach((loc, i) => loc.setAttribute("value", String([x0, y0, x1, y1][i])));
}

/** Moves the document one step along the undo (`from`) or redo stack, pushing the current text onto the other. */
async function stepHistory(from, to) {
  const entry = editableEntry();
  const target = entry?.[from]?.pop();
  if (target == null) return;
  const current = state.markupXml;
  const ok = await commitMarkupText(target, { record: false, reselect: selectedElementId });
  if (!ok) {
    entry[from].push(target);
    return;
  }
  (entry[to] ??= []).push(current);
  if (!entry.undoStack?.length) {
    entry.dirty = false;
    entry.savedSource = null;
  }
  syncEditUi();
}

function undoLastEdit() {
  return stepHistory("undoStack", "redoStack");
}

function redoLastEdit() {
  return stepHistory("redoStack", "undoStack");
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() !== "z" || !(e.metaKey || e.ctrlKey) || e.defaultPrevented) return;
  if (isTypingTarget(document.activeElement) || markupEditor) return;
  const entry = editableEntry();
  const stack = e.shiftKey ? entry?.redoStack : entry?.undoStack;
  if (!stack?.length) return;
  e.preventDefault();
  if (e.shiftKey) redoLastEdit();
  else undoLastEdit();
});

function syncSelectionEditUi() {
  renderInspector();
  syncBboxHandles();
}

function inspectorField(label, control) {
  const wrap = document.createElement("label");
  wrap.className = "inspector-field";
  const name = document.createElement("span");
  name.textContent = label;
  wrap.append(name, control);
  return wrap;
}

function inspectorSelect(options, value, onChange) {
  const select = document.createElement("select");
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    select.appendChild(o);
  }
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function renderInspector() {
  const host = els.inspector;
  if (!host) return;
  const el = selectedElementId && !markupEditor && editableEntry() ? state.idToElement?.get(selectedElementId) : null;
  if (!el) {
    host.hidden = true;
    host.replaceChildren();
    return;
  }
  const tag = localName(el);
  const ownHead = headLocations(el).length === 4 || firstHeadChild(el, "layer") != null;
  const parts = [];

  const title = document.createElement("div");
  title.className = "inspector-title";
  title.textContent = `<${tag}> ${selectedElementId}`;
  parts.push(title);

  if (TEXT_BLOCK_TYPES.includes(tag)) {
    parts.push(inspectorField("Type", inspectorSelect(TEXT_BLOCK_TYPES, tag, (v) => {
      editSelectedElement((node) => retypeElement(node, v));
    })));
  }
  if (tag === "heading") {
    parts.push(inspectorField("Level", inspectorSelect(["1", "2", "3", "4", "5", "6"], String(headingLevel(el)), (v) => {
      editSelectedElement((node) => node.setAttribute("level", v));
    })));
  }
  if (ownHead) {
    parts.push(inspectorField("Layer", inspectorSelect([...ELEMENT_LAYERS], elementLayer(el), (v) => {
      editSelectedElement((node) => setElementLayer(node, v));
    })));
  }
  const text = TEXT_EDITABLE_TYPES.has(tag) ? plainTextOf(el) : null;
  if (text != null) {
    const area = document.createElement("textarea");
    area.className = "inspector-text";
    area.rows = Math.min(8, Math.max(2, Math.ceil(text.length / 48)));
    area.value = text;
    area.spellcheck = false;
    area.addEventListener("change", () => editSelectedElement((node) => setPlainText(node, area.value)));
    parts.push(inspectorField("Text", area));
  } else if (TEXT_EDITABLE_TYPES.has(tag)) {
    const note = document.createElement("div");
    note.className = "inspector-note";
    note.textContent = "Contains inline elements: edit the text in the source.";
    parts.push(note);
  }
  if (!ownHead && !TEXT_BLOCK_TYPES.includes(tag)) {
    const note = document.createElement("div");
    note.className = "inspector-note";
    note.textContent = "No editable properties yet.";
    parts.push(note);
  }
  host.replaceChildren(...parts);
  host.hidden = false;
}

// --- Bbox move / resize on the page overlay ---

const HANDLE_CURSORS = { nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize" };

function syncBboxHandles() {
  const svg = els.pagePane?.querySelector("svg.overlay");
  svg?.querySelector(".bbox-handles")?.remove();
  if (!svg || !selectedElementId || markupEditor || !editableEntry()) return;
  const el = state.idToElement?.get(selectedElementId);
  const box = state.currentBoxes?.find((b) => b.elementId === selectedElementId);
  const img = els.pagePane.querySelector(".page-view img");
  if (!el || !box || !img || headLocations(el).length !== 4) return;
  if (!svg.dataset.editWired) {
    svg.dataset.editWired = "1";
    svg.addEventListener("pointerdown", onOverlayPointerDown);
  }
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "bbox-handles");
  svg.appendChild(group);
  drawBboxHandles(group, box, img);
}

function drawBboxHandles(group, box, img) {
  group.replaceChildren();
  const { x, y, w, h } = boxPixelRect(box, img);
  const size = Math.max(8, img.naturalWidth * 0.01);
  const pos = {
    nw: [x, y], n: [x + w / 2, y], ne: [x + w, y], e: [x + w, y + h / 2],
    se: [x + w, y + h], s: [x + w / 2, y + h], sw: [x, y + h], w: [x, y + h / 2],
  };
  for (const name of BBOX_HANDLES) {
    const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("class", "bbox-handle");
    r.setAttribute("data-handle", name);
    r.setAttribute("x", String(pos[name][0] - size / 2));
    r.setAttribute("y", String(pos[name][1] - size / 2));
    r.setAttribute("width", String(size));
    r.setAttribute("height", String(size));
    r.style.cursor = HANDLE_CURSORS[name];
    group.appendChild(r);
  }
}

function onOverlayPointerDown(e) {
  if (e.button !== 0 || !selectedElementId || markupEditor) return;
  const svg = e.currentTarget;
  const img = els.pagePane.querySelector(".page-view img");
  const box = state.currentBoxes?.find((b) => b.elementId === selectedElementId);
  if (!img || !box) return;
  let mode = e.target.closest?.(".bbox-handle")?.getAttribute("data-handle") ?? null;
  const start = imageCoordsFromEvent(svg, e);
  if (!start) return;
  if (!mode) {
    const hit = hitTestBoxes(state.currentBoxes, img, start.x, start.y);
    if (hit?.elementId !== selectedElementId) return;
    mode = "move";
  }
  e.preventDefault();
  e.stopPropagation();
  svg.setPointerCapture(e.pointerId);

  const orig = { x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 };
  const rect = svg.querySelector(`rect.bbox[data-element-id="${selectedElementId}"]`);
  const group = svg.querySelector(".bbox-handles");
  const live = { ...box };
  let moved = false;

  const onMove = (ev) => {
    const p = imageCoordsFromEvent(svg, ev);
    if (!p) return;
    const du = Math.round(((p.x - start.x) / img.naturalWidth) * box.resW);
    const dv = Math.round(((p.y - start.y) / img.naturalHeight) * box.resH);
    let { x0, y0, x1, y1 } = orig;
    if (mode === "move") {
      const dx = Math.min(Math.max(du, -x0), box.resW - x1);
      const dy = Math.min(Math.max(dv, -y0), box.resH - y1);
      x0 += dx; x1 += dx; y0 += dy; y1 += dy;
    } else {
      if (mode.includes("w")) x0 = Math.min(Math.max(x0 + du, 0), x1 - 1);
      if (mode.includes("e")) x1 = Math.max(Math.min(x1 + du, box.resW), x0 + 1);
      if (mode.includes("n")) y0 = Math.min(Math.max(y0 + dv, 0), y1 - 1);
      if (mode.includes("s")) y1 = Math.max(Math.min(y1 + dv, box.resH), y0 + 1);
    }
    Object.assign(live, { x0, y0, x1, y1 });
    moved = x0 !== orig.x0 || y0 !== orig.y0 || x1 !== orig.x1 || y1 !== orig.y1;
    const px = boxPixelRect(live, img);
    if (rect) {
      rect.setAttribute("x", String(px.x));
      rect.setAttribute("y", String(px.y));
      rect.setAttribute("width", String(Math.max(px.w, 1)));
      rect.setAttribute("height", String(Math.max(px.h, 1)));
    }
    if (group) drawBboxHandles(group, live, img);
  };
  const onUp = () => {
    svg.removeEventListener("pointermove", onMove);
    svg.removeEventListener("pointerup", onUp);
    svg.removeEventListener("pointercancel", onUp);
    pagePanSuppressClick = true; // the click that follows a drag must not re-select
    setTimeout(() => { pagePanSuppressClick = false; }, 0);
    if (moved) {
      editSelectedElement((el) => setElementLocations(el, [live.x0, live.y0, live.x1, live.y1]));
    }
  };
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
}

// --- XSD validation (libxml2 compiled to WASM, run in validator-worker.mjs) ---

const DOCLANG_NS_CLARK = `{${DOCLANG_NS}}`;
/** @type {Worker | null} */
let validatorWorker = null;
let validatorRequestSeq = 0;
/** @type {Map<number, (result: object) => void>} */
const validatorPending = new Map();

function failPendingValidations(message) {
  for (const resolve of validatorPending.values()) resolve({ ok: false, error: message });
  validatorPending.clear();
}

/** @returns {Promise<{ ok: true, issues: object[], schemaVersion: string | null } | { ok: false, error: string }>} */
function requestValidation(markup) {
  if (!validatorWorker) {
    validatorWorker = new Worker("validator-worker.mjs", { type: "module" });
    validatorWorker.addEventListener("message", (e) => {
      const { id, ...result } = e.data;
      validatorPending.get(id)?.(result);
      validatorPending.delete(id);
    });
    validatorWorker.addEventListener("error", (e) => {
      e.preventDefault();
      validatorWorker?.terminate();
      validatorWorker = null;
      failPendingValidations(e.message || "The validator could not be loaded.");
    });
  }
  const id = ++validatorRequestSeq;
  return new Promise((resolve) => {
    validatorPending.set(id, resolve);
    validatorWorker.postMessage({ id, markup });
  });
}

async function validateActiveDocument() {
  const entry = fileCatalog[activeFileIndex];
  if (!entry || !state) return;
  entry.validation = { status: "running" };
  renderValidationUi(entry);
  const result = await requestValidation(state.markupXml);
  entry.validation = result.ok
    ? { status: result.issues.length ? "invalid" : "valid", issues: result.issues, schemaVersion: result.schemaVersion }
    : { status: "error", error: result.error };
  if (fileCatalog[activeFileIndex] === entry) renderValidationUi(entry);
}

async function onValidateClick() {
  const entry = fileCatalog[activeFileIndex];
  if (!entry) return;
  const status = entry.validation?.status ?? "idle";
  if (status === "running") return;
  if (status === "idle" || status === "error") {
    await validateActiveDocument();
    if (fileCatalog[activeFileIndex] === entry) setValidationPanelOpen(true);
    return;
  }
  setValidationPanelOpen(els.validationPanel?.hidden ?? false);
}

/** Called whenever the active document changes; each document is validated once, on first open. */
function syncValidationForActiveDocument() {
  const entry = fileCatalog[activeFileIndex];
  if (!entry || !state) {
    setValidationPanelOpen(false);
    renderValidationUi(null);
    return;
  }
  renderValidationUi(entry);
  if (!entry.validation) validateActiveDocument();
}

/** Opens/closes the results panel at the user's request; remembered per file. */
function setValidationPanelOpen(open) {
  const entry = fileCatalog[activeFileIndex];
  if (entry) entry.validationPanelOpen = open;
  applyValidationPanelOpen(open);
}

function applyValidationPanelOpen(open) {
  if (!els.validationPanel || !els.validateBtn) return;
  els.validationPanel.hidden = !open;
  els.validateBtn.setAttribute("aria-expanded", String(open));
}

const VALIDATE_BTN_LABELS = {
  idle: "Validate XSD",
  running: "Validating…",
  valid: "Valid XSD",
  error: "Validation failed",
};

function renderValidationUi(entry) {
  const btn = els.validateBtn;
  if (!btn) return;
  const v = entry?.validation ?? { status: "idle" };
  btn.dataset.status = v.status;
  btn.disabled = v.status === "running";
  btn.textContent = v.status === "invalid"
    ? `${v.issues.length} XSD ${v.issues.length === 1 ? "issue" : "issues"}`
    : VALIDATE_BTN_LABELS[v.status];
  btn.title = v.status === "idle" || v.status === "error"
    ? "Validate against the DocLang XSD"
    : "Show validation results";

  if (!els.validationSummary || !els.validationIssues) return;
  const schema = v.schemaVersion ? `DocLang XSD ${v.schemaVersion}` : "DocLang XSD";
  if (v.status === "valid") {
    els.validationSummary.textContent = `Valid against ${schema}`;
  } else if (v.status === "invalid") {
    const n = v.issues.length;
    els.validationSummary.textContent = `${n} ${n === 1 ? "issue" : "issues"} against ${schema}`;
  } else if (v.status === "error") {
    els.validationSummary.textContent = `Could not validate: ${v.error}`;
  } else {
    els.validationSummary.textContent = "";
  }
  els.validationIssues.replaceChildren(...(v.status === "invalid" ? v.issues.map(buildValidationIssueItem) : []));
  els.validationPanel?.setAttribute("data-status", v.status);
  // Issues are shown expanded unless the user closed them for this file.
  const hasResult = v.status === "valid" || v.status === "invalid" || v.status === "error";
  applyValidationPanelOpen(hasResult && (entry.validationPanelOpen ?? v.status === "invalid"));
}

function buildValidationIssueItem(issue) {
  const li = document.createElement("li");
  const target = issue.xpath ? resolveNodePath(state?.docRoot?.ownerDocument, issue.xpath) : null;
  const navigable = target && pageHostElement(target);
  const row = document.createElement(navigable ? "button" : "div");
  row.className = "validation-issue";
  if (navigable) {
    row.type = "button";
    row.title = "Show in document";
    row.addEventListener("click", () => revealElement(target));
  }
  const loc = document.createElement("span");
  loc.className = "validation-issue-loc";
  loc.textContent = issue.line ? `Line ${issue.line}` : issue.kind === "policy" || issue.kind === "version" ? "Document" : "—";
  const msg = document.createElement("span");
  msg.className = "validation-issue-msg";
  msg.textContent = issue.message.replaceAll(DOCLANG_NS_CLARK, "");
  row.append(loc, msg);
  li.appendChild(row);
  return li;
}

/**
 * Resolves a libxml2 node path (xmlGetNodePath, e.g. "/*\/*[5]/*[2]" or "/*\/p:foo") against a DOM.
 * Steps use XPath positional semantics; unresolvable steps stop at the deepest ancestor found.
 * @returns {Element | null}
 */
function resolveNodePath(doc, path) {
  if (!doc) return null;
  /** @type {Document | Element} */
  let node = doc;
  for (const step of path.split("/").slice(1)) {
    const m = /^([^[\]@()]+)(?:\[(\d+)\])?$/.exec(step);
    if (!m) break;
    const [, name, index] = m;
    const candidates = [...node.children].filter((el) => name === "*" || el.nodeName === name);
    const next = candidates[(index ? Number(index) : 1) - 1];
    if (!next) break;
    node = next;
  }
  return node.nodeType === Node.ELEMENT_NODE ? node : null;
}

/** Nearest ancestor-or-self that is rendered on some page (content in <head> is not). */
function pageHostElement(el) {
  let cur = el;
  while (cur && !state?.elementPageByEl.has(cur)) cur = cur.parentElement;
  return cur;
}

function revealElement(el) {
  const target = pageHostElement(el);
  if (!target) return;
  const page = state.elementPageByEl.get(target);
  if (page !== state.currentPage) {
    // Page view re-applies this once its image (and overlay) is ready.
    if (state.hasPageView) state.pendingSelectElement = target;
    goToPage(page);
  }
  const id = findElementIdOnPage(target);
  if (id) selectElement(id);
}

function setDocumentOpen(open, { markupOnly = false } = {}) {
  document.body.classList.toggle("viewer-loaded", open);
  document.body.classList.toggle("markup-only", open && markupOnly);
  if (els.pageNav) els.pageNav.hidden = !open || markupOnly;
  if (els.layoutNav) els.layoutNav.hidden = !open || !state?.hasPageView;
  updateBboxNavButtons();
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function applyReadingLayerClasses(root) {
  root.classList.toggle("show-reading-furniture", showReadingFurniture);
  root.classList.toggle("show-reading-background", showReadingBackground);
}

function syncReadingLayerVisibility() {
  const root = els.renderedPane?.querySelector(".rendered-doc, .paged-canvas");
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
  setDemoLoading(false);
  stopEditing({ render: false });
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
  syncValidationForActiveDocument();
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
    els.layoutLayersLabel,
    els.layoutTypesLabel,
    ...(els.layoutTypesFields?.querySelectorAll("label.settings-option") ?? []),
    els.showLayoutBodyLabel,
    els.showLayoutFurnitureLabel,
    els.showLayoutBackgroundLabel,
    els.showFragmentLinksLabel,
    els.showCaptionLinksLabel,
    els.showXrefLinksLabel,
    els.showKeyValueLinksLabel,
    els.showReadingOrderLabel,
  ]) {
    if (!label) continue;
    label.classList.toggle("settings-option-disabled", !layoutEnabled);
    const input = label.querySelector("input");
    if (input) input.disabled = !layoutEnabled;
  }

  collapseDisabledArrowFields();
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

function loadOverlayPrefs() {
  try {
    const raw = localStorage.getItem(OVERLAY_PREFS_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return;
    for (const [key, acc] of Object.entries(OVERLAY_PREF_ACCESSORS)) {
      if (typeof data[key] === "boolean") acc.set(data[key]);
    }
    if (Array.isArray(data.hiddenTypes)) {
      hiddenOverlayTypes = new Set(data.hiddenTypes.filter((t) => OVERLAY_TYPE_FILTERS.includes(t)));
    }
  } catch {
    /* ignore invalid stored overlay prefs */
  }
}

function persistOverlayPrefs() {
  try {
    const data = {};
    for (const [key, acc] of Object.entries(OVERLAY_PREF_ACCESSORS)) data[key] = acc.get();
    data.hiddenTypes = [...hiddenOverlayTypes];
    localStorage.setItem(OVERLAY_PREFS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Push restored overlay-pref flags onto their checkboxes so the panel matches. */
function syncOverlayPrefControls() {
  for (const acc of Object.values(OVERLAY_PREF_ACCESSORS)) {
    const el = acc.el();
    if (el) el.checked = acc.get();
  }
  for (const input of els.layoutTypesFields?.querySelectorAll("input[data-overlay-type]") ?? []) {
    input.checked = !hiddenOverlayTypes.has(input.dataset.overlayType);
  }
  syncSelectAllToggles();
}

/** Checkboxes governed by a select-all toggle: everything inside that group's `arrow-fields-<group>` panel. */
function selectAllGroupInputs(group) {
  return [...(document.getElementById(`arrow-fields-${group}`)?.querySelectorAll('input[type="checkbox"]') ?? [])];
}

/** Check or uncheck every member of a select-all group, firing each member's own change handling. */
function setSelectAllGroup(group, checked) {
  for (const input of selectAllGroupInputs(group)) {
    if (input.checked === checked) continue;
    input.checked = checked;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/** Reflect each group's members on its select-all toggle: checked (all), unchecked (none) or indeterminate. */
function syncSelectAllToggles() {
  for (const toggle of els.pageSettingsPanel?.querySelectorAll("input[data-select-all]") ?? []) {
    const inputs = selectAllGroupInputs(toggle.dataset.selectAll);
    const checkedCount = inputs.filter((i) => i.checked).length;
    toggle.checked = inputs.length > 0 && checkedCount === inputs.length;
    toggle.indeterminate = checkedCount > 0 && checkedCount < inputs.length;
  }
}

/**
 * Populate the Overlays → Types panel with one checkbox per filterable element type.
 * Container types (picture, table, index) also get an indented "Contents" checkbox
 * (`#show-<type>-contents`) toggling the boxes nested inside them, independent of the
 * container's own box.
 */
function buildOverlayTypeControls(fields) {
  if (!fields) return;
  const makeOption = (className, text, configure) => {
    const label = document.createElement("label");
    label.className = className;
    const input = document.createElement("input");
    input.type = "checkbox";
    configure(input, label);
    const span = document.createElement("span");
    span.textContent = text;
    label.append(input, span);
    return label;
  };
  for (const type of OVERLAY_TYPE_FILTERS) {
    const cell = document.createElement("div");
    cell.className = "overlay-type-cell";
    const name = type.replace(/_/g, " ");
    cell.appendChild(
      makeOption("settings-option settings-option-sub", name.charAt(0).toUpperCase() + name.slice(1), (input) => {
        input.checked = true;
        input.dataset.overlayType = type;
      }),
    );
    if (OVERLAY_TYPES_WITH_CONTENTS.has(type)) {
      cell.appendChild(
        makeOption("settings-option settings-option-sub settings-option-contents", "Contents", (input) => {
          input.id = `show-${type}-contents`;
        }),
      );
    }
    fields.appendChild(cell);
  }
}

/** Overlay type filter key for an element: virtual-text units count as "text", tabular as "table". */
function overlayTypeOf(el) {
  if (isVirtualTextOverlayUnit(el)) return "text";
  const tag = localName(el);
  return tag === "tabular" ? "table" : tag;
}

/** Restore every overlay toggle to its built-in default, then persist and re-render. */
function resetOverlayPrefs() {
  for (const acc of Object.values(OVERLAY_PREF_ACCESSORS)) acc.set(acc.def);
  hiddenOverlayTypes = new Set();
  syncOverlayPrefControls();
  persistOverlayPrefs();
  syncLayoutSubtoggles();
  if (state) renderPage(state.currentPage);
}

function loadHotkeysPref() {
  try {
    hotkeysEnabled = localStorage.getItem(HOTKEYS_STORAGE_KEY) === "true";
  } catch {
    /* ignore invalid stored hotkeys pref */
  }
  if (els.toggleHotkeys) els.toggleHotkeys.checked = hotkeysEnabled;
}

function persistHotkeysPref() {
  try {
    localStorage.setItem(HOTKEYS_STORAGE_KEY, String(hotkeysEnabled));
  } catch {
    /* ignore quota / private mode */
  }
}

function loadReadingLayoutMode() {
  try {
    const stored = localStorage.getItem(READING_LAYOUT_MODE_STORAGE_KEY);
    if (stored === "paged" || stored === "pageless") readingLayoutMode = stored;
  } catch {
    /* ignore invalid stored reading-layout-mode pref */
  }
}

function persistReadingLayoutMode() {
  try {
    localStorage.setItem(READING_LAYOUT_MODE_STORAGE_KEY, readingLayoutMode);
  } catch {
    /* ignore quota / private mode */
  }
}

// Paged layout is drawn over the page image, so it needs one; the stored
// preference is kept and applies again to the next document that has images.
function effectiveReadingLayoutMode() {
  return readingLayoutMode === "paged" && state?.hasPageView !== false ? "paged" : "pageless";
}

function syncReadingLayoutButtons() {
  const paged = effectiveReadingLayoutMode() === "paged";
  if (els.readingLayoutPagedBtn) els.readingLayoutPagedBtn.disabled = state?.hasPageView === false;
  if (els.readingLayoutPagelessBtn) els.readingLayoutPagelessBtn.setAttribute("aria-pressed", String(!paged));
  if (els.readingLayoutPagedBtn) els.readingLayoutPagedBtn.setAttribute("aria-pressed", String(paged));
}

function setReadingLayoutMode(mode) {
  if (mode === "paged" && state?.hasPageView === false) return;
  if (mode === readingLayoutMode) return;
  readingLayoutMode = mode;
  persistReadingLayoutMode();
  syncReadingLayoutButtons();
  if (state?.currentSegment) {
    renderReadingPane(state.currentSegment, state.elementIds, state.currentBoxes, state.defaultResolution);
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
  normalizePaneRatios();
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
  els.toolbarOptionsClose?.addEventListener("click", () => setToolbarOptionsOpen(false));

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
  els.toggleHotkeys?.addEventListener("change", () => {
    hotkeysEnabled = els.toggleHotkeys.checked;
    persistHotkeysPref();
  });
  els.hotkeysInfoBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    setHelpOverlayOpen(true);
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

  normalizePaneRatios();
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
  if (leftContentIndex < 0 || leftContentIndex + 1 >= contentFr.length) return;

  const pairFrTotal = contentFr[leftContentIndex] + contentFr[leftContentIndex + 1];
  if (!(pairFrTotal > 0)) return;

  const pairPixels = Math.max(contentPaneAvailableWidthPx() * pairFrTotal, 1);
  const deltaRatio = (e.clientX - paneDrag.startX) / pairPixels;

  const leftIndex = paneRatioIndex(paneDrag.leftKey);
  const rightIndex = paneRatioIndex(paneDrag.rightKey);
  const pairStoredTotal = paneDrag.leftStart + paneDrag.rightStart;
  if (!(pairStoredTotal > 0) || leftIndex < 0 || rightIndex < 0) return;

  let nextLeft = paneDrag.leftStart + deltaRatio * pairStoredTotal;
  const leftMin = Math.min(paneMinRatio(paneDrag.leftKey), pairStoredTotal / 2);
  const rightMin = Math.min(paneMinRatio(paneDrag.rightKey), pairStoredTotal / 2);
  nextLeft = Math.min(Math.max(nextLeft, leftMin), pairStoredTotal - rightMin);
  paneRatios[leftIndex] = nextLeft;
  paneRatios[rightIndex] = pairStoredTotal - nextLeft;
  applyPaneLayout();
}

function endPaneDrag(e) {
  if (!paneDrag || e.pointerId !== paneDrag.pointerId) return;
  const splitter = els.splitters[paneDrag.physicalSplitterIndex];
  splitter?.classList.remove("is-dragging");
  if (splitter?.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
  paneDrag = null;
  document.body.classList.remove("pane-drag-active");
  normalizePaneRatios();
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
  updateBboxNavButtons();

  if (!els.markupPane || !els.renderedPane || !els.pagePane) return;

  if (!markupEditor) els.markupPane.innerHTML = "";
  const elementIds = assignElementIds(segment);
  state.elementIds = elementIds;
  state.idToElement = invertElementIds(elementIds);
  const boxes = collectBoundingBoxes(segment, defaultResolution, elementIds);
  state.currentSegment = segment;
  state.currentBoxes = boxes;

  if (markupEditor) {
    // The editor holds the whole document and stays put while paging.
  } else if (segmentHasMarkup(segment)) {
    els.markupPane.appendChild(buildMarkupView(segment, elementIds));
  } else {
    els.markupPane.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
  }

  renderReadingPane(segment, elementIds, boxes, defaultResolution);

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
        // An image that finishes loading after another page was rendered belongs to a page that is gone: it must
        // not touch the current page's views, overlay data or pending selection.
        if (!img.isConnected || state?.currentPage !== pageNum) return;
        if (img.dataset.layoutGeneration === String(pageNum)) return;
        img.dataset.layoutGeneration = String(pageNum);

        applyPageImageSize(img, els.pagePane);

        const pagedCanvas = els.renderedPane?.querySelector(".paged-canvas");
        if (pagedCanvas && img.naturalWidth && img.naturalHeight) {
          pagedCanvas.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
          pagedCanvas.dataset.aspectW = String(img.naturalWidth);
          pagedCanvas.dataset.aspectH = String(img.naturalHeight);
          fitPagedCanvas();
        }

        const existing = wrap.querySelector("svg.overlay");
        if (existing) existing.remove();
        const readingOrderSteps = collectReadingOrderSteps(segment, elementIds, boxes, state.readingOrder);
        state.pageViewOverlay = { boxes, readingOrderSteps };
        if (boxes.length) {
          wrap.appendChild(
            buildOverlay(
              img,
              boxes,
              collectCaptionLinks(segment, elementIds, boxes),
              collectXrefLinks(segment, elementIds, boxes),
              readingOrderSteps,
              collectKeyValueLinks(segment, elementIds, boxes),
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

function renderReadingPane(segment, elementIds, boxes, defaultResolution) {
  if (!els.renderedPane) return;
  els.renderedPane.innerHTML = "";

  if (!segmentHasMarkup(segment)) {
    els.renderedPane.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    els.renderedPane.classList.remove("reading-mode-paged");
    return;
  }

  if (effectiveReadingLayoutMode() === "paged") {
    els.renderedPane.classList.add("reading-mode-paged");
    const canvas = buildPagedView(segment, elementIds, boxes, defaultResolution);
    continueEquationNumbering(canvas, segment);
    // The page image (in the separate "Original" pane) may have already
    // finished loading before this canvas existed to receive onImageReady's
    // aspect-ratio correction (e.g. it loaded while we were in pageless mode,
    // or before the mode was ever switched to paged) — sync from it now rather
    // than being stuck with the defaultResolution fallback until next page load.
    const existingImg = els.pagePane?.querySelector(".page-view img");
    if (existingImg?.naturalWidth && existingImg?.naturalHeight) {
      canvas.style.aspectRatio = `${existingImg.naturalWidth} / ${existingImg.naturalHeight}`;
      canvas.dataset.aspectW = String(existingImg.naturalWidth);
      canvas.dataset.aspectH = String(existingImg.naturalHeight);
    }
    els.renderedPane.appendChild(canvas);
    fitPagedCanvas();
    if (!pagedPaneResizeObserver) {
      pagedPaneResizeObserver = new ResizeObserver(() => fitPagedCanvas());
      pagedPaneResizeObserver.observe(els.renderedPane);
    }
  } else {
    els.renderedPane.classList.remove("reading-mode-paged");
    const view = buildRenderedView(segment, elementIds);
    continueEquationNumbering(view, segment);
    els.renderedPane.appendChild(view);
  }
}

/** Pages render one at a time, so continue KaTeX's equation numbering from earlier pages. */
function continueEquationNumbering(container, segment) {
  const pageIdx = state.segments.indexOf(segment);
  const before = state.segments.slice(0, Math.max(pageIdx, 0)).reduce((n, seg) => n + countEquationNumbers(seg), 0);
  if (before) container.style.counterReset = `katexEqnNo ${before}`;
}

function pageZoomFactor() {
  return pageZoomPercent / PAGE_ZOOM_DEFAULT;
}

/**
 * Convert a legacy overlay length (image pixels as tuned on the demo pages) to SVG user
 * units for the current page. Matches the old demo on-screen size, stays zoom-stable,
 * and scales with page resolution so other images look the same.
 */
function overlayUserLength(baseUserPx, img = els.pagePane?.querySelector(".page-view img")) {
  const zoom = pageZoomFactor();
  if (!(zoom > 0)) return baseUserPx;
  if (!img?.naturalWidth || !img.naturalHeight || !els.pagePane) {
    return baseUserPx / zoom;
  }

  const { w: paneW, h: paneH } = paneContentSize(els.pagePane);
  if (!(paneW > 0 && paneH > 0)) return baseUserPx / zoom;

  const refFit = Math.min(
    (paneW - PAGE_VIEW_BORDER_PX) / OVERLAY_REF_IMAGE_WIDTH,
    (paneH - PAGE_VIEW_BORDER_PX) / OVERLAY_REF_IMAGE_HEIGHT,
  );
  const fitScale = getCachedFitScale(img, els.pagePane);
  if (!(refFit > 0) || !(fitScale > 0)) return baseUserPx / zoom;

  return (baseUserPx * refFit) / (fitScale * zoom);
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

function fitPagedCanvas() {
  if (!els.renderedPane) return;
  const canvas = els.renderedPane.querySelector(".paged-canvas");
  if (!canvas) return;
  const aspectW = Number(canvas.dataset.aspectW) || 1;
  const aspectH = Number(canvas.dataset.aspectH) || 1;
  const { w: paneW, h: paneH } = paneContentSize(els.renderedPane);
  if (!(paneW > 0 && paneH > 0)) return;
  let cw = paneW;
  let ch = cw * (aspectH / aspectW);
  if (ch > paneH) {
    ch = paneH;
    cw = ch * (aspectW / aspectH);
  }
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;

  // Re-fit slot content every time the canvas is (re)sized: slot pixel sizes change
  // with it, and this also corrects any earlier fit done against a provisional aspect
  // ratio (e.g. before the real page image loaded and replaced the fallback guess).
  for (const slot of canvas.querySelectorAll(".paged-el-slot")) {
    fitSlotContent(slot);
  }
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

  svg.querySelectorAll(".element-badge").forEach((badge) => badge.remove());
  if (!showAllBboxes || !showLayoutBadges) return;

  const boxes = sortedOverlayBoxes(meta.boxes ?? []);

  for (const b of boxes) {
    const { x, y } = boxPixelRect(b, img);
    appendOverlayBadge(svg, x, y, b.tag, {
      extraClass: `element-badge ${kindClassForTag(b.kind)}`,
      elementId: b.elementId,
    });
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

/**
 * Selection unit inside a `<track>`: a cue block is its `<bdiv/>` plus everything up
 * to the next sibling `<bdiv/>` (spec: Tracks), so any node in it resolves to that
 * `<bdiv/>`. The `<cover>` is its own unit; the track's head resolves normally.
 */
function findTrackSelectionHost(xmlEl) {
  let child = xmlEl;
  while (child.parentNode && !(child.parentNode.nodeType === Node.ELEMENT_NODE && localName(child.parentNode) === "track")) {
    child = child.parentNode;
  }
  if (!child.parentNode) return null;
  if (child.nodeType === Node.ELEMENT_NODE && localName(child) === "cover") return child;
  for (let n = child; n; n = n.previousSibling) {
    if (n.nodeType === Node.ELEMENT_NODE && localName(n) === "bdiv") return n;
  }
  return null;
}

function resolveSelectionElement(xmlEl) {
  if (!xmlEl) return null;
  const trackHost = findTrackSelectionHost(xmlEl);
  if (trackHost) return trackHost;
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

/**
 * Key → value arrows within each <field_item>. Each <value> pairs with its nearest
 * preceding <key> (values ahead of the first key pair with that first key); pairs
 * where either side lacks a bbox are skipped.
 * @returns {{ fromBox: object, toBox: object, fromElementId: string, toElementId: string }[]}
 */
function collectKeyValueLinks(segment, elementIds, boxes) {
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {{ fromBox: object, toBox: object, fromElementId: string, toElementId: string }[]} */
  const links = [];
  walkElements(segment, (el) => {
    if (localName(el) !== "field_item") return;
    const children = childElements(el);
    let key = children.find((c) => localName(c) === "key") ?? null;
    for (const child of children) {
      const tag = localName(child);
      if (tag === "key") {
        key = child;
        continue;
      }
      if (tag !== "value" || !key) continue;
      const keyId = elementIds.get(key);
      const valueId = elementIds.get(child);
      const keyBox = keyId ? boxById.get(keyId) : null;
      const valueBox = valueId ? boxById.get(valueId) : null;
      if (!keyBox || !valueBox) continue;
      links.push({ fromBox: keyBox, toBox: valueBox, fromElementId: keyId, toElementId: valueId });
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
    if (id) {
      state.pendingSelectElement = null;
      selectElement(id);
    }
    return;
  }
  state.pendingSelectElement = target;
  goToPage(page);
}

/**
 * Finds the nearest element with a navigable bbox before/after the current selection,
 * walking the document-wide reading order (so it can cross page boundaries).
 * @returns {Element | null}
 */
function bboxNavTarget(direction) {
  const order = state?.readingOrder;
  if (!order || !order.length) return null;
  const step = direction === "prev" ? -1 : 1;

  // While a page is still loading, the element being navigated to is pending, not yet selected: continue from it.
  const currentEl = selectedElementId ? state.idToElement?.get(selectedElementId) : state.pendingSelectElement;
  const currentIndex = currentEl ? state.readingOrderIndexByElement?.get(currentEl) : undefined;
  const startIndex = currentIndex !== undefined ? currentIndex : (direction === "prev" ? order.length : -1);

  for (let i = startIndex + step; i >= 0 && i < order.length; i += step) {
    if (hasOverlayBox(order[i]) && !isElementOverlayHidden(order[i])) return order[i];
  }
  return null;
}

function navigateBbox(direction) {
  const target = bboxNavTarget(direction);
  if (!target) return;
  const page = state.elementPageByEl.get(target);
  if (!page) return;
  if (page === state.currentPage) {
    const id = findElementIdOnPage(target);
    if (id) {
      state.pendingSelectElement = null; // a pending selection from an earlier step must not override this one
      selectElement(id);
    }
    return;
  }
  state.pendingSelectElement = target;
  goToPage(page);
}

function updateBboxNavButtons() {
  if (els.btnBboxPrev) els.btnBboxPrev.disabled = !state?.hasPageView || !bboxNavTarget("prev");
  if (els.btnBboxNext) els.btnBboxNext.disabled = !state?.hasPageView || !bboxNavTarget("next");
}

/** @returns {{ l: number, t: number, r: number, b: number } | null} bbox normalized by location resolution */
function normalizedHeadBBox(el) {
  const locs = headLocations(el);
  if (locs.length !== 4) return null;
  const [l, t, r, b] = locs.map((loc) => {
    const res = parseInt(loc.getAttribute("resolution") ?? "", 10);
    return parseInt(loc.getAttribute("value") ?? "0", 10) / (res > 0 ? res : 1);
  });
  return { l, t, r, b };
}

/** True when the caption's bbox lies above, or (vertically overlapping) left of, its host's bbox. */
function captionPrecedesHost(caption, host) {
  const c = normalizedHeadBBox(caption);
  const h = normalizedHeadBBox(host);
  if (!c || !h) return false;
  if (c.b <= h.t) return true;
  if (c.t >= h.b) return false;
  if (c.r <= h.l) return true;
  if (c.l >= h.r) return false;
  return (c.t + c.b) / 2 < (h.t + h.b) / 2;
}

/** @returns {Element[]} */
function computeReadingOrder(docRoot) {
  const bodyChildren = childElements(docRoot).filter((el) => localName(el) !== "head");
  /** @type {Element[]} */
  const order = [];

  function record(el) {
    if (!isReadingOrderUnit(el)) return;
    order.push(el);
  }

  // Document order. A cross-reference (<xref>) does not move what it points at into the flow: xrefs have
  // arrows of their own, so the reading order stays what the document says.
  function walkChildren(parent, skip = null) {
    for (const child of parent.childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      if (skip?.has(child)) continue;
      const tag = localName(child);
      if (tag === "xref" || tag === "page_break" || tag === "custom") continue;
      visitElement(child);
    }
  }

  function visitElement(el) {
    // A caption placed above or left of its host is read before it, otherwise after it.
    // The host's contents (e.g. a picture's text) belong to the host's own traversal, so they
    // come right after it and the caption — wherever it sits in the source — goes around that.
    const captions = childElements(el).filter((c) => localName(c) === "caption");
    const before = captions.filter((c) => captionPrecedesHost(c, el));
    const after = captions.filter((c) => !before.includes(c));
    before.forEach(visitElement);
    record(el);
    walkChildren(el, new Set(captions));
    after.forEach(visitElement);
  }

  for (const el of bodyChildren) {
    if (localName(el) === "page_break" || localName(el) === "custom") continue;
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

/** Contents of a table (or tabular) — the table-contents overlay toggle; index contents are separate. */
function isTableOnlyContentElement(el) {
  return isOtslContentElementOf(el, TABLE_CONTENT_CONTAINER_TAGS);
}

/** Contents of an index — the index-contents overlay toggle. */
function isIndexContentElement(el) {
  return isOtslContentElementOf(el, INDEX_CONTENT_CONTAINER_TAGS);
}

function isOtslContentElementOf(el, containerTags) {
  if (!el) return false;
  const tag = localName(el);
  if (OTSL_CONTAINER_TAGS.has(tag) || tag === "caption") return false;
  let node = el.parentElement;
  while (node) {
    if (containerTags.has(localName(node))) return true;
    node = node.parentElement;
  }
  return false;
}

/** True when the element is drawn as a bbox on the page view (contents included; see isElementOverlayHidden). */
function hasOverlayBox(el) {
  if (!isReadingOrderUnit(el)) return false;
  if (headLocations(el).length === 4) return true;
  return isVirtualTextOverlayUnit(el);
}

/** @returns {{ box: object, elementId: string }[]} */
function collectReadingOrderSteps(segment, elementIds, boxes, readingOrder) {
  const boxById = new Map(boxes.map((b) => [b.elementId, b]));
  /** @type {{ box: object, elementId: string }[]} */
  const steps = [];

  readingOrder.forEach((el) => {
    const elementId = elementIds.get(el);
    if (!elementId) return;
    const box = boxById.get(elementId);
    if (!box) return;
    steps.push({ box, elementId });
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
    // <custom> carries opaque vendor data: nothing inside it is document content.
    if (localName(node) === "custom") continue;
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
    "group", "footnote", "page_header", "page_footer", "caption", "track",
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

function boxCenter(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function ensureArrowMarker(defs, markerId, opts = {}) {
  const size = opts.size ?? ARROW_STYLE_FIELD_DEFAULTS.head;
  const color = opts.color || "currentColor";
  defs.querySelector(`#${markerId}`)?.remove();
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 6 6");
  marker.setAttribute("refX", "6");
  marker.setAttribute("refY", "3");
  marker.setAttribute("markerWidth", String(size));
  marker.setAttribute("markerHeight", String(size));
  marker.setAttribute("orient", "auto");
  const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrowPath.setAttribute("d", "M0,0 L6,3 L0,6 Z");
  arrowPath.setAttribute("fill", color);
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
}

/** @returns {{ color?: string, width: number, head: number, style: string }} */
function getArrowStyle(layerKey) {
  const meta = ARROW_LAYERS[layerKey];
  const stored = arrowStyles[layerKey] ?? {};
  return {
    color: stored.color,
    width: stored.width ?? ARROW_STYLE_FIELD_DEFAULTS.width,
    head: stored.head ?? ARROW_STYLE_FIELD_DEFAULTS.head,
    style: stored.style ?? meta.defaultStyle,
  };
}

/** Resolve an arrow colour to a concrete value, falling back to the theme CSS variable. */
function resolveArrowColor(layerKey) {
  const stored = arrowStyles[layerKey]?.color;
  if (stored) return stored;
  const meta = ARROW_LAYERS[layerKey];
  const themed = getComputedStyle(document.documentElement)
    .getPropertyValue(meta.colorVar)
    .trim();
  return themed || "currentColor";
}

/** @returns {{ size: number, color: string }} marker attributes for a layer. */
function arrowMarkerOptions(layerKey) {
  return { size: getArrowStyle(layerKey).head, color: resolveArrowColor(layerKey) };
}

function loadArrowStyles() {
  try {
    const raw = localStorage.getItem(ARROW_STYLE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function persistArrowStyles() {
  try {
    localStorage.setItem(ARROW_STYLE_STORAGE_KEY, JSON.stringify(arrowStyles));
  } catch {
    /* storage unavailable — keep in-memory only */
  }
}

/** Push the current arrow-style overrides onto the document as CSS custom properties. */
function applyArrowStyleVars() {
  const root = document.documentElement.style;
  for (const [layerKey, meta] of Object.entries(ARROW_LAYERS)) {
    const stored = arrowStyles[layerKey] ?? {};
    const prefix = `--arrow-${meta.cssKey}`;
    setCssVar(root, `${prefix}-color`, stored.color);
    setCssVar(root, `${prefix}-width`, stored.width != null ? String(stored.width) : null);
    if (stored.style != null) {
      root.setProperty(`${prefix}-dash`, ARROW_DASH_VALUES[stored.style] ?? "none");
      root.setProperty(`${prefix}-cap`, stored.style === "dotted" ? "round" : "butt");
    } else {
      root.removeProperty(`${prefix}-dash`);
      root.removeProperty(`${prefix}-cap`);
    }
  }
}

function setCssVar(styleDecl, name, value) {
  if (value == null || value === "") styleDecl.removeProperty(name);
  else styleDecl.setProperty(name, value);
}

/** Rebuild the arrowhead markers of the live overlay so head size / colour changes take effect. */
function refreshArrowMarkers() {
  const svg = els.pagePane?.querySelector("svg.overlay");
  const defs = svg?.querySelector("defs");
  if (!defs) return;
  for (const [layerKey, meta] of Object.entries(ARROW_LAYERS)) {
    if (defs.querySelector(`#${meta.markerId}`)) {
      ensureArrowMarker(defs, meta.markerId, arrowMarkerOptions(layerKey));
    }
  }
}

function initArrowStyleControls() {
  applyArrowStyleVars();
  const panel = els.pageSettingsPanel;
  if (!panel) return;
  enhanceArrowRangeInputs();
  populateArrowStyleControls();
  panel.addEventListener("input", onArrowStyleInput);
  panel.addEventListener("change", onArrowStyleInput);
  panel.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-arrow-style-toggle]");
    if (btn) toggleArrowStyleFields(btn.dataset.arrowStyleToggle);
  });
  els.overlaysReset?.addEventListener("click", resetAllOverlaySettings);
}

/** "Reset all": overlay selection back to defaults + arrow styling back to theme defaults. */
function resetAllOverlaySettings() {
  arrowStyles = {};
  persistArrowStyles();
  populateArrowStyleControls();
  applyArrowStyleVars();
  refreshArrowMarkers();
  for (const key of Object.keys(ARROW_LAYERS)) toggleArrowStyleFields(key, false);
  toggleArrowStyleFields("layers", false);
  toggleArrowStyleFields("types", false);
  resetOverlayPrefs();
}

/** Expand/collapse one collapsible settings panel (arrow-layer style fields, or any other row using the same disclosure pattern). */
function toggleArrowStyleFields(layerKey, force) {
  const panel = els.pageSettingsPanel;
  const btn = panel?.querySelector(`[data-arrow-style-toggle="${layerKey}"]`);
  const fields = document.getElementById(`arrow-fields-${layerKey}`);
  if (!btn || !fields) return;
  const expand = force ?? fields.hidden;
  fields.hidden = !expand;
  btn.setAttribute("aria-expanded", String(expand));
}

/** Collapse style controls for any arrow layer whose row is currently disabled. */
function collapseDisabledArrowFields() {
  const panel = els.pageSettingsPanel;
  if (!panel) return;
  for (const btn of panel.querySelectorAll("[data-arrow-style-toggle]")) {
    const row = btn.closest(".arrow-layer-row");
    if (row?.querySelector(".settings-option-disabled")) {
      toggleArrowStyleFields(btn.dataset.arrowStyleToggle, false);
    }
  }
}

/** Give each thickness/arrowhead range slider a live numeric readout beside it. */
function enhanceArrowRangeInputs() {
  const ranges = els.pageSettingsPanel?.querySelectorAll('input[type="range"][data-arrow-layer]');
  if (!ranges) return;
  for (const input of ranges) {
    if (input.parentElement?.classList.contains("arrow-field-control")) continue;
    const wrap = document.createElement("span");
    wrap.className = "arrow-field-control";
    input.replaceWith(wrap);
    wrap.append(input);
    const out = document.createElement("output");
    out.className = "arrow-field-value";
    out.setAttribute("aria-hidden", "true");
    wrap.append(out);
  }
}

function updateArrowRangeReadout(input) {
  const out = input.parentElement?.querySelector("output.arrow-field-value");
  if (out) out.textContent = input.value;
  input.title = input.value;
}

function populateArrowStyleControls() {
  const inputs = els.pageSettingsPanel?.querySelectorAll("[data-arrow-layer]");
  if (!inputs) return;
  for (const input of inputs) {
    const layerKey = input.dataset.arrowLayer;
    const field = input.dataset.arrowField;
    if (!ARROW_LAYERS[layerKey]) continue;
    if (field === "color") input.value = toHexColor(resolveArrowColor(layerKey));
    else if (field === "style") input.value = getArrowStyle(layerKey).style;
    else {
      input.value = String(getArrowStyle(layerKey)[field]);
      updateArrowRangeReadout(input);
    }
  }
}

function onArrowStyleInput(e) {
  const input = e.target.closest("[data-arrow-layer]");
  if (!input) return;
  const layerKey = input.dataset.arrowLayer;
  const field = input.dataset.arrowField;
  if (!ARROW_LAYERS[layerKey]) return;

  const bucket = arrowStyles[layerKey] ?? (arrowStyles[layerKey] = {});
  if (field === "color") bucket.color = input.value;
  else if (field === "style") bucket.style = input.value;
  else {
    bucket[field] = Number(input.value);
    updateArrowRangeReadout(input);
  }

  persistArrowStyles();
  applyArrowStyleVars();
  refreshArrowMarkers();
}

/** Best-effort conversion of a CSS colour to `#rrggbb` for a native colour input. */
function toHexColor(value) {
  const v = (value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v.slice(1).split("").map((c) => c + c).join("").toLowerCase()}`;
  }
  const m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (m) {
    const hex = m.slice(1, 4).map((n) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))).toString(16).padStart(2, "0")).join("");
    return `#${hex}`;
  }
  return "#000000";
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

function appendOverlayLinks(svg, img, links, { markerId, markerLayer, linkClass, fromIdAttr, toIdAttr }) {
  if (!links.length) return;

  const defs = ensureOverlayDefs(svg);
  ensureArrowMarker(defs, markerId, arrowMarkerOptions(markerLayer));

  for (const link of links) {
    const from = boxPixelRect(link.fromBox ?? link.captionBox, img);
    const to = boxPixelRect(link.toBox ?? link.hostBox, img);
    const start = boxCenter(from);
    const end = boxCenter(to);

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
    markerLayer: "caption",
    linkClass: "caption-link",
    fromIdAttr: "data-caption-id",
    toIdAttr: "data-host-id",
  });
}

function appendXrefLinks(svg, img, xrefLinks) {
  appendOverlayLinks(svg, img, xrefLinks, {
    markerId: "xref-arrowhead",
    markerLayer: "xref",
    linkClass: "xref-link",
    fromIdAttr: "data-xref-from-id",
    toIdAttr: "data-xref-to-id",
  });
}

function appendKeyValueLinks(svg, img, keyValueLinks) {
  appendOverlayLinks(svg, img, keyValueLinks, {
    markerId: "key-value-arrowhead",
    markerLayer: "keyValue",
    linkClass: "key-value-link",
    fromIdAttr: "data-key-id",
    toIdAttr: "data-value-id",
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
  ensureArrowMarker(defs, "fragment-arrowhead", arrowMarkerOptions("fragment"));
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
      const start = boxCenter(fromRect);
      const end = boxCenter(toRect);

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
      const elementAnchor = boxCenter(fromRect);
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
  if (steps.length < 2) return;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "reading-order-layer");
  svg.appendChild(group);
  redrawReadingOrderArrows(svg, img, steps);
}

/** Draws the arrow chain through the boxes the layer/type/contents selections leave visible. */
function redrawReadingOrderArrows(svg, img, steps) {
  const group = svg.querySelector(".reading-order-layer");
  if (!group) return;
  group.replaceChildren();
  const visible = steps.filter((step) => !isContentsOptionHidden(step.elementId, false));
  if (visible.length >= 2) {
    const defs = ensureOverlayDefs(svg);
    ensureArrowMarker(defs, "reading-order-arrowhead", arrowMarkerOptions("readingOrder"));

    for (let i = 0; i < visible.length - 1; i += 1) {
      const from = boxPixelRect(visible[i].box, img);
      const to = boxPixelRect(visible[i + 1].box, img);
      const start = boxCenter(from);
      const end = boxCenter(to);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "reading-order-step");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("marker-end", "url(#reading-order-arrowhead)");
      group.appendChild(line);
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

function buildOverlay(img, boxes, captionLinks = [], xrefLinks = [], readingOrderSteps = [], keyValueLinks = [], fragmentLinks = [], fragmentNavItems = [], defaultResolution = { width: 512, height: 512 }) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("overlay");
  svg.setAttribute("viewBox", `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
  svg.setAttribute("overflow", "hidden");

  appendCaptionLinks(svg, img, captionLinks);
  appendXrefLinks(svg, img, xrefLinks);
  appendKeyValueLinks(svg, img, keyValueLinks);
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

function isLayoutLayerHidden(layer) {
  if (layer === "furniture") return !showLayoutFurniture;
  if (layer === "background") return !showLayoutBackground;
  return !showLayoutBody;
}

/** True when the layer, type and contents selections in the Overlays panel hide this element's bbox. */
function isElementOverlayHidden(el) {
  if (!showPictureContents && isPictureContentElement(el)) return true;
  if (!showTableContents && isTableOnlyContentElement(el)) return true;
  if (!showIndexContents && isIndexContentElement(el)) return true;
  if (isLayoutLayerHidden(elementLayer(el))) return true;
  return hiddenOverlayTypes.has(overlayTypeOf(el));
}

function isContentsOptionHidden(elementId, clickVisible) {
  if (clickVisible) return false;
  const el = state?.idToElement?.get(elementId);
  return Boolean(el) && isElementOverlayHidden(el);
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

  for (const el of els.pagePane.querySelectorAll(".key-value-link")) {
    el.classList.toggle("bbox-hidden", !showAllBboxes || !showKeyValueLinks);
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

  const overlaySvg = els.pagePane.querySelector("svg.overlay");
  const overlayImg = els.pagePane.querySelector(".page-view img");
  if (overlaySvg && overlayImg) {
    redrawReadingOrderArrows(overlaySvg, overlayImg, state.pageViewOverlay?.readingOrderSteps ?? []);
  }
  updateBboxNavButtons();

  for (const el of els.pagePane.querySelectorAll(".reading-order-step")) {
    if (!showAllBboxes || !showReadingOrder) {
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
  // Scoped to `.rendered-doc` (the pageless-view root) so this never matches a
  // `.rendered-el` inside the paged view's `.paged-canvas`, which shares the same
  // container and the same data-element-id values but has its own selection
  // handling (`.paged-el-slot.selected`, below).
  const direct =
    els.renderedPane.querySelector(`.rendered-doc .rendered-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.renderedPane.querySelector(`.rendered-doc .rendered-el[data-element-id="${elementId}"]`);
  if (direct) return direct;

  const xmlEl = state?.idToElement?.get(elementId);
  const threadId = xmlEl ? elementThreadId(xmlEl) : null;
  if (!threadId) return null;

  const merged = els.renderedPane.querySelector(
    `.rendered-doc .rendered-fragment-merged[data-thread-id="${threadId}"]`,
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
  applySelectionCore();
  syncSelectionEditUi();
}

function applySelectionCore() {
  updateBboxNavButtons();
  els.markupPane?.querySelectorAll(".markup-el.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  els.renderedPane?.querySelectorAll(".rendered-el.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  els.renderedPane?.querySelectorAll(".paged-el-slot.selected").forEach((el) => {
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

  const pagedSlot = els.renderedPane?.querySelector(`.paged-el-slot[data-element-id="${selectedElementId}"]`);
  if (pagedSlot) pagedSlot.classList.add("selected");

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
    // Clicking an alternative renders it; clicking the replaced host restores the original.
    const altOption = e.target.closest(".markup-alt-option");
    if (altOption) {
      e.stopPropagation();
      chooseAlternative(Number(altOption.dataset.altHost), Number(altOption.dataset.altOpt));
      return;
    }
    const altRestore = e.target.closest("[data-alt-restore]");
    if (altRestore) {
      e.stopPropagation();
      chooseAlternative(Number(altRestore.dataset.altRestore), null);
      return;
    }
    const elementId = resolveMarkupClickTarget(e.target);
    if (elementId) {
      selectElement(elementId);
      seekTrackToElement(elementId);
    }
  });
  return root;
}

/** Selecting a cue block in the source view seeks the track's player to it. */
function seekTrackToElement(elementId) {
  const row = els.renderedPane?.querySelector(
    `.rendered-doc .rendered-track-cue[data-element-id="${elementId}"]`,
  );
  row?.trackSeek?.();
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

/** A track in the source view: each cue block (a `<bdiv/>` and its content) is one selectable unit. */
function buildMarkupTrack(el, depth, elementIds) {
  return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
    const nodes = [...el.childNodes];
    let i = 0;
    while (i < nodes.length && !isTrackBdiv(nodes[i])) i += 1;
    appendMarkupNodesFromSlice(children, childDepth, nodes.slice(0, i), elementIds);
    while (i < nodes.length) {
      const bdiv = nodes[i];
      let end = i + 1;
      while (end < nodes.length && !isTrackBdiv(nodes[end])) end += 1;
      const block = document.createElement("div");
      block.className = "markup-el markup-el-cue";
      const elementId = elementIds.get(bdiv);
      if (elementId) block.setAttribute("data-element-id", elementId);
      const bdivBlock = buildMarkupElement(bdiv, childDepth, elementIds);
      bdivBlock.removeAttribute?.("data-element-id"); // the cue block carries the id
      block.appendChild(bdivBlock);
      appendMarkupNodesFromSlice(block, childDepth, nodes.slice(i + 1, end), elementIds);
      children.appendChild(block);
      i = end;
    }
  });
}

function isTrackBdiv(node) {
  return node.nodeType === Node.ELEMENT_NODE && localName(node) === "bdiv";
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

function markAlternativeBlock(block, el) {
  const altOption = state?.altOptions?.get(el);
  if (!altOption) return;
  block.classList.add("markup-alt-option");
  block.classList.toggle("markup-alt-active", altOption.active);
  block.dataset.altHost = String(altOption.host);
  block.dataset.altOpt = String(altOption.opt);
  block.title = altOption.active ? "Click to restore the original" : "Click to render this alternative";
}

function buildMarkupElement(el, depth, elementIds) {
  const tag = localName(el);
  // A chosen alternative swaps elements in the parsed document; the source view keeps
  // showing the document as written: the replaced host in place, its replacements hidden.
  if (state?.altReplacements?.has(el)) return document.createDocumentFragment();
  const replaced = state?.altInactive?.get(el);
  if (replaced) {
    const hostEl = childElements(el)[0];
    if (!hostEl) return document.createDocumentFragment();
    const hostBlock = buildMarkupElement(hostEl, depth, elementIds);
    const firstId = elementIds.get(replaced.replacement[0]);
    if (firstId) hostBlock.setAttribute("data-element-id", firstId);
    hostBlock.dataset.altRestore = String(replaced.host);
    hostBlock.title = "Click to restore the original";
    return hostBlock;
  }
  if (tag === "list") return buildMarkupList(el, depth, elementIds);
  if (tag === "track") return buildMarkupTrack(el, depth, elementIds);
  if (OTSL_CONTAINER_TAGS.has(tag)) return buildMarkupOtslContainer(el, depth, elementIds);

  const block = document.createElement("div");
  block.className = "markup-el";
  const elementId = elementIds.get(el);
  if (elementId) block.setAttribute("data-element-id", elementId);
  markAlternativeBlock(block, el);

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
  // Preserved <content> text keeps its trailing whitespace (and any hyphen) across the join.
  if (lastText.parentElement?.closest(".rendered-content")) return;
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

function buildPagedView(segment, elementIds, boxes, defaultResolution) {
  if (!segmentHasMarkup(segment)) {
    const placeholder = document.createElement("div");
    placeholder.className = "placeholder";
    placeholder.innerHTML = NO_MARKUP;
    return placeholder;
  }

  const boxById = new Map(boxes.map((b) => [b.elementId, b]));

  const canvas = document.createElement("div");
  canvas.className = "paged-canvas";
  const resW = defaultResolution?.width || 1;
  const resH = defaultResolution?.height || 1;
  canvas.style.aspectRatio = `${resW} / ${resH}`;
  canvas.dataset.aspectW = String(resW);
  canvas.dataset.aspectH = String(resH);

  const makeSlot = (elementId, box, node) => {
    const slot = document.createElement("div");
    slot.className = "paged-el-slot";
    slot.setAttribute("data-element-id", elementId);
    slot.style.left = `${(box.x0 / box.resW) * 100}%`;
    slot.style.top = `${(box.y0 / box.resH) * 100}%`;
    slot.style.width = `${((box.x1 - box.x0) / box.resW) * 100}%`;
    slot.style.height = `${((box.y1 - box.y0) / box.resH) * 100}%`;
    const layer = node?.getAttribute?.("data-doclang-layer");
    // Mirror the layer onto the slot itself (not just the element it wraps) so the
    // show/hide-furniture/background CSS below can hide the whole slot — including its
    // dashed bbox outline — rather than leaving an empty outlined box behind.
    if (layer) slot.setAttribute("data-doclang-layer", layer);
    // Slots stack in DOM order by default, which lets a large `background`-layer
    // picture (e.g. a full-page illustration) paint over body text that merely
    // happens to come earlier in document order. Sink background slots below
    // everything else regardless of order; leave body/furniture stacking as-is.
    slot.style.zIndex = layer === "background" ? "0" : "1";
    slot.appendChild(node);
    if (node?.dataset?.rewrittenLatex) slot.appendChild(makeFormulaRewriteBadge(node.dataset.rewrittenLatex));
    canvas.appendChild(slot);
  };

  // Unlike the linear reading view, thread-linked fragments (elements sharing a
  // <thread> id) are NOT merged into one block here — each fragment keeps its own
  // bbox on the page, so it's rendered and positioned independently.
  const placeElement = (el) => {
    if (el.nodeType !== Node.ELEMENT_NODE) return;
    if (localName(el) === "page_break") return;

    // Each list item (<ldiv>) has its own bbox distinct from the list's overall
    // bbox — render every item into its own slot instead of one slot for the
    // whole list, mirroring the earlier caption/fragment bbox-per-element approach.
    if (localName(el) === "list") {
      const ordered = (el.getAttribute("class") ?? "unordered") === "ordered";
      collectListItems(el, elementIds).forEach(({ ldiv, li }, index) => {
        const itemId = elementIds.get(ldiv);
        const itemBox = itemId ? boxById.get(itemId) : null;
        if (!itemId || !itemBox) {
          // Complex item: the <ldiv> carries no bbox and its content (headings, text,
          // …) are sibling blocks with their own locations — slot each one directly.
          const markerEl = childElements(ldiv).find((c) => localName(c) === "marker");
          const before = canvas.children.length;
          for (const block of listItemBlockElements(el, ldiv)) placeElement(block);
          // The marker has no bbox of its own: show it at the start of the item's first slot.
          const firstSlot = canvas.children[before];
          if (markerEl && firstSlot) {
            // Inside the first text block (not before it) so the marker stays on its line.
            const host = firstSlot.querySelector("p, h1, h2, h3, h4, h5, h6") ?? firstSlot.firstChild;
            host?.prepend(renderMarkerElement(markerEl, elementIds, { inline: true }));
          }
          return;
        }
        const singleItemList = document.createElement(ordered ? "ol" : "ul");
        if (ordered) singleItemList.start = index + 1;
        singleItemList.appendChild(li);
        makeSlot(itemId, itemBox, wrapRendered(ldiv, singleItemList, itemId));
      });
      return;
    }

    // A <field_region> and its <field_item> children carry no bbox of their own
    // (only <key>/<value>/<hint> leaves do) — the generic path below would silently
    // drop the whole region, since `boxById.get(elementId)` finds nothing for it.
    // Render each leaf into its own slot instead, same as list items above.
    if (localName(el) === "field_region") {
      for (const item of childElements(el)) {
        if (localName(item) !== "field_item") continue;
        for (const child of childElements(item)) {
          const tag = localName(child);
          const node =
            tag === "key" ? renderFieldKeyElement(child, elementIds, {}) :
            tag === "value" ? renderFieldValueElement(child, elementIds, {}) :
            tag === "hint" ? renderFieldHintElement(child, elementIds, {}) :
            null;
          if (!node) continue;
          const childId = elementIds.get(child);
          const childBox = childId ? boxById.get(childId) : null;
          if (childId && childBox) makeSlot(childId, childBox, node);
        }
      }
      return;
    }

    // A <group> usually has no bbox of its own (only its members do), so the generic path
    // below would drop it along with everything inside. Place each member in its own slot.
    if (localName(el) === "group" && !boxById.has(elementIds.get(el))) {
      for (const child of childElements(el)) placeElement(child);
      return;
    }

    // A bbox-less wrapper (e.g. a <heading> around a <field_region>, or a <text> made of
    // several located <text>/<picture>/<value> parts) can't be positioned itself: place
    // each located child in its own slot instead of dropping the lot.
    if (!boxById.has(elementIds.get(el))) {
      const parts = childElements(el).filter((c) => RENDER_BLOCK_TAGS.has(localName(c)) || localName(c) === "field_region");
      if (parts.length) {
        parts.forEach(placeElement);
        return;
      }
    }

    const rendered = renderBlockElement(el, elementIds, { inline: false, paged: true });
    if (!rendered) return;

    const elementId = elementIds.get(el);
    const box = boxById.get(elementId);
    if (box) makeSlot(elementId, box, rendered);

    // Captions are rendered by their host (picture/table/group) with `ctx.paged`
    // set, which suppresses that embedding — render them here instead, in their
    // own bbox, since captions have their own independent location in the source.
    const captionEl = readCaptionElement(el);
    if (captionEl) {
      const captionId = elementIds.get(captionEl);
      const captionBox = captionId ? boxById.get(captionId) : null;
      if (captionId && captionBox) {
        makeSlot(captionId, captionBox, renderEmbeddedCaption(captionEl, elementIds, "figcaption"));
      }
    }
  };
  for (const el of segment) placeElement(el);

  // Safety net: every bbox in the source should show up. Anything the structural
  // cases above didn't place (and that isn't already rendered inside another slot,
  // e.g. a table cell) gets its own slot at its own bbox.
  const elById = new Map([...elementIds].map(([el, id]) => [id, el]));
  const isPlaced = (id) => id && canvas.querySelector(`[data-element-id="${CSS.escape(id)}"]`);
  for (const box of boxes) {
    if (isPlaced(box.elementId)) continue;
    const el = elById.get(box.elementId);
    if (!el) continue;
    // A container whose parts were placed individually (e.g. a <list> and its items,
    // both with bboxes) is already shown — rendering it again would duplicate content.
    // Give it an empty slot for its own bbox instead, beneath its parts so they stay clickable.
    if ([...el.getElementsByTagName("*")].some((d) => isPlaced(elementIds.get(d)))) {
      makeSlot(box.elementId, box, document.createElement("div"));
      canvas.insertBefore(canvas.lastChild, canvas.firstChild);
      continue;
    }
    const tag = localName(el);
    let node =
      tag === "key" ? renderFieldKeyElement(el, elementIds, {}) :
      tag === "value" ? renderFieldValueElement(el, elementIds, {}) :
      tag === "hint" ? renderFieldHintElement(el, elementIds, {}) :
      renderBlockElement(el, elementIds, { inline: false, paged: true });
    if (!node) {
      node = document.createElement("span");
      node.className = "rendered-el";
      appendRenderedBody(node, el, elementIds, { inline: true, paged: true });
    }
    makeSlot(box.elementId, box, node);
  }

  canvas.addEventListener("click", (e) => {
    // Fall back to the slot itself for boxes with no rendered content (empty text, container bboxes).
    const elementId = resolveRenderedClickTarget(e.target)
      ?? e.target.closest(".paged-el-slot")?.getAttribute("data-element-id");
    if (elementId) selectElement(elementId);
  });
  applyReadingLayerClasses(canvas);

  // Initial fit happens synchronously via fitPagedCanvas(), called by renderPage()
  // right after this canvas is appended to the DOM (and again whenever the canvas
  // is resized or its aspect ratio is corrected once the real page image loads).

  return canvas;
}

/**
 * Sizes a paged-view slot's content to use the maximum space its bbox allows, by
 * binary-searching a CSS `zoom` factor (not `transform: scale`) so text re-wraps at
 * each candidate size instead of being scaled after wrapping at a fixed size — this
 * both shrinks content that overflows and grows content that has room to spare, up
 * to whatever the box's width and height allow without overflowing either (including a
 * single word that is wider than the box and so cannot wrap).
 */
function fitSlotContent(slot) {
  const content = slot.firstElementChild;
  if (!content) return;
  const slotRect = slot.getBoundingClientRect();
  const targetW = slotRect.width;
  const targetH = slotRect.height;
  if (!(targetW > 0 && targetH > 0)) return;

  // A block fills its slot's width however long its text is, so its own box never reveals horizontal overflow
  // (a word wider than the box, e.g. a chart label). The extent of the text itself does.
  const range = document.createRange();
  range.selectNodeContents(content);
  const fitsAt = (zoom) => {
    content.style.zoom = String(zoom);
    const rect = content.getBoundingClientRect();
    const text = range.getBoundingClientRect();
    return (
      rect.height <= targetH + 0.5 &&
      Math.max(rect.width, text.width) <= targetW + 0.5 &&
      text.height <= targetH + 0.5
    );
  };

  let lo = 0.02;
  let hi = 8;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (fitsAt(mid)) lo = mid;
    else hi = mid;
  }
  fitsAt(lo);
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
      const linkUri = safeLinkUri(readHrefUri(el));
      if (ctx?.inline) {
        // a <text> nested inside a <text> flows inline; with an <href> head it
        // is a hyperlink (DocLang: <text><href uri="…"/>label</text>).
        const span = document.createElement(linkUri ? "a" : "span");
        if (linkUri) {
          span.href = linkUri;
          span.target = "_blank";
          span.rel = "noopener noreferrer";
          span.className = "rendered-link";
        }
        appendRenderedBody(span, el, elementIds, { inline: true });
        return span;
      }
      const p = document.createElement("p");
      appendRenderedBody(p, el, elementIds, { inline: true });
      if (linkUri) {
        const a = document.createElement("a");
        a.href = linkUri;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "rendered-link";
        a.appendChild(p);
        return wrapRendered(el, a, elementId);
      }
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
    case "custom":
      return null;
    case "list":
      return renderList(el, elementIds);
    case "table":
    case "index":
    case "tabular":
      return renderOtslContainer(el, elementIds, ctx);
    case "code":
      return renderCode(el, elementIds, ctx);
    case "formula":
      return renderFormula(el, elementIds, ctx);
    case "picture":
      return renderPicture(el, elementIds, ctx);
    case "track":
      return renderTrack(el, elementIds, ctx);
    case "group": {
      const figure = document.createElement("figure");
      figure.className = "rendered-group";
      appendRenderedBodyBlocks(figure, el, elementIds);
      const captionEl = readCaptionElement(el);
      if (captionEl && !ctx?.paged) {
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

const INLINE_NESTABLE_TAGS = new Set([
  "text", "heading", "field_heading", "footnote", "page_header", "page_footer", "field_region", "field_item",
]);

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

  // Text-like elements and field regions nested in running text (a footer, caption, text…)
  // are part of that text: render them inline, like code and formulas.
  if (ctx.inline && INLINE_NESTABLE_TAGS.has(tag)) {
    // A <text> with an <href> head is a hyperlink.
    const linkUri = tag === "text" ? safeLinkUri(readHrefUri(node)) : null;
    const span = document.createElement(linkUri ? "a" : "span");
    span.className = `rendered-el rendered-inline rendered-${tag}${linkUri ? " rendered-link" : ""}`;
    if (linkUri) {
      span.href = linkUri;
      span.target = "_blank";
      span.rel = "noopener noreferrer";
    }
    const elementId = elementIds.get(node);
    if (elementId) span.setAttribute("data-element-id", elementId);
    applyElementLayerAttr(node, span);
    appendRenderedBody(span, node, elementIds, ctx);
    parent.appendChild(span);
    return;
  }

  // A picture nested in running text sits in the line like an inline image.
  if (ctx.inline && tag === "picture") {
    const rendered = renderBlockElement(node, elementIds, ctx);
    if (rendered) {
      rendered.classList.add("rendered-inline-picture");
      parent.appendChild(rendered);
    }
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
    span.className = "rendered-content";
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

function formulaSourceText(el) {
  const nodes = [...el.childNodes];
  let text = "";
  for (let i = skipElementHeadNodes(nodes, 0); i < nodes.length; i += 1) {
    text += nodes[i].textContent ?? "";
  }
  return text.trim();
}

// KaTeX has no eqnarray; align is its closest (numbered) equivalent.
function normalizeFormulaSource(source) {
  return source.replace(/\\(begin|end)\{eqnarray(\*?)\}/g, "\\$1{align$2}");
}

const equationNumberCounts = new WeakMap();

/** How many equation numbers KaTeX assigns to one formula (rows of align/equation without \\tag, \\nonumber, or a star). */
function formulaEquationNumberCount(el) {
  let count = equationNumberCounts.get(el);
  if (count === undefined) {
    count = 0;
    if (window.katex?.renderToString) {
      try {
        const html = window.katex.renderToString(normalizeFormulaSource(formulaSourceText(el)), {
          displayMode: true,
          throwOnError: true,
        });
        count = html.split('class="eqn-num"').length - 1;
      } catch {
        // Unrenderable formulas show no number.
      }
    }
    equationNumberCounts.set(el, count);
  }
  return count;
}

/** Equation numbers consumed by the display formulas in a page segment (formulas inside running text are inline). */
function countEquationNumbers(segment) {
  let total = 0;
  for (const top of segment) {
    if (top.nodeType !== Node.ELEMENT_NODE) continue;
    const formulas = localName(top) === "formula" ? [top] : [...top.getElementsByTagName("*")].filter((e) => localName(e) === "formula");
    for (const f of formulas) {
      const parent = localName(f.parentNode);
      if (parent === "text" || parent === "heading") continue;
      total += formulaEquationNumberCount(f);
    }
  }
  return total;
}

/** Renders the formula; returns the LaTeX actually fed to KaTeX when it differs from the source. */
function renderFormulaContent(target, el, displayMode) {
  const original = formulaSourceText(el);
  const source = normalizeFormulaSource(original);
  const rewritten = source !== original ? source : null;
  if (source && window.katex?.render) {
    try {
      window.katex.render(source, target, { displayMode, throwOnError: false });
      return rewritten;
    } catch {
      // Fall through to the raw-source fallback below.
    }
  }
  target.textContent = source;
  target.classList.add("rendered-formula-fallback");
  return rewritten;
}

function renderFormula(el, elementIds, ctx) {
  const span = document.createElement("span");
  span.className = ctx.inline ? "rendered-formula-inline" : "rendered-formula";
  const rewritten = renderFormulaContent(span, el, !ctx.inline);

  if (ctx.inline) {
    span.classList.add("rendered-el");
    const id = elementIds.get(el);
    if (id) span.setAttribute("data-element-id", id);
    return span;
  }

  const captionEl = readCaptionElement(el);
  if (!captionEl || ctx?.paged) return withRewriteBadge(wrapRendered(el, span, elementIds.get(el)), rewritten, ctx);

  const figure = document.createElement("figure");
  figure.className = "rendered-formula-figure";
  figure.appendChild(span);
  figure.appendChild(renderEmbeddedCaption(captionEl, elementIds, "figcaption"));
  return withRewriteBadge(wrapRendered(el, figure, elementIds.get(el)), rewritten, ctx);
}

function makeFormulaRewriteBadge(latex) {
  const badge = document.createElement("span");
  badge.className = "formula-rewrite-badge";
  badge.textContent = "i";
  badge.dataset.latex = latex;
  return badge;
}

/** Flags a wrapper whose LaTeX was rewritten before rendering, with a hover badge showing the result. */
function withRewriteBadge(wrapper, rewritten, ctx) {
  if (!rewritten) return wrapper;
  // Paged slots scale their content to fit, so makeSlot adds the badge outside the scaled box.
  if (ctx?.paged) wrapper.dataset.rewrittenLatex = rewritten;
  else wrapper.appendChild(makeFormulaRewriteBadge(rewritten));
  return wrapper;
}

function markPictureUnavailable(img) {
  img.classList.add("rendered-picture-unavailable");
  img.alt = "\u00A0";
  img.setAttribute("aria-label", PICTURE_UNAVAILABLE_ALT);
}

/** @type {Map<string, Promise<HTMLImageElement | null>>} */
const pageImageElementCache = new Map();

function loadPageImageElement(url) {
  if (!url) return Promise.resolve(null);
  let promise = pageImageElementCache.get(url);
  if (!promise) {
    promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    pageImageElementCache.set(url, promise);
  }
  return promise;
}

/** Crops the region `box` (in its own resW\u00D7resH document space) out of the full page image. */
function cropPageRegionToDataUrl(pageImg, box) {
  const resW = box.resW || pageImg.naturalWidth;
  const resH = box.resH || pageImg.naturalHeight;
  const scaleX = pageImg.naturalWidth / resW;
  const scaleY = pageImg.naturalHeight / resH;
  const sx = Math.max(0, box.x0 * scaleX);
  const sy = Math.max(0, box.y0 * scaleY);
  const sw = Math.min(pageImg.naturalWidth, box.x1 * scaleX) - sx;
  const sh = Math.min(pageImg.naturalHeight, box.y1 * scaleY) - sy;
  if (!(sw > 0) || !(sh > 0)) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx2d = canvas.getContext("2d");
  ctx2d.drawImage(pageImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/**
 * Fallback for a picture with no usable embedded asset: crop its region straight out of
 * the current page's scanned image (using the same element bbox the page-view overlay
 * draws), rather than showing the "unavailable" placeholder. Falls back to that
 * placeholder itself when no page image or bbox is available for this element.
 */
async function applyPictureCropFallback(img, el, elementIds) {
  const elementId = el ? elementIds.get(el) : null;
  const box = elementId ? state?.currentBoxes?.find((b) => b.elementId === elementId) : null;
  const pageUrl = box ? state?.pageImages?.get(state.currentPage) : null;
  const pageImg = pageUrl ? await loadPageImageElement(pageUrl) : null;
  const dataUrl = pageImg && box ? cropPageRegionToDataUrl(pageImg, box) : null;

  if (!dataUrl) {
    markPictureUnavailable(img);
    img.src = INVALID_PICTURE_SRC;
    return;
  }

  img.classList.remove("rendered-picture-unavailable");
  img.removeAttribute("aria-label");
  img.alt = "";
  img.src = dataUrl;
  img.addEventListener(
    "load",
    () => {
      const slot = img.closest(".paged-el-slot");
      if (slot) fitSlotContent(slot);
    },
    { once: true },
  );
}

function appendPictureFigureImage(figure, uri, captionEl, elementIds, ctx, el) {
  const img = document.createElement("img");
  figure.appendChild(img);

  const resolved = uri ? resolveArchiveUri(uri) : null;
  if (resolved) {
    img.alt = "";
    img.src = resolved;
    img.addEventListener("error", () => applyPictureCropFallback(img, el, elementIds), { once: true });
  } else {
    applyPictureCropFallback(img, el, elementIds);
  }

  if (captionEl && !ctx?.paged) {
    figure.appendChild(renderEmbeddedCaption(captionEl, elementIds, "figcaption"));
  }
}

function renderPicture(el, elementIds, ctx) {
  const figure = document.createElement("figure");
  const captionEl = readCaptionElement(el);
  const srcEl = childElements(el).find((c) => localName(c) === "src") ?? null;
  const uri = srcEl?.getAttribute("uri")?.trim() || null;

  appendPictureFigureImage(figure, uri, captionEl, elementIds, ctx, el);

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
      const rendered = renderOtslContainer(node, elementIds, ctx);
      if (rendered) figure.appendChild(rendered);
      i += 1;
      continue;
    }
    break;
  }

  if (!ctx?.paged) {
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

/* ------------------------------------------------------------------ *
 * <track> — time-aligned media transcript (PR doclang#175).
 * Barebones widget: native <video> + a derived chapter index + a
 * collapsible transcript. Cue blocks drive both; whole-track media is
 * resolved by track order (see buildTrackMedia).
 * ------------------------------------------------------------------ */

const TRACK_TS_RANK = { hours: 0, minutes: 1, seconds: 2, msecs: 3 };

/** Split a <track> body into cue blocks delimited by <bdiv/>. */
function parseTrackCues(el) {
  const cues = [];
  let cue = null;
  for (const node of el.childNodes) {
    const isEl = node.nodeType === Node.ELEMENT_NODE;
    if (isEl && localName(node) === "bdiv") {
      cue = {
        bdivEl: node, startEls: [], endEls: [], chapterEl: null, frameEl: null, audioEl: null,
        turns: [], phase: "start", lastRank: -1,
      };
      cues.push(cue);
      continue;
    }
    if (!cue) continue; // element head / whitespace before the first cue block
    if (isWhitespaceOnlyText(node)) continue;
    if (node.nodeType === Node.COMMENT_NODE) continue; // don't let comments break the timestamp runs

    if (isEl && TRACK_TS_TAGS.has(localName(node))) {
      const rank = TRACK_TS_RANK[localName(node)];
      if (cue.phase === "start") {
        // A non-increasing magnitude rank starts the (optional) end-time run.
        if (cue.startEls.length && rank <= cue.lastRank) {
          cue.phase = "end";
          cue.endEls.push(node);
        } else {
          cue.startEls.push(node);
        }
      } else if (cue.phase === "end") {
        cue.endEls.push(node);
      } else {
        cue.turns.push(node);
      }
      cue.lastRank = rank;
      continue;
    }

    // First non-timestamp node closes any timestamp run.
    if (cue.phase === "start" || cue.phase === "end") cue.phase = "body";
    if (isEl) {
      const tag = localName(node);
      if (tag === "chapter") { cue.chapterEl = node; continue; }
      if (tag === "frame") { cue.frameEl = node; continue; }
      if (tag === "audio") { cue.audioEl = node; continue; }
    }
    cue.turns.push(node);
  }
  return cues;
}

/** Sum <hours|minutes|seconds|msecs value=…/> elements to seconds. */
function trackTimestampSeconds(tsEls) {
  if (!tsEls?.length) return null;
  let seconds = 0;
  for (const tsEl of tsEls) {
    const v = Number(tsEl.getAttribute("value"));
    if (!Number.isFinite(v)) continue;
    switch (localName(tsEl)) {
      case "hours": seconds += v * 3600; break;
      case "minutes": seconds += v * 60; break;
      case "seconds": seconds += v; break;
      case "msecs": seconds += v / 1000; break;
      default: break;
    }
  }
  return seconds;
}

function formatTrackTime(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

function trackFrameUri(frameEl) {
  if (!frameEl) return null;
  const src = childElements(frameEl).find((c) => localName(c) === "src");
  return src?.getAttribute("uri")?.trim() || null;
}

/* ---- WebVTT: cue blocks -> native <track kind="captions"> overlay ---- */

const VTT_INLINE_TAG = { bold: "b", italic: "i", underline: "u" };

function vttEscape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function vttTimestamp(seconds) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = (s % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${ss}`;
}

/** Serialize a transcript node to the WebVTT cue-text tag subset (b/i/u + text). */
function nodeToVttInline(node) {
  if (isTextLikeNode(node)) return vttEscape(node.textContent.replace(/\s+/g, " "));
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const inner = [...node.childNodes].map(nodeToVttInline).join("");
  const tag = VTT_INLINE_TAG[localName(node)];
  return tag ? `<${tag}>${inner}</${tag}>` : inner;
}

/**
 * One cue block -> cue payload: a line per <voice> segment, wrapped in `<v Name>`
 * and prefixed with a visible `[Name] ` so the speaker shows in the overlay.
 */
function trackCuePayload(cue) {
  const lines = [];
  let voiceName = "";
  let buf = "";
  const flush = () => {
    const body = buf.replace(/\s+/g, " ").trim();
    if (!body) {
      buf = "";
      return;
    }
    lines.push(
      voiceName
        ? `<v ${vttEscape(voiceName)}>[${vttEscape(voiceName)}] ${body}`
        : body,
    );
    buf = "";
  };
  for (const node of cue.turns) {
    if (node.nodeType === Node.ELEMENT_NODE && localName(node) === "voice") {
      flush();
      voiceName = node.textContent.trim().replace(/\s+/g, " ");
      continue;
    }
    buf += nodeToVttInline(node);
  }
  flush();
  return lines.join("\n");
}

/** @returns {string | null} WebVTT document, or null if no timed text. */
function trackCuesToWebVTT(cues) {
  const timed = cues.map((cue) => ({
    start: trackTimestampSeconds(cue.startEls),
    end: trackTimestampSeconds(cue.endEls),
    payload: trackCuePayload(cue),
  }));
  const GAP = 0.001; // keep a hair before the next cue so a seek to a
                     // shared boundary never lights up two cues at once
  const out = ["WEBVTT", ""];
  let any = false;
  timed.forEach((cue, i) => {
    if (!Number.isFinite(cue.start) || !cue.payload) return;
    const next = timed.slice(i + 1).find((c) => Number.isFinite(c.start) && c.start > cue.start);
    let end = cue.end;
    if (!Number.isFinite(end) || end <= cue.start) {
      end = next ? next.start : cue.start + 4;
    }
    if (next && end >= next.start - GAP) end = next.start - GAP;
    if (end <= cue.start) end = cue.start + GAP;
    out.push(`${vttTimestamp(cue.start)} --> ${vttTimestamp(end)}`, cue.payload, "");
    any = true;
  });
  return any ? out.join("\n") : null;
}

/** Returns a seek(seconds) fn that waits for metadata and then plays. */
function makeTrackSeeker(video, enabled) {
  return (seconds) => {
    if (!enabled || !Number.isFinite(seconds)) return;
    const doSeek = () => {
      try {
        video.currentTime = seconds;
      } catch {
        /* not seekable yet — ignore */
      }
      const played = video.play?.();
      if (played?.catch) played.catch(() => {});
    };
    if (video.readyState >= 1 /* HAVE_METADATA */) doSeek();
    else video.addEventListener("loadedmetadata", doSeek, { once: true });
  };
}

/** Highlight the chapter button whose start time contains the playhead. */
function wireActiveChapter(video, entries) {
  if (!entries.length) return;
  let active = -1;
  const update = () => {
    const t = video.currentTime + 0.25;
    let idx = -1;
    for (let i = 0; i < entries.length; i += 1) {
      if (t >= entries[i].start) idx = i;
      else break;
    }
    if (idx === active) return;
    if (active >= 0) {
      entries[active].btn.classList.remove("is-active");
      entries[active].btn.removeAttribute("aria-current");
    }
    if (idx >= 0) {
      entries[idx].btn.classList.add("is-active");
      entries[idx].btn.setAttribute("aria-current", "true");
    }
    active = idx;
  };
  video.addEventListener("timeupdate", update);
  video.addEventListener("seeked", update);
}

/**
 * Highlight the transcript row whose [start, end) contains the playhead and,
 * unless the viewer is scrolling the transcript by hand, keep it in view inside
 * the transcript's own scroll box (never scrolls the page/reading pane).
 */
function wireActiveTranscriptRow(media, entries, scrollBox) {
  if (!entries.length) return;
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    let end = e.end;
    if (!Number.isFinite(end) || end <= e.start) {
      const next = entries.slice(i + 1).find((n) => Number.isFinite(n.start) && n.start > e.start);
      end = next ? next.start : e.start + 4;
    }
    e.effEnd = end;
  }

  let active = -1;
  // Pause auto-scroll for a while after the viewer scrolls the box by hand.
  // Only real input gestures count — programmatic scrollTo fires "scroll" too.
  let userScrolledAt = 0;
  const markUserScroll = () => { userScrolledAt = performance.now(); };
  scrollBox.addEventListener("wheel", markUserScroll, { passive: true });
  scrollBox.addEventListener("touchmove", markUserScroll, { passive: true });
  scrollBox.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
      markUserScroll();
    }
  });

  const update = () => {
    const t = media.currentTime + 0.1;
    let idx = -1;
    for (let i = 0; i < entries.length; i += 1) {
      if (entries[i].start > t) break;
      if (t < entries[i].effEnd) { idx = i; break; }
    }
    if (idx === active) return;
    if (active >= 0) {
      entries[active].row.classList.remove("is-active");
      entries[active].row.removeAttribute("aria-current");
    }
    active = idx;
    syncMarkupPlayhead(idx < 0 ? null : entries[idx].elementId);
    if (idx < 0) return;
    const row = entries[idx].row;
    row.classList.add("is-active");
    row.setAttribute("aria-current", "true");

    if (performance.now() - userScrolledAt < 4000) return;
    scrollRowIntoView(row, scrollBox);
  };
  media.addEventListener("timeupdate", update);
  media.addEventListener("seeked", update);
}

let markupUserScrolledAt = 0;
{
  // Same courtesy as the transcript: stop following the playhead briefly after a
  // manual scroll of the source view.
  const mark = () => { markupUserScrolledAt = performance.now(); };
  els.markupPane?.addEventListener("wheel", mark, { passive: true });
  els.markupPane?.addEventListener("touchmove", mark, { passive: true });
  els.markupPane?.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) mark();
  });
}

/** Mirror the playing cue block into the source view (highlight, and follow it unless the viewer is scrolling). */
function syncMarkupPlayhead(elementId) {
  const pane = els.markupPane;
  if (!pane) return;
  pane.querySelectorAll(".markup-el-cue.is-playing").forEach((b) => b.classList.remove("is-playing"));
  if (!elementId) return;
  const block = pane.querySelector(`.markup-el-cue[data-element-id="${elementId}"]`);
  if (!block) return;
  block.classList.add("is-playing");
  if (performance.now() - markupUserScrolledAt < 4000) return;
  scrollRowIntoView(block, pane);
}

/** Center a transcript row within its own scroll box; no-op if already visible. */
function scrollRowIntoView(row, box) {
  const boxRect = box.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  if (rowRect.top >= boxRect.top && rowRect.bottom <= boxRect.bottom) return;
  const rowTop = rowRect.top - boxRect.top + box.scrollTop;
  box.scrollTop = Math.max(0, rowTop - (box.clientHeight - rowRect.height) / 2);
}

function appendTrackTurns(container, cue, elementIds) {
  let para = null;
  const flush = () => {
    if (para && para.textContent.trim()) container.appendChild(para);
    para = null;
  };
  const ensure = () => {
    if (!para) {
      para = document.createElement("p");
      para.className = "rendered-track-turn";
    }
    return para;
  };
  for (const node of cue.turns) {
    if (node.nodeType === Node.ELEMENT_NODE && localName(node) === "voice") {
      flush();
      const label = document.createElement("b");
      label.className = "rendered-track-voice";
      appendRenderedBody(label, node, elementIds, { inline: true });
      ensure().appendChild(label);
      para.appendChild(document.createTextNode(" "));
      continue;
    }
    appendRenderedNode(ensure(), node, elementIds, { inline: true });
  }
  flush();
}

function renderTrack(el, elementIds) {
  const figure = document.createElement("figure");
  figure.className = "rendered-track-figure";

  const cues = parseTrackCues(el);
  for (const cue of cues) {
    cue.start = trackTimestampSeconds(cue.startEls);
    cue.end = trackTimestampSeconds(cue.endEls);
  }

  const media = state?.trackMedia?.get(el) ?? null;
  const videoUrl = media?.videoUrl ?? null;
  const audioUrl = media?.audioUrl ?? null;
  const mediaUrl = videoUrl || audioUrl;

  // A track may carry both video/ and audio/. Video wins (it already carries
  // its own audio); the standalone audio file is kept as a fallback wired up
  // below in case the video can't be decoded.
  let mediaEl = document.createElement(videoUrl ? "video" : "audio");
  mediaEl.className = videoUrl ? "rendered-track-video" : "rendered-track-audio";
  mediaEl.controls = true;
  mediaEl.preload = "metadata";

  // <track> cover: the track's identity image (podcast art / title card). With
  // video it is a small avatar beside the caption (the video's own frames are
  // its poster, so the cover never gets stretched into the player); without a
  // video (audio-only, or no media at all) it is shown as its own centered
  // figure above the player — and, for audio, clicking it toggles playback.
  const coverEl = childElements(el).find((c) => localName(c) === "cover") ?? null;
  const coverSrc = coverEl ? childElements(coverEl).find((c) => localName(c) === "src") : null;
  const coverUri = coverSrc ? resolveArchiveUri(coverSrc.getAttribute("uri")?.trim() || "") : null;
  if (coverUri && !videoUrl) {
    const coverFig = document.createElement("figure");
    coverFig.className = "rendered-el rendered-track-cover";
    const coverId = elementIds.get(coverEl);
    if (coverId) coverFig.setAttribute("data-element-id", coverId);
    const img = document.createElement("img");
    img.src = coverUri;
    img.alt = "";
    img.loading = "lazy";
    if (audioUrl) {
      coverFig.classList.add("is-playable");
      img.addEventListener("click", () => {
        if (mediaEl.paused) {
          const played = mediaEl.play?.();
          if (played?.catch) played.catch(() => {});
        } else {
          mediaEl.pause();
        }
      });
    }
    coverFig.appendChild(img);
    const coverCaption = coverEl && childElements(coverEl).find((c) => localName(c) === "caption");
    if (coverCaption) {
      coverFig.appendChild(renderEmbeddedCaption(coverCaption, elementIds, "figcaption"));
    }
    figure.appendChild(coverFig);
  }

  if (videoUrl) {
    mediaEl.playsInline = true;
    const posterCue = cues.find((c) => c.frameEl);
    const posterUri = posterCue ? resolveArchiveUri(trackFrameUri(posterCue.frameEl)) : null;
    if (posterUri) mediaEl.poster = posterUri;
    if (media?.vttUrl) {
      const textTrack = document.createElement("track");
      textTrack.kind = "captions";
      textTrack.label = "Transcript";
      textTrack.srclang = el.getAttribute("lang") || "en";
      textTrack.default = true;
      textTrack.src = media.vttUrl;
      mediaEl.appendChild(textTrack);
    }
  }
  if (mediaUrl) mediaEl.src = mediaUrl;
  else mediaEl.hidden = true;
  figure.appendChild(mediaEl);

  // The track <caption> is the track's title, shown right under the player
  // (YouTube-style) — with the cover as an avatar beside it for video.
  const captionEl = readCaptionElement(el);
  if (captionEl || (coverUri && videoUrl)) {
    const info = document.createElement("div");
    info.className = "rendered-track-info";
    if (coverUri && videoUrl) {
      const avatar = document.createElement("img");
      avatar.className = "rendered-el rendered-track-avatar";
      const coverId = elementIds.get(coverEl);
      if (coverId) avatar.setAttribute("data-element-id", coverId);
      avatar.src = coverUri;
      avatar.alt = "";
      avatar.loading = "lazy";
      info.appendChild(avatar);
    }
    if (captionEl) info.appendChild(renderEmbeddedCaption(captionEl, elementIds, "figcaption"));
    figure.appendChild(info);
  }

  let seekTo = makeTrackSeeker(mediaEl, Boolean(mediaUrl));

  // --- transcript scaffold (rows filled in below) ---
  const details = document.createElement("details");
  details.className = "rendered-track-transcript";
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = "Transcript";
  details.appendChild(summary);
  const body = document.createElement("div");
  body.className = "rendered-track-transcript-body is-seekable";
  const rowEntries = [];

  /**
   * The one navigation primitive used by every timed control (chapter buttons,
   * transcript timecodes, transcript rows) across all three variants: seek the
   * media if there is any, and always bring the matching transcript row into
   * view with a brief flash so the jump is visible without a playhead.
   */
  const revealCue = (seconds) => {
    if (mediaUrl) seekTo(seconds);
    const entry = rowEntries.find(
      (e) => Number.isFinite(e.start) && Math.abs(e.start - seconds) < 0.001,
    );
    if (!entry) return;
    details.open = true;
    scrollRowIntoView(entry.row, body);
    entry.row.classList.add("is-cue-target");
    clearTimeout(entry.pulseTimer);
    entry.pulseTimer = setTimeout(() => entry.row.classList.remove("is-cue-target"), 1100);
  };

  const chapterCues = cues.filter((c) => c.chapterEl);
  const chapterEntries = [];
  if (chapterCues.length) {
    const chaptersLabel = document.createElement("p");
    chaptersLabel.className = "rendered-track-chapters-label";
    chaptersLabel.textContent = "Chapters";
    figure.appendChild(chaptersLabel);

    const list = document.createElement("ol");
    list.className = "rendered-track-chapters";
    for (const cue of chapterCues) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rendered-track-chapter";

      const thumbUri = cue.frameEl ? resolveArchiveUri(trackFrameUri(cue.frameEl)) : null;
      if (thumbUri) {
        const img = document.createElement("img");
        img.className = "rendered-track-thumb";
        img.src = thumbUri;
        img.alt = "";
        img.loading = "lazy";
        btn.appendChild(img);
      }

      const time = document.createElement("span");
      time.className = "rendered-track-time";
      time.textContent = formatTrackTime(cue.start);
      btn.appendChild(time);

      const name = document.createElement("span");
      name.className = "rendered-track-chapter-name";
      appendRenderedBody(name, cue.chapterEl, elementIds, { inline: true });
      btn.appendChild(name);

      btn.addEventListener("click", () => {
        revealCue(cue.start);
        const cueId = elementIds.get(cue.bdivEl);
        if (cueId) selectElement(cueId);
      });
      li.appendChild(btn);
      list.appendChild(li);
      chapterEntries.push({ start: cue.start ?? 0, btn });
    }
    figure.appendChild(list);
    wireActiveChapter(mediaEl, chapterEntries);
  }

  for (const cue of cues) {
    const row = document.createElement("div");
    row.className = "rendered-el rendered-track-cue";
    const cueId = elementIds.get(cue.bdivEl);
    if (cueId) row.setAttribute("data-element-id", cueId);
    row.trackSeek = () => revealCue(cue.start);
    // Click anywhere on the row navigates — but leave text selection and any
    // nested control (the timecode button) to do their own thing.
    row.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      if (!window.getSelection()?.isCollapsed) return;
      revealCue(cue.start);
    });

    const time = document.createElement("button");
    time.type = "button";
    time.className = "rendered-track-time rendered-track-time-btn";
    time.textContent = formatTrackTime(cue.start);
    time.addEventListener("click", () => revealCue(cue.start));
    row.appendChild(time);

    const turns = document.createElement("div");
    turns.className = "rendered-track-turns";
    if (cue.chapterEl) {
      const ch = document.createElement("p");
      ch.className = "rendered-track-cue-chapter";
      appendRenderedBody(ch, cue.chapterEl, elementIds, { inline: true });
      turns.appendChild(ch);
    }
    appendTrackTurns(turns, cue, elementIds);
    row.appendChild(turns);

    body.appendChild(row);
    rowEntries.push({ start: cue.start, end: cue.end, row, elementId: elementIds.get(cue.bdivEl) });
  }
  details.appendChild(body);
  figure.appendChild(details);
  if (mediaUrl) wireActiveTranscriptRow(mediaEl, rowEntries, body);

  // Fall back to the standalone audio file if the video element errors out.
  if (videoUrl && audioUrl) {
    mediaEl.addEventListener("error", () => {
      const fallback = document.createElement("audio");
      fallback.className = "rendered-track-audio";
      fallback.controls = true;
      fallback.preload = "metadata";
      fallback.src = audioUrl;
      mediaEl.replaceWith(fallback);
      mediaEl = fallback;
      seekTo = makeTrackSeeker(fallback, true);
      wireActiveChapter(fallback, chapterEntries);
      wireActiveTranscriptRow(fallback, rowEntries, body);
    }, { once: true });
  }

  return wrapRendered(el, figure, elementIds.get(el));
}

function renderVirtualTextBlock(hostEl, contentNodes, elementIds) {
  // Anything inlinable among running text stays inline, as in an explicit <text>.
  const hasRunningText = contentNodes.some((n) => isTextLikeNode(n) && !isWhitespaceOnlyText(n));
  const isBlock = (n) =>
    n.nodeType === Node.ELEMENT_NODE &&
    RENDER_BLOCK_TAGS.has(localName(n)) &&
    !(hasRunningText && (["code", "formula", "picture"].includes(localName(n)) || INLINE_NESTABLE_TAGS.has(localName(n))));
  const hasBlock = contentNodes.some(isBlock);
  const inner = document.createElement(hasBlock ? "div" : "p");
  for (const node of contentNodes) {
    if (isBlock(node)) {
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

/** @returns {{ ldiv: Element, li: HTMLLIElement }[]} */
function collectListItems(el, elementIds) {
  const nodes = [...el.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  /** @type {{ ldiv: Element, li: HTMLLIElement }[]} */
  const items = [];

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
        // An explicit marker replaces the browser's own list numbering/bullet.
        li.classList.add("has-marker");
        li.style.listStyle = "none";
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
    // With a marker the <li> is a flex row: keep the content in one block body so its
    // components (text, formula, …) stack instead of becoming side-by-side flex items.
    let host = li;
    if (li.classList.contains("has-marker")) {
      host = document.createElement("div");
      host.className = "rendered-li-body";
      li.appendChild(host);
    }
    appendRenderedSliceContent(host, ldiv, contentNodes, elementIds);

    items.push({ ldiv, li });
  }

  return items;
}

/** Block elements following `ldiv` in `list`, up to the next `ldiv`. */
function listItemBlockElements(list, ldiv) {
  const blocks = [];
  for (let n = ldiv.nextSibling; n && n.parentNode === list; n = n.nextSibling) {
    if (n.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = localName(n);
    if (tag === "ldiv") break;
    if (RENDER_BLOCK_TAGS.has(tag)) blocks.push(n);
  }
  return blocks;
}

function appendListItemsFromElement(list, el, elementIds) {
  for (const { li } of collectListItems(el, elementIds)) {
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

/**
 * The cell that actually occupies (row, col): the cell itself, or — for a covered
 * lcel/ucel/xcel position — the origin cell that spans over it.
 */
function otslOwnerAt(grid, row, col) {
  const cell = grid[row]?.[col];
  if (!cell) return null;
  return cell.covered ? cell.owner : { cell, row, col };
}

/** @returns {{ kind: string, token: Element, contentNodes: Node[], colspan: number, rowspan: number, covered?: boolean, owner?: object }[][]} */
function buildOtslGrid(rows) {
  const grid = [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    if (!grid[rowIdx]) grid[rowIdx] = [];
    let col = 0;

    for (const parsed of rows[rowIdx]) {
      const kind = parsed.kind;
      if (kind === "lcel" || kind === "ucel" || kind === "xcel") {
        // A span token continues whichever cell covers its left (lcel) or upper (ucel)
        // neighbour; xcel continues both. Following the neighbour's *owner* (not just
        // the nearest uncovered cell) keeps a span from leaking into unrelated cells
        // above when a merged cell is itself covered by a rowspan/colspan.
        const owner = kind === "ucel"
          ? otslOwnerAt(grid, rowIdx - 1, col)
          : otslOwnerAt(grid, rowIdx, col - 1) ?? otslOwnerAt(grid, rowIdx - 1, col);
        if (owner) {
          owner.cell.colspan = Math.max(owner.cell.colspan, col - owner.col + 1);
          owner.cell.rowspan = Math.max(owner.cell.rowspan, rowIdx - owner.row + 1);
        }
        grid[rowIdx][col] = { kind, token: parsed.token, contentNodes: [], colspan: 0, rowspan: 0, covered: true, owner };
        col += 1;
        continue;
      }

      grid[rowIdx][col] = {
        kind,
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

function renderOtslContainer(el, elementIds, ctx) {
  const table = document.createElement("table");
  table.className = "rendered-table";

  const captionEl = readCaptionElement(el);
  if (captionEl && !ctx?.paged) {
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
    // Keep fully covered rows: rowspans above still count them.
    tbody.appendChild(tr);
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
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mkv":
      return "video/x-matroska";
    case "mov":
      return "video/quicktime";
    case "ogv":
      return "video/ogg";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "ogg":
    case "opus":
      return "audio/ogg";
    case "wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}

/**
 * Resolve a picture @uri to a safe img src.
 * Only archive asset blob URLs and small raster data: URIs are allowed.
 * Remote, protocol-relative, blob:, and unresolved relative URIs are rejected.
 * @returns {string | null}
 */
function resolveArchiveUri(uri) {
  if (!uri) return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;

  if (SAFE_DATA_IMAGE_RE.test(trimmed)) {
    return trimmed.length <= MAX_DATA_IMAGE_URI_LENGTH ? trimmed : null;
  }

  // Reject any other scheme (http, https, blob, javascript, …) and protocol-relative URLs.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return null;

  return state?.assetUrls?.get(normalizeArchivePath(trimmed)) ?? null;
}

function revokeDocumentState(docState) {
  if (!docState) return;
  for (const url of docState.pageImages.values()) {
    pageImageElementCache.delete(url);
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  for (const url of docState.assetUrls.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  for (const m of docState.trackMedia?.values() ?? []) {
    if (m.vttUrl?.startsWith("blob:")) URL.revokeObjectURL(m.vttUrl);
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
    if (
      !e.name.endsWith("/")
      && (e.name.startsWith("assets/") || /^(?:audio|video)\/[^/]+$/i.test(e.name))
    ) {
      assetUrls.set(
        e.name,
        URL.createObjectURL(new Blob([e.data], { type: mimeFromAssetPath(e.name) })),
      );
    }
  }
  return { markupXml, pageImages, assetUrls };
}

async function unzip(buffer, { shouldExtract } = {}) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("ZIP decompression requires a browser with DecompressionStream support");
  }

  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  if (entryCount > ZIP_MAX_ENTRIES) {
    throw new Error("ZIP archive has too many entries");
  }
  if (centralDirOffset >= bytes.length) {
    throw new Error("Invalid ZIP central directory offset");
  }

  /** @type {{ name: string, data: Uint8Array }[]} */
  const entries = [];
  let offset = centralDirOffset;
  let totalUncompressed = 0;

  for (let i = 0; i < entryCount; i += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory");
    }

    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nameEnd = offset + 46 + nameLength;
    if (nameEnd > bytes.length) {
      throw new Error("Invalid ZIP entry name");
    }
    const rawName = new TextDecoder().decode(bytes.subarray(offset + 46, nameEnd));
    const name = normalizeZipEntryName(rawName);

    offset = nameEnd + extraLength + commentLength;
    if (offset > bytes.length) {
      throw new Error("Invalid ZIP central directory");
    }

    if (!name || name.endsWith("/") || isIgnoredArchiveEntry(name)) continue;
    if (shouldExtract && !shouldExtract(name)) continue;

    if (compressedSize > ZIP_MAX_ENTRY_COMPRESSED_BYTES || uncompressedSize > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) {
      throw new Error(`ZIP entry exceeds size limit: ${name}`);
    }
    if (
      compressedSize > 0 &&
      uncompressedSize > 0 &&
      uncompressedSize / compressedSize > ZIP_MAX_COMPRESSION_RATIO
    ) {
      throw new Error(`ZIP entry compression ratio exceeds limit: ${name}`);
    }
    if (totalUncompressed + uncompressedSize > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error("ZIP archive exceeds total uncompressed size limit");
    }

    if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      throw new Error(`Invalid ZIP local header: ${name}`);
    }
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > bytes.length) {
      throw new Error(`ZIP entry data out of bounds: ${name}`);
    }
    const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
    const data = await decompressZipEntry(compressed, compression, uncompressedSize);
    totalUncompressed += data.length;
    if (totalUncompressed > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error("ZIP archive exceeds total uncompressed size limit");
    }
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

function concatUint8Arrays(chunks, totalLength) {
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function decompressZipEntry(data, method, uncompressedSize) {
  if (method === 0) {
    if (data.length > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) {
      throw new Error("ZIP entry exceeds size limit");
    }
    return data;
  }
  if (method === 8) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) {
          throw new Error("ZIP entry exceeds size limit");
        }
        if (data.length > 0 && total / data.length > ZIP_MAX_COMPRESSION_RATIO) {
          throw new Error("ZIP entry compression ratio exceeds limit");
        }
        chunks.push(value);
      }
    } catch (err) {
      try {
        await reader.cancel();
      } catch {
        /* ignore cancel errors */
      }
      throw err;
    }

    const out = concatUint8Arrays(chunks, total);
    if (uncompressedSize && out.length !== uncompressedSize) {
      return out.slice(0, Math.min(out.length, uncompressedSize));
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

// --- ZIP writing (the counterpart of unzip, just enough to swap document.xml) ---

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function deflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const ZIP_TEXT_ENTRY = /\.(xml|rels|svg|json|txt|html|css)$/i;

/** @param {{ name: string, data: Uint8Array }[]} entries @returns {Promise<Uint8Array>} */
async function zipEntries(entries) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const canDeflate = typeof CompressionStream !== "undefined";

  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = encoder.encode(name);
    const deflated = canDeflate && ZIP_TEXT_ENTRY.test(name) ? await deflateRaw(data) : null;
    const useDeflate = deflated && deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, method, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, body);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, method, true);
    cd.setUint16(12, dosTime, true);
    cd.setUint16(14, dosDate, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, body.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + body.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true);
  chunks.push(...central, new Uint8Array(eocd.buffer));
  return concatUint8Arrays(chunks, offset + centralSize + 22);
}

/** Rebuilds an archive with `document.xml` replaced; every other entry is carried over as is. */
async function replaceArchiveDocument(buffer, xmlBytes) {
  const entries = await unzip(buffer);
  const idx = entries.findIndex((e) => e.name === "document.xml");
  if (idx < 0) throw new Error("Archive must contain document.xml");
  entries[idx] = { name: "document.xml", data: xmlBytes };
  return (await zipEntries(entries)).buffer;
}
