/** <doclang-page-nav> — page navigation (prev/next buttons + page indicator) */

import { DoclangHTMLElement } from '../base/base';
import styles from './page-nav.css?inline';
import template from './page-nav.html?raw';

export class DoclangPageNav extends DoclangHTMLElement {
  private _nav: HTMLElement;
  private _btnPrev: HTMLButtonElement;
  private _btnNext: HTMLButtonElement;
  private _input: HTMLInputElement;
  private _countSpan: HTMLSpanElement;

  constructor() {
    super(styles, template);
    this._nav = this.q('nav');
    this._btnPrev = this.q('.btn-prev');
    this._btnNext = this.q('.btn-next');
    this._input = this.q('.page-number-input');
    this._countSpan = this.q('.page-count');

    this._btnPrev.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-prev-page', { bubbles: true, composed: true })
      )
    );
    this._btnNext.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-next-page', { bubbles: true, composed: true })
      )
    );
    this._input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._commitInput();
        this._input.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this._resetInput();
        this._input.blur();
      }
    });
    this._input.addEventListener('blur', () => this._resetInput());
    this._input.addEventListener('focus', () => this._input.select());
  }

  private _currentPage = 1;
  private _pageCount = 1;

  setVisible(visible: boolean): void {
    this._nav.hidden = !visible;
  }

  setIndicator(pageNum: number, pageCount: number): void {
    this._currentPage = pageNum;
    this._pageCount = pageCount;
    this._countSpan.textContent = `\u00A0of ${pageCount}`;
    const digits = Math.max(1, String(pageCount).length);
    this._input.style.setProperty('--page-num-digits', String(digits));
    this._input.disabled = false;
    if (document.activeElement !== this._input) this._input.value = String(pageNum);
    this._btnPrev.disabled = pageNum <= 1;
    this._btnNext.disabled = pageNum >= pageCount;
  }

  reset(): void {
    this._currentPage = 1;
    this._pageCount = 1;
    this._nav.hidden = true;
    this._input.value = '1';
    this._input.disabled = true;
    this._btnPrev.disabled = true;
    this._btnNext.disabled = true;
    this._countSpan.textContent = '\u00A0of 1';
  }

  private _resetInput(): void {
    this._input.value = String(this._currentPage);
  }

  private _commitInput(): void {
    const n = Number.parseInt(this._input.value.trim(), 10);
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

customElements.define('doclang-page-nav', DoclangPageNav);
