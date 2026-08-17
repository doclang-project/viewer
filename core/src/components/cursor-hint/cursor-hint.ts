/** <doclang-cursor-hint> — floating tooltip that follows the pointer */

import { DoclangHTMLElement } from '../base/base';
import styles from './cursor-hint.css?inline';
import template from './cursor-hint.html?raw';

const OFFSET = 10;
const MARGIN = 8;

export class DoclangCursorHint extends DoclangHTMLElement {
  private _hint: HTMLElement;

  constructor() {
    super(styles, template);
    this._hint = this.q('.cursor-hint');
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
