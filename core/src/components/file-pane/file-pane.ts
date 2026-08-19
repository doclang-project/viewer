/** <doclang-file-pane> — file list sidebar */

import { DoclangHTMLElement } from '../base/element';
const FILE_THUMB_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
import styles from './file-pane.css?inline';
import template from './file-pane.html?raw';

export interface FileEntry {
  label: string;
  thumbnailUrl: string | null;
  isActive: boolean;
}

export class DoclangFilePane extends DoclangHTMLElement {
  private _closeAllBtn: HTMLButtonElement;
  private _body: HTMLElement;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-file');
    this._closeAllBtn = this.q('.file-pane-close-all');
    this._body = this.q('.pane-body');

    this._closeAllBtn.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-file-pane-close-all', {
          bubbles: true,
          composed: true,
        })
      )
    );
  }

  get body(): HTMLElement {
    return this._body;
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  setLastPane(isLast: boolean): void {
    this.classList.toggle('pane-layout-last', isLast);
  }

  renderFiles(entries: FileEntry[]): void {
    this._body.replaceChildren();
    this._closeAllBtn.hidden = entries.length === 0;
    if (!entries.length) return;

    const list = document.createElement('ul');
    list.className = 'file-view-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Open files');

    entries.forEach((entry, index) => {
      const item = document.createElement('li');
      const card = document.createElement('div');
      card.className = 'file-view-item';
      if (entry.isActive) {
        card.classList.add('is-active');
        card.setAttribute('aria-selected', 'true');
      } else card.setAttribute('aria-selected', 'false');
      card.title = entry.label;
      card.tabIndex = 0;
      card.setAttribute('role', 'option');

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'file-view-thumb-wrap';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'file-view-close';
      closeBtn.setAttribute('aria-label', `Close ${entry.label}`);
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.dispatchEvent(
          new CustomEvent('doclang-file-close', {
            bubbles: true,
            composed: true,
            detail: { index },
          })
        );
      });

      const thumb = document.createElement('span');
      thumb.className = 'file-view-thumb';
      thumb.setAttribute('aria-hidden', 'true');
      if (entry.thumbnailUrl) {
        const img = document.createElement('img');
        img.src = entry.thumbnailUrl;
        img.alt = '';
        thumb.appendChild(img);
      } else {
        const ph = document.createElement('span');
        ph.className = 'file-view-thumb-placeholder';
        ph.innerHTML = FILE_THUMB_PLACEHOLDER_SVG;
        thumb.appendChild(ph);
      }

      thumbWrap.append(thumb, closeBtn);
      const label = document.createElement('span');
      label.className = 'file-view-label';
      label.textContent = entry.label;
      card.append(thumbWrap, label);

      card.addEventListener('click', (e: Event) => {
        if ((e.target as Element).closest('.file-view-close')) return;
        this.dispatchEvent(
          new CustomEvent('doclang-file-select', {
            bubbles: true,
            composed: true,
            detail: { index },
          })
        );
      });
      card.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.dispatchEvent(
            new CustomEvent('doclang-file-select', {
              bubbles: true,
              composed: true,
              detail: { index },
            })
          );
        }
      });

      item.appendChild(card);
      list.appendChild(item);
    });

    this._body.appendChild(list);
  }
}

customElements.define('doclang-file-pane', DoclangFilePane);
