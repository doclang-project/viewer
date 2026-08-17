/* DocLang Archive Viewer — archive format: github.com/doclang-project/doclang spec.md#doclang-archive-format */

import {
  SUPPORTED_FILE_EXTENSIONS,
  OPEN_FILE_HINT,
  VIRTUAL_TEXT_TAG_HINT,
  FRAGMENT_NAV_HINT_PREV,
  FRAGMENT_NAV_HINT_NEXT,
  NO_MARKUP,
  NO_IMAGE,
  FILE_THUMB_PLACEHOLDER_SVG,
  PAGE_IMAGE_RE,
  PAGE_ZOOM_DEFAULT,
  PAGE_PAN_DRAG_THRESHOLD,
  PAGE_WHEEL_COOLDOWN_MS,
  PAGE_WHEEL_PIXEL_THRESHOLD,
  PAGE_WHEEL_GESTURE_MS,
  LAYOUT_STORAGE_KEY,
  PANE_MIN_RATIO,
  PANE_KEYS,
  DEFAULT_PANE_RATIOS,
  DEFAULT_USER_PANE_VISIBLE,
  LAYOUT_STACK_BREAKPOINT_PX,
  CELL_SPAN_TAGS,
  OTSL_CONTAINER_TAGS,
} from './constants';
import type { PaneKey } from './constants';
import type {
  DocumentState,
  FileCatalogEntry,
  PageLayoutCache,
  PagePanDrag,
  PaneDragState,
  UserPaneVisible,
  HeadInfo,
} from './types';
import {
  localName,
  escapeHtml,
  elementLabel,
  elementHeadLocations,
  elementThreadId,
  firstHeadChild,
  locationResolution,
  isSemanticElement,
  isVirtualTextHost,
  isListOrOtslContainer,
  xmlContains,
  skipContainerLevelHead,
  skipUntilListItemBoundary,
  skipUntilCellBoundary,
  isCellToken,
} from './xml';
import {
  buildDocumentState,
  assignElementIds,
  invertElementIds,
  segmentHasMarkup,
  collectBoundingBoxes,
  collectCaptionLinks,
  collectXrefLinks,
  collectFragmentLinks,
  collectFragmentNavItems,
  collectReadingOrderSteps,
  extractArchiveFromFiles,
  extractArchiveFromZipBuffer,
  revokeDocumentState,
} from './document';
import { buildMarkupView } from './markup';
import {
  buildRenderedView,
  applyReadingLayerClasses,
  setStateAccessor,
} from './rendered';
import {
  buildOverlay,
  syncOverlayBadges,
  applyPageImageSize,
  setOverlayAccessors,
} from './overlay';
import { isPictureContentElement, isTableContentElement } from './xml_overlay';
import { unzip } from './zip';

// ---------------------------------------------------------------------------
// Global mutable state
// ---------------------------------------------------------------------------

let state: DocumentState | null = null;
let fileCatalog: FileCatalogEntry[] = [];
let activeFileIndex = -1;
let filePaneUserToggled = false;
let pagePaneResizeObserver: ResizeObserver | null = null;
let selectedElementId: string | null = null;
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
let pagePanDrag: PagePanDrag | null = null;
let pagePanSuppressClick = false;
let pageLayoutCache: PageLayoutCache | null = null;
let userPaneVisible: UserPaneVisible = { ...DEFAULT_USER_PANE_VISIBLE };
let paneRatios: number[] = [...DEFAULT_PANE_RATIOS];
let filePaneWidthPx: number | null = null;
let toolbarOptionsOpen = false;
let paneDrag: PaneDragState | null = null;
let layoutStackQuery: MediaQueryList | null = null;
let pageLayoutFrame = 0;
let demoLoadInProgress = false;

// Wire state accessors into sub-modules
setStateAccessor(() => state);
setOverlayAccessors({
  getPageZoomPercent: () => pageZoomPercent,
  getPagePane: () => els.pagePane,
  getPageLayoutCache: () => pageLayoutCache,
  setPageLayoutCache: c => { pageLayoutCache = c; },
  getSelectedElementId: () => selectedElementId,
});

// ---------------------------------------------------------------------------
// DOM element references
// ---------------------------------------------------------------------------

const els = {
  openFileBtn: document.getElementById('open-file-btn'),
  emptyStateFileTypes: document.getElementById('empty-state-file-types'),
  docLabel: document.getElementById('doc-label'),
  filePane: document.getElementById('file-pane'),
  filePaneCloseAll: document.getElementById('btn-file-pane-close-all'),
  pageNav: document.getElementById('page-nav'),
  pageIndicator: document.getElementById('page-indicator'),
  pageNumberInput: document.getElementById('page-number-input') as HTMLInputElement | null,
  pageCountIndicator: document.getElementById('page-count-indicator'),
  btnPrev: document.getElementById('btn-prev') as HTMLButtonElement | null,
  btnNext: document.getElementById('btn-next') as HTMLButtonElement | null,
  showAllBboxes: document.getElementById('show-all-bboxes') as HTMLInputElement | null,
  showLayoutBadges: document.getElementById('show-layout-badges') as HTMLInputElement | null,
  showLayoutBadgesLabel: document.getElementById('show-layout-badges-label'),
  settingsToggle: document.getElementById('btn-settings-toggle'),
  readingSettingsToggle: document.getElementById('btn-reading-settings-toggle'),
  pageSettingsLayer: document.getElementById('page-settings-layer'),
  pageSettingsScrim: document.getElementById('page-settings-scrim'),
  pageSettingsClose: document.getElementById('btn-page-settings-close'),
  readingSettingsLayer: document.getElementById('reading-settings-layer'),
  readingSettingsScrim: document.getElementById('reading-settings-scrim'),
  readingSettingsClose: document.getElementById('btn-reading-settings-close'),
  showReadingFurniture: document.getElementById('show-reading-furniture') as HTMLInputElement | null,
  showReadingFurnitureLabel: document.getElementById('show-reading-furniture-label'),
  showReadingBackground: document.getElementById('show-reading-background') as HTMLInputElement | null,
  showReadingBackgroundLabel: document.getElementById('show-reading-background-label'),
  showCaptionLinks: document.getElementById('show-caption-links') as HTMLInputElement | null,
  showCaptionLinksLabel: document.getElementById('show-caption-links-label'),
  showPictureContents: document.getElementById('show-picture-contents') as HTMLInputElement | null,
  showPictureContentsLabel: document.getElementById('show-picture-contents-label'),
  showTableContents: document.getElementById('show-table-contents') as HTMLInputElement | null,
  showTableContentsLabel: document.getElementById('show-table-contents-label'),
  showFragmentLinks: document.getElementById('show-fragment-links') as HTMLInputElement | null,
  showFragmentLinksLabel: document.getElementById('show-fragment-links-label'),
  showXrefLinks: document.getElementById('show-xref-links') as HTMLInputElement | null,
  showXrefLinksLabel: document.getElementById('show-xref-links-label'),
  showReadingOrder: document.getElementById('show-reading-order') as HTMLInputElement | null,
  showReadingOrderLabel: document.getElementById('show-reading-order-label'),
  readingOrderArrows: document.getElementById('reading-order-arrows') as HTMLInputElement | null,
  readingOrderArrowsLabel: document.getElementById('reading-order-arrows-label'),
  readingOrderGlobal: document.getElementById('reading-order-global') as HTMLInputElement | null,
  readingOrderGlobalLabel: document.getElementById('reading-order-global-label'),
  pageZoom: document.getElementById('page-zoom') as HTMLInputElement | null,
  pageZoomLabel: document.getElementById('page-zoom-label'),
  pageZoomReset: document.getElementById('page-zoom-reset') as HTMLButtonElement | null,
  main: document.getElementById('main'),
  emptyState: document.getElementById('empty-state'),
  emptyStateLoading: document.getElementById('empty-state-loading'),
  emptyStatePrompt: document.getElementById('empty-state-prompt'),
  markupPane: document.getElementById('markup-pane'),
  renderedPane: document.getElementById('rendered-pane'),
  pagePane: document.getElementById('page-pane'),
  paneFile: document.querySelector('.pane-file') as HTMLElement | null,
  panePageView: document.querySelector('.pane-page-view') as HTMLElement | null,
  paneMarkup: document.querySelector('.pane-markup') as HTMLElement | null,
  paneReading: document.querySelector('.pane-reading') as HTMLElement | null,
  splitters: [
    document.getElementById('splitter-0'),
    document.getElementById('splitter-1'),
    document.getElementById('splitter-2'),
  ] as (HTMLElement | null)[],
  toolbarOptionsBtn: document.getElementById('btn-toolbar-options'),
  toolbarOptionsPanel: document.getElementById('toolbar-options-panel'),
  toggleFilePane: document.getElementById('toggle-file-pane') as HTMLInputElement | null,
  toggleFilePaneLabel: document.getElementById('toggle-file-pane-label'),
  togglePagePane: document.getElementById('toggle-page-pane') as HTMLInputElement | null,
  toggleMarkupPane: document.getElementById('toggle-markup-pane') as HTMLInputElement | null,
  toggleReadingPane: document.getElementById('toggle-reading-pane') as HTMLInputElement | null,
  togglePagePaneLabel: document.getElementById('toggle-page-pane-label'),
  resetPaneLayoutBtn: document.getElementById('btn-reset-pane-layout') as HTMLButtonElement | null,
};

// ---------------------------------------------------------------------------
// Cursor hint
// ---------------------------------------------------------------------------

const cursorHintEl = document.getElementById('cursor-hint') as HTMLElement | null;
const CURSOR_HINT_OFFSET = 10;
const CURSOR_HINT_MARGIN = 8;

function hideCursorHint(): void {
  if (!cursorHintEl) return;
  cursorHintEl.hidden = true;
  cursorHintEl.classList.remove('cursor-hint-detail');
  cursorHintEl.replaceChildren();
}

function showCursorHint(
  content: string | Node,
  clientX: number,
  clientY: number,
  { detail = false } = {}
): void {
  if (!cursorHintEl) return;
  cursorHintEl.replaceChildren();
  if (typeof content === 'string') {
    cursorHintEl.textContent = content;
  } else {
    cursorHintEl.appendChild(content);
  }
  cursorHintEl.classList.toggle('cursor-hint-detail', detail);
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

function showCursorHintHtml(html: string, clientX: number, clientY: number): void {
  if (!cursorHintEl) return;
  cursorHintEl.innerHTML = html;
  cursorHintEl.classList.add('cursor-hint-detail');
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

// ---------------------------------------------------------------------------
// Element head tooltip
// ---------------------------------------------------------------------------

function headTextPreview(el: Element, maxLen = 72): string {
  const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (!text) return '—';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function collectElementHeadInfo(el: Element, defaultResolution: { width: number; height: number }): HeadInfo[] {
  const labelEl = firstHeadChild(el, 'label');
  const threadEl = firstHeadChild(el, 'thread');
  const xrefEl = firstHeadChild(el, 'xref');
  const hrefEl = firstHeadChild(el, 'href');
  const layerEl = firstHeadChild(el, 'layer');
  const captionEl = firstHeadChild(el, 'caption');
  const descriptionEl = firstHeadChild(el, 'description');
  const summaryEl = firstHeadChild(el, 'summary');
  const customEl = firstHeadChild(el, 'custom');
  const locs = elementHeadLocations(el);
  const rows: HeadInfo[] = [{ key: 'element', value: elementLabel(el), isDefault: false }];

  rows.push({
    key: 'label',
    value: labelEl?.getAttribute('value') ?? 'undefined',
    isDefault: !labelEl?.hasAttribute('value'),
  });

  if (threadEl) {
    rows.push({ key: 'thread_id', value: threadEl.getAttribute('thread_id') ?? '—', isDefault: false });
  } else {
    rows.push({ key: 'thread', value: '—', isDefault: true });
  }

  if (xrefEl) {
    rows.push({ key: 'xref', value: `thread_id ${xrefEl.getAttribute('thread_id') ?? '—'}`, isDefault: false });
  } else {
    rows.push({ key: 'xref', value: '—', isDefault: true });
  }

  if (hrefEl) {
    rows.push({ key: 'href', value: hrefEl.getAttribute('uri') ?? '—', isDefault: false });
  } else {
    rows.push({ key: 'href', value: '—', isDefault: true });
  }

  rows.push({
    key: 'layer',
    value: layerEl?.getAttribute('value') ?? 'body',
    isDefault: !layerEl?.hasAttribute('value'),
  });

  const cornerLabels = ['x_min', 'y_min', 'x_max', 'y_max'];
  if (locs.length === 4) {
    for (let idx = 0; idx < 4; idx += 1) {
      const loc = locs[idx]!;
      const axisDefault = idx % 2 === 0 ? defaultResolution.width : defaultResolution.height;
      const resolution = locationResolution(loc, axisDefault);
      const value = loc.getAttribute('value') ?? '0';
      rows.push({ key: cornerLabels[idx]!, value: `${value} @ ${resolution}`, isDefault: false });
    }
  } else {
    for (const key of cornerLabels) {
      rows.push({ key, value: '—', isDefault: false });
    }
  }

  rows.push({ key: 'caption', value: captionEl ? headTextPreview(captionEl) : '—', isDefault: !captionEl });
  rows.push({ key: 'description', value: descriptionEl ? headTextPreview(descriptionEl) : '—', isDefault: !descriptionEl });
  rows.push({ key: 'summary', value: summaryEl ? headTextPreview(summaryEl) : '—', isDefault: !summaryEl });
  rows.push({ key: 'custom', value: customEl ? headTextPreview(customEl) : '—', isDefault: !customEl });

  return rows;
}

function elementHeadTooltipHtml(el: Element, defaultResolution: { width: number; height: number }): string {
  const rows = collectElementHeadInfo(el, defaultResolution);
  const body = rows
    .map(({ key, value, isDefault }) => {
      const rendered = escapeHtml(value);
      const suffix = isDefault ? ' <span class="head-default">(default)</span>' : '';
      return `<tr><th scope="row">${escapeHtml(key)}</th><td>${rendered}${suffix}</td></tr>`;
    })
    .join('');
  return `<table class="head-tooltip"><tbody>${body}</tbody></table>`;
}

// ---------------------------------------------------------------------------
// Reading layer
// ---------------------------------------------------------------------------

function syncReadingLayerCheckboxes(): void {
  if (els.showReadingFurniture) els.showReadingFurniture.checked = showReadingFurniture;
  if (els.showReadingBackground) els.showReadingBackground.checked = showReadingBackground;
}

function syncReadingLayerVisibility(): void {
  const root = els.renderedPane?.querySelector('.rendered-doc') as HTMLElement | null;
  if (root) applyReadingLayerClasses(root, showReadingFurniture, showReadingBackground);
}

// ---------------------------------------------------------------------------
// Page zoom
// ---------------------------------------------------------------------------

function updatePageZoomResetButton(): void {
  if (!els.pageZoomReset) return;
  els.pageZoomReset.textContent = `${pageZoomPercent}%`;
  els.pageZoomReset.disabled = pageZoomPercent === PAGE_ZOOM_DEFAULT;
}

function pageViewScrollPane(): HTMLElement | null {
  if (!els.pagePane) return null;
  return (els.pagePane.querySelector('.page-view-port') as HTMLElement | null) ?? els.pagePane;
}

function isPagePaneScrollable(): boolean {
  const pane = pageViewScrollPane();
  if (!pane) return false;
  return pane.scrollWidth > pane.clientWidth || pane.scrollHeight > pane.clientHeight;
}

function resetPageZoom(): void {
  pageZoomPercent = PAGE_ZOOM_DEFAULT;
  if (els.pageZoom) {
    els.pageZoom.value = String(PAGE_ZOOM_DEFAULT);
    els.pageZoom.setAttribute('aria-valuenow', String(PAGE_ZOOM_DEFAULT));
  }
  updatePageZoomResetButton();
  const port = pageViewScrollPane();
  if (port) { port.scrollLeft = 0; port.scrollTop = 0; }
  refreshPageViewLayout();
}

function refreshPageViewLayout(): void {
  if (!els.pagePane) return;
  cancelAnimationFrame(pageLayoutFrame);
  pageLayoutFrame = requestAnimationFrame(() => {
    pageLayoutFrame = 0;
    const img = els.pagePane?.querySelector('.page-view img') as HTMLImageElement | null;
    if (img?.naturalWidth) applyPageLayout(img);
  });
}

function applyPageLayout(img: HTMLImageElement, pane = els.pagePane!): void {
  applyPageImageSize(img, pane);
  syncPageViewChrome(img);
}

function syncPageViewChrome(img: HTMLImageElement): void {
  const svg = img.parentElement?.querySelector('svg.overlay') as SVGSVGElement | null;
  if (svg && state?.pageViewOverlay) {
    syncOverlayBadges(
      img, svg,
      state.pageViewOverlay.boxes,
      state.pageViewOverlay.readingOrderSteps,
      showAllBboxes, showLayoutBadges, showReadingOrder
    );
  }
  updatePagePanePanCursor();
  applyBboxVisibility();
}

function updatePagePanePanCursor(): void {
  if (!els.pagePane) return;
  els.pagePane.classList.toggle('can-pan', isPagePaneScrollable() && !pagePanDrag);
}

// ---------------------------------------------------------------------------
// Settings open/close
// ---------------------------------------------------------------------------

function setPageSettingsOpen(open: boolean): void {
  pageSettingsOpen = open;
  if (els.pageSettingsLayer) els.pageSettingsLayer.hidden = !open;
  if (els.settingsToggle) els.settingsToggle.setAttribute('aria-expanded', String(open));
}

function setReadingSettingsOpen(open: boolean): void {
  readingSettingsOpen = open;
  if (els.readingSettingsLayer) els.readingSettingsLayer.hidden = !open;
  if (els.readingSettingsToggle) els.readingSettingsToggle.setAttribute('aria-expanded', String(open));
}

function closeAllSettings(): void {
  setPageSettingsOpen(false);
  setReadingSettingsOpen(false);
}

// ---------------------------------------------------------------------------
// Layout subtoggle sync
// ---------------------------------------------------------------------------

function syncLayoutSubtoggles(): void {
  const layoutEnabled = Boolean(state?.hasPageView && showAllBboxes);
  for (const label of [
    els.showLayoutBadgesLabel, els.showPictureContentsLabel, els.showTableContentsLabel,
    els.showFragmentLinksLabel, els.showCaptionLinksLabel, els.showXrefLinksLabel, els.showReadingOrderLabel,
  ]) {
    if (!label) continue;
    label.classList.toggle('settings-option-disabled', !layoutEnabled);
    const input = label.querySelector('input') as HTMLInputElement | null;
    if (input) input.disabled = !layoutEnabled;
  }
  const readingOrderEnabled = layoutEnabled && showReadingOrder;
  for (const label of [els.readingOrderArrowsLabel, els.readingOrderGlobalLabel]) {
    if (!label) continue;
    label.classList.toggle('settings-option-disabled', !readingOrderEnabled);
    const input = label.querySelector('input') as HTMLInputElement | null;
    if (input) input.disabled = !readingOrderEnabled;
  }
}

// ---------------------------------------------------------------------------
// Pane layout
// ---------------------------------------------------------------------------

function paneDef(key: PaneKey): { key: PaneKey; el: HTMLElement | null; canShow: () => boolean } {
  const defs = {
    file: { key: 'file' as PaneKey, el: els.paneFile, canShow: () => fileCatalog.length > 0 },
    page: { key: 'page' as PaneKey, el: els.panePageView, canShow: () => Boolean(state?.hasPageView) },
    markup: { key: 'markup' as PaneKey, el: els.paneMarkup, canShow: () => Boolean(state) },
    reading: { key: 'reading' as PaneKey, el: els.paneReading, canShow: () => Boolean(state) },
  };
  return defs[key];
}

function isPaneAvailable(key: PaneKey): boolean {
  return paneDef(key)?.canShow() ?? false;
}

function isPaneVisible(key: PaneKey): boolean {
  if (!isPaneAvailable(key)) return false;
  return Boolean(userPaneVisible[key]);
}

function visiblePaneKeys(): PaneKey[] {
  return [...PANE_KEYS].filter(key => isPaneVisible(key));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function paneMinRatio(_unused: PaneKey): number {
  return PANE_MIN_RATIO;
}

function filePaneFitWidthPx(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--file-pane-fit-width);';
  document.documentElement.appendChild(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return Math.ceil(px) || 108;
}

function resolvedFilePaneWidthPx(): number {
  const fit = filePaneFitWidthPx();
  return Math.max(fit, filePaneWidthPx ?? fit);
}

function contentPaneFrWeights(keys: PaneKey[]): number[] {
  const contentKeys = keys.filter(key => key !== 'file');
  const weights = contentKeys.map(key => paneRatios[paneRatioIndex(key)]!);
  const sum = weights.reduce((a, b) => a + b, 0) || contentKeys.length;
  return weights.map(w => w / sum);
}

function paneRatioIndex(key: PaneKey): number {
  return PANE_KEYS.indexOf(key);
}

function normalizePaneRatios(): void {
  const sum = paneRatios.reduce((a, b) => a + b, 0);
  if (sum <= 0) { paneRatios = [...DEFAULT_PANE_RATIOS]; return; }
  paneRatios = paneRatios.map(r => r / sum);
}

function loadLayoutPrefs(): void {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as { visible?: Record<string, unknown>; ratios?: unknown[]; filePaneWidthPx?: unknown };
    if (data?.visible && typeof data.visible === 'object') {
      for (const key of PANE_KEYS) {
        if (typeof data.visible[key] === 'boolean') userPaneVisible[key] = data.visible[key] as boolean;
      }
      if (typeof data.visible['file'] === 'boolean') filePaneUserToggled = true;
    }
    if (Array.isArray(data?.ratios)) {
      const valid = data.ratios.every(n => typeof n === 'number' && n > 0);
      if (valid && data.ratios.length === 4) {
        paneRatios = [...(data.ratios as number[])];
        normalizePaneRatios();
      } else if (valid && data.ratios.length === 3) {
        paneRatios = [1, ...(data.ratios as number[])];
        normalizePaneRatios();
      }
    }
    if (typeof data?.filePaneWidthPx === 'number' && data.filePaneWidthPx > 0) {
      filePaneWidthPx = data.filePaneWidthPx;
    }
  } catch { /* ignore invalid stored layout */ }
}

function saveLayoutPrefs(): void {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ visible: userPaneVisible, ratios: paneRatios, filePaneWidthPx })
    );
  } catch { /* ignore quota / private mode */ }
}

function resetPaneLayout(): void {
  filePaneUserToggled = false;
  userPaneVisible = { file: defaultFilePaneVisible(), page: true, markup: true, reading: true };
  paneRatios = [...DEFAULT_PANE_RATIOS];
  normalizePaneRatios();
  filePaneWidthPx = null;
  setReadingSettingsOpen(false);
  syncPagePaneControls();
  syncToolbarPaneCheckboxes();
  saveLayoutPrefs();
  applyPaneLayout();
}

function isLayoutStacked(): boolean {
  return Boolean(layoutStackQuery?.matches);
}

function initLayoutStackListener(): void {
  if (!els.main) return;
  layoutStackQuery = window.matchMedia(`(max-width: ${LAYOUT_STACK_BREAKPOINT_PX}px)`);
  const onChange = (): void => applyPaneLayout();
  layoutStackQuery.addEventListener('change', onChange);
  onChange();
}

function paneKeysAdjacent(leftKey: PaneKey, rightKey: PaneKey): boolean {
  const leftIdx = PANE_KEYS.indexOf(leftKey);
  const rightIdx = PANE_KEYS.indexOf(rightKey);
  return leftIdx >= 0 && rightIdx === leftIdx + 1;
}

function onlyHiddenPanesBetween(leftKey: PaneKey, rightKey: PaneKey): boolean {
  const leftIdx = PANE_KEYS.indexOf(leftKey);
  const rightIdx = PANE_KEYS.indexOf(rightKey);
  if (leftIdx < 0 || rightIdx <= leftIdx) return false;
  for (let i = leftIdx + 1; i < rightIdx; i++) {
    if (isPaneVisible(PANE_KEYS[i]!)) return false;
  }
  return true;
}

function shouldShowSplitterBetween(leftKey: PaneKey, rightKey: PaneKey): boolean {
  if (!isPaneVisible(leftKey) || !isPaneVisible(rightKey)) return false;
  if (paneKeysAdjacent(leftKey, rightKey)) return true;
  return onlyHiddenPanesBetween(leftKey, rightKey);
}

function splitterForLayoutGap(leftKey: PaneKey, rightKey: PaneKey): HTMLElement | null {
  if (!shouldShowSplitterBetween(leftKey, rightKey)) return null;
  const leftIdx = PANE_KEYS.indexOf(leftKey);
  if (leftIdx < 0) return null;
  return els.splitters[leftIdx] ?? null;
}

function visiblePaneNeighborAfter(key: PaneKey): PaneKey | null {
  const idx = PANE_KEYS.indexOf(key);
  if (idx < 0) return null;
  for (let i = idx + 1; i < PANE_KEYS.length; i++) {
    const neighbor = PANE_KEYS[i]!;
    if (isPaneVisible(neighbor)) return neighbor;
  }
  return null;
}

function visiblePaneNeighborBefore(key: PaneKey): PaneKey | null {
  const idx = PANE_KEYS.indexOf(key);
  if (idx < 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const neighbor = PANE_KEYS[i]!;
    if (isPaneVisible(neighbor)) return neighbor;
  }
  return null;
}

function resolvedPhysicalSplitterKeys(physicalSplitterIndex: number): { leftKey: PaneKey; rightKey: PaneKey } | null {
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

function resetPaneGridStyles(): void {
  for (const key of PANE_KEYS) {
    const el = paneDef(key)?.el;
    if (el) { el.style.gridColumn = ''; el.style.gridRow = ''; }
  }
  for (const splitter of els.splitters) {
    if (!splitter) continue;
    splitter.style.gridColumn = '';
    splitter.style.gridRow = '';
    splitter.hidden = true;
  }
}

function setUserPaneVisible(key: PaneKey, visible: boolean): void {
  userPaneVisible[key] = visible;
  if (key === 'file') filePaneUserToggled = true;
  if (key === 'page') syncPagePaneControls();
  if (key === 'reading' && !visible) setReadingSettingsOpen(false);
  syncToolbarPaneCheckboxes();
  saveLayoutPrefs();
  applyPaneLayout();
}

function applyPaneLayout(): void {
  if (!els.main) return;
  const stacked = document.body.classList.contains('viewer-loaded') && isLayoutStacked();
  els.main.classList.toggle('layout-stacked', stacked);

  for (const key of PANE_KEYS) {
    const def = paneDef(key);
    if (!def?.el) continue;
    def.el.hidden = !isPaneVisible(key);
    def.el.classList.remove('pane-layout-last');
  }

  if (!document.body.classList.contains('viewer-loaded')) {
    resetPaneGridStyles();
    els.main.style.gridTemplateColumns = '';
    els.main.style.gridTemplateRows = '';
    return;
  }

  let keys = visiblePaneKeys();
  if (!keys.length) { userPaneVisible.markup = true; keys = visiblePaneKeys(); }

  const lastKey = keys[keys.length - 1]!;
  paneDef(lastKey)?.el?.classList.add('pane-layout-last');
  resetPaneGridStyles();

  if (stacked) {
    els.main.style.gridTemplateRows = '';
    els.main.style.gridTemplateColumns = '1fr';
    let row = 1;
    for (const key of keys) {
      const def = paneDef(key);
      if (!def?.el) continue;
      def.el.style.gridRow = String(row++);
    }
    refreshPageViewLayout();
    if (els.readingSettingsToggle) els.readingSettingsToggle.hidden = !state || !isPaneVisible('reading');
    return;
  }

  const contentFr = contentPaneFrWeights(keys);
  const cols: string[] = [];
  let contentFrIndex = 0;
  keys.forEach((key, index) => {
    if (key === 'file') {
      cols.push(`${resolvedFilePaneWidthPx()}px`);
    } else {
      cols.push(`minmax(0, ${contentFr[contentFrIndex++]!.toFixed(6)}fr)`);
    }
    if (index < keys.length - 1 && shouldShowSplitterBetween(keys[index]!, keys[index + 1]!)) {
      cols.push('1px');
    }
  });
  els.main.style.gridTemplateColumns = cols.join(' ');
  els.main.style.gridTemplateRows = 'minmax(0, 1fr)';

  let col = 1;
  keys.forEach((key, index) => {
    const def = paneDef(key);
    if (!def?.el) return;
    def.el.style.gridColumn = String(col);
    col += 1;
    if (index < keys.length - 1) {
      const leftKey = keys[index]!;
      const rightKey = keys[index + 1]!;
      if (!shouldShowSplitterBetween(leftKey, rightKey)) return;
      const splitter = splitterForLayoutGap(leftKey, rightKey);
      if (splitter) { splitter.hidden = false; splitter.style.gridColumn = String(col); col += 1; }
    }
  });

  refreshPageViewLayout();
  if (els.readingSettingsToggle) els.readingSettingsToggle.hidden = !state || !isPaneVisible('reading');
}

// ---------------------------------------------------------------------------
// Toolbar options
// ---------------------------------------------------------------------------

function setToolbarOptionsOpen(open: boolean): void {
  toolbarOptionsOpen = open;
  if (els.toolbarOptionsPanel) els.toolbarOptionsPanel.hidden = !open;
  if (els.toolbarOptionsBtn) els.toolbarOptionsBtn.setAttribute('aria-expanded', String(open));
}

function syncToolbarPaneCheckboxes(): void {
  if (els.toggleFilePane) {
    const available = isPaneAvailable('file');
    els.toggleFilePane.checked = available && userPaneVisible.file;
    els.toggleFilePane.disabled = !available;
  }
  if (els.toggleFilePaneLabel) els.toggleFilePaneLabel.classList.toggle('toolbar-options-item-disabled', !isPaneAvailable('file'));
  if (els.togglePagePane) {
    const available = isPaneAvailable('page');
    els.togglePagePane.checked = available && userPaneVisible.page;
    els.togglePagePane.disabled = !available;
  }
  if (els.togglePagePaneLabel) els.togglePagePaneLabel.classList.toggle('toolbar-options-item-disabled', !isPaneAvailable('page'));
  if (els.toggleMarkupPane) { els.toggleMarkupPane.checked = userPaneVisible.markup; els.toggleMarkupPane.disabled = !state; }
  if (els.toggleReadingPane) { els.toggleReadingPane.checked = userPaneVisible.reading; els.toggleReadingPane.disabled = !state; }
  for (const label of [
    els.toggleFilePaneLabel, els.togglePagePaneLabel,
    document.getElementById('toggle-markup-pane-label'),
    document.getElementById('toggle-reading-pane-label'),
  ]) {
    if (!label) continue;
    const input = label.querySelector('input') as HTMLInputElement | null;
    label.classList.toggle('toolbar-options-item-disabled', Boolean(input?.disabled));
  }
  if (els.resetPaneLayoutBtn) els.resetPaneLayoutBtn.disabled = !state;
}

function initToolbarOptions(): void {
  if (!els.toolbarOptionsBtn || !els.toolbarOptionsPanel) return;
  els.toolbarOptionsBtn.addEventListener('click', e => {
    e.stopPropagation();
    setToolbarOptionsOpen(!toolbarOptionsOpen);
  });
  document.addEventListener('click', e => {
    if (!toolbarOptionsOpen) return;
    if (e.target instanceof Node && els.toolbarOptionsPanel!.contains(e.target)) return;
    if (e.target instanceof Node && els.toolbarOptionsBtn!.contains(e.target)) return;
    setToolbarOptionsOpen(false);
  });
  const onToggle = (key: PaneKey, input: HTMLInputElement | null): void => {
    input?.addEventListener('change', () => {
      if (!state) return;
      const nextKeys = [...PANE_KEYS].filter(k => (k === key ? input.checked : userPaneVisible[k] && isPaneAvailable(k)));
      if (!nextKeys.length) { input.checked = true; return; }
      setUserPaneVisible(key, input.checked);
    });
  };
  onToggle('file', els.toggleFilePane);
  onToggle('page', els.togglePagePane);
  onToggle('markup', els.toggleMarkupPane);
  onToggle('reading', els.toggleReadingPane);
  els.resetPaneLayoutBtn?.addEventListener('click', () => { if (state) resetPaneLayout(); });
  syncToolbarPaneCheckboxes();
}

// ---------------------------------------------------------------------------
// Pane splitter drag
// ---------------------------------------------------------------------------

function contentPaneAvailableWidthPx(): number {
  if (!els.main) return 1;
  const rect = els.main.getBoundingClientRect();
  const keys = visiblePaneKeys();
  let reserved = 0;
  if (keys.includes('file')) reserved += resolvedFilePaneWidthPx();
  for (let i = 0; i < keys.length - 1; i++) {
    if (shouldShowSplitterBetween(keys[i]!, keys[i + 1]!)) reserved += 1;
  }
  return Math.max(rect.width - reserved, 1);
}

function startPaneDrag(e: PointerEvent, physicalSplitterIndex: number): void {
  if (e.button !== 0 || isLayoutStacked() || !document.body.classList.contains('viewer-loaded')) return;
  const resolved = resolvedPhysicalSplitterKeys(physicalSplitterIndex);
  if (!resolved) return;
  const { leftKey, rightKey } = resolved;
  normalizePaneRatios();
  const leftIndex = paneRatioIndex(leftKey);
  const rightIndex = paneRatioIndex(rightKey);
  const dragState: PaneDragState = {
    physicalSplitterIndex, leftKey, rightKey,
    startX: e.clientX,
    leftStart: paneRatios[leftIndex]!,
    rightStart: paneRatios[rightIndex]!,
    pointerId: e.pointerId,
  };
  if (leftKey === 'file') dragState.leftStartPx = resolvedFilePaneWidthPx();
  else if (rightKey === 'file') dragState.rightStartPx = resolvedFilePaneWidthPx();
  paneDrag = dragState;
  e.preventDefault();
  (e.currentTarget as Element).setPointerCapture(e.pointerId);
  (e.currentTarget as Element).classList.add('is-dragging');
  document.body.classList.add('pane-drag-active');
}

function onPaneDragMove(e: PointerEvent): void {
  if (!paneDrag || e.pointerId !== paneDrag.pointerId || !els.main) return;
  if (paneDrag.leftKey === 'file' && typeof paneDrag.leftStartPx === 'number') {
    filePaneWidthPx = Math.max(filePaneFitWidthPx(), paneDrag.leftStartPx + (e.clientX - paneDrag.startX));
    applyPaneLayout(); return;
  }
  if (paneDrag.rightKey === 'file' && typeof paneDrag.rightStartPx === 'number') {
    filePaneWidthPx = Math.max(filePaneFitWidthPx(), paneDrag.rightStartPx - (e.clientX - paneDrag.startX));
    applyPaneLayout(); return;
  }
  const keys = visiblePaneKeys();
  const contentFr = contentPaneFrWeights(keys);
  const contentKeys = keys.filter((key): key is Exclude<PaneKey, 'file'> => key !== 'file');
  const leftContentIndex = contentKeys.indexOf(paneDrag.leftKey as Exclude<PaneKey, 'file'>);
  if (leftContentIndex < 0 || leftContentIndex + 1 >= contentFr.length) return;
  const pairFrTotal = contentFr[leftContentIndex]! + contentFr[leftContentIndex + 1]!;
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

function endPaneDrag(e: PointerEvent): void {
  if (!paneDrag || e.pointerId !== paneDrag.pointerId) return;
  const splitter = els.splitters[paneDrag.physicalSplitterIndex];
  splitter?.classList.remove('is-dragging');
  if (splitter?.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
  paneDrag = null;
  document.body.classList.remove('pane-drag-active');
  normalizePaneRatios();
  saveLayoutPrefs();
}

function initPaneSplitters(): void {
  for (const [index, splitter] of els.splitters.entries()) {
    if (!splitter) continue;
    splitter.addEventListener('pointerdown', e => startPaneDrag(e as PointerEvent, index));
  }
  window.addEventListener('pointermove', e => onPaneDragMove(e as PointerEvent));
  window.addEventListener('pointerup', e => endPaneDrag(e as PointerEvent));
  window.addEventListener('pointercancel', e => endPaneDrag(e as PointerEvent));
}

// ---------------------------------------------------------------------------
// Page navigation
// ---------------------------------------------------------------------------

function goToPage(n: number): void {
  if (!state) return;
  setPageSettingsOpen(false);
  const page = Math.min(Math.max(1, n), state.pageCount);
  state.currentPage = page;
  renderPage(page);
}

function resetPageNumberInput(): void {
  if (!els.pageNumberInput) return;
  els.pageNumberInput.value = state ? String(state.currentPage) : '1';
}

function commitPageNumberInput(): void {
  if (!state || !els.pageNumberInput) return;
  const n = Number.parseInt(els.pageNumberInput.value.trim(), 10);
  if (!Number.isFinite(n)) { resetPageNumberInput(); return; }
  goToPage(n);
}

function setPageIndicator(pageNum: number, pageCount: number): void {
  if (!els.pageIndicator) return;
  if (els.pageCountIndicator) els.pageCountIndicator.textContent = `\u00A0of ${pageCount}`;
  if (els.pageNumberInput) {
    const digits = Math.max(1, String(pageCount).length);
    els.pageNumberInput.style.setProperty('--page-num-digits', String(digits));
    els.pageNumberInput.disabled = !state;
    if (document.activeElement !== els.pageNumberInput) els.pageNumberInput.value = String(pageNum);
  }
}

function syncPagePaneControls(): void {
  const pageVisible = isPaneVisible('page');
  if (els.settingsToggle) els.settingsToggle.hidden = !pageVisible;
  if (els.pageZoomLabel) els.pageZoomLabel.hidden = !pageVisible;
  if (pageVisible) updatePageZoomResetButton();
  if (els.pagePane) els.pagePane.tabIndex = pageVisible ? 0 : -1;
}

// ---------------------------------------------------------------------------
// Fragment thread navigation
// ---------------------------------------------------------------------------

function findElementIdOnPage(el: Element): string | null {
  if (!state?.elementIds) return null;
  for (const [node, id] of state.elementIds) {
    if (node === el) return id;
  }
  return null;
}

function navigateThreadFragment(elementId: string, direction: string): void {
  const el = state?.idToElement?.get(elementId);
  if (!el) return;
  const nav = state?.threadNavByElement?.get(el);
  if (!nav) return;
  const target = direction === 'prev' ? nav.prev : nav.next;
  if (!target) return;
  const page = state!.elementPageByEl.get(target);
  if (!page) return;
  if (page === state!.currentPage) {
    const id = findElementIdOnPage(target);
    if (id) selectElement(id);
    return;
  }
  state!.pendingSelectElement = target;
  goToPage(page);
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

function findListVirtualTextHost(list: Element, target: Element): Element | null {
  const nodes = [...list.childNodes] as ChildNode[];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node as Element) !== 'ldiv') { i += 1; continue; }
    const ldiv = node as Element; i += 1;
    const end = skipUntilListItemBoundary(nodes, i);
    if (target === ldiv || nodes.slice(i, end).some(n => xmlContains(target, n))) return ldiv;
    i = end;
  }
  return null;
}

function findTableVirtualTextHost(container: Element, target: Element): Element | null {
  const nodes = [...container.childNodes] as ChildNode[];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE) { i += 1; continue; }
    const tag = localName(node as Element);
    if (tag === 'nl' || isVirtualTextHost(node as Element) || CELL_SPAN_TAGS.has(tag) || !isCellToken(tag)) { i += 1; continue; }
    const cell = node as Element; i += 1;
    const end = skipUntilCellBoundary(nodes, i);
    if (target === cell || nodes.slice(i, end).some(n => xmlContains(target, n))) return cell;
    i = end;
  }
  return null;
}

function findVirtualTextHost(xmlEl: Element): Element | null {
  let node: Element | null = xmlEl;
  while (node) {
    const parent: Element | null = node.parentElement;
    if (!parent) return null;
    const tag = localName(parent);
    if (tag === 'list') { const host = findListVirtualTextHost(parent, xmlEl); if (host) return host; }
    if (OTSL_CONTAINER_TAGS.has(tag)) { const host = findTableVirtualTextHost(parent, xmlEl); if (host) return host; }
    node = parent;
  }
  return null;
}

function resolveSelectionElement(xmlEl: Element | null): Element | null {
  if (!xmlEl) return null;
  if (isSemanticElement(xmlEl) || isVirtualTextHost(xmlEl)) return xmlEl;
  let node: Element | null = xmlEl.parentElement;
  while (node) {
    if (localName(node) === 'doclang') break;
    if (isSemanticElement(node) && !isListOrOtslContainer(node)) return node;
    node = node.parentElement;
  }
  const virtualHost = findVirtualTextHost(xmlEl);
  if (virtualHost) return virtualHost;
  node = xmlEl.parentElement;
  while (node) {
    if (localName(node) === 'doclang') break;
    if (isSemanticElement(node) || isVirtualTextHost(node)) return node;
    node = node.parentElement;
  }
  return null;
}

function resolveSelectionElementId(rawElementId: string | null): string | null {
  if (!rawElementId || !state?.idToElement || !state.elementIds) return null;
  const xmlEl = state.idToElement.get(rawElementId);
  if (!xmlEl) return null;
  const resolved = resolveSelectionElement(xmlEl);
  return resolved ? (state.elementIds.get(resolved) ?? null) : null;
}

function selectElement(elementId: string): void {
  if (!elementId) return;
  selectedElementId = elementId;
  applySelection();
}

function clearSelection(): void {
  selectedElementId = null;
  applySelection();
}

function fragmentPeerElementIds(elementId: string): Set<string> {
  const peers = new Set<string>();
  if (!elementId || !state?.elementIds || !state.idToElement) return peers;
  const el = state.idToElement.get(elementId);
  const threadId = el ? elementThreadId(el) : null;
  if (!threadId) return peers;
  for (const [node, id] of state.elementIds) {
    if (elementThreadId(node) === threadId) peers.add(id);
  }
  return peers;
}

function isPictureContentOverlayElement(elementId: string): boolean {
  return isPictureContentElement(state?.idToElement?.get(elementId) ?? null);
}
function isTableContentOverlayElement(elementId: string): boolean {
  return isTableContentElement(state?.idToElement?.get(elementId) ?? null);
}
function isContentsOptionHidden(elementId: string, clickVisible: boolean): boolean {
  if (clickVisible) return false;
  if (!showPictureContents && isPictureContentOverlayElement(elementId)) return true;
  if (!showTableContents && isTableContentOverlayElement(elementId)) return true;
  return false;
}

function isFragmentLinkRelevant(linkEl: Element, peerIds: Set<string>): boolean {
  const fromId = linkEl.getAttribute('data-fragment-from-id');
  const toId = linkEl.getAttribute('data-fragment-to-id');
  if (fromId && peerIds.has(fromId)) return true;
  if (toId && peerIds.has(toId)) return true;
  return false;
}

function applyBboxVisibility(): void {
  if (!state?.hasPageView || !els.pagePane) return;
  const peerIds = selectedElementId ? fragmentPeerElementIds(selectedElementId) : new Set<string>();

  for (const el of els.pagePane.querySelectorAll('.bbox')) {
    el.classList.remove('related');
    const elementId = el.getAttribute('data-element-id') ?? '';
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    if (showAllBboxes) {
      if (isContentsOptionHidden(elementId, clickVisible)) { el.classList.add('bbox-hidden'); }
      else { el.classList.remove('bbox-hidden'); if (peerIds.has(elementId)) el.classList.add('related'); }
      continue;
    }
    if (elementId === selectedElementId) { el.classList.remove('bbox-hidden'); }
    else if (peerIds.has(elementId)) { el.classList.remove('bbox-hidden'); el.classList.add('related'); }
    else { el.classList.add('bbox-hidden'); }
  }

  for (const el of els.pagePane.querySelectorAll('.element-badge')) {
    const elementId = el.getAttribute('data-element-id') ?? '';
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    if (!showAllBboxes || !showLayoutBadges) { el.classList.add('bbox-hidden'); continue; }
    if (isContentsOptionHidden(elementId, clickVisible)) el.classList.add('bbox-hidden');
    else el.classList.remove('bbox-hidden');
  }

  for (const el of els.pagePane.querySelectorAll('.caption-link')) {
    if (!showAllBboxes || !showCaptionLinks) { el.classList.add('bbox-hidden'); continue; }
    el.classList.remove('bbox-hidden');
  }
  for (const el of els.pagePane.querySelectorAll('.xref-link')) {
    if (!showAllBboxes || !showXrefLinks) { el.classList.add('bbox-hidden'); continue; }
    el.classList.remove('bbox-hidden');
  }
  for (const el of els.pagePane.querySelectorAll('.fragment-link')) {
    const clickVisible = Boolean(selectedElementId && isFragmentLinkRelevant(el, peerIds));
    el.classList.toggle('bbox-hidden', !(clickVisible || (showAllBboxes && showFragmentLinks)));
  }
  for (const el of els.pagePane.querySelectorAll('.fragment-nav')) {
    const elementId = el.getAttribute('data-element-id') ?? '';
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    el.classList.toggle('bbox-hidden', !(clickVisible || (showAllBboxes && showFragmentLinks)));
  }
  for (const el of els.pagePane.querySelectorAll('.reading-order-badge')) {
    const elementId = el.getAttribute('data-element-id') ?? '';
    const clickVisible = elementId === selectedElementId || peerIds.has(elementId);
    if (!showAllBboxes || !showReadingOrder) { el.classList.add('bbox-hidden'); continue; }
    if (isPictureContentOverlayElement(elementId) || isTableContentOverlayElement(elementId) || isContentsOptionHidden(elementId, clickVisible)) {
      el.classList.add('bbox-hidden'); continue;
    }
    el.classList.remove('bbox-hidden');
  }
  for (const el of els.pagePane.querySelectorAll('.reading-order-step')) {
    if (!showAllBboxes || !showReadingOrder || !showReadingOrderArrows) { el.classList.add('bbox-hidden'); continue; }
    el.classList.remove('bbox-hidden');
  }
}

function findMarkupElementForSelection(elementId: string): Element | null {
  if (!els.markupPane) return null;
  return (
    els.markupPane.querySelector(`.markup-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.markupPane.querySelector(`[data-element-id="${elementId}"]`)
  );
}

function findRenderedElementForSelection(elementId: string): Element | null {
  if (!els.renderedPane) return null;
  const direct =
    els.renderedPane.querySelector(`.rendered-el-virtual-text[data-element-id="${elementId}"]`) ||
    els.renderedPane.querySelector(`.rendered-el[data-element-id="${elementId}"]`);
  if (direct) return direct;
  const xmlEl = state?.idToElement?.get(elementId);
  const threadId = xmlEl ? elementThreadId(xmlEl) : null;
  if (!threadId) return null;
  const merged = els.renderedPane.querySelector(`.rendered-fragment-merged[data-thread-id="${threadId}"]`);
  if (!merged) return null;
  const primaryId = merged.getAttribute('data-element-id');
  if (!primaryId || primaryId === elementId) return merged;
  return fragmentPeerElementIds(primaryId).has(elementId) ? merged : null;
}

function revealReadingLayerForSelection(renderedEl: Element): void {
  const layer = renderedEl.getAttribute('data-doclang-layer');
  if (!layer || layer === 'body') return;
  let changed = false;
  if (layer === 'furniture' && !showReadingFurniture) { showReadingFurniture = true; changed = true; }
  else if (layer === 'background' && !showReadingBackground) { showReadingBackground = true; changed = true; }
  if (!changed) return;
  syncReadingLayerCheckboxes();
  syncReadingLayerVisibility();
}

function revealRenderedSelectionContext(renderedEl: Element): void {
  const pictureContents = renderedEl.closest('.rendered-picture-contents') as HTMLDetailsElement | null;
  if (pictureContents && !pictureContents.open) pictureContents.open = true;
  revealReadingLayerForSelection(renderedEl);
}

function applySelection(): void {
  els.markupPane?.querySelectorAll('.markup-el.selected').forEach(el => el.classList.remove('selected'));
  els.renderedPane?.querySelectorAll('.rendered-el.selected').forEach(el => el.classList.remove('selected'));
  if (!els.pagePane) return;
  els.pagePane.querySelectorAll('.bbox.selected, .overlay-badge.selected').forEach(el => el.classList.remove('selected'));

  if (!selectedElementId) {
    const img = els.pagePane.querySelector('.page-view img') as HTMLImageElement | null;
    if (img) {
      const svg = img.parentElement?.querySelector('svg.overlay') as SVGSVGElement | null;
      if (svg && state?.pageViewOverlay) {
        syncOverlayBadges(img, svg, state.pageViewOverlay.boxes, state.pageViewOverlay.readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder);
      }
    }
    applyBboxVisibility(); return;
  }

  const markupEl = findMarkupElementForSelection(selectedElementId);
  if (markupEl) { markupEl.classList.add('selected'); markupEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

  const renderedEl = findRenderedElementForSelection(selectedElementId);
  if (renderedEl) {
    revealRenderedSelectionContext(renderedEl);
    renderedEl.classList.add('selected');
    renderedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  if (state?.hasPageView) {
    for (const el of els.pagePane.querySelectorAll(`[data-element-id="${selectedElementId}"]`)) {
      el.classList.add('selected');
    }
  }

  const img = els.pagePane.querySelector('.page-view img') as HTMLImageElement | null;
  if (img) {
    const svg = img.parentElement?.querySelector('svg.overlay') as SVGSVGElement | null;
    if (svg && state?.pageViewOverlay) {
      syncOverlayBadges(img, svg, state.pageViewOverlay.boxes, state.pageViewOverlay.readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder);
    }
  }
  applyBboxVisibility();
}

// ---------------------------------------------------------------------------
// Page rendering
// ---------------------------------------------------------------------------

function renderPage(pageNum: number): void {
  if (!state) return;
  const { segments, pageImages, pageCount, defaultResolution } = state;
  const idx = pageNum - 1;
  const segment = segments[idx] ?? [];
  selectedElementId = null;

  setPageIndicator(pageNum, pageCount);
  if (els.btnPrev) els.btnPrev.disabled = pageNum <= 1;
  if (els.btnNext) els.btnNext.disabled = pageNum >= pageCount;

  if (!els.markupPane || !els.renderedPane || !els.pagePane) return;

  els.markupPane.innerHTML = '';
  const elementIds = assignElementIds(segment);
  state.elementIds = elementIds;
  state.idToElement = invertElementIds(elementIds);

  if (segmentHasMarkup(segment)) {
    els.markupPane.appendChild(buildMarkupView(segment, elementIds, id => selectElement(resolveSelectionElementId(id) ?? id)));
    els.renderedPane.innerHTML = '';
    els.renderedPane.appendChild(buildRenderedView(segment, elementIds, showReadingFurniture, showReadingBackground, id => selectElement(resolveSelectionElementId(id) ?? id)));
  } else {
    els.markupPane.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    els.renderedPane.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
  }

  els.pagePane.innerHTML = '';
  if (state.hasPageView) {
    const imageUrl = pageImages.get(pageNum);
    if (imageUrl) {
      const port = document.createElement('div');
      port.className = 'page-view-port';
      const wrap = document.createElement('div');
      wrap.className = 'page-view';
      const img = document.createElement('img');
      img.alt = `Page ${pageNum}`;

      const onImageReady = (): void => {
        if (img.dataset.layoutGeneration === String(pageNum)) return;
        img.dataset.layoutGeneration = String(pageNum);
        applyPageImageSize(img, els.pagePane!);
        const boxes = collectBoundingBoxes(segment, defaultResolution, elementIds);
        const existing = wrap.querySelector('svg.overlay');
        if (existing) existing.remove();
        const readingOrderSteps = collectReadingOrderSteps(
          segment, elementIds, boxes,
          state!.readingOrder, readingOrderGlobalNumbering, state!.readingOrderDisplayNumbers
        );
        state!.pageViewOverlay = { boxes, readingOrderSteps };
        if (boxes.length) {
          wrap.appendChild(
            buildOverlay(
              img, boxes,
              collectCaptionLinks(segment, elementIds, boxes),
              collectXrefLinks(segment, elementIds, boxes),
              readingOrderSteps,
              collectFragmentLinks(segment, elementIds, boxes, pageNum, state!.threadPagesById),
              collectFragmentNavItems(segment, elementIds, boxes, state!.threadNavByElement),
              defaultResolution,
              id => selectElement(resolveSelectionElementId(id) ?? id),
              navigateThreadFragment,
              clearSelection,
              () => pagePanSuppressClick,
              v => { pagePanSuppressClick = v; }
            )
          );
        }
        syncPageViewChrome(img);
        const pending = state!.pendingSelectElement;
        if (pending) {
          state!.pendingSelectElement = null;
          const id = findElementIdOnPage(pending);
          if (id) selectElement(id);
        }
      };

      img.addEventListener('load', onImageReady, { once: true });
      wrap.appendChild(img);
      port.appendChild(wrap);
      els.pagePane.appendChild(port);
      img.src = imageUrl;
      if (img.complete) onImageReady();

      if (!pagePaneResizeObserver) {
        pagePaneResizeObserver = new ResizeObserver(() => refreshPageViewLayout());
        pagePaneResizeObserver.observe(els.pagePane);
      }
    } else {
      els.pagePane.innerHTML = `<div class="placeholder">${NO_IMAGE}</div>`;
    }
  }
}

// ---------------------------------------------------------------------------
// Document open/close/label
// ---------------------------------------------------------------------------

function setDocLabel(label: string | null): void {
  if (!els.docLabel) return;
  if (label) { els.docLabel.textContent = label; els.docLabel.hidden = false; }
  else { els.docLabel.textContent = ''; els.docLabel.hidden = true; }
}

function setDocumentOpen(open: boolean, { markupOnly = false } = {}): void {
  document.body.classList.toggle('viewer-loaded', open);
  document.body.classList.toggle('markup-only', open && markupOnly);
  if (els.pageNav) els.pageNav.hidden = !open || markupOnly;
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function setPageViewVisible(visible: boolean): void {
  document.body.classList.toggle('has-page-view', visible);
  syncPagePaneControls();
  syncToolbarPaneCheckboxes();
  if (!visible) setPageSettingsOpen(false);
  applyPaneLayout();
  syncLayoutSubtoggles();
}

function resetViewer(): void {
  setDemoLoading(false);
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
  document.body.classList.remove('has-page-view');
  closeAllSettings();
  setToolbarOptionsOpen(false);
  if (els.markupPane) els.markupPane.innerHTML = '';
  if (els.renderedPane) els.renderedPane.innerHTML = '';
  if (els.pagePane) els.pagePane.innerHTML = '';
  setPageIndicator(1, 1);
  if (els.btnPrev) els.btnPrev.disabled = true;
  if (els.btnNext) els.btnNext.disabled = true;
  if (els.filePane) els.filePane.replaceChildren();
  updateFileView();
  applyPaneLayout();
}

// ---------------------------------------------------------------------------
// File catalog helpers
// ---------------------------------------------------------------------------

function pageImageMimeFromExt(ext: string): string {
  const normalized = ext.toLowerCase().replace('jpeg', 'jpg');
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function createPageImageObjectUrl(data: Uint8Array, ext: string): string {
  return URL.createObjectURL(new Blob([data as BlobPart], { type: pageImageMimeFromExt(ext) }));
}

function createFirstPageImageUrlFromFiles(files: File[]): string | null {
  let bestPage = Infinity;
  let bestFile: File | null = null;
  for (const f of files) {
    const relPath = f.webkitRelativePath || f.name;
    const parts = relPath.split('/');
    if (parts.length < 2 || parts[parts.length - 2] !== 'pages') continue;
    const m = PAGE_IMAGE_RE.exec(f.name);
    if (!m) continue;
    const pageNum = Number(m[1]);
    if (pageNum < bestPage) { bestPage = pageNum; bestFile = f; }
  }
  return bestFile ? URL.createObjectURL(bestFile) : null;
}

async function createFirstPageImageUrlFromZip(source: File | ArrayBuffer): Promise<string | null> {
  const buffer = source instanceof File ? await source.arrayBuffer() : source;
  const entries = await unzip(buffer, {
    shouldExtract: name => /^pages\/\d+\.(png|jpe?g|webp)$/i.test(name),
  });
  let bestPage = Infinity;
  let bestEntry: { name: string; data: Uint8Array } | null = null;
  for (const e of entries) {
    const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
    if (!m) continue;
    const pageNum = Number(m[1]);
    if (pageNum < bestPage) { bestPage = pageNum; bestEntry = e; }
  }
  if (!bestEntry) return null;
  const ext = bestEntry.name.split('.').pop() ?? 'png';
  return createPageImageObjectUrl(bestEntry.data, ext);
}

async function resolveCatalogEntryThumbnail(entry: FileCatalogEntry): Promise<string | null> {
  if (entry.thumbnailUrl) return entry.thumbnailUrl;
  if (entry.kind === 'markup') return null;
  try {
    if (entry.kind === 'folder') {
      entry.thumbnailUrl = createFirstPageImageUrlFromFiles(entry.source as File[]);
    } else if (entry.kind === 'archive') {
      entry.thumbnailUrl = await createFirstPageImageUrlFromZip(entry.source as File | ArrayBuffer);
    }
  } catch { entry.thumbnailUrl = null; }
  return entry.thumbnailUrl;
}

function enrichCatalogEntryThumbnail(entry: FileCatalogEntry): void {
  resolveCatalogEntryThumbnail(entry).then(url => {
    if (!fileCatalog.includes(entry)) {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      return;
    }
    if (url) renderFileView();
  });
}

function revokeCatalogEntry(entry: FileCatalogEntry | null): void {
  if (entry?.thumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(entry.thumbnailUrl);
  if (entry) entry.thumbnailUrl = null;
}

function createFileViewThumbnail(entry: FileCatalogEntry): HTMLElement {
  const thumb = document.createElement('span');
  thumb.className = 'file-view-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  if (entry.thumbnailUrl) {
    const img = document.createElement('img');
    img.src = entry.thumbnailUrl;
    img.alt = '';
    thumb.appendChild(img);
  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'file-view-thumb-placeholder';
    placeholder.innerHTML = FILE_THUMB_PLACEHOLDER_SVG;
    thumb.appendChild(placeholder);
  }
  return thumb;
}

function createFileCatalogEntry(file: File): FileCatalogEntry {
  return {
    id: crypto.randomUUID(),
    label: file.name,
    kind: isMarkupFile(file) ? 'markup' : 'archive',
    source: file,
    currentPage: 1,
    pageZoom: PAGE_ZOOM_DEFAULT,
    snapshot: null,
    thumbnailUrl: null,
  };
}

function isArchiveFile(file: File): boolean {
  return /\.dclx$/i.test(file.name) || /\.zip$/i.test(file.name);
}

function isMarkupFile(file: File): boolean {
  return /\.(?:dclg(?:\.xml)?|xml)$/i.test(file.name);
}

function hasArchiveTransfer(dataTransfer: DataTransfer | null): boolean {
  return Boolean(dataTransfer && [...dataTransfer.types].includes('Files'));
}

async function parseCatalogEntry(entry: FileCatalogEntry): Promise<DocumentState | null> {
  try {
    if (entry.kind === 'markup') {
      const text = entry.source instanceof File
        ? await (entry.source as File).text()
        : new TextDecoder().decode(entry.source as ArrayBuffer);
      return buildDocumentState(text, new Map(), entry.label, new Map(), { markupOnly: true });
    }
    if (entry.kind === 'archive') {
      const buffer = entry.source instanceof File
        ? await (entry.source as File).arrayBuffer()
        : entry.source as ArrayBuffer;
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromZipBuffer(buffer);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
    }
    if (entry.kind === 'folder') {
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromFiles(entry.source as File[]);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
    }
  } catch (err) {
    alert(`Failed to read ${entry.label}: ${(err as Error).message}`);
  }
  return null;
}

function persistActiveFileViewState(): void {
  if (activeFileIndex < 0 || !state) return;
  const entry = fileCatalog[activeFileIndex];
  if (!entry) return;
  entry.currentPage = state.currentPage;
  entry.pageZoom = pageZoomPercent;
}

function releaseActiveDocument(): void {
  if (activeFileIndex >= 0) {
    const entry = fileCatalog[activeFileIndex];
    if (entry?.snapshot) { revokeDocumentState(entry.snapshot); entry.snapshot = null; }
  }
  if (state) revokeDocumentState(state);
  state = null;
  selectedElementId = null;
  pagePanDrag = null;
  pagePanSuppressClick = false;
}

function clearFileCatalog(): void {
  releaseActiveDocument();
  for (const entry of fileCatalog) revokeCatalogEntry(entry);
  fileCatalog = [];
  activeFileIndex = -1;
}

async function switchToFile(index: number): Promise<void> {
  if (index < 0 || index >= fileCatalog.length) return;
  persistActiveFileViewState();
  releaseActiveDocument();
  activeFileIndex = index;
  const entry = fileCatalog[index]!;
  const docState = await parseCatalogEntry(entry);
  if (!docState) {
    revokeCatalogEntry(entry);
    fileCatalog.splice(index, 1);
    activeFileIndex = -1;
    if (fileCatalog.length) { await switchToFile(Math.min(index, fileCatalog.length - 1)); }
    else resetViewer();
    return;
  }
  entry.snapshot = docState;
  docState.currentPage = entry.currentPage ?? 1;
  activateDocument(docState, entry);
}

function defaultFilePaneVisible(): boolean {
  return fileCatalog.length > 1;
}

function syncFilePaneDefault(): void {
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

async function closeCatalogFile(index: number): Promise<void> {
  if (index < 0 || index >= fileCatalog.length) return;
  const wasActive = index === activeFileIndex;
  const entry = fileCatalog[index]!;
  if (wasActive) { releaseActiveDocument(); activeFileIndex = -1; }
  revokeCatalogEntry(entry);
  fileCatalog.splice(index, 1);
  if (!fileCatalog.length) { resetViewer(); return; }
  if (wasActive) { await switchToFile(Math.min(index, fileCatalog.length - 1)); return; }
  if (index < activeFileIndex) activeFileIndex -= 1;
  updateFileView();
}

function renderFileView(): void {
  if (!els.filePane) return;
  els.filePane.replaceChildren();
  if (!fileCatalog.length) return;
  const list = document.createElement('ul');
  list.className = 'file-view-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Open files');
  fileCatalog.forEach((entry, index) => {
    const item = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'file-view-item';
    card.title = entry.label;
    card.tabIndex = 0;
    card.setAttribute('role', 'option');
    if (index === activeFileIndex) { card.classList.add('is-active'); card.setAttribute('aria-selected', 'true'); }
    else card.setAttribute('aria-selected', 'false');
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'file-view-thumb-wrap';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'file-view-close';
    closeBtn.setAttribute('aria-label', `Close ${entry.label}`);
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', e => { e.stopPropagation(); closeCatalogFile(index); });
    thumbWrap.append(createFileViewThumbnail(entry), closeBtn);
    const label = document.createElement('span');
    label.className = 'file-view-label';
    label.textContent = entry.label;
    card.append(thumbWrap, label);
    card.addEventListener('click', e => { if ((e.target as Element).closest('.file-view-close')) return; switchToFile(index); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchToFile(index); } });
    item.appendChild(card);
    list.appendChild(item);
  });
  els.filePane.appendChild(list);
}

function updateFileView(): void {
  syncFilePaneDefault();
  syncFilePaneCloseAllButton();
  renderFileView();
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function syncFilePaneCloseAllButton(): void {
  if (!els.filePaneCloseAll) return;
  els.filePaneCloseAll.hidden = fileCatalog.length === 0;
}

function initFilePaneCloseAll(): void {
  els.filePaneCloseAll?.addEventListener('click', () => {
    if (!fileCatalog.length) return;
    const count = fileCatalog.length;
    const message = count === 1
      ? `Remove "${fileCatalog[0]!.label}" from the viewer?`
      : `Remove all ${count} open files from the viewer?`;
    if (confirm(message)) resetViewer();
  });
}

function activateDocument(docState: DocumentState, entry: FileCatalogEntry): void {
  state = docState;
  pageLayoutCache = null;
  closeAllSettings();
  pageZoomPercent = entry.pageZoom ?? PAGE_ZOOM_DEFAULT;
  if (els.pageZoom) {
    els.pageZoom.value = String(pageZoomPercent);
    els.pageZoom.setAttribute('aria-valuenow', String(pageZoomPercent));
  }
  updatePageZoomResetButton();
  const port = pageViewScrollPane();
  if (port) { port.scrollLeft = 0; port.scrollTop = 0; }
  setDocLabel(entry.label);
  setDocumentOpen(true, { markupOnly: state.markupOnly });
  setPageViewVisible(state.hasPageView);
  renderPage(state.currentPage);
  updateFileView();
}

// ---------------------------------------------------------------------------
// Demo loading
// ---------------------------------------------------------------------------

declare const DEMO_ARCHIVE_URL: string;

function setDemoLoading(loading: boolean): void {
  document.body.classList.toggle('demo-loading', loading);
  const btnDemo = document.getElementById('btn-demo') as HTMLButtonElement | null;
  if (btnDemo) btnDemo.disabled = loading;
}

async function loadDemo(): Promise<void> {
  if (demoLoadInProgress) return;
  demoLoadInProgress = true;
  setDemoLoading(true);
  try {
    const res = await fetch(DEMO_ARCHIVE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const label = DEMO_ARCHIVE_URL.split('/').pop() || 'demo.dclx';
    await addArchiveBufferToCatalog(await res.arrayBuffer(), label, { replace: true });
  } catch (err) {
    alert(`Failed to load demo: ${(err as Error).message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`);
  } finally {
    demoLoadInProgress = false;
    if (!document.body.classList.contains('viewer-loaded')) setDemoLoading(false);
  }
}

async function addFilesToCatalog(files: File[], { replace = false } = {}): Promise<void> {
  if (replace) { clearFileCatalog(); filePaneUserToggled = false; }
  const startIndex = fileCatalog.length;
  for (const file of files) {
    const entry = createFileCatalogEntry(file);
    fileCatalog.push(entry);
    enrichCatalogEntryThumbnail(entry);
  }
  if (!fileCatalog.length) return;
  await switchToFile(replace ? 0 : startIndex);
}

async function appendFolderArchive(files: File[]): Promise<void> {
  if (!files.some(f => f.name === 'document.xml')) { alert('Archive must contain document.xml at its root.'); return; }
  const rootName = (files[0]!.webkitRelativePath || files[0]!.name).split('/')[0] || 'archive';
  const entry: FileCatalogEntry = {
    id: crypto.randomUUID(), label: rootName, kind: 'folder', source: files,
    currentPage: 1, pageZoom: PAGE_ZOOM_DEFAULT, snapshot: null, thumbnailUrl: null,
  };
  fileCatalog.push(entry);
  enrichCatalogEntryThumbnail(entry);
  await switchToFile(fileCatalog.length - 1);
}

async function addArchiveBufferToCatalog(buffer: ArrayBuffer, label: string, { replace = false } = {}): Promise<void> {
  if (replace) { clearFileCatalog(); filePaneUserToggled = false; }
  const entry: FileCatalogEntry = {
    id: crypto.randomUUID(), label, kind: 'archive', source: buffer,
    currentPage: 1, pageZoom: PAGE_ZOOM_DEFAULT, snapshot: null, thumbnailUrl: null,
  };
  fileCatalog.push(entry);
  enrichCatalogEntryThumbnail(entry);
  await switchToFile(replace ? 0 : fileCatalog.length - 1);
}

async function loadFromDrop(dataTransfer: DataTransfer): Promise<void> {
  const files = [...dataTransfer.files];
  if (files.some(f => f.name === 'document.xml')) { await appendFolderArchive(files); return; }
  const supported = files.filter(f => isArchiveFile(f) || isMarkupFile(f));
  if (supported.length) await addFilesToCatalog(supported, { replace: false });
}

// ---------------------------------------------------------------------------
// Wheel navigation
// ---------------------------------------------------------------------------

function initPageWheelNav(): void {
  if (!els.pagePane) return;
  let pixelAccum = 0;
  let pixelGestureUntil = 0;
  let lastFlipAt = 0;

  function wheelDir(e: WheelEvent): number {
    if (e.deltaMode === 1) return e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (e.deltaMode === 2) return Math.sign(e.deltaY);
    const now = performance.now();
    if (now > pixelGestureUntil) pixelAccum = 0;
    pixelGestureUntil = now + PAGE_WHEEL_GESTURE_MS;
    pixelAccum += e.deltaY;
    if (Math.abs(pixelAccum) >= PAGE_WHEEL_PIXEL_THRESHOLD) {
      const dir = pixelAccum > 0 ? 1 : -1; pixelAccum = 0; return dir;
    }
    return 0;
  }

  function tryFlipPage(dir: number): boolean {
    if (!dir || !state) return false;
    const now = performance.now();
    if (now - lastFlipAt < PAGE_WHEEL_COOLDOWN_MS) return false;
    const before = state.currentPage;
    goToPage(state.currentPage + dir);
    if (state.currentPage !== before) { lastFlipAt = now; return true; }
    return false;
  }

  function isScrollAtTop(pane: HTMLElement): boolean { return pane.scrollTop <= 0; }
  function isScrollAtBottom(pane: HTMLElement): boolean { return pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1; }

  function onScrollPaneWheel(e: WheelEvent, pane: HTMLElement): void {
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
    requestAnimationFrame(() => { pane.scrollTop = dir > 0 ? 0 : pane.scrollHeight; });
  }

  els.pagePane.addEventListener('wheel', e => {
    if (!state?.hasPageView) return;
    const pane = pageViewScrollPane();
    if (!pane) return;
    const scrollable = pane.scrollHeight > pane.clientHeight || pane.scrollWidth > pane.clientWidth;
    if (scrollable) { onScrollPaneWheel(e, pane); return; }
    e.preventDefault();
    const dir = wheelDir(e);
    if (dir) tryFlipPage(dir);
  }, { passive: false });

  for (const pane of [els.markupPane, els.renderedPane]) {
    if (!pane) continue;
    pane.addEventListener('wheel', e => onScrollPaneWheel(e as WheelEvent, pane), { passive: false });
  }

  els.pagePane.tabIndex = 0;
  els.pagePane.setAttribute('role', 'region');
  els.pagePane.setAttribute('aria-label', 'Original page');
  els.pagePane.addEventListener('pointerdown', () => { if (state?.hasPageView) els.pagePane!.focus({ preventScroll: true }); });
  els.pagePane.addEventListener('keydown', e => {
    if (!state?.hasPageView) return;
    switch (e.key) {
      case 'ArrowDown': case 'PageDown': case 'ArrowRight': e.preventDefault(); tryFlipPage(1); break;
      case 'ArrowUp': case 'PageUp': case 'ArrowLeft': e.preventDefault(); tryFlipPage(-1); break;
    }
  });
}

// ---------------------------------------------------------------------------
// Page pan controls
// ---------------------------------------------------------------------------

function canStartPagePan(event: PointerEvent): boolean {
  if (!(event.target instanceof Element)) return false;
  if (!event.target.closest('.page-view')) return false;
  return isPagePaneScrollable();
}

function initPageViewControls(): void {
  if (!els.pagePane) return;
  els.pageZoom?.addEventListener('input', () => {
    pageZoomPercent = Math.max(PAGE_ZOOM_DEFAULT, Number(els.pageZoom!.value));
    if (Number(els.pageZoom!.value) < PAGE_ZOOM_DEFAULT) els.pageZoom!.value = String(pageZoomPercent);
    els.pageZoom!.setAttribute('aria-valuenow', String(pageZoomPercent));
    updatePageZoomResetButton();
    refreshPageViewLayout();
  });
  els.pageZoomReset?.addEventListener('click', () => { if (pageZoomPercent !== PAGE_ZOOM_DEFAULT) resetPageZoom(); });

  els.pagePane.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !canStartPagePan(e)) return;
    const scrollPane = pageViewScrollPane();
    if (!scrollPane) return;
    pagePanDrag = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, scrollLeft: scrollPane.scrollLeft, scrollTop: scrollPane.scrollTop, moved: false };
  });

  els.pagePane.addEventListener('pointermove', e => {
    if (!pagePanDrag || e.pointerId !== pagePanDrag.pointerId) return;
    const dx = e.clientX - pagePanDrag.startX;
    const dy = e.clientY - pagePanDrag.startY;
    if (!pagePanDrag.moved && Math.hypot(dx, dy) >= PAGE_PAN_DRAG_THRESHOLD) {
      pagePanDrag.moved = true;
      els.pagePane!.classList.add('is-panning');
      els.pagePane!.classList.remove('can-pan');
      els.pagePane!.setPointerCapture(e.pointerId);
    }
    if (!pagePanDrag.moved) return;
    const scrollPane = pageViewScrollPane();
    if (!scrollPane) return;
    scrollPane.scrollLeft = pagePanDrag.scrollLeft + pagePanDrag.startX - e.clientX;
    scrollPane.scrollTop = pagePanDrag.scrollTop + pagePanDrag.startY - e.clientY;
    e.preventDefault();
  });

  function endPagePan(e: PointerEvent): void {
    if (!pagePanDrag || e.pointerId !== pagePanDrag.pointerId) return;
    if (pagePanDrag.moved) pagePanSuppressClick = true;
    pagePanDrag = null;
    els.pagePane!.classList.remove('is-panning');
    if (els.pagePane!.hasPointerCapture(e.pointerId)) els.pagePane!.releasePointerCapture(e.pointerId);
    updatePagePanePanCursor();
  }

  els.pagePane.addEventListener('pointerup', e => endPagePan(e as PointerEvent));
  els.pagePane.addEventListener('pointercancel', e => endPagePan(e as PointerEvent));
}

// ---------------------------------------------------------------------------
// Hints / drag-drop init
// ---------------------------------------------------------------------------

function initFileTypeHints(): void {
  if (!els.emptyStateFileTypes) return;
  const markup = SUPPORTED_FILE_EXTENSIONS.map(ext => `<code>${ext}</code>`).join(', ');
  els.emptyStateFileTypes.innerHTML = markup;
}

function initCursorHints(): void {
  els.markupPane?.addEventListener('mousemove', e => {
    if (!(e.target as Element).closest('.markup-ghost-tag-part')) { hideCursorHint(); return; }
    showCursorHint(VIRTUAL_TEXT_TAG_HINT, e.clientX, e.clientY);
  });
  els.markupPane?.addEventListener('mouseleave', hideCursorHint);
  els.openFileBtn?.addEventListener('mousemove', e => showCursorHint(OPEN_FILE_HINT, e.clientX, e.clientY));
  els.openFileBtn?.addEventListener('mouseleave', hideCursorHint);
}

function initBboxHints(): void {
  if (!els.pagePane) return;
  els.pagePane.addEventListener('mousemove', e => {
    if (pagePanDrag?.moved || els.pagePane!.classList.contains('is-panning')) { hideCursorHint(); return; }
    const navBtn = (e.target as Element).closest('.fragment-nav-btn:not(.fragment-nav-btn-disabled)');
    if (navBtn) {
      const hint = navBtn.getAttribute('data-nav') === 'prev' ? FRAGMENT_NAV_HINT_PREV : FRAGMENT_NAV_HINT_NEXT;
      showCursorHint(hint, e.clientX, e.clientY); return;
    }
    const badge = (e.target as Element).closest('.element-badge[data-element-id]');
    if (!badge || !state?.idToElement) { hideCursorHint(); return; }
    const elementId = badge.getAttribute('data-element-id');
    const xmlEl = elementId ? state.idToElement.get(elementId) : null;
    if (!xmlEl) { hideCursorHint(); return; }
    showCursorHintHtml(elementHeadTooltipHtml(xmlEl, state.defaultResolution), e.clientX, e.clientY);
  });
  els.pagePane.addEventListener('mouseleave', hideCursorHint);
}

function initDragDrop(): void {
  document.body.addEventListener('dragenter', e => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    e.preventDefault();
    document.body.classList.add('drag-over');
  });
  document.body.addEventListener('dragover', e => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });
  document.body.addEventListener('dragleave', e => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    if (e.relatedTarget && document.body.contains(e.relatedTarget as Node)) return;
    document.body.classList.remove('drag-over');
  });
  document.body.addEventListener('drop', async e => {
    if (!hasArchiveTransfer(e.dataTransfer)) return;
    e.preventDefault();
    document.body.classList.remove('drag-over');
    if (e.dataTransfer) await loadFromDrop(e.dataTransfer);
  });
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

document.getElementById('btn-demo')?.addEventListener('click', loadDemo);
document.getElementById('demo-empty-link')?.addEventListener('click', e => { e.preventDefault(); loadDemo(); });
document.getElementById('home-link')?.addEventListener('click', e => { e.preventDefault(); resetViewer(); });
document.getElementById('input-archive')?.addEventListener('change', async e => {
  const input = e.target as HTMLInputElement;
  const files = [...(input.files ?? [])].filter(f => isArchiveFile(f) || isMarkupFile(f));
  if (!files.length) return;
  await addFilesToCatalog(files, { replace: true });
  input.value = '';
});

els.btnPrev?.addEventListener('click', () => state && goToPage(state.currentPage - 1));
els.btnNext?.addEventListener('click', () => state && goToPage(state.currentPage + 1));

els.pageNumberInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); commitPageNumberInput(); els.pageNumberInput?.blur(); }
  else if (e.key === 'Escape') { e.preventDefault(); resetPageNumberInput(); els.pageNumberInput?.blur(); }
});
els.pageNumberInput?.addEventListener('blur', resetPageNumberInput);
els.pageNumberInput?.addEventListener('focus', e => (e.target as HTMLInputElement).select());

els.showAllBboxes?.addEventListener('change', () => {
  showAllBboxes = els.showAllBboxes!.checked;
  syncLayoutSubtoggles();
  const img = els.pagePane?.querySelector('.page-view img') as HTMLImageElement | null;
  if (img && state?.pageViewOverlay) syncOverlayBadges(img, img.parentElement!.querySelector('svg.overlay') as SVGSVGElement, state.pageViewOverlay.boxes, state.pageViewOverlay.readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder);
  applyBboxVisibility();
});
els.showLayoutBadges?.addEventListener('change', () => {
  showLayoutBadges = els.showLayoutBadges!.checked;
  const img = els.pagePane?.querySelector('.page-view img') as HTMLImageElement | null;
  if (img && state?.pageViewOverlay) syncOverlayBadges(img, img.parentElement!.querySelector('svg.overlay') as SVGSVGElement, state.pageViewOverlay.boxes, state.pageViewOverlay.readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder);
  applyBboxVisibility();
});
els.showCaptionLinks?.addEventListener('change', () => { showCaptionLinks = els.showCaptionLinks!.checked; applyBboxVisibility(); });
els.showPictureContents?.addEventListener('change', () => { showPictureContents = els.showPictureContents!.checked; applyBboxVisibility(); });
els.showTableContents?.addEventListener('change', () => { showTableContents = els.showTableContents!.checked; applyBboxVisibility(); });
els.showFragmentLinks?.addEventListener('change', () => { showFragmentLinks = els.showFragmentLinks!.checked; applyBboxVisibility(); });
els.showXrefLinks?.addEventListener('change', () => { showXrefLinks = els.showXrefLinks!.checked; applyBboxVisibility(); });
els.showReadingOrder?.addEventListener('change', () => {
  showReadingOrder = els.showReadingOrder!.checked;
  syncLayoutSubtoggles();
  const img = els.pagePane?.querySelector('.page-view img') as HTMLImageElement | null;
  if (img && state?.pageViewOverlay) syncOverlayBadges(img, img.parentElement!.querySelector('svg.overlay') as SVGSVGElement, state.pageViewOverlay.boxes, state.pageViewOverlay.readingOrderSteps, showAllBboxes, showLayoutBadges, showReadingOrder);
  applyBboxVisibility();
});
els.readingOrderArrows?.addEventListener('change', () => { showReadingOrderArrows = els.readingOrderArrows!.checked; applyBboxVisibility(); });
els.readingOrderGlobal?.addEventListener('change', () => { readingOrderGlobalNumbering = els.readingOrderGlobal!.checked; if (state) renderPage(state.currentPage); });
els.settingsToggle?.addEventListener('click', () => setPageSettingsOpen(!pageSettingsOpen));
els.readingSettingsToggle?.addEventListener('click', () => setReadingSettingsOpen(!readingSettingsOpen));
els.pageSettingsClose?.addEventListener('click', () => setPageSettingsOpen(false));
els.pageSettingsScrim?.addEventListener('click', () => setPageSettingsOpen(false));
els.readingSettingsClose?.addEventListener('click', () => setReadingSettingsOpen(false));
els.readingSettingsScrim?.addEventListener('click', () => setReadingSettingsOpen(false));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (toolbarOptionsOpen) setToolbarOptionsOpen(false);
  else if (pageSettingsOpen) setPageSettingsOpen(false);
  else if (readingSettingsOpen) setReadingSettingsOpen(false);
});
els.showReadingFurniture?.addEventListener('change', () => { showReadingFurniture = els.showReadingFurniture!.checked; syncReadingLayerVisibility(); });
els.showReadingBackground?.addEventListener('change', () => { showReadingBackground = els.showReadingBackground!.checked; syncReadingLayerVisibility(); });

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

loadLayoutPrefs();
normalizePaneRatios();
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

if (document.getElementById('btn-demo')) loadDemo();
