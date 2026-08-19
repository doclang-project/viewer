/** <doclang-cursor-hint> — floating tooltip that follows the pointer */

import { DoclangHTMLElement } from '../base/element';
import styles from './cursor-hint.css?inline';
import template from './cursor-hint.html?raw';

const OFFSET = 10;
const MARGIN = 8;

/** Detail shape for the `doclang-hint` custom event. */
export interface DoclangHintDetail {
  /** Raw HTML to set via innerHTML (shown as detail-size tooltip). */
  html?: string;
  /** Plain-text content (shown as normal-size tooltip). */
  text?: string;
  clientX: number;
  clientY: number;
}

export class DoclangCursorHint extends DoclangHTMLElement {
  private _hint: HTMLElement;
  private _onHint = (e: Event): void => {
    const { html, text, clientX, clientY } = (e as CustomEvent<DoclangHintDetail>)
      .detail;
    if (html !== undefined) {
      this.showHtml(html, clientX, clientY);
    } else if (text !== undefined) {
      this.show(text, clientX, clientY);
    }
  };
  private _onHide = (): void => this.hide();

  constructor() {
    super(styles, template);
    this._hint = this.q('.cursor-hint');
  }

  connectedCallback(): void {
    document.addEventListener('doclang-hint', this._onHint);
    document.addEventListener('doclang-hint-hide', this._onHide);
  }

  disconnectedCallback(): void {
    document.removeEventListener('doclang-hint', this._onHint);
    document.removeEventListener('doclang-hint-hide', this._onHide);
  }

  hide(): void {
    this._hint.hidden = true;
    this._hint.classList.remove('cursor-hint-detail');
    this._hint.replaceChildren();
  }

  show(content: string | Node, clientX: number, clientY: number, detail = false): void {
    this._hint.replaceChildren();
    if (typeof content === 'string') this._hint.textContent = content;
    else this._hint.appendChild(content);
    this._hint.classList.toggle('cursor-hint-detail', detail);
    this._hint.hidden = false;
    this._position(clientX, clientY);
  }

  showHtml(html: string, clientX: number, clientY: number): void {
    this._hint.innerHTML = html;
    this._hint.classList.add('cursor-hint-detail');
    this._hint.hidden = false;
    this._position(clientX, clientY);
  }

  private _position(clientX: number, clientY: number): void {
    let left = clientX + OFFSET;
    let top = clientY + OFFSET;
    const rect = this._hint.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - MARGIN)
      left = clientX - rect.width - OFFSET;
    if (top + rect.height > window.innerHeight - MARGIN)
      top = clientY - rect.height - OFFSET;
    this._hint.style.left = `${Math.max(MARGIN, left)}px`;
    this._hint.style.top = `${Math.max(MARGIN, top)}px`;
  }
}

customElements.define('doclang-cursor-hint', DoclangCursorHint);
