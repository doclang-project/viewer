/** <doclang-page-view-pane> — page image with zoom and overlay settings panel */

import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import { classMap } from 'lit/directives/class-map.js';
import { DoclangPageElement } from '../base/page-element';
import { PageController } from '../base/page-controller';
import styles from './page-view-pane.css?inline';
import '../settings-panel/settings-panel';
import type { DoclangSettingsPanel } from '../settings-panel/settings-panel';
import {
  applyPageImageSize,
  buildOverlay,
  syncOverlayBadges,
  PAGE_ZOOM_DEFAULT,
  type OverlayCtx,
  type PageLayoutCache,
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

interface PagePanDrag {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

interface HeadInfo {
  key: string;
  value: string;
  isDefault: boolean;
}

const PAGE_PAN_DRAG_THRESHOLD = 5;
const NO_IMAGE = '(No page image available.)';

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

@customElement('doclang-page-view-pane')
export class DoclangPageViewPane extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  // Imperative body ref — page image + SVG overlay live here
  private _bodyRef: Ref<HTMLElement> = createRef();
  private _settingsPanelRef: Ref<DoclangSettingsPanel> = createRef();

  // --- overlay settings state ---
  private _settingsOpen = false;
  private _visible = false;
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

  private _pageController = new PageController(this, () => this.scrollPane);

  // --- viewport mechanics state ---
  private _panDrag: PagePanDrag | null = null;
  private _suppressClick = false;
  private _layoutCache: PageLayoutCache | null = null;
  private _layoutFrame = 0;
  private _resizeObserver: ResizeObserver | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-page-view');
    this.addEventListener(
      'doclang-panning-change',
      this._onPanningChange as EventListener
    );
    this.addEventListener('mousemove', this._onMousemove as EventListener);
    this.addEventListener('mouseleave', this._onMouseleave);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener(
      'doclang-panning-change',
      this._onPanningChange as EventListener
    );
    this.removeEventListener('mousemove', this._onMousemove as EventListener);
    this.removeEventListener('mouseleave', this._onMouseleave);
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  // ---------------------------------------------------------------------------
  // Render — header + settings panel (Lit); body (imperative via ref)
  // ---------------------------------------------------------------------------

  override render() {
    const layoutEnabled = this._opts.showAllBboxes;
    const readingOrderEnabled = layoutEnabled && this._opts.showReadingOrder;

    return html`
      <div class="pane-header">
        <span class="pane-header-title">Original page</span>
        <div class="pane-page-controls">
          ${
            this._visible
              ? html`
                  <div class="page-zoom-control">
                    <label class="page-zoom-control-label">
                      <span aria-hidden="true">Zoom</span>
                      <input
                        type="range"
                        class="zoom-input"
                        min="100"
                        max="300"
                        step="10"
                        .value=${String(this._zoomPct)}
                        aria-valuemin="100"
                        aria-valuemax="300"
                        aria-valuenow=${this._zoomPct}
                        aria-label="Page zoom"
                        @input=${this._onZoomInput}
                      />
                    </label>
                    <button
                      type="button"
                      class="page-zoom-reset"
                      title="Reset zoom"
                      aria-label="Reset zoom"
                      ?disabled=${this._zoomPct === PAGE_ZOOM_DEFAULT}
                      @click=${() => {
                        if (this._zoomPct !== PAGE_ZOOM_DEFAULT) this.resetZoom();
                      }}
                    >
                      ${this._zoomPct}%
                    </button>
                  </div>
                  <button
                    type="button"
                    class="pane-settings-toggle"
                    aria-expanded=${this._settingsOpen ? 'true' : 'false'}
                    @click=${() => this.toggleSettings()}
                  >
                    Overlays
                  </button>
                `
              : nothing
          }
        </div>
      </div>
      <div class="pane-page-layout">
        <div
          class="pane-body"
          id="page-pane"
          tabindex=${this._visible ? '0' : '-1'}
          ${ref(this._bodyRef)}
        ></div>
        ${this._visible
          ? html`
              <doclang-settings-panel
                ${ref(this._settingsPanelRef)}
                label="Overlays"
                @doclang-settings-close=${() => this._applySettingsOpen(false)}
              >
                <label class="settings-option settings-option-primary">
                  <input
                    type="checkbox"
                    class="cb-all-bboxes"
                    .checked=${this._opts.showAllBboxes}
                    @change=${(e: Event) =>
                      this._onOptChange(
                        'showAllBboxes',
                        (e.target as HTMLInputElement).checked
                      )}
                  />
                  <span>Layout</span>
                </label>
                <div class="settings-subgroup">
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-reading-order"
                      .checked=${this._opts.showReadingOrder}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showReadingOrder',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Reading order</span>
                  </label>
                  <div class="settings-subgroup settings-reading-order-group">
                    <label
                      class=${classMap({
                        'settings-option': true,
                        'settings-option-sub': true,
                        'settings-option-nested': true,
                        'settings-option-disabled': !readingOrderEnabled,
                      })}
                    >
                      <input
                        type="checkbox"
                        class="cb-reading-order-arrows"
                        .checked=${this._opts.readingOrderArrows}
                        ?disabled=${!readingOrderEnabled}
                        @change=${(e: Event) =>
                          this._onOptChange(
                            'readingOrderArrows',
                            (e.target as HTMLInputElement).checked
                          )}
                      />
                      <span>Arrows</span>
                    </label>
                    <label
                      class=${classMap({
                        'settings-option': true,
                        'settings-option-sub': true,
                        'settings-option-nested': true,
                        'settings-option-disabled': !readingOrderEnabled,
                      })}
                    >
                      <input
                        type="checkbox"
                        class="cb-reading-order-global"
                        .checked=${this._opts.readingOrderGlobal}
                        ?disabled=${!readingOrderEnabled}
                        @change=${(e: Event) =>
                          this._onOptChange(
                            'readingOrderGlobal',
                            (e.target as HTMLInputElement).checked
                          )}
                      />
                      <span>Global numbering</span>
                    </label>
                  </div>
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-picture-contents"
                      .checked=${this._opts.showPictureContents}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showPictureContents',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Picture contents</span>
                  </label>
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-table-contents"
                      .checked=${this._opts.showTableContents}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showTableContents',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Table contents</span>
                  </label>
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-fragment-links"
                      .checked=${this._opts.showFragmentLinks}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showFragmentLinks',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Fragments</span>
                  </label>
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-xref-links"
                      .checked=${this._opts.showXrefLinks}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showXrefLinks',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Cross-references</span>
                  </label>
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-caption-links"
                      .checked=${this._opts.showCaptionLinks}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showCaptionLinks',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Captions</span>
                  </label>
                  <label
                    class=${classMap({
                      'settings-option': true,
                      'settings-option-sub': true,
                      'settings-option-disabled': !layoutEnabled,
                    })}
                  >
                    <input
                      type="checkbox"
                      class="cb-layout-badges"
                      .checked=${this._opts.showLayoutBadges}
                      ?disabled=${!layoutEnabled}
                      @change=${(e: Event) =>
                        this._onOptChange(
                          'showLayoutBadges',
                          (e.target as HTMLInputElement).checked
                        )}
                    />
                    <span>Badges</span>
                  </label>
                </div>
              </doclang-settings-panel>
            `
          : nothing}
      </div>
      <div
        id="page-view-hint"
        popover="manual"
        role="tooltip"
        class="page-view-hint"
      ></div>
    `;
  }

  // Wire pan events on the body element once it enters the DOM
  override firstUpdated(): void {
    const body = this._bodyRef.value;
    if (body) this._wirePanEvents(body);
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

  /** The scrollable viewport pane (page-view-port div, or body if absent). */
  get scrollPane(): HTMLElement | null {
    return this._scrollPane();
  }

  // ---------------------------------------------------------------------------
  // Visibility / layout
  // ---------------------------------------------------------------------------

  setVisible(visible: boolean): void {
    this._visible = visible;
    this.hidden = !visible;
    this.requestUpdate();
  }

  /**
   * Recalculate image size and re-sync overlay badge positions.
   * Also ensures the ResizeObserver is attached (idempotent).
   */
  refreshLayout(): void {
    const body = this._bodyRef.value;
    if (!body) return;
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this.refreshLayout());
      this._resizeObserver.observe(body);
    }
    cancelAnimationFrame(this._layoutFrame);
    this._layoutFrame = requestAnimationFrame(() => {
      this._layoutFrame = 0;
      const img = body.querySelector('.page-view img') as HTMLImageElement | null;
      if (img?.naturalWidth) {
        applyPageImageSize(img, body, this._overlayCtx());
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
    this.requestUpdate();
    this._resetScroll();
  }

  resetZoom(): void {
    this._zoomPct = PAGE_ZOOM_DEFAULT;
    this._layoutCache = null;
    this.requestUpdate();
    this._resetScroll();
    this.refreshLayout();
  }

  // ---------------------------------------------------------------------------
  // Settings panel
  // ---------------------------------------------------------------------------

  toggleSettings(): void {
    this._applySettingsOpen(!this._settingsOpen);
  }

  private _applySettingsOpen(open: boolean): void {
    this._settingsOpen = open;
    this._settingsPanelRef.value?.setOpen(open);
    this.requestUpdate();
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  protected override _applySelection(): void {
    const body = this._bodyRef.value;
    if (!body) return;
    for (const el of body.querySelectorAll('.bbox.selected, .overlay-badge.selected')) {
      el.classList.remove('selected');
    }
    if (this.selected && this._docState?.hasPageView) {
      for (const el of body.querySelectorAll(
        `[data-element-id="${this.selected}"]`
      )) {
        el.classList.add('selected');
      }
    }
    const img = body.querySelector('.page-view img') as HTMLImageElement | null;
    if (img) this._syncOverlayBadgesForImg(img);
    this._applyBboxVisibility();
  }

  // ---------------------------------------------------------------------------
  // Document rendering
  // ---------------------------------------------------------------------------

  protected override _renderDocument(): void {
    const body = this._bodyRef.value;
    if (!body) {
      this.requestUpdate();
      this.updateComplete.then(() => this._renderDocument());
      return;
    }
    const state = this._docState;
    body.innerHTML = '';
    this._layoutCache = null;
    this.selected = null;
    this._peerIds = new Set();

    if (!state?.hasPageView) return;

    const imageUrl = state.pageImages.get(this.page);
    if (!imageUrl) {
      body.innerHTML = `<div class="placeholder">${NO_IMAGE}</div>`;
      return;
    }

    const port = document.createElement('div');
    port.className = 'page-view-port';
    const wrap = document.createElement('div');
    wrap.className = 'page-view';
    const img = document.createElement('img');
    img.alt = `Page ${this.page}`;

    const pageNum = this.page;
    const onImageReady = (): void => {
      if (img.dataset.layoutGeneration === String(pageNum)) return;
      img.dataset.layoutGeneration = String(pageNum);
      applyPageImageSize(img, body, this._overlayCtx());

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
    body.appendChild(port);
    img.src = imageUrl;
    if (img.complete) onImageReady();

    this.refreshLayout();
  }

  protected override _clearDocument(): void {
    const body = this._bodyRef.value;
    if (body) body.innerHTML = '';
    this._layoutCache = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers — overlay visibility
  // ---------------------------------------------------------------------------

  private _overlayCtx(): OverlayCtx {
    const body = this._bodyRef.value!;
    return {
      zoomPct: this._zoomPct,
      pane: body,
      layoutCache: this._layoutCache,
      setLayoutCache: c => {
        this._layoutCache = c;
      },
      selectedId: this.selected,
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
    const body = this._bodyRef.value;
    if (!body || !this._docState?.hasPageView) return;
    const {
      showAllBboxes,
      showLayoutBadges,
      showCaptionLinks,
      showXrefLinks,
      showFragmentLinks,
      showReadingOrder,
      readingOrderArrows,
    } = this._opts;
    const selectedId = this.selected;
    const peerIds = this._peerIds;

    for (const el of body.querySelectorAll('.bbox')) {
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

    for (const el of body.querySelectorAll('.element-badge')) {
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

    for (const el of body.querySelectorAll('.caption-link')) {
      el.classList.toggle('bbox-hidden', !showAllBboxes || !showCaptionLinks);
    }
    for (const el of body.querySelectorAll('.xref-link')) {
      el.classList.toggle('bbox-hidden', !showAllBboxes || !showXrefLinks);
    }
    for (const el of body.querySelectorAll('.fragment-link')) {
      const clickVisible = Boolean(selectedId && this._isFragmentLinkRelevant(el));
      el.classList.toggle(
        'bbox-hidden',
        !(clickVisible || (showAllBboxes && showFragmentLinks))
      );
    }
    for (const el of body.querySelectorAll('.fragment-nav')) {
      const elementId = el.getAttribute('data-element-id') ?? '';
      const clickVisible = elementId === selectedId || peerIds.has(elementId);
      el.classList.toggle(
        'bbox-hidden',
        !(clickVisible || (showAllBboxes && showFragmentLinks))
      );
    }
    for (const el of body.querySelectorAll('.reading-order-badge')) {
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
    for (const el of body.querySelectorAll('.reading-order-step')) {
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
    const body = this._bodyRef.value;
    if (!body) return null;
    return (body.querySelector('.page-view-port') as HTMLElement | null) ?? body;
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
    const body = this._bodyRef.value;
    if (body) body.classList.toggle('can-pan', this._isScrollable() && !this._panDrag);
  }

  private _onOptChange(key: keyof OverlaySettings, value: boolean): void {
    (this._opts as unknown as Record<string, boolean>)[key] = value;
    // Re-render page if global numbering changed (affects step labels)
    if (key === 'readingOrderGlobal' && this._docState) {
      this._renderDocument();
    }
    const body = this._bodyRef.value;
    const img = body?.querySelector('.page-view img') as HTMLImageElement | null;
    if (img) this._syncOverlayBadgesForImg(img);
    this._applyBboxVisibility();
    this._emitOverlayChange();
    this.requestUpdate();
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

  private _onZoomInput = (e: Event): void => {
    this._zoomPct = Math.max(
      PAGE_ZOOM_DEFAULT,
      Number((e.target as HTMLInputElement).value)
    );
    this._layoutCache = null;
    this.requestUpdate();
    this.refreshLayout();
  };

  // ---------------------------------------------------------------------------
  // Event wiring — pan (imperative, wired to the body element)
  // ---------------------------------------------------------------------------

  private _wirePanEvents(body: HTMLElement): void {
    body.addEventListener('pointerdown', (e: PointerEvent) => {
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

    body.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this._panDrag || e.pointerId !== this._panDrag.pointerId) return;
      const dx = e.clientX - this._panDrag.startX;
      const dy = e.clientY - this._panDrag.startY;
      if (!this._panDrag.moved && Math.hypot(dx, dy) >= PAGE_PAN_DRAG_THRESHOLD) {
        this._panDrag.moved = true;
        body.classList.add('is-panning');
        body.classList.remove('can-pan');
        body.setPointerCapture(e.pointerId);
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
      body.classList.remove('is-panning');
      if (wasPanning)
        this.dispatchEvent(
          new CustomEvent('doclang-panning-change', {
            bubbles: true,
            composed: true,
            detail: { panning: false },
          })
        );
      if (body.hasPointerCapture(e.pointerId)) body.releasePointerCapture(e.pointerId);
      this._updatePanCursor();
    };

    body.addEventListener('pointerup', (e: PointerEvent) => endPan(e));
    body.addEventListener('pointercancel', (e: PointerEvent) => endPan(e));

    // Navigation
    body.setAttribute('role', 'region');
    body.setAttribute('aria-label', 'Original page');
    body.addEventListener('pointerdown', () => {
      if (this._docState?.hasPageView) body.focus({ preventScroll: true });
    });
  }

  // ---------------------------------------------------------------------------
  // Hints
  // ---------------------------------------------------------------------------

  private _onPanningChange = (e: CustomEvent<{ panning: boolean }>): void => {
    if (e.detail.panning) this._hideHint();
  };

  private _onMousemove = (e: MouseEvent): void => {
    if (this._panDrag?.moved) {
      this._hideHint();
      return;
    }
    const innerTarget = (e.composedPath()[0] ?? e.target) as Element;
    const badge = innerTarget.closest('.element-badge[data-element-id]');
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
    this._showHint(
      this._elementHeadTooltipHtml(xmlEl, this._docState.defaultResolution),
      e
    );
  };

  private _onMouseleave = (): void => this._hideHint();

  private _showHint(html: string, e: MouseEvent): void {
    const el = this.shadowRoot?.querySelector<HTMLElement>('.page-view-hint') ?? null;
    if (!el) return;
    el.innerHTML = html;
    el.style.top = `${e.clientY + 14}px`;
    el.style.left = `${e.clientX + 14}px`;
    if (!el.matches(':popover-open')) el.showPopover();
  }

  private _hideHint(): void {
    const el = this.shadowRoot?.querySelector<HTMLElement>('.page-view-hint') ?? null;
    if (el?.matches(':popover-open')) el.hidePopover();
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
