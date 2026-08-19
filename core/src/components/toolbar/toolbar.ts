/** <doclang-toolbar> — header toolbar (Views menu, file open, demo, site link) */

import { LitElement, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import styles from './toolbar.css?inline';

const OPEN_FILE_HINT = `Open a DocLang file (.dclx, .dclg)`;

interface PaneToggles {
  file: boolean;
  page: boolean;
  markup: boolean;
  reading: boolean;
  fileAvailable: boolean;
  pageAvailable: boolean;
  hasState: boolean;
}

@customElement('doclang-toolbar')
export class DoclangToolbar extends LitElement {
  static override styles = unsafeCSS(styles);

  private _panelOpen = false;
  private _demoLoading = false;
  private _panes: PaneToggles = {
    file: true,
    page: true,
    markup: true,
    reading: true,
    fileAvailable: false,
    pageAvailable: false,
    hasState: false,
  };
  private _inputArchiveRef: Ref<HTMLInputElement> = createRef();

  override render() {
    const { file, page, markup, reading, fileAvailable, pageAvailable, hasState } =
      this._panes;
    return html`
      <div class="toolbar">
        <div class="toolbar-options-wrap">
          <button
            type="button"
            class="toolbar-options-btn"
            aria-expanded=${this._panelOpen ? 'true' : 'false'}
            aria-haspopup="true"
            @click=${this._onOptionsClick}
          >
            Views
          </button>
          ${
            this._panelOpen
              ? html`
                  <div class="toolbar-options-panel" role="menu">
                    <label
                      class=${classMap({
                        'toolbar-options-item': true,
                        'toolbar-options-item-disabled': !fileAvailable,
                      })}
                    >
                      <input
                        type="checkbox"
                        class="cb-file-pane"
                        role="menuitemcheckbox"
                        .checked=${fileAvailable && file}
                        ?disabled=${!fileAvailable}
                        @change=${(e: Event) =>
                          this._emitTogglePane(
                            'file',
                            (e.target as HTMLInputElement).checked
                          )}
                      />
                      <span>Files</span>
                    </label>
                    <label
                      class=${classMap({
                        'toolbar-options-item': true,
                        'toolbar-options-item-disabled': !pageAvailable,
                      })}
                    >
                      <input
                        type="checkbox"
                        class="cb-page-pane"
                        role="menuitemcheckbox"
                        .checked=${pageAvailable && page}
                        ?disabled=${!pageAvailable}
                        @change=${(e: Event) =>
                          this._emitTogglePane(
                            'page',
                            (e.target as HTMLInputElement).checked
                          )}
                      />
                      <span>Original page</span>
                    </label>
                    <label
                      class=${classMap({
                        'toolbar-options-item': true,
                        'toolbar-options-item-disabled': !hasState,
                      })}
                    >
                      <input
                        type="checkbox"
                        class="cb-markup-pane"
                        role="menuitemcheckbox"
                        .checked=${markup}
                        ?disabled=${!hasState}
                        @change=${(e: Event) =>
                          this._emitTogglePane(
                            'markup',
                            (e.target as HTMLInputElement).checked
                          )}
                      />
                      <span>DocLang</span>
                    </label>
                    <label
                      class=${classMap({
                        'toolbar-options-item': true,
                        'toolbar-options-item-disabled': !hasState,
                      })}
                    >
                      <input
                        type="checkbox"
                        class="cb-reading-pane"
                        role="menuitemcheckbox"
                        .checked=${reading}
                        ?disabled=${!hasState}
                        @change=${(e: Event) =>
                          this._emitTogglePane(
                            'reading',
                            (e.target as HTMLInputElement).checked
                          )}
                      />
                      <span>Reading view</span>
                    </label>
                    <div class="toolbar-options-divider" role="separator"></div>
                    <button
                      type="button"
                      class="toolbar-options-reset"
                      role="menuitem"
                      ?disabled=${!hasState}
                      @click=${() =>
                        this.dispatchEvent(
                          new CustomEvent('doclang-reset-pane-layout', {
                            bubbles: true,
                            composed: true,
                          })
                        )}
                    >
                      Reset views
                    </button>
                  </div>
                `
              : nothing
          }
        </div>
        <span class="header-divider" aria-hidden="true"></span>
        <span class="toolbar-file-group">
          <label
            class="file-btn"
            @mousemove=${this._onFileBtnMousemove}
            @mouseleave=${this._onFileBtnMouseleave}
          >
            Open file
            <input
              ${ref(this._inputArchiveRef)}
              type="file"
              class="input-archive"
              multiple
              accept=".dclx,.zip,.dclg,.xml,application/zip,application/xml,text/xml"
              @change=${this._onArchiveChange}
            />
          </label>
        </span>
        <button
          type="button"
          class="btn-demo"
          ?disabled=${this._demoLoading}
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('doclang-load-demo', { bubbles: true, composed: true })
            )}
        >
          Load demo
        </button>
        <span class="header-divider" aria-hidden="true"></span>
        <a href="https://doclang.ai/" class="header-site-link">doclang.ai</a>
      </div>
    `;
  }

  /** Sync the Views-menu checkboxes and disabled/greyed state from app state. */
  syncPaneToggles(opts: PaneToggles): void {
    this._panes = opts;
    this.requestUpdate();
  }

  setDemoLoading(loading: boolean): void {
    this._demoLoading = loading;
    this.requestUpdate();
  }

  setOptionsOpen(open: boolean): void {
    this._panelOpen = open;
    this.requestUpdate();
  }

  closeOptionsIfOpen(): void {
    if (this._panelOpen) this.setOptionsOpen(false);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
  }

  private _onDocClick = (e: MouseEvent): void => {
    if (!this._panelOpen) return;
    const path = e.composedPath();
    if (path.includes(this as unknown as EventTarget)) return;
    this.setOptionsOpen(false);
  };

  private _onOptionsClick = (e: Event): void => {
    e.stopPropagation();
    this.setOptionsOpen(!this._panelOpen);
  };

  private _emitTogglePane(pane: string, checked: boolean): void {
    this.dispatchEvent(
      new CustomEvent('doclang-toggle-pane', {
        bubbles: true,
        composed: true,
        detail: { pane, checked },
      })
    );
  }

  private _onArchiveChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('doclang-open-files', {
        bubbles: true,
        composed: true,
        detail: { files: [...(input.files ?? [])] },
      })
    );
    input.value = '';
  };

  private _onFileBtnMousemove = (e: MouseEvent): void => {
    this.dispatchEvent(
      new CustomEvent('doclang-hint', {
        bubbles: true,
        composed: true,
        detail: { text: OPEN_FILE_HINT, clientX: e.clientX, clientY: e.clientY },
      })
    );
  };

  private _onFileBtnMouseleave = (): void => {
    this.dispatchEvent(
      new CustomEvent('doclang-hint-hide', { bubbles: true, composed: true })
    );
  };
}
