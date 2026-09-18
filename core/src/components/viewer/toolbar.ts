/** <doclang-toolbar> — header toolbar (Views menu, file open, demo, site link) */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import styles from './toolbar.css?inline';
import '../dropdown/dropdown';
import type { DoclangDropdown } from '../dropdown/dropdown';

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
  private _dropdownRef: Ref<DoclangDropdown> = createRef();

  override render() {
    const { file, page, markup, reading, fileAvailable, pageAvailable, hasState } =
      this._panes;
    return html`
      <div class="toolbar">
        <doclang-dropdown
          ${ref(this._dropdownRef)}
          label="Views"
        >
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
                this._emitTogglePane('file', (e.target as HTMLInputElement).checked)}
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
                this._emitTogglePane('page', (e.target as HTMLInputElement).checked)}
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
                this._emitTogglePane('markup', (e.target as HTMLInputElement).checked)}
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
                this._emitTogglePane('reading', (e.target as HTMLInputElement).checked)}
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
        </doclang-dropdown>
        <span class="header-divider" aria-hidden="true"></span>
        <span class="toolbar-file-group">
          <label
            class="file-btn"
            title="Open a DocLang file (.dclx, .dclg)"
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
}
