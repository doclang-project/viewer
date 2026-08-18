/** <doclang-reading-pane> — reading/rendered view with layers settings panel */

import { DoclangPageElement } from '../base/document-base';
import styles from './reading-pane.css?inline';
import template from './reading-pane.html?raw';
import { segmentHasMarkup, assignElementIds } from '../../doclang/document';
import { buildRenderedView, applyReadingLayerClasses } from './rendered';
import { elementThreadId } from '../../doclang/dom';
import { NO_MARKUP } from '../../constants';

export class DoclangReadingPane extends DoclangPageElement {
  private _body: HTMLElement;
  private _settingsToggle: HTMLButtonElement;
  private _settingsLayer: HTMLElement;
  private _settingsScrim: HTMLButtonElement;
  private _settingsClose: HTMLButtonElement;
  private _showFurniture: HTMLInputElement;
  private _showFurnitureLabel: HTMLLabelElement;
  private _showBackground: HTMLInputElement;
  private _showBackgroundLabel: HTMLLabelElement;

  // Reading layer state — owned here, synced from checkbox events
  private _showFurnitureState = true;
  private _showBackgroundState = true;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-reading');
    this._body = this.q('.pane-body');
    this._settingsToggle = this.q('.pane-settings-toggle');
    this._settingsLayer = this.q('.viewer-settings-layer');
    this._settingsScrim = this.q('.viewer-settings-scrim');
    this._settingsClose = this.q('.viewer-settings-close');
    this._showFurnitureLabel = this.q('label:has(.cb-furniture)');
    this._showFurniture = this.q('.cb-furniture');
    this._showBackgroundLabel = this.q('label:has(.cb-background)');
    this._showBackground = this.q('.cb-background');

    this._wireEvents();
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
    this._settingsToggle.hidden = this.hidden;
  }

  setSettingsOpen(open: boolean): void {
    this._settingsLayer.hidden = !open;
    this._settingsToggle.setAttribute('aria-expanded', String(open));
  }

  protected override _applySelection(): void {
    for (const el of this._body.querySelectorAll('.rendered-el.selected')) {
      el.classList.remove('selected');
    }
    if (!this._selectedId) return;
    const renderedEl = this._findRenderedElement(this._selectedId, this._peerIds);
    if (!renderedEl) return;
    this._revealContext(renderedEl);
    renderedEl.classList.add('selected');
    renderedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // Document rendering
  // ---------------------------------------------------------------------------

  protected override _renderDocument(): void {
    const state = this._docState;
    this._body.innerHTML = '';
    if (!state) return;

    const segment = state.segments[this._currentPage - 1] ?? [];
    // elementIds may already have been assigned by markup-pane; re-use if available
    const elementIds = state.elementIds.size
      ? state.elementIds
      : assignElementIds(segment);
    state.elementIds = elementIds;

    if (segmentHasMarkup(segment)) {
      this._body.appendChild(
        buildRenderedView(
          segment,
          elementIds,
          this._showFurnitureState,
          this._showBackgroundState,
          id =>
            this.dispatchEvent(
              new CustomEvent('doclang-element-select', {
                bubbles: true,
                composed: true,
                detail: { id },
              })
            ),
          this._docState?.assetUrls
        )
      );
    } else {
      this._body.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    }
  }

  protected override _clearDocument(): void {
    this._body.innerHTML = '';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _findRenderedElement(
    elementId: string,
    peerIds: Set<string>
  ): Element | null {
    const direct =
      this._body.querySelector(
        `.rendered-el-virtual-text[data-element-id="${elementId}"]`
      ) ?? this._body.querySelector(`.rendered-el[data-element-id="${elementId}"]`);
    if (direct) return direct;

    const xmlEl = this._docState?.idToElement?.get(elementId);
    const threadId = xmlEl ? elementThreadId(xmlEl) : null;
    if (!threadId) return null;
    const merged = this._body.querySelector(
      `.rendered-fragment-merged[data-thread-id="${threadId}"]`
    );
    if (!merged) return null;
    const primaryId = merged.getAttribute('data-element-id');
    if (!primaryId || primaryId === elementId) return merged;
    return peerIds.has(elementId) ? merged : null;
  }

  private _revealContext(renderedEl: Element): void {
    const pictureContents = renderedEl.closest(
      '.rendered-picture-contents'
    ) as HTMLDetailsElement | null;
    if (pictureContents && !pictureContents.open) pictureContents.open = true;
    this._revealLayer(renderedEl);
  }

  private _revealLayer(renderedEl: Element): void {
    const layer = renderedEl.getAttribute('data-doclang-layer');
    if (!layer || layer === 'body') return;
    if (layer === 'furniture' && !this._showFurnitureState) {
      this._showFurnitureState = true;
      this._showFurniture.checked = true;
      this._applyLayerClasses();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-furniture', {
          bubbles: true,
          composed: true,
          detail: { checked: true },
        })
      );
    } else if (layer === 'background' && !this._showBackgroundState) {
      this._showBackgroundState = true;
      this._showBackground.checked = true;
      this._applyLayerClasses();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-background', {
          bubbles: true,
          composed: true,
          detail: { checked: true },
        })
      );
    }
  }

  private _applyLayerClasses(): void {
    const root = this._body.querySelector('.rendered-doc') as HTMLElement | null;
    if (root)
      applyReadingLayerClasses(
        root,
        this._showFurnitureState,
        this._showBackgroundState
      );
  }

  private _wireEvents(): void {
    this._settingsToggle.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reading-settings-toggle', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._settingsClose.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reading-settings-close', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._settingsScrim.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reading-settings-close', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._showFurniture.addEventListener('change', () => {
      this._showFurnitureState = this._showFurniture.checked;
      this._applyLayerClasses();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-furniture', {
          bubbles: true,
          composed: true,
          detail: { checked: this._showFurniture.checked },
        })
      );
    });
    this._showBackground.addEventListener('change', () => {
      this._showBackgroundState = this._showBackground.checked;
      this._applyLayerClasses();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-background', {
          bubbles: true,
          composed: true,
          detail: { checked: this._showBackground.checked },
        })
      );
    });
  }
}

customElements.define('doclang-reading-pane', DoclangReadingPane);
