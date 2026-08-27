/** <doclang-page-nav> — page navigation (prev/next buttons + page indicator) */

import { html, PropertyValues } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import styles from './page-nav.css?inline';
import { DoclangPageElement } from '../base/page-element';

@customElement('doclang-page-nav')
export class DoclangPageNav extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  private _inputRef: Ref<HTMLInputElement> = createRef();

  private get _pageCount(): number {
    return this._docState?.pageCount ?? 1;
  }

  override render() {
    const digits = Math.max(1, String(this._pageCount).length);
    return html`
      <nav id="page-nav" aria-label="Page navigation">
        <div class="page-nav-btns">
          <button
            type="button"
            class="page-nav-btn btn-prev"
            aria-label="Previous page"
            title="Previous page"
            ?disabled=${this.page <= 1}
            @click=${this._onPrev}
          >
            <svg
              class="page-nav-chevron"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path
                d="M10.5 3.5 5.5 8l5 4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </button>
          <button
            type="button"
            class="page-nav-btn btn-next"
            aria-label="Next page"
            title="Next page"
            ?disabled=${this.page >= this._pageCount}
            @click=${this._onNext}
          >
            <svg
              class="page-nav-chevron"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path
                d="M5.5 3.5 10.5 8l-5 4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </button>
        </div>
        <div class="page-indicator">
          <span>Page&#xA0;</span>
          <input
            ${ref(this._inputRef)}
            type="text"
            inputmode="numeric"
            class="page-number-input"
            .value=${String(this.page)}
            style="--doclang-page-num-digits:${digits}"
            aria-label="Page number"
            @keydown=${this._onInputKeydown}
            @blur=${this._onInputBlur}
            @focus=${(e: FocusEvent) => (e.target as HTMLInputElement).select()}
          />
          <span class="page-count">&#xA0;of ${this._pageCount}</span>
        </div>
      </nav>
    `;
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    // Keep the text input in sync whenever the page property changes from
    // outside (e.g. a `.page=${n}` binding on the parent template).
    if (changed.has('page')) {
      this._resetInput();
    }
  }

  protected override _renderDocument(): void { /* _docState is @state; re-render is automatic */ }
  protected override _clearDocument(): void { /* _docState is @state; re-render is automatic */ }

  // ---------------------------------------------------------------------------
  // Private event handlers
  // ---------------------------------------------------------------------------

  private _onPrev = (): void => this._emitViewPage(this.page - 1);
  private _onNext = (): void => this._emitViewPage(this.page + 1);

  private _onInputKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._commitInput();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._resetInput();
      (e.target as HTMLInputElement).blur();
    }
  };

  private _onInputBlur = (): void => this._resetInput();

  private _resetInput(): void {
    const input = this._inputRef.value;
    if (input) input.value = String(this.page);
  }

  private _commitInput(): void {
    const input = this._inputRef.value;
    if (!input) return;
    const n = Number.parseInt(input.value.trim(), 10);
    if (!Number.isFinite(n)) {
      this._resetInput();
      return;
    }
    this._emitViewPage(Math.min(Math.max(1, n), this._docState?.pageCount ?? 1));
  }

  private _emitViewPage(page: number): void {
    this.dispatchEvent(
      new CustomEvent('view-page', {
        bubbles: true,
        composed: true,
        detail: { page },
      })
    );
  }
}
