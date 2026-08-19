/** <doclang-cursor-hint> — floating tooltip that follows the pointer */

import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeCSS } from 'lit';
import styles from './cursor-hint.css?inline';

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

@customElement('doclang-cursor-hint')
export class DoclangCursorHint extends LitElement {
  static override styles = unsafeCSS(styles);

  private _content: string | Node | null = null;
  private _isHtml = false;
  private _detail = false;
  private _hidden = true;
  private _left = 0;
  private _top = 0;

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

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('doclang-hint', this._onHint);
    document.addEventListener('doclang-hint-hide', this._onHide);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('doclang-hint', this._onHint);
    document.removeEventListener('doclang-hint-hide', this._onHide);
  }

  hide(): void {
    this._content = null;
    this._isHtml = false;
    this._detail = false;
    this._hidden = true;
    this.requestUpdate();
  }

  show(content: string | Node, clientX: number, clientY: number, detail = false): void {
    this._content = content;
    this._isHtml = false;
    this._detail = detail;
    this._hidden = false;
    this._position(clientX, clientY);
    this.requestUpdate();
  }

  showHtml(html: string, clientX: number, clientY: number): void {
    this._content = html;
    this._isHtml = true;
    this._detail = true;
    this._hidden = false;
    this._position(clientX, clientY);
    this.requestUpdate();
  }

  override render() {
    if (this._hidden || this._content === null) return nothing;
    const classes = { 'cursor-hint': true, 'cursor-hint-detail': this._detail };
    const style = `left:${this._left}px;top:${this._top}px`;
    if (this._isHtml && typeof this._content === 'string') {
      return html`<div class=${classMap(classes)} role="tooltip" style=${style}>
        ${unsafeHTML(this._content)}
      </div>`;
    }
    if (typeof this._content === 'string') {
      return html`<div class=${classMap(classes)} role="tooltip" style=${style}>
        ${this._content}
      </div>`;
    }
    return html`<div class=${classMap(classes)} role="tooltip" style=${style}></div>`;
  }

  override updated() {
    // For Node content we need to append it imperatively after render
    if (!this._hidden && this._content instanceof Node) {
      const hint = this.shadowRoot?.querySelector('.cursor-hint');
      if (hint) {
        hint.replaceChildren(this._content.cloneNode(true));
        const rect = hint.getBoundingClientRect();
        this._repositionFromRect(rect);
      }
    }
  }

  private _position(clientX: number, clientY: number): void {
    this._left = Math.max(MARGIN, clientX + OFFSET);
    this._top = Math.max(MARGIN, clientY + OFFSET);
  }

  private _repositionFromRect(rect: DOMRect): void {
    const hint = this.shadowRoot?.querySelector<HTMLElement>('.cursor-hint');
    if (!hint) return;
    if (this._left + rect.width > window.innerWidth - MARGIN)
      this._left = Math.max(MARGIN, this._left - rect.width - 2 * OFFSET);
    if (this._top + rect.height > window.innerHeight - MARGIN)
      this._top = Math.max(MARGIN, this._top - rect.height - 2 * OFFSET);
    hint.style.left = `${this._left}px`;
    hint.style.top = `${this._top}px`;
  }
}
