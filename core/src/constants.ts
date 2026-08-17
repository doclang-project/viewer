/* DocLang Archive Viewer — archive format: github.com/doclang-project/doclang spec.md#doclang-archive-format */

export const SUPPORTED_FILE_EXTENSIONS = ['.dclx', '.dclg'];
export const OPEN_FILE_HINT = `Open a DocLang file (${SUPPORTED_FILE_EXTENSIONS.join(', ')})`;
export const VIRTUAL_TEXT_TAG_HINT =
  'DocLang virtual <text>; wrapping tags not included in source';
export const FRAGMENT_LINK_LABEL_CROSS_PAGE = 'cross-page content';
export const FRAGMENT_LINK_LABEL_SAME_PAGE = 'fragmented content';
export const FRAGMENT_NAV_HINT_PREV = 'Previous fragment';
export const FRAGMENT_NAV_HINT_NEXT = 'Next fragment';
export const DOCLANG_NS = 'https://www.doclang.ai/ns/v0';
export const PAGE_IMAGE_RE = /^(\d+)\.(png|jpe?g|webp)$/i;
export const NO_MARKUP = '(No markup to be shown.)';
export const NO_IMAGE = '(No page image available.)';
export const FILE_THUMB_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
export const PICTURE_UNAVAILABLE_ALT = 'Picture asset not available';
export const INVALID_PICTURE_SRC = 'data:image/png;base64,NOT_A_VALID_IMAGE';
/** Allow small embedded raster data URIs only; remote/blob/other schemes are rejected. */
export const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
export const MAX_DATA_IMAGE_URI_LENGTH = 2 * 1024 * 1024; // 2 MiB
export const ZIP_MAX_ENTRIES = 5000;
export const ZIP_MAX_ENTRY_COMPRESSED_BYTES = 128 * 1024 * 1024; // 128 MiB
export const ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES = 128 * 1024 * 1024; // 128 MiB
export const ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES = 512 * 1024 * 1024; // 512 MiB
export const ZIP_MAX_COMPRESSION_RATIO = 100; // uncompressed / compressed
export const LONG_EMBEDDED_URI_PREVIEW_LENGTH = 30;
export const HEAD_TAGS = new Set([
  'label',
  'thread',
  'xref',
  'href',
  'layer',
  'location',
  'caption',
  'description',
  'summary',
  'custom',
]);
export const SEMANTIC_TAGS = new Set([
  'text',
  'heading',
  'footnote',
  'page_header',
  'page_footer',
  'field_region',
  'list',
  'table',
  'index',
  'formula',
  'code',
  'picture',
  'marker',
  'group',
  'field_heading',
  'field_item',
  'key',
  'value',
  'hint',
  'caption',
  'page_break',
]);
export const CELL_TOKENS = new Set([
  'fcel',
  'ecel',
  'ched',
  'rhed',
  'corn',
  'srow',
  'lcel',
  'ucel',
  'xcel',
  'nl',
]);
export const CELL_CONTENT_TAGS = new Set([
  'fcel',
  'ecel',
  'ched',
  'rhed',
  'corn',
  'srow',
]);
export const CELL_SPAN_TAGS = new Set(['lcel', 'ucel', 'xcel']);
export const OTSL_CONTAINER_TAGS = new Set(['table', 'index', 'tabular']);
export const RENDER_BLOCK_TAGS = new Set([
  'text',
  'heading',
  'field_heading',
  'footnote',
  'page_header',
  'page_footer',
  'list',
  'code',
  'formula',
  'picture',
  'group',
  'field_region',
  'field_item',
  'table',
  'index',
  'tabular',
]);
export const RENDER_FORMAT_TAGS = new Set([
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'superscript',
  'subscript',
  'handwriting',
  'rtl',
  'content',
]);
export const FORMAT_HTML_TAG: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's',
  superscript: 'sup',
  subscript: 'sub',
};

export const PAGE_WHEEL_COOLDOWN_MS = 200;
export const PAGE_WHEEL_PIXEL_THRESHOLD = 4;
export const PAGE_WHEEL_GESTURE_MS = 100;
export const OVERLAY_BADGE_FONT_SIZE = 11 * 1.5 * 0.8;
export const OVERLAY_BADGE_PAD_X = 3;
export const OVERLAY_BADGE_PAD_Y = 2;
export const OVERLAY_BADGE_RADIUS_SCREEN_PX = 3;
/** Demo page size; overlay lengths are calibrated to match pre-fix sizing on these images. */
export const OVERLAY_REF_IMAGE_WIDTH = 1224;
export const OVERLAY_REF_IMAGE_HEIGHT = 1584;
export const PAGE_ZOOM_DEFAULT = 100;
export const PAGE_PAN_DRAG_THRESHOLD = 5;
export const PAGE_VIEW_BORDER_PX = 2;
export const LAYOUT_STORAGE_KEY = 'doclang-viewer-pane-layout';
export const PANE_MIN_RATIO = 0.12;
export const PANE_KEYS = ['file', 'page', 'markup', 'reading'] as const;
export const DEFAULT_PANE_RATIOS = [1, 1, 1, 1];
export const DEFAULT_USER_PANE_VISIBLE = {
  file: false,
  page: true,
  markup: true,
  reading: true,
};
export const LAYOUT_STACK_BREAKPOINT_PX = 1200;

export type PaneKey = (typeof PANE_KEYS)[number];
