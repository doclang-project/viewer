/** <doclang-viewer> — top-level application shell */

import '../cursor-hint/cursor-hint';
import '../page-nav/page-nav';
import '../toolbar/toolbar';
import '../file-pane/file-pane';
import '../markup-pane/markup-pane';
import '../page-view-pane/page-view-pane';
import '../reading-pane/reading-pane';
import '../empty-state/empty-state';

import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import styles from './viewer.css?inline';

import type { DoclangPageNav } from '../page-nav/page-nav';
import type { DoclangToolbar } from '../toolbar/toolbar';
import type { DoclangFilePane } from '../file-pane/file-pane';
import type { DoclangMarkupPane } from '../markup-pane/markup-pane';
import type { DoclangPageViewPane } from '../page-view-pane/page-view-pane';
import type { DoclangReadingPane } from '../reading-pane/reading-pane';
import type { DoclangEmptyState } from '../empty-state/empty-state';

import type {
  DocumentState,
  FileCatalogEntry,
  PaneDragState,
  UserPaneVisible,
  PaneKey,
} from '../../doclang/types';
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
} from '../../doclang/dom';
import {
  PAGE_IMAGE_RE,
  buildDocumentState,
  extractArchiveFromFiles,
  extractArchiveFromZipBuffer,
  revokeDocumentState,
} from '../../doclang/document';
import { PAGE_ZOOM_DEFAULT } from '../page-view-pane/overlay';
import { unzip } from '../../doclang/zip';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_FILE_EXTENSIONS = ['.dclx', '.dclg'];
const PAGE_WHEEL_COOLDOWN_MS = 200;
const PAGE_WHEEL_PIXEL_THRESHOLD = 4;
const PAGE_WHEEL_GESTURE_MS = 100;
const LAYOUT_STORAGE_KEY = 'doclang-viewer-pane-layout';
const PANE_MIN_RATIO = 0.12;
const PANE_KEYS = ['file', 'page', 'markup', 'reading'] as const;
const DEFAULT_PANE_RATIOS = [1, 1, 1, 1];
const DEFAULT_USER_PANE_VISIBLE: UserPaneVisible = {
  file: false,
  page: true,
  markup: true,
  reading: true,
};
const LAYOUT_STACK_BREAKPOINT_PX = 1200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('doclang-viewer')
export class DoclangViewer extends LitElement {
  static override styles = unsafeCSS(styles);

  @property({ type: String }) example: string | null = null;

  // ---------------------------------------------------------------------------
  // Reactive state (drives re-render + class toggles on host)
  // ---------------------------------------------------------------------------

  @state() private _loaded = false;
  @state() private _markupOnly = false;
  @state() private _hasPageView = false;
  @state() private _dragOver = false;
  @state() private _paneDragActive = false;
  @state() private _demoLoading = false;
  @state() private _docLabel: string | null = null;
  @state() private _pageNum = 1;
  @state() private _pageCount = 1;
  @state() private _stacked = false;
  @state() private _mainGridStyle: Record<string, string> = {};
  @state() private _paneGridCols: Map<PaneKey, number> = new Map();
  @state() private _paneGridRows: Map<PaneKey, number> = new Map();
  @state() private _splitterCols: (number | null)[] = [null, null, null];
  @state() private _readingSettingsOpen = false;
  @state() private _toolbarOptionsOpen = false;
  @state() private _userPaneVisible: UserPaneVisible = { ...DEFAULT_USER_PANE_VISIBLE };

  // ---------------------------------------------------------------------------
  // Non-reactive fields
  // ---------------------------------------------------------------------------

  private _docState: DocumentState | null = null;
  private _fileCatalog: FileCatalogEntry[] = [];
  private _activeFileIndex = -1;
  private _filePaneUserToggled = false;
  private _paneRatios: number[] = [...DEFAULT_PANE_RATIOS];
  private _filePaneWidthPx: number | null = null;
  private _paneDrag: PaneDragState | null = null;
  private _layoutStackQuery: MediaQueryList | null = null;
  private _demoLoadInProgress = false;
  private _prevReadingOrderGlobal = false;

  // Wheel nav state (closure variables lifted to fields)
  private _wheelPixelAccum = 0;
  private _wheelPixelGestureUntil = 0;
  private _wheelLastFlipAt = 0;

  // Refs to child components
  private _pageNavRef: Ref<DoclangPageNav> = createRef();
  private _toolbarRef: Ref<DoclangToolbar> = createRef();
  private _filePaneRef: Ref<DoclangFilePane> = createRef();
  private _markupPaneRef: Ref<DoclangMarkupPane> = createRef();
  private _pageViewPaneRef: Ref<DoclangPageViewPane> = createRef();
  private _readingPaneRef: Ref<DoclangReadingPane> = createRef();
  private _emptyStateRef: Ref<DoclangEmptyState> = createRef();
  private _splitterRefs: Ref<HTMLElement>[] = [createRef(), createRef(), createRef()];
  private _mainRef: Ref<HTMLElement> = createRef();

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadLayoutPrefs();
    this._normalizePaneRatios();
    this._initLayoutStackListener();
    this._initDragDrop();
    this._initPageWheelNav();
    this.addEventListener('keydown', this._onGlobalKeydown);

    if (this.example) {
      this._demoLoading = true;
      this._loadDemo();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._layoutStackQuery?.removeEventListener('change', this._onLayoutStackChange);
    window.removeEventListener('pointermove', this._onWindowPointerMove);
    window.removeEventListener('pointerup', this._onWindowPointerUp);
    window.removeEventListener('pointercancel', this._onWindowPointerUp);
    this.removeEventListener('keydown', this._onGlobalKeydown);
  }

  override firstUpdated(): void {
    const emptyState = this._emptyStateRef.value;
    if (emptyState) emptyState.setFileTypeHints(SUPPORTED_FILE_EXTENSIONS);
    if (this._demoLoading && emptyState) emptyState.setDemoLoading(true);
    this._syncToolbarPaneCheckboxes();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    // Apply host classes declaratively via a wrapper div trick:
    // (LitElement doesn't support classMap on :host directly, so we toggle
    // classes on the host element imperatively in updated())

    return html`
      <header>
        <div class="header-brand">
          <a
            href="#"
            class="header-logo-link"
            title="Back to start"
            @click=${this._onHomeClick}
          >
            <img src="assets/doclang_v3_sail.svg" alt="DocLang" class="header-logo" />
          </a>
          <h1>DocLang Viewer</h1>
          <doclang-page-nav
            ${ref(this._pageNavRef)}
            @doclang-prev-page=${() => this._docState && this._goToPage(this._docState.currentPage - 1)}
            @doclang-next-page=${() => this._docState && this._goToPage(this._docState.currentPage + 1)}
            @doclang-go-to-page=${(e: Event) => this._goToPage((e as CustomEvent<{ page: number }>).detail.page)}
          ></doclang-page-nav>
        </div>

        <div class="header-center">
          ${
            this._docLabel
              ? html`<span class="doc-label">${this._docLabel}</span>`
              : nothing
          }
        </div>

        <div class="toolbar-wrap">
          <doclang-toolbar
            ${ref(this._toolbarRef)}
            @doclang-load-demo=${this._onLoadDemo}
            @doclang-open-files=${this._onOpenFiles}
            @doclang-toggle-pane=${this._onTogglePane}
            @doclang-reset-pane-layout=${this._onResetPaneLayout}
          ></doclang-toolbar>
        </div>
      </header>

      <p class="drop-banner">Drop to open another file</p>

      <doclang-empty-state
        ${ref(this._emptyStateRef)}
        @doclang-load-demo=${this._onLoadDemo}
      ></doclang-empty-state>

      <div
        class=${classMap({ main: true, 'layout-stacked': this._stacked })}
        style=${styleMap(this._mainGridStyle)}
        ${ref(this._mainRef)}
      >
        <doclang-file-pane
          ${ref(this._filePaneRef)}
          class="pane"
          ?hidden=${!this._isPaneVisible('file')}
          style=${this._paneGridStyle('file')}
          @doclang-file-select=${(e: Event) => this._switchToFile((e as CustomEvent<{ index: number }>).detail.index)}
          @doclang-file-close=${(e: Event) => this._closeCatalogFile((e as CustomEvent<{ index: number }>).detail.index)}
          @doclang-file-pane-close-all=${this._onFilePaneCloseAll}
        ></doclang-file-pane>

        <div
          class=${classMap({ 'pane-splitter': true })}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Files and Original page panes"
          tabindex="0"
          ?hidden=${this._splitterCols[0] === null}
          style=${this._splitterGridStyle(0)}
          ${ref(this._splitterRefs[0]!)}
          @pointerdown=${(e: PointerEvent) => this._startPaneDrag(e, 0)}
        ></div>

        <doclang-page-view-pane
          ${ref(this._pageViewPaneRef)}
          class="pane"
          ?hidden=${!this._isPaneVisible('page')}
          style=${this._paneGridStyle('page')}
          @doclang-element-select=${this._onElementSelect}
          @doclang-navigate-thread=${this._onNavigateThread}
          @doclang-clear-selection=${this._onClearSelection}
          @doclang-page-key-nav=${this._onPageKeyNav}
          @doclang-zoom-change=${this._onZoomChange}
          @doclang-overlay-change=${this._onOverlayChange}
          @doclang-hint=${this._onHint}
          @doclang-hint-hide=${this._onHintHide}
          @doclang-panning-change=${this._onPanningChange}
        ></doclang-page-view-pane>

        <div
          class="pane-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Original page and DocLang panes"
          tabindex="0"
          ?hidden=${this._splitterCols[1] === null}
          style=${this._splitterGridStyle(1)}
          ${ref(this._splitterRefs[1]!)}
          @pointerdown=${(e: PointerEvent) => this._startPaneDrag(e, 1)}
        ></div>

        <doclang-markup-pane
          ${ref(this._markupPaneRef)}
          class="pane"
          ?hidden=${!this._isPaneVisible('markup')}
          style=${this._paneGridStyle('markup')}
          @doclang-element-select=${this._onElementSelect}
          @doclang-hint=${this._onHint}
          @doclang-hint-hide=${this._onHintHide}
        ></doclang-markup-pane>

        <div
          class="pane-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize DocLang and Reading view panes"
          tabindex="0"
          ?hidden=${this._splitterCols[2] === null}
          style=${this._splitterGridStyle(2)}
          ${ref(this._splitterRefs[2]!)}
          @pointerdown=${(e: PointerEvent) => this._startPaneDrag(e, 2)}
        ></div>

        <doclang-reading-pane
          ${ref(this._readingPaneRef)}
          class="pane"
          ?hidden=${!this._isPaneVisible('reading')}
          style=${this._paneGridStyle('reading')}
          @doclang-element-select=${this._onElementSelect}
          @doclang-reading-settings-toggle=${() => this._setReadingSettingsOpen(!this._readingSettingsOpen)}
          @doclang-reading-settings-close=${() => this._setReadingSettingsOpen(false)}
        ></doclang-reading-pane>
      </div>

      <doclang-cursor-hint></doclang-cursor-hint>
    `;
  }

  override updated(): void {
    // Apply host classes imperatively (classMap on :host needs this workaround)
    this.classList.toggle('loaded', this._loaded);
    this.classList.toggle('markup-only', this._markupOnly);
    this.classList.toggle('drag-over', this._dragOver);
    this.classList.toggle('pane-drag-active', this._paneDragActive);
  }

  // ---------------------------------------------------------------------------
  // Grid style helpers
  // ---------------------------------------------------------------------------

  private _paneGridStyle(key: PaneKey): string {
    if (this._stacked) {
      const row = this._paneGridRows.get(key);
      return row !== undefined ? `grid-row:${row}` : '';
    }
    const col = this._paneGridCols.get(key);
    return col !== undefined ? `grid-column:${col}` : '';
  }

  private _splitterGridStyle(index: number): string {
    const col = this._splitterCols[index];
    if (col === null || this._stacked) return '';
    return `grid-column:${col}`;
  }

  // ---------------------------------------------------------------------------
  // Pane layout
  // ---------------------------------------------------------------------------

  private _isPaneAvailable(key: PaneKey): boolean {
    if (key === 'file') return this._fileCatalog.length > 0;
    if (key === 'page') return Boolean(this._docState?.hasPageView);
    return Boolean(this._docState);
  }

  private _isPaneVisible(key: PaneKey): boolean {
    if (!this._isPaneAvailable(key)) return false;
    return Boolean(this._userPaneVisible[key]);
  }

  private _visiblePaneKeys(): PaneKey[] {
    return [...PANE_KEYS].filter(key => this._isPaneVisible(key));
  }

  private _filePaneFitWidthPx(): number {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;visibility:hidden;width:var(--doclang-file-pane-fit-width);';
    (this.shadowRoot ?? document.documentElement).appendChild(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return Math.ceil(px) || 108;
  }

  private _resolvedFilePaneWidthPx(): number {
    const fit = this._filePaneFitWidthPx();
    return Math.max(fit, this._filePaneWidthPx ?? fit);
  }

  private _contentPaneFrWeights(keys: PaneKey[]): number[] {
    const contentKeys = keys.filter(k => k !== 'file');
    const weights = contentKeys.map(k => this._paneRatios[this._paneRatioIndex(k)]!);
    const sum = weights.reduce((a, b) => a + b, 0) || contentKeys.length;
    return weights.map(w => w / sum);
  }

  private _paneRatioIndex(key: PaneKey): number {
    return PANE_KEYS.indexOf(key);
  }

  private _normalizePaneRatios(): void {
    const sum = this._paneRatios.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
      this._paneRatios = [...DEFAULT_PANE_RATIOS];
      return;
    }
    this._paneRatios = this._paneRatios.map(r => r / sum);
  }

  private _paneKeysAdjacent(leftKey: PaneKey, rightKey: PaneKey): boolean {
    return (
      PANE_KEYS.indexOf(leftKey) >= 0 &&
      PANE_KEYS.indexOf(rightKey) === PANE_KEYS.indexOf(leftKey) + 1
    );
  }

  private _onlyHiddenPanesBetween(leftKey: PaneKey, rightKey: PaneKey): boolean {
    const li = PANE_KEYS.indexOf(leftKey);
    const ri = PANE_KEYS.indexOf(rightKey);
    if (li < 0 || ri <= li) return false;
    for (let i = li + 1; i < ri; i++) {
      if (this._isPaneVisible(PANE_KEYS[i]!)) return false;
    }
    return true;
  }

  private _shouldShowSplitter(leftKey: PaneKey, rightKey: PaneKey): boolean {
    if (!this._isPaneVisible(leftKey) || !this._isPaneVisible(rightKey)) return false;
    if (this._paneKeysAdjacent(leftKey, rightKey)) return true;
    return this._onlyHiddenPanesBetween(leftKey, rightKey);
  }

  private _visibleNeighborAfter(key: PaneKey): PaneKey | null {
    const idx = PANE_KEYS.indexOf(key);
    for (let i = idx + 1; i < PANE_KEYS.length; i++) {
      if (this._isPaneVisible(PANE_KEYS[i]!)) return PANE_KEYS[i]!;
    }
    return null;
  }

  private _visibleNeighborBefore(key: PaneKey): PaneKey | null {
    const idx = PANE_KEYS.indexOf(key);
    for (let i = idx - 1; i >= 0; i--) {
      if (this._isPaneVisible(PANE_KEYS[i]!)) return PANE_KEYS[i]!;
    }
    return null;
  }

  private _applyPaneLayout(): void {
    const stacked = this._loaded && Boolean(this._layoutStackQuery?.matches);
    this._stacked = stacked;

    let keys = this._visiblePaneKeys();
    if (!keys.length) {
      this._userPaneVisible.markup = true;
      keys = this._visiblePaneKeys();
    }

    // Reset
    const gridCols = new Map<PaneKey, number>();
    const gridRows = new Map<PaneKey, number>();
    const splitterCols: (number | null)[] = [null, null, null];

    if (!this._loaded) {
      this._paneGridCols = gridCols;
      this._paneGridRows = gridRows;
      this._splitterCols = splitterCols;
      this._mainGridStyle = {};
      this.requestUpdate();
      return;
    }

    if (stacked) {
      let row = 1;
      for (const key of keys) gridRows.set(key, row++);
      this._paneGridCols = gridCols;
      this._paneGridRows = gridRows;
      this._splitterCols = splitterCols;
      this._mainGridStyle = {};
      this._pageViewPaneRef.value?.refreshLayout();
      this._readingPaneRef.value?.setVisible(this._isPaneVisible('reading'));
      this.requestUpdate();
      return;
    }

    const contentFr = this._contentPaneFrWeights(keys);
    const cols: string[] = [];
    let frIndex = 0;
    keys.forEach((key, i) => {
      if (key === 'file') {
        cols.push(`${this._resolvedFilePaneWidthPx()}px`);
      } else {
        cols.push(`minmax(0, ${contentFr[frIndex++]!.toFixed(6)}fr)`);
      }
      if (i < keys.length - 1 && this._shouldShowSplitter(keys[i]!, keys[i + 1]!)) {
        cols.push('1px');
      }
    });

    let col = 1;
    keys.forEach((key, i) => {
      gridCols.set(key, col++);
      if (i < keys.length - 1) {
        const lk = keys[i]!;
        const rk = keys[i + 1]!;
        if (!this._shouldShowSplitter(lk, rk)) return;
        const physIdx = PANE_KEYS.indexOf(lk);
        if (physIdx >= 0 && physIdx < 3) splitterCols[physIdx] = col++;
      }
    });

    this._paneGridCols = gridCols;
    this._paneGridRows = gridRows;
    this._splitterCols = splitterCols;
    this._mainGridStyle = { gridTemplateColumns: cols.join(' ') };
    this._pageViewPaneRef.value?.refreshLayout();
    this._readingPaneRef.value?.setVisible(this._isPaneVisible('reading'));
    this.requestUpdate();
  }

  private _setUserPaneVisible(key: PaneKey, visible: boolean): void {
    this._userPaneVisible[key] = visible;
    if (key === 'file') this._filePaneUserToggled = true;
    if (key === 'page') this._syncPagePaneControls();
    if (key === 'reading' && !visible) this._setReadingSettingsOpen(false);
    this._syncToolbarPaneCheckboxes();
    this._saveLayoutPrefs();
    this._applyPaneLayout();
  }

  private _syncPagePaneControls(): void {
    this._pageViewPaneRef.value?.setVisible(this._isPaneVisible('page'));
  }

  // ---------------------------------------------------------------------------
  // Layout prefs
  // ---------------------------------------------------------------------------

  private _loadLayoutPrefs(): void {
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
            this._userPaneVisible[key] = data.visible[key] as boolean;
        }
        if (typeof data.visible['file'] === 'boolean') this._filePaneUserToggled = true;
      }
      if (Array.isArray(data?.ratios)) {
        const valid = data.ratios.every(n => typeof n === 'number' && n > 0);
        if (valid && data.ratios.length === 4) {
          this._paneRatios = [...(data.ratios as number[])];
          this._normalizePaneRatios();
        } else if (valid && data.ratios.length === 3) {
          this._paneRatios = [1, ...(data.ratios as number[])];
          this._normalizePaneRatios();
        }
      }
      if (typeof data?.filePaneWidthPx === 'number' && data.filePaneWidthPx > 0) {
        this._filePaneWidthPx = data.filePaneWidthPx;
      }
    } catch {
      /* ignore */
    }
  }

  private _saveLayoutPrefs(): void {
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({
          visible: this._userPaneVisible,
          ratios: this._paneRatios,
          filePaneWidthPx: this._filePaneWidthPx,
        })
      );
    } catch {
      /* ignore */
    }
  }

  private _resetPaneLayout(): void {
    this._filePaneUserToggled = false;
    this._userPaneVisible = {
      file: this._defaultFilePaneVisible(),
      page: true,
      markup: true,
      reading: true,
    };
    this._paneRatios = [...DEFAULT_PANE_RATIOS];
    this._normalizePaneRatios();
    this._filePaneWidthPx = null;
    this._setReadingSettingsOpen(false);
    this._syncPagePaneControls();
    this._syncToolbarPaneCheckboxes();
    this._saveLayoutPrefs();
    this._applyPaneLayout();
  }

  // ---------------------------------------------------------------------------
  // Layout stack listener
  // ---------------------------------------------------------------------------

  private _onLayoutStackChange = (): void => {
    this._applyPaneLayout();
  };

  private _initLayoutStackListener(): void {
    this._layoutStackQuery = window.matchMedia(
      `(max-width: ${LAYOUT_STACK_BREAKPOINT_PX}px)`
    );
    this._layoutStackQuery.addEventListener('change', this._onLayoutStackChange);
    this._onLayoutStackChange();
  }

  // ---------------------------------------------------------------------------
  // Pane splitter drag
  // ---------------------------------------------------------------------------

  private _contentPaneAvailableWidthPx(): number {
    const main = this._mainRef.value;
    if (!main) return 1;
    const rect = main.getBoundingClientRect();
    const keys = this._visiblePaneKeys();
    let reserved = 0;
    if (keys.includes('file')) reserved += this._resolvedFilePaneWidthPx();
    for (let i = 0; i < keys.length - 1; i++) {
      if (this._shouldShowSplitter(keys[i]!, keys[i + 1]!)) reserved += 1;
    }
    return Math.max(rect.width - reserved, 1);
  }

  private _resolvedPhysicalSplitterKeys(
    physIdx: number
  ): { leftKey: PaneKey; rightKey: PaneKey } | null {
    const leftPhysical = PANE_KEYS[physIdx];
    const rightPhysical = PANE_KEYS[physIdx + 1];
    if (!leftPhysical || !rightPhysical) return null;
    const leftKey = this._isPaneVisible(leftPhysical)
      ? leftPhysical
      : this._visibleNeighborBefore(rightPhysical);
    const rightKey = this._isPaneVisible(rightPhysical)
      ? rightPhysical
      : this._visibleNeighborAfter(leftPhysical);
    if (!leftKey || !rightKey || leftKey === rightKey) return null;
    if (!this._shouldShowSplitter(leftKey, rightKey)) return null;
    // Confirm this physical splitter is the canonical one for this gap
    const canonicalIdx = PANE_KEYS.indexOf(leftKey);
    if (canonicalIdx !== physIdx) return null;
    return { leftKey, rightKey };
  }

  private _startPaneDrag(e: PointerEvent, physIdx: number): void {
    if (e.button !== 0 || this._stacked || !this._loaded) return;
    const resolved = this._resolvedPhysicalSplitterKeys(physIdx);
    if (!resolved) return;
    const { leftKey, rightKey } = resolved;
    this._normalizePaneRatios();
    const leftIndex = this._paneRatioIndex(leftKey);
    const rightIndex = this._paneRatioIndex(rightKey);
    const drag: PaneDragState = {
      physicalSplitterIndex: physIdx,
      leftKey,
      rightKey,
      startX: e.clientX,
      leftStart: this._paneRatios[leftIndex]!,
      rightStart: this._paneRatios[rightIndex]!,
      pointerId: e.pointerId,
    };
    if (leftKey === 'file') drag.leftStartPx = this._resolvedFilePaneWidthPx();
    else if (rightKey === 'file') drag.rightStartPx = this._resolvedFilePaneWidthPx();
    this._paneDrag = drag;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    (e.currentTarget as Element).classList.add('is-dragging');
    this._paneDragActive = true;
    this.requestUpdate();
  }

  private _onWindowPointerMove = (e: PointerEvent): void => {
    const drag = this._paneDrag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.leftKey === 'file' && typeof drag.leftStartPx === 'number') {
      this._filePaneWidthPx = Math.max(
        this._filePaneFitWidthPx(),
        drag.leftStartPx + (e.clientX - drag.startX)
      );
      this._applyPaneLayout();
      return;
    }
    if (drag.rightKey === 'file' && typeof drag.rightStartPx === 'number') {
      this._filePaneWidthPx = Math.max(
        this._filePaneFitWidthPx(),
        drag.rightStartPx - (e.clientX - drag.startX)
      );
      this._applyPaneLayout();
      return;
    }
    const keys = this._visiblePaneKeys();
    const frWeights = this._contentPaneFrWeights(keys);
    const contentKeys = keys.filter((k): k is Exclude<PaneKey, 'file'> => k !== 'file');
    const leftContentIdx = contentKeys.indexOf(
      drag.leftKey as Exclude<PaneKey, 'file'>
    );
    if (leftContentIdx < 0 || leftContentIdx + 1 >= frWeights.length) return;
    const pairFrTotal = frWeights[leftContentIdx]! + frWeights[leftContentIdx + 1]!;
    if (!(pairFrTotal > 0)) return;
    const pairPixels = Math.max(this._contentPaneAvailableWidthPx() * pairFrTotal, 1);
    const deltaRatio = (e.clientX - drag.startX) / pairPixels;
    const leftIdx = this._paneRatioIndex(drag.leftKey);
    const rightIdx = this._paneRatioIndex(drag.rightKey);
    const pairTotal = drag.leftStart + drag.rightStart;
    if (!(pairTotal > 0) || leftIdx < 0 || rightIdx < 0) return;
    const leftMin = Math.min(PANE_MIN_RATIO, pairTotal / 2);
    const rightMin = Math.min(PANE_MIN_RATIO, pairTotal / 2);
    let nextLeft = drag.leftStart + deltaRatio * pairTotal;
    nextLeft = Math.min(Math.max(nextLeft, leftMin), pairTotal - rightMin);
    this._paneRatios[leftIdx] = nextLeft;
    this._paneRatios[rightIdx] = pairTotal - nextLeft;
    this._applyPaneLayout();
  };

  private _onWindowPointerUp = (e: PointerEvent): void => {
    const drag = this._paneDrag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const splitterRef = this._splitterRefs[drag.physicalSplitterIndex];
    const splitter = splitterRef?.value;
    splitter?.classList.remove('is-dragging');
    if (splitter?.hasPointerCapture(e.pointerId))
      splitter.releasePointerCapture(e.pointerId);
    this._paneDrag = null;
    this._paneDragActive = false;
    this._normalizePaneRatios();
    this._saveLayoutPrefs();
    this.requestUpdate();
  };

  // ---------------------------------------------------------------------------
  // Page navigation
  // ---------------------------------------------------------------------------

  private _goToPage(n: number): void {
    const s = this._docState;
    if (!s) return;
    this._pageViewPaneRef.value?.closeSettings();
    const page = Math.min(Math.max(1, n), s.pageCount);
    s.currentPage = page;
    const markupPane = this._markupPaneRef.value;
    const readingPane = this._readingPaneRef.value;
    const pageViewPane = this._pageViewPaneRef.value;
    if (markupPane) markupPane.page = page;
    if (readingPane) readingPane.page = page;
    if (pageViewPane) pageViewPane.page = page;
    this._pageNum = page;
    this.requestUpdate();
    this._pageNavRef.value?.setIndicator(page, s.pageCount);
  }

  // ---------------------------------------------------------------------------
  // Fragment thread navigation
  // ---------------------------------------------------------------------------

  private _findElementIdOnPage(el: Element): string | null {
    if (!this._docState?.elementIds) return null;
    for (const [node, id] of this._docState.elementIds) {
      if (node === el) return id;
    }
    return null;
  }

  private _navigateThreadFragment(elementId: string, direction: string): void {
    const s = this._docState;
    const el = s?.idToElement?.get(elementId);
    if (!el) return;
    const nav = s?.threadNavByElement?.get(el);
    if (!nav) return;
    const target = direction === 'prev' ? nav.prev : nav.next;
    if (!target) return;
    const page = s!.elementPageByEl.get(target);
    if (!page) return;
    if (page === s!.currentPage) {
      const id = this._findElementIdOnPage(target);
      if (id) this._selectElement(id);
      return;
    }
    s!.pendingSelectElement = target;
    this._goToPage(page);
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  private _findListVirtualTextHost(list: Element, target: Element): Element | null {
    const nodes = [...list.childNodes] as ChildNode[];
    let i = skipContainerLevelHead(nodes, 0);
    while (i < nodes.length) {
      const node = nodes[i]!;
      if (
        node.nodeType !== Node.ELEMENT_NODE ||
        localName(node as Element) !== 'ldiv'
      ) {
        i++;
        continue;
      }
      const ldiv = node as Element;
      i++;
      const end = skipUntilListItemBoundary(nodes, i);
      if (target === ldiv || nodes.slice(i, end).some(n => xmlContains(target, n)))
        return ldiv;
      i = end;
    }
    return null;
  }

  private _findTableVirtualTextHost(
    container: Element,
    target: Element
  ): Element | null {
    const nodes = [...container.childNodes] as ChildNode[];
    let i = skipContainerLevelHead(nodes, 0);
    while (i < nodes.length) {
      const node = nodes[i]!;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        i++;
        continue;
      }
      const tag = localName(node as Element);
      if (
        tag === 'nl' ||
        isVirtualTextHost(node as Element) ||
        CELL_SPAN_TAGS.has(tag) ||
        !isCellToken(tag)
      ) {
        i++;
        continue;
      }
      const cell = node as Element;
      i++;
      const end = skipUntilCellBoundary(nodes, i);
      if (target === cell || nodes.slice(i, end).some(n => xmlContains(target, n)))
        return cell;
      i = end;
    }
    return null;
  }

  private _findVirtualTextHost(xmlEl: Element): Element | null {
    let node: Element | null = xmlEl;
    while (node) {
      const parent: Element | null = node.parentElement;
      if (!parent) return null;
      const tag = localName(parent);
      if (tag === 'list') {
        const h = this._findListVirtualTextHost(parent, xmlEl);
        if (h) return h;
      }
      if (OTSL_CONTAINER_TAGS.has(tag)) {
        const h = this._findTableVirtualTextHost(parent, xmlEl);
        if (h) return h;
      }
      node = parent;
    }
    return null;
  }

  private _resolveSelectionElement(xmlEl: Element | null): Element | null {
    if (!xmlEl) return null;
    if (isSemanticElement(xmlEl) || isVirtualTextHost(xmlEl)) return xmlEl;
    let node: Element | null = xmlEl.parentElement;
    while (node) {
      if (localName(node) === 'doclang') break;
      if (isSemanticElement(node) && !isListOrOtslContainer(node)) return node;
      node = node.parentElement;
    }
    const virtualHost = this._findVirtualTextHost(xmlEl);
    if (virtualHost) return virtualHost;
    node = xmlEl.parentElement;
    while (node) {
      if (localName(node) === 'doclang') break;
      if (isSemanticElement(node) || isVirtualTextHost(node)) return node;
      node = node.parentElement;
    }
    return null;
  }

  private _resolveSelectionElementId(rawId: string | null): string | null {
    const s = this._docState;
    if (!rawId || !s?.idToElement || !s.elementIds) return null;
    const xmlEl = s.idToElement.get(rawId);
    if (!xmlEl) return null;
    const resolved = this._resolveSelectionElement(xmlEl);
    return resolved ? (s.elementIds.get(resolved) ?? null) : null;
  }

  private _selectElement(elementId: string): void {
    if (!elementId) return;
    const markup = this._markupPaneRef.value;
    const reading = this._readingPaneRef.value;
    const page = this._pageViewPaneRef.value;
    if (markup) markup.selected = elementId;
    if (reading) reading.selected = elementId;
    if (page) page.selected = elementId;
  }

  private _clearSelection(): void {
    const markup = this._markupPaneRef.value;
    const reading = this._readingPaneRef.value;
    const page = this._pageViewPaneRef.value;
    if (markup) markup.selected = null;
    if (reading) reading.selected = null;
    if (page) page.selected = null;
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  private _setReadingSettingsOpen(open: boolean): void {
    this._readingSettingsOpen = open;
    this._readingPaneRef.value?.setSettingsOpen(open);
    this.requestUpdate();
  }

  private _closeAllSettings(): void {
    this._pageViewPaneRef.value?.closeSettings();
    this._setReadingSettingsOpen(false);
  }

  private _syncToolbarPaneCheckboxes(): void {
    this._toolbarRef.value?.syncPaneToggles({
      file: this._userPaneVisible.file,
      page: this._userPaneVisible.page,
      markup: this._userPaneVisible.markup,
      reading: this._userPaneVisible.reading,
      fileAvailable: this._isPaneAvailable('file'),
      pageAvailable: this._isPaneAvailable('page'),
      hasState: Boolean(this._docState),
    });
  }

  // ---------------------------------------------------------------------------
  // Document open/close
  // ---------------------------------------------------------------------------

  private _setDocumentOpen(open: boolean, { markupOnly = false } = {}): void {
    this._loaded = open;
    this._markupOnly = open && markupOnly;
    this._pageNavRef.value?.setVisible(open && !markupOnly);
    this._syncToolbarPaneCheckboxes();
    this._applyPaneLayout();
    this.requestUpdate();
  }

  private _setPageViewVisible(visible: boolean): void {
    this._hasPageView = visible;
    this._syncPagePaneControls();
    this._syncToolbarPaneCheckboxes();
    if (!visible) this._pageViewPaneRef.value?.closeSettings();
    this._applyPaneLayout();
  }

  private _resetViewer(): void {
    this._setDemoLoading(false);
    this._clearFileCatalog();
    this._filePaneUserToggled = false;
    this._pageViewPaneRef.value?.resetZoom();
    this._docLabel = null;
    this._setDocumentOpen(false);
    this._hasPageView = false;
    this._closeAllSettings();
    this._toolbarOptionsOpen = false;
    this._toolbarRef.value?.setOptionsOpen(false);
    const markup = this._markupPaneRef.value;
    const reading = this._readingPaneRef.value;
    const pageView = this._pageViewPaneRef.value;
    if (markup) markup.document = null;
    if (reading) reading.document = null;
    if (pageView) pageView.document = null;
    this._filePaneRef.value?.renderFiles([]);
    this._pageNavRef.value?.setIndicator(1, 1);
    this._pageNum = 1;
    this._pageCount = 1;
    this._updateFileView();
    this._applyPaneLayout();
    this.requestUpdate();
  }

  private _activateDocument(docState: DocumentState, entry: FileCatalogEntry): void {
    this._docState = docState;
    this._closeAllSettings();
    this._pageViewPaneRef.value?.activateZoom(entry.pageZoom ?? PAGE_ZOOM_DEFAULT);
    this._docLabel = entry.label;
    this._setDocumentOpen(true, { markupOnly: docState.markupOnly });
    this._setPageViewVisible(docState.hasPageView);
    this._pageNum = docState.currentPage;
    this._pageCount = docState.pageCount;
    this._pageNavRef.value?.setIndicator(docState.currentPage, docState.pageCount);
    const markup = this._markupPaneRef.value;
    const reading = this._readingPaneRef.value;
    const pageView = this._pageViewPaneRef.value;
    if (markup) markup.document = docState;
    if (reading) reading.document = docState;
    if (pageView) pageView.document = docState;
    this._updateFileView();
    this.requestUpdate();
  }

  // ---------------------------------------------------------------------------
  // File catalog
  // ---------------------------------------------------------------------------

  private _pageImageMimeFromExt(ext: string): string {
    const n = ext.toLowerCase().replace('jpeg', 'jpg');
    if (n === 'png') return 'image/png';
    if (n === 'webp') return 'image/webp';
    return 'image/jpeg';
  }

  private _createPageImageObjectUrl(data: Uint8Array, ext: string): string {
    return URL.createObjectURL(
      new Blob([data as BlobPart], { type: this._pageImageMimeFromExt(ext) })
    );
  }

  private _createFirstPageImageUrlFromFiles(files: File[]): string | null {
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

  private async _createFirstPageImageUrlFromZip(
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
    return this._createPageImageObjectUrl(
      bestEntry.data,
      bestEntry.name.split('.').pop() ?? 'png'
    );
  }

  private async _resolveCatalogEntryThumbnail(
    entry: FileCatalogEntry
  ): Promise<string | null> {
    if (entry.thumbnailUrl) return entry.thumbnailUrl;
    if (entry.kind === 'markup') return null;
    try {
      if (entry.kind === 'folder')
        entry.thumbnailUrl = this._createFirstPageImageUrlFromFiles(
          entry.source as File[]
        );
      else if (entry.kind === 'archive')
        entry.thumbnailUrl = await this._createFirstPageImageUrlFromZip(
          entry.source as File | ArrayBuffer
        );
    } catch {
      entry.thumbnailUrl = null;
    }
    return entry.thumbnailUrl;
  }

  private _enrichCatalogEntryThumbnail(entry: FileCatalogEntry): void {
    this._resolveCatalogEntryThumbnail(entry).then(url => {
      if (!this._fileCatalog.includes(entry)) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
        return;
      }
      if (url) this._renderFileView();
    });
  }

  private _revokeCatalogEntry(entry: FileCatalogEntry | null): void {
    if (entry?.thumbnailUrl?.startsWith('blob:'))
      URL.revokeObjectURL(entry.thumbnailUrl);
    if (entry) entry.thumbnailUrl = null;
  }

  private _createFileCatalogEntry(file: File): FileCatalogEntry {
    return {
      id: crypto.randomUUID(),
      label: file.name,
      kind: this._isMarkupFile(file) ? 'markup' : 'archive',
      source: file,
      currentPage: 1,
      pageZoom: PAGE_ZOOM_DEFAULT,
      snapshot: null,
      thumbnailUrl: null,
    };
  }

  private _isArchiveFile(file: File): boolean {
    return /\.dclx$/i.test(file.name) || /\.zip$/i.test(file.name);
  }

  private _isMarkupFile(file: File): boolean {
    return /\.(?:dclg(?:\.xml)?|xml)$/i.test(file.name);
  }

  private async _parseCatalogEntry(
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

  private _persistActiveFileViewState(): void {
    if (this._activeFileIndex < 0 || !this._docState) return;
    const entry = this._fileCatalog[this._activeFileIndex];
    if (!entry) return;
    entry.currentPage = this._docState.currentPage;
    entry.pageZoom = this._pageViewPaneRef.value?.zoomPercent ?? PAGE_ZOOM_DEFAULT;
  }

  private _releaseActiveDocument(): void {
    if (this._activeFileIndex >= 0) {
      const entry = this._fileCatalog[this._activeFileIndex];
      if (entry?.snapshot) {
        revokeDocumentState(entry.snapshot);
        entry.snapshot = null;
      }
    }
    if (this._docState) revokeDocumentState(this._docState);
    this._docState = null;
  }

  private _clearFileCatalog(): void {
    this._releaseActiveDocument();
    for (const entry of this._fileCatalog) this._revokeCatalogEntry(entry);
    this._fileCatalog = [];
    this._activeFileIndex = -1;
  }

  private async _switchToFile(index: number): Promise<void> {
    if (index < 0 || index >= this._fileCatalog.length) return;
    this._persistActiveFileViewState();
    this._releaseActiveDocument();
    this._activeFileIndex = index;
    const entry = this._fileCatalog[index]!;
    const docState = await this._parseCatalogEntry(entry);
    if (!docState) {
      this._revokeCatalogEntry(entry);
      this._fileCatalog.splice(index, 1);
      this._activeFileIndex = -1;
      if (this._fileCatalog.length)
        await this._switchToFile(Math.min(index, this._fileCatalog.length - 1));
      else this._resetViewer();
      return;
    }
    entry.snapshot = docState;
    docState.currentPage = entry.currentPage ?? 1;
    this._activateDocument(docState, entry);
  }

  private _defaultFilePaneVisible(): boolean {
    return this._fileCatalog.length > 1;
  }

  private _syncFilePaneDefault(): void {
    if (!this._filePaneUserToggled) {
      const wasVisible = this._userPaneVisible.file;
      const should = this._defaultFilePaneVisible();
      this._userPaneVisible.file = should;
      if (!wasVisible && should) {
        this._paneRatios = [...DEFAULT_PANE_RATIOS];
        this._normalizePaneRatios();
        this._filePaneWidthPx = null;
      }
    }
  }

  private async _closeCatalogFile(index: number): Promise<void> {
    if (index < 0 || index >= this._fileCatalog.length) return;
    const wasActive = index === this._activeFileIndex;
    const entry = this._fileCatalog[index]!;
    if (wasActive) {
      this._releaseActiveDocument();
      this._activeFileIndex = -1;
    }
    this._revokeCatalogEntry(entry);
    this._fileCatalog.splice(index, 1);
    if (!this._fileCatalog.length) {
      this._resetViewer();
      return;
    }
    if (wasActive) {
      await this._switchToFile(Math.min(index, this._fileCatalog.length - 1));
      return;
    }
    if (index < this._activeFileIndex) this._activeFileIndex -= 1;
    this._updateFileView();
  }

  private _renderFileView(): void {
    this._filePaneRef.value?.renderFiles(
      this._fileCatalog.map((entry, index) => ({
        label: entry.label,
        thumbnailUrl: entry.thumbnailUrl,
        isActive: index === this._activeFileIndex,
      }))
    );
  }

  private _updateFileView(): void {
    this._syncFilePaneDefault();
    this._renderFileView();
    this._syncToolbarPaneCheckboxes();
    this._applyPaneLayout();
  }

  private async _addFilesToCatalog(
    files: File[],
    { replace = false } = {}
  ): Promise<void> {
    if (replace) {
      this._clearFileCatalog();
      this._filePaneUserToggled = false;
    }
    const startIndex = this._fileCatalog.length;
    for (const file of files) {
      const entry = this._createFileCatalogEntry(file);
      this._fileCatalog.push(entry);
      this._enrichCatalogEntryThumbnail(entry);
    }
    if (!this._fileCatalog.length) return;
    await this._switchToFile(replace ? 0 : startIndex);
  }

  private async _appendFolderArchive(files: File[]): Promise<void> {
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
    this._fileCatalog.push(entry);
    this._enrichCatalogEntryThumbnail(entry);
    await this._switchToFile(this._fileCatalog.length - 1);
  }

  private async _addArchiveBufferToCatalog(
    buffer: ArrayBuffer,
    label: string,
    { replace = false } = {}
  ): Promise<void> {
    if (replace) {
      this._clearFileCatalog();
      this._filePaneUserToggled = false;
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
    this._fileCatalog.push(entry);
    this._enrichCatalogEntryThumbnail(entry);
    await this._switchToFile(replace ? 0 : this._fileCatalog.length - 1);
  }

  // ---------------------------------------------------------------------------
  // Demo loading
  // ---------------------------------------------------------------------------

  private _setDemoLoading(loading: boolean): void {
    this._demoLoading = loading;
    this._emptyStateRef.value?.setDemoLoading(loading);
    this._toolbarRef.value?.setDemoLoading(loading);
    this.requestUpdate();
  }

  private async _loadDemo(): Promise<void> {
    if (this._demoLoadInProgress) return;
    this._demoLoadInProgress = true;
    this._setDemoLoading(true);
    try {
      const demoUrl = this.example;
      if (!demoUrl) throw new Error('example URL not defined');
      const res = await fetch(demoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const label = demoUrl.split('/').pop() || 'demo.dclx';
      await this._addArchiveBufferToCatalog(await res.arrayBuffer(), label, {
        replace: true,
      });
    } catch (err) {
      alert(
        `Failed to load demo: ${(err as Error).message}\n\nServe this directory over HTTP (e.g. python3 -m http.server) and open the viewer from localhost.`
      );
    } finally {
      this._demoLoadInProgress = false;
      this._setDemoLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Drag-drop
  // ---------------------------------------------------------------------------

  private _hasArchiveTransfer(dataTransfer: DataTransfer | null): boolean {
    return Boolean(dataTransfer && [...dataTransfer.types].includes('Files'));
  }

  private _initDragDrop(): void {
    this.addEventListener('dragenter', (e: DragEvent) => {
      if (!this._hasArchiveTransfer(e.dataTransfer)) return;
      e.preventDefault();
      this._dragOver = true;
      this.requestUpdate();
    });
    this.addEventListener('dragover', (e: DragEvent) => {
      if (!this._hasArchiveTransfer(e.dataTransfer)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    this.addEventListener('dragleave', (e: DragEvent) => {
      if (!this._hasArchiveTransfer(e.dataTransfer)) return;
      if (e.relatedTarget && this.contains(e.relatedTarget as Node)) return;
      this._dragOver = false;
      this.requestUpdate();
    });
    this.addEventListener('drop', async (e: DragEvent) => {
      if (!this._hasArchiveTransfer(e.dataTransfer)) return;
      e.preventDefault();
      this._dragOver = false;
      this.requestUpdate();
      if (e.dataTransfer) await this._loadFromDrop(e.dataTransfer);
    });
  }

  private async _loadFromDrop(dataTransfer: DataTransfer): Promise<void> {
    const files = [...dataTransfer.files];
    if (files.some(f => f.name === 'document.xml')) {
      await this._appendFolderArchive(files);
      return;
    }
    const supported = files.filter(
      f => this._isArchiveFile(f) || this._isMarkupFile(f)
    );
    if (supported.length) await this._addFilesToCatalog(supported, { replace: false });
  }

  // ---------------------------------------------------------------------------
  // Wheel navigation
  // ---------------------------------------------------------------------------

  private _wheelDir(e: WheelEvent): number {
    if (e.deltaMode === 1) return e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (e.deltaMode === 2) return Math.sign(e.deltaY);
    const now = performance.now();
    if (now > this._wheelPixelGestureUntil) this._wheelPixelAccum = 0;
    this._wheelPixelGestureUntil = now + PAGE_WHEEL_GESTURE_MS;
    this._wheelPixelAccum += e.deltaY;
    if (Math.abs(this._wheelPixelAccum) >= PAGE_WHEEL_PIXEL_THRESHOLD) {
      const dir = this._wheelPixelAccum > 0 ? 1 : -1;
      this._wheelPixelAccum = 0;
      return dir;
    }
    return 0;
  }

  private _tryFlipPage(dir: number): boolean {
    const s = this._docState;
    if (!dir || !s) return false;
    const now = performance.now();
    if (now - this._wheelLastFlipAt < PAGE_WHEEL_COOLDOWN_MS) return false;
    const before = s.currentPage;
    this._goToPage(s.currentPage + dir);
    if (s.currentPage !== before) {
      this._wheelLastFlipAt = now;
      return true;
    }
    return false;
  }

  private _onScrollPaneWheel(e: WheelEvent, pane: HTMLElement): void {
    const s = this._docState;
    if (!s || s.markupOnly || s.pageCount <= 1) return;
    const dir = this._wheelDir(e);
    if (!dir) return;
    const atTop = pane.scrollTop <= 0;
    const atBottom = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 1;
    if (!(dir < 0 && atTop) && !(dir > 0 && atBottom)) return;
    e.preventDefault();
    if (!this._tryFlipPage(dir)) return;
    requestAnimationFrame(() => {
      pane.scrollTop = dir > 0 ? 0 : pane.scrollHeight;
    });
  }

  private _initPageWheelNav(): void {
    window.addEventListener('pointermove', this._onWindowPointerMove);
    window.addEventListener('pointerup', this._onWindowPointerUp);
    window.addEventListener('pointercancel', this._onWindowPointerUp);

    // Defer until after first render so refs are populated
    this.updateComplete.then(() => {
      const pageViewPane = this._pageViewPaneRef.value;
      if (pageViewPane) {
        pageViewPane.addEventListener(
          'wheel',
          (e: Event) => {
            const s = this._docState;
            if (!s?.hasPageView) return;
            const scrollPane = pageViewPane.scrollPane ?? null;
            if (!scrollPane) return;
            const scrollable =
              scrollPane.scrollHeight > scrollPane.clientHeight ||
              scrollPane.scrollWidth > scrollPane.clientWidth;
            if (scrollable) {
              this._onScrollPaneWheel(e as WheelEvent, scrollPane);
              return;
            }
            e.preventDefault();
            const dir = this._wheelDir(e as WheelEvent);
            if (dir) this._tryFlipPage(dir);
          },
          { passive: false }
        );
      }

      for (const ref of [this._markupPaneRef, this._readingPaneRef]) {
        const pane = ref.value;
        if (!pane) continue;
        pane.addEventListener(
          'wheel',
          (e: Event) => {
            const scrollPane = pane.scrollPane ?? null;
            if (!scrollPane) return;
            this._onScrollPaneWheel(e as WheelEvent, scrollPane);
          },
          { passive: false }
        );
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Event handlers (from child components via bubbling)
  // ---------------------------------------------------------------------------

  private _onHomeClick = (e: Event): void => {
    e.preventDefault();
    this._resetViewer();
  };

  private _onLoadDemo = (): void => {
    this._loadDemo();
  };

  private _onOpenFiles = (e: Event): void => {
    const files = (e as CustomEvent<{ files: File[] }>).detail.files.filter(
      f => this._isArchiveFile(f) || this._isMarkupFile(f)
    );
    if (!files.length) return;
    this._addFilesToCatalog(files, { replace: true });
  };

  private _onTogglePane = (e: Event): void => {
    const { pane, checked } = (e as CustomEvent<{ pane: PaneKey; checked: boolean }>)
      .detail;
    if (!this._docState) {
      this._syncToolbarPaneCheckboxes();
      return;
    }
    const nextKeys = [...PANE_KEYS].filter(k =>
      k === pane ? checked : this._userPaneVisible[k] && this._isPaneAvailable(k)
    );
    if (!nextKeys.length) {
      this._syncToolbarPaneCheckboxes();
      return;
    }
    this._setUserPaneVisible(pane, checked);
  };

  private _onResetPaneLayout = (): void => {
    if (this._docState) this._resetPaneLayout();
  };

  private _onFilePaneCloseAll = (): void => {
    const count = this._fileCatalog.length;
    if (!count) return;
    const msg =
      count === 1
        ? `Remove "${this._fileCatalog[0]!.label}" from the viewer?`
        : `Remove all ${count} open files from the viewer?`;
    if (confirm(msg)) this._resetViewer();
  };

  private _onElementSelect = (e: Event): void => {
    const rawId = (e as CustomEvent<{ id: string }>).detail.id;
    const resolved = this._resolveSelectionElementId(rawId) ?? rawId;
    this._selectElement(resolved);
  };

  private _onNavigateThread = (e: Event): void => {
    const { elementId, direction } = (
      e as CustomEvent<{ elementId: string; direction: string }>
    ).detail;
    this._navigateThreadFragment(elementId, direction);
  };

  private _onClearSelection = (): void => {
    this._clearSelection();
  };

  private _onPageKeyNav = (e: Event): void => {
    const { dir } = (e as CustomEvent<{ dir: 1 | -1 }>).detail;
    if (this._docState) this._goToPage(this._docState.currentPage + dir);
  };

  private _onZoomChange = (): void => {
    this._pageViewPaneRef.value?.refreshLayout();
  };

  private _onOverlayChange = (e: Event): void => {
    const detail = (e as CustomEvent<{ readingOrderGlobal: boolean }>).detail;
    if (detail.readingOrderGlobal !== this._prevReadingOrderGlobal) {
      this._prevReadingOrderGlobal = detail.readingOrderGlobal;
      const s = this._docState;
      if (s) {
        const markup = this._markupPaneRef.value;
        const reading = this._readingPaneRef.value;
        const pageView = this._pageViewPaneRef.value;
        if (markup) markup.document = s;
        if (reading) reading.document = s;
        if (pageView) pageView.document = s;
      }
    }
  };

  private _onHint = (e: Event): void => {
    // Re-dispatch to the cursor-hint which is also inside this shadow root.
    // cursor-hint listens on its own host; we pass via a direct method call.
    const hint = this.shadowRoot?.querySelector('doclang-cursor-hint') as
      | (HTMLElement & {
          show(t: string, x: number, y: number): void;
          showHtml(h: string, x: number, y: number): void;
        })
      | null;
    if (!hint) return;
    const detail = (
      e as CustomEvent<{
        html?: string;
        text?: string;
        clientX: number;
        clientY: number;
      }>
    ).detail;
    if (detail.html !== undefined)
      hint.showHtml(detail.html, detail.clientX, detail.clientY);
    else if (detail.text !== undefined)
      hint.show(detail.text, detail.clientX, detail.clientY);
  };

  private _onHintHide = (): void => {
    const hint = this.shadowRoot?.querySelector('doclang-cursor-hint') as
      (HTMLElement & { hide(): void }) | null;
    hint?.hide();
  };

  private _onPanningChange = (): void => {
    // panning-change is handled inside page-view-pane; nothing to do at viewer level
  };

  private _onGlobalKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return;
    if (this._toolbarOptionsOpen) {
      this._toolbarOptionsOpen = false;
      this._toolbarRef.value?.setOptionsOpen(false);
      this.requestUpdate();
    } else {
      this._pageViewPaneRef.value?.closeSettings();
    }
    if (this._readingSettingsOpen) this._setReadingSettingsOpen(false);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'doclang-viewer': DoclangViewer;
  }
}
