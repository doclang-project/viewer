/** <doclang-reading-pane> — reading/rendered view with layers settings panel */

import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import { DoclangPageElement } from '../base/page-element';
import styles from './reading-pane.css?inline';
import { segmentHasMarkup, assignElementIds, NO_MARKUP } from '../../doclang/document';
import { buildRenderedView, applyReadingLayerClasses } from './rendered';
import { elementThreadId } from '../../doclang/dom';

@customElement('doclang-reading-pane')
export class DoclangReadingPane extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  private _bodyRef: Ref<HTMLElement> = createRef();

  // Reading layer state — owned here, synced from checkbox events
  private _showFurnitureState = true;
  private _showBackgroundState = true;
  private _settingsOpen = false;
  private _visible = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-reading');
  }

  override render() {
    return html`
      <div class="pane-header">
        <span class="pane-header-title">Reading view</span>
        ${
          this._visible
            ? html`<button
                type="button"
                class="pane-settings-toggle"
                aria-expanded=${this._settingsOpen ? 'true' : 'false'}
                aria-controls="reading-settings"
                @click=${() =>
                  this.dispatchEvent(
                    new CustomEvent('doclang-reading-settings-toggle', {
                      bubbles: true,
                      composed: true,
                    })
                  )}
              >
                Layers
              </button>`
            : nothing
        }
      </div>
      <div class="pane-reading-layout">
        <div class="pane-body" id="rendered-pane" ${ref(this._bodyRef)}></div>
        ${
          this._settingsOpen
            ? html`
                <div class="viewer-settings-layer">
                  <button
                    type="button"
                    class="viewer-settings-scrim"
                    tabindex="-1"
                    aria-label="Close layers"
                    @click=${() =>
                      this.dispatchEvent(
                        new CustomEvent('doclang-reading-settings-close', {
                          bubbles: true,
                          composed: true,
                        })
                      )}
                  ></button>
                  <aside
                    class="viewer-settings"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reading-settings-title"
                  >
                    <div class="viewer-settings-header">
                      <h2 class="viewer-settings-title" id="reading-settings-title">
                        Layers
                      </h2>
                      <button
                        type="button"
                        class="viewer-settings-close"
                        aria-label="Close layers"
                        @click=${() =>
                          this.dispatchEvent(
                            new CustomEvent('doclang-reading-settings-close', {
                              bubbles: true,
                              composed: true,
                            })
                          )}
                      >
                        ×
                      </button>
                    </div>
                    <div class="viewer-settings-body">
                      <div
                        class="settings-subgroup"
                        role="group"
                        aria-labelledby="reading-settings-title"
                      >
                        <label class="settings-option settings-option-sub">
                          <input
                            type="checkbox"
                            class="cb-furniture"
                            .checked=${this._showFurnitureState}
                            @change=${(e: Event) => {
                              this._showFurnitureState = (
                                e.target as HTMLInputElement
                              ).checked;
                              this._applyLayerClasses();
                              this.dispatchEvent(
                                new CustomEvent('doclang-show-reading-furniture', {
                                  bubbles: true,
                                  composed: true,
                                  detail: { checked: this._showFurnitureState },
                                })
                              );
                            }}
                          />
                          <span>Furniture</span>
                        </label>
                        <label class="settings-option settings-option-sub">
                          <input
                            type="checkbox"
                            class="cb-background"
                            .checked=${this._showBackgroundState}
                            @change=${(e: Event) => {
                              this._showBackgroundState = (
                                e.target as HTMLInputElement
                              ).checked;
                              this._applyLayerClasses();
                              this.dispatchEvent(
                                new CustomEvent('doclang-show-reading-background', {
                                  bubbles: true,
                                  composed: true,
                                  detail: { checked: this._showBackgroundState },
                                })
                              );
                            }}
                          />
                          <span>Background</span>
                        </label>
                      </div>
                    </div>
                  </aside>
                </div>
              `
            : nothing
        }
      </div>
    `;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
    this.hidden = !visible;
    this.requestUpdate();
  }

  setSettingsOpen(open: boolean): void {
    this._settingsOpen = open;
    this.requestUpdate();
  }

  protected override _applySelection(): void {
    const body = this._bodyRef.value;
    if (!body) return;
    for (const el of body.querySelectorAll('.rendered-el.selected')) {
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
    const body = this._bodyRef.value;
    if (!body) {
      this.requestUpdate();
      this.updateComplete.then(() => this._renderDocument());
      return;
    }
    const state = this._docState;
    body.innerHTML = '';
    if (!state) return;

    const segment = state.segments[this._currentPage - 1] ?? [];
    // elementIds may already have been assigned by markup-pane; re-use if available
    const elementIds = state.elementIds.size
      ? state.elementIds
      : assignElementIds(segment);
    state.elementIds = elementIds;

    if (segmentHasMarkup(segment)) {
      body.appendChild(
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
      body.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    }
  }

  protected override _clearDocument(): void {
    const body = this._bodyRef.value;
    if (body) body.innerHTML = '';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _findRenderedElement(
    elementId: string,
    peerIds: Set<string>
  ): Element | null {
    const body = this._bodyRef.value;
    if (!body) return null;
    const direct =
      body.querySelector(`.rendered-el-virtual-text[data-element-id="${elementId}"]`) ??
      body.querySelector(`.rendered-el[data-element-id="${elementId}"]`);
    if (direct) return direct;

    const xmlEl = this._docState?.idToElement?.get(elementId);
    const threadId = xmlEl ? elementThreadId(xmlEl) : null;
    if (!threadId) return null;
    const merged = body.querySelector(
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
      this._applyLayerClasses();
      this.requestUpdate();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-furniture', {
          bubbles: true,
          composed: true,
          detail: { checked: true },
        })
      );
    } else if (layer === 'background' && !this._showBackgroundState) {
      this._showBackgroundState = true;
      this._applyLayerClasses();
      this.requestUpdate();
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
    const body = this._bodyRef.value;
    const root = body?.querySelector('.rendered-doc') as HTMLElement | null;
    if (root)
      applyReadingLayerClasses(
        root,
        this._showFurnitureState,
        this._showBackgroundState
      );
  }
}
