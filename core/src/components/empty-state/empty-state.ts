/** <doclang-empty-state> — loading/prompt empty state */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import styles from './empty-state.css?inline';

@customElement('doclang-empty-state')
export class DoclangEmptyState extends LitElement {
  static override styles = unsafeCSS(styles);

  private _extensions: string[] = [];
  private _demoLoading = false;

  override render() {
    return html`
      <div class="empty-state">
        <div class="empty-state-inner">
          <div
            class="empty-state-loading"
            role="status"
            aria-live="polite"
            aria-label="Loading demo document"
          >
            <div class="loading-spinner" aria-hidden="true"></div>
            <p class="empty-state-title">Loading demo&#x2026;</p>
            <p class="empty-state-meta">Preparing the sample document</p>
          </div>
          <div class="empty-state-prompt">
            <p class="empty-state-title">Drop a DocLang file here</p>
            <p class="empty-state-meta">
              Supported file types:
              <span class="file-types"
                >${this._extensions.map(
                  (ext, i) => html`${i > 0 ? ', ' : ''}<code>${ext}</code>`
                )}</span
              >
            </p>
            <p class="empty-state-action">
              or
              <a
                href="#"
                class="text-link"
                @click=${(e: Event) => {
                  e.preventDefault();
                  this.dispatchEvent(
                    new CustomEvent('doclang-load-demo', {
                      bubbles: true,
                      composed: true,
                    })
                  );
                }}
                >load demo</a
              >
            </p>
          </div>
        </div>
      </div>
    `;
  }

  setFileTypeHints(extensions: string[]): void {
    this._extensions = extensions;
    this.requestUpdate();
  }

  setDemoLoading(loading: boolean): void {
    this._demoLoading = loading;
    this.classList.toggle('demo-loading', loading);
  }
}
