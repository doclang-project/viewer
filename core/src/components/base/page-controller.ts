/**
 * PageController — Lit reactive controller that adds page-flip behaviour to a
 * pane element via both mouse-wheel and keyboard input.
 *
 * Wheel handling: accumulates pixel-delta events and emits 'view-page' once the
 * configured threshold is exceeded, respecting scroll-boundary and cooldown.
 *
 * Keyboard handling: Arrow / Page keys fire 'view-page' when the pane or any
 * descendant has focus.
 */

import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { DoclangPageElement } from './page-element';

const COOLDOWN_MS = 200;
const PIXEL_THRESHOLD = 4;
const GESTURE_MS = 100;

export class PageController implements ReactiveController {
  private readonly _host: DoclangPageElement;
  private readonly _getScrollPane: () => HTMLElement | null;

  // Per-gesture pixel accumulator
  private _pixelAccum = 0;
  private _gestureUntil = 0;

  // Per-pane cooldown; the viewer deduplicates via page-clamping.
  private _lastFlipAt = 0;

  constructor(
    host: DoclangPageElement,
    getScrollPane: () => HTMLElement | null,
  ) {
    this._host = host;
    this._getScrollPane = getScrollPane;
    host.addController(this);
  }

  hostConnected(): void {
    this._host.addEventListener('wheel', this._onWheel, { passive: false });
    this._host.addEventListener('keydown', this._onKeyDown);
  }

  hostDisconnected(): void {
    this._host.removeEventListener('wheel', this._onWheel);
    this._host.removeEventListener('keydown', this._onKeyDown);
  }

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------

  private _onKeyDown = (ev: Event): void => {
    const e = ev as KeyboardEvent;
    const host = this._host;
    const docState = host.document;
    if (!docState || docState.markupOnly || docState.pageCount <= 1) return;

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
    if (!dir) return;

    e.preventDefault();
    const targetPage = host.page + dir;
    if (targetPage < 1 || targetPage > docState.pageCount) return;

    host.dispatchEvent(
      new CustomEvent('view-page', {
        bubbles: true,
        composed: true,
        detail: { page: targetPage },
      }),
    );
  };

  // ---------------------------------------------------------------------------
  // Wheel navigation
  // ---------------------------------------------------------------------------

  private _dir(e: WheelEvent): number {
    if (e.deltaMode === 1 /* DOM_DELTA_LINE */) return e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (e.deltaMode === 2 /* DOM_DELTA_PAGE */) return Math.sign(e.deltaY);
    // DOM_DELTA_PIXEL — accumulate until threshold to avoid firing on every px
    const now = performance.now();
    if (now > this._gestureUntil) this._pixelAccum = 0;
    this._gestureUntil = now + GESTURE_MS;
    this._pixelAccum += e.deltaY;
    if (Math.abs(this._pixelAccum) >= PIXEL_THRESHOLD) {
      const dir = this._pixelAccum > 0 ? 1 : -1;
      this._pixelAccum = 0;
      return dir;
    }
    return 0;
  }

  private _onWheel = (ev: Event): void => {
    const e = ev as WheelEvent;
    const host = this._host;
    const docState = host.document;

    // Only act when multiple pages exist
    if (!docState || docState.markupOnly || docState.pageCount <= 1) return;

    const scrollPane = this._getScrollPane();
    const dir = this._dir(e);
    if (!dir) return;

    if (scrollPane) {
      // Scrollable container: only flip when the scroll boundary is reached
      const atTop = scrollPane.scrollTop <= 0;
      const atBottom =
        scrollPane.scrollTop + scrollPane.clientHeight >= scrollPane.scrollHeight - 1;
      const scrollable =
        scrollPane.scrollHeight > scrollPane.clientHeight ||
        scrollPane.scrollWidth > scrollPane.clientWidth;

      if (scrollable && !(dir < 0 && atTop) && !(dir > 0 && atBottom)) return;
    }

    // Cooldown check
    const now = performance.now();
    if (now - this._lastFlipAt < COOLDOWN_MS) {
      e.preventDefault();
      return;
    }

    const targetPage = host.page + dir;
    // Clamp check: don't emit if already at boundary
    if (targetPage < 1 || targetPage > docState.pageCount) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    this._lastFlipAt = now;

    // Reset scroll position to the new boundary after the flip
    if (scrollPane) {
      requestAnimationFrame(() => {
        scrollPane.scrollTop = dir > 0 ? 0 : scrollPane.scrollHeight;
      });
    }

    host.dispatchEvent(
      new CustomEvent('view-page', {
        bubbles: true,
        composed: true,
        detail: { page: targetPage },
      }),
    );
  };
}
