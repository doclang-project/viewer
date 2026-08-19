/** <doclang-empty-state> — loading/prompt empty state */

import { DoclangHTMLElement } from '../base/element';
import styles from './empty-state.css?inline';
import template from './empty-state.html?raw';

export class DoclangEmptyState extends DoclangHTMLElement {
  private _fileTypesSpan: HTMLSpanElement;

  constructor() {
    super(styles, template);
    this._fileTypesSpan = this.q('.file-types');
    this.q('.text-link').addEventListener('click', (e: Event) => {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent('doclang-load-demo', { bubbles: true, composed: true })
      );
    });
  }

  setFileTypeHints(extensions: string[]): void {
    this._fileTypesSpan.innerHTML = extensions
      .map(ext => `<code>${ext}</code>`)
      .join(', ');
  }

  setDemoLoading(loading: boolean): void {
    this.classList.toggle('demo-loading', loading);
  }
}

customElements.define('doclang-empty-state', DoclangEmptyState);
