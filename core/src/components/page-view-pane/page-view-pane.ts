/** <doclang-page-view-pane> — page image with zoom and overlay settings panel */

import { DoclangPageElement } from '../base/document-base';
import styles from './page-view-pane.css?inline';
import template from './page-view-pane.html?raw';
import {
  PAGE_ZOOM_DEFAULT,
  PAGE_PAN_DRAG_THRESHOLD,
  NO_IMAGE,
  FRAGMENT_NAV_HINT_PREV,
  FRAGMENT_NAV_HINT_NEXT,
} from '../../constants';
import {
  applyPageImageSize,
  buildOverlay,
  syncOverlayBadges,
  type OverlayCtx,
} from './overlay';
import {
  assignElementIds,
  invertElementIds,
  collectBoundingBoxes,
  collectCaptionLinks,
  collectXrefLinks,
  collectFragmentLinks,
  collectFragmentNavItems,
  collectReadingOrderSteps,
} from '../../doclang/document';
import {
  isPictureContentElement,
  isTableContentElement,
  escapeHtml,
  elementLabel,
  elementHeadLocations,
  firstHeadChild,
  locationResolution,
} from '../../doclang/dom';
import type { HeadInfo, PageLayoutCache, PagePanDrag } from '../../doclang/types';

export interface OverlaySettings {
  showAllBboxes: boolean;
  showLayoutBadges: boolean;
  showReadingOrder: boolean;
  readingOrderArrows: boolean;
  readingOrderGlobal: boolean;
  showPictureContents: boolean;
  showTableContents: boolean;
  showFragmentLinks: boolean;
  showXrefLinks: boolean;
  showCaptionLinks: boolean;
}

export class DoclangPageViewPane extends DoclangPageElement {
  private _body: HTMLElement;
  private _settingsToggle: HTMLButtonElement;
  private _settingsLayer: HTMLElement;
  private _settingsScrim: HTMLButtonElement;
  private _settingsClose: HTMLButtonElement;
  private _zoomLabel: HTMLDivElement;
  private _zoomInput: HTMLInputElement;
  private _zoomReset: HTMLButtonElement;
  private _showAllBboxes: HTMLInputElement;
  private _layoutSubtoggles: HTMLDivElement;
  private _showLayoutBadges: HTMLInputElement;
  private _showReadingOrder: HTMLInputElement;
  private _readingOrderSubtoggles: HTMLDivElement;
  private _readingOrderArrows: HTMLInputElement;
  private _readingOrderGlobal: HTMLInputElement;
  private _showPictureContents: HTMLInputElement;
  private _showTableContents: HTMLInputElement;
  private _showFragmentLinks: HTMLInputElement;
  private _showXrefLinks: HTMLInputElement;
  private _showCaptionLinks: HTMLInputElement;

  // --- overlay settings state ---
  private _settingsOpen = false;
  private _zoomPct = PAGE_ZOOM_DEFAULT;
  private _opts: OverlaySettings = {
    showAllBboxes: true,
    showLayoutBadges: true,
    showReadingOrder: false,
    readingOrderArrows: true,
    readingOrderGlobal: false,
    showPictureContents: false,
    showTableContents: false,
    showFragmentLinks: false,
    showXrefLinks: false,
    showCaptionLinks: false,
  };

  // --- viewport mechanics state ---
  private _panDrag: PagePanDrag | null = null;
  private _suppressClick = false;
  private _layoutCache: PageLayoutCache | null = null;
  private _layoutFrame = 0;
  private _resizeObserver: ResizeObserver | null = null;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-page-view');
    this._body = this.q('.pane-body');
    this._zoomLabel = this.q('.page-zoom-control');
    this._zoomInput = this.q('.zoom-input');
    this._zoomReset = this.q('.page-zoom-reset');
    this._settingsToggle = this.q('.pane-settings-toggle');
    this._settingsLayer = this.q('.viewer-settings-layer');
    this._settingsScrim = this.q('.viewer-settings-scrim');
    this._settingsClose = this.q('.viewer-settings-close');
    this._showAllBboxes = this.q('.cb-all-bboxes');
    this._layoutSubtoggles = this.q('.settings-subgroup');
    this._showReadingOrder = this.q('.cb-reading-order');
    this._readingOrderSubtoggles = this.q('.settings-reading-order-group');
    this._readingOrderArrows = this.q('.cb-reading-order-arrows');
    this._readingOrderGlobal = this.q('.cb-reading-order-global');
    this._showPictureContents = this.q('.cb-picture-contents');
    this._showTableContents = this.q('.cb-table-contents');
    this._showFragmentLinks = this.q('.cb-fragment-links');
    this._showXrefLinks = this.q('.cb-xref-links');
    this._showCaptionLinks = this.q('.cb-caption-links');
    this._showLayoutBadges = this.q('.cb-layout-badges');

    this._wirePanEvents();
    this._wireSettingsEvents();
    this._wireHints();
  }

  // ---------------------------------------------------------------------------
  // Public getters
  // ---------------------------------------------------------------------------

  get zoomPercent(): number {
    return this._zoomPct;
  }

  get overlaySettings(): Readonly<OverlaySettings> {
    return this._opts;
  }

  get suppressClick(): boolean {
    return this._suppressClick;
  }
  setSuppressClick(v: boolean): void {
    this._suppressClick = v;
  }

  /** The scrollable viewport pane (page-view-port div, or body if absent). */
  get scrollPane(): HTMLElement | null {
    return this._scrollPane();
  }

  // ---------------------------------------------------------------------------
  // Visibility / layout
  // ---------------------------------------------------------------------------

  setVisible(visible: boolean): void {
    this.hidden = !visible;
    this._settingsToggle.hidden = this.hidden;
    this._zoomLabel.hidden = this.hidden;
    // also update tabIndex on the body
    this._body.tabIndex = visible ? 0 : -1;
  }

  /**
   * Recalculate image size and re-sync overlay badge positions.
   * Also ensures the ResizeObserver is attached (idempotent).
   */
  refreshLayout(): void {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this.refreshLayout());
      this._resizeObserver.observe(this._body);
    }
    cancelAnimationFrame(this._layoutFrame);
    this._layoutFrame = requestAnimationFrame(() => {
      this._layoutFrame = 0;
      const img = this._body.querySelector('.page-view img') as HTMLImageElement | null;
      if (img?.naturalWidth) {
        applyPageImageSize(img, this._body, this._overlayCtx());
        this._updatePanCursor();
        this._syncOverlayBadgesForImg(img);
        this.dispatchEvent(
          new CustomEvent('doclang-layout-refresh', { bubbles: true, composed: true })
        );
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  activateZoom(pct: number): void {
    this._zoomPct = pct;
    this._layoutCache = null;
    this._syncZoomUI();
    this._resetScroll();
  }

  resetZoom(): void {
    this._zoomPct = PAGE_ZOOM_DEFAULT;
    this._layoutCache = null;
    this._syncZoomUI();
    this._resetScroll();
    this.dispatchEvent(
      new CustomEvent('doclang-zoom-change', {
        bubbles: true,
        composed: true,
        detail: { pct: this._zoomPct },
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Settings panel
  // ---------------------------------------------------------------------------

  toggleSettings(): void {
    this._setSettingsOpen(!this._settingsOpen);
  }

  closeSettings(): void {
    if (this._settingsOpen) this._setSettingsOpen(false);
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  protected override _applySelection(): void {
    for (const el of this._body.querySelectorAll(
      '.bbox.selected, .overlay-badge.selected'
    )) {
      el.classList.remove('selected');
    }
    if (this._selectedId && this._docState?.hasPageView) {
      for (const el of this._body.querySelectorAll(
        `[data-element-id="${this._selectedId}"]`
      )) {
        el.classList.add('selected');
      }
    }
    const img = this._body.querySelector('.page-view img') as HTMLImageElement | null;
    if (img) this._syncOverlayBadgesForImg(img);
    this._applyBboxVisibility();
  }

  // ---------------------------------------------------------------------------
  // Document rendering
  // ---------------------------------------------------------------------------

  protected override _renderDocument(): void {
    const state = this._docState;
    this._body.innerHTML = '';
    this._layoutCache = null;
    this._selectedId = null;
    this._peerIds = new Set();

    if (!state?.hasPageView) return;

    const imageUrl = state.pageImages.get(this._currentPage);
    if (!imageUrl) {
      this._body.innerHTML = `<div class="placeholder">${NO_IMAGE}</div>`;
      return;
    }

    const port = document.createElement('div');
    port.className = 'page-view-port';
    const wrap = document.createElement('div');
    wrap.className = 'page-view';
    const img = document.createElement('img');
    img.alt = `Page ${this._currentPage}`;

    const pageNum = this._currentPage;
    const onImageReady = (): void => {
      if (img.dataset.layoutGeneration === String(pageNum)) return;
      img.dataset.layoutGeneration = String(pageNum);
      applyPageImageSize(img, this._body, this._overlayCtx());

      const segment = state.segments[pageNum - 1] ?? [];
      const elementIds = assignElementIds(segment);
      state.elementIds = elementIds;
      state.idToElement = invertElementIds(elementIds);

      const boxes = collectBoundingBoxes(segment, state.defaultResolution, elementIds);
      const existing = wrap.querySelector('svg.overlay');
      if (existing) existing.remove();
      const readingOrderSteps = collectReadingOrderSteps(
        segment,
        elementIds,
        boxes,
        state.readingOrder,
        this._opts.readingOrderGlobal,
        state.readingOrderDisplayNumbers
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
            collectFragmentLinks(
              segment,
              elementIds,
              boxes,
              pageNum,
              state.threadPagesById
            ),
            collectFragmentNavItems(
              segment,
              elementIds,
              boxes,
              state.threadNavByElement
            ),
            state.defaultResolution,
            id =>
              this.dispatchEvent(
                new CustomEvent('doclang-element-select', {
                  bubbles: true,
                  composed: true,
                  detail: { id },
                })
              ),
            (elementId, direction) =>
              this.dispatchEvent(
                new CustomEvent('doclang-navigate-thread', {
                  bubbles: true,
                  composed: true,
                  detail: { elementId, direction },
                })
              ),
            () =>
              this.dispatchEvent(
                new CustomEvent('doclang-clear-selection', {
                  bubbles: true,
                  composed: true,
                })
              ),
            () => this._suppressClick,
            v => {
              this._suppressClick = v;
            },
            this._overlayCtx()
          )
        );
      }

      this._syncOverlayBadgesForImg(img);
      this._applyBboxVisibility();

      const pending = state.pendingSelectElement;
      if (pending) {
        state.pendingSelectElement = null;
        const id = this._findElementIdOnPage(pending, elementIds);
        if (id)
          this.dispatchEvent(
            new CustomEvent('doclang-element-select', {
              bubbles: true,
              composed: true,
              detail: { id },
            })
          );
      }
    };

    img.addEventListener('load', onImageReady, { once: true });
    wrap.appendChild(img);
    port.appendChild(wrap);
    this._body.appendChild(port);
    img.src = imageUrl;
    if (img.complete) onImageReady();

    this.refreshLayout();
  }

  protected override _clearDocument(): void {
    this._body.innerHTML = '';
    this._layoutCache = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers — overlay visibility
  // ---------------------------------------------------------------------------

  private _overlayCtx(): OverlayCtx {
    return {
      zoomPct: this._zoomPct,
      pane: this._body,
      layoutCache: this._layoutCache,
      setLayoutCache: c => {
        this._layoutCache = c;
      },
      selectedId: this._selectedId,
    };
  }

  private _syncOverlayBadgesForImg(img: HTMLImageElement): void {
    const svg = img.parentElement?.querySelector('svg.overlay') as SVGSVGElement | null;
    const overlay = this._docState?.pageViewOverlay;
    if (!svg || !overlay) return;
    const { showAllBboxes, showLayoutBadges, showReadingOrder } = this._opts;
    syncOverlayBadges(
      img,
      svg,
      overlay.boxes,
      overlay.readingOrderSteps,
      showAllBboxes,
      showLayoutBadges,
      showReadingOrder,
      this._overlayCtx()
    );
  }

  private _isContentsOptionHidden(elementId: string, clickVisible: boolean): boolean {
    if (clickVisible) return false;
    const xmlEl = this._docState?.idToElement?.get(elementId) ?? null;
    if (!this._opts.showPictureContents && isPictureContentElement(xmlEl)) return true;
    if (!this._opts.showTableContents && isTableContentElement(xmlEl)) return true;
    return false;
  }

  private _isFragmentLinkRelevant(linkEl: Element): boolean {
    const fromId = linkEl.getAttribute('data-fragment-from-id');
    const toId = linkEl.getAttribute('data-fragment-to-id');
    if (fromId && this._peerIds.has(fromId)) return true;
    if (toId && this._peerIds.has(toId)) return true;
    return false;
  }

  private _applyBboxVisibility(): void {
    if (!this._docState?.hasPageView) return;
    const {
      showAllBboxes,
      showLayoutBadges,
      showCaptionLinks,
      showXrefLinks,
      showFragmentLinks,
      showReadingOrder,
      readingOrderArrows,
    } = this._opts;
    const selectedId = this._selectedId;
    const peerIds = this._peerIds;

    for (const el of this._body.querySelectorAll('.bbox')) {
      el.classList.remove('related');
      const elementId = el.getAttribute('data-element-id') ?? '';
      const clickVisible = elementId === selectedId || peerIds.has(elementId);
      if (showAllBboxes) {
        if (this._isContentsOptionHidden(elementId, clickVisible)) {
          el.classList.add('bbox-hidden');
        } else {
          el.classList.remove('bbox-hidden');
          if (peerIds.has(elementId)) el.classList.add('related');
        }
        continue;
      }
      if (elementId === selectedId) {
        el.classList.remove('bbox-hidden');
      } else if (peerIds.has(elementId)) {
        el.classList.remove('bbox-hidden');
        el.classList.add('related');
      } else {
        el.classList.add('bbox-hidden');
      }
    }

    for (const el of this._body.querySelectorAll('.element-badge')) {
      const elementId = el.getAttribute('data-element-id') ?? '';
      const clickVisible = elementId === selectedId || peerIds.has(elementId);
      if (!showAllBboxes || !showLayoutBadges) {
        el.classList.add('bbox-hidden');
        continue;
      }
      if (this._isContentsOptionHidden(elementId, clickVisible))
        el.classList.add('bbox-hidden');
      else el.classList.remove('bbox-hidden');
    }

    for (const el of this._body.querySelectorAll('.caption-link')) {
      el.classList.toggle('bbox-hidden', !showAllBboxes || !showCaptionLinks);
    }
    for (const el of this._body.querySelectorAll('.xref-link')) {
      el.classList.toggle('bbox-hidden', !showAllBboxes || !showXrefLinks);
    }
    for (const el of this._body.querySelectorAll('.fragment-link')) {
      const clickVisible = Boolean(selectedId && this._isFragmentLinkRelevant(el));
      el.classList.toggle(
        'bbox-hidden',
        !(clickVisible || (showAllBboxes && showFragmentLinks))
      );
    }
    for (const el of this._body.querySelectorAll('.fragment-nav')) {
      const elementId = el.getAttribute('data-element-id') ?? '';
      const clickVisible = elementId === selectedId || peerIds.has(elementId);
      el.classList.toggle(
        'bbox-hidden',
        !(clickVisible || (showAllBboxes && showFragmentLinks))
      );
    }
    for (const el of this._body.querySelectorAll('.reading-order-badge')) {
      const elementId = el.getAttribute('data-element-id') ?? '';
      const clickVisible = elementId === selectedId || peerIds.has(elementId);
      if (!showAllBboxes || !showReadingOrder) {
        el.classList.add('bbox-hidden');
        continue;
      }
      const xmlEl = this._docState?.idToElement?.get(elementId) ?? null;
      if (
        isPictureContentElement(xmlEl) ||
        isTableContentElement(xmlEl) ||
        this._isContentsOptionHidden(elementId, clickVisible)
      ) {
        el.classList.add('bbox-hidden');
        continue;
      }
      el.classList.remove('bbox-hidden');
    }
    for (const el of this._body.querySelectorAll('.reading-order-step')) {
      el.classList.toggle(
        'bbox-hidden',
        !showAllBboxes || !showReadingOrder || !readingOrderArrows
      );
    }
  }

  private _findElementIdOnPage(
    el: Element,
    elementIds: Map<Element, string>
  ): string | null {
    return elementIds.get(el) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers — pan / scroll / cursor
  // ---------------------------------------------------------------------------

  private _scrollPane(): HTMLElement | null {
    return (
      (this._body.querySelector('.page-view-port') as HTMLElement | null) ?? this._body
    );
  }

  private _isScrollable(): boolean {
    const pane = this._scrollPane();
    if (!pane) return false;
    return pane.scrollWidth > pane.clientWidth || pane.scrollHeight > pane.clientHeight;
  }

  private _resetScroll(): void {
    const port = this._scrollPane();
    if (port) {
      port.scrollLeft = 0;
      port.scrollTop = 0;
    }
  }

  private _updatePanCursor(): void {
    this._body.classList.toggle('can-pan', this._isScrollable() && !this._panDrag);
  }

  private _setSettingsOpen(open: boolean): void {
    this._settingsOpen = open;
    this._settingsLayer.hidden = !open;
    this._settingsToggle.setAttribute('aria-expanded', String(open));
  }

  private _syncZoomUI(): void {
    this._zoomInput.value = String(this._zoomPct);
    this._zoomInput.setAttribute('aria-valuenow', String(this._zoomPct));
    this._zoomReset.textContent = `${this._zoomPct}%`;
    this._zoomReset.disabled = this._zoomPct === PAGE_ZOOM_DEFAULT;
  }

  private _syncSubtoggles(): void {
    const layoutEnabled = this._opts.showAllBboxes;
    const readingOrderEnabled = layoutEnabled && this._opts.showReadingOrder;
    for (const label of this._layoutSubtoggles.querySelectorAll<HTMLLabelElement>(
      'label.settings-option-sub:not(.settings-reading-order-group label)'
    )) {
      label.classList.toggle('settings-option-disabled', !layoutEnabled);
      const input = label.querySelector('input') as HTMLInputElement | null;
      if (input) input.disabled = !layoutEnabled;
    }
    for (const label of this._readingOrderSubtoggles.querySelectorAll<HTMLLabelElement>(
      'label.settings-option-sub'
    )) {
      label.classList.toggle('settings-option-disabled', !readingOrderEnabled);
      const input = label.querySelector('input') as HTMLInputElement | null;
      if (input) input.disabled = !readingOrderEnabled;
    }
  }

  private _emitOverlayChange(): void {
    this.dispatchEvent(
      new CustomEvent('doclang-overlay-change', {
        bubbles: true,
        composed: true,
        detail: { ...this._opts },
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------------

  private _wirePanEvents(): void {
    this._body.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!(e.target instanceof Element) || !e.target.closest('.page-view')) return;
      if (!this._isScrollable()) return;
      const scrollPane = this._scrollPane();
      if (!scrollPane) return;
      this._panDrag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: scrollPane.scrollLeft,
        scrollTop: scrollPane.scrollTop,
        moved: false,
      };
    });

    this._body.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this._panDrag || e.pointerId !== this._panDrag.pointerId) return;
      const dx = e.clientX - this._panDrag.startX;
      const dy = e.clientY - this._panDrag.startY;
      if (!this._panDrag.moved && Math.hypot(dx, dy) >= PAGE_PAN_DRAG_THRESHOLD) {
        this._panDrag.moved = true;
        this._body.classList.add('is-panning');
        this._body.classList.remove('can-pan');
        this._body.setPointerCapture(e.pointerId);
        this.dispatchEvent(
          new CustomEvent('doclang-panning-change', {
            bubbles: true,
            composed: true,
            detail: { panning: true },
          })
        );
      }
      if (!this._panDrag.moved) return;
      const scrollPane = this._scrollPane();
      if (!scrollPane) return;
      scrollPane.scrollLeft =
        this._panDrag.scrollLeft + this._panDrag.startX - e.clientX;
      scrollPane.scrollTop = this._panDrag.scrollTop + this._panDrag.startY - e.clientY;
      e.preventDefault();
    });

    const endPan = (e: PointerEvent): void => {
      if (!this._panDrag || e.pointerId !== this._panDrag.pointerId) return;
      const wasPanning = this._panDrag.moved;
      if (wasPanning) this._suppressClick = true;
      this._panDrag = null;
      this._body.classList.remove('is-panning');
      if (wasPanning)
        this.dispatchEvent(
          new CustomEvent('doclang-panning-change', {
            bubbles: true,
            composed: true,
            detail: { panning: false },
          })
        );
      if (this._body.hasPointerCapture(e.pointerId))
        this._body.releasePointerCapture(e.pointerId);
      this._updatePanCursor();
    };

    this._body.addEventListener('pointerup', (e: PointerEvent) => endPan(e));
    this._body.addEventListener('pointercancel', (e: PointerEvent) => endPan(e));

    // Keyboard page navigation
    this._body.tabIndex = 0;
    this._body.setAttribute('role', 'region');
    this._body.setAttribute('aria-label', 'Original page');
    this._body.addEventListener('pointerdown', () => {
      if (this._docState?.hasPageView) this._body.focus({ preventScroll: true });
    });
    this._body.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this._docState?.hasPageView) return;
      let dir = 0;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case 'ArrowRight':
          dir = 1;
          break;
        case 'ArrowUp':
        case 'PageUp':
        case 'ArrowLeft':
          dir = -1;
          break;
      }
      if (dir) {
        e.preventDefault();
        this.dispatchEvent(
          new CustomEvent('doclang-page-key-nav', {
            bubbles: true,
            composed: true,
            detail: { dir },
          })
        );
      }
    });
  }

  private _wireSettingsEvents(): void {
    this._settingsToggle.addEventListener('click', () => this.toggleSettings());
    this._settingsClose.addEventListener('click', () => this._setSettingsOpen(false));
    this._settingsScrim.addEventListener('click', () => this._setSettingsOpen(false));

    this._zoomInput.addEventListener('input', () => {
      this._zoomPct = Math.max(PAGE_ZOOM_DEFAULT, Number(this._zoomInput.value));
      this._layoutCache = null;
      this._syncZoomUI();
      this.dispatchEvent(
        new CustomEvent('doclang-zoom-change', {
          bubbles: true,
          composed: true,
          detail: { pct: this._zoomPct },
        })
      );
    });

    this._zoomReset.addEventListener('click', () => {
      if (this._zoomPct !== PAGE_ZOOM_DEFAULT) this.resetZoom();
    });

    for (const [el, key] of [
      [this._showAllBboxes, 'showAllBboxes'],
      [this._showLayoutBadges, 'showLayoutBadges'],
      [this._showReadingOrder, 'showReadingOrder'],
      [this._readingOrderArrows, 'readingOrderArrows'],
      [this._readingOrderGlobal, 'readingOrderGlobal'],
      [this._showPictureContents, 'showPictureContents'],
      [this._showTableContents, 'showTableContents'],
      [this._showFragmentLinks, 'showFragmentLinks'],
      [this._showXrefLinks, 'showXrefLinks'],
      [this._showCaptionLinks, 'showCaptionLinks'],
    ] as [HTMLInputElement, keyof OverlaySettings][]) {
      el.addEventListener('change', () => {
        (this._opts as unknown as Record<string, boolean>)[key] = el.checked;
        this._syncSubtoggles();
        // Re-render page if global numbering changed (affects step labels)
        if (key === 'readingOrderGlobal' && this._docState) {
          this._renderDocument();
        }
        const img = this._body.querySelector(
          '.page-view img'
        ) as HTMLImageElement | null;
        if (img) this._syncOverlayBadgesForImg(img);
        this._applyBboxVisibility();
        this._emitOverlayChange();
      });
    }
  }

  private _wireHints(): void {
    this.addEventListener('doclang-panning-change', (e: Event) => {
      if ((e as CustomEvent<{ panning: boolean }>).detail.panning) {
        this._hideHint();
      }
    });
    this.addEventListener('mousemove', e => {
      if (this._panDrag?.moved) {
        this._hideHint();
        return;
      }
      const navBtn = (e.target as Element).closest(
        '.fragment-nav-btn:not(.fragment-nav-btn-disabled)'
      );
      if (navBtn) {
        const hint =
          navBtn.getAttribute('data-nav') === 'prev'
            ? FRAGMENT_NAV_HINT_PREV
            : FRAGMENT_NAV_HINT_NEXT;
        this._showHint({
          text: hint,
          clientX: (e as MouseEvent).clientX,
          clientY: (e as MouseEvent).clientY,
        });
        return;
      }
      const badge = (e.target as Element).closest('.element-badge[data-element-id]');
      if (!badge || !this._docState?.idToElement) {
        this._hideHint();
        return;
      }
      const elementId = badge.getAttribute('data-element-id');
      const xmlEl = elementId ? this._docState.idToElement.get(elementId) : null;
      if (!xmlEl) {
        this._hideHint();
        return;
      }
      this._showHint({
        html: this._elementHeadTooltipHtml(xmlEl, this._docState.defaultResolution),
        clientX: (e as MouseEvent).clientX,
        clientY: (e as MouseEvent).clientY,
      });
    });
    this.addEventListener('mouseleave', () => this._hideHint());
  }

  private _showHint(detail: {
    html?: string;
    text?: string;
    clientX: number;
    clientY: number;
  }): void {
    this.dispatchEvent(
      new CustomEvent('doclang-hint', { bubbles: true, composed: true, detail })
    );
  }

  private _hideHint(): void {
    this.dispatchEvent(
      new CustomEvent('doclang-hint-hide', { bubbles: true, composed: true })
    );
  }

  private _elementHeadTooltipHtml(
    el: Element,
    defaultResolution: { width: number; height: number }
  ): string {
    const rows = this._collectElementHeadInfo(el, defaultResolution);
    const body = rows
      .map(({ key, value, isDefault }) => {
        const rendered = escapeHtml(value);
        const suffix = isDefault ? ' <span class="head-default">(default)</span>' : '';
        return `<tr><th scope="row">${escapeHtml(key)}</th><td>${rendered}${suffix}</td></tr>`;
      })
      .join('');
    return `<table class="head-tooltip"><tbody>${body}</tbody></table>`;
  }

  private _collectElementHeadInfo(
    el: Element,
    defaultResolution: { width: number; height: number }
  ): HeadInfo[] {
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
    const rows: HeadInfo[] = [
      { key: 'element', value: elementLabel(el), isDefault: false },
    ];

    rows.push({
      key: 'label',
      value: labelEl?.getAttribute('value') ?? 'undefined',
      isDefault: !labelEl?.hasAttribute('value'),
    });

    if (threadEl) {
      rows.push({
        key: 'thread_id',
        value: threadEl.getAttribute('thread_id') ?? '—',
        isDefault: false,
      });
    } else {
      rows.push({ key: 'thread', value: '—', isDefault: true });
    }

    if (xrefEl) {
      rows.push({
        key: 'xref',
        value: `thread_id ${xrefEl.getAttribute('thread_id') ?? '—'}`,
        isDefault: false,
      });
    } else {
      rows.push({ key: 'xref', value: '—', isDefault: true });
    }

    if (hrefEl) {
      rows.push({
        key: 'href',
        value: hrefEl.getAttribute('uri') ?? '—',
        isDefault: false,
      });
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
        const axisDefault =
          idx % 2 === 0 ? defaultResolution.width : defaultResolution.height;
        const resolution = locationResolution(loc, axisDefault);
        const value = loc.getAttribute('value') ?? '0';
        rows.push({
          key: cornerLabels[idx]!,
          value: `${value} @ ${resolution}`,
          isDefault: false,
        });
      }
    } else {
      for (const key of cornerLabels) {
        rows.push({ key, value: '—', isDefault: false });
      }
    }

    const headTextPreview = (headEl: Element, maxLen = 72): string => {
      const text = headEl.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (!text) return '—';
      return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
    };

    rows.push({
      key: 'caption',
      value: captionEl ? headTextPreview(captionEl) : '—',
      isDefault: !captionEl,
    });
    rows.push({
      key: 'description',
      value: descriptionEl ? headTextPreview(descriptionEl) : '—',
      isDefault: !descriptionEl,
    });
    rows.push({
      key: 'summary',
      value: summaryEl ? headTextPreview(summaryEl) : '—',
      isDefault: !summaryEl,
    });
    rows.push({
      key: 'custom',
      value: customEl ? headTextPreview(customEl) : '—',
      isDefault: !customEl,
    });

    return rows;
  }
}

customElements.define('doclang-page-view-pane', DoclangPageViewPane);
