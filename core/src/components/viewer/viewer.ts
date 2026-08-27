/** <doclang-viewer> — top-level application shell */

import '../page-nav/page-nav';
import '../toolbar/toolbar';
import '../collection/collection-pane';
import '../markup-pane/markup-pane';
import '../page-view-pane/page-view-pane';
import '../reading-pane/reading-pane';
import '../empty-state/empty-state';

import { html, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import styles from './viewer.css?inline';
import { DoclangPageElement } from '../base/page-element';
import { CollectionController } from '../collection/collection';

import type { DoclangPageNav } from '../page-nav/page-nav';
import type { DoclangToolbar } from '../toolbar/toolbar';
import type { DoclangCollectionPane } from '../collection/collection-pane';
import type { DoclangMarkupPane } from '../markup-pane/markup-pane';
import type { DoclangPageViewPane } from '../page-view-pane/page-view-pane';
import type { DoclangReadingPane } from '../reading-pane/reading-pane';
import type { DoclangEmptyState } from '../empty-state/empty-state';

import type { DocumentState } from '../../doclang/types';
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
import { PAGE_ZOOM_DEFAULT } from '../page-view-pane/overlay';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaneKey = 'file' | 'page' | 'markup' | 'reading';

interface PaneDragState {
  physicalSplitterIndex: number;
  leftKey: PaneKey;
  rightKey: PaneKey;
  startX: number;
  leftStart: number;
  rightStart: number;
  pointerId: number;
  leftStartPx?: number;
  rightStartPx?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_FILE_EXTENSIONS = ['.dclx', '.dclg'];
const LAYOUT_STORAGE_KEY = 'doclang-viewer-pane-layout';
const PANE_KEYS = ['file', 'page', 'markup', 'reading'] as const;
const PANE_MIN_RATIO = 0.12;
const DEFAULT_PANE_RATIOS = [1, 1, 1, 1];
const DEFAULT_USER_PANE_VISIBLE: PaneKey[] = ['page', 'markup', 'reading'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('doclang-viewer')
export class DoclangViewer extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  @property({ type: String }) example: string | null = null;

  // ---------------------------------------------------------------------------
  // Reactive state (drives re-render + class toggles on host)
  // ---------------------------------------------------------------------------

  @state() private _loaded = false;
  @state() private _markupOnly = false;
  @state() private _dragOver = false;
  @state() private _paneDragActive = false;
  @state() private _demoLoading = false;
  @state() private _docLabel: string | null = null;
  @state() private _mainGridStyle: Record<string, string> = {};
  @state() private _paneGridCols: Map<PaneKey, number> = new Map();
  @state() private _splitterCols: (number | null)[] = [null, null, null];
  @property({ type: Array, attribute: 'panes', reflect: true })
  panes: PaneKey[] = [...DEFAULT_USER_PANE_VISIBLE];

  // ---------------------------------------------------------------------------
  // Non-reactive fields
  // ---------------------------------------------------------------------------

  private _collection = new CollectionController(this);
  private _filePaneUserToggled = false;
  private _paneRatios: number[] = [...DEFAULT_PANE_RATIOS];
  private _filePaneWidthPx: number | null = null;
  private _paneDrag: PaneDragState | null = null;
  private _demoLoadInProgress = false;
  // Refs to child components
  private _pageNavRef: Ref<DoclangPageNav> = createRef();
  private _toolbarRef: Ref<DoclangToolbar> = createRef();
  private _collectionPaneRef: Ref<DoclangCollectionPane> = createRef();
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
    this._initDragDrop();
    this._initPaneDragListeners();
    this.addEventListener('view-page', this._onViewPage);

    if (this.example) {
      this._demoLoading = true;
      this._loadDemo();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('pointermove', this._onWindowPointerMove);
    window.removeEventListener('pointerup', this._onWindowPointerUp);
    window.removeEventListener('pointercancel', this._onWindowPointerUp);
    this.removeEventListener('view-page', this._onViewPage);
  }

  override updated(changed: PropertyValues): void {
    // Let the base class handle page clamping, _renderDocument, and
    // _applySelection triggered by changes to `page` and `selected`.
    super.updated(changed);
    // Apply host classes imperatively (classMap on :host needs this workaround)
    this.classList.toggle('loaded', this._loaded);
    this.classList.toggle('markup-only', this._markupOnly);
    this.classList.toggle('drag-over', this._dragOver);
    this.classList.toggle('pane-drag-active', this._paneDragActive);
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
            ?hidden=${!this._loaded || this._markupOnly}
            .document=${this._docState}
            .page=${this.page}
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
        class="main"
        style=${styleMap(this._mainGridStyle)}
        ${ref(this._mainRef)}
      >
        <doclang-collection-pane
          ${ref(this._collectionPaneRef)}
          class="pane"
          ?hidden=${!this._isPaneVisible('file')}
          style=${this._paneGridStyle('file')}
          .entries=${this._collection.entries}
          @doclang-collection-select=${(e: Event) => this._onCollectionSelect(e)}
          @doclang-collection-close=${(e: Event) => this._onCollectionClose(e)}
          @doclang-collection-close-all=${this._onCollectionCloseAll}
        ></doclang-collection-pane>

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
          .document=${this._docState}
          .page=${this.page}
          .selected=${this.selected}
          @doclang-element-select=${this._onElementSelect}
          @doclang-navigate-thread=${this._onNavigateThread}
          @doclang-clear-selection=${this._onClearSelection}
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
          .document=${this._docState}
          .page=${this.page}
          .selected=${this.selected}
          @doclang-element-select=${this._onElementSelect}
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
          .document=${this._docState}
          .page=${this.page}
          .selected=${this.selected}
          @doclang-element-select=${this._onElementSelect}
        ></doclang-reading-pane>
      </div>

    `;
  }

  // ---------------------------------------------------------------------------
  // DoclangPageElement interface
  // ---------------------------------------------------------------------------

  protected override _renderDocument(): void {}
  protected override _clearDocument(): void {}

  // ---------------------------------------------------------------------------
  // Grid style helpers
  // ---------------------------------------------------------------------------

  private _paneGridStyle(key: PaneKey): string {
    const col = this._paneGridCols.get(key);
    return col !== undefined ? `grid-column:${col}` : '';
  }

  private _splitterGridStyle(index: number): string {
    const col = this._splitterCols[index];
    if (col === null) return '';
    return `grid-column:${col}`;
  }

  // ---------------------------------------------------------------------------
  // Pane layout
  // ---------------------------------------------------------------------------

  private _isPaneAvailable(key: PaneKey): boolean {
    if (key === 'file') return this._collection.size > 0;
    if (key === 'page') return Boolean(this._docState?.hasPageView);
    return Boolean(this._docState);
  }

  private _isPaneVisible(key: PaneKey): boolean {
    if (!this._isPaneAvailable(key)) return false;
    return this.panes.includes(key);
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
    let keys = this._visiblePaneKeys();
    if (!keys.length) {
      if (!this.panes.includes('markup')) this.panes = [...this.panes, 'markup'];
      keys = this._visiblePaneKeys();
    }

    const gridCols = new Map<PaneKey, number>();
    const splitterCols: (number | null)[] = [null, null, null];

    if (!this._loaded) {
      this._paneGridCols = gridCols;
      this._splitterCols = splitterCols;
      this._mainGridStyle = {};
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
    this._splitterCols = splitterCols;
    this._mainGridStyle = { gridTemplateColumns: cols.join(' ') };
    this._pageViewPaneRef.value?.refreshLayout();
    this._readingPaneRef.value?.setVisible(this._isPaneVisible('reading'));
    this.requestUpdate();
  }

  private _setUserPaneVisible(key: PaneKey, visible: boolean): void {
    this.panes = visible
      ? [...this.panes.filter(k => k !== key), key]
      : this.panes.filter(k => k !== key);
    if (key === 'file') this._filePaneUserToggled = true;
    if (key === 'page') this._syncPagePaneControls();
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
        const loaded: PaneKey[] = [];
        for (const key of PANE_KEYS) {
          if (data.visible[key] === true) loaded.push(key);
        }
        if (loaded.length) this.panes = loaded;
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
          visible: Object.fromEntries(PANE_KEYS.map(k => [k, this.panes.includes(k)])),
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
    this.panes = this._collection.hasMultiple()
      ? ['file', 'page', 'markup', 'reading']
      : ['page', 'markup', 'reading'];
    this._paneRatios = [...DEFAULT_PANE_RATIOS];
    this._normalizePaneRatios();
    this._filePaneWidthPx = null;
    this._syncPagePaneControls();
    this._syncToolbarPaneCheckboxes();
    this._saveLayoutPrefs();
    this._applyPaneLayout();
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
    if (e.button !== 0 || !this._loaded) return;
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
    if (page === this.page) {
      const id = this._findElementIdOnPage(target);
      if (id) this._selectElement(id);
      return;
    }
    s!.pendingSelectElement = target;
    this.page = page;
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
    this.selected = elementId;
  }

  private _clearSelection(): void {
    this.selected = null;
  }

  private _syncToolbarPaneCheckboxes(): void {
    this._toolbarRef.value?.syncPaneToggles({
      file: this.panes.includes('file'),
      page: this.panes.includes('page'),
      markup: this.panes.includes('markup'),
      reading: this.panes.includes('reading'),
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
    this._syncToolbarPaneCheckboxes();
    this._applyPaneLayout();
    this.requestUpdate();
  }

  private _setPageViewVisible(): void {
    this._syncPagePaneControls();
    this._syncToolbarPaneCheckboxes();
    this._applyPaneLayout();
  }

  private _resetViewer(): void {
    this._setDemoLoading(false);
    this._collection.clearAll();
    this._filePaneUserToggled = false;
    this._pageViewPaneRef.value?.resetZoom();
    this._docLabel = null;
    this._setDocumentOpen(false);
    // Setting document = null goes through the base class setter, which resets
    // this.page to 1, calls _clearDocument() to clear all sub-views, and
    // nulls _docState.
    this.document = null;
    this.selected = null;
    this._syncCollectionPaneDefault();
    this._syncToolbarPaneCheckboxes();
    this._applyPaneLayout();
    this.requestUpdate();
  }

  private _activateDocument(docState: DocumentState, initialPage = 1): void {
    const entry = this._collection.activeEntry;
    if (!entry) return;
    this._pageViewPaneRef.value?.activateZoom(entry.pageZoom ?? PAGE_ZOOM_DEFAULT);
    this._docLabel = entry.label;
    this.selected = null;
    // Setting this.document pushes docState to _docState and calls
    // _renderDocument(), which forwards it to all sub-view refs.
    // The base class also resets this.page to 1 on document change, so we
    // then navigate to the correct initial page afterwards.
    this.document = docState;
    this._setDocumentOpen(true, { markupOnly: docState.markupOnly });
    this._setPageViewVisible();
    this.page = initialPage;
    this._syncCollectionPaneDefault();
    this._syncToolbarPaneCheckboxes();
    this._applyPaneLayout();
    this.requestUpdate();
  }

  // ---------------------------------------------------------------------------
  // File catalog — delegated to CollectionController
  // ---------------------------------------------------------------------------

  private _syncCollectionPaneDefault(): void {
    if (!this._filePaneUserToggled) {
      const wasVisible = this.panes.includes('file');
      const should = this._collection.hasMultiple();
      this.panes = should
        ? [...this.panes.filter(k => k !== 'file'), 'file']
        : this.panes.filter(k => k !== 'file');
      if (!wasVisible && should) {
        this._paneRatios = [...DEFAULT_PANE_RATIOS];
        this._normalizePaneRatios();
        this._filePaneWidthPx = null;
      }
    }
  }

  private async _addFilesToCatalog(
    files: File[],
    { replace = false } = {}
  ): Promise<void> {
    if (replace) this._filePaneUserToggled = false;
    const docState = await this._collection.addFiles(files, { replace });
    if (!docState) return;
    const entry = this._collection.activeEntry!;
    this._activateDocument(docState, entry.currentPage ?? 1);
  }

  private async _appendFolderArchive(files: File[]): Promise<void> {
    const docState = await this._collection.appendFolderArchive(files);
    if (!docState) return;
    const entry = this._collection.activeEntry!;
    this._activateDocument(docState, entry.currentPage ?? 1);
  }

  private async _addArchiveBufferToCatalog(
    buffer: ArrayBuffer,
    label: string,
    { replace = false } = {}
  ): Promise<void> {
    if (replace) this._filePaneUserToggled = false;
    const docState = await this._collection.addArchiveBuffer(buffer, label, { replace });
    if (!docState) return;
    const entry = this._collection.activeEntry!;
    this._activateDocument(docState, entry.currentPage ?? 1);
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
      f => this._collection.isArchiveFile(f) || this._collection.isMarkupFile(f)
    );
    if (supported.length) await this._addFilesToCatalog(supported, { replace: false });
  }

  private _initPaneDragListeners(): void {
    window.addEventListener('pointermove', this._onWindowPointerMove);
    window.addEventListener('pointerup', this._onWindowPointerUp);
    window.addEventListener('pointercancel', this._onWindowPointerUp);
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
      f => this._collection.isArchiveFile(f) || this._collection.isMarkupFile(f)
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
      k === pane ? checked : this.panes.includes(k) && this._isPaneAvailable(k)
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

  private _onCollectionSelect = (e: Event): void => {
    const { index } = (e as CustomEvent<{ index: number }>).detail;
    this._collection.persistActiveViewState(
      this.page,
      this._pageViewPaneRef.value?.zoomPercent ?? PAGE_ZOOM_DEFAULT
    );
    this._collection.selectEntry(index).then(docState => {
      if (!docState) { this._resetViewer(); return; }
      const entry = this._collection.activeEntry!;
      this._activateDocument(docState, entry.currentPage ?? 1);
    });
  };

  private _onCollectionClose = (e: Event): void => {
    const { index } = (e as CustomEvent<{ index: number }>).detail;
    this._collection.persistActiveViewState(
      this.page,
      this._pageViewPaneRef.value?.zoomPercent ?? PAGE_ZOOM_DEFAULT
    );
    this._collection.closeEntry(index).then(({ doc, newIndex }) => {
      if (newIndex < 0) { this._resetViewer(); return; }
      if (doc) {
        const entry = this._collection.activeEntry!;
        this._activateDocument(doc, entry.currentPage ?? 1);
      } else {
        this._syncCollectionPaneDefault();
        this._syncToolbarPaneCheckboxes();
        this._applyPaneLayout();
        this.requestUpdate();
      }
    });
  };

  private _onCollectionCloseAll = (): void => {
    const count = this._collection.size;
    if (!count) return;
    const firstLabel = this._collection.entries[0]?.label ?? '';
    const msg =
      count === 1
        ? `Remove "${firstLabel}" from the viewer?`
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

  private _onViewPage = (e: Event): void => {
    this.page = (e as CustomEvent<{ page: number }>).detail.page;
  };

}
