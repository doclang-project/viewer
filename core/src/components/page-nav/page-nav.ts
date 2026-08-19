/** <doclang-page-nav> — page navigation (prev/next buttons + page indicator) */

import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import styles from './page-nav.css?inline';

@customElement('doclang-page-nav')
export class DoclangPageNav extends LitElement {
  static override styles = unsafeCSS(styles);

  private _currentPage = 1;
  private _pageCount = 1;
  private _visible = false;
  private _inputRef: Ref<HTMLInputElement> = createRef();

  override render() {
    if (!this._visible) return nothing;
    const digits = Math.max(1, String(this._pageCount).length);
    return html`
      <nav id="page-nav" aria-label="Page navigation">
        <div class="page-nav-btns">
          <button
            type="button"
            class="page-nav-btn btn-prev"
            aria-label="Previous page"
            title="Previous page"
            ?disabled=${this._currentPage <= 1}
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('doclang-prev-page', { bubbles: true, composed: true })
              )}
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
            ?disabled=${this._currentPage >= this._pageCount}
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent('doclang-next-page', { bubbles: true, composed: true })
              )}
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
            .value=${String(this._currentPage)}
            style="--page-num-digits:${digits}"
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

  setVisible(visible: boolean): void {
    this._visible = visible;
    this.requestUpdate();
  }

  setIndicator(pageNum: number, pageCount: number): void {
    this._currentPage = pageNum;
    this._pageCount = pageCount;
    this.requestUpdate();
  }

  reset(): void {
    this._currentPage = 1;
    this._pageCount = 1;
    this._visible = false;
    this.requestUpdate();
  }

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
    if (input) input.value = String(this._currentPage);
  }

  private _commitInput(): void {
    const input = this._inputRef.value;
    if (!input) return;
    const n = Number.parseInt(input.value.trim(), 10);
    if (!Number.isFinite(n)) {
      this._resetInput();
      return;
    }
    const page = Math.min(Math.max(1, n), this._pageCount);
    this.dispatchEvent(
      new CustomEvent('doclang-go-to-page', {
        bubbles: true,
        composed: true,
        detail: { page },
      })
    );
  }
}
