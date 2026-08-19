/* DocLang Archive Viewer — archive format: github.com/doclang-project/doclang spec.md#doclang-archive-format */

import './components/cursor-hint/cursor-hint';
import './components/page-nav/page-nav';
import './components/toolbar/toolbar';
import './components/file-pane/file-pane';
import './components/markup-pane/markup-pane';
import './components/page-view-pane/page-view-pane';
import './components/reading-pane/reading-pane';
import './components/empty-state/empty-state';
import type { DoclangPageNav } from './components/page-nav/page-nav';
import type { DoclangToolbar } from './components/toolbar/toolbar';
import type { DoclangFilePane } from './components/file-pane/file-pane';
import type { DoclangMarkupPane } from './components/markup-pane/markup-pane';
import type { DoclangPageViewPane } from './components/page-view-pane/page-view-pane';
import type { DoclangReadingPane } from './components/reading-pane/reading-pane';
import type { DoclangEmptyState } from './components/empty-state/empty-state';

import type {
  DocumentState,
  FileCatalogEntry,
  PaneDragState,
  UserPaneVisible,
  PaneKey,
} from './doclang/types';
import {
  CELL_SPAN_TAGS,
  OTSL_CONTAINER_TAGS,
  localName,
  isSemanticElement,
  isVirtualTextHost,
  isListOrOtslContainer,
  xmlContains,
  skipContainerLevelHead,
  skipUntilListItemBoundary,
  skipUntilCellBoundary,
  isCellToken,
} from './doclang/dom';
import {
  PAGE_IMAGE_RE,
  buildDocumentState,
  extractArchiveFromFiles,
  extractArchiveFromZipBuffer,
  revokeDocumentState,
} from './doclang/document';
import { PAGE_ZOOM_DEFAULT } from './components/page-view-pane/overlay';
import { unzip } from './doclang/zip';

const SUPPORTED_FILE_EXTENSIONS = ['.dclx', '.dclg'];
const PAGE_WHEEL_COOLDOWN_MS = 200;
const PAGE_WHEEL_PIXEL_THRESHOLD = 4;
const PAGE_WHEEL_GESTURE_MS = 100;
const LAYOUT_STORAGE_KEY = 'doclang-viewer-pane-layout';
const PANE_MIN_RATIO = 0.12;
const PANE_KEYS = ['file', 'page', 'markup', 'reading'] as const;
const DEFAULT_PANE_RATIOS = [1, 1, 1, 1];
const DEFAULT_USER_PANE_VISIBLE = {
  file: false,
  page: true,
  markup: true,
  reading: true,
};
const LAYOUT_STACK_BREAKPOINT_PX = 1200;

// ---------------------------------------------------------------------------
// Global mutable state
// ---------------------------------------------------------------------------

let state: DocumentState | null = null;
let fileCatalog: FileCatalogEntry[] = [];
let activeFileIndex = -1;
let filePaneUserToggled = false;
let readingSettingsOpen = false;
let userPaneVisible: UserPaneVisible = { ...DEFAULT_USER_PANE_VISIBLE };
let paneRatios: number[] = [...DEFAULT_PANE_RATIOS];
let filePaneWidthPx: number | null = null;
let toolbarOptionsOpen = false;
let paneDrag: PaneDragState | null = null;
let layoutStackQuery: MediaQueryList | null = null;
let demoLoadInProgress = false;

// Wire state accessor into rendered module

// ---------------------------------------------------------------------------
// Web component instances
// ---------------------------------------------------------------------------

const doclangPageNav = document.querySelector(
  'doclang-page-nav'
) as DoclangPageNav | null;
const doclangToolbar = document.querySelector(
  'doclang-toolbar'
) as DoclangToolbar | null;
const doclangFilePane = document.querySelector(
  'doclang-file-pane'
) as DoclangFilePane | null;
const doclangMarkupPane = document.querySelector(
  'doclang-markup-pane'
) as DoclangMarkupPane | null;
const doclangPageViewPane = document.querySelector(
  'doclang-page-view-pane'
) as DoclangPageViewPane | null;
const doclangReadingPane = document.querySelector(
  'doclang-reading-pane'
) as DoclangReadingPane | null;
const doclangEmptyState = document.querySelector(
  'doclang-empty-state'
) as DoclangEmptyState | null;

// ---------------------------------------------------------------------------
// DOM element references
// ---------------------------------------------------------------------------

const els = {
  docLabel: document.getElementById('doc-label'),
  main: document.getElementById('main'),
  emptyState: doclangEmptyState ?? null,
  paneFile: doclangFilePane ?? null,
  panePageView: doclangPageViewPane ?? null,
  paneMarkup: doclangMarkupPane ?? null,
  paneReading: doclangReadingPane ?? null,
  splitters: [
    document.getElementById('splitter-0'),
    document.getElementById('splitter-1'),
    document.getElementById('splitter-2'),
  ] as (HTMLElement | null)[],
};

// ---------------------------------------------------------------------------
// Page zoom / layout
// ---------------------------------------------------------------------------

function resetPageZoom(): void {
  doclangPageViewPane?.resetZoom();
}

// ---------------------------------------------------------------------------
// Settings open/close
// ---------------------------------------------------------------------------

function setReadingSettingsOpen(open: boolean): void {
  readingSettingsOpen = open;
  doclangReadingPane?.setSettingsOpen(open);
}

function closeAllSettings(): void {
  doclangPageViewPane?.closeSettings();
  setReadingSettingsOpen(false);
}

// ---------------------------------------------------------------------------
// Pane layout
// ---------------------------------------------------------------------------

function paneDef(key: PaneKey): {
  key: PaneKey;
  el: HTMLElement | null;
  canShow: () => boolean;
} {
  const defs = {
    file: {
      key: 'file' as PaneKey,
      el: els.paneFile,
      canShow: () => fileCatalog.length > 0,
    },
    page: {
      key: 'page' as PaneKey,
      el: els.panePageView,
      canShow: () => Boolean(state?.hasPageView),
    },
    markup: {
      key: 'markup' as PaneKey,
      el: els.paneMarkup,
      canShow: () => Boolean(state),
    },
    reading: {
      key: 'reading' as PaneKey,
      el: els.paneReading,
      canShow: () => Boolean(state),
    },
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
  probe.style.cssText =
    'position:absolute;visibility:hidden;width:var(--file-pane-fit-width);';
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
  if (sum <= 0) {
    paneRatios = [...DEFAULT_PANE_RATIOS];
    return;
  }
  paneRatios = paneRatios.map(r => r / sum);
}

function loadLayoutPrefs(): void {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as {
      visible?: Record<string, unknown>;
      ratios?: unknown[];
      filePaneWidthPx?: unknown;
    };
    if (data?.visible && typeof data.visible === 'object') {
      for (const key of PANE_KEYS) {
        if (typeof data.visible[key] === 'boolean')
          userPaneVisible[key] = data.visible[key] as boolean;
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
  } catch {
    /* ignore invalid stored layout */
  }
}

function saveLayoutPrefs(): void {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ visible: userPaneVisible, ratios: paneRatios, filePaneWidthPx })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function resetPaneLayout(): void {
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

function resolvedPhysicalSplitterKeys(
  physicalSplitterIndex: number
): { leftKey: PaneKey; rightKey: PaneKey } | null {
  const leftPhysical = PANE_KEYS[physicalSplitterIndex];
  const rightPhysical = PANE_KEYS[physicalSplitterIndex + 1];
  if (!leftPhysical || !rightPhysical) return null;
  const leftKey = isPaneVisible(leftPhysical)
    ? leftPhysical
    : visiblePaneNeighborBefore(rightPhysical);
  const rightKey = isPaneVisible(rightPhysical)
    ? rightPhysical
    : visiblePaneNeighborAfter(leftPhysical);
  if (!leftKey || !rightKey || leftKey === rightKey) return null;
  if (!shouldShowSplitterBetween(leftKey, rightKey)) return null;
  const canonical = splitterForLayoutGap(leftKey, rightKey);
  if (!canonical || canonical !== els.splitters[physicalSplitterIndex]) return null;
  return { leftKey, rightKey };
}

function resetPaneGridStyles(): void {
  for (const key of PANE_KEYS) {
    const el = paneDef(key)?.el;
    if (el) {
      el.style.gridColumn = '';
      el.style.gridRow = '';
    }
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
  const stacked =
    document.body.classList.contains('viewer-loaded') && isLayoutStacked();
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
  if (!keys.length) {
    userPaneVisible.markup = true;
    keys = visiblePaneKeys();
  }

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
    doclangPageViewPane?.refreshLayout();
    doclangReadingPane?.setVisible(isPaneVisible('reading'));
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
    if (
      index < keys.length - 1 &&
      shouldShowSplitterBetween(keys[index]!, keys[index + 1]!)
    ) {
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
      if (splitter) {
        splitter.hidden = false;
        splitter.style.gridColumn = String(col);
        col += 1;
      }
    }
  });

  doclangPageViewPane?.refreshLayout();
  doclangReadingPane?.setVisible(isPaneVisible('reading'));
}

// ---------------------------------------------------------------------------
// Toolbar options
// ---------------------------------------------------------------------------

function setToolbarOptionsOpen(open: boolean): void {
  toolbarOptionsOpen = open;
  doclangToolbar?.setOptionsOpen(open);
}

function syncToolbarPaneCheckboxes(): void {
  doclangToolbar?.syncPaneToggles({
    file: userPaneVisible.file,
    page: userPaneVisible.page,
    markup: userPaneVisible.markup,
    reading: userPaneVisible.reading,
    fileAvailable: isPaneAvailable('file'),
    pageAvailable: isPaneAvailable('page'),
    hasState: Boolean(state),
  });
}

function initToolbarOptions(): void {
  if (!doclangToolbar) return;
  // doclang-toolbar handles its own open/close toggle and click-outside.
  // We listen to the composed events it emits.
  doclangToolbar.addEventListener('doclang-toggle-pane', (e: Event) => {
    const { pane, checked } = (e as CustomEvent<{ pane: PaneKey; checked: boolean }>)
      .detail;
    if (!state) {
      syncToolbarPaneCheckboxes();
      return;
    }
    const nextKeys = [...PANE_KEYS].filter(k =>
      k === pane ? checked : userPaneVisible[k] && isPaneAvailable(k)
    );
    if (!nextKeys.length) {
      syncToolbarPaneCheckboxes();
      return;
    }
    setUserPaneVisible(pane, checked);
  });
  doclangToolbar.addEventListener('doclang-reset-pane-layout', () => {
    if (state) resetPaneLayout();
  });
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
  if (
    e.button !== 0 ||
    isLayoutStacked() ||
    !document.body.classList.contains('viewer-loaded')
  )
    return;
  const resolved = resolvedPhysicalSplitterKeys(physicalSplitterIndex);
  if (!resolved) return;
  const { leftKey, rightKey } = resolved;
  normalizePaneRatios();
  const leftIndex = paneRatioIndex(leftKey);
  const rightIndex = paneRatioIndex(rightKey);
  const dragState: PaneDragState = {
    physicalSplitterIndex,
    leftKey,
    rightKey,
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
    filePaneWidthPx = Math.max(
      filePaneFitWidthPx(),
      paneDrag.leftStartPx + (e.clientX - paneDrag.startX)
    );
    applyPaneLayout();
    return;
  }
  if (paneDrag.rightKey === 'file' && typeof paneDrag.rightStartPx === 'number') {
    filePaneWidthPx = Math.max(
      filePaneFitWidthPx(),
      paneDrag.rightStartPx - (e.clientX - paneDrag.startX)
    );
    applyPaneLayout();
    return;
  }
  const keys = visiblePaneKeys();
  const contentFr = contentPaneFrWeights(keys);
  const contentKeys = keys.filter(
    (key): key is Exclude<PaneKey, 'file'> => key !== 'file'
  );
  const leftContentIndex = contentKeys.indexOf(
    paneDrag.leftKey as Exclude<PaneKey, 'file'>
  );
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
  if (splitter?.hasPointerCapture(e.pointerId))
    splitter.releasePointerCapture(e.pointerId);
  paneDrag = null;
  document.body.classList.remove('pane-drag-active');
  normalizePaneRatios();
  saveLayoutPrefs();
}

function initPaneSplitters(): void {
  for (const [index, splitter] of els.splitters.entries()) {
    if (!splitter) continue;
    splitter.addEventListener('pointerdown', e =>
      startPaneDrag(e as PointerEvent, index)
    );
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
  doclangPageViewPane?.closeSettings();
  const page = Math.min(Math.max(1, n), state.pageCount);
  state.currentPage = page;
  if (doclangMarkupPane) doclangMarkupPane.page = page;
  if (doclangReadingPane) doclangReadingPane.page = page;
  if (doclangPageViewPane) doclangPageViewPane.page = page;
  setPageIndicator(page, state.pageCount);
}

function setPageIndicator(pageNum: number, pageCount: number): void {
  doclangPageNav?.setIndicator(pageNum, pageCount);
}

function syncPagePaneControls(): void {
  const pageVisible = isPaneVisible('page');
  doclangPageViewPane?.setVisible(pageVisible);
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
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node as Element) !== 'ldiv') {
      i += 1;
      continue;
    }
    const ldiv = node as Element;
    i += 1;
    const end = skipUntilListItemBoundary(nodes, i);
    if (target === ldiv || nodes.slice(i, end).some(n => xmlContains(target, n)))
      return ldiv;
    i = end;
  }
  return null;
}

function findTableVirtualTextHost(container: Element, target: Element): Element | null {
  const nodes = [...container.childNodes] as ChildNode[];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node as Element);
    if (
      tag === 'nl' ||
      isVirtualTextHost(node as Element) ||
      CELL_SPAN_TAGS.has(tag) ||
      !isCellToken(tag)
    ) {
      i += 1;
      continue;
    }
    const cell = node as Element;
    i += 1;
    const end = skipUntilCellBoundary(nodes, i);
    if (target === cell || nodes.slice(i, end).some(n => xmlContains(target, n)))
      return cell;
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
    if (tag === 'list') {
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
  if (doclangMarkupPane) doclangMarkupPane.selected = elementId;
  if (doclangReadingPane) doclangReadingPane.selected = elementId;
  if (doclangPageViewPane) doclangPageViewPane.selected = elementId;
}

function clearSelection(): void {
  if (doclangMarkupPane) doclangMarkupPane.selected = null;
  if (doclangReadingPane) doclangReadingPane.selected = null;
  if (doclangPageViewPane) doclangPageViewPane.selected = null;
}

// ---------------------------------------------------------------------------
// Document open/close/label
// ---------------------------------------------------------------------------

function setDocLabel(label: string | null): void {
  if (!els.docLabel) return;
  if (label) {
    els.docLabel.textContent = label;
    els.docLabel.hidden = false;
  } else {
    els.docLabel.textContent = '';
    els.docLabel.hidden = true;
  }
}

function setDocumentOpen(open: boolean, { markupOnly = false } = {}): void {
  document.body.classList.toggle('viewer-loaded', open);
  document.body.classList.toggle('markup-only', open && markupOnly);
  doclangPageNav?.setVisible(open && !markupOnly);
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function setPageViewVisible(visible: boolean): void {
  document.body.classList.toggle('has-page-view', visible);
  syncPagePaneControls();
  syncToolbarPaneCheckboxes();
  if (!visible) doclangPageViewPane?.closeSettings();
  applyPaneLayout();
}

function resetViewer(): void {
  setDemoLoading(false);
  clearFileCatalog();
  filePaneUserToggled = false;
  resetPageZoom();
  setDocLabel(null);
  setDocumentOpen(false);
  document.body.classList.remove('has-page-view');
  closeAllSettings();
  setToolbarOptionsOpen(false);
  if (doclangMarkupPane) doclangMarkupPane.document = null;
  if (doclangReadingPane) doclangReadingPane.document = null;
  if (doclangPageViewPane) doclangPageViewPane.document = null;
  doclangFilePane?.renderFiles([]);
  setPageIndicator(1, 1);
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
  return URL.createObjectURL(
    new Blob([data as BlobPart], { type: pageImageMimeFromExt(ext) })
  );
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
    if (pageNum < bestPage) {
      bestPage = pageNum;
      bestFile = f;
    }
  }
  return bestFile ? URL.createObjectURL(bestFile) : null;
}

async function createFirstPageImageUrlFromZip(
  source: File | ArrayBuffer
): Promise<string | null> {
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
    if (pageNum < bestPage) {
      bestPage = pageNum;
      bestEntry = e;
    }
  }
  if (!bestEntry) return null;
  const ext = bestEntry.name.split('.').pop() ?? 'png';
  return createPageImageObjectUrl(bestEntry.data, ext);
}

async function resolveCatalogEntryThumbnail(
  entry: FileCatalogEntry
): Promise<string | null> {
  if (entry.thumbnailUrl) return entry.thumbnailUrl;
  if (entry.kind === 'markup') return null;
  try {
    if (entry.kind === 'folder') {
      entry.thumbnailUrl = createFirstPageImageUrlFromFiles(entry.source as File[]);
    } else if (entry.kind === 'archive') {
      entry.thumbnailUrl = await createFirstPageImageUrlFromZip(
        entry.source as File | ArrayBuffer
      );
    }
  } catch {
    entry.thumbnailUrl = null;
  }
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

async function parseCatalogEntry(
  entry: FileCatalogEntry
): Promise<DocumentState | null> {
  try {
    if (entry.kind === 'markup') {
      const text =
        entry.source instanceof File
          ? await (entry.source as File).text()
          : new TextDecoder().decode(entry.source as ArrayBuffer);
      return buildDocumentState(text, new Map(), entry.label, new Map(), {
        markupOnly: true,
      });
    }
    if (entry.kind === 'archive') {
      const buffer =
        entry.source instanceof File
          ? await (entry.source as File).arrayBuffer()
          : (entry.source as ArrayBuffer);
      const { markupXml, pageImages, assetUrls } =
        await extractArchiveFromZipBuffer(buffer);
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, {
        markupOnly: false,
      });
    }
    if (entry.kind === 'folder') {
      const { markupXml, pageImages, assetUrls } = await extractArchiveFromFiles(
        entry.source as File[]
      );
      return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, {
        markupOnly: false,
      });
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
  entry.pageZoom = doclangPageViewPane?.zoomPercent ?? PAGE_ZOOM_DEFAULT;
}

function releaseActiveDocument(): void {
  if (activeFileIndex >= 0) {
    const entry = fileCatalog[activeFileIndex];
    if (entry?.snapshot) {
      revokeDocumentState(entry.snapshot);
      entry.snapshot = null;
    }
  }
  if (state) revokeDocumentState(state);
  state = null;
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
    if (fileCatalog.length) {
      await switchToFile(Math.min(index, fileCatalog.length - 1));
    } else resetViewer();
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
  if (index < activeFileIndex) activeFileIndex -= 1;
  updateFileView();
}

function renderFileView(): void {
  if (!doclangFilePane) return;
  doclangFilePane.renderFiles(
    fileCatalog.map((entry, index) => ({
      label: entry.label,
      thumbnailUrl: entry.thumbnailUrl,
      isActive: index === activeFileIndex,
    }))
  );
}

function updateFileView(): void {
  syncFilePaneDefault();
  syncFilePaneCloseAllButton();
  renderFileView();
  syncToolbarPaneCheckboxes();
  applyPaneLayout();
}

function syncFilePaneCloseAllButton(): void {
  // Close-all button visibility is managed inside doclang-file-pane via renderFiles
}

function initFilePaneCloseAll(): void {
  doclangFilePane?.addEventListener('doclang-file-pane-close-all', () => {
    if (!fileCatalog.length) return;
    const count = fileCatalog.length;
    const message =
      count === 1
        ? `Remove "${fileCatalog[0]!.label}" from the viewer?`
        : `Remove all ${count} open files from the viewer?`;
    if (confirm(message)) resetViewer();
  });
  doclangFilePane?.addEventListener('doclang-file-select', (e: Event) => {
    switchToFile((e as CustomEvent<{ index: number }>).detail.index);
  });
  doclangFilePane?.addEventListener('doclang-file-close', (e: Event) => {
    closeCatalogFile((e as CustomEvent<{ index: number }>).detail.index);
  });
}

function activateDocument(docState: DocumentState, entry: FileCatalogEntry): void {
  state = docState;
  closeAllSettings();
  doclangPageViewPane?.activateZoom(entry.pageZoom ?? PAGE_ZOOM_DEFAULT);
  setDocLabel(entry.label);
  setDocumentOpen(true, { markupOnly: state.markupOnly });
  setPageViewVisible(state.hasPageView);
  setPageIndicator(state.currentPage, state.pageCount);
  // Pass the document state to all three content panes; each renders its own view.
  if (doclangMarkupPane) doclangMarkupPane.document = docState;
  if (doclangReadingPane) doclangReadingPane.document = docState;
  if (doclangPageViewPane) doclangPageViewPane.document = docState;
  updateFileView();
}

// ---------------------------------------------------------------------------
// Demo loading
// ---------------------------------------------------------------------------

declare const DEMO_ARCHIVE_URL: string;

function setDemoLoading(loading: boolean): void {
  document.body.classList.toggle('demo-loading', loading);
  doclangEmptyState?.setDemoLoading(loading);
  doclangToolbar?.setDemoLoading(loading);
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
    alert(
      `Failed to load demo: ${(err as Error).message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`
    );
  } finally {
    demoLoadInProgress = false;
    setDemoLoading(false);
  }
}

async function addFilesToCatalog(
  files: File[],
  { replace = false } = {}
): Promise<void> {
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

async function appendFolderArchive(files: File[]): Promise<void> {
  if (!files.some(f => f.name === 'document.xml')) {
    alert('Archive must contain document.xml at its root.');
    return;
  }
  const rootName =
    (files[0]!.webkitRelativePath || files[0]!.name).split('/')[0] || 'archive';
  const entry: FileCatalogEntry = {
    id: crypto.randomUUID(),
    label: rootName,
    kind: 'folder',
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

async function addArchiveBufferToCatalog(
  buffer: ArrayBuffer,
  label: string,
  { replace = false } = {}
): Promise<void> {
  if (replace) {
    clearFileCatalog();
    filePaneUserToggled = false;
  }
  const entry: FileCatalogEntry = {
    id: crypto.randomUUID(),
    label,
    kind: 'archive',
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

async function loadFromDrop(dataTransfer: DataTransfer): Promise<void> {
  const files = [...dataTransfer.files];
  if (files.some(f => f.name === 'document.xml')) {
    await appendFolderArchive(files);
    return;
  }
  const supported = files.filter(f => isArchiveFile(f) || isMarkupFile(f));
  if (supported.length) await addFilesToCatalog(supported, { replace: false });
}

// ---------------------------------------------------------------------------
// Wheel navigation
// ---------------------------------------------------------------------------

function initPageWheelNav(): void {
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
      const dir = pixelAccum > 0 ? 1 : -1;
      pixelAccum = 0;
      return dir;
    }
    return 0;
  }

  function tryFlipPage(dir: number): boolean {
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

  function isScrollAtTop(pane: HTMLElement): boolean {
    return pane.scrollTop <= 0;
  }
  function isScrollAtBottom(pane: HTMLElement): boolean {
    return pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1;
  }

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
    requestAnimationFrame(() => {
      pane.scrollTop = dir > 0 ? 0 : pane.scrollHeight;
    });
  }

  // Page-view pane: wheel on component host element
  doclangPageViewPane?.addEventListener(
    'wheel',
    e => {
      if (!state?.hasPageView) return;
      const scrollPane = doclangPageViewPane?.scrollPane ?? null;
      if (!scrollPane) return;
      const scrollable =
        scrollPane.scrollHeight > scrollPane.clientHeight ||
        scrollPane.scrollWidth > scrollPane.clientWidth;
      if (scrollable) {
        onScrollPaneWheel(e as WheelEvent, scrollPane);
        return;
      }
      e.preventDefault();
      const dir = wheelDir(e as WheelEvent);
      if (dir) tryFlipPage(dir);
    },
    { passive: false }
  );

  // Markup and reading panes: wheel navigates via their inner scrollable body
  for (const pane of [doclangMarkupPane, doclangReadingPane]) {
    if (!pane) continue;
    pane.addEventListener(
      'wheel',
      e => {
        const scrollPane = pane.scrollPane ?? null;
        if (!scrollPane) return;
        onScrollPaneWheel(e as WheelEvent, scrollPane);
      },
      { passive: false }
    );
  }

  // Key navigation is now handled inside page-view-pane component
  // which fires doclang-page-key-nav events that we listen to below.
}

// ---------------------------------------------------------------------------
// Drag-drop init
// ---------------------------------------------------------------------------

function initFileTypeHints(): void {
  doclangEmptyState?.setFileTypeHints(SUPPORTED_FILE_EXTENSIONS);
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
// Event wiring — component custom events
// ---------------------------------------------------------------------------

// Toolbar
doclangToolbar?.addEventListener('doclang-load-demo', loadDemo);
doclangToolbar?.addEventListener('doclang-open-files', async (e: Event) => {
  const files = (e as CustomEvent<{ files: File[] }>).detail.files.filter(
    f => isArchiveFile(f) || isMarkupFile(f)
  );
  if (!files.length) return;
  await addFilesToCatalog(files, { replace: true });
});

// Empty state
doclangEmptyState?.addEventListener('doclang-load-demo', loadDemo);

// Home link
document.getElementById('home-link')?.addEventListener('click', e => {
  e.preventDefault();
  resetViewer();
});

// Page nav
doclangPageNav?.addEventListener(
  'doclang-prev-page',
  () => state && goToPage(state.currentPage - 1)
);
doclangPageNav?.addEventListener(
  'doclang-next-page',
  () => state && goToPage(state.currentPage + 1)
);
doclangPageNav?.addEventListener('doclang-go-to-page', (e: Event) => {
  goToPage((e as CustomEvent<{ page: number }>).detail.page);
});

// Element selection events from markup-pane, reading-pane, and page-view-pane
document.addEventListener('doclang-element-select', (e: Event) => {
  const rawId = (e as CustomEvent<{ id: string }>).detail.id;
  const resolved = resolveSelectionElementId(rawId) ?? rawId;
  selectElement(resolved);
});

// Thread fragment navigation from page-view-pane overlay
document.addEventListener('doclang-navigate-thread', (e: Event) => {
  const { elementId, direction } = (
    e as CustomEvent<{ elementId: string; direction: string }>
  ).detail;
  navigateThreadFragment(elementId, direction);
});

// Clear selection from page-view-pane overlay
document.addEventListener('doclang-clear-selection', () => {
  clearSelection();
});

// Keyboard page navigation from page-view-pane
document.addEventListener('doclang-page-key-nav', (e: Event) => {
  const { dir } = (e as CustomEvent<{ dir: 1 | -1 }>).detail;
  if (state) goToPage(state.currentPage + dir);
});

// Page view pane: zoom change triggers layout refresh (internal to component now)
doclangPageViewPane?.addEventListener('doclang-zoom-change', () => {
  doclangPageViewPane?.refreshLayout();
});

// Page view pane: reading-order global toggle requires re-render
let prevReadingOrderGlobal = false;
doclangPageViewPane?.addEventListener('doclang-overlay-change', (e: Event) => {
  const detail = (e as CustomEvent<{ readingOrderGlobal: boolean }>).detail;
  if (detail.readingOrderGlobal !== prevReadingOrderGlobal) {
    prevReadingOrderGlobal = detail.readingOrderGlobal;
    // Re-render all panes so reading-order step labels update
    if (state) {
      if (doclangMarkupPane) doclangMarkupPane.document = state;
      if (doclangReadingPane) doclangReadingPane.document = state;
      if (doclangPageViewPane) doclangPageViewPane.document = state;
    }
  }
});

// Reading pane layer settings
doclangReadingPane?.addEventListener('doclang-reading-settings-toggle', () =>
  setReadingSettingsOpen(!readingSettingsOpen)
);
doclangReadingPane?.addEventListener('doclang-reading-settings-close', () =>
  setReadingSettingsOpen(false)
);

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (toolbarOptionsOpen) setToolbarOptionsOpen(false);
  else if (doclangPageViewPane) doclangPageViewPane.closeSettings();
  else if (readingSettingsOpen) setReadingSettingsOpen(false);
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

loadLayoutPrefs();
normalizePaneRatios();
initToolbarOptions();
initPaneSplitters();
initLayoutStackListener();
initFileTypeHints();
initDragDrop();
initFilePaneCloseAll();
initPageWheelNav();

// Sync initial demo-loading state from body onto the component host
// (<body class="demo-loading"> is set in HTML before JS runs)
if (document.body.classList.contains('demo-loading')) {
  doclangEmptyState?.setDemoLoading(true);
}

if (doclangToolbar) loadDemo();
