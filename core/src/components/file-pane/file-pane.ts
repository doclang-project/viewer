/** <doclang-file-pane> — file list sidebar */

import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import styles from './file-pane.css?inline';

const FILE_THUMB_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

export interface FileEntry {
  label: string;
  thumbnailUrl: string | null;
  isActive: boolean;
}

@customElement('doclang-file-pane')
export class DoclangFilePane extends LitElement {
  static override styles = unsafeCSS(styles);

  private _entries: FileEntry[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-file');
  }

  override render() {
    const hasEntries = this._entries.length > 0;
    const closeAllBtn = hasEntries
      ? html`<button
          type="button"
          class="file-pane-close-all"
          aria-label="Clear all open files"
          @click=${this._onCloseAll}
        >
          Clear
        </button>`
      : nothing;
    const list = hasEntries
      ? html`
          <ul class="file-view-list" role="listbox" aria-label="Open files">
            ${repeat(this._entries, (_, i) => i, this._renderEntry)}
          </ul>
        `
      : nothing;
    return html`
      <div class="pane-header">
        <span class="pane-header-title">Files</span>
        ${closeAllBtn}
      </div>
      <div class="pane-body">${list}</div>
    `;
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  setLastPane(isLast: boolean): void {
    this.classList.toggle('pane-layout-last', isLast);
  }

  renderFiles(entries: FileEntry[]): void {
    this._entries = entries;
    this.requestUpdate();
  }

  private _onCloseAll = (): void => {
    this.dispatchEvent(
      new CustomEvent('doclang-file-pane-close-all', { bubbles: true, composed: true })
    );
  };

  private _renderEntry = (entry: FileEntry, index: number) => {
    const onCardClick = (e: Event): void => {
      if ((e.target as Element).closest('.file-view-close')) return;
      this._emitFileSelect(index);
    };
    const onCardKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._emitFileSelect(index);
      }
    };
    const onCloseClick = (e: Event): void => {
      e.stopPropagation();
      this._emitFileClose(index);
    };
    const thumb = entry.thumbnailUrl
      ? html`<img src=${entry.thumbnailUrl} alt="" />`
      : html`<span
          class="file-view-thumb-placeholder"
          .innerHTML=${FILE_THUMB_PLACEHOLDER_SVG}
        ></span>`;
    return html`
      <li>
        <div
          class="file-view-item${entry.isActive ? ' is-active' : ''}"
          title=${entry.label}
          tabindex="0"
          role="option"
          aria-selected=${entry.isActive ? 'true' : 'false'}
          @click=${onCardClick}
          @keydown=${onCardKeydown}
        >
          <div class="file-view-thumb-wrap">
            <span class="file-view-thumb" aria-hidden="true">${thumb}</span>
            <button
              type="button"
              class="file-view-close"
              aria-label="Close ${entry.label}"
              @click=${onCloseClick}
            >
              ×
            </button>
          </div>
          <span class="file-view-label">${entry.label}</span>
        </div>
      </li>
    `;
  };

  private _emitFileSelect(index: number): void {
    this.dispatchEvent(
      new CustomEvent('doclang-file-select', {
        bubbles: true,
        composed: true,
        detail: { index },
      })
    );
  }

  private _emitFileClose(index: number): void {
    this.dispatchEvent(
      new CustomEvent('doclang-file-close', {
        bubbles: true,
        composed: true,
        detail: { index },
      })
    );
  }
}
